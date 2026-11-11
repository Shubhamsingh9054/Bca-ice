import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  MapPin,
  Clock,
  Phone,
  QrCode,
  ArrowRight,
  ShieldCheck,
  ShoppingBag,
  ExternalLink,
  Copy,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatINR, formatKolkataDateTime } from '../lib/utils';
import { Order, OrderItem } from '../types';

export const OrderConfirmationPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { orders, settings } = useStore();

  const order = orders.find((o: Order) => o.id === orderId);

  // Trigger celebration confetti on mount
  useEffect(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#E63946', '#FF9F1C', '#247BA0', '#FFF3E5'],
      });
    } catch {
      // ignore
    }
  }, []);

  if (!order) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold text-neutral-800 mb-2">Order Not Found</h2>
        <p className="text-xs text-neutral-500 mb-4">The specified order ID does not exist in our database.</p>
        <Link to="/" className="px-4 py-2 bg-brand-orange text-white text-xs font-bold rounded-xl">
          Return to Homepage
        </Link>
      </div>
    );
  }

  const copyToken = () => {
    if (order.tokenNumber) {
      navigator.clipboard.writeText(order.tokenNumber);
      alert(`Token ${order.tokenNumber} copied to clipboard!`);
    }
  };

  const getPickupBadge = () => {
    switch (order.pickupStatus) {
      case 'picked_up':
        return { text: 'Picked Up (Completed)', bg: 'bg-neutral-100 text-neutral-700 border-neutral-300' };
      case 'ready':
        return { text: 'Ready at Counter!', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      case 'preparing':
        return { text: 'Shop Preparing Order', bg: 'bg-blue-100 text-blue-800 border-blue-300' };
      case 'confirmed':
      default:
        return { text: 'Order Confirmed', bg: 'bg-amber-100 text-amber-800 border-amber-300' };
    }
  };

  const statusBadge = getPickupBadge();

  return (
    <div className="min-h-screen bg-[#FAF6F0] pb-16 text-brand-dark">
      {/* Top Header */}
      <header className="bg-white border-b border-brand-border py-4 px-4 sticky top-0 z-30 shadow-xs">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link
            to="/"
            className="text-xs font-black text-[#42126D] hover:text-[#5B1F94] transition-colors flex items-center gap-2"
          >
            <img src="/bca-logo.png" alt="BCA Logo" className="h-7 w-auto object-contain" />
            <span className="uppercase tracking-tight text-sm">BCA Ice Cream Wala</span>
          </Link>
          <Link
            to="/orders"
            className="text-xs font-bold text-[#FF9E1B] hover:text-[#E68A0D] transition-colors"
          >
            My Past Orders &rarr;
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Success Announcement Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-[#F3E8FF] text-[#42126D] mx-auto flex items-center justify-center shadow-md animate-bounce">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
            Payment Verified &amp; Confirmed!
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 max-w-md mx-auto leading-relaxed">
            Your fresh ice cream order has been received by BCA Ice Cream Wala. Show this unique token at the shop counter for pickup.
          </p>
        </div>

        {/* PROMINENT TOKEN CARD (User request: token no bca-0879 like unique not a simple bca full show) */}
        <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#23073C] via-[#3B1163] to-[#4F1787] text-white p-6 sm:p-8 shadow-elevated border-2 border-[#FF9E1B]/50 text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#FF9E1B]/20 border border-[#FF9E1B]/50 text-[#FFB800] text-xs font-extrabold tracking-wider uppercase">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Official Pickup Token</span>
          </div>

          <div>
            <div className="text-xs text-purple-200 uppercase tracking-widest font-semibold mb-1">
              Your Unique Order Code
            </div>
            {/* FULL PROMINENT TOKEN DISPLAY */}
            <div className="text-4xl sm:text-6xl font-black tracking-wider text-white font-mono flex items-center justify-center gap-3 py-1">
              <span className="text-[#FFB800]">{order.tokenNumber || 'BCA-0879'}</span>
              <button
                onClick={copyToken}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition-colors"
                title="Copy Token Number"
              >
                <Copy className="w-5 h-5" />
              </button>
            </div>
            <p className="text-[11px] text-purple-200 mt-1">
              Present this code at the BCA Ice Cream counter to collect your order.
            </p>
          </div>

          {/* Pickup Status Badge */}
          <div className="pt-2 flex items-center justify-center gap-2">
            <span className={`px-4 py-1.5 rounded-full text-xs font-extrabold border ${statusBadge.bg}`}>
              {statusBadge.text}
            </span>
          </div>
        </div>

        {/* Shop Pickup Details Card */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-brand-border shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-brand-border">
            <div className="flex items-center gap-2 text-brand-red font-bold text-xs sm:text-sm">
              <MapPin className="w-4 h-4" />
              <span>Shop Pickup Point</span>
            </div>
            <a
              href={settings.googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(settings.address)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-bold text-brand-orange hover:text-brand-orangeHover transition-colors"
            >
              <span>View Map</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="bg-brand-cream/40 rounded-2xl p-4 border border-brand-orange/20 space-y-1">
            <h3 className="font-extrabold text-neutral-900 text-sm">{settings.shopName}</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">{settings.address}</p>
            <div className="flex items-center gap-4 text-[11px] text-neutral-500 pt-2 font-medium">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-brand-orange" />
                <span>Pickup Window: {settings.openingTime} – {settings.closingTime} IST</span>
              </span>
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-neutral-600" />
                <span>{settings.phone}</span>
              </span>
            </div>
          </div>

          <p className="text-xs text-neutral-500 leading-relaxed">
            {settings.pickupInstructions}
          </p>
        </div>

        {/* Order Details & Items Breakdown */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-brand-border shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-brand-border">
            <div>
              <h3 className="font-extrabold text-neutral-900 text-sm">Ordered Ice Creams</h3>
              <p className="text-[11px] text-neutral-400">
                Placed on {formatKolkataDateTime(order.createdAt)}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-neutral-400 block">Payment Transaction</span>
              <span className="font-mono text-xs font-bold text-neutral-800">
                {order.paymentTransactionId || 'pay_verified'}
              </span>
            </div>
          </div>

          {/* Item List */}
          <div className="divide-y divide-neutral-100">
            {order.items.map((item: OrderItem, idx: number) => (
              <div key={idx} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-neutral-100 flex-shrink-0">
                    <img
                      src={item.image}
                      alt={item.productName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <span className="font-bold text-neutral-900 block">{item.productName}</span>
                    <span className="text-[10px] text-neutral-400">
                      {item.brandName} • {item.quantity} x {formatINR(item.unitPrice)}
                    </span>
                  </div>
                </div>
                <span className="font-extrabold text-neutral-900">{formatINR(item.totalPrice)}</span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="pt-3 border-t border-brand-border space-y-1.5 text-xs">
            <div className="flex justify-between text-neutral-600">
              <span>Customer</span>
              <span className="font-semibold text-neutral-900">
                {order.customerName} ({order.customerMobile})
              </span>
            </div>
            <div className="flex justify-between text-neutral-600">
              <span>Payment Mode</span>
              <span className="font-semibold text-emerald-700">Online via Razorpay (Verified)</span>
            </div>
            <div className="flex justify-between font-black text-base text-neutral-900 pt-2 border-t border-brand-border">
              <span>Total Paid</span>
              <span className="text-brand-red">{formatINR(order.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Link
            to="/orders"
            className="w-full sm:flex-1 py-3 px-4 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs sm:text-sm text-center transition-colors shadow-sm"
          >
            Track in Order History
          </Link>
          <Link
            to="/"
            className="w-full sm:flex-1 py-3 px-4 rounded-2xl bg-brand-orange hover:bg-brand-orangeHover text-white font-bold text-xs sm:text-sm text-center transition-colors shadow-sm"
          >
            Back to Home
          </Link>
        </div>
      </main>
    </div>
  );
};
