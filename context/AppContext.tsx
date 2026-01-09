import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CartItem, DeliveryLocation, Order } from '@/types';

interface AppContextType {
  cart: CartItem[];
  cartVenueId: string | null;
  cartVenueName: string | null;
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  updateCartItem: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  deliveryLocation: DeliveryLocation | null;
  setDeliveryLocation: (location: DeliveryLocation) => void;
  currentOrder: Order | null;
  setCurrentOrder: (order: Order | null) => void;
  orderHistory: Order[];
  addToOrderHistory: (order: Order) => void;
  resortName: string;
  setResortName: (name: string) => void;
  hospitalityCenterId: number | null;
  setHospitalityCenterId: (id: number | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [deliveryLocation, setDeliveryLocation] = useState<DeliveryLocation | null>(null);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [resortName, setResortName] = useState('Select location');
  const [hospitalityCenterId, setHospitalityCenterId] = useState<number | null>(null);

  // Track which venue the cart items belong to
  const cartVenueId = cart.length > 0 ? cart[0].venueId : null;
  const cartVenueName = cart.length > 0 ? cart[0].venueName : null;

  const addToOrderHistory = (order: Order) => {
    setOrderHistory((prev) => [order, ...prev]);
  };

  const addToCart = (item: CartItem) => {
    setCart((prev) => {
      const existingItem = prev.find(
        (i) => i.id === item.id && i.customizations === item.customizations
      );
      if (existingItem) {
        return prev.map((i) =>
          i.id === item.id && i.customizations === item.customizations
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      }
      return [...prev, item];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId));
  };

  const updateCartItem = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  return (
    <AppContext.Provider
      value={{
        cart,
        cartVenueId,
        cartVenueName,
        addToCart,
        removeFromCart,
        updateCartItem,
        clearCart,
        deliveryLocation,
        setDeliveryLocation,
        currentOrder,
        setCurrentOrder,
        orderHistory,
        addToOrderHistory,
        resortName,
        setResortName,
        hospitalityCenterId,
        setHospitalityCenterId,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
