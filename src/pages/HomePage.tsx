import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, ShieldCheck, Flame } from 'lucide-react';
import { Header } from '../components/customer/Header';
import { TimingBanner } from '../components/customer/TimingBanner';
import { HeroSlider } from '../components/customer/HeroSlider';
import { BrandCategories } from '../components/customer/BrandCategories';
import { ProductSection } from '../components/customer/ProductSection';
import { BottomNav } from '../components/customer/BottomNav';
import { CartDrawer } from '../components/customer/CartDrawer';
import { useStore } from '../context/StoreContext';

export const HomePage: React.FC = () => {
  const { products } = useStore();

  const activeProducts = products.filter((p) => p.isActive);

  // Filter products by requested sections (Section 4.4)
  const popularIceCreams = activeProducts.filter((p) => p.isPopular);
  const amulProducts = activeProducts.filter((p) => p.brandId === 'amul');
  const havmorProducts = activeProducts.filter((p) => p.brandId === 'havmor');
  const creamBellProducts = activeProducts.filter((p) => p.brandId === 'cream-bell');
  const motherDairyProducts = activeProducts.filter((p) => p.brandId === 'mother-dairy');
  const vadilalProducts = activeProducts.filter((p) => p.brandId === 'vadilal');
  const specialOffers = activeProducts.filter((p) => p.badge === 'SAVE 15%' || p.badge === 'BESTSELLER');
  const recentlyAdded = [...activeProducts].reverse().slice(0, 4);

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-24 sm:pb-12 text-neutral-900">
      {/* Sticky Header with Logo, Search, and Cart Trigger */}
      <Header />

      {/* Main Container */}
      <main className="space-y-2">
        {/* Hero Promotional Banner Slider */}
        <HeroSlider />

        {/* 5 Circular Brand Categories matching Reference Image 1 */}
        <BrandCategories />

        {/* 1. Popular Picks (Most Popular Ice Creams) matching Image 1 */}
        <ProductSection
          title="Popular Picks"
          subtitle="Top customer favorites across Amul, Havmor, Cream Bell, Mother Dairy & Vadilal"
          viewAllLink="/menu?filter=popular"
          products={popularIceCreams.slice(0, 4)}
        />

        {/* 2. Exclusive Offer Lavender Banner matching Image 1 */}
        <div className="w-full max-w-6xl mx-auto px-4 py-3">
          <div className="relative rounded-[26px] overflow-hidden bg-[#F3E8FF] border border-[#E9D5FF] p-5 sm:p-7 flex items-center justify-between shadow-card">
            {/* Left Content */}
            <div className="space-y-1.5 max-w-[60%] sm:max-w-md z-10">
              <span className="inline-block text-[10px] font-black uppercase tracking-widest text-[#42126D]">
                EXCLUSIVE OFFER
              </span>
              <h3 className="text-xl sm:text-3xl font-black text-[#1F162B] tracking-tight leading-tight">
                UP TO 25% OFF
              </h3>
              <p className="text-xs text-neutral-500 font-medium">
                On selected combo packs &amp; family tubs
              </p>
              <div className="pt-2">
                <Link
                  to="/offers"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#42126D] hover:bg-[#340d57] text-white text-xs font-bold shadow-md shadow-[#42126D]/20 hover:scale-105 active:scale-95 transition-all group"
                >
                  <span>Order Now</span>
                  <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px] group-hover:translate-x-0.5 transition-transform">
                    &rarr;
                  </span>
                </Link>
              </div>
            </div>

            {/* Right Graphic: Combo image + 25% OFF purple circle badge */}
            <div className="relative flex items-center justify-end z-10">
              <img
                src="https://images.unsplash.com/photo-1570197788417-0e82375c9371?auto=format&fit=crop&w=400&q=80"
                alt="Combo Packs"
                className="w-28 h-24 sm:w-44 sm:h-32 object-contain drop-shadow-md rounded-2xl"
              />
              <div className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#42126D] text-white flex flex-col items-center justify-center shadow-lg border-2 border-white">
                <span className="text-xs sm:text-sm font-black leading-none">25%</span>
                <span className="text-[8px] sm:text-[9px] font-bold uppercase leading-none mt-0.5">OFF</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Amul Popular Ice Creams */}
        <ProductSection
          title="Amul Real Milk Delights"
          subtitle="The Taste of India – Royal Kulfi, Brownie Tubs & Vanilla"
          viewAllLink="/brand/amul"
          products={amulProducts}
          icon="🥛"
        />

        {/* 4. Havmor Popular Ice Creams */}
        <ProductSection
          title="Havmor Gourmet Indulgence"
          subtitle="Belgian Dark Chocolate, Black Forest & Hazelnut Cones"
          viewAllLink="/brand/havmor"
          products={havmorProducts}
          icon="🍫"
        />

        {/* 4. Cream Bell Popular Ice Creams */}
        <ProductSection
          title="Cream Bell Pure Indulgence"
          subtitle="Butterscotch Crunch, Wild Strawberry & Maxx Cones"
          viewAllLink="/brand/cream-bell"
          products={creamBellProducts}
          icon="🔔"
        />

        {/* 5. Mother Dairy Popular Ice Creams */}
        <ProductSection
          title="Mother Dairy Heritage"
          subtitle="Original Mango Dolly, Classic Chocobars & Cups"
          viewAllLink="/brand/mother-dairy"
          products={motherDairyProducts}
          icon="🥭"
        />

        {/* 6. Vadilal Popular Ice Creams */}
        <ProductSection
          title="Vadilal Royal Flavours"
          subtitle="Cassata Slices, Gourmet Bars & Royal Rajbhog"
          viewAllLink="/brand/vadilal"
          products={vadilalProducts}
          icon="👑"
        />

        {/* 7. Special Offers */}
        <ProductSection
          title="Special Value Offers"
          subtitle="Best seller scoops and value packs ready for shop pickup"
          viewAllLink="/offers"
          products={specialOffers.slice(0, 4)}
          icon="🏷️"
        />

        {/* 8. Recently Added Products */}
        <ProductSection
          title="Freshly Restocked Today"
          subtitle="Updated in today's daily inventory session"
          products={recentlyAdded}
          icon="✨"
        />
      </main>

      {/* Cart Slide-over Drawer */}
      <CartDrawer />

      {/* Sticky Mobile Bottom Navigation matching Reference Image 6 */}
      <BottomNav />
    </div>
  );
};
