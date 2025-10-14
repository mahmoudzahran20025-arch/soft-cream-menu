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
  
  // ✅ Debugging (يمكن حذفه بعد التأكد من العمل)
  // console.log('Scroll:', scrollY, 'Threshold:', state.categoriesOriginalOffset - headerHeight);
  
  if (scrollY >= state.categoriesOriginalOffset - headerHeight) {
    categories.classList.add('visible');
    categories.style.top = `${headerHeight}px`;
    updateActiveCategory(); // ✅ تحديث الفئة النشطة
  } else {
    categories.classList.remove('visible');
  }
}

// ================================================================
// ===== تحديث الكاتيجوري النشطة أثناء الـ scroll =====
// ✅ استخدام data attributes + fallback للـ onclick
// ✅ إضافة auto-scroll للـ active tab
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
  
  // ✅ إيجاد الفئة النشطة (أول فئة في viewport)
  categoryGroups.forEach(group => {
    const rect = group.getBoundingClientRect();
    // ✅ تحسين: نتحقق من أن الفئة مرئية في viewport
    if (rect.top <= offset && rect.bottom > offset) {
      activeCategory = group.id.replace('category-', '');
    }
  });
  
  if (activeCategory) {
    const tabs = document.querySelectorAll(config.selectors.categoryTab);
    let activeTab = null;
    
    tabs.forEach(tab => {
      tab.classList.remove('active');
      
      // ✅ Method 1: استخدام data-category (الطريقة المفضلة)
      const tabCategory = tab.getAttribute('data-category');
      
      if (tabCategory === activeCategory) {
        tab.classList.add('active');
        activeTab = tab; // ✅ حفظ الـ tab النشط
      } 
      // ✅ Method 2: Fallback - parsing onclick attribute (للتوافق)
      else {
        const onclick = tab.getAttribute('onclick');
        if (onclick && onclick.includes(`'${activeCategory}'`)) {
          tab.classList.add('active');
          activeTab = tab; // ✅ حفظ الـ tab النشط
        }
      }
    });
    
    // ✅ Auto-scroll للـ tab النشط
    if (activeTab) {
      scrollCategoryIntoView(activeTab);
    }
  }
}

// ================================================================
// ===== Auto-scroll للـ Active Category Tab =====
// ✅ جديد - يسكرول الـ categories container عشان الـ active tab يكون مرئي
// ================================================================
function scrollCategoryIntoView(activeTab) {
  const categoriesScroll = document.querySelector('#categoriesScroll');
  if (!categoriesScroll) return;
  
  // الحصول على موضع الـ tab
  const tabRect = activeTab.getBoundingClientRect();
  const containerRect = categoriesScroll.getBoundingClientRect();
  
  // حساب المسافة المطلوبة للسكرول
  const tabCenter = tabRect.left + tabRect.width / 2;
  const containerCenter = containerRect.left + containerRect.width / 2;
  const scrollOffset = tabCenter - containerCenter;
  
  // السكرول بـ smooth animation
  categoriesScroll.scrollBy({
    left: scrollOffset,
    behavior: 'smooth'
  });
}

// ================================================================
// ===== Setup Scroll Indicators للـ Categories =====
// ✅ يضيف indicators على الجوانب لو فيه محتوى مخفي
// ================================================================
export function setupCategoriesScrollIndicators() {
  const categoriesSection = document.querySelector(config.selectors.categoriesSection);
  const categoriesScroll = document.querySelector('#categoriesScroll');
  
  if (!categoriesSection || !categoriesScroll) return;
  
  function updateIndicators() {
    const scrollLeft = categoriesScroll.scrollLeft;
    const scrollWidth = categoriesScroll.scrollWidth;
    const clientWidth = categoriesScroll.clientWidth;
    
    // Left indicator (فيه محتوى على الشمال)
    if (scrollLeft > 10) {
      categoriesSection.classList.add('has-scroll-left');
    } else {
      categoriesSection.classList.remove('has-scroll-left');
    }
    
    // Right indicator (فيه محتوى على اليمين)
    if (scrollLeft + clientWidth < scrollWidth - 10) {
      categoriesSection.classList.add('has-scroll-right');
    } else {
      categoriesSection.classList.remove('has-scroll-right');
    }
  }
  
  // Update on scroll
  categoriesScroll.addEventListener('scroll', updateIndicators, { passive: true });
  
  // Update on resize
  window.addEventListener('resize', updateIndicators, { passive: true });
  
  // Initial update
  setTimeout(updateIndicators, 100);
  
  console.log('✅ Categories scroll indicators setup');
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
  if (!categories) {
    console.warn('⚠️ Categories section not found');
    return;
  }
  
  // ✅ انتظار rendering كامل
  setTimeout(() => {
    state.categoriesOriginalOffset = categories.offsetTop;
    console.log('📌 Categories original position:', state.categoriesOriginalOffset);
    console.log('📌 Categories height:', categories.offsetHeight);
    
    // ✅ تحديث فوري
    handleCategoriesSticky();
  }, 500); // زيادة الوقت للتأكد
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
// ===== Toast System Class (بديل showToast) =====
// ================================================================

// ================================================================
// ===== Toast Notification System (بديل showToast) =====
// ================================================================

export function showToast(type = 'success', title = 'Success', message = '', duration = 5000) {
  if (!window.toastManager) {
    window.toastManager = new ToastManager('toastContainer');
  }
  
  return window.toastManager.show(type, title, message, duration);
}

export class ToastManager {
  constructor(containerId = 'toastContainer') {
    this.container = document.getElementById(containerId);
    this.toasts = [];
    
    if (!this.container) {
      console.warn(`Toast container with id "${containerId}" not found`);
    }
  }

  show(type = 'success', title = 'Success', message = '', duration = 5000) {
    if (!this.container) return;

    const toastEl = this.createToast(type, title, message);
    this.container.appendChild(toastEl);
    this.toasts.push(toastEl);

    // Show animation
    setTimeout(() => toastEl.classList.add('show'), 10);

    // Auto hide
    setTimeout(() => {
      this.hide(toastEl);
    }, duration);

    return toastEl;
  }

  createToast(type, title, message) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const iconMap = {
      success: '<i class="fas fa-check"></i>',
      error: '<i class="fas fa-times"></i>',
      warning: '<i class="fas fa-exclamation"></i>',
      info: '<i class="fas fa-info"></i>'
    };

    toast.innerHTML = `
      <div class="toast-icon">${iconMap[type] || iconMap.info}</div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close" type="button" aria-label="Close">
        <i class="fas fa-times"></i>
      </button>
      <div class="toast-progress active"></div>
    `;

    // Close button
    toast.querySelector('.toast-close').addEventListener('click', () => {
      this.hide(toast);
    });

    return toast;
  }

  hide(toastEl) {
    toastEl.classList.remove('show');
    setTimeout(() => {
      toastEl.remove();
      this.toasts = this.toasts.filter(t => t !== toastEl);
    }, 500);
  }

  success(title, message, duration = 5000) {
    return this.show('success', title, message, duration);
  }

  error(title, message, duration = 5000) {
    return this.show('error', title, message, duration);
  }

  warning(title, message, duration = 5000) {
    return this.show('warning', title, message, duration);
  }

  info(title, message, duration = 5000) {
    return this.show('info', title, message, duration);
  }
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

