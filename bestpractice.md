🎯 الفكرة العامة
الكود ده عبارة عن Backend كامل لنظام طلبات مطعم مبني على Google Apps Script، بيحول Google Sheets لقاعدة بيانات ويقدم REST API للتعامل معاها.

🏗️ المكونات الرئيسية
1️⃣ نظام الـ Configuration (إدارة الإعدادات)
getConfig() / setupSecrets()

بيستخدم PropertiesService لحفظ البيانات الحساسة (زي Telegram Bot Token)
ممتاز: مفيش hardcoded secrets في الكود
بيحدد أسماء الـ Sheets وإعدادات التوصيل

2️⃣ نظام الـ Routing (توجيه الطلبات)
doGet() / doPost() / doPut() / doOptions()

بيتعامل مع HTTP Methods المختلفة
بيوجه الطلبات للـ handlers الصح بناءً على الـ path
ملحوظة: استخدام e.parameter.path ده شوية غريب، عادة بنستخدم URL parameters

3️⃣ CORS Handling (التعامل مع Cross-Origin)
handleCors()

بيسمح بالطلبات من domains محددة
جيد: فيه whitelist للـ origins
تحسين ممكن: ممكن نضيف rate limiting


💰 نظام حساب الأسعار (الجزء الحساس)
calculateOrderPrices()
javascript// Frontend بيبعت:
items: [
  {productId: 'prod_001', quantity: 2},
  {productId: 'prod_003', quantity: 1}
]

// Backend بيحسب كل حاجة
نقاط قوة:

✅ الأسعار بتتحسب كلها في السيرفر
✅ Frontend مش بيبعت أسعار خالص
✅ بيستخدم LockService لمنع race conditions
✅ بيتعامل مع العروض والخصومات من السيرفر

نقطة ذكية جداً:
javascriptconst priceData = calculateOrderPrices(body.items, body.promoCode);
// الـ priceData ده بيتعمل جوا handleSubmitOrder
// يعني مفيش طريقة Frontend يتلاعب بيها

🎁 نظام العروض والخصومات
validatePromotion()

بيتأكد إن الكود صالح ومفعّل
بيشيك على تاريخ الصلاحية
بيشيك على الحد الأدنى للطلب
بيحسب الخصم (نسبة مئوية أو مبلغ ثابت)

مثال:
WELCOME10: خصم 10% على طلبات فوق 50 جنيه

🔒 نظام Idempotency (منع التكرار)
checkIdempotency() / saveIdempotency()
javascript// لو المستخدم ضغط Submit مرتين بسرعة
idempotencyKey: 'user-123-timestamp-456'
كيف بيشتغل:

أول طلب → بيتحفظ في cache
تاني طلب بنفس الـ key → بيرجع نفس النتيجة
بعد ساعة → الـ key بيتمسح

ذكي: بيستخدم PropertiesService كـ O(1) cache + backup في Sheet

📱 تكامل Telegram (الجزء الأقوى)
sendTelegramNotification()
🔔 طلب جديد #ORD-20250113120530-4567

👤 العميل: أحمد محمد
📞 الهاتف: 01234567890
🚚 توصيل للمنزل

🛒 المنتجات:
1. برجر لحم × 2 = 100 ج.م
2. آيس كريم × 1 = 25 ج.م

💰 المبلغ: 125 ج.م
مميزات:

رسالة منسقة بالـ HTML
أزرار interactive: [✅ قبول] [❌ رفض] [📞 اتصال]
لينك Google Maps للموقع
Webhook للرد التفاعلي

handleTelegramCallback()

لما المشغل يضغط "قبول"
بيحدث حالة الطلب في الـ Sheet
بيعدل الرسالة ويضيف timestamp
بيلون الصف (أخضر للمقبول، أحمر للمرفوض)


📊 إدارة البيانات (Sheets كقاعدة بيانات)
Sheets المستخدمة:

الطلبات - Orders history
المنتجات - Product catalog
العروض - Promotions
المستخدمين - User profiles
الفروع - Branch locations
Idempotency_Backup - Duplicate prevention

Smart Design:

