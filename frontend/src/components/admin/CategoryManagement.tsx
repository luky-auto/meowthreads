import { useState, useEffect } from 'react'
import { Plus, Edit3, Trash2, Search, Tag } from 'lucide-react'
import type { Category } from '../../api/types'
import apiClient from '../../api/api'

import { useToast } from '../../contexts/ToastContext'
interface CategoryModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  category?: Category | null
}

function CategoryModal({ isOpen, onClose, onSave, category }: CategoryModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!category

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        description: category.description || '',
        is_active: category.is_active ?? true
      })
    } else {
      setFormData({
        name: '',
        description: '',
        is_active: true
      })
    }
    setError(null)
  }, [category, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isEditing && category) {
        await apiClient.updateCategory(category.id, formData)
      } else {
        await apiClient.createCategory(formData)
      }
      onSave()
      onClose()
    } catch (error: unknown) {
      console.error('Error saving category:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error al guardar la categoría'
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
              <Tag size={20} className="text-meow-accent" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                {isEditing ? 'Editar Categoría' : 'Nueva Categoría'}
              </h2>
              <p className="text-sm text-gray-600">
                {isEditing ? 'Modifica los datos de la categoría' : 'Crea una nueva categoría para los productos'}
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

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la Categoría *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-meow-accent"
              placeholder="Ej: Camisetas, Accesorios, etc."
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
              placeholder="Descripción opcional de la categoría"
              rows={3}
            />
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
              Categoría activa
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

function CategoryManagement() {
  const { error: showError } = useToast()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setLoading(true)
      const data = await apiClient.getAdminCategories()
      setCategories(data)
    } catch (error) {
      console.error('Error loading categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (category: Category) => {
    setSelectedCategory(category)
    setIsModalOpen(true)
  }

  const handleCreate = () => {
    setSelectedCategory(null)
    setIsModalOpen(true)
  }

  const handleDelete = async (category: Category) => {
    if (confirm(`¿Estás seguro de que quieres eliminar la categoría "${category.name}"?`)) {
      try {
        await apiClient.deleteCategory(category.id)
        await loadCategories()
      } catch (error) {
        console.error('Error deleting category:', error)
        showError('Error al eliminar la categoría')
      }
    }
  }

  const handleModalSave = async () => {
    await loadCategories()
  }

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="bg-white rounded-xl shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-meow-accent/20 rounded-lg flex items-center justify-center">
              <Tag size={20} className="text-meow-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Gestión de Categorías</h1>
              <p className="text-gray-600 text-sm">
                Administra las categorías de productos de tu tienda
              </p>
            </div>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-meow-accent text-white hover:bg-meow-accent/90 rounded-lg transition-colors"
          >
            <Plus size={20} />
            Nueva Categoría
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-6 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar categorías..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-meow-accent"
          />
        </div>
      </div>

      {/* Categories List */}
      <div className="p-6">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-meow-accent"></div>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-12">
            <Tag className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No se encontraron categorías' : 'No hay categorías'}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm 
                ? 'Intenta con diferentes términos de búsqueda'
                : 'Crea tu primera categoría para organizar tus productos'
              }
            </p>
            {!searchTerm && (
              <button
                onClick={handleCreate}
                className="inline-flex items-center gap-2 px-4 py-2 bg-meow-accent text-white hover:bg-meow-accent/90 rounded-lg transition-colors"
              >
                <Plus size={20} />
                Crear Primera Categoría
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCategories.map((category) => (
              <div
                key={category.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      {category.name}
                      {category.is_active === false && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                          Inactiva
                        </span>
                      )}
                      {category.is_active !== false && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                          Activa
                        </span>
                      )}
                    </h3>
                    {category.description && (
                      <p className="text-sm text-gray-600 mt-1">
                        {category.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                  <span>ID: {category.id}</span>
                  <span>{category.created_at ? new Date(category.created_at).toLocaleDateString() : 'N/A'}</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(category)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-blue-600 border border-blue-200 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit3 size={16} />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(category)}
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

      {/* Category Modal */}
      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleModalSave}
        category={selectedCategory}
      />
    </div>
  )
}

export default CategoryManagement