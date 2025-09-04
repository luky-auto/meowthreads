from django.contrib import admin
from .models import Cart, CartItem, Order, OrderItem


class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0
    fields = ['product_variant', 'quantity', 'subtotal']
    readonly_fields = ['subtotal']


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ['user', 'total_items', 'total_price', 'created_at', 'updated_at']
    list_filter = ['created_at', 'updated_at']
    search_fields = ['user__email', 'user__first_name', 'user__last_name']
    readonly_fields = ['total_items', 'total_price', 'created_at', 'updated_at']
    inlines = [CartItemInline]
    
    def total_items(self, obj):
        return obj.total_items
    total_items.short_description = 'Total Items'
    
    def total_price(self, obj):
        return f"${obj.total_price:,.2f}"
    total_price.short_description = 'Total Price'


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ['cart', 'product_variant', 'quantity', 'subtotal', 'created_at']
    list_filter = ['created_at', 'updated_at']
    search_fields = ['cart__user__email', 'product_variant__product__name']
    readonly_fields = ['subtotal', 'created_at', 'updated_at']


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    fields = ['product_variant', 'quantity', 'unit_price', 'subtotal']
    readonly_fields = ['subtotal']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['order_number', 'user', 'status', 'total_amount', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['order_number', 'user__email', 'user__first_name', 'user__last_name']
    readonly_fields = ['order_number', 'created_at', 'updated_at']
    inlines = [OrderItemInline]
    
    fieldsets = (
        ('Información del pedido', {
            'fields': ('order_number', 'user', 'status')
        }),
        ('Dirección de envío', {
            'fields': ('shipping_address',)
        }),
        ('Montos', {
            'fields': ('subtotal', 'tax_amount', 'shipping_cost', 'total_amount')
        }),
        ('Notas', {
            'fields': ('notes',)
        }),
        ('Fechas', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'shipping_address')


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ['order', 'product_variant', 'quantity', 'unit_price', 'subtotal']
    list_filter = ['order__status', 'order__created_at']
    search_fields = ['order__order_number', 'product_variant__product__name']
    readonly_fields = ['subtotal']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('order', 'product_variant__product')