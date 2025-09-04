from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from .models import StockMovement, Supplier, PurchaseOrder, PurchaseOrderItem
from .serializers import (
    StockMovementSerializer,
    SupplierSerializer,
    PurchaseOrderListSerializer,
    PurchaseOrderDetailSerializer,
    PurchaseOrderCreateSerializer
)


class StockMovementViewSet(viewsets.ModelViewSet):
    serializer_class = StockMovementSerializer
    permission_classes = [permissions.IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['movement_type', 'product_variant']
    ordering_fields = ['created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        return StockMovement.objects.all()

    def perform_create(self, serializer):
        movement = serializer.save(created_by=self.request.user)
        
        variant = movement.product_variant
        if movement.movement_type == 'in':
            variant.stock_quantity += movement.quantity
        elif movement.movement_type == 'out':
            variant.stock_quantity = max(0, variant.stock_quantity - movement.quantity)
        elif movement.movement_type == 'adjustment':
            variant.stock_quantity = max(0, movement.quantity)
        elif movement.movement_type == 'return':
            variant.stock_quantity += movement.quantity
        
        variant.save()


class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.filter(is_active=True)
    serializer_class = SupplierSerializer
    permission_classes = [permissions.IsAdminUser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'email', 'contact_person']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        supplier = self.get_object()
        supplier.is_active = False
        supplier.save()
        return Response({'message': 'Proveedor desactivado'})

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        supplier = self.get_object()
        supplier.is_active = True
        supplier.save()
        return Response({'message': 'Proveedor activado'})


class PurchaseOrderViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'supplier']
    ordering_fields = ['ordered_date', 'expected_delivery']
    ordering = ['-ordered_date']

    def get_queryset(self):
        return PurchaseOrder.objects.all()

    def get_serializer_class(self):
        if self.action == 'list':
            return PurchaseOrderListSerializer
        elif self.action == 'create':
            return PurchaseOrderCreateSerializer
        return PurchaseOrderDetailSerializer

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        purchase_order = self.get_object()
        new_status = request.data.get('status')
        
        if new_status in dict(PurchaseOrder.STATUS_CHOICES):
            purchase_order.status = new_status
            purchase_order.save()
            
            if new_status == 'received':
                from django.utils import timezone
                purchase_order.received_date = timezone.now()
                purchase_order.save()
                
                for item in purchase_order.items.all():
                    if item.quantity_received > 0:
                        StockMovement.objects.create(
                            product_variant=item.product_variant,
                            movement_type='in',
                            quantity=item.quantity_received,
                            reference=f"PO {purchase_order.order_number}",
                            notes=f"Recepción de orden de compra",
                            created_by=request.user
                        )
                        
                        variant = item.product_variant
                        variant.stock_quantity += item.quantity_received
                        variant.save()
            
            serializer = self.get_serializer(purchase_order)
            return Response(serializer.data)
        
        return Response(
            {'error': 'Estado inválido'},
            status=status.HTTP_400_BAD_REQUEST
        )

    @action(detail=True, methods=['patch'])
    def receive_items(self, request, pk=None):
        purchase_order = self.get_object()
        items_data = request.data.get('items', [])
        
        for item_data in items_data:
            item_id = item_data.get('id')
            quantity_received = item_data.get('quantity_received', 0)
            
            try:
                item = PurchaseOrderItem.objects.get(
                    id=item_id, 
                    purchase_order=purchase_order
                )
                
                if quantity_received <= item.quantity_ordered:
                    item.quantity_received = quantity_received
                    item.save()
                    
                    if quantity_received > 0:
                        StockMovement.objects.create(
                            product_variant=item.product_variant,
                            movement_type='in',
                            quantity=quantity_received,
                            reference=f"PO {purchase_order.order_number}",
                            notes=f"Recepción parcial de orden de compra",
                            created_by=request.user
                        )
                        
                        variant = item.product_variant
                        variant.stock_quantity += quantity_received
                        variant.save()
                        
            except PurchaseOrderItem.DoesNotExist:
                continue
        
        all_received = all(
            item.quantity_received == item.quantity_ordered 
            for item in purchase_order.items.all()
        )
        
        if all_received:
            purchase_order.status = 'received'
            from django.utils import timezone
            purchase_order.received_date = timezone.now()
            purchase_order.save()
        
        serializer = self.get_serializer(purchase_order)
        return Response(serializer.data)