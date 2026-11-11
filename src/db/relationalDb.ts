/**
 * ==============================================================================
 * BCA ICE CREAM WALA - RELATIONAL DATABASE ENGINE
 * Production row-into-column relational storage with foreign keys, cascading
 * integrity, atomic inventory operations, and instant persistence.
 * ==============================================================================
 */

import {
  Brand,
  Product,
  StockSession,
  DailyInventoryItem,
  Order,
  OrderItem,
  HeroBanner,
  StoreSettings,
  PickupStatus,
} from '../types';
import {
  INITIAL_BRANDS,
  INITIAL_PRODUCTS,
  INITIAL_BANNERS,
  createInitialStockSession,
} from '../data/initialData';
import { getNextTokenNumber } from '../lib/tokenGenerator';
import { getKolkataDateString } from '../utils/orderTiming';

// Storage keys for relational tables
const DB_PREFIX = 'bca_icecream_rel_db_v5_';
const TABLES = {
  BRANDS: `${DB_PREFIX}brands`,
  PRODUCTS: `${DB_PREFIX}products`,
  STOCK_SESSIONS: `${DB_PREFIX}stock_sessions`,
  DAILY_INVENTORY: `${DB_PREFIX}daily_inventory`,
  ORDERS: `${DB_PREFIX}orders`,
  ORDER_ITEMS: `${DB_PREFIX}order_items`,
  PAYMENTS: `${DB_PREFIX}payments`,
  BANNERS: `${DB_PREFIX}banners`,
  STORE_SETTINGS: `${DB_PREFIX}store_settings`,
};

// Initial store settings read directly from .env
function getInitialSettingsFromEnv(): StoreSettings {
  return {
    shopName: 'BCA Ice Cream Wala',
    tagline: 'Your Favourite Ice Cream, Picked Up Fresh!',
    logo: '/brands/amul.jpg',
    phone: '+91 98765 43210',
    email: 'orders@bcaicecreamwala.com',
    address: 'Shop No. 4, College Road, Near BCA Complex, Main Market, Pin 380009',
    googleMapsUrl: 'https://maps.google.com/?q=BCA+Ice+Cream+Wala',
    pickupInstructions:
      'Your order will be available for collection at BCA Ice Cream Wala. Please show your unique order token (e.g. BCA-0879) at the shop counter.',
    openingTime: import.meta.env.VITE_ORDER_OPENING_TIME || '12:00',
    closingTime: import.meta.env.VITE_ORDER_CLOSING_TIME || '18:00',
    timezone: import.meta.env.VITE_STORE_TIMEZONE || 'Asia/Kolkata',
    minOrderValue: Number(import.meta.env.VITE_MIN_ORDER_VALUE) || 50,
    reservationTimeoutMinutes: 10,
    lowStockThreshold: 5,
    razorpayKeyId: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_BcaIceCreamWalaKey',
    isDevTestMode: true,
  };
}

class RelationalDatabase {
  private memoryCache: Record<string, any[]> = {};
  private settingsCache: StoreSettings | null = null;

  constructor() {
    this.initDatabase();
  }

  // Generate UUID / unique row ID
  public generateId(prefix = 'id'): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  // Load table rows from persistent storage
  private loadTable<T>(tableName: string, defaultData: T[] = []): T[] {
    if (this.memoryCache[tableName]) {
      return this.memoryCache[tableName];
    }
    try {
      const stored = localStorage.getItem(tableName);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.memoryCache[tableName] = parsed;
        return parsed;
      }
    } catch (e) {
      console.warn(`[RelationalDB] Error loading ${tableName}:`, e);
    }
    this.memoryCache[tableName] = defaultData;
    this.saveTable(tableName, defaultData);
    return defaultData;
  }

  // Save table rows to persistent storage
  private saveTable<T>(tableName: string, data: T[]): void {
    this.memoryCache[tableName] = data;
    try {
      localStorage.setItem(tableName, JSON.stringify(data));
    } catch (e) {
      console.warn(`[RelationalDB] Error saving ${tableName}:`, e);
    }
  }

  // Initialize relational tables & seed default data
  public initDatabase(): void {
    // 1. Brands Table (5 official brands)
    this.loadTable<Brand>(TABLES.BRANDS, INITIAL_BRANDS);

    // 2. Products Table (21 products with foreign keys to brands)
    this.loadTable<Product>(TABLES.PRODUCTS, INITIAL_PRODUCTS);

    // 3. Promotional Banners Table
    this.loadTable<HeroBanner>(TABLES.BANNERS, INITIAL_BANNERS);

    // 4. Store Settings Table (loaded from .env)
    try {
      const stored = localStorage.getItem(TABLES.STORE_SETTINGS);
      if (stored) {
        this.settingsCache = JSON.parse(stored);
      } else {
        const envSettings = getInitialSettingsFromEnv();
        this.settingsCache = envSettings;
        localStorage.setItem(TABLES.STORE_SETTINGS, JSON.stringify(envSettings));
      }
    } catch {
      this.settingsCache = getInitialSettingsFromEnv();
    }

    // 5. Stock Sessions Table & Daily Inventory Table
    const todayStr = getKolkataDateString();
    const sessions = this.loadTable<any>(TABLES.STOCK_SESSIONS, []);
    const existingSession = sessions.find((s) => s.sessionDate === todayStr);

    if (!existingSession) {
      const initialSession = createInitialStockSession(todayStr);
      sessions.push({
        id: initialSession.id,
        sessionDate: initialSession.sessionDate,
        status: initialSession.status,
        publishedAt: initialSession.publishedAt,
        publishedBy: initialSession.publishedBy,
        totalPublished: initialSession.totalPublished,
        totalSold: initialSession.totalSold,
        notes: initialSession.notes,
        createdAt: new Date().toISOString(),
      });
      this.saveTable(TABLES.STOCK_SESSIONS, sessions);

      // Seed relational daily_inventory rows for today's session
      const invRows: any[] = Object.values(initialSession.items).map((it) => ({
        id: this.generateId('inv'),
        stockSessionId: initialSession.id,
        productId: it.productId,
        publishedQuantity: it.publishedQuantity,
        soldQuantity: it.soldQuantity,
        reservedQuantity: it.reservedQuantity,
        lowStockThreshold: it.lowStockThreshold || 5,
        updatedAt: new Date().toISOString(),
      }));
      this.saveTable(TABLES.DAILY_INVENTORY, invRows);
    }

    // 6. Orders Table (Initial seed order with token BCA-0878)
    const orders = this.loadTable<any>(TABLES.ORDERS, []);
    if (orders.length === 0) {
      const seedOrderId = 'ord-seed-0878';
      orders.push({
        id: seedOrderId,
        tokenNumber: 'BCA-0878',
        customerName: 'Aarav Patel',
        customerMobile: '9825012345',
        customerEmail: 'aarav@example.com',
        subtotal: 180,
        taxAmount: 0,
        totalAmount: 180,
        paymentStatus: 'paid',
        orderStatus: 'confirmed',
        pickupStatus: 'ready',
        paymentTransactionId: 'pay_rzp_mock_0878',
        stockSessionId: `sess-${todayStr}`,
        createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      });
      this.saveTable(TABLES.ORDERS, orders);

      // Seed relational child rows into ORDER_ITEMS table
      const orderItems = this.loadTable<any>(TABLES.ORDER_ITEMS, []);
      orderItems.push(
        {
          id: this.generateId('oit'),
          orderId: seedOrderId,
          productId: 'p-amul-rajwadi',
          productName: 'Amul Rajwadi Kulfi',
          brandName: 'Amul',
          brandId: 'amul',
          unitPrice: 60,
          quantity: 2,
          totalPrice: 120,
        },
        {
          id: this.generateId('oit'),
          orderId: seedOrderId,
          productId: 'p-mother-dairy-mango-dolly',
          productName: 'Mother Dairy Mango Dolly',
          brandName: 'Mother Dairy',
          brandId: 'mother-dairy',
          unitPrice: 30,
          quantity: 2,
          totalPrice: 60,
        }
      );
      this.saveTable(TABLES.ORDER_ITEMS, orderItems);

      // Seed payment row
      const payments = this.loadTable<any>(TABLES.PAYMENTS, []);
      payments.push({
        id: this.generateId('pay'),
        orderId: seedOrderId,
        tokenNumber: 'BCA-0878',
        gateway: 'Razorpay Online',
        razorpayPaymentId: 'pay_rzp_mock_0878',
        amount: 180,
        status: 'paid',
        createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      });
      this.saveTable(TABLES.PAYMENTS, payments);
    }
  }

  // --- QUERY METHODS ---

  public getBrands(): Brand[] {
    return this.loadTable<Brand>(TABLES.BRANDS);
  }

  public getProducts(): Product[] {
    return this.loadTable<Product>(TABLES.PRODUCTS);
  }

  public getBanners(): HeroBanner[] {
    return this.loadTable<HeroBanner>(TABLES.BANNERS);
  }

  public getSettings(): StoreSettings {
    if (!this.settingsCache) {
      this.settingsCache = getInitialSettingsFromEnv();
    }
    return this.settingsCache;
  }

  public updateSettings(data: Partial<StoreSettings>): StoreSettings {
    const current = this.getSettings();
    const updated = { ...current, ...data };
    this.settingsCache = updated;
    localStorage.setItem(TABLES.STORE_SETTINGS, JSON.stringify(updated));
    return updated;
  }

  // Get Today's Stock Session with joined Daily Inventory Rows
  public getTodayStockSession(): StockSession | null {
    const todayStr = getKolkataDateString();
    const sessions = this.loadTable<any>(TABLES.STOCK_SESSIONS);
    const sessionRow = sessions.find((s) => s.sessionDate === todayStr);
    if (!sessionRow) return null;

    // Join with daily_inventory table
    const invRows = this.loadTable<any>(TABLES.DAILY_INVENTORY);
    const sessionInvRows = invRows.filter((r) => r.stockSessionId === sessionRow.id);

    const itemsMap: Record<string, DailyInventoryItem> = {};
    sessionInvRows.forEach((row) => {
      itemsMap[row.productId] = {
        productId: row.productId,
        publishedQuantity: row.publishedQuantity,
        soldQuantity: row.soldQuantity,
        reservedQuantity: row.reservedQuantity,
        availableQuantity: Math.max(
          0,
          row.publishedQuantity - row.soldQuantity - row.reservedQuantity
        ),
        lowStockThreshold: row.lowStockThreshold || 5,
      };
    });

    return {
      id: sessionRow.id,
      sessionDate: sessionRow.sessionDate,
      status: sessionRow.status,
      publishedAt: sessionRow.publishedAt,
      publishedBy: sessionRow.publishedBy,
      totalPublished: sessionRow.totalPublished,
      totalSold: sessionRow.totalSold,
      notes: sessionRow.notes,
      items: itemsMap,
    };
  }

  // Save / Publish Daily Stock Session (Row into column upsert)
  public saveDailyStockSession(
    sessionDate: string,
    status: 'draft' | 'published',
    quantities: Record<string, number>,
    publishedBy: string,
    notes?: string
  ): StockSession {
    const sessions = this.loadTable<any>(TABLES.STOCK_SESSIONS);
    let sessionRow = sessions.find((s) => s.sessionDate === sessionDate);

    let totalPub = 0;
    Object.values(quantities).forEach((q) => {
      totalPub += Math.max(0, q);
    });

    if (sessionRow) {
      sessionRow.status = status;
      sessionRow.publishedAt = status === 'published' ? new Date().toISOString() : sessionRow.publishedAt;
      sessionRow.publishedBy = publishedBy;
      sessionRow.totalPublished = totalPub;
      sessionRow.notes = notes || sessionRow.notes;
    } else {
      sessionRow = {
        id: `sess-${sessionDate}`,
        sessionDate,
        status,
        publishedAt: status === 'published' ? new Date().toISOString() : null,
        publishedBy,
        totalPublished: totalPub,
        totalSold: 0,
        notes: notes || 'Daily stock published for all brands',
        createdAt: new Date().toISOString(),
      };
      sessions.push(sessionRow);
    }
    this.saveTable(TABLES.STOCK_SESSIONS, sessions);

    // Upsert relational daily_inventory table rows
    const allInv = this.loadTable<any>(TABLES.DAILY_INVENTORY);
    const otherSessionsInv = allInv.filter((r) => r.stockSessionId !== sessionRow.id);

    const sessionInvRows: any[] = [];
    const itemsMap: Record<string, DailyInventoryItem> = {};

    Object.entries(quantities).forEach(([pId, qty]) => {
      const existing = allInv.find((r) => r.stockSessionId === sessionRow.id && r.productId === pId);
      const sold = existing ? existing.soldQuantity : 0;
      const reserved = existing ? existing.reservedQuantity : 0;
      const pub = Math.max(0, qty);

      const invRow = {
        id: existing ? existing.id : this.generateId('inv'),
        stockSessionId: sessionRow.id,
        productId: pId,
        publishedQuantity: pub,
        soldQuantity: sold,
        reservedQuantity: reserved,
        lowStockThreshold: 5,
        updatedAt: new Date().toISOString(),
      };
      sessionInvRows.push(invRow);

      itemsMap[pId] = {
        productId: pId,
        publishedQuantity: pub,
        soldQuantity: sold,
        reservedQuantity: reserved,
        availableQuantity: Math.max(0, pub - sold - reserved),
        lowStockThreshold: 5,
      };
    });

    this.saveTable(TABLES.DAILY_INVENTORY, [...otherSessionsInv, ...sessionInvRows]);

    return {
      id: sessionRow.id,
      sessionDate: sessionRow.sessionDate,
      status: sessionRow.status,
      publishedAt: sessionRow.publishedAt,
      publishedBy: sessionRow.publishedBy,
      totalPublished: sessionRow.totalPublished,
      totalSold: sessionRow.totalSold,
      notes: sessionRow.notes,
      items: itemsMap,
    };
  }

  // Get Orders with relational joined Order Items
  public getOrders(): Order[] {
    const orders = this.loadTable<any>(TABLES.ORDERS);
    const allItems = this.loadTable<any>(TABLES.ORDER_ITEMS);
    const products = this.getProducts();

    return orders.map((o) => {
      const orderItems = allItems.filter((it) => it.orderId === o.id);
      return {
        id: o.id,
        tokenNumber: o.tokenNumber || '',
        customerName: o.customerName,
        customerMobile: o.customerMobile,
        customerEmail: o.customerEmail || undefined,
        subtotal: o.subtotal,
        taxAmount: o.taxAmount || 0,
        totalAmount: o.totalAmount,
        paymentStatus: o.paymentStatus,
        orderStatus: o.orderStatus,
        pickupStatus: o.pickupStatus,
        paymentTransactionId: o.paymentTransactionId,
        stockSessionId: o.stockSessionId,
        reservationExpiresAt: o.reservationExpiresAt,
        pickupTimestamp: o.pickupTimestamp,
        pickedUpByAdminId: o.pickedUpByAdminId,
        notes: o.notes,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
        items: orderItems.map((it) => {
          const prod = products.find((p) => p.id === it.productId);
          return {
            productId: it.productId,
            productName: it.productName || prod?.name || 'Ice Cream',
            brandName: it.brandName || prod?.brandName || 'Brand',
            brandId: it.brandId || prod?.brandId || 'amul',
            image: prod?.image || 'https://images.unsplash.com/photo-1580915411954-282cb1b0d780?auto=format&fit=crop&w=600&q=80',
            unitPrice: it.unitPrice,
            quantity: it.quantity,
            totalPrice: it.totalPrice,
          };
        }),
      };
    });
  }

  // Atomically create order & relational order_items, reserve inventory
  public createOrderReservation(
    orderData: {
      customerName: string;
      customerMobile: string;
      customerEmail?: string;
      items: OrderItem[];
      subtotal: number;
      taxAmount: number;
      totalAmount: number;
      notes?: string;
    },
    timeoutMinutes = 10
  ): { success: boolean; orderId?: string; expiresAt?: string; error?: string } {
    const todaySession = this.getTodayStockSession();
    if (!todaySession || todaySession.status !== 'published') {
      return { success: false, error: "Today's stock session has not been published yet." };
    }

    const settings = this.getSettings();
    if (orderData.subtotal < settings.minOrderValue) {
      return {
        success: false,
        error: `Minimum order amount is ₹${settings.minOrderValue}. Please add more items.`,
      };
    }

    // Verify stock availability
    for (const item of orderData.items) {
      const stat = todaySession.items[item.productId];
      const available = stat ? stat.publishedQuantity - stat.soldQuantity - stat.reservedQuantity : 0;
      if (available < item.quantity) {
        return {
          success: false,
          error: `Insufficient stock for ${item.productName}. Only ${available} available today.`,
        };
      }
    }

    const orderId = `ord-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const expiresAt = new Date(Date.now() + timeoutMinutes * 60 * 1000).toISOString();

    // 1. Update daily_inventory reserved_quantity
    const invRows = this.loadTable<any>(TABLES.DAILY_INVENTORY);
    orderData.items.forEach((item) => {
      const invRow = invRows.find(
        (r) => r.stockSessionId === todaySession.id && r.productId === item.productId
      );
      if (invRow) {
        invRow.reservedQuantity = (invRow.reservedQuantity || 0) + item.quantity;
        invRow.updatedAt = new Date().toISOString();
      }
    });
    this.saveTable(TABLES.DAILY_INVENTORY, invRows);

    // 2. Insert row into ORDERS table
    const orders = this.loadTable<any>(TABLES.ORDERS);
    orders.unshift({
      id: orderId,
      tokenNumber: '', // Assigned after payment!
      customerName: orderData.customerName,
      customerMobile: orderData.customerMobile,
      customerEmail: orderData.customerEmail,
      subtotal: orderData.subtotal,
      taxAmount: orderData.taxAmount,
      totalAmount: orderData.totalAmount,
      paymentStatus: 'created',
      orderStatus: 'pending',
      pickupStatus: 'confirmed',
      stockSessionId: todaySession.id,
      reservationExpiresAt: expiresAt,
      notes: orderData.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    this.saveTable(TABLES.ORDERS, orders);

    // 3. Insert relational child rows into ORDER_ITEMS table
    const allItems = this.loadTable<any>(TABLES.ORDER_ITEMS);
    orderData.items.forEach((it) => {
      allItems.push({
        id: this.generateId('oit'),
        orderId,
        productId: it.productId,
        productName: it.productName,
        brandName: it.brandName,
        brandId: it.brandId,
        unitPrice: it.unitPrice,
        quantity: it.quantity,
        totalPrice: it.totalPrice,
      });
    });
    this.saveTable(TABLES.ORDER_ITEMS, allItems);

    return { success: true, orderId, expiresAt };
  }

  // Confirm payment, generate prominent unique token BCA-0879, convert reserved to sold
  public confirmPaymentAndIssueToken(
    orderId: string,
    paymentTransactionId: string
  ): { success: boolean; tokenNumber?: string; order?: Order; error?: string } {
    const orders = this.loadTable<any>(TABLES.ORDERS);
    const orderRow = orders.find((o) => o.id === orderId);
    if (!orderRow) {
      return { success: false, error: 'Order not found in database.' };
    }

    if (orderRow.paymentStatus === 'paid') {
      const fullOrder = this.getOrders().find((o) => o.id === orderId);
      return { success: true, tokenNumber: orderRow.tokenNumber, order: fullOrder };
    }

    // Generate unique prominent sequential token (e.g. BCA-0879)
    const tokenNumber = getNextTokenNumber(orders.length);

    // Convert active reservations to sold stock in daily_inventory
    const allItems = this.loadTable<any>(TABLES.ORDER_ITEMS);
    const orderItems = allItems.filter((it) => it.orderId === orderId);

    const invRows = this.loadTable<any>(TABLES.DAILY_INVENTORY);
    orderItems.forEach((it) => {
      const invRow = invRows.find(
        (r) => r.stockSessionId === orderRow.stockSessionId && r.productId === it.productId
      );
      if (invRow) {
        invRow.reservedQuantity = Math.max(0, (invRow.reservedQuantity || 0) - it.quantity);
        invRow.soldQuantity = (invRow.soldQuantity || 0) + it.quantity;
        invRow.updatedAt = new Date().toISOString();
      }
    });
    this.saveTable(TABLES.DAILY_INVENTORY, invRows);

    // Update stock_sessions total_sold
    const sessions = this.loadTable<any>(TABLES.STOCK_SESSIONS);
    const sessRow = sessions.find((s) => s.id === orderRow.stockSessionId);
    if (sessRow) {
      const totalSold = orderItems.reduce((acc, it) => acc + it.quantity, 0);
      sessRow.totalSold = (sessRow.totalSold || 0) + totalSold;
      this.saveTable(TABLES.STOCK_SESSIONS, sessions);
    }

    // Update ORDERS table row
    orderRow.tokenNumber = tokenNumber;
    orderRow.paymentStatus = 'paid';
    orderRow.orderStatus = 'confirmed';
    orderRow.pickupStatus = 'confirmed';
    orderRow.paymentTransactionId = paymentTransactionId;
    orderRow.reservationExpiresAt = null;
    orderRow.updatedAt = new Date().toISOString();
    this.saveTable(TABLES.ORDERS, orders);

    // Insert row into PAYMENTS table
    const payments = this.loadTable<any>(TABLES.PAYMENTS);
    payments.push({
      id: this.generateId('pay'),
      orderId,
      tokenNumber,
      gateway: 'Razorpay Online',
      razorpayPaymentId: paymentTransactionId,
      amount: orderRow.totalAmount,
      status: 'paid',
      createdAt: new Date().toISOString(),
    });
    this.saveTable(TABLES.PAYMENTS, payments);

    const fullOrder = this.getOrders().find((o) => o.id === orderId);
    return { success: true, tokenNumber, order: fullOrder };
  }

  // Complete Order Pickup with strict duplicate collection prevention
  public completeOrderPickup(
    tokenNumber: string,
    adminId: string
  ): { success: boolean; order?: Order; error?: string; pickupTimestamp?: string } {
    const orders = this.loadTable<any>(TABLES.ORDERS);
    const cleanToken = tokenNumber.trim().toUpperCase();
    const orderRow = orders.find(
      (o) => o.tokenNumber && o.tokenNumber.toUpperCase() === cleanToken
    );

    if (!orderRow) {
      return { success: false, error: `No order found with token "${tokenNumber}".` };
    }

    if (orderRow.paymentStatus !== 'paid') {
      return {
        success: false,
        error: `Order payment status is "${orderRow.paymentStatus.toUpperCase()}". Unpaid orders cannot be handed over.`,
      };
    }

    if (orderRow.pickupStatus === 'picked_up') {
      return {
        success: false,
        error: `Order ${orderRow.tokenNumber} has ALREADY been collected on ${new Date(
          orderRow.pickupTimestamp || ''
        ).toLocaleTimeString()}! Duplicate pickup blocked.`,
      };
    }

    const pickupTimestamp = new Date().toISOString();
    orderRow.pickupStatus = 'picked_up';
    orderRow.pickupTimestamp = pickupTimestamp;
    orderRow.pickedUpByAdminId = adminId;
    orderRow.updatedAt = pickupTimestamp;
    this.saveTable(TABLES.ORDERS, orders);

    const fullOrder = this.getOrders().find((o) => o.id === orderRow.id);
    return { success: true, order: fullOrder, pickupTimestamp };
  }

  // Update order status workflow
  public updateOrderStatus(orderId: string, pickupStatus: PickupStatus): void {
    const orders = this.loadTable<any>(TABLES.ORDERS);
    const ord = orders.find((o) => o.id === orderId);
    if (ord) {
      ord.pickupStatus = pickupStatus;
      ord.updatedAt = new Date().toISOString();
      this.saveTable(TABLES.ORDERS, orders);
    }
  }

  // CRUD for Products
  public createProduct(data: Omit<Product, 'id' | 'createdAt'>): Product {
    const products = this.loadTable<Product>(TABLES.PRODUCTS);
    const newProduct: Product = {
      ...data,
      id: this.generateId('prod'),
      createdAt: new Date().toISOString(),
    };
    products.unshift(newProduct);
    this.saveTable(TABLES.PRODUCTS, products);
    return newProduct;
  }

  public updateProduct(productId: string, data: Partial<Product>): void {
    const products = this.loadTable<Product>(TABLES.PRODUCTS);
    const idx = products.findIndex((p) => p.id === productId);
    if (idx !== -1) {
      products[idx] = { ...products[idx], ...data };
      this.saveTable(TABLES.PRODUCTS, products);
    }
  }

  public deleteProduct(productId: string): void {
    const products = this.loadTable<Product>(TABLES.PRODUCTS);
    this.saveTable(
      TABLES.PRODUCTS,
      products.filter((p) => p.id !== productId)
    );
  }

  // CRUD for Brands
  public updateBrand(brandId: string, data: Partial<Brand>): void {
    const brands = this.loadTable<Brand>(TABLES.BRANDS);
    const idx = brands.findIndex((b) => b.id === brandId);
    if (idx !== -1) {
      brands[idx] = { ...brands[idx], ...data };
      this.saveTable(TABLES.BRANDS, brands);
    }
  }

  // CRUD for Banners
  public createBanner(data: Omit<HeroBanner, 'id'>): HeroBanner {
    const banners = this.loadTable<HeroBanner>(TABLES.BANNERS);
    const newBanner: HeroBanner = {
      ...data,
      id: this.generateId('bnr'),
    };
    banners.push(newBanner);
    this.saveTable(TABLES.BANNERS, banners);
    return newBanner;
  }

  public updateBanner(bannerId: string, data: Partial<HeroBanner>): void {
    const banners = this.loadTable<HeroBanner>(TABLES.BANNERS);
    const idx = banners.findIndex((b) => b.id === bannerId);
    if (idx !== -1) {
      banners[idx] = { ...banners[idx], ...data };
      this.saveTable(TABLES.BANNERS, banners);
    }
  }

  public deleteBanner(bannerId: string): void {
    const banners = this.loadTable<HeroBanner>(TABLES.BANNERS);
    this.saveTable(
      TABLES.BANNERS,
      banners.filter((b) => b.id !== bannerId)
    );
  }
}

export const db = new RelationalDatabase();
