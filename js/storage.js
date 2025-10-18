// ================================================================
// storage.js - Secure Storage Manager (No localStorage in artifacts)
// ================================================================

// ================================================================
// ===== In-Memory Store (for runtime data) =====
// ================================================================
class MemoryStore {
  constructor() {
    this.store = new Map();
    console.log('✅ MemoryStore initialized');
  }
  
  get(key, defaultValue = null) {
    return this.store.has(key) ? this.store.get(key) : defaultValue;
  }
  
  set(key, value) {
    this.store.set(key, value);
  }
  
  remove(key) {
    this.store.delete(key);
  }
  
  has(key) {
    return this.store.has(key);
  }
  
  clear() {
    this.store.clear();
  }
  
  size() {
    return this.store.size;
  }
  
  keys() {
    return Array.from(this.store.keys());
  }
}

// ================================================================
// ===== Session Storage Wrapper (safe for artifacts) =====
// ================================================================
class SessionStore {
  constructor() {
    this.available = this.checkAvailability();
    console.log('✅ SessionStore initialized (available:', this.available, ')');
  }
  
  checkAvailability() {
    try {
      const test = '__storage_test__';
      sessionStorage.setItem(test, test);
      sessionStorage.removeItem(test);
      return true;
    } catch (e) {
      console.warn('⚠️ sessionStorage not available:', e);
      return false;
    }
  }
  
  get(key, defaultValue = null) {
    if (!this.available) return defaultValue;
    
    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.warn(`Failed to get ${key} from sessionStorage:`, e);
      return defaultValue;
    }
  }
  
  set(key, value) {
    if (!this.available) {
      console.warn(`sessionStorage not available, cannot save ${key}`);
      return false;
    }
    
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn(`Failed to save ${key} to sessionStorage:`, e);
      return false;
    }
  }
  
  remove(key) {
    if (!this.available) return false;
    
    try {
      sessionStorage.removeItem(key);
      return true;
    } catch (e) {
      console.warn(`Failed to remove ${key} from sessionStorage:`, e);
      return false;
    }
  }
  
  has(key) {
    if (!this.available) return false;
    return sessionStorage.getItem(key) !== null;
  }
  
  clear() {
    if (!this.available) return false;
    
    try {
      sessionStorage.clear();
      return true;
    } catch (e) {
      console.warn('Failed to clear sessionStorage:', e);
      return false;
    }
  }
}

// ================================================================
// ===== Unified Storage API =====
// ================================================================
class StorageManager {
  constructor() {
    this.memory = new MemoryStore();
    this.session = new SessionStore();
    console.log('✅ StorageManager initialized');
  }
  
  // Cart data - use session storage
  getCart() {
    return this.session.get('cart', []);
  }
  
  setCart(cart) {
    return this.session.set('cart', cart);
  }
  
  clearCart() {
    return this.session.remove('cart');
  }
  
  // Theme - use session storage
  getTheme() {
    return this.session.get('theme', 'light');
  }
  
  setTheme(theme) {
    return this.session.set('theme', theme);
  }
  
  // Language - use session storage
  getLang() {
    return this.session.get('language', 'ar');
  }
  
  setLang(lang) {
    return this.session.set('language', lang);
  }
  
  // User data - use session storage
  getUserData() {
    return this.session.get('userData', null);
  }
  
  setUserData(userData) {
    return this.session.set('userData', userData);
  }
  
  clearUserData() {
    return this.session.remove('userData');
  }
  // في storage.js
  getDeviceId() {
      let deviceId = localStorage.getItem('deviceId');
      if (!deviceId) {
          deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
          localStorage.setItem('deviceId', deviceId);
      }
      return deviceId;
  }
  
  // Products cache - use memory store (5 min TTL)
  getProductsCache() {
    return this.memory.get('products_cache');
  }
  
  setProductsCache(products, timestamp) {
    this.memory.set('products_cache', { products, timestamp });
  }
  
  clearProductsCache() {
    this.memory.remove('products_cache');
  }
  
  // Auth token - use memory store (security)
  getAuthToken() {
    return this.memory.get('authToken');
  }
  
  setAuthToken(token) {
    this.memory.set('authToken', token);
  }
  
  clearAuthToken() {
    this.memory.remove('authToken');
  }
  
  // Form data - use session storage
  getCheckoutFormData() {
    return this.session.get('checkoutFormData', null);
  }
  
  setCheckoutFormData(formData) {
    return this.session.set('checkoutFormData', formData);
  }
  
  clearCheckoutFormData() {
    return this.session.remove('checkoutFormData');
  }
  
  // Session ID - use memory store
  getSessionId() {
    let sessionId = this.memory.get('sessionId');
    if (!sessionId) {
      sessionId = this.generateUUID();
      this.memory.set('sessionId', sessionId);
    }
    return sessionId;
  }
  
  // Helper: UUID Generator
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  
  // Clear all data
  clearAll() {
    this.memory.clear();
    this.session.clear();
    console.log('🗑️ All storage cleared');
  }
}

// ================================================================
// ===== Export Singleton Instance =====
// ================================================================
export const storage = new StorageManager();

// ================================================================
// ===== Expose to Window =====
// ================================================================
if (typeof window !== 'undefined') {
  window.storage = storage;
}

console.log('✅ Storage module loaded (sessionStorage + in-memory)');