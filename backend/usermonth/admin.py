from django.contrib import admin

from .models import UserMonth


class UserMonthAdmin(admin.ModelAdmin):
    list_display = (
        'custom_user', 'id', 'title', 'start_date', 'end_date',
        'tot_protein_g', 'tot_carbs_g', 'tot_fat_g', 'tot_cal_kcal',
        'meal_score_avg', 'created_at', 'updated_at'
    )
    search_fields = ('custom_user__username', 'title')
    list_filter = ('custom_user',)


admin.site.register(UserMonth, UserMonthAdmin)
