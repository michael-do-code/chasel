import { createContext, useContext } from 'react';

export interface CartContextValue {
  /** Total quantity across every line in the bag, not the number of lines. */
  count: number;
  /** Re-reads the bag from the API. */
  refresh: () => Promise<void>;
  addItem: (productId: number) => Promise<void>;
  removeItem: (productId: number) => Promise<void>;
}

export const CartContext = createContext<CartContextValue | undefined>(undefined);

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used inside CartProvider');
  }
  return context;
}
