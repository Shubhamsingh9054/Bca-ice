import React, { useState } from 'react';
import { Image as ImageIcon, Plus, Trash2, Edit } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useStore } from '../../context/StoreContext';
import { HeroBanner, BrandId } from '../../types';

export const AdminBanners: React.FC = () => {
  const { banners, updateBanner, createBanner, deleteBanner, brands } = useStore();
  const [editingBanner, setEditingBanner] = useState<HeroBanner | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [desc, setDesc] = useState('');
  const [image, setImage] = useState('');
  const [ctaText, setCtaText] = useState('Order Now');
  const [ctaLink, setCtaLink] = useState('/brand/amul');
  const [brandSlug, setBrandSlug] = useState<BrandId | 'all'>('amul');

  const openAdd = () => {
    setEditingBanner(null);
    setTitle('');
    setSubtitle('Special Collection');
    setDesc('');
    setImage('https://images.unsplash.com/photo-1580915411954-282cb1b0d780?auto=format&fit=crop&w=1200&q=80');
    setCtaText('Order Now');
    setCtaLink('/brand/amul');
    setBrandSlug('amul');
    setIsAdding(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBanner) {
      updateBanner(editingBanner.id, {
        title,
        subtitle,
        description: desc,
        image,
        ctaText,
        ctaLink,
        brandSlug,
      });
    } else {
      createBanner({
        title,
        subtitle,
        description: desc,
        image,
        bgGradient: 'from-neutral-900 to-neutral-800',
        ctaText,
        ctaLink,
        brandSlug,
        displayOrder: banners.length + 1,
        isActive: true,
      });
    }
    setIsAdding(false);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
              Promotional Banners
            </h1>
            <p className="text-xs text-neutral-500 font-medium mt-0.5">
              Control the top hero promotional slider on the customer homepage
            </p>
          </div>
          <button
            onClick={openAdd}
            className="px-4 py-2.5 rounded-xl bg-brand-orange hover:bg-brand-orangeHover text-white text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Banner</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {banners.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-3xl p-5 border border-neutral-200 shadow-2xs space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="w-full h-36 rounded-2xl overflow-hidden bg-neutral-100 relative">
                  <img src={b.image} alt={b.title} className="w-full h-full object-cover" />
                  <span className="absolute top-2 left-2 bg-neutral-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                    {b.brandSlug.toUpperCase()}
                  </span>
                </div>
                <h3 className="font-extrabold text-neutral-900 text-sm">{b.title}</h3>
                <p className="text-xs text-neutral-500 line-clamp-2">{b.description}</p>
              </div>

              <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
                <button
                  onClick={() => updateBanner(b.id, { isActive: !b.isActive })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                    b.isActive
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-neutral-100 text-neutral-500'
                  }`}
                >
                  {b.isActive ? 'Active' : 'Disabled'}
                </button>

                <button
                  onClick={() => deleteBanner(b.id)}
                  className="p-1.5 rounded-lg hover:bg-rose-50 text-neutral-400 hover:text-rose-600 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal */}
        {isAdding && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <h3 className="font-bold text-neutral-900 text-base">Add Banner</h3>
              <form onSubmit={handleSave} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Banner Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Amul Special Collection"
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-neutral-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Subtitle</label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-neutral-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-neutral-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Image URL</label>
                  <input
                    type="url"
                    required
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-neutral-900 font-mono text-[11px]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-4 py-2 rounded-xl bg-neutral-100 text-neutral-700 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-brand-orange text-white font-bold hover:bg-brand-orangeHover"
                  >
                    Save Banner
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
