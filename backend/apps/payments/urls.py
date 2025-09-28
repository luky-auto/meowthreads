from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PaymentViewSet,
    PaymentMethodViewSet,
    # create_card_token,
    # process_card_payment,
    # create_pse_payment,
    # get_pse_banks,
    # get_epayco_config,
    # epayco_confirmation,
    # epayco_response,
    create_mercadopago_payment,
    create_mercadopago_preference,
    get_mercadopago_config,
    mercadopago_webhook,
    check_payment_status,
    simulate_payment,
    test_mercadopago_api,
    test_mercadopago_preference
)

router = DefaultRouter()
router.register(r'payments', PaymentViewSet, basename='payment')
router.register(r'payment-methods', PaymentMethodViewSet, basename='paymentmethod')

urlpatterns = [
    path('', include(router.urls)),

    # MercadoPago endpoints
    path('mercadopago/config/', get_mercadopago_config, name='mercadopago-config'),
    path('mercadopago/payment/', create_mercadopago_payment, name='mercadopago-payment'),
    path('mercadopago/preference/', create_mercadopago_preference, name='mercadopago-preference'),
    path('mercadopago/webhook/', mercadopago_webhook, name='mercadopago-webhook'),
    path('mercadopago/check-payment/<str:payment_id>/', check_payment_status, name='mercadopago-check-payment'),
    path('mercadopago/simulate-payment/', simulate_payment, name='mercadopago-simulate-payment'),
    path('mercadopago/test/', test_mercadopago_api, name='mercadopago-test'),
    path('mercadopago/test-preference/', test_mercadopago_preference, name='mercadopago-test-preference'),
]