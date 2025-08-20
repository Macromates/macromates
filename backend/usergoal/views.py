# Only one user goal can be created per user and goal type. If a user goal expires or is met, a new one can be created.
# The new goal will replace the old one. No need to update/edit a user goal, just create a new one.
# Delete a user goal by setting it to inactive and completed.

from django.utils import timezone
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status, generics, permissions
from rest_framework.exceptions import PermissionDenied, NotFound
from rest_framework.generics import RetrieveUpdateDestroyAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .ai_utils import validate_goal_with_ai
from .models import UserGoal
from .serializers import (
    UserGoalSerializer, UserGoalScoreUpdateSerializer,
    AIValidationRequestSerializer, AIValidationResponseSerializer,
    CreatePartialGoalSerializer, SubmitGoalRequestSerializer,
    SubmitGoalResponseSerializer, ErrorResponseSerializer
)


class UserGoalMeListCreateView(generics.ListCreateAPIView):
    serializer_class = UserGoalSerializer
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_description="Get list of current user's goals or create a new complete goal",
        responses={200: UserGoalSerializer(many=True)},
        tags=['Goal Management']
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_description="Create a complete goal (alternative to partial goal creation workflow)",
        request_body=UserGoalSerializer,
        responses={201: UserGoalSerializer},
        tags=['Goal Management']
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return UserGoal.objects.none()
        return UserGoal.objects.filter(custom_user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(custom_user=self.request.user)


class UserGoalMeDetailView(RetrieveUpdateDestroyAPIView):
    queryset = UserGoal.objects.all()
    serializer_class = UserGoalSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return UserGoal.objects.none()
        # For /users/me/goals/<id>/, only allow access to own goals
        return UserGoal.objects.filter(custom_user=self.request.user)

    def get_object(self):
        # retrieve the get_object method to ensure the user can only access their own goals
        obj = super().get_object()
        if obj.custom_user != self.request.user:
            raise PermissionDenied("You do not have permission to access this goal.")
        return obj


class UserGoalCompleteOrExpireView(generics.GenericAPIView):
    serializer_class = UserGoalSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request):
        goal_id = request.data.get('id')
        try:
            user_goal = UserGoal.objects.get(pk=goal_id, custom_user=request.user)
        except UserGoal.DoesNotExist:
            raise NotFound("User goal not found.")

        user_goal.perc_achieved = self.get_serializer().update_perc_achieved(user_goal)

        # Check for completion or expiration
        if (
                (user_goal.end_date and user_goal.end_date < timezone.now()) or user_goal.perc_achieved >= 100 or (
                user_goal.target_weight is not None and user_goal.custom_user.weight == user_goal.target_weight)
        ):
            user_goal.completed = True
            user_goal.active = False
            user_goal.save()
            return Response({"message": "Goal marked as completed or expired."}, status=status.HTTP_200_OK)
        else:
            return Response({"message": "Goal is still active and not completed."}, status=status.HTTP_400_BAD_REQUEST)


class UserGoalUserListView(generics.ListAPIView):
    serializer_class = UserGoalSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return UserGoal.objects.none()
        user_id = self.kwargs.get('pk')
        return UserGoal.objects.filter(custom_user__id=user_id)


class UserGoalDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = UserGoal.objects.all()
    serializer_class = UserGoalSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        # Handle swagger schema generation
        if getattr(self, 'swagger_fake_view', False):
            return None

        goal_pk = self.kwargs.get('goal_pk')
        if self.request.user.is_staff or self.request.user.is_superuser:
            return UserGoal.objects.get(pk=goal_pk)
        user_id = self.kwargs.get('pk')
        return UserGoal.objects.get(pk=goal_pk, custom_user__id=user_id)


