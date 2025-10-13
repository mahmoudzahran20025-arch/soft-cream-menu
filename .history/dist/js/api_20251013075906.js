// ================================================================
// api.js - Enhanced API Service for Firebase + Google Apps Script
// CRITICAL: Never send prices from frontend - backend calculates all prices
// ================================================================

import { generateUUID } from './utils.js';

// ================================================================
// API Service Class
// ================================================================
class APIService {
  constructor(options = {}) {
    this.baseURL = options.baseURL || this.detectBaseURL();
    this.timeout = options.timeout || 30000;
    this.retries = options.retries || 3;
    this.allowedOrigins = options.allowedOrigins || [];
    this.authToken = options.authToken || null;
    this.environment = this.detectEnvironment();
    
    console.log('🚀 API Service initialized');
    console.log('🌐 Environment:', this.environment);
    console.log('🔗 Base URL:', this.baseURL);
  }
  
  // ================================================================
  // Environment Detection
  // ================================================================
  detectEnvironment() {
    if (window.location.hostname.includes('firebaseapp.com') || 
        window.location.hostname.includes('web.app')) {
      return 'firebase';
    }
    
    if (window.location.hostname === 'localhost' || 
        window.location.hostname === '127.0.0.1') {
      return 'development';
    }
    
    return 'production';
  }
  
  detectBaseURL() {
    // Default to empty - must be configured with GAS Web App URL
    return 'https://script.google.com/macros/s/AKfycbxkAXCOjoBDMyyA72Y-KbIj4YHLBNk_nrYrHMiyAuv97knRWJknyE63d3aBUVizltnq/exec';
  }
  
  // ================================================================
  // Configuration
  // ================================================================
  configure(options) {
    if (options.baseURL) this.baseURL = options.baseURL;
    if (options.timeout) this.timeout = options.timeout;
    if (options.retries) this.retries = options.retries;
    if (options.authToken) this.authToken = options.authToken;
    
    console.log('✅ API Service configured with:', options);
  }
  
  // ================================================================
  // Main Request Method
  // ================================================================
  async request(method, endpoint, data = null, options = {}) {
    const {
      timeout = this.timeout,
      retries = this.retries,
      idempotencyKey = null,
      authToken = this.authToken
    } = options;
    
    let lastError;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`📡 API Request [Attempt ${attempt}/${retries}]:`, method, endpoint);
        
