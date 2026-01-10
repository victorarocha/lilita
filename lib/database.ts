import { supabase } from './supabase';
import type { 
  HospitalityCenter, 
  Merchant, 
  Product, 
  ProductCategory,
  OrderingLocation,
  Order,
  OrderProduct,
  Currency,
  ProductVariation,
  Customer
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

// Fetch product variations for a product
export async function getProductVariations(productId: number) {
  const { data, error } = await supabase
    .from('product_variation')
    .select('*')
    .eq('product_id', productId)
    .order('name', { ascending: true });

  if (error) throw error;
  return data as ProductVariation[];
}

// Generate a unique order code
function generateOrderCode(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${randomPart}`;
}

// Create a new order
export async function createOrder(orderData: {
  ordering_location_id: number;
  customer_id: string; // UUID
  total_price: number;
  instructions?: string | null;
  status?: 'received' | 'preparing' | 'on-delivery' | 'delivered';
  hospitality_center_id?: number;
  merchant_id?: number;
}) {
  const orderCode = generateOrderCode();
  
  const insertData: Record<string, unknown> = {
    order_code: orderCode,
    ordering_location_id: orderData.ordering_location_id,
    customer_id: orderData.customer_id,
    total_price: orderData.total_price,
    status: orderData.status || 'received',
    ordered_at: new Date().toISOString(),
  };
  
  // Only add instructions if provided
  if (orderData.instructions !== undefined && orderData.instructions !== null) {
    insertData.instructions = orderData.instructions;
  }
  
  // Add hospitality_center_id if provided
  if (orderData.hospitality_center_id) {
    insertData.hospitality_center_id = orderData.hospitality_center_id;
  }
  
  // Add merchant_id if provided
  if (orderData.merchant_id) {
    insertData.merchant_id = orderData.merchant_id;
  }
  
  console.log('Inserting order data:', insertData);
  
  const { data, error } = await supabase
    .from('order')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('Error inserting order:', error);
    throw error;
  }
  
  console.log('Order inserted successfully:', data);
  return data as Order;
}

// Add products to an order
export async function createOrderProducts(
  orderId: number,
  products: Array<{
    product_id: number;
    price: number;
    product_variation_json?: {
      id: number;
      name: string;
      price: number;
    } | null;
  }>
) {
  const orderProducts = products.map((product) => ({
    order_id: orderId,
    product_id: product.product_id,
    price: product.price,
    product_variation_json: product.product_variation_json || null,
  }));

  const { data, error } = await supabase
    .from('order_products')
    .insert(orderProducts)
    .select();

  if (error) throw error;
  return data as OrderProduct[];
}

// Get or create a customer by email
export async function getOrCreateCustomer(email: string, fullName: string): Promise<Customer> {
  // First try to find existing customer
  const { data: existingCustomer, error: findError } = await supabase
    .from('customers')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (existingCustomer && !findError) {
    return existingCustomer as Customer;
  }

  // Parse name into first/last
  const nameParts = fullName.trim().split(' ');
  const firstName = nameParts[0] || null;
  const lastName = nameParts.slice(1).join(' ') || null;

  // Create new customer if not found
  const { data: newCustomer, error: createError } = await supabase
    .from('customers')
    .insert({ 
      email, 
      full_name: fullName,
      first_name: firstName,
      last_name: lastName
    })
    .select()
    .single();

  if (createError) throw createError;
  return newCustomer as Customer;
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
      ordering_location:ordering_location_id (
        id,
        name,
        type
      ),
      merchant:merchant_id (
        id,
        name,
        image_url
      ),
      hospitality_center:hospitality_center_id (
        id,
        name
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
  status: 'received' | 'preparing' | 'on-delivery' | 'delivered'
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

// Update order with user feedback
export async function updateOrderFeedback(
  orderId: string,
  rating: number,
  feedback?: string,
  tip?: number
) {
  const { data, error } = await supabase
    .from('order')
    .update({
      user_rating: rating,
      user_rating_feedback: feedback || null,
      tip: tip || null,
    })
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw error;
  return data as Order;
}

// Get customer by ID
export async function getCustomerById(customerId: number): Promise<Customer | null> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', customerId)
    .single();

  if (error) {
    console.error('Error fetching customer:', error);
    return null;
  }
  return data as Customer;
}

// UUID validation utility
export function isValidUUID(id?: string): boolean {
  if (!id || typeof id !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

// Get orders by customer ID (UUID)
export async function getOrdersByCustomerId(customerId: string): Promise<Order[]> {
  // Validate UUID before querying
  if (!isValidUUID(customerId)) {
    console.warn('getOrdersByCustomerId: Invalid UUID provided:', customerId);
    return [];
  }

  const { data, error } = await supabase
    .from('order')
    .select(`
      *,
      ordering_location:ordering_location_id (
        id,
        name,
        type
      ),
      merchant:merchant_id (
        id,
        name,
        image_url
      ),
      hospitality_center:hospitality_center_id (
        id,
        name
      )
    `)
    .eq('customer_id', customerId)
    .order('ordered_at', { ascending: false });

  if (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
  return data as Order[];
}

// Get orders by clerk user ID (looks up customer first then fetches orders)
export async function getOrdersByClerkUserId(clerkUserId: string): Promise<Order[]> {
  if (!clerkUserId) {
    console.warn('getOrdersByClerkUserId: No clerk user ID provided');
    return [];
  }

  // First, get the customer by clerk_user_id
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('id')
    .eq('clerk_user_id', clerkUserId)
    .single();

  if (customerError || !customer) {
    console.warn('getOrdersByClerkUserId: Customer not found for clerk_user_id:', clerkUserId);
    return [];
  }

  // Now fetch orders using the customer's UUID
  return getOrdersByCustomerId(customer.id);
}
