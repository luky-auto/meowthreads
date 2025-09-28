from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import login, authenticate
from .serializers import (
    CustomTokenObtainPairSerializer,
    UserRegistrationSerializer,
    UserLoginSerializer,
    PasswordResetSerializer,
    PasswordResetConfirmSerializer
)


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register_view(request):
    # Set username to email for compatibility
    data = request.data.copy()
    data['username'] = data.get('email')
    
    serializer = UserRegistrationSerializer(data=data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'phone': user.phone,
                'date_joined': user.date_joined.isoformat(),
                'is_active': user.is_active,
                'is_superuser': user.is_superuser,
                'is_staff': user.is_staff,
            }
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_view(request):
    serializer = UserLoginSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        user = serializer.validated_data['user']
        login(request, user)
        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'phone': user.phone,
                'date_joined': user.date_joined.isoformat(),
                'is_active': user.is_active,
                'is_superuser': user.is_superuser,
                'is_staff': user.is_staff,
            }
        })
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def password_reset_view(request):
    serializer = PasswordResetSerializer(data=request.data)
    if serializer.is_valid():
        return Response({
            'message': 'Se ha enviado un email con instrucciones para restablecer tu contraseña.'
        })
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def password_reset_confirm_view(request):
    serializer = PasswordResetConfirmSerializer(data=request.data)
    if serializer.is_valid():
        return Response({
            'message': 'Contraseña restablecida exitosamente.'
        })
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT'])
@permission_classes([permissions.IsAuthenticated])
def user_profile_view(request):
    user = request.user

    if request.method == 'GET':
        return Response({
            'id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'phone': user.phone,
            'date_joined': user.date_joined.isoformat(),
            'is_active': user.is_active,
            'is_superuser': user.is_superuser,
            'is_staff': user.is_staff,
        })

    elif request.method == 'PUT':
        # Actualizar datos del perfil
        first_name = request.data.get('first_name', '').strip()
        last_name = request.data.get('last_name', '').strip()
        phone = request.data.get('phone', '').strip()

        # Validaciones
        if not first_name or not last_name:
            return Response({
                'error': 'El nombre y apellido son obligatorios'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Actualizar usuario
        user.first_name = first_name
        user.last_name = last_name
        user.phone = phone
        user.save()

        return Response({
            'message': 'Perfil actualizado exitosamente',
            'user': {
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'phone': user.phone,
                'date_joined': user.date_joined.isoformat(),
                'is_active': user.is_active,
                'is_superuser': user.is_superuser,
                'is_staff': user.is_staff,
            }
        })


@api_view(['PUT'])
@permission_classes([permissions.IsAuthenticated])
def change_password_view(request):
    user = request.user
    current_password = request.data.get('current_password')
    new_password = request.data.get('new_password')

    # Validaciones
    if not current_password:
        return Response({
            'error': 'La contraseña actual es obligatoria'
        }, status=status.HTTP_400_BAD_REQUEST)

    if not new_password:
        return Response({
            'error': 'La nueva contraseña es obligatoria'
        }, status=status.HTTP_400_BAD_REQUEST)

    if len(new_password) < 6:
        return Response({
            'error': 'La nueva contraseña debe tener al menos 6 caracteres'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Verificar contraseña actual
    if not user.check_password(current_password):
        return Response({
            'error': 'La contraseña actual es incorrecta'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Verificar que la nueva contraseña sea diferente
    if current_password == new_password:
        return Response({
            'error': 'La nueva contraseña debe ser diferente a la actual'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Cambiar contraseña
    user.set_password(new_password)
    user.save()

    return Response({
        'message': 'Contraseña actualizada exitosamente'
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    try:
        refresh_token = request.data["refresh"]
        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response({'message': 'Sesión cerrada exitosamente'})
    except Exception as e:
        return Response({'error': 'Token inválido'}, status=status.HTTP_400_BAD_REQUEST)