import React, { useEffect, useState } from 'react'
import { CheckCircle, Loader2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'
import { useCart } from '../contexts/CartContext'
import { useNavigate, useSearchParams } from 'react-router-dom'
import apiClient from '../api/api'

function PaymentSuccess() {
  const { success, error } = useToast()
  const { refreshCart } = useCart()
  const token = apiClient.getToken()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [paymentInfo, setPaymentInfo] = useState<{payment_id: string; status: string; external_reference: string | null} | null>(null)
  const [isProcessing, setIsProcessing] = useState(true)
  const [paymentProcessed, setPaymentProcessed] = useState(false)

  useEffect(() => {
    const processPayment = async () => {
      try {
        // Capturar parámetros de MercadoPago
        const paymentId = searchParams.get('payment_id')
        const status = searchParams.get('status')
        const externalReference = searchParams.get('external_reference')

        console.log('Payment Success - URL params:', {
          paymentId,
          status,
          externalReference
        })

        if (paymentId) {
          setPaymentInfo({
            payment_id: paymentId,
            status: status || 'unknown',
            external_reference: externalReference
          })

          // Verificar estado del pago en el backend
          console.log('🔄 Verificando estado del pago con el backend...')

          if (!token) {
            error('No hay token de autenticación disponible')
            return
          }

          const response = await fetch(`http://localhost:8000/api/payments/mercadopago/check-payment/${paymentId}/`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token as string}`,
              'Content-Type': 'application/json',
            },
          })

          const result = await response.json()
          console.log('🔍 Payment check result:', result)

          if (result.success) {
            if (result.status === 'approved' && result.cart_cleared) {
              success('¡Pago aprobado! Tu pedido ha sido confirmado y el carrito se ha actualizado.')
              setPaymentProcessed(true)

              // Refrescar carrito para mostrar cambios en la UI
              await refreshCart()
              console.log('✅ Cart refreshed after payment processing')
            } else if (result.status === 'approved') {
              success('¡Pago aprobado! Tu pedido ha sido confirmado.')
              setPaymentProcessed(true)
            } else {
              error(`Pago en estado: ${result.status}. Por favor contacta soporte si tienes dudas.`)
            }
          } else {
            error('Error verificando el estado del pago. Tu pago puede estar siendo procesado.')
          }
        } else {
          success('¡Gracias por tu compra!')
        }
      } catch (err) {
        console.error('Error processing payment:', err)
        error('Error verificando el pago. Si completaste el pago, tu pedido debería procesarse automáticamente.')
      } finally {
        setIsProcessing(false)
      }
    }

    processPayment()

    // Redirigir a pedidos después de 8 segundos
    const timer = setTimeout(() => {
      navigate('/pedidos')
    }, 8000)

    return () => clearTimeout(timer)
  }, [searchParams, success, error, refreshCart, navigate])

  return (
    <div className="max-w-md mx-auto mt-16 p-8 bg-white rounded-lg shadow-lg text-center">
      {isProcessing ? (
        <>
          <Loader2 size={64} className="text-blue-500 mx-auto mb-4 animate-spin" />
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Procesando Pago...</h1>
          <p className="text-gray-600 mb-6">
            Estamos verificando tu pago con MercadoPago.
            Por favor espera un momento.
          </p>
        </>
      ) : (
        <>
          <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            {paymentProcessed ? '¡Pago Confirmado!' : '¡Pago Exitoso!'}
          </h1>
          <p className="text-gray-600 mb-6">
            {paymentProcessed
              ? 'Tu pedido ha sido confirmado y procesado correctamente.'
              : 'Tu pago ha sido procesado. Recibirás un correo de confirmación en breve.'
            }
          </p>
        </>
      )}
      {paymentInfo && (
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="text-left space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">ID de Pago:</span>
              <span className="font-mono text-sm">{paymentInfo.payment_id}</span>
            </div>
            {paymentInfo.status && (
              <div className="flex justify-between">
                <span className="text-gray-600">Estado:</span>
                <span className="text-green-600 font-semibold">{paymentInfo.status}</span>
              </div>
            )}
            {paymentInfo.external_reference && (
              <div className="flex justify-between">
                <span className="text-gray-600">Referencia:</span>
                <span className="font-mono text-sm">{paymentInfo.external_reference}</span>
              </div>
            )}
          </div>
        </div>
      )}
      {!isProcessing && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-green-800">
            Te redirigiremos a tus pedidos en 8 segundos...
          </p>
        </div>
      )}
      <button
        onClick={() => navigate('/pedidos')}
        className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition"
      >
        Ver mis pedidos
      </button>
    </div>
  )
}

export default PaymentSuccess