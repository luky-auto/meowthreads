from rest_framework import serializers
from .models import StockMovement, Supplier, PurchaseOrder, PurchaseOrderItem


class StockMovementSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product_variant.product.name', read_only=True)
    product_size = serializers.CharField(source='product_variant.size', read_only=True)
    product_color = serializers.CharField(source='product_variant.color', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = StockMovement
        fields = ('id', 'product_variant', 'product_name', 'product_size', 
                 'product_color', 'movement_type', 'quantity', 'reference', 
                 'notes', 'created_by', 'created_by_name', 'created_at')
        read_only_fields = ('id', 'created_by', 'created_at')

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class SupplierSerializer(serializers.ModelSerializer):
    orders_count = serializers.SerializerMethodField()

    class Meta:
        model = Supplier
        fields = ('id', 'name', 'email', 'phone', 'address', 'contact_person', 
                 'is_active', 'orders_count', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_orders_count(self, obj):
        return obj.purchase_orders.count()


class PurchaseOrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product_variant.product.name', read_only=True)
    product_size = serializers.CharField(source='product_variant.size', read_only=True)
    product_color = serializers.CharField(source='product_variant.color', read_only=True)

    class Meta:
        model = PurchaseOrderItem
        fields = ('id', 'product_variant', 'product_name', 'product_size', 
                 'product_color', 'quantity_ordered', 'quantity_received', 
                 'unit_cost', 'total_cost')
        read_only_fields = ('id', 'total_cost')


class PurchaseOrderListSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    items_count = serializers.SerializerMethodField()

    class Meta:
        model = PurchaseOrder
        fields = ('id', 'order_number', 'supplier', 'supplier_name', 'status', 
                 'total_amount', 'items_count', 'ordered_date', 'expected_delivery')

    def get_items_count(self, obj):
        return obj.items.count()


class PurchaseOrderDetailSerializer(serializers.ModelSerializer):
    supplier = SupplierSerializer(read_only=True)
    items = PurchaseOrderItemSerializer(many=True, read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = PurchaseOrder
        fields = ('id', 'order_number', 'supplier', 'status', 'total_amount', 
                 'notes', 'ordered_date', 'expected_delivery', 'received_date', 
                 'created_by', 'created_by_name', 'items', 'created_at', 'updated_at')
        read_only_fields = ('id', 'order_number', 'created_by', 'created_at', 'updated_at')


class PurchaseOrderCreateSerializer(serializers.ModelSerializer):
    items = PurchaseOrderItemSerializer(many=True)

    class Meta:
        model = PurchaseOrder
        fields = ('supplier', 'notes', 'expected_delivery', 'items')

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        validated_data['created_by'] = self.context['request'].user
        
        total_amount = sum(
            item['quantity_ordered'] * item['unit_cost'] 
            for item in items_data
        )
        validated_data['total_amount'] = total_amount
        
        purchase_order = super().create(validated_data)
        
        for item_data in items_data:
            PurchaseOrderItem.objects.create(
                purchase_order=purchase_order,
                **item_data
            )
        
        return purchase_order