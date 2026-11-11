import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, LayoutGrid, ShoppingBag, Tag, User } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useStore } from '../../context/StoreContext';

export const BottomNav: React.FC = () => {
  const { totalItemsCount, setIsCartDrawerOpen } = useCart();
  const { orders } = useStore();

  const activeOrdersCount = orders.filter(
    (o) => o.paymentStatus === 'paid' && o.pickupStatus !== 'picked_up'
  ).length;

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#EDE6DA] px-3 py-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] tap-highlight-none">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* 1. Home */}
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
              isActive
                ? 'text-[#42126D] font-extrabold'
                : 'text-neutral-400 hover:text-neutral-700 font-medium'
            }`
          }
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Home</span>
        </NavLink>

        {/* 2. Menu */}
        <NavLink
          to="/menu"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
              isActive
                ? 'text-[#42126D] font-extrabold'
                : 'text-neutral-400 hover:text-neutral-700 font-medium'
            }`
          }
        >
          <LayoutGrid className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Menu</span>
        </NavLink>

        {/* 3. Center Elevated Royal Purple Button (Order / Cart matching Image 1) */}
        <button
          onClick={() => setIsCartDrawerOpen(true)}
          className="flex flex-col items-center justify-center -mt-6 group focus:outline-none"
          title="Open Order Cart"
        >
          <div className="w-13 h-13 rounded-full bg-[#42126D] text-white flex items-center justify-center shadow-lg shadow-[#42126D]/40 group-hover:scale-105 active:scale-95 transition-all relative border-4 border-[#FAF7F2]">
            <ShoppingBag className="w-5 h-5 text-white" />
            {totalItemsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#FF9E1B] text-white text-[10px] font-black rounded-full flex items-center justify-center ring-2 ring-white animate-pulse">
                {totalItemsCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5 font-black text-[#42126D]">Order</span>
        </button>

        {/* 4. Offers */}
        <NavLink
          to="/offers"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
              isActive
                ? 'text-[#42126D] font-extrabold'
                : 'text-neutral-400 hover:text-neutral-700 font-medium'
            }`
          }
        >
          <Tag className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Offers</span>
        </NavLink>

        {/* 5. Profile */}
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
              isActive
                ? 'text-[#42126D] font-extrabold'
                : 'text-neutral-400 hover:text-neutral-700 font-medium'
            }`
          }
        >
          <User className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Profile</span>
        </NavLink>
      </div>
    </nav>
  );
};
