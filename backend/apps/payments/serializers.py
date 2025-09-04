from rest_framework import serializers
from .models import Payment, PaymentMethod


class PaymentMethodSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentMethod
        fields = ('id', 'card_type', 'last_four_digits', 'expiry_month', 
                 'expiry_year', 'cardholder_name', 'is_default', 'is_active', 
                 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class PaymentSerializer(serializers.ModelSerializer):
    order_number = serializers.CharField(source='order.order_number', read_only=True)

    class Meta:
        model = Payment
        fields = ('id', 'order', 'order_number', 'method', 'status', 'amount', 
                 'transaction_id', 'created_at', 'updated_at', 'processed_at')
        read_only_fields = ('id', 'transaction_id', 'gateway_response', 
                           'created_at', 'updated_at', 'processed_at')

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class PaymentProcessSerializer(serializers.Serializer):
    order_id = serializers.IntegerField()
    payment_method = serializers.ChoiceField(choices=Payment.METHOD_CHOICES)
    payment_method_id = serializers.IntegerField(required=False)
    
    def validate_order_id(self, value):
        from apps.orders.models import Order
        try:
            order = Order.objects.get(id=value, user=self.context['request'].user)
            if order.status != 'pending':
                raise serializers.ValidationError("Esta orden ya no puede ser procesada.")
            return value
        except Order.DoesNotExist:
            raise serializers.ValidationError("Orden no encontrada.")

    def validate(self, attrs):
        if attrs['payment_method'] in ['credit_card', 'debit_card']:
            if not attrs.get('payment_method_id'):
                raise serializers.ValidationError(
                    "Se requiere un método de pago para tarjetas."
                )
        return attrs