import React, { createContext, useContext, useState, useEffect } from 'react';
import { useStore } from './StoreContext';
import { evaluateOrderWindow, OrderWindowStatus } from '../utils/orderTiming';

interface OrderTimingContextType {
  windowStatus: OrderWindowStatus;
  isOrderingAllowed: boolean;
  timeRemainingFormatted: string;
  setDemoTimeSlot: (slot: 'before_opening' | 'open' | 'after_closing' | 'live') => void;
  activeDemoSlot: string;
}

const OrderTimingContext = createContext<OrderTimingContextType | undefined>(undefined);

export const OrderTimingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings, todaySession, updateSettings } = useStore();
  const [windowStatus, setWindowStatus] = useState<OrderWindowStatus>(() =>
    evaluateOrderWindow(settings, todaySession)
  );
  const [timeRemainingFormatted, setTimeRemainingFormatted] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const status = evaluateOrderWindow(settings, todaySession);
      setWindowStatus(status);

      if (status.timeRemainingMs > 0) {
        const totalMinutes = Math.floor(status.timeRemainingMs / (60 * 1000));
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        if (hours > 0) {
          setTimeRemainingFormatted(`${hours}h ${mins}m`);
        } else {
          setTimeRemainingFormatted(`${mins} mins`);
        }
      } else {
        setTimeRemainingFormatted('');
      }
    };

    update();
    const interval = setInterval(update, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, [settings, todaySession]);

  const setDemoTimeSlot = (slot: 'before_opening' | 'open' | 'after_closing' | 'live') => {
    if (slot === 'live') {
      updateSettings({ timeOverrideEnabled: false });
    } else {
      updateSettings({ timeOverrideEnabled: true, timeOverrideSlot: slot });
    }
  };

  const activeDemoSlot = settings.timeOverrideEnabled
    ? settings.timeOverrideSlot || 'open'
    : 'live';

  return (
    <OrderTimingContext.Provider
      value={{
        windowStatus,
        isOrderingAllowed: windowStatus.isOpen,
        timeRemainingFormatted,
        setDemoTimeSlot,
        activeDemoSlot,
      }}
    >
      {children}
    </OrderTimingContext.Provider>
  );
};

export const useOrderTiming = () => {
  const context = useContext(OrderTimingContext);
  if (!context) {
    throw new Error('useOrderTiming must be used within an OrderTimingProvider');
  }
  return context;
};