        return await this.httpRequest(method, endpoint, data, {
          timeout,
          idempotencyKey,
          authToken
        });
        
      } catch (error) {
        lastError = error;
        console.warn(`⚠️ Attempt ${attempt} failed:`, error.message);
        
        // Don't retry on client errors (4xx)
        if (error.status >= 400 && error.status < 500) {
          throw error;
        }
        
        if (attempt < retries) {
          const backoff = Math.min(Math.pow(2, attempt) * 1000, 10000);
          console.log(`⏳ Retrying in ${backoff}ms...`);
          await this.delay(backoff);
        }
      }
    }
    
    console.error('❌ All attempts failed:', lastError);
    throw lastError;
  }
  
  // ================================================================
  // HTTP Request with Enhanced Error Handling
  // ================================================================
  async httpRequest(method, endpoint, data, options) {
    if (!this.baseURL) {
      throw new Error('API baseURL not configured. Please call api.configure({ baseURL: "YOUR_GAS_URL" })');
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout);
    
    try {
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      
      // Add idempotency key
      if (options.idempotencyKey) {
        headers['Idempotency-Key'] = options.idempotencyKey;
      }
      
      // Add authentication
      const token = options.authToken || this.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Add origin for CORS
      headers['Origin'] = window.location.origin;
      
      const config = {
        method,
        headers,
        signal: controller.signal,
        mode: 'cors'
      };
      
      // Build URL with path parameter for GAS
      let url = this.baseURL;
      
      if (method === 'GET' && data && Object.keys(data).length > 0) {
        const params = new URLSearchParams({
          path: endpoint,
          ...data
        });
        url += '?' + params.toString();
      } else {
        url += '?path=' + encodeURIComponent(endpoint);
        if (data && method !== 'GET') {
          config.body = JSON.stringify(data);
        }
      }
      
      console.log(`📤 ${method}:`, url);
      if (data && method !== 'GET') {
        console.log('📦 Body:', data);
      }
      
      const response = await fetch(url, config);
      
      console.log(`📥 Response Status: ${response.status}`);
      
      // Handle 204 No Content
      if (response.status === 204) {
        return { success: true, data: null };
      }
      
      // Try to parse response
      let result;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        try {
          result = await response.json();
        } catch (parseError) {
          console.warn('Failed to parse JSON response:', parseError);
          result = { success: false, error: 'Invalid JSON response' };
        }
      } else {
        const text = await response.text();
        console.warn('Non-JSON response:', text);
        result = { success: false, error: 'Expected JSON response', rawResponse: text };
      }
      
      // Handle error responses
      if (!response.ok) {
        const error = new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
        error.status = response.status;
        error.data = result;
        throw error;
      }
      
      console.log('✅ Response:', result);
      
      return result;
      
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${options.timeout}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }
  
  // ================================================================
  // Authentication
  // ================================================================
  getAuthToken() {
    try {
      return localStorage.getItem('authToken');
    } catch (e) {
      return null;
    }
  }
  
  setAuthToken(token) {
    try {
      if (token) {
        localStorage.setItem('authToken', token);
      } else {
        localStorage.removeItem('authToken');
      }
    } catch (e) {
      console.warn('Failed to save auth token:', e);
    }
  }
  
  // ================================================================
  // Helper Methods
  // ================================================================
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  generateIdempotencyKey() {
    return generateUUID();
  }
  
  // ================================================================
  // ORDER ENDPOINTS
  // CRITICAL: Frontend sends only product IDs + quantities
  // Backend calculates all prices
  // ================================================================
  
  /**
   * Submit Order - CRITICAL: Only send product IDs and quantities
   * Backend calculates prices, applies promotions, and returns totals
   * @param {Object} orderData - { items: [{productId, quantity}], customer, deliveryMethod, promoCode }
   * @returns {Promise<Object>} - { orderId, eta, calculatedPrices }
   */
  async submitOrder(orderData) {
    // Validate that frontend isn't sending prices
    if (orderData.items.some(item => item.price || item.subtotal)) {
      console.error('❌ SECURITY WARNING: Frontend should not send prices!');
      throw new Error('Invalid order data: prices should not be sent from frontend');
    }
    
    if (orderData.subtotal || orderData.total || orderData.discount) {
      console.error('❌ SECURITY WARNING: Frontend should not send totals!');
      throw new Error('Invalid order data: totals should not be sent from frontend');
    }
    
    // Generate idempotency key
    const idempotencyKey = orderData.idempotencyKey || this.generateIdempotencyKey();
    
    // Clean order data - only IDs and quantities
    const cleanOrderData = {
      items: orderData.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      })),
      customer: orderData.customer,
      deliveryMethod: orderData.deliveryMethod || 'delivery',
      branch: orderData.branch || null,
      location: orderData.location || null,
      promoCode: orderData.promoCode || null,
      idempotencyKey: idempotencyKey
    };
    
    console.log('📦 Submitting order (IDs only):', cleanOrderData);
    
    const result = await this.request('POST', '/orders/submit', cleanOrderData, {
      idempotencyKey: idempotencyKey,
      retries: 3
    });
    
    // Backend returns calculated prices
    console.log('💰 Received calculated prices from backend:', result.data.calculatedPrices);
    
    return result.data;
  }
  
  /**
   * Track Order
   * @param {string} orderId
   * @returns {Promise<Object>}
   */
  async trackOrder(orderId) {
    return this.request('GET', '/orders/track', { orderId });
  }
  
  /**
   * Cancel Order
   * @param {string} orderId
   * @returns {Promise<Object>}
   */
  async cancelOrder(orderId) {
    return this.request('POST', '/orders/cancel', { orderId });
  }
  
  // ================================================================
  // PRODUCT ENDPOINTS
  // ================================================================
  
  /**
   * Get All Products - Prices come from backend
   * @param {Object} filters
   * @returns {Promise<Array>}
   */
  async getProducts(filters = {}) {
    const result = await this.request('GET', '/products', filters);
    console.log('📦 Products loaded from backend (with prices):', result.data.length);
    return result.data;
  }
  
  /**
   * Get Single Product
   * @param {string} productId
   * @returns {Promise<Object>}
   */
  async getProduct(productId) {
    const result = await this.request('GET', `/products/${productId}`);
    return result.data;
  }
  
  /**
   * Search Products
   * @param {string} query
   * @returns {Promise<Array>}
   */
  async searchProducts(query) {
    const result = await this.request('GET', '/products/search', { q: query });
    return result.data;
  }
  
  // ================================================================
  // USER ENDPOINTS
  // ================================================================
  
  /**
   * Save User Data
   * @param {Object} userData
   * @returns {Promise<Object>}
   */
  async saveUserData(userData) {
    return this.request('POST', '/users/save', userData);
  }
  
  /**
   * Get User Profile
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  async getUserProfile(userId) {
    const result = await this.request('GET', '/users/profile', { userId });
    return result.data;
  }
  
  /**
   * Update User Data
   * @param {string} userId
   * @param {Object} updates
   * @returns {Promise<Object>}
   */
  async updateUserData(userId, updates) {
    return this.request('PUT', `/users/${userId}`, updates);
  }
  
  // ================================================================
  // BRANCH ENDPOINTS
  // ================================================================
  
  /**
   * Get All Branches
   * @returns {Promise<Array>}
   */
  async getBranches() {
    const result = await this.request('GET', '/branches');
    return result.data;
  }
  
  /**
   * Check Branch Availability
   * @param {string} branchId
   * @returns {Promise<Object>}
   */
  async checkBranchAvailability(branchId) {
    const result = await this.request('GET', '/branches/availability', { branchId });
    return result.data;
  }
  
  /**
   * Get Branch Hours
   * @param {string} branchId
   * @returns {Promise<Object>}
   */
  async getBranchHours(branchId) {
    const result = await this.request('GET', `/branches/${branchId}/hours`);
    return result.data;
  }
  
  // ================================================================
  // PROMOTION ENDPOINTS
  // ================================================================
  
  /**
   * Get Active Promotions
   * @returns {Promise<Array>}
   */
  async getActivePromotions() {
    const result = await this.request('GET', '/promotions/active');
    return result.data;
  }
  
  /**
   * Validate Promo Code - Backend calculates discount
   * @param {string} code
   * @param {number} subtotal - Current cart subtotal for validation
   * @returns {Promise<Object>}
   */
  async validatePromoCode(code, subtotal) {
    const result = await this.request('POST', '/promotions/validate', { 
      code, 
      subtotal 
    });
    return result.data;
  }
  
  // ================================================================
  // ANALYTICS ENDPOINTS
  // ================================================================
  
  /**
   * Track Single Event - Uses sendBeacon for reliability
   * @param {Object} event
   * @returns {Promise<void>}
   */
  async trackEvent(event) {
    try {
      // Add timestamp and session info
      const enrichedEvent = {
        ...event,
        timestamp: Date.now(),
        sessionId: this.getSessionId(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };
      
      // Try sendBeacon first (more reliable for page unload)
      if (navigator.sendBeacon && this.baseURL) {
        const url = `${this.baseURL}?path=${encodeURIComponent('/analytics/event')}`;
        const blob = new Blob([JSON.stringify(enrichedEvent)], {
          type: 'application/json'
        });
        
        const sent = navigator.sendBeacon(url, blob);
        if (sent) {
          console.log('📊 Event tracked (sendBeacon):', event.name);
          return;
        }
      }
      
      // Fallback to regular POST
      await this.request('POST', '/analytics/event', enrichedEvent, {
        retries: 1
      });
      
      console.log('📊 Event tracked:', event.name);
      
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }
  }
  
  /**
   * Track Multiple Events in Batch
   * @param {Array} events
   * @returns {Promise<void>}
   */
  async trackEvents(events) {
    try {
      const enrichedEvents = events.map(event => ({
        ...event,
        timestamp: Date.now(),
        sessionId: this.getSessionId()
      }));
      
      await this.request('POST', '/analytics/events', { events: enrichedEvents }, {
        retries: 1
      });
      
      console.log('📊 Batch events tracked:', events.length);
      
    } catch (error) {
      console.warn('Batch analytics tracking failed:', error);
    }
  }
  
  getSessionId() {
    try {
      let sessionId = sessionStorage.getItem('sessionId');
      if (!sessionId) {
        sessionId = this.generateIdempotencyKey();
        sessionStorage.setItem('sessionId', sessionId);
      }
      return sessionId;
    } catch (e) {
      return 'unknown';
    }
  }
  
  // ================================================================
  // NOTIFICATION ENDPOINTS
  // ================================================================
  
  /**
   * Send WhatsApp Notification
   * @param {string} phone
   * @param {string} message
   * @returns {Promise<Object>}
   */
  async sendWhatsAppNotification(phone, message) {
    return this.request('POST', '/notifications/whatsapp', {
      phone,
      message
    });
  }
  
  /**
   * Send Email
   * @param {Object} emailData - { to, subject, message, html }
   * @returns {Promise<Object>}
   */
  async sendEmail(emailData) {
    return this.request('POST', '/notifications/email', emailData);
  }
  
  // ================================================================
  // ERROR HANDLING
  // ================================================================
  
  /**
   * Get User-Friendly Error Message
   * @param {Error} error
   * @param {string} lang - 'ar' or 'en'
   * @returns {string}
   */
  getErrorMessage(error, lang = 'ar') {
    console.error('API Error:', error);
    
    const messages = {
      ar: {
        timeout: 'انتهت مهلة الاتصال. الرجاء المحاولة مرة أخرى.',
        network: 'خطأ في الاتصال بالإنترنت. تحقق من اتصالك.',
        notFound: 'العنصر المطلوب غير موجود.',
        validation: 'بيانات غير صالحة. الرجاء المحاولة مرة أخرى.',
        server: 'حدث خطأ في الخادم. الرجاء المحاولة لاحقاً.',
        unauthorized: 'يجب تسجيل الدخول للمتابعة.',
        default: 'حدث خطأ غير متوقع. الرجاء المحاولة مرة أخرى.'
      },
      en: {
        timeout: 'Connection timeout. Please try again.',
        network: 'Network error. Check your connection.',
        notFound: 'The requested item was not found.',
        validation: 'Invalid data. Please try again.',
        server: 'Server error. Please try again later.',
        unauthorized: 'You must login to continue.',
        default: 'An unexpected error occurred. Please try again.'
      }
    };
    
    const msg = messages[lang] || messages.ar;
    
    if (error.message && error.message.includes('timeout')) {
      return msg.timeout;
    }
    
    if (error.message && (error.message.includes('Network') || error.message.includes('Failed to fetch'))) {
      return msg.network;
    }
    
    if (error.status === 404) {
      return msg.notFound;
    }
    
    if (error.status === 400) {
      return msg.validation;
    }
    
    if (error.status === 401 || error.status === 403) {
      return msg.unauthorized;
    }
    
    if (error.status >= 500) {
      return msg.server;
    }
    
    return msg.default;
  }
}

