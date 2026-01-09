// Database types matching Supabase schema

export interface HospitalityCenter {
  id: number;
  name: string;
  image?: string;
  created_at?: string;
}

export interface Merchant {
  id: number;
  created_at?: string;
  name: string;
  description?: string;
  image_url?: string;
  rating?: number;
  hospitality_center_id: number;
  prep_time?: number;
  cuisine_type?: string;
}

export interface ProductCategory {
  id: number;
  created_at?: string;
  name: string;
}

export interface Currency {
  id: number;
  created_at?: string;
  name: string;
  rate: number;
}

export interface Product {
  id: number;
  created_at?: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  image?: string;
  merchant_id: number;
  category_id?: number;
}

export interface OrderingLocation {
  id: number;
  created_at?: string;
  name: string;
  qr_code: Record<string, any>;
  hospitality_center_id?: number;
}

export interface Order {
  id: number;
  created_at?: string;
  ordering_location_id: number;
  customer_id: number;
  status_id: number;
  ordered_at?: string;
  user_rating?: number;
}

export interface OrderProduct {
  id: number;
  created_at?: string;
  order_id: number;
  product_id: number;
  product_variations?: Record<string, any>;
  price: number;
}
