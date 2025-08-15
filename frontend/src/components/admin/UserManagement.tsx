import { useState } from 'react'
import { 
  Users2, 
  UserPlus, 
  Search, 
  Edit3,
  Trash2,
  UserX,
  UserCheck,
  Shield,
  User
} from 'lucide-react'

interface User {
  id: number
  name: string
  email: string
  role: 'cliente' | 'administrador'
  status: 'activo' | 'inactivo'
  createdAt: string
  lastLogin: string
}

function UserManagement() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<'todos' | 'cliente' | 'administrador'>('todos')
  const [filterStatus, setFilterStatus] = useState<'todos' | 'activo' | 'inactivo'>('todos')
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Datos de ejemplo de usuarios
  const [users, setUsers] = useState<User[]>([
    {
      id: 1,
      name: 'María González',
      email: 'maria@example.com',
      role: 'cliente',
      status: 'activo',
      createdAt: '2024-01-15',
      lastLogin: '2024-08-03'
    },
    {
      id: 2,
      name: 'Andres Pulecio',
      email: 'andres@meowthreads.com',
      role: 'administrador',
      status: 'activo',
      createdAt: '2024-01-01',
      lastLogin: '2024-08-04'
    },
    {
      id: 3,
      name: 'Ana Martínez',
      email: 'ana@example.com',
      role: 'cliente',
      status: 'activo',
      createdAt: '2024-02-20',
      lastLogin: '2024-08-02'
    },
    {
      id: 4,
      name: 'Pedro Inactivo',
      email: 'pedro@example.com',
      role: 'cliente',
      status: 'inactivo',
      createdAt: '2024-03-10',
      lastLogin: '2024-07-15'
    }
  ])

  // Filtrar usuarios
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = filterRole === 'todos' || user.role === filterRole
    const matchesStatus = filterStatus === 'todos' || user.status === filterStatus
    
    return matchesSearch && matchesRole && matchesStatus
  })

  const handleToggleStatus = (userId: number) => {
    setUsers(users.map(user => 
      user.id === userId 
        ? { ...user, status: user.status === 'activo' ? 'inactivo' : 'activo' }
        : user
    ))
  }

  const handleDeleteUser = (userId: number) => {
    if (confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      setUsers(users.filter(user => user.id !== userId))
    }
  }

  const CreateUserModal = () => {
    const [newUser, setNewUser] = useState({
      name: '',
      email: '',
      role: 'cliente' as 'cliente' | 'administrador',
      password: ''
    })

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      const user: User = {
        id: Math.max(...users.map(u => u.id), 0) + 1,
        ...newUser,
        status: 'activo',
        createdAt: new Date().toISOString().split('T')[0],
        lastLogin: 'Nunca'
      }
      setUsers([...users, user])
      setShowCreateModal(false)
      setNewUser({ name: '', email: '', role: 'cliente', password: '' })
    }

    if (!showCreateModal) return null

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Crear Nuevo Usuario</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre Completo
              </label>
              <input
                type="text"
                required
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-meow-accent focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                required
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-meow-accent focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                required
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-meow-accent focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rol
              </label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'cliente' | 'administrador' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-meow-accent focus:border-transparent"
              >
                <option value="cliente">Cliente</option>
                <option value="administrador">Administrador</option>
              </select>
            </div>
            
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-meow-accent text-white rounded-lg hover:bg-meow-accent/90"
              >
                Crear Usuario
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users2 className="text-meow-accent" size={28} />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Gestión de Usuarios</h1>
              <p className="text-gray-600">Administra usuarios, roles y permisos</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-meow-accent text-white px-4 py-2 rounded-lg hover:bg-meow-accent/90 transition-colors"
          >
            <UserPlus size={18} />
            Nuevo Usuario
          </button>
        </div>

        {/* Filtros y búsqueda */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-meow-accent focus:border-transparent"
            />
          </div>
          
          <div className="flex gap-3">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as 'todos' | 'cliente' | 'administrador')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-meow-accent focus:border-transparent"
            >
              <option value="todos">Todos los roles</option>
              <option value="cliente">Clientes</option>
              <option value="administrador">Administradores</option>
            </select>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'todos' | 'activo' | 'inactivo')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-meow-accent focus:border-transparent"
            >
              <option value="todos">Todos los estados</option>
              <option value="activo">Activos</option>
              <option value="inactivo">Inactivos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de usuarios */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-3 px-6 font-medium text-gray-600">Usuario</th>
                <th className="text-left py-3 px-6 font-medium text-gray-600">Rol</th>
                <th className="text-left py-3 px-6 font-medium text-gray-600">Estado</th>
                <th className="text-left py-3 px-6 font-medium text-gray-600">Creado</th>
                <th className="text-left py-3 px-6 font-medium text-gray-600">Último Login</th>
                <th className="text-left py-3 px-6 font-medium text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b hover:bg-gray-50">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-meow-accent/10 rounded-full flex items-center justify-center">
                        <User className="text-meow-accent" size={18} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{user.name}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      user.role === 'administrador'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role === 'administrador' ? <Shield size={12} /> : <User size={12} />}
                      {user.role === 'administrador' ? 'Admin' : 'Cliente'}
                    </span>
                  </td>
                  
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      user.status === 'activo'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.status === 'activo' ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  
                  <td className="py-4 px-6 text-sm text-gray-600">
                    {user.createdAt}
                  </td>
                  
                  <td className="py-4 px-6 text-sm text-gray-600">
                    {user.lastLogin}
                  </td>
                  
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleStatus(user.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          user.status === 'activo'
                            ? 'text-orange-600 hover:bg-orange-50'
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                        title={user.status === 'activo' ? 'Desactivar usuario' : 'Activar usuario'}
                      >
                        {user.status === 'activo' ? <UserX size={16} /> : <UserCheck size={16} />}
                      </button>
                      
                      <button
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar usuario"
                      >
                        <Edit3 size={16} />
                      </button>
                      
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar usuario"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users2 className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600">No se encontraron usuarios</p>
          </div>
        )}
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Users2 className="text-blue-500" size={24} />
            <h3 className="font-semibold text-gray-800">Total Usuarios</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">{users.length}</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="text-purple-500" size={24} />
            <h3 className="font-semibold text-gray-800">Administradores</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {users.filter(u => u.role === 'administrador').length}
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <User className="text-green-500" size={24} />
            <h3 className="font-semibold text-gray-800">Clientes</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {users.filter(u => u.role === 'cliente').length}
          </p>
        </div>
      </div>

      <CreateUserModal />
    </div>
  )
}

export default UserManagement
