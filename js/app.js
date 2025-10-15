// ================================================================
// ===== التحكم المتقدم في الـ Logs =====
// ================================================================
const ENABLE_LOGS = false;

if (!ENABLE_LOGS) {
  const originalConsole = { ...console };
  
  // تعطيل كل الـ logs
  console.log = console.warn = console.info = console.debug = () => {};
  
  // لكن احتفظ بإمكانية رؤية الأخطاء المهمة
  console.error = (...args) => {
    const message = args[0];
    // اطبع فقط الأخطاء المهمة
    if (typeof message === 'string' && (
      message.includes('Error') ||
      message.includes('Failed') || 
      message.includes('Exception') ||
      message.includes('خطأ')
    )) {
      originalConsole.error(...args);
    }
  };
}

// ممكن تضيف كمان تحكم حسب البيئة
const IS_DEVELOPMENT = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1';

if (!IS_DEVELOPMENT) {
  // في السيرفر/production اطفي كل الـ logs
  console.log = console.warn = console.info = console.debug = console.error = () => {};
} 

// ================================================================
// app.js - الملف الرئيسي للتطبيق (Cleaned & Secure)
// ================================================================

// استيراد الوحدات
import { handleScroll, initCategoriesOffset, createSnowflakes, preventImageDrag, initPassiveTouchEvents, setupFocusTrap } from './utils.js';
import { loadCart, updateCartUI } from './cart.js';
import { renderCategories } from './categories.js';
import { initFuse, renderProducts, updateLanguage, currentLang } from './ui.js';
import { storage } from './storage.js';
import { i18n } from './translations.js';

// ================================================================
// ===== متغيرات عامة =====
// ================================================================
export let userData = null;

// ================================================================
// ===== حفظ واستعادة البيانات =====
// ================================================================
function loadSavedData() {
  // ✅ تحميل الثيم من storage
  const savedTheme = storage.getTheme();
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
  const savedLang = storage.getLang();
  if (savedLang && window.uiModule) {
    window.uiModule.setCurrentLang(savedLang);
    window.currentLang = savedLang;
    document.documentElement.setAttribute('lang', savedLang);
    document.documentElement.setAttribute('dir', savedLang === 'ar' ? 'rtl' : 'ltr');
    
    const langBtn = document.getElementById('langToggle');
    if (langBtn) {
      langBtn.textContent = savedLang === 'ar' ? 'EN' : 'ع';
    }
  }
  
  // ✅ تحميل السلة من storage
  loadCart();
  
  // ✅ تحميل بيانات المستخدم من storage
  userData = storage.getUserData();
  if (userData) {
    window.userData = userData;
    console.log('✅ User data loaded:', userData);
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
    console.log('✅ Lazy loading initialized');
  }
}

// ================================================================
// ===== تنظيف الذاكرة عند الإغلاق =====
// ================================================================
function setupMemoryCleanup() {
  window.addEventListener('beforeunload', function() {
    console.log('🧹 Cleaning up memory...');
    // Note: sessionStorage persists until tab is closed
    // Memory store will be garbage collected
  });
}

