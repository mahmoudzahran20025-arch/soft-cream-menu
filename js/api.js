// ================================================================
// api.js - Enhanced API Service for Firebase + Google Apps Script
// CRITICAL: Never send prices from frontend - backend calculates all prices
// ================================================================

// ================================================================
// api.js - Enhanced API Service
// ✅ Request Cancellation + Rate Limiting + Dynamic URLs
// CRITICAL: Never send prices from frontend - backend calculates all prices
// ================================================================

import { generateUUID } from './utils.js';
import { storage } from './storage.js';

// ================================================================
// ===== API Configuration =====
// ================================================================
const API_CONFIG = {
    // ✅ Dynamic base URLs (no hardcoding)
    urls: {
        production: 'https://softcream-api.mahmoud-zahran20025.workers.dev',
        netlify: 'https://softcream-api.mahmoud-zahran20025.workers.dev',
        local: 'http://localhost:8787'
    },
    timeout: 30000,
    retries: 3,
    // ✅ Rate limiting config
    rateLimit: {
        enabled: true,
        maxRequests: 60, // 60 requests
        window: 60000    // per minute
    }
};

// ================================================================
// ===== API Service Class =====
// ================================================================
class APIService {
    constructor(options = {}) {
        this.baseURL = options.baseURL || this.detectBaseURL();
        this.timeout = options.timeout || API_CONFIG.timeout;
        this.retries = options.retries || API_CONFIG.retries;
        this.authToken = options.authToken || null;

        // ✅ Active requests tracking (للـ cancellation)
        this.activeRequests = new Map();

        // ✅ Rate limiting state
        this.requestTimestamps = [];
        this.rateLimitEnabled = API_CONFIG.rateLimit.enabled;

        console.log('🚀 API Service initialized');
        console.log('🔗 Base URL:', this.baseURL);
    }

    // ================================================================
    // ===== Environment Detection (Dynamic URLs) =====
    // ================================================================
    detectBaseURL() {
        const hostname = window.location.hostname;

        // ✅ Netlify Production
        if (hostname.includes('netlify.app')) {
            return API_CONFIG.urls.netlify;
        }

        // ✅ Local Development
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return API_CONFIG.urls.local;
        }

