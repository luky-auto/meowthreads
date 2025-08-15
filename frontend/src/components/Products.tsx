// src/pages/Products.tsx
import { useState } from 'react'

interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
  image: string;
  sizes: string[];
  stock: number;
  category: string;
}

const products: Product[] = [
  {
    id: 1,
    name: 'Camiseta Gatuna',
    description: 'Camiseta con estampado de gato',
    price: '$35.000',
    image: '/images/camiseta1.webp',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    stock: 15,
    category: 'camisetas'
  },
  {
    id: 2,
    name: 'Accesorio Gatuno',
    description: 'Collar de gato personalizado',
    price: '$20.000',
    image: '/images/collar1.webp',
    sizes: ['Único'],
    stock: 8,
    category: 'accesorios'
  },
  {
    id: 3,
    name: 'Saco Edición Limitada',
    description: 'Saco exclusivo MeowThreads',
    price: '$170.000',
    image: '/images/saco1.webp',
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 3,
    category: 'edicion'
  },
  {
    id: 4,
    name: 'Pantalon Edición Limitada',
    description: 'Pantalon exclusivo MeowThreads',
    price: '$270.000',
    image: '/images/pantalon1.webp',
    sizes: ['28', '30', '32', '34', '36', '38'],
    stock: 12,
    category: 'edicion'
  },
  {
    id: 5,
    name: 'Medias Edición Limitada',
    description: 'Medias exclusivo MeowThreads',
    price: '$70.000',
    image: '/images/medias1.webp',
    sizes: ['S', 'M', 'L'],
    stock: 20,
    category: 'edicion'
  },
  {
    id: 6,
    name: 'Zapatos Edición Limitada',
    description: 'Zapatos exclusivo MeowThreads',
    price: '$370.000',
    image: '/images/zapatos1.webp',
    sizes: ['36', '37', '38', '39', '40', '41', '42'],
    stock: 6,
    category: 'edicion'
  }
]

// Componente individual para cada producto
const ProductCard = ({ product }: { product: Product }) => {
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [customQuantity, setCustomQuantity] = useState('');
  const [useCustomQuantity, setUseCustomQuantity] = useState(false);

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
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue > 0 && numValue <= product.stock) {
      setCustomQuantity(value);
      setQuantity(numValue);
    } else if (value === '') {
      setCustomQuantity('');
      setQuantity(0);
    }
  };

  const handleAddToCart = () => {
    if (!selectedSize) {
      alert('Por favor selecciona una talla');
      return;
    }
    if (quantity <= 0) {
      alert('Por favor selecciona una cantidad válida');
      return;
    }
    if (quantity > product.stock) {
      alert(`Solo hay ${product.stock} unidades disponibles`);
      return;
    }

    console.log('Agregado al carrito:', {
      product: product.name,
      size: selectedSize,
      quantity: quantity,
      price: product.price
    });

    // Aquí iría la lógica para agregar al carrito
    alert(`${product.name} agregado al carrito!\nTalla: ${selectedSize}\nCantidad: ${quantity}`);
  };

  // Generar opciones de cantidad (máximo 5, luego opción personalizada)
  const quantityOptions = [];
  const maxOptions = Math.min(5, product.stock);
  
  for (let i = 1; i <= maxOptions; i++) {
    quantityOptions.push(i);
  }

  return (
    <div className="border border-meow-border rounded-xl p-4 bg-meow-form shadow">
      <img
        src={product.image}
        alt={product.name}
        className="w-full h-[250px] object-cover rounded-lg mb-4"
      />
      <h2 className="text-xl font-semibold text-meow-text">{product.name}</h2>
      <p className="text-sm text-gray-600 mb-2">{product.description}</p>
      <p className="text-meow-accent font-bold mb-2">{product.price}</p>
      
      {/* Stock disponible */}
      <p className="text-sm text-meow-text mb-3">
        <span className={`font-medium ${product.stock > 5 ? 'text-green-600' : product.stock > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
          {product.stock > 0 ? `${product.stock} disponibles` : 'Agotado'}
        </span>
      </p>

      {product.stock > 0 && (
        <>
          {/* Selector de talla */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-meow-text mb-1">
              Talla:
            </label>
            <select
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
              className="w-full px-3 py-2 border border-meow-border rounded-md focus:outline-none focus:ring-2 focus:ring-meow-accent text-sm"
            >
              <option value="">Seleccionar talla</option>
              {product.sizes.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
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
                {product.stock > 5 && (
                  <option value="custom">Más de 5 (especificar)</option>
                )}
              </select>
            ) : (
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  max={product.stock}
                  value={customQuantity}
                  onChange={(e) => handleCustomQuantityChange(e.target.value)}
                  placeholder={`Máx. ${product.stock}`}
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
            className="w-full bg-meow-accent text-white px-4 py-2 rounded hover:bg-meow-accent/90 transition"
          >
            Agregar al carrito
          </button>
        </>
      )}

      {product.stock === 0 && (
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

  // Filtrar productos
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
            <option value="camisetas">Camisetas</option>
            <option value="accesorios">Accesorios</option>
            <option value="edicion">Edición limitada</option>
            </select>
        </div>

        {/* Mostrar cantidad de productos encontrados */}
        <div className="mb-4">
          <p className="text-meow-text">
            {filteredProducts.length === products.length 
              ? `Mostrando todos los ${products.length} productos`
              : `Mostrando ${filteredProducts.length} de ${products.length} productos`
            }
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-8">
            <p className="text-meow-text text-lg">No se encontraron productos que coincidan con tu búsqueda.</p>
          </div>
        )}
        </div>
    </div>
  )
}

export default Products;
