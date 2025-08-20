from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models

# do 10 user goals
GOAL_CHOICES = [
    (1, 'Lose Weight'),
    (2, 'Build Muscle'),
    (3, 'Improve Health'),
    (4, 'Other')
]


class UserGoal(models.Model):
    custom_user = models.ForeignKey(
        'customUser.CustomUser',
        on_delete=models.CASCADE,
        related_name='goals'
    )
    goal_type = models.IntegerField(choices=GOAL_CHOICES, blank=False, null=False)
    target_weight = models.FloatField(blank=True, null=True)
    target_score = models.FloatField(
        blank=True,
        null=True,
        validators=[MinValueValidator(1.0), MaxValueValidator(10.0)]
    )
    starting_weight = models.FloatField(blank=True, null=True)
    starting_score = models.FloatField(
        blank=True,
        null=True,
        validators=[MinValueValidator(1.0), MaxValueValidator(10.0)]
    )
    start_date = models.DateTimeField(auto_now_add=True)
    end_date = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    user_objective = models.TextField(blank=True, null=True)
    perc_achieved = models.FloatField(default=0.0)
    active = models.BooleanField(default=True)
    completed = models.BooleanField(default=False)
    daily_cal_kcal = models.IntegerField(default=0)
    daily_protein_g = models.FloatField(default=0.0)
    daily_fat_g = models.FloatField(default=0.0)
    daily_carbs_g = models.FloatField(default=0.0)
    carbs_perc = models.FloatField(default=0.0)
    protein_perc = models.FloatField(default=0.0)
    fat_perc = models.FloatField(default=0.0)

    def __str__(self):
        return f"{self.custom_user.username}'s goal: {self.goal_type}"
