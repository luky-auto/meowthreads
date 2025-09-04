from rest_framework import serializers
from .models import SizeConfiguration, Category, Product, ProductImage, ProductVariant


class SizeConfigurationSerializer(serializers.ModelSerializer):
    class Meta:
        model = SizeConfiguration
        fields = ('id', 'code', 'name', 'description', 'sort_order', 'is_active', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')


class CategorySerializer(serializers.ModelSerializer):
    products_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ('id', 'name', 'slug', 'description', 'image', 'is_active', 
                 'products_count', 'created_at', 'updated_at')
        read_only_fields = ('id', 'slug', 'created_at', 'updated_at')

    def get_products_count(self, obj):
        return obj.products.filter(is_active=True).count()


class ProductImageSerializer(serializers.ModelSerializer):
    # Add fields expected by frontend API
    is_primary = serializers.BooleanField(source='is_main', read_only=True)
    
    class Meta:
        model = ProductImage
        fields = ('id', 'product', 'image', 'alt_text', 'is_main', 'is_primary', 'order')
        read_only_fields = ('id',)


class ProductVariantSerializer(serializers.ModelSerializer):
    final_price = serializers.ReadOnlyField()
    is_in_stock = serializers.ReadOnlyField()
    # Add fields expected by frontend API
    stock = serializers.IntegerField(source='stock_quantity', read_only=True)
    price = serializers.SerializerMethodField()
    sku = serializers.SerializerMethodField()

    class Meta:
        model = ProductVariant
        fields = ('id', 'product', 'size', 'color', 'stock_quantity', 'price_adjustment', 
                 'final_price', 'is_in_stock', 'stock', 'price', 'sku')
        read_only_fields = ('id',)
    
    def get_price(self, obj):
        return str(obj.final_price)
    
    def get_sku(self, obj):
        return f"{obj.product.sku}-{obj.size}-{obj.color}"


class ProductListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    main_image = serializers.SerializerMethodField()
    available_sizes = serializers.ReadOnlyField()

    class Meta:
        model = Product
        fields = ('id', 'name', 'slug', 'price', 'category_name', 'main_image', 
                 'available_sizes', 'is_active', 'is_featured', 'created_at')

    def get_main_image(self, obj):
        main_image = obj.main_image
        if main_image and main_image.image:
            request = self.context.get('request')
            if request:
                try:
                    return request.build_absolute_uri(main_image.image.url)
                except ValueError:
                    return None
        return None


class ProductDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    available_sizes = serializers.ReadOnlyField()
    main_image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ('id', 'name', 'slug', 'description', 'category', 'price', 
                 'sku', 'images', 'variants', 'available_sizes', 'main_image',
                 'is_active', 'is_featured', 'created_at', 'updated_at')
        read_only_fields = ('id', 'slug', 'created_at', 'updated_at')
    
    def get_main_image(self, obj):
        main_image = obj.main_image
        if main_image and main_image.image:
            request = self.context.get('request')
            if request:
                try:
                    return request.build_absolute_uri(main_image.image.url)
                except ValueError:
                    return None
        return None


class ProductCreateUpdateSerializer(serializers.ModelSerializer):
    description = serializers.CharField(required=False, allow_blank=True)
    sku = serializers.CharField(required=False, allow_blank=True)
    
    class Meta:
        model = Product
        fields = ('id', 'name', 'description', 'category', 'price', 'sku', 
                 'is_active', 'is_featured')
        read_only_fields = ('id',)

    def validate_sku(self, value):
        if value and value.strip():
            # Check if SKU is unique when provided
            if self.instance:
                # Update - exclude current instance
                if Product.objects.filter(sku=value).exclude(id=self.instance.id).exists():
                    raise serializers.ValidationError("Este SKU ya está en uso.")
            else:
                # Create - check if exists
                if Product.objects.filter(sku=value).exists():
                    raise serializers.ValidationError("Este SKU ya está en uso.")
        return value

    def create(self, validated_data):
        # Handle empty strings
        if 'description' in validated_data and not validated_data['description'].strip():
            validated_data['description'] = ''
        if 'sku' in validated_data and not validated_data['sku'].strip():
            validated_data['sku'] = f"PROD-{validated_data['name'][:10].upper()}-{Product.objects.count() + 1:03d}"
        
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Handle empty strings
        if 'description' in validated_data and not validated_data['description'].strip():
            validated_data['description'] = instance.description  # Keep existing
        if 'sku' in validated_data and not validated_data['sku'].strip():
            validated_data['sku'] = instance.sku  # Keep existing
            
        return super().update(instance, validated_data)