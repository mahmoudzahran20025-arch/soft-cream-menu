// ================================================================
// storage.js - Secure Storage Manager (No localStorage in artifacts)
// ================================================================

// ================================================================
// ===== In-Memory Store (for runtime data) =====
// ================================================================
// ================================================================
// storage.js - Secure Storage Manager (Enhanced with Orders)
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
// ===== Local Storage Wrapper (for persistent data) =====
// ================================================================
class LocalStore {
  constructor() {
    this.available = this.checkAvailability();
    console.log('✅ LocalStore initialized (available:', this.available, ')');
  }
  
  checkAvailability() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      console.warn('⚠️ localStorage not available:', e);
      return false;
    }
  }
  
  get(key, defaultValue = null) {
    if (!this.available) return defaultValue;
    
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.warn(`Failed to get ${key} from localStorage:`, e);
      return defaultValue;
    }
  }
  
  set(key, value) {
    if (!this.available) {
      console.warn(`localStorage not available, cannot save ${key}`);
      return false;
    }
    
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn(`Failed to save ${key} to localStorage:`, e);
      return false;
    }
  }
  
  remove(key) {
    if (!this.available) return false;
    
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.warn(`Failed to remove ${key} from localStorage:`, e);
      return false;
    }
  }
  
  has(key) {
    if (!this.available) return false;
    return localStorage.getItem(key) !== null;
  }
  
  clear() {
    if (!this.available) return false;
    
    try {
      localStorage.clear();
      return true;
    } catch (e) {
      console.warn('Failed to clear localStorage:', e);
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
    this.local = new LocalStore();
    console.log('✅ StorageManager initialized');
  }
  
  // ================================================================
  // Cart data - use session storage
  // ================================================================
  getCart() {
    return this.session.get('cart', []);
  }
  
  setCart(cart) {
    return this.session.set('cart', cart);
  }
  
  clearCart() {
    return this.session.remove('cart');
  }
  
  // ================================================================
  // Theme - use session storage
  // ================================================================
  getTheme() {
    return this.session.get('theme', 'light');
  }
  
  setTheme(theme) {
    return this.session.set('theme', theme);
  }
  
  // ================================================================
  // Language - use session storage
  // ================================================================
  getLang() {
    return this.session.get('language', 'ar');
  }
  
  setLang(lang) {
    return this.session.set('language', lang);
  }
  
  // ================================================================
  // User data - use session storage
  // ================================================================
  getUserData() {
    return this.session.get('userData', null);
  }
  
  setUserData(userData) {
    return this.session.set('userData', userData);
  }
  
  clearUserData() {
    return this.session.remove('userData');
  }
  
  // ================================================================
  // Device ID - use localStorage (persistent)
  // ================================================================
  getDeviceId() {
    let deviceId = this.local.get('deviceId');
    if (!deviceId) {
      deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      this.local.set('deviceId', deviceId);
    }
    return deviceId;
  }
  
  // ================================================================
  // ✅ NEW: Orders Management - use localStorage (persistent)
  // ================================================================
  
  /**
   * Get all saved orders
   * @returns {Array} Array of order objects
   */
  getOrders() {
    const orders = this.local.get('userOrders', []);
    console.log('📦 Retrieved orders:', orders.length);
    return orders;
  }
  
  /**
   * Add new order to storage
   * @param {Object} orderData - Order data object
   * @returns {boolean} Success status
   */
  addOrder(orderData) {
    try {
      const orders = this.getOrders();
      
      // Validate order data
      if (!orderData.id) {
        console.error('❌ Cannot add order without ID');
        return false;
      }
      
      // Check if order already exists
      const existingIndex = orders.findIndex(o => o.id === orderData.id);
      if (existingIndex !== -1) {
        console.warn('⚠️ Order already exists, updating instead');
        orders[existingIndex] = {
          ...orders[existingIndex],
          ...orderData,
          lastUpdated: new Date().toISOString()
        };
      } else {
        // Add new order at the beginning
        orders.unshift({
          ...orderData,
          createdAt: orderData.createdAt || new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        });
      }
      
      const success = this.local.set('userOrders', orders);
      
      if (success) {
        console.log('✅ Order saved successfully:', orderData.id);
        // Trigger badge update
        this.triggerOrdersBadgeUpdate();
      }
      
      return success;
    } catch (e) {
      console.error('❌ Failed to save order:', e);
      return false;
    }
  }
  
  /**
   * Get single order by ID
   * @param {string} orderId - Order ID
   * @returns {Object|null} Order object or null
   */
  getOrder(orderId) {
    const orders = this.getOrders();
    const order = orders.find(o => o.id === orderId);
    console.log('🔍 Found order:', orderId, '→', !!order);
    return order || null;
  }
  
  /**
   * Update order status
   * @param {string} orderId - Order ID
   * @param {string} newStatus - New status
   * @returns {boolean} Success status
   */
  updateOrderStatus(orderId, newStatus) {
    try {
      const orders = this.getOrders();
      const order = orders.find(o => o.id === orderId);
      
      if (!order) {
        console.warn('⚠️ Order not found:', orderId);
        return false;
      }
      
      order.status = newStatus;
      order.lastUpdated = new Date().toISOString();
      
      const success = this.local.set('userOrders', orders);
      
      if (success) {
        console.log('✅ Order status updated:', orderId, '→', newStatus);
        this.triggerOrdersBadgeUpdate();
      }
      
      return success;
    } catch (e) {
      console.error('❌ Failed to update order status:', e);
      return false;
    }
  }
  
  /**
   * Update entire order
   * @param {string} orderId - Order ID
   * @param {Object} updates - Fields to update
   * @returns {boolean} Success status
   */
  updateOrder(orderId, updates) {
    try {
      const orders = this.getOrders();
      const orderIndex = orders.findIndex(o => o.id === orderId);
      
      if (orderIndex === -1) {
        console.warn('⚠️ Order not found:', orderId);
        return false;
      }
      
      orders[orderIndex] = {
        ...orders[orderIndex],
        ...updates,
        lastUpdated: new Date().toISOString()
      };
      
      const success = this.local.set('userOrders', orders);
      
      if (success) {
        console.log('✅ Order updated:', orderId);
        this.triggerOrdersBadgeUpdate();
      }
      
      return success;
    } catch (e) {
      console.error('❌ Failed to update order:', e);
      return false;
    }
  }
  
  /**
   * Delete single order
   * @param {string} orderId - Order ID
   * @returns {boolean} Success status
   */
  deleteOrder(orderId) {
    try {
      const orders = this.getOrders();
      const filteredOrders = orders.filter(o => o.id !== orderId);
      
      if (orders.length === filteredOrders.length) {
        console.warn('⚠️ Order not found:', orderId);
        return false;
      }
      
      const success = this.local.set('userOrders', filteredOrders);
      
      if (success) {
        console.log('🗑️ Order deleted:', orderId);
        this.triggerOrdersBadgeUpdate();
      }
      
      return success;
    } catch (e) {
      console.error('❌ Failed to delete order:', e);
      return false;
    }
  }
  
  /**
   * Clear all orders
   * @returns {boolean} Success status
   */
  clearOrders() {
    try {
      const success = this.local.remove('userOrders');
      
      if (success) {
        console.log('🗑️ All orders cleared');
        this.triggerOrdersBadgeUpdate();
      }
      
      return success;
    } catch (e) {
      console.error('❌ Failed to clear orders:', e);
      return false;
    }
  }
  
  /**
   * Get orders filtered by status
   * @param {string|Array} statuses - Status or array of statuses
   * @returns {Array} Filtered orders
   */
  getOrdersByStatus(statuses) {
    const orders = this.getOrders();
    const statusArray = Array.isArray(statuses) ? statuses : [statuses];
    return orders.filter(o => statusArray.includes(o.status));
  }
  
  /**
   * Get active orders count (for badge)
   * @returns {number} Number of active orders
   */
  getActiveOrdersCount() {
    const activeStatuses = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'ready'];
    const activeOrders = this.getOrdersByStatus(activeStatuses);
    console.log('📊 Active orders count:', activeOrders.length);
    return activeOrders.length;
  }
  
  /**
   * Get completed orders
   * @returns {Array} Completed orders
   */
  getCompletedOrders() {
    return this.getOrdersByStatus('delivered');
  }
  
  /**
   * Get cancelled orders
   * @returns {Array} Cancelled orders
   */
  getCancelledOrders() {
    return this.getOrdersByStatus('cancelled');
  }
  
  /**
   * Trigger badge update event
   */
  triggerOrdersBadgeUpdate() {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('ordersUpdated', {
        detail: { count: this.getActiveOrdersCount() }
      });
      window.dispatchEvent(event);
      console.log('📢 Orders badge update triggered');
    }
  }
  
  // ================================================================
  // Products cache - use memory store (5 min TTL)
  // ================================================================
  getProductsCache() {
    return this.memory.get('products_cache');
  }
  
  setProductsCache(products, timestamp) {
    this.memory.set('products_cache', { products, timestamp });
  }
  
  clearProductsCache() {
    this.memory.remove('products_cache');
  }
  
  // ================================================================
  // Auth token - use memory store (security)
  // ================================================================
  getAuthToken() {
    return this.memory.get('authToken');
  }
  
  setAuthToken(token) {
    this.memory.set('authToken', token);
  }
  
  clearAuthToken() {
    this.memory.remove('authToken');
  }
  
  // ================================================================
  // Form data - use session storage
  // ================================================================
  getCheckoutFormData() {
    return this.session.get('checkoutFormData', null);
  }
  
  setCheckoutFormData(formData) {
    return this.session.set('checkoutFormData', formData);
  }
  
  clearCheckoutFormData() {
    return this.session.remove('checkoutFormData');
  }
  
  // ================================================================
  // Session ID - use memory store
  // ================================================================
  getSessionId() {
    let sessionId = this.memory.get('sessionId');
    if (!sessionId) {
      sessionId = this.generateUUID();
      this.memory.set('sessionId', sessionId);
    }
    return sessionId;
  }
  
  // ================================================================
  // Helper: UUID Generator
  // ================================================================
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  
  // ================================================================
  // Clear all data
  // ================================================================
  clearAll() {
    this.memory.clear();
    this.session.clear();
    // Don't clear localStorage (keep deviceId and orders)
    console.log('🗑️ Session and memory storage cleared');
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

console.log('✅ Storage module loaded (sessionStorage + localStorage + in-memory)');