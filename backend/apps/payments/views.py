from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Payment, PaymentMethod
from .serializers import PaymentSerializer, PaymentMethodSerializer, PaymentProcessSerializer


class PaymentMethodViewSet(viewsets.ModelViewSet):
    serializer_class = PaymentMethodSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return PaymentMethod.objects.filter(user=self.request.user, is_active=True)

    def perform_create(self, serializer):
        if serializer.validated_data.get('is_default'):
            PaymentMethod.objects.filter(
                user=self.request.user, 
                is_default=True
            ).update(is_default=False)
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        if serializer.validated_data.get('is_default'):
            PaymentMethod.objects.filter(
                user=self.request.user, 
                is_default=True
            ).exclude(id=serializer.instance.id).update(is_default=False)
        serializer.save()

    @action(detail=True, methods=['post'])
    def set_default(self, request, pk=None):
        payment_method = self.get_object()
        PaymentMethod.objects.filter(
            user=request.user, 
            is_default=True
        ).update(is_default=False)
        payment_method.is_default = True
        payment_method.save()
        return Response({'message': 'Método de pago establecido como predeterminado'})

    @action(detail=True, methods=['delete'])
    def deactivate(self, request, pk=None):
        payment_method = self.get_object()
        payment_method.is_active = False
        payment_method.save()
        return Response({'message': 'Método de pago desactivado'})


class PaymentViewSet(viewsets.ModelViewSet):
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return Payment.objects.all()
        return Payment.objects.filter(user=self.request.user)

    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAdminUser]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

    @action(detail=False, methods=['post'])
    def process_payment(self, request):
        serializer = PaymentProcessSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            order_id = serializer.validated_data['order_id']
            payment_method = serializer.validated_data['payment_method']
            
            from apps.orders.models import Order
            order = Order.objects.get(id=order_id, user=request.user)
            
            payment = Payment.objects.create(
                order=order,
                user=request.user,
                method=payment_method,
                amount=order.total_amount,
                status='processing'
            )
            
            success = self._process_payment_gateway(payment, serializer.validated_data)
            
            if success:
                payment.status = 'completed'
                payment.processed_at = timezone.now()
                payment.transaction_id = f"TXN{payment.id:08d}"
                payment.save()
                
                order.status = 'confirmed'
                order.save()
                
                return Response({
                    'message': 'Pago procesado exitosamente',
                    'payment_id': payment.id,
                    'transaction_id': payment.transaction_id
                })
            else:
                payment.status = 'failed'
                payment.save()
                return Response(
                    {'error': 'Error al procesar el pago'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def _process_payment_gateway(self, payment, payment_data):
        if payment.method == 'cash_on_delivery':
            return True
        
        import time
        time.sleep(1)
        
        import random
        return random.choice([True, True, True, False])

    @action(detail=True, methods=['post'])
    def refund(self, request, pk=None):
        if not request.user.is_staff:
            return Response(
                {'error': 'No tienes permisos para procesar reembolsos'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        payment = self.get_object()
        
        if payment.status == 'completed':
            payment.status = 'refunded'
            payment.save()
            
            payment.order.status = 'refunded'
            payment.order.save()
            
            return Response({'message': 'Reembolso procesado exitosamente'})
        
        return Response(
            {'error': 'Este pago no puede ser reembolsado'},
            status=status.HTTP_400_BAD_REQUEST
        )