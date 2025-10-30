// ================================================================
// app.bootstrap.js - Soft Cream App (Bootstrap-style Core)
// ================================================================
// النسخة: Bootstrap-like entrypoint
// هذا الملف يجمع التهيئة، تحميل الوحدات الأساسية، وتحكم بالبيئة والـ logs
// ================================================================

// ================================================================
// ===== التحكم المتقدم في الـ Logs =====
// ================================================================
const ENABLE_LOGS = true; // غيرها لـ false لتعطيل الـ logs

const IS_DEVELOPMENT = window.location.hostname === 'localhost' ||
                       window.location.hostname === '127.0.0.1';

// Logger ذكي يتعامل مع بيئة التطوير والإنتاج
const Logger = {
  log: (...args) => { if (ENABLE_LOGS && IS_DEVELOPMENT) console.log(...args); },
  info: (...args) => { if (ENABLE_LOGS) console.info(...args); },
  warn: (...args) => { if (ENABLE_LOGS) console.warn(...args); },
  error: (...args) => { console.error(...args); }
};

// في بيئة الإنتاج نخفف الـ console قدر الإمكان
if (!IS_DEVELOPMENT) {
  console.log = console.debug = console.info = console.warn = () => {};
}

// ================================================================
// Global Error Handlers
// ================================================================
window.addEventListener('error', (e) => {
  Logger.error('❌ Uncaught Error:', e.message, e.filename, e.lineno);
});

window.addEventListener('unhandledrejection', (e) => {
  Logger.error('❌ Unhandled Promise Rejection:', e.reason);
});

// ================================================================
// استيراد الوحدات (Core imports)
// ================================================================
import { handleScroll, initCategoriesOffset, createSnowflakes, preventImageDrag, initPassiveTouchEvents, setupFocusTrap } from './utils.js';
import { loadCart, updateCartUI } from './cart.js';
import { renderCategories } from './categories.js';
import { initFuse, renderProducts, updateLanguage, currentLang } from './ui.js';
import { storage } from './storage.js';
import { i18n } from './translations.js';
//import { initGSAPAnimations } from './animations.js';
import { initializeCarousels } from './carousel.js'; // تأكد من المسار الصحيح

// ================================================================
// ===== متغيرات عامة =====
// ================================================================
let userData = null;

// ================================================================
// ===== حفظ واستعادة البيانات (Helper) =====
// ================================================================
function loadSavedData() {
  // ✅ تحميل الثيم من storage
  const savedTheme = storage.getTheme?.();
  if (savedTheme === 'dark') {
    document.body.classList.add('dark');
    const themeIcon = document.getElementById('theme-icon');
    if (themeIcon) {
      themeIcon.setAttribute('data-lucide', 'sun');
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    }
  }

  // ✅ تحميل اللغة من storage
  const savedLang = storage.getLang?.();
  if (savedLang && window.uiModule) {
    window.uiModule.setCurrentLang(savedLang);
    window.currentLang = savedLang;
    document.documentElement.setAttribute('lang', savedLang);
    document.documentElement.setAttribute('dir', savedLang === 'ar' ? 'rtl' : 'ltr');

    const langBtn = document.getElementById('langToggle');
    if (langBtn) {
      langBtn.textContent = savedLang === 'ar' ? 'EN' : 'AR';
    }
  }

  // ✅ تحميل السلة من storage
  if (typeof loadCart === 'function') loadCart();

  // ✅ تحميل بيانات المستخدم من storage
  userData = storage.getUserData?.();
  if (userData) {
    window.userData = userData;
    Logger.log('✅ User data loaded:', userData);
  }
}

// ================================================================
// ===== إعداد Lazy Loading للصور =====
// ================================================================
function setupLazyLoading() {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.classList.remove('lazy');
            imageObserver.unobserve(img);
          }
        }
      });
    });

    window.observeImages = function() {
      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    };

    setTimeout(window.observeImages, 100);
    Logger.log('✅ Lazy loading initialized');
  }
}

// ================================================================
// ===== تنظيف الذاكرة عند الإغلاق =====
// ================================================================
function setupMemoryCleanup() {
  window.addEventListener('beforeunload', function() {
    Logger.log('🧹 Cleaning up memory...');
    // sessionStorage persists until tab close - local memory will be GC'd
  });
}

