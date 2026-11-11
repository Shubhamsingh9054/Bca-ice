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
    <section className="w-full max-w-6xl mx-auto px-4 py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-base sm:text-lg font-extrabold text-neutral-900 tracking-tight flex items-center gap-1.5">
            {icon && <span>{icon}</span>}
            <span>{title}</span>
          </h3>
          {subtitle && (
            <p className="text-xs text-neutral-500 font-normal">{subtitle}</p>
          )}
        </div>

        {viewAllLink && (
          <Link
            to={viewAllLink}
            className="text-xs sm:text-sm font-black text-[#42126D] hover:text-[#5B1F94] transition-colors flex items-center gap-1 group"
          >
            <span>View All</span>
            <span className="group-hover:translate-x-0.5 transition-transform">&rarr;</span>
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
