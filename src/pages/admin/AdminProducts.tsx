import React, { useState } from 'react';
import { Package, Plus, Edit, Trash2, Check, X, Search, Sparkles, Filter, Layers, DollarSign, Save } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useStore } from '../../context/StoreContext';
import { Product, BrandId, IceCreamCategory } from '../../types';
import { formatINR } from '../../lib/utils';

const CATEGORIES: IceCreamCategory[] = [
  'Kulfi & Specialties',
  'Cones',
  'Bars & Sticks',
  'Cups',
  'Family Tubs',
];

export const AdminProducts: React.FC = () => {
  const { products, brands, createProduct, updateProduct, deleteProduct } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [inlinePrices, setInlinePrices] = useState<Record<string, number>>({});
  const [priceSaveStatus, setPriceSaveStatus] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formBrandId, setFormBrandId] = useState<BrandId>('amul');
  const [formCategory, setFormCategory] = useState<IceCreamCategory>('Kulfi & Specialties');
  const [formPrice, setFormPrice] = useState('30');
  const [formVolume, setFormVolume] = useState('60 ml');
  const [formImage, setFormImage] = useState('/products/amul/kulfi-badshahi-kulfi.png');
  const [formDesc, setFormDesc] = useState('');
  const [formBadge, setFormBadge] = useState<string>('POPULAR');
  const [formIsPopular, setFormIsPopular] = useState(true);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleInlinePriceChange = (productId: string, val: string) => {
    const num = Math.max(1, parseInt(val, 10) || 0);
    setInlinePrices((prev) => ({ ...prev, [productId]: num }));
  };

  const handleSaveInlinePrice = (p: Product) => {
    const newPrice = inlinePrices[p.id] ?? p.price;
    if (newPrice > 0) {
      updateProduct(p.id, { price: newPrice });
      setPriceSaveStatus((prev) => ({ ...prev, [p.id]: true }));
      setTimeout(() => {
        setPriceSaveStatus((prev) => ({ ...prev, [p.id]: false }));
      }, 2500);
      showToast(`Updated "${p.name}" price to ₹${newPrice}!`);
    }
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormBrandId('amul');
    setFormCategory('Kulfi & Specialties');
    setFormPrice('30');
    setFormVolume('60 ml');
    setFormImage('/products/amul/kulfi-badshahi-kulfi.png');
    setFormDesc('');
    setFormBadge('POPULAR');
    setFormIsPopular(true);
    setIsAddingNew(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormBrandId(p.brandId);
    setFormCategory(p.category);
    setFormPrice(p.price.toString());
    setFormVolume(p.volume);
    setFormImage(p.image);
    setFormDesc(p.description);
    setFormBadge(p.badge || '');
    setFormIsPopular(p.isPopular);
    setIsAddingNew(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const brand = brands.find((b) => b.slug === formBrandId);
    const brandName = brand ? brand.name : 'Amul';

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        name: formName,
        brandId: formBrandId,
        brandName,
        category: formCategory,
        price: parseFloat(formPrice) || 30,
        volume: formVolume,
        image: formImage,
        description: formDesc,
        badge: (formBadge as any) || undefined,
        isPopular: formIsPopular,
      });
      showToast(`Updated product "${formName}" successfully!`);
    } else {
      createProduct({
        name: formName,
        brandId: formBrandId,
        brandName,
        slug: formName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        category: formCategory,
        price: parseFloat(formPrice) || 30,
        volume: formVolume,
        image: formImage,
        description: formDesc,
        badge: (formBadge as any) || undefined,
        rating: 4.8,
        ratingCount: 120,
        isPopular: formIsPopular,
        isActive: true,
      });
      showToast(`Added new product "${formName}" successfully!`);
    }

    setIsAddingNew(false);
  };

  const filtered = products.filter((p) => {
    if (selectedBrand !== 'all' && p.brandId !== selectedBrand) return false;
    if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.brandName.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.volume.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
              Product Catalogue Management
            </h1>
            <p className="text-xs text-neutral-500 font-medium mt-0.5">
              Change selling prices, brand association, categories and active status with instant persistence
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="px-4 py-2.5 rounded-xl bg-brand-orange hover:bg-brand-orangeHover text-white text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Ice Cream</span>
          </button>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="p-3.5 rounded-2xl text-xs font-bold bg-emerald-50 text-emerald-900 border border-emerald-200 flex items-center gap-2 shadow-2xs">
            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* 1. Brand-Wise Filter Tabs */}
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
              const count = products.filter((p) => p.brandId === b.slug).length;
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
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Category-Wise Filter Tabs */}
        <div>
          <label className="text-[11px] font-black uppercase tracking-wider text-neutral-500 mb-2 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            <span>2. Filter by Category:</span>
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
              const count = products.filter(
                (p) => p.category === cat && (selectedBrand === 'all' || p.brandId === selectedBrand)
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
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search products by ice cream name, brand, volume or category..."
            className="w-full bg-white border border-neutral-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-brand-orange"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Ice Cream Product</th>
                  <th className="py-3 px-4">Brand</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 w-40">Price (Instant Update)</th>
                  <th className="py-3 px-4">Popular</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filtered.map((p) => {
                  const currentPrice = inlinePrices[p.id] !== undefined ? inlinePrices[p.id] : p.price;
                  const isSaved = priceSaveStatus[p.id];

                  return (
                    <tr key={p.id} className="hover:bg-neutral-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-11 h-11 rounded-xl object-contain bg-white border border-neutral-200/80 p-1 flex-shrink-0 shadow-2xs"
                            onError={(e) => {
                              const target = e.currentTarget;
                              const fallback = `/products/amul/${p.slug.replace(/^p-amul-/, '')}.png`;
                              if (!target.src.includes(fallback) && p.brandId === 'amul') {
                                target.src = fallback;
                              } else {
                                target.src = '/brands/amul.jpg';
                              }
                            }}
                          />
                          <div>
                            <span className="font-bold text-neutral-900 block truncate max-w-[220px]">
                              {p.name}
                            </span>
                            <span className="text-[10px] text-neutral-400">{p.volume}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-neutral-100 font-bold text-[10px] text-neutral-700">
                          {p.brandName}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-neutral-600 font-medium">{p.category}</td>

                      {/* INLINE PRICE CHANGER */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-neutral-500 text-xs">₹</span>
                          <input
                            type="number"
                            min={1}
                            value={currentPrice}
                            onChange={(e) => handleInlinePriceChange(p.id, e.target.value)}
                            className="w-18 bg-neutral-50 border border-neutral-300 rounded-lg px-2 py-1 text-xs font-black text-neutral-900 text-center focus:outline-none focus:ring-1 focus:ring-brand-purple"
                          />
                          <button
                            onClick={() => handleSaveInlinePrice(p)}
                            title="Save updated price"
                            className={`p-1 rounded-md transition-colors ${
                              isSaved
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                            }`}
                          >
                            {isSaved ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Save className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {p.isPopular ? (
                          <span className="text-amber-600 font-bold text-[11px] flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            <span>Popular</span>
                          </span>
                        ) : (
                          <span className="text-neutral-400 font-medium">Standard</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <button
                          onClick={() => updateProduct(p.id, { isActive: !p.isActive })}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-neutral-100 text-neutral-500'
                          }`}
                        >
                          {p.isActive ? 'Active' : 'Disabled'}
                        </button>
                      </td>

                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-600 transition-colors"
                          title="Edit full product details"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Archive ${p.name}? Historical order records will be preserved.`)) {
                              deleteProduct(p.id);
                              showToast(`Archived "${p.name}"`);
                            }
                          }}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-neutral-400 hover:text-rose-600 transition-colors"
                          title="Archive product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-neutral-50 border-t border-neutral-200 text-xs text-neutral-500 font-medium">
            Showing {filtered.length} of {products.length} total ice cream products.
          </div>
        </div>

        {/* Modal: Add / Edit Product */}
        {isAddingNew && (
          <div className="fixed inset-0 z-50 bg-neutral-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <h2 className="text-base font-black text-neutral-900">
                  {editingProduct ? 'Edit Ice Cream Product' : 'Add New Ice Cream'}
                </h2>
                <button
                  onClick={() => setIsAddingNew(false)}
                  className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Ice Cream Name</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Amul Badshahi Kulfi"
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-neutral-900 focus:outline-none focus:ring-1 focus:ring-brand-orange"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-neutral-700 block mb-1">Brand</label>
                    <select
                      value={formBrandId}
                      onChange={(e) => setFormBrandId(e.target.value as BrandId)}
                      className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-neutral-900 focus:outline-none focus:ring-1 focus:ring-brand-orange"
                    >
                      {brands.map((b) => (
                        <option key={b.id} value={b.slug}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-neutral-700 block mb-1">Category</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as IceCreamCategory)}
                      className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-neutral-900 focus:outline-none focus:ring-1 focus:ring-brand-orange"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-neutral-700 block mb-1">Selling Price (₹)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-neutral-900 focus:outline-none focus:ring-1 focus:ring-brand-orange"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-neutral-700 block mb-1">Volume / Packaging</label>
                    <input
                      type="text"
                      required
                      value={formVolume}
                      onChange={(e) => setFormVolume(e.target.value)}
                      placeholder="e.g. 60 ml, 120 ml, 1 Litre"
                      className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-neutral-900 focus:outline-none focus:ring-1 focus:ring-brand-orange"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Image URL / Local Asset Path</label>
                  <input
                    type="text"
                    required
                    value={formImage}
                    onChange={(e) => setFormImage(e.target.value)}
                    placeholder="e.g. /products/amul/kulfi-badshahi-kulfi.png"
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-neutral-900 focus:outline-none focus:ring-1 focus:ring-brand-orange"
                  />
                  {formImage && (
                    <div className="mt-2 flex items-center gap-2">
                      <img
                        src={formImage}
                        alt="Preview"
                        className="w-12 h-12 object-contain bg-white border border-neutral-200 rounded-lg p-1"
                        onError={(e) => {
                          (e.target as any).style.display = 'none';
                        }}
                      />
                      <span className="text-[10px] text-neutral-400">Packaging preview</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="Describe flavor notes and ingredients..."
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-neutral-900 focus:outline-none focus:ring-1 focus:ring-brand-orange"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="font-bold text-neutral-700 block mb-1">Badge Tag</label>
                    <select
                      value={formBadge}
                      onChange={(e) => setFormBadge(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-neutral-900 focus:outline-none focus:ring-1 focus:ring-brand-orange"
                    >
                      <option value="">No Badge</option>
                      <option value="BESTSELLER">BESTSELLER</option>
                      <option value="POPULAR">POPULAR</option>
                      <option value="SAVE 15%">SAVE 15%</option>
                      <option value="SPECIAL OFFER">SPECIAL OFFER</option>
                      <option value="NEW">NEW</option>
                    </select>
                  </div>

                  <div className="pt-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formIsPopular}
                        onChange={(e) => setFormIsPopular(e.target.checked)}
                        className="w-4 h-4 text-brand-orange rounded"
                      />
                      <span className="font-bold text-neutral-800">Show in Popular Picks</span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(false)}
                    className="px-4 py-2 rounded-xl bg-white border border-neutral-300 text-neutral-700 font-bold hover:bg-neutral-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-brand-orange hover:bg-brand-orangeHover text-white font-bold transition-colors shadow-xs"
                  >
                    {editingProduct ? 'Save Changes' : 'Create Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
