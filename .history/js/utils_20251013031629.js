// ================================================================
// utils.js - الدوال العامة والمساعدة
// ================================================================

// ================================================================
// ===== Scroll Handler =====
// ================================================================
let scrollTicking = false;
let categoriesOriginalOffset = 0;

export function handleScroll() {
  if (!scrollTicking) {
    window.requestAnimationFrame(() => {
      const header = document.getElementById('header');
      
      if (header) {
        if (window.scrollY > 50) {
          header.classList.add('scrolled');
          document.body.classList.add('scrolled');
        } else {
          header.classList.remove('scrolled');
          document.body.classList.remove('scrolled');
        }
      }
      
      handleCategoriesSticky();
      scrollTicking = false;
    });
    
    scrollTicking = true;
  }
}

// ================================================================
// ===== Categories Sticky Handler =====
// ================================================================
function handleCategoriesSticky() {
  const header = document.getElementById('header');
  const categories = document.getElementById('categoriesSection');
  
  if (!header || !categories) return;
  
  const headerHeight = header.getBoundingClientRect().height;
  const scrollY = window.scrollY;
  
  if (scrollY >= categoriesOriginalOffset - headerHeight) {
    categories.classList.add('visible');
    categories.style.top = `${headerHeight}px`;
    updateActiveCategory();
  } else {
    categories.classList.remove('visible');
  }
}

// ================================================================
// ===== تحديث الكاتيجوري النشطة أثناء الـ scroll =====
// ================================================================
function updateActiveCategory() {
  const categoryGroups = document.querySelectorAll('.category-group');
  if (categoryGroups.length === 0) return;
  
  const header = document.getElementById('header');
  const categories = document.getElementById('categoriesSection');
  
  if (!header || !categories) return;
  
  const headerHeight = header.getBoundingClientRect().height;
  const categoriesHeight = categories.getBoundingClientRect().height;
  const offset = headerHeight + categoriesHeight + 50;
  
  let activeCategory = null;
  
  categoryGroups.forEach(group => {
    const rect = group.getBoundingClientRect();
    if (rect.top <= offset && rect.bottom > offset) {
      activeCategory = group.id.replace('category-', '');
    }
  });
  
  if (activeCategory) {
    const tabs = document.querySelectorAll('.category-tab');
    tabs.forEach(tab => {
      tab.classList.remove('active');
      const onclick = tab.getAttribute('onclick');
      if (onclick && onclick.includes(`'${activeCategory}'`)) {
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
  const categories = document.getElementById('categoriesSection');
  if (categories) {
    setTimeout(() => {
      categoriesOriginalOffset = categories.offsetTop;
      console.log('📌 Categories original position:', categoriesOriginalOffset);
    }, 100);
  }
}

// ================================================================
// ===== تأثيرات بصرية متقدمة - الثلج =====
// ================================================================
export function createSnowflakes() {
  const snowflakeChars = ['❄', '🌨', '❅', '✨', '💫', '⭐'];
  const container = document.querySelector('.animated-background');

  if (!container) return;

  function addSnowflake() {
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

    setTimeout(() => {
      snowflake.remove();
    }, (duration + 5) * 1000);
  }

  for (let i = 0; i < 10; i++) {
    setTimeout(addSnowflake, i * 500);
  }

  setInterval(addSnowflake, 1500);
}

// ================================================================
// ===== Toast Notification =====
// ================================================================
export function showToast(title, description, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  
  toast.className = 'toast ' + type;
  
  const iconElement = toast.querySelector('.toast-icon i');
  if (iconElement) {
    const icon = type === 'success' ? 'check-circle-2' : 'x-circle';
    iconElement.setAttribute('data-lucide', icon);
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }
  
  const titleElement = document.getElementById('toast-title');
  const descElement = document.getElementById('toast-description');
  
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
// ===== Calculate Distance =====
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

console.log('✅ Utils module loaded');