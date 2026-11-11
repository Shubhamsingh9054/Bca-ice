import React, { useState } from 'react';
import { CreditCard, Search, ShieldCheck, CheckCircle2, ArrowDownLeft } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useStore } from '../../context/StoreContext';
import { formatINR, formatKolkataDateTime } from '../../lib/utils';

export const AdminPayments: React.FC = () => {
  const { orders } = useStore();
  const [searchTerm, setSearchTerm] = useState('');

  const payments = orders.map((o) => ({
    orderId: o.id,
    tokenNumber: o.tokenNumber,
    customerName: o.customerName,
    customerMobile: o.customerMobile,
    amount: o.totalAmount,
    transactionId: o.paymentTransactionId || `pay_rzp_mock_${o.id.slice(-4)}`,
    gateway: 'Razorpay Online',
    status: o.paymentStatus,
    date: o.createdAt,
  }));

  const filtered = payments.filter((p) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (p.tokenNumber && p.tokenNumber.toLowerCase().includes(term)) ||
      p.customerName.toLowerCase().includes(term) ||
      p.transactionId.toLowerCase().includes(term)
    );
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-emerald-600" />
            <span>Razorpay Payments Ledger</span>
          </h1>
          <p className="text-xs text-neutral-500 font-medium mt-0.5">
            Audit log of all verified online transactions and issued pickup tokens
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by transaction ID, token number (e.g. BCA-0879) or customer..."
            className="w-full bg-white border border-neutral-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-brand-orange"
          />
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Transaction ID</th>
                  <th className="py-3 px-4">Token Number</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Gateway</th>
                  <th className="py-3 px-4">Payment Status</th>
                  <th className="py-3 px-4">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filtered.map((pay, idx) => (
                  <tr key={idx} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-neutral-900">
                      {pay.transactionId}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-mono font-black text-xs text-neutral-900 bg-neutral-100 px-2.5 py-1 rounded-md border border-neutral-200">
                        {pay.tokenNumber || 'PENDING'}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-neutral-900">{pay.customerName}</div>
                      <div className="text-[10px] text-neutral-400 font-medium">
                        +91 {pay.customerMobile}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-black text-emerald-700">
                      {formatINR(pay.amount)}
                    </td>

                    <td className="py-3 px-4 text-neutral-600 font-semibold">{pay.gateway}</td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          pay.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {pay.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-neutral-500 font-medium">
                      {formatKolkataDateTime(pay.date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
