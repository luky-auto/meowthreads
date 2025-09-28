from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes, authentication_classes
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse
from django.conf import settings
import json
import logging
from .models import Payment, PaymentMethod
from .serializers import PaymentSerializer, PaymentMethodSerializer, PaymentProcessSerializer
# from .epayco_service import EpaycoService
from .mercadopago_service import MercadoPagoService

logger = logging.getLogger(__name__)


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


# Endpoints para ePayco Colombia
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_card_token(request):
    """Crear token de tarjeta para pago seguro"""
    try:
        epayco = EpaycoService()

        card_data = {
            'number': request.data.get('card_number'),
            'exp_year': request.data.get('exp_year'),
            'exp_month': request.data.get('exp_month'),
            'cvc': request.data.get('cvc')
        }

        result = epayco.create_token(card_data)

        if result['success']:
            return Response({
                'token': result['token'],
                'card': result['card']
            })
        else:
            return Response(
                {'error': result['error']},
                status=status.HTTP_400_BAD_REQUEST
            )

    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def process_card_payment(request):
    """Procesar pago con tarjeta de crédito/débito"""
    try:
        epayco = EpaycoService()

        # Obtener datos del carrito
        from apps.orders.models import Cart
        cart = Cart.objects.get(user=request.user)

        if not cart.items.exists():
            return Response(
                {'error': 'El carrito está vacío'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Crear cliente si es necesario
        customer_data = {
            'name': request.data.get('name', request.user.first_name),
            'email': request.user.email,
            'phone': request.data.get('phone', '')
        }

        customer_result = epayco.create_customer(customer_data)
        if not customer_result['success']:
            return Response(
                {'error': customer_result['error']},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Datos del pago
        payment_data = {
            'token': request.data.get('token'),
            'customer_id': customer_result['customer_id'],
            'doc_type': request.data.get('doc_type', 'CC'),
            'doc_number': request.data.get('doc_number'),
            'name': request.data.get('name', request.user.first_name),
            'last_name': request.data.get('last_name', request.user.last_name),
            'email': request.user.email,
            'phone': request.data.get('phone', ''),
            'cell_phone': request.data.get('cell_phone', ''),
            'invoice': f"INV-{cart.id}-{timezone.now().strftime('%Y%m%d%H%M%S')}",
            'description': f"Compra MeowThreads - {cart.total_items} artículos",
            'amount': int(cart.total_price),
            'ip': request.META.get('REMOTE_ADDR', '127.0.0.1'),
            'city': request.data.get('city', 'Bogotá'),
            'department': request.data.get('department', 'Cundinamarca'),
            'extra1': f"user_id:{request.user.id}",
            'extra2': f"cart_id:{cart.id}",
            'extra3': f"total_items:{cart.total_items}"
        }

        # Procesar pago
        result = epayco.charge_card(payment_data)

        if result['success']:
            # Crear la orden
            from apps.orders.models import Order, OrderItem
            order = Order.objects.create(
                user=request.user,
                status='confirmed',
                total_amount=cart.total_price,
                subtotal=cart.total_price,
                notes=f'Pagado con ePayco - Ref: {result["transaction_id"]} - Dirección: {request.data.get("shipping_address", "")}'
            )

            # Crear los items de la orden
            for cart_item in cart.items.all():
                OrderItem.objects.create(
                    order=order,
                    product_variant=cart_item.product_variant,
                    quantity=cart_item.quantity,
                    unit_price=cart_item.product_variant.final_price
                )

            # Crear el registro de pago
            payment = Payment.objects.create(
                order=order,
                user=request.user,
                method='epayco_card',
                amount=order.total_amount,
                status='completed',
                processed_at=timezone.now(),
                transaction_id=result['transaction_id']
            )

            # Limpiar el carrito
            cart.items.all().delete()

            return Response({
                'message': 'Pago procesado exitosamente',
                'order_id': order.id,
                'payment_id': payment.id,
                'transaction_id': result['transaction_id'],
                'state': result['state']
            })
        else:
            return Response(
                {'error': result['error'], 'state': result.get('state', 'Rechazada')},
                status=status.HTTP_400_BAD_REQUEST
            )

    except Cart.DoesNotExist:
        return Response(
            {'error': 'Carrito no encontrado'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_pse_payment(request):
    """Crear pago PSE (débito online)"""
    try:
        epayco = EpaycoService()

        # Obtener datos del carrito
        from apps.orders.models import Cart
        cart = Cart.objects.get(user=request.user)

        if not cart.items.exists():
            return Response(
                {'error': 'El carrito está vacío'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Datos del pago PSE
        pse_data = {
            'bank': request.data.get('bank'),
            'invoice': f"PSE-{cart.id}-{timezone.now().strftime('%Y%m%d%H%M%S')}",
            'description': f"Compra MeowThreads PSE - {cart.total_items} artículos",
            'amount': int(cart.total_price),
            'type_person': request.data.get('type_person', '0'),
            'doc_type': request.data.get('doc_type', 'CC'),
            'doc_number': request.data.get('doc_number'),
            'name': request.data.get('name', request.user.first_name),
            'last_name': request.data.get('last_name', request.user.last_name),
            'email': request.user.email,
            'phone': request.data.get('phone', ''),
            'cell_phone': request.data.get('cell_phone', ''),
            'ip': request.META.get('REMOTE_ADDR', '127.0.0.1'),
            'city': request.data.get('city', 'Bogotá'),
            'department': request.data.get('department', 'Cundinamarca'),
            'url_response': f"{request.build_absolute_uri('/').rstrip('/')}/api/payments/epayco/pse/response/",
            'url_confirmation': f"{request.build_absolute_uri('/').rstrip('/')}/api/payments/epayco/confirmation/"
        }

        result = epayco.create_pse_payment(pse_data)

        if result['success']:
            # Crear orden en estado pendiente
            from apps.orders.models import Order, OrderItem
            order = Order.objects.create(
                user=request.user,
                status='pending',
                total_amount=cart.total_price,
                subtotal=cart.total_price,
                notes=f'Pago PSE pendiente - Ref: {result["transaction_id"]} - Dirección: {request.data.get("shipping_address", "")}'
            )

            # Crear los items de la orden
            for cart_item in cart.items.all():
                OrderItem.objects.create(
                    order=order,
                    product_variant=cart_item.product_variant,
                    quantity=cart_item.quantity,
                    unit_price=cart_item.product_variant.final_price
                )

            # Crear el registro de pago pendiente
            payment = Payment.objects.create(
                order=order,
                user=request.user,
                method='epayco_pse',
                amount=order.total_amount,
                status='processing',
                transaction_id=result['transaction_id']
            )

            return Response({
                'url_banco': result['url_banco'],
                'order_id': order.id,
                'payment_id': payment.id,
                'transaction_id': result['transaction_id']
            })
        else:
            return Response(
                {'error': result['error']},
                status=status.HTTP_400_BAD_REQUEST
            )

    except Cart.DoesNotExist:
        return Response(
            {'error': 'Carrito no encontrado'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_pse_banks(request):
    """Obtener lista de bancos para PSE"""
    try:
        epayco = EpaycoService()
        result = epayco.get_banks()

        if result['success']:
            return Response({'banks': result['banks']})
        else:
            return Response(
                {'error': result['error']},
                status=status.HTTP_400_BAD_REQUEST
            )

    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_epayco_config(request):
    """Obtener configuración pública de ePayco"""
    return Response({
        'public_key': settings.EPAYCO_PUBLIC_KEY,
        'customer_id': settings.EPAYCO_CUSTOMER_ID,
        'test_mode': settings.EPAYCO_TEST_MODE
    })


@csrf_exempt
def epayco_confirmation(request):
    """Webhook de confirmación de ePayco"""
    try:
        if request.method == 'POST':
            data = request.POST.dict()

            # Validar firma
            if not EpaycoService.validate_signature(data):
                return HttpResponse(status=400)

            # Buscar el pago
            transaction_id = data.get('x_ref_payco')
            try:
                payment = Payment.objects.get(transaction_id=transaction_id)

                # Actualizar estado según respuesta
                if data.get('x_cod_response') == '1':  # Exitoso
                    payment.status = 'completed'
                    payment.processed_at = timezone.now()
                    payment.order.status = 'confirmed'
                    payment.order.save()

                    # Limpiar carrito si existe
                    from apps.orders.models import Cart
                    try:
                        cart = Cart.objects.get(user=payment.user)
                        cart.items.all().delete()
                    except Cart.DoesNotExist:
                        pass

                else:  # Rechazado
                    payment.status = 'failed'
                    payment.order.status = 'cancelled'
                    payment.order.save()

                payment.save()

            except Payment.DoesNotExist:
                pass

        return HttpResponse(status=200)

    except Exception as e:
        logger.error(f"Error in ePayco confirmation: {str(e)}")
        return HttpResponse(status=400)


@api_view(['GET', 'POST'])
@permission_classes([permissions.AllowAny])
def epayco_response(request):
    """Página de respuesta de ePayco"""
    try:
        if request.method == 'POST':
            data = request.POST.dict()
        else:
            data = request.GET.dict()

        transaction_id = data.get('ref_payco')
        state = data.get('x_cod_response')

        if state == '1':
            message = 'Pago exitoso'
        elif state == '2':
            message = 'Pago rechazado'
        elif state == '3':
            message = 'Pago pendiente'
        else:
            message = 'Estado desconocido'

        return Response({
            'transaction_id': transaction_id,
            'state': state,
            'message': message,
            'data': data
        })

    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# Endpoints para MercadoPago
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_mercadopago_payment(request):
    """Procesar pago con MercadoPago usando Checkout API"""
    try:
        print(f"[VIEW] Starting MercadoPago payment request with data: {request.data}")
        mp_service = MercadoPagoService()

        # Obtener datos del carrito
        from apps.orders.models import Cart
        cart = Cart.objects.get(user=request.user)

        if not cart.items.exists():
            return Response(
                {'error': 'El carrito está vacío'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Preparar items para MercadoPago
        items = []
        for cart_item in cart.items.all():
            items.append({
                "id": str(cart_item.product_variant.id),
                "title": cart_item.product_variant.product.name,
                "description": f"{cart_item.product_variant.size} - {cart_item.product_variant.color}",
                "picture_url": "",
                "category_id": "fashion",
                "quantity": cart_item.quantity,
                "unit_price": float(cart_item.product_variant.final_price)
            })

        # Datos del pago
        payment_data = {
            'amount': float(cart.total_price),
            'token': request.data.get('token'),
            'description': f"Compra MeowThreads - {cart.total_items} artículos",
            'installments': request.data.get('installments', 1),
            'payment_method_id': request.data.get('payment_method_id'),
            'issuer_id': request.data.get('issuer_id'),
            'payer_email': request.user.email,
            'identification_type': request.data.get('identification_type', 'CC'),
            'identification_number': request.data.get('identification_number'),
            'first_name': request.data.get('first_name', request.user.first_name),
            'last_name': request.data.get('last_name', request.user.last_name),
            'external_reference': f"ORDER-{cart.id}-{timezone.now().strftime('%Y%m%d%H%M%S')}",
            'expiration_month': request.data.get('expiration_month'),
            'expiration_year': request.data.get('expiration_year'),
            'items': items
        }

        # Procesar pago
        print(f"[VIEW] About to call mp_service.create_payment with data: {payment_data}")
        result = mp_service.create_payment(payment_data)
        print(f"[VIEW] MercadoPago service returned: {result}")

        if result['success']:
            # Crear la orden
            from apps.orders.models import Order, OrderItem
            order = Order.objects.create(
                user=request.user,
                status='pending' if result['status'] == 'pending' else 'confirmed',
                total_amount=cart.total_price,
                subtotal=cart.total_price,
                notes=f'MercadoPago - ID: {result["payment_id"]} - Dirección: {request.data.get("shipping_address", "")}'
            )

            # Crear los items de la orden
            for cart_item in cart.items.all():
                OrderItem.objects.create(
                    order=order,
                    product_variant=cart_item.product_variant,
                    quantity=cart_item.quantity,
                    unit_price=cart_item.product_variant.final_price
                )

            # Crear el registro de pago
            payment = Payment.objects.create(
                order=order,
                user=request.user,
                method='mercadopago',
                amount=order.total_amount,
                status='processing' if result['status'] == 'pending' else 'completed',
                processed_at=timezone.now() if result['status'] != 'pending' else None,
                transaction_id=str(result['payment_id'])
            )

            # Limpiar carrito solo si el pago fue aprobado
            if result['status'] == 'approved':
                cart.items.all().delete()

            return Response({
                'message': 'Pago procesado exitosamente',
                'order_id': order.id,
                'payment_id': payment.id,
                'mp_payment_id': result['payment_id'],
                'status': result['status'],
                'status_detail': result['status_detail']
            })
        else:
            return Response(
                {'error': result['error']},
                status=status.HTTP_400_BAD_REQUEST
            )

    except Cart.DoesNotExist:
        return Response(
            {'error': 'Carrito no encontrado'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        print(f"[VIEW] Exception in create_mercadopago_payment: {str(e)}")
        print(f"[VIEW] Exception type: {type(e)}")
        logger.error(f"Error processing MercadoPago payment: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_mercadopago_config(request):
    """Obtener configuración pública de MercadoPago"""
    return Response({
        'public_key': settings.MERCADOPAGO_PUBLIC_KEY,
        'test_mode': settings.MERCADOPAGO_TEST_MODE
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_mercadopago_preference(request):
    """Crear preferencia de pago para Checkout Pro"""
    try:
        print(f"[CHECKOUT_PRO] Starting preference creation...")

        # Obtener datos del carrito del usuario
        from apps.orders.models import Cart, CartItem

        user = request.user
        cart = Cart.objects.filter(user=user).first()

        if not cart:
            return Response({
                'success': False,
                'error': 'No hay items en el carrito'
            }, status=status.HTTP_400_BAD_REQUEST)

        cart_items = CartItem.objects.filter(cart=cart)
        if not cart_items.exists():
            return Response({
                'success': False,
                'error': 'El carrito está vacío'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Obtener datos del frontend
        frontend_total = request.data.get('total')
        frontend_subtotal = request.data.get('subtotal')
        frontend_shipping = request.data.get('shipping', 0)
        frontend_discount = request.data.get('discount', 0)

        calculated_subtotal = sum(item.product_variant.final_price * item.quantity for item in cart_items)

        # Usar datos del frontend si están disponibles
        final_total = float(frontend_total) if frontend_total else calculated_subtotal
        subtotal = float(frontend_subtotal) if frontend_subtotal else calculated_subtotal
        shipping = float(frontend_shipping)
        discount = float(frontend_discount)

        print(f"[CHECKOUT_PRO] Frontend total: {frontend_total}, Subtotal: {subtotal}, Shipping: {shipping}, Discount: {discount}")

        # Preparar items del carrito
        items = [
            {
                'id': str(item.product_variant.id),
                'title': item.product_variant.product.name,
                'description': f"{item.product_variant.size} - {item.product_variant.color}",
                'quantity': item.quantity,
                'unit_price': float(item.product_variant.final_price)
            } for item in cart_items
        ]

        # Añadir envío como item separado si es mayor a 0
        if shipping > 0:
            items.append({
                'id': 'SHIPPING',
                'title': 'Envío',
                'description': 'Costo de envío',
                'quantity': 1,
                'unit_price': shipping
            })

        # Aplicar descuento proporcionalmente a todos los items si existe
        if discount > 0:
            items.append({
                'id': 'DISCOUNT',
                'title': 'Descuento',
                'description': 'Descuento aplicado',
                'quantity': 1,
                'unit_price': -discount  # Precio negativo para descuento
            })

        # Preparar datos de la orden
        order_data = {
            'amount': final_total,
            'user_id': user.id,
            'payer_email': user.email,
            'first_name': user.first_name or 'Juan',
            'last_name': user.last_name or 'Perez',
            'identification_type': 'CC',
            'identification_number': '123456789',
            'external_reference': f"ORDER-{user.id}-{timezone.now().strftime('%Y%m%d%H%M%S')}",
            'street_name': request.data.get('shipping_address', 'Calle Falsa'),
            'city_name': request.data.get('city', 'Bogotá'),
            'state_name': request.data.get('department', 'Cundinamarca'),
            'zip_code': '110111',
            'items': items
        }

        print(f"[CHECKOUT_PRO] Order data prepared: {order_data}")

        # Crear preferencia con MercadoPago
        mp_service = MercadoPagoService()
        result = mp_service.create_checkout_preference(order_data)

        if result['success']:
            print(f"[CHECKOUT_PRO] Preference created successfully: {result['preference_id']}")
            return Response({
                'success': True,
                'preference_id': result['preference_id'],
                'init_point': result['init_point'],
                'sandbox_init_point': result['sandbox_init_point']
            }, status=status.HTTP_200_OK)
        else:
            print(f"[CHECKOUT_PRO] Error creating preference: {result}")
            return Response({
                'success': False,
                'error': result.get('error', 'Error desconocido')
            }, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        print(f"[CHECKOUT_PRO] Exception: {str(e)}")
        logger.error(f"Error creating MercadoPago preference: {str(e)}")
        return Response({
            'success': False,
            'error': f'Error interno: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def test_mercadopago_preference(request):
    """Test simple de creación de preferencia"""
    try:
        print(f"[TEST_PREFERENCE] Testing preference creation...")

        # Datos mínimos para test
        test_order_data = {
            'amount': 10000.0,
            'payer_email': 'test@meowthreads.com',
            'first_name': 'Test',
            'last_name': 'User',
            'external_reference': 'TEST-001',
            'items': [
                {
                    'id': 'TEST001',
                    'title': 'Test Product',
                    'description': 'Test Description',
                    'quantity': 1,
                    'unit_price': 10000.0
                }
            ]
        }

        print(f"[TEST_PREFERENCE] Test data: {test_order_data}")

        mp_service = MercadoPagoService()
        result = mp_service.create_checkout_preference(test_order_data)

        print(f"[TEST_PREFERENCE] Result: {result}")

        return Response({
            'success': True,
            'test_result': result
        })

    except Exception as e:
        print(f"[TEST_PREFERENCE] Exception: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def test_mercadopago_api(request):
    """Test directo de la API de MercadoPago"""
    try:
        import requests

        # Test básico de conectividad a MercadoPago
        mp_service = MercadoPagoService()

        # Probar obtener métodos de pago (endpoint básico)
        print(f"[TEST] Testing MercadoPago API connectivity...")
        print(f"[TEST] Access token: {settings.MERCADOPAGO_ACCESS_TOKEN[:20]}...")
        print(f"[TEST] Test mode: {settings.MERCADOPAGO_TEST_MODE}")

        # Test 1: Obtener métodos de pago
        payment_methods_result = mp_service.get_payment_methods()
        print(f"[TEST] Payment methods result: {payment_methods_result}")

        if payment_methods_result['success']:
            print(f"[TEST] SUCCESS MercadoPago API connection working")
            print(f"[TEST] Found {len(payment_methods_result['payment_methods'])} payment methods")
        else:
            print(f"[TEST] FAILED MercadoPago API connection failed")
            return Response({
                'success': False,
                'error': 'API connection failed',
                'details': payment_methods_result
            })

        # Test 2: Crear un pago mínimo con datos hardcodeados
        if request.data.get('test_payment'):
            print(f"[TEST] Creating test payment...")

            test_payment_data = {
                'amount': 1000.0,  # $1000 pesos - minimum for Mastercard
                'token': request.data.get('token', 'test_token'),
                'description': 'Test payment',
                'payment_method_id': 'master',
                'payer_email': 'test@meowthreads.com',
                'identification_type': 'CC',
                'identification_number': '123456789',
                'first_name': 'Test',
                'last_name': 'User'
            }

            payment_result = mp_service.create_payment(test_payment_data)
            print(f"[TEST] Payment result: {payment_result}")

            return Response({
                'success': True,
                'payment_methods_test': payment_methods_result,
                'payment_test': payment_result
            })

        return Response({
            'success': True,
            'payment_methods_test': payment_methods_result,
            'message': 'MercadoPago API connection successful'
        })

    except Exception as e:
        print(f"[TEST] Exception in test: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=500)


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([permissions.IsAuthenticated])
def check_payment_status(request, payment_id):
    """Verificar el estado de un pago de MercadoPago"""
    try:
        print(f"[CHECK_PAYMENT] Checking payment status for ID: {payment_id}")

        mp_service = MercadoPagoService()
        payment_info = mp_service.get_payment(payment_id)

        if payment_info['success']:
            payment_data = payment_info['payment']
            external_reference = payment_data.get('external_reference')
            payment_status = payment_data['status']

            print(f"[CHECK_PAYMENT] Payment {payment_id} status: {payment_status}")
            print(f"[CHECK_PAYMENT] External reference: {external_reference}")

            # Si el pago fue aprobado, crear la orden y vaciar carrito
            if payment_status == 'approved' and external_reference:
                if external_reference.startswith('ORDER-'):
                    user_id = external_reference.split('-')[1]
                    user = request.user

                    # Verificar que coincida con el usuario actual
                    if str(user.id) == user_id:
                        from apps.orders.models import Cart, Order, OrderItem
                        from apps.payments.models import Payment

                        cart = Cart.objects.filter(user=user).first()
                        if cart and cart.items.exists():
                            # Crear orden
                            order = Order.objects.create(
                                user=user,
                                status='confirmed',
                                total_amount=cart.total_price,
                                subtotal=cart.total_price,
                                notes=f'MercadoPago - ID: {payment_data["id"]} - Ref: {external_reference}'
                            )

                            # Crear items de la orden
                            for cart_item in cart.items.all():
                                OrderItem.objects.create(
                                    order=order,
                                    product_variant=cart_item.product_variant,
                                    quantity=cart_item.quantity,
                                    unit_price=cart_item.product_variant.final_price,
                                    subtotal=cart_item.subtotal
                                )

                            # Crear registro de pago
                            Payment.objects.create(
                                order=order,
                                user=user,
                                method='mercadopago',
                                status='completed',
                                amount=payment_data['transaction_amount'],
                                transaction_id=payment_data['id'],
                                gateway_response=payment_data,
                                processed_at=timezone.now()
                            )

                            # Vaciar carrito
                            cart.items.all().delete()

                            print(f"[CHECK_PAYMENT] Order created and cart cleared for user {user.id}")

                            return Response({
                                'success': True,
                                'status': payment_status,
                                'order_created': True,
                                'cart_cleared': True
                            })

            return Response({
                'success': True,
                'status': payment_status,
                'order_created': False,
                'cart_cleared': False
            })
        else:
            return Response({
                'success': False,
                'error': payment_info['error']
            }, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        print(f"[CHECK_PAYMENT] Error checking payment: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([permissions.IsAuthenticated])
def simulate_payment(request):
    """Simular un pago exitoso para testing - TEMPORAL"""
    try:
        print(f"[SIMULATE_PAYMENT] Starting simulated payment for user {request.user.id}")

        # Obtener carrito del usuario
        from apps.orders.models import Cart, Order, OrderItem
        from apps.payments.models import Payment
        import time
        import uuid

        user = request.user
        cart = Cart.objects.filter(user=user).first()

        if not cart or not cart.items.exists():
            return Response({
                'success': False,
                'error': 'No hay items en el carrito'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Simular espera de procesamiento (en desarrollo sería instantáneo)
        print(f"[SIMULATE_PAYMENT] Processing payment for {cart.total_price}")

        # Obtener datos de dirección de envío si están disponibles
        shipping_address = None
        if request.method == 'POST' and hasattr(request, 'data'):
            shipping_data = request.data.get('shipping_address')
            city_data = request.data.get('city', 'Bogotá')
            department_data = request.data.get('department', 'Cundinamarca')
            total_data = request.data.get('total')
            shipping_cost_data = request.data.get('shipping', 0)

            if shipping_data:
                # Crear dirección temporal para esta orden
                from apps.customers.models import Address
                shipping_address = Address.objects.create(
                    user=user,
                    street_address=shipping_data,
                    city=city_data,
                    state=department_data,
                    postal_code='000000',  # Temporal
                    country='Colombia',
                    is_default=False
                )
                print(f"[SIMULATE_PAYMENT] Created shipping address: {shipping_address}")

        # Crear orden inmediatamente
        simulated_payment_id = f"SIM-{uuid.uuid4().hex[:8].upper()}"
        external_reference = f"ORDER-{user.id}-{timezone.now().strftime('%Y%m%d%H%M%S')}"

        # Usar el total del frontend si está disponible, sino usar el del carrito
        order_total = float(request.data.get('total', cart.total_price)) if request.method == 'POST' and hasattr(request, 'data') else cart.total_price
        order_subtotal = float(request.data.get('subtotal', cart.total_price)) if request.method == 'POST' and hasattr(request, 'data') else cart.total_price
        order_shipping = float(request.data.get('shipping', 0)) if request.method == 'POST' and hasattr(request, 'data') else 0

        order = Order.objects.create(
            user=user,
            status='confirmed',
            total_amount=order_total,
            subtotal=order_subtotal,
            shipping_cost=order_shipping,
            shipping_address=shipping_address,
            notes=f'Pago Simulado - ID: {simulated_payment_id} - Ref: {external_reference}'
        )

        # Crear items de la orden y actualizar inventario
        from apps.inventory.models import StockMovement

        for cart_item in cart.items.all():
            # Crear item de la orden
            OrderItem.objects.create(
                order=order,
                product_variant=cart_item.product_variant,
                quantity=cart_item.quantity,
                unit_price=cart_item.product_variant.final_price,
                subtotal=cart_item.subtotal
            )

            # Actualizar inventario - descontar stock
            variant = cart_item.product_variant
            if variant.stock_quantity >= cart_item.quantity:
                # Reducir stock del producto
                variant.stock_quantity -= cart_item.quantity
                variant.save()

                # Crear registro de movimiento de inventario
                StockMovement.objects.create(
                    product_variant=variant,
                    movement_type='out',
                    quantity=cart_item.quantity,
                    reference=f'ORDER-{order.order_number}',
                    notes=f'Venta - Pago simulado ID: {simulated_payment_id}',
                    created_by=user
                )
                print(f"[SIMULATE_PAYMENT] Inventory updated: {variant} - {cart_item.quantity} units deducted (remaining: {variant.stock_quantity})")
            else:
                print(f"[SIMULATE_PAYMENT] WARNING: Insufficient stock for {variant}. Requested: {cart_item.quantity}, Available: {variant.stock_quantity}")
                # En un sistema real, esto debería manejar el error de stock insuficiente

        # Crear registro de pago
        Payment.objects.create(
            order=order,
            user=user,
            method='mercadopago',
            status='completed',
            amount=cart.total_price,
            transaction_id=simulated_payment_id,
            gateway_response={'simulated': True, 'order_id': order.id},
            processed_at=timezone.now()
        )

        # Vaciar carrito
        cart.items.all().delete()

        print(f"[SIMULATE_PAYMENT] Simulated payment completed. Order {order.order_number} created, cart cleared for user {user.id}")

        return Response({
            'success': True,
            'simulated': True,
            'payment_id': simulated_payment_id,
            'order_id': order.id,
            'order_number': order.order_number,
            'total_amount': float(order.total_amount),
            'message': 'Pago simulado completado exitosamente'
        })

    except Exception as e:
        print(f"[SIMULATE_PAYMENT] Error simulating payment: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@csrf_exempt
def mercadopago_webhook(request):
    """Webhook de notificaciones de MercadoPago"""
    try:
        print(f"[WEBHOOK] MercadoPago webhook received: {request.method}")

        if request.method == 'POST':
            # Obtener datos del webhook
            topic = request.GET.get('topic')
            resource_id = request.GET.get('id')

            print(f"[WEBHOOK] Topic: {topic}, Resource ID: {resource_id}")

            if topic == 'payment' and resource_id:
                # Obtener información del pago desde MercadoPago
                mp_service = MercadoPagoService()
                payment_info = mp_service.get_payment(resource_id)

                print(f"[WEBHOOK] Payment info: {payment_info}")

                if payment_info['success']:
                    payment_data = payment_info['payment']
                    external_reference = payment_data.get('external_reference')

                    print(f"[WEBHOOK] Processing payment with reference: {external_reference}")

                    if external_reference and payment_data['status'] == 'approved':
                        # El external_reference tiene formato ORDER-{user_id}-{timestamp}
                        if external_reference.startswith('ORDER-'):
                            try:
                                user_id = external_reference.split('-')[1]

                                # Buscar el usuario y su carrito
                                from django.contrib.auth import get_user_model
                                from apps.orders.models import Cart, Order, OrderItem

                                User = get_user_model()
                                user = User.objects.get(id=user_id)
                                cart = Cart.objects.filter(user=user).first()

                                if cart and cart.items.exists():
                                    print(f"[WEBHOOK] Creating order for user {user_id}")

                                    # Crear la orden
                                    order = Order.objects.create(
                                        user=user,
                                        status='confirmed',
                                        total_amount=cart.total_price,
                                        subtotal=cart.total_price,
                                        notes=f'MercadoPago - ID: {payment_data["id"]} - Ref: {external_reference}'
                                    )

                                    # Crear los items de la orden
                                    for cart_item in cart.items.all():
                                        OrderItem.objects.create(
                                            order=order,
                                            product_variant=cart_item.product_variant,
                                            quantity=cart_item.quantity,
                                            unit_price=cart_item.product_variant.final_price
                                        )

                                    # Crear registro de pago
                                    Payment.objects.create(
                                        order=order,
                                        user=user,
                                        method='mercadopago',
                                        amount=order.total_amount,
                                        status='completed',
                                        processed_at=timezone.now(),
                                        transaction_id=str(payment_data['id'])
                                    )

                                    # ¡IMPORTANTE! Limpiar el carrito
                                    cart.items.all().delete()

                                    print(f"[WEBHOOK] Order {order.id} created and cart cleared for user {user_id}")

                            except Exception as e:
                                print(f"[WEBHOOK] Error processing order: {str(e)}")
                                logger.error(f"Error processing MercadoPago webhook order: {str(e)}")

        return HttpResponse(status=200)

    except Exception as e:
        print(f"[WEBHOOK] Exception in webhook: {str(e)}")
        logger.error(f"Error in MercadoPago webhook: {str(e)}")
        return HttpResponse(status=400)