// ================================================================
// ===== إعداد معالجات الأحداث =====
// ================================================================
function setupEventHandlers() {
  // Scroll handler
  window.addEventListener('scroll', handleScroll, { passive: true });
  console.log('✅ Scroll listener attached');
  
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
  
  console.log('✅ Event handlers attached');
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
// ===== التهيئة الرئيسية =====
// ================================================================
async function initApp() {
  try {
    console.log('🚀 Initializing Soft Cream Menu App...');

    // أضف في بداية initApp()
    const translationsData = window.i18n.tData;
    if (translationsData && window.translationManager) {
      window.translationManager.loadTranslations(translationsData);
    }
    // 1️⃣ تحميل البيانات المحفوظة من storage
    loadSavedData();
    initGSAPAnimations();

    // 2️⃣ Configure API with dynamic base URL
    if (window.api) {
      const calculatedBaseURL = window.api.detectBaseURL();
      
      window.api.configure({
        baseURL: calculatedBaseURL,
        timeout: 30000,
        retries: 3
      });
      console.log('✅ API configured for:', calculatedBaseURL);
    }
    
    // 3️⃣ تهيئة أيقونات Lucide
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
      console.log('✅ Lucide icons initialized');
    }
  
    // 4️⃣ تحميل المنتجات من API
    if (window.productsManager) {
      try {
        console.log('📦 Loading products from API...');
        await window.productsManager.loadProducts();
        console.log('✅ Products loaded successfully');
      } catch (error) {
        console.error('❌ Failed to load products from API:', error);
        console.warn('⚠️ Will attempt to use cached products if available');
      }
    } else {
      console.warn('⚠️ productsManager not found. Make sure products.js is loaded.');
    }
    
    // 5️⃣ تهيئة البحث (Fuse.js)
    initFuse();
    
    // 6️⃣ عرض التصنيفات والمنتجات
    renderCategories();
    await renderProducts();
    
    // 7️⃣ تحديث واجهة السلة
    await updateCartUI();
    
    // 8️⃣ تحديث اللغة
    updateLanguage();
    
    // 9️⃣ إعداد معالجات الأحداث
    setupEventHandlers();
    
    // 🔟 حفظ موضع الكاتيجوري الأصلي
    initCategoriesOffset();
    
    // 1️⃣1️⃣ إعداد placeholder البحث
    const searchInput = document.getElementById('searchInput');
    if (searchInput && window.i18n.t) {
      const lang = window.currentLang || 'ar';
      searchInput.setAttribute('placeholder', window.i18n.t[lang]?.searchPlaceholder || 'ابحث...');
    }
    
    // 1️⃣2️⃣ إنشاء تأثير الثلج
    createSnowflakes();
    
    // 1️⃣3️⃣ إعداد Lazy Loading
    setupLazyLoading();
    
    // 1️⃣4️⃣ إعداد تنظيف الذاكرة
    setupMemoryCleanup();
    
    console.log('✅ واجهة المستخدم تم تهيئتها بالكامل');
    console.log('🍦 Soft Cream Menu App Loaded Successfully! 🎉');
    
  } catch (error) {
    console.error('❌ Fatal error during initialization:', error);
    
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
  }
}

// ================================================================
// ===== تشغيل التطبيق عند تحميل DOM =====
// ================================================================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// ================================================================
// ===== ✅ تصدير جميع الدوال للـ window (الحل الأساسي)
// ================================================================
// هذا هو الحل للمشكلة الأساسية - جعل كل الدوال متاحة للـ HTML onclick attributes

if (typeof window !== 'undefined') {
  // من ui.js
  window.toggleLanguage = () => window.uiModule?.toggleLanguage?.();
  window.toggleTheme = () => window.uiModule?.toggleTheme?.();
  window.switchTab = (tab) => window.uiModule?.switchTab?.(tab);
  window.handleSearch = () => window.uiModule?.handleSearch?.();
  window.clearSearch = () => window.uiModule?.clearSearch?.();
  window.openProductModal = (id) => window.uiModule?.openProductModal?.(id);
  window.closeProductModal = (e) => window.uiModule?.closeProductModal?.(e);
  window.updateModalQuantity = (delta) => window.uiModule?.updateModalQuantity?.(delta);
  window.addModalToCart = () => window.uiModule?.addModalToCart?.();
  
  // من cart.js
  window.openCartModal = () => window.cartModule?.openCartModal?.();
  window.closeCartModal = (e) => window.cartModule?.closeCartModal?.(e);
  window.addToCart = (e, id, qty) => window.cartModule?.addToCart?.(e, id, qty);
  window.updateQuantity = (id, delta) => window.cartModule?.updateQuantity?.(id, delta);
  window.removeFromCart = (id) => window.cartModule?.removeFromCart?.(id);
  
  // من checkout.js
  window.initiateCheckout = () => window.checkoutModule?.initiateCheckout?.();
  window.openCheckoutModal = () => window.checkoutModule?.openCheckoutModal?.();
  window.closeCheckoutModal = (e) => window.checkoutModule?.closeCheckoutModal?.(e);
  window.selectDeliveryMethod = (method) => window.checkoutModule?.selectDeliveryMethod?.(method);
  window.selectBranch = (branch) => window.checkoutModule?.selectBranch?.(branch);
  window.confirmOrder = () => window.checkoutModule?.confirmOrder?.();
  window.requestLocation = () => window.checkoutModule?.requestLocation?.();
  window.allowLocation = () => window.checkoutModule?.allowLocation?.();
  window.closePermissionModal = () => window.checkoutModule?.closePermissionModal?.();
  
  // دوال مساعدة
  window.scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  
  // تصدير App Module
  window.appModule = {
    getUserData: () => userData,
    setUserData: (data) => {
      userData = data;
      window.userData = data;
      storage.setUserData(data);
    }
  };
  
  window.userData = userData;
  
  console.log('✅ All global functions exported to window');
}

console.log('✅ App module loaded (Clean & Secure)');