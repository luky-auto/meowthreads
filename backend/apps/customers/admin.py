from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Address


class AddressInline(admin.TabularInline):
    model = Address
    extra = 0
    fields = ['street_address', 'city', 'state', 'postal_code', 'country', 'is_default']


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'first_name', 'last_name', 'phone', 'is_verified', 'is_active', 'date_joined']
    list_filter = ['is_active', 'is_staff', 'is_verified', 'date_joined']
    search_fields = ['email', 'first_name', 'last_name', 'phone']
    ordering = ['-date_joined']
    inlines = [AddressInline]
    
    fieldsets = (
        ('Información personal', {
            'fields': ('email', 'password')
        }),
        ('Datos personales', {
            'fields': ('first_name', 'last_name', 'phone')
        }),
        ('Permisos', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'is_verified', 'groups', 'user_permissions'),
        }),
        ('Fechas importantes', {
            'fields': ('last_login', 'date_joined', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    add_fieldsets = (
        ('Crear usuario', {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'password1', 'password2'),
        }),
    )
    
    readonly_fields = ['date_joined', 'last_login', 'created_at', 'updated_at']


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ['user', 'street_address', 'city', 'state', 'country', 'is_default']
    list_filter = ['country', 'state', 'is_default', 'created_at']
    search_fields = ['user__email', 'user__first_name', 'user__last_name', 'street_address', 'city']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Usuario', {
            'fields': ('user',)
        }),
        ('Dirección', {
            'fields': ('street_address', 'city', 'state', 'postal_code', 'country')
        }),
        ('Configuración', {
            'fields': ('is_default',)
        }),
        ('Fechas', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )