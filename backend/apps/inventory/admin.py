from django.contrib import admin
from .models import StockMovement, Supplier, PurchaseOrder, PurchaseOrderItem


@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = ['product_variant', 'movement_type', 'quantity', 'reference', 'created_by', 'created_at']
    list_filter = ['movement_type', 'created_at', 'product_variant__product__category']
    search_fields = ['product_variant__product__name', 'reference', 'notes']
    readonly_fields = ['created_at']
    
    fieldsets = (
        ('Información del movimiento', {
            'fields': ('product_variant', 'movement_type', 'quantity')
        }),
        ('Detalles', {
            'fields': ('reference', 'notes', 'created_by')
        }),
        ('Fecha', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'product_variant__product',
            'created_by'
        )


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'phone', 'contact_person', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'email', 'contact_person']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Información básica', {
            'fields': ('name', 'email', 'phone')
        }),
        ('Contacto', {
            'fields': ('contact_person', 'address')
        }),
        ('Estado', {
            'fields': ('is_active',)
        }),
        ('Fechas', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


class PurchaseOrderItemInline(admin.TabularInline):
    model = PurchaseOrderItem
    extra = 0
    fields = ['product_variant', 'quantity_ordered', 'quantity_received', 'unit_cost', 'total_cost']
    readonly_fields = ['total_cost']


@admin.register(PurchaseOrder)
class PurchaseOrderAdmin(admin.ModelAdmin):
    list_display = ['order_number', 'supplier', 'status', 'total_amount', 'ordered_date', 'expected_delivery', 'created_by']
    list_filter = ['status', 'ordered_date', 'expected_delivery']
    search_fields = ['order_number', 'supplier__name', 'notes']
    readonly_fields = ['order_number', 'ordered_date', 'created_at', 'updated_at']
    inlines = [PurchaseOrderItemInline]
    
    fieldsets = (
        ('Información del pedido', {
            'fields': ('order_number', 'supplier', 'status', 'created_by')
        }),
        ('Fechas', {
            'fields': ('ordered_date', 'expected_delivery', 'received_date')
        }),
        ('Montos', {
            'fields': ('total_amount',)
        }),
        ('Notas', {
            'fields': ('notes',)
        }),
        ('Control', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('supplier', 'created_by')


@admin.register(PurchaseOrderItem)
class PurchaseOrderItemAdmin(admin.ModelAdmin):
    list_display = ['purchase_order', 'product_variant', 'quantity_ordered', 'quantity_received', 'unit_cost', 'total_cost']
    list_filter = ['purchase_order__status', 'purchase_order__ordered_date']
    search_fields = ['purchase_order__order_number', 'product_variant__product__name']
    readonly_fields = ['total_cost']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'purchase_order__supplier',
            'product_variant__product'
        )