// ================================================================
// Export Singleton Instance
// ================================================================
export const api = new APIService();

// ================================================================
// Expose to Window
// ================================================================
if (typeof window !== 'undefined') {
  window.api = api;
}

// ================================================================
// INITIALIZATION EXAMPLE
// ================================================================
/*
// في ملف app.js أو main.js:

import { api } from './api.js';

// Configure with your Google Apps Script Web App URL
api.configure({
  baseURL: 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec',
  timeout: 30000,
  retries: 3
});

// Example: Submit Order (Only IDs!)
const orderData = {
  items: [
    { productId: 'prod_001', quantity: 2 },
    { productId: 'prod_003', quantity: 1 }
  ],
  customer: {
    name: 'أحمد محمد',
    phone: '01234567890',
    address: 'شارع التحرير، الدقي',
    notes: 'الرجاء الاتصال عند الوصول'
  },
  deliveryMethod: 'delivery',
  promoCode: 'WELCOME10',
  location: {
    lat: 30.0444,
    lng: 31.2357
  }
};

try {
  const result = await api.submitOrder(orderData);
  console.log('Order ID:', result.orderId);
  console.log('ETA:', result.eta);
  console.log('Calculated Prices:', result.calculatedPrices);
  
  // Use backend-calculated prices for display
  const { items, subtotal, discount, deliveryFee, total } = result.calculatedPrices;
  
  // Display to user (read-only)
  showOrderConfirmation({
    orderId: result.orderId,
    eta: result.eta,
    items: items, // Contains backend-calculated prices
    subtotal: subtotal,
    discount: discount,
    deliveryFee: deliveryFee,
    total: total
  });
  
} catch (error) {
  const message = api.getErrorMessage(error, 'ar');
  showError(message);
}

// Example: Track Analytics
api.trackEvent({
  name: 'page_view',
  page: '/menu',
  category: 'burgers'
});

// Example: Validate Promo Code
try {
  const promo = await api.validatePromoCode('WELCOME10', 150);
  console.log('Discount:', promo.discountAmount);
  console.log('Message:', promo.message);
} catch (error) {
  console.log('Invalid promo code');
}
*/

