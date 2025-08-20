from rest_framework import serializers

from .models import UserMonth


class UserMonthSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserMonth
        fields = [
            'id', 'custom_user', 'title', 'tot_cal_kcal',
            'tot_protein_g', 'tot_carbs_g', 'tot_fat_g', 'meal_score_avg', 'start_date', 'end_date',
            'created_at', 'updated_at'
        ]
