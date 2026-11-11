import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Layers,
  Package,
  Boxes,
  ShoppingBag,
  CheckCircle,
  CreditCard,
  Image as ImageIcon,
  Clock,
  Settings,
  ExternalLink,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { useOrderTiming } from '../../context/OrderTimingContext';

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const { logout, isAdmin } = useAuth();
  const { settings, todaySession } = useStore();
  const { windowStatus } = useOrderTiming();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { label: 'Daily Stock Session', icon: Boxes, path: '/admin/stock', highlight: !todaySession || todaySession.status !== 'published' },
    { label: 'Token Verification', icon: CheckCircle, path: '/admin/verify-token', badge: 'Verify' },
    { label: 'Orders Management', icon: ShoppingBag, path: '/admin/orders' },
    { label: 'Products', icon: Package, path: '/admin/products' },
    { label: 'Brands', icon: Layers, path: '/admin/brands' },
    { label: 'Payments Ledger', icon: CreditCard, path: '/admin/payments' },
    { label: 'Promotional Banners', icon: ImageIcon, path: '/admin/banners' },
    { label: 'Timing & Shop Settings', icon: Settings, path: '/admin/settings' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col md:flex-row text-neutral-800">
      {/* Mobile Topbar */}
      <div className="md:hidden bg-neutral-900 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg bg-neutral-800 text-white"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2 font-bold text-sm">
            <img src="/bca-logo.png" alt="BCA Logo" className="h-6 w-auto object-contain" />
            <span className="text-[#FF9E1B]">BCA Admin</span>
          </div>
        </div>

        <Link
          to="/"
          className="text-xs text-neutral-300 hover:text-white flex items-center gap-1 bg-neutral-800 px-2.5 py-1 rounded-md"
        >
          <span>Store</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 bg-neutral-900 text-neutral-300 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="p-5 border-b border-neutral-800 flex items-center justify-between">
            <Link to="/admin" className="flex items-center gap-2.5">
              <img src="/bca-logo.png" alt="BCA Logo" className="h-9 w-auto object-contain" />
              <div>
                <div className="font-black text-sm text-white tracking-wide flex items-center gap-1">
                  <span>BCA Ice Cream</span>
                </div>
                <span className="text-[10px] text-[#FF9E1B] font-bold uppercase tracking-wider">
                  Admin Portal
                </span>
              </div>
            </Link>
          </div>

          {/* Daily Stock Status Alert inside sidebar */}
          <div className="p-3 mx-3 mt-3 rounded-xl bg-neutral-800/80 border border-neutral-700/60 text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-neutral-400 font-bold uppercase tracking-wider">
                Daily Stock
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  todaySession?.status === 'published' ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
                }`}
              />
            </div>
            <div className="font-semibold text-white text-xs">
              {todaySession?.status === 'published' ? 'Published for Today' : 'Draft / Unpublished'}
            </div>
            <div className="text-[10px] text-neutral-400 mt-0.5">
              Window: 12 PM – 6 PM IST
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/admin'}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-brand-orange text-white shadow-sm'
                        : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className="text-[10px] bg-brand-red text-white px-2 py-0.5 rounded-full font-bold">
                      {item.badge}
                    </span>
                  )}
                  {item.highlight && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-neutral-800 space-y-2">
          <Link
            to="/"
            target="_blank"
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold transition-colors"
          >
            <span>Customer Website</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-neutral-950 hover:bg-red-950/40 text-neutral-400 hover:text-rose-400 text-xs font-bold transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Exit Admin</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="bg-white border-b border-neutral-200 px-6 py-3.5 hidden md:flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Shop Status:
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                windowStatus.isOpen
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  windowStatus.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <span>{windowStatus.badgeText}</span>
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-neutral-500 font-medium">
              Location: <strong>{settings.shopName}</strong>
            </span>
            <Link
              to="/admin/verify-token"
              className="px-3.5 py-1.5 rounded-xl bg-brand-orange hover:bg-brand-orangeHover text-white font-bold transition-colors shadow-xs flex items-center gap-1.5"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Verify Pickup Token</span>
            </Link>
          </div>
        </header>

        {/* Content Body */}
        <div className="p-4 sm:p-6 lg:p-8 flex-1">{children}</div>
      </main>
    </div>
  );
};