كل sheet بيتعمل automatically لو مش موجود
فيه sample data للتجربة السريعة


🔐 الأمان والحماية
✅ نقاط قوة:

Server-side pricing - مفيش تلاعب بالأسعار
LockService - يمنع الـ race conditions
Idempotency - يمنع الطلبات المكررة
CORS whitelist - محدد مين يقدر يستخدم الـ API
Input validation - بيتأكد من البيانات المدخلة
PropertiesService - Secrets مش في الكود

⚠️ نقاط ضعف محتملة:

Authentication منعدم:

أي حد عنده الـ URL يقدر يستخدم الـ API
اقتراح: نضيف API keys أو JWT tokens


Rate Limiting مفيش:

ممكن حد يعمل spam للـ API
اقتراح: نحد الطلبات لكل IP (مثلاً 100 طلب/ساعة)


Google Sheets Performance:

لو فيه آلاف الطلبات، الـ Sheets هتبقى بطيئة
اقتراح: لو المشروع كبر، نفكر في Firebase أو MongoDB


Error Handling أساسي:

javascript   try {
     // code
   } catch (error) {
     Logger.log('Error: ' + error.toString());
     throw error; // بيرجع 500 دايماً
   }

اقتراح: نفرق بين أنواع الـ errors (400 للـ validation، 404 للـ not found)


Validation محدودة:

javascript   if (!body.items || body.items.length === 0) {
     throw new Error('No items in order');
   }

مفيش validation لـ:

Phone number format
Email format
Quantity limits
Product availability




💡 مقترحات للتحسين
1️⃣ Authentication System
javascriptfunction validateApiKey(request) {
  const apiKey = request.headers['X-API-Key'];
  const validKeys = PropertiesService.getScriptProperties()
    .getProperty('VALID_API_KEYS').split(',');
  return validKeys.includes(apiKey);
}
2️⃣ Better Error Responses
javascriptfunction buildErrorResponse(errorType, message, statusCode) {
  return {
    error: {
      type: errorType, // 'validation', 'not_found', 'server_error'
      message: message,
      timestamp: new Date().toISOString()
    }
  };
}
3️⃣ Caching للمنتجات
javascript// بدل ما نقرا الـ Sheet كل مرة
const PRODUCTS_CACHE_KEY = 'PRODUCTS_CACHE';
const CACHE_TTL = 300000; // 5 minutes

function getCachedProducts() {
  const cache = CacheService.getScriptCache();
  let products = cache.get(PRODUCTS_CACHE_KEY);
  
  if (!products) {
    products = getProductsMap();
    cache.put(PRODUCTS_CACHE_KEY, JSON.stringify(products), CACHE_TTL);
  }
  
  return JSON.parse(products);
}
4️⃣ Order Status Tracking محسّن
javascript// بدل "جديد" و "مقبول" نستخدم enum
const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
};
5️⃣ Logging System أحسن
javascriptfunction logEvent(type, data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let logSheet = ss.getSheetByName('API_Logs');
  
  if (!logSheet) {
    logSheet = ss.insertSheet('API_Logs');
    logSheet.appendRow(['Timestamp', 'Type', 'Data', 'User', 'IP']);
  }
  
  logSheet.appendRow([
    new Date(),
    type,
    JSON.stringify(data),
    Session.getActiveUser().getEmail(),
    '' // GAS مش بيقدر يجيب IP للأسف
  ]);
}
6️⃣ Webhook Retry Logic
javascriptfunction sendTelegramNotificationWithRetry(order, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return sendTelegramNotification(order);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      Utilities.sleep(1000 * (i + 1)); // Exponential backoff
    }
  }
}

🎯 تقييم عام
⭐ النقاط الإيجابية:

✅ معمارية نظيفة ومنظمة
✅ Server-side validation قوية
✅ تكامل ممتاز مع Telegram
✅ Documentation واضحة
✅ Test functions موجودة
✅ Idempotency مطبق صح

⚠️ النقاط تحتاج تحسين:

