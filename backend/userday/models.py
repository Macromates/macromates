from django.db import models


class UserDay(models.Model):
    # Many-to-one relationship with UserMonth (better performance and logic)
    user_month = models.ForeignKey(
        'usermonth.UserMonth',
        on_delete=models.CASCADE,
        related_name='days',
        null=True, blank=True
    )
    # Keep direct reference to user for convenience queries
    custom_user = models.ForeignKey(
        'customUser.CustomUser',
        on_delete=models.CASCADE,
        related_name='days'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    tot_cal_kcal = models.IntegerField(default=0)
    tot_protein_g = models.FloatField(default=0.0)
    tot_fat_g = models.FloatField(default=0.0)
    tot_carbs_g = models.FloatField(default=0.0)
    updated_at = models.DateTimeField(auto_now=True)
    meal_score_avg = models.FloatField(default=0.0)
    ai_insights = models.TextField(blank=True, null=True)
    journal_entry = models.TextField(blank=True, null=True)
    vibe_score = models.IntegerField(default=0)

    # meals = models.ManyToManyField('Meal', related_name='user_days', blank=True)

    def __str__(self):
        return f"{self.custom_user.username}'s macros for {self.created_at.strftime('%Y-%m-%d')}"

    def save(self, *args, **kwargs):
        # Ensure custom_user matches the user_month's custom_user
        if self.user_month:
            self.custom_user = self.user_month.custom_user
        super().save(*args, **kwargs)

    def recalculate_aggregates(self):
        """
        Recalculate the aggregate values for the day based on the Photo entries.
        This method should be called whenever a Photo is added to this day.
        """
        # Use the direct relationship to get all photos for this day
        photos = self.photos.all()

        self.tot_cal_kcal = sum(photo.cal_kcal or 0 for photo in photos)
        self.tot_protein_g = sum(photo.protein_g or 0.0 for photo in photos)
        self.tot_carbs_g = sum(photo.carbs_g or 0.0 for photo in photos)
        self.tot_fat_g = sum(photo.fat_g or 0.0 for photo in photos)
        self.meal_score_avg = sum(photo.meal_score or 0 for photo in photos) / len(photos) if photos else 0.0

        self.save()

        # Also update the parent month aggregates
        if self.user_month:
            self.user_month.recalculate_aggregates()

        return self
