from rest_framework import serializers

from .models import CustomUser


class CustomUserSerializer(serializers.ModelSerializer):
    avatar = serializers.ImageField(use_url=True, required=False)

    class Meta:
        model = CustomUser
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'about_me', 'age', 'weight', 'height', 'gender', 'hand_length',
            'activity_level', 'avatar', 'date_joined', 'updated_at', 'is_active',
            'is_staff', 'avg_meal_score'
        ]
        read_only_fields = ['id', 'date_joined', 'updated_at', 'is_active', 'is_staff']
        extra_kwargs = {
            'avatar': {'required': False, 'read_only': False},
        }


class BasicUserSerializer(serializers.ModelSerializer):
    avatar = serializers.ImageField(use_url=True, required=False)

    class Meta:
        model = CustomUser
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name', 'avatar'
        ]
        read_only_fields = fields
