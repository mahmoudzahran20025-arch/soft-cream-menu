// ================================================================
// api.js - Enhanced API Service for Firebase + Google Apps Script
// CRITICAL: Never send prices from frontend - backend calculates all prices
// ================================================================

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

// ================================================================
// ===== API Service Class =====
// ================================================================
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

    // ================================================================
    // ===== Environment Detection =====
    // ================================================================
    detectBaseURL() {
        const hostname = window.location.hostname;

        if (hostname.includes('netlify.app')) {
            return API_CONFIG.urls.netlify;
        }

        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return API_CONFIG.urls.local;
        }

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
    // ================================================================
    checkRateLimit() {
        if (!this.rateLimitEnabled) return true;

        const now = Date.now();
        const { maxRequests, window: timeWindow } = API_CONFIG.rateLimit;

        this.requestTimestamps = this.requestTimestamps.filter(
            timestamp => now - timestamp < timeWindow
        );

        if (this.requestTimestamps.length >= maxRequests) {
            const oldestRequest = this.requestTimestamps[0];
            const timeUntilReset = timeWindow - (now - oldestRequest);

            console.warn(`⚠️ Rate limit exceeded. Try again in ${Math.ceil(timeUntilReset / 1000)}s`);
            return false;
        }

        this.requestTimestamps.push(now);
        return true;
    }

    // ================================================================
    // ===== Request Cancellation =====
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
                    timeout,
                    idempotencyKey,
                    authToken,
                    cancelable
                });

            } catch (error) {
                lastError = error;

                if (error.name === 'AbortError') {
                    console.log('🚫 Request was cancelled');
                    throw error;
                }

                console.warn(`⚠️ Attempt ${attempt} failed:`, error.message);

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
    // ===== HTTP Request =====
    // ================================================================
    async httpRequest(method, endpoint, data, options) {
        if (!this.baseURL) {
            throw new Error('API baseURL not configured');
        }

        const requestId = generateUUID();
        const controller = new AbortController();

        if (options.cancelable) {
            this.activeRequests.set(requestId, controller);
        }

        const timeoutId = setTimeout(() => {
            if(this.activeRequests.has(requestId)) {
                controller.abort();
            }
        }, options.timeout);

        try {
            const headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            };

            if (options.idempotencyKey) {
                headers['Idempotency-Key'] = options.idempotencyKey;
            }

            const token = options.authToken || this.getAuthToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            headers['Origin'] = window.location.origin;

            const config = {
                method,
                headers,
                signal: controller.signal,
                mode: 'cors',
                credentials: API_CONFIG.cors.credentials
            };

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

            if (response.status === 204) {
                return { success: true, data: null };
            }

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
            if (options.cancelable) {
                this.activeRequests.delete(requestId);
            }
        }
    }

    // ================================================================
    // ===== ✅ NEW: Get Error Message =====
    // ================================================================
    getErrorMessage(error, lang = 'ar') {
        // AbortError
        if (error.name === 'AbortError') {
            return lang === 'ar' 
                ? 'تم إلغاء الطلب'
                : 'Request cancelled';
        }

        // Rate limit
        if (error.message?.includes('Rate limit') || error.message?.includes('Too many')) {
            return lang === 'ar' 
                ? 'عدد كبير من المحاولات. يرجى الانتظار قليلاً'
                : 'Too many attempts. Please wait a moment';
        }
        
        // Timeout
        if (error.message?.includes('timeout')) {
            return lang === 'ar'
                ? 'انتهت مهلة الاتصال. تحقق من الإنترنت'
                : 'Connection timeout. Check your internet';
        }

        // Network
        if (error.message?.includes('Network') || error.message?.includes('Failed to fetch')) {
            return lang === 'ar'
                ? 'مشكلة في الاتصال. تحقق من الإنترنت'
                : 'Connection problem. Check your internet';
        }
        
        // 4xx errors
        if (error.status >= 400 && error.status < 500) {
            if (error.status === 404) {
                return lang === 'ar' ? 'المورد غير موجود' : 'Resource not found';
            }
            if (error.status === 400) {
                return lang === 'ar' ? 'بيانات غير صحيحة' : 'Invalid data';
            }
            return error.data?.error || error.message;
        }

        // 5xx errors
        if (error.status >= 500) {
            return lang === 'ar'
                ? 'خطأ في الخادم. حاول مرة أخرى'
                : 'Server error. Try again';
        }

        // Promo code errors
        if (error.message?.includes('كود') || error.message?.includes('promo')) {
            return error.message;
        }
        
        // Default
        return error.message || (lang === 'ar' ? 'حدث خطأ. حاول مرة أخرى' : 'An error occurred. Try again');
    }

    // ================================================================
    // ===== Authentication =====
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
    // ================================================================
    async submitOrder(orderData) {
        if (orderData.items.some(item => item.price || item.subtotal)) {
            console.error('❌ SECURITY WARNING: Frontend should not send prices!');
            throw new Error('Invalid order data: prices should not be sent from frontend');
        }

        if (orderData.subtotal || orderData.total || orderData.discount) {
            console.error('❌ SECURITY WARNING: Frontend should not send totals!');
            throw new Error('Invalid order data: totals should not be sent from frontend');
        }

        const idempotencyKey = orderData.idempotencyKey || this.generateIdempotencyKey();

        const cleanOrderData = {
            items: orderData.items.map(item => ({
                productId: item.productId,
                quantity: item.quantity
            })),
            customer: orderData.customer,
            deliveryMethod: orderData.deliveryMethod || 'delivery',
            branch: orderData.branch || null,
            location: orderData.location || null,
            customerPhone: orderData.customerPhone || orderData.customer?.phone,
            promoCode: orderData.promoCode || null,
            idempotencyKey: idempotencyKey
        };

        console.log('📦 Submitting order (IDs only):', cleanOrderData);

        const result = await this.request('POST', '/orders/submit', cleanOrderData, {
            idempotencyKey: idempotencyKey,
            retries: 3
        });

        console.log('💰 Received calculated prices from backend:', result.data.calculatedPrices);

        return result.data;
    }

    async trackOrder(orderId) {
        return this.request('GET', '/orders/track', { orderId });
    }

    async cancelOrder(orderId) {
        return this.request('POST', '/orders/cancel', { orderId });
    }

    // ================================================================
    // ===== ✅ FIXED: Calculate Order Prices =====
    // ================================================================
    async calculateOrderPrices(items, promoCode = null, deliveryMethod = 'delivery', customerPhone = null) {
        const result = await this.request('POST', '/orders/prices', {
            items,
            promoCode,
            deliveryMethod,
            customerPhone
        });
        
        // ✅ Fixed: result.data contains calculatedPrices
        return result.data?.calculatedPrices || result.data;
    }

    // ================================================================
    // ===== PRODUCT ENDPOINTS =====
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
    // ===== USER ENDPOINTS =====
    // ================================================================
    /*
    async saveUserData(userData) {
        return this.request('POST', '/users/save', userData);
    }

    async getUserProfile(userId) {
        const result = await this.request('GET', '/users/profile', { userId });
        return result.data;
    }

    async updateUserData(userId, updates) {
        return this.request('PUT', `/users/${userId}`, updates);
    }*/

    // ================================================================
    // ===== BRANCH ENDPOINTS =====
    // ================================================================
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

    // ================================================================
    // ===== PROMOTION ENDPOINTS =====
    // ================================================================
    async getActivePromotions() {
        const result = await this.request('GET', '/promotions/active');
        return result.data;
    }

    async validatePromoCode(code, subtotal) {
        const result = await this.request('POST', '/promotions/validate', {
            code,
            subtotal
        });
        return result.data;
    }

    // ================================================================
    // ===== GAMIFICATION ENDPOINTS =====
    // ================================================================
    async getCustomerGamification(phone) {
        if (!phone) {
            throw new Error('Phone number required');
        }
        
        const result = await this.request('GET', '/gamification', { phone });
        return result.data;
    }

    // ================================================================
    // ===== ✅ FIXED: Analytics with keepalive =====
    // ================================================================
    /*
    إذا حابب تخلي الـ analytics يشتغل صح، لازم تعدل في Backend:

        تأكد إن endpoint /analytics/event موجود
        تأكد إنه بيقبل POST request
        تأكد من الـ payload format المتوقع

        لكن ده مش ضروري دلوقتي - النظام شغال كويس! 🎉
    async trackEvent(event) {
        try {
            const enrichedEvent = {
                ...event,
                timestamp: Date.now(),
                sessionId: this.getSessionId(),
                userAgent: navigator.userAgent,
                url: window.location.href
            };

            // ✅ استخدام fetch مع keepalive بدل sendBeacon
            const url = `${this.baseURL}?path=${encodeURIComponent('/analytics/event')}`;
            
            await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(enrichedEvent),
                keepalive: true, // ✅ يضمن إرسال الطلب حتى لو غادر المستخدم
                mode: 'cors',
                credentials: 'omit'
            });

            console.log('📊 Event tracked:', event.name);

        } catch (error) {
            console.warn('Analytics error:', error.message);
        }
    }*/
   // ابحث عن دالة trackEvent في api.js
    async trackEvent(event) {
    try {
        // ✅ FIX: Don't throw error if analytics fails
        console.log('📊 Tracking event:', event);
        
        const response = await this.request('POST', '/analytics/event', event);
        return response;
    } catch (error) {
        // ⚠️ Analytics is non-critical, just log warning
        console.warn('⚠️ Analytics tracking failed (non-critical):', error);
        return { success: false, error: error.message };
    }
    }
}

// ================================================================
// ===== Export Singleton Instance =====
// ================================================================
export const api = new APIService();

// For debugging
if (typeof window !== 'undefined') {
    window.apiService = api;
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