// ================================================================
// CURL TEST EXAMPLES
// ================================================================
/*
# Get your Web App URL from Google Apps Script deployment
WEB_APP_URL="https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec"

# Test 1: Submit Order (IDs only!)
curl -X POST "${WEB_APP_URL}?path=/orders/submit" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"productId": "prod_001", "quantity": 2},
      {"productId": "prod_003", "quantity": 1}
    ],
    "customer": {
      "name": "أحمد محمد",
      "phone": "01234567890",
      "address": "شارع التحرير"
    },
    "deliveryMethod": "delivery",
    "promoCode": "WELCOME10"
  }'

# Test 2: Track Order
curl "${WEB_APP_URL}?path=/orders/track&orderId=ORD-20250512120000-1234"

# Test 3: Get Products (with prices from backend)
curl "${WEB_APP_URL}?path=/products"

# Test 4: Search Products
curl "${WEB_APP_URL}?path=/products/search&q=burger"

# Test 5: Get Branches
curl "${WEB_APP_URL}?path=/branches"

# Test 6: Validate Promo Code
curl -X POST "${WEB_APP_URL}?path=/promotions/validate" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "WELCOME10",
    "subtotal": 150
  }'

# Test 7: Get Active Promotions
curl "${WEB_APP_URL}?path=/promotions/active"

# Test 8: Track Analytics Event
curl -X POST "${WEB_APP_URL}?path=/analytics/event" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "add_to_cart",
    "productId": "prod_001",
    "quantity": 2
  }'
*/

