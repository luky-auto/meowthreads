import React, { useEffect } from 'react'
import { Clock } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'
import { useNavigate } from 'react-router-dom'

function PaymentPending() {
  const { info } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    info('Tu pago está pendiente de confirmación.')
  }, [info])

  return (
    <div className="max-w-md mx-auto mt-16 p-8 bg-white rounded-lg shadow-lg text-center">
      <Clock size={64} className="text-yellow-500 mx-auto mb-4" />
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Pago Pendiente</h1>
      <p className="text-gray-600 mb-6">
        Tu pago está siendo procesado.
        Te notificaremos cuando se confirme.
      </p>
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-yellow-800">
          Recibirás un correo con el estado de tu pago.
        </p>
      </div>
      <div className="space-y-2">
        <button
          onClick={() => navigate('/pedidos')}
          className="w-full bg-meow-accent text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition"
        >
          Ver mis pedidos
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

export default PaymentPending