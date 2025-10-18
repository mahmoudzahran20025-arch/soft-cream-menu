// ================================================================
// SIDEBAR FUNCTIONALITY - Fixed Version
// ================================================================

console.log('🔧 Loading sidebar.js...');

// ================================================================
// ===== Sidebar State Management =====
// ================================================================
const sidebarState = {
  isOpen: false,
  isPinned: false
};

// ================================================================
// ===== DOM Elements =====
// ================================================================
let sidebarElements = {};

function initSidebarElements() {
  sidebarElements = {
    trigger: document.getElementById('sidebarTrigger'),
    sidebar: document.getElementById('mainSidebar'),
    overlay: document.getElementById('sidebarOverlay'),
    closeBtn: document.getElementById('sidebarClose'),
    cartBadge: document.getElementById('sidebarCartBadge'),
    ordersBadge: document.getElementById('sidebarOrdersBadge'),
    themeToggle: document.getElementById('sidebarThemeToggle'),
    langToggle: document.getElementById('sidebarLangToggle'),
    profileName: document.getElementById('sidebarProfileName'),
    profileStatus: document.getElementById('sidebarProfileStatus')
  };
  
  console.log('✅ Sidebar elements initialized');
}

// ================================================================
// ===== Open Sidebar =====
// ================================================================
function openSidebar() {
  if (!sidebarElements.sidebar) {
    console.warn('⚠️ Sidebar not initialized');
    return;
  }
  
  console.log('🔓 Opening sidebar...');
  
  sidebarState.isOpen = true;
  
  sidebarElements.sidebar.classList.add('active');
  sidebarElements.overlay.classList.add('active');
  sidebarElements.trigger?.classList.add('active');
  
  // Prevent body scroll
  document.body.style.overflow = 'hidden';
  
  // Update badges
  updateSidebarBadges();
  
  console.log('✅ Sidebar opened');
}

// ================================================================
// ===== Close Sidebar =====
// ================================================================
function closeSidebar() {
  if (!sidebarElements.sidebar) {
    console.warn('⚠️ Sidebar not initialized');
    return;
  }
  
  console.log('🔒 Closing sidebar...');
  
  sidebarState.isOpen = false;
  
  sidebarElements.sidebar.classList.remove('active');
  sidebarElements.overlay.classList.remove('active');
  sidebarElements.trigger?.classList.remove('active');
  
  // Restore body scroll
  document.body.style.overflow = '';
  
  console.log('✅ Sidebar closed');
}

// ================================================================
// ===== Toggle Sidebar =====
// ================================================================
function toggleSidebar() {
  if (sidebarState.isOpen) {
    closeSidebar();
  } else {
    openSidebar();
  }
}

// ================================================================
// ===== Update Badges =====
// ================================================================
function updateSidebarBadges() {
  // Update cart badge
  if (sidebarElements.cartBadge) {
    // ✅ استخدام window.cartModule بدلاً من import
    const cart = typeof window.cartModule?.getCart === 'function' 
      ? window.cartModule.getCart() 
      : [];
    
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    sidebarElements.cartBadge.textContent = totalItems;
    sidebarElements.cartBadge.style.display = totalItems > 0 ? 'inline-flex' : 'none';
  }
  
  // Update orders badge (if storage available)
  if (sidebarElements.ordersBadge && typeof window.storage !== 'undefined') {
    const orders = window.storage.getOrdersHistory ? window.storage.getOrdersHistory() : [];
    const activeOrders = orders.filter(order => 
      order.status !== 'delivered' && order.status !== 'cancelled'
    );
    
    if (activeOrders.length > 0) {
      sidebarElements.ordersBadge.textContent = activeOrders.length;
      sidebarElements.ordersBadge.style.display = 'inline-flex';
    } else {
      sidebarElements.ordersBadge.style.display = 'none';
    }
  }
}

// ================================================================
// ===== Update Profile Section =====
// ================================================================
function updateSidebarProfile() {
  if (typeof window.storage === 'undefined') return;
  
  const userData = window.storage.getUserData ? window.storage.getUserData() : null;
  
  if (userData && userData.name) {
    if (sidebarElements.profileName) {
      sidebarElements.profileName.textContent = `مرحباً ${userData.name}! 👋`;
    }
    if (sidebarElements.profileStatus) {
      sidebarElements.profileStatus.textContent = 'عميل مميز';
    }
  } else {
    if (sidebarElements.profileName) {
      sidebarElements.profileName.textContent = 'مرحباً بك! 👋';
    }
    if (sidebarElements.profileStatus) {
      sidebarElements.profileStatus.textContent = 'زائر';
    }
  }
}

