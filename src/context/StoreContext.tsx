import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Brand,
  Product,
  StockSession,
  Order,
  StoreSettings,
  HeroBanner,
  PickupStatus,
  DailyInventoryItem,
  OrderItem,
} from '../types';
import { db } from '../db/relationalDb';
import { getKolkataDateString } from '../utils/orderTiming';
import { isSupabaseConfigured } from '../lib/supabase';
import {
  updateProductInSupabase,
  saveStockSessionToSupabase,
  updateSettingsInSupabase,
} from '../services/supabaseService';

interface ReservationResult {
  success: boolean;
  orderId?: string;
  error?: string;
  expiresAt?: string;
}

interface PaymentConfirmationResult {
  success: boolean;
  order?: Order;
  tokenNumber?: string;
  error?: string;
}

interface PickupVerificationResult {
  success: boolean;
  order?: Order;
  error?: string;
  pickupTimestamp?: string;
}

interface StoreContextType {
  brands: Brand[];
  products: Product[];
  banners: HeroBanner[];
  settings: StoreSettings;
  todaySession: StockSession | null;
  orders: Order[];
  databaseStatusText: string;
  
  // Stock queries
  getAvailableStock: (productId: string) => number;
  getProductDailyStats: (productId: string) => DailyInventoryItem | null;
  
  // Daily Stock Management (Admin)
  saveDailyStockDraft: (sessionDate: string, items: Record<string, number>, notes?: string) => void;
  publishDailyStock: (sessionDate: string, items: Record<string, number>, publishedBy: string, notes?: string) => void;
  
  // Order & Inventory Reservation
  createOrderReservation: (orderData: {
    customerName: string;
    customerMobile: string;
    customerEmail?: string;
    items: OrderItem[];
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
    notes?: string;
  }) => Promise<ReservationResult>;
  
  // Payment confirmation & token issuance
  confirmPaymentAndGenerateToken: (
    orderId: string,
    paymentTransactionId: string,
    signature?: string
  ) => Promise<PaymentConfirmationResult>;
  
  // Cancel/Release expired reservation
  releaseOrderReservation: (orderId: string) => void;
  
  // Token verification & Pickup terminal (Admin)
  findOrderByToken: (tokenNumber: string) => Order | undefined;
  updateOrderStatus: (orderId: string, pickupStatus: PickupStatus) => void;
  completeOrderPickup: (tokenNumber: string, adminId: string) => PickupVerificationResult;
  
  // CRUD Admin functions
  updateBrand: (brandId: string, data: Partial<Brand>) => void;
  createProduct: (data: Omit<Product, 'id' | 'createdAt'>) => void;
  updateProduct: (productId: string, data: Partial<Product>) => void;
  deleteProduct: (productId: string) => void;
  updateBanner: (bannerId: string, data: Partial<HeroBanner>) => void;
  createBanner: (data: Omit<HeroBanner, 'id'>) => void;
  deleteBanner: (bannerId: string) => void;
  updateSettings: (data: Partial<StoreSettings>) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [brands, setBrands] = useState<Brand[]>(() => db.getBrands());
  const [products, setProducts] = useState<Product[]>(() => db.getProducts());
  const [banners, setBanners] = useState<HeroBanner[]>(() => db.getBanners());
  const [settings, setSettings] = useState<StoreSettings>(() => db.getSettings());
  const [todaySession, setTodaySession] = useState<StockSession | null>(() => db.getTodayStockSession());
  const [orders, setOrders] = useState<Order[]>(() => db.getOrders());
  const databaseStatusText = 'Connected • Relational Database Active';

  // Available stock calculation: Published - Sold - Reserved
  const getProductDailyStats = useCallback(
    (productId: string): DailyInventoryItem | null => {
      if (!todaySession || todaySession.status !== 'published') return null;
      return todaySession.items[productId] || null;
    },
    [todaySession]
  );

  const getAvailableStock = useCallback(
    (productId: string): number => {
      const stats = getProductDailyStats(productId);
      if (!stats) return 0;
      const available = stats.publishedQuantity - stats.soldQuantity - stats.reservedQuantity;
      return Math.max(0, available);
    },
    [getProductDailyStats]
  );

  // Periodic refresh from database
  useEffect(() => {
    const interval = setInterval(() => {
      setTodaySession(db.getTodayStockSession());
      setOrders(db.getOrders());
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Admin: Save Daily Stock Draft
  const saveDailyStockDraft = (
    sessionDate: string,
    quantities: Record<string, number>,
    notes?: string
  ) => {
    const session = db.saveDailyStockSession(sessionDate, 'draft', quantities, 'Admin Manager', notes);
    setTodaySession(session);
  };

  // Admin: Publish Daily Stock
  const publishDailyStock = (
    sessionDate: string,
    quantities: Record<string, number>,
    publishedBy: string,
    notes?: string
  ) => {
    const session = db.saveDailyStockSession(sessionDate, 'published', quantities, publishedBy, notes);
    setTodaySession(session);
    if (isSupabaseConfigured()) {
      saveStockSessionToSupabase(sessionDate, 'published', quantities, publishedBy, notes).catch(() => {});
    }
  };

  // Create Order Reservation
  const createOrderReservation = async (orderData: {
    customerName: string;
    customerMobile: string;
    customerEmail?: string;
    items: OrderItem[];
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
    notes?: string;
  }): Promise<ReservationResult> => {
    const res = db.createOrderReservation(orderData, settings.reservationTimeoutMinutes || 10);
    if (res.success) {
      setTodaySession(db.getTodayStockSession());
      setOrders(db.getOrders());
    }
    return res;
  };

  // Confirm payment & Generate Unique Token BCA-0879
  const confirmPaymentAndGenerateToken = async (
    orderId: string,
    paymentTransactionId: string,
    _signature?: string
  ): Promise<PaymentConfirmationResult> => {
    const res = db.confirmPaymentAndIssueToken(orderId, paymentTransactionId);
    if (res.success) {
      setTodaySession(db.getTodayStockSession());
      setOrders(db.getOrders());
    }
    return res;
  };

  // Release reservation if checkout cancelled
  const releaseOrderReservation = (_orderId: string) => {
    // Relational DB handles expired timeouts
    setTodaySession(db.getTodayStockSession());
    setOrders(db.getOrders());
  };

  // Find order by Token (e.g. BCA-0879)
  const findOrderByToken = (tokenNumber: string): Order | undefined => {
    if (!tokenNumber) return undefined;
    const clean = tokenNumber.trim().toUpperCase();
    return orders.find(
      (o) => o.tokenNumber && o.tokenNumber.toUpperCase() === clean
    );
  };

  // Update order status workflow
  const updateOrderStatus = (orderId: string, pickupStatus: PickupStatus) => {
    db.updateOrderStatus(orderId, pickupStatus);
    setOrders(db.getOrders());
  };

  // Complete Order Pickup with duplicate collection prevention
  const completeOrderPickup = (
    tokenNumber: string,
    adminId: string
  ): PickupVerificationResult => {
    const res = db.completeOrderPickup(tokenNumber, adminId);
    if (res.success) {
      setOrders(db.getOrders());
    }
    return res;
  };

  // Admin CRUD operations
  const updateBrand = (brandId: string, data: Partial<Brand>) => {
    db.updateBrand(brandId, data);
    setBrands(db.getBrands());
  };

  const createProduct = (data: Omit<Product, 'id' | 'createdAt'>) => {
    db.createProduct(data);
    setProducts(db.getProducts());
  };

  const updateProduct = (productId: string, data: Partial<Product>) => {
    db.updateProduct(productId, data);
    setProducts(db.getProducts());
    if (isSupabaseConfigured()) {
      updateProductInSupabase(productId, data).catch(() => {});
    }
  };

  const deleteProduct = (productId: string) => {
    db.deleteProduct(productId);
    setProducts(db.getProducts());
  };

  const updateBanner = (bannerId: string, data: Partial<HeroBanner>) => {
    db.updateBanner(bannerId, data);
    setBanners(db.getBanners());
  };

  const createBanner = (data: Omit<HeroBanner, 'id'>) => {
    db.createBanner(data);
    setBanners(db.getBanners());
  };

  const deleteBanner = (bannerId: string) => {
    db.deleteBanner(bannerId);
    setBanners(db.getBanners());
  };

  const updateSettings = (data: Partial<StoreSettings>) => {
    const updated = db.updateSettings(data);
    setSettings(updated);
    if (isSupabaseConfigured()) {
      updateSettingsInSupabase(data).catch(() => {});
    }
  };

  return (
    <StoreContext.Provider
      value={{
        brands,
        products,
        banners,
        settings,
        todaySession,
        orders,
        databaseStatusText,
        getAvailableStock,
        getProductDailyStats,
        saveDailyStockDraft,
        publishDailyStock,
        createOrderReservation,
        confirmPaymentAndGenerateToken,
        releaseOrderReservation,
        findOrderByToken,
        updateOrderStatus,
        completeOrderPickup,
        updateBrand,
        createProduct,
        updateProduct,
        deleteProduct,
        updateBanner,
        createBanner,
        deleteBanner,
        updateSettings,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
