import { useState, useEffect } from 'react'
import { Plus, Edit3, Trash2, Search, Ruler, ArrowUpDown } from 'lucide-react'
import type { SizeConfiguration } from '../../api/types'
import apiClient from '../../api/api'

import { useToast } from '../../contexts/ToastContext'
interface SizeModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  size?: SizeConfiguration | null
}

function SizeModal({ isOpen, onClose, onSave, size }: SizeModalProps) {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    sort_order: 0,
    is_active: true
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!size

  useEffect(() => {
    if (size) {
      setFormData({
        code: size.code || '',
        name: size.name || '',
        description: size.description || '',
        sort_order: size.sort_order || 0,
        is_active: size.is_active ?? true
      })
    } else {
      setFormData({
        code: '',
        name: '',
        description: '',
        sort_order: 0,
        is_active: true
      })
    }
    setError(null)
  }, [size, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isEditing && size) {
        await apiClient.updateSize(size.id, formData)
      } else {
        await apiClient.createSize(formData)
      }
      onSave()
      onClose()
    } catch (error: unknown) {
      console.error('Error saving size:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error al guardar la talla'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-meow-accent/20 rounded-lg flex items-center justify-center">
              <Ruler size={20} className="text-meow-accent" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                {isEditing ? 'Editar Talla' : 'Nueva Talla'}
              </h2>
              <p className="text-sm text-gray-600">
                {isEditing ? 'Modifica los datos de la talla' : 'Crea una nueva talla para los productos'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Plus size={20} className="rotate-45 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Código de Talla *
            </label>
            <input
              type="text"
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-meow-accent"
              placeholder="Ej: XS, S, M, L, XL"
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la Talla *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-meow-accent"
              placeholder="Ej: Extra Small, Small, Medium"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-meow-accent"
              placeholder="Descripción opcional de la talla"
              rows={3}
            />
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Orden de Clasificación
            </label>
            <input
              type="number"
              min="0"
              value={formData.sort_order}
              onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-meow-accent"
              placeholder="0"
            />
            <p className="text-xs text-gray-500 mt-1">
              Número menor aparece primero en la lista
            </p>
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-meow-accent border-gray-300 rounded focus:ring-meow-accent"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
              Talla activa
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-meow-accent text-white hover:bg-meow-accent/90 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function SizeManagement() {
  const [sizes, setSizes] = useState<SizeConfiguration[]>([])
  const { error: showError } = useToast()
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedSize, setSelectedSize] = useState<SizeConfiguration | null>(null)

  useEffect(() => {
    loadSizes()
  }, [])

  const loadSizes = async () => {
    try {
      setLoading(true)
      const data = await apiClient.getAdminSizes()
      setSizes(data)
    } catch (error) {
      console.error('Error loading sizes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (size: SizeConfiguration) => {
    setSelectedSize(size)
    setIsModalOpen(true)
  }

  const handleCreate = () => {
    setSelectedSize(null)
    setIsModalOpen(true)
  }

  const handleDelete = async (size: SizeConfiguration) => {
    if (confirm(`¿Estás seguro de que quieres eliminar la talla "${size.name}"?`)) {
      try {
        await apiClient.deleteSize(size.id)
        await loadSizes()
      } catch (error) {
        console.error('Error deleting size:', error)
        showError('Error al eliminar la talla')
      }
    }
  }

  const handleModalSave = async () => {
    await loadSizes()
  }

  const filteredSizes = sizes.filter(size =>
    size.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    size.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (size.description && size.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="bg-white rounded-xl shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-meow-accent/20 rounded-lg flex items-center justify-center">
              <Ruler size={20} className="text-meow-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Gestión de Tallas</h1>
              <p className="text-gray-600 text-sm">
                Administra las tallas disponibles para los productos
              </p>
            </div>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-meow-accent text-white hover:bg-meow-accent/90 rounded-lg transition-colors"
          >
            <Plus size={20} />
            Nueva Talla
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-6 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar tallas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-meow-accent"
          />
        </div>
      </div>

      {/* Sizes List */}
      <div className="p-6">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-meow-accent"></div>
          </div>
        ) : filteredSizes.length === 0 ? (
          <div className="text-center py-12">
            <Ruler className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No se encontraron tallas' : 'No hay tallas'}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm 
                ? 'Intenta con diferentes términos de búsqueda'
                : 'Crea tu primera talla para los productos'
              }
            </p>
            {!searchTerm && (
              <button
                onClick={handleCreate}
                className="inline-flex items-center gap-2 px-4 py-2 bg-meow-accent text-white hover:bg-meow-accent/90 rounded-lg transition-colors"
              >
                <Plus size={20} />
                Crear Primera Talla
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSizes.map((size) => (
              <div
                key={size.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <span className="px-2 py-1 bg-meow-accent text-white text-sm rounded">
                        {size.code}
                      </span>
                      {size.name}
                    </h3>
                    {size.description && (
                      <p className="text-sm text-gray-600 mt-1">
                        {size.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!size.is_active && (
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                        Inactiva
                      </span>
                    )}
                    {size.is_active && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                        Activa
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                  <div className="flex items-center gap-2">
                    <ArrowUpDown size={14} />
                    <span>Orden: {size.sort_order}</span>
                  </div>
                  <span>{new Date(size.created_at).toLocaleDateString()}</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(size)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-blue-600 border border-blue-200 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit3 size={16} />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(size)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-red-600 border border-red-200 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Size Modal */}
      <SizeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleModalSave}
        size={selectedSize}
      />
    </div>
  )
}

export default SizeManagement