// ================================================================
// ===== Sync Theme Toggle =====
// ================================================================
function syncSidebarTheme() {
  if (!sidebarElements.themeToggle) return;
  
  const isDark = document.body.classList.contains('dark-mode') || 
                 document.body.classList.contains('dark');
  sidebarElements.themeToggle.checked = isDark;
}

// ================================================================
// ===== Sync Language Toggle =====
// ================================================================
function syncSidebarLanguage() {
  if (!sidebarElements.langToggle) return;
  
  const currentLang = window.currentLang || 'ar';
  const langOptions = sidebarElements.langToggle.querySelectorAll('.lang-option');
  
  langOptions.forEach(option => {
    const lang = option.getAttribute('data-lang');
    option.style.display = lang === currentLang ? 'inline-flex' : 'none';
  });
}

// ================================================================
// ===== Event Listeners =====
// ================================================================
function setupSidebarEventListeners() {
  console.log('🔧 Setting up sidebar event listeners...');
  
  // Trigger button
  if (sidebarElements.trigger) {
    sidebarElements.trigger.addEventListener('click', toggleSidebar);
  }
  
  // Close button
  if (sidebarElements.closeBtn) {
    sidebarElements.closeBtn.addEventListener('click', closeSidebar);
  }
  
  // Overlay click
  if (sidebarElements.overlay) {
    sidebarElements.overlay.addEventListener('click', closeSidebar);
  }
  
  // ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebarState.isOpen) {
      closeSidebar();
    }
  });
  
  // Touch swipe to close (mobile)
  let touchStartX = 0;
  let touchEndX = 0;
  
  if (sidebarElements.sidebar) {
    sidebarElements.sidebar.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    });
    
    sidebarElements.sidebar.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    });
  }
  
  function handleSwipe() {
    const isRTL = document.dir === 'rtl' || document.documentElement.dir === 'rtl';
    const swipeThreshold = 50;
    
    if (isRTL) {
      // RTL: Swipe left to close
      if (touchStartX - touchEndX > swipeThreshold) {
        closeSidebar();
      }
    } else {
      // LTR: Swipe right to close
      if (touchEndX - touchStartX > swipeThreshold) {
        closeSidebar();
      }
    }
  }
  
  console.log('✅ Sidebar event listeners ready');
}

// ================================================================
// ===== Helper Functions =====
// ================================================================

// Open Orders Page
function openOrdersPage() {
  console.log('📦 Opening orders page...');
  
  // Check if tracking modal exists
  const trackingModal = document.getElementById('trackingModal');
  if (trackingModal) {
    // If tracking modal exists, show it
    if (typeof window.openTrackingModal === 'function') {
      window.openTrackingModal();
    } else if (typeof window.showTrackingModal === 'function') {
      window.showTrackingModal('');
    }
  } else {
    // Show orders history (to be implemented)
    showOrdersHistory();
  }
}

// Show Orders History (placeholder)
function showOrdersHistory() {
  const lang = window.currentLang || 'ar';
  
  // ✅ استخدام window.showToast بدلاً من import
  const showToastFunc = window.showToast || window.utilsModule?.showToast;
  
  if (!showToastFunc) {
    console.warn('⚠️ showToast function not available');
    alert(lang === 'ar' ? 'قريباً' : 'Coming Soon');
    return;
  }
  
  if (typeof window.storage === 'undefined' || !window.storage.getOrdersHistory) {
    showToastFunc(
      lang === 'ar' ? 'قريباً' : 'Coming Soon',
      lang === 'ar' ? 'سيتم إضافة صفحة الطلبات قريباً' : 'Orders page coming soon',
      'info'
    );
    return;
  }
  
  const orders = window.storage.getOrdersHistory();
  
  if (orders.length === 0) {
    showToastFunc(
      lang === 'ar' ? 'لا توجد طلبات' : 'No Orders',
      lang === 'ar' ? 'لم تقم بأي طلبات بعد' : 'You have not placed any orders yet',
      'info'
    );
    return;
  }
  
  // Display orders (to be implemented with full UI)
  console.log('📦 Orders:', orders);
  
  // For now, show a simple alert with last order
  const lastOrder = orders[0];
  showToastFunc(
    lang === 'ar' ? 'آخر طلب' : 'Last Order',
    `${lang === 'ar' ? 'رقم الطلب:' : 'Order ID:'} ${lastOrder.orderId}`,
    'success'
  );
}

