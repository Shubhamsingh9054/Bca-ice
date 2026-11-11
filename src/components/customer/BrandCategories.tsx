import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';

export const BrandCategories: React.FC = () => {
  const { brands } = useStore();
  const { brandSlug } = useParams<{ brandSlug?: string }>();

  // Only the 5 official brands sorted by display order
  const activeBrands = brands
    .filter((b) => b.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .slice(0, 5);

  return (
    <section className="w-full max-w-6xl mx-auto px-3 sm:px-6 py-2.5">
      {/* 5 Official Brands: Larger circles that perfectly fit screen width with zero scrolling */}
      <div className="grid grid-cols-5 gap-2 sm:gap-4 md:gap-5 items-center justify-items-center max-w-2xl mx-auto w-full">
        {activeBrands.map((brand) => {
          const isSelected = brandSlug === brand.slug;
          return (
            <Link
              key={brand.id}
              to={`/brand/${brand.slug}`}
              className="w-full flex items-center justify-center group focus:outline-none"
              title={`${brand.name} Ice Creams`}
            >
              <div
                className={`w-full aspect-square max-w-[66px] sm:max-w-[84px] md:max-w-[90px] rounded-full p-2 sm:p-3 flex items-center justify-center bg-white shadow-squircle transition-all duration-200 group-hover:scale-108 active:scale-95 relative ${
                  isSelected
                    ? 'ring-3 ring-[#FF9E1B] border-transparent shadow-md scale-105'
                    : 'border border-[#EDE6DA] hover:border-[#FF9E1B]/50'
                }`}
              >
                <img
                  src={brand.logo}
                  alt={brand.name}
                  className="w-full h-full object-contain filter group-hover:brightness-105 transition-all"
                  loading="lazy"
                />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};



