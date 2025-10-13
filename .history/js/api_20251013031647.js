// ================================================================
// api.js - خدمة API للتكامل مع Backend
// ================================================================

import { generateUUID } from './utils.js';

// ================================================================
// ===== API Service Class =====
// ================================================================
class APIService {
  constructor() {
    this.environment = this.detectEnvironment();
    this.baseURL = this.getBaseURL();
    this.timeout = 30000; // 30 seconds
    this.retries = 3;
  }
  
  // ================================================================
  // ===== كشف البيئة =====
  // ================================================================
  detectEnvironment() {
    // Google Apps Script
    if (typeof google !== 'undefined' && google.script && google.script.run) {
      return 'google-apps-script';
    }
    
    // Firebase
    if (window.location.hostname.includes('firebaseapp.com') || 
        window.location.hostname.includes('web.app')) {
      return 'firebase';
    }
    
    // Development
    if (window.location.hostname === 'localhost' || 
        window.location.hostname === '127.0.0.1') {
      return 'development';
    }
    
    // Production
    return 'production';
  }
  
  // ================================================================
  // ===== الحصول على Base URL =====
  // ================================================================
  getBaseURL() {
    switch (this.environment) {
      case 'google-apps-script':
        return null; // يستخدم google.script.run
      
      case 'firebase':
        return 'https://your-project.firebaseapp.com/api';
      
      case 'development':
        return 'http://localhost:3000/api';
      
      default:
        return '/api';
    }
  }
  
  // ================================================================
  // ===== طلب موحد =====
  // ================================================================
  async request(method, endpoint, data = null, options = {}) {
    const {
      timeout = this.timeout,
      retries = this.retries,
      idempotencyKey = null
    } = options;
    
    let lastError;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`📡 API Request [Attempt ${attempt}]:`, method, endpoint);
        
