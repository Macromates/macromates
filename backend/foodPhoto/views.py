import json
import logging

from django.core.files.storage import default_storage
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Photo
from .utils import analyze_food_image, GOAL_TYPE_MAP, get_or_create_user_day, create_food_items_from_analysis

logger = logging.getLogger(__name__)


class AnalyzeFoodView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        # Add more detailed authentication logging
        logger.info("=== Request Details ===")
        logger.info(f"Content-Type: {request.content_type}")
        logger.info(f"FILES keys: {list(request.FILES.keys())}")
        logger.info(f"User authenticated: {request.user.is_authenticated}")
        logger.info(f"User ID: {request.user.id if request.user.is_authenticated else None}")
        logger.info(f"Authorization header: {request.headers.get('Authorization', 'Not found')}")
        logger.info(f"Has goals attr: {hasattr(request.user, 'goals') if request.user.is_authenticated else False}")

        logger.info("Food analysis request started")
        image_file = request.FILES.get("image")
        if not image_file:
            logger.warning("No image provided in request")
            return Response({"error": "No image provided"}, status=status.HTTP_400_BAD_REQUEST)

        # For analysis, we still need a temp file
        temp_path = default_storage.save(f"temp_meals/{image_file.name}", image_file)

        # Fetch active goal only if authenticated
        user_goal = None
        user_profile = None
        if request.user.is_authenticated:
            user_profile = request.user
            if hasattr(request.user, "goals"):
                logger.info("User has goals attribute")
                user_goal = request.user.goals.filter(active=True).first()
                if user_goal:
                    logger.info(f"Found active goal - ID: {user_goal.id}, Type: {user_goal.goal_type}")
                else:
                    logger.info("No active goal found")
            else:
                logger.info("User does not have goals attribute")

            logger.info(
                f"Found user goal: {user_goal}, Type: {getattr(user_goal, 'goal_type', None)}, Objective: {getattr(user_goal, 'user_objective', None)}")
            logger.debug(
                f"User profile: age={getattr(user_profile, 'age', None)}, weight={getattr(user_profile, 'weight', None)}, height={getattr(user_profile, 'height', None)}, gender={getattr(user_profile, 'gender', None)}, activity_level={getattr(user_profile, 'activity_level', None)}")

        try:
            analysis = analyze_food_image(
                temp_path,
                user_goal=user_goal,
                user_profile=user_profile
            )
            if "error" in analysis:
                return Response(analysis, status=status.HTTP_400_BAD_REQUEST)

            # For authenticated users, include goal-based analysis and save photo
            if request.user.is_authenticated:
                from django.utils import timezone

                # Get or create UserDay for today (which will also create UserMonth if needed)
                user_day = get_or_create_user_day(request.user, timezone.now())

                # Save the image properly using the Photo model's ImageField
                # Reset the file pointer to the beginning
                image_file.seek(0)

                photo = Photo.objects.create(
                    customuser=request.user,
                    image=image_file,  # Let Django handle the proper storage path
                    protein_g=analysis["protein_g"],
                    carbs_g=analysis["carbs_g"],
                    fat_g=analysis["fat_g"],
                    cal_kcal=analysis["cal_kcal"],
                    ai_insight=analysis["ai_insight"],
                    meal_score=analysis.get("meal_score", 5),
                    user_day=user_day,  # Link to the UserDay
                )

                # Create FoodItem objects from the analysis
                created_food_items = create_food_items_from_analysis(photo, analysis)
                logger.info(f"Created {len(created_food_items)} food items for photo {photo.id}")

                # Recalculate day aggregates (which will also update month aggregates)
                user_day.recalculate_aggregates()

                analysis["id"] = photo.id
                analysis["user_day_id"] = user_day.id
                analysis["hasUserGoal"] = user_goal is not None

                # Add the image URL to the response
                analysis["image_url"] = request.build_absolute_uri(photo.image.url)

                # Add food items data to response
                analysis["created_food_items_count"] = len(created_food_items)
                analysis["food_items_created"] = [
                    {
                        "id": item.id,
                        "name": item.name,
                        "protein_g": item.protein_g,
                        "carbs_g": item.carbs_g,
                        "fat_g": item.fat_g,
                        "cal_kcal": item.cal_kcal,
                        "nutrients": item.nutrients
                    }
                    for item in created_food_items
                ]

                # Include user profile information in the response
                if user_profile:
                    analysis["userProfile"] = {
                        "age": getattr(user_profile, 'age', None),
                        "weight": getattr(user_profile, 'weight', None),
                        "height": getattr(user_profile, 'height', None),
                        "gender": getattr(user_profile, 'gender', None),
                        "activity_level": getattr(user_profile, 'activity_level', None)
                    }
                    logger.info(f"Including user profile in response: {json.dumps(analysis['userProfile'])}")

                if user_goal:
                    analysis["goalType"] = GOAL_TYPE_MAP.get(user_goal.goal_type)
                    analysis["userGoal"] = {
                        "type": GOAL_TYPE_MAP.get(user_goal.goal_type),
                        "objective": user_goal.user_objective
                    }
                    logger.info(f"Returning userGoal in API response: {analysis['userGoal']}")
                else:
                    logger.info("No active user goal found; not including userGoal in response.")
            else:
                # For unauthenticated users, remove goal-specific fields and don't create food items
                analysis.pop("meal_score", None)
                analysis["ai_insight"] = "Sign in to get personalized insights!"

                # Keep food_items data for unauthenticated users to see what would be detected
                analysis["created_food_items_count"] = 0
                analysis["food_items_created"] = []
                # food_items from AI analysis are still included in the response

                # For unauthenticated users, we could save the temp image and return its URL
                # but we'll skip this for now to keep it simple
                analysis["image_url"] = None

            logger.info(f"Final API response: {json.dumps(analysis, default=str)[:500]}")
            return Response(analysis, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Unhandled analysis error: {e}", exc_info=True)
            return Response({"error": "Failed to analyze food photo"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        finally:
            # Clean up the temp file (we've saved the image properly in the Photo model)
            try:
                default_storage.delete(temp_path)
            except Exception as cleanup_err:
                logger.warning(f"Temp file cleanup failed: {cleanup_err}")


class DeletePhotoView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, photo_id):
        try:
            # Get the photo object and verify it belongs to the user
            photo = Photo.objects.get(id=photo_id, customuser=request.user)

            # Store the user_day for recalculation
            user_day = photo.user_day

            # Delete the photo (this will also delete the image file and related FoodItems due to CASCADE)
            photo.delete()

            # Recalculate day aggregates after photo deletion
            if user_day:
                user_day.recalculate_aggregates()

            logger.info(f"Photo {photo_id} deleted successfully by user {request.user.id}")
            return Response({"message": "Photo deleted successfully"}, status=status.HTTP_200_OK)

        except Photo.DoesNotExist:
            logger.warning(f"Photo {photo_id} not found or doesn't belong to user {request.user.id}")
            return Response({"error": "Photo not found"}, status=status.HTTP_404_NOT_FOUND)

        except Exception as e:
            logger.error(f"Error deleting photo {photo_id}: {e}", exc_info=True)
            return Response({"error": "Failed to delete photo"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PhotoFoodItemsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, photo_id):
        """Get all food items for a specific photo"""
        try:
            # Get the photo object and verify it belongs to the user
            photo = Photo.objects.get(id=photo_id, customuser=request.user)

            # Get all food items for this photo
            food_items = photo.food_items.all()

            # Serialize food items data
            food_items_data = [
                {
                    "id": item.id,
                    "name": item.name,
                    "protein_g": item.protein_g,
                    "carbs_g": item.carbs_g,
                    "fat_g": item.fat_g,
                    "cal_kcal": item.cal_kcal,
                    "nutrients": item.nutrients
                }
                for item in food_items
            ]

            # Also include photo details
            response_data = {
                "photo": {
                    "id": photo.id,
                    "image_url": request.build_absolute_uri(photo.image.url),
                    "created_at": photo.created_at,
                    "protein_g": photo.protein_g,
                    "carbs_g": photo.carbs_g,
                    "fat_g": photo.fat_g,
                    "cal_kcal": photo.cal_kcal,
                    "meal_score": photo.meal_score,
                    "ai_insight": photo.ai_insight
                },
                "food_items": food_items_data,
                "food_items_count": len(food_items_data)
            }

            logger.info(f"Retrieved {len(food_items_data)} food items for photo {photo_id}")
            return Response(response_data, status=status.HTTP_200_OK)

        except Photo.DoesNotExist:
            logger.warning(f"Photo {photo_id} not found or doesn't belong to user {request.user.id}")
            return Response({"error": "Photo not found"}, status=status.HTTP_404_NOT_FOUND)

        except Exception as e:
            logger.error(f"Error retrieving food items for photo {photo_id}: {e}", exc_info=True)
            return Response({"error": "Failed to retrieve food items"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
