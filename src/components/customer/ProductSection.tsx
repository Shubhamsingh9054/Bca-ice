import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../../types';
import { ProductCard } from './ProductCard';

interface ProductSectionProps {
  title: string;
  subtitle?: string;
  viewAllLink?: string;
  products: Product[];
  icon?: string;
}

export const ProductSection: React.FC<ProductSectionProps> = ({
  title,
  subtitle,
  viewAllLink,
  products,
  icon,
}) => {
  if (products.length === 0) return null;

  return (
    <section className="w-full max-w-6xl mx-auto px-4 py-3 sm:py-4">
      {/* Header: Left title, Right View All - strictly mobile responsive */}
      <div className="flex items-center justify-between gap-3 mb-2.5 sm:mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg sm:text-xl font-extrabold text-[#1F162B] tracking-tight flex items-center gap-1.5 truncate">
            {icon && <span className="text-base sm:text-lg shrink-0">{icon}</span>}
            <span className="truncate">{title}</span>
          </h3>
          {subtitle && (
            <p className="text-xs text-neutral-500 font-normal line-clamp-1 mt-0.5">{subtitle}</p>
          )}
        </div>

        {viewAllLink && (
          <Link
            to={viewAllLink}
            className="shrink-0 whitespace-nowrap text-xs sm:text-sm font-bold text-[#42126D] hover:text-[#5B1F94] transition-colors inline-flex items-center gap-1 group py-1 active:scale-95"
          >
            <span>View All</span>
            <span className="group-hover:translate-x-0.5 transition-transform text-sm leading-none">&rarr;</span>
          </Link>
        )}
      </div>

      {/* Grid of Product Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};
