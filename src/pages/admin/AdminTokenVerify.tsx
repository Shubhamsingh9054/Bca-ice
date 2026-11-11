import React, { useState } from 'react';
import {
  CheckCircle,
  Search,
  AlertCircle,
  AlertTriangle,
  User,
  Phone,
  Clock,
  ShieldCheck,
  CreditCard,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { normalizeTokenInput } from '../../lib/tokenGenerator';
import { formatINR, formatKolkataDateTime } from '../../lib/utils';
import { Order, PickupStatus } from '../../types';

export const AdminTokenVerify: React.FC = () => {
  const { findOrderByToken, completeOrderPickup, updateOrderStatus, orders } = useStore();
  const { currentUser } = useAuth();

  const [inputToken, setInputToken] = useState('BCA-0878'); // Initial sample token for immediate test
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(() => findOrderByToken('BCA-0878') || null);
  const [resultMsg, setResultMsg] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setResultMsg(null);

    const normalized = normalizeTokenInput(inputToken);
    setInputToken(normalized);

    const found = findOrderByToken(normalized);
    if (!found) {
      setSearchedOrder(null);
      setResultMsg({
        type: 'error',
        text: `No order found with token "${normalized}". Please check token carefully.`,
      });
    } else {
      setSearchedOrder(found);
    }
  };

  const handleStatusChange = (status: PickupStatus) => {
    if (!searchedOrder) return;
    updateOrderStatus(searchedOrder.id, status);
    setSearchedOrder((prev) => (prev ? { ...prev, pickupStatus: status } : null));
    setResultMsg({ type: 'success', text: `Status updated to ${status.toUpperCase()}` });
    setTimeout(() => setResultMsg(null), 3000);
  };

  const handleCompletePickup = async () => {
    if (!searchedOrder) return;
    const adminId = currentUser?.id || 'admin-super-1';
    const res = await completeOrderPickup(searchedOrder.tokenNumber, adminId);

    if (res.success && res.order) {
      setSearchedOrder(res.order);
      setResultMsg({
        type: 'success',
        text: `✓ Order ${searchedOrder.tokenNumber} successfully picked up! Handover confirmed.`,
      });
    } else {
      setResultMsg({
        type: 'error',
        text: res.error || 'Failed to complete pickup.',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'picked_up':
        return 'bg-neutral-100 text-neutral-700 border-neutral-300';
      case 'ready':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'preparing':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'confirmed':
      default:
        return 'bg-amber-100 text-amber-800 border-amber-300';
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-brand-orange" />
            <span>Pickup Token Verification Terminal</span>
          </h1>
          <p className="text-xs text-neutral-500 font-medium mt-0.5">
            Scan or enter the customer's unique token (e.g. <strong>BCA-0879</strong>) to verify payment and hand over ice creams.
          </p>
        </div>

        {/* Token Search Box */}
        <div className="bg-white rounded-3xl p-5 border border-neutral-200 shadow-card">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={inputToken}
                onChange={(e) => setInputToken(e.target.value.toUpperCase())}
                placeholder="Enter Token Number (e.g. BCA-0879 or 0879)..."
                className="w-full bg-neutral-50 border border-neutral-300 rounded-2xl pl-10 pr-4 py-3 text-sm sm:text-base font-mono font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-orange"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 rounded-2xl bg-[#42126D] hover:bg-[#340d57] text-white font-black text-xs sm:text-sm transition-all shadow-md shadow-[#42126D]/20 flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4 text-[#FF9E1B]" />
              <span>Verify Token</span>
            </button>
          </form>

          {/* Quick Token Suggestions from active orders */}
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-neutral-100 overflow-x-auto no-scrollbar text-xs">
            <span className="text-[11px] text-neutral-400 font-bold uppercase whitespace-nowrap">
              Active Orders:
            </span>
            {orders.slice(0, 5).map((o) => (
              <button
                key={o.id}
                onClick={() => {
                  setInputToken(o.tokenNumber);
                  setSearchedOrder(o);
                  setResultMsg(null);
                }}
                className={`font-mono text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-colors whitespace-nowrap ${
                  searchedOrder?.id === o.id
                    ? 'bg-brand-orange text-white border-brand-orange'
                    : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border-neutral-200'
                }`}
              >
                {o.tokenNumber || 'No Token'}
              </button>
            ))}
          </div>
        </div>

        {/* Result Notification */}
        {resultMsg && (
          <div
            className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-2xs ${
              resultMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                : 'bg-rose-50 text-rose-900 border border-rose-200'
            }`}
          >
            {resultMsg.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            )}
            <span>{resultMsg.text}</span>
          </div>
        )}

        {/* Verified Order Inspection Card */}
        {searchedOrder && (
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-card p-6 space-y-6">
            {/* Top Bar: Large Token & Status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
              <div className="space-y-1">
                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">
                  Customer Pickup Token
                </span>
                <span className="font-mono text-3xl sm:text-4xl font-black text-neutral-900 tracking-wider">
                  {searchedOrder.tokenNumber}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border ${getStatusBadge(
                    searchedOrder.pickupStatus
                  )}`}
                >
                  {searchedOrder.pickupStatus.replace('_', ' ')}
                </span>

                <span
                  className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${
                    searchedOrder.paymentStatus === 'paid'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}
                >
                  Payment: {searchedOrder.paymentStatus}
                </span>
              </div>
            </div>

            {/* Warning if already picked up (Prevent Duplicate Collection - Section 11.6) */}
            {searchedOrder.pickupStatus === 'picked_up' && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2.5 font-semibold">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <div>
                  <span className="font-extrabold block">
                    ALREADY COLLECTED ON {formatKolkataDateTime(searchedOrder.pickupTimestamp || '')}!
                  </span>
                  <span className="text-amber-700">
                    This order was already handed over to the customer. Duplicate collection has been blocked.
                  </span>
                </div>
              </div>
            )}

            {/* Customer Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-neutral-50 border border-neutral-100 text-xs">
              <div>
                <span className="text-neutral-400 block font-medium">Customer Name</span>
                <span className="font-bold text-neutral-900 text-sm mt-0.5 block">
                  {searchedOrder.customerName}
                </span>
              </div>

              <div>
                <span className="text-neutral-400 block font-medium">Mobile Number</span>
                <span className="font-bold text-neutral-900 text-sm mt-0.5 block">
                  +91 {searchedOrder.customerMobile}
                </span>
              </div>

              <div>
                <span className="text-neutral-400 block font-medium">Payment ID</span>
                <span className="font-mono font-bold text-neutral-800 text-xs mt-0.5 block truncate">
                  {searchedOrder.paymentTransactionId || 'pay_verified'}
                </span>
              </div>
            </div>

            {/* Ordered Ice Creams Breakdown */}
            <div className="space-y-3">
              <h3 className="font-black text-neutral-900 text-sm">
                Ice Creams to Hand Over ({searchedOrder.items.length} items)
              </h3>

              <div className="divide-y divide-neutral-100 border border-neutral-100 rounded-2xl p-2 bg-neutral-50/50">
                {searchedOrder.items.map((it, idx) => (
                  <div key={idx} className="py-2.5 px-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <img
                        src={it.image}
                        alt={it.productName}
                        className="w-10 h-10 rounded-xl object-cover bg-white flex-shrink-0"
                      />
                      <div>
                        <span className="font-bold text-neutral-900 block">{it.productName}</span>
                        <span className="text-[10px] text-neutral-400 font-medium">
                          Brand: <strong>{it.brandName}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-neutral-500 font-medium block">
                        Qty: <strong className="text-neutral-900 text-sm">{it.quantity}</strong>
                      </span>
                      <span className="text-[11px] font-bold text-neutral-700">
                        {formatINR(it.totalPrice)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Amount */}
              <div className="flex justify-between items-center px-4 py-2 bg-neutral-100 rounded-xl text-xs font-bold">
                <span>Total Order Amount</span>
                <span className="text-sm font-black text-brand-red">
                  {formatINR(searchedOrder.totalAmount)}
                </span>
              </div>
            </div>

            {/* Order Workflow Actions */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold text-neutral-700 block">
                Update Preparation Status:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleStatusChange('confirmed')}
                  disabled={searchedOrder.pickupStatus === 'picked_up'}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                    searchedOrder.pickupStatus === 'confirmed'
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-white hover:bg-neutral-50 border-neutral-200 text-neutral-700'
                  }`}
                >
                  Confirmed
                </button>
                <button
                  onClick={() => handleStatusChange('preparing')}
                  disabled={searchedOrder.pickupStatus === 'picked_up'}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                    searchedOrder.pickupStatus === 'preparing'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white hover:bg-neutral-50 border-neutral-200 text-neutral-700'
                  }`}
                >
                  Preparing in Freezer
                </button>
                <button
                  onClick={() => handleStatusChange('ready')}
                  disabled={searchedOrder.pickupStatus === 'picked_up'}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                    searchedOrder.pickupStatus === 'ready'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white hover:bg-neutral-50 border-neutral-200 text-neutral-700'
                  }`}
                >
                  Ready at Counter
                </button>
              </div>

              {/* Big Mark as Picked Up Handover Button (Section 11.6) */}
              <button
                onClick={handleCompletePickup}
                disabled={searchedOrder.pickupStatus === 'picked_up' || searchedOrder.paymentStatus !== 'paid'}
                className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <CheckCircle className="w-5 h-5" />
                <span>
                  {searchedOrder.pickupStatus === 'picked_up'
                    ? 'Order Already Collected (Complete)'
                    : 'Confirm Handover & Mark as Picked Up'}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
