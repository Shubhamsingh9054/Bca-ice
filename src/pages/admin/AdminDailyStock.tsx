import React, { useState, useEffect } from 'react';
import {
  Boxes,
  CheckCircle2,
  Save,
  Send,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Info,
  Search,
  Filter,
  Layers,
  DollarSign,
  Check,
  Zap,
  TrendingUp,
} from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useStore } from '../../context/StoreContext';
import { getKolkataDateString } from '../../utils/orderTiming';
import { BrandId, IceCreamCategory } from '../../types';

const CATEGORIES: IceCreamCategory[] = [
  'Kulfi & Specialties',
  'Cones',
  'Bars & Sticks',
  'Cups',
  'Family Tubs',
];

export const AdminDailyStock: React.FC = () => {
  const { products, brands, todaySession, saveDailyStockDraft, publishDailyStock, updateProduct } = useStore();
  const todayDateStr = getKolkataDateString();

  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [priceSaveStatus, setPriceSaveStatus] = useState<Record<string, boolean>>({});
  const [bulkQtyValue, setBulkQtyValue] = useState<number>(30);
  const [notes, setNotes] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Initialize form quantities & prices from today's session & products
  useEffect(() => {
    const initialQty: Record<string, number> = {};
    const initialPrice: Record<string, number> = {};
    products.forEach((p) => {
      const existingStat = todaySession?.items[p.id];
      // Default to 30 for all products to ensure everything is in-stock by default
      initialQty[p.id] = existingStat !== undefined ? existingStat.publishedQuantity : 30;
      initialPrice[p.id] = p.price;
    });
    setQuantities(initialQty);
    setPrices(initialPrice);
    if (todaySession?.notes) {
      setNotes(todaySession.notes);
    }
  }, [todaySession, products]);

  const handleQtyChange = (productId: string, val: string) => {
    const num = Math.max(0, parseInt(val, 10) || 0);
    setQuantities((prev) => ({ ...prev, [productId]: num }));
  };

  const handlePriceChange = (productId: string, val: string) => {
    const num = Math.max(1, parseInt(val, 10) || 0);
    setPrices((prev) => ({ ...prev, [productId]: num }));
  };

  const handleSavePrice = (productId: string) => {
    const newPrice = prices[productId];
    if (newPrice && newPrice > 0) {
      updateProduct(productId, { price: newPrice });
      setPriceSaveStatus((prev) => ({ ...prev, [productId]: true }));
      setEditingPriceId(null);
      setTimeout(() => {
        setPriceSaveStatus((prev) => ({ ...prev, [productId]: false }));
      }, 2500);
      setStatusMessage({
        type: 'success',
        text: `Price updated successfully to ₹${newPrice}!`,
      });
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  // Bulk set stock for currently filtered products
  const handleBulkSetStock = (qty: number) => {
    setQuantities((prev) => {
      const next = { ...prev };
      filteredProducts.forEach((p) => {
        next[p.id] = qty;
      });
      return next;
    });
    setStatusMessage({
      type: 'success',
      text: `Updated published stock to ${qty} for ${filteredProducts.length} filtered products! Click "Publish Daily Stock" to apply.`,
    });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // 1-Click: Ensure all Amul items are 100% available with 30 units
  const handleMakeAllAmulAvailable = () => {
    const amulItems = products.filter((p) => p.brandId === 'amul' && p.isActive);
    setQuantities((prev) => {
      const next = { ...prev };
      amulItems.forEach((p) => {
        next[p.id] = 30;
      });
      return next;
    });
    setSelectedBrand('amul');
    setStatusMessage({
      type: 'success',
      text: `All ${amulItems.length} official Amul items set to 30 units in stock! Click "Publish Daily Stock" to save.`,
    });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleSaveDraft = () => {
    saveDailyStockDraft(todayDateStr, quantities, notes);
    setStatusMessage({ type: 'success', text: 'Daily stock draft saved successfully!' });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handlePublish = () => {
    publishDailyStock(todayDateStr, quantities, 'Admin Store Manager', notes);
    setStatusMessage({
      type: 'success',
      text: "Daily stock PUBLISHED! All products are now in-stock and active for customers (12 PM - 6 PM IST).",
    });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const filteredProducts = products.filter((p) => {
    if (!p.isActive) return false;
    if (selectedBrand !== 'all' && p.brandId !== selectedBrand) return false;
    if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.volume.toLowerCase().includes(q);
    }
    return true;
  });

  // Calculate high-level stats
  const totalInStock = filteredProducts.filter((p) => {
    const stat = todaySession?.items[p.id];
    const pub = quantities[p.id] !== undefined ? quantities[p.id] : stat?.publishedQuantity || 0;
    const sold = stat?.soldQuantity || 0;
    const res = stat?.reservedQuantity || 0;
    return pub - sold - res > 0;
  }).length;

  const totalOutOfStock = filteredProducts.length - totalInStock;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
                Daily Stock & Price Management
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase ${
                  todaySession?.status === 'published'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}
              >
                {todaySession?.status === 'published' ? 'PUBLISHED (LIVE)' : 'DRAFT (LOCKED)'}
              </span>
            </div>
            <p className="text-xs text-neutral-500 font-medium mt-0.5">
              Session Date: <strong>{todayDateStr}</strong> • Control brand-wise and category-wise stock & update prices instantly
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveDraft}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-800 text-xs font-bold transition-colors shadow-2xs"
            >
              <Save className="w-3.5 h-3.5 text-neutral-600" />
              <span>Save Draft</span>
            </button>
            <button
              onClick={handlePublish}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-brand-orange hover:bg-brand-orangeHover text-white text-xs font-bold transition-all shadow-sm shadow-brand-orange/30"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Publish Daily Stock</span>
            </button>
          </div>
        </div>

        {/* Status Alert */}
        {statusMessage && (
          <div
            className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-2xs ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                : 'bg-rose-50 text-rose-900 border border-rose-200'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Quick KPI Overview Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-3.5 rounded-2xl border border-neutral-200/80 shadow-2xs">
            <span className="text-[11px] font-bold text-neutral-500 block">Total Items Filtered</span>
            <span className="text-xl font-black text-neutral-900 mt-0.5 block">{filteredProducts.length}</span>
          </div>
          <div className="bg-white p-3.5 rounded-2xl border border-neutral-200/80 shadow-2xs">
            <span className="text-[11px] font-bold text-emerald-600 block">Available In Stock</span>
            <span className="text-xl font-black text-emerald-700 mt-0.5 block">{totalInStock}</span>
          </div>
          <div className="bg-white p-3.5 rounded-2xl border border-neutral-200/80 shadow-2xs">
            <span className="text-[11px] font-bold text-rose-600 block">Out of Stock</span>
            <span className="text-xl font-black text-rose-700 mt-0.5 block">{totalOutOfStock}</span>
          </div>
          <div className="bg-gradient-to-br from-brand-orange/10 to-amber-500/5 p-3.5 rounded-2xl border border-brand-orange/30 shadow-2xs flex flex-col justify-between">
            <span className="text-[11px] font-bold text-brand-orange block">One-Click Action</span>
            <button
              onClick={handleMakeAllAmulAvailable}
              className="mt-1 w-full text-[11px] font-black bg-brand-orange hover:bg-brand-orangeHover text-white py-1 px-2 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-xs"
            >
              <Zap className="w-3 h-3" />
              <span>Make All Amul In-Stock</span>
            </button>
          </div>
        </div>

        {/* Brand Tabs (Brand-Wise Filtering) */}
        <div>
          <label className="text-[11px] font-black uppercase tracking-wider text-neutral-500 mb-2 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5" />
            <span>1. Filter by Brand:</span>
          </label>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setSelectedBrand('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                selectedBrand === 'all'
                  ? 'bg-neutral-900 text-white'
                  : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              All 5 Brands ({products.length})
            </button>
            {brands.map((b) => {
              const brandCount = products.filter((p) => p.brandId === b.slug && p.isActive).length;
              return (
                <button
                  key={b.id}
                  onClick={() => setSelectedBrand(b.slug)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-2 ${
                    selectedBrand === b.slug
                      ? 'bg-brand-orange text-white shadow-xs'
                      : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  <img src={b.logo} alt={b.name} className="w-4 h-4 object-contain rounded-full bg-white p-0.5" />
                  <span>{b.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    selectedBrand === b.slug ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-600'
                  }`}>
                    {brandCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Category Tabs (Category-Wise Stock Updation) */}
        <div>
          <label className="text-[11px] font-black uppercase tracking-wider text-neutral-500 mb-2 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            <span>2. Filter & Manage by Category:</span>
          </label>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-brand-purple text-white'
                  : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              All Categories
            </button>
            {CATEGORIES.map((cat) => {
              const catCount = products.filter(
                (p) => p.category === cat && (selectedBrand === 'all' || p.brandId === selectedBrand) && p.isActive
              ).length;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    selectedCategory === cat
                      ? 'bg-brand-purple text-white shadow-xs'
                      : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  <span>{cat}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    selectedCategory === cat ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-600'
                  }`}>
                    {catCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search & Bulk Stock Operations Bar */}
        <div className="bg-white p-3.5 rounded-2xl border border-neutral-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search ice cream name, volume..."
              className="w-full bg-neutral-50 border border-neutral-300 rounded-xl pl-9 pr-3 py-1.5 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-brand-orange"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <span className="text-[11px] font-bold text-neutral-600 whitespace-nowrap">
              Bulk Stock for Filtered ({filteredProducts.length} items):
            </span>
            <input
              type="number"
              min={0}
              value={bulkQtyValue}
              onChange={(e) => setBulkQtyValue(Math.max(0, parseInt(e.target.value, 10) || 0))}
              className="w-16 bg-neutral-50 border border-neutral-300 rounded-lg px-2 py-1 text-xs font-bold text-center text-neutral-900"
            />
            <button
              onClick={() => handleBulkSetStock(bulkQtyValue)}
              className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold transition-colors whitespace-nowrap shadow-xs"
            >
              Apply to All Filtered
            </button>
          </div>
        </div>

        {/* Inventory Matrix Table */}
        <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Ice Cream Product</th>
                  <th className="py-3 px-4">Brand</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 w-36">Selling Price (Editable)</th>
                  <th className="py-3 px-4 w-32">Published Stock</th>
                  <th className="py-3 px-4">Sold</th>
                  <th className="py-3 px-4">Reserved</th>
                  <th className="py-3 px-4">Available</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredProducts.map((p) => {
                  const stat = todaySession?.items[p.id];
                  const published = quantities[p.id] !== undefined ? quantities[p.id] : stat?.publishedQuantity || 0;
                  const sold = stat?.soldQuantity || 0;
                  const reserved = stat?.reservedQuantity || 0;
                  const available = Math.max(0, published - sold - reserved);
                  const currentPrice = prices[p.id] !== undefined ? prices[p.id] : p.price;
                  const isPriceSaved = priceSaveStatus[p.id];

                  return (
                    <tr key={p.id} className="hover:bg-neutral-50/70 transition-colors">
                      {/* Product Name & Visual Wrapper Image */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-11 h-11 rounded-xl object-contain bg-white border border-neutral-200/80 p-1 flex-shrink-0 shadow-2xs"
                          />
                          <div>
                            <span className="font-bold text-neutral-900 block truncate max-w-[220px]">
                              {p.name}
                            </span>
                            <span className="text-[10px] text-neutral-400">{p.volume}</span>
                          </div>
                        </div>
                      </td>

                      {/* Brand */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-neutral-100 font-bold text-[10px] text-neutral-700">
                          {p.brandName}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 font-medium text-neutral-600">
                        {p.category}
                      </td>

                      {/* Selling Price - INLINE EDITABLE */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-neutral-500">₹</span>
                          <input
                            type="number"
                            min={1}
                            value={currentPrice}
                            onChange={(e) => handlePriceChange(p.id, e.target.value)}
                            onFocus={() => setEditingPriceId(p.id)}
                            className="w-16 bg-neutral-50 border border-neutral-300 rounded-lg px-2 py-1 text-xs font-black text-neutral-900 text-center focus:outline-none focus:ring-1 focus:ring-brand-purple"
                          />
                          <button
                            onClick={() => handleSavePrice(p.id)}
                            title="Save updated price"
                            className={`p-1 rounded-md transition-colors ${
                              isPriceSaved
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                            }`}
                          >
                            {isPriceSaved ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Save className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Published Stock Input */}
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          min={0}
                          value={published}
                          onChange={(e) => handleQtyChange(p.id, e.target.value)}
                          className="w-20 bg-neutral-50 border border-neutral-300 rounded-lg px-2.5 py-1 text-xs font-bold text-neutral-900 text-center focus:outline-none focus:ring-1 focus:ring-brand-orange"
                        />
                      </td>

                      {/* Sold Units */}
                      <td className="py-3 px-4 font-mono font-bold text-neutral-600">
                        {sold}
                      </td>

                      {/* Reserved Units */}
                      <td className="py-3 px-4 font-mono font-bold text-amber-600">
                        {reserved}
                      </td>

                      {/* Available Stock */}
                      <td className="py-3 px-4">
                        <span
                          className={`font-mono font-black text-sm ${
                            available <= 0
                              ? 'text-rose-600'
                              : available <= 5
                              ? 'text-amber-600'
                              : 'text-emerald-600'
                          }`}
                        >
                          {available}
                        </span>
                      </td>

                      {/* Stock Status Badge */}
                      <td className="py-3 px-4">
                        {available <= 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                            Out of Stock
                          </span>
                        ) : available <= 5 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            Low Stock
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Healthy ({available})
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Bottom Action Footer */}
          <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-neutral-500 font-medium">
              Showing {filteredProducts.length} ice cream products across selected filters.
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveDraft}
                className="px-4 py-2 rounded-xl bg-white border border-neutral-300 text-neutral-800 text-xs font-bold hover:bg-neutral-100 transition-colors shadow-2xs"
              >
                Save Draft
              </button>
              <button
                onClick={handlePublish}
                className="px-5 py-2 rounded-xl bg-brand-orange text-white text-xs font-bold hover:bg-brand-orangeHover transition-all shadow-sm"
              >
                Publish Stock for Customers
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