⚠️ Authentication مفقود
⚠️ Rate limiting مفقود
⚠️ Error handling ممكن يكون أفضل
⚠️ Input validation محدودة
⚠️ Logging أساسي جداً
⚠️ Scalability محدودة (Sheets)

🏆 التقييم: 8/10
الكود ممتاز للـ MVP أو مشاريع صغيرة/متوسطة، لكن لو المشروع هيكبر محتاج refactoring وإضافة security layers.

💭 أسئلة للمناقشة:

ليه اخترت Google Sheets بدل Firebase Firestore؟
إيه الـ expected traffic volume؟
هل في plans لتطبيق mobile native؟
الـ Telegram هو الوسيلة الوحيدة للإشعارات؟
في نظام للمخزون (inventory management)؟

عايز نتكلم في أي جزء بالتفصيل؟ 🤔RetryClaude does not have the ability to run the code it generates yet.// ================================================================
// api.js - Enhanced API Service for Firebase + Google Apps Script
// CRITICAL: Never send prices from frontend - backend calculates all prices
// ================================================================

import { generpastedMايضا توافق هذا الملف في ملفات الفرونت اند .. بالنسبه اني هستخدم استضافه فاير باز ؟
تحليلك للكودا والاقترحات 
مناقشه ايضاتحليل شامل لملف api.js وتكامله مع Firebase Hosting

🎯 التقييم العام: ممتاز جداً 9.5/10
الكود ده محترف للغاية ومكتوب بطريقة defensive programming صحيحة، خصوصاً في جزئية الأمان والـ price manipulation prevention.

✅ نقاط القوة الرئيسية
1️⃣ Security-First Approach (الجزء الأهم)
javascript// هذا الجزء BRILLIANT ✨
if (orderData.items.some(item => item.price || item.subtotal)) {
  console.error('❌ SECURITY WARNING: Frontend should not send prices!');
  throw new Error('Invalid order data');
}
التحليل:

بيمنع Frontend من إرسال أي أسعار تماماً
لو حد حاول يعدل الـ request من DevTools → الطلب هيترفض
بيضمن إن كل الأسعار تيجي من Backend فقط
هذا نادر جداً في المشاريع العربية 👏


2️⃣ Retry Logic with Exponential Backoff
javascriptconst backoff = Math.min(Math.pow(2, attempt) * 1000, 10000);
// Attempt 1: 2s
// Attempt 2: 4s  
// Attempt 3: 8s
// Max: 10s
ممتاز لأنه:

بيقلل الضغط على السيرفر
بيديك فرصة تتعافى من الأخطاء المؤقتة
محدد بـ 10 ثواني maximum (عشان ما يستناش forever)


3️⃣ Idempotency Key Generation
javascriptconst idempotencyKey = orderData.idempotencyKey || this.generateIdempotencyKey();
التكامل مع Backend:

بيمنع duplicate orders لو المستخدم ضغط مرتين
بيشتغل مع الـ checkIdempotency() في Backend
Perfect coordination بين Frontend و Backend


4️⃣ Smart Error Handling
javascript// Don't retry on client errors (4xx)
if (error.status >= 400 && error.status < 500) {
  throw error;
}
ذكي لأنه:

4xx errors (validation) → مفيش فايدة من الـ retry
5xx errors (server) → ممكن تنجح في المحاولة التانية
بيوفر network bandwidth ووقت المستخدم


5️⃣ Analytics with sendBeacon
javascript// Try sendBeacon first (more reliable for page unload)
if (navigator.sendBeacon && this.baseURL) {
  const sent = navigator.sendBeacon(url, blob);
  if (sent) return;
}
هذا ذكي جداً:

sendBeacon بيشتغل حتى لو المستخدم قفل الصفحة
مفيد للـ page unload events
Fallback للـ regular POST لو فشل
معظم المطورين مش بيعرفوا الـ feature دي 🎓


🔥 التكامل مع Firebase Hosting
✅ الملف متوافق 100% مع Firebase
javascriptdetectEnvironment() {
  if (window.location.hostname.includes('firebaseapp.com') || 
      window.location.hostname.includes('web.app')) {
    return 'firebase';
  }
  // ...
}
المميزات:

بيكتشف Firebase hosting automatically
بيتعامل مع كل من .firebaseapp.com و .web.app
بيفرق بين development و production


🎨 السيناريو الكامل لـ Firebase Hosting
1. هيكل المشروع:
my-restaurant-app/
├── public/                    ← Firebase hosting root
│   ├── index.html
│   ├── js/
│   │   ├── api.js            ← الملف ده
│   │   ├── app.js
│   │   ├── cart.js
│   │   └── utils.js
│   ├── css/
│   └── assets/
├── firebase.json              ← Firebase config
├── .firebaserc
└── .gitignore

2. إعداد Firebase (خطوة بخطوة):
أ. تثبيت Firebase CLI:
bashnpm install -g firebase-tools
firebase login
ب. تهيئة المشروع:
bashfirebase init hosting

# اختر:
# - Public directory: public
# - Configure as single-page app: Yes
# - Setup automatic builds: No (for now)
ج. firebase.json:
json{
  "hosting": {
    "public": "public",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css|woff2)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      },
      {
        "source": "**",
        "headers": [
          {
            "key": "X-Content-Type-Options",
            "value": "nosniff"
          },
          {
            "key": "X-Frame-Options",
            "value": "SAMEORIGIN"
          }
        ]
      }
    ]
  }
}

