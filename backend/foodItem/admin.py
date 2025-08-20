from django.contrib import admin

from .models import FoodItem


@admin.register(FoodItem)
class FoodItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'food_photo', 'protein_g', 'carbs_g', 'fat_g', 'cal_kcal', 'get_photo_user',
                    'get_photo_date')
    list_filter = ('food_photo__customuser', 'food_photo__created_at')
    search_fields = ('name', 'food_photo__customuser__username')
    readonly_fields = ('food_photo', 'get_nutrients_display')

    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'food_photo')
        }),
        ('Macronutrients', {
            'fields': ('protein_g', 'carbs_g', 'fat_g', 'cal_kcal')
        }),
        ('Additional Nutrients', {
            'fields': ('get_nutrients_display',),
            'classes': ('collapse',)
        })
    )

    def get_photo_user(self, obj):
        """Get the username of the photo owner"""
        if obj.food_photo and obj.food_photo.customuser:
            return obj.food_photo.customuser.username
        return "No user"

    get_photo_user.short_description = "Photo Owner"
    get_photo_user.admin_order_field = 'food_photo__customuser__username'

    def get_photo_date(self, obj):
        """Get the date the photo was created"""
        if obj.food_photo:
            return obj.food_photo.created_at.strftime('%Y-%m-%d %H:%M')
        return "No date"

    get_photo_date.short_description = "Photo Date"
    get_photo_date.admin_order_field = 'food_photo__created_at'

    def get_nutrients_display(self, obj):
        """Display nutrients in a readable format"""
        if obj.nutrients:
            nutrients_list = []
            for nutrient in obj.nutrients:
                if isinstance(nutrient, dict) and 'name' in nutrient and 'value' in nutrient:
                    nutrients_list.append(f"{nutrient['name']}: {nutrient['value']}")
            return '\n'.join(nutrients_list) if nutrients_list else "No nutrients"
        return "No nutrients"

    get_nutrients_display.short_description = "Nutrients"
