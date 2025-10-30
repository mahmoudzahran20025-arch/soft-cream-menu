/**
 * ================================================================
 * 📡 APP EVENTS - Unified Event System
 * ================================================================
 * نظام موحد للـ Custom Events بين Vanilla و React
 */

// ================================================================
// 📋 Event Names (Single Source of Truth)
// ================================================================
export const AppEvents = {
  // 🛒 Cart Events
  CART_UPDATED: 'app:cart:updated',
  CART_ITEM_ADDED: 'app:cart:item:added',
  CART_ITEM_REMOVED: 'app:cart:item:removed',
  CART_CLEARED: 'app:cart:cleared',
  
  // 👤 User Events
  USER_LOGIN: 'app:user:login',
  USER_LOGOUT: 'app:user:logout',
  USER_UPDATED: 'app:user:updated',
  
  // 🎨 Theme Events
  THEME_CHANGED: 'app:theme:changed',
  
  // 🌐 Language Events
  LANGUAGE_CHANGED: 'app:language:changed',
  
  // 🍦 Product Events
  PRODUCT_SELECTED: 'app:product:selected',
  PRODUCT_FAVORITED: 'app:product:favorited',
  
  // 🔔 Modal Events
  MODAL_OPENED: 'app:modal:opened',
  MODAL_CLOSED: 'app:modal:closed',
  
  // 📱 Sidebar Events
  SIDEBAR_OPENED: 'app:sidebar:opened',
  SIDEBAR_CLOSED: 'app:sidebar:closed',
};

// ================================================================
// 📤 Emit Event
// ================================================================
/**
 * إطلاق حدث مخصص
 * @param {string} eventName - اسم الحدث
 * @param {any} data - البيانات المرفقة
 * @param {Object} options - خيارات إضافية
 */
export function emit(eventName, data = null, options = {}) {
  const event = new CustomEvent(eventName, {
    detail: {
      data,
      timestamp: Date.now(),
      source: options.source || 'unknown',
    },
    bubbles: options.bubbles !== false,
    cancelable: options.cancelable !== false,
  });
  
  window.dispatchEvent(event);
  
  // Log في Development
  if (process.env.NODE_ENV === 'development') {
    console.log(`📡 Event emitted: ${eventName}`, data);
  }
}

// ================================================================
// 📥 Listen to Event
// ================================================================
/**
 * الاستماع لحدث مخصص
 * @param {string} eventName - اسم الحدث
 * @param {Function} handler - دالة المعالجة
 * @param {Object} options - خيارات إضافية
 * @returns {Function} دالة إلغاء الاشتراك
 */
export function listen(eventName, handler, options = {}) {
  const wrappedHandler = (event) => {
    try {
      handler(event.detail.data, event.detail);
    } catch (error) {
      console.error(`❌ Event handler error for ${eventName}:`, error);
    }
  };
  
  window.addEventListener(eventName, wrappedHandler, options);
  
  // إرجاع دالة unsubscribe
  return () => {
    window.removeEventListener(eventName, wrappedHandler, options);
  };
}

// ================================================================
// 🎯 Listen Once
// ================================================================
/**
 * الاستماع لحدث مرة واحدة فقط
 * @param {string} eventName - اسم الحدث
 * @param {Function} handler - دالة المعالجة
 */
export function listenOnce(eventName, handler) {
  return listen(eventName, handler, { once: true });
}

// ================================================================
// 🔄 Event Bus (للاستخدام المتقدم)
// ================================================================
class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  /**
   * الاشتراك في حدث
   */
  on(eventName, handler) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    
    this.listeners.get(eventName).add(handler);
    
    return () => this.off(eventName, handler);
  }

  /**
   * إلغاء الاشتراك
   */
  off(eventName, handler) {
    const handlers = this.listeners.get(eventName);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * إطلاق حدث
   */
  emit(eventName, data) {
    const handlers = this.listeners.get(eventName);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`❌ EventBus handler error for ${eventName}:`, error);
        }
      });
    }
  }

  /**
   * مسح كل المستمعين
   */
  clear() {
    this.listeners.clear();
  }
}

// ================================================================
// 🌐 Global Event Bus Instance
// ================================================================
export const eventBus = new EventBus();

// ================================================================
// 🎣 React Hook (للاستخدام في React)
// ================================================================
/**
 * استخدام في React:
 * 
 * import { useEffect } from 'react';
 * import { listen, AppEvents } from '@/js/app-events';
 * 
 * function useAppEvent(eventName, handler) {
 *   useEffect(() => {
 *     return listen(eventName, handler);
 *   }, [eventName, handler]);
 * }
 * 
 * // الاستخدام:
 * function Cart() {
 *   useAppEvent(AppEvents.CART_UPDATED, (cart) => {
 *     console.log('Cart updated:', cart);
 *   });
 *   
 *   return <div>Cart</div>;
 * }
 */

// ================================================================
// 🔧 Helper Functions
// ================================================================

/**
 * إطلاق حدث تحديث السلة
 */
export function emitCartUpdate(cart) {
  emit(AppEvents.CART_UPDATED, cart, { source: 'cart' });
}

/**
 * إطلاق حدث تغيير اللغة
 */
export function emitLanguageChange(lang) {
  emit(AppEvents.LANGUAGE_CHANGED, { lang }, { source: 'i18n' });
}

/**
 * إطلاق حدث تغيير الثيم
 */
export function emitThemeChange(theme) {
  emit(AppEvents.THEME_CHANGED, { theme }, { source: 'theme' });
}

// ================================================================
// 🌐 Global Access
// ================================================================
window.appEvents = {
  AppEvents,
  emit,
  listen,
  listenOnce,
  eventBus,
};

console.log('✅ app-events.js loaded');