3. تكوين الـ API في app.js:
javascript// في public/js/app.js

import { api } from './api.js';

// 🔥 CRITICAL: Configure API on app initialization
const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';

api.configure({
  baseURL: GAS_WEB_APP_URL,
  timeout: 30000,
  retries: 3
});

// التأكد من الإعداد
console.log('✅ API configured for:', api.environment);
console.log('🔗 Connected to:', api.baseURL);

4. استخدام الـ API في الـ Cart:
javascript// في public/js/cart.js

async function checkout() {
  const cartItems = getCartItems(); // من localStorage
  
  // 🎯 IMPORTANT: Only send IDs and quantities
  const orderData = {
    items: cartItems.map(item => ({
      productId: item.id,        // فقط الـ ID
      quantity: item.quantity    // فقط الكمية
    })),
    customer: {
      name: document.getElementById('customerName').value,
      phone: document.getElementById('customerPhone').value,
      address: document.getElementById('customerAddress').value,
      notes: document.getElementById('notes').value
    },
    deliveryMethod: getSelectedDeliveryMethod(),
    branch: getSelectedBranch(),
    promoCode: document.getElementById('promoCode').value || null,
    location: await getCurrentLocation() // إذا كان متاحاً
  };
  
  try {
    showLoadingSpinner();
    
    // 🚀 Submit order - Backend calculates everything
    const result = await api.submitOrder(orderData);
    
    // 💰 Backend returns calculated prices
    console.log('Order submitted:', result.orderId);
    console.log('ETA:', result.eta);
    console.log('Calculated prices:', result.calculatedPrices);
    
    // 📊 Display confirmation (read-only prices)
    showOrderConfirmation({
      orderId: result.orderId,
      eta: result.eta,
      items: result.calculatedPrices.items,
      subtotal: result.calculatedPrices.subtotal,
      discount: result.calculatedPrices.discount,
      deliveryFee: result.calculatedPrices.deliveryFee,
      total: result.calculatedPrices.total
    });
    
    // Clear cart after successful order
    clearCart();
    
    // Track conversion
    api.trackEvent({
      name: 'purchase',
      orderId: result.orderId,
      value: result.calculatedPrices.total,
      currency: 'EGP'
    });
    
  } catch (error) {
    console.error('Order submission failed:', error);
    
    // 🌍 Show user-friendly message
    const message = api.getErrorMessage(error, 'ar');
    showErrorMessage(message);
    
  } finally {
    hideLoadingSpinner();
  }
}

⚠️ ملاحظات مهمة جداً
🔴 1. CORS في Google Apps Script
المشكلة:
javascriptheaders['Origin'] = window.location.origin;
// هيبقى: https://your-project.web.app
الحل في Code.gs:
javascript// في setupSecrets()
props.setProperties({
  'ALLOWED_ORIGINS': 'https://your-project.web.app,https://your-project.firebaseapp.com',
  // ...
});
❗ مهم: لازم تضيف Firebase domain في ALLOWED_ORIGINS قبل ما تنشر!