        // ✅ Default - Production
        return API_CONFIG.urls.production;
    }

    // ================================================================
    // ===== Configuration =====
    // ================================================================
    configure(options) {
        if (options.baseURL) this.baseURL = options.baseURL;
        if (options.timeout) this.timeout = options.timeout;
        if (options.retries) this.retries = options.retries;
        if (options.authToken) this.authToken = options.authToken;
        if (options.rateLimitEnabled !== undefined) {
            this.rateLimitEnabled = options.rateLimitEnabled;
        }

        console.log('✅ API Service configured');
    }

    // ================================================================
    // ===== Rate Limiting Check =====
    // ✅ Frontend rate limiting لمنع spam
    // ================================================================
    checkRateLimit() {
        if (!this.rateLimitEnabled) return true;

        const now = Date.now();
        const { maxRequests, window: timeWindow } = API_CONFIG.rateLimit;

        // إزالة الـ timestamps القديمة
        this.requestTimestamps = this.requestTimestamps.filter(
            timestamp => now - timestamp < timeWindow
        );

        // التحقق من الحد
        if (this.requestTimestamps.length >= maxRequests) {
            const oldestRequest = this.requestTimestamps[0];
            const timeUntilReset = timeWindow - (now - oldestRequest);

            console.warn(`⚠️ Rate limit exceeded. Try again in ${Math.ceil(timeUntilReset / 1000)}s`);
            return false;
        }

        // إضافة timestamp الحالي
        this.requestTimestamps.push(now);
        return true;
    }

    // ================================================================
    // ===== Request Cancellation =====
    // ✅ إلغاء الطلبات القديمة عند التنقل
    // ================================================================
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

    // ================================================================
    // ===== Main Request Method =====
    // ================================================================
    async request(method, endpoint, data = null, options = {}) {
        // ✅ التحقق من Rate Limit
        if (!this.checkRateLimit()) {
            throw new Error('Rate limit exceeded. Please try again later.');
        }

        const {
            timeout = this.timeout,
            retries = this.retries,
            idempotencyKey = null,
            authToken = this.authToken,
            cancelable = true // New option for cancellation
        } = options;

        let lastError;

        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                console.log(`📡 API Request [Attempt ${attempt}/${retries}]:`, method, endpoint);

                return await this.httpRequest(method, endpoint, data, {
                    timeout,
                    idempotencyKey,
                    authToken,
                    cancelable
                });

            } catch (error) {
                lastError = error;

                // ✅ لا تعيد المحاولة إذا تم إلغاء الطلب
                if (error.name === 'AbortError') {
                    console.log('🚫 Request was cancelled');
                    throw error;
                }

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
    // ===== HTTP Request with Enhanced Error Handling and Cancellation =====
    // ================================================================
    async httpRequest(method, endpoint, data, options) {
        if (!this.baseURL) {
            throw new Error('API baseURL not configured');
        }

        // ✅ إنشاء AbortController للـ cancellation
        const requestId = generateUUID();
        const controller = new AbortController();

        if (options.cancelable) {
            this.activeRequests.set(requestId, controller);
        }

        const timeoutId = setTimeout(() => {
            // Check if the request is still active before aborting timeout
            if(this.activeRequests.has(requestId)) {
                controller.abort();
            }
        }, options.timeout);

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

            // Build URL
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

            // Parse response
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
            // Check if the error is a timeout and re-throw with better message
            if (error.name === 'AbortError') {
                 // Check if it was canceled manually or by timeout
                if (!this.activeRequests.has(requestId)) {
                    throw new Error(`Request timeout after ${options.timeout}ms`);
                }
                // If the request is still in the active map, it means it was a manual cancellation
                throw error;
            }
            throw error;
        } finally {
            clearTimeout(timeoutId);
            // ✅ تنظيف الـ active request
            if (options.cancelable) {
                this.activeRequests.delete(requestId);
            }
        }
    }

    // ================================================================
    // ===== Authentication =====
    // ✅ استخدام storage module
    // ================================================================
    getAuthToken() {
        return storage.getAuthToken();
    }

    setAuthToken(token) {
        if (token) {
            storage.setAuthToken(token);
        } else {
            storage.clearAuthToken();
        }
    }

    getSessionId() {
        return storage.getSessionId();
    }

    // ================================================================
    // ===== Helper Methods =====
    // ================================================================
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    generateIdempotencyKey() {
        return generateUUID();
    }

    // ================================================================
    // ===== ORDER ENDPOINTS =====
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
    // ===== PRODUCT ENDPOINTS =====
    // ================================================================

    /**
     * Get All Products - Prices come from backend
     * @param {Object} filters
     * @returns {Promise<Array>}
     */
    async getProducts(filters = {}) {
        const result = await this.request('GET', '/products', filters);
        console.log('📦 Products loaded from backend (with prices):', result.data?.length || 0);
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
        // Note: Can use cancelable: false if search is very short, but usually better to cancel old search requests
        const result = await this.request('GET', '/products/search', { q: query });
        return result.data;
    }

    // ================================================================
    // ===== USER ENDPOINTS =====
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
    // ===== BRANCH ENDPOINTS =====
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
    // ===== PROMOTION ENDPOINTS =====
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
    // ===== ANALYTICS ENDPOINTS =====
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
                retries: 1,
                cancelable: false // Analytics events should typically not be cancelled
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
                retries: 1,
                cancelable: false
            });

            console.log('📊 Batch events tracked:', events.length);

        } catch (error) {
            console.warn('Batch analytics tracking failed:', error);
        }
    }
}

// ================================================================
// ===== Export Instance =====
// ================================================================
// Export a single instance to be used application-wide


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