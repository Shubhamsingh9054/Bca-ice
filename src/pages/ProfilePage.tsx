import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Phone,
  Mail,
  ShieldCheck,
  ShoppingBag,
  LogOut,
  Save,
  Lock,
  ExternalLink,
} from 'lucide-react';
import { Header } from '../components/customer/Header';
import { TimingBanner } from '../components/customer/TimingBanner';
import { BottomNav } from '../components/customer/BottomNav';
import { CartDrawer } from '../components/customer/CartDrawer';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, updateCustomerProfile, loginAdmin, isAdmin, logout } = useAuth();
  const { orders } = useStore();

  const [name, setName] = useState(currentUser?.name || '');
  const [mobile, setMobile] = useState(currentUser?.mobile || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [adminPassword, setAdminPassword] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [adminLoginError, setAdminLoginError] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateCustomerProfile({ name, mobile, email });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = loginAdmin(adminPassword);
    if (ok) {
      navigate('/admin');
    } else {
      setAdminLoginError(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-24 sm:pb-12 text-neutral-900">
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Customer Profile Card */}
        <div className="bg-white rounded-[26px] p-5 sm:p-6 border border-[#EDE6DA] shadow-card space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-[#EDE6DA]">
            <div className="w-12 h-12 rounded-full bg-[#F3E8FF] border border-[#E9D5FF] flex items-center justify-center text-[#42126D] font-black text-lg">
              {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h1 className="font-extrabold text-neutral-900 text-base sm:text-lg">
                {currentUser?.name || 'Customer Account'}
              </h1>
              <p className="text-xs text-neutral-500 font-medium">
                {currentUser?.mobile ? `+91 ${currentUser.mobile}` : 'Pickup Contact Profile'}
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSaveProfile} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Name"
                className="w-full bg-neutral-50 border border-brand-border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Mobile Number</label>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="10-digit mobile number"
                className="w-full bg-neutral-50 border border-brand-border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full bg-neutral-50 border border-brand-border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-orange hover:bg-brand-orangeHover text-white text-xs font-bold shadow-sm transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Profile</span>
              </button>
              {savedSuccess && (
                <span className="text-xs font-bold text-emerald-600 animate-fade-in">
                  Profile updated successfully!
                </span>
              )}
            </div>
          </form>
        </div>

        {/* Quick Links Card */}
        <div className="bg-white rounded-3xl p-5 border border-brand-border shadow-card space-y-2">
          <Link
            to="/orders"
            className="flex items-center justify-between p-3 rounded-2xl hover:bg-neutral-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-700">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-xs sm:text-sm text-neutral-900 block">
                  My Orders & Pickup Tokens
                </span>
                <span className="text-[11px] text-neutral-400">
                  {orders.length} order records stored
                </span>
              </div>
            </div>
            <span className="text-xs font-bold text-brand-orange">&rarr;</span>
          </Link>
        </div>

        {/* Shop Owner Admin Access Card */}
        <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 text-white rounded-3xl p-5 sm:p-6 shadow-card space-y-3 border border-neutral-800">
          <div className="flex items-center gap-2 text-brand-orange text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Store Owner Portal</span>
          </div>

          <div>
            <h2 className="text-base sm:text-lg font-black text-white">
              BCA Ice Cream Wala Admin Dashboard
            </h2>
            <p className="text-xs text-neutral-300 mt-0.5">
              Manage daily stock sessions, verify pickup tokens (e.g. BCA-0879), configure shop timings and products.
            </p>
          </div>

          {isAdmin ? (
            <div className="pt-2 flex items-center gap-3">
              <Link
                to="/admin"
                className="px-4 py-2 rounded-xl bg-brand-orange hover:bg-brand-orangeHover text-white text-xs font-bold transition-colors shadow-sm"
              >
                Open Admin Dashboard &rarr;
              </Link>
              <button
                onClick={logout}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-300 text-xs font-semibold transition-colors"
              >
                Switch to Customer Mode
              </button>
            </div>
          ) : (
            <form onSubmit={handleAdminLogin} className="pt-2 space-y-2">
              <div className="flex gap-2">
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => {
                    setAdminPassword(e.target.value);
                    setAdminLoginError(false);
                  }}
                  placeholder="Enter Admin Password (e.g. admin123)"
                  className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-brand-orange"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-brand-orange hover:bg-brand-orangeHover text-white text-xs font-bold transition-colors whitespace-nowrap"
                >
                  Login Admin
                </button>
              </div>
              {adminLoginError && (
                <p className="text-[11px] text-rose-400 font-medium">
                  Invalid password. Try "admin123" or "bca123".
                </p>
              )}
            </form>
          )}
        </div>
      </main>

      <CartDrawer />
      <BottomNav />
    </div>
  );
};
