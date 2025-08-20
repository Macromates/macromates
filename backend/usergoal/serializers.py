from rest_framework import serializers

from .models import UserGoal


class UserGoalSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserGoal
        fields = [
            'id', 'custom_user', 'goal_type', 'target_weight', 'target_score',
            'starting_weight', 'starting_score', 'user_objective', 'perc_achieved',
            'active', 'completed', 'start_date', 'end_date', 'created_at', 'updated_at',
            'daily_cal_kcal', 'daily_protein_g', 'daily_fat_g', 'daily_carbs_g',
            'carbs_perc', 'protein_perc', 'fat_perc'
        ]

    def update_perc_achieved(self, user_goal):
        # Get current weight from the related user
        current_weight = user_goal.custom_user.weight
        starting_weight = user_goal.starting_weight
        target_weight = user_goal.target_weight
        if starting_weight is None or target_weight is None or current_weight is None:
            return 0.0
        if starting_weight == target_weight:
            return 100.0
        perc_achieved = (abs(current_weight - starting_weight) / abs(target_weight - starting_weight)) * 100
        return max(0, min(perc_achieved, 100))

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        # Update perc_achieved after updating weights
        instance.perc_achieved = self.update_perc_achieved(instance)
        instance.save()
        return instance

    def create(self, validated_data):
        custom_user = validated_data.get('custom_user')
        if not custom_user:
            raise serializers.ValidationError("Custom user is required to create a goal.")
        # Check if user already has an active goal of this type - if so, deactivate it
        existing_goals = UserGoal.objects.filter(custom_user=custom_user, goal_type=validated_data['goal_type'],
                                                 active=True)
        if existing_goals.exists():
            # Deactivate existing goals of the same type
            existing_goals.update(active=False, completed=True)

        # Set starting_weight to current user weight if not provided
        if not validated_data.get('starting_weight'):
            validated_data['starting_weight'] = custom_user.weight

        # Set starting_score to current user avg_meal_score if not provided
        if not validated_data.get('starting_score'):
            validated_data['starting_score'] = custom_user.avg_meal_score

        user_goal = UserGoal.objects.create(**validated_data)
        user_goal.perc_achieved = self.update_perc_achieved(user_goal)
        user_goal.save()
        return user_goal


class UserGoalScoreUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating starting_score and target_score only"""

    class Meta:
        model = UserGoal
        fields = ['starting_score', 'target_score']

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


# Dedicated serializers for API documentation
class AIValidationRequestSerializer(serializers.Serializer):
    goal_type = serializers.IntegerField(
        help_text="Goal type: 1=Lose Weight, 2=Build Muscle, 3=Improve Health, 4=Other",
        min_value=1, max_value=4
    )
    user_objective = serializers.CharField(
        help_text="User's fitness goal description with timeframe",
        max_length=500,
        style={'placeholder': 'I want to lose 5kg in 3 months'}
    )

    class Meta:
        examples = {
            'application/json': {
                'goal_type': 1,
                'user_objective': 'I want to lose 5kg in 3 months'
            }
        }


class AIValidationResponseSerializer(serializers.Serializer):
    is_reasonable = serializers.BooleanField(help_text="Whether the goal is realistic and safe for this specific user")
    feedback = serializers.CharField(
        help_text="Personalized AI feedback referencing user's age, weight, height, gender, and activity level")
    suggestion = serializers.CharField(
        help_text="Personalized alternative suggestion considering user's specific biometric profile")
    extracted_timeframe = serializers.CharField(help_text="Timeframe extracted from user's objective text")
    timeframe_days = serializers.IntegerField(help_text="Number of days for the goal", allow_null=True)
    calculated_end_date = serializers.DateField(help_text="Calculated end date based on extracted timeframe",
                                                allow_null=True)
    daily_cal_kcal = serializers.IntegerField(help_text="Recommended daily calories in kcal", allow_null=True)
    daily_protein_g = serializers.FloatField(help_text="Recommended daily protein in grams", allow_null=True)
    daily_fat_g = serializers.FloatField(help_text="Recommended daily fat in grams", allow_null=True)
    daily_carbs_g = serializers.FloatField(help_text="Recommended daily carbs in grams", allow_null=True)
    protein_perc = serializers.FloatField(help_text="Protein percentage of total calories (0.0-1.0)", allow_null=True)
    carbs_perc = serializers.FloatField(help_text="Carbs percentage of total calories (0.0-1.0)", allow_null=True)
    fat_perc = serializers.FloatField(help_text="Fat percentage of total calories (0.0-1.0)", allow_null=True)


class CreatePartialGoalSerializer(serializers.Serializer):
    goal_type = serializers.IntegerField(
        help_text="Goal type: 1=Lose Weight, 2=Build Muscle, 3=Improve Health, 4=Other",
        min_value=1, max_value=4
    )

    class Meta:
        examples = {
            'application/json': {
                'goal_type': 2
            }
        }


class SubmitGoalRequestSerializer(serializers.Serializer):
    user_objective = serializers.CharField(
        help_text="Final user's fitness goal description with timeframe",
        max_length=500,
        style={'placeholder': 'I want to build 3kg of muscle in 4 months'}
    )
    target_weight = serializers.FloatField(help_text="Target weight in kg", required=False, allow_null=True)
    target_score = serializers.FloatField(
        help_text="Target meal score (1-10)",
        required=False, allow_null=True, min_value=1.0, max_value=10.0
    )

    class Meta:
        examples = {
            'application/json': {
                'user_objective': 'I want to build 3kg of muscle in 4 months',
                'target_weight': 75.0,
                'target_score': 8.5
            }
        }


class SubmitGoalResponseSerializer(serializers.ModelSerializer):
    ai_validation = serializers.DictField(help_text="AI validation results", read_only=True)

    class Meta:
        model = UserGoal
        fields = [
            'id', 'goal_type', 'target_weight', 'target_score',
            'starting_weight', 'starting_score', 'user_objective',
            'end_date', 'start_date', 'ai_validation',
            'daily_cal_kcal', 'daily_protein_g', 'daily_fat_g', 'daily_carbs_g',
            'carbs_perc', 'protein_perc', 'fat_perc'
        ]


class ErrorResponseSerializer(serializers.Serializer):
    error = serializers.CharField(help_text="Error message description")
