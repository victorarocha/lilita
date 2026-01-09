export interface Venue {
  id: string;
  name: string;
  image: string;
  cuisineType: string;
  prepTime: string;
  rating: number;
  tags: string[];
  description?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: MenuCategory;
  dietary?: string[];
}

export type MenuCategory = 'drinks' | 'appetizers' | 'mains' | 'desserts';

export interface CartItem extends MenuItem {
  quantity: number;
  customizations?: string;
  venueId: string;
  venueName: string;
}

export interface DeliveryLocation {
  id: string;
  name: string;
  type: 'pool' | 'cabana' | 'table' | 'beach' | 'custom';
  customNote?: string;
}

export type OrderStatus = 'received' | 'preparing' | 'delivering' | 'delivered';

export interface Order {
  id: string;
  items: CartItem[];
  deliveryLocation: DeliveryLocation;
  status: OrderStatus;
  total: number;
  createdAt: Date;
  estimatedTime?: string;
}
