import React, { useState } from 'react';
import { Layers, Edit, Check, Eye } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useStore } from '../../context/StoreContext';
import { Brand } from '../../types';

export const AdminBrands: React.FC = () => {
  const { brands, updateBrand, products } = useStore();
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [tagline, setTagline] = useState('');
  const [displayOrder, setDisplayOrder] = useState('1');

  const openEdit = (b: Brand) => {
    setEditingBrand(b);
    setTagline(b.tagline);
    setDisplayOrder(b.displayOrder.toString());
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBrand) return;
    updateBrand(editingBrand.id, {
      tagline,
      displayOrder: parseInt(displayOrder, 10) || 1,
    });
    setEditingBrand(null);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
            Brand Management
          </h1>
          <p className="text-xs text-neutral-500 font-medium mt-0.5">
            Manage the 5 official ice cream brands, logos, taglines and display ordering
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {brands.map((b) => {
            const count = products.filter((p) => p.brandId === b.slug).length;
            return (
              <div
                key={b.id}
                className="bg-white rounded-3xl p-5 border border-neutral-200 shadow-2xs space-y-4 flex flex-col justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-neutral-50 border border-neutral-200 p-2 flex items-center justify-center flex-shrink-0 shadow-2xs">
                    <img src={b.logo} alt={b.name} className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-neutral-900 text-base">{b.name}</h3>
                    <p className="text-xs text-neutral-500">{b.tagline}</p>
                    <span className="inline-block mt-1 text-[10px] bg-brand-cream text-brand-orange px-2 py-0.5 rounded-full font-bold">
                      {count} Products Listed
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
                  <span className="text-neutral-500 font-medium">Order: #{b.displayOrder}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateBrand(b.id, { isActive: !b.isActive })}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                        b.isActive
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                      }`}
                    >
                      {b.isActive ? 'Active' : 'Disabled'}
                    </button>
                    <button
                      onClick={() => openEdit(b)}
                      className="px-3 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-bold transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Edit Modal */}
        {editingBrand && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                <h3 className="font-bold text-neutral-900 text-base">Edit {editingBrand.name}</h3>
                <button
                  onClick={() => setEditingBrand(null)}
                  className="p-1 text-neutral-400 hover:text-neutral-700"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Tagline</label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-neutral-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Display Order</label>
                  <input
                    type="number"
                    min={1}
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-neutral-900"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={() => setEditingBrand(null)}
                    className="px-4 py-2 rounded-xl bg-neutral-100 text-neutral-700 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-brand-orange text-white font-bold hover:bg-brand-orangeHover"
                  >
                    Save Changes
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
