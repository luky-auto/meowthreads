import { useState, useEffect } from 'react'
import { User, Lock, Phone, Save, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import apiClient from '../api/api'

interface ProfileData {
  first_name: string
  last_name: string
  phone: string
}

interface PasswordData {
  current_password: string
  new_password: string
  confirm_password: string
}

function ProfileUpdate() {
  const { user } = useAuth()
  const { success, error } = useToast()

  // Estados para datos del perfil
  const [profileData, setProfileData] = useState<ProfileData>({
    first_name: '',
    last_name: '',
    phone: ''
  })

  // Estados para cambio de contraseña
  const [passwordData, setPasswordData] = useState<PasswordData>({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })

  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const [isLoadingPassword, setIsLoadingPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Cargar datos iniciales del usuario
  useEffect(() => {
    if (user) {
      setProfileData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || ''
      })
    }
  }, [user])

  const handleProfileChange = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handlePasswordChange = (field: keyof PasswordData, value: string) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!profileData.first_name.trim() || !profileData.last_name.trim()) {
      error('El nombre y apellido son obligatorios')
      return
    }

    setIsLoadingProfile(true)
    try {
      await apiClient.put('/auth/user/', {
        first_name: profileData.first_name.trim(),
        last_name: profileData.last_name.trim(),
        phone: profileData.phone.trim()
      })

      success('Perfil actualizado exitosamente')
    } catch (err) {
      if (err && typeof err === 'object' && 'response' in err) {
        const apiError = err as {response?: {data?: {error?: string}}}
        error(apiError.response?.data?.error || 'Error al actualizar el perfil')
      } else {
        error('Error al actualizar el perfil')
      }
    } finally {
      setIsLoadingProfile(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!passwordData.current_password) {
      error('Ingresa tu contraseña actual')
      return
    }

    if (!passwordData.new_password || passwordData.new_password.length < 6) {
      error('La nueva contraseña debe tener al menos 6 caracteres')
      return
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      error('Las contraseñas no coinciden')
      return
    }

    if (passwordData.current_password === passwordData.new_password) {
      error('La nueva contraseña debe ser diferente a la actual')
      return
    }

    setIsLoadingPassword(true)
    try {
      await apiClient.put('/auth/change-password/', {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      })

      success('Contraseña actualizada exitosamente')
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      })
    } catch (err) {
      if (err && typeof err === 'object' && 'response' in err) {
        const apiError = err as {response?: {data?: {error?: string}}}
        error(apiError.response?.data?.error || 'Error al cambiar la contraseña')
      } else {
        error('Error al cambiar la contraseña')
      }
    } finally {
      setIsLoadingPassword(false)
    }
  }

  if (!user) {
    return (
      <div className="bg-meow-background min-h-screen text-meow-text">
        <div className="py-10 px-4 max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-medium text-meow-text mb-4">Acceso denegado</h2>
            <p className="text-gray-600">Debes iniciar sesión para acceder a tu perfil.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-meow-background min-h-screen text-meow-text">
      <div className="py-10 px-4 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <User size={28} className="text-meow-accent" />
          <h1 className="text-3xl font-bold text-meow-text">Actualizar Perfil</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulario de datos personales */}
          <div className="bg-white border border-meow-border rounded-xl p-6 shadow">
            <h2 className="text-xl font-semibold text-meow-text mb-4">
              Datos Personales
            </h2>

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              {/* Email (solo lectura) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">
                  El correo electrónico no se puede modificar
                </p>
              </div>

              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={profileData.first_name}
                  onChange={(e) => handleProfileChange('first_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-meow-accent"
                  placeholder="Tu nombre"
                  required
                />
              </div>

              {/* Apellido */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Apellido *
                </label>
                <input
                  type="text"
                  value={profileData.last_name}
                  onChange={(e) => handleProfileChange('last_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-meow-accent"
                  placeholder="Tu apellido"
                  required
                />
              </div>

              {/* Teléfono */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone size={16} className="inline mr-1" />
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => handleProfileChange('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-meow-accent"
                  placeholder="+57 300 123 4567"
                />
              </div>

              <button
                type="submit"
                disabled={isLoadingProfile}
                className="w-full bg-meow-accent text-white py-2 px-4 rounded-lg hover:bg-meow-accent/90 transition font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Save size={20} />
                {isLoadingProfile ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </form>
          </div>

          {/* Formulario de cambio de contraseña */}
          <div className="bg-white border border-meow-border rounded-xl p-6 shadow">
            <h2 className="text-xl font-semibold text-meow-text mb-4">
              Cambiar Contraseña
            </h2>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {/* Contraseña actual */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña Actual *
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordData.current_password}
                    onChange={(e) => handlePasswordChange('current_password', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-meow-accent pr-10"
                    placeholder="Tu contraseña actual"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Nueva contraseña */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nueva Contraseña *
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordData.new_password}
                    onChange={(e) => handlePasswordChange('new_password', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-meow-accent pr-10"
                    placeholder="Mínimo 6 caracteres"
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirmar nueva contraseña */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar Nueva Contraseña *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordData.confirm_password}
                    onChange={(e) => handlePasswordChange('confirm_password', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-meow-accent pr-10"
                    placeholder="Repetir nueva contraseña"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoadingPassword}
                className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Lock size={20} />
                {isLoadingPassword ? 'Cambiando...' : 'Cambiar Contraseña'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileUpdate