import { useState } from 'react'
import { 
  Package, 
  Plus, 
  Search, 
  Edit3,
  Trash2,
  AlertTriangle,
  TrendingDown,
  Eye,
  Tag,
  DollarSign
} from 'lucide-react'

interface Product {
  id: number
  name: string
  category: string
  price: number
  stock: number
  minStock: number
  status: 'activo' | 'agotado' | 'descontinuado'
  image: string
  sku: string
  createdAt: string
}

interface Category {
  id: string
  name: string
  count: number
}

function InventoryManagement() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('todos')
  const [filterStatus, setFilterStatus] = useState<string>('todos')
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Categorías disponibles
  const categories: Category[] = [
    { id: 'camisetas', name: 'Camisetas', count: 15 },
    { id: 'pantalones', name: 'Pantalones', count: 8 },
    { id: 'sacos', name: 'Sacos', count: 6 },
    { id: 'zapatos', name: 'Zapatos', count: 12 },
    { id: 'accesorios', name: 'Accesorios', count: 6 }
  ]

  // Datos de ejemplo de productos
  const [products, setProducts] = useState<Product[]>([
    {
      id: 1,
      name: 'Camiseta Gatuna Básica',
      category: 'camisetas',
      price: 35000,
      stock: 25,
      minStock: 10,
      status: 'activo',
      image: '/images/camiseta1.webp',
      sku: 'CAM-001',
      createdAt: '2024-01-15'
    },
    {
      id: 2,
      name: 'Pantalón Felino Elegante',
      category: 'pantalones',
      price: 85000,
      stock: 5,
      minStock: 8,
      status: 'activo',
      image: '/images/pantalon1.webp',
      sku: 'PAN-001',
      createdAt: '2024-01-20'
    },
    {
      id: 3,
      name: 'Saco Edición Limitada',
      category: 'sacos',
      price: 170000,
      stock: 0,
      minStock: 3,
      status: 'agotado',
      image: '/images/saco1.webp',
      sku: 'SAC-001',
      createdAt: '2024-02-01'
    },
    {
      id: 4,
      name: 'Zapatos Gatunos Premium',
      category: 'zapatos',
      price: 370000,
      stock: 12,
      minStock: 5,
      status: 'activo',
      image: '/images/zapatos1.webp',
      sku: 'ZAP-001',
      createdAt: '2024-02-10'
    },
    {
      id: 5,
      name: 'Collar Vintage',
      category: 'accesorios',
      price: 45000,
      stock: 8,
      minStock: 15,
      status: 'activo',
      image: '/images/collar1.webp',
      sku: 'COL-001',
      createdAt: '2024-02-15'
    }
  ])

  // Filtrar productos
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'todos' || product.category === filterCategory
    const matchesStatus = filterStatus === 'todos' || product.status === filterStatus
    
    return matchesSearch && matchesCategory && matchesStatus
  })

  const getStockStatus = (product: Product) => {
    if (product.stock === 0) return 'sin-stock'
    if (product.stock <= product.minStock) return 'stock-bajo'
    return 'stock-normal'
  }

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'sin-stock': return 'text-red-600 bg-red-50'
      case 'stock-bajo': return 'text-orange-600 bg-orange-50'
      default: return 'text-green-600 bg-green-50'
    }
  }

  const getStockStatusText = (status: string) => {
    switch (status) {
      case 'sin-stock': return 'Sin Stock'
      case 'stock-bajo': return 'Stock Bajo'
      default: return 'Stock Normal'
    }
  }

  const handleDeleteProduct = (productId: number) => {
    if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      setProducts(products.filter(product => product.id !== productId))
    }
  }

  const CreateProductModal = () => {
    const [newProduct, setNewProduct] = useState({
      name: '',
      category: 'camisetas',
      price: 0,
      stock: 0,
      minStock: 0,
      sku: '',
      image: ''
    })

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      const product: Product = {
        id: Math.max(...products.map(p => p.id), 0) + 1,
        ...newProduct,
        status: newProduct.stock > 0 ? 'activo' : 'agotado',
        createdAt: new Date().toISOString().split('T')[0]
      }
      setProducts([...products, product])
      setShowCreateModal(false)
      setNewProduct({
        name: '',
        category: 'camisetas',
        price: 0,
        stock: 0,
        minStock: 0,
        sku: '',
        image: ''
      })
    }

    if (!showCreateModal) return null

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Crear Nuevo Producto</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Producto
              </label>
              <input
                type="text"
                required
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-meow-accent focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SKU
              </label>
              <input
                type="text"
                required
                value={newProduct.sku}
                onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-meow-accent focus:border-transparent"
                placeholder="Ej: CAM-002"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría
              </label>
              <select
                value={newProduct.category}
                onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-meow-accent focus:border-transparent"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio ($)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-meow-accent focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock Actual
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={newProduct.stock}
                  onChange={(e) => setNewProduct({ ...newProduct, stock: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-meow-accent focus:border-transparent"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock Mínimo
              </label>
              <input
                type="number"
                required
                min="0"
                value={newProduct.minStock}
                onChange={(e) => setNewProduct({ ...newProduct, minStock: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-meow-accent focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL de Imagen
              </label>
              <input
                type="text"
                value={newProduct.image}
                onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-meow-accent focus:border-transparent"
                placeholder="/images/producto.webp"
              />
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
                Crear Producto
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  // Estadísticas
  const totalProducts = products.length
  const lowStockProducts = products.filter(p => p.stock <= p.minStock && p.stock > 0).length
  const outOfStockProducts = products.filter(p => p.stock === 0).length
  const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Package className="text-meow-accent" size={28} />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Gestión de Inventario</h1>
              <p className="text-gray-600">Administra productos, stock y categorías</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-meow-accent text-white px-4 py-2 rounded-lg hover:bg-meow-accent/90 transition-colors"
          >
            <Plus size={18} />
            Nuevo Producto
          </button>
        </div>

        {/* Filtros y búsqueda */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por nombre o SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-meow-accent focus:border-transparent"
            />
          </div>
          
          <div className="flex gap-3">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-meow-accent focus:border-transparent"
            >
              <option value="todos">Todas las categorías</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-meow-accent focus:border-transparent"
            >
              <option value="todos">Todos los estados</option>
              <option value="activo">Activos</option>
              <option value="agotado">Agotados</option>
              <option value="descontinuado">Descontinuados</option>
            </select>
          </div>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Package className="text-blue-500" size={24} />
            <h3 className="font-semibold text-gray-800">Total Productos</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalProducts}</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="text-orange-500" size={24} />
            <h3 className="font-semibold text-gray-800">Stock Bajo</h3>
          </div>
          <p className="text-2xl font-bold text-orange-600">{lowStockProducts}</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <TrendingDown className="text-red-500" size={24} />
            <h3 className="font-semibold text-gray-800">Agotados</h3>
          </div>
          <p className="text-2xl font-bold text-red-600">{outOfStockProducts}</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="text-green-500" size={24} />
            <h3 className="font-semibold text-gray-800">Valor Inventario</h3>
          </div>
          <p className="text-2xl font-bold text-green-600">
            ${totalValue.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Tabla de productos */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-3 px-6 font-medium text-gray-600">Producto</th>
                <th className="text-left py-3 px-6 font-medium text-gray-600">SKU</th>
                <th className="text-left py-3 px-6 font-medium text-gray-600">Categoría</th>
                <th className="text-left py-3 px-6 font-medium text-gray-600">Precio</th>
                <th className="text-left py-3 px-6 font-medium text-gray-600">Stock</th>
                <th className="text-left py-3 px-6 font-medium text-gray-600">Estado</th>
                <th className="text-left py-3 px-6 font-medium text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product)
                return (
                  <tr key={product.id} className="border-b hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                          {product.image ? (
                            <img 
                              src={product.image} 
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="text-gray-400" size={20} />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{product.name}</p>
                          <p className="text-sm text-gray-600">Creado: {product.createdAt}</p>
                        </div>
                      </div>
                    </td>
                    
                    <td className="py-4 px-6 font-mono text-sm text-gray-600">
                      {product.sku}
                    </td>
                    
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                        <Tag size={12} />
                        {categories.find(c => c.id === product.category)?.name || product.category}
                      </span>
                    </td>
                    
                    <td className="py-4 px-6 font-semibold text-gray-800">
                      ${product.price.toLocaleString()}
                    </td>
                    
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{product.stock}</span>
                        <span className="text-sm text-gray-500">/ min: {product.minStock}</span>
                      </div>
                    </td>
                    
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStockStatusColor(stockStatus)}`}>
                        {getStockStatusText(stockStatus)}
                      </span>
                    </td>
                    
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <button
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Ver detalles"
                        >
                          <Eye size={16} />
                        </button>
                        
                        <button
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Editar producto"
                        >
                          <Edit3 size={16} />
                        </button>
                        
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
        </div>
        
        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600">No se encontraron productos</p>
          </div>
        )}
      </div>

      <CreateProductModal />
    </div>
  )
}

export default InventoryManagement
