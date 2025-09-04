from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SizeConfigurationViewSet, CategoryViewSet, ProductViewSet, ProductVariantViewSet, ProductImageViewSet, AdminProductViewSet

router = DefaultRouter()
router.register(r'sizes', SizeConfigurationViewSet, basename='size')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'admin/products', AdminProductViewSet, basename='admin-product')
router.register(r'variants', ProductVariantViewSet, basename='productvariant')
router.register(r'product-images', ProductImageViewSet, basename='productimage')

urlpatterns = [
    path('', include(router.urls)),
]