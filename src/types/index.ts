export type BrandId = 'amul' | 'havmor' | 'cream-bell' | 'mother-dairy' | 'vadilal';

export interface Brand {
  id: string;
  slug: BrandId;
  name: string;
  tagline: string;
  logo: string;
  bgGradient: string;
  color: string;
  displayOrder: number;
  isActive: boolean;
  totalProducts?: number;
}

export type IceCreamCategory = 'Cups' | 'Cones' | 'Bars & Sticks' | 'Family Tubs' | 'Kulfi & Specialties';

export interface Product {
  id: string;
  brandId: BrandId;
  brandName: string;
  name: string;
  slug: string;
  category: IceCreamCategory;
  description: string;
  price: number;
  image: string;
  badge?: 'BESTSELLER' | 'POPULAR' | 'SAVE 15%' | 'SPECIAL OFFER' | 'NEW';
  rating: number;
  ratingCount: number;
  volume: string; // e.g. "120 ml", "700 ml", "75 ml"
  isPopular: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface DailyInventoryItem {
  productId: string;
  publishedQuantity: number;
  soldQuantity: number;
  reservedQuantity: number;
  availableQuantity: number; // published - sold - reserved
  lowStockThreshold: number;
}

export interface StockSession {
  id: string;
  sessionDate: string; // YYYY-MM-DD
  status: 'draft' | 'published' | 'closed';
  publishedAt?: string;
  publishedBy?: string;
  items: Record<string, DailyInventoryItem>; // key is productId
  totalPublished: number;
  totalSold: number;
  notes?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export type OrderStatus = 'pending' | 'confirmed' | 'cancelled' | 'expired';
export type PickupStatus = 'confirmed' | 'preparing' | 'ready' | 'picked_up';
export type PaymentStatus = 'created' | 'pending' | 'paid' | 'failed' | 'expired' | 'refunded';

export interface OrderItem {
  productId: string;
  productName: string;
  brandName: string;
  brandId: BrandId;
  image: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  tokenNumber: string; // Unique format like "BCA-0879"
  customerId?: string;
  customerName: string;
  customerMobile: string;
  customerEmail?: string;
  items: OrderItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  pickupStatus: PickupStatus;
  paymentTransactionId?: string;
  razorpayOrderId?: string;
  stockSessionId: string;
  reservationExpiresAt?: string;
  pickupTimestamp?: string;
  pickedUpByAdminId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HeroBanner {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  brandSlug: BrandId | 'all';
  image: string;
  bgGradient: string;
  ctaText: string;
  ctaLink: string;
  displayOrder: number;
  isActive: boolean;
}

export interface StoreSettings {
  shopName: string;
  tagline: string;
  logo: string;
  phone: string;
  email: string;
  address: string;
  googleMapsUrl: string;
  pickupInstructions: string;
  openingTime: string; // "12:00"
  closingTime: string; // "18:00"
  timezone: string; // "Asia/Kolkata"
  minOrderValue: number; // 50
  reservationTimeoutMinutes: number; // 10
  lowStockThreshold: number; // 5
  razorpayKeyId: string;
  isDevTestMode: boolean;
  timeOverrideEnabled?: boolean; // For demonstration/testing any time
  timeOverrideSlot?: 'before_opening' | 'open' | 'after_closing';
}

export interface UserProfile {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  role: 'customer' | 'admin';
  createdAt: string;
}