console.log('✅ API Service loaded');
console.log('⚠️ Remember to configure baseURL with your Google Apps Script Web App URL');
console.log('📖 Example: api.configure({ baseURL: "YOUR_GAS_WEB_APP_URL" })');

// ================================================================
// SECURITY CHECKLIST FOR PRICE MANIPULATION PREVENTION
// ================================================================
/*
✅ SECURITY MEASURES IMPLEMENTED:

1. FRONTEND (api.js):
   ✅ Validates that no prices are sent in submitOrder()
   ✅ Only sends product IDs and quantities
   ✅ Receives and displays backend-calculated prices (read-only)
   ✅ Never stores or modifies price values
   ✅ All calculations done server-side

2. BACKEND (Code.gs):
   ✅ Calculates all prices from Products sheet
   ✅ Validates product IDs exist
   ✅ Applies promotions server-side only
   ✅ Calculates delivery fees server-side
   ✅ Uses LockService to prevent race conditions
   ✅ Logs all price calculations
   ✅ Returns calculated prices to frontend

3. DATA FLOW:
   Frontend → Backend: Only IDs + quantities
   Backend → Frontend: Calculated prices for display
   Backend → Sheets: Complete order with verified prices
   Backend → Telegram: Notification with verified prices

4. VALIDATION:
   ✅ Product existence check
   ✅ Quantity validation
   ✅ Promo code validation (server-side)
   ✅ Minimum order check for promotions
   ✅ Delivery fee calculation rules

5. MONITORING:
   ✅ All price calculations logged
   ✅ Suspicious activities logged
   ✅ Telegram notifications for orders
   ✅ Order status tracking

❌ WHAT ATTACKERS CANNOT DO:
   ❌ Send custom prices from browser
   ❌ Modify prices in DevTools
   ❌ Apply invalid promo codes
   ❌ Bypass delivery fees
   ❌ Manipulate discount calculations
   ❌ Submit duplicate orders (idempotency)
   ❌ Race condition attacks (LockService)

✅ RECOMMENDED ADDITIONAL SECURITY:
   - Add rate limiting (track requests per IP/user)
   - Add authentication (Firebase Auth)
   - Monitor for unusual order patterns
   - Set maximum order quantities
   - Add fraud detection rules
   - Implement order verification workflow
   - Add admin dashboard for monitoring
*/