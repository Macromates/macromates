import base64
import os
import random
from datetime import datetime, timedelta

from django.conf import settings
from django.core.files.base import ContentFile
from django.utils import timezone
from rest_framework import generics, permissions
from rest_framework import status
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from foodPhoto.models import Photo
from usergoal.models import UserGoal
from usermonth.models import UserMonth
from .models import UserDay
from .serializers import UserDaySerializer


class UserDayListCreateView(generics.ListCreateAPIView):
    queryset = UserDay.objects.all()
    serializer_class = UserDaySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return UserDay.objects.none()
        return UserDay.objects.filter(custom_user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(custom_user=self.request.user)


class RetrieveUpdateDestroyUserDayView(generics.RetrieveUpdateDestroyAPIView):
    queryset = UserDay.objects.all()
    serializer_class = UserDaySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return UserDay.objects.none()
        return UserDay.objects.filter(custom_user=self.request.user)

    def get_object(self):
        day_pk = self.kwargs.get('day_pk')
        if self.request.user.is_staff or self.request.user.is_superuser:
            return UserDay.objects.get(pk=day_pk)
        user_id = self.kwargs.get('pk')
        if int(user_id) != self.request.user.id:
            raise PermissionDenied("You do not have permission to access this day.")
        return UserDay.objects.get(pk=day_pk, custom_user=self.request.user)


class CreateRandomUserDayView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user

        # Get parameters from request
        wednesday_spike = request.data.get('wednesday_spike', False)
        spike_multiplier = float(request.data.get('spike_multiplier', 1.3))

        # Configuration for bulk day creation
        total_days_to_attempt = 70
        skip_probability = 0.25  # 25% chance to skip a day
        max_consecutive_skips = 2  # Maximum consecutive days to skip

        created_days = []
        skipped_days = []
        consecutive_skips = 0
        wednesday_spike_count = 0
        created_photos = []

        # Default meal photo data for Wednesday spikes (5 meals per Wednesday)
        wednesday_meal_data = {
            'protein_g': 48.0,
            'carbs_g': 70.0,
            'fat_g': 80.0,
            'cal_kcal': 1200,
            'meal_score': 4,
            'ai_insight': "[User Goal: improve health] [Objective: I want to eat a mostly keto diet on advice of my doctor] Analysis: The meal consists of fried chicken pieces, fries, and sauce, which are high in carbs and fats, with moderate protein. The fries and sauce increase the carb content significantly, which is not ideal for a keto diet. Recommendation: Focus on increasing protein while reducing the carb intake by removing the fries and sauce. Opt for grilled chicken instead to lower the fat content. Alignment: This meal is low in carb alignment for a keto diet, hence a score of 4."
        }

        # Load the default image for Wednesday meals
        default_image_path = os.path.join(settings.BASE_DIR, 'static', 'default_meal.png')
        default_image_data = None

        # Create a simple placeholder image data (1x1 pixel PNG) if file doesn't exist
        if not os.path.exists(default_image_path):
            # Create a minimal PNG data (1x1 transparent pixel)
            default_image_data = base64.b64decode(
                'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGA2ANECAAAAABJRU5ErkJggg=='
            )
        else:
            with open(default_image_path, 'rb') as f:
                default_image_data = f.read()

        # Start from yesterday and go backwards
        current_date = timezone.now().date() - timedelta(days=1)

        for i in range(total_days_to_attempt * 2):  # Allow for skips by checking more days
            if len(created_days) >= total_days_to_attempt:
                break

            # Decide whether to skip this day
            should_skip = (
                    random.random() < skip_probability and
                    consecutive_skips < max_consecutive_skips
            )

            if should_skip:
                skipped_days.append(current_date.strftime('%Y-%m-%d'))
                consecutive_skips += 1
                current_date -= timedelta(days=1)
                continue
            else:
                consecutive_skips = 0

            # Check if day already exists (avoid duplicates)
            existing_day = UserDay.objects.filter(
                custom_user=user,
                created_at__date=current_date
            ).first()

            if existing_day:
                current_date -= timedelta(days=1)
                continue

            # Create a datetime object for the target date (start of day)
            target_datetime = timezone.make_aware(
                datetime.combine(current_date, datetime.min.time())
            )

            # Check if this is a Wednesday (weekday() returns 2 for Wednesday)
            is_wednesday = current_date.weekday() == 2
            is_spike_day = wednesday_spike and is_wednesday

            # Define base macro ranges (normal days)
            base_carbs_range = (250, 400)
            base_protein_range = (100, 200)
            base_fats_range = (70, 150)
            base_calories_range = (2000, 3000)

            if is_spike_day:
                # Wednesday spike day: Generate totals that are 30% higher than normal
                # Calculate the target spiked ranges
                spike_carbs_range = (
                    int(base_carbs_range[0] * spike_multiplier),
                    int(base_carbs_range[1] * spike_multiplier)
                )
                spike_protein_range = (
                    int(base_protein_range[0] * spike_multiplier),
                    int(base_protein_range[1] * spike_multiplier)
                )
                spike_fats_range = (
                    int(base_fats_range[0] * spike_multiplier),
                    int(base_fats_range[1] * spike_multiplier)
                )
                spike_calories_range = (
                    int(base_calories_range[0] * spike_multiplier),
                    int(base_calories_range[1] * spike_multiplier)
                )

                # Generate random totals within the spiked ranges
                random_carbs = round(random.uniform(*spike_carbs_range), 1)
                random_protein = round(random.uniform(*spike_protein_range), 1)
                random_fats = round(random.uniform(*spike_fats_range), 1)
                random_calories = random.randint(*spike_calories_range)

                wednesday_spike_count += 1
            else:
                # Normal day: Generate totals within normal ranges
                random_carbs = round(random.uniform(*base_carbs_range), 1)
                random_protein = round(random.uniform(*base_protein_range), 1)
                random_fats = round(random.uniform(*base_fats_range), 1)
                random_calories = random.randint(*base_calories_range)

            random_meal_score = round(random.uniform(6.0, 9.5), 1)
            random_vibe_score = random.randint(6, 10)

            # Get or create the appropriate UserMonth for the target date
            month_title = current_date.strftime('%B %Y')
            start_date = current_date.replace(day=1)

            # Calculate end date of the month
            if current_date.month == 12:
                end_date = current_date.replace(year=current_date.year + 1, month=1, day=1) - timedelta(days=1)
            else:
                next_month = current_date.replace(month=current_date.month + 1, day=1)
                end_date = next_month - timedelta(days=1)

            user_month, created = UserMonth.objects.get_or_create(
                custom_user=user,
                title=month_title,
                defaults={
                    'start_date': start_date,
                    'end_date': end_date,
                    'tot_cal_kcal': 0,
                    'tot_protein_g': 0.0,
                    'tot_carbs_g': 0.0,
                    'tot_fat_g': 0.0,
                    'meal_score_avg': 0.0
                }
            )

            # Create the UserDay with the custom date
            ai_insights_text = f"Generated test day with {random_calories} calories. Great balance of macros!"
            if is_spike_day:
                ai_insights_text += f" 📈 Wednesday spike day (+{int((spike_multiplier - 1) * 100)}% macros)!"

            user_day = UserDay(
                custom_user=user,
                user_month=user_month,
                tot_cal_kcal=random_calories,
                tot_protein_g=random_protein,
                tot_carbs_g=random_carbs,
                tot_fat_g=random_fats,
                meal_score_avg=random_meal_score,
                vibe_score=random_vibe_score,
                ai_insights=ai_insights_text,
            )

            # Manually set the created_at field to our target date
            user_day.save()
            user_day.created_at = target_datetime
            user_day.save(update_fields=['created_at'])

            # Create 5 meal photos for Wednesday spike days
            photos_created_for_day = 0
            if is_spike_day and default_image_data:
                for meal_number in range(1, 6):  # Create 5 meals
                    try:
                        # Create the photo with meal data
                        meal_photo = Photo(
                            customuser=user,
                            protein_g=wednesday_meal_data['protein_g'],
                            carbs_g=wednesday_meal_data['carbs_g'],
                            fat_g=wednesday_meal_data['fat_g'],
                            cal_kcal=wednesday_meal_data['cal_kcal'],
                            ai_insight=wednesday_meal_data['ai_insight'],
                            meal_score=wednesday_meal_data['meal_score'],
                            user_day=user_day
                        )

                        # Create image file
                        image_file = ContentFile(
                            default_image_data,
                            name=f'wednesday_meal_{current_date.strftime("%Y%m%d")}_meal{meal_number}.png'
                        )
                        meal_photo.image.save(
                            f'wednesday_meal_{current_date.strftime("%Y%m%d")}_meal{meal_number}.png',
                            image_file,
                            save=False
                        )

                        # Set the created_at to different times throughout the day
                        meal_time = target_datetime + timedelta(
                            hours=8 + (meal_number * 2))  # 8am, 10am, 12pm, 2pm, 4pm
                        meal_photo.save()
                        meal_photo.created_at = meal_time
                        meal_photo.save(update_fields=['created_at'])

                        created_photos.append({
                            'date': current_date.strftime('%Y-%m-%d'),
                            'meal_number': meal_number,
                            'photo_id': meal_photo.id,
                            'macros': wednesday_meal_data
                        })

                        photos_created_for_day += 1

                    except Exception as e:
                        print(f"Failed to create meal {meal_number} photo for {current_date}: {e}")

            # Add to created days list
            created_days.append({
                'date': current_date.strftime('%Y-%m-%d'),
                'calories': random_calories,
                'protein': random_protein,
                'carbs': random_carbs,
                'fats': random_fats,
                'meal_score': random_meal_score,
                'vibe_score': random_vibe_score,
                'is_wednesday_spike': is_spike_day,
                'has_meal_photo': is_spike_day,
                'photos_count': photos_created_for_day if is_spike_day else 0
            })

            # Move to previous day
            current_date -= timedelta(days=1)

        # Recalculate aggregates for all affected UserDays and months
        affected_months = set()
        for day_data in created_days:
            day_date = datetime.strptime(day_data['date'], '%Y-%m-%d').date()
            month_title = day_date.strftime('%B %Y')
            affected_months.add(month_title)

            # Recalculate the specific user day aggregates if it has photos
            if day_data.get('has_meal_photo'):
                user_day = UserDay.objects.filter(
                    custom_user=user,
                    created_at__date=day_date
                ).first()
                if user_day:
                    user_day.recalculate_aggregates()

        for month_title in affected_months:
            try:
                user_month = UserMonth.objects.get(custom_user=user, title=month_title)
                user_month.recalculate_aggregates()
            except UserMonth.DoesNotExist:
                pass

        # Calculate statistics
        total_created = len(created_days)
        total_skipped = len(skipped_days)
        total_photos = len(created_photos)
        date_range = f"{created_days[-1]['date']} to {created_days[0]['date']}" if created_days else "None"

        return Response({
            'message': f'Successfully created {total_created} random days with {total_skipped} days skipped' +
                       (
                           f' (including {wednesday_spike_count} Wednesday spikes with {total_photos} meal photos)' if wednesday_spike else ''),
            'statistics': {
                'total_created': total_created,
                'total_skipped': total_skipped,
                'date_range': date_range,
                'affected_months': list(affected_months),
                'wednesday_days': wednesday_spike_count if wednesday_spike else 0,
                'photos_created': total_photos
            },
            'created_days': created_days[:10],  # Return first 10 for display
            'created_photos': created_photos,  # Return photo info
            'skipped_dates': skipped_days[:20]  # Return first 20 skipped dates
        }, status=status.HTTP_201_CREATED)


class MonthlyTrackingDataView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, year, month):
        """
        Get daily tracking data for a specific month with adjacent days to complete weeks.
        Includes previous month days and next month days if needed to show complete weeks.
        Also includes active user goal data for daily targets.
        """
        try:
            user = request.user
            target_date = datetime(int(year), int(month), 1)

            # Get first and last day of the month
            first_day = target_date.date()
            last_day = (first_day.replace(month=first_day.month % 12 + 1, day=1) - timedelta(
                days=1)) if first_day.month != 12 else first_day.replace(year=first_day.year + 1, month=1,
                                                                         day=1) - timedelta(days=1)

            # Find the Monday of the week containing the first day
            days_to_monday = first_day.weekday()  # 0 = Monday, 6 = Sunday
            week_start = first_day - timedelta(days=days_to_monday)

            # Find the Sunday of the week containing the last day
            days_to_sunday = 6 - last_day.weekday()  # 6 = Sunday
            week_end = last_day + timedelta(days=days_to_sunday)

            # Fetch all UserDays for the user in this extended range
            user_days = UserDay.objects.filter(
                custom_user=user,
                created_at__date__gte=week_start,
                created_at__date__lte=week_end
            ).order_by('created_at')

            # Create a dictionary for quick lookup
            days_dict = {day.created_at.date(): day for day in user_days}

            # Generate the complete week structure
            weeks = []
            current_date = week_start

            while current_date <= week_end:
                # Start a new week (Monday)
                if current_date.weekday() == 0 or current_date == week_start:
                    week = []
                    weeks.append(week)

                # Get day data or create empty day
                day_data = None
                if current_date in days_dict:
                    day = days_dict[current_date]
                    day_data = {
                        'date': current_date.isoformat(),
                        'day_of_month': current_date.day,
                        'is_current_month': first_day <= current_date <= last_day,
                        'calories': day.tot_cal_kcal,
                        'protein': float(day.tot_protein_g),
                        'carbs': float(day.tot_carbs_g),
                        'fat': float(day.tot_fat_g),
                        'meal_score': float(day.meal_score_avg),
                        'has_data': True
                    }
                else:
                    day_data = {
                        'date': current_date.isoformat(),
                        'day_of_month': current_date.day,
                        'is_current_month': first_day <= current_date <= last_day,
                        'calories': None,  # Changed to None to indicate no data
                        'protein': None,
                        'carbs': None,
                        'fat': None,
                        'meal_score': None,
                        'has_data': False
                    }

                week.append(day_data)
                current_date += timedelta(days=1)

            # Get active user goal for daily targets
            active_goal = UserGoal.objects.filter(
                custom_user=user,
                active=True
            ).first()

            goal_data = None
            if active_goal:
                goal_data = {
                    'daily_calories': active_goal.daily_cal_kcal,
                    'daily_protein': float(active_goal.daily_protein_g),
                    'daily_carbs': float(active_goal.daily_carbs_g),
                    'daily_fat': float(active_goal.daily_fat_g),
                    'goal_type': active_goal.get_goal_type_display()
                }

            # Get month info
            month_info = {
                'year': int(year),
                'month': int(month),
                'month_name': target_date.strftime('%B'),
                'month_year': target_date.strftime('%B %Y')
            }

            # Check if previous/next months have data
            prev_month = first_day - timedelta(days=1)
            next_month = last_day + timedelta(days=1)

            has_prev_month = UserDay.objects.filter(
                custom_user=user,
                created_at__date__gte=prev_month.replace(day=1),
                created_at__date__lte=prev_month
            ).exists()

            has_next_month = UserDay.objects.filter(
                custom_user=user,
                created_at__date__gte=next_month,
                created_at__date__lte=(next_month.replace(month=next_month.month % 12 + 1, day=1) - timedelta(
                    days=1)) if next_month.month != 12 else next_month.replace(year=next_month.year + 1, month=1,
                                                                               day=1) - timedelta(days=1)
            ).exists()

            return Response({
                'month_info': month_info,
                'weeks': weeks,
                'goal_data': goal_data,
                'has_prev_month': has_prev_month,
                'has_next_month': has_next_month
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'error': 'Failed to fetch tracking data',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DayDetailsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, date_str):
        """
        Get detailed information for a specific day including UserDay data and food photos.
        Expected date format: YYYY-MM-DD
        """
        try:
            user = request.user

            # Parse the date string
            target_date = datetime.strptime(date_str, '%Y-%m-%d').date()

            # Get UserDay for this date
            user_day = UserDay.objects.filter(
                custom_user=user,
                created_at__date=target_date
            ).first()

            # Get all food photos for this date
            photos = Photo.objects.filter(
                customuser=user,
                created_at__date=target_date
            ).order_by('created_at')

            # Serialize photos
            photos_data = []
            for photo in photos:
                photos_data.append({
                    'id': photo.id,
                    'image': photo.image.url if photo.image else None,
                    'protein_g': float(photo.protein_g) if photo.protein_g else 0,
                    'carbs_g': float(photo.carbs_g) if photo.carbs_g else 0,
                    'fat_g': float(photo.fat_g) if photo.fat_g else 0,
                    'cal_kcal': photo.cal_kcal or 0,
                    'ai_insight': photo.ai_insight,
                    'meal_score': float(photo.meal_score) if photo.meal_score else 0,
                    'created_at': photo.created_at.isoformat()
                })

            # Get active goal for targets
            active_goal = UserGoal.objects.filter(
                custom_user=user,
                active=True
            ).first()

            goal_data = None
            if active_goal:
                goal_data = {
                    'daily_calories': active_goal.daily_cal_kcal,
                    'daily_protein': float(active_goal.daily_protein_g),
                    'daily_carbs': float(active_goal.daily_carbs_g),
                    'daily_fat': float(active_goal.daily_fat_g),
                    'goal_type': active_goal.get_goal_type_display()
                }

            # Prepare day data
            day_data = None
            if user_day:
                day_data = {
                    'id': user_day.id,
                    'date': target_date.isoformat(),
                    'tot_cal_kcal': user_day.tot_cal_kcal,
                    'tot_protein_g': float(user_day.tot_protein_g),
                    'tot_carbs_g': float(user_day.tot_carbs_g),
                    'tot_fat_g': float(user_day.tot_fat_g),
                    'meal_score_avg': float(user_day.meal_score_avg),
                    'vibe_score': user_day.vibe_score,
                    'ai_insights': user_day.ai_insights
                }

            return Response({
                'day_data': day_data,
                'photos': photos_data,
                'goal_data': goal_data,
                'date': target_date.isoformat()
            }, status=status.HTTP_200_OK)

        except ValueError:
            return Response({
                'error': 'Invalid date format. Expected YYYY-MM-DD'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'error': 'Failed to fetch day details',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
