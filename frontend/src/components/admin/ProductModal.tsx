import { useState, useEffect } from 'react'
import { X, Package, FileText, Tag, DollarSign, Hash, Power, Star, Upload, Image as ImageIcon, Trash2, Plus, Edit3, Save, X as Cancel } from 'lucide-react'
import type { Product, Category, ProductImage, ProductVariant, SizeConfiguration } from '../../api/types'
import apiClient from '../../api/api'

import { useToast } from '../../contexts/ToastContext'

// Extended interfaces for admin functionality
interface ExtendedProduct extends Product {
  sku?: string;
}

interface ExtendedProductVariant extends ProductVariant {
  stock_quantity?: number;
  price_adjustment?: number;
}

interface ExtendedProductImage extends ProductImage {
  is_main?: boolean;
}

interface NewVariantData {
  size: string;
  color: string;
  stock_quantity: number;
  price_adjustment: number;
}

interface EditVariantData {
  stock_quantity: number;
  price_adjustment: number;
}

// Dynamic size options will be loaded from backend

interface ProductModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  product?: Product | null
  categories: Category[]
}

function ProductModal({ isOpen, onClose, onSave, product, categories }: ProductModalProps) {
  const { success, error: showError, warning } = useToast()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    sku: '',
    is_active: true,
    is_featured: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [images, setImages] = useState<ExtendedProductImage[]>([])
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [imageError, setImageError] = useState<string | null>(null)
  const [variants, setVariants] = useState<ExtendedProductVariant[]>([])
  const [newVariant, setNewVariant] = useState<NewVariantData>({
    size: '',
    color: '',
    stock_quantity: 0,
    price_adjustment: 0
  })
  const [editingVariant, setEditingVariant] = useState<number | null>(null)
  const [editVariantData, setEditVariantData] = useState<EditVariantData>({ stock_quantity: 0, price_adjustment: 0 })
  const [sizeOptions, setSizeOptions] = useState<SizeConfiguration[]>([])

  const isEditing = !!product

  useEffect(() => {
    if (product) {
      // Handle different category formats from different endpoints
      let categoryId = '';
      if (product.category) {
        if (typeof product.category === 'object' && 'id' in product.category) {
          categoryId = String(product.category.id);
        } else if (typeof product.category === 'number') {
          categoryId = String(product.category);
        }
      }
      
      setFormData({
        name: product.name,
        description: product.description || '',
        category: categoryId,
        price: product.price || '',
        sku: (product as ExtendedProduct).sku || '',
        is_active: product.is_active ?? true,
        is_featured: product.is_featured ?? false
      })

      // Load existing data for editing
      if (isEditing) {
        loadProductImages()
        loadProductVariants()
      }
    } else {
      setFormData({
        name: '',
        description: '',
        category: '',
        price: '',
        sku: '',
        is_active: true,
        is_featured: false
      })
      setImages([])
      setVariants([])
    }
    setError(null)
    setImageError(null)
    setSelectedFiles([])
    setNewVariant({
      size: '',
      color: '',
      stock_quantity: 0,
      price_adjustment: 0
    })
  }, [product, isOpen])

  useEffect(() => {
    if (isOpen) {
      loadSizeOptions()
    }
  }, [isOpen])

  const loadSizeOptions = async () => {
    try {
      const sizes = await apiClient.getAdminSizes()
      setSizeOptions(sizes)
    } catch (error) {
      console.error('Error loading size options:', error)
    }
  }

  const loadProductImages = async () => {
    if (!product) return
    try {
      const productImages = await apiClient.getProductImages(product.id)
      setImages(productImages)
    } catch (error) {
      console.error('Error loading product images:', error)
    }
  }

  const loadProductVariants = async () => {
    if (!product) return
    try {
      const productVariants = await apiClient.getProductVariants(product.id)
      setVariants(productVariants)
    } catch (error) {
      console.error('Error loading product variants:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validation
      if (!formData.name || !formData.category || !formData.price) {
        throw new Error('Por favor completa todos los campos requeridos')
      }

      const productData = {
        name: formData.name,
        description: formData.description,
        category: parseInt(formData.category),
        price: formData.price,
        sku: formData.sku,
        is_active: formData.is_active,
        is_featured: formData.is_featured
      }

      let savedProduct: Product

      if (isEditing) {
        // Update product
        savedProduct = await apiClient.updateProduct(product!.id, productData)
      } else {
        // Create product
        savedProduct = await apiClient.createProduct(productData)
      }

      // Upload selected images if any
      if (selectedFiles.length > 0) {
        console.log('Uploading images for product:', savedProduct);
        
        if (!savedProduct || !savedProduct.id) {
          throw new Error('No se pudo obtener el ID del producto guardado');
        }

        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i]
          const isMainImage = i === 0 && !isEditing // First image is main for new products
          try {
            await apiClient.uploadProductImage(savedProduct.id, file, file.name, isMainImage)
          } catch (imageError) {
            console.error(`Error uploading image ${file.name}:`, imageError)
            // Continue with other images even if one fails
          }
        }
      }

      // Create variants for new products
      if (!isEditing && variants.length > 0) {
        for (const variant of variants) {
          try {
            await apiClient.createProductVariant(savedProduct.id, {
              size: variant.size,
              color: variant.color || '',
              stock_quantity: variant.stock_quantity || 0,
              price_adjustment: variant.price_adjustment || 0
            })
          } catch (variantError) {
            console.error(`Error creating variant ${variant.size}-${variant.color}:`, variantError)
            // Continue with other variants even if one fails
          }
        }
      }

      success(isEditing ? 'Producto actualizado exitosamente' : 'Producto creado exitosamente')
      onSave()
      onClose()
    } catch (error: unknown) {
      console.error('Error saving product:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error al guardar el producto'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const validFiles: File[] = []
    const maxSize = 5 * 1024 * 1024 // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      if (!allowedTypes.includes(file.type)) {
        setImageError(`Archivo ${file.name}: Tipo de archivo no permitido. Use JPG, PNG o WEBP.`)
        continue
      }
      
      if (file.size > maxSize) {
        setImageError(`Archivo ${file.name}: Tamaño máximo permitido es 5MB.`)
        continue
      }
      
      validFiles.push(file)
    }

    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles])
      setImageError(null)
    }
  }

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const removeExistingImage = async (imageId: number) => {
    try {
      await apiClient.deleteProductImage(imageId)
      await loadProductImages()
    } catch (error) {
      console.error('Error deleting image:', error)
      setImageError('Error al eliminar la imagen')
    }
  }

  const setAsMainImage = async (imageId: number) => {
    try {
      await apiClient.setMainProductImage(imageId)
      await loadProductImages()
    } catch (error) {
      console.error('Error setting main image:', error)
      setImageError('Error al establecer imagen principal')
    }
  }

  const addVariant = async () => {
    if (!newVariant.size || !newVariant.color) {
      warning('Por favor completa talla y color')
      return
    }

    if (isEditing && product) {
      try {
        await apiClient.createProductVariant(product.id, {
          size: newVariant.size,
          color: newVariant.color || '',
          stock_quantity: newVariant.stock_quantity,
          price_adjustment: newVariant.price_adjustment
        })
        await loadProductVariants()
        setNewVariant({ size: '', color: '', stock_quantity: 0, price_adjustment: 0 })
      } catch (error) {
        console.error('Error creating variant:', error)
        showError('Error al crear la variante')
      }
    } else {
      // For new products, add to temporary list
      const tempVariant = {
        id: Date.now(), // Temporary ID
        product: 0,
        size: newVariant.size,
        color: newVariant.color,
        stock_quantity: newVariant.stock_quantity,
        price_adjustment: newVariant.price_adjustment,
        final_price: parseFloat(formData.price) + newVariant.price_adjustment,
        is_in_stock: newVariant.stock_quantity > 0,
        stock: newVariant.stock_quantity,
        price: (parseFloat(formData.price) + newVariant.price_adjustment).toString(),
        sku: ''
      }
      setVariants([...variants, tempVariant])
      setNewVariant({ size: '', color: '', stock_quantity: 0, price_adjustment: 0 })
    }
  }

  const removeVariant = async (variantId: number) => {
    if (isEditing) {
      try {
        await apiClient.deleteProductVariant(variantId)
        await loadProductVariants()
      } catch (error) {
        console.error('Error deleting variant:', error)
        showError('Error al eliminar la variante')
      }
    } else {
      setVariants(variants.filter(v => v.id !== variantId))
    }
  }

  const startEditVariant = (variant: ProductVariant) => {
    setEditingVariant(variant.id)
    setEditVariantData({
      stock_quantity: (variant as ExtendedProductVariant).stock_quantity || variant.stock || 0,
      price_adjustment: (variant as ExtendedProductVariant).price_adjustment || 0
    })
  }

  const cancelEditVariant = () => {
    setEditingVariant(null)
    setEditVariantData({ stock_quantity: 0, price_adjustment: 0 })
  }

  const saveEditVariant = async () => {
    if (!editingVariant) return

    try {
      await apiClient.updateProductVariant(editingVariant, editVariantData)
      await loadProductVariants()
      setEditingVariant(null)
      setEditVariantData({ stock_quantity: 0, price_adjustment: 0 })
    } catch (error) {
      console.error('Error updating variant:', error)
      showError('Error al actualizar la variante')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-meow-accent/20 rounded-lg flex items-center justify-center">
              <Package size={20} className="text-meow-accent" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                {isEditing ? 'Editar Producto' : 'Crear Nuevo Producto'}
              </h2>
              <p className="text-sm text-gray-600">
                {isEditing ? 'Actualiza la información del producto' : 'Completa los datos del nuevo producto'}
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Basic Information */}
            <div className="space-y-4">
              {/* Name */}
              <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Package size={16} className="inline mr-2" />
                Nombre del Producto *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-meow-accent text-sm"
                placeholder="Ej: Camiseta Meow Edition"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText size={16} className="inline mr-2" />
                Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-meow-accent text-sm"
                placeholder="Descripción del producto..."
                rows={3}
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag size={16} className="inline mr-2" />
                Categoría *
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-meow-accent text-sm"
                required
              >
                <option value="">Selecciona una categoría</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id.toString()}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign size={16} className="inline mr-2" />
                Precio *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => handleChange('price', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-meow-accent text-sm"
                placeholder="0.00"
                required
              />
            </div>

            {/* SKU */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Hash size={16} className="inline mr-2" />
                SKU (Código)
              </label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => handleChange('sku', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-meow-accent text-sm"
                placeholder="Ej: SHIRT-001"
              />
            </div>

            {/* Status checkboxes */}
            <div className="space-y-3 pt-4 border-t">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => handleChange('is_active', e.target.checked)}
                  className="mr-3"
                />
                <Power size={16} className="mr-2 text-green-600" />
                <span className="text-sm font-medium">Producto Activo</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) => handleChange('is_featured', e.target.checked)}
                  className="mr-3"
                />
                <Star size={16} className="mr-2 text-yellow-600" />
                <span className="text-sm font-medium">Producto Destacado</span>
              </label>
            </div>
            </div>

            {/* Right Column: Images and Variants */}
            <div className="space-y-4">
              {/* Images Section */}
            <div className="pt-4 border-t">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <ImageIcon size={16} className="inline mr-2" />
                Imágenes del Producto
              </label>
              
              {/* Existing Images (for editing) */}
              {isEditing && images.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Imágenes actuales:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {images.map((image) => (
                      <div key={image.id} className="relative group">
                        <img
                          src={image.image}
                          alt={image.alt_text || 'Imagen del producto'}
                          className={`w-full h-24 object-cover rounded-lg border ${image.is_main || image.is_primary ? 'border-green-500 border-2' : 'border-gray-200'}`}
                        />
                        {(image.is_main || image.is_primary) && (
                          <div className="absolute top-1 left-1 bg-green-500 text-white text-xs px-1 rounded">
                            Principal
                          </div>
                        )}
                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex gap-1">
                            {!(image.is_main || image.is_primary) && (
                              <button
                                type="button"
                                onClick={() => setAsMainImage(image.id)}
                                className="p-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                                title="Establecer como principal"
                              >
                                ★
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => removeExistingImage(image.id)}
                              className="p-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                              title="Eliminar imagen"
                            >
                              <Trash2 size={10} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Selected Files Preview */}
              {selectedFiles.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    {isEditing ? 'Nuevas imágenes a subir:' : 'Imágenes seleccionadas:'}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-full h-24 object-cover rounded-lg border border-gray-200"
                        />
                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => removeSelectedFile(index)}
                            className="p-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                            title="Eliminar"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                        {index === 0 && !isEditing && (
                          <div className="absolute bottom-1 left-1 bg-green-500 text-white text-xs px-1 rounded">
                            Principal
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* File Input */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <Upload size={24} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-sm font-medium text-gray-700">
                    Seleccionar imágenes
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    JPG, PNG, WEBP hasta 5MB cada una
                  </p>
                </label>
              </div>

              {imageError && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
                  {imageError}
                </div>
              )}
            </div>

            {/* Variants Section */}
            <div className="pt-4 border-t">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Package size={16} className="inline mr-2" />
                Variantes del Producto (Tallas y Stock)
              </label>

              {/* Existing Variants */}
              {variants.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Variantes existentes:</p>
                  <div className="space-y-2">
                    {variants.map((variant) => (
                      <div key={variant.id} className="p-3 bg-gray-50 rounded-lg">
                        {editingVariant === variant.id ? (
                          // Edit mode
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="font-medium">{variant.size}</span>
                              <span className="text-gray-600">{variant.color}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Stock</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={editVariantData.stock_quantity}
                                  onChange={(e) => setEditVariantData({
                                    ...editVariantData,
                                    stock_quantity: parseInt(e.target.value) || 0
                                  })}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Ajuste ($)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editVariantData.price_adjustment}
                                  onChange={(e) => setEditVariantData({
                                    ...editVariantData,
                                    price_adjustment: parseFloat(e.target.value) || 0
                                  })}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={saveEditVariant}
                                className="flex items-center gap-1 px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                              >
                                <Save size={12} />
                                Guardar
                              </button>
                              <button
                                type="button"
                                onClick={cancelEditVariant}
                                className="flex items-center gap-1 px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                              >
                                <Cancel size={12} />
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          // View mode
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <span className="text-sm font-medium">{variant.size}</span>
                              <span className="text-sm text-gray-600">{variant.color}</span>
                              <span className="text-sm">
                                Stock: <span className={((variant as ExtendedProductVariant).stock_quantity || variant.stock || 0) > 0 ? 'text-green-600' : 'text-red-600'}>
                                  {(variant as ExtendedProductVariant).stock_quantity || variant.stock || 0}
                                </span>
                              </span>
                              {((variant as ExtendedProductVariant).price_adjustment || 0) !== 0 && (
                                <span className="text-sm text-blue-600">
                                  Ajuste: ${(variant as ExtendedProductVariant).price_adjustment || 0}
                                </span>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => startEditVariant(variant)}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Editar variante"
                              >
                                <Edit3 size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeVariant(variant.id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Eliminar variante"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add New Variant */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Agregar Nueva Variante</h4>
                <div className="grid grid-cols-2 gap-3">
                  {/* Size */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Talla</label>
                    <select
                      value={newVariant.size}
                      onChange={(e) => setNewVariant({ ...newVariant, size: e.target.value })}
                      className="w-full px-2 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-meow-accent"
                    >
                      <option value="">Seleccionar talla</option>
                      {sizeOptions.map(size => (
                        <option key={size.code} value={size.code}>{size.name} ({size.code})</option>
                      ))}
                    </select>
                  </div>

                  {/* Color */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Color</label>
                    <input
                      type="text"
                      value={newVariant.color}
                      onChange={(e) => setNewVariant({ ...newVariant, color: e.target.value })}
                      className="w-full px-2 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-meow-accent"
                      placeholder="Ej: Negro, Blanco, Azul"
                    />
                  </div>

                  {/* Stock */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Stock</label>
                    <input
                      type="number"
                      min="0"
                      value={newVariant.stock_quantity}
                      onChange={(e) => setNewVariant({ ...newVariant, stock_quantity: parseInt(e.target.value) || 0 })}
                      className="w-full px-2 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-meow-accent"
                      placeholder="0"
                    />
                  </div>

                  {/* Price Adjustment */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Ajuste de Precio ($)
                      <span className="text-xs text-gray-500 ml-1">(opcional)</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newVariant.price_adjustment}
                      onChange={(e) => setNewVariant({ ...newVariant, price_adjustment: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-meow-accent"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={addVariant}
                  className="mt-3 flex items-center gap-2 px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                >
                  <Plus size={16} />
                  Agregar Variante
                </button>
              </div>
            </div>
            </div>
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
              {loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear Producto')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProductModal