export interface ProductImage {
  id: string | number;
  url: string;
  alt?: string;
  thumbnail?: { url: string };
  card?: { url: string };
  hero?: { url: string };
  sizes?: {
    thumbnail?: { url: string };
    card?: { url: string };
    hero?: { url: string };
  };
}

export interface Product {
  id: string | number;
  name: string;
  slug?: string;
  sku?: string;
  price: number;
  discountPrice?: number | null;
  stock: number;
  lowStockThreshold?: number;
  category: string;
  description?: string;
  image: string | ProductImage | null;
  badge?: string | null;
  sizes?: Array<{ size: string }>;
  colors?: Array<{ color: string }>;
  visible?: boolean;
  featured?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Customer {
  id: string | number;
  name: string;
  email: string;
  phone?: string | null;
  passwordHash?: string;
  passwordResetToken?: string | null;
  passwordResetExpires?: string | null;
  addresses?: Address[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Address {
  id: number;
  label: string;
  recipientName: string;
  phone: string;
  province: string;
  district: string;
  municipality: string;
  wardNumber: string;
  streetTole: string;
  houseLandmark?: string | null;
  deliveryInstructions?: string | null;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderItem {
  product: string | number;
  name: string;
  price: number;
  quantity: number;
  image?: string | null;
}

export interface OrderShipping {
  name: string;
  phone: string;
  district?: string;
  email?: string;
  address: string;
  landmark?: string | null;
  note?: string | null;
  province?: string;
  municipality?: string;
  ward_number?: string;
  street_tole?: string;
}

export interface Order {
  id: string | number;
  orderNumber: string;
  customer: string | number;
  items: OrderItem[];
  subtotal: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  shipping: OrderShipping;
  createdAt?: string;
  updatedAt?: string;
}

export interface Review {
  id: string | number;
  rating: number;
  title: string | null;
  comment: string | null;
  customerName: string;
  customerEmail: string;
  verifiedPurchase: boolean;
  helpfulCount: number;
  createdAt: string;
}

export interface ReviewSummary {
  count: number;
  averageRating: number;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
  category: string;
  image: string;
  visible: boolean;
  featured: boolean;
}

export interface StockAlert {
  id: string;
  productId: number;
  alertType: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  productName: string;
  productSku?: string | null;
  currentStock: number;
}

export interface JWTPayload {
  sub: string;
  email: string;
  role: string;
  name: string;
}

export interface ApiError {
  error: string;
  details?: Record<string, string[]>;
}