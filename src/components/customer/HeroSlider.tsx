import React from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import { ArrowRight } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

import 'swiper/css';
import 'swiper/css/pagination';

export const HeroSlider: React.FC = () => {
  const { banners } = useStore();
  const activeBanners = banners.filter((b) => b.isActive).sort((a, b) => a.displayOrder - b.displayOrder);

  // Fallback banner matching Image 1
  const displayBanners = activeBanners.length > 0 ? activeBanners : [
    {
      id: 'default-hero',
      title: 'BOLD FLAVOURS. EPIC CRAVINGS.',
      subtitle: 'Live Thanda',
      description: 'Your favorites, made better.',
      ctaText: 'Order Now',
      ctaLink: '/menu',
      image: 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?auto=format&fit=crop&w=800&q=80',
      bgGradient: 'from-[#23073C] via-[#3B1163] to-[#4F1787]',
      brandSlug: 'all',
      displayOrder: 1,
      isActive: true,
    }
  ];

  return (
    <div className="w-full max-w-6xl mx-auto px-4 pt-1 sm:pt-2 pb-1 sm:pb-2">
      <Swiper
        modules={[Autoplay, Pagination]}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        pagination={{
          clickable: true,
          bulletActiveClass: '!bg-[#FF9E1B] !w-4 sm:!w-6 !rounded-full transition-all',
          bulletClass: 'inline-block w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white/40 mx-0.5 sm:mx-1 cursor-pointer transition-all',
        }}
        loop={true}
        className="rounded-2xl sm:rounded-[28px] overflow-hidden shadow-card"
      >
        {displayBanners.map((banner, idx) => (
          <SwiperSlide key={banner.id || idx}>
            <div className="relative min-h-[148px] sm:min-h-[250px] md:min-h-[280px] w-full rounded-2xl sm:rounded-[28px] overflow-hidden bg-gradient-to-br from-[#23073C] via-[#3B1163] to-[#4F1787] text-white flex items-center justify-between p-3.5 sm:p-7 md:p-8">
              {/* Subtle background texture overlay */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,158,27,0.15),transparent_50%)] pointer-events-none" />

              {/* Left Column: Bold Typography & Cursive Accent */}
              <div className="relative z-10 max-w-[62%] sm:max-w-md space-y-1 sm:space-y-2">
                <div className="space-y-0.5">
                  <h2 className="text-sm sm:text-2xl md:text-3xl font-black tracking-tight text-white uppercase leading-[1.15]">
                    BOLD FLAVOURS.
                    <span className="block">EPIC CRAVINGS.</span>
                  </h2>
                  <span className="font-script text-xl sm:text-3xl md:text-4xl text-[#FFB800] block -mt-0.5 sm:-mt-1 font-bold transform -rotate-2 origin-left">
                    Live Thanda
                  </span>
                </div>

                <p className="text-[10px] sm:text-xs md:text-sm text-purple-200/90 font-medium line-clamp-1 sm:line-clamp-2">
                  {banner.description || 'Your favorites, made better.'}
                </p>

                <div className="pt-1 sm:pt-2">
                  <Link
                    to={banner.ctaLink || '/menu'}
                    className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-full bg-[#FF9E1B] hover:bg-[#E68A0D] text-white text-[11px] sm:text-xs md:text-sm font-extrabold shadow-md sm:shadow-lg shadow-[#FF9E1B]/30 hover:scale-105 active:scale-95 transition-all group"
                  >
                    <span>{banner.ctaText || 'Order Now'}</span>
                    <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                      <ArrowRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                    </span>
                  </Link>
                </div>
              </div>

              {/* Right Column: Floating Mouthwatering Ice Cream Cutouts */}
              <div className="relative z-10 w-[36%] sm:w-56 md:w-64 h-28 sm:h-48 md:h-56 flex items-center justify-center">
                <div className="relative w-full h-full flex items-center justify-center">
                  {/* Subtle Glow */}
                  <div className="absolute w-20 h-20 sm:w-32 sm:h-32 rounded-full bg-[#FF9E1B]/20 blur-xl sm:blur-2xl" />

                  {/* Primary Floating Ice Cream Image */}
                  <img
                    src={banner.image}
                    alt={banner.title}
                    className="w-full h-full object-contain filter drop-shadow-[0_8px_18px_rgba(0,0,0,0.5)] transform hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

