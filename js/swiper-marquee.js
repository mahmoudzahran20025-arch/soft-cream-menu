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

// ✅ الرسائل الديناميكية (Messages 2-4 فقط)
const DYNAMIC_MESSAGES = [
  {
    icon: '🚚',
    title: 'توصيل مجاني',
    text: 'للطلبات فوق 100 جنيه في القاهرة'
  },
  {
    icon: '🥭',
    title: 'جديدنا',
    text: 'سوفت المانجو الطبيعي - طعم الصيف في كل معلقة'
  },
  {
    icon: '🌿',
    title: 'طبيعي 100%',
    text: 'بدون مواد حافظة أو ألوان صناعية'
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
      
      // بناء المحتوى
      slide.innerHTML = `
        <span class="marquee-icon">${message.icon}</span>
        <span class="marquee-title">${message.title}:</span>
        <span>${message.text}</span>
      `;
      
      fragment.appendChild(slide);
    });

    // ✅ إضافة (append) بدون مسح المحتوى القديم
    wrapper.appendChild(fragment);
    
    console.log('✅ Marquee Swiper: 3 dynamic messages appended successfully');
    
  } catch (err) {
    console.error('❌ Failed to append dynamic messages:', err);
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

    // 2. تهيئة Swiper بحركة خطية مستمرة
    new Swiper('#text-marquee-swiper', {
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

    return true;

  } catch (err) {
    console.error('❌ Marquee Swiper initialization failed:', err);
    return false;
  }
}