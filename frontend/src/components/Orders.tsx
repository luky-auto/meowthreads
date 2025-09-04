import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Order } from '../api/types';
import apiClient from '../api/api';
import { useAuth } from '../contexts/AuthContext';
import { Package, Calendar, MapPin, CheckCircle, Clock, Truck, XCircle } from 'lucide-react';

const getStatusIcon = (status: Order['status']) => {
  switch (status) {
    case 'pending':
      return <Clock size={16} className="text-yellow-600" />;
    case 'confirmed':
      return <CheckCircle size={16} className="text-blue-600" />;
    case 'processing':
      return <Package size={16} className="text-indigo-600" />;
    case 'shipped':
      return <Truck size={16} className="text-purple-600" />;
    case 'delivered':
      return <CheckCircle size={16} className="text-green-600" />;
    case 'cancelled':
      return <XCircle size={16} className="text-red-600" />;
    case 'refunded':
      return <XCircle size={16} className="text-gray-600" />;
    default:
      return <Clock size={16} className="text-gray-600" />;
  }
};

const getStatusColor = (status: Order['status']) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'confirmed':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'processing':
      return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    case 'shipped':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'delivered':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'cancelled':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'refunded':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatusText = (status: Order['status']) => {
  switch (status) {
    case 'pending':
      return 'Pendiente';
    case 'confirmed':
      return 'Confirmado';
    case 'processing':
      return 'Procesando';
    case 'shipped':
      return 'Enviado';
    case 'delivered':
      return 'Entregado';
    case 'cancelled':
      return 'Cancelado';
    case 'refunded':
      return 'Reembolsado';
    default:
      return 'Desconocido';
  }
};

const OrderCard = ({ order }: { order: Order }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white border border-meow-border rounded-xl p-6 shadow hover:shadow-md transition-shadow">
      {/* Order Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
        <div className="mb-2 md:mb-0">
          <h3 className="text-lg font-semibold text-meow-text">Pedido #{order.id}</h3>
          <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
            <Calendar size={14} />
            <span>{new Date(order.created_at).toLocaleDateString('es-ES')}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
            {getStatusIcon(order.status)}
            <span>{getStatusText(order.status)}</span>
          </div>
          
          <div className="text-right">
            <p className="text-lg font-bold text-meow-accent">${parseFloat(order.total_amount).toLocaleString()}</p>
            <p className="text-sm text-gray-600">{order.items.length} artículo{order.items.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      {/* Shipping Address */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-start gap-2">
          <MapPin size={16} className="text-gray-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-meow-text">Dirección de envío:</p>
            {order.shipping_address ? (
              <>
                <p className="text-sm text-gray-600">
                  {order.shipping_address.street_address}
                </p>
                <p className="text-sm text-gray-600">
                  {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}
                </p>
                <p className="text-sm text-gray-600">
                  {order.shipping_address.country}
                </p>
              </>
            ) : order.notes && order.notes.includes('Dirección:') ? (
              <p className="text-sm text-gray-600">
                {order.notes.split('. Pago:')[0].replace('Dirección: ', '')}
              </p>
            ) : (
              <p className="text-sm text-gray-600">
                Información no disponible
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Toggle Details Button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-meow-accent hover:text-meow-accent/80 text-sm font-medium mb-4"
      >
        {expanded ? 'Ocultar detalles' : 'Ver detalles'} {expanded ? '↑' : '↓'}
      </button>

      {/* Order Items (Expandable) */}
      {expanded && (
        <div className="border-t border-gray-200 pt-4">
          <h4 className="font-medium text-meow-text mb-3">Artículos del pedido:</h4>
          <div className="space-y-3">
            {order.items.map((item, index) => (
              <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0">
                  {item.product_image ? (
                    <img 
                      src={item.product_image} 
                      alt={item.product_name}
                      className="w-full h-full object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.src = "/images/placeholder.webp";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 rounded-lg flex items-center justify-center">
                      <Package size={16} className="text-gray-500" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-meow-text truncate">
                    {item.product_name}
                  </p>
                  <p className="text-xs text-gray-600">
                    Talla: {item.product_size}
                    {item.product_color && ` • Color: ${item.product_color}`}
                  </p>
                </div>
                
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-medium text-meow-text">
                    {item.quantity} × ${parseFloat(item.unit_price).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-600">
                    Subtotal: ${parseFloat(item.subtotal).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      loadOrders();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getOrders();
      setOrders(response.results);
    } catch (error) {
      console.error('Error loading orders:', error);
      setError('Error al cargar los pedidos');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-meow-background min-h-screen text-meow-text">
        <div className="py-10 px-4 max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-medium text-meow-text mb-4">Inicia sesión para ver tus pedidos</h2>
            <p className="text-gray-600 mb-6">Necesitas una cuenta para ver el historial de tus pedidos.</p>
            <Link 
              to="/login"
              className="inline-flex items-center gap-2 bg-meow-accent text-white px-6 py-3 rounded-xl hover:bg-meow-accent/90 transition font-medium"
            >
              Iniciar sesión
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-meow-background min-h-screen text-meow-text">
      <div className="py-10 px-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Package size={28} className="text-meow-accent" />
          <h1 className="text-3xl font-bold text-meow-text">Mis Pedidos</h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-meow-accent"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-2xl font-medium text-meow-text mb-4">No tienes pedidos aún</h2>
            <p className="text-gray-600 mb-6">¡Comienza a comprar y tus pedidos aparecerán aquí!</p>
            <Link 
              to="/productos"
              className="inline-flex items-center gap-2 bg-meow-accent text-white px-6 py-3 rounded-xl hover:bg-meow-accent/90 transition font-medium"
            >
              <Package size={20} />
              Ver productos
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;