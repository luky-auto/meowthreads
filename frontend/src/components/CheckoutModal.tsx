import { useState } from 'react'
import { X, CreditCard, MapPin, User, CheckCircle } from 'lucide-react'
import type { CartItem } from '../api/types'
import apiClient from '../api/api'

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  cartItems: CartItem[]
  total: number
  discount: number
  shipping: number
}

function CheckoutModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  cartItems, 
  total, 
  discount, 
  shipping 
}: CheckoutModalProps) {
  const [step, setStep] = useState(1) // 1: Info, 2: Confirmación, 3: Procesando, 4: Éxito
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    // Datos de envío (simulados)
    firstName: 'Juan',
    lastName: 'Pérez',
    email: 'juan.perez@email.com',
    phone: '3001234567',
    address: 'Carrera 15 #45-67',
    city: 'Bogotá',
    state: 'Cundinamarca',
    zipCode: '110111',
    // Datos de pago (simulados)
    cardNumber: '4111 1111 1111 1111',
    cardExpiry: '12/25',
    cardCvv: '123',
    cardName: 'Juan Pérez'
  })

  const finalTotal = total - discount + shipping

  if (!isOpen) return null

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleProcessPayment = async () => {
    setLoading(true)
    setStep(3) // Procesando

    try {
      // Simular procesamiento de pago (2 segundos)
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Crear la orden
      const orderData = {
        shipping_address: {
          street_address: formData.address,
          city: formData.city,
          state: formData.state,
          postal_code: formData.zipCode,
          country: 'Colombia'
        },
        payment_method: {
          type: 'credit_card',
          last_four: formData.cardNumber.slice(-4),
          card_brand: 'visa'
        },
        items: cartItems.map(item => ({
          product_variant_id: item.product_variant.id,
          quantity: item.quantity,
          unit_price: parseFloat(item.product_variant.price)
        })),
        subtotal: total,
        discount: discount,
        shipping: shipping,
        total: finalTotal
      }

      console.log('Procesando orden:', orderData)
      
      // Procesar orden en el backend
      const response = await apiClient.processCheckout(orderData)
      console.log('Orden procesada:', response)
      
      setStep(4) // Éxito
      
      // Limpiar carrito después de 3 segundos
      setTimeout(() => {
        onSuccess()
        onClose()
        setStep(1)
      }, 3000)

    } catch (error) {
      console.error('Error processing payment:', error)
      
      // Show more detailed error message
      if (error && typeof error === 'object' && 'message' in error) {
        alert(`Error al procesar el pago: ${error.message}`)
      } else {
        alert('Error al procesar el pago. Inténtalo de nuevo.')
      }
      
      setStep(2)
    } finally {
      setLoading(false)
    }
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            {/* Datos de envío */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <MapPin size={20} className="text-meow-accent" />
                Dirección de Envío
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-meow-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-meow-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-meow-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-meow-accent"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-meow-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-meow-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Código Postal</label>
                  <input
                    type="text"
                    value={formData.zipCode}
                    onChange={(e) => handleInputChange('zipCode', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-meow-accent"
                  />
                </div>
              </div>
            </div>

            {/* Datos de pago */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <CreditCard size={20} className="text-meow-accent" />
                Información de Pago
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número de Tarjeta</label>
                  <input
                    type="text"
                    value={formData.cardNumber}
                    onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-meow-accent"
                    placeholder="1234 5678 9012 3456"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Vencimiento</label>
                  <input
                    type="text"
                    value={formData.cardExpiry}
                    onChange={(e) => handleInputChange('cardExpiry', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-meow-accent"
                    placeholder="MM/AA"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                  <input
                    type="text"
                    value={formData.cardCvv}
                    onChange={(e) => handleInputChange('cardCvv', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-meow-accent"
                    placeholder="123"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre en la Tarjeta</label>
                  <input
                    type="text"
                    value={formData.cardName}
                    onChange={(e) => handleInputChange('cardName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-meow-accent"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={() => setStep(2)}
                className="flex-1 px-4 py-2 bg-meow-accent text-white hover:bg-meow-accent/90 rounded-lg transition-colors font-medium"
              >
                Continuar
              </button>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Confirmación de Pedido</h3>
            
            {/* Resumen de productos */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-800 mb-3">Productos</h4>
              {cartItems.map(item => (
                <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                  <div className="flex-1">
                    <p className="font-medium">{item.product_name}</p>
                    <p className="text-sm text-gray-600">
                      Talla: {item.product_variant.size} - Cantidad: {item.quantity}
                    </p>
                  </div>
                  <p className="font-medium">${item.subtotal.toLocaleString()}</p>
                </div>
              ))}
              
              <div className="mt-4 pt-3 border-t border-gray-200 space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>${total.toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Descuento:</span>
                    <span>-${discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span>Envío:</span>
                  <span>${shipping.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200">
                  <span>Total:</span>
                  <span>${finalTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Dirección de envío */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-800 mb-2">Dirección de Envío</h4>
              <p className="text-sm text-gray-600">
                {formData.firstName} {formData.lastName}<br />
                {formData.address}<br />
                {formData.city}, {formData.zipCode}
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
              >
                Volver
              </button>
              <button
                onClick={handleProcessPayment}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors font-medium disabled:opacity-50"
              >
                Procesar Pago
              </button>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-meow-accent mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Procesando Pago...</h3>
            <p className="text-gray-600">Por favor espera mientras procesamos tu pago.</p>
          </div>
        )

      case 4:
        return (
          <div className="text-center py-12">
            <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">¡Pago Exitoso!</h3>
            <p className="text-gray-600 mb-4">
              Tu pedido ha sido procesado correctamente.
            </p>
            <p className="text-sm text-gray-500">
              Se redirigirá automáticamente en unos segundos...
            </p>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-meow-accent/20 rounded-lg flex items-center justify-center">
              <CreditCard size={20} className="text-meow-accent" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                Finalizar Compra
              </h2>
              <p className="text-sm text-gray-600">
                Paso {step} de 4
              </p>
            </div>
          </div>
          {step !== 3 && step !== 4 && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-600" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {renderStep()}
        </div>
      </div>
    </div>
  )
}

export default CheckoutModal