/**
 * ================================================================
 * 🌉 STATE BRIDGE - Vanilla ↔ React Communication
 * ================================================================
 * Single source of truth للـ state المشترك
 * يستخدم localStorage + Custom Events للمزامنة
 */

class StateBridge {
  constructor() {
    this.state = {};
    this.subscribers = new Map();
    this.storageKey = 'app-state-bridge';
    
    // تحميل من localStorage
    this.loadFromStorage();
    
    // الاستماع لتغييرات من tabs أخرى
    window.addEventListener('storage', (e) => {
      if (e.key === this.storageKey) {
        this.loadFromStorage();
        this.notifyAll();
      }
    });
    
    console.log('✅ StateBridge initialized');
  }

  /**
   * تحميل State من localStorage
   */
  loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.state = JSON.parse(stored);
      }
    } catch (error) {
      console.error('❌ StateBridge: Failed to load from storage', error);
    }
  }

  /**
   * حفظ State في localStorage
   */
  saveToStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    } catch (error) {
      console.error('❌ StateBridge: Failed to save to storage', error);
    }
  }

  /**
   * الحصول على قيمة
   * @param {string} key - المفتاح
   * @returns {any} القيمة
   */
  getState(key) {
    return this.state[key];
  }

  /**
   * تعيين قيمة
   * @param {string} key - المفتاح
   * @param {any} value - القيمة الجديدة
   */
  setState(key, value) {
    const oldValue = this.state[key];
    this.state[key] = value;
    
    // حفظ في localStorage
    this.saveToStorage();
    
    // إخطار المشتركين
    this.notify(key, value, oldValue);
    
    // إطلاق Custom Event للـ React
    window.dispatchEvent(new CustomEvent('state-bridge:change', {
      detail: { key, value, oldValue }
    }));
    
    console.log(`🔄 StateBridge: ${key} updated`, value);
  }

  /**
   * الاشتراك في تغييرات مفتاح معين
   * @param {string} key - المفتاح
   * @param {Function} callback - دالة الاستدعاء
   * @returns {Function} دالة إلغاء الاشتراك
   */
  subscribe(key, callback) {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    
    this.subscribers.get(key).add(callback);
    
    // إرجاع دالة unsubscribe
    return () => {
      const subs = this.subscribers.get(key);
      if (subs) {
        subs.delete(callback);
      }
    };
  }

  /**
   * إخطار المشتركين بتغيير
   * @param {string} key - المفتاح
   * @param {any} newValue - القيمة الجديدة
   * @param {any} oldValue - القيمة القديمة
   */
  notify(key, newValue, oldValue) {
    const subs = this.subscribers.get(key);
    if (subs) {
      subs.forEach(callback => {
        try {
          callback(newValue, oldValue);
        } catch (error) {
          console.error(`❌ StateBridge: Subscriber error for ${key}`, error);
        }
      });
    }
  }

  /**
   * إخطار جميع المشتركين
   */
  notifyAll() {
    Object.keys(this.state).forEach(key => {
      this.notify(key, this.state[key]);
    });
  }

  /**
   * حذف مفتاح
   * @param {string} key - المفتاح
   */
  deleteState(key) {
    const oldValue = this.state[key];
    delete this.state[key];
    
    this.saveToStorage();
    this.notify(key, undefined, oldValue);
    
    window.dispatchEvent(new CustomEvent('state-bridge:delete', {
      detail: { key, oldValue }
    }));
  }

  /**
   * مسح كل الـ state
   */
  clearAll() {
    this.state = {};
    this.saveToStorage();
    this.notifyAll();
    
    window.dispatchEvent(new CustomEvent('state-bridge:clear'));
    console.log('🗑️ StateBridge: All state cleared');
  }

  /**
   * الحصول على كل الـ state
   * @returns {Object} نسخة من الـ state
   */
  getAllState() {
    return { ...this.state };
  }
}

// ================================================================
// 🌐 Global Instance
// ================================================================
window.stateBridge = new StateBridge();

// ================================================================
// 🎣 React Hook (للاستخدام في React)
// ================================================================
/**
 * استخدام في React:
 * 
 * import { useState, useEffect } from 'react';
 * 
 * function useStateBridge(key, initialValue) {
 *   const [value, setValue] = useState(() => {
 *     return window.stateBridge?.getState(key) ?? initialValue;
 *   });
 * 
 *   useEffect(() => {
 *     if (!window.stateBridge) return;
 * 
 *     const unsubscribe = window.stateBridge.subscribe(key, (newValue) => {
 *       setValue(newValue);
 *     });
 * 
 *     return unsubscribe;
 *   }, [key]);
 * 
 *   const setStateBridge = useCallback((newValue) => {
 *     window.stateBridge?.setState(key, newValue);
 *   }, [key]);
 * 
 *   return [value, setStateBridge];
 * }
 * 
 * // الاستخدام:
 * function Cart() {
 *   const [cart, setCart] = useStateBridge('cart', []);
 *   
 *   const addItem = (item) => {
 *     setCart([...cart, item]);
 *   };
 *   
 *   return <div>Cart: {cart.length}</div>;
 * }
 */

console.log('✅ state-bridge.js loaded');
