import React from 'react';
import { Tag, Sparkles, ArrowRight, Flame } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Header } from '../components/customer/Header';
import { TimingBanner } from '../components/customer/TimingBanner';
import { BottomNav } from '../components/customer/BottomNav';
import { CartDrawer } from '../components/customer/CartDrawer';
import { ProductCard } from '../components/customer/ProductCard';
import { useStore } from '../context/StoreContext';

export const OffersPage: React.FC = () => {
  const { products, banners } = useStore();

  const discountedProducts = products.filter(
    (p) => p.isActive && (p.badge === 'SAVE 15%' || p.badge === 'BESTSELLER' || p.badge === 'POPULAR')
  );

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-24 sm:pb-12 text-neutral-900">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-4 space-y-5">
        {/* Header */}
        <div className="bg-white rounded-[26px] p-5 border border-[#EDE6DA] shadow-card flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF9E1B]/20 text-[#FF9E1B] text-xs font-black uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Shop Exclusive Offers</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#42126D]">
              Today's Special Deals &amp; Offers
            </h1>
            <p className="text-xs text-neutral-500">
              Save up to 25% on premium tubs, cones and kulfis for shop counter pickup.
            </p>
          </div>

          <div className="w-16 h-16 rounded-2xl bg-[#F3E8FF] border border-[#E9D5FF] flex items-center justify-center text-3xl shadow-sm">
            🎁
          </div>
        </div>

        {/* Featured Deal Card matching Image 1 */}
        <div className="rounded-[28px] overflow-hidden bg-gradient-to-r from-[#23073C] via-[#3B1163] to-[#4F1787] text-white p-6 shadow-card flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-2 text-center md:text-left">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#FFB800] bg-white/10 px-2.5 py-0.5 rounded-full">
              Combo Treat
            </span>
            <h2 className="text-xl sm:text-2xl font-black">
              Royal Rajbhog &amp; Belgian Chocolate Combo
            </h2>
            <p className="text-xs text-purple-200 max-w-md">
              Order your favorite 700ml tubs online between 12 PM - 6 PM and collect cold &amp; fresh at the shop counter.
            </p>
          </div>
          <Link
            to="/menu"
            className="px-5 py-2.5 rounded-full bg-[#FF9E1B] hover:bg-[#E68A0D] text-white text-xs font-bold transition-all shadow-md shadow-[#FF9E1B]/30"
          >
            Explore Combo
          </Link>
        </div>

        {/* Product Cards with Offers */}
        <div className="space-y-2">
          <h2 className="text-sm sm:text-base font-extrabold text-neutral-900 flex items-center gap-2">
            <Flame className="w-4 h-4 text-brand-orange" />
            <span>Discounted & Bestseller Flavours</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {discountedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </main>

      <CartDrawer />
      <BottomNav />
    </div>
  );
};
