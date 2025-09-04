from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import User, Address
from .serializers import UserSerializer, UserUpdateSerializer, AddressSerializer, AdminUserSerializer


class UserViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return User.objects.filter(id=self.request.user.id)

    def get_serializer_class(self):
        if self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        return UserSerializer

    @action(detail=False, methods=['get'])
    def profile(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['put', 'patch'])
    def update_profile(self, request):
        serializer = UserUpdateSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AddressViewSet(viewsets.ModelViewSet):
    serializer_class = AddressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        if serializer.validated_data.get('is_default'):
            Address.objects.filter(user=self.request.user, is_default=True).update(is_default=False)
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        if serializer.validated_data.get('is_default'):
            Address.objects.filter(user=self.request.user, is_default=True).exclude(
                id=serializer.instance.id
            ).update(is_default=False)
        serializer.save()

    @action(detail=True, methods=['post'])
    def set_default(self, request, pk=None):
        address = self.get_object()
        Address.objects.filter(user=request.user, is_default=True).update(is_default=False)
        address.is_default = True
        address.save()
        return Response({'message': 'Dirección establecida como predeterminada'})


class AdminUserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for admin users to manage all users in the system
    """
    serializer_class = AdminUserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Only allow superusers or staff to access all users
        if not (self.request.user.is_superuser or self.request.user.is_staff):
            return User.objects.none()
        return User.objects.all().order_by('-date_joined')

    def get_serializer_class(self):
        return AdminUserSerializer

    def perform_destroy(self, instance):
        # Prevent deletion of superusers by non-superusers
        if instance.is_superuser and not self.request.user.is_superuser:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("No puedes eliminar un superusuario")
        super().perform_destroy(instance)

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate a user account"""
        user = self.get_object()
        user.is_active = True
        user.save()
        return Response({'message': f'Usuario {user.email} activado exitosamente'})

    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Deactivate a user account"""
        user = self.get_object()
        if user.is_superuser and not request.user.is_superuser:
            return Response({'error': 'No puedes desactivar un superusuario'}, 
                          status=status.HTTP_403_FORBIDDEN)
        user.is_active = False
        user.save()
        return Response({'message': f'Usuario {user.email} desactivado exitosamente'})

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get user statistics"""
        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        inactive_users = total_users - active_users
        staff_users = User.objects.filter(is_staff=True).count()
        
        return Response({
            'total_users': total_users,
            'active_users': active_users,
            'inactive_users': inactive_users,
            'staff_users': staff_users
        })