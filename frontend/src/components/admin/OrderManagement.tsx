import { useState, useEffect } from 'react'
import { ShoppingBag, Eye, Filter, Calendar, DollarSign, Package, Truck } from 'lucide-react'
import type { Order } from '../../api/types'
import apiClient from '../../api/api'

const OrderManagement = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.getOrders()
      setOrders(response.results || [])
    } catch (error) {
      console.error('Error loading orders:', error)
      setError('Error al cargar pedidos')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (orderId: number, newStatus: Order['status']) => {
    try {
      // Actualizar localmente primero para mejor UX
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      )
      
      // Llamar al API para actualizar en el backend
      await apiClient.updateOrderStatus(orderId, newStatus)
      
    } catch (error) {
      console.error('Error updating order status:', error)
      // Revertir el cambio local si falló
      await loadOrders()
      alert('Error al actualizar el estado del pedido')
    }
  }

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-indigo-100 text-indigo-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getStatusText = (status: string) => {
    const texts = {
      pending: 'Pendiente',
      confirmed: 'Confirmado', 
      processing: 'Procesando',
      shipped: 'Enviado',
      delivered: 'Entregado',
      cancelled: 'Cancelado',
      refunded: 'Reembolsado'
    }
    return texts[status as keyof typeof texts] || status
  }

  const getStatusIcon = (status: string) => {
    const icons = {
      pending: <Calendar size={16} />,
      confirmed: <Package size={16} />,
      processing: <Package size={16} className="animate-pulse" />,
      shipped: <Truck size={16} />,
      delivered: <ShoppingBag size={16} />,
      cancelled: <Package size={16} />,
      refunded: <DollarSign size={16} />
    }
    return icons[status as keyof typeof icons] || <Package size={16} />
  }

  const filteredOrders = orders.filter(order => {
    if (statusFilter === 'all') return true
    return order.status === statusFilter
  })

  const OrderModal = ({ order, onClose }: { order: Order, onClose: () => void }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Pedido {order.order_number}
            </h2>
            <p className="text-sm text-gray-600">
              {new Date(order.created_at).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status and Total */}
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
              {getStatusIcon(order.status)}
              <span>{getStatusText(order.status)}</span>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-800">
                ${parseFloat(order.total_amount).toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">
                {order.items.length} artículo{order.items.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Items */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Productos</h3>
            <div className="space-y-3">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                  <div className="flex-1">
                    <p className="font-medium">{item.product_name}</p>
                    <p className="text-sm text-gray-600">
                      Talla: {item.product_size}
                      {item.product_color && ` - Color: ${item.product_color}`}
                      {' '}• Cantidad: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${parseFloat(item.unit_price).toLocaleString()}</p>
                    <p className="text-sm text-gray-600">
                      Subtotal: ${parseFloat(item.subtotal).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Totals */}
          {(order.subtotal || order.shipping_cost) && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">Resumen de Pago</h3>
              <div className="space-y-2 text-sm">
                {order.subtotal && (
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${parseFloat(order.subtotal).toLocaleString()}</span>
                  </div>
                )}
                {order.shipping_cost && parseFloat(order.shipping_cost) > 0 && (
                  <div className="flex justify-between">
                    <span>Envío:</span>
                    <span>${parseFloat(order.shipping_cost).toLocaleString()}</span>
                  </div>
                )}
                {order.tax_amount && parseFloat(order.tax_amount) > 0 && (
                  <div className="flex justify-between">
                    <span>Impuestos:</span>
                    <span>${parseFloat(order.tax_amount).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total:</span>
                  <span>${parseFloat(order.total_amount).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {order.notes && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2">Notas del Pedido</h3>
              <p className="text-sm text-gray-600">{order.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestión de Pedidos</h1>
          <p className="text-gray-600">Administra los pedidos de la tienda</p>
        </div>
        <div className="flex items-center gap-3">
          <Filter size={20} className="text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos los estados</option>
            <option value="pending">Pendiente</option>
            <option value="confirmed">Confirmado</option>
            <option value="processing">Procesando</option>
            <option value="shipped">Enviado</option>
            <option value="delivered">Entregado</option>
            <option value="cancelled">Cancelado</option>
            <option value="refunded">Reembolsado</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <p className="text-sm text-gray-600">
              {filteredOrders.length} pedido{filteredOrders.length !== 1 ? 's' : ''} encontrado{filteredOrders.length !== 1 ? 's' : ''}
            </p>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay pedidos</h3>
              <p className="text-gray-500">No se encontraron pedidos con los filtros seleccionados.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pedido & Dirección
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total & Pago
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Artículos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-gray-900">#{order.order_number}</p>
                          <p className="text-xs text-gray-500">
                            {order.shipping_address ? 
                              `${order.shipping_address.city}, ${order.shipping_address.state}` : 
                              'Sin dirección'
                            }
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value as Order['status'])}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border-0 focus:ring-2 focus:ring-blue-500 ${getStatusColor(order.status)}`}
                        >
                          <option value="pending">Pendiente</option>
                          <option value="confirmed">Confirmado</option>
                          <option value="processing">Procesando</option>
                          <option value="shipped">Enviado</option>
                          <option value="delivered">Entregado</option>
                          <option value="cancelled">Cancelado</option>
                          <option value="refunded">Reembolsado</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            ${parseFloat(order.total_amount).toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {order.notes && order.notes.includes('Pago:') ? 
                              order.notes.split('Pago: ')[1] || 'Pago procesado' :
                              'Sin información de pago'
                            }
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.items.length} artículo{order.items.length !== 1 ? 's' : ''}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedOrder(order)
                            setShowOrderModal(true)
                          }}
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-900 transition-colors"
                        >
                          <Eye size={16} />
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Order Modal */}
      {showOrderModal && selectedOrder && (
        <OrderModal
          order={selectedOrder}
          onClose={() => {
            setShowOrderModal(false)
            setSelectedOrder(null)
          }}
        />
      )}
    </div>
  )
}

export default OrderManagement