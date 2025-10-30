/* ================================================================
 * ملف: /js/swiper-featured.js (V7 - CLS Score < 0.05)
 * ================================================================
 * FEATURES:
 * ✅ Slides 1-2 في HTML + Skeleton 3-8 (LCP + CLS Optimization)
 * ✅ Replace skeleton slides بدلاً من append (منع Layout Shift)
 * ✅ Enhanced centered mode: 3 clear images on Desktop
 * ✅ Progressive fade for distant slides
 * ✅ Improved slidesPerView for large screens (3.3, 3.4)
 * ================================================================ */

import Swiper from 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.mjs';

// ✅ الشرائح الديناميكية (3-8 فقط)
const DYNAMIC_SLIDES_DATA = [
  'https://i.ibb.co/xq6xwTq2/484012205-623030934031341-1808374385255644063-n.jpg',  // Slide 3
  'https://i.ibb.co/67cV4CJc/484157834-622859394048495-6880924063204865717-n-min.webp', // Slide 4
  'https://i.ibb.co/8gQ15nZ7/558984721-791054437228989-7733276430689348371-n-min.jpg', // Slide 5
  'https://i.ibb.co/35fbWCYY/495226124-663623663305401-7196241149356063471-n-min.jpg', // Slide 6
  'https://i.ibb.co/Q7BshLpx/514410102-708973618770405-257295013446953510-n.jpg',      // Slide 7
  'https://i.ibb.co/LzhzfnGY/484032829-621596114174823-1720175782820299419-n.jpg'      // Slide 8
];

/**
 * ✅ استبدال Skeleton Slides بالصور الحقيقية (منع CLS)
 * @param {HTMLElement} wrapper - الـ .swiper-wrapper element
 */
function replaceSkeletonSlidesWithImages(wrapper) {
  try {
    if (!wrapper || !(wrapper instanceof HTMLElement)) {
      throw new Error('Invalid wrapper element');
    }

    let replacedCount = 0;

    DYNAMIC_SLIDES_DATA.forEach((imageUrl, index) => {
      try {
        // 🔍 البحث عن الـ skeleton slide المطابقة
        const skeletonSlide = wrapper.querySelector(
          `.skeleton-slide[data-slide-index="${index + 3}"]`
        );

        if (!skeletonSlide) {
          console.warn(`⚠️ Skeleton slide ${index + 3} not found`);
          return;
        }

        // 🎨 إنشاء Background Element
        const bg = document.createElement('div');
        bg.className = 'swiper-slide-bg';
        bg.style.backgroundImage = `url(${imageUrl})`;
        bg.loading = 'lazy';

        // 📦 إنشاء Inner Container
        const inner = document.createElement('div');
        inner.className = 'swiper-slide-inner';
        inner.innerHTML = '<div class="swiper-slide-contents"></div>';

        // 🔄 استبدال محتوى الـ skeleton بدون تغيير الأبعاد
        skeletonSlide.innerHTML = ''; // مسح الـ shimmer
        skeletonSlide.appendChild(bg);
        skeletonSlide.appendChild(inner);

        // ✅ إزالة الـ skeleton class وإضافة loaded class
        skeletonSlide.classList.remove('skeleton-slide');
        skeletonSlide.classList.add('elementor-repeater-item-c8a489e', 'loaded');

        replacedCount++;

      } catch (slideError) {
        console.warn(`⚠️ Failed to replace slide ${index + 3}:`, slideError);
      }
    });

    console.log(`✅ Swiper: ${replacedCount} skeleton slides replaced with images`);

    return replacedCount;

  } catch (err) {
    console.error('❌ Failed to replace skeleton slides:', err);
    return 0;
  }
}

/**
 * ✅ تهيئة Featured Swiper مع Enhanced Centered Mode
 */
