import { useState, useEffect } from 'react'
import { 
  Package, 
  Plus, 
  Search, 
  Eye,
  Trash2,
  AlertTriangle,
  TrendingDown,
  Tag,
  Power,
  Star,
  Edit3
} from 'lucide-react'
import type { Product, Category } from '../../api/types'
import apiClient from '../../api/api'
import ProductModal from './ProductModal'
import ProductDetailsModal from './ProductDetailsModal'
import { useToast } from '../../contexts/ToastContext'

function InventoryManagement() {
  const { success, error: showError } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('todos')
  const [filterStatus, setFilterStatus] = useState<string>('todos')
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [stats, setStats] = useState({
    total_products: 0,
    active_products: 0,
    inactive_products: 0,
    featured_products: 0,
    total_variants: 0,
    out_of_stock: 0,
    low_stock: 0,
  })
  const [showModal, setShowModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setErrorMessage(null)
      
      const [productsResponse, categoriesData, statsData] = await Promise.all([
        apiClient.getAdminProducts(),
        apiClient.getCategories(),
        apiClient.getProductStats()
      ])
      
      setProducts(productsResponse.results)
      setCategories(categoriesData)
      setStats(statsData)
    } catch (error) {
      console.error('Error loading inventory data:', error)
      setErrorMessage('Error al cargar los datos del inventario')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (productId: number) => {
    try {
      await apiClient.toggleProductActive(productId)
      await loadData()
      success('Estado del producto actualizado exitosamente')
    } catch (error) {
      console.error('Error toggling product active:', error)
      showError('Error al cambiar el estado del producto')
    }
  }

  const handleToggleFeatured = async (productId: number) => {
    try {
      await apiClient.toggleProductFeatured(productId)
      await loadData()
      success('Estado destacado del producto actualizado exitosamente')
    } catch (error) {
      console.error('Error toggling product featured:', error)
      showError('Error al cambiar el estado destacado del producto')
    }
  }

  const handleDeleteProduct = async (productId: number) => {
    try {
      if (window.confirm('¿Estás seguro de que quieres eliminar este producto? Esta acción no se puede deshacer.')) {
        await apiClient.deleteProduct(productId)
        await loadData()
        success('Producto eliminado exitosamente')
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      showError('Error al eliminar el producto')
    }
  }

  // Filtrar productos
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Safe category matching
    const matchesCategory = filterCategory === 'todos' || 
                           (product.category && 
                            typeof product.category === 'object' && 
                            'id' in product.category && 
                            product.category.id?.toString() === filterCategory) ||
                           ((product as { category_name?: string }).category_name?.toLowerCase().includes(
                             categories.find(c => c.id.toString() === filterCategory)?.name.toLowerCase() || ''
                           ))
    
    const matchesStatus = filterStatus === 'todos' || 
                         (filterStatus === 'activo' && product.is_active) ||
                         (filterStatus === 'inactivo' && !product.is_active)
    return matchesSearch && matchesCategory && matchesStatus
  })

  const handleOpenCreateModal = () => {
    setSelectedProduct(null)
    setShowModal(true)
  }

  const handleOpenEditModal = (product: Product) => {
    setSelectedProduct(product)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedProduct(null)
  }

  const handleSaveProduct = async () => {
    await loadData()
  }

  const handleOpenDetailsModal = (productId: number) => {
    setSelectedProductId(productId)
    setShowDetailsModal(true)
  }

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false)
    setSelectedProductId(null)
  }

  const handleEditFromDetails = () => {
    // Find the product by ID and open edit modal
    const product = products.find(p => p.id === selectedProductId)
    if (product) {
      setSelectedProduct(product)
      setShowModal(true)
      setShowDetailsModal(false)
    }
  }

  const getStatusInfo = (product: Product) => {
    // Handle different possible values for is_active
    const isActive = product.is_active !== undefined ? Boolean(product.is_active) : true
    
    if (isActive) {
      return { color: 'bg-green-100 text-green-800', text: 'Activo' }
    }
    return { color: 'bg-red-100 text-red-800', text: 'Inactivo' }
  }

  // Safe category name extraction
  const getCategoryName = (product: Product): string => {
    if (product.category && typeof product.category === 'object' && 'name' in product.category) {
      return product.category.name
    }
    if ((product as { category_name?: string }).category_name) {
      return (product as { category_name?: string }).category_name!
    }
    return 'Sin categoría'
  }

  return (
    <div className="bg-white rounded-xl shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Package className="text-meow-accent" size={28} />
            <h2 className="text-2xl font-bold text-gray-800">Gestión de Inventario</h2>
          </div>
          <button 
            className="flex items-center gap-2 bg-meow-accent text-white px-4 py-2 rounded-lg hover:bg-meow-accent/90 transition font-medium"
            onClick={handleOpenCreateModal}
          >
            <Plus size={20} />
            Nuevo Producto
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Package size={20} className="text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Total Productos</span>
            </div>
            <p className="text-2xl font-bold text-blue-900 mt-1">{stats.total_products}</p>
            <p className="text-xs text-blue-700">{stats.active_products} activos</p>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle size={20} className="text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">Stock Bajo</span>
            </div>
            <p className="text-2xl font-bold text-yellow-900 mt-1">{stats.low_stock}</p>
            <p className="text-xs text-yellow-700">variantes</p>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <TrendingDown size={20} className="text-red-600" />
              <span className="text-sm font-medium text-red-800">Sin Stock</span>
            </div>
            <p className="text-2xl font-bold text-red-900 mt-1">{stats.out_of_stock}</p>
            <p className="text-xs text-red-700">variantes</p>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Star size={20} className="text-purple-600" />
              <span className="text-sm font-medium text-purple-800">Destacados</span>
            </div>
            <p className="text-2xl font-bold text-purple-900 mt-1">{stats.featured_products}</p>
            <p className="text-xs text-purple-700">productos</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Buscar productos por nombre..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-meow-accent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-meow-accent"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="todos">Todas las categorías</option>
            {categories.map(category => (
              <option key={category.id} value={category.id.toString()}>
                {category.name}
              </option>
            ))}
          </select>
          
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-meow-accent"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="todos">Todos los estados</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {errorMessage && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {errorMessage}
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
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Producto</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Categoría</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Estado</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Destacado</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Creado</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(product => {
                  const statusInfo = getStatusInfo(product)
                  const categoryName = getCategoryName(product)
                  
                  return (
                    <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                            {product.main_image ? (
                              <img
                                src={product.main_image}
                                alt={product.name}
                                className="w-full h-full object-cover rounded-lg"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                  e.currentTarget.nextElementSibling!.classList.remove('hidden')
                                }}
                              />
                            ) : null}
                            <Package size={20} className={`text-gray-600 ${product.main_image ? 'hidden' : ''}`} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{product.name}</p>
                            <p className="text-sm text-gray-600">{product.description?.substring(0, 60) || 'Sin descripción'}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                          <Tag size={12} />
                          {categoryName}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${statusInfo.color}`}>
                          {statusInfo.text}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {product.is_featured ? (
                          <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
                            <Star size={12} />
                            Destacado
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">No destacado</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-600">
                          {new Date(product.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => handleOpenDetailsModal(product.id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Ver detalles"
                          >
                            <Eye size={16} />
                          </button>
                          
                          <button
                            onClick={() => handleOpenEditModal(product)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="Editar producto"
                          >
                            <Edit3 size={16} />
                          </button>
                          
                          <button
                            onClick={() => handleToggleActive(product.id)}
                            className={`p-2 rounded transition-colors ${
                              product.is_active 
                                ? 'text-red-600 hover:bg-red-50' 
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                            title={product.is_active ? "Desactivar producto" : "Activar producto"}
                          >
                            <Power size={16} />
                          </button>
                          
                          <button
                            onClick={() => handleToggleFeatured(product.id)}
                            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
                            title={product.is_featured ? "Quitar de destacados" : "Marcar como destacado"}
                          >
                            <Star size={16} />
                          </button>
                          
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Eliminar producto"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            
            {filteredProducts.length === 0 && !loading && (
              <div className="text-center py-12">
                <Package size={48} className="text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600">No se encontraron productos</h3>
                <p className="text-gray-500">Ajusta los filtros para ver más resultados o crea un nuevo producto.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <ProductModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onSave={handleSaveProduct}
        product={selectedProduct}
        categories={categories}
      />

      <ProductDetailsModal
        isOpen={showDetailsModal}
        onClose={handleCloseDetailsModal}
        onEdit={handleEditFromDetails}
        productId={selectedProductId}
      />
    </div>
  )
}

export default InventoryManagement