        if (this.environment === 'google-apps-script') {
          return await this.googleScriptRequest(method, endpoint, data, idempotencyKey);
        } else {
          return await this.httpRequest(method, endpoint, data, timeout, idempotencyKey);
        }
      } catch (error) {
        lastError = error;
        console.warn(`⚠️ Attempt ${attempt} failed:`, error.message);
        
        if (attempt < retries) {
          // Exponential backoff
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
  // ===== Google Apps Script Request =====
  // ================================================================
  googleScriptRequest(method, endpoint, data, idempotencyKey) {
    return new Promise((resolve, reject) => {
      const functionName = this.getFunctionName(method, endpoint);
      
      if (!google.script.run[functionName]) {
        reject(new Error(`Function ${functionName} not found in Google Apps Script`));
        return;
      }
      
      const requestData = {
        ...data,
        idempotencyKey: idempotencyKey || generateUUID(),
        timestamp: new Date().toISOString()
      };
      
      console.log(`📤 Calling Google Apps Script function: ${functionName}`);
      
      google.script.run
        .withSuccessHandler((response) => {
          console.log('✅ Google Apps Script response:', response);
          resolve(response);
        })
        .withFailureHandler((error) => {
          console.error('❌ Google Apps Script error:', error);
          reject(new Error(error.message || 'Google Apps Script request failed'));
        })
        [functionName](requestData);
    });
  }
  
  // ================================================================
  // ===== HTTP Request (Firebase/REST API) =====
  // ================================================================
  async httpRequest(method, endpoint, data, timeout, idempotencyKey) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      
      if (idempotencyKey) {
        headers['Idempotency-Key'] = idempotencyKey;
      }
      
      // Add authentication if available
      const token = this.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const config = {
        method,
        headers,
        signal: controller.signal
      };
      
      if (data && method !== 'GET') {
        config.body = JSON.stringify(data);
      }
      
      const url = method === 'GET' && data
        ? `${this.baseURL}${endpoint}?${new URLSearchParams(data)}`
        : `${this.baseURL}${endpoint}`;
      
      console.log(`📤 HTTP ${method}:`, url);
      
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || 
          `HTTP ${response.status}: ${response.statusText}`
        );
      }
      
      const result = await response.json();
      console.log('✅ HTTP response:', result);
      
      return result;
      
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }
  
  // ================================================================
  // ===== Helper Methods =====
  // ================================================================
  getFunctionName(method, endpoint) {
    // Convert /orders/submit -> submitOrder
    const parts = endpoint.split('/').filter(Boolean);
    const action = parts.pop();
    const resource = parts.join('');
    
    return `${action}${this.capitalize(resource)}`;
  }
  
  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  
  getAuthToken() {
    // يمكن تخزين التوكن في localStorage أو cookie
    try {
      return localStorage.getItem('authToken');
    } catch (e) {
      return null;
    }
  }
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // ================================================================
  // ===== API Methods - Orders =====
  // ================================================================
  
  /**
   * إرسال طلب جديد
   * @param {Object} orderData - بيانات الطلب
   * @returns {Promise<Object>} - استجابة السيرفر
   */
  async submitOrder(orderData) {
    return this.request('POST', '/orders/submit', orderData, {
      idempotencyKey: orderData.idempotencyKey,
      retries: 3
    });
  }
  
  /**
   * تتبع طلب
   * @param {string} orderId - رقم الطلب
   * @returns {Promise<Object>} - حالة الطلب
   */
  async trackOrder(orderId) {
    return this.request('GET', '/orders/track', { orderId });
  }
  
  /**
   * الحصول على سجل طلبات المستخدم
   * @param {string} userId - معرف المستخدم
   * @returns {Promise<Array>} - قائمة الطلبات
   */
  async getUserOrders(userId) {
    return this.request('GET', '/orders/user', { userId });
  }
  
  /**
   * إلغاء طلب
   * @param {string} orderId - رقم الطلب
   * @returns {Promise<Object>} - تأكيد الإلغاء
   */
  async cancelOrder(orderId) {
    return this.request('POST', '/orders/cancel', { orderId });
  }
  
  // ================================================================
  // ===== API Methods - Products =====
  // ================================================================
  
  /**
   * الحصول على جميع المنتجات
   * @param {Object} filters - فلاتر البحث (اختياري)
   * @returns {Promise<Array>} - قائمة المنتجات
   */
  async getProducts(filters = {}) {
    return this.request('GET', '/products', filters);
  }
  
  /**
   * الحصول على منتج محدد
   * @param {string} productId - معرف المنتج
   * @returns {Promise<Object>} - بيانات المنتج
   */
  async getProduct(productId) {
    return this.request('GET', `/products/${productId}`);
  }
  
  /**
   * البحث عن منتجات
   * @param {string} query - نص البحث
   * @returns {Promise<Array>} - نتائج البحث
   */
  async searchProducts(query) {
    return this.request('GET', '/products/search', { q: query });
  }
  
  // ================================================================
  // ===== API Methods - User =====
  // ================================================================
  
  /**
   * حفظ بيانات المستخدم
   * @param {Object} userData - بيانات المستخدم
   * @returns {Promise<Object>} - تأكيد الحفظ
   */
  async saveUserData(userData) {
    return this.request('POST', '/users/save', userData);
  }
  
  /**
   * الحصول على بيانات المستخدم
   * @param {string} userId - معرف المستخدم
   * @returns {Promise<Object>} - بيانات المستخدم
   */
  async getUserData(userId) {
    return this.request('GET', '/users/profile', { userId });
  }
  
  /**
   * تحديث بيانات المستخدم
   * @param {string} userId - معرف المستخدم
   * @param {Object} updates - التحديثات
   * @returns {Promise<Object>} - البيانات المحدثة
   */
  async updateUserData(userId, updates) {
    return this.request('PUT', `/users/${userId}`, updates);
  }
  
  // ================================================================
  // ===== API Methods - Branches =====
  // ================================================================
  
  /**
   * الحصول على جميع الفروع
   * @returns {Promise<Array>} - قائمة الفروع
   */
  async getBranches() {
    return this.request('GET', '/branches');
  }
  
  /**
   * التحقق من توفر فرع
   * @param {string} branchId - معرف الفرع
   * @returns {Promise<Object>} - حالة التوفر
   */
  async checkBranchAvailability(branchId) {
    return this.request('GET', '/branches/availability', { branchId });
  }
  
  /**
   * الحصول على أوقات عمل فرع
   * @param {string} branchId - معرف الفرع
   * @returns {Promise<Object>} - أوقات العمل
   */
  async getBranchHours(branchId) {
    return this.request('GET', `/branches/${branchId}/hours`);
  }
  
  // ================================================================
  // ===== API Methods - Analytics =====
  // ================================================================
  
  /**
   * إرسال حدث تحليلي
   * @param {Object} event - بيانات الحدث
   * @returns {Promise<void>}
   */
  async trackEvent(event) {
    try {
      // استخدام sendBeacon للموثوقية
      if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(event)], {
          type: 'application/json'
        });
        navigator.sendBeacon(`${this.baseURL}/analytics/event`, blob);
        return;
      }
      
      // Fallback
      return this.request('POST', '/analytics/event', event, {
        retries: 1
      });
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }
  }
  
  /**
   * إرسال أحداث متعددة دفعة واحدة
   * @param {Array} events - قائمة الأحداث
   * @returns {Promise<void>}
   */
  async trackEvents(events) {
    try {
      return this.request('POST', '/analytics/events', { events }, {
        retries: 1
      });
    } catch (error) {
      console.warn('Batch analytics tracking failed:', error);
    }
  }
  
  // ================================================================
  // ===== API Methods - Notifications =====
  // ================================================================
  
  /**
   * إرسال إشعار WhatsApp
   * @param {string} phone - رقم الهاتف
   * @param {string} message - نص الرسالة
   * @returns {Promise<Object>} - تأكيد الإرسال
   */
  async sendWhatsAppNotification(phone, message) {
    return this.request('POST', '/notifications/whatsapp', {
      phone,
      message
    });
  }
  
  /**
   * إرسال بريد إلكتروني
   * @param {Object} emailData - بيانات البريد
   * @returns {Promise<Object>} - تأكيد الإرسال
   */
  async sendEmail(emailData) {
    return this.request('POST', '/notifications/email', emailData);
  }
  
  // ================================================================
  // ===== API Methods - Promotions =====
  // ================================================================
  
  /**
   * الحصول على العروض الحالية
   * @returns {Promise<Array>} - قائمة العروض
   */
  async getPromotions() {
    return this.request('GET', '/promotions/active');
  }
  
  /**
   * التحقق من صحة كود خصم
   * @param {string} code - كود الخصم
   * @returns {Promise<Object>} - معلومات الخصم
   */
  async validatePromoCode(code) {
    return this.request('POST', '/promotions/validate', { code });
  }
  
  // ================================================================
  // ===== Error Handling =====
  // ================================================================
  
  /**
   * معالج الأخطاء المركزي
   * @param {Error} error - الخطأ
   * @param {Object} context - سياق الخطأ
   */
  handleError(error, context = {}) {
    console.error('API Error:', {
      message: error.message,
      context,
      environment: this.environment,
      timestamp: new Date().toISOString()
    });
    
    // يمكن إضافة تتبع الأخطاء هنا (Sentry, etc.)
    
    // إرجاع رسالة خطأ مفهومة للمستخدم
    const lang = window.currentLang || 'ar';
    
    if (error.message.includes('timeout')) {
      return lang === 'ar' 
        ? 'انتهت مهلة الاتصال. الرجاء المحاولة مرة أخرى.'
        : 'Connection timeout. Please try again.';
    }
    
    if (error.message.includes('Network')) {
      return lang === 'ar'
        ? 'خطأ في الاتصال بالإنترنت'
        : 'Network connection error';
    }
    
    return lang === 'ar'
      ? 'حدث خطأ غير متوقع. الرجاء المحاولة لاحقاً.'
      : 'An unexpected error occurred. Please try again later.';
  }
}

// ================================================================
// ===== تصدير Instance واحد =====
// ================================================================
export const api = new APIService();

// ================================================================
// ===== تصدير للنافذة العامة =====
// ================================================================
if (typeof window !== 'undefined') {
  window.api = api;
}

console.log('✅ API Service loaded');
console.log('🌐 Environment:', api.environment);
console.log('🔗 Base URL:', api.baseURL || 'Google Apps Script');