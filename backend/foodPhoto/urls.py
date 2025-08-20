from django.urls import path

from .views import AnalyzeFoodView, DeletePhotoView, PhotoFoodItemsView

app_name = 'foodPhoto'

urlpatterns = [
    path('analyze/', AnalyzeFoodView.as_view(), name='analyze_food'),
    path('delete/<int:photo_id>/', DeletePhotoView.as_view(), name='delete_photo'),
    path('<int:photo_id>/food-items/', PhotoFoodItemsView.as_view(), name='photo_food_items'),
]
