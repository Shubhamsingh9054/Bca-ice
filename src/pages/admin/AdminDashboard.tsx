import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  IndianRupee,
  Package,
  Boxes,
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useStore } from '../../context/StoreContext';
import { formatINR, formatKolkataDateTime } from '../../lib/utils';

export const AdminDashboard: React.FC = () => {
  const { orders, todaySession, products, brands } = useStore();

  // Metrics calculations
  const totalOrdersCount = orders.length;
  const paidOrders = orders.filter((o) => o.paymentStatus === 'paid');
  const todayRevenue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  const totalSoldIceCreams = todaySession ? todaySession.totalSold : 0;
  const totalPublishedStock = todaySession ? todaySession.totalPublished : 0;
  const remainingStock = Math.max(0, totalPublishedStock - totalSoldIceCreams);

  const pendingPickups = orders.filter(
    (o) => o.paymentStatus === 'paid' && o.pickupStatus !== 'picked_up'
  ).length;

  const completedPickups = orders.filter((o) => o.pickupStatus === 'picked_up').length;

  // Low stock products alert
  const lowStockProducts = products
    .filter((p) => {
      const stat = todaySession?.items[p.id];
      if (!stat) return false;
      const avail = stat.publishedQuantity - stat.soldQuantity - stat.reservedQuantity;
      return avail <= 5;
    })
    .slice(0, 5);

  const recentOrders = [...orders].slice(0, 5);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Title & Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
              Store Dashboard
            </h1>
            <p className="text-xs text-neutral-500 font-medium">
              Real-time inventory, pickup tokens & daily sales overview
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/admin/stock"
              className="px-3.5 py-2 rounded-xl bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-800 text-xs font-bold transition-colors shadow-2xs"
            >
              Update Daily Stock
            </Link>
            <Link
              to="/admin/verify-token"
              className="px-4 py-2 rounded-xl bg-[#42126D] hover:bg-[#340d57] text-white text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5"
            >
              <CheckCircle className="w-3.5 h-3.5 text-[#FF9E1B]" />
              <span>Verify Token</span>
            </Link>
          </div>
        </div>

        {/* 6 KPI Cards (Section 11.1) */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
          {/* 1. Today's Orders */}
          <div className="bg-white rounded-2xl p-4 border border-neutral-200/80 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-neutral-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">Orders</span>
              <ShoppingBag className="w-4 h-4 text-brand-orange" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-neutral-900">
              {totalOrdersCount}
            </div>
            <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>{paidOrders.length} Paid</span>
            </div>
          </div>

          {/* 2. Today's Revenue */}
          <div className="bg-white rounded-2xl p-4 border border-neutral-200/80 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-neutral-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">Revenue</span>
              <IndianRupee className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-neutral-900 truncate">
              {formatINR(todayRevenue)}
            </div>
            <div className="text-[10px] text-neutral-400 font-medium">
              Verified online payments
            </div>
          </div>

          {/* 3. Ice Creams Sold */}
          <div className="bg-white rounded-2xl p-4 border border-neutral-200/80 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-neutral-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">Sold</span>
              <Package className="w-4 h-4 text-brand-red" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-neutral-900">
              {totalSoldIceCreams}
            </div>
            <div className="text-[10px] text-neutral-400 font-medium">
              Ice cream units sold
            </div>
          </div>

          {/* 4. Remaining Stock */}
          <div className="bg-white rounded-2xl p-4 border border-neutral-200/80 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-neutral-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">Remaining</span>
              <Boxes className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-neutral-900">
              {remainingStock}
            </div>
            <div className="text-[10px] text-neutral-400 font-medium">
              In shop today
            </div>
          </div>

          {/* 5. Pending Preparation / Pickup */}
          <div className="bg-white rounded-2xl p-4 border border-neutral-200/80 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-neutral-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">Pending</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-600">
              {pendingPickups}
            </div>
            <div className="text-[10px] text-neutral-400 font-medium">
              Awaiting shop handoff
            </div>
          </div>

          {/* 6. Completed Pickups */}
          <div className="bg-white rounded-2xl p-4 border border-neutral-200/80 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-neutral-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">Picked Up</span>
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-700">
              {completedPickups}
            </div>
            <div className="text-[10px] text-neutral-400 font-medium">
              Completed collections
            </div>
          </div>
        </div>

        {/* Daily Stock Session Banner */}
        <div className="bg-white rounded-3xl p-5 border border-neutral-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg ${
                todaySession?.status === 'published'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-neutral-900">
                Daily Stock Session: {todaySession?.status === 'published' ? 'Published' : 'Draft'}
              </h3>
              <p className="text-xs text-neutral-500">
                {todaySession?.status === 'published'
                  ? `Published on ${new Date(todaySession.publishedAt || '').toLocaleTimeString()} by ${todaySession.publishedBy || 'Store Manager'}. Available to customers.`
                  : 'Stock is currently not published. Ordering is locked until published.'}
              </p>
            </div>
          </div>

          <Link
            to="/admin/stock"
            className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition-colors whitespace-nowrap"
          >
            Manage Stock Session &rarr;
          </Link>
        </div>

        {/* Two Columns: Recent Orders & Low Stock Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Recent Orders (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-5 border border-neutral-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-neutral-900 text-sm">Recent Pickup Orders</h3>
              <Link
                to="/admin/orders"
                className="text-xs font-bold text-brand-orange hover:text-brand-orangeHover"
              >
                View All &rarr;
              </Link>
            </div>

            <div className="divide-y divide-neutral-100">
              {recentOrders.length === 0 ? (
                <div className="text-center py-6 text-xs text-neutral-400">No orders placed yet.</div>
              ) : (
                recentOrders.map((ord) => (
                  <div key={ord.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        {/* Token display */}
                        <span className="font-mono font-black text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded text-[11px]">
                          {ord.tokenNumber || 'CREATED'}
                        </span>
                        <span className="font-bold text-neutral-800">{ord.customerName}</span>
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">
                        {ord.items.length} items • {formatINR(ord.totalAmount)} •{' '}
                        {formatKolkataDateTime(ord.createdAt)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          ord.pickupStatus === 'picked_up'
                            ? 'bg-neutral-100 text-neutral-600'
                            : ord.pickupStatus === 'ready'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {ord.pickupStatus}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right: Low Stock Alert (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-5 border border-neutral-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-neutral-900 text-sm flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Low Stock Watchlist</span>
              </h3>
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                {lowStockProducts.length} items
              </span>
            </div>

            <div className="divide-y divide-neutral-100">
              {lowStockProducts.length === 0 ? (
                <div className="text-center py-6 text-xs text-emerald-600 font-medium">
                  ✓ All products have adequate inventory.
                </div>
              ) : (
                lowStockProducts.map((p) => {
                  const stat = todaySession?.items[p.id];
                  const avail = stat
                    ? stat.publishedQuantity - stat.soldQuantity - stat.reservedQuantity
                    : 0;
                  return (
                    <div key={p.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                        />
                        <div>
                          <span className="font-bold text-neutral-900 block truncate max-w-[140px]">
                            {p.name}
                          </span>
                          <span className="text-[10px] text-neutral-400">{p.brandName}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`font-mono font-bold ${
                            avail <= 0 ? 'text-rose-600' : 'text-amber-600'
                          }`}
                        >
                          {avail <= 0 ? 'Out of Stock' : `${avail} left`}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
