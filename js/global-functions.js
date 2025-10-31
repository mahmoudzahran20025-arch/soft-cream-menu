// js/global-functions.js
// Global utility functions for Vanilla JS compatibility
// ✅ Uses utils.js & storage.js to avoid duplication

console.log('🔧 Loading global-functions.js...');

// Wait for utils.js to load
let utilsReady = false;
let storageReady = false;

// Check if utils module is loaded
const checkDependencies = () => {
  utilsReady = typeof window.showToast === 'function';
  storageReady = typeof window.storage !== 'undefined';
  
  if (utilsReady && storageReady) {
    console.log('✅ Dependencies ready (utils.js & storage.js)');
  } else {
    console.warn('⚠️ Waiting for dependencies...', { utilsReady, storageReady });
  }
};

// ================================================================
// 🌍 UPDATE VANILLA UI (المرحلة 2)
// ================================================================
/**
 * دالة تقوم بتحديث كل نصوص الفانيلا
 * @param {string} lang - اللغة الجديدة (مثل 'ar' أو 'en')
 */
function updateVanillaUI(lang) {
  console.log(`🔄 [Vanilla] Updating UI for language: ${lang}`);

  // 1. تحديث اتجاه الصفحة
  document.documentElement.lang = lang;
  document.documentElement.dir = (lang === 'ar') ? 'rtl' : 'ltr';

  // 2. تحديث زر اللغة
  const langBtn = document.getElementById('langToggle');
  if (langBtn) {
    langBtn.textContent = lang === 'ar' ? 'EN' : 'AR';
  }

  // 3. تحديث السايد بار
  if (window.sidebarModule && window.sidebarModule.syncSidebarLanguage) {
    window.sidebarModule.syncSidebarLanguage();
  }

  // 4. (مهم جداً) إعادة بناء السويبرات (Swipers)
  // هذا يحل مشكلة اختفاء الصور
  if (window.featuredSwiperModule?.reInitSwiper) {
    window.featuredSwiperModule.reInitSwiper();
    console.log('🔄 [Vanilla] Re-initializing Featured Swiper for new lang.');
  }
  if (window.marqueeSwiperModule?.reInitSwiper) {
    window.marqueeSwiperModule.reInitSwiper();
    console.log('🔄 [Vanilla] Re-initializing Marquee Swiper for new lang.');
  }

  console.log(`✅ [Vanilla] UI updated for ${lang}`);
}

// ================================================================
// 🌐 Language Toggle (محدث)
// ================================================================
window.toggleLanguage = function() {
  const currentLang = document.documentElement.lang || 'ar';
  const newLang = currentLang === 'ar' ? 'en' : 'ar';
  
  // Save to storage
  if (window.storage) {
    window.storage.setLang(newLang);
  }
  
  // استخدام i18n لتغيير اللغة (سيطلق event تلقائياً)
  if (window.i18n && window.i18n.setLang) {
    window.i18n.setLang(newLang);
    console.log(`🌐 Language switched to: ${newLang} via i18n`);
  } else {
    // Fallback: تحديث يدوي
    updateVanillaUI(newLang);
    // Dispatch event for React
    window.dispatchEvent(new CustomEvent('language-changed', { detail: { lang: newLang } }));
  }
};

// ================================================================
// 🛒 Cart Modal (Vanilla fallback)
// ================================================================
window.openCartModal = function() {
  console.log('🛒 Opening cart modal...');
  
  // Check if React Mini-App is handling the cart
  const reactRoot = document.getElementById('react-shopping-app-root');
  if (reactRoot && reactRoot.children.length > 0) {
    console.log('🆕 Dispatching event to React Mini-App...');
    window.dispatchEvent(new CustomEvent('open-react-cart'));
    return;
  }
  
  // Fallback to vanilla modal
  const modal = document.getElementById('cartModal');
  if (modal) {
    modal.classList.add('show');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    console.log('✅ Cart modal opened (vanilla)');
  } else {
    console.warn('⚠️ Cart modal not found');
  }
};

window.closeCartModal = function(event) {
  if (event && event.target !== event.currentTarget) return;
  
  const modal = document.getElementById('cartModal');
  if (modal) {
    modal.classList.remove('show');
    modal.style.display = 'none';
    document.body.style.overflow = '';
    console.log('✅ Cart modal closed');
  }
};

// ================================================================
// 📑 Tab Switching
// ================================================================
window.switchTab = function(tabName) {
  console.log(`📑 Switching to tab: ${tabName}`);
  
  // Hide all tabs
  const tabs = document.querySelectorAll('.tab-content');
  tabs.forEach(tab => tab.classList.remove('active'));
  
  // Show selected tab
  const selectedTab = document.getElementById(`${tabName}-tab`);
  if (selectedTab) {
    selectedTab.classList.add('active');
  }
  
  // Update nav items
  const navItems = document.querySelectorAll('.sidebar-nav-item');
  navItems.forEach(item => item.classList.remove('active'));
  
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ================================================================
// 📦 Orders Page
// ================================================================
window.openOrdersPage = function() {
  console.log('📦 Opening orders page...');
  // Placeholder - implement your orders page logic
  alert('صفحة الطلبات قيد التطوير');
};

// ================================================================
// 🔝 Scroll to Top
// ================================================================
window.scrollToTop = function() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ================================================================
// 🎨 Theme Toggle
// ================================================================
window.toggleTheme = function() {
  const html = document.documentElement;
  const isDark = html.classList.toggle('dark');
  
  // Save preference using storage.js
  if (window.storage) {
    window.storage.setTheme(isDark ? 'dark' : 'light');
  }
  
  // Update sidebar theme toggle
  if (window.sidebarModule && window.sidebarModule.syncSidebarTheme) {
    window.sidebarModule.syncSidebarTheme();
  }
  
  console.log(`🎨 Theme switched to: ${isDark ? 'dark' : 'light'}`);
  
  // Dispatch event for React
  window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme: isDark ? 'dark' : 'light' } }));
  
  // Show toast using utils.js
  if (window.showToast) {
    window.showToast('success', isDark ? '🌙 الوضع الليلي' : '☀️ الوضع النهاري', '', 1500);
  }
};

// ================================================================
// 🔍 Search (Vanilla fallback - React handles this now)
// ================================================================
window.handleSearch = function() {
  const searchInput = document.getElementById('searchInput');
  if (!searchInput) return;
  
  const query = searchInput.value.trim();
  console.log('🔍 Search query:', query);
  
  // Dispatch event for React to handle
  window.dispatchEvent(new CustomEvent('search-query', { detail: { query } }));
};

// ================================================================
// 📱 Sidebar Functions
// ================================================================
window.openSidebar = function() {
  if (window.sidebarModule && window.sidebarModule.openSidebar) {
    window.sidebarModule.openSidebar();
  } else {
    console.warn('⚠️ Sidebar module not loaded');
  }
};

window.closeSidebar = function() {
  if (window.sidebarModule && window.sidebarModule.closeSidebar) {
    window.sidebarModule.closeSidebar();
  } else {
    console.warn('⚠️ Sidebar module not loaded');
  }
};

window.toggleSidebar = function() {
  if (window.sidebarModule && window.sidebarModule.toggleSidebar) {
    window.sidebarModule.toggleSidebar();
  } else {
    console.warn('⚠️ Sidebar module not loaded');
  }
};

window.clearSearch = function() {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.value = '';
    handleSearch();
  }
};

// ================================================================
// 🚀 Initialize on DOM Ready
// ================================================================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGlobalFunctions);
} else {
  initGlobalFunctions();
}

async function initGlobalFunctions() {
  console.log(' Global functions initialized');
  
  // Check dependencies
  checkDependencies();
  
  // Initialize theme
  if (window.storage) {
    const savedTheme = window.storage.getTheme();
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    }
    
    // Load saved language
    const savedLang = window.storage.getLang() || 'ar';
    document.documentElement.lang = savedLang;
    document.documentElement.dir = savedLang === 'ar' ? 'rtl' : 'ltr';
  }
  
  // CRITICAL: Bootstrap التطبيق أولاً (يحمّل i18n)
  if (window.appModule && window.appModule.bootstrap) {
    console.log(' Starting app bootstrap...');
    await window.appModule.bootstrap();
  } else {
    console.warn(' appModule.bootstrap not available yet, waiting...');
    // انتظر قليلاً ثم حاول مرة أخرى
    setTimeout(async () => {
      if (window.appModule && window.appModule.bootstrap) {
        console.log(' Starting app bootstrap (delayed)...');
        await window.appModule.bootstrap();
      }
    }, 100);
  }
  
  // الاستماع لحدث تغيير اللغة من i18n (بعد Bootstrap)
  setTimeout(() => {
    if (window.i18n && window.i18n.on) {
      window.i18n.on('change', (newLang) => {
        console.log(` [Global] Received language change event: ${newLang}`);
        updateVanillaUI(newLang);
        
        // Dispatch event for React
        window.dispatchEvent(new CustomEvent('language-changed', { detail: { lang: newLang } }));
      });
      console.log(' Subscribed to i18n language change events');
    } else {
      console.warn(' i18n not available, language changes will not be live');
    }
  }, 200);
}

console.log(' global-functions.js loaded successfully');
