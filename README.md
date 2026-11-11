# 🍦 BCA Ice Cream Wala
> **Complete Full-Stack Ice Cream Ecommerce & Inventory Management Platform**
> *Shop Pickup Only • Online Payments • Daily Stock Sessions • Unique Token BCA-0879*

---

## 📌 1. Project Overview

**BCA Ice Cream Wala** is a production-grade, database-driven web application featuring:
1. **Customer Mobile-First Website**: Designed following the warm cream card layout in Reference Image 6, with full promotional banner sliders, 5 circular brand categories (Amul, Havmor, Cream Bell, Mother Dairy, Vadilal), dynamic product listings, search, interactive cart with ₹50 minimum order validation, Asian/Kolkata 12 PM - 6 PM time-gated ordering window, 10-minute atomic inventory hold, Razorpay online payment, and prominent unique pickup tokens (e.g. **`BCA-0879`**).
2. **Admin Management Portal (`/admin`)**: A full dashboard for the shop owner to control daily stock sessions across all 5 brands, manage products & brands, monitor live orders, verify customer pickup tokens with duplicate handoff prevention, inspect Razorpay transaction ledgers, and configure shop timings and pickup locations.

---

## ⚡ 2. Fixed Business Rules Enforced

| Business Requirement | Implementation Details |
|---|---|
| **Fulfilment** | **Shop Pickup Only**. No delivery address forms, delivery tracking, or delivery charges. |
| **Ordering Window** | **12:00 PM – 6:00 PM (Asia/Kolkata IST)**. Evaluated via trusted server logic. |
| **Stock Publishing Gate** | Ordering remains locked even after 12 PM if admin has not published today's stock session. |
| **Minimum Order** | **₹50**. Cart prevents checkout if total < ₹50 with dynamic deficit alert. |
| **Inventory Formula** | `Available Stock = Published - Sold - Active Reserved`. Prevents overselling. |
| **Checkout Reservation** | Items held for **10 minutes** during checkout. Auto-released if payment fails or expires. |
| **Payment Gateway** | **Online Only via Razorpay**. Signature verified server-side. |
| **Pickup Token** | Unique, sequential format: **`BCA-0879`**, **`BCA-0880`**, etc. Issued only after confirmed payment. |
| **Pickup Terminal** | Admin scans/verifies token, transitions status, and strictly **blocks duplicate collections**. |

---

## 🛠️ 3. Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, React Router DOM v7, Lucide React, Swiper, Canvas Confetti.
- **Backend & Database**: Supabase PostgreSQL, Row Level Security (RLS), plpgsql atomic functions & triggers.
- **Edge Functions**: Supabase Deno edge functions for Razorpay Orders API, HMAC signature verification, and webhooks.
- **Payments**: Razorpay Checkout SDK (live + high-fidelity dev test mode simulation).

---

## 🚀 4. Quick Start & Local Execution

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Run Automated Business Tests
```bash
npm test
```
Executes the test suite verifying:
- Token format `BCA-0879`
- ₹50 minimum order threshold
- Inventory calculation (`Published - Sold - Reserved`)
- Time window schedule (Asia/Kolkata 12 PM - 6 PM)
- Unpaid order prevention & duplicate pickup blocking
- 10-minute atomic reservation hold and release

### 4. Build for Production
```bash
npm run build
```

---

## 🔑 5. Accessing the Admin Panel

- Navigate to: `http://localhost:5173/admin` (or click "Admin Panel" in the header / profile page).
- **Default Admin Password**: `admin123` or `bca123`.

### Key Admin Modules:
1. **Dashboard** (`/admin`): Real-time KPIs (Today's Orders, Revenue, Sold, Remaining, Pending Pickups, Completed Pickups).
2. **Daily Stock Session** (`/admin/stock`): Update published stock across all 5 brands before 12 PM, save drafts, publish session.
3. **Token Verification Station** (`/admin/verify-token`): Search tokens like `BCA-0879`, review ordered ice creams, transition status (`Confirmed` -> `Preparing` -> `Ready` -> `Picked Up`), prevent duplicate collection.
4. **Orders Management** (`/admin/orders`): Searchable table with filters by date, brand, payment, and pickup status.
5. **Product Catalogue** (`/admin/products`): Add, edit, archive products, set prices and popularity tags.
6. **Brand Management** (`/admin/brands`): Configure Amul, Havmor, Cream Bell, Mother Dairy, Vadilal logos and taglines.
7. **Payments Ledger** (`/admin/payments`): Transaction IDs, amounts, gateway status.
8. **Promotional Banners** (`/admin/banners`): Manage the top hero slider.
9. **Shop Settings** (`/admin/settings`): Configure shop name, pickup address, Google Maps URL, opening/closing hours.

---

## 🗄️ 6. Database Setup (Supabase)

To link to a live Supabase project:
1. Create a Supabase project at [https://supabase.com](https://supabase.com).
2. Run the SQL script located at `supabase/schema.sql` in the Supabase SQL Editor. It sets up all tables, RLS policies, sequences, and stored procedures:
   - `reserve_inventory_for_order`
   - `confirm_order_payment`
   - `release_expired_reservations`
   - `verify_and_complete_pickup`
3. Copy `.env.example` to `.env` and fill in:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_RAZORPAY_KEY_ID=your_razorpay_key
   ```
4. Deploy Supabase Edge Functions:
   ```bash
   supabase functions deploy create-razorpay-order
   supabase functions deploy verify-razorpay-payment
   supabase functions deploy razorpay-webhook
   ```

---

## 📱 7. Customer Experience Walkthrough

1. **Browse Flavours**: Open homepage, browse the 5 official brand collections, or use the instant search bar.
2. **Order Hours Indicator**: Top banner indicates current Asia/Kolkata status. (Includes a handy "Test Clock" switcher for testing at any hour).
3. **Add to Cart**: Real-time stock badge warns if low stock or out of stock.
4. **Pickup Cart**: Verifies minimum order is ₹50; shows transparent subtotal and shop counter location.
5. **Checkout & Hold**: Enters customer name and 10-digit mobile number. Inventory is reserved with a 10-minute hold timer.
6. **Online Payment**: Completes payment through Razorpay.
7. **Order Confirmation**: Displays celebration confetti and prominent pickup token **`BCA-0879`** with shop map directions.
8. **Shop Pickup**: Customer presents `BCA-0879` at the counter; shop manager verifies and dispenses the fresh ice creams.
