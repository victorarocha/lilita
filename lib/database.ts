import { supabase } from './supabase';
import type { 
  HospitalityCenter, 
  Merchant, 
  Product, 
  ProductCategory,
  OrderingLocation,
  Order,
  OrderProduct,
  Currency
} from '@/types/database';

// Fetch all hospitality centers (locations/resorts)
export async function getHospitalityCenters() {
  const { data, error } = await supabase
    .from('hospitality_center')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Supabase error fetching hospitality centers:', error);
    throw error;
  }
  console.log('Supabase raw data:', data);
  return data as HospitalityCenter[];
}

// Fetch merchants (venues) for a specific hospitality center
export async function getMerchantsByCenter(hospitalityCenterId: number) {
  const { data, error } = await supabase
    .from('merchant')
    .select('*')
    .eq('hospitality_center_id', hospitalityCenterId)
    .order('name', { ascending: true });

  if (error) throw error;
  return data as Merchant[];
}

// Fetch a single merchant by ID
export async function getMerchantById(merchantId: string | number) {
  const { data, error } = await supabase
    .from('merchant')
    .select('*')
    .eq('id', merchantId)
    .single();

  if (error) throw error;
  return data as Merchant;
}

// Fetch products for a specific merchant
export async function getProductsByMerchant(merchantId: string | number) {
  const { data, error } = await supabase
    .from('product')
    .select(`
      *,
      product_category:category_id (
        id,
        name
      )
    `)
    .eq('merchant_id', merchantId)
    .order('name', { ascending: true });

  if (error) throw error;
  return data as any[];
}

// Fetch all product categories
export async function getProductCategories() {
  const { data, error } = await supabase
    .from('product_category')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data as ProductCategory[];
}

// Fetch ordering locations for a merchant
export async function getOrderingLocationsByMerchant(merchantId: number) {
  const { data, error } = await supabase
    .from('ordering_location')
    .select('*')
    .eq('merchant_id', merchantId)
    .order('name', { ascending: true });

  if (error) throw error;
  return data as OrderingLocation[];
}

// Fetch ordering locations for a hospitality center
export async function getOrderingLocationsByHospitalityCenter(hospitalityCenterId: number) {
  const { data, error } = await supabase
    .from('ordering_location')
    .select('*')
    .eq('hospitality_center_id', hospitalityCenterId)
    .order('name', { ascending: true });

  if (error) throw error;
  return data as OrderingLocation[];
}

// Create a new order
export async function createOrder(orderData: {
  merchant_id: string;
  ordering_location_id?: string;
  total: number;
  currency_id: string;
  notes?: string;
}) {
  const { data, error } = await supabase
    .from('order')
    .insert({
      ...orderData,
      status: 'received',
    })
    .select()
    .single();

  if (error) throw error;
  return data as Order;
}

// Add products to an order
export async function createOrderProducts(
  orderId: string,
  products: Array<{
    product_id: string;
    quantity: number;
    price: number;
    customizations?: string;
  }>
) {
  const orderProducts = products.map((product) => ({
    order_id: orderId,
    ...product,
  }));

  const { data, error } = await supabase
    .from('order_products')
    .insert(orderProducts)
    .select();

  if (error) throw error;
  return data as OrderProduct[];
}

// Fetch orders (for order history)
export async function getOrders() {
  const { data, error } = await supabase
    .from('order')
    .select(`
      *,
      merchant:merchant_id (
        id,
        name,
        image_url
      ),
      ordering_location:ordering_location_id (
        id,
        name,
        type
      ),
      currency:currency_id (
        id,
        code,
        symbol
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as any[];
}

// Fetch a single order with its products
export async function getOrderById(orderId: string) {
  const { data: order, error: orderError } = await supabase
    .from('order')
    .select(`
      *,
      merchant:merchant_id (
        id,
        name,
        image_url
      ),
      ordering_location:ordering_location_id (
        id,
        name,
        type
      ),
      currency:currency_id (
        id,
        code,
        symbol
      )
    `)
    .eq('id', orderId)
    .single();

  if (orderError) throw orderError;

  const { data: products, error: productsError } = await supabase
    .from('order_products')
    .select(`
      *,
      product:product_id (
        id,
        name,
        image_url,
        description
      )
    `)
    .eq('order_id', orderId);

  if (productsError) throw productsError;

  return {
    ...order,
    products,
  };
}

// Update order status
export async function updateOrderStatus(
  orderId: string,
  status: 'received' | 'preparing' | 'out_for_delivery' | 'delivered'
) {
  const { data, error } = await supabase
    .from('order')
    .update({ status })
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw error;
  return data as Order;
}
