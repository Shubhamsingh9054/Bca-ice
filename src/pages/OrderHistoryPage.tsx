import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Search,
  CheckCircle2,
  Clock,
  MapPin,
  ChevronRight,
  ShieldCheck,
  ShoppingBag,
} from 'lucide-react';
import { Header } from '../components/customer/Header';
import { TimingBanner } from '../components/customer/TimingBanner';
import { BottomNav } from '../components/customer/BottomNav';
import { CartDrawer } from '../components/customer/CartDrawer';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { formatINR, formatKolkataDateTime } from '../lib/utils';

export const OrderHistoryPage: React.FC = () => {
  const { orders } = useStore();
  const { currentUser } = useAuth();
  const [tokenSearch, setTokenSearch] = useState('');

  const filteredOrders = orders.filter((o) => {
    if (!tokenSearch.trim()) return true;
    const term = tokenSearch.trim().toLowerCase();
    return (
      (o.tokenNumber && o.tokenNumber.toLowerCase().includes(term)) ||
      o.customerMobile.includes(term) ||
      o.customerName.toLowerCase().includes(term)
    );
  });

  const getStatusBadge = (pickupStatus: string) => {
    switch (pickupStatus) {
      case 'picked_up':
        return { text: 'Picked Up', bg: 'bg-neutral-100 text-neutral-600 border-neutral-200' };
      case 'ready':
        return { text: 'Ready for Pickup', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      case 'preparing':
        return { text: 'Preparing', bg: 'bg-blue-100 text-blue-800 border-blue-300' };
      case 'confirmed':
      default:
        return { text: 'Confirmed', bg: 'bg-amber-100 text-amber-800 border-amber-300' };
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-24 sm:pb-12 text-neutral-900">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        {/* Header & Search */}
        <div className="bg-white rounded-[26px] p-5 border border-[#EDE6DA] shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg sm:text-xl font-black text-[#42126D] flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#FF9E1B]" />
                <span>My Orders &amp; Pickup Tokens</span>
              </h1>
              <p className="text-xs text-neutral-500 font-medium">
                Track your active pickup tokens and order verification history
              </p>
            </div>
            <span className="text-xs font-bold text-neutral-400">
              {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'}
            </span>
          </div>

          {/* Quick Token Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={tokenSearch}
              onChange={(e) => setTokenSearch(e.target.value)}
              placeholder="Search by token (e.g. BCA-0879) or mobile number..."
              className="w-full bg-neutral-50 pl-10 pr-4 py-2.5 rounded-2xl border border-brand-border text-xs sm:text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-orange/40 focus:border-brand-orange"
            />
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-brand-border space-y-3">
            <ShoppingBag className="w-10 h-10 text-neutral-300 mx-auto" />
            <h3 className="font-bold text-neutral-800 text-base">No orders found</h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              You haven't placed any pickup orders yet. Browse delicious ice creams from Amul, Havmor, Vadilal and more!
            </p>
            <Link
              to="/"
              className="inline-block px-5 py-2.5 bg-brand-orange text-white text-xs font-bold rounded-xl shadow-sm"
            >
              Order Now
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => {
              const badge = getStatusBadge(order.pickupStatus);
              return (
                <div
                  key={order.id}
                  className="bg-white rounded-[24px] p-5 border border-[#EDE6DA] hover:border-[#FF9E1B]/50 shadow-card transition-all space-y-3"
                >
                  {/* Top Bar: Token & Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#EDE6DA]">
                    <div className="flex items-center gap-3">
                      {/* Prominent BCA-0879 Token */}
                      <span className="font-mono text-base sm:text-lg font-black text-[#FFB800] bg-[#42126D] px-3.5 py-1 rounded-xl shadow-xs">
                        {order.tokenNumber || 'PENDING'}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${badge.bg}`}>
                        {badge.text}
                      </span>
                    </div>

                    <span className="text-[11px] text-neutral-400 font-medium">
                      {formatKolkataDateTime(order.createdAt)}
                    </span>
                  </div>

                  {/* Items Preview */}
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                    {order.items.map((it, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 bg-neutral-50 border border-brand-border/60 rounded-xl px-2.5 py-1.5 flex-shrink-0 text-xs"
                      >
                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-white flex-shrink-0">
                          <img src={it.image} alt={it.productName} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <span className="font-bold text-neutral-900 block truncate max-w-[120px]">
                            {it.productName}
                          </span>
                          <span className="text-[10px] text-neutral-400 font-medium">
                            Qty: {it.quantity}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer & Details Link */}
                  <div className="flex items-center justify-between pt-2 border-t border-brand-border/60 text-xs">
                    <div>
                      <span className="text-neutral-500 font-medium">Total Paid: </span>
                      <span className="font-extrabold text-neutral-900 text-sm">
                        {formatINR(order.totalAmount)}
                      </span>
                    </div>

                    <Link
                      to={`/order-confirmation/${order.id}`}
                      className="inline-flex items-center gap-1 font-bold text-brand-orange hover:text-brand-orangeHover transition-colors"
                    >
                      <span>View Token Details</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <CartDrawer />
      <BottomNav />
    </div>
  );
};
