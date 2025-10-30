/**
 * ================================================================
 * 🎣 useAppEvent Hook
 * ================================================================
 * React hook للاستماع لـ App Events
 */

import { useEffect, useCallback } from 'react';

/**
 * الاستماع لحدث من AppEvents
 * @param {string} eventName - اسم الحدث
 * @param {Function} handler - دالة المعالجة
 * @param {Array} deps - dependencies للـ useEffect
 * 
 * @example
 * useAppEvent('app:cart:updated', (cart) => {
 *   console.log('Cart updated:', cart);
 * });
 */
export function useAppEvent(eventName, handler, deps = []) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const wrappedHandler = (event) => {
      try {
        handler(event.detail.data, event.detail);
      } catch (error) {
        console.error(`❌ useAppEvent handler error for ${eventName}:`, error);
      }
    };

    window.addEventListener(eventName, wrappedHandler);

    return () => {
      window.removeEventListener(eventName, wrappedHandler);
    };
  }, [eventName, ...deps]);
}

/**
 * إطلاق حدث من React
 * @returns {Function} دالة emit
 * 
 * @example
 * const emitEvent = useEmitEvent();
 * emitEvent('app:cart:updated', { count: 3 });
 */
export function useEmitEvent() {
  return useCallback((eventName, data = null, options = {}) => {
    if (typeof window === 'undefined') return;

    const event = new CustomEvent(eventName, {
      detail: {
        data,
        timestamp: Date.now(),
        source: options.source || 'react',
      },
      bubbles: options.bubbles !== false,
      cancelable: options.cancelable !== false,
    });

    window.dispatchEvent(event);

    if (process.env.NODE_ENV === 'development') {
      console.log(`📡 [React] Event emitted: ${eventName}`, data);
    }
  }, []);
}

/**
 * استخدام EventBus من React
 * @param {string} eventName - اسم الحدث
 * @param {Function} handler - دالة المعالجة
 * 
 * @example
 * useEventBus('cart:updated', (cart) => {
 *   console.log('Cart:', cart);
 * });
 */
export function useEventBus(eventName, handler) {
  useEffect(() => {
    if (typeof window === 'undefined' || !window.appEvents?.eventBus) {
      console.warn('⚠️ EventBus not available');
      return;
    }

    return window.appEvents.eventBus.on(eventName, handler);
  }, [eventName, handler]);
}

export default useAppEvent;
