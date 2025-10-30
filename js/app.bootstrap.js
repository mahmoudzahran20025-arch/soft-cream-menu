// ================================================================
// app.bootstrap.js - Soft Cream App (Optimized v2.0)
// ================================================================
// ✅ فصل كامل للـ Modules المستقلة
// ✅ منع Race Conditions
// ✅ منع تكرار التهيئة
// ✅ Error Isolation (الباك اند معزول)
// ================================================================

// ================================================================
// ===== التحكم في الـ Logs =====
// ================================================================
const ENABLE_LOGS = true;
const IS_DEVELOPMENT = window.location.hostname === 'localhost' ||
                       window.location.hostname === '127.0.0.1';

const Logger = {
  log: (...args) => { if (ENABLE_LOGS && IS_DEVELOPMENT) console.log(...args); },
  info: (...args) => { if (ENABLE_LOGS) console.info(...args); },
  warn: (...args) => { if (ENABLE_LOGS) console.warn(...args); },
  error: (...args) => { console.error(...args); }
};

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
// ===== استيراد الوحدات (فقط ما نحتاجه) =====
// ================================================================
import './translations.js'; // ⭐ استيراد لتشغيل الملف فقط (Side Effect)
import { handleScroll, initCategoriesOffset, preventImageDrag, initPassiveTouchEvents, setupFocusTrap } from './utils.js';
import { loadCart, updateCartUI } from './cart.js';
import { renderCategories } from './categories.js';
import { initFuse, renderProducts, updateLanguage } from './ui.js';
import { storage } from './storage.js';

import { i18n } from './translations.js'; // ⭐ رجّع السطر ده هنا
// ⚠️ لا نستورد carousel.js هنا - يتحمل بشكل مستقل

// ================================================================
// ===== متغيرات عامة =====
// ================================================================
let userData = null;
let isInitialized = false; // ✅ منع التهيئة المكررة

// ================================================================
// ===== حفظ واستعادة البيانات =====
// ================================================================
function loadSavedData() {
  // Theme
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

  // Language
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

  // Cart
  if (typeof loadCart === 'function') loadCart();

  // User Data
  userData = storage.getUserData?.();
  if (userData) {
    window.userData = userData;
    Logger.log('✅ User data loaded:', userData);
  }
}

// ================================================================
// ===== إعداد معالجات الأحداث =====
// ================================================================
function setupEventHandlers() {
  window.addEventListener('scroll', handleScroll, { passive: true });
  initPassiveTouchEvents();
  preventImageDrag();

  // Focus Trap للـ Modals
  const modals = ['checkoutModal', 'permissionModal', 'processingModal', 
                  'orderConfirmedModal', 'trackingModal', 'cartModal', 'productModal'];
  modals.forEach(id => setupFocusTrap(id));

  // ESC للإغلاق
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeVisibleModals();
  });

  Logger.log('✅ Event handlers attached');
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
// ===== التهيئة الرئيسية (بدون Carousel) =====
// ================================================================
async function initApp() {
  // ✅ منع التهيئة المكررة
  if (isInitialized) {
    Logger.warn('⚠️ App already initialized, skipping...');
    return true;
  }

  try {
    Logger.log('🚀 Initializing Soft Cream App (without Carousel)...');

    // تحميل الترجمات
    const translationsData = window.i18n?.tData;
    if (translationsData && window.translationManager) {
      window.translationManager.loadTranslations(translationsData);
    }

    // تحميل البيانات المحفوظة
    loadSavedData();

    // API Configuration (مع error handling)
    if (window.api) {
      try {
        const baseURL = window.api.detectBaseURL();
        window.api.configure({ baseURL, timeout: 30000, retries: 3 });
        Logger.log('✅ API configured:', baseURL);
      } catch (e) {
        Logger.warn('⚠️ API configuration failed, using defaults');
      }
    }

    // Load Products (مع fallback)
    if (window.productsManager) {
      try {
        Logger.log('📦 Loading products from API...');
        await window.productsManager.loadProducts();
        Logger.log('✅ Products loaded');
      } catch (error) {
        Logger.error('❌ Failed to load products:', error);
        Logger.warn('⚠️ Using cached products if available');
      }
    } else {
      Logger.warn('⚠️ productsManager not found');
    }

    // تهيئة البحث
    initFuse();

    // عرض التصنيفات والمنتجات
    renderCategories();
    await renderProducts();

    // تحديث السلة
    await updateCartUI();

    // تحديث اللغة
    updateLanguage();

    // Event Handlers
    setupEventHandlers();

    // Categories Offset
    initCategoriesOffset();

    // Search Placeholder
    const searchInput = document.getElementById('searchInput');
    if (searchInput && window.i18n?.t) {
      const lang = window.currentLang || 'ar';
      searchInput.setAttribute('placeholder', 
        window.i18n.t[lang]?.searchPlaceholder || 'ابحث...');
    }

    // ✅ تم الانتهاء
    isInitialized = true;
    Logger.log('✅ App initialized successfully (without Carousel)');
    Logger.log('🍦 Soft Cream Menu App Ready! 🎉');

    return true;
  } catch (error) {
    Logger.error('❌ Fatal error during initialization:', error);
    showErrorScreen(error);
    return false;
  }
}

