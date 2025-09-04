from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from .models import SizeConfiguration, Category, Product, ProductImage, ProductVariant
from .serializers import (
    SizeConfigurationSerializer,
    CategorySerializer,
    ProductListSerializer,
    ProductDetailSerializer,
    ProductCreateUpdateSerializer,
    ProductImageSerializer,
    ProductVariantSerializer
)


class SizeConfigurationViewSet(viewsets.ModelViewSet):
    queryset = SizeConfiguration.objects.filter(is_active=True)
    serializer_class = SizeConfigurationSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['code', 'name', 'description']
    ordering_fields = ['sort_order', 'code', 'name', 'created_at']
    ordering = ['sort_order', 'code']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAdminUser]
        else:
            permission_classes = [permissions.AllowAny]
        return [permission() for permission in permission_classes]


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAdminUser]
        else:
            permission_classes = [permissions.AllowAny]
        return [permission() for permission in permission_classes]


class ProductViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'is_featured']
    search_fields = ['name', 'description', 'sku']
    ordering_fields = ['name', 'price', 'created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        if self.request.user.is_staff:
            return Product.objects.all()
        return Product.objects.filter(is_active=True)

    def get_serializer_class(self):
        if self.action == 'list':
            return ProductListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return ProductCreateUpdateSerializer
        return ProductDetailSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAdminUser]
        else:
            permission_classes = [permissions.AllowAny]
        return [permission() for permission in permission_classes]

    @action(detail=False, methods=['get'])
    def featured(self, request):
        featured_products = self.get_queryset().filter(is_featured=True)[:8]
        serializer = ProductListSerializer(featured_products, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def search(self, request):
        query = request.query_params.get('q', '')
        if query:
            products = self.get_queryset().filter(
                Q(name__icontains=query) | 
                Q(description__icontains=query) |
                Q(category__name__icontains=query)
            ).distinct()
            serializer = ProductListSerializer(products, many=True, context={'request': request})
            return Response(serializer.data)
        return Response([])

    @action(detail=True, methods=['get'])
    def variants(self, request, pk=None):
        product = self.get_object()
        variants = ProductVariant.objects.filter(product=product)
        serializer = ProductVariantSerializer(variants, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def images(self, request, pk=None):
        product = self.get_object()
        images = ProductImage.objects.filter(product=product)
        serializer = ProductImageSerializer(images, many=True, context={'request': request})
        return Response(serializer.data)


class ProductVariantViewSet(viewsets.ModelViewSet):
    serializer_class = ProductVariantSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        return ProductVariant.objects.all()

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAdminUser]
        else:
            permission_classes = [permissions.AllowAny]
        return [permission() for permission in permission_classes]


class ProductImageViewSet(viewsets.ModelViewSet):
    serializer_class = ProductImageSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        return ProductImage.objects.all()

    @action(detail=True, methods=['post'])
    def set_main(self, request, pk=None):
        image = self.get_object()
        ProductImage.objects.filter(product=image.product, is_main=True).update(is_main=False)
        image.is_main = True
        image.save()
        return Response({'message': 'Imagen establecida como principal'})


class AdminProductViewSet(viewsets.ModelViewSet):
    """
    ViewSet for admin users to manage products with additional statistics
    """
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'is_featured', 'is_active']
    search_fields = ['name', 'description', 'sku']
    ordering_fields = ['name', 'created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        # Only allow superusers or staff to access all products
        if not (self.request.user.is_superuser or self.request.user.is_staff):
            return Product.objects.none()
        return Product.objects.all()

    def get_serializer_class(self):
        if self.action == 'list':
            return ProductListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return ProductCreateUpdateSerializer
        return ProductDetailSerializer

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get product statistics"""
        total_products = Product.objects.count()
        active_products = Product.objects.filter(is_active=True).count()
        inactive_products = total_products - active_products
        featured_products = Product.objects.filter(is_featured=True).count()
        
        # Stock statistics
        variants = ProductVariant.objects.all()
        total_variants = variants.count()
        out_of_stock = variants.filter(stock_quantity=0).count()
        low_stock = variants.filter(stock_quantity__gt=0, stock_quantity__lte=5).count()
        
        return Response({
            'total_products': total_products,
            'active_products': active_products,
            'inactive_products': inactive_products,
            'featured_products': featured_products,
            'total_variants': total_variants,
            'out_of_stock': out_of_stock,
            'low_stock': low_stock,
        })

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Toggle product active status"""
        product = self.get_object()
        product.is_active = not product.is_active
        product.save()
        status_text = "activado" if product.is_active else "desactivado"
        return Response({'message': f'Producto {product.name} {status_text} exitosamente'})

    @action(detail=True, methods=['post'])
    def toggle_featured(self, request, pk=None):
        """Toggle product featured status"""
        product = self.get_object()
        product.is_featured = not product.is_featured
        product.save()
        status_text = "destacado" if product.is_featured else "no destacado"
        return Response({'message': f'Producto {product.name} marcado como {status_text}'})
    
    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """Get products with low stock"""
        low_stock_variants = ProductVariant.objects.filter(stock_quantity__lte=5)
        products_with_low_stock = Product.objects.filter(
            id__in=low_stock_variants.values_list('product_id', flat=True)
        ).distinct()
        serializer = ProductListSerializer(products_with_low_stock, many=True, context={'request': request})
        return Response(serializer.data)