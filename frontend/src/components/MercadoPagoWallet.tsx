import React, { useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    MercadoPago: {
      new (publicKey: string, options?: {locale?: string; sandbox?: boolean}): {
        bricks: () => {
          create: (type: string, containerId: string, config: unknown) => Promise<{unmount: () => void}>
        }
      }
    }
  }
}

// Hook personalizado para manejar la carga del SDK
const useMercadoPagoSDK = () => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkSDK = () => {
      if (window.MercadoPago) {
        console.log('MercadoPago SDK detected')
        setIsLoaded(true)
        setError(null)
        return true
      }
      return false
    }

    // Si ya está cargado
    if (checkSDK()) {
      return
    }

    console.log('Setting up MercadoPago SDK loader...')

    const loadSDK = () => {
      // Verificar si el script ya existe
      const existingScript = document.querySelector('script[src*="mercadopago.com"]')

      if (existingScript) {
        console.log('MercadoPago script found in DOM, waiting for initialization...')

        // Esperar a que se inicialice
        let attempts = 0
        const maxAttempts = 30
        const interval = setInterval(() => {
          attempts++
          console.log(`Waiting for SDK initialization (${attempts}/${maxAttempts})`)

          if (checkSDK()) {
            clearInterval(interval)
          } else if (attempts >= maxAttempts) {
            clearInterval(interval)
            console.error('MercadoPago SDK timeout')
            setError('Timeout esperando el SDK de MercadoPago')
          }
        }, 200)
      } else {
        console.log('Loading MercadoPago SDK script dynamically...')

        // Crear y cargar el script
        const script = document.createElement('script')
        script.src = 'https://sdk.mercadopago.com/js/v2'
        script.async = true
        script.onload = () => {
          console.log('MercadoPago script downloaded')
          // Esperar un poco para que se inicialice
          setTimeout(() => {
            if (checkSDK()) {
              console.log('MercadoPago SDK ready after dynamic load')
            } else {
              console.error('MercadoPago SDK not available after script load')
              setError('SDK de MercadoPago no se inicializó correctamente')
            }
          }, 1000)
        }
        script.onerror = () => {
          console.error('Failed to load MercadoPago script')
          setError('Error cargando el script de MercadoPago')
        }
        document.head.appendChild(script)
      }
    }

    // Verificar el estado del documento
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', loadSDK)
    } else {
      loadSDK()
    }

    return () => {
      document.removeEventListener('DOMContentLoaded', loadSDK)
    }
  }, [])

  return { isLoaded, error }
}

interface MercadoPagoWalletProps {
  preferenceId: string
  publicKey: string
  onReady?: () => void
  onError?: (error: unknown) => void
  onPaymentStart?: () => void
  onPaymentSuccess?: (data: {payment_id?: string; status?: string}) => void
  onPaymentFailure?: (data: {payment_id?: string; status?: string; error?: string}) => void
}

