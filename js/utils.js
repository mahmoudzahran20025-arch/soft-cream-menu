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
/*
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
}*/
/**
 * Toast Manager - Mobile & Desktop Optimized
 * Features: Swipe to dismiss, Haptic feedback, Auto-stack management
 */

export function showToast(type = 'success', title = 'Success', message = '', duration = 5000) {
  if (!window.toastManager) {
    window.toastManager = new ToastManager('toastContainer');
  }
  
  // Add haptic feedback on mobile
  if ('vibrate' in navigator) {
    if (type === 'error') {
      navigator.vibrate(200);
    } else if (type === 'success') {
      navigator.vibrate([50, 50, 50]);
    } else if (type === 'warning') {
      navigator.vibrate(100);
    }
  }
  
  return window.toastManager.show(type, title, message, duration);
}

export class ToastManager {
  constructor(containerId = 'toastContainer', maxToasts = 3) {
    this.container = document.getElementById(containerId);
    this.toasts = [];
    this.maxToasts = maxToasts;
    
    if (!this.container) {
      console.warn(`Toast container with id "${containerId}" not found`);
    }
  }

  show(type = 'success', title = 'Success', message = '', duration = 5000) {
    if (!this.container) return;

    // Remove oldest toast if we hit the limit
    if (this.toasts.length >= this.maxToasts) {
      this.hide(this.toasts[0]);
    }

    const toastEl = this.createToast(type, title, message, duration);
    this.container.appendChild(toastEl);
    this.toasts.push(toastEl);

    // Show animation
    requestAnimationFrame(() => {
      toastEl.classList.add('show');
    });

    // Auto hide
    const hideTimeout = setTimeout(() => {
      this.hide(toastEl);
    }, duration);

    // Store timeout ID for manual dismiss
    toastEl.dataset.timeoutId = hideTimeout;

    return toastEl;
  }

  createToast(type, title, message, duration) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const iconMap = {
      success: '<i class="fas fa-check-circle"></i>',
      error: '<i class="fas fa-times-circle"></i>',
      warning: '<i class="fas fa-exclamation-triangle"></i>',
      info: '<i class="fas fa-info-circle"></i>'
    };

    toast.innerHTML = `
      <div class="toast-icon">${iconMap[type] || iconMap.info}</div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        ${message ? `<div class="toast-message">${message}</div>` : ''}
      </div>
      <button class="toast-close" type="button" aria-label="Close">
        <i class="fas fa-times"></i>
      </button>
      <div class="toast-progress" style="animation-duration: ${duration}ms"></div>
    `;

