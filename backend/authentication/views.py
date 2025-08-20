import random
import string

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status
from rest_framework.generics import CreateAPIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import CodeModel
from .serializers import (
    RegistrationSerializer, RegistrationValidationSerializer,
    PasswordResetSerializer, PasswordResetValidationSerializer,
    MyTokenObtainPairSerializer
)

CustomUser = get_user_model()


def code_generator(length=12):
    characters = string.ascii_letters + string.digits
    return ''.join(random.choice(characters) for _ in range(length))


class RegistrationView(CreateAPIView):
    serializer_class = RegistrationSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]

        # Create user (no password yet, set unusable password)
        # If we don't do this, obtaining tokens will fail
        # because the user does not exist yet.
        user = CustomUser.objects.create(email=email)
        user.set_unusable_password()
        user.save()

        # Create verification code
        code = code_generator()
        CodeModel.objects.create(email=email, code=code)

        # Send email
        send_mail(
            "Your registration code",
            f"Your registration code is {code}",
            settings.DEFAULT_FROM_EMAIL,
            [email],
            fail_silently=False,
        )

        return Response(
            {"message": "Verification code sent to your email."},
            status=status.HTTP_201_CREATED,
        )


class RegistrationValidationView(APIView):
    permission_classes = [AllowAny]

    def patch(self, request):
        serializer = RegistrationValidationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        validated = serializer.validated_data
        email = validated["email"]

        try:
            user = CustomUser.objects.get(email=email)
        except CustomUser.DoesNotExist:
            return Response({'detail': 'User does not exist.'}, status=status.HTTP_404_NOT_FOUND)

        serializer.update(user, validated)

        return Response({'message': 'User registered successfully.'}, status=status.HTTP_200_OK)


class PasswordResetView(CreateAPIView):
    serializer_class = PasswordResetSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        code = code_generator()
        CodeModel.objects.create(email=email, code=code)

        send_mail(
            'Your password reset code',
            f'Your password reset code is {code}',
            settings.DEFAULT_FROM_EMAIL,
            [email],
            fail_silently=False,
        )

        return Response({'message': 'Password reset code sent to your email.'})


class PasswordResetValidationView(APIView):
    serializer_class = PasswordResetValidationSerializer
    permission_classes = [AllowAny]

    @swagger_auto_schema(request_body=PasswordResetValidationSerializer)
    def patch(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = CustomUser.objects.get(email=serializer.validated_data['email'])
        serializer.update(user, serializer.validated_data)

        return Response({'message': 'Password reset successfully.'})


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer
