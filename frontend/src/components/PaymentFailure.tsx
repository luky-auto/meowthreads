import React, { useEffect } from 'react'
import { XCircle } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'
import { useNavigate } from 'react-router-dom'

function PaymentFailure() {
  const { error } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    error('El pago no pudo procesarse. Inténtalo nuevamente.')
  }, [error])

  return (
    <div className="max-w-md mx-auto mt-16 p-8 bg-white rounded-lg shadow-lg text-center">
      <XCircle size={64} className="text-red-500 mx-auto mb-4" />
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Pago Fallido</h1>
      <p className="text-gray-600 mb-6">
        Hubo un problema al procesar tu pago.
        Por favor, intenta nuevamente.
      </p>
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-red-800">
          No se realizó ningún cargo a tu cuenta.
        </p>
      </div>
      <div className="space-y-2">
        <button
          onClick={() => navigate('/carrito')}
          className="w-full bg-meow-accent text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition"
        >
          Volver al carrito
        </button>
        <button
          onClick={() => navigate('/')}
          className="w-full bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition"
        >
          Volver al inicio
        </button>
      </div>
    </div>
  )
}

export default PaymentFailure