function MercadoPagoWallet({
  preferenceId,
  publicKey,
  onReady,
  onError,
  onPaymentStart
}: MercadoPagoWalletProps) {
  const walletContainerRef = useRef<HTMLDivElement>(null)
  const walletRef = useRef<{unmount: () => void} | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const initPromise = useRef<Promise<void> | null>(null)
  const isUnmounted = useRef(false)

  // Usar el hook para manejar el SDK
  const { isLoaded: sdkLoaded, error: sdkError } = useMercadoPagoSDK()

  // Solo inicializar cuando tengamos todo lo necesario: preferenceId, publicKey y SDK cargado
  useEffect(() => {
    if (!preferenceId || !publicKey || !sdkLoaded) {
      console.log('Waiting for required data:', { preferenceId: !!preferenceId, publicKey: !!publicKey, sdkLoaded })
      return
    }

    console.log('All requirements met, initializing wallet...')

    // Resetear estados
    setIsLoading(true)
    setHasError(false)
    isUnmounted.current = false

    // Si ya hay una inicialización en progreso, cancelarla
    if (initPromise.current) {
      isUnmounted.current = true
    }

    // Crear nueva promesa de inicialización
    initPromise.current = initializeWallet()

    return () => {
      isUnmounted.current = true
    }
  }, [preferenceId, publicKey, sdkLoaded])

  // Manejar errores del SDK
  useEffect(() => {
    if (sdkError) {
      console.error('SDK Error:', sdkError)
      setHasError(true)
      setIsLoading(false)
      onError?.(sdkError)
    }
  }, [sdkError, onError])

  // Cleanup al desmontar componente
  useEffect(() => {
    return () => {
      isUnmounted.current = true
      if (walletRef.current) {
        try {
          walletRef.current.unmount()
          walletRef.current = null
        } catch (e) {
          console.log('Error cleaning up wallet:', e)
        }
      }
    }
  }, [])

  const initializeWallet = async () => {
    try {
      // Verificar si el componente fue desmontado
      if (isUnmounted.current) return

      console.log('Starting wallet initialization...')

      // Esperar a que el contenedor esté disponible
      const containerReady = await waitForContainer()
      if (!containerReady || isUnmounted.current) {
        setHasError(true)
        setIsLoading(false)
        onError?.('Contenedor no disponible')
        return
      }

      // Limpiar wallet anterior
      if (walletRef.current) {
        try {
          console.log('Cleaning previous wallet...')
          walletRef.current.unmount()
          walletRef.current = null
        } catch (e) {
          console.log('Warning: Error unmounting previous wallet:', e)
        }
      }

      // Limpiar contenedor
      const container = walletContainerRef.current
      if (container) {
        container.innerHTML = ''
      }

      // Verificar nuevamente si no fue desmontado
      if (isUnmounted.current) return

      // Verificar que el SDK esté disponible (doble check)
      if (!window.MercadoPago) {
        console.error('MercadoPago SDK not available at initialization time')
        setHasError(true)
        setIsLoading(false)
        onError?.('SDK de MercadoPago no disponible')
        return
      }

      // Inicializar MercadoPago
      console.log('Inicializando MercadoPago SDK con public key...')
      const mp = new window.MercadoPago(publicKey, {
        locale: 'es-CO',
        sandbox: true
      })

      console.log('Creando MercadoPago Wallet con preference:', preferenceId)

      // Crear wallet
      const bricksBuilder = mp.bricks()
      walletRef.current = await bricksBuilder.create('wallet', 'wallet-container', {
        initialization: {
          preferenceId: preferenceId,
          redirectMode: 'blank'
        },
        customization: {
          texts: {
            valueProp: 'smart_option',
          },
        },
        callbacks: {
          onReady: () => {
            if (!isUnmounted.current) {
              console.log('MercadoPago Wallet ready')
              setIsLoading(false)
              setHasError(false)
              onReady?.()
            }
          },
          onSubmit: () => {
            if (!isUnmounted.current) {
              console.log('Payment started')
              onPaymentStart?.()
            }
          },
          onError: (error: unknown) => {
            if (!isUnmounted.current) {
              console.error('MercadoPago Wallet error:', error)
              setHasError(true)
              setIsLoading(false)
              onError?.(error)
            }
          }
        }
      })

      console.log('Wallet creation completed successfully')

    } catch (error) {
      if (!isUnmounted.current) {
        console.error('Error initializing wallet:', error)
        setHasError(true)
        setIsLoading(false)
        onError?.(error)
      }
    }
  }


  const waitForContainer = (): Promise<boolean> => {
    return new Promise((resolve) => {
      const container = document.getElementById('wallet-container')
      if (container && document.body.contains(container)) {
        resolve(true)
        return
      }

      let attempts = 0
      const maxAttempts = 10
      const interval = setInterval(() => {
        attempts++
        const container = document.getElementById('wallet-container')
        if (container && document.body.contains(container) || isUnmounted.current || attempts >= maxAttempts) {
          clearInterval(interval)
          resolve(!!(container && document.body.contains(container)) && !isUnmounted.current)
        }
      }, 100)
    })
  }

  return (
    <div className="w-full">
      {!sdkLoaded && !sdkError && (
        <div className="min-h-[200px] w-full flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <span className="text-gray-600">Cargando SDK de MercadoPago...</span>
          </div>
        </div>
      )}

      {sdkLoaded && isLoading && (
        <div className="min-h-[200px] w-full flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-2"></div>
            <span className="text-gray-600">Inicializando sistema de pago...</span>
          </div>
        </div>
      )}

      {(hasError || sdkError) && (
        <div className="min-h-[200px] w-full flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-2">
              {sdkError ? 'Error cargando SDK de MercadoPago' : 'Error cargando el sistema de pago'}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              {sdkError || 'Problema al inicializar el widget de pagos'}
            </p>
            <button
              onClick={() => {
                setHasError(false)
                setIsLoading(true)
                if (sdkLoaded && !sdkError) {
                  initPromise.current = initializeWallet()
                } else {
                  // Recargar la página si es un error del SDK
                  window.location.reload()
                }
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              {sdkError ? 'Recargar página' : 'Reintentar'}
            </button>
          </div>
        </div>
      )}

      <div
        id="wallet-container"
        ref={walletContainerRef}
        className={`min-h-[200px] w-full ${!sdkLoaded || isLoading || hasError || sdkError ? 'hidden' : 'block'}`}
        data-testid="mercadopago-wallet-container"
      ></div>
    </div>
  )
}

export default MercadoPagoWallet