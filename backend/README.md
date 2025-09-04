# MeowThreads Backend

Django REST API backend para la aplicación de e-commerce MeowThreads.

## Tecnologías

- **Django 5.1.5** - Framework web
- **Django REST Framework 3.15.2** - API REST
- **PostgreSQL** - Base de datos
- **JWT Authentication** - Autenticación
- **CORS Headers** - Cross-Origin Resource Sharing

## Estructura del Proyecto

```
backend/
├── config/           # Configuración principal de Django
├── apps/            # Aplicaciones modulares
│   ├── authentication/  # Autenticación JWT
│   ├── customers/       # Gestión de usuarios y direcciones
│   ├── catalog/         # Catálogo de productos y categorías
│   ├── orders/          # Carritos y órdenes
│   ├── payments/        # Procesamiento de pagos
│   └── inventory/       # Gestión de inventario
├── requirements.txt
└── manage.py
```

## Instalación

1. **Crear entorno virtual:**
```bash
python -m venv venv
venv\Scripts\activate  # Windows
# o
source venv/bin/activate  # macOS/Linux, cuando se suba el server de pruebas, virtual box
```

2. **Instalar dependencias:**
```bash
pip install -r requirements.txt
```

3. **Configurar variables de entorno:**
```bash
cp .env .env
```

4. **Configurar PostgreSQL:**
- Crear base de datos `meowthreads`
- Actualizar credenciales en `.env`

5. **Ejecutar migraciones:**
```bash
python manage.py makemigrations
python manage.py migrate
```

6. **Crear superusuario:**
```bash
python manage.py createsuperuser
```

7. **Ejecutar servidor:**
```bash
python manage.py runserver
```

## API Endpoints
# Se han agregado mas endpoints, se debe verificar para actualizar, pendiente
### Autenticación (`/api/auth/`)
- `POST /login/` - Iniciar sesión
- `POST /register/` - Registrar usuario
- `POST /logout/` - Cerrar sesión
- `POST /token/` - Obtener token JWT
- `POST /token/refresh/` - Refrescar token

### Catálogo (`/api/catalog/`)
- `GET /categories/` - Listar categorías
- `GET /products/` - Listar productos
- `GET /products/featured/` - Productos destacados
- `GET /products/{id}/` - Detalle de producto

### Órdenes (`/api/orders/`)
- `GET /cart/current/` - Carrito actual
- `POST /cart-items/` - Agregar al carrito
- `GET /orders/` - Listar órdenes
- `POST /orders/` - Crear orden

### Pagos (`/api/payments/`)
- `GET /payment-methods/` - Métodos de pago
- `POST /payments/process_payment/` - Procesar pago

### Admin - Inventario (`/api/inventory/`)
- `GET /stock-movements/` - Movimientos de stock
- `GET /suppliers/` - Proveedores
- `GET /purchase-orders/` - Órdenes de compra

## Modelos Principales

### Usuario (customers.User)
- Extiende AbstractUser
- Campos adicionales: teléfono, verificación

### Producto (catalog.Product)
- Información básica del producto
- Relación con categorías
- Variantes por talla/color

### Orden (orders.Order), # Se actualiza de acuerdo al admin, ya que se deberia integrar con un modulo de envios.
- Estados: pendiente, confirmado, enviado, entregado
- Cálculo automático de totales
- Generación de número de orden

### Pago (payments.Payment) # Modulo pendiente por desarrollar
- Múltiples métodos de pago
- Integración con gateways
- Estados de transacción

## Configuración CORS

El backend está configurado para aceptar requests desde:
- `http://localhost:5173` (Vite dev server)
- `http://localhost:3000` (React dev server)

## Permisos

- **Público**: Visualizar productos y categorías
- **Autenticado**: Carrito, órdenes, perfil
- **Admin**: Gestión completa de inventario y órdenes

## Desarrollo

Desarrolloo local,
1. Asegurar que PostgreSQL esté ejecutándose
2. Activar entorno virtual
3. Ejecutar `python manage.py runserver`
4. API disponible en `http://localhost:8000/api/`

## Comandos Útiles

```bash
# Hacer migraciones
python manage.py makemigrations

# Aplicar migraciones
python manage.py migrate

# Crear superusuario
python manage.py createsuperuser

# Ejecutar tests
python manage.py test

# Recopilar archivos estáticos
python manage.py collectstatic
```