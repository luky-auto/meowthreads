// src/pages/Products.tsx
import { useState, useEffect } from 'react'
import type { Product, Category, ProductVariant, ProductImage } from '../api/types'
import apiClient from '../api/api'

interface ProductWithVariants extends Product {
  variants: ProductVariant[];
  images: ProductImage[];
}

// Componente individual para cada producto
const ProductCard = ({ product }: { product: ProductWithVariants }) => {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [customQuantity, setCustomQuantity] = useState('');
  const [useCustomQuantity, setUseCustomQuantity] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleQuantityChange = (value: string) => {
    if (value === 'custom') {
      setUseCustomQuantity(true);
      setQuantity(0);
    } else {
      setUseCustomQuantity(false);
      setQuantity(parseInt(value));
      setCustomQuantity('');
    }
  };

  const handleCustomQuantityChange = (value: string) => {
    if (!selectedVariant) return;
    
    const numValue = parseInt(value);
    const variantStock = selectedVariant.stock || selectedVariant.stock_quantity || 0;
    if (!isNaN(numValue) && numValue > 0 && numValue <= variantStock) {
      setCustomQuantity(value);
      setQuantity(numValue);
    } else if (value === '') {
      setCustomQuantity('');
      setQuantity(0);
    }
  };

  const handleAddToCart = async () => {
    if (!selectedVariant) {
      alert('Por favor selecciona una talla');
      return;
    }
    if (quantity <= 0) {
      alert('Por favor selecciona una cantidad válida');
      return;
    }
    const variantStock = selectedVariant.stock || selectedVariant.stock_quantity || 0;
    if (quantity > variantStock) {
      alert(`Solo hay ${variantStock} unidades disponibles`);
      return;
    }

    try {
      setLoading(true);
      await apiClient.addToCart(selectedVariant.id, quantity);
      alert(`${product.name} agregado al carrito!\nTalla: ${selectedVariant.size}\nCantidad: ${quantity}`);
      
      // Reset form
      setSelectedVariant(null);
      setQuantity(1);
      setCustomQuantity('');
      setUseCustomQuantity(false);
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Error al agregar al carrito. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Generar opciones de cantidad (máximo 5, luego opción personalizada)
  const quantityOptions = [];
  const variantStock = selectedVariant ? (selectedVariant.stock || selectedVariant.stock_quantity || 0) : 0;
  const maxOptions = selectedVariant ? Math.min(5, variantStock) : 5;
  
  for (let i = 1; i <= maxOptions; i++) {
    quantityOptions.push(i);
  }

  // Get primary image or first available image
  const primaryImage = product.images.find(img => img.is_primary) || product.images[0];
  const totalStock = product.variants.reduce((sum, variant) => sum + (variant.stock || variant.stock_quantity || 0), 0);
  
  // Calculate price range from variants
  const getProductPrice = () => {
    if (selectedVariant) {
      return `$${selectedVariant.price}`;
    }
    
    if (product.variants.length === 0) {
      // No variants, show base product price
      return product.price ? `$${parseFloat(product.price).toLocaleString()}` : 'Precio no disponible';
    }
    
    const prices = product.variants.map(v => parseFloat(v.price));
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    if (minPrice === maxPrice) {
      return `$${minPrice.toLocaleString()}`;
    } else {
      return `Desde $${minPrice.toLocaleString()}`;
    }
  };

  return (
    <div className="border border-meow-border rounded-xl p-4 bg-meow-form shadow">
      <img
        src={primaryImage?.image || '/images/placeholder.webp'}
        alt={primaryImage?.alt_text || product.name}
        className="w-full h-[250px] object-cover rounded-lg mb-4"
      />
      <h2 className="text-xl font-semibold text-meow-text">{product.name}</h2>
      <p className="text-sm text-gray-600 mb-2">{product.description}</p>
      <p className="text-meow-accent font-bold mb-2">
        {getProductPrice()}
      </p>
      
      {/* Stock disponible */}
      <p className="text-sm text-meow-text mb-3">
        <span className={`font-medium ${totalStock > 5 ? 'text-green-600' : totalStock > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
          {totalStock > 0 ? `${totalStock} disponibles` : 'Agotado'}
        </span>
      </p>

      {totalStock > 0 && (
        <>
          {/* Selector de variante */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-meow-text mb-1">
              Talla/Color:
            </label>
            <select
              value={selectedVariant?.id || ''}
              onChange={(e) => {
                const variant = product.variants.find(v => v.id === parseInt(e.target.value));
                setSelectedVariant(variant || null);
                setQuantity(1);
                setUseCustomQuantity(false);
                setCustomQuantity('');
              }}
              className="w-full px-3 py-2 border border-meow-border rounded-md focus:outline-none focus:ring-2 focus:ring-meow-accent text-sm"
            >
              <option value="">Seleccionar opción</option>
              {product.variants
                .filter(variant => (variant.stock || variant.stock_quantity || 0) > 0)
                .map((variant) => {
                  const stock = variant.stock || variant.stock_quantity || 0;
                  return (
                    <option key={variant.id} value={variant.id}>
                      {variant.size} {variant.color ? `- ${variant.color}` : ''} 
                      ({stock} disponibles) - ${variant.price}
                    </option>
                  );
                  })}
            </select>
          </div>

          {/* Selector de cantidad */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-meow-text mb-1">
              Cantidad:
            </label>
            {!useCustomQuantity ? (
              <select
                value={quantity}
                onChange={(e) => handleQuantityChange(e.target.value)}
                className="w-full px-3 py-2 border border-meow-border rounded-md focus:outline-none focus:ring-2 focus:ring-meow-accent text-sm"
              >
                <option value={1}>1</option>
                {quantityOptions.slice(1).map((num) => (
                  <option key={num} value={num}>
                    {num}
                  </option>
                ))}
                {selectedVariant && selectedVariant.stock > 5 && (
                  <option value="custom">Más de 5 (especificar)</option>
                )}
              </select>
            ) : (
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  max={variantStock}
                  value={customQuantity}
                  onChange={(e) => handleCustomQuantityChange(e.target.value)}
                  placeholder={`Máx. ${variantStock}`}
                  className="flex-1 px-3 py-2 border border-meow-border rounded-md focus:outline-none focus:ring-2 focus:ring-meow-accent text-sm"
                />
                <button
                  onClick={() => {
                    setUseCustomQuantity(false);
                    setQuantity(1);
                    setCustomQuantity('');
                  }}
                  className="px-3 py-2 text-sm text-meow-text hover:text-meow-accent"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          <button 
            onClick={handleAddToCart}
            disabled={!selectedVariant || loading}
            className="w-full bg-meow-accent text-white px-4 py-2 rounded hover:bg-meow-accent/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Agregando...' : 'Agregar al carrito'}
          </button>
        </>
      )}

      {totalStock === 0 && (
        <button 
          disabled
          className="w-full bg-gray-400 text-white px-4 py-2 rounded cursor-not-allowed"
        >
          Agotado
        </button>
      )}
    </div>
  );
};

const Products = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage] = useState(1);

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [currentPage, selectedCategory, searchTerm]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const categoryId = selectedCategory ? parseInt(selectedCategory) : undefined;
      const response = await apiClient.getProducts(currentPage, categoryId, searchTerm);
      
      // Load variants and images for each product
      const productsWithDetails = await Promise.all(
        response.results.map(async (product) => {
          const [variants, images] = await Promise.all([
            apiClient.getProductVariants(product.id),
            apiClient.getProductImages(product.id)
          ]);
          
          return {
            ...product,
            variants,
            images
          } as ProductWithVariants;
        })
      );
      
      setProducts(productsWithDetails);
    } catch (error) {
      console.error('Error loading products:', error);
      setError('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const categoriesData = await apiClient.getCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const filteredProducts = products;

  return (
    <div className="bg-meow-background min-h-screen text-meow-text">
        <div className="py-10 px-4 max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-meow-text mb-6">Productos disponibles</h1>

          {/* Buscador y filtros */}
          <div className="mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-1/2 px-4 py-2 border border-meow-border rounded-md focus:outline-none focus:ring-2 focus:ring-meow-accent"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full md:w-1/4 px-4 py-2 border border-meow-border rounded-md focus:outline-none focus:ring-2 focus:ring-meow-accent"
            >
              <option value="">Todas las categorías</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id.toString()}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

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
            <>
              {/* Mostrar cantidad de productos encontrados */}
              <div className="mb-4">
                <p className="text-meow-text">
                  {filteredProducts.length === 1 
                    ? '1 producto encontrado'
                    : `${filteredProducts.length} productos encontrados`
                  }
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {filteredProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {filteredProducts.length === 0 && !loading && (
                <div className="text-center py-8">
                  <p className="text-meow-text text-lg">No se encontraron productos.</p>
                </div>
              )}
            </>
          )}
        </div>
    </div>
  )
}

export default Products;