🔴 2. localStorage في الـ API
javascriptgetAuthToken() {
  try {
    return localStorage.getItem('authToken');
  } catch (e) {
    return null;
  }
}
ممتاز: استخدام try-catch عشان:

Safari private mode بيرفض localStorage
بعض الـ browsers القديمة
الكود مش هيcrash


🔴 3. Session ID
javascriptgetSessionId() {
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
Excellent: استخدام sessionStorage (مش localStorage) لأن:

الـ session بتنتهي لما المستخدم يقفل الـ tab
مناسب للـ analytics tracking
مش بيشغل storage space كتير


💡 اقتراحات للتحسين
1️⃣ Environment Variables (أهم حاجة)
المشكلة الحالية:
javascriptconst GAS_WEB_APP_URL = 'https://script.google.com/...'; // hardcoded في app.js
الحل الأفضل:
أ. إنشاء ملف .env (مش للنشر):
bash# .env.local
VITE_API_BASE_URL=https://script.google.com/macros/s/DEV_ID/exec

# .env.production  
VITE_API_BASE_URL=https://script.google.com/macros/s/PROD_ID/exec
ب. استخدام Vite أو Webpack:
javascript// في app.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

api.configure({
  baseURL: API_BASE_URL
});
ج. أو باستخدام Firebase Remote Config:
javascript// في app.js
import { getRemoteConfig, fetchAndActivate, getString } from 'firebase/remote-config';

async function initializeAPI() {
  const remoteConfig = getRemoteConfig();
  await fetchAndActivate(remoteConfig);
  
  const apiBaseURL = getString(remoteConfig, 'api_base_url');
  
  api.configure({
    baseURL: apiBaseURL
  });
}
الفوائد:

✅ مفيش hardcoded URLs
✅ سهل تغيير الـ API بدون deployment
✅ يدعم multiple environments


2️⃣ Request Queue للـ Offline Support
javascriptclass APIService {
  constructor() {
    // ... existing code
    this.requestQueue = [];
    this.isOnline = navigator.onLine;
    
    window.addEventListener('online', () => this.flushQueue());
    window.addEventListener('offline', () => this.isOnline = false);
  }
  
  async request(method, endpoint, data, options) {
    // إذا offline، حفظ في queue
    if (!this.isOnline && method === 'POST') {
      return this.queueRequest(method, endpoint, data, options);
    }
    
    // ... existing logic
  }
  
  queueRequest(method, endpoint, data, options) {
    this.requestQueue.push({ method, endpoint, data, options });
    
    // Save to localStorage for persistence
    try {
      localStorage.setItem('pendingRequests', JSON.stringify(this.requestQueue));
    } catch (e) {}
    
    return Promise.resolve({
      success: true,
      data: { queued: true, message: 'سيتم إرسال الطلب عند الاتصال بالإنترنت' }
    });
  }
  
  async flushQueue() {
    this.isOnline = true;
    
    const queue = [...this.requestQueue];
    this.requestQueue = [];
    
    for (const req of queue) {
      try {
        await this.request(req.method, req.endpoint, req.data, req.options);
      } catch (e) {
        console.error('Failed to send queued request:', e);
      }
    }
    
    localStorage.removeItem('pendingRequests');
  }
}
الفائدة:

المستخدم يقدر يكمل الطلب حتى لو الإنترنت انقطع
الطلب هيتبعت automatically لما الإنترنت يرجع


3️⃣ Request Cancellation
javascriptclass APIService {
  constructor() {
    // ... existing code
    this.pendingRequests = new Map();
  }
  
  async request(method, endpoint, data, options) {
    const requestId = `${method}-${endpoint}-${Date.now()}`;
    
    // Cancel previous request to same endpoint if specified
    if (options.cancelPrevious) {
      this.cancelRequest(requestId);
    }
    
    const controller = new AbortController();
    this.pendingRequests.set(requestId, controller);
    
    try {
      // ... existing request logic with controller.signal
      
      return result;
    } finally {
      this.pendingRequests.delete(requestId);
    }
  }
  
  cancelRequest(requestId) {
    const controller = this.pendingRequests.get(requestId);
    if (controller) {
      controller.abort();
      this.pendingRequests.delete(requestId);
    }
  }
  
  cancelAllRequests() {
    for (const [id, controller] of this.pendingRequests) {
      controller.abort();
    }
    this.pendingRequests.clear();
  }
}
الفائدة:

لو المستخدم غير رأيه (مثلاً: search في المنتجات)
بتوفر bandwidth وموارد السيرفر


4️⃣ Response Caching
javascriptclass APIService {
  constructor() {
    // ... existing code
    this.cache = new Map();
    this.cacheConfig = {
      '/products': 300000,        // 5 minutes
      '/branches': 600000,        // 10 minutes
      '/promotions/active': 60000 // 1 minute
    };
  }
  
  async request(method, endpoint, data, options) {
    // Only cache GET requests
    if (method === 'GET' && this.cacheConfig[endpoint]) {
      const cached = this.getFromCache(endpoint);
      if (cached) {
        console.log('📦 Returning cached response:', endpoint);
        return cached;
      }
    }
    
    const result = await this.httpRequest(method, endpoint, data, options);
    
    // Cache successful GET responses
    if (method === 'GET' && this.cacheConfig[endpoint] && result.success) {
      this.saveToCache(endpoint, result, this.cacheConfig[endpoint]);
    }
    
    return result;
  }
  
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }
  
  saveToCache(key, data, ttl) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }
  
  clearCache(key) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }
}
الفائدة:

