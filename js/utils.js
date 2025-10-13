// ================================================================
// utils.js - الدوال العامة والمساعدة (محسّنة وآمنة)
// ================================================================

// ================================================================
// ===== Private State (Encapsulation) =====
// ================================================================
const state = {
  scrollTicking: false,
  categoriesOriginalOffset: 0,
  snowflakeCount: 0,
  maxSnowflakes: 30, // ✅ حد أقصى لتجنب memory leak
  snowflakeInterval: null
};

// ================================================================
// ===== Configuration (يمكن تخصيصه) =====
// ================================================================
const config = {
  selectors: {
    header: '#header',
    categoriesSection: '#categoriesSection',
    toast: '#toast',
    categoryGroup: '.category-group',
    categoryTab: '.category-tab',
    animatedBackground: '.animated-background'
  },
  scrollOffset: 50,
  categoriesOffset: 50
};

// ================================================================
// ===== Scroll Handler =====
// ================================================================
export function handleScroll() {
  if (!state.scrollTicking) {
    window.requestAnimationFrame(() => {
      const header = document.querySelector(config.selectors.header);
      
      if (header) {
        if (window.scrollY > config.scrollOffset) {
          header.classList.add('scrolled');
          document.body.classList.add('scrolled');
        } else {
          header.classList.remove('scrolled');
          document.body.classList.remove('scrolled');
        }
      }
      
      handleCategoriesSticky();
      state.scrollTicking = false;
    });
    
    state.scrollTicking = true;
  }
}

// ================================================================
// ===== Categories Sticky Handler =====
// ================================================================
function handleCategoriesSticky() {
  const header = document.querySelector(config.selectors.header);
  const categories = document.querySelector(config.selectors.categoriesSection);
  
  if (!header || !categories) return;
  
  const headerHeight = header.getBoundingClientRect().height;
  const scrollY = window.scrollY;
  
  if (scrollY >= state.categoriesOriginalOffset - headerHeight) {
    categories.classList.add('visible');
    categories.style.top = `${headerHeight}px`;
    updateActiveCategory();
  } else {
    categories.classList.remove('visible');
  }
}

// ================================================================
// ===== تحديث الكاتيجوري النشطة أثناء الـ scroll =====
// ✅ استخدام data attributes بدلاً من onclick
// ================================================================
function updateActiveCategory() {
  const categoryGroups = document.querySelectorAll(config.selectors.categoryGroup);
  if (categoryGroups.length === 0) return;
  
  const header = document.querySelector(config.selectors.header);
  const categories = document.querySelector(config.selectors.categoriesSection);
  
  if (!header || !categories) return;
  
  const headerHeight = header.getBoundingClientRect().height;
  const categoriesHeight = categories.getBoundingClientRect().height;
  const offset = headerHeight + categoriesHeight + config.categoriesOffset;
  
  let activeCategory = null;
  
  categoryGroups.forEach(group => {
    const rect = group.getBoundingClientRect();
    if (rect.top <= offset && rect.bottom > offset) {
      activeCategory = group.id.replace('category-', '');
    }
  });
  
  if (activeCategory) {
    const tabs = document.querySelectorAll(config.selectors.categoryTab);
    tabs.forEach(tab => {
      tab.classList.remove('active');
      // ✅ استخدام data-category بدلاً من onclick parsing
      const tabCategory = tab.getAttribute('data-category');
      if (tabCategory === activeCategory) {
        tab.classList.add('active');
      }
    });
  }
}

// ================================================================
// ===== Scroll To Top =====
// ================================================================
export function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ================================================================
// ===== حفظ موضع الكاتيجوري الأصلي =====
// ================================================================
export function initCategoriesOffset() {
  const categories = document.querySelector(config.selectors.categoriesSection);
  if (categories) {
    setTimeout(() => {
      state.categoriesOriginalOffset = categories.offsetTop;
      console.log('📌 Categories original position:', state.categoriesOriginalOffset);
    }, 100);
  }
}

