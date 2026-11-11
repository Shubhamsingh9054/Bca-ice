import { StockSession, StoreSettings } from '../types';

export interface OrderWindowStatus {
  isOpen: boolean;
  status: 'before_opening' | 'open' | 'stock_unpublished' | 'after_closing';
  headline: string;
  subtext: string;
  badgeText: string;
  badgeColor: 'amber' | 'emerald' | 'rose' | 'blue';
  currentTimeKolkata: string;
  openingTime: string;
  closingTime: string;
  timeRemainingMs: number;
}

/**
 * Returns current Date adjusted to Asia/Kolkata timezone
 */
export function getKolkataDate(customDate?: Date): Date {
  const base = customDate || new Date();
  const kolkataTimeString = base.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
  return new Date(kolkataTimeString);
}

/**
 * Formats a Date to YYYY-MM-DD in Asia/Kolkata timezone
 */
export function getKolkataDateString(customDate?: Date): string {
  const kDate = getKolkataDate(customDate);
  const year = kDate.getFullYear();
  const month = String(kDate.getMonth() + 1).padStart(2, '0');
  const day = String(kDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Evaluates whether ordering is currently allowed according to 12 PM - 6 PM IST rules
 * AND today's stock session published state.
 */
export function evaluateOrderWindow(
  settings: StoreSettings,
  todayStockSession?: StockSession | null
): OrderWindowStatus {
  // Check if admin enabled time override for testing / demonstration
  if (settings.timeOverrideEnabled && settings.timeOverrideSlot) {
    if (settings.timeOverrideSlot === 'open') {
      const isStockPub = todayStockSession && todayStockSession.status === 'published';
      if (!isStockPub) {
        return {
          isOpen: false,
          status: 'stock_unpublished',
          headline: "Today's stock is being prepared by the shop.",
          subtext: "Ordering will open as soon as admin publishes today's daily inventory.",
          badgeText: 'Stock Preparing',
          badgeColor: 'amber',
          currentTimeKolkata: '12:30 PM (Demo Mode)',
          openingTime: settings.openingTime,
          closingTime: settings.closingTime,
          timeRemainingMs: 3.5 * 3600 * 1000,
        };
      }
      return {
        isOpen: true,
        status: 'open',
        headline: 'Orders are now open! Choose your favourite ice creams.',
        subtext: 'Pickup only at BCA Ice Cream Wala shop counter. Order ends at 6:00 PM.',
        badgeText: 'Ordering Open (12 PM - 6 PM)',
        badgeColor: 'emerald',
        currentTimeKolkata: '1:15 PM (Demo Mode)',
        openingTime: settings.openingTime,
        closingTime: settings.closingTime,
        timeRemainingMs: 4.75 * 3600 * 1000,
      };
    } else if (settings.timeOverrideSlot === 'before_opening') {
      return {
        isOpen: false,
        status: 'before_opening',
        headline: "Today's orders will start at 12 PM. Please check back soon!",
        subtext: 'Daily fresh ice cream stock is updated every morning before 12:00 PM.',
        badgeText: 'Opens at 12 PM IST',
        badgeColor: 'amber',
        currentTimeKolkata: '10:45 AM (Demo Mode)',
        openingTime: settings.openingTime,
        closingTime: settings.closingTime,
        timeRemainingMs: 1.25 * 3600 * 1000,
      };
    } else {
      return {
        isOpen: false,
        status: 'after_closing',
        headline: "Today's ordering window has closed. Come back tomorrow!",
        subtext: 'Our daily ordering window is 12:00 PM – 6:00 PM. See you tomorrow at 12 PM.',
        badgeText: 'Closed for Today',
        badgeColor: 'rose',
        currentTimeKolkata: '6:45 PM (Demo Mode)',
        openingTime: settings.openingTime,
        closingTime: settings.closingTime,
        timeRemainingMs: 0,
      };
    }
  }

  const kDate = getKolkataDate();
  const currentMinutes = kDate.getHours() * 60 + kDate.getMinutes();

  const [openH, openM] = settings.openingTime.split(':').map(Number);
  const [closeH, closeM] = settings.closingTime.split(':').map(Number);
  const openMinutes = openH * 60 + (openM || 0); // 12 * 60 = 720
  const closeMinutes = closeH * 60 + (closeM || 0); // 18 * 60 = 1080

  const timeString = kDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const isStockPublished = Boolean(
    todayStockSession && todayStockSession.status === 'published'
  );

  // Before 12:00 PM
  if (currentMinutes < openMinutes) {
    const diffMs = (openMinutes - currentMinutes) * 60 * 1000;
    return {
      isOpen: false,
      status: 'before_opening',
      headline: "Today's orders will start at 12 PM. Please check back soon!",
      subtext: 'Daily stock is updated every morning. Shop pickup ordering opens sharp at 12:00 PM.',
      badgeText: `Opens at ${formatTimeDisplay(settings.openingTime)}`,
      badgeColor: 'amber',
      currentTimeKolkata: timeString,
      openingTime: settings.openingTime,
      closingTime: settings.closingTime,
      timeRemainingMs: diffMs,
    };
  }

  // After 6:00 PM
  if (currentMinutes >= closeMinutes) {
    return {
      isOpen: false,
      status: 'after_closing',
      headline: "Today's ordering window has closed. Come back tomorrow!",
      subtext: 'Daily ordering is available exclusively between 12:00 PM and 6:00 PM IST.',
      badgeText: 'Closed for Today',
      badgeColor: 'rose',
      currentTimeKolkata: timeString,
      openingTime: settings.openingTime,
      closingTime: settings.closingTime,
      timeRemainingMs: 0,
    };
  }

  // Between 12:00 PM and 6:00 PM - check stock publishing condition
  if (!isStockPublished) {
    return {
      isOpen: false,
      status: 'stock_unpublished',
      headline: "Today's stock is being published by the store.",
      subtext: "Ordering will open shortly as soon as admin confirms today's fresh inventory.",
      badgeText: 'Stock Preparing',
      badgeColor: 'amber',
      currentTimeKolkata: timeString,
      openingTime: settings.openingTime,
      closingTime: settings.closingTime,
      timeRemainingMs: (closeMinutes - currentMinutes) * 60 * 1000,
    };
  }

  // Window is OPEN and stock is published
  return {
    isOpen: true,
    status: 'open',
    headline: 'Orders are now open! Choose your favourite ice creams.',
    subtext: 'Collect your order from the shop counter by presenting your unique token.',
    badgeText: 'Ordering Open (12 PM - 6 PM)',
    badgeColor: 'emerald',
    currentTimeKolkata: timeString,
    openingTime: settings.openingTime,
    closingTime: settings.closingTime,
    timeRemainingMs: (closeMinutes - currentMinutes) * 60 * 1000,
  };
}

export function formatTimeDisplay(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m || 0).padStart(2, '0')} ${period}`;
}
