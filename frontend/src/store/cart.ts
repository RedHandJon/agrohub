import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, Product } from '@/types'

interface CartState {
  items: CartItem[]
  addItem: (product: Product, quantity?: number) => void
  removeItem: (productId: number) => void
  updateQuantity: (productId: number, quantity: number) => void
  clearCart: () => void
  totalItems: () => number
  totalAmount: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, quantity = 1) => {
        const existing = get().items.find((i) => i.product.id === product.id)
        if (existing) {
          set((s) => ({
            items: s.items.map((i) =>
              i.product.id === product.id ? { ...i, quantity: i.quantity + quantity } : i
            ),
          }))
        } else {
          set((s) => ({ items: [...s.items, { product, quantity }] }))
        }
      },
      removeItem: (productId) =>
        set((s) => ({ items: s.items.filter((i) => i.product.id !== productId) })),
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }
        set((s) => ({
          items: s.items.map((i) => (i.product.id === productId ? { ...i, quantity } : i)),
        }))
      },
      clearCart: () => set({ items: [] }),
      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      totalAmount: () =>
        get().items.reduce((sum, i) => sum + parseFloat(i.product.price_per_unit) * i.quantity, 0),
    }),
    { name: 'agrohub-cart' }
  )
)
