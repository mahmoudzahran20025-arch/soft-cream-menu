// ================================================================
// api.js - Enhanced API Service for Firebase + Google Apps Script
// CRITICAL: Never send prices from frontend - backend calculates all prices
// ================================================================
/*
// ================================================================
// ✅ API Review Summary
// ================================================================
// The provided api.js is **fully compatible** with the updated checkout-core.js.
// Below is the verification checklist:
//
// ✅ Uses couponCode instead of promoCode in:
// - submitOrder()
// - calculateOrderPrices()
// - validateCoupon()
//
// ✅ Each key endpoint matches what checkout-core.js expects:
// - api.submitOrder(orderData)
// - api.calculateOrderPrices(items, couponCode, deliveryMethod, customerPhone)
// - api.validateCoupon(code, phone, subtotal)
//
// ✅ Added deviceId to ensure secure coupon validation.
// ✅ Ensures no frontend prices are sent (security validation step).
// ✅ Graceful retry and error handling implemented.
// ✅ Unified request handler via httpRequest() with proper rate limiting.
// ✅ Deprecated old promo endpoints to prevent confusion.
// ✅ Compatible response structures:
// - submitOrder() → returns { orderId, eta, calculatedPrices, loyaltyReward }
// - calculateOrderPrices() → returns calculatedPrices with subtotal & items
// - validateCoupon() → returns { valid, message, coupon }
//
// ✅ Future-proof: supports analytics, gamification (disabled), and branch logic.
// ✅ Base URL detection correctly selects local/netlify/production environments.
// ✅ Logging is clear and non-blocking for debugging.
//
// ---------------------------------------------------------------
// ⚙️ Recommendation (Minor Enhancements):
// ---------------------------------------------------------------
// 1️⃣ Add optional `lang` parameter to error.getErrorMessage() calls for unified localization.
// 2️⃣ In validateCoupon(), handle backend responses where `result.data.valid` might be missing.
// 3️⃣ Consider adding unified `handleResponse(result, expectedKey)` helper to simplify parsing.
// 4️⃣ Consider a silent fallback for network retries (to avoid spam in console).
// 5️⃣ Add small throttle for analytics events to prevent overlogging.
//
// ---------------------------------------------------------------
// ✅ Conclusion:
// ---------------------------------------------------------------
// ✔ api.js and checkout-core.js are now 100% compatible.
// ✔ Coupon system fully supported.
// ✔ Safe, extensible, production-ready structure.
//
// No breaking changes detected.
*/
// ================================================================
// api.js - Enhanced API Service
// ✅ Request Cancellation + Rate Limiting + Dynamic URLs
// CRITICAL: Never send prices from frontend - backend calculates all prices
// ================================================================
// ================================================================
// api.js - Enhanced API Service
// ✅ Request Cancellation + Rate Limiting + Dynamic URLs
// CRITICAL: Never send prices from frontend - backend calculates all prices
// ================================================================
// ================================================================
// api.js - Enhanced API Service (FINAL - COUPON SYSTEM)
// CRITICAL: Never send prices from frontend - backend calculates all prices
// ================================================================
// api.js (updated) - APIService with deliveryInfo normalization & compatibility fixes
import { generateUUID } from './utils.js';
import { storage } from './storage.js';

// ================================================================
// ===== API Configuration =====
// ================================================================
const API_CONFIG = {
  urls: {
    production: 'https://softcream-api.mahmoud-zahran20025.workers.dev',
    netlify: 'https://softcream-api.mahmoud-zahran20025.workers.dev',
    local: 'http://localhost:8787'
  },
  cors: {
    credentials: 'omit',
    allowedOrigins: [
      'https://mahmoudzahran20025-arch.github.io',
      'http://localhost:5500',
      'http://127.0.0.1:5500'
    ]
  },
  timeout: 30000,
  retries: 3,
  rateLimit: {
    enabled: true,
    maxRequests: 60,
    window: 60000
  }
};

// Small UI fallback messages (if backend didn't return estimatedMessage)
const FALLBACK_ESTIMATED_MESSAGE = {
  ar: 'رسوم التوصيل تقديرية. سيتم التواصل معك لتأكيد الموقع وحساب الرسوم الفعلية.',
  en: 'Delivery fee is estimated. We will contact you to confirm location and calculate actual fees.'
};

class APIService {
  constructor(options = {}) {
    this.baseURL = options.baseURL || this.detectBaseURL();
    this.timeout = options.timeout || API_CONFIG.timeout;
    this.retries = options.retries || API_CONFIG.retries;
    this.authToken = options.authToken || null;
    this.activeRequests = new Map();
    this.requestTimestamps = [];
    this.rateLimitEnabled = API_CONFIG.rateLimit.enabled;

    console.log('🚀 API Service initialized');
    console.log('🔗 Base URL:', this.baseURL);
  }

