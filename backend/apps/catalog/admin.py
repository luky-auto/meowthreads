from django.contrib import admin
from .models import SizeConfiguration, Category, Product, ProductImage, ProductVariant


@admin.register(SizeConfiguration)
class SizeConfigurationAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'sort_order', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['code', 'name', 'description']
    ordering = ['sort_order', 'code']


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'description']
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ['created_at', 'updated_at']


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    fields = ['image', 'alt_text', 'is_main', 'order']


class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 1
    fields = ['size', 'color', 'stock_quantity', 'price_adjustment']


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'price', 'sku', 'is_active', 'is_featured', 'created_at']
    list_filter = ['category', 'is_active', 'is_featured', 'created_at']
    search_fields = ['name', 'description', 'sku']
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ['created_at', 'updated_at']
    inlines = [ProductImageInline, ProductVariantInline]
    
    fieldsets = (
        ('Información básica', {
            'fields': ('name', 'slug', 'description', 'category')
        }),
        ('Precio y SKU', {
            'fields': ('price', 'sku')
        }),
        ('Estado', {
            'fields': ('is_active', 'is_featured')
        }),
        ('Fechas', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ['product', 'alt_text', 'is_main', 'order', 'created_at']
    list_filter = ['is_main', 'created_at']
    search_fields = ['product__name', 'alt_text']
    list_editable = ['is_main', 'order']


@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    list_display = ['product', 'size', 'color', 'stock_quantity', 'price_adjustment', 'final_price', 'is_in_stock']
    list_filter = ['size', 'product__category', 'stock_quantity']
    search_fields = ['product__name', 'color']
    list_editable = ['stock_quantity', 'price_adjustment']
    
    def final_price(self, obj):
        return f"${obj.final_price:,.2f}"
    final_price.short_description = 'Precio Final'
    
    def is_in_stock(self, obj):
        return obj.is_in_stock
    is_in_stock.boolean = True
    is_in_stock.short_description = 'En Stock'