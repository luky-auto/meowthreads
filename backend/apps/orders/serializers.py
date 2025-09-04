from rest_framework import serializers
from .models import Cart, CartItem, Order, OrderItem
from apps.catalog.serializers import ProductVariantSerializer


class CartItemSerializer(serializers.ModelSerializer):
    product_variant = ProductVariantSerializer(read_only=True)
    product_variant_id = serializers.IntegerField(write_only=True)
    subtotal = serializers.ReadOnlyField()
    product_name = serializers.CharField(source='product_variant.product.name', read_only=True)
    product_image = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = ('id', 'product_variant', 'product_variant_id', 'quantity', 
                 'subtotal', 'product_name', 'product_image', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_product_image(self, obj):
        main_image = obj.product_variant.product.main_image
        if main_image and main_image.image:
            request = self.context.get('request')
            if request:
                try:
                    return request.build_absolute_uri(main_image.image.url)
                except ValueError:
                    return None
        return None

    def create(self, validated_data):
        cart, created = Cart.objects.get_or_create(user=self.context['request'].user)
        validated_data['cart'] = cart
        return super().create(validated_data)

    def validate_product_variant_id(self, value):
        from apps.catalog.models import ProductVariant
        try:
            variant = ProductVariant.objects.get(id=value)
            if not variant.is_in_stock:
                raise serializers.ValidationError("Producto fuera de stock.")
            return value
        except ProductVariant.DoesNotExist:
            raise serializers.ValidationError("Variante de producto no encontrada.")


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_items = serializers.ReadOnlyField()
    total_price = serializers.ReadOnlyField()

    class Meta:
        model = Cart
        fields = ('id', 'items', 'total_items', 'total_price', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product_variant.product.name', read_only=True)
    product_size = serializers.CharField(source='product_variant.size', read_only=True)
    product_color = serializers.CharField(source='product_variant.color', read_only=True)
    product_image = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = ('id', 'product_variant', 'product_name', 'product_size', 
                 'product_color', 'product_image', 'quantity', 'unit_price', 'subtotal')
        read_only_fields = ('id', 'subtotal')

    def get_product_image(self, obj):
        main_image = obj.product_variant.product.main_image
        if main_image and main_image.image:
            request = self.context.get('request')
            if request:
                try:
                    return request.build_absolute_uri(main_image.image.url)
                except ValueError:
                    return None
        return None


class OrderListSerializer(serializers.ModelSerializer):
    items_count = serializers.SerializerMethodField()
    items = OrderItemSerializer(many=True, read_only=True)
    shipping_address = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = ('id', 'order_number', 'status', 'shipping_address', 'subtotal', 
                 'shipping_cost', 'total_amount', 'items_count', 'items', 'notes', 'created_at')

    def get_items_count(self, obj):
        return obj.items.count()

    def get_shipping_address(self, obj):
        if obj.shipping_address:
            from apps.customers.serializers import AddressSerializer
            return AddressSerializer(obj.shipping_address).data
        return None


class OrderDetailSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    shipping_address = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = ('id', 'order_number', 'status', 'shipping_address', 'subtotal', 
                 'tax_amount', 'shipping_cost', 'total_amount', 'notes', 'items', 
                 'created_at', 'updated_at')

    def get_shipping_address(self, obj):
        if obj.shipping_address:
            from apps.customers.serializers import AddressSerializer
            return AddressSerializer(obj.shipping_address).data
        return None


class OrderCreateSerializer(serializers.ModelSerializer):
    shipping_address_id = serializers.IntegerField()

    class Meta:
        model = Order
        fields = ('shipping_address_id', 'notes')

    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['user'] = user
        
        try:
            cart = Cart.objects.get(user=user)
            if not cart.items.exists():
                raise serializers.ValidationError("El carrito está vacío.")
        except Cart.DoesNotExist:
            raise serializers.ValidationError("No se encontró el carrito.")

        from apps.customers.models import Address
        try:
            shipping_address = Address.objects.get(
                id=validated_data['shipping_address_id'], 
                user=user
            )
            validated_data['shipping_address'] = shipping_address
        except Address.DoesNotExist:
            raise serializers.ValidationError("Dirección de envío no válida.")

        validated_data.pop('shipping_address_id')
        
        subtotal = cart.total_price
        tax_amount = subtotal * 0.19
        shipping_cost = 15000 if subtotal < 100000 else 0
        total_amount = subtotal + tax_amount + shipping_cost

        validated_data.update({
            'subtotal': subtotal,
            'tax_amount': tax_amount,
            'shipping_cost': shipping_cost,
            'total_amount': total_amount,
        })

        order = super().create(validated_data)
        
        for cart_item in cart.items.all():
            OrderItem.objects.create(
                order=order,
                product_variant=cart_item.product_variant,
                quantity=cart_item.quantity,
                unit_price=cart_item.product_variant.final_price,
                subtotal=cart_item.subtotal
            )
        
        cart.items.all().delete()
        
        return order