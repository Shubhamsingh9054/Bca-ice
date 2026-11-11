import React, { useState } from 'react';
import { Clock, MapPin, AlertCircle, CheckCircle2, ChevronDown, Sliders } from 'lucide-react';
import { useOrderTiming } from '../../context/OrderTimingContext';
import { useStore } from '../../context/StoreContext';

export const TimingBanner: React.FC = () => {
  const { windowStatus, timeRemainingFormatted, setDemoTimeSlot, activeDemoSlot } = useOrderTiming();
  const { settings } = useStore();
  const [showDemoSelector, setShowDemoSelector] = useState(false);

  const getStatusColor = () => {
    switch (windowStatus.status) {
      case 'open':
        return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-800';
      case 'before_opening':
        return 'bg-amber-500/10 border-amber-500/20 text-amber-800';
      case 'stock_unpublished':
        return 'bg-amber-500/10 border-amber-500/20 text-amber-900';
      case 'after_closing':
      default:
        return 'bg-rose-500/10 border-rose-500/20 text-rose-800';
    }
  };

  const getDotColor = () => {
    switch (windowStatus.status) {
      case 'open':
        return 'bg-emerald-500 animate-pulse';
      case 'before_opening':
      case 'stock_unpublished':
        return 'bg-amber-500';
      case 'after_closing':
      default:
        return 'bg-rose-500';
    }
  };

  return (
    <div className="w-full bg-[#FAF7F2] border-b border-[#EDE6DA]/70">
      <div className="max-w-6xl mx-auto px-4 py-2">
        {/* Main Status Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          {/* Location & Pickup Announcement */}
          <div className="flex items-center gap-2 text-neutral-600 font-medium">
            <span className="flex items-center gap-1 text-[#42126D] font-bold">
              <MapPin className="w-3.5 h-3.5 text-[#FF9E1B]" />
              <span>Shop Pickup Counter:</span>
            </span>
            <span className="truncate max-w-[260px] sm:max-w-none text-neutral-700 font-medium">
              {settings.address}
            </span>
          </div>

          {/* Time & Window status with Demo Selector button */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${getStatusColor()}`}>
              <span className={`w-2 h-2 rounded-full ${getDotColor()}`} />
              <span>{windowStatus.badgeText}</span>
              {timeRemainingFormatted && (
                <span className="opacity-75 font-normal">({timeRemainingFormatted})</span>
              )}
            </div>

            {/* Test clock simulation switcher for testing */}
            <div className="relative">
              <button
                onClick={() => setShowDemoSelector(!showDemoSelector)}
                title="Test Time-Window Engine"
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-brand-border text-neutral-600 hover:text-brand-red hover:border-brand-red/40 transition-colors text-[11px]"
              >
                <Sliders className="w-3 h-3 text-brand-orange" />
                <span className="font-medium">Test Clock: {activeDemoSlot === 'live' ? 'Live IST' : activeDemoSlot}</span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {showDemoSelector && (
                <div className="absolute right-0 top-full mt-1.5 z-50 w-64 bg-white rounded-xl shadow-xl border border-brand-border p-2 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-neutral-400 px-2 py-1">
                    Simulate Time Window (Asia/Kolkata)
                  </div>
                  <button
                    onClick={() => { setDemoTimeSlot('live'); setShowDemoSelector(false); }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between ${
                      activeDemoSlot === 'live' ? 'bg-brand-cream text-brand-red font-semibold' : 'text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    <span>Live Clock (12 PM - 6 PM IST)</span>
                    {activeDemoSlot === 'live' && <CheckCircle2 className="w-3.5 h-3.5 text-brand-red" />}
                  </button>
                  <button
                    onClick={() => { setDemoTimeSlot('open'); setShowDemoSelector(false); }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between ${
                      activeDemoSlot === 'open' ? 'bg-emerald-50 text-emerald-800 font-semibold' : 'text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    <span>Force Open (12 PM - 6 PM)</span>
                    {activeDemoSlot === 'open' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                  </button>
                  <button
                    onClick={() => { setDemoTimeSlot('before_opening'); setShowDemoSelector(false); }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between ${
                      activeDemoSlot === 'before_opening' ? 'bg-amber-50 text-amber-800 font-semibold' : 'text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    <span>Force Before 12 PM (Closed)</span>
                    {activeDemoSlot === 'before_opening' && <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />}
                  </button>
                  <button
                    onClick={() => { setDemoTimeSlot('after_closing'); setShowDemoSelector(false); }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between ${
                      activeDemoSlot === 'after_closing' ? 'bg-rose-50 text-rose-800 font-semibold' : 'text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    <span>Force After 6 PM (Closed)</span>
                    {activeDemoSlot === 'after_closing' && <CheckCircle2 className="w-3.5 h-3.5 text-rose-600" />}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Warning Alert if Ordering is Closed */}
        {!windowStatus.isOpen && (
          <div className="mt-1.5 py-1.5 px-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 text-amber-900 text-xs">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <div className="flex-1">
              <span className="font-semibold">{windowStatus.headline}</span>{' '}
              <span className="text-amber-700">{windowStatus.subtext}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
