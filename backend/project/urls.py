"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include
from drf_yasg import openapi
from drf_yasg.views import get_schema_view
from rest_framework.permissions import AllowAny

schema_view = get_schema_view(
    openapi.Info(
        title="MacroMates API",
        default_version='v1',
        description="API documentation for the MacroMates project",
        terms_of_service="https://www.google.com/policies/terms/",
        contact=openapi.Contact(email="academy@constructor.org"),
        license=openapi.License(name="BSD License"),
    ),
    public=True,
    permission_classes=[AllowAny, ]
)

urlpatterns = [
    path("backend/api/admin/", admin.site.urls),
    path("backend/api/users/", include("customUser.urls")),  # Custom user app URLs
    path("backend/api/auth/", include("authentication.urls")),  # Authentication app URLs
    path("backend/api/goals/", include("usergoal.urls")),  # User goal app URLs
    path("backend/api/docs/", schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path("backend/api/food/", include("foodPhoto.urls", namespace="foodPhoto")),
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
