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
  options?: ProductOptionGroup[];
  features?: string[];
  specs?: { label: string; value: string }[];
  created_at?: string;
}

// Option de produit (Couleur, Taille…) et ses valeurs
export interface ProductOptionValue {
  label: string;
  hex?: string;          // pour les options de type « color »
  image?: string;        // image affichée quand la valeur est choisie
  price_delta: number;   // supplément de prix (peut être 0)
}

export interface ProductOptionGroup {
  name: string;
  type: 'color' | 'text';
  values: ProductOptionValue[];
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
  status: OrderStatus;
  status_label?: string;
  address_line2?: string;
  payment_method?: string;
  shipping_method_name?: string;
  paid: boolean;
  created_at: string;
  tracking_number?: string;
  cj_order_id?: string;
  items?: OrderItem[];
  items_count?: number;
}

export type OrderStatus = 'pending' | 'processing' | 'sent_to_cj' | 'shipped' | 'delivered' | 'cancelled';

// Commande telle que la voit le client (endpoint public /orders/track/)
export interface TrackedOrder {
  id: number;
  customer_name: string;
  status: OrderStatus;
  status_label: string;
  created_at: string;
  updated_at: string;
  subtotal: number;
  shipping_cost: number;
  total: number;
  tracking_number: string;
  shipping_method_name: string;
  city: string;
  postal_code: string;
  country: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: number;
  product: number;
  product_name: string;
  product_image: string;
  quantity: number;
  unit_price: number;
  options?: Record<string, string>;
  options_label?: string;
  total: number;
}

export interface ShippingMethod {
  id: number;
  name: string;
  price: number;
  delivery_days: string;
}