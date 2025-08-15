import { useState } from 'react'
import { 
  Users2, 
  Package, 
  CreditCard, 
  Settings, 
  BarChart3, 
  Shield,
  ChevronRight,
  Home
} from 'lucide-react'
import { Link } from 'react-router-dom'

// Componentes del panel de administración
import UserManagement from '../components/admin/UserManagement.tsx'
import InventoryManagement from '../components/admin/InventoryManagement.tsx'
import PaymentOrders from '../components/admin/PaymentOrders.tsx'

type AdminSection = 'dashboard' | 'users' | 'inventory' | 'payments' | 'settings'

function Admin() {
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard')
  
  // Datos de ejemplo para el dashboard
  const dashboardStats = {
    totalUsers: 152,
    totalProducts: 47,
    pendingOrders: 23,
    monthlyRevenue: '$2,450,000'
  }

  const menuItems = [
    {
      id: 'dashboard' as AdminSection,
      label: 'Dashboard',
      icon: BarChart3,
      description: 'Vista general del sistema'
    },
    {
      id: 'users' as AdminSection,
      label: 'Gestión de Usuarios',
      icon: Users2,
      description: 'Administrar usuarios y roles'
    },
    {
      id: 'inventory' as AdminSection,
      label: 'Inventario',
      icon: Package,
      description: 'Gestión de productos y stock'
    },
    {
      id: 'payments' as AdminSection,
      label: 'Pagos y Pedidos',
      icon: CreditCard,
      description: 'Administrar transacciones y órdenes'
    },
    {
      id: 'settings' as AdminSection,
      label: 'Configuración',
      icon: Settings,
      description: 'Ajustes del sistema'
    }
  ]

  const renderContent = () => {
    switch (activeSection) {
      case 'users':
        return <UserManagement />
      case 'inventory':
        return <InventoryManagement />
      case 'payments':
        return <PaymentOrders />
      case 'settings':
        return (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Configuración del Sistema</h2>
            <p className="text-gray-600">Panel de configuración en desarrollo...</p>
          </div>
        )
      default:
        return (
          <div className="space-y-6">
            {/* Header del Dashboard */}
            <div className="bg-gradient-to-r from-meow-primary to-meow-accent text-white rounded-xl p-8">
              <div className="flex items-center gap-3 mb-4">
                <Shield size={32} />
                <h1 className="text-3xl font-bold">Panel de Administración</h1>
              </div>
              <p className="text-lg opacity-90">
                Bienvenido al centro de control de MeowThreads
              </p>
            </div>

            {/* Estadísticas principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
                    <p className="text-2xl font-bold text-gray-900">{dashboardStats.totalUsers}</p>
                  </div>
                  <Users2 className="text-blue-500" size={32} />
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Productos</p>
                    <p className="text-2xl font-bold text-gray-900">{dashboardStats.totalProducts}</p>
                  </div>
                  <Package className="text-green-500" size={32} />
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-orange-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pedidos Pendientes</p>
                    <p className="text-2xl font-bold text-gray-900">{dashboardStats.pendingOrders}</p>
                  </div>
                  <CreditCard className="text-orange-500" size={32} />
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Ingresos del Mes</p>
                    <p className="text-2xl font-bold text-gray-900">{dashboardStats.monthlyRevenue}</p>
                  </div>
                  <BarChart3 className="text-purple-500" size={32} />
                </div>
              </div>
            </div>

            {/* Accesos rápidos */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Accesos Rápidos</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {menuItems.slice(1).map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-meow-accent hover:bg-meow-accent/5 transition-all duration-200"
                    >
                      <Icon className="text-meow-accent" size={24} />
                      <div className="text-left">
                        <p className="font-medium text-gray-800">{item.label}</p>
                        <p className="text-sm text-gray-600">{item.description}</p>
                      </div>
                      <ChevronRight className="text-gray-400 ml-auto" size={16} />
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con navegación */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                to="/" 
                className="flex items-center gap-2 text-meow-accent hover:text-meow-accent/80"
              >
                <Home size={20} />
                <span className="font-medium">Volver al Sitio</span>
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-xl font-bold text-gray-800">
                Panel de Administración
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="bg-meow-accent/10 text-meow-accent px-3 py-1 rounded-full text-sm font-medium">
                Administrador
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-6">
          {/* Sidebar de navegación */}
          <aside className="w-64 flex-shrink-0">
            <nav className="bg-white rounded-xl shadow-sm p-4">
              <div className="space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon
                  const isActive = activeSection === item.id
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                        isActive
                          ? 'bg-meow-accent text-white'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                      }`}
                    >
                      <Icon size={20} />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  )
                })}
              </div>
            </nav>
          </aside>

          {/* Contenido principal */}
          <main className="flex-1">
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  )
}

export default Admin
