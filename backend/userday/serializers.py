from datetime import date, timedelta

from django.utils import timezone
from rest_framework import serializers

from usermonth.models import UserMonth
from .models import UserDay


class UserDaySerializer(serializers.ModelSerializer):
    class Meta:
        model = UserDay
        fields = [
            'id', 'user_month', 'custom_user', 'tot_cal_kcal', 'tot_protein_g', 'tot_carbs_g', 'tot_fat_g',
            'meal_score_avg', 'vibe_score', 'ai_insights', 'journal_entry', 'created_at', 'updated_at'
        ]
        read_only_fields = ['custom_user', 'user_month']  # These are set automatically

    def create(self, validated_data):
        custom_user = validated_data.get('custom_user')

        if not custom_user:
            raise serializers.ValidationError("Custom user is required to create a UserDay.")

        # Get or create the appropriate UserMonth
        day_date = timezone.now()  # Use current time for new day
        month_title = day_date.strftime('%B %Y')
        start_date = date(day_date.year, day_date.month, 1)

        # Calculate end date based on the month
        if day_date.month == 12:
            end_date = date(day_date.year + 1, 1, 1) - timedelta(days=1)
        else:
            end_date = date(day_date.year, day_date.month + 1, 1) - timedelta(days=1)

        # Get or create the UserMonth for this day
        user_month, created = UserMonth.objects.get_or_create(
            custom_user=custom_user,
            title=month_title,
            defaults={
                'start_date': start_date,
                'end_date': end_date,
                'tot_cal_kcal': 0,  # Will be recalculated
                'tot_protein_g': 0.0,
                'tot_carbs_g': 0.0,
                'tot_fat_g': 0.0,
                'meal_score_avg': 0.0
            }
        )

        # Set the user_month in validated_data
        validated_data['user_month'] = user_month

        # Create the UserDay with the month relationship
        user_day = UserDay.objects.create(**validated_data)

        # Recalculate month aggregates after adding the new day
        user_month.recalculate_aggregates()

        return user_day

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Recalculate month aggregates after updating the day
        if instance.user_month:
            instance.user_month.recalculate_aggregates()

        return instance
