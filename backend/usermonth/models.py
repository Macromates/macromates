from django.db import models


class UserMonth(models.Model):
    custom_user = models.ForeignKey(
        'customUser.CustomUser',
        on_delete=models.CASCADE,
        related_name='months'
    )
    title = models.CharField(max_length=100, blank=False, null=False)
    start_date = models.DateField(blank=False, null=False)
    end_date = models.DateField(blank=True, null=True)
    tot_protein_g = models.FloatField(default=0.0)
    tot_carbs_g = models.FloatField(default=0.0)
    tot_fat_g = models.FloatField(default=0.0)
    tot_cal_kcal = models.PositiveIntegerField(default=0)
    meal_score_avg = models.FloatField(default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.custom_user.username}'s month: {self.title}"

    # Aggregate recalculation method
    def recalculate_aggregates(self):
        """
        Recalculate the aggregate values for the month based on the UserDay entries.
        This method should be called whenever a UserDay is created or updated.
        Much more efficient now with the direct relationship!
        """
        # Use the direct relationship - much more efficient!
        days = self.days.all()

        self.tot_cal_kcal = sum(day.tot_cal_kcal for day in days)
        self.tot_protein_g = sum(day.tot_protein_g for day in days)
        self.tot_carbs_g = sum(day.tot_carbs_g for day in days)
        self.tot_fat_g = sum(day.tot_fat_g for day in days)
        self.meal_score_avg = sum(day.meal_score_avg for day in days) / len(days) if days else 0.0

        self.save()
        return self