class AIGoalValidationView(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_description="""
        Validate a fitness goal using personalized AI analysis and get macro recommendations.

        **Automatic Biometric Integration:**
        The AI automatically considers your personal data:
        - Age, weight, height, gender, activity level
        - Current avg_meal_score from your profile

        **What the AI does:**
        1. Extracts timeframe from your objective text
        2. Analyzes goal feasibility based on YOUR specific profile
        3. Provides personalized feedback and suggestions
        4. Calculates target end date
        5. **NEW**: Calculates personalized daily macro recommendations (calories, protein, carbs, fat)
        6. **NEW**: Provides macro percentages optimized for your specific goal

        **Macro Calculations:**
        - Calculates your TDEE (Total Daily Energy Expenditure) based on biometrics
        - Adjusts calories for your goal (deficit for weight loss, surplus for muscle building)
        - Optimizes protein, carbs, and fat ratios for your specific objective
        - Returns both absolute amounts (grams) and percentages

        **Example Response:** "Given your age (25), weight (70kg), and 'Every day' activity level, building 3kg muscle in 4 months is realistic. Recommended daily intake: 2400 kcal, 168g protein (28%), 120g carbs (50%), 59g fat (22%)"
        """,
        request_body=AIValidationRequestSerializer,
        responses={
            200: AIValidationResponseSerializer,
            400: ErrorResponseSerializer,
        },
        tags=['Goal Management']
    )
    def post(self, request):
        user = request.user
        # Get user biometrics from CustomUser model
        user_biometrics = {
            "age": user.age,
            "weight": user.weight,
            "height": user.height,
            "gender": user.get_gender_display() if user.gender else None,
            "activity_level": user.activity_level,
        }
        goal_type = request.data.get("goal_type")
        user_objective = request.data.get("user_objective")

        if not all([goal_type, user_objective]):
            return Response({"error": "Missing required fields: goal_type and user_objective are required."},
                            status=400)

        # AI will extract timeframe from user_objective automatically
        ai_feedback = validate_goal_with_ai(user_biometrics, goal_type, user_objective)
        return Response(ai_feedback)


class CreatePartialGoalView(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_description="""
        Create a partial goal with just the goal type. This is the first step in the goal creation process.
        
        **Important:** If the user already has an active goal of the same type, it will be automatically deactivated 
        and marked as completed to allow the new goal to be created.
        """,
        request_body=CreatePartialGoalSerializer,
        responses={
            201: UserGoalSerializer,
            400: ErrorResponseSerializer,
        },
        tags=['Goal Management']
    )
    def post(self, request):
        user = request.user
        goal_type = request.data.get('goal_type')

        if not goal_type:
            return Response({"error": "goal_type is required."}, status=400)

        # Check if user already has this goal type - if so, deactivate the old one
        existing_goals = UserGoal.objects.filter(custom_user=user, goal_type=goal_type, active=True)
        if existing_goals.exists():
            # Deactivate existing goals of the same type
            existing_goals.update(active=False, completed=True)
            print(f"Deactivated {existing_goals.count()} existing goals of type {goal_type} for user {user.id}")

        # Create partial goal with just goal_type
        data = {
            'custom_user': user.id,
            'goal_type': goal_type,
        }

        serializer = UserGoalSerializer(data=data)
        if serializer.is_valid():
            serializer.save(custom_user=user)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


