import React, { useState } from 'react';
import { Star, Heart, Plus, Minus, Check, AlertTriangle } from 'lucide-react';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { useStore } from '../../context/StoreContext';
import { useOrderTiming } from '../../context/OrderTimingContext';
import { formatINR } from '../../lib/utils';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, updateQuantity, getItemQuantity } = useCart();
  const { getAvailableStock } = useStore();
  const { isOrderingAllowed } = useOrderTiming();

  const [isFavorite, setIsFavorite] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [imgSrc, setImgSrc] = useState(product.image);

  React.useEffect(() => {
    setImgSrc(product.image);
  }, [product.image]);

  const availableStock = getAvailableStock(product.id);
  const currentCartQty = getItemQuantity(product.id);
  const isOutOfStock = availableStock <= 0;
  const isLowStock = availableStock > 0 && availableStock <= 5;

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 2500);
  };

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isOrderingAllowed) {
      showFeedback('Ordering is closed (12 PM - 6 PM)');
      return;
    }

    if (isOutOfStock) {
      showFeedback('Out of stock today');
      return;
    }

    const res = addToCart(product, 1);
    if (!res.success && res.message) {
      showFeedback(res.message);
    }
  };

  const handleIncrease = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isOrderingAllowed) {
      showFeedback('Ordering is closed');
      return;
    }

    const res = updateQuantity(product.id, currentCartQty + 1);
    if (!res.success && res.message) {
      showFeedback(res.message);
    }
  };

  const handleDecrease = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    updateQuantity(product.id, currentCartQty - 1);
  };

  const getBadgeStyle = () => {
    switch (product.badge) {
      case 'BESTSELLER':
        return 'bg-[#3E1268] text-white font-black';
      case 'POPULAR':
        return 'bg-[#FF9E1B] text-white font-black';
      case 'SAVE 15%':
        return 'bg-[#4D1782] text-white font-black';
      default:
        return 'bg-[#3E1268] text-white font-black';
    }
  };

  return (
    <div className="relative bg-white rounded-[24px] border border-[#EDE6DA] p-3 sm:p-3.5 shadow-card hover:shadow-elevated transition-all duration-200 flex flex-col justify-between group">
      {/* Top row: Badge and Wishlist Heart */}
      <div className="flex items-center justify-between mb-2">
        {product.badge ? (
          <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full ${getBadgeStyle()}`}>
            {product.badge}
          </span>
        ) : (
          <span className="text-[9px] font-bold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
            {product.category}
          </span>
        )}

        <button
          onClick={(e) => {
            e.preventDefault();
            setIsFavorite(!isFavorite);
          }}
          className="p-1 rounded-full text-neutral-300 hover:text-brand-red hover:bg-neutral-50 transition-colors"
          title="Save to favorites"
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-brand-red text-brand-red' : ''}`} />
        </button>
      </div>

      {/* Product Image container */}
      <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-white/90 border border-neutral-100 mb-2.5 flex items-center justify-center p-2">
        <img
          src={imgSrc}
          alt={product.name}
          className={`w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 ${
            isOutOfStock ? 'grayscale opacity-60' : ''
          }`}
          loading="lazy"
          onError={() => {
            const localFallback = `/products/amul/${product.slug.replace(/^p-amul-/, '')}.png`;
            if (imgSrc !== localFallback && product.brandId === 'amul') {
              setImgSrc(localFallback);
            } else if (imgSrc !== '/brands/amul.jpg') {
              setImgSrc('/brands/amul.jpg');
            }
          }}
        />

        {/* Brand Tag Pill on image */}
        <span className="absolute bottom-1.5 left-1.5 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-md text-[10px] font-bold text-neutral-700 shadow-sm">
          {product.brandName}
        </span>

        {/* Out of stock overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-neutral-900/60 flex items-center justify-center p-2 text-center">
            <span className="text-white text-xs font-bold uppercase tracking-wider bg-brand-red px-2.5 py-1 rounded-full shadow">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="flex-1 flex flex-col">
        {/* Rating and Volume */}
        <div className="flex items-center justify-between text-[11px] text-neutral-500 mb-1">
          <div className="flex items-center gap-1 font-semibold text-amber-500">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{product.rating.toFixed(1)}</span>
            <span className="text-neutral-400 font-normal">({product.ratingCount})</span>
          </div>
          <span className="text-neutral-400 font-medium">{product.volume}</span>
        </div>

        {/* Title */}
        <h4 className="text-xs sm:text-sm font-bold text-neutral-800 line-clamp-1 group-hover:text-brand-red transition-colors mb-0.5" title={product.name}>
          {product.name}
        </h4>

        {/* Description snippet */}
        <p className="text-[11px] text-neutral-500 line-clamp-1 mb-2">
          {product.description}
        </p>

        {/* Stock status indicator */}
        <div className="mb-2">
          {isOutOfStock ? (
            <span className="text-[10px] font-semibold text-rose-600 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              <span>Sold out for today</span>
            </span>
          ) : isLowStock ? (
            <span className="text-[10px] font-semibold text-amber-600 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              <span>Only {availableStock} left in shop</span>
            </span>
          ) : (
            <span className="text-[10px] font-medium text-emerald-600 flex items-center gap-1">
              <Check className="w-3 h-3" />
              <span>{availableStock} in stock today</span>
            </span>
          )}
        </div>

        {/* Temporary Feedback Notification */}
        {feedbackMsg && (
          <div className="text-[10px] font-semibold text-brand-red bg-rose-50 border border-rose-100 rounded-lg p-1 text-center mb-1 animate-pulse">
            {feedbackMsg}
          </div>
        )}

        {/* Bottom row: Price and Add / Quantity Stepper matching Reference Image 6 */}
        <div className="flex items-center justify-between pt-1 mt-auto border-t border-neutral-100">
          <div>
            <span className="text-[10px] text-neutral-400 block font-medium">Price</span>
            <span className="text-sm sm:text-base font-extrabold text-neutral-900">
              {formatINR(product.price)}
            </span>
          </div>

          {/* If already in cart, show interactive stepper; otherwise show Reference Image 6 orange '+' button */}
          {currentCartQty > 0 ? (
            <div className="inline-flex items-center bg-brand-cream border border-brand-orange/40 rounded-full p-0.5 shadow-sm">
              <button
                onClick={handleDecrease}
                className="w-7 h-7 rounded-full bg-white hover:bg-neutral-100 text-neutral-800 flex items-center justify-center font-bold text-xs transition-colors shadow-xs"
                title="Decrease"
              >
                <Minus className="w-3.5 h-3.5 text-neutral-700" />
              </button>
              <span className="w-6 text-center text-xs font-extrabold text-brand-dark">
                {currentCartQty}
              </span>
              <button
                onClick={handleIncrease}
                disabled={isOutOfStock || currentCartQty >= availableStock}
                className="w-7 h-7 rounded-full bg-brand-orange hover:bg-brand-orangeHover disabled:opacity-50 text-white flex items-center justify-center font-bold text-xs transition-colors shadow-xs"
                title="Increase"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleAdd}
              disabled={isOutOfStock}
              className={`w-9 h-9 rounded-full flex items-center justify-center text-white transition-all shadow-md ${
                isOutOfStock
                  ? 'bg-neutral-300 cursor-not-allowed'
                  : 'bg-brand-orange hover:bg-brand-orangeHover hover:scale-105 active:scale-95 shadow-brand-orange/30'
              }`}
              title={isOutOfStock ? 'Out of stock' : 'Add to pickup cart'}
            >
              <Plus className="w-5 h-5 font-bold" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
