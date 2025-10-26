// ================================================================
// SIDEBAR FUNCTIONALITY - UPDATED VERSION
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
  
  sidebarElements.sidebar.classList.add('show');
  sidebarElements.overlay.classList.add('show');
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
  
  // ✅ تغيير من 'active' إلى 'show'
  sidebarElements.sidebar.classList.remove('show');
  sidebarElements.overlay.classList.remove('show');
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
    const cart = typeof window.cartModule?.getCart === 'function' 
      ? window.cartModule.getCart() 
      : [];
    
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    sidebarElements.cartBadge.textContent = totalItems;
    sidebarElements.cartBadge.style.display = totalItems > 0 ? 'flex' : 'none';
    
    // ✅ تحديث النقطة الحمراء
    const badgeDot = document.querySelector('.sidebar-nav-item .sidebar-badge-dot');
    if (badgeDot) {
      badgeDot.style.display = totalItems > 0 ? 'block' : 'none';
    }
  }
  
  // Update orders badge
  if (sidebarElements.ordersBadge && typeof window.storage !== 'undefined') {
    const orders = window.storage.getOrdersHistory ? window.storage.getOrdersHistory() : [];
    const activeOrders = orders.filter(order => 
      order.status !== 'delivered' && order.status !== 'cancelled'
    );
    
    if (activeOrders.length > 0) {
      sidebarElements.ordersBadge.textContent = activeOrders.length;
      sidebarElements.ordersBadge.style.display = 'flex';
      sidebarElements.ordersBadge.classList.remove('hidden');
    } else {
      sidebarElements.ordersBadge.style.display = 'none';
      sidebarElements.ordersBadge.classList.add('hidden');
    }
  }
}

// ================================================================
// ===== Update Profile Section =====
// ================================================================
function updateSidebarProfile() {
  if (typeof window.storage === 'undefined') return;
  
  const userData = window.storage.getUserData ? window.storage.getUserData() : null;
  const lang = window.currentLang || 'ar';
  
  if (userData && userData.name) {
    if (sidebarElements.profileName) {
      sidebarElements.profileName.textContent = lang === 'ar' 
        ? `مرحباً ${userData.name}! 👋`
        : `Hello ${userData.name}! 👋`;
    }
    if (sidebarElements.profileStatus) {
      sidebarElements.profileStatus.textContent = lang === 'ar' ? 'عميل مميز' : 'VIP Customer';
    }
  } else {
    if (sidebarElements.profileName) {
      sidebarElements.profileName.textContent = lang === 'ar' ? 'مرحباً بك! 👋' : 'Welcome! 👋';
    }
    if (sidebarElements.profileStatus) {
      sidebarElements.profileStatus.textContent = lang === 'ar' ? 'زائر' : 'Guest';
    }
  }
}

// ================================================================
// ===== Sync Theme Toggle =====
// ================================================================
function syncSidebarTheme() {
  if (!sidebarElements.themeToggle) return;
  
  const isDark = document.documentElement.classList.contains('dark') || 
                 document.body.classList.contains('dark-mode');
  sidebarElements.themeToggle.checked = isDark;
  
  console.log('🌙 Theme synced:', isDark ? 'Dark' : 'Light');
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
    if (lang === currentLang) {
      option.classList.remove('hidden');
      option.style.display = 'inline-flex';
    } else {
      option.classList.add('hidden');
      option.style.display = 'none';
    }
  });
  
  console.log('🌐 Language synced:', currentLang);
}

// ================================================================
// ===== Event Listeners =====
// ================================================================
function setupSidebarEventListeners() {
  console.log('🔧 Setting up sidebar event listeners...');
  
  // Trigger button
  if (sidebarElements.trigger) {
    sidebarElements.trigger.removeEventListener('click', toggleSidebar); // Remove old
    sidebarElements.trigger.addEventListener('click', toggleSidebar);
  }
  
  // Overlay click
  if (sidebarElements.overlay) {
    sidebarElements.overlay.removeEventListener('click', closeSidebar); // Remove old
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
    }, { passive: true });
    
    sidebarElements.sidebar.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }, { passive: true });
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
//===============================================================
// ===== Sidebar Actions =====
// ================================================================
// Show About Info
function showAboutInfo() {
  const lang = window.currentLang || 'ar';
  const showToastFunc = window.showToast || window.utilsModule?.showToast;
  
  if (!showToastFunc) {
    alert(lang === 'ar' 
      ? 'نحن متخصصون في تقديم أفخر أنواع السوفت آيس كريم والديسرت المميز.' 
      : 'We specialize in premium soft ice cream and desserts.'
    );
    return;
  }
  
  showToastFunc(
    lang === 'ar' ? 'من نحن' : 'About Us',
    lang === 'ar' 
      ? 'نحن متخصصون في تقديم أفخر أنواع السوفت آيس كريم والديسرت المميز. منذ تأسيسنا ونحن نسعى لتقديم تجربة استثنائية لعملائنا.' 
      : 'We specialize in premium soft ice cream and desserts with natural ingredients.',
    'info'
  );
}

// Show Contact Info
function showContactInfo() {
  const lang = window.currentLang || 'ar';
  const showToastFunc = window.showToast || window.utilsModule?.showToast;
  
  if (!showToastFunc) {
    alert(lang === 'ar' 
      ? 'للتواصل: 01234567890' 
      : 'Contact: 01234567890'
    );
    return;
  }
  
  showToastFunc(
    lang === 'ar' ? 'تواصل معنا' : 'Contact Us',
    lang === 'ar' 
      ? '📞 الهاتف: 01234567890\n📧 البريد: info@softcream.com\n📍 العنوان: شارع الجيزة، الجيزة، مصر' 
      : '📞 Phone: 01234567890\n📧 Email: info@softcream.com\n📍 Address: Giza Street, Giza, Egypt',
    'info'
  );
}


// ================================================================
// ===== Helper Functions =====
// ================================================================

// Open Orders Page
function openOrdersPage() {
  console.log('📦 Opening orders page...');
  
  const trackingModal = document.getElementById('trackingModal');
  if (trackingModal) {
    if (typeof window.openTrackingModal === 'function') {
      window.openTrackingModal();
    } else if (typeof window.showTrackingModal === 'function') {
      window.showTrackingModal('');
    }
  } else {
    showOrdersHistory();
  }
  
  closeSidebar(); // ✅ Close sidebar after opening orders
}

// Show Orders History
function showOrdersHistory() {
  const lang = window.currentLang || 'ar';
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
  
  const lastOrder = orders[0];
  showToastFunc(
    lang === 'ar' ? 'آخر طلب' : 'Last Order',
    `${lang === 'ar' ? 'رقم الطلب:' : 'Order ID:'} ${lastOrder.orderId}`,
    'success'
  );
}

// Open Settings
function openSettings() {
  const lang = window.currentLang || 'ar';
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
  
  closeSidebar(); // ✅ Close sidebar after action
}

// ================================================================
// ===== Initialize Sidebar =====
// ================================================================
function initSidebar() {
  console.log('🚀 Initializing sidebar...');
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        initSidebarElements();
        setupSidebarEventListeners();
        updateSidebarBadges();
        updateSidebarProfile();
        syncSidebarTheme();
        syncSidebarLanguage();
      }, 100);
    });
  } else {
    setTimeout(() => {
      initSidebarElements();
      setupSidebarEventListeners();
      updateSidebarBadges();
      updateSidebarProfile();
      syncSidebarTheme();
      syncSidebarLanguage();
    }, 100);
  }
  
  console.log('✅ Sidebar initialized successfully');
}

// ================================================================
// ===== Auto-update on cart/theme/language changes =====
// ================================================================

if (typeof window !== 'undefined') {
  // Hook into cartModule
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
  
  setTimeout(() => clearInterval(waitForCartModule), 5000);
  
  // Hook into toggleTheme
  const waitForToggleTheme = setInterval(() => {
    if (window.toggleTheme) {
      const originalToggleTheme = window.toggleTheme;
      
      window.toggleTheme = function(...args) {
        originalToggleTheme.apply(this, args);
        setTimeout(syncSidebarTheme, 50);
      };
      
      clearInterval(waitForToggleTheme);
      console.log('✅ Sidebar hooked into toggleTheme');
    }
  }, 100);
  
  setTimeout(() => clearInterval(waitForToggleTheme), 5000);
  
  // Hook into toggleLanguage
  const waitForToggleLanguage = setInterval(() => {
    if (window.toggleLanguage) {
      const originalToggleLanguage = window.toggleLanguage;
      
      window.toggleLanguage = function(...args) {
        originalToggleLanguage.apply(this, args);
        setTimeout(() => {
          syncSidebarLanguage();
          updateSidebarProfile();
        }, 50);
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
  window.syncSidebarTheme = syncSidebarTheme;
  window.syncSidebarLanguage = syncSidebarLanguage;
  window.openOrdersPage = openOrdersPage;
  window.openSettings = openSettings;
  window.showAboutInfo = showAboutInfo;
  window.showContactInfo = showContactInfo;
  console.log('✅ Sidebar functions exposed globally');
}

// ================================================================
// ===== Auto-Initialize =====
// ================================================================
initSidebar();

console.log('✅ sidebar.js loaded successfully');