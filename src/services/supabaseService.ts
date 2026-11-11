import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';
import {
  Brand,
  Product,
  StockSession,
  DailyInventoryItem,
  Order,
  OrderItem,
  HeroBanner,
  StoreSettings,
} from '../types';

/**
 * ==============================================================================
 * BCA ICE CREAM WALA - DIRECT SUPABASE RELATIONAL DATA SERVICE
 * Handles row-into-column relational persistence on Supabase PostgreSQL
 * ==============================================================================
 */

// 1. Fetch Brands from Supabase
export async function fetchBrandsFromSupabase(): Promise<Brand[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('brands')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.warn('[Supabase] fetchBrands error:', error.message);
      return null;
    }

    if (!data || data.length === 0) return null;

    return data.map((b: any) => ({
      id: b.id,
      slug: b.slug,
      name: b.name,
      tagline: b.tagline || '',
      logo: b.logo,
      bgGradient: 'from-red-500/10 to-red-600/5',
      color: b.color || '#E63946',
      displayOrder: b.display_order,
      isActive: b.is_active,
    }));
  } catch (err) {
    console.warn('[Supabase] Exception fetching brands:', err);
    return null;
  }
}

// 2. Fetch Products from Supabase
export async function fetchProductsFromSupabase(): Promise<Product[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    let { data, error } = await client
      .from('products')
      .select('*')
      .order('display_order', { ascending: true, nullsFirst: false });

    // Fallback if display_order column does not exist yet on remote table
    if (error && (error.message?.includes('display_order') || error.code === '42703')) {
      const fallback = await client
        .from('products')
        .select('*')
        .order('name', { ascending: true });
      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      console.warn('[Supabase] fetchProducts error:', error.message);
      return null;
    }

    if (!data || data.length === 0) return null;

    return data.map((p: any) => ({
      id: p.id,
      brandId: p.brand_slug,
      brandName: p.brand_name,
      name: p.name,
      slug: p.slug,
      category: p.category,
      description: p.description || '',
      price: Number(p.price),
      image: p.image,
      volume: p.volume || '120 ml',
      badge: p.badge || undefined,
      rating: Number(p.rating) || 4.8,
      ratingCount: p.rating_count || 100,
      isPopular: Boolean(p.is_popular),
      isActive: Boolean(p.is_active),
      createdAt: p.created_at || new Date().toISOString(),
    }));
  } catch (err) {
    console.warn('[Supabase] Exception fetching products:', err);
    return null;
  }
}

// 3. Fetch Stock Session & Relational Daily Inventory Rows
export async function fetchStockSessionFromSupabase(sessionDate: string): Promise<StockSession | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    // A. Query master session row
    const { data: sessionData, error: sessionError } = await client
      .from('stock_sessions')
      .select('*')
      .eq('session_date', sessionDate)
      .maybeSingle();

    if (sessionError || !sessionData) {
      return null;
    }

    // B. Query child daily_inventory rows
    const { data: inventoryRows, error: invError } = await client
      .from('daily_inventory')
      .select('*')
      .eq('stock_session_id', sessionData.id);

    const itemsMap: Record<string, DailyInventoryItem> = {};

    if (inventoryRows) {
      inventoryRows.forEach((row: any) => {
        const published = Number(row.published_quantity) || 0;
        const sold = Number(row.sold_quantity) || 0;
        const reserved = Number(row.reserved_quantity) || 0;
        itemsMap[row.product_id] = {
          productId: row.product_id,
          publishedQuantity: published,
          soldQuantity: sold,
          reservedQuantity: reserved,
          availableQuantity: Math.max(0, published - sold - reserved),
          lowStockThreshold: row.low_stock_threshold || 5,
        };
      });
    }

    return {
      id: sessionData.id,
      sessionDate: sessionData.session_date,
      status: sessionData.status,
      publishedAt: sessionData.published_at,
      publishedBy: sessionData.published_by,
      totalPublished: Number(sessionData.total_published) || 0,
      totalSold: Number(sessionData.total_sold) || 0,
      notes: sessionData.notes,
      items: itemsMap,
    };
  } catch (err) {
    console.warn('[Supabase] Exception fetching stock session:', err);
    return null;
  }
}

// 4. Save Stock Session & Daily Inventory directly to Supabase
export async function saveStockSessionToSupabase(
  sessionDate: string,
  status: 'draft' | 'published',
  quantities: Record<string, number>,
  publishedBy: string,
  notes?: string
): Promise<StockSession | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    let totalPublished = 0;
    Object.values(quantities).forEach((qty) => {
      totalPublished += Math.max(0, qty);
    });

    // Upsert stock_session row
    const { data: sessionRow, error: sessionErr } = await client
      .from('stock_sessions')
      .upsert(
        {
          session_date: sessionDate,
          status,
          published_at: status === 'published' ? new Date().toISOString() : null,
          published_by: publishedBy,
          total_published: totalPublished,
          notes: notes || 'Updated via Admin Stock Management',
        },
        { onConflict: 'session_date' }
      )
      .select('*')
      .single();

    if (sessionErr || !sessionRow) {
      console.warn('[Supabase] Upsert session error:', sessionErr?.message);
      return null;
    }

    // Upsert relational daily_inventory rows
    const inventoryInserts = Object.entries(quantities).map(([productId, pubQty]) => ({
      stock_session_id: sessionRow.id,
      product_id: productId,
      published_quantity: Math.max(0, pubQty),
      sold_quantity: 0,
      reserved_quantity: 0,
      low_stock_threshold: 5,
    }));

    await client
      .from('daily_inventory')
      .upsert(inventoryInserts, { onConflict: 'stock_session_id,product_id' });

    return await fetchStockSessionFromSupabase(sessionDate);
  } catch (err) {
    console.warn('[Supabase] Exception saving stock session:', err);
    return null;
  }
}

// 5. Directly Insert Order and Relational Order Items to Supabase
export async function createOrderInSupabase(
  order: Order,
  items: OrderItem[]
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    // Insert row into orders table
    const { error: orderErr } = await client.from('orders').insert({
      id: order.id,
      token_number: order.tokenNumber || null,
      customer_name: order.customerName,
      customer_mobile: order.customerMobile,
      customer_email: order.customerEmail || null,
      subtotal: order.subtotal,
      tax_amount: order.taxAmount,
      total_amount: order.totalAmount,
      payment_status: order.paymentStatus,
      order_status: order.orderStatus,
      pickup_status: order.pickupStatus,
      stock_session_id: order.stockSessionId,
      reservation_expires_at: order.reservationExpiresAt || null,
      notes: order.notes || null,
    });

    if (orderErr) {
      console.warn('[Supabase] Insert order error:', orderErr.message);
      return false;
    }

    // Insert relational child rows into order_items table
    const itemRows = items.map((it) => ({
      order_id: order.id,
      product_id: it.productId,
      product_name: it.productName,
      brand_name: it.brandName,
      brand_id: it.brandId,
      unit_price: it.unitPrice,
      quantity: it.quantity,
      total_price: it.totalPrice,
    }));

    const { error: itemsErr } = await client.from('order_items').insert(itemRows);
    if (itemsErr) {
      console.warn('[Supabase] Insert order_items error:', itemsErr.message);
    }

    return true;
  } catch (err) {
    console.warn('[Supabase] Exception creating order:', err);
    return false;
  }
}

// 6. Confirm Order Payment & Issue Token directly in Supabase
export async function confirmPaymentInSupabase(
  orderId: string,
  paymentTransactionId: string,
  tokenNumber: string,
  totalAmount: number
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    // Update orders row
    const { error: orderUpdateErr } = await client
      .from('orders')
      .update({
        token_number: tokenNumber,
        payment_status: 'paid',
        order_status: 'confirmed',
        pickup_status: 'confirmed',
        payment_transaction_id: paymentTransactionId,
        reservation_expires_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (orderUpdateErr) {
      console.warn('[Supabase] Confirm payment order update error:', orderUpdateErr.message);
      return false;
    }

    // Insert row into payments audit table
    await client.from('payments').insert({
      order_id: orderId,
      token_number: tokenNumber,
      gateway: 'razorpay',
      razorpay_payment_id: paymentTransactionId,
      amount: totalAmount,
      status: 'paid',
    });

    return true;
  } catch (err) {
    console.warn('[Supabase] Exception confirming payment:', err);
    return false;
  }
}

// 7. Update Pickup Status directly in Supabase (Complete Handover)
export async function completePickupInSupabase(
  orderId: string,
  tokenNumber: string,
  adminId: string
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const pickupTimestamp = new Date().toISOString();
    const { error } = await client
      .from('orders')
      .update({
        pickup_status: 'picked_up',
        pickup_timestamp: pickupTimestamp,
        picked_up_by_admin_id: adminId,
        updated_at: pickupTimestamp,
      })
      .eq('id', orderId);

    if (error) {
      console.warn('[Supabase] Pickup update error:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.warn('[Supabase] Exception updating pickup in Supabase:', err);
    return false;
  }
}

// 8. Fetch Orders from Supabase with Relational Items
export async function fetchOrdersFromSupabase(): Promise<Order[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data: ordersData, error: ordersErr } = await client
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });

    if (ordersErr || !ordersData) {
      return null;
    }

    return ordersData.map((o: any) => ({
      id: o.id,
      tokenNumber: o.token_number || '',
      customerName: o.customer_name,
      customerMobile: o.customer_mobile,
      customerEmail: o.customer_email || undefined,
      subtotal: Number(o.subtotal),
      taxAmount: Number(o.tax_amount) || 0,
      totalAmount: Number(o.total_amount),
      paymentStatus: o.payment_status,
      orderStatus: o.order_status,
      pickupStatus: o.pickup_status,
      paymentTransactionId: o.payment_transaction_id || undefined,
      stockSessionId: o.stock_session_id || '',
      reservationExpiresAt: o.reservation_expires_at || undefined,
      pickupTimestamp: o.pickup_timestamp || undefined,
      pickedUpByAdminId: o.picked_up_by_admin_id || undefined,
      notes: o.notes || undefined,
      createdAt: o.created_at,
      updatedAt: o.updated_at || o.created_at,
      items: (o.order_items || []).map((it: any) => ({
        productId: it.product_id,
        productName: it.product_name,
        brandName: it.brand_name,
        brandId: it.brand_id,
        image: 'https://images.unsplash.com/photo-1580915411954-282cb1b0d780?auto=format&fit=crop&w=600&q=80',
        unitPrice: Number(it.unit_price),
        quantity: Number(it.quantity),
        totalPrice: Number(it.total_price),
      })),
    }));
  } catch (err) {
    console.warn('[Supabase] Exception fetching orders:', err);
    return null;
  }
}

// 9. Fetch Store Settings
export async function fetchSettingsFromSupabase(): Promise<StoreSettings | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client.from('store_settings').select('*').eq('id', 1).maybeSingle();
    if (error || !data) return null;

    return {
      shopName: data.shop_name,
      tagline: data.tagline,
      logo: '/brands/amul.jpg',
      phone: data.phone,
      email: data.email,
      address: data.address,
      googleMapsUrl: data.google_maps_url,
      pickupInstructions: data.pickup_instructions,
      openingTime: data.opening_time,
      closingTime: data.closing_time,
      timezone: data.timezone || 'Asia/Kolkata',
      minOrderValue: Number(data.min_order_value) || 50,
      reservationTimeoutMinutes: Number(data.reservation_timeout_minutes) || 10,
      lowStockThreshold: Number(data.low_stock_threshold) || 5,
      razorpayKeyId: data.razorpay_key_id || 'rzp_test_BcaIceCreamWalaKey',
      isDevTestMode: true,
    };
  } catch (err) {
    console.warn('[Supabase] Exception fetching settings:', err);
    return null;
  }
}

// 10. Update Store Settings
export async function updateSettingsInSupabase(data: Partial<StoreSettings>): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const updateObj: Record<string, any> = {};
    if (data.shopName) updateObj.shop_name = data.shopName;
    if (data.address) updateObj.address = data.address;
    if (data.phone) updateObj.phone = data.phone;
    if (data.openingTime) updateObj.opening_time = data.openingTime;
    if (data.closingTime) updateObj.closing_time = data.closingTime;
    if (data.minOrderValue !== undefined) updateObj.min_order_value = data.minOrderValue;

    const { error } = await client.from('store_settings').update(updateObj).eq('id', 1);
    return !error;
  } catch (err) {
    return false;
  }
}

// 11. Update Product directly in Supabase (Price, Active Status, etc.)
export async function updateProductInSupabase(
  productId: string,
  updates: Partial<Product>
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const updatePayload: Record<string, any> = { updated_at: new Date().toISOString() };
    if (updates.price !== undefined) updatePayload.price = updates.price;
    if (updates.name !== undefined) updatePayload.name = updates.name;
    if (updates.category !== undefined) updatePayload.category = updates.category;
    if (updates.volume !== undefined) updatePayload.volume = updates.volume;
    if (updates.image !== undefined) updatePayload.image = updates.image;
    if (updates.badge !== undefined) updatePayload.badge = updates.badge;
    if (updates.description !== undefined) updatePayload.description = updates.description;
    if (updates.isActive !== undefined) updatePayload.is_active = updates.isActive;
    if (updates.isPopular !== undefined) updatePayload.is_popular = updates.isPopular;

    const { error } = await client
      .from('products')
      .update(updatePayload)
      .or(`id.eq.${productId},slug.eq.${productId}`);

    return !error;
  } catch (err) {
    console.warn('[Supabase] Exception updating product:', err);
    return false;
  }
}

// 12. Batch Push / Sync Products to Supabase
export async function syncProductsToSupabase(
  products: Product[]
): Promise<{ success: boolean; count: number; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, count: 0, error: 'Supabase client is not configured' };

  try {
    const rows = products.map((p, idx) => ({
      brand_slug: p.brandId,
      brand_name: p.brandName,
      name: p.name,
      slug: p.slug,
      category: p.category,
      description: p.description || '',
      price: p.price,
      volume: p.volume,
      image: p.image,
      badge: p.badge || null,
      rating: p.rating,
      rating_count: p.ratingCount,
      is_popular: p.isPopular,
      is_active: p.isActive,
      display_order: idx + 1,
    }));

    const BATCH_SIZE = 50;
    let totalUpserted = 0;

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const { error } = await client
        .from('products')
        .upsert(batch, { onConflict: 'slug' });

      if (error) {
        return { success: false, count: totalUpserted, error: error.message };
      }
      totalUpserted += batch.length;
    }

    return { success: true, count: totalUpserted };
  } catch (err: any) {
    return { success: false, count: 0, error: err.message || 'Unknown sync error' };
  }
}

// 13. Test live connection to Supabase and verify tables
export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  message: string;
  productCount?: number;
  brandCount?: number;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      connected: false,
      message: 'Supabase URL or Key not set. Enter your credentials or configure .env.',
    };
  }

  try {
    const { count: brandCount, error: bErr } = await client
      .from('brands')
      .select('*', { count: 'exact', head: true });

    if (bErr) {
      return {
        connected: false,
        message: `Connected to host, but database query failed: ${bErr.message}. Make sure supabase/schema.sql has been executed.`,
      };
    }

    const { count: productCount, error: pErr } = await client
      .from('products')
      .select('*', { count: 'exact', head: true });

    if (pErr) {
      return {
        connected: false,
        message: `Query failed on products table: ${pErr.message}`,
      };
    }

    return {
      connected: true,
      message: `Successfully connected to Supabase! Found ${brandCount ?? 0} brands and ${productCount ?? 0} products in remote database.`,
      productCount: productCount ?? 0,
      brandCount: brandCount ?? 0,
    };
  } catch (err: any) {
    return {
      connected: false,
      message: `Connection exception: ${err.message || 'Network error'}`,
    };
  }
}

