/* ================================================================
 * ملف: /js/swiper-marquee.js (V3 - Text Marquee)
 * ================================================================
 * Strategy:
 * - HTML يحتوي على Message 1 (LCP Optimization)
 * - JavaScript يضيف Messages 2-4 (Hydration)
 * - Continuous linear scrolling (شريط أخبار)
 * - NO touch interaction (autoplay فقط)
 * ================================================================ */

import Swiper from 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.mjs';

// ✅ الرسائل الديناميكية (Messages 2-4 فقط) - i18n keys
const DYNAMIC_MESSAGES = [
  {
    icon: '🚚',
    titleKey: 'marqueeDeliveryTitle',
    textKey: 'marqueeDeliveryText'
  },
  {
    icon: '⚡',
    titleKey: 'marqueeEnergyTitle',
    textKey: 'marqueeEnergyText'
  },
  {
    icon: '🌿',
    titleKey: 'marqueeNaturalTitle',
    textKey: 'marqueeNaturalText'
  }
];

/**
 * ✅ إضافة الرسائل الديناميكية (2-4)
 * @param {HTMLElement} wrapper - الـ .swiper-wrapper element
 */
function appendDynamicMessages(wrapper) {
  try {
    const fragment = document.createDocumentFragment();
    
    DYNAMIC_MESSAGES.forEach(message => {
      // إنشاء Slide
      const slide = document.createElement('div');
      slide.className = 'swiper-slide';
      
      // بناء المحتوى مع i18n
      const title = document.createElement('span');
      title.className = 'marquee-title';
      title.setAttribute('data-i18n', message.titleKey);
      title.textContent = window.i18n?.t(message.titleKey) || message.titleKey;
      
      const text = document.createElement('span');
      text.setAttribute('data-i18n', message.textKey);
      text.textContent = window.i18n?.t(message.textKey) || message.textKey;
      
      slide.innerHTML = `<span class="marquee-icon">${message.icon}</span>`;
      slide.appendChild(title);
      slide.appendChild(text);
      
      fragment.appendChild(slide);
    });

    // ✅ إضافة (append) بدون مسح المحتوى القديم
    wrapper.appendChild(fragment);
    
    console.log('✅ Marquee Swiper: 3 dynamic messages appended successfully');
    
  } catch (err) {
    console.error('❌ Failed to append dynamic messages:', err);
  }
}

// ✅ حفظ مرجع الـ Swiper للتحديث لاحقاً
let marqueeSwiperInstance = null;

/**
 * ✅ تحديث نصوص Marquee عند تغيير اللغة
 */
export function updateMarqueeText(lang) {
  try {
    // تحديث جميع العناصر التي لها data-i18n داخل الـ Swiper
    const swiperEl = document.querySelector('#text-marquee-swiper');
    if (!swiperEl) return;
    
    swiperEl.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      const translation = window.i18n?.t(key);
      if (translation && translation !== key) {
        element.textContent = translation;
      }
    });
    
    // ✅ تحديث الـ Swiper لإعادة حساب الأبعاد
    if (marqueeSwiperInstance) {
      marqueeSwiperInstance.update();
      console.log('✅ Marquee Swiper updated after language change');
    }
  } catch (err) {
    console.error('❌ Failed to update marquee text:', err);
  }
}

/**
 * ✅ تهيئة Marquee Swiper
 */
export function initMarqueeSwiper() {
  try {
    const swiperWrapper = document.querySelector('#text-marquee-swiper .swiper-wrapper');
    
    if (!swiperWrapper) {
      console.error('❌ Swiper wrapper #text-marquee-swiper .swiper-wrapper not found');
      return false;
    }

    // 1. إضافة الرسائل الديناميكية (2-4)
    appendDynamicMessages(swiperWrapper);

    // 2. تهيئة Swiper بحركة خطية مستمرة وحفظ المرجع
    marqueeSwiperInstance = new Swiper('#text-marquee-swiper', {
      // ========================================
      // Basic Settings
      // ========================================
      loop: true,
      speed: 12000, // 12 seconds per transition
      
      // ========================================
      // Autoplay (Continuous Linear Motion)
      // ========================================
      autoplay: {
        delay: 0, // ✅ بدون توقف
        disableOnInteraction: false,
      },
      
      // ========================================
      // Free Mode (Smooth Scrolling)
      // ========================================
      freeMode: {
        enabled: true,
        momentum: false,
      },
      
      // ========================================
      // Slides Settings
      // ========================================
      slidesPerView: 'auto',
      spaceBetween: 0,
      centeredSlides: false,
      
      // ========================================
      // Disable Touch Interaction
      // ========================================
      allowTouchMove: false,
      simulateTouch: false,
      
      // ========================================
      // No Pagination/Navigation
      // ========================================
      pagination: false,
      navigation: false,
      
      // ========================================
      // Events
      // ========================================
      on: {
        init: function() {
          console.log('✅ Marquee Swiper initialized with', this.slides.length, 'messages');
        }
      }
    });

    // ✅ حفظ المرجع للـ language listener
    window.marqueeSwiperInstance = marqueeSwiperInstance;

    return true;

  } catch (err) {
    console.error('❌ Marquee Swiper initialization failed:', err);
    return false;
  }
}

/* ================================================================
 * 🌐 Language Change Listener for Marquee
 * ================================================================ */

// الاستماع لتغيير اللغة
window.addEventListener('language-changed', (event) => {
  const newLang = event.detail?.lang || 'ar';
  console.log('📢 Marquee: Language changed to', newLang);
  
  // ✅ انتظر حتى يتم تحميل DOM
  setTimeout(() => {
    // ✅ تحديث فوري وقوي
    try {
      const slides = document.querySelectorAll('#text-marquee-swiper .swiper-slide');
      console.log('📢 Found slides:', slides.length);
      
      slides.forEach(slide => {
        const title = slide.querySelector('[data-i18n]');
        if (title && window.i18n) {
          const key = title.getAttribute('data-i18n');
          const newText = window.i18n.t(key);
          console.log('📢 Updating:', key, '->', newText);
          title.textContent = newText;
        }
      });
      
      // ✅ Force update + restart autoplay
      if (window.marqueeSwiperInstance) {
        // Stop current autoplay
        window.marqueeSwiperInstance.autoplay.stop();
        
        // Update slides
        window.marqueeSwiperInstance.update();
        window.marqueeSwiperInstance.updateSize();
        window.marqueeSwiperInstance.updateSlides();
        
        // Restart autoplay
        window.marqueeSwiperInstance.autoplay.start();
        
        console.log('✅ Marquee texts updated and restarted');
      } else {
        console.warn('⚠️ Marquee instance not found, reinitializing...');
        initMarqueeSwiper();
      }
    } catch (err) {
      console.warn('⚠️ Failed to update Marquee texts:', err);
      // Fallback: إعادة تهيئة كاملة
      if (window.marqueeSwiperInstance && window.marqueeSwiperInstance.destroy) {
        window.marqueeSwiperInstance.destroy(true, true);
      }
      setTimeout(() => {
        initMarqueeSwiper();
      }, 100);
    }
  }, 50); // ✅ انتظر 50ms للتأكد من تحديث DOM
});

console.log('✅ Marquee Swiper: Language change listener registered');