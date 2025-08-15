import { useState } from 'react';

interface OrderItem {
  id: number;
  name: string;
  size: string;
  quantity: number;
  price: string;
  image: string;
}

interface Order {
  id: string;
  date: string;
  status: 'Pendiente' | 'Enviado' | 'Entregado' | 'Cancelado';
  items: OrderItem[];
  total: string;
  shippingAddress: string;
}

// Datos de ejemplo de pedidos
const sampleOrders: Order[] = [
  {
    id: 'PED-2025-001',
    date: '2025-01-28',
    status: 'Enviado',
    total: '$305.000',
    shippingAddress: 'Calle 123 #45-67, Bogotá',
    items: [
      {
        id: 1,
        name: 'Camiseta Gatuna',
        size: 'M',
        quantity: 2,
        price: '$35.000',
        image: '/images/camiseta1.webp'
      },
      {
        id: 3,
        name: 'Saco Edición Limitada',
        size: 'L',
        quantity: 1,
        price: '$170.000',
        image: '/images/saco1.webp'
      },
      {
        id: 5,
        name: 'Medias Edición Limitada',
        size: 'M',
        quantity: 1,
        price: '$70.000',
        image: '/images/medias1.webp'
      }
    ]
  },
  {
    id: 'PED-2025-002',
    date: '2025-01-30',
    status: 'Pendiente',
    total: '$290.000',
    shippingAddress: 'Carrera 456 #78-90, Medellín',
    items: [
      {
        id: 2,
        name: 'Accesorio Gatuno',
        size: 'Único',
        quantity: 1,
        price: '$20.000',
        image: '/images/collar1.webp'
      },
      {
        id: 4,
        name: 'Pantalon Edición Limitada',
        size: '32',
        quantity: 1,
        price: '$270.000',
        image: '/images/pantalon1.webp'
      }
    ]
  },
  {
    id: 'PED-2025-003',
    date: '2025-02-01',
    status: 'Entregado',
    total: '$390.000',
    shippingAddress: 'Avenida 789 #12-34, Cali',
    items: [
      {
        id: 6,
        name: 'Zapatos Edición Limitada',
        size: '40',
        quantity: 1,
        price: '$370.000',
        image: '/images/zapatos1.webp'
      },
      {
        id: 2,
        name: 'Accesorio Gatuno',
        size: 'Único',
        quantity: 1,
        price: '$20.000',
        image: '/images/collar1.webp'
      }
    ]
  },
  {
    id: 'PED-2025-004',
    date: '2025-01-25',
    status: 'Cancelado',
    total: '$105.000',
    shippingAddress: 'Diagonal 321 #56-78, Barranquilla',
    items: [
      {
        id: 1,
        name: 'Camiseta Gatuna',
        size: 'S',
        quantity: 3,
        price: '$35.000',
        image: '/images/camiseta1.webp'
      }
    ]
  }
];

const OrderCard = ({ order }: { order: Order }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'Pendiente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Enviado':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Entregado':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Cancelado':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'Pendiente':
        return '⏳';
      case 'Enviado':
        return '🚚';
      case 'Entregado':
        return '✅';
      case 'Cancelado':
        return '❌';
      default:
        return '❓';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="border border-meow-border rounded-xl p-6 bg-meow-form shadow-md">
      {/* Encabezado del pedido */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-meow-text">
            Pedido #{order.id}
          </h3>
          <p className="text-sm text-gray-600">
            Fecha: {formatDate(order.date)}
          </p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
          {getStatusIcon(order.status)} {order.status}
        </div>
      </div>

      {/* Resumen del pedido */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-meow-text">
          <p className="font-medium">Total: <span className="text-meow-accent font-bold">{order.total}</span></p>
          <p className="text-sm text-gray-600">{totalItems} artículo{totalItems !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-meow-accent hover:text-meow-accent/80 font-medium text-sm"
        >
          {isExpanded ? 'Ocultar detalles ▲' : 'Ver detalles ▼'}
        </button>
      </div>

      {/* Detalles expandibles */}
      {isExpanded && (
        <div className="border-t border-meow-border pt-4">
          {/* Dirección de envío */}
          <div className="mb-4">
            <h4 className="font-medium text-meow-text mb-1">Dirección de envío:</h4>
            <p className="text-sm text-gray-600">{order.shippingAddress}</p>
          </div>

          {/* Items del pedido */}
          <div>
            <h4 className="font-medium text-meow-text mb-3">Detalle del pedido:</h4>
            <div className="space-y-3">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-12 h-12 object-cover rounded-md"
                  />
                  <div className="flex-1">
                    <h5 className="font-medium text-meow-text text-sm">{item.name}</h5>
                    <p className="text-xs text-gray-600">
                      Talla: {item.size} | Cantidad: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-meow-accent text-sm">{item.price}</p>
                    <p className="text-xs text-gray-600">c/u</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Información adicional según el estado */}
          {order.status === 'Enviado' && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                📦 Tu pedido está en camino. Tiempo estimado de entrega: 2-3 días hábiles.
              </p>
            </div>
          )}

          {order.status === 'Entregado' && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-800">
                🎉 ¡Pedido entregado exitosamente! Gracias por tu compra.
              </p>
            </div>
          )}

          {order.status === 'Cancelado' && (
            <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm text-red-800">
                ℹ️ Este pedido fue cancelado. Si tienes preguntas, contáctanos.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const Orders = () => {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrar pedidos
  const filteredOrders = sampleOrders.filter(order => {
    const matchesStatus = statusFilter === '' || order.status === statusFilter;
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  // Ordenar por fecha (más recientes primero)
  const sortedOrders = filteredOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="bg-meow-background min-h-screen text-meow-text">
      <div className="py-10 px-4 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-meow-text mb-6">Mis Pedidos</h1>

        {/* Filtros */}
        <div className="mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <input
            type="text"
            placeholder="Buscar por ID de pedido o producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-1/2 px-4 py-2 border border-meow-border rounded-md focus:outline-none focus:ring-2 focus:ring-meow-accent"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-1/4 px-4 py-2 border border-meow-border rounded-md focus:outline-none focus:ring-2 focus:ring-meow-accent"
          >
            <option value="">Todos los estados</option>
            <option value="Pendiente">Pendiente</option>
            <option value="Enviado">Enviado</option>
            <option value="Entregado">Entregado</option>
            <option value="Cancelado">Cancelado</option>
          </select>
        </div>

        {/* Contador de resultados */}
        <div className="mb-4">
          <p className="text-meow-text">
            {filteredOrders.length === sampleOrders.length 
              ? `Mostrando todos los ${sampleOrders.length} pedidos`
              : `Mostrando ${filteredOrders.length} de ${sampleOrders.length} pedidos`
            }
          </p>
        </div>

        {/* Lista de pedidos */}
        <div className="space-y-6">
          {sortedOrders.map(order => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>

        {/* Estado sin resultados */}
        {filteredOrders.length === 0 && (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-medium text-meow-text mb-2">No se encontraron pedidos</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter 
                ? 'Intenta ajustar los filtros de búsqueda.'
                : 'Aún no tienes pedidos realizados.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
