from rest_framework import serializers
from .models import User, Address


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'username', 'first_name', 'last_name', 'phone', 
                 'is_verified', 'is_superuser', 'is_staff', 'is_active', 'date_joined')
        read_only_fields = ('id', 'is_verified', 'is_superuser', 'is_staff', 'is_active', 'date_joined')


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('first_name', 'last_name', 'phone')


class AdminUserSerializer(serializers.ModelSerializer):
    """Serializer for admin operations - allows role management"""
    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'phone', 
                 'is_superuser', 'is_staff', 'is_active', 'date_joined')
        read_only_fields = ('id', 'date_joined')

    def update(self, instance, validated_data):
        # Only superusers can modify superuser status
        request = self.context.get('request')
        if 'is_superuser' in validated_data and not request.user.is_superuser:
            validated_data.pop('is_superuser')
        
        return super().update(instance, validated_data)


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = ('id', 'street_address', 'city', 'state', 'postal_code', 
                 'country', 'is_default', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)