// Open Settings (placeholder)
function openSettings() {
  const lang = window.currentLang || 'ar';
  
  // ✅ استخدام window.showToast
  const showToastFunc = window.showToast || window.utilsModule?.showToast;
  
  if (!showToastFunc) {
    console.warn('⚠️ showToast function not available');
    alert(lang === 'ar' ? 'الإعدادات' : 'Settings');
    return;
  }
  
  showToastFunc(
    lang === 'ar' ? 'الإعدادات' : 'Settings',
    lang === 'ar' ? 'يمكنك تغيير اللغة والثيم من القائمة' : 'You can change language and theme from menu',
    'info'
  );
}

// ================================================================
// ===== Initialize Sidebar =====
// ================================================================
function initSidebar() {
  console.log('🚀 Initializing sidebar...');
  
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initSidebarElements();
      setupSidebarEventListeners();
      updateSidebarBadges();
      updateSidebarProfile();
      syncSidebarTheme();
      syncSidebarLanguage();
    });
  } else {
    initSidebarElements();
    setupSidebarEventListeners();
    updateSidebarBadges();
    updateSidebarProfile();
    syncSidebarTheme();
    syncSidebarLanguage();
  }
  
  console.log('✅ Sidebar initialized successfully');
}

// ================================================================
// ===== Auto-update on cart/theme/language changes =====
// ================================================================

// ✅ Listen for cart updates (better approach)
if (typeof window !== 'undefined') {
  // Override cartModule.updateCartUI to also update sidebar
  const waitForCartModule = setInterval(() => {
    if (window.cartModule && window.cartModule.updateCartUI) {
      const originalUpdateCartUI = window.cartModule.updateCartUI;
      
      window.cartModule.updateCartUI = async function(...args) {
        await originalUpdateCartUI.apply(this, args);
        updateSidebarBadges();
      };
      
      clearInterval(waitForCartModule);
      console.log('✅ Sidebar hooked into cartModule.updateCartUI');
    }
  }, 100);
  
  // Timeout after 5 seconds
  setTimeout(() => clearInterval(waitForCartModule), 5000);
  
  // ✅ Listen for theme changes (better approach)
  const waitForToggleTheme = setInterval(() => {
    if (window.toggleTheme) {
      const originalToggleTheme = window.toggleTheme;
      
      window.toggleTheme = function(...args) {
        originalToggleTheme.apply(this, args);
        syncSidebarTheme();
      };
      
      clearInterval(waitForToggleTheme);
      console.log('✅ Sidebar hooked into toggleTheme');
    }
  }, 100);
  
  setTimeout(() => clearInterval(waitForToggleTheme), 5000);
  
  // ✅ Listen for language changes (better approach)
  const waitForToggleLanguage = setInterval(() => {
    if (window.toggleLanguage) {
      const originalToggleLanguage = window.toggleLanguage;
      
      window.toggleLanguage = function(...args) {
        originalToggleLanguage.apply(this, args);
        syncSidebarLanguage();
      };
      
      clearInterval(waitForToggleLanguage);
      console.log('✅ Sidebar hooked into toggleLanguage');
    }
  }, 100);
  
  setTimeout(() => clearInterval(waitForToggleLanguage), 5000);
}

// ================================================================
// ===== Expose Functions Globally =====
// ================================================================
if (typeof window !== 'undefined') {
  window.openSidebar = openSidebar;
  window.closeSidebar = closeSidebar;
  window.toggleSidebar = toggleSidebar;
  window.updateSidebarBadges = updateSidebarBadges;
  window.updateSidebarProfile = updateSidebarProfile;
  window.openOrdersPage = openOrdersPage;
  window.openSettings = openSettings;
  
  console.log('✅ Sidebar functions exposed globally');
}

// ================================================================
// ===== Auto-Initialize =====
// ================================================================
initSidebar();

console.log('✅ sidebar.js loaded successfully');