export function initFeaturedSwiper() {
  try {
    const swiperWrapper = document.querySelector('#featured-swiper .swiper-wrapper');

    if (!swiperWrapper) {
      console.error('❌ Swiper wrapper not found');
      return false;
    }

    const initialSlides = swiperWrapper.querySelectorAll('.swiper-slide').length;

    if (initialSlides === 0) {
      console.error('❌ No initial slides found in HTML');
      return false;
    }

    console.log(`✅ Found ${initialSlides} initial slide(s) (including skeletons) in HTML`);

    // ✅ استبدال Skeleton Slides بالصور
    const replacedCount = replaceSkeletonSlidesWithImages(swiperWrapper);

    if (replacedCount === 0) {
      console.warn('⚠️ No skeleton slides were replaced');
    }

    // ========================================
    // تهيئة Swiper مع Enhanced Centered Mode
    // ========================================
    const swiperInstance = new Swiper('#featured-swiper', {
      // ========================================
      // Basic Settings
      // ========================================
      effect: 'slide',
      loop: initialSlides > 2,
      speed: 600,
      watchSlidesProgress: true,

      // ========================================
      // ✅ CENTERED MODE
      // ========================================
      centeredSlides: true,

      // ========================================
      // Autoplay
      // ========================================
      autoplay: {
        delay: 4500,
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
      },

      // ========================================
      // Pagination
      // ========================================
      pagination: {
        el: '#featured-swiper .swiper-pagination',
        clickable: true,
        dynamicBullets: false,
      },

      // ========================================
      // Navigation
      // ========================================
      navigation: {
        nextEl: '#featured-swiper .swiper-button-next',
        prevEl: '#featured-swiper .swiper-button-prev',
      },

      // ========================================
      // Mobile (Default < 768px)
      // ✅ 1 صورة في المنتصف + أجزاء من الجانبين
      // ========================================
      slidesPerView: 1.3,
      slidesPerGroup: 1,
      spaceBetween: 16,

      // ========================================
      // Responsive Breakpoints
      // ========================================
      breakpoints: {
        // Small Mobile (480px+)
        480: {
          slidesPerView: 1.4,
          spaceBetween: 16,
        },

        // Tablet (768px+)
        768: {
          slidesPerView: 2.3,
          slidesPerGroup: 1,
          spaceBetween: 20,
        },

        // Desktop (1024px+)
        // ✅ 3 صور واضحة (active + prev + next)
        1024: {
          slidesPerView: 2.6,
          slidesPerGroup: 1,
          spaceBetween: 24,
        },

        // Large Desktop (1440px+)
        // ✅ 3 صور واضحة + أجزاء
        1440: {
          slidesPerView: 3.3, // ✅ محسّن
          slidesPerGroup: 1,
          spaceBetween: 28,
        },

        // Extra Large Desktop (1920px+)
        1920: {
          slidesPerView: 3.4, // ✅ محسّن
          slidesPerGroup: 1,
          spaceBetween: 32,
        }
      },

      // ========================================
      // Events
      // ========================================
      on: {
        init: function() {
          console.log(`✅ Swiper initialized (Enhanced Centered Mode): ${this.slides.length} slides`);

          const container = document.querySelector('#featured-swiper');
          if (container) {
            container.classList.add('swiper-ready');
          }

          // ✅ تطبيق opacity على الـ slides
          this.slides.forEach((slide, index) => {
            if (index !== this.activeIndex) {
              slide.style.opacity = '0.35';
            } else {
              slide.style.opacity = '1';
            }
          });
        },

        slideChange: function() {
          // تحديث opacity للـ slides
          this.slides.forEach((slide, index) => {
            if (index === this.activeIndex) {
              slide.style.opacity = '1';
            } else {
              slide.style.opacity = '0.35';
            }
          });
        },

        progress: function() {
          // ✅ تأثير Progressive Fade (محسّن للشاشات الكبيرة)
          this.slides.forEach((slide) => {
            const progress = Math.abs(slide.progress);

            // Desktop: 3 clear slides (active + prev/next)
            if (window.innerWidth >= 1024) {
              if (progress === 0) {
                // Active slide
                slide.style.opacity = '1';
                slide.style.transform = 'scale(1)';
                slide.style.filter = 'grayscale(0%)';
              } else if (progress <= 1) {
                // Prev/Next slides (واضحة)
                slide.style.opacity = '0.75';
                slide.style.transform = 'scale(0.98)';
                slide.style.filter = 'grayscale(0%)';
              } else {
                // Distant slides (fade)
                const opacity = Math.max(0.2, 1 - (progress - 1) * 0.4);
                slide.style.opacity = opacity;
                slide.style.transform = `scale(${Math.max(0.92, 1 - (progress - 1) * 0.04)})`;
                slide.style.filter = `grayscale(${Math.min(30, (progress - 1) * 20)}%)`;
              }
            } else {
              // Mobile/Tablet: Default behavior
              const opacity = Math.max(0.2, 1 - progress * 0.6);
              const scale = Math.max(0.95, 1 - progress * 0.05);

              slide.style.opacity = opacity;
              slide.style.transform = `scale(${scale})`;
              slide.style.filter = `grayscale(${Math.min(20, progress * 20)}%)`;
            }
          });
        },

        resize: function() {
          this.update();
        }
      }
    });

    window.featuredSwiperInstance = swiperInstance;

    // ✅ إظهار الأزرار عند hover على الشاشات الكبيرة
    const container = document.querySelector('#featured-swiper');
    if (container && window.innerWidth >= 768) {
      container.addEventListener('mouseenter', () => {
        const buttons = container.querySelectorAll('.swiper-button-prev, .swiper-button-next');
        buttons.forEach(btn => btn.style.opacity = '1');
      });

      container.addEventListener('mouseleave', () => {
        const buttons = container.querySelectorAll('.swiper-button-prev, .swiper-button-next');
        buttons.forEach(btn => btn.style.opacity = '0.5');
      });
    }

    return true;

  } catch (err) {
    console.error('❌ Swiper initialization failed:', err);

    const container = document.querySelector('#featured-swiper');
    if (container) {
      container.innerHTML = `
        <div style="padding: 2rem; text-align: center; color: #ef4444;">
          <p>⚠️ عذراً، حدث خطأ في تحميل العروض</p>
          <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #ef4444; color: white; border: none; border-radius: 8px; cursor: pointer;">
            إعادة المحاولة
          </button>
        </div>
      `;
    }

    return false;
  }
}

/* ================================================================
 * Utility Functions
 * ================================================================ */

export function updateSwiper() {
  if (window.featuredSwiperInstance) {
    window.featuredSwiperInstance.update();
    console.log('✅ Swiper updated manually');
    return true;
  }
  console.warn('⚠️ Swiper instance not found');
  return false;
}

export function toggleAutoplay(enable = true) {
  if (window.featuredSwiperInstance) {
    if (enable) {
      window.featuredSwiperInstance.autoplay.start();
      console.log('✅ Autoplay started');
    } else {
      window.featuredSwiperInstance.autoplay.stop();
      console.log('⏸️ Autoplay stopped');
    }
    return true;
  }
  return false;
}

export function goToSlide(index) {
  if (window.featuredSwiperInstance) {
    window.featuredSwiperInstance.slideTo(index);
    console.log(`✅ Navigated to slide ${index}`);
    return true;
  }
  return false;
}