أسرع في التحميل
أقل استهلاك للـ Google Apps Script quota
تجربة مستخدم أفضل


5️⃣ Request Deduplication
javascriptclass APIService {
  constructor() {
    // ... existing code
    this.inflightRequests = new Map();
  }
  
  async request(method, endpoint, data, options) {
    // Create request key
    const requestKey = `${method}-${endpoint}-${JSON.stringify(data || {})}`;
    
    // Check if same request is already in flight
    if (this.inflightRequests.has(requestKey)) {
      console.log('🔄 Reusing inflight request:', requestKey);
      return this.inflightRequests.get(requestKey);
    }
    
    // Create new request promise
    const requestPromise = this.httpRequest(method, endpoint, data, options)
      .finally(() => {
        // Remove from inflight after completion
        this.inflightRequests.delete(requestKey);
      });
    
    // Store inflight request
    this.inflightRequests.set(requestKey, requestPromise);
    
    return requestPromise;
  }
}
الفائدة:

لو component عمل نفس الـ request مرتين في نفس الوقت
هيستخدم نفس الـ response بدل ما يعمل 2 requests


6️⃣ Better TypeScript Support (Optional)
typescript// api.types.ts
export interface OrderItem {
  productId: string;
  quantity: number;
}

export interface Customer {
  name: string;
  phone: string;
  address?: string;
  email?: string;
  notes?: string;
}

export interface OrderData {
  items: OrderItem[];
  customer: Customer;
  deliveryMethod: 'delivery' | 'pickup';
  branch?: string;
  location?: { lat: number; lng: number };
  promoCode?: string;
}

export interface OrderResponse {
  orderId: string;
  eta: string;
  etaEn: string;
  calculatedPrices: {
    items: Array<{
      productId: string;
      name: string;
      price: number;
      quantity: number;
      subtotal: number;
    }>;
    subtotal: number;
    discount: number;
    deliveryFee: number;
    total: number;
  };
}

🚀 خطة النشر الكاملة على Firebase
المرحلة 1: التطوير المحلي
bash# 1. Clone the project
git clone https://github.com/your-repo/restaurant-app
cd restaurant-app

# 2. Install dependencies
npm install

# 3. Setup Firebase
firebase init hosting

# 4. Configure API URL in .env.local
echo "VITE_API_BASE_URL=https://script.google.com/macros/s/YOUR_DEV_ID/exec" > .env.local

