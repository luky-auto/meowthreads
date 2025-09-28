// src/pages/Cart.tsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react'
import type { CartItem } from '../api/types'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { useCart } from '../contexts/CartContext'
import CheckoutModal from './CheckoutModal'

const CartItemCard = ({
  item,
  onUpdateQuantity,
  onRemoveItem
}: {
  item: CartItem;
  onUpdateQuantity: (id: number, newQuantity: number) => Promise<void>;
  onRemoveItem: (id: number) => Promise<void>;
}) => {
  const [isRemoving, setIsRemoving] = useState(false);
  const [updating, setUpdating] = useState(false);
  const { warning, error } = useToast();

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem();
      return;
    }
    if (newQuantity > item.product_variant.stock) {
      warning(`Solo hay ${item.product_variant.stock} unidades disponibles`);
      return;
    }
    
    setUpdating(true);
    try {
      await onUpdateQuantity(item.id, newQuantity);
    } catch (err) {
      console.error('Error updating quantity:', err);
      error('Error al actualizar la cantidad');
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveItem = async () => {
    setIsRemoving(true);
    try {
      await onRemoveItem(item.id);
    } catch (err) {
      console.error('Error removing item:', err);
      error('Error al eliminar el producto');
      setIsRemoving(false);
    }
  };

  const subtotal = item.subtotal;

  return (
    <div className={`flex flex-col md:flex-row items-start md:items-center bg-white border border-meow-border rounded-xl p-4 shadow transition-all duration-200 ${isRemoving ? 'opacity-50 scale-95' : ''}`}>
      {/* Imagen del producto */}
      <div className="w-full md:w-24 h-24 flex-shrink-0 mb-3 md:mb-0 md:mr-4">
        <img 
          src={item.product_image || "/images/placeholder.webp"}
          alt={`${item.product_name} - ${item.product_variant.size}`}
          className="w-full h-full object-cover rounded-lg"
          onError={(e) => {
            e.currentTarget.src = "/images/placeholder.webp";
          }}
        />
      </div>

      {/* Información del producto */}
      <div className="flex-1 w-full md:w-auto">
        <h3 className="text-lg font-semibold text-meow-text mb-1">{item.product_name}</h3>
        <p className="text-sm text-gray-600 mb-2">SKU: {item.product_variant.sku || 'N/A'}</p>
        
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="text-meow-text">
            <strong>Talla:</strong> {item.product_variant.size}
          </span>
          {item.product_variant.color && (
            <span className="text-meow-text">
              <strong>Color:</strong> {item.product_variant.color}
            </span>
          )}
          <span className="text-meow-text">
            <strong>Precio:</strong> <span className="text-meow-accent font-bold">${parseFloat(item.product_variant.price).toLocaleString()}</span>
          </span>
          <span className="text-gray-600">
            Stock disponible: {item.product_variant.stock}
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
              className="p-2 hover:bg-gray-100 transition-colors disabled:opacity-50"
              disabled={item.quantity <= 1 || updating}
            >
              <Minus size={16} className={item.quantity <= 1 || updating ? 'text-gray-400' : 'text-meow-text'} />
            </button>
            
            <span className="px-4 py-2 font-medium text-meow-text min-w-[3rem] text-center">
              {updating ? '...' : item.quantity}
            </span>
            
            <button
              onClick={() => handleQuantityChange(item.quantity + 1)}
              className="p-2 hover:bg-gray-100 transition-colors disabled:opacity-50"
              disabled={item.quantity >= item.product_variant.stock || updating}
            >
              <Plus size={16} className={item.quantity >= item.product_variant.stock || updating ? 'text-gray-400' : 'text-meow-text'} />
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
            disabled={isRemoving || updating}
            className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded transition-colors disabled:opacity-50"
          >
            <Trash2 size={14} />
            {isRemoving ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
};

const Cart = () => {
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const { isAuthenticated } = useAuth();
  const { success, error: toastError } = useToast();
  const {
    cartItems,
    cartCount,
    subtotal,
    isLoading: loading,
    updateQuantity,
    removeFromCart,
    refreshCart
  } = useCart();

  // Calcular totales usando datos del contexto
  const shipping = subtotal > 150000 ? 0 : 15000; // Envío gratis para compras mayores a $150.000
  const discountAmount = (subtotal * discount) / 100;
  const total = subtotal + shipping - discountAmount;

  const handleUpdateQuantity = async (id: number, newQuantity: number) => {
    await updateQuantity(id, newQuantity);
  };

  const handleRemoveItem = async (id: number) => {
    await removeFromCart(id);
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
      success(`¡Código aplicado! Descuento del ${promoCodes[promoCode.toUpperCase()]}%`);
    } else if (promoCode.trim()) {
      toastError('Código promocional no válido');
    }
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    setShowCheckoutModal(true);
  };

  const handleCheckoutSuccess = async () => {
    // Reload cart to clear it after successful checkout
    await refreshCart();
    setShowCheckoutModal(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-meow-background min-h-screen text-meow-text">
        <div className="py-10 px-4 max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-medium text-meow-text mb-4">Inicia sesión para ver tu carrito</h2>
            <p className="text-gray-600 mb-6">Necesitas una cuenta para gestionar tu carrito de compras.</p>
            <Link 
              to="/login"
              className="inline-flex items-center gap-2 bg-meow-accent text-white px-6 py-3 rounded-xl hover:bg-meow-accent/90 transition font-medium"
            >
              Iniciar sesión
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-meow-background min-h-screen text-meow-text">
      <div className="py-10 px-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <ShoppingBag size={28} className="text-meow-accent" />
          <h1 className="text-3xl font-bold text-meow-text">
            Carrito de Compras
            {cartItems.length > 0 && (
              <span className="text-lg font-normal text-gray-600 ml-2">
                ({cartCount} artículo{cartCount !== 1 ? 's' : ''})
              </span>
            )}
          </h1>
        </div>


        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-meow-accent"></div>
          </div>
        ) : cartItems.length === 0 ? (
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
                    <span className="text-gray-600">Subtotal ({cartCount} artículos)</span>
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

        {/* Checkout Modal */}
        <CheckoutModal
          isOpen={showCheckoutModal}
          onClose={() => setShowCheckoutModal(false)}
          onSuccess={handleCheckoutSuccess}
          cartItems={cartItems}
          total={total}
          subtotal={subtotal}
          discount={discountAmount}
          shipping={shipping}
        />
      </div>
    </div>
  )
}

export default Cart
