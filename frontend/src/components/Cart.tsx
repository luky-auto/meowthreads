// src/pages/Cart.tsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react'

interface CartItem {
  id: number;
  name: string;
  description: string;
  price: number;
  quantity: number;
  size: string;
  image: string;
  stock: number;
  category: string;
}

// Datos de ejemplo del carrito (normalmente vendrían de un contexto/estado global)
const initialCartItems: CartItem[] = [
  {
    id: 1,
    name: 'Camiseta Gatuna',
    description: 'Camiseta con estampado de gato',
    price: 35000,
    quantity: 2,
    size: 'M',
    image: '/images/camiseta1.webp',
    stock: 15,
    category: 'camisetas'
  },
  {
    id: 2,
    name: 'Accesorio Gatuno',
    description: 'Collar de gato personalizado',
    price: 20000,
    quantity: 1,
    size: 'Único',
    image: '/images/collar1.webp',
    stock: 8,
    category: 'accesorios'
  },
  {
    id: 3,
    name: 'Saco Edición Limitada',
    description: 'Saco exclusivo MeowThreads',
    price: 170000,
    quantity: 1,
    size: 'L',
    image: '/images/saco1.webp',
    stock: 3,
    category: 'edicion'
  }
]

const CartItemCard = ({ 
  item, 
  onUpdateQuantity, 
  onRemoveItem 
}: { 
  item: CartItem;
  onUpdateQuantity: (id: number, newQuantity: number) => void;
  onRemoveItem: (id: number) => void;
}) => {
  const [isRemoving, setIsRemoving] = useState(false);

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem();
      return;
    }
    if (newQuantity > item.stock) {
      alert(`Solo hay ${item.stock} unidades disponibles`);
      return;
    }
    onUpdateQuantity(item.id, newQuantity);
  };

  const handleRemoveItem = () => {
    setIsRemoving(true);
    setTimeout(() => {
      onRemoveItem(item.id);
    }, 200);
  };

  const subtotal = item.price * item.quantity;

  return (
    <div className={`flex flex-col md:flex-row items-start md:items-center bg-white border border-meow-border rounded-xl p-4 shadow transition-all duration-200 ${isRemoving ? 'opacity-50 scale-95' : ''}`}>
      {/* Imagen del producto */}
      <div className="w-full md:w-24 h-24 flex-shrink-0 mb-3 md:mb-0 md:mr-4">
        <img 
          src={item.image} 
          alt={item.name} 
          className="w-full h-full object-cover rounded-lg"
        />
      </div>

      {/* Información del producto */}
      <div className="flex-1 w-full md:w-auto">
        <h3 className="text-lg font-semibold text-meow-text mb-1">{item.name}</h3>
        <p className="text-sm text-gray-600 mb-2">{item.description}</p>
        
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="text-meow-text">
            <strong>Talla:</strong> {item.size}
          </span>
          <span className="text-meow-text">
            <strong>Precio:</strong> <span className="text-meow-accent font-bold">${item.price.toLocaleString()}</span>
          </span>
          <span className="text-gray-600">
            Stock disponible: {item.stock}
          </span>
        </div>
      </div>

      {/* Controles de cantidad y precio */}
      <div className="w-full md:w-auto mt-4 md:mt-0 md:ml-4">
        <div className="flex flex-col items-center md:items-end space-y-3">
          {/* Controles de cantidad */}
          <div className="flex items-center border border-meow-border rounded-lg">
            <button
              onClick={() => handleQuantityChange(item.quantity - 1)}
              className="p-2 hover:bg-gray-100 transition-colors"
              disabled={item.quantity <= 1}
            >
              <Minus size={16} className={item.quantity <= 1 ? 'text-gray-400' : 'text-meow-text'} />
            </button>
            
            <span className="px-4 py-2 font-medium text-meow-text min-w-[3rem] text-center">
              {item.quantity}
            </span>
            
            <button
              onClick={() => handleQuantityChange(item.quantity + 1)}
              className="p-2 hover:bg-gray-100 transition-colors"
              disabled={item.quantity >= item.stock}
            >
              <Plus size={16} className={item.quantity >= item.stock ? 'text-gray-400' : 'text-meow-text'} />
            </button>
          </div>

          {/* Subtotal */}
          <div className="text-right">
            <p className="text-sm text-gray-600">Subtotal</p>
            <p className="text-lg font-bold text-meow-accent">
              ${subtotal.toLocaleString()}
            </p>
          </div>

          {/* Botón eliminar */}
          <button
            onClick={handleRemoveItem}
            className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded transition-colors"
          >
            <Trash2 size={14} />
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
};

const Cart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>(initialCartItems);
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);

  // Calcular totales
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 150000 ? 0 : 15000; // Envío gratis para compras mayores a $150.000
  const discountAmount = (subtotal * discount) / 100;
  const total = subtotal + shipping - discountAmount;

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleUpdateQuantity = (id: number, newQuantity: number) => {
    setCartItems(items => 
      items.map(item => 
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const handleRemoveItem = (id: number) => {
    setCartItems(items => items.filter(item => item.id !== id));
  };

  const handleApplyPromoCode = () => {
    // Códigos promocionales de ejemplo
    const promoCodes: { [key: string]: number } = {
      'MEOW10': 10,
      'GATO15': 15,
      'PRIMERACOMPRA': 20
    };

    if (promoCodes[promoCode.toUpperCase()]) {
      setDiscount(promoCodes[promoCode.toUpperCase()]);
      alert(`¡Código aplicado! Descuento del ${promoCodes[promoCode.toUpperCase()]}%`);
    } else if (promoCode.trim()) {
      alert('Código promocional no válido');
    }
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    
    // Aquí iría la lógica de checkout
    alert(`Procesando compra de ${totalItems} artículos por $${total.toLocaleString()}`);
    console.log('Checkout:', { items: cartItems, total, discount, shipping });
  };

  return (
    <div className="bg-meow-background min-h-screen text-meow-text">
      <div className="py-10 px-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <ShoppingBag size={28} className="text-meow-accent" />
          <h1 className="text-3xl font-bold text-meow-text">
            Carrito de Compras
            {cartItems.length > 0 && (
              <span className="text-lg font-normal text-gray-600 ml-2">
                ({totalItems} artículo{totalItems !== 1 ? 's' : ''})
              </span>
            )}
          </h1>
        </div>

        {cartItems.length === 0 ? (
          // Carrito vacío
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-2xl font-medium text-meow-text mb-4">Tu carrito está vacío</h2>
            <p className="text-gray-600 mb-6">¡Descubre nuestros productos y comienza a comprar!</p>
            <Link 
              to="/productos"
              className="inline-flex items-center gap-2 bg-meow-accent text-white px-6 py-3 rounded-xl hover:bg-meow-accent/90 transition font-medium"
            >
              <ShoppingBag size={20} />
              Ver productos
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Lista de productos */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-xl font-semibold text-meow-text mb-4">
                Productos en tu carrito
              </h2>
              
              {cartItems.map(item => (
                <CartItemCard
                  key={item.id}
                  item={item}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemoveItem={handleRemoveItem}
                />
              ))}
            </div>

            {/* Resumen del pedido */}
            <div className="space-y-6">
              <div className="bg-white border border-meow-border rounded-xl p-6 shadow sticky top-4">
                <h2 className="text-xl font-semibold text-meow-text mb-4">
                  Resumen del pedido
                </h2>

                {/* Código promocional */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-meow-text mb-2">
                    Código promocional
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="Ingresa tu código"
                      className="flex-1 px-3 py-2 border border-meow-border rounded-md focus:outline-none focus:ring-2 focus:ring-meow-accent text-sm"
                    />
                    <button
                      onClick={handleApplyPromoCode}
                      className="px-4 py-2 bg-gray-100 text-meow-text rounded-md hover:bg-gray-200 transition text-sm font-medium"
                    >
                      Aplicar
                    </button>
                  </div>
                  {discount > 0 && (
                    <p className="text-sm text-green-600 mt-1">
                      ✓ Descuento del {discount}% aplicado
                    </p>
                  )}
                </div>

                {/* Desglose de precios */}
                <div className="space-y-2 text-sm border-t border-gray-200 pt-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal ({totalItems} artículos)</span>
                    <span className="text-meow-text">${subtotal.toLocaleString()}</span>
                  </div>
                  
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Descuento ({discount}%)</span>
                      <span>-${discountAmount.toLocaleString()}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Envío</span>
                    <span className="text-meow-text">
                      {shipping === 0 ? (
                        <span className="text-green-600">Gratis</span>
                      ) : (
                        `$${shipping.toLocaleString()}`
                      )}
                    </span>
                  </div>
                  
                  {shipping > 0 && (
                    <p className="text-xs text-gray-500">
                      ¡Envío gratis en compras mayores a $150.000!
                    </p>
                  )}
                </div>

                {/* Total */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-meow-text">Total</span>
                    <span className="text-xl font-bold text-meow-accent">
                      ${total.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Botón de checkout */}
                <button
                  onClick={handleCheckout}
                  className="w-full bg-meow-accent text-white py-3 rounded-xl hover:bg-meow-accent/90 transition font-medium mt-6"
                >
                  Proceder al pago
                </button>

                {/* Continuar comprando */}
                <Link
                  to="/productos"
                  className="block text-center text-meow-accent hover:underline text-sm mt-3"
                >
                  ← Continuar comprando
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Cart
