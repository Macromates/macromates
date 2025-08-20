from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from authentication.models import CodeModel
from customUser.serializers import BasicUserSerializer

CustomUser = get_user_model()


class RegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = CodeModel
        fields = ['email']

    def validate_email(self, value):
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("This email is already in use.")
        return value


class RegistrationValidationSerializer(serializers.ModelSerializer):
    code = serializers.CharField(write_only=True)

    class Meta:
        model = CustomUser
        fields = [
            'username',
            'email',
            'password',
            'first_name',
            'last_name',
            'age',
            'weight',
            'height',
            'gender',
            'hand_length',
            'activity_level',
            'code'
        ]
        extra_kwargs = {
            'password': {'write_only': True},
            'email': {'validators': []},
        }

    def validate(self, data):
        try:
            reg_code = CodeModel.objects.get(email=data['email'], code=data['code'])
            if reg_code.is_expired():
                raise serializers.ValidationError("The code has expired.")
        except CodeModel.DoesNotExist:
            raise serializers.ValidationError("Invalid code.")
        return data

    def update(self, instance, validated_data):
        validated_data.pop('code', None)
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        CodeModel.objects.filter(email=instance.email).delete()
        return instance


class PasswordResetSerializer(serializers.ModelSerializer):
    class Meta:
        model = CodeModel
        fields = ['email']

    def validate_email(self, value):
        if not CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("No user is registered with this email.")
        return value


class PasswordResetValidationSerializer(serializers.Serializer):
    code = serializers.CharField(required=True, write_only=True)
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True)

    class Meta:
        model = CustomUser
        fields = [
            'email',
            'password',
            'code'
        ]
        extra_kwargs = {
            'password': {'write_only': True},
            'email': {'validators': []},
        }
        required = ['email', 'password', 'code']

    def validate_email(self, value):
        if not CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("No user registered with this email.")
        return value

    def validate(self, data):
        try:
            reg_code = CodeModel.objects.get(email=data['email'], code=data['code'])
            if reg_code.is_expired():
                raise serializers.ValidationError("The code has expired.")
        except CodeModel.DoesNotExist:
            raise serializers.ValidationError("Invalid code.")

        return data

    def update(self, instance, validated_data):
        instance.set_password(validated_data['password'])
        instance.save()
        # CodeModel.objects.filter(email=instance.email).delete()
        return instance


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        serializer = BasicUserSerializer(self.user, context=self.context)
        data['user'] = serializer.data
        return data
