import { useState, useEffect } from 'react'
import { X, Eye, Edit, Image as ImageIcon } from 'lucide-react'
import type { Product } from '../../api/types'
import apiClient from '../../api/api'

interface ProductDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  onEdit: () => void
  productId: number | null
}

function ProductDetailsModal({ isOpen, onClose, onEdit, productId }: ProductDetailsModalProps) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadProductDetails = async () => {
      if (isOpen && productId) {
        try {
          setLoading(true)
          setError(null)
          const productData = await apiClient.getProduct(productId)
          setProduct(productData)
        } catch (error) {
          console.error('Error loading product details:', error)
          setError('Error al cargar los detalles del producto')
        } finally {
          setLoading(false)
        }
      }
    }

    loadProductDetails()
  }, [isOpen, productId])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-meow-accent/20 rounded-lg flex items-center justify-center">
              <Eye size={20} className="text-meow-accent" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                Detalles del Producto
              </h2>
              <p className="text-sm text-gray-600">
                Información completa del producto
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Editar producto"
            >
              <Edit size={20} />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-meow-accent"></div>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-center">
              {error}
            </div>
          ) : product ? (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">Información Básica</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Nombre</label>
                      <p className="text-gray-900">{product.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Descripción</label>
                      <p className="text-gray-900">{product.description || 'Sin descripción'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Categoría</label>
                      <p className="text-gray-900">{product.category?.name || (product as any).category_name || 'Sin categoría'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">Detalles Comerciales</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Precio</label>
                      <p className="text-gray-900 font-semibold">${product.price || 'No definido'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">SKU</label>
                      <p className="text-gray-900">{(product as any).sku || 'No definido'}</p>
                    </div>
                    <div className="flex gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Estado</label>
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          product.is_active !== false 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {product.is_active !== false ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Destacado</label>
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          product.is_featured 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {product.is_featured ? 'Destacado' : 'No destacado'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Images */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <ImageIcon size={16} />
                  Imágenes del Producto
                </h3>
                {product.main_image || ((product as any).images && (product as any).images.length > 0) ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {product.main_image && (
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative">
                        <img 
                          src={product.main_image} 
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = '/images/placeholder.jpg'
                          }}
                        />
                        <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
                          Principal
                        </div>
                      </div>
                    )}
                    {(product as any).images && (product as any).images.slice(0, 2).map((image: any, index: number) => (
                      <div key={image.id || index} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                        <img 
                          src={image.image} 
                          alt={image.alt_text || product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = '/images/placeholder.jpg'
                          }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="aspect-video bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center">
                    <div className="text-center">
                      <ImageIcon size={48} className="text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No hay imágenes disponibles</p>
                      <p className="text-gray-400 text-sm mt-2">
                        Este producto no tiene imágenes configuradas
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Available Sizes */}
              {product.available_sizes && product.available_sizes.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">Tallas Disponibles</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.available_sizes.map((size: string, index: number) => (
                      <span 
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {size}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-3">Información Adicional</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="block text-gray-600">Fecha de creación</label>
                    <p className="text-gray-900">{new Date(product.created_at).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</p>
                  </div>
                  {product.updated_at && (
                    <div>
                      <label className="block text-gray-600">Última modificación</label>
                      <p className="text-gray-900">{new Date(product.updated_at).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
          >
            Cerrar
          </button>
          <button
            onClick={onEdit}
            className="flex-1 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors font-medium"
          >
            Editar Producto
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProductDetailsModal