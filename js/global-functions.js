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
// 🌐 Language Toggle
// ================================================================
window.toggleLanguage = function() {
  const currentLang = document.documentElement.lang || 'ar';
  const newLang = currentLang === 'ar' ? 'en' : 'ar';
  
  document.documentElement.lang = newLang;
  document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
  
  // Save to storage
  if (window.storage) {
    window.storage.setLang(newLang);
  }
  
  // Update lang button
  const langBtn = document.getElementById('langToggle');
  if (langBtn) {
    langBtn.textContent = newLang === 'ar' ? 'EN' : 'AR';
  }
  
  // Update sidebar language
  if (window.sidebarModule && window.sidebarModule.syncSidebarLanguage) {
    window.sidebarModule.syncSidebarLanguage();
  }
  
  console.log(`🌐 Language switched to: ${newLang}`);
  
  // Dispatch event for React
  window.dispatchEvent(new CustomEvent('language-changed', { detail: { lang: newLang } }));
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

function initGlobalFunctions() {
  console.log('✅ Global functions initialized');
  
  // Check dependencies
  checkDependencies();
  
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
}

console.log('✅ global-functions.js loaded successfully');
