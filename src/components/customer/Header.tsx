import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, Bell, SlidersHorizontal } from 'lucide-react';
import { useCart } from '../../context/CartContext';

interface HeaderProps {
  onSearch?: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onSearch }) => {
  const navigate = useNavigate();
  const { totalItemsCount, setIsCartDrawerOpen } = useCart();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (onSearch) {
        onSearch(searchQuery.trim());
      } else {
        navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#EDE6DA]/70 transition-all">
      <div className="max-w-6xl mx-auto px-4 py-3">
        {/* Top Row: Mascot Logo on Left, Action Squircles on Right */}
        <div className="flex items-center justify-between gap-3 sm:gap-4">
          {/* Left: Official Mascot Logo Only (Big Size, Prominent & Beautiful) */}
          <Link to="/" className="flex items-center group shrink-0 py-0.5" title="BCA Ice Cream Wala">
            <img
              src="/bca-logo.png"
              alt="BCA Ice Cream Wala"
              className="h-13 sm:h-15 md:h-16 w-auto max-w-[210px] sm:max-w-[260px] md:max-w-[300px] object-contain group-hover:scale-105 transition-transform duration-200 drop-shadow-sm"
              style={{ height: '3.5rem' }}
            />
          </Link>

          {/* Right: Notification and Cart Squircles with Badges */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Notification Squircle */}
            <Link
              to="/orders"
              className="w-11 h-11 rounded-2xl bg-white border border-[#EDE6DA] shadow-squircle flex items-center justify-center text-neutral-800 hover:bg-neutral-50 active:scale-95 transition-all relative"
              title="Your Pickup Tokens"
            >
              <Bell className="w-5 h-5 text-neutral-800" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#42126D] text-white text-[9px] font-extrabold flex items-center justify-center shadow-xs">
                3
              </span>
            </Link>

            {/* Cart Squircle */}
            <button
              onClick={() => setIsCartDrawerOpen(true)}
              className="w-11 h-11 rounded-2xl bg-white border border-[#EDE6DA] shadow-squircle flex items-center justify-center text-neutral-800 hover:bg-neutral-50 active:scale-95 transition-all relative"
              title="View Cart"
            >
              <ShoppingBag className="w-5 h-5 text-neutral-800" />
              {totalItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#42126D] text-white text-[9px] font-extrabold flex items-center justify-center shadow-xs animate-pulse">
                  {totalItemsCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search Bar Row with Filter Squircle */}
        <form onSubmit={handleSearchSubmit} className="mt-3 flex items-center gap-2">
          <div className="flex-1 relative flex items-center">
            <Search className="w-4 h-4 text-neutral-400 absolute left-4 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your favorite ice cream or brand..."
              className="w-full bg-white pl-11 pr-4 py-3 rounded-2xl border border-[#EDE6DA] text-xs sm:text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#FF9E1B]/30 focus:border-[#FF9E1B] transition-all shadow-squircle"
            />
          </div>

          {/* Filter / Settings Button Squircle */}
          <button
            type="button"
            onClick={() => navigate('/menu')}
            className="w-12 h-12 rounded-2xl bg-white border border-[#EDE6DA] shadow-squircle flex items-center justify-center text-neutral-700 hover:text-[#42126D] hover:bg-neutral-50 active:scale-95 transition-all shrink-0"
            title="Filter Ice Creams"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </form>
      </div>
    </header>
  );
};



