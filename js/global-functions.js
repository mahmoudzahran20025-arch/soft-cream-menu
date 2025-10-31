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
  window.currentLang = lang; // ⚡ CRITICAL: Update global variable

  // 2. تحديث زر اللغة
  const langBtn = document.getElementById('langToggle');
  if (langBtn) {
    langBtn.textContent = lang === 'ar' ? 'EN' : 'AR';
  }

  // 3. تحديث كل العناصر اللي فيها data-i18n
  if (window.i18n && window.i18n.t) {
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      const translation = window.i18n.t(key);
      if (translation && translation !== key) {
        element.textContent = translation;
      }
    });
    console.log('🔄 [Vanilla] Updated all data-i18n elements');
  }

  // 4. تحديث السايد بار
  if (window.sidebarModule && window.sidebarModule.syncSidebarLanguage) {
    window.sidebarModule.syncSidebarLanguage();
  }

  // 5. تحديث Swiper text content (بدون re-init)
  // Re-init بيمسح الصور، فمش محتاجينه
  if (window.marqueeSwiperModule?.updateMarqueeText) {
    window.marqueeSwiperModule.updateMarqueeText(lang);
    console.log('🔄 [Vanilla] Updated Marquee text for new lang.');
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
  console.log('✅ Global functions initialized');
  
  // Check dependencies
  checkDependencies();
  
  // ⚡ CRITICAL: Initialize i18n system
  if (typeof window.i18n === 'undefined') {
    // Dynamic import of i18n modules
    try {
      console.log('🔄 Loading i18n modules...');
      
      const translationsModule = await import('./translations.js');
      const dataModule = await import('./translations-data.js');
      const additionsModule = await import('./translations-data-additions.js');
      
      const { i18n } = translationsModule;
      const { translationsData } = dataModule;
      const { translationsAdditions } = additionsModule;
      
      console.log('📦 Modules loaded:', { 
        i18n: !!i18n, 
        data: !!translationsData, 
        additions: !!translationsAdditions 
      });
      
      // Load base translations
      if (i18n && translationsData) {
        const success = i18n.loadTranslations?.(translationsData);
        if (success) {
          console.log('✅ i18n base data loaded');
        } else {
          console.error('❌ Failed to load base translations');
          return;
        }
      } else {
        console.error('❌ Missing i18n or translationsData');
        return;
      }
      
      // Add additional translations
      if (translationsAdditions && i18n.addTranslations) {
        Object.keys(translationsAdditions).forEach(lang => {
          i18n.addTranslations(lang, translationsAdditions[lang]);
        });
        console.log('✅ i18n additions merged');
      }
      
      // Set saved language
      const savedLang = window.storage?.getLang?.() || 'ar';
      i18n.setLang?.(savedLang);
      console.log(`✅ Language set to: ${savedLang}`);
      
      // Show total keys
      const totalKeys = Object.keys(i18n.getAll()).length;
      console.log(`📊 Total translation keys: ${totalKeys}`);
      
    } catch (error) {
      console.error('❌ Failed to initialize i18n:', error);
      console.error('Stack:', error.stack);
    }
  } else {
    console.log('✅ i18n already available');
  }
  
  // Load saved theme using storage.js
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
  
  // ⚡ CRITICAL: Setup scroll handler for header shrink
  if (typeof window.handleScroll === 'function') {
    window.addEventListener('scroll', window.handleScroll, { passive: true });
    console.log('✅ Scroll handler attached for header shrink');
    
    // Initial scroll check
    window.handleScroll();
  } else {
    console.warn('⚠️ handleScroll not available from utils.js');
  }
  
  // ⚡ CRITICAL: Apply initial translations to Vanilla UI
  const currentLang = window.storage?.getLang?.() || 'ar';
  updateVanillaUI(currentLang);
  console.log('✅ Initial translations applied to Vanilla UI');
  
  // ✅ الاستماع لحدث تغيير اللغة من i18n (بعد تأخير بسيط)
  setTimeout(() => {
    if (window.i18n && window.i18n.on) {
      window.i18n.on('change', (newLang) => {
        console.log(`🔔 [Global] Received language change event: ${newLang}`);
        updateVanillaUI(newLang);
        
        // Dispatch event for React
        window.dispatchEvent(new CustomEvent('language-changed', { detail: { lang: newLang } }));
      });
      console.log('✅ Subscribed to i18n language change events');
    } else {
      console.warn('⚠️ i18n not available, language changes will not be live');
    }
  }, 500); // 500ms delay
}

console.log('✅ global-functions.js loaded successfully');
