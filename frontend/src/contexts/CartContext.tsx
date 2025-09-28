import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { CartItem } from '../api/types'
import apiClient from '../api/api'
import { useAuth } from './AuthContext'
import { useToast } from './ToastContext'

interface CartContextType {
  cartItems: CartItem[]
  cartCount: number
  subtotal: number
  isLoading: boolean
  refreshCart: () => Promise<void>
  addToCart: (productVariantId: number, quantity: number) => Promise<void>
  updateQuantity: (itemId: number, quantity: number) => Promise<void>
  removeFromCart: (itemId: number) => Promise<void>
  clearCart: () => Promise<void>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { isAuthenticated } = useAuth()
  const { error: showError, success } = useToast()

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0)
  const subtotal = cartItems.reduce((total, item) => total + item.subtotal, 0)

  const refreshCart = async () => {
    if (!isAuthenticated) {
      setCartItems([])
      return
    }

    setIsLoading(true)
    try {
      const response = await apiClient.get('/orders/cart/current/')
      const cartData = response as {items?: CartItem[]}
      if (cartData.items) {
        setCartItems(cartData.items)
      }
    } catch (error) {
      console.error('Error refreshing cart:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const addToCart = async (productVariantId: number, quantity: number) => {
    if (!isAuthenticated) {
      showError('Debes iniciar sesión para agregar productos al carrito')
      return
    }

    setIsLoading(true)
    try {
      await apiClient.post('/orders/cart-items/', {
        product_variant: productVariantId,
        quantity
      })
      await refreshCart()
      // success('Producto agregado al carrito')
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as {response?: {data?: {error?: string}}}
        showError(apiError.response?.data?.error || 'Error al agregar al carrito')
      } else {
        showError('Error al agregar al carrito')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const updateQuantity = async (itemId: number, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(itemId)
      return
    }

    setIsLoading(true)
    try {
      await apiClient.put(`/orders/cart-items/${itemId}/`, { quantity })
      await refreshCart()
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as {response?: {data?: {error?: string}}}
        showError(apiError.response?.data?.error || 'Error al actualizar cantidad')
      } else {
        showError('Error al actualizar cantidad')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const removeFromCart = async (itemId: number) => {
    setIsLoading(true)
    try {
      await apiClient.delete(`/orders/cart-items/${itemId}/`)
      await refreshCart()
      success('Producto eliminado del carrito')
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as {response?: {data?: {error?: string}}}
        showError(apiError.response?.data?.error || 'Error al eliminar del carrito')
      } else {
        showError('Error al eliminar del carrito')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const clearCart = async () => {
    setIsLoading(true)
    try {
      // Eliminar todos los items uno por uno
      for (const item of cartItems) {
        await apiClient.delete(`/orders/cart-items/${item.id}/`)
      }
      await refreshCart()
      success('Carrito vaciado')
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as {response?: {data?: {error?: string}}}
        showError(apiError.response?.data?.error || 'Error al vaciar carrito')
      } else {
        showError('Error al vaciar carrito')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Cargar carrito al iniciar sesión
  useEffect(() => {
    if (isAuthenticated) {
      refreshCart()
    } else {
      setCartItems([])
    }
  }, [isAuthenticated])

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        subtotal,
        isLoading,
        refreshCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}