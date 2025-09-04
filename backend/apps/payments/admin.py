from django.contrib import admin
from .models import Payment, PaymentMethod


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['transaction_id', 'order', 'user', 'method', 'status', 'amount', 'created_at', 'processed_at']
    list_filter = ['status', 'method', 'created_at', 'processed_at']
    search_fields = ['transaction_id', 'order__order_number', 'user__email']
    readonly_fields = ['transaction_id', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Información del pago', {
            'fields': ('order', 'user', 'method', 'status')
        }),
        ('Detalles financieros', {
            'fields': ('amount', 'transaction_id')
        }),
        ('Respuesta del gateway', {
            'fields': ('gateway_response',),
            'classes': ('collapse',)
        }),
        ('Fechas', {
            'fields': ('created_at', 'updated_at', 'processed_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('order', 'user')


@admin.register(PaymentMethod)
class PaymentMethodAdmin(admin.ModelAdmin):
    list_display = ['user', 'card_type', 'last_four_digits', 'expiry_display', 'cardholder_name', 'is_default', 'is_active']
    list_filter = ['card_type', 'is_default', 'is_active', 'created_at']
    search_fields = ['user__email', 'cardholder_name', 'last_four_digits']
    readonly_fields = ['created_at', 'updated_at']
    
    def expiry_display(self, obj):
        return f"{obj.expiry_month:02d}/{obj.expiry_year}"
    expiry_display.short_description = 'Expiry'
    
    fieldsets = (
        ('Usuario', {
            'fields': ('user',)
        }),
        ('Información de la tarjeta', {
            'fields': ('card_type', 'last_four_digits', 'expiry_month', 'expiry_year', 'cardholder_name')
        }),
        ('Configuración', {
            'fields': ('is_default', 'is_active')
        }),
        ('Fechas', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )