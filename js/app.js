// ================================================================
// app.js - الملف الرئيسي للتطبيق
// ================================================================

// استيراد الوحدات
import { handleScroll, initCategoriesOffset, createSnowflakes, preventImageDrag, initPassiveTouchEvents, setupFocusTrap } from './utils.js';
import { loadCart, updateCartUI } from './cart.js';
import { renderCategories } from './categories.js';
import { initFuse, renderProducts, updateLanguage, currentLang } from './ui.js';

// ================================================================
// ===== متغيرات عامة =====
// ================================================================
export let userData = null; // بيانات المستخدم للولاء (name, phone, visitCount)

// ================================================================
// ===== حفظ واستعادة البيانات =====
// ================================================================
function loadSavedData() {
  // تحميل الثيم
  const savedTheme = localStorage.getItem('theme');
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
  
  // تحميل اللغة
  const savedLang = localStorage.getItem('language');
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
  
  // تحميل السلة
  loadCart();
  
  // تحميل بيانات المستخدم
  const savedUser = localStorage.getItem('userData');
  if (savedUser) {
    try {
      userData = JSON.parse(savedUser);
      window.userData = userData;
      console.log('✅ User data loaded:', userData);
    } catch (e) {
      userData = null;
      console.warn('Could not load user data:', e);
    }
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
    console.log('🚀 Initializing Soft Cream Menu App...');
    
    // 1️⃣ تحميل البيانات المحفوظة
    loadSavedData();
    
    // 2️⃣ Configure API
    // ⚠️ IMPORTANT: Set your Google Apps Script Web App URL here
    /*
    if (window.api) {
      // TODO: Replace with your actual GAS Web App URL
      const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwNu_AF_Fk0GpaR26sWCa9t4BP-dywUbUl51Ij9AWh4eu8PczLFaqxCA0Kekayn3p8N/exec';
      
      // Check if URL is configured
      if (GAS_WEB_APP_URL.includes('YOUR_DEPLOYMENT_ID')) {
        console.warn('⚠️ API baseURL not configured! Products will not load from backend.');
        console.warn('⚠️ Please update GAS_WEB_APP_URL in app.js with your Google Apps Script deployment URL');
      } else {
        window.api.configure({
          baseURL: GAS_WEB_APP_URL,
          timeout: 30000,
          retries: 3
        });
        console.log('✅ API configured');
      }
    }*/
    // 1️⃣ Configure API مباشرة
    // 2️⃣ Configure API مع Base URL ديناميكي
    if (window.api) {
      window.api.configure({
        baseURL: detectBaseURL(), // استدعاء الدالة الجديدة
        timeout: 30000,
        retries: 3
      });
      console.log('✅ API configured for:', detectBaseURL());
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
  await renderProducts();  // ✅ Changed to async
  
  // 7️⃣ تحديث واجهة السلة
  updateCartUI();
  
  // 8️⃣ تحديث اللغة
  updateLanguage();
  
  // 9️⃣ إعداد معالجات الأحداث
  setupEventHandlers();
  
  // 🔟 حفظ موضع الكاتيجوري الأصلي
  initCategoriesOffset();
  
  // 1️⃣1️⃣ إعداد placeholder البحث
  const searchInput = document.getElementById('searchInput');
  if (searchInput && window.translations) {
    const lang = window.currentLang || 'ar';
    searchInput.setAttribute('placeholder', window.translations[lang]?.searchPlaceholder || 'ابحث...');
  }
  
  // 1️⃣2️⃣ إنشاء تأثير الثلج
  createSnowflakes();
  
  // 1️⃣3️⃣ إعداد Lazy Loading
  setupLazyLoading();
  
  // 1️⃣4️⃣ إعداد تنظيف الذاكرة
  setupMemoryCleanup();
  
  console.log('✅ واجهة المستخدم تم تهيئتها بالكامل');
  console.log('🍦 Soft Cream Menu App Loaded Successfully! 🎉');
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
// ===== تصدير للنافذة العامة =====
// ================================================================
if (typeof window !== 'undefined') {
  window.appModule = {
    getUserData: () => userData,
    setUserData: (data) => {
      userData = data;
      window.userData = data;
      try {
        localStorage.setItem('userData', JSON.stringify(data));
      } catch (e) {
        console.warn('Could not save user data:', e);
      }
    }
  };
  
  window.userData = userData;
}