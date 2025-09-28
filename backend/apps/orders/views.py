from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction
from .models import Cart, CartItem, Order, OrderItem
from .serializers import (
    CartSerializer,
    CartItemSerializer,
    OrderListSerializer,
    OrderDetailSerializer,
    OrderCreateSerializer
)


class CartViewSet(viewsets.ModelViewSet):
    serializer_class = CartSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Cart.objects.filter(user=self.request.user)

    @action(detail=False, methods=['get'])
    def current(self, request):
        cart, created = Cart.objects.get_or_create(user=request.user)
        serializer = self.get_serializer(cart)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def clear(self, request):
        cart, created = Cart.objects.get_or_create(user=request.user)
        cart.items.all().delete()
        return Response({'message': 'Carrito vaciado exitosamente'})


class CartItemViewSet(viewsets.ModelViewSet):
    serializer_class = CartItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        cart, created = Cart.objects.get_or_create(user=self.request.user)
        return CartItem.objects.filter(cart=cart)

    def create(self, request, *args, **kwargs):
        cart, created = Cart.objects.get_or_create(user=request.user)

        # Get the product_variant_id from request data (frontend sends 'product_variant')
        product_variant_id = request.data.get('product_variant')

        if product_variant_id:
            try:
                # Check if this product variant is already in the cart
                existing_item = CartItem.objects.get(
                    cart=cart,
                    product_variant_id=product_variant_id
                )
                # If it exists, update the quantity
                existing_item.quantity += int(request.data.get('quantity', 1))
                existing_item.save()
                serializer = self.get_serializer(existing_item)
                return Response(serializer.data, status=status.HTTP_200_OK)
            except CartItem.DoesNotExist:
                # If it doesn't exist, we'll create a new one
                pass

        # Create new cart item or handle the case where product_variant is None
        # We need to ensure the serializer gets the right field name
        mutable_data = request.data.copy()
        if 'product_variant' in mutable_data:
            mutable_data['product_variant_id'] = mutable_data.pop('product_variant')
        request._full_data = mutable_data

        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        """Override the standard update method to handle quantity updates"""
        item = self.get_object()
        quantity = request.data.get('quantity')

        # If only quantity is being updated
        if 'quantity' in request.data and len(request.data) == 1:
            if quantity and int(quantity) > 0:
                item.quantity = int(quantity)
                item.save()
                serializer = self.get_serializer(item)
                return Response(serializer.data)
            else:
                item.delete()
                return Response({'message': 'Producto eliminado del carrito'})

        # For other updates, use the default behavior
        return super().update(request, *args, **kwargs)

    @action(detail=True, methods=['patch'])
    def update_quantity(self, request, pk=None):
        item = self.get_object()
        quantity = request.data.get('quantity')

        if quantity and int(quantity) > 0:
            item.quantity = int(quantity)
            item.save()
            serializer = self.get_serializer(item)
            return Response(serializer.data)
        else:
            item.delete()
            return Response({'message': 'Producto eliminado del carrito'})


class OrderViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return Order.objects.all()
        return Order.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.action == 'list':
            return OrderListSerializer
        elif self.action == 'create':
            return OrderCreateSerializer
        return OrderDetailSerializer

    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAdminUser]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        if not request.user.is_staff:
            return Response(
                {'error': 'No tienes permisos para actualizar el estado de la orden'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        order = self.get_object()
        new_status = request.data.get('status')
        
        if new_status in dict(Order.STATUS_CHOICES):
            order.status = new_status
            order.save()
            serializer = self.get_serializer(order)
            return Response(serializer.data)
        
        return Response(
            {'error': 'Estado inválido'},
            status=status.HTTP_400_BAD_REQUEST
        )

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        order = self.get_object()
        
        if order.user != request.user and not request.user.is_staff:
            return Response(
                {'error': 'No tienes permisos para cancelar esta orden'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if order.status in ['pending', 'confirmed']:
            order.status = 'cancelled'
            order.save()
            return Response({'message': 'Orden cancelada exitosamente'})
        
        return Response(
            {'error': 'Esta orden no puede ser cancelada'},
            status=status.HTTP_400_BAD_REQUEST
        )

    @action(detail=False, methods=['post'])
    def process_checkout(self, request):
        """Process checkout from cart with shipping and payment info"""
        user = request.user
        
        # Get checkout data
        shipping_data = request.data.get('shipping_address', {})
        payment_data = request.data.get('payment_method', {})
        items_data = request.data.get('items', [])
        subtotal = request.data.get('subtotal', 0)
        discount = request.data.get('discount', 0)
        shipping_cost = request.data.get('shipping', 0)
        total = request.data.get('total', 0)
        
        if not items_data:
            return Response(
                {'error': 'No se encontraron productos en el pedido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            with transaction.atomic():
                # Create shipping address for the order
                from apps.customers.models import Address
                shipping_address = Address.objects.create(
                    user=user,
                    street_address=shipping_data.get('street_address', ''),
                    city=shipping_data.get('city', ''),
                    state=shipping_data.get('state', ''),
                    postal_code=shipping_data.get('postal_code', ''),
                    country=shipping_data.get('country', 'Colombia'),
                    is_default=False  # Checkout addresses are not default
                )
                
                # Create order with the real address
                order = Order.objects.create(
                    user=user,
                    shipping_address=shipping_address,
                    subtotal=subtotal,
                    shipping_cost=shipping_cost,
                    total_amount=total,
                    status='confirmed',
                    notes=f"Pago: {payment_data.get('type', '')} terminada en {payment_data.get('last_four', '')}"
                )
                
                # Create order items and update stock
                for item_data in items_data:
                    variant_id = item_data.get('product_variant_id')
                    quantity = item_data.get('quantity')
                    unit_price = item_data.get('unit_price')
                    
                    if not all([variant_id, quantity, unit_price]):
                        raise Exception("Datos de producto incompletos")
                    
                    # Get and validate stock
                    from apps.catalog.models import ProductVariant
                    try:
                        variant = ProductVariant.objects.select_for_update().get(id=variant_id)
                        if variant.stock_quantity < quantity:
                            raise Exception(f"Stock insuficiente para {variant.product.name} - {variant.size}")
                        
                        # Update stock
                        variant.stock_quantity -= quantity
                        variant.save()
                        
                        # Create order item
                        OrderItem.objects.create(
                            order=order,
                            product_variant=variant,
                            quantity=quantity,
                            unit_price=variant.final_price
                        )
                        
                    except ProductVariant.DoesNotExist:
                        raise Exception(f"Producto no encontrado: ID {variant_id}")
                
                # Clear cart
                try:
                    cart = Cart.objects.get(user=user)
                    cart.items.all().delete()
                except Cart.DoesNotExist:
                    pass
                
                # Return order details
                serializer = OrderDetailSerializer(order, context={'request': request})
                return Response({
                    'message': 'Pedido procesado exitosamente',
                    'order': serializer.data
                }, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )