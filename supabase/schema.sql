-- ==============================================================================
-- BCA ICE CREAM WALA - SUPABASE POSTGRESQL COMPLETE DATABASE SCHEMA
-- Relational Row-Into-Column Structure with Foreign Keys, Complete RLS Family & Seed Data
-- ==============================================================================

-- 1. Enable Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Drop existing tables if re-running full schema
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.daily_inventory CASCADE;
DROP TABLE IF EXISTS public.stock_sessions CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.brands CASCADE;
DROP TABLE IF EXISTS public.banners CASCADE;
DROP TABLE IF EXISTS public.store_settings CASCADE;
DROP TABLE IF EXISTS public.admin_audit_logs CASCADE;
DROP SEQUENCE IF EXISTS bca_token_seq CASCADE;

-- 3. BRANDS TABLE (Parent)
CREATE TABLE public.brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    tagline VARCHAR(255),
    logo VARCHAR(500) NOT NULL,
    color VARCHAR(20) DEFAULT '#E63946',
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. PRODUCTS TABLE (Child of Brands)
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
    brand_slug VARCHAR(50) NOT NULL,
    brand_name VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL CHECK (price > 0),
    volume VARCHAR(50),
    image VARCHAR(500) NOT NULL,
    badge VARCHAR(50),
    rating NUMERIC(3, 1) DEFAULT 4.8,
    rating_count INT DEFAULT 100,
    is_popular BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. STOCK SESSIONS TABLE (One record per business day)
CREATE TABLE public.stock_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_date VARCHAR(20) UNIQUE NOT NULL, -- Format YYYY-MM-DD
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed')),
    published_at TIMESTAMPTZ,
    published_by VARCHAR(255),
    total_published INT DEFAULT 0,
    total_sold INT DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. DAILY INVENTORY TABLE (Relational Product Rows per Stock Session)
CREATE TABLE public.daily_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stock_session_id UUID REFERENCES public.stock_sessions(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    published_quantity INT NOT NULL DEFAULT 0 CHECK (published_quantity >= 0),
    sold_quantity INT NOT NULL DEFAULT 0 CHECK (sold_quantity >= 0),
    reserved_quantity INT NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
    low_stock_threshold INT NOT NULL DEFAULT 5,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_session_product UNIQUE (stock_session_id, product_id)
);

-- 7. ORDERS TABLE (Master Order Record)
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_number VARCHAR(30) UNIQUE, -- Prominent Unique Format e.g. BCA-0879
    customer_name VARCHAR(255) NOT NULL,
    customer_mobile VARCHAR(20) NOT NULL,
    customer_email VARCHAR(255),
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 50.00), -- Minimum ₹50 rule
    tax_amount NUMERIC(10, 2) DEFAULT 0.00,
    total_amount NUMERIC(10, 2) NOT NULL,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'created' CHECK (payment_status IN ('created', 'pending', 'paid', 'failed', 'expired', 'refunded')),
    order_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (order_status IN ('pending', 'confirmed', 'cancelled', 'expired')),
    pickup_status VARCHAR(20) NOT NULL DEFAULT 'confirmed' CHECK (pickup_status IN ('confirmed', 'preparing', 'ready', 'picked_up')),
    payment_transaction_id VARCHAR(100),
    stock_session_id VARCHAR(100),
    reservation_expires_at TIMESTAMPTZ,
    pickup_timestamp TIMESTAMPTZ,
    picked_up_by_admin_id VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. ORDER ITEMS TABLE (Relational Child Rows per Order)
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT,
    product_name VARCHAR(255) NOT NULL,
    brand_name VARCHAR(100) NOT NULL,
    brand_id VARCHAR(50) NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    total_price NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. PAYMENTS TABLE (Audit Ledger of Online Transactions)
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    token_number VARCHAR(30),
    gateway VARCHAR(50) DEFAULT 'razorpay',
    razorpay_payment_id VARCHAR(100),
    amount NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    status VARCHAR(20) NOT NULL DEFAULT 'paid',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. BANNERS TABLE (Promotional Hero Sliders)
CREATE TABLE public.banners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(255),
    description TEXT,
    brand_slug VARCHAR(50) DEFAULT 'all',
    image VARCHAR(500) NOT NULL,
    bg_gradient VARCHAR(255),
    cta_text VARCHAR(50) DEFAULT 'Shop Now',
    cta_link VARCHAR(255) DEFAULT '/',
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. STORE SETTINGS TABLE (Singleton)
CREATE TABLE public.store_settings (
    id INT PRIMARY KEY DEFAULT 1,
    shop_name VARCHAR(255) NOT NULL DEFAULT 'BCA Ice Cream Wala',
    tagline VARCHAR(255) NOT NULL DEFAULT 'Your Favourite Ice Cream, Picked Up Fresh!',
    phone VARCHAR(30) DEFAULT '+91 98765 43210',
    email VARCHAR(255) DEFAULT 'orders@bcaicecreamwala.com',
    address TEXT NOT NULL DEFAULT 'Shop No. 4, College Road, Near BCA Complex, Main Market',
    google_maps_url TEXT,
    pickup_instructions TEXT NOT NULL DEFAULT 'Your order will be available for collection at BCA Ice Cream Wala. Please show your order token (e.g. BCA-0879) at the shop.',
    opening_time VARCHAR(10) NOT NULL DEFAULT '12:00',
    closing_time VARCHAR(10) NOT NULL DEFAULT '18:00',
    timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Kolkata',
    min_order_value NUMERIC(10, 2) NOT NULL DEFAULT 50.00,
    reservation_timeout_minutes INT NOT NULL DEFAULT 10,
    low_stock_threshold INT NOT NULL DEFAULT 5,
    razorpay_key_id VARCHAR(100) DEFAULT 'rzp_test_BcaIceCreamWalaKey',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT single_store_settings CHECK (id = 1)
);

-- 12. TOKEN SEQUENCE (Starts at 879 -> BCA-0879)
CREATE SEQUENCE IF NOT EXISTS public.bca_token_seq START WITH 879 INCREMENT BY 1;

CREATE OR REPLACE FUNCTION generate_bca_token()
RETURNS TEXT AS $$
DECLARE
    next_val BIGINT;
BEGIN
    next_val := nextval('public.bca_token_seq');
    RETURN 'BCA-' || LPAD(next_val::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 13. COMPLETE ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select on brands" ON public.brands;
DROP POLICY IF EXISTS "Allow public all on brands" ON public.brands;
CREATE POLICY "Allow public select on brands" ON public.brands FOR SELECT USING (true);
CREATE POLICY "Allow public all on brands" ON public.brands FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public select on products" ON public.products;
DROP POLICY IF EXISTS "Allow public all on products" ON public.products;
CREATE POLICY "Allow public select on products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow public all on products" ON public.products FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public select on stock_sessions" ON public.stock_sessions;
DROP POLICY IF EXISTS "Allow public all on stock_sessions" ON public.stock_sessions;
CREATE POLICY "Allow public select on stock_sessions" ON public.stock_sessions FOR SELECT USING (true);
CREATE POLICY "Allow public all on stock_sessions" ON public.stock_sessions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public select on daily_inventory" ON public.daily_inventory;
DROP POLICY IF EXISTS "Allow public all on daily_inventory" ON public.daily_inventory;
CREATE POLICY "Allow public select on daily_inventory" ON public.daily_inventory FOR SELECT USING (true);
CREATE POLICY "Allow public all on daily_inventory" ON public.daily_inventory FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public insert on orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public select on orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public update on orders" ON public.orders;
CREATE POLICY "Allow public insert on orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select on orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Allow public update on orders" ON public.orders FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public insert on order_items" ON public.order_items;
DROP POLICY IF EXISTS "Allow public select on order_items" ON public.order_items;
CREATE POLICY "Allow public insert on order_items" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select on order_items" ON public.order_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert on payments" ON public.payments;
DROP POLICY IF EXISTS "Allow public select on payments" ON public.payments;
CREATE POLICY "Allow public insert on payments" ON public.payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select on payments" ON public.payments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public select on banners" ON public.banners;
DROP POLICY IF EXISTS "Allow public all on banners" ON public.banners;
CREATE POLICY "Allow public select on banners" ON public.banners FOR SELECT USING (true);
CREATE POLICY "Allow public all on banners" ON public.banners FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public select on store_settings" ON public.store_settings;
DROP POLICY IF EXISTS "Allow public all on store_settings" ON public.store_settings;
CREATE POLICY "Allow public select on store_settings" ON public.store_settings FOR SELECT USING (true);
CREATE POLICY "Allow public all on store_settings" ON public.store_settings FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- 14. SEED DATA INSERTION (WITH ON CONFLICT DO UPDATE)
-- ==============================================================================

-- Seed 5 Brands
INSERT INTO public.brands (id, slug, name, tagline, logo, color, display_order)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'The Taste of India', '/brands/amul.jpg', '#D62828', 1),
    ('a0000000-0000-0000-0000-000000000002', 'havmor', 'Havmor', 'Goodness That Melt Your Heart', '/brands/havmor.png', '#E63946', 2),
    ('a0000000-0000-0000-0000-000000000003', 'cream-bell', 'Cream Bell', 'Pure Delicious Indulgence', '/brands/cream-bell.png', '#0077B6', 3),
    ('a0000000-0000-0000-0000-000000000004', 'mother-dairy', 'Mother Dairy', 'Happy Food, Happy People', '/brands/mother-dairy.jpg', '#0284C7', 4),
    ('a0000000-0000-0000-0000-000000000005', 'vadilal', 'Vadilal', 'The Ice Cream of Happiness', '/brands/vadilal.png', '#DC2626', 5)
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name, 
    logo = EXCLUDED.logo,
    tagline = EXCLUDED.tagline,
    color = EXCLUDED.color,
    display_order = EXCLUDED.display_order;

-- Seed All 97 Products (Omit hardcoded 'id' so uuid_generate_v4() generates unique UUIDs without collision)
INSERT INTO public.products (brand_id, brand_slug, brand_name, name, slug, category, description, price, volume, image, badge, rating, rating_count, is_popular, display_order)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Butterscotch', 'p-amul-tricone-butterscotch', 'Cones', 'Official Amul Butterscotch (100ml, 120ml) crafted with pure dairy milk and finest ingredients from Amul.', 45, '100ml, 120ml', 'https://assets.amul.com/public/productImage/Butter-Scotch-Tricone-120mL-fop.png', 'POPULAR', 4.7, 150, true, 1),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Choco Crunch', 'p-amul-tricone-choco-crunch', 'Cones', 'Official Amul Choco Crunch (100ml, 120ml) crafted with pure dairy milk and finest ingredients from Amul.', 45, '100ml, 120ml', 'https://assets.amul.com/public/productImage/Choco-Crunch-Tricone-120mL-fop.png', 'POPULAR', 4.8, 167, false, 2),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Choco Crunch Delight', 'p-amul-tricone-choco-crunch-delight', 'Cones', 'Official Amul Choco Crunch Delight (120ml) crafted with pure dairy milk and finest ingredients from Amul.', 45, '120ml', 'https://assets.amul.com/public/productImage/Choco-Crunch-Delight-Tricone-120mL-fop.png', 'POPULAR', 4.9, 184, false, 3),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Jumbo Choco Brownie', 'p-amul-tricone-jumbo-choco-brownie', 'Cones', 'Official Amul Jumbo Choco Brownie (150ml) crafted with pure dairy milk and finest ingredients from Amul.', 45, '150ml', 'https://assets.amul.com/public/productImage/Choco-Brownie-Jumbo-Tricone-150mL-fop.png', 'POPULAR', 4.7, 201, false, 4),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Double Chocolate', 'p-amul-tricone-double-chocolate', 'Cones', 'Official Amul Double Chocolate (120ml) crafted with pure dairy milk and finest ingredients from Amul.', 45, '120ml', 'https://assets.amul.com/public/productImage/Double-Chocolate-Tricone-120mL-fop.png', 'POPULAR', 4.8, 218, true, 5),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Choco Vanilla', 'p-amul-tricone-choco-vanilla', 'Cones', 'Official Amul Choco Vanilla (100ml, 120ml, 40ml, 70ml) crafted with pure dairy milk and finest ingredients from Amul.', 45, '100ml, 120ml, 40ml, 70ml', 'https://assets.amul.com/public/productImage/Choco-Vanilla-Tricone-120mL-fop.png', NULL, 4.9, 235, false, 6),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Dark Chocolate', 'p-amul-tricone-dark-chocolate', 'Cones', 'Official Amul Dark Chocolate (120ml) crafted with pure dairy milk and finest ingredients from Amul.', 45, '120ml', 'https://assets.amul.com/public/productImage/Dark-Chocolate-Tricone-120mL-fop.png', NULL, 4.7, 252, false, 7),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Belgian Chocolate', 'p-amul-tricone-belgian-chocolate', 'Cones', 'Official Amul Belgian Chocolate (120ml) crafted with pure dairy milk and finest ingredients from Amul.', 45, '120ml', 'https://assets.amul.com/public/productImage/Belgian_Chocolate_Cone_120mL-fop.png', NULL, 4.8, 269, false, 8),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Bitter Chocolate', 'p-amul-tricone-bitter-chocolate', 'Cones', 'Official Amul Bitter Chocolate (100ml) crafted with pure dairy milk and finest ingredients from Amul.', 45, '100ml', 'https://assets.amul.com/public/productImage/Amul-Bitter-Chocolate-Tricone-100mL-fop.png', NULL, 4.9, 286, true, 9),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Cookie Crunch Delight', 'p-amul-tricone-cookie-crunch-delight', 'Cones', 'Official Amul Cookie Crunch Delight (120ml) crafted with pure dairy milk and finest ingredients from Amul.', 45, '120ml', 'https://assets.amul.com/public/productImage/Cookie-Crunch-Delight-Tricone-120mL-fop.png', NULL, 4.7, 303, false, 10),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Black Currant', 'p-amul-tricone-black-currant', 'Cones', 'Official Amul Black Currant (120ml) crafted with pure dairy milk and finest ingredients from Amul.', 45, '120ml', 'https://assets.amul.com/public/productImage/Black-Currant-Tricone-120mL-fop.png', NULL, 4.8, 320, false, 11),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Two in one (Vanilla & Strawberry)', 'p-amul-tricone-two-in-one-vanilla-strawberry', 'Cones', 'Official Amul Two in one (Vanilla & Strawberry) (120ml) crafted with pure dairy milk and finest ingredients from Amul.', 45, '120ml', 'https://assets.amul.com/public/productImage/Two-in-One-Tricone-120mL-fop.png', NULL, 4.9, 337, false, 12),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Kesar Pista', 'p-amul-tricone-kesar-pista', 'Cones', 'Official Amul Kesar Pista (120ml) crafted with pure dairy milk and finest ingredients from Amul.', 45, '120ml', 'https://assets.amul.com/public/productImage/Kesar-Pista-Tricone-120mL-fop.png', NULL, 4.7, 354, true, 13),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Red Velvet', 'p-amul-tricone-red-velvet', 'Cones', 'Official Amul Red Velvet (120ml) crafted with pure dairy milk and finest ingredients from Amul.', 45, '120ml', 'https://assets.amul.com/public/productImage/02_FoP_Amul_Red_Velvet_Tricone_120mL.png', NULL, 4.8, 371, false, 14),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Chocolate Gold', 'p-amul-tricone-chocolate-gold', 'Cones', 'Official Amul Chocolate Gold (120ml) crafted with pure dairy milk and finest ingredients from Amul.', 45, '120ml', 'https://assets.amul.com/public/productImage/GC_Amul_Chocolate_Gold_Tri_Cone_MERGED.png', 'POPULAR', 4.9, 388, false, 15),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Vanilla Royale', 'p-amul-tubs-vanilla-royale', 'Family Tubs', 'Official Amul Vanilla Royale (500ml, 4l) crafted with pure dairy milk and finest ingredients from Amul.', 240, '500ml, 4l', 'https://assets.amul.com/public/productImage/02 FoP_Amul Ice Cream Vanilla Royale 500mL.png', NULL, 4.7, 405, false, 16),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Vanilla Magic', 'p-amul-tubs-vanilla-magic', 'Family Tubs', 'Official Amul Vanilla Magic (1l) crafted with pure dairy milk and finest ingredients from Amul.', 240, '1l', 'https://assets.amul.com/public/productImage/02 FoP_Amul Ice Cream Vanilla Magic 1L.png', NULL, 4.8, 422, true, 17),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Choco Chip', 'p-amul-tubs-choco-chip', 'Family Tubs', 'Official Amul Choco Chip (500ml, 1l) crafted with pure dairy milk and finest ingredients from Amul.', 240, '500ml, 1l', 'https://assets.amul.com/public/productImage/02 FoP_Amul Ice Cream Chocochips 1L.png', NULL, 4.9, 439, false, 18),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Choco Crackle', 'p-amul-tubs-choco-crackle', 'Family Tubs', 'Official Amul Choco Crackle (1l) crafted with pure dairy milk and finest ingredients from Amul.', 240, '1l', 'https://assets.amul.com/public/productImage/02 FoP_Amul Ice Cream Choco Crackle 1L.png', NULL, 4.7, 456, false, 19),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Chocolate Brownie', 'p-amul-tubs-chocolate-brownie', 'Family Tubs', 'Official Amul Chocolate Brownie (500ml, 1l) crafted with pure dairy milk and finest ingredients from Amul.', 240, '500ml, 1l', 'https://assets.amul.com/public/productImage/02 FoP_Amul Ice Cream Chocolate Brownie 1L.png', NULL, 4.8, 473, false, 20),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Choco Maltino', 'p-amul-tubs-choco-maltino', 'Family Tubs', 'Official Amul Choco Maltino (1l) crafted with pure dairy milk and finest ingredients from Amul.', 240, '1l', 'https://assets.amul.com/public/productImage/02 FoP_Amul Ice Cream Choco Maltino 1L.png', NULL, 4.9, 490, true, 21),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Butterscotch Bliss', 'p-amul-tubs-butterscotch-bliss', 'Family Tubs', 'Official Amul Butterscotch Bliss (500ml. 1l, 4l) crafted with pure dairy milk and finest ingredients from Amul.', 240, '500ml. 1l, 4l', 'https://assets.amul.com/public/productImage/02 FoP_Amul Ice Cream Butterscotch Bliss 1L.png', NULL, 4.7, 157, false, 22),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul King Alphonso', 'p-amul-tubs-king-alphonso', 'Family Tubs', 'Official Amul King Alphonso (500ml, 1l) crafted with pure dairy milk and finest ingredients from Amul.', 240, '500ml, 1l', 'https://assets.amul.com/public/productImage/02 FoP_Amul Ice Cream King Alphonso 1L.png', NULL, 4.8, 174, false, 23),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Vanilla Royale', 'p-amul-cups-vanilla-royale', 'Cups', 'Official Amul Vanilla Royale (125ml, 100ml, 55ml) crafted with pure dairy milk and finest ingredients from Amul.', 35, '125ml, 100ml, 55ml', 'https://assets.amul.com/public/productImage/02 FoP_Amul Ice Cream Vanilla Royale 125ml.png', NULL, 4.9, 191, false, 24),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Chocolate', 'p-amul-cups-chocolate', 'Cups', 'Official Amul Chocolate (100ml) crafted with pure dairy milk and finest ingredients from Amul.', 35, '100ml', 'https://assets.amul.com/public/productImage/03 ToP_Amul Chocolate Cup 100mL (1).png', NULL, 4.7, 208, true, 25),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Butterscotch Bliss', 'p-amul-cups-butterscotch-bliss', 'Cups', 'Official Amul Butterscotch Bliss (125ml, 100ml) crafted with pure dairy milk and finest ingredients from Amul.', 35, '125ml, 100ml', 'https://assets.amul.com/public/productImage/02 FoP_Amul Ice Cream Butterscotch Bliss 125ml.png', NULL, 4.8, 225, false, 26),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Butterscotch', 'p-amul-cups-butterscotch', 'Cups', 'Official Amul Butterscotch (100ml) crafted with pure dairy milk and finest ingredients from Amul.', 35, '100ml', 'https://assets.amul.com/public/productImage/03 ToP_Amul Butterscotch Cup 100mL (1).png', NULL, 4.9, 242, false, 27),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Chocolate Brownie', 'p-amul-cups-chocolate-brownie', 'Cups', 'Official Amul Chocolate Brownie (125ml) crafted with pure dairy milk and finest ingredients from Amul.', 35, '125ml', 'https://assets.amul.com/public/productImage/02 FoP_Amul Ice Cream Chocolate Brownie 125ml.png', NULL, 4.7, 259, false, 28),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Creme Rich Almond Fudge', 'p-amul-cups-creme-rich-almond-fudge', 'Cups', 'Official Amul Creme Rich Almond Fudge (125ml) crafted with pure dairy milk and finest ingredients from Amul.', 35, '125ml', 'https://assets.amul.com/public/productImage/02 FoP_Amul Creme Rich Almond Fudge 125ml.png', NULL, 4.8, 276, true, 29),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Creme Rich Caramel', 'p-amul-cups-creme-rich-caramel', 'Cups', 'Official Amul Creme Rich Caramel (125ml) crafted with pure dairy milk and finest ingredients from Amul.', 35, '125ml', 'https://assets.amul.com/public/productImage/02 FoP_Amul Creme Rich Caramel 125ml.png', NULL, 4.9, 293, false, 30),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Shahi Anjir', 'p-amul-cups-shahi-anjir', 'Cups', 'Official Amul Shahi Anjir (125 ml) crafted with pure dairy milk and finest ingredients from Amul.', 35, '125 ml', 'https://assets.amul.com/public/productImage/02 FoP_Amul Shahi Anjir 125ml.png', NULL, 4.7, 310, false, 31),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Badshahi Kulfi', 'p-amul-kulfi-badshahi-kulfi', 'Kulfi & Specialties', 'Official Amul Badshahi Kulfi (60ml) crafted with pure dairy milk and finest ingredients from Amul.', 30, '60ml', 'https://assets.amul.com/public/productImage/Badshahi-Kulfi-Elements-fop.png', 'POPULAR', 4.8, 327, false, 32),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Bombay Kulfi', 'p-amul-kulfi-bombay-kulfi', 'Kulfi & Specialties', 'Official Amul Bombay Kulfi (60ml) crafted with pure dairy milk and finest ingredients from Amul.', 30, '60ml', 'https://assets.amul.com/public/productImage/Bombay-kulfi-fop.png', NULL, 4.9, 344, true, 33),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Gold Punjabi Kulfi', 'p-amul-kulfi-gold-punjabi-kulfi', 'Kulfi & Specialties', 'Official Amul Gold Punjabi Kulfi (60ml) crafted with pure dairy milk and finest ingredients from Amul.', 30, '60ml', 'https://assets.amul.com/public/productImage/Punjabi-Kulfi-Gold-60mL-fop.png', 'POPULAR', 4.7, 361, false, 34),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Kaju Malai Kulfi', 'p-amul-kulfi-kaju-malai-kulfi', 'Kulfi & Specialties', 'Official Amul Kaju Malai Kulfi (60ml) crafted with pure dairy milk and finest ingredients from Amul.', 30, '60ml', 'https://assets.amul.com/public/productImage/Kaju-malai-kulfi-fop.png', NULL, 4.8, 378, false, 35),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Kashmiri Kulfi', 'p-amul-kulfi-kashmiri-kulfi', 'Kulfi & Specialties', 'Official Amul Kashmiri Kulfi (60ml) crafted with pure dairy milk and finest ingredients from Amul.', 30, '60ml', 'https://assets.amul.com/public/productImage/Kashmiri-Kulfi-fop.png', NULL, 4.9, 395, false, 36),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Sugarfree Punjabi Kulfi', 'p-amul-kulfi-sugarfree-punjabi-kulfi', 'Kulfi & Specialties', 'Official Amul Sugarfree Punjabi Kulfi (60ml) crafted with pure dairy milk and finest ingredients from Amul.', 30, '60ml', 'https://assets.amul.com/public/productImage/Sugar-free-Punjabi-Kulfi-60mL-fop.png', NULL, 4.7, 412, true, 37),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Rajasthani Kulfi', 'p-amul-kulfi-rajasthani-kulfi', 'Kulfi & Specialties', 'Official Amul Rajasthani Kulfi (60ml) crafted with pure dairy milk and finest ingredients from Amul.', 30, '60ml', 'https://assets.amul.com/public/productImage/Rajasthani-Kulfi-fop.png', NULL, 4.8, 429, false, 38),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Khoa Kulfi', 'p-amul-kulfi-khoa-kulfi', 'Kulfi & Specialties', 'Official Amul Khoa Kulfi (60ml) crafted with pure dairy milk and finest ingredients from Amul.', 30, '60ml', 'https://assets.amul.com/public/productImage/Khoa-Kulfi-60mL-fop.png', NULL, 4.9, 446, false, 39),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Shahi Badam Kulfi', 'p-amul-kulfi-shahi-badam-kulfi', 'Kulfi & Specialties', 'Official Amul Shahi Badam Kulfi (60ml) crafted with pure dairy milk and finest ingredients from Amul.', 30, '60ml', 'https://assets.amul.com/public/productImage/Shahi-Badam-Kulfi-60mL-fop.png', NULL, 4.7, 463, false, 40),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Mawa Malai Kulfi', 'p-amul-kulfi-mawa-malai-kulfi', 'Kulfi & Specialties', 'Official Amul Mawa Malai Kulfi (60ml) crafted with pure dairy milk and finest ingredients from Amul.', 30, '60ml', 'https://assets.amul.com/public/productImage/Mawa-Malai-Kulfi-60mL-fop.png', NULL, 4.8, 480, true, 41),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Pista Malai Kulfi', 'p-amul-kulfi-pista-malai-kulfi', 'Kulfi & Specialties', 'Official Amul Pista Malai Kulfi (60ml) crafted with pure dairy milk and finest ingredients from Amul.', 30, '60ml', 'https://assets.amul.com/public/productImage/Pista-Malai-Kulfi-60mL-fop.png', NULL, 4.9, 497, false, 42),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Rajbhog Kulfi', 'p-amul-kulfi-rajbhog-kulfi', 'Kulfi & Specialties', 'Official Amul Rajbhog Kulfi (60ml) crafted with pure dairy milk and finest ingredients from Amul.', 30, '60ml', 'https://assets.amul.com/public/productImage/Rajbhog-Kulfi-60mL-fop.png', NULL, 4.7, 164, false, 43),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Aamras Kulfi', 'p-amul-kulfi-aamras-kulfi', 'Kulfi & Specialties', 'Official Amul Aamras Kulfi (60ml) crafted with pure dairy milk and finest ingredients from Amul.', 30, '60ml', 'https://assets.amul.com/public/productImage/Aamras-Kulfi-60mL-fop.png', NULL, 4.8, 181, false, 44),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Rosogulla Kulfi', 'p-amul-kulfi-rosogulla-kulfi', 'Kulfi & Specialties', 'Official Amul Rosogulla Kulfi (60mL) crafted with pure dairy milk and finest ingredients from Amul.', 30, '60mL', 'https://assets.amul.com/public/productImage/Rosogulla-Kulfi-60mL-fop.png', NULL, 4.9, 198, true, 45),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Punjabi Kulfi Mawa Elaichi', 'p-amul-kulfi-punjabi-kulfi-mawa-elaichi', 'Kulfi & Specialties', 'Official Amul Punjabi Kulfi Mawa Elaichi (60ml) crafted with pure dairy milk and finest ingredients from Amul.', 30, '60ml', 'https://assets.amul.com/public/productImage/Punjabi-Kulfi-Mawa-Elaichi-60mL-fop.png', NULL, 4.7, 215, false, 46),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Rabdi Kulfi', 'p-amul-kulfi-rabdi-kulfi', 'Kulfi & Specialties', 'Official Amul Rabdi Kulfi (45ml) crafted with pure dairy milk and finest ingredients from Amul.', 30, '45ml', 'https://assets.amul.com/public/productImage/Rabdi-Kulfi-fop.png', NULL, 4.8, 232, false, 47),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Mast Kulfi Kesar Kammal', 'p-amul-kulfi-mast-kulfi-kesar-kammal', 'Kulfi & Specialties', 'Official Amul Mast Kulfi Kesar Kammal (40ml) crafted with pure dairy milk and finest ingredients from Amul.', 30, '40ml', 'https://assets.amul.com/public/productImage/Mast-Kulfi-Kesar-Kammal-fop.png', NULL, 4.9, 249, false, 48),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Mast Pista Dhamaal Kulfi', 'p-amul-kulfi-mast-pista-dhamaal-kulfi', 'Kulfi & Specialties', 'Official Amul Mast Pista Dhamaal Kulfi (40ml) crafted with pure dairy milk and finest ingredients from Amul.', 30, '40ml', 'https://assets.amul.com/public/productImage/Mast-Pista-Dhamaal-fop.png', NULL, 4.7, 266, true, 49),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Rajwadi Kulfi', 'p-amul-kulfi-rajwadi-kulfi', 'Kulfi & Specialties', 'Official Amul Rajwadi Kulfi (40ml) crafted with pure dairy milk and finest ingredients from Amul.', 30, '40ml', 'https://assets.amul.com/public/productImage/Rajwadi-Kulfi-40mL-fop.png', NULL, 4.8, 283, false, 50),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Mast Khoa Kulfi', 'p-amul-kulfi-mast-khoa-kulfi', 'Kulfi & Specialties', 'Official Amul Mast Khoa Kulfi (65ml) crafted with pure dairy milk and finest ingredients from Amul.', 30, '65ml', 'https://assets.amul.com/public/productImage/Mast-Khoa-Kulfi-fop.png', NULL, 4.9, 300, false, 51),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Malai Kulfi', 'p-amul-kulfi-malai-kulfi', 'Kulfi & Specialties', 'Official Amul Malai Kulfi (30ml) crafted with pure dairy milk and finest ingredients from Amul.', 30, '30ml', 'https://assets.amul.com/public/productImage/Amul-Malai-Kulfi-30mL-fop.png', NULL, 4.7, 317, false, 52),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Matka Kulfi', 'p-amul-kulfi-matka-kulfi', 'Kulfi & Specialties', 'Official Amul Matka Kulfi (100ml) crafted with pure dairy milk and finest ingredients from Amul.', 30, '100ml', 'https://assets.amul.com/public/productImage/Amul-Matka-Kulfi-100mL-fop.png', NULL, 4.8, 334, true, 53),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Kulhad Kulfi', 'p-amul-kulfi-kulhad-kulfi', 'Kulfi & Specialties', 'Official Amul Kulhad Kulfi (100ml) crafted with pure dairy milk and finest ingredients from Amul.', 30, '100ml', 'https://assets.amul.com/public/productImage/Amul-Kulhad-Kulfi-100mL-fop.png', NULL, 4.9, 351, false, 54),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Shahi Kulfi Rajbhog Single Pack', 'p-amul-kulfi-shahi-kulfi-rajbhog-single-pack', 'Kulfi & Specialties', 'Official Amul Shahi Kulfi Rajbhog Single Pack (100mL) crafted with pure dairy milk and finest ingredients from Amul.', 30, '100mL', 'https://assets.amul.com/public/productImage/02_FoP_Amul_Shahi_Kulfi_Rajbhog_100mL.png', NULL, 4.7, 368, false, 55),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Shahi Kulfi Falooda', 'p-amul-kulfi-shahi-kulfi-falooda', 'Kulfi & Specialties', 'Official Amul Shahi Kulfi Falooda (100mL) crafted with pure dairy milk and finest ingredients from Amul.', 30, '100mL', 'https://assets.amul.com/public/productImage/02_FoP_Amul_Shahi_Kulfi_Falooda_100mL.png', NULL, 4.8, 385, false, 56),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Shahi Kulfi Kesar Pista Single Pack', 'p-amul-kulfi-shahi-kulfi-kesar-pista-single-pack', 'Kulfi & Specialties', 'Official Amul Shahi Kulfi Kesar Pista Single Pack (100mL) crafted with pure dairy milk and finest ingredients from Amul.', 30, '100mL', 'https://assets.amul.com/public/productImage/02_FoP_Amul_Shahi_Kulfi_Kesar_Pista_100mL.png', NULL, 4.9, 402, true, 57),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Shahi Kulfi Pista (Matka)', 'p-amul-kulfi-shahi-kulfi-pista-matka', 'Kulfi & Specialties', 'Official Amul Shahi Kulfi Pista (Matka) (100mL) crafted with pure dairy milk and finest ingredients from Amul.', 30, '100mL', 'https://assets.amul.com/public/productImage/02_FoP_Shahi_Kulfi_Pista_(Matka)_100_mL.jpg', NULL, 4.7, 419, false, 58),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Epic Almond Gold', 'p-amul-epic-range-epic-almond-gold', 'Bars & Sticks', 'Official Amul Epic Almond Gold (80mL) crafted with pure dairy milk and finest ingredients from Amul.', 40, '80mL', 'https://assets.amul.com/public/productImage/Epic-Gold-Almond-80mL-fop.png', 'POPULAR', 4.8, 436, false, 59),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Epic Choco Truffle', 'p-amul-epic-range-epic-choco-truffle', 'Bars & Sticks', 'Official Amul Epic Choco Truffle (80ml) crafted with pure dairy milk and finest ingredients from Amul.', 40, '80ml', 'https://assets.amul.com/public/productImage/Epic-Choco-Truffle-80mL-fop.png', NULL, 4.9, 453, false, 60),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Epic Sweetheart', 'p-amul-epic-range-epic-sweetheart', 'Bars & Sticks', 'Official Amul Epic Sweetheart (60ml) crafted with pure dairy milk and finest ingredients from Amul.', 40, '60ml', 'https://assets.amul.com/public/productImage/EPIC-SWEETHEART-60ml-fop.png', NULL, 4.7, 470, true, 61),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Epic Strawberry Twist', 'p-amul-epic-range-epic-strawberry-twist', 'Bars & Sticks', 'Official Amul Epic Strawberry Twist (80ml) crafted with pure dairy milk and finest ingredients from Amul.', 40, '80ml', 'https://assets.amul.com/public/productImage/Epic-Strawberry-Twist-Epic-80mL-fop.png', NULL, 4.8, 487, false, 62),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Epic Choco Almond', 'p-amul-epic-range-epic-choco-almond', 'Bars & Sticks', 'Official Amul Epic Choco Almond (80ml) crafted with pure dairy milk and finest ingredients from Amul.', 40, '80ml', 'https://assets.amul.com/public/productImage/Epic-Choco-Almond-80mL-fop.png', NULL, 4.9, 154, false, 63),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Strawberry Twist with Belgian Chocolate Gold', 'p-amul-epic-range-strawberry-twist-with-belgian-chocolate-gold', 'Bars & Sticks', 'Official Amul Strawberry Twist with Belgian Chocolate Gold (80ml) crafted with pure dairy milk and finest ingredients from Amul.', 40, '80ml', 'https://assets.amul.com/public/productImage/GC_Amul_Epic_Strawberry_Twist_Gold_Pouch_Front_MERGED.png', 'POPULAR', 4.7, 171, false, 64),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Asli Aam', 'p-amul-stick-asli-aam', 'Bars & Sticks', 'Official Amul Asli Aam (80ml) crafted with pure dairy milk and finest ingredients from Amul.', 40, '80ml', 'https://assets.amul.com/public/productImage/Asli-Aam-80mL-fop.png', NULL, 4.8, 188, true, 65),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Asli Aam Gold', 'p-amul-stick-asli-aam-gold', 'Bars & Sticks', 'Official Amul Asli Aam Gold (80ml) crafted with pure dairy milk and finest ingredients from Amul.', 40, '80ml', 'https://assets.amul.com/public/productImage/Asli-Aam-Gold-Pouch-80mL-fop.png', 'POPULAR', 4.9, 205, false, 66),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Mango Duetz', 'p-amul-stick-mango-duetz', 'Bars & Sticks', 'Official Amul Mango Duetz (60ml) crafted with pure dairy milk and finest ingredients from Amul.', 40, '60ml', 'https://assets.amul.com/public/productImage/Mango-Duetz-60-ml-fop.png', NULL, 4.7, 222, false, 67),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Mango Duetz Gold', 'p-amul-stick-mango-duetz-gold', 'Bars & Sticks', 'Official Amul Mango Duetz Gold (60ml) crafted with pure dairy milk and finest ingredients from Amul.', 40, '60ml', 'https://assets.amul.com/public/productImage/Gold-Mango-Duetz-fop.png', 'POPULAR', 4.8, 239, false, 68),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Khatta Meetha Mango Duetz', 'p-amul-stick-khatta-meetha-mango-duetz', 'Bars & Sticks', 'Official Amul Khatta Meetha Mango Duetz (60ml) crafted with pure dairy milk and finest ingredients from Amul.', 40, '60ml', 'https://assets.amul.com/public/productImage/KM-Mango-Duetz-fop.png', NULL, 4.9, 256, true, 69),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Raspberry Duetz', 'p-amul-stick-raspberry-duetz', 'Bars & Sticks', 'Official Amul Raspberry Duetz (60ml) crafted with pure dairy milk and finest ingredients from Amul.', 40, '60ml', 'https://assets.amul.com/public/productImage/Rasberry-Duetz-60ml-fop.png', NULL, 4.7, 273, false, 70),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Froot Lickz Mango', 'p-amul-stick-froot-lickz-mango', 'Bars & Sticks', 'Official Amul Froot Lickz Mango (60ml) crafted with pure dairy milk and finest ingredients from Amul.', 40, '60ml', 'https://assets.amul.com/public/productImage/Froot-Lickz-Mango-60mL-fop.png', NULL, 4.8, 290, false, 71),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Froot Lickz Orange', 'p-amul-stick-froot-lickz-orange', 'Bars & Sticks', 'Official Amul Froot Lickz Orange (60ml) crafted with pure dairy milk and finest ingredients from Amul.', 40, '60ml', 'https://assets.amul.com/public/productImage/Froot-Lickz-Orange-60mL-fop.png', NULL, 4.9, 307, false, 72),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Ice Lickz Orange', 'p-amul-stick-ice-lickz-orange', 'Bars & Sticks', 'Official Amul Ice Lickz Orange (50ml) crafted with pure dairy milk and finest ingredients from Amul.', 40, '50ml', 'https://assets.amul.com/public/productImage/Ice-Lickz-Orange-Candy-50mL-fop.png', NULL, 4.7, 324, true, 73),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Probiotic Chocobar', 'p-amul-stick-probiotic-chocobar', 'Bars & Sticks', 'Official Amul Probiotic Chocobar (30ml, 60ml) crafted with pure dairy milk and finest ingredients from Amul.', 40, '30ml, 60ml', 'https://assets.amul.com/public/productImage/Chocobar-Probiotic-60ml-fop.png', NULL, 4.8, 341, false, 74),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Probiotic Chocopop', 'p-amul-stick-probiotic-chocopop', 'Bars & Sticks', 'Official Amul Probiotic Chocopop (18ml) crafted with pure dairy milk and finest ingredients from Amul.', 40, '18ml', 'https://assets.amul.com/public/productImage/Probiotic-Chocopop-18mL-fop.png', NULL, 4.9, 358, false, 75),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Dark Chocobar', 'p-amul-stick-dark-chocobar', 'Bars & Sticks', 'Official Amul Dark Chocobar (60 ml) crafted with pure dairy milk and finest ingredients from Amul.', 40, '60 ml', 'https://assets.amul.com/public/productImage/Chocobar-Dark-Chocolate-60mL-fop.png', NULL, 4.7, 375, false, 76),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Frostik', 'p-amul-stick-frostik', 'Bars & Sticks', 'Official Amul Frostik (70 ml) crafted with pure dairy milk and finest ingredients from Amul.', 40, '70 ml', 'https://assets.amul.com/public/productImage/Frostik-70mL-fop.png', NULL, 4.8, 392, true, 77),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Dark Frostik', 'p-amul-stick-dark-frostik', 'Bars & Sticks', 'Official Amul Dark Frostik (70ml) crafted with pure dairy milk and finest ingredients from Amul.', 40, '70ml', 'https://assets.amul.com/public/productImage/Frostik-Dark-Chocolate-70mL-fop.png', NULL, 4.9, 409, false, 78),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Coffee Bar', 'p-amul-stick-coffee-bar', 'Bars & Sticks', 'Official Amul Coffee Bar (60ml) crafted with pure dairy milk and finest ingredients from Amul.', 40, '60ml', 'https://assets.amul.com/public/productImage/Coffee-Bar-fop.png', NULL, 4.7, 426, false, 79),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Chocobar Probiotic Gold', 'p-amul-stick-chocobar-probiotic-gold', 'Bars & Sticks', 'Official Amul Chocobar Probiotic Gold (60ml) crafted with pure dairy milk and finest ingredients from Amul.', 40, '60ml', 'https://assets.amul.com/public/productImage/SP_Amul_Chocobar_Gold_60ml_Front.png', 'POPULAR', 4.8, 443, false, 80),
    ('a0000000-0000-0000-0000-000000000001', 'amul', 'Amul', 'Amul Frostik Gold', 'p-amul-stick-frostik-gold', 'Bars & Sticks', 'Official Amul Frostik Gold (70ml) crafted with pure dairy milk and finest ingredients from Amul.', 40, '70ml', 'https://assets.amul.com/public/productImage/SP_Amul_Frostik_Gold_Kulfi_Front.png', 'POPULAR', 4.9, 460, true, 81),
    -- Havmor
    ('a0000000-0000-0000-0000-000000000002', 'havmor', 'Havmor', 'Havmor Belgian Dark Chocolate', 'havmor-belgian-chocolate', 'Family Tubs', 'Ultra-luxurious Belgian cocoa blended with silky cream and dark chocolate curls.', 210, '700 ml', 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=600&q=80', 'BESTSELLER', 4.9, 520, true, 82),
    ('a0000000-0000-0000-0000-000000000002', 'havmor', 'Havmor', 'Havmor Black Forest Delight', 'havmor-black-forest', 'Family Tubs', 'German gateau style with chocolate swirls, sponge cake bits and cherry syrup.', 195, '700 ml', 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=600&q=80', 'POPULAR', 4.7, 180, true, 83),
    ('a0000000-0000-0000-0000-000000000002', 'havmor', 'Havmor', 'Havmor American Nuts', 'havmor-american-nuts', 'Cups', 'Pineapple, jelly cubes, raisins, almonds and cashews suspended in dairy cream.', 70, '150 ml', 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=600&q=80', NULL, 4.8, 310, true, 84),
    ('a0000000-0000-0000-0000-000000000002', 'havmor', 'Havmor', 'Havmor Chocolate Hazelnut Cone', 'havmor-chocolate-cone', 'Cones', 'Crispy waffle cone packed with chocolate hazelnut cream and crowned with peanuts.', 65, '120 ml', 'https://images.unsplash.com/photo-1549395156-e0c1fe6fc7a5?auto=format&fit=crop&w=600&q=80', 'SAVE 15%', 4.8, 290, true, 85),

    -- Cream Bell
    ('a0000000-0000-0000-0000-000000000003', 'cream-bell', 'Cream Bell', 'Cream Bell Butterscotch Crunch', 'cream-bell-butterscotch', 'Cups', 'Rich creamy butterscotch flavor loaded with crispy cashew nougats.', 50, '125 ml', 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=600&q=80', 'POPULAR', 4.6, 165, true, 86),
    ('a0000000-0000-0000-0000-000000000003', 'cream-bell', 'Cream Bell', 'Cream Bell Double Chocolate Fantasy', 'cream-bell-chocolate', 'Cups', 'Deep cocoa infused cream garnished with dark chocolate drizzle and cookies.', 55, '125 ml', 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?auto=format&fit=crop&w=600&q=80', NULL, 4.5, 140, false, 87),
    ('a0000000-0000-0000-0000-000000000003', 'cream-bell', 'Cream Bell', 'Cream Bell Wild Strawberry', 'cream-bell-strawberry', 'Cups', 'Sweet pink strawberry ice cream blended with natural fruit bits.', 45, '125 ml', 'https://images.unsplash.com/photo-1488900128323-21503983a07e?auto=format&fit=crop&w=600&q=80', NULL, 4.4, 110, false, 88),
    ('a0000000-0000-0000-0000-000000000003', 'cream-bell', 'Cream Bell', 'Cream Bell Maxx Vanilla Cone', 'cream-bell-vanilla-cone', 'Cones', 'Waffle cone brimming with rich vanilla cream and solid chocolate tip.', 60, '120 ml', 'https://images.unsplash.com/photo-1549395156-e0c1fe6fc7a5?auto=format&fit=crop&w=600&q=80', 'BESTSELLER', 4.7, 220, true, 89),

    -- Mother Dairy
    ('a0000000-0000-0000-0000-000000000004', 'mother-dairy', 'Mother Dairy', 'Mother Dairy Mango Dolly', 'mother-dairy-mango-dolly', 'Bars & Sticks', 'Iconic nostalgia - creamy milk stick encased in a chilled real mango ice shell.', 30, '75 ml', 'https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?auto=format&fit=crop&w=600&q=80', 'BESTSELLER', 4.9, 650, true, 90),
    ('a0000000-0000-0000-0000-000000000004', 'mother-dairy', 'Mother Dairy', 'Mother Dairy Classic Chocobar', 'mother-dairy-chocobar', 'Bars & Sticks', 'Thick crunchy chocolate shell snapping open into pure vanilla dairy cream.', 35, '70 ml', 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=600&q=80', 'POPULAR', 4.8, 480, true, 91),
    ('a0000000-0000-0000-0000-000000000004', 'mother-dairy', 'Mother Dairy', 'Mother Dairy Vanilla Cup', 'mother-dairy-vanilla-cup', 'Cups', 'Simple, pure and wholesome dairy goodness with subtle vanilla fragrance.', 25, '100 ml', 'https://images.unsplash.com/photo-1570197571499-166b36435e9f?auto=format&fit=crop&w=600&q=80', NULL, 4.5, 155, false, 92),
    ('a0000000-0000-0000-0000-000000000004', 'mother-dairy', 'Mother Dairy', 'Mother Dairy Rocket Choco Cone', 'mother-dairy-chocolate-cone', 'Cones', 'Crunchy cone loaded with chocolate fudge ice cream, chocolate chips and dip.', 60, '110 ml', 'https://images.unsplash.com/photo-1549395156-e0c1fe6fc7a5?auto=format&fit=crop&w=600&q=80', 'SAVE 15%', 4.7, 310, true, 93),

    -- Vadilal
    ('a0000000-0000-0000-0000-000000000005', 'vadilal', 'Vadilal', 'Vadilal Gourmet Choco Bar', 'vadilal-choco-bar', 'Bars & Sticks', 'Pure chocolate coating loaded with roasted almonds over velvety vanilla cream.', 45, '80 ml', 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=600&q=80', 'BESTSELLER', 4.8, 390, true, 94),
    ('a0000000-0000-0000-0000-000000000005', 'vadilal', 'Vadilal', 'Vadilal Cassata Slice', 'vadilal-cassata', 'Kulfi & Specialties', 'Layered trio of strawberry, vanilla and pistachio ice cream on moist sponge cake.', 75, '150 ml', 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=600&q=80', 'POPULAR', 4.9, 450, true, 95),
    ('a0000000-0000-0000-0000-000000000005', 'vadilal', 'Vadilal', 'Vadilal Royal Rajbhog', 'vadilal-rajbhog', 'Family Tubs', 'Enriched with saffron, green cardamom, almond chunks, pistachios and rasgulla.', 220, '700 ml', 'https://images.unsplash.com/photo-1580915411954-282cb1b0d780?auto=format&fit=crop&w=600&q=80', 'BESTSELLER', 4.9, 560, true, 96),
    ('a0000000-0000-0000-0000-000000000005', 'vadilal', 'Vadilal', 'Vadilal Kesar Pista Matka Kulfi', 'vadilal-kesar-pista', 'Kulfi & Specialties', 'Authentic clay pot matka kulfi infused with Kashmiri saffron and roasted pistachios.', 85, '150 ml', 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=600&q=80', NULL, 4.8, 340, true, 97)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    brand_id = EXCLUDED.brand_id,
    brand_slug = EXCLUDED.brand_slug,
    brand_name = EXCLUDED.brand_name,
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    volume = EXCLUDED.volume,
    image = EXCLUDED.image,
    badge = EXCLUDED.badge,
    rating = EXCLUDED.rating,
    rating_count = EXCLUDED.rating_count,
    is_popular = EXCLUDED.is_popular,
    display_order = EXCLUDED.display_order,
    updated_at = NOW();

-- Seed Banners
INSERT INTO public.banners (title, subtitle, description, brand_slug, image, bg_gradient, cta_text, cta_link, display_order)
VALUES
    ('Amul Special Collection', '100% Pure Dairy Real Milk', 'Taste the royal Badshahi Kulfi, Tricone & Chocolate Brownie tubs.', 'amul', 'https://images.unsplash.com/photo-1580915411954-282cb1b0d780?auto=format&fit=crop&w=1200&q=80', 'from-red-950 via-red-900 to-amber-900', 'Explore Amul', '/brand/amul', 1),
    ('Havmor Indulgence', 'Belgian Chocolate & Cones', 'Imported dark Belgian cocoa and crunchy waffle cones for chocolate lovers.', 'havmor', 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=1200&q=80', 'from-rose-950 via-red-950 to-orange-950', 'Explore Havmor', '/brand/havmor', 2),
    ('Cream Bell Specials', 'Butterscotch & Strawberry', 'Irresistible scoops packed with caramelized nuts and sweet summer strawberries.', 'cream-bell', 'https://images.unsplash.com/photo-1488900128323-21503983a07e?auto=format&fit=crop&w=1200&q=80', 'from-blue-950 via-indigo-950 to-sky-950', 'Explore Cream Bell', '/brand/cream-bell', 3),
    ('Mother Dairy Classics', 'Fresh Mango Dolly & Rocket', 'The golden goodness of real Alphonso mango stick & crunchy chocolate choco bars.', 'mother-dairy', 'https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?auto=format&fit=crop&w=1200&q=80', 'from-sky-950 via-blue-950 to-cyan-950', 'Explore Mother Dairy', '/brand/mother-dairy', 4),
    ('Vadilal Royal Treat', 'Cassata Slices & Rajbhog', 'Celebrate Indian heritage flavours with saffron strands, pistachios and sponge cassata.', 'vadilal', 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?auto=format&fit=crop&w=1200&q=80', 'from-amber-950 via-red-950 to-orange-950', 'Explore Vadilal', '/brand/vadilal', 5);

-- Seed Store Settings
INSERT INTO public.store_settings (id, shop_name, tagline, phone, email, address, google_maps_url, pickup_instructions, opening_time, closing_time, timezone, min_order_value, reservation_timeout_minutes, low_stock_threshold)
VALUES (
    1,
    'BCA Ice Cream Wala',
    'Your Favourite Ice Cream, Picked Up Fresh!',
    '+91 98765 43210',
    'orders@bcaicecreamwala.com',
    'Shop No. 4, College Road, Near BCA Complex, Main Market, Pin 380009',
    'https://maps.google.com/?q=BCA+Ice+Cream+Wala',
    'Your order will be available for collection at BCA Ice Cream Wala. Please show your unique order token (e.g. BCA-0879) at the shop counter.',
    '12:00',
    '18:00',
    'Asia/Kolkata',
    50.00,
    10,
    5
)
ON CONFLICT (id) DO UPDATE SET 
    shop_name = EXCLUDED.shop_name, 
    min_order_value = EXCLUDED.min_order_value,
    address = EXCLUDED.address;

-- Seed Today's Stock Session
INSERT INTO public.stock_sessions (id, session_date, status, published_at, published_by, total_published, total_sold, notes)
VALUES (
    'c0000000-0000-0000-0000-000000000001',
    to_char(NOW() AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD'),
    'published',
    NOW(),
    'Admin Store Manager',
    2910,
    0,
    'Daily stock published for all 81 Amul products + other brands'
)
ON CONFLICT (session_date) DO UPDATE SET
    status = EXCLUDED.status,
    total_published = EXCLUDED.total_published,
    notes = EXCLUDED.notes;

-- Seed Daily Inventory for ALL products in the catalogue
INSERT INTO public.daily_inventory (stock_session_id, product_id, published_quantity, sold_quantity, reserved_quantity, low_stock_threshold)
SELECT 
    'c0000000-0000-0000-0000-000000000001',
    p.id,
    30,
    0,
    0,
    5
FROM public.products p
ON CONFLICT (stock_session_id, product_id) DO UPDATE SET
    published_quantity = EXCLUDED.published_quantity,
    sold_quantity = EXCLUDED.sold_quantity,
    reserved_quantity = EXCLUDED.reserved_quantity;
