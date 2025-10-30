/**
 * ================================================================
 * 🎣 useStateBridge Hook
 * ================================================================
 * React hook للتفاعل مع StateBridge
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * استخدام StateBridge في React
 * @param {string} key - مفتاح الـ state
 * @param {any} initialValue - القيمة الافتراضية
 * @returns {[any, Function]} [value, setValue]
 */
export function useStateBridge(key, initialValue) {
  // الحصول على القيمة الأولية من StateBridge
  const [value, setValue] = useState(() => {
    if (typeof window !== 'undefined' && window.stateBridge) {
      const stored = window.stateBridge.getState(key);
      return stored !== undefined ? stored : initialValue;
    }
    return initialValue;
  });

  // الاستماع لتغييرات من StateBridge
  useEffect(() => {
    if (typeof window === 'undefined' || !window.stateBridge) {
      console.warn('⚠️ StateBridge not available');
      return;
    }

    // الاشتراك في التغييرات
    const unsubscribe = window.stateBridge.subscribe(key, (newValue) => {
      setValue(newValue);
    });

    // تنظيف عند unmount
    return unsubscribe;
  }, [key]);

  // دالة لتحديث القيمة
  const setStateBridge = useCallback((newValue) => {
    if (typeof window !== 'undefined' && window.stateBridge) {
      // إذا كانت دالة، نفذها مع القيمة الحالية
      if (typeof newValue === 'function') {
        const currentValue = window.stateBridge.getState(key);
        const updatedValue = newValue(currentValue);
        window.stateBridge.setState(key, updatedValue);
      } else {
        window.stateBridge.setState(key, newValue);
      }
    }
  }, [key]);

  return [value, setStateBridge];
}

/**
 * استخدام متعدد لـ StateBridge keys
 * @param {Object} keys - مفاتيح مع قيم افتراضية
 * @returns {Object} قيم ودوال التحديث
 * 
 * @example
 * const { cart, theme } = useMultiStateBridge({
 *   cart: [],
 *   theme: 'light'
 * });
 */
export function useMultiStateBridge(keys) {
  const result = {};
  
  Object.entries(keys).forEach(([key, initialValue]) => {
    const [value, setValue] = useStateBridge(key, initialValue);
    result[key] = value;
    result[`set${key.charAt(0).toUpperCase()}${key.slice(1)}`] = setValue;
  });
  
  return result;
}

export default useStateBridge;