class SubmitGoalView(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_description="""
        Submit the final goal with user objective. The system will automatically:
        1. Extract timeframe and calculate end date using AI
        2. **NEW**: Save personalized macro recommendations (calories, protein, carbs, fat) to the goal
        3. **NEW**: Store macro percentages for optimal nutrition tracking
        
        **What gets saved:**
        - daily_cal_kcal: Recommended daily calories
        - daily_protein_g: Daily protein target in grams
        - daily_fat_g: Daily fat target in grams  
        - daily_carbs_g: Daily carbs target in grams
        - protein_perc: Protein percentage of total calories
        - carbs_perc: Carbs percentage of total calories
        - fat_perc: Fat percentage of total calories
        """,
        request_body=SubmitGoalRequestSerializer,
        responses={
            200: SubmitGoalResponseSerializer,
            400: ErrorResponseSerializer,
            404: ErrorResponseSerializer,
        },
        tags=['Goal Management'],
        manual_parameters=[
            openapi.Parameter(
                'goal_id',
                openapi.IN_PATH,
                description="ID of the partial goal to update",
                type=openapi.TYPE_INTEGER,
                required=True
            )
        ]
    )
    def patch(self, request, goal_id):
        try:
            user_goal = UserGoal.objects.get(id=goal_id, custom_user=request.user)
        except UserGoal.DoesNotExist:
            return Response({"error": "Goal not found or you don't have permission to modify it."}, status=404)

        user_objective = request.data.get("user_objective")
        if not user_objective:
            return Response({"error": "user_objective is required."}, status=400)

        # Get AI validation to extract timeframe and calculate end_date
        user_biometrics = {
            "age": request.user.age,
            "weight": request.user.weight,
            "height": request.user.height,
            "gender": request.user.get_gender_display() if request.user.gender else None,
            "activity_level": request.user.activity_level,
        }

        ai_result = validate_goal_with_ai(user_biometrics, user_goal.goal_type, user_objective)

        # Prepare data for update
        update_data = request.data.copy()

        # Automatically set end_date from AI calculation if available
        if ai_result.get('calculated_end_date'):
            update_data['end_date'] = ai_result['calculated_end_date']

        # Save macro recommendations from AI into the UserGoal model
        macro_fields = [
            'daily_cal_kcal', 'daily_protein_g', 'daily_fat_g', 'daily_carbs_g',
            'carbs_perc', 'protein_perc', 'fat_perc'
        ]

        for field in macro_fields:
            if ai_result.get(field) is not None:
                update_data[field] = ai_result[field]

        # Update the partial goal with user_objective and calculated end_date
        serializer = UserGoalSerializer(user_goal, data=update_data, partial=True)
        if serializer.is_valid():
            serializer.save()

            # Include AI feedback in response for user reference
            response_data = serializer.data
            response_data['ai_validation'] = {
                'extracted_timeframe': ai_result.get('extracted_timeframe'),
                'is_reasonable': ai_result.get('is_reasonable'),
                'feedback': ai_result.get('feedback'),
                'daily_cal_kcal': ai_result.get('daily_cal_kcal'),
                'daily_protein_g': ai_result.get('daily_protein_g'),
                'daily_fat_g': ai_result.get('daily_fat_g'),
                'daily_carbs_g': ai_result.get('daily_carbs_g'),
                'protein_perc': ai_result.get('protein_perc'),
                'carbs_perc': ai_result.get('carbs_perc'),
                'fat_perc': ai_result.get('fat_perc')
            }

            return Response(response_data, status=200)
        return Response(serializer.errors, status=400)


class UpdateGoalScoresView(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_description="Update starting_score and target_score for an existing goal.",
        request_body=UserGoalScoreUpdateSerializer,
        responses={
            200: UserGoalScoreUpdateSerializer,
            400: ErrorResponseSerializer,
            404: ErrorResponseSerializer,
        },
        tags=['Goal Management'],
        manual_parameters=[
            openapi.Parameter(
                'goal_id',
                openapi.IN_PATH,
                description="ID of the goal to update scores for",
                type=openapi.TYPE_INTEGER,
                required=True
            )
        ]
    )
    def patch(self, request, goal_id):
        try:
            user_goal = UserGoal.objects.get(id=goal_id, custom_user=request.user)
        except UserGoal.DoesNotExist:
            return Response({"error": "Goal not found or you don't have permission to modify it."}, status=404)

        serializer = UserGoalScoreUpdateSerializer(user_goal, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=200)
        return Response(serializer.errors, status=400)


class DeleteGoalView(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_description="""
        Delete a user's goal permanently.

        **Security:** Users can only delete their own goals.

        **What happens:**
        - Goal is permanently removed from the database
        - All associated data is deleted
        - Action cannot be undone

        **Alternative:** Consider using the complete/expire endpoint to mark goals as finished instead of deleting them for historical tracking.
        """,
        responses={
            204: openapi.Response(description="Goal successfully deleted"),
            404: ErrorResponseSerializer,
        },
        tags=['Goal Management'],
        manual_parameters=[
            openapi.Parameter(
                'goal_id',
                openapi.IN_PATH,
                description="ID of the goal to delete",
                type=openapi.TYPE_INTEGER,
                required=True
            )
        ]
    )
    def delete(self, request, goal_id):
        try:
            user_goal = UserGoal.objects.get(id=goal_id, custom_user=request.user)
        except UserGoal.DoesNotExist:
            return Response({"error": "Goal not found or you don't have permission to delete it."}, status=404)

        user_goal.delete()
        return Response(status=204)
