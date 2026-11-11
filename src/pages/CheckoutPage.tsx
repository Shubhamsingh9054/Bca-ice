import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Clock,
  ShieldCheck,
  AlertCircle,
  CreditCard,
  Lock,
  CheckCircle2,
  Timer,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { useOrderTiming } from '../context/OrderTimingContext';
import { formatINR } from '../lib/utils';
import { OrderItem } from '../types';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { cartItems, subtotal, finalTotal, isMinimumMet, minOrderValue, clearCart } = useCart();
  const {
    settings,
    createOrderReservation,
    confirmPaymentAndGenerateToken,
    releaseOrderReservation,
  } = useStore();
  const { currentUser } = useAuth();
  const { isOrderingAllowed, windowStatus } = useOrderTiming();

  // Customer Contact Form
  const [customerName, setCustomerName] = useState(currentUser?.name || '');
  const [customerMobile, setCustomerMobile] = useState(currentUser?.mobile || '');
  const [customerEmail, setCustomerEmail] = useState(currentUser?.email || '');
  const [pickupNotes, setPickupNotes] = useState('');

  // Checkout & Reservation State
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reservationOrderId, setReservationOrderId] = useState<string | null>(null);
  const [reservationExpiresAt, setReservationExpiresAt] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(600); // 10 minutes

  // Reservation Countdown timer
  useEffect(() => {
    if (!reservationExpiresAt) return;

    const timer = setInterval(() => {
      const diff = Math.max(0, Math.floor((new Date(reservationExpiresAt).getTime() - Date.now()) / 1000));
      setSecondsRemaining(diff);

      if (diff <= 0) {
        clearInterval(timer);
        if (reservationOrderId) {
          releaseOrderReservation(reservationOrderId);
          setReservationOrderId(null);
          setReservationExpiresAt(null);
          setErrorMessage('Your 10-minute stock reservation expired. Please restart checkout.');
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [reservationExpiresAt, reservationOrderId]);

  // If cart is empty, redirect to homepage
  if (cartItems.length === 0 && !reservationOrderId) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-brand-cream flex items-center justify-center text-3xl mb-3">
          🍦
        </div>
        <h2 className="text-xl font-bold text-neutral-800 mb-1">Your Cart is Empty</h2>
        <p className="text-xs text-neutral-500 mb-4">Add your favourite ice creams before proceeding to checkout.</p>
        <Link to="/" className="px-5 py-2.5 bg-brand-orange text-white text-xs font-bold rounded-xl shadow-sm">
          Browse Ice Creams
        </Link>
      </div>
    );
  }

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handlePayNow = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Form validation
    if (!customerName.trim()) {
      setErrorMessage('Please enter your full name for shop pickup.');
      return;
    }
    if (!customerMobile.trim() || customerMobile.trim().length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!isOrderingAllowed) {
      setErrorMessage(`Ordering is currently closed (${windowStatus.headline}). Orders open 12 PM - 6 PM.`);
      return;
    }
    if (!isMinimumMet) {
      setErrorMessage(`Minimum order value is ₹${minOrderValue}. Please add more items.`);
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Prepare Order Items
      const orderItems: OrderItem[] = cartItems.map((it) => ({
        productId: it.product.id,
        productName: it.product.name,
        brandName: it.product.brandName,
        brandId: it.product.brandId,
        image: it.product.image,
        unitPrice: it.unitPrice,
        quantity: it.quantity,
        totalPrice: it.totalPrice,
      }));

      // 2. Atomic Stock Reservation (10-minute hold)
      const reservation = await createOrderReservation({
        customerName: customerName.trim(),
        customerMobile: customerMobile.trim(),
        customerEmail: customerEmail.trim() || undefined,
        items: orderItems,
        subtotal,
        taxAmount: 0,
        totalAmount: finalTotal,
        notes: pickupNotes.trim() || undefined,
      });

      if (!reservation.success || !reservation.orderId) {
        setErrorMessage(reservation.error || 'Failed to reserve inventory. Please try again.');
        setIsProcessing(false);
        return;
      }

      setReservationOrderId(reservation.orderId);
      setReservationExpiresAt(reservation.expiresAt || null);

      // 3. Razorpay Payment Trigger
      // Supports live Razorpay SDK or test mode simulation
      const razorpayKey = settings.razorpayKeyId || 'rzp_test_BcaIceCreamWalaKey';
      const hasLiveRazorpay = typeof window !== 'undefined' && (window as any).Razorpay;

      if (hasLiveRazorpay && settings.razorpayKeyId && !settings.razorpayKeyId.includes('test_BcaIceCreamWalaKey')) {
        // Live Razorpay Options
        const options = {
          key: razorpayKey,
          amount: finalTotal * 100, // paise
          currency: 'INR',
          name: settings.shopName,
          description: `Ice Cream Pickup Order (${cartItems.length} items)`,
          image: settings.logo || '/brands/amul.jpg',
          prefill: {
            name: customerName,
            contact: customerMobile,
            email: customerEmail,
          },
          theme: {
            color: '#E63946',
          },
          handler: async (response: any) => {
            const confirmRes = await confirmPaymentAndGenerateToken(
              reservation.orderId!,
              response.razorpay_payment_id || `pay_${Date.now()}`,
              response.razorpay_signature
            );
            if (confirmRes.success && confirmRes.order) {
              clearCart();
              navigate(`/order-confirmation/${confirmRes.order.id}`);
            } else {
              setErrorMessage('Payment verification failed.');
              setIsProcessing(false);
            }
          },
          modal: {
            ondismiss: () => {
              releaseOrderReservation(reservation.orderId!);
              setReservationOrderId(null);
              setIsProcessing(false);
              setErrorMessage('Payment was cancelled. Inventory reservation released.');
            },
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        // High-Fidelity Test Mode / Simulation
        // Simulates Razorpay gateway with realistic loading and instant verification
        setTimeout(async () => {
          const mockPaymentId = `pay_rzp_test_${Date.now()}`;
          const confirmRes = await confirmPaymentAndGenerateToken(
            reservation.orderId!,
            mockPaymentId,
            `sig_${Math.random().toString(36).substring(7)}`
          );

          if (confirmRes.success && confirmRes.order) {
            clearCart();
            navigate(`/order-confirmation/${confirmRes.order.id}`);
          } else {
            setErrorMessage('Payment verification error.');
            setIsProcessing(false);
          }
        }, 1200);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred during checkout.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-16 text-neutral-900">
      {/* Header */}
      <header className="bg-white border-b border-[#EDE6DA] py-3.5 px-4 sticky top-0 z-30 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-600 hover:text-[#42126D] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Continue Shopping</span>
          </Link>
          <div className="flex items-center gap-2">
            <img src="/bca-logo.png" alt="BCA Logo" className="h-7 w-auto object-contain" />
            <div className="text-left">
              <h1 className="text-xs sm:text-sm font-black text-[#42126D] uppercase">
                Shop Pickup Checkout
              </h1>
              <span className="text-[10px] text-neutral-400 font-medium block">BCA Ice Cream Wala</span>
            </div>
          </div>
          <div className="w-16" /> {/* spacer */}
        </div>
      </header>

      {/* Main Form & Summary */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Reservation Hold Active Alert */}
        {reservationOrderId && reservationExpiresAt && (
          <div className="mb-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-amber-900 text-xs">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-amber-600 animate-spin" />
              <span>
                <strong>Stock Reserved: </strong>Your ice creams are held for 10 minutes while you complete online payment.
              </span>
            </div>
            <span className="font-mono font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-lg">
              {formatTimer(secondsRemaining)}
            </span>
          </div>
        )}

        {/* Error Banner */}
        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-800 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Column: Customer Form & Pickup Info (7 cols) */}
          <div className="md:col-span-7 space-y-4">
            {/* 1. Shop Pickup Location Notice (Section 6) */}
            <div className="bg-white rounded-3xl p-5 border border-brand-border shadow-card space-y-3">
              <div className="flex items-center gap-2 text-brand-red font-bold text-xs">
                <MapPin className="w-4 h-4" />
                <span>Shop Collection Point (No Home Delivery)</span>
              </div>
              <div className="bg-brand-cream/50 rounded-2xl p-3.5 border border-brand-orange/30">
                <h4 className="font-extrabold text-neutral-900 text-sm">{settings.shopName}</h4>
                <p className="text-xs text-neutral-600 mt-0.5 leading-relaxed">{settings.address}</p>
                <p className="text-[11px] text-brand-orange font-bold mt-2">
                  Pickup Hours: {settings.openingTime} – {settings.closingTime} IST
                </p>
              </div>
              <p className="text-[11px] text-neutral-500 leading-relaxed">
                {settings.pickupInstructions}
              </p>
            </div>

            {/* 2. Customer Contact Details */}
            <div className="bg-white rounded-3xl p-5 border border-brand-border shadow-card space-y-4">
              <h3 className="font-extrabold text-neutral-900 text-sm flex items-center gap-2">
                <span>Customer Details</span>
                <span className="text-[11px] font-normal text-neutral-500">(For Token & Verification)</span>
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Full Name <span className="text-brand-red">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full bg-neutral-50 border border-brand-border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-orange/40 focus:border-brand-orange"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Mobile Number <span className="text-brand-red">*</span>
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-brand-border bg-neutral-100 text-neutral-600 text-xs font-bold">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={customerMobile}
                      onChange={(e) => setCustomerMobile(e.target.value.replace(/\D/g, ''))}
                      placeholder="9876543210"
                      className="w-full bg-neutral-50 border border-brand-border rounded-r-xl px-3.5 py-2.5 text-xs sm:text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-orange/40 focus:border-brand-orange"
                    />
                  </div>
                  <span className="text-[10px] text-neutral-400 mt-1 block">
                    Your unique token will be associated with this mobile number.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Email Address <span className="text-neutral-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="rahul@example.com"
                    className="w-full bg-neutral-50 border border-brand-border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-orange/40 focus:border-brand-orange"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Pickup Notes / Special Request <span className="text-neutral-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={pickupNotes}
                    onChange={(e) => setPickupNotes(e.target.value)}
                    placeholder="e.g. Please keep extra napkins"
                    className="w-full bg-neutral-50 border border-brand-border rounded-xl px-3.5 py-2 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-orange/40 focus:border-brand-orange"
                  />
                </div>
              </div>
            </div>

            {/* 3. Online Payment Security Badge */}
            <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div className="text-xs text-emerald-900">
                <span className="font-extrabold block">Secure Razorpay Online Checkout</span>
                <span className="text-emerald-700 text-[11px]">
                  Encrypted 256-bit payment. Unique pickup token issued immediately upon verification.
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary & Pay Action (5 cols) */}
          <div className="md:col-span-5 space-y-4">
            <div className="bg-white rounded-3xl p-5 border border-brand-border shadow-card space-y-4">
              <h3 className="font-extrabold text-neutral-900 text-sm">
                Order Summary ({cartItems.length} items)
              </h3>

              {/* Items List */}
              <div className="divide-y divide-neutral-100 max-h-60 overflow-y-auto pr-1 space-y-2">
                {cartItems.map((item) => (
                  <div key={item.product.id} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-neutral-100 flex-shrink-0">
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <span className="font-bold text-neutral-900 block truncate max-w-[150px]">
                          {item.product.name}
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          {item.product.brandName} • {item.quantity} x {formatINR(item.unitPrice)}
                        </span>
                      </div>
                    </div>
                    <span className="font-extrabold text-neutral-900">
                      {formatINR(item.totalPrice)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price Calculation */}
              <div className="pt-3 border-t border-brand-border space-y-2 text-xs">
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-neutral-900">{formatINR(subtotal)}</span>
                </div>
                <div className="flex justify-between text-neutral-500">
                  <span>Shop Pickup Charge</span>
                  <span className="text-brand-orange font-bold">FREE (₹0)</span>
                </div>
                <div className="flex justify-between font-black text-base text-neutral-900 pt-2 border-t border-brand-border">
                  <span>Total Amount</span>
                  <span className="text-brand-red">{formatINR(finalTotal)}</span>
                </div>
              </div>

              {/* Minimum Order Check Alert */}
              {!isMinimumMet && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span className="font-bold">
                    Minimum order is ₹{minOrderValue}. Please add more items to checkout.
                  </span>
                </div>
              )}

              {/* Pay Now Button */}
              <button
                onClick={handlePayNow}
                disabled={isProcessing || !isMinimumMet || !isOrderingAllowed}
                className="w-full py-4 px-4 rounded-full bg-[#FF9E1B] hover:bg-[#E68A0D] disabled:bg-neutral-300 disabled:cursor-not-allowed text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#FF9E1B]/30 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Securing Reservation & Payment...</span>
                  </span>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Pay Online via Razorpay • {formatINR(finalTotal)}</span>
                  </>
                )}
              </button>

              <p className="text-[10px] text-neutral-400 text-center leading-normal">
                By placing this order, you confirm you will collect the ice creams from BCA Ice Cream Wala shop counter.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
