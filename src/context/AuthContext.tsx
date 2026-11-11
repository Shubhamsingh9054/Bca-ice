import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';

interface AuthContextType {
  currentUser: UserProfile | null;
  isAdmin: boolean;
  loginCustomer: (name: string, mobile: string, email?: string) => void;
  loginAdmin: (password: string) => boolean;
  logout: () => void;
  updateCustomerProfile: (data: Partial<UserProfile>) => void;
}

const CUSTOMER_STORAGE_KEY = 'bca_icecream_customer_session';
const ADMIN_STORAGE_KEY = 'bca_icecream_admin_session';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      // Check admin session first
      const adminRaw = localStorage.getItem(ADMIN_STORAGE_KEY);
      if (adminRaw) {
        return JSON.parse(adminRaw);
      }
      // Check customer session
      const custRaw = localStorage.getItem(CUSTOMER_STORAGE_KEY);
      if (custRaw) {
        return JSON.parse(custRaw);
      }
    } catch {
      // fallback
    }
    // Default initial guest customer for smooth pickup experience
    return {
      id: 'cust-demo-1',
      name: 'Rohan Sharma',
      mobile: '9876543210',
      email: 'rohan.sharma@example.com',
      role: 'customer',
      createdAt: new Date().toISOString(),
    };
  });

  const isAdmin = currentUser?.role === 'admin';

  const loginCustomer = (name: string, mobile: string, email?: string) => {
    const user: UserProfile = {
      id: `cust-${Date.now()}`,
      name,
      mobile,
      email,
      role: 'customer',
      createdAt: new Date().toISOString(),
    };
    setCurrentUser(user);
    localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(user));
    localStorage.removeItem(ADMIN_STORAGE_KEY);
  };

  const loginAdmin = (password: string): boolean => {
    // Admin password (defaults to "bca123" or "admin123")
    if (password === 'admin123' || password === 'bca123' || password === 'icecream') {
      const adminUser: UserProfile = {
        id: 'admin-super-1',
        name: 'Shop Owner (Admin)',
        mobile: '+91 98765 43210',
        email: 'admin@bcaicecreamwala.com',
        role: 'admin',
        createdAt: new Date().toISOString(),
      };
      setCurrentUser(adminUser);
      localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(adminUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(CUSTOMER_STORAGE_KEY);
    localStorage.removeItem(ADMIN_STORAGE_KEY);
  };

  const updateCustomerProfile = (data: Partial<UserProfile>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...data };
    setCurrentUser(updated);
    if (updated.role === 'admin') {
      localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(updated));
    } else {
      localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAdmin,
        loginCustomer,
        loginAdmin,
        logout,
        updateCustomerProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
