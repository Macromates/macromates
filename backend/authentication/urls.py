from django.urls import path
from rest_framework_simplejwt import views as jwt_views

from .views import (
    RegistrationView, RegistrationValidationView,
    PasswordResetView, PasswordResetValidationView,
    MyTokenObtainPairView
)

urlpatterns = [
    path('registration/', RegistrationView.as_view(), name='auth_registration_create'),
    path('registration/validation/', RegistrationValidationView.as_view(),
         name='auth_registration_validation_partial_update'),

    path('password-reset/', PasswordResetView.as_view(), name='auth_password-reset_create'),
    path('password-reset/validation/', PasswordResetValidationView.as_view(),
         name='auth_password-reset_validation_partial_update'),

    path('token/', MyTokenObtainPairView.as_view(), name='auth_token_create'),
    path('token/refresh/', jwt_views.TokenRefreshView.as_view(), name='auth_token_refresh_create'),
    path('token/verify/', jwt_views.TokenVerifyView.as_view(), name='auth_token_verify_create'),
]
