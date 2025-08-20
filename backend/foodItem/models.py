from django.db import models


# Create your models here.
class FoodItem(models.Model):
    """
    Model to store food items
    """
    name = models.CharField(max_length=255)
    protein_g = models.FloatField(null=True, blank=True)
    carbs_g = models.FloatField(null=True, blank=True)
    fat_g = models.FloatField(null=True, blank=True)
    cal_kcal = models.IntegerField(null=True, blank=True)
    food_photo = models.ForeignKey('foodPhoto.Photo', on_delete=models.CASCADE, related_name='food_items', null=True,
                                   blank=True)
    nutrients = models.JSONField(null=True, blank=True)

    def __str__(self):
        return f"{self.name} - {self.cal_kcal}kcal"
