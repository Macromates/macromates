from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import CustomUser


class CustomUserAdmin(UserAdmin):
    readonly_fields = ('date_joined',)
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
                'email', 'username', 'password1', 'password2',
                'first_name', 'last_name', 'age', 'weight', 'height',
                'gender', 'hand_length', 'activity_level'
            ),
        }),
    )
    fieldsets = (
        (None, {'fields': (
            'email', 'username', 'password',
            'first_name', 'last_name', 'about_me', 'age', 'weight', 'height',
            'gender', 'hand_length', 'activity_level', 'avatar'
        )}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
        ('Groups', {'fields': ('groups',)}),
    )
    list_display = ('email', 'username', 'first_name', 'last_name', 'is_staff')
    ordering = ('email',)


admin.site.register(CustomUser, CustomUserAdmin)