// ================================================================
// ===== إعداد معالجات الأحداث =====
// ================================================================
function setupEventHandlers() {
  // Scroll handler
  window.addEventListener('scroll', handleScroll, { passive: true });
  Logger.log('✅ Scroll listener attached');

  // Passive touch events
  initPassiveTouchEvents();

  // Prevent image drag
  preventImageDrag();

  // إعداد Focus Trap للـ Modals
  setupFocusTrap('checkoutModal');
  setupFocusTrap('permissionModal');
  setupFocusTrap('processingModal');
  setupFocusTrap('orderConfirmedModal');
  setupFocusTrap('trackingModal');
  setupFocusTrap('cartModal');
  setupFocusTrap('productModal');

  // إعداد إغلاق الـ Modals بـ ESC
  setupEscapeKeyHandlers();

  Logger.log('✅ Event handlers attached');
}

// ================================================================
// ===== إغلاق Modals بمفتاح ESC =====
// ================================================================
function setupEscapeKeyHandlers() {
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
      closeVisibleModals();
    }
  });
}

function closeVisibleModals() {
  const modals = [
    { id: 'checkoutModal', hasShow: true },
    { id: 'permissionModal', hasShow: true },
    { id: 'processingModal', hasShow: false },
    { id: 'orderConfirmedModal', hasShow: false },
    { id: 'trackingModal', hasShow: false },
    { id: 'cartModal', hasShow: true },
    { id: 'productModal', hasShow: true }
  ];

  modals.forEach(({ id, hasShow }) => {
    const modal = document.getElementById(id);
    if (!modal) return;

    const isVisible = hasShow
      ? modal.classList.contains('show')
      : !modal.classList.contains('hidden');

    if (isVisible) {
      if (hasShow) {
        modal.classList.remove('show');
      } else {
        modal.classList.add('hidden');
      }
      document.body.style.overflow = '';
    }
  });
}

// ================================================================
// ===== التهيئة الرئيسية (Init App) =====
// ================================================================
async function initApp() {
  try {
    Logger.log('🚀 Initializing Soft Cream Menu App...');

    // تهيئة الأنيميشن أولاً (اختياري)
    // await initGSAPAnimations?.();

    // تحميل البيانات المحفوظة
    const translationsData = window.i18n?.tData;
    if (translationsData && window.translationManager) {
      window.translationManager.loadTranslations(translationsData);
    }

    loadSavedData();

    // Configure API with dynamic base URL
    if (window.api) {
      try {
        const calculatedBaseURL = window.api.detectBaseURL();
        window.api.configure({ baseURL: calculatedBaseURL, timeout: 30000, retries: 3 });
        Logger.log('✅ API configured for:', calculatedBaseURL);
      } catch (e) {
        Logger.warn('⚠️ API configuration failed, using defaults.');
      }
    }

    // Load products from API (if available)
    if (window.productsManager) {
      try {
        Logger.log('📦 Loading products from API...');
        await window.productsManager.loadProducts();
        Logger.log('✅ Products loaded successfully');
      } catch (error) {
        Logger.error('❌ Failed to load products from API:', error);
        Logger.warn('⚠️ Will attempt to use cached products if available');
      }
    } else {
      Logger.warn('⚠️ productsManager not found. Make sure products.js is loaded.');
    }

    // تهيئة البحث (Fuse.js)
    initFuse();

    // عرض التصنيفات والمنتجات
    renderCategories();

    // تهيئة وعرض الكاروسيلات
    if (typeof initializeCarousels === 'function') {
      initializeCarousels();
      Logger.log('🎠 Carousels initialized.');
    } else {
      Logger.error('❌ initializeCarousels function not found or not imported correctly from carousel.js');
    }

    await renderProducts();

    // تحديث واجهة السلة
    await updateCartUI();

    // تحديث اللغة
    updateLanguage();

    // إعداد معالجات الأحداث
    setupEventHandlers();

    // حفظ موضع الكاتيجوري
    initCategoriesOffset();

    // placeholder البحث
    const searchInput = document.getElementById('searchInput');
    if (searchInput && window.i18n?.t) {
      const lang = window.currentLang || 'ar';
      searchInput.setAttribute('placeholder', window.i18n.t[lang]?.searchPlaceholder || 'ابحث...');
    }

    // Lazy loading
    setupLazyLoading();

    // تنظيف الذاكرة
    setupMemoryCleanup();

    Logger.log('✅ واجهة المستخدم تم تهيئتها بالكامل');
    Logger.log('🍦 Soft Cream Menu App Loaded Successfully! 🎉');

    return true;
  } catch (error) {
    Logger.error('❌ Fatal error during initialization:', error);
    // Error boundary - عرض رسالة خطأ للمستخدم
    const lang = window.currentLang || 'ar';
    document.body.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; text-align: center; font-family: 'Cairo', sans-serif;">
        <div style="font-size: 64px; margin-bottom: 20px;">⚠️</div>
        <h1 style="font-size: 24px; margin-bottom: 10px; color: #1a1a1a;">
          ${lang === 'ar' ? 'حدث خطأ في تحميل التطبيق' : 'Application Loading Error'}
        </h1>
        <p style="font-size: 16px; color: #666; margin-bottom: 20px; max-width: 400px;">
          ${lang === 'ar' ? 'نعتذر عن الإزعاج. يرجى إعادة تحميل الصفحة.' : 'Sorry for the inconvenience. Please reload the page.'}
        </p>
        <button onclick="location.reload()" style="background: #2196F3; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-size: 16px; cursor: pointer; font-family: inherit;">
          ${lang === 'ar' ? 'إعادة تحميل' : 'Reload'}
        </button>
        <p style="font-size: 12px; color: #999; margin-top: 20px;">
          ${error.message}
        </p>
      </div>
    `;
    return false;
  }
}

// ================================================================
// ===== Bootstrap runner - تنظيم مراحل التشغيل =====
// ================================================================
async function bootstrap() {
  Logger.log('🚀 Bootstrap starting...');

  try {
    // 1️⃣ pre-init: environment & lightweight helpers
    initPassiveTouchEvents();
    preventImageDrag();
    loadSavedData();

    // 2️⃣ init core app (UI, cart, carousels, products)
    const ok = await initApp();
    if (!ok) throw new Error('initApp failed');

    // 3️⃣ load heavy or optional modules on-demand
    try {
      const checkoutModule = await import('./checkout.js');
      window.checkoutModule = checkoutModule;
      if (checkoutModule?.initCheckout) {
        // initCheckout might register event listeners but not start checkout flow
        checkoutModule.initCheckout();
      }
      Logger.log('✅ Checkout module loaded after bootstrap');
    } catch (err) {
      Logger.warn('⚠️ Failed to load checkout module (deferred):', err);
    }

    // 4️⃣ finalize UI (post-load hooks)
    try {
      setupLazyLoading();
      setupMemoryCleanup();
      Logger.log('✅ Bootstrap completed');
    } catch (e) {
      Logger.warn('⚠️ Post-bootstrap tasks failed:', e);
    }

    return true;
  } catch (err) {
    Logger.error('💥 Bootstrap fatal error:', err);
    return false;
  }
}

// ================================================================
// ===== تشغيل الـ Bootstrap عند تحميل DOM =====
// ================================================================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    bootstrap();
  });
} else {
  bootstrap();
}

// ================================================================
// ===== تصدير دوال للوصول الخارجي وwindow API =====
// ================================================================
if (typeof window !== 'undefined') {
  // Dummies for ui/cart modules (safe guard)
  window.toggleLanguage = () => window.uiModule?.toggleLanguage?.();
  window.toggleTheme = () => window.uiModule?.toggleTheme?.();
  window.switchTab = (tab) => window.uiModule?.switchTab?.(tab);
  window.handleSearch = () => window.uiModule?.handleSearch?.();
  window.clearSearch = () => window.uiModule?.clearSearch?.();
  window.openProductModal = (id) => window.uiModule?.openProductModal?.(id);
  window.closeProductModal = (e) => window.uiModule?.closeProductModal?.(e);
  window.updateModalQuantity = (delta) => window.uiModule?.updateModalQuantity?.(delta);
  window.addModalToCart = () => window.uiModule?.addModalToCart?.();

  window.openCartModal = () => window.cartModule?.openCartModal?.();
  window.closeCartModal = (e) => window.cartModule?.closeCartModal?.(e);
  window.addToCart = (e, id, qty) => window.cartModule?.addToCart?.(e, id, qty);
  window.updateQuantity = (id, delta) => window.cartModule?.updateQuantity?.(id, delta);
  window.removeFromCart = (id) => window.cartModule?.removeFromCart?.(id);

  window.scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  window.appModule = {
    getUserData: () => userData,
    setUserData: (data) => {
      userData = data;
      window.userData = data;
      storage.setUserData?.(data);
    },
    bootstrap: () => bootstrap(),
    initApp: () => initApp()
  };

  window.userData = userData;

  Logger.log('✅ All global functions exported to window');
}

export { bootstrap, initApp, userData };

Logger.log('✅ App bootstrap module loaded (Clean & Secure)');
