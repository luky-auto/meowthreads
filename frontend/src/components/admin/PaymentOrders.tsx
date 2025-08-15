import { useState } from 'react'
import { 
  CreditCard, 
  Search, 
  Eye,
  Edit3,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Package,
  Calendar,
  DollarSign,
  Truck
} from 'lucide-react'

interface Order {
  id: number
  userId: number
  userName: string
  userEmail: string
  total: number
  status: 'pendiente' | 'pagado' | 'fallido' | 'enviado' | 'entregado' | 'cancelado'
  paymentStatus: 'pendiente' | 'pagado' | 'fallido'
  paymentMethod: 'tarjeta' | 'transferencia' | 'efectivo' | 'pse'
  createdAt: string
  updatedAt: string
  items: OrderItem[]
  shippingAddress: string
}

interface OrderItem {
  id: number
  productName: string
  quantity: number
  price: number
  sku: string
}

function PaymentOrders() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('todos')
  const [filterPayment, setFilterPayment] = useState<string>('todos')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showOrderDetails, setShowOrderDetails] = useState(false)

  // Datos de ejemplo de pedidos
  const [orders, setOrders] = useState<Order[]>([
    {
      id: 1001,
      userId: 1,
      userName: 'María González',
      userEmail: 'maria@example.com',
      total: 120000,
      status: 'pagado',
      paymentStatus: 'pagado',
      paymentMethod: 'tarjeta',
      createdAt: '2024-08-03T10:30:00',
      updatedAt: '2024-08-03T10:35:00',
      shippingAddress: 'Calle 123 #45-67, Bogotá',
      items: [
        { id: 1, productName: 'Camiseta Gatuna Básica', quantity: 2, price: 35000, sku: 'CAM-001' },
        { id: 2, productName: 'Collar Vintage', quantity: 1, price: 45000, sku: 'COL-001' }
      ]
    },
    {
      id: 1002,
      userId: 3,
      userName: 'Ana Martínez',
      userEmail: 'ana@example.com',
      total: 370000,
      status: 'pendiente',
      paymentStatus: 'pendiente',
      paymentMethod: 'pse',
      createdAt: '2024-08-04T09:15:00',
      updatedAt: '2024-08-04T09:15:00',
      shippingAddress: 'Carrera 45 #12-34, Medellín',
      items: [
        { id: 3, productName: 'Zapatos Gatunos Premium', quantity: 1, price: 370000, sku: 'ZAP-001' }
      ]
    },
    {
      id: 1003,
      userId: 1,
      userName: 'María González',
      userEmail: 'maria@example.com',
      total: 170000,
      status: 'enviado',
      paymentStatus: 'pagado',
      paymentMethod: 'transferencia',
      createdAt: '2024-08-02T14:20:00',
      updatedAt: '2024-08-03T08:00:00',
      shippingAddress: 'Calle 123 #45-67, Bogotá',
      items: [
        { id: 4, productName: 'Saco Edición Limitada', quantity: 1, price: 170000, sku: 'SAC-001' }
      ]
    },
    {
      id: 1004,
      userId: 4,
      userName: 'Carlos Rodríguez',
      userEmail: 'carlos@example.com',
      total: 85000,
      status: 'fallido',
      paymentStatus: 'fallido',
      paymentMethod: 'tarjeta',
      createdAt: '2024-08-01T16:45:00',
      updatedAt: '2024-08-01T16:50:00',
      shippingAddress: 'Avenida 67 #89-01, Cali',
      items: [
        { id: 5, productName: 'Pantalón Felino Elegante', quantity: 1, price: 85000, sku: 'PAN-001' }
      ]
    }
  ])

  // Filtrar pedidos
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toString().includes(searchTerm) ||
                         order.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'todos' || order.status === filterStatus
    const matchesPayment = filterPayment === 'todos' || order.paymentStatus === filterPayment
    
    return matchesSearch && matchesStatus && matchesPayment
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pagado':
      case 'entregado':
        return 'bg-green-100 text-green-800'
      case 'enviado':
        return 'bg-blue-100 text-blue-800'
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800'
      case 'fallido':
      case 'cancelado':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pagado':
      case 'entregado':
        return <CheckCircle size={14} />
      case 'enviado':
        return <Truck size={14} />
      case 'pendiente':
        return <Clock size={14} />
      case 'fallido':
      case 'cancelado':
        return <XCircle size={14} />
      default:
        return <Clock size={14} />
    }
  }

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'tarjeta': return 'Tarjeta'
      case 'transferencia': return 'Transferencia'
      case 'efectivo': return 'Efectivo'
      case 'pse': return 'PSE'
      default: return method
    }
  }

  const handleUpdateOrderStatus = (orderId: number, newStatus: string) => {
    setOrders(orders.map(order => 
      order.id === orderId 
        ? { ...order, status: newStatus as 'pendiente' | 'pagado' | 'enviado' | 'entregado' | 'cancelado' | 'fallido', updatedAt: new Date().toISOString() }
        : order
    ))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-CO')
  }

  const OrderDetailsModal = () => {
    if (!showOrderDetails || !selectedOrder) return null

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-800">
              Detalles del Pedido #{selectedOrder.id}
            </h3>
            <button
              onClick={() => setShowOrderDetails(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle size={24} />
            </button>
          </div>

          <div className="space-y-6">
            {/* Información del cliente */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <User size={18} />
                Información del Cliente
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Nombre</p>
                  <p className="font-medium">{selectedOrder.userName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{selectedOrder.userEmail}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600">Dirección de Envío</p>
                  <p className="font-medium">{selectedOrder.shippingAddress}</p>
                </div>
              </div>
            </div>

            {/* Estado y pago */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <CreditCard size={18} />
                Estado y Pago
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Estado del Pedido</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                    {getStatusIcon(selectedOrder.status)}
                    {selectedOrder.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Estado del Pago</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.paymentStatus)}`}>
                    {getStatusIcon(selectedOrder.paymentStatus)}
                    {selectedOrder.paymentStatus}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Método de Pago</p>
                  <p className="font-medium">{getPaymentMethodText(selectedOrder.paymentMethod)}</p>
                </div>
              </div>
            </div>

            {/* Productos */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Package size={18} />
                Productos
              </h4>
              <div className="space-y-3">
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center bg-white p-3 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800">{item.productName}</p>
                      <p className="text-sm text-gray-600">SKU: {item.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{item.quantity} × ${item.price.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">${(item.quantity * item.price).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-800">Total:</span>
                  <span className="font-bold text-lg text-meow-accent">
                    ${selectedOrder.total.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Fechas */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Calendar size={18} />
                Fechas
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Fecha de Creación</p>
                  <p className="font-medium">{formatDate(selectedOrder.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Última Actualización</p>
                  <p className="font-medium">{formatDate(selectedOrder.updatedAt)}</p>
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex gap-3">
              <select
                value={selectedOrder.status}
                onChange={(e) => {
                  handleUpdateOrderStatus(selectedOrder.id, e.target.value)
                  setSelectedOrder({ ...selectedOrder, status: e.target.value as 'pendiente' | 'pagado' | 'enviado' | 'entregado' | 'cancelado' | 'fallido' })
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-meow-accent focus:border-transparent"
              >
                <option value="pendiente">Pendiente</option>
                <option value="pagado">Pagado</option>
                <option value="enviado">Enviado</option>
                <option value="entregado">Entregado</option>
                <option value="cancelado">Cancelado</option>
                <option value="fallido">Fallido</option>
              </select>
              <button
                onClick={() => setShowOrderDetails(false)}
                className="px-6 py-2 bg-meow-accent text-white rounded-lg hover:bg-meow-accent/90"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Estadísticas
  const totalOrders = orders.length
  const paidOrders = orders.filter(o => o.paymentStatus === 'pagado').length
  const pendingOrders = orders.filter(o => o.paymentStatus === 'pendiente').length
  const failedOrders = orders.filter(o => o.paymentStatus === 'fallido').length
  const totalRevenue = orders.filter(o => o.paymentStatus === 'pagado').reduce((sum, o) => sum + o.total, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <CreditCard className="text-meow-accent" size={28} />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Pagos y Pedidos</h1>
              <p className="text-gray-600">Administra transacciones y órdenes de clientes</p>
            </div>
          </div>
        </div>

        {/* Filtros y búsqueda */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por ID, nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-meow-accent focus:border-transparent"
            />
          </div>
          
          <div className="flex gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-meow-accent focus:border-transparent"
            >
              <option value="todos">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="pagado">Pagado</option>
              <option value="enviado">Enviado</option>
              <option value="entregado">Entregado</option>
              <option value="cancelado">Cancelado</option>
              <option value="fallido">Fallido</option>
            </select>
            
            <select
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-meow-accent focus:border-transparent"
            >
              <option value="todos">Todos los pagos</option>
              <option value="pagado">Pagado</option>
              <option value="pendiente">Pendiente</option>
              <option value="fallido">Fallido</option>
            </select>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Package className="text-blue-500" size={24} />
            <h3 className="font-semibold text-gray-800">Total Pedidos</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="text-green-500" size={24} />
            <h3 className="font-semibold text-gray-800">Pagados</h3>
          </div>
          <p className="text-2xl font-bold text-green-600">{paidOrders}</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="text-orange-500" size={24} />
            <h3 className="font-semibold text-gray-800">Pendientes</h3>
          </div>
          <p className="text-2xl font-bold text-orange-600">{pendingOrders}</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <XCircle className="text-red-500" size={24} />
            <h3 className="font-semibold text-gray-800">Fallidos</h3>
          </div>
          <p className="text-2xl font-bold text-red-600">{failedOrders}</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="text-purple-500" size={24} />
            <h3 className="font-semibold text-gray-800">Ingresos</h3>
          </div>
          <p className="text-2xl font-bold text-purple-600">
            ${totalRevenue.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Tabla de pedidos */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-3 px-6 font-medium text-gray-600">ID</th>
                <th className="text-left py-3 px-6 font-medium text-gray-600">Cliente</th>
                <th className="text-left py-3 px-6 font-medium text-gray-600">Total</th>
                <th className="text-left py-3 px-6 font-medium text-gray-600">Estado</th>
                <th className="text-left py-3 px-6 font-medium text-gray-600">Pago</th>
                <th className="text-left py-3 px-6 font-medium text-gray-600">Método</th>
                <th className="text-left py-3 px-6 font-medium text-gray-600">Fecha</th>
                <th className="text-left py-3 px-6 font-medium text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className="border-b hover:bg-gray-50">
                  <td className="py-4 px-6 font-mono text-sm font-medium text-gray-800">
                    #{order.id}
                  </td>
                  
                  <td className="py-4 px-6">
                    <div>
                      <p className="font-medium text-gray-800">{order.userName}</p>
                      <p className="text-sm text-gray-600">{order.userEmail}</p>
                    </div>
                  </td>
                  
                  <td className="py-4 px-6 font-semibold text-gray-800">
                    ${order.total.toLocaleString()}
                  </td>
                  
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      {order.status}
                    </span>
                  </td>
                  
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.paymentStatus)}`}>
                      {getStatusIcon(order.paymentStatus)}
                      {order.paymentStatus}
                    </span>
                  </td>
                  
                  <td className="py-4 px-6 text-sm text-gray-600">
                    {getPaymentMethodText(order.paymentMethod)}
                  </td>
                  
                  <td className="py-4 px-6 text-sm text-gray-600">
                    {formatDate(order.createdAt)}
                  </td>
                  
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedOrder(order)
                          setShowOrderDetails(true)
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Ver detalles"
                      >
                        <Eye size={16} />
                      </button>
                      
                      <button
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Editar pedido"
                      >
                        <Edit3 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <CreditCard className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600">No se encontraron pedidos</p>
          </div>
        )}
      </div>

      <OrderDetailsModal />
    </div>
  )
}

export default PaymentOrders
