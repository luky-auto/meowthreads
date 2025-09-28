import React, { useState, useEffect } from 'react'
import { X, CreditCard, MapPin, CheckCircle } from 'lucide-react'
import type { CartItem } from '../api/types'
import apiClient from '../api/api'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import MercadoPagoWallet from './MercadoPagoWallet'

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  cartItems: CartItem[]
  total: number
  subtotal: number
  discount: number
  shipping: number
}

function CheckoutModal({
  isOpen,
  onClose,
  onSuccess,
  cartItems,
  total,
  subtotal,
  discount,
  shipping
}: CheckoutModalProps) {
  const [step, setStep] = useState(1) // 1: Método de pago, 2: MercadoPago Checkout, 3: Éxito
  const [loading, setLoading] = useState(false)
  const [preferenceId, setPreferenceId] = useState<string | null>(null)
  const [mercadoPagoConfig, setMercadoPagoConfig] = useState<{public_key: string} | null>(null)
  const { error: showError, success } = useToast()
  const { isAuthenticated } = useAuth()
  const { refreshCart } = useCart()
  const [shippingData, setShippingData] = useState({
    address: '',
    city: 'Bogotá',
    department: 'Cundinamarca'
  })
  const [paymentResult, setPaymentResult] = useState<{payment_id?: string; status?: string; external_reference?: string | null} | null>(null)
  const [paymentInProgress, setPaymentInProgress] = useState(false)
  const [countdown, setCountdown] = useState(30)
  const [simulationActive, setSimulationActive] = useState(false)
  const [simulationProcessed, setSimulationProcessed] = useState(false)

  // Simulación de pago exitoso automático
  useEffect(() => {
    let timer: number | null = null

    if (simulationActive && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(prev => prev - 1)
      }, 1000)
    } else if (simulationActive && countdown === 0 && !simulationProcessed) {
      // Ejecutar simulación de pago exitoso (solo una vez)
      setSimulationProcessed(true) // Marcar como procesado inmediatamente
      console.log('SIMULACIÓN: Ejecutando pago automático...')

      const simulateSuccessfulPayment = async () => {
        try {
          const response = await apiClient.post('/payments/mercadopago/simulate-payment/', {
            shipping_address: shippingData.address,
            city: shippingData.city,
            department: shippingData.department,
            total: finalTotal,
            subtotal: subtotal,
            shipping: shipping
          })
          const simulationResponse = response as {success: boolean}

          if (simulationResponse.success) {
            console.log('SIMULACIÓN: Pago simulado exitoso')
            // success('¡Pago simulado completado exitosamente!')
            success('¡Pago completado exitosamente!')
            // Actualizar carrito
            await refreshCart()

            // Cerrar modal y marcar como exitoso
            setSimulationActive(false)
            onSuccess()
            onClose()
          } else {
            console.error('SIMULACIÓN: Error en pago simulado')
            showError('Error en la simulación de pago')
            setSimulationActive(false)
            setSimulationProcessed(false) // Reset en caso de error
          }
        } catch (error) {
          console.error('SIMULACIÓN: Error ejecutando pago simulado:', error)
          showError('Error conectando con el servidor para simulación')
          setSimulationActive(false)
          setSimulationProcessed(false) // Reset en caso de error
        }
      }

      simulateSuccessfulPayment()
    }

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [simulationActive, countdown, success, showError, refreshCart, onSuccess, onClose])

  // Limpiar estados cuando se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      setStep(1)
      setLoading(false)
      setPreferenceId(null)
      setPaymentResult(null)
      setPaymentInProgress(false)
      setCountdown(30)
      setSimulationActive(false)
      setSimulationProcessed(false)
      setShippingData({
        address: '',
        city: '',
        department: ''
      })
    }
  }, [isOpen])

  // Cargar configuración de MercadoPago al abrir el modal
  useEffect(() => {
    if (isOpen && !mercadoPagoConfig) {
      const loadMercadoPagoConfig = async () => {
        try {
          const response = await apiClient.get('/payments/mercadopago/config/')
          const config = response as {public_key: string}
          setMercadoPagoConfig(config)
        } catch (error) {
          console.error('Error loading MercadoPago config:', error)
        }
      }
      loadMercadoPagoConfig()
    }
  }, [isOpen, mercadoPagoConfig])

  // Escuchar mensajes de MercadoPago (cuando regresa de la ventana) y detectar URLs de retorno
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verificar que el mensaje viene de MercadoPago
      if (event.origin.includes('mercadopago.com') || event.origin.includes('mercadolibre.com')) {
        console.log('Message from MercadoPago:', event.data)

        if (event.data.type === 'payment_result') {
          setPaymentResult(event.data)

          if (event.data.status === 'approved') {
            success('¡Pago realizado exitosamente!')
            setStep(3) // Ir al paso de éxito
            onSuccess() // Llamar callback de éxito
            refreshCart() // Actualizar carrito
          } else if (event.data.status === 'rejected') {
            showError('El pago fue rechazado. Intenta con otro método de pago.')
            setStep(1) // Volver al paso inicial
          } else if (event.data.status === 'pending') {
            success('Tu pago está siendo procesado. Recibirás una confirmación pronto.')
            setStep(3) // Ir al paso de éxito
          }
        }
      }
    }

    // Detectar cambios en la URL para capturar redirecciones de MercadoPago
    const handleHashChange = () => {
      const urlParams = new URLSearchParams(window.location.search)

      // Buscar parámetros de MercadoPago en URL
      const paymentId = urlParams.get('payment_id')
      const status = urlParams.get('status')
      const externalReference = urlParams.get('external_reference')

      if (paymentId && status) {
        console.log('Detected MercadoPago URL parameters:', { paymentId, status, externalReference })

        const paymentData = {
          payment_id: paymentId,
          status: status,
          external_reference: externalReference
        }

        setPaymentResult(paymentData)

        if (status === 'approved') {
          success('¡Pago realizado exitosamente!')
          setStep(3)
          refreshCart()
          onSuccess()
        } else if (status === 'rejected' || status === 'failure') {
          showError('El pago fue rechazado. Intenta con otro método de pago.')
          setStep(1)
        } else if (status === 'pending') {
          success('Tu pago está siendo procesado. Recibirás una confirmación pronto.')
          setStep(3)
        }

        // Limpiar la URL
        window.history.replaceState({}, '', window.location.pathname)
      }
    }

    window.addEventListener('message', handleMessage)
    window.addEventListener('hashchange', handleHashChange)

    // Verificar al cargar si ya hay parámetros en la URL
    handleHashChange()

    return () => {
      window.removeEventListener('message', handleMessage)
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [success, showError, onSuccess, refreshCart])

  // Detectar cuando el usuario regresa de MercadoPago
  useEffect(() => {
    const handleFocus = async () => {
      // Cuando la ventana recibe focus (usuario regresa), verificar si el pago fue exitoso
      if (step === 2 && preferenceId && paymentInProgress) {
        console.log('User returned from MercadoPago, verifying payment status...')

        try {
          // Actualizar carrito y verificar si cambió (indicando pago exitoso)
          const originalItemsCount = cartItems.length
          console.log('Original cart items count:', originalItemsCount)

          await refreshCart()
          console.log('Cart refreshed on user return')

          // Esperar un momento y verificar nuevamente
          setTimeout(async () => {
            await refreshCart()
            console.log('Second cart refresh completed')

            // Por ahora, simplemente actualizamos sin cerrar el modal automáticamente
            // El usuario puede ver si el pago fue exitoso y cerrar manualmente
            console.log('User returned from payment, cart updated')
          }, 1500)

        } catch (error) {
          console.error('Error refreshing cart on user return:', error)
        }

        setPaymentInProgress(false)
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [step, preferenceId, refreshCart, paymentInProgress, paymentResult, success, onSuccess, cartItems])

  const finalTotal = total // El total ya incluye shipping y descuentos

  if (!isOpen) return null

  const handleMercadoPagoCheckout = async () => {
    console.log('Starting MercadoPago Checkout Pro...')
    console.log('Is authenticated:', isAuthenticated)

    if (!isAuthenticated) {
      showError('Debes iniciar sesión para realizar un pago')
      return
    }

    if (!shippingData.address.trim()) {
      showError('Por favor ingresa tu dirección de envío')
      return
    }

    setLoading(true)

    try {
      console.log('Creating MercadoPago preference...')

      const checkoutData = {
        total: finalTotal,
        subtotal: subtotal,
        discount: discount,
        shipping: shipping,
        shipping_address: shippingData.address,
        city: shippingData.city,
        department: shippingData.department
      }

      console.log('Sending checkout data:', checkoutData)

      const response = await apiClient.post('/payments/mercadopago/preference/', checkoutData)
      const preferenceResponse = response as {success: boolean; preference_id?: string; error?: string}

      if (preferenceResponse.success) {
        console.log('Preference created:', preferenceResponse.preference_id)
        console.log('Full response:', preferenceResponse)

        // Guardar el preference_id y avanzar al siguiente paso
        setPreferenceId(preferenceResponse.preference_id || '')
        setStep(2)

        // Iniciar simulación de pago exitoso después de 30 segundos
        setSimulationActive(true)
        setCountdown(15)

        console.log('MODO SIMULACIÓN: Pago será aprobado automáticamente en 30 segundos')

      } else {
        showError(preferenceResponse.error || 'Error al crear la preferencia de pago')
      }

    } catch (error: unknown) {
      console.error('Error creating MercadoPago preference:', error)

      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as {response?: {status?: number; data?: {error?: string}}};
        if (apiError.response?.status === 401) {
          showError('Tu sesión ha expirado. Por favor inicia sesión nuevamente.')
          setTimeout(() => {
            window.location.href = '/login'
          }, 2000)
        } else {
          showError(apiError.response?.data?.error || 'Error al procesar el pago')
        }
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Error al procesar el pago'
        showError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    onClose()
    setStep(1)
    setPreferenceId(null)
    setLoading(false)
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        // Selección de método de pago
        return (
          <div className="space-y-6">
            {/* Dirección de envío */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <MapPin size={20} className="text-meow-accent" />
                Dirección de Envío
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección completa *
                  </label>
                  <input
                    type="text"
                    value={shippingData.address}
                    onChange={(e) => setShippingData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Carrera 15 #45-67, Apto 301"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-meow-accent"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ciudad
                    </label>
                    <input
                      type="text"
                      value={shippingData.city}
                      onChange={(e) => setShippingData(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-meow-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Departamento
                    </label>
                    <input
                      type="text"
                      value={shippingData.department}
                      onChange={(e) => setShippingData(prev => ({ ...prev, department: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-meow-accent"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Selección de método de pago */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Método de Pago
              </h3>
              <div className="space-y-3">
                <button
                  onClick={handleMercadoPagoCheckout}
                  className="w-full p-4 border-2 border-blue-500 bg-blue-50 rounded-lg hover:border-blue-600 hover:bg-blue-100 transition flex items-center gap-3"
                  disabled={loading || !shippingData.address.trim()}
                >
                  <CreditCard className="text-blue-600" size={24} />
                  <div className="text-left">
                    <p className="font-medium text-gray-800">Pagar con MercadoPago</p>
                    <p className="text-sm text-gray-600">Tarjetas, PSE, efecty y más - Pago seguro</p>
                    {!shippingData.address.trim() && (
                      <p className="text-xs text-red-500">Ingresa tu dirección primero</p>
                    )}
                  </div>
                </button>
              </div>
            </div>
          </div>
        )

      case 2:
        // MercadoPago Checkout
        return (
          <div className="py-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 text-center">
              Completa tu pago con MercadoPago
            </h3>
            {preferenceId && mercadoPagoConfig ? (
              <div key={`wallet-${preferenceId}`}>
                <MercadoPagoWallet
                  preferenceId={preferenceId}
                  publicKey={mercadoPagoConfig.public_key}
                  onReady={() => {
                    console.log('MercadoPago Wallet ready')
                  }}
                  onError={(error) => {
                    console.error('MercadoPago Wallet error:', error)
                    showError('Error al cargar el sistema de pago')
                    setStep(1)
                  }}
                  onPaymentStart={() => {
                    console.log('Pago iniciado, abriendo ventana...')
                    setPaymentInProgress(true)
                  }}
                  onPaymentSuccess={(data) => {
                    console.log('Pago exitoso:', data)
                    setPaymentResult({ ...data, status: 'approved' })
                    success('¡Pago realizado exitosamente!')
                    setStep(3)
                    refreshCart()
                  }}
                  onPaymentFailure={(data) => {
                    console.log('Pago fallido:', data)
                    setPaymentResult({ ...data, status: 'rejected' })
                    showError('El pago fue rechazado. Intenta con otro método de pago.')
                    setStep(1)
                  }}
                />
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-meow-accent mx-auto mb-4"></div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Preparando Pago</h3>
                <p className="text-gray-600">
                  Cargando sistema de pago de MercadoPago...
                </p>
              </div>
            )}
          </div>
        )

      case 3:
        // Éxito
        return (
          <div className="text-center py-12">
            <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {paymentResult ? '¡Pago Completado!' : paymentInProgress ? '¡Procesando Pago!' : '¡Esperando confirmación!'}
            </h3>

            {paymentResult ? (
              <div className="space-y-4">
                <p className="text-gray-600">
                  {paymentResult.status === 'approved'
                    ? 'Tu pago fue procesado exitosamente'
                    : paymentResult.status === 'pending'
                    ? 'Tu pago está siendo procesado'
                    : 'Hubo un problema con tu pago'
                  }
                </p>

                {paymentResult.payment_id && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">ID de Pago:</p>
                    <p className="font-mono text-sm">{paymentResult.payment_id}</p>
                  </div>
                )}

                <button
                  onClick={() => {
                    refreshCart() // Actualizar carrito antes de cerrar
                    handleClose()
                    // Opcional: redirigir a pedidos
                    window.location.href = '/pedidos'
                  }}
                  className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition"
                >
                  Ver mis pedidos
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-600">
                  {paymentInProgress
                    ? 'Procesando tu pago con MercadoPago...'
                    : 'Se ha abierto una nueva ventana para completar tu pago'
                  }
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    {paymentInProgress
                      ? 'Por favor completa tu pago y regresa a esta ventana'
                      : 'Completa tu pago en la ventana de MercadoPago y regresa aquí'
                    }
                  </p>
                </div>

                {/* Información de simulación */}
                {simulationActive && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                      <p className="text-sm font-medium text-yellow-800">
                        Modo Simulación Activo
                      </p>
                    </div>
                    <p className="text-sm text-yellow-700 mb-2">
                      El pago será aprobado automáticamente en {countdown} segundos
                    </p>
                    <div className="w-full bg-yellow-200 rounded-full h-2">
                      <div
                        className="bg-yellow-500 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${((30 - countdown) / 30) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                {paymentInProgress && (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-meow-accent mx-auto mb-2"></div>
                    <p className="text-sm text-gray-500">Esperando confirmación...</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-xl font-bold text-gray-800">
            {step === 1 ? 'Finalizar Compra' : step === 2 ? 'Procesando...' : '¡Listo!'}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
            disabled={loading}
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {renderStep()}
        </div>

        {/* Footer - Resumen del pedido */}
        {step === 1 && (
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-2xl">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal ({cartItems.length} artículos)</span>
                <span className="text-gray-800">${total.toLocaleString()}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Descuento</span>
                  <span>-${discount.toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-gray-600">Envío</span>
                <span className="text-gray-800">
                  {shipping === 0 ? (
                    <span className="text-green-600">Gratis</span>
                  ) : (
                    `$${shipping.toLocaleString()}`
                  )}
                </span>
              </div>

              <div className="border-t border-gray-300 pt-2 flex justify-between">
                <span className="font-bold text-gray-800">Total</span>
                <span className="font-bold text-meow-accent text-lg">
                  ${finalTotal.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CheckoutModal