// ================================================================
// ===== Error Screen =====
// ================================================================
function showErrorScreen(error) {
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
}

// ================================================================
// ===== Bootstrap Runner =====
// ================================================================
async function bootstrap() {
  Logger.log('🚀 Bootstrap starting (independent mode)...');

  try {
    // Init core app (without Carousel)
    const ok = await initApp();
    if (!ok) throw new Error('initApp failed');

    Logger.log('✅ Bootstrap completed');
    
    // ✅ Dispatch event للإشعار بأن Bootstrap انتهى
    window.dispatchEvent(new CustomEvent('app:bootstrapped'));
    
    return true;
  } catch (err) {
    Logger.error('💥 Bootstrap fatal error:', err);
    return false;
  }
}

// ================================================================
// ===== تشغيل Bootstrap (لن يتم استدعاؤه تلقائياً) =====
// ================================================================
// ⚠️ لا نشغله هنا - سيتم استدعاؤه من HTML inline script

// ================================================================
// ===== تصدير للوصول الخارجي =====
// ================================================================
if (typeof window !== 'undefined') {
  // UI Functions
  window.toggleLanguage = () => window.uiModule?.toggleLanguage?.();
  window.toggleTheme = () => window.uiModule?.toggleTheme?.();
  window.switchTab = (tab) => window.uiModule?.switchTab?.(tab);
  window.handleSearch = () => window.uiModule?.handleSearch?.();
  window.clearSearch = () => window.uiModule?.clearSearch?.();
  window.openProductModal = (id) => window.uiModule?.openProductModal?.(id);
  window.closeProductModal = (e) => window.uiModule?.closeProductModal?.(e);
  window.updateModalQuantity = (delta) => window.uiModule?.updateModalQuantity?.(delta);
  window.addModalToCart = () => window.uiModule?.addModalToCart?.();

  // Cart Functions
  window.openCartModal = () => window.cartModule?.openCartModal?.();
  window.closeCartModal = (e) => window.cartModule?.closeCartModal?.(e);
  window.addToCart = (e, id, qty) => window.cartModule?.addToCart?.(e, id, qty);
  window.updateQuantity = (id, delta) => window.cartModule?.updateQuantity?.(id, delta);
  window.removeFromCart = (id) => window.cartModule?.removeFromCart?.(id);

  // Utilities
  window.scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  // App Module
  window.appModule = {
    getUserData: () => userData,
    setUserData: (data) => {
      userData = data;
      window.userData = data;
      storage.setUserData?.(data);
    },
    bootstrap: () => bootstrap(),
    initApp: () => initApp(),
    isInitialized: () => isInitialized
  };

  window.userData = userData;

  Logger.log('✅ Global functions exported');
}

export { bootstrap, initApp, userData };

Logger.log('✅ App bootstrap module loaded (v2.0 - Independent)');