    // Close button
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      clearTimeout(toast.dataset.timeoutId);
      this.hide(toast);
    });

    // Add touch support for swipe to dismiss (mobile)
    this.addSwipeSupport(toast);

    // Pause progress on hover (desktop)
    toast.addEventListener('mouseenter', () => {
      const progress = toast.querySelector('.toast-progress');
      progress.style.animationPlayState = 'paused';
      clearTimeout(toast.dataset.timeoutId);
    });

    toast.addEventListener('mouseleave', () => {
      const progress = toast.querySelector('.toast-progress');
      progress.style.animationPlayState = 'running';
      
      // Calculate remaining time
      const computedStyle = window.getComputedStyle(progress);
      const animationDuration = parseFloat(computedStyle.animationDuration) * 1000;
      const currentTime = parseFloat(computedStyle.animationDelay) || 0;
      const remainingTime = animationDuration + currentTime;
      
      const hideTimeout = setTimeout(() => {
        this.hide(toast);
      }, Math.max(remainingTime, 500));
      
      toast.dataset.timeoutId = hideTimeout;
    });

    return toast;
  }

  addSwipeSupport(toast) {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchCurrentX = 0;
    let isSwiping = false;

    toast.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      isSwiping = false;
      
      // Pause auto-hide while touching
      clearTimeout(toast.dataset.timeoutId);
      const progress = toast.querySelector('.toast-progress');
      progress.style.animationPlayState = 'paused';
    }, { passive: true });

    toast.addEventListener('touchmove', (e) => {
      touchCurrentX = e.touches[0].clientX;
      const touchCurrentY = e.touches[0].clientY;
      const diffX = touchCurrentX - touchStartX;
      const diffY = Math.abs(touchCurrentY - touchStartY);

      // Only swipe horizontally if not scrolling vertically
      if (Math.abs(diffX) > 10 && diffY < 30) {
        isSwiping = true;
        e.preventDefault();
        
        const opacity = Math.max(0, 1 - Math.abs(diffX) / 200);
        toast.style.transform = `translateX(${diffX}px)`;
        toast.style.opacity = opacity;
      }
    }, { passive: false });

    toast.addEventListener('touchend', (e) => {
      const diffX = touchCurrentX - touchStartX;

      if (isSwiping && Math.abs(diffX) > 100) {
        // Dismiss if swiped far enough
        toast.style.transform = `translateX(${diffX > 0 ? '100%' : '-100%'})`;
        toast.style.opacity = '0';
        setTimeout(() => this.hide(toast), 200);
      } else {
        // Reset position
        toast.style.transform = '';
        toast.style.opacity = '';
        
        // Resume auto-hide
        const progress = toast.querySelector('.toast-progress');
        progress.style.animationPlayState = 'running';
        
        const remainingTime = 2000; // Resume with 2 seconds remaining
        const hideTimeout = setTimeout(() => {
          this.hide(toast);
        }, remainingTime);
        
        toast.dataset.timeoutId = hideTimeout;
      }

      isSwiping = false;
    }, { passive: true });
  }

  hide(toastEl) {
    if (!toastEl || !toastEl.parentNode) return;
    
    toastEl.classList.remove('show');
    toastEl.classList.add('hide');
    
    setTimeout(() => {
      if (toastEl.parentNode) {
        toastEl.remove();
      }
      this.toasts = this.toasts.filter(t => t !== toastEl);
    }, 300);
  }

  success(title, message = '', duration = 5000) {
    return this.show('success', title, message, duration);
  }

  error(title, message = '', duration = 5000) {
    return this.show('error', title, message, duration);
  }

  warning(title, message = '', duration = 5000) {
    return this.show('warning', title, message, duration);
  }

  info(title, message = '', duration = 5000) {
    return this.show('info', title, message, duration);
  }

  clearAll() {
    this.toasts.forEach(toast => {
      clearTimeout(toast.dataset.timeoutId);
      this.hide(toast);
    });
  }
}

// Usage Examples:
/*
// Basic usage
showToast('success', 'تم الحفظ', 'تم حفظ التغييرات بنجاح');
showToast('error', 'خطأ', 'حدث خطأ أثناء الحفظ');
showToast('warning', 'تحذير', 'يرجى ملء جميع الحقول');
showToast('info', 'معلومة', 'لديك 3 إشعارات جديدة');

// Using manager directly
const toast = window.toastManager;
toast.success('عملية ناجحة', 'تم إرسال الرسالة');
toast.error('فشل الاتصال', 'تحقق من الإنترنت');

// Custom duration
showToast('info', 'رسالة سريعة', '', 2000);

// Clear all toasts
window.toastManager.clearAll();
*/
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


// Soft Ice Cream GSAP Animations - Isolated
// Soft Ice Cream GSAP - Isolated Version
// utils.js

/**
 * Format a number as a price string
 * @param {number} value - الرقم المراد تحويله
 * @param {string} lang - 'ar' للعربية، أي قيمة أخرى للإنجليزية
 * @returns {string} السعر مع التنسيق والعملة
 */
export function formatPrice(value, lang = 'ar') {
  if (isNaN(value) || value === null) value = 0;

  const formatted = Number(value).toLocaleString(
    lang === 'ar' ? 'ar-EG' : 'en-US', 
    { minimumFractionDigits: 2, maximumFractionDigits: 2 }
  );

  const currency = lang === 'ar' ? 'ج.م' : 'EGP';
  return `${formatted} ${currency}`;
}

// ================================================================
// Utility: حساب المسافة بين نقطتين (lat/lng) بالكيلومتر
// ================================================================
/*
export function calculateDistance(lat1, lng1, lat2, lng2) {
  const toRad = (value) => (value * Math.PI) / 180;

  const R = 6371; // نصف قطر الأرض بالكيلومتر
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a = 
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance; // بالكيلومتر
}*/