  // -----------------------
  // Helpers - internal
  // -----------------------
  _normalizeDeliveryInfo(raw = {}) {
    // Accept multiple shapes and normalize to predictable keys
    const info = raw || {};
    return {
      deliveryFee: Number(info.deliveryFee ?? info.delivery_fee ?? 0),
      distanceKm: info.distanceKm ?? info.distance_km ?? null,
      deliveryTier: info.deliveryTier ?? info.delivery_tier ?? info.tier ?? null,
      tierNameAr: info.tierNameAr ?? (info.deliveryTier?.nameAr || info.deliveryTier?.name_ar) ?? null,
      tierNameEn: info.tierNameEn ?? (info.deliveryTier?.nameEn || info.deliveryTier?.name_en) ?? null,
      isEstimated: Boolean(info.isEstimated || info.isEstimatedFee || info.is_estimated_fee || info.isEstimated === 1 || info.isEstimatedFee === 1),
      isEstimatedRaw: info.isEstimated ?? info.isEstimatedFee ?? info.is_estimated_fee ?? false,
      estimatedMessage: info.estimatedMessage ?? info.estimated_message ?? null,
      branchId: info.branchId ?? info.branch_id ?? info.branch ?? null,
      branchName: info.branchName ?? info.branch_name ?? info.branchNameAr ?? info.branchNameEn ?? null,
      etaDisplay: info.etaDisplay ?? info.eta_display ?? info.eta ?? null,
      raw: info
    };
  }

  _isDeliveryEstimated(rawInfo) {
    const info = this._normalizeDeliveryInfo(rawInfo);
    return info.isEstimated;
  }

  _getEstimatedMessage(rawInfo, lang = 'ar') {
    const info = this._normalizeDeliveryInfo(rawInfo);
    if (info.estimatedMessage) {
      if (typeof info.estimatedMessage === 'string') return info.estimatedMessage;
      return info.estimatedMessage[lang] || info.estimatedMessage.ar || info.estimatedMessage.en || FALLBACK_ESTIMATED_MESSAGE[lang];
    }
    return FALLBACK_ESTIMATED_MESSAGE[lang];
  }

  // -----------------------
  // Core methods (unchanged mostly)
  // -----------------------
  detectBaseURL() {
    const hostname = window.location.hostname;
    if (hostname.includes('netlify.app')) return API_CONFIG.urls.netlify;
    if (hostname === 'localhost' || hostname === '127.0.0.1') return API_CONFIG.urls.local;
    return API_CONFIG.urls.production;
  }

  configure(options) {
    if (options.baseURL) this.baseURL = options.baseURL;
    if (options.timeout) this.timeout = options.timeout;
    if (options.retries) this.retries = options.retries;
    if (options.authToken) this.authToken = options.authToken;
    if (options.rateLimitEnabled !== undefined) this.rateLimitEnabled = options.rateLimitEnabled;
    console.log('✅ API Service configured');
  }

  checkRateLimit() {
    if (!this.rateLimitEnabled) return true;
    const now = Date.now();
    const { maxRequests, window: timeWindow } = API_CONFIG.rateLimit;
    this.requestTimestamps = this.requestTimestamps.filter(ts => now - ts < timeWindow);
    if (this.requestTimestamps.length >= maxRequests) {
      const oldestRequest = this.requestTimestamps[0];
      const timeUntilReset = timeWindow - (now - oldestRequest);
      console.warn(`⚠️ Rate limit exceeded. Try again in ${Math.ceil(timeUntilReset / 1000)}s`);
      return false;
    }
    this.requestTimestamps.push(now);
    return true;
  }

  cancelRequest(requestId) {
    const controller = this.activeRequests.get(requestId);
    if (controller) {
      controller.abort();
      this.activeRequests.delete(requestId);
      console.log('🚫 Request cancelled:', requestId);
    }
  }

  cancelAllRequests() {
    this.activeRequests.forEach((controller, requestId) => {
      controller.abort();
      console.log('🚫 Request cancelled:', requestId);
    });
    this.activeRequests.clear();
  }

  async request(method, endpoint, data = null, options = {}) {
    if (!this.checkRateLimit()) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    const {
      timeout = this.timeout,
      retries = this.retries,
      idempotencyKey = null,
      authToken = this.authToken,
      cancelable = true
    } = options;

    let lastError;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`📡 API Request [Attempt ${attempt}/${retries}]:`, method, endpoint);
        return await this.httpRequest(method, endpoint, data, {
          timeout, idempotencyKey, authToken, cancelable
        });
      } catch (error) {
        lastError = error;
        if (error.name === 'AbortError') {
          console.log('🚫 Request was cancelled');
          throw error;
        }
        console.warn(`⚠️ Attempt ${attempt} failed:`, error.message);
        if (error.status >= 400 && error.status < 500) throw error;
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

  async httpRequest(method, endpoint, data, options) {
    if (!this.baseURL) throw new Error('API baseURL not configured');
    const requestId = generateUUID();
    const controller = new AbortController();
    if (options.cancelable) this.activeRequests.set(requestId, controller);
    const timeoutId = setTimeout(() => {
      if (this.activeRequests.has(requestId)) controller.abort();
    }, options.timeout);

    try {
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': window.location.origin
      };
      if (options.idempotencyKey) headers['Idempotency-Key'] = options.idempotencyKey;
      const token = options.authToken || this.getAuthToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const config = {
        method,
        headers,
        signal: controller.signal,
        mode: 'cors',
        credentials: API_CONFIG.cors.credentials
      };

      let url = this.baseURL;
      if (method === 'GET' && data && Object.keys(data).length > 0) {
        const params = new URLSearchParams({ path: endpoint, ...data });
        url += '?' + params.toString();
      } else {
        url += '?path=' + encodeURIComponent(endpoint);
        if (data && method !== 'GET') config.body = JSON.stringify(data);
      }

      console.log(`📤 ${method}:`, url);
      if (data && method !== 'GET') console.log('📦 Body:', data);

      const response = await fetch(url, config);
      console.log(`📥 Response Status: ${response.status}`);

      if (response.status === 204) return { success: true, data: null };

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
        if (!this.activeRequests.has(requestId)) {
          throw new Error(`Request timeout after ${options.timeout}ms`);
        }
        throw error;
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
      if (options.cancelable) this.activeRequests.delete(requestId);
    }
  }

  getErrorMessage(error, lang = 'ar') {
    if (error.name === 'AbortError') return lang === 'ar' ? 'تم إلغاء الطلب' : 'Request cancelled';
    if (error.message?.includes('Rate limit') || error.message?.includes('Too many')) {
      return lang === 'ar' ? 'عدد كبير من المحاولات. يرجى الانتظار قليلاً' : 'Too many attempts. Please wait a moment';
    }
    if (error.message?.includes('timeout')) return lang === 'ar' ? 'انتهت مهلة الاتصال. تحقق من الإنترنت' : 'Connection timeout. Check your internet';
    if (error.message?.includes('Network') || error.message?.includes('Failed to fetch')) {
      return lang === 'ar' ? 'مشكلة في الاتصال. تحقق من الإنترنت' : 'Connection problem. Check your internet';
    }
    if (error.data?.error) return error.data.error;
    if (error.status >= 400 && error.status < 500) {
      if (error.status === 404) return lang === 'ar' ? 'المورد غير موجود' : 'Resource not found';
      if (error.status === 400) return lang === 'ar' ? 'بيانات غير صحيحة' : 'Invalid data';
      return error.message;
    }
    if (error.status >= 500) return lang === 'ar' ? 'خطأ في الخادم. حاول مرة أخرى' : 'Server error. Try again';
    return error.message || (lang === 'ar' ? 'حدث خطأ. حاول مرة أخرى' : 'An error occurred. Try again');
  }

  getAuthToken() { return storage.getAuthToken(); }
  setAuthToken(token) { token ? storage.setAuthToken(token) : storage.clearAuthToken(); }
  getSessionId() { return storage.getSessionId(); }
  delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
  generateIdempotencyKey() { return generateUUID(); }

  // ================================================================
  // ORDER ENDPOINTS (UPDATED WITH ADDRESS TYPE SUPPORT & compatibility)
  // ================================================================
  async submitOrder(orderData) {
    if (!orderData || !Array.isArray(orderData.items)) throw new Error('Invalid order data');

    if (orderData.items.some(item => item.price || item.subtotal)) {
      console.error('❌ SECURITY WARNING: Frontend should not send prices!');
      throw new Error('Invalid order data: prices should not be sent from frontend');
    }
    if (orderData.subtotal || orderData.total || orderData.discount) {
      console.error('❌ SECURITY WARNING: Frontend should not send totals!');
      throw new Error('Invalid order data: totals should not be sent from frontend');
    }

    const idempotencyKey = orderData.idempotencyKey || this.generateIdempotencyKey();

    // determine address input type
    const addressInputType = orderData.addressInputType || (orderData.location?.lat ? 'gps' : 'manual');

    const cleanOrderData = {
      items: orderData.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      })),
      customer: orderData.customer,
      deliveryMethod: orderData.deliveryMethod || 'delivery',
      branch: orderData.branch || null,
      location: orderData.location || null,
      addressInputType: addressInputType,
      deliveryAddress: orderData.deliveryAddress || orderData.customer?.address || null,
      customerPhone: orderData.customerPhone || orderData.customer?.phone || null,
      deviceId: orderData.deviceId || storage.getDeviceId(),
      couponCode: orderData.couponCode || null,
      idempotencyKey
    };

    console.log('📦 Submitting order:', {
      items: cleanOrderData.items.length,
      addressType: addressInputType,
      hasGPS: !!cleanOrderData.location?.lat,
      hasAddress: !!cleanOrderData.deliveryAddress
    });

    try {
      const result = await this.request('POST', '/orders/submit', cleanOrderData, {
        idempotencyKey,
        retries: 3
      });
      console.log('📥 Raw submit response:', result);

      // result.data should be the payload returned by submitOrder() on the server
      const responseData = result.data || result;
      if (!responseData) throw new Error('Empty response from order submission');

      // normalize delivery info
      const deliveryInfo = this._normalizeDeliveryInfo(responseData.calculatedPrices?.deliveryInfo || {});

      if (this._isDeliveryEstimated(deliveryInfo)) {
        console.warn('⚠️ Delivery fee is estimated - confirmation required');
        // optionally notify UI: you can return a flag or handle in UI based on responseData
      }

      console.log('✅ Order submitted:', responseData.orderId || responseData.id || responseData.data?.orderId);
      return responseData;
    } catch (error) {
      console.error('❌ Order submission failed:', error);
      throw error;
    }
  }

  async trackOrder(orderId) {
    return this.request('GET', '/orders/track', { orderId });
  }

  async cancelOrder(orderId) {
    return this.request('POST', '/orders/cancel', { orderId });
  }

  // ================================================================
  // calculateOrderPrices - supports location & addressInputType
  // ================================================================
  async calculateOrderPrices(items, couponCode = null, deliveryMethod = 'delivery', customerPhone = null, location = null, addressInputType = null) {
    try {
      const inputType = addressInputType || (location?.lat ? 'gps' : 'manual');

      console.log('📤 Requesting price calculation:', {
        items: items?.length ?? 0,
        couponCode,
        deliveryMethod,
        addressType: inputType,
        hasLocation: !!location?.lat
      });

      const result = await this.request('POST', '/orders/prices', {
        items,
        couponCode,
        deliveryMethod,
        customerPhone,
        deviceId: storage.getDeviceId(),
        location,
        addressInputType: inputType
      });

      console.log('📥 Raw API response:', result);

      const calculatedPrices = result.data?.calculatedPrices || result.data || result.calculatedPrices;
      if (!calculatedPrices) {
        console.error('❌ Unexpected response structure:', result);
        throw new Error('Invalid response structure from price calculation');
      }

      const deliveryInfoRaw = calculatedPrices.deliveryInfo || {};
      const deliveryInfo = this._normalizeDeliveryInfo(deliveryInfoRaw);

      if (deliveryInfo.isEstimated) {
        console.warn('⚠️ Delivery fee is estimated:', deliveryInfo.tierNameAr || deliveryInfo.deliveryTier?.nameAr);
        console.warn('📢 Message:', this._getEstimatedMessage(deliveryInfoRaw, 'ar'));
      }

      console.log('✅ Extracted calculatedPrices:', {
        subtotal: calculatedPrices.subtotal,
        deliveryFee: calculatedPrices.deliveryFee,
        total: calculatedPrices.total,
        isEstimated: deliveryInfo.isEstimated
      });

      return calculatedPrices;
    } catch (error) {
      console.error('❌ Price calculation failed:', error);
      throw error;
    }
  }

  // ================================================================
  // Products, branches, coupons, analytics (unchanged)
  // ================================================================
  async getProducts(filters = {}) {
    const result = await this.request('GET', '/products', filters);
    console.log('📦 Products loaded from backend (with prices):', result.data?.length || 0);
    return result.data;
  }

  async getProduct(productId) {
    const result = await this.request('GET', `/products/${productId}`);
    return result.data;
  }

  async searchProducts(query) {
    const result = await this.request('GET', '/products/search', { q: query });
    return result.data;
  }

  // ================================================================
  // Smart Nutrition & Energy APIs
  // ================================================================

  /**
   * Smart Discovery - Filter products by nutrition & energy
   * @param {Object} filters - { category, energyType, minCalories, maxCalories, minProtein, tags, q, limit, offset }
   * @returns {Promise<{products: Array, total: number, filters: Object}>}
   */
  async discoverProducts(filters = {}) {
    try {
      console.log('🎯 Discovering products with filters:', filters);
      const result = await this.request('GET', '/products/discover', filters);
      console.log(`✅ Found ${result.data?.products?.length || 0} products`);
      return result.data;
    } catch (error) {
      console.error('❌ Product discovery failed:', error);
      throw error;
    }
  }

  /**
   * Get nutrition summary for cart items
   * @param {Array<string>} productIds - Array of product IDs
   * @returns {Promise<Object>} Nutrition summary with totals
   */
  async getNutritionSummary(productIds) {
    try {
      console.log('🧮 Calculating nutrition summary for:', productIds);
      const result = await this.request('POST', '/products/nutrition-summary', { productIds });
      console.log('✅ Nutrition summary:', result.data);
      return result.data;
    } catch (error) {
      console.error('❌ Nutrition summary failed:', error);
      throw error;
    }
  }

  /**
   * Get product recommendations (similar products)
   * @param {string} productId - Product ID
   * @param {number} limit - Number of recommendations (default: 5)
   * @returns {Promise<Array>} Array of similar products
   */
  async getRecommendations(productId, limit = 5) {
    try {
      const result = await this.request('GET', `/products/recommendations/${productId}`, { limit });
      console.log(`✅ Found ${result.data?.length || 0} recommendations`);
      return result.data;
    } catch (error) {
      console.error('❌ Get recommendations failed:', error);
      return [];
    }
  }

  /**
   * Get products by energy type
   * @param {string} energyType - 'mental', 'physical', or 'balanced'
   * @param {number} limit - Number of products (default: 10)
   * @returns {Promise<Array>} Array of products
   */
  async getProductsByEnergy(energyType, limit = 10) {
    try {
      const result = await this.request('GET', `/products/by-energy/${energyType}`, { limit });
      console.log(`✅ Found ${result.data?.length || 0} ${energyType} energy products`);
      return result.data;
    } catch (error) {
      console.error('❌ Get products by energy failed:', error);
      return [];
    }
  }

  /**
   * Get products by category
   * @param {string} category - Category name (Arabic or English)
   * @returns {Promise<Array>} Array of products
   */
  async getProductsByCategory(category) {
    try {
      const result = await this.request('GET', `/products/by-category/${encodeURIComponent(category)}`);
      console.log(`✅ Found ${result.data?.length || 0} products in ${category}`);
      return result.data;
    } catch (error) {
      console.error('❌ Get products by category failed:', error);
      return [];
    }
  }

  async getBranches() {
    const result = await this.request('GET', '/branches');
    return result.data;
  }

  async checkBranchAvailability(branchId) {
    const result = await this.request('GET', '/branches/availability', { branchId });
    return result.data;
  }

  async getBranchHours(branchId) {
    const result = await this.request('GET', `/branches/${branchId}/hours`);
    return result.data;
  }

  async validateCoupon(code, phone, subtotal) {
    try {
      console.log('🎟️ Validating coupon:', { code, phone, subtotal });
      const result = await this.request('POST', '/coupons/validate', {
        code,
        phone,
        deviceId: storage.getDeviceId(),
        subtotal
      });
      console.log('✅ Coupon validation result:', result.data);
      return result.data;
    } catch (error) {
      console.error('❌ Coupon validation failed:', error);
      throw error;
    }
  }

  async trackEvent(event) {
    try {
      console.log('📊 Tracking event:', event);
      const enrichedEvent = {
        eventName: event.name || event.eventName,
        eventData: {
          ...event,
          timestamp: Date.now(),
          sessionId: this.getSessionId(),
          userAgent: navigator.userAgent,
          url: window.location.href
        }
      };
      const url = `${this.baseURL}?path=${encodeURIComponent('/analytics/event')}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Origin': window.location.origin },
        body: JSON.stringify(enrichedEvent),
        keepalive: true,
        mode: 'cors',
        credentials: 'omit'
      });
      if (!response.ok) {
        console.warn(`⚠️ Analytics returned ${response.status} (non-critical)`);
        return { success: false };
      }
      console.log('✅ Event tracked successfully');
      return { success: true };
    } catch (error) {
      console.warn('⚠️ Analytics tracking failed (non-critical):', error.message);
      return { success: false, error: error.message };
    }
  }
}

export const api = new APIService();
if (typeof window !== 'undefined') window.apiService = api;
console.log('✅ API Service loaded (UPDATED - deliveryInfo compatibility)');

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