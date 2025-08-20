from django.contrib import admin

from .models import UserGoal


class UserGoalAdmin(admin.ModelAdmin):
    list_display = ('id', 'custom_user', 'goal_type', 'active', 'completed', 'start_date', 'end_date')
    search_fields = ('custom_user__username', 'goal_type')
    list_filter = ('active', 'completed', 'goal_type')


admin.site.register(UserGoal, UserGoalAdmin)
