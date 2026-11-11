import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ShoppingBag, AlertCircle, ArrowRight, MapPin } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useStore } from '../../context/StoreContext';
import { useOrderTiming } from '../../context/OrderTimingContext';
import { formatINR } from '../../lib/utils';

export const CartDrawer: React.FC = () => {
  const navigate = useNavigate();
  const {
    cartItems,
    isCartDrawerOpen,
    setIsCartDrawerOpen,
    updateQuantity,
    removeFromCart,
    subtotal,
    isMinimumMet,
    minOrderValue,
    deficitToMinimum,
    clearCart,
  } = useCart();

  const { getAvailableStock, settings } = useStore();
  const { isOrderingAllowed, windowStatus } = useOrderTiming();

  if (!isCartDrawerOpen) return null;

  const handleCheckoutClick = () => {
    setIsCartDrawerOpen(false);
    navigate('/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-neutral-950/60 backdrop-blur-xs transition-opacity"
        onClick={() => setIsCartDrawerOpen(false)}
      />

      {/* Slide-over panel */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-brand-border flex items-center justify-between bg-[#FFFDF9]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-brand-cream flex items-center justify-center text-brand-red">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-neutral-900 text-base">Your Pickup Cart</h3>
                <p className="text-[11px] text-neutral-500 font-medium">
                  {cartItems.length} {cartItems.length === 1 ? 'flavor' : 'flavors'} selected
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsCartDrawerOpen(false)}
              className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Shop Pickup Reminder Banner */}
          <div className="bg-brand-cream/60 px-4 py-2 border-b border-brand-border/60 flex items-center gap-2 text-xs text-neutral-700">
            <MapPin className="w-4 h-4 text-brand-red flex-shrink-0" />
            <div className="truncate">
              <span className="font-bold text-brand-red">Shop Pickup: </span>
              <span>{settings.shopName} (No home delivery)</span>
            </div>
          </div>

          {/* Timing Alert inside cart if closed */}
          {!isOrderingAllowed && (
            <div className="p-3 bg-rose-50 border-b border-rose-100 flex items-center gap-2 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <div className="flex-1">
                <span className="font-bold">Ordering Currently Closed: </span>
                <span>{windowStatus.headline}</span>
              </div>
            </div>
          )}

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-20 h-20 rounded-full bg-brand-cream flex items-center justify-center text-3xl">
                  🍦
                </div>
                <h4 className="font-extrabold text-neutral-800 text-base">Your cart is empty</h4>
                <p className="text-xs text-neutral-500 max-w-xs">
                  Discover royal kulfis, dark chocolate tubs, and crunchy cones from Amul, Havmor, Vadilal and more!
                </p>
                <button
                  onClick={() => setIsCartDrawerOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-brand-orange text-white text-xs font-bold hover:bg-brand-orangeHover transition-colors shadow-sm"
                >
                  Browse Ice Creams
                </button>
              </div>
            ) : (
              cartItems.map((item) => {
                const available = getAvailableStock(item.product.id);
                return (
                  <div
                    key={item.product.id}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-neutral-50 border border-brand-border/60 hover:border-brand-orange/30 transition-colors"
                  >
                    {/* Item Image */}
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-white flex-shrink-0 border border-neutral-100">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Item Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[10px] uppercase font-bold text-brand-red bg-red-50 px-1.5 py-0.2 rounded">
                          {item.product.brandName}
                        </span>
                        <span className="text-[10px] text-neutral-400 font-medium">
                          {item.product.volume}
                        </span>
                      </div>

                      <h5 className="text-xs font-bold text-neutral-900 truncate">
                        {item.product.name}
                      </h5>

                      <div className="text-xs font-extrabold text-neutral-800 mt-1">
                        {formatINR(item.unitPrice)}
                      </div>
                    </div>

                    {/* Quantity Stepper & Remove */}
                    <div className="flex flex-col items-end gap-1.5">
                      <div className="inline-flex items-center bg-white border border-brand-border rounded-full p-0.5 shadow-2xs">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="w-6 h-6 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-600 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-neutral-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          disabled={item.quantity >= available}
                          className="w-6 h-6 rounded-full hover:bg-neutral-100 disabled:opacity-40 flex items-center justify-center text-neutral-600 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-neutral-400 hover:text-rose-500 transition-colors p-1"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer & Checkout Area */}
          {cartItems.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-brand-border bg-[#FFFDF9] space-y-3">
              {/* Minimum Order Check Alert matching Section 5 */}
              {!isMinimumMet ? (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <div>
                    <span className="font-bold">Minimum order amount is ₹{minOrderValue}.</span>
                    <span className="block text-amber-700 mt-0.5 font-medium">
                      Add ₹{deficitToMinimum} more to enable pickup checkout.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between text-xs text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 font-semibold">
                  <span>✓ Minimum order requirement met</span>
                  <span>Shop pickup ready</span>
                </div>
              )}

              {/* Price Calculation breakdown */}
              <div className="space-y-1.5 text-xs text-neutral-600 pt-1">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-neutral-900">{formatINR(subtotal)}</span>
                </div>
                <div className="flex justify-between text-neutral-500">
                  <span>Delivery Charges</span>
                  <span className="text-brand-orange font-bold">₹0 (Shop Pickup)</span>
                </div>
                <div className="flex justify-between font-extrabold text-sm text-neutral-900 pt-1.5 border-t border-brand-border/60">
                  <span>Total Amount</span>
                  <span className="text-base text-brand-red">{formatINR(subtotal)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleCheckoutClick}
                disabled={!isMinimumMet || !isOrderingAllowed}
                className="w-full py-3 px-4 rounded-2xl bg-brand-orange hover:bg-brand-orangeHover disabled:bg-neutral-300 disabled:cursor-not-allowed text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-orange/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <span>Proceed to Pickup Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1">
                <span>Online payment via Razorpay</span>
                <button
                  onClick={clearCart}
                  className="hover:text-rose-500 transition-colors font-medium"
                >
                  Clear Cart
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
