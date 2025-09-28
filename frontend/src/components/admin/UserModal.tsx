import { useState, useEffect } from 'react'
import { X, User, Mail, Phone, Shield } from 'lucide-react'
import type { User as UserType } from '../../api/types'
import apiClient from '../../api/api'

import { useToast } from '../../contexts/ToastContext'
interface UserModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  user?: UserType | null
}

function UserModal({ isOpen, onClose, onSave, user }: UserModalProps) {
  const { success } = useToast()
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    password: '',
    confirmPassword: '',
    is_staff: false,
    is_superuser: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!user

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone || '',
        password: '',
        confirmPassword: '',
        is_staff: user.is_staff || false,
        is_superuser: user.is_superuser || false
      })
    } else {
      setFormData({
        email: '',
        first_name: '',
        last_name: '',
        phone: '',
        password: '',
        confirmPassword: '',
        is_staff: false,
        is_superuser: false
      })
    }
    setError(null)
  }, [user, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validation
      if (!formData.email || !formData.first_name || !formData.last_name) {
        throw new Error('Por favor completa todos los campos requeridos')
      }

      if (!isEditing && (!formData.password || formData.password.length < 6)) {
        throw new Error('La contraseña debe tener al menos 6 caracteres')
      }

      if (!isEditing && formData.password !== formData.confirmPassword) {
        throw new Error('Las contraseñas no coinciden')
      }

      if (isEditing) {
        // Update user
        await apiClient.updateUser(user!.id, {
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          is_staff: formData.is_staff,
          is_superuser: formData.is_superuser
        })
        
        success('Usuario actualizado exitosamente')
      } else {
        // Create user
        await apiClient.register({
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          password: formData.password
        })
        
        success('Usuario creado exitosamente')
      }

      onSave()
      onClose()
    } catch (error: unknown) {
      console.error('Error saving user:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error al guardar el usuario'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'is_staff' || field === 'is_superuser' 
        ? (value === 'true' || value === true) 
        : value
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-meow-accent/20 rounded-lg flex items-center justify-center">
              <User size={20} className="text-meow-accent" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                {isEditing ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
              </h2>
              <p className="text-sm text-gray-600">
                {isEditing ? 'Actualiza la información del usuario' : 'Completa los datos del nuevo usuario'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail size={16} className="inline mr-2" />
                Correo Electrónico *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-meow-accent text-sm"
                placeholder="usuario@ejemplo.com"
                required
              />
            </div>

            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User size={16} className="inline mr-2" />
                Nombre *
              </label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => handleChange('first_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-meow-accent text-sm"
                placeholder="Nombre"
                required
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User size={16} className="inline mr-2" />
                Apellido *
              </label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => handleChange('last_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-meow-accent text-sm"
                placeholder="Apellido"
                required
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone size={16} className="inline mr-2" />
                Teléfono
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-meow-accent text-sm"
                placeholder="+57 300 123 4567"
              />
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Shield size={16} className="inline mr-2" />
                Rol del Usuario
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="role"
                    checked={!formData.is_staff && !formData.is_superuser}
                    onChange={() => {
                      handleChange('is_staff', false)
                      handleChange('is_superuser', false)
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm">Cliente (Usuario normal)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="role"
                    checked={formData.is_staff && !formData.is_superuser}
                    onChange={() => {
                      handleChange('is_staff', true)
                      handleChange('is_superuser', false)
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm">Staff (Empleado)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="role"
                    checked={formData.is_superuser}
                    onChange={() => {
                      handleChange('is_staff', true)
                      handleChange('is_superuser', true)
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm">Administrador (Superusuario)</span>
                </label>
              </div>
            </div>

            {/* Password fields (only for new users) */}
            {!isEditing && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Shield size={16} className="inline mr-2" />
                    Contraseña *
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-meow-accent text-sm"
                    placeholder="Mínimo 6 caracteres"
                    minLength={6}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Shield size={16} className="inline mr-2" />
                    Confirmar Contraseña *
                  </label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-meow-accent text-sm"
                    placeholder="Repetir contraseña"
                    required
                  />
                </div>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-meow-accent text-white hover:bg-meow-accent/90 rounded-lg transition-colors font-medium disabled:opacity-50"
            >
              {loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear Usuario')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UserModal