import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, SlidersHorizontal, AlertCircle, ArrowLeft } from 'lucide-react';
import { Header } from '../components/customer/Header';
import { TimingBanner } from '../components/customer/TimingBanner';
import { ProductCard } from '../components/customer/ProductCard';
import { BottomNav } from '../components/customer/BottomNav';
import { CartDrawer } from '../components/customer/CartDrawer';
import { useStore } from '../context/StoreContext';

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialBrand = searchParams.get('brand') || 'all';

  const [query, setQuery] = useState(initialQuery);
  const [selectedBrand, setSelectedBrand] = useState(initialBrand);
  const { products, brands } = useStore();

  useEffect(() => {
    setQuery(searchParams.get('q') || '');
  }, [searchParams]);

  const searchResults = useMemo(() => {
    return products.filter((p) => {
      if (!p.isActive) return false;
      if (selectedBrand !== 'all' && p.brandId !== selectedBrand) return false;

      if (!query.trim()) return true;

      const q = query.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.brandName.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    });
  }, [products, query, selectedBrand]);

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-24 sm:pb-12 text-neutral-900">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-4 space-y-4">
        {/* Search Header */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-brand-border shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg sm:text-xl font-extrabold text-neutral-900 flex items-center gap-2">
              <Search className="w-5 h-5 text-brand-orange" />
              <span>Search Ice Creams</span>
            </h1>
            <span className="text-xs text-neutral-500 font-semibold">
              {searchResults.length} results
            </span>
          </div>

          {/* Search Input Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSearchParams({ q: e.target.value, brand: selectedBrand });
              }}
              placeholder="Search by name, brand, or flavor (e.g. Belgian Chocolate, Rajwadi, Mango)..."
              className="w-full bg-neutral-50 pl-10 pr-4 py-2.5 rounded-2xl border border-brand-border text-xs sm:text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-orange/40 focus:border-brand-orange"
            />
          </div>

          {/* Brand Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
            <button
              onClick={() => setSelectedBrand('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedBrand === 'all'
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              All Brands
            </button>
            {brands.map((b) => (
              <button
                key={b.id}
                onClick={() => setSelectedBrand(b.slug)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  selectedBrand === b.slug
                    ? 'bg-brand-orange text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                <span>{b.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Results Grid */}
        {searchResults.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-brand-border space-y-3">
            <AlertCircle className="w-10 h-10 text-neutral-400 mx-auto" />
            <h3 className="font-extrabold text-neutral-800 text-base">No matching ice creams</h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              We couldn't find any ice cream matching "{query}". Try checking the spelling or browse our 5 brand collections.
            </p>
            <button
              onClick={() => {
                setQuery('');
                setSelectedBrand('all');
              }}
              className="px-4 py-2 bg-brand-orange text-white text-xs font-bold rounded-xl"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {searchResults.map((product) => (
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
