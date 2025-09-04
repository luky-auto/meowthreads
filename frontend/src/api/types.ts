// API Types for MeowThreads Backend Integration

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  date_joined: string;
  is_active: boolean;
  is_superuser?: boolean;
  is_staff?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  slug?: string;
  price?: string;
  category?: Category;
  category_name?: string; // From admin API
  main_image?: string;
  available_sizes?: string[];
  created_at: string;
  updated_at?: string;
  is_active?: boolean;
  is_featured?: boolean;
}

export interface SizeConfiguration {
  id: number;
  code: string;
  name: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  parent?: number;
}

export interface ProductVariant {
  id: number;
  product: number;
  size: string;
  color?: string;
  price: string;
  stock: number;
  sku?: string;
}

export interface ProductImage {
  id: number;
  product: number;
  image: string;
  alt_text?: string;
  is_primary: boolean;
  order: number;
}

export interface CartItem {
  id: number;
  product_variant: ProductVariant;
  quantity: number;
  subtotal: number;
  product_name: string;
  product_image: string | null;
  created_at: string;
  updated_at: string;
}

export interface Cart {
  id: number;
  items: CartItem[];
  total_items: number;
  total_price: number;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: number;
  user?: number;
  order_number: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  total_amount: string;
  shipping_address?: Address;
  subtotal?: string;
  shipping_cost?: string;
  tax_amount?: string;
  notes?: string;
  items_count?: number;
  created_at: string;
  updated_at?: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: number;
  product_variant: ProductVariant;
  product_name: string;
  product_size: string;
  product_color?: string;
  product_image: string | null;
  quantity: number;
  unit_price: string;
  subtotal: string;
}

export interface Address {
  id: number;
  user: number;
  street_address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
}

export interface ApiError {
  message: string;
  errors?: { [key: string]: string[] };
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}