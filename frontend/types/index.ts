export interface Category {
  id: number;
  name: string;
  slug: string;
  image?: string;
  products_count?: number;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  sku?: string;
  description?: string;
  main_image: string;
  images?: string[];
  sale_price: number;
  base_price?: number;
  stock: number;
  category_name?: string;
  category_slug?: string;
  is_featured?: boolean;
  is_best_seller?: boolean;
  is_active?: boolean;
  rating?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: number;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  address_line1?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  total: number;
  subtotal?: number;
  shipping_cost?: number;
  status: 'pending' | 'processing' | 'sent_to_cj' | 'shipped' | 'delivered' | 'cancelled';
  paid: boolean;
  created_at: string;
  tracking_number?: string;
  cj_order_id?: string;
  items?: OrderItem[];
  items_count?: number;
}

export interface OrderItem {
  id: number;
  product: number;
  product_name: string;
  product_image: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface ShippingMethod {
  id: number;
  name: string;
  price: number;
  delivery_days: string;
}