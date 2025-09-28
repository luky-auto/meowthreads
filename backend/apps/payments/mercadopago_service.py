import mercadopago
import logging
from decimal import Decimal
from django.conf import settings
from django.contrib.auth import get_user_model

logger = logging.getLogger(__name__)
User = get_user_model()

class MercadoPagoService:
    """Servicio para manejar pagos con MercadoPago"""

    def __init__(self):
        self.access_token = settings.MERCADOPAGO_ACCESS_TOKEN
        self.public_key = settings.MERCADOPAGO_PUBLIC_KEY
        self.test_mode = settings.MERCADOPAGO_TEST_MODE

        # Inicializar SDK
        self.sdk = mercadopago.SDK(self.access_token)

    def create_checkout_preference(self, order_data):
        """
        Crear preferencia de pago para Checkout Pro

        Args:
            order_data (dict): Datos de la orden

        Returns:
            dict: Resultado de la preferencia
        """
        try:
            print(f"[SIMPLIFIED_CHECKOUT_PRO] Creating preference with data: {order_data}")

            # Validar que tenemos items
            items = order_data.get('items', [])
            if not items:
                print(f"[CHECKOUT_PRO] Error: No items provided")
                return {
                    'success': False,
                    'error': 'No hay productos en el carrito'
                }

            # Configuración mínima y optimizada para MercadoPago Colombia
            preference_request = {
                "items": [
                    {
                        "id": str(item.get('id', 'MEOW001')),
                        "title": item.get('title', 'Producto MeowThreads')[:60],  # MercadoPago limita a 60 chars
                        "description": item.get('description', 'Producto de MeowThreads')[:250],  # Límite de 250 chars
                        "category_id": "fashion",
                        "unit_price": float(item.get('unit_price', order_data.get('amount', 1000))),
                        "quantity": int(item.get('quantity', 1)),
                        "currency_id": "COP"
                    } for item in items
                ],
                "payer": {
                    "email": order_data.get('payer_email', 'test@meowthreads.com'),
                    "name": order_data.get('first_name', 'Test')[:30],  # Límite de caracteres
                    "surname": order_data.get('last_name', 'User')[:30]  # Límite de caracteres
                },
                "back_urls": {
                    "success": f"{settings.FRONTEND_BASE_URL}/payment/success",
                    "failure": f"{settings.FRONTEND_BASE_URL}/payment/failure",
                    "pending": f"{settings.FRONTEND_BASE_URL}/payment/pending"
                },
                # "notification_url": f"{settings.BACKEND_BASE_URL}/api/payments/mercadopago/webhook/",  # Temporalmente deshabilitado
                "statement_descriptor": "MEOWTHREADS",
                "external_reference": order_data.get('external_reference', f'ORDER-{order_data.get("user_id", 1)}-TEST')[:256],  # Límite de 256 chars
                "binary_mode": False
            }

            print(f"[CHECKOUT_PRO] Preference request: {preference_request}")
            print(f"[CHECKOUT_PRO] Items in request: {preference_request.get('items', [])}")

            preference_response = self.sdk.preference().create(preference_request)
            print(f"[CHECKOUT_PRO] Raw preference response: {preference_response}")

            if preference_response["status"] == 201:
                preference = preference_response["response"]
                print(f"[CHECKOUT_PRO] Preference created successfully: {preference['id']}")

                # Usar sandbox_init_point si estamos en modo test
                init_point = preference['sandbox_init_point'] if self.test_mode else preference['init_point']
                print(f"[CHECKOUT_PRO] Test mode: {self.test_mode}, Using URL: {init_point}")

                return {
                    'success': True,
                    'preference_id': preference['id'],
                    'init_point': init_point,
                    'sandbox_init_point': preference['sandbox_init_point']
                }
            else:
                print(f"[CHECKOUT_PRO] Preference failed with status {preference_response['status']}")
                print(f"[CHECKOUT_PRO] Error details: {preference_response}")

                # Extraer mensaje de error más específico
                error_message = 'Error creando preferencia de pago'
                if 'response' in preference_response and preference_response['response']:
                    if 'message' in preference_response['response']:
                        error_message = preference_response['response']['message']
                    elif 'cause' in preference_response['response'] and preference_response['response']['cause']:
                        error_message = str(preference_response['response']['cause'])

                return {
                    'success': False,
                    'error': error_message,
                    'raw_response': preference_response
                }

        except Exception as e:
            print(f"[CHECKOUT_PRO] Exception creating preference: {str(e)}")
            logger.error(f"Error creating MercadoPago preference: {str(e)}")
            return {
                'success': False,
                'error': f'Error interno: {str(e)}',
                'exception_type': str(type(e))
            }

    def create_preference(self, preference_data):
        """
        Crear preferencia de pago (para Checkout Pro)

        Args:
            preference_data (dict): Datos de la preferencia

        Returns:
            dict: Resultado de la preferencia
        """
        try:
            preference_request = {
                "items": preference_data['items'],
                "payer": {
                    "email": preference_data['payer_email'],
                    "name": preference_data.get('payer_name'),
                    "surname": preference_data.get('payer_surname'),
                    "identification": {
                        "type": preference_data.get('identification_type', 'CC'),
                        "number": preference_data.get('identification_number')
                    }
                },
                "external_reference": preference_data.get('external_reference'),
                "back_urls": {
                    "success": preference_data.get('success_url'),
                    "failure": preference_data.get('failure_url'),
                    "pending": preference_data.get('pending_url')
                },
                "notification_url": preference_data.get('notification_url'),
                "statement_descriptor": "MeowThreads",
                "shipments": {
                    "receiver_address": {
                        "zip_code": preference_data.get('zip_code'),
                        "state_name": preference_data.get('state_name'),
                        "city_name": preference_data.get('city_name'),
                        "street_name": preference_data.get('street_name'),
                        "street_number": preference_data.get('street_number')
                    }
                }
            }

            preference_response = self.sdk.preference().create(preference_request)
            preference = preference_response["response"]

            if preference_response["status"] == 201:
                return {
                    'success': True,
                    'preference_id': preference['id'],
                    'init_point': preference['init_point'],
                    'sandbox_init_point': preference['sandbox_init_point']
                }
            else:
                logger.error(f"MercadoPago preference failed: {preference_response}")
                return {
                    'success': False,
                    'error': 'Error creando preferencia de pago'
                }

        except Exception as e:
            logger.error(f"Error creating MercadoPago preference: {str(e)}")
            return {
                'success': False,
                'error': 'Error interno al crear preferencia'
            }

    def get_payment(self, payment_id):
        """
        Obtener información de un pago

        Args:
            payment_id (str): ID del pago

        Returns:
            dict: Información del pago
        """
        try:
            payment_response = self.sdk.payment().get(payment_id)
            payment = payment_response["response"]

            if payment_response["status"] == 200:
                return {
                    'success': True,
                    'payment': {
                        'id': payment['id'],
                        'status': payment['status'],
                        'status_detail': payment['status_detail'],
                        'transaction_amount': payment['transaction_amount'],
                        'external_reference': payment.get('external_reference'),
                        'payment_method': payment['payment_method_id'],
                        'created_date': payment['date_created']
                    }
                }
            else:
                return {
                    'success': False,
                    'error': 'Pago no encontrado'
                }

        except Exception as e:
            logger.error(f"Error getting MercadoPago payment: {str(e)}")
            return {
                'success': False,
                'error': 'Error obteniendo información del pago'
            }

    def get_payment_methods(self):
        """
        Obtener métodos de pago disponibles

        Returns:
            dict: Lista de métodos de pago
        """
        try:
            methods_response = self.sdk.payment_methods().list_all()

            if methods_response["status"] == 200:
                return {
                    'success': True,
                    'payment_methods': methods_response["response"]
                }
            else:
                return {
                    'success': False,
                    'error': 'Error obteniendo métodos de pago'
                }

        except Exception as e:
            logger.error(f"Error getting payment methods: {str(e)}")
            return {
                'success': False,
                'error': 'Error interno obteniendo métodos de pago'
            }

    @staticmethod
    def validate_webhook(request):
        """
        Validar webhook de MercadoPago

        Args:
            request: Django request object

        Returns:
            dict: Datos validados del webhook
        """
        try:
            # MercadoPago envía las notificaciones como POST
            if request.method == 'POST':
                # Obtener datos del webhook
                topic = request.GET.get('topic')
                resource_id = request.GET.get('id')

                if topic and resource_id:
                    return {
                        'valid': True,
                        'topic': topic,
                        'resource_id': resource_id
                    }

            return {'valid': False}

        except Exception as e:
            logger.error(f"Error validating MercadoPago webhook: {str(e)}")
            return {'valid': False}