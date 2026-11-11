import React, { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, SlidersHorizontal, AlertCircle } from 'lucide-react';
import { Header } from '../components/customer/Header';
import { TimingBanner } from '../components/customer/TimingBanner';
import { BrandCategories } from '../components/customer/BrandCategories';
import { ProductCard } from '../components/customer/ProductCard';
import { BottomNav } from '../components/customer/BottomNav';
import { CartDrawer } from '../components/customer/CartDrawer';
import { useStore } from '../context/StoreContext';
import { IceCreamCategory } from '../types';

export const BrandPage: React.FC = () => {
  const { brandSlug } = useParams<{ brandSlug: string }>();
  const navigate = useNavigate();
  const { brands, products } = useStore();

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'popularity' | 'price_low' | 'price_high'>('popularity');
  const [searchFilter, setSearchFilter] = useState('');

  const currentBrand = brands.find((b) => b.slug === brandSlug);

  const brandProducts = useMemo(() => {
    return products.filter((p) => p.brandId === brandSlug && p.isActive);
  }, [products, brandSlug]);

  const categories: string[] = useMemo(() => {
    const set = new Set(brandProducts.map((p) => p.category));
    return ['All', ...Array.from(set)];
  }, [brandProducts]);

  const filteredProducts = useMemo(() => {
    return brandProducts
      .filter((p) => {
        if (selectedCategory !== 'All' && p.category !== selectedCategory) {
          return false;
        }
        if (
          searchFilter.trim() &&
          !p.name.toLowerCase().includes(searchFilter.toLowerCase()) &&
          !p.description.toLowerCase().includes(searchFilter.toLowerCase())
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price_low') return a.price - b.price;
        if (sortBy === 'price_high') return b.price - a.price;
        return (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0);
      });
  }, [brandProducts, selectedCategory, searchFilter, sortBy]);

  if (!currentBrand) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold text-neutral-800 mb-2">Brand Not Found</h2>
        <p className="text-xs text-neutral-500 mb-4">The requested brand does not exist or has been disabled.</p>
        <Link to="/" className="px-4 py-2 bg-brand-orange text-white text-xs font-bold rounded-xl">
          Return to Homepage
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-24 sm:pb-12 text-neutral-900">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-4 space-y-4">
        {/* Brand Header Banner */}
        <div className="bg-white rounded-[26px] p-4 sm:p-6 border border-[#EDE6DA] shadow-card flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full p-2 bg-neutral-50 border border-[#EDE6DA] flex items-center justify-center flex-shrink-0 shadow-sm">
            <img
              src={currentBrand.logo}
              alt={currentBrand.name}
              className="w-full h-full object-contain"
            />
          </div>

          <div className="text-center sm:text-left flex-1">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
              <h1 className="text-2xl sm:text-3xl font-black text-[#42126D] tracking-tight">
                {currentBrand.name}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-[#FAF7F2] border border-[#FF9E1B]/40 text-[#FF9E1B] font-bold text-[10px]">
                {brandProducts.length} Items Available
              </span>
            </div>
            <p className="text-xs sm:text-sm text-neutral-500 font-medium max-w-md">
              {currentBrand.tagline} • Genuine manufacturer stock for shop counter pickup.
            </p>
          </div>

          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Brands</span>
          </Link>
        </div>

        {/* Circular Brand Switcher */}
        <BrandCategories />

        {/* Filters and Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-[#FF9E1B] text-white shadow-sm font-black'
                    : 'bg-white text-neutral-600 border border-[#EDE6DA] hover:border-[#FF9E1B]/40'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white border border-brand-border rounded-xl px-3 py-1.5 text-xs text-neutral-800 font-medium focus:outline-none focus:ring-1 focus:ring-brand-orange"
            >
              <option value="popularity">Sort by: Popular</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-brand-border space-y-2">
            <AlertCircle className="w-8 h-8 text-neutral-400 mx-auto" />
            <h4 className="font-bold text-neutral-800 text-sm">No ice creams found</h4>
            <p className="text-xs text-neutral-500">
              No products found in the "{selectedCategory}" category for this brand.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

      <CartDrawer />
      <BottomNav />
    </div>
  );
};