// ================================================================
// ===== تأثيرات بصرية متقدمة - الثلج (محسّنة) =====
// ✅ إضافة cleanup و max limit
// ================================================================
export function createSnowflakes() {
  const snowflakeChars = ['❄', '🌨', '❅', '✨', '💫', '⭐'];
  const container = document.querySelector(config.selectors.animatedBackground);

  if (!container) {
    console.warn('Animated background container not found');
    return;
  }

  // ✅ تنظيف الـ interval القديم إن وجد
  if (state.snowflakeInterval) {
    clearInterval(state.snowflakeInterval);
  }

  function addSnowflake() {
    // ✅ التحقق من الحد الأقصى
    if (state.snowflakeCount >= state.maxSnowflakes) {
      return;
    }

    const snowflake = document.createElement('div');
    snowflake.className = 'snowflake';

    snowflake.textContent = snowflakeChars[Math.floor(Math.random() * snowflakeChars.length)];
    snowflake.style.left = Math.random() * 100 + '%';

    const size = Math.random() * 1.2 + 0.6;
    snowflake.style.fontSize = size + 'rem';

    const duration = Math.random() * 10 + 8;
    snowflake.style.animationDuration = duration + 's';
    snowflake.style.animationDelay = Math.random() * 5 + 's';
    snowflake.style.opacity = Math.random() * 0.5 + 0.3;

    const horizontalShift = Math.random() * 30 - 15;
    snowflake.style.setProperty('--x-shift', `${horizontalShift}px`);

    container.appendChild(snowflake);
    state.snowflakeCount++;

    // ✅ Cleanup بعد انتهاء الأنيميشن
    setTimeout(() => {
      if (snowflake.parentNode) {
        snowflake.remove();
        state.snowflakeCount--;
      }
    }, (duration + 5) * 1000);
  }

  // إضافة الرقائق الأولية
  for (let i = 0; i < 10; i++) {
    setTimeout(addSnowflake, i * 500);
  }

  // ✅ حفظ الـ interval للـ cleanup
  state.snowflakeInterval = setInterval(addSnowflake, 1500);
}

// ✅ دالة cleanup للثلج
export function stopSnowflakes() {
  if (state.snowflakeInterval) {
    clearInterval(state.snowflakeInterval);
    state.snowflakeInterval = null;
  }
  
  const container = document.querySelector(config.selectors.animatedBackground);
  if (container) {
    container.querySelectorAll('.snowflake').forEach(flake => flake.remove());
  }
  
  state.snowflakeCount = 0;
  console.log('❄️ Snowflakes stopped and cleaned');
}

// ================================================================
// ===== Toast Notification (محسّنة) =====
// ✅ إضافة error handling للـ lucide
// ================================================================
export function showToast(title, description, type = 'success') {
  const toast = document.querySelector(config.selectors.toast);
  if (!toast) {
    console.warn('Toast element not found');
    return;
  }
  
  toast.className = 'toast ' + type;
  
  // ✅ Error handling للـ icon
  const iconElement = toast.querySelector('.toast-icon i');
  if (iconElement) {
    const icon = type === 'success' ? 'check-circle-2' : 'x-circle';
    iconElement.setAttribute('data-lucide', icon);
    
    // ✅ التحقق من وجود lucide
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
      try {
        lucide.createIcons();
      } catch (e) {
        console.warn('Failed to create lucide icons:', e);
      }
    }
  }
  
  const titleElement = toast.querySelector('#toast-title');
  const descElement = toast.querySelector('#toast-description');
  
  if (titleElement) titleElement.textContent = title;
  if (descElement) descElement.textContent = description;
  
  toast.classList.add('show');
  
  // ✅ إزالة الـ toast بعد 4 ثواني
  setTimeout(() => {
    toast.classList.remove('show');
  }, 4000);
}

// ================================================================
// ===== UUID Generator =====
// ================================================================
export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// ================================================================
// ===== Calculate Distance (Haversine Formula) =====
// ================================================================
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // نصف قطر الأرض بالكيلومتر
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
          Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// ================================================================
// ===== Setup Focus Trap for Accessibility =====
// ================================================================
export function setupFocusTrap(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  
  modal.addEventListener('keydown', function(e) {
    if (e.key !== 'Tab') return;
    
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    }
  });
}

// ================================================================
// ===== Prevent Image Drag =====
// ================================================================
export function preventImageDrag() {
  document.addEventListener('dragstart', function(e) {
    if (e.target.tagName === 'IMG') {
      e.preventDefault();
    }
  });
}

// ================================================================
// ===== Passive Touch Events =====
// ================================================================
export function initPassiveTouchEvents() {
  document.addEventListener('touchstart', function() {}, { passive: true });
}

// ================================================================
// ===== Debounce Helper =====
// ✅ جديد - للاستخدام في الـ API calls
// ================================================================
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// ================================================================
// ===== Throttle Helper =====
// ✅ جديد - للاستخدام في الـ scroll events
// ================================================================
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// ================================================================
// ===== Get Config (للتخصيص) =====
// ================================================================
export function getConfig() {
  return { ...config };
}

export function setConfig(newConfig) {
  Object.assign(config, newConfig);
}

// ================================================================
// ===== Cleanup All =====
// ✅ جديد - للتنظيف عند الحاجة
// ================================================================
export function cleanup() {
  stopSnowflakes();
  state.scrollTicking = false;
  state.categoriesOriginalOffset = 0;
  console.log('🧹 Utils cleaned up');
}

console.log('✅ Utils module loaded (Secure & Optimized)');