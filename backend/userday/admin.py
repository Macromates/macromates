from django.contrib import admin

from foodPhoto.admin import PhotoInline
from .models import UserDay


class UserDayAdmin(admin.ModelAdmin):
    list_display = ('id', 'custom_user', 'created_at', 'user_month', 'tot_cal_kcal', 'tot_protein_g', 'tot_fat_g',
                    'tot_carbs_g', 'meal_score_avg', 'photo_count')
    search_fields = ('custom_user__username', 'created_at')
    list_filter = ('created_at', 'user_month', 'tot_cal_kcal', 'tot_protein_g', 'tot_fat_g', 'tot_carbs_g',
                   'meal_score_avg', 'vibe_score')
    readonly_fields = ('created_at', 'updated_at', 'tot_cal_kcal', 'tot_protein_g', 'tot_fat_g', 'tot_carbs_g',
                       'meal_score_avg')
    inlines = [PhotoInline]

    fieldsets = (
        ('Basic Info', {
            'fields': ('custom_user', 'user_month', 'created_at', 'updated_at')
        }),
        ('Aggregated Nutritional Data', {
            'fields': ('tot_cal_kcal', 'tot_protein_g', 'tot_fat_g', 'tot_carbs_g', 'meal_score_avg'),
            'description': 'These values are automatically calculated from linked photos. They update when photos are added/modified.'
        }),
        ('Additional Info', {
            'fields': ('ai_insights', 'journal_entry', 'vibe_score'),
            'classes': ('collapse',)
        })
    )

    def photo_count(self, obj):
        return obj.photos.count()

    photo_count.short_description = 'Photos'
    photo_count.admin_order_field = 'photos__count'

    def get_queryset(self, request):
        return super().get_queryset(request).prefetch_related('photos').select_related('user_month', 'custom_user')


admin.site.register(UserDay, UserDayAdmin)
