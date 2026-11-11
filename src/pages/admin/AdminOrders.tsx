import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  Search,
  Filter,
  CheckCircle,
  Eye,
  Calendar,
  IndianRupee,
  Phone,
  ChevronDown,
} from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useStore } from '../../context/StoreContext';
import { formatINR, formatKolkataDateTime } from '../../lib/utils';
import { Order, PickupStatus } from '../../types';

export const AdminOrders: React.FC = () => {
  const { orders, updateOrderStatus } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterPickup, setFilterPickup] = useState<string>('all');
  const [filterPayment, setFilterPayment] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (filterPickup !== 'all' && o.pickupStatus !== filterPickup) return false;
      if (filterPayment !== 'all' && o.paymentStatus !== filterPayment) return false;

      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        (o.tokenNumber && o.tokenNumber.toLowerCase().includes(term)) ||
        o.customerName.toLowerCase().includes(term) ||
        o.customerMobile.includes(term)
      );
    });
  }, [orders, searchTerm, filterPickup, filterPayment]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'picked_up':
        return 'bg-neutral-100 text-neutral-700';
      case 'ready':
        return 'bg-emerald-100 text-emerald-800';
      case 'preparing':
        return 'bg-blue-100 text-blue-800';
      case 'confirmed':
      default:
        return 'bg-amber-100 text-amber-800';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
              Order Management
            </h1>
            <p className="text-xs text-neutral-500 font-medium mt-0.5">
              Live pickup token queue and customer order tracking
            </p>
          </div>
          <span className="text-xs font-bold text-neutral-500">
            Total Orders: {orders.length}
          </span>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-white rounded-3xl p-4 border border-neutral-200 shadow-2xs flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by token (e.g. BCA-0879), customer name or phone..."
              className="w-full bg-neutral-50 border border-neutral-300 rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-neutral-900 focus:outline-none focus:ring-1 focus:ring-brand-orange"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={filterPickup}
              onChange={(e) => setFilterPickup(e.target.value)}
              className="bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-xs font-medium text-neutral-800 focus:outline-none"
            >
              <option value="all">All Pickup Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="picked_up">Picked Up</option>
            </select>

            <select
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
              className="bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-xs font-medium text-neutral-800 focus:outline-none"
            >
              <option value="all">All Payments</option>
              <option value="paid">Paid</option>
              <option value="created">Pending / Incomplete</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Pickup Token</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Order Date & Time</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Pickup Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-xs text-neutral-400">
                      No orders match the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-neutral-50/70 transition-colors">
                      {/* Prominent Token Display */}
                      <td className="py-3 px-4">
                        <span className="font-mono font-black text-xs text-neutral-900 bg-neutral-100 px-2.5 py-1 rounded-md border border-neutral-200">
                          {ord.tokenNumber || 'PENDING'}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-neutral-900">{ord.customerName}</div>
                        <div className="text-[10px] text-neutral-400 font-medium">
                          +91 {ord.customerMobile}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-neutral-500 font-medium">
                        {formatKolkataDateTime(ord.createdAt)}
                      </td>

                      <td className="py-3 px-4 font-bold text-neutral-800">
                        {ord.items.length} {ord.items.length === 1 ? 'item' : 'items'}
                      </td>

                      <td className="py-3 px-4 font-black text-neutral-900">
                        {formatINR(ord.totalAmount)}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            ord.paymentStatus === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {ord.paymentStatus}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${getStatusBadge(
                            ord.pickupStatus
                          )}`}
                        >
                          {ord.pickupStatus.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedOrder(ord)}
                          className="px-3 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold transition-colors"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Details Drawer / Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-neutral-200 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <div>
                  <span className="text-[10px] text-neutral-400 font-bold uppercase block">
                    Pickup Token
                  </span>
                  <span className="font-mono text-2xl font-black text-neutral-900">
                    {selectedOrder.tokenNumber || 'CREATED'}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-1 rounded-full text-neutral-400 hover:text-neutral-700"
                >
                  ✕
                </button>
              </div>

              {/* Customer */}
              <div className="text-xs space-y-1 bg-neutral-50 p-3 rounded-2xl">
                <div>
                  Customer: <strong>{selectedOrder.customerName}</strong>
                </div>
                <div>
                  Mobile: <strong>+91 {selectedOrder.customerMobile}</strong>
                </div>
                {selectedOrder.customerEmail && (
                  <div>
                    Email: <strong>{selectedOrder.customerEmail}</strong>
                  </div>
                )}
                {selectedOrder.notes && (
                  <div>
                    Notes: <em>{selectedOrder.notes}</em>
                  </div>
                )}
              </div>

              {/* Items */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-neutral-800 block">Ordered Items:</span>
                <div className="divide-y divide-neutral-100 text-xs border border-neutral-100 rounded-xl p-2">
                  {selectedOrder.items.map((it, idx) => (
                    <div key={idx} className="py-2 flex justify-between items-center">
                      <div>
                        <span className="font-bold text-neutral-900">{it.productName}</span>
                        <span className="text-[10px] text-neutral-400 block">
                          {it.brandName} • Qty: {it.quantity}
                        </span>
                      </div>
                      <span className="font-extrabold text-neutral-900">
                        {formatINR(it.totalPrice)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total & Payment Mode */}
              <div className="flex justify-between items-center text-xs font-bold pt-2 border-t border-neutral-100">
                <span>Total Paid Amount:</span>
                <span className="text-base text-brand-red font-black">
                  {formatINR(selectedOrder.totalAmount)}
                </span>
              </div>

              {/* Status Update Buttons */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-neutral-700 block">Update Status:</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => {
                      updateOrderStatus(selectedOrder.id, 'preparing');
                      setSelectedOrder((prev) => (prev ? { ...prev, pickupStatus: 'preparing' } : null));
                    }}
                    className="py-2 px-3 rounded-xl bg-blue-50 text-blue-700 font-bold hover:bg-blue-100"
                  >
                    Set Preparing
                  </button>
                  <button
                    onClick={() => {
                      updateOrderStatus(selectedOrder.id, 'ready');
                      setSelectedOrder((prev) => (prev ? { ...prev, pickupStatus: 'ready' } : null));
                    }}
                    className="py-2 px-3 rounded-xl bg-emerald-50 text-emerald-700 font-bold hover:bg-emerald-100"
                  >
                    Set Ready
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
