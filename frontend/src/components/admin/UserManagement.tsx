import { useState, useEffect } from 'react'
import { 
  Users2, 
  Search, 
  UserX,
  UserCheck,
  Shield,
  User,
  Trash2,
  UserPlus,
  Edit3
} from 'lucide-react'
import type { User as UserType, PaginatedResponse } from '../../api/types'
import apiClient from '../../api/api'
import UserModal from './UserModal'

function UserManagement() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'todos' | 'activo' | 'inactivo'>('todos')
  const [users, setUsers] = useState<UserType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    total_users: 0,
    active_users: 0,
    inactive_users: 0,
    staff_users: 0
  })
  const [showModal, setShowModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null)

  useEffect(() => {
    loadUsers()
    loadStats()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const response: PaginatedResponse<UserType> = await apiClient.getAdminUsers()
      setUsers(response.results)
    } catch (error) {
      console.error('Error loading users:', error)
      setError('Error al cargar los usuarios')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const statsData = await apiClient.getUserStats()
      setStats(statsData)
    } catch (error) {
      console.error('Error loading user stats:', error)
    }
  }

  const handleActivateUser = async (userId: number) => {
    try {
      await apiClient.activateUser(userId)
      await loadUsers()
      await loadStats()
      alert('Usuario activado exitosamente')
    } catch (error) {
      console.error('Error activating user:', error)
      alert('Error al activar el usuario')
    }
  }

  const handleDeactivateUser = async (userId: number) => {
    try {
      const user = users.find(u => u.id === userId)
      if (user?.is_superuser) {
        alert('No puedes desactivar un superusuario')
        return
      }
      
      if (window.confirm('¿Estás seguro de que quieres desactivar este usuario?')) {
        await apiClient.deactivateUser(userId)
        await loadUsers()
        await loadStats()
        alert('Usuario desactivado exitosamente')
      }
    } catch (error) {
      console.error('Error deactivating user:', error)
      alert('Error al desactivar el usuario')
    }
  }

  const handleDeleteUser = async (userId: number) => {
    try {
      const user = users.find(u => u.id === userId)
      if (user?.is_superuser) {
        alert('No puedes eliminar un superusuario')
        return
      }
      
      if (window.confirm('¿Estás seguro de que quieres eliminar este usuario? Esta acción no se puede deshacer.')) {
        await apiClient.deleteUser(userId)
        await loadUsers()
        await loadStats()
        alert('Usuario eliminado exitosamente')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Error al eliminar el usuario')
    }
  }

  // Filtrar usuarios
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'todos' || 
                         (filterStatus === 'activo' && user.is_active) ||
                         (filterStatus === 'inactivo' && !user.is_active)
    return matchesSearch && matchesStatus
  })

  const handleOpenCreateModal = () => {
    setSelectedUser(null)
    setShowModal(true)
  }

  const handleOpenEditModal = (user: UserType) => {
    setSelectedUser(user)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedUser(null)
  }

  const handleSaveUser = async () => {
    await loadUsers()
    await loadStats()
  }

  return (
    <div className="bg-white rounded-xl shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users2 className="text-meow-accent" size={28} />
            <h2 className="text-2xl font-bold text-gray-800">Gestión de Usuarios</h2>
          </div>
          <button 
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 bg-meow-accent text-white px-4 py-2 rounded-lg hover:bg-meow-accent/90 transition font-medium"
          >
            <UserPlus size={20} />
            Crear Usuario
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Users2 size={20} className="text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Total Usuarios</span>
            </div>
            <p className="text-2xl font-bold text-blue-900 mt-1">{stats.total_users}</p>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <UserCheck size={20} className="text-green-600" />
              <span className="text-sm font-medium text-green-800">Activos</span>
            </div>
            <p className="text-2xl font-bold text-green-900 mt-1">{stats.active_users}</p>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <UserX size={20} className="text-red-600" />
              <span className="text-sm font-medium text-red-800">Inactivos</span>
            </div>
            <p className="text-2xl font-bold text-red-900 mt-1">{stats.inactive_users}</p>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Shield size={20} className="text-purple-600" />
              <span className="text-sm font-medium text-purple-800">Staff</span>
            </div>
            <p className="text-2xl font-bold text-purple-900 mt-1">{stats.staff_users}</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Buscar usuarios por email o nombre..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-meow-accent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-meow-accent"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
          >
            <option value="todos">Todos los estados</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-meow-accent"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Usuario</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Rol</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Estado</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Registro</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-meow-accent/20 rounded-full flex items-center justify-center">
                          <User size={16} className="text-meow-accent" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{user.first_name} {user.last_name}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1">
                        {user.is_superuser ? (
                          <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
                            <Shield size={12} />
                            Superusuario
                          </span>
                        ) : user.is_staff ? (
                          <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium">
                            <Shield size={12} />
                            Staff
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                            <User size={12} />
                            Cliente
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                        user.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.is_active ? <UserCheck size={12} /> : <UserX size={12} />}
                        {user.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-gray-600">
                        {new Date(user.date_joined).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => handleOpenEditModal(user)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Editar usuario"
                        >
                          <Edit3 size={16} />
                        </button>
                        
                        {user.is_active ? (
                          <button
                            onClick={() => handleDeactivateUser(user.id)}
                            disabled={user.is_superuser}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Desactivar usuario"
                          >
                            <UserX size={16} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivateUser(user.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="Activar usuario"
                          >
                            <UserCheck size={16} />
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={user.is_superuser}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
            
            {filteredUsers.length === 0 && !loading && (
              <div className="text-center py-12">
                <Users2 size={48} className="text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600">No se encontraron usuarios</h3>
                <p className="text-gray-500">Ajusta los filtros para ver más resultados.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <UserModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onSave={handleSaveUser}
        user={selectedUser}
      />
    </div>
  )
}

export default UserManagement