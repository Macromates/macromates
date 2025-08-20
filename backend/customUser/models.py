from django.contrib.auth.models import AbstractUser
from django.db import models

GENDER_CHOICES = [
    ('M', 'Male'),
    ('F', 'Female'),
    ('O', 'Other'),
]

ACTIVITY_LEVEL_CHOICES = [
    ('Every day', 'For those who are highly committed to daily workouts.'),
    ('A few times a week', 'A very common option for regular exercisers.'),
    ('Sometimes', 'For those who are active but perhaps not on a strict schedule.'),
    ('Rarely', 'For those who don\'t prioritize fitness often.'),
    ('Never', 'For those who are not into fitness at all.'),
]


class CustomUser(AbstractUser):
    """
    Custom user model that extends the default Django user model.
    This can be used to add additional fields or methods specific to the application.
    """
    username = models.CharField(
        max_length=150,
        unique=True,
        blank=False,
    )
    email = models.EmailField(unique=True, null=False, blank=False)
    password = models.CharField(max_length=128, blank=True, null=True)
    first_name = models.CharField(max_length=30, blank=True, null=True)
    last_name = models.CharField(max_length=150, blank=True, null=True)
    about_me = models.TextField(blank=True, null=True, max_length=200)
    is_active = models.BooleanField(default=True, blank=True, null=True)
    is_staff = models.BooleanField(default=False, blank=True, null=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    date_joined = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    age = models.PositiveIntegerField(blank=True, null=True)
    weight = models.PositiveIntegerField(blank=True, null=True)
    height = models.PositiveIntegerField(blank=True, null=True)
    avg_meal_score = models.FloatField(blank=True, null=True, default=5.00)
    gender = models.CharField(
        max_length=10,
        choices=GENDER_CHOICES,
        null=True,
        blank=True,
        default='O'
    )
    hand_length = models.PositiveIntegerField(
        null=True,
        blank=True
    )
    activity_level = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        default="Sometimes",
        choices=ACTIVITY_LEVEL_CHOICES
    )
    # todo: add meals, goal, photos and user_month foreign key relations

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    # REQUIRED_FIELDS = ['username', 'first_name', 'last_name', 'age', 'weight', 'height', 'gender', 'hand_length', 'activity_level']

    def __str__(self):
        return self.email
