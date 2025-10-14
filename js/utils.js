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
  maxSnowflakes: 30,
  snowflakeInterval: null
};

// ================================================================
// ===== Configuration =====
// ================================================================
const config = {
  selectors: {
    header: '#header',
    categoriesSection: '#categoriesSection',
    toast: '#toast',
    categoryGroup: '.category-group',
    categoryTab: '.nav-item',  // ✅ تصحيح: اسم الـ class الصحيح
    animatedBackground: '.animated-background'
  },
  scrollOffset: 50,
  categoriesOffset: 50
};

// ================================================================
// ===== Scroll Handler (محسّن) =====
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
      updateActiveCategory();  // ✅ تحديث الـ active tab باستمرار
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
  } else {
    categories.classList.remove('visible');
  }
}

// ================================================================
// ===== تحديث الـ Active Category أثناء الـ Scroll (محسّنة) =====
// ✅ هذه هي المشكلة الأساسية - الكود القديم ما كان بينادي عليها بشكل صحيح
// ================================================================
function updateActiveCategory() {
  const categoryGroups = document.querySelectorAll(config.selectors.categoryGroup);
  if (categoryGroups.length === 0) return;
  
  const header = document.querySelector(config.selectors.header);
  const categories = document.querySelector(config.selectors.categoriesSection);
  
  if (!header || !categories) return;
  
  const headerHeight = header.getBoundingClientRect().height;
  const categoriesHeight = categories.getBoundingClientRect().height;
  
  // ✅ الحد الذي نتحقق منه هو أسفل المتصفح شوية
  const triggerPoint = headerHeight + categoriesHeight + 100;
  
  let activeCategory = null;
  let closestDistance = Infinity;
  
  // ✅ البحث عن أقرب category من الـ trigger point
  categoryGroups.forEach(group => {
    const rect = group.getBoundingClientRect();
    const distance = Math.abs(rect.top - triggerPoint);
    
    // إذا كانت الـ group مرئية والـ trigger point فيها
    if (rect.top <= triggerPoint && rect.bottom > triggerPoint) {
      activeCategory = group.id.replace('category-', '');
    }
    // أو أقرب واحدة لـ trigger point
    else if (distance < closestDistance && rect.top >= 0) {
      closestDistance = distance;
      activeCategory = group.id.replace('category-', '');
    }
  });
  
  if (activeCategory) {
    // ✅ تحديث الـ nav items (ليس الـ categories tabs)
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.classList.remove('active');
      
      // ✅ البحث عن الـ nav item اللي يطابق الـ category
      const icon = item.querySelector('i');
      if (icon && getCategoryFromNavItem(item) === activeCategory) {
        item.classList.add('active');
      }
    });
    
    // ✅ تحديث الـ categories scroll tabs أيضاً
    const categoryTabs = document.querySelectorAll('[data-category]');
    categoryTabs.forEach(tab => {
      tab.classList.remove('active');
      if (tab.getAttribute('data-category') === activeCategory) {
        tab.classList.add('active');
        
        // ✅ Scroll into view للـ active tab
        if (tab.scrollIntoView) {
          tab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        }
      }
    });
  }
}

// ================================================================
// ===== Helper: الحصول على الـ Category من الـ Nav Item =====
// ================================================================
function getCategoryFromNavItem(navItem) {
  // ✅ تحويل الترتيب إلى category name
  const items = document.querySelectorAll('.nav-item');
  let index = 0;
  
  items.forEach((item, i) => {
    if (item === navItem) {
      index = i;
    }
  });
  
  // ✅ Map nav items إلى categories
  const categoryMap = {
    0: 'ice-cream',     // المنيو
    1: 'desserts',      // (إذا كان موجود)
    2: null,            // السلة (ليست category)
    3: null,            // من نحن (ليست category)
    4: null             // تواصل (ليست category)
  };
  
  return categoryMap[index] || null;
}

// ================================================================
// ===== Scroll To Top =====
// ================================================================
export function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ================================================================
// ===== حفظ موضع الـ Categories الأصلي =====
// ================================================================
export function initCategoriesOffset() {
  const categories = document.querySelector(config.selectors.categoriesSection);
  if (categories) {
    // ✅ استخدام setTimeout بـ 0 بدلاً من 100 للأداء
    requestAnimationFrame(() => {
      state.categoriesOriginalOffset = categories.offsetTop;
      console.log('📌 Categories original position:', state.categoriesOriginalOffset);
    });
  }
}

// ================================================================
// ===== تأثيرات بصرية - الثلج =====
// ================================================================
export function createSnowflakes() {
  const snowflakeChars = ['❄', '🌨', '❅', '✨', '💫', '⭐'];
  const container = document.querySelector(config.selectors.animatedBackground);

  if (!container) {
    console.warn('Animated background container not found');
    return;
  }

  if (state.snowflakeInterval) {
    clearInterval(state.snowflakeInterval);
  }

  function addSnowflake() {
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

    setTimeout(() => {
      if (snowflake.parentNode) {
        snowflake.remove();
        state.snowflakeCount--;
      }
    }, (duration + 5) * 1000);
  }

  for (let i = 0; i < 10; i++) {
    setTimeout(addSnowflake, i * 500);
  }

  state.snowflakeInterval = setInterval(addSnowflake, 1500);
}

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
// ===== Toast Notification =====
// ================================================================
export function showToast(title, description, type = 'success') {
  const toast = document.querySelector(config.selectors.toast);
  if (!toast) {
    console.warn('Toast element not found');
    return;
  }
  
  toast.className = 'toast ' + type;
  
  const iconElement = toast.querySelector('.toast-icon i');
  if (iconElement) {
    const icon = type === 'success' ? 'check-circle-2' : 'x-circle';
    iconElement.setAttribute('data-lucide', icon);
    
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
  const R = 6371;
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
// ===== Get/Set Config =====
// ================================================================
export function getConfig() {
  return { ...config };
}

export function setConfig(newConfig) {
  Object.assign(config, newConfig);
}

// ================================================================
// ===== Cleanup All =====
// ================================================================
export function cleanup() {
  stopSnowflakes();
  state.scrollTicking = false;
  state.categoriesOriginalOffset = 0;
  console.log('🧹 Utils cleaned up');
}

console.log('✅ Utils module loaded (Secure & Optimized)');