# 5. Run locally
npm run dev
# أو
firebase serve

المرحلة 2: اختبار Google Apps Script
bash# 1. Deploy GAS as Web App
# في Google Apps Script Editor:
# - Deploy > New deployment > Web app
# - Execute as: Me
# - Who has access: Anyone
# - Copy Web App URL

# 2. Update ALLOWED_ORIGINS في setupSecrets()
# Add: http://localhost:5173, http://localhost:5000

# 3. Test من المتصفح
curl "YOUR_GAS_URL?path=/products"

المرحلة 3: النشر على Firebase
bash# 1. Build for production
npm run build

# 2. Test locally
firebase serve

# 3. Deploy
firebase deploy --only hosting

# 4. Get Firebase URL
# https://your-project.web.app

# 5. Update GAS ALLOWED_ORIGINS
# Add: https://your-project.web.app

# 6. Update .env.production
echo "VITE_API_BASE_URL=https://script.google.com/macros/s/YOUR_PROD_ID/exec" > .env.production

# 7. Rebuild and redeploy
npm run build
firebase deploy --only hosting

المرحلة 4: التحقق
bash# 1. Test production URL
curl "https://your-project.web.app"

# 2. Test API integration
# افتح DevTools Console في المتصفح
# تأكد من رؤية:
# ✅ API Service loaded
# ✅ API configured for: firebase
# 🔗 Connected to: https://script.google.com/...

# 3. Test order submission
# جرب تعمل order كامل من الموقع

# 4. Check Telegram
# تأكد إن الإشعار وصل

# 5. Check Google Sheet
# تأكد إن البيانات اتسجلت

🔒 Security Checklist للـ Production
markdown✅ BEFORE GOING LIVE:

Frontend (Firebase):
- [ ] Remove console.log statements (أو استخدم production logger)
- [ ] Enable HTTPS only
- [ ] Set proper CSP headers في firebase.json
- [ ] Configure Firebase Security Rules
- [ ] Enable Firebase App Check
- [ ] Add rate limiting في Firebase Functions
- [ ] Remove hardcoded API URLs
- [ ] Validate all user inputs
- [ ] Sanitize HTML content
- [ ] Enable error tracking (Sentry, etc.)

Backend (Google Apps Script):
- [ ] Update ALLOWED_ORIGINS with production URLs only
- [ ] Remove test functions (testOrder, testCallback, etc.)
- [ ] Verify all prices come from sheets
- [ ] Enable detailed logging
- [ ] Set up monitoring alerts
- [ ] Test Telegram webhook
- [ ] Verify idempotency working
- [ ] Test all endpoints with curl
- [ ] Check LockService is working
- [ ] Verify promotion calculations

Google Sheets:
- [ ] Restrict edit access
- [ ] Backup regularly
- [ ] Monitor for unusual activity
- [ ] Set up data validation rules
- [ ] Create readonly views for reporting

Telegram:
- [ ] Test accept/reject buttons
- [ ] Verify operator names appear
- [ ] Check notification timing
- [ ] Test with different order types

📊 المقارنة النهائية
المعيارالكود الحاليبعد التحسيناتSecurity⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐Performance⭐⭐⭐⭐⭐⭐⭐⭐⭐Reliability⭐⭐⭐⭐⭐⭐⭐⭐⭐User Experience⭐⭐⭐⭐⭐⭐⭐⭐⭐Maintainability⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐Scalability⭐⭐⭐⭐⭐⭐⭐

🎓 الخلاصة
الكود الحالي:

✅ ممتاز جداً في الأمان والـ architecture
✅ جاهز للإنتاج مع تعديلات بسيطة
✅ متوافق 100% مع Firebase Hosting
✅ يتبع best practices في معظم الجوانب

التحسينات المقترحة:

Environment variables management
Offline support & request queue
Response caching
Request cancellation & deduplication
Better monitoring & logging

الخطوة التالية:

نشر Google Apps Script
إعداد Firebase project
تحديث ALLOWED_ORIGINS
اختبار التكامل
النشر على Firebase

جاهز للبدء؟ 🚀