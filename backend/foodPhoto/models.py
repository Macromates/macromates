from django.db import models

from customUser.models import CustomUser
from userday.models import UserDay


# Create your models here.
class Photo(models.Model):
    """
    Model to store food photos and their AI analysis results
    """
    customuser = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='photos')
    image = models.ImageField(upload_to='meal_photos/')
    created_at = models.DateTimeField(auto_now_add=True)
    protein_g = models.FloatField(null=True, blank=True)
    carbs_g = models.FloatField(null=True, blank=True)
    fat_g = models.FloatField(null=True, blank=True)
    cal_kcal = models.IntegerField(null=True, blank=True)
    ai_insight = models.TextField(null=True, blank=True)
    meal_score = models.PositiveIntegerField(default=5)
    user_day = models.ForeignKey(UserDay, on_delete=models.CASCADE, related_name='photos', null=True, blank=True)

    def __str__(self):
        day_info = f" (Day: {self.user_day.created_at.strftime('%Y-%m-%d')})" if self.user_day else " (No day linked)"
        return f"Photo by {self.customuser.username} at {self.created_at.strftime('%Y-%m-%d %H:%M')}{day_info}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Recalculate day aggregates when photo is saved
        if self.user_day:
            self.user_day.recalculate_aggregates()
