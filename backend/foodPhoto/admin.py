from django.contrib import admin

from .models import Photo


@admin.register(Photo)
class PhotoAdmin(admin.ModelAdmin):
    list_display = ('customuser', 'created_at', 'protein_g', 'carbs_g', 'fat_g', 'cal_kcal', 'meal_score',
                    'user_day_link', 'user_month_link')
    list_filter = ('created_at', 'customuser', 'meal_score', 'user_day')
    search_fields = ('customuser__username', 'ai_insight')
    readonly_fields = ('created_at', 'user_day_link', 'user_month_link')
    raw_id_fields = ('user_day',)  # Makes user_day selection easier
    fieldsets = (
        ('User Info', {
            'fields': ('customuser', 'created_at')
        }),
        ('Day Linkage', {
            'fields': ('user_day',),
            'description': 'This photo is automatically linked to a UserDay when created via the analyze endpoint.'
        }),
        ('Image', {
            'fields': ('image',)
        }),
        ('Nutritional Analysis', {
            'fields': ('protein_g', 'carbs_g', 'fat_g', 'cal_kcal', 'meal_score')
        }),
        ('AI Analysis', {
            'fields': ('ai_insight',)
        }),
        ('Relationship Info', {
            'fields': ('user_day_link', 'user_month_link'),
            'classes': ('collapse',)
        })
    )

    def user_day_link(self, obj):
        if obj.user_day:
            from django.urls import reverse
            from django.utils.html import format_html
            url = reverse('admin:userday_userday_change', args=[obj.user_day.pk])
            return format_html('<a href="{}">{}</a>', url, obj.user_day)
        return "No day linked"

    user_day_link.short_description = 'Linked Day'

    def user_month_link(self, obj):
        if obj.user_day and obj.user_day.user_month:
            from django.urls import reverse
            from django.utils.html import format_html
            url = reverse('admin:usermonth_usermonth_change', args=[obj.user_day.user_month.pk])
            return format_html('<a href="{}">{}</a>', url, obj.user_day.user_month)
        return "No month linked"

    user_month_link.short_description = 'Linked Month'


# Inline for showing photos within UserDay admin
class PhotoInline(admin.TabularInline):
    model = Photo
    extra = 0
    readonly_fields = ('created_at', 'image', 'protein_g', 'carbs_g', 'fat_g', 'cal_kcal', 'meal_score', 'ai_insight')
    fields = ('created_at', 'image', 'protein_g', 'carbs_g', 'fat_g', 'cal_kcal', 'meal_score')
    can_delete = False
    show_change_link = True
