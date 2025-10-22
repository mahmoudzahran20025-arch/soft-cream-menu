/*
export function initGSAPAnimations() {
  // تأكد من تحميل GSAP
  if (typeof gsap === 'undefined') {
    console.error('❌ GSAP not loaded');
    return;
  }

  // انتظر تحميل كل الصور
  const images = document.querySelectorAll('img');
  let loadedImages = 0;

  function startAnimations() {
    gsap.registerPlugin(ScrollTrigger);
    
    // إخفاء العناصر أولاً
    gsap.utils.toArray(".icecream-gs-reveal").forEach(function(elem) {
      gsap.set(elem, { autoAlpha: 0 });
    });

    // بدء الأنيميشن
    gsap.utils.toArray(".icecream-gs-reveal").forEach(function(elem) {
      ScrollTrigger.create({
        trigger: elem,
        onEnter: () => animateFrom(elem),
        onEnterBack: () => animateFrom(elem, -1),
        onLeave: () => gsap.set(elem, { autoAlpha: 0 })
      });
    });

    console.log('✅ Animations initialized after full page load');
  }

  function animateFrom(elem, direction = 1) {
    const x = elem.classList.contains("icecream-gs-reveal-fromLeft") ? -100 :
             elem.classList.contains("icecream-gs-reveal-fromRight") ? 100 : 0;
    
    const y = direction * 100;
    
    gsap.fromTo(elem, 
      {
        x: x,
        y: y,
        autoAlpha: 0
      },
      {
        duration: 1.25,
        x: 0,
        y: 0,
        autoAlpha: 1,
        ease: "expo",
        overwrite: "auto"
      }
    );
  }

  // التأكد من تحميل كل الصور
  function handleImageLoad() {
    loadedImages++;
    if (loadedImages === images.length) {
      // بدء الأنيميشن بعد تحميل كل الصور
      startAnimations();
    }
  }

  // إضافة event listener لكل صورة
  images.forEach(img => {
    if (img.complete) {
      handleImageLoad();
    } else {
      img.addEventListener('load', handleImageLoad);
      img.addEventListener('error', handleImageLoad); // في حالة فشل تحميل الصورة
    }
  });

  // في حالة عدم وجود صور أصلاً
  if (images.length === 0) {
    startAnimations();
  }
}

// تشغيل عندما يكتمل تحميل DOM
document.addEventListener('DOMContentLoaded', () => {
  // تأخير قصير للتأكد من تحميل كل شيء
  window.addEventListener('load', () => {
    setTimeout(initGSAPAnimations, 100);
  });
});

*/
// ============================================
// 2. carousel.js - حط هذا الملف في مجلد JS
// ============================================
// ============================================
// ملف: js/carousel.js
// ============================================
// ============================================
// ملف: js/carousel.js
// النظام التلقائي - بيشتغل لوحده بدون import
// ============================================

// ============================================
// 🚀 Performance Optimized Carousel Class
// ============================================
/**
 * ============================================
 * PERFORMANCE OPTIMIZED CAROUSEL - FIXED VERSION
 * ============================================
 * 
 * Fixes Applied:
 * ✅ Image loading race condition fixed
 * ✅ Transform using pixels instead of percentages
 * ✅ Removed visibility hiding that broke layout
 * ✅ Proper initialization timing
 * ✅ GPU acceleration without side effects
 * ✅ Touch/swipe support
 * ✅ Keyboard navigation
 * ✅ Intersection Observer for performance
 * ✅ Progress bar animation
 * ✅ Auto-play management
 * ============================================
 */

class Carousel {
    constructor(options = {}) {
        console.log('🎠 Initializing Performance Optimized Carousel...');
        
        // ============================================
        // 1️⃣ Element References with Safety Checks
        // ============================================
        this.track = document.getElementById('carouselTrack');
        if (!this.track) {
            console.warn('⚠️ Carousel track not found - skipping initialization');
            return;
        }

        this.slides = Array.from(this.track.children);
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.dotsContainer = document.getElementById('dotsContainer');
        this.thumbnails = Array.from(document.querySelectorAll('.thumbnail'));
        this.progressFill = document.getElementById('progressFill');
        this.wrapper = document.querySelector('.carousel-wrapper');
        
        // ============================================
        // 2️⃣ State Management
        // ============================================
        this.currentIndex = 0;
        this.totalSlides = this.slides.length;
        this.autoPlayInterval = null;
        this.progressInterval = null;
        this.autoPlayDuration = options.autoPlayDuration || 5000;
        this.isTransitioning = false;
        this.isVisible = true;
        this.isPaused = false;
        
        // ============================================
        // 3️⃣ Performance Optimizations
        // ============================================
        this.rafId = null;
        this.lastUpdate = 0;
        this.throttleDelay = 16; // ~60fps
        
        if (this.totalSlides > 0) {
            this.init();
            console.log(`✅ Carousel initialized with ${this.totalSlides} slides`);
        } else {
            console.warn('⚠️ No slides found in carousel');
        }
    }

    // ============================================
    // 🎯 Initialization
    // ============================================
    async init() {
        // ✅ FIXED: Wait for all images to load first
        await this.waitForImages();
        
        this.optimizeRendering();
        this.createDots();
        this.addEventListeners();
        this.setupIntersectionObserver();
        this.updateCarousel();
        this.startAutoPlay();
        
        console.log('✅ Carousel fully initialized with images loaded');
    }

    // ============================================
    // 🖼️ Wait for Images to Load (CRITICAL FIX)
    // ============================================
    waitForImages() {
        // ✅ FIXED: Target ALL images, not just data-src
        const images = Array.from(this.track.querySelectorAll('img'));
        
        if (images.length === 0) {
            console.log('ℹ️ No images found in carousel');
            return Promise.resolve();
        }

        console.log(`🖼️ Waiting for ${images.length} images to load...`);

        const imagePromises = images.map(img => {
            // If already loaded, resolve immediately
            if (img.complete && img.naturalWidth > 0) {
                return Promise.resolve();
            }
            
            // Otherwise wait for load event
            return new Promise((resolve) => {
                img.addEventListener('load', () => {
                    console.log(`✅ Image loaded: ${img.alt || img.src.slice(0, 40)}...`);
                    resolve();
                }, { once: true, passive: true });
                
                img.addEventListener('error', () => {
                    console.error(`❌ Failed to load: ${img.src}`);
                    resolve(); // Still resolve to not block carousel
                }, { once: true, passive: true });
            });
        });

        return Promise.all(imagePromises);
    }

    // ============================================
    // ⚡ Rendering Optimization (FIXED!)
    // ============================================
    optimizeRendering() {
        // ✅ FIXED: Only enable GPU acceleration
        // ❌ DO NOT hide slides - that breaks the layout!
        if (this.track) {
            this.track.style.transform = 'translateZ(0)'; // Force GPU layer
        }
        
        console.log('✅ GPU acceleration enabled');
    }

    // ============================================
    // 👁️ Intersection Observer for Performance
    // ============================================
    setupIntersectionObserver() {
        if (!('IntersectionObserver' in window)) {
            console.warn('⚠️ IntersectionObserver not supported');
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                this.isVisible = entry.isIntersecting;
                
                if (entry.isIntersecting) {
                    console.log('👁️ Carousel visible - resuming autoplay');
                    if (!this.isPaused) this.startAutoPlay();
                } else {
                    console.log('👁️ Carousel hidden - pausing autoplay');
                    this.stopAutoPlay();
                }
            });
        }, { threshold: 0.5 });

        observer.observe(this.wrapper || this.track);
        console.log('✅ Intersection Observer enabled');
    }

    // ============================================
    // 🔴 Dots Creation
    // ============================================
    createDots() {
        if (!this.dotsContainer) return;
        
        // Use DocumentFragment for performance
        const fragment = document.createDocumentFragment();
        
        for (let i = 0; i < this.totalSlides; i++) {
            const dot = document.createElement('div');
            dot.classList.add('dot');
            dot.setAttribute('role', 'button');
            dot.setAttribute('aria-label', `الذهاب إلى الشريحة ${i + 1}`);
            
            if (i === 0) dot.classList.add('active');
            
            dot.addEventListener('click', () => this.goToSlide(i), { passive: true });
            fragment.appendChild(dot);
        }
        
        this.dotsContainer.appendChild(fragment);
        this.dots = Array.from(this.dotsContainer.querySelectorAll('.dot'));
        console.log(`✅ Created ${this.dots.length} navigation dots`);
    }

    // ============================================
    // 🎧 Event Listeners (Optimized)
    // ============================================
    addEventListeners() {
        // Navigation Buttons
        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', () => this.prevSlide(), { passive: true });
        }
        
        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', () => this.nextSlide(), { passive: true });
        }
        
        // Thumbnails
        if (this.thumbnails.length > 0) {
            this.thumbnails.forEach(thumb => {
                thumb.addEventListener('click', (e) => {
                    const index = parseInt(e.currentTarget.dataset.index);
                    if (!isNaN(index)) this.goToSlide(index);
                }, { passive: true });
            });
        }

        // Touch/Swipe
        this.setupTouchEvents();

        // Keyboard Navigation
        this.setupKeyboardEvents();

        // Pause on Hover
        if (this.wrapper) {
            this.wrapper.addEventListener('mouseenter', () => {
                this.isPaused = true;
                this.stopAutoPlay();
            }, { passive: true });
            
            this.wrapper.addEventListener('mouseleave', () => {
                this.isPaused = false;
                if (this.isVisible) this.startAutoPlay();
            }, { passive: true });
        }

        console.log('✅ Event listeners added');
    }

    // ============================================
    // 📱 Touch Events (Swipe Support)
    // ============================================
    setupTouchEvents() {
        let touchStartX = 0;
        let touchStartY = 0;
        let touchEndX = 0;
        let isSwiping = false;

        this.track.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].clientX;
            touchStartY = e.changedTouches[0].clientY;
            isSwiping = false;
        }, { passive: true });

        this.track.addEventListener('touchmove', (e) => {
            if (!isSwiping) {
                const touchMoveX = e.changedTouches[0].clientX;
                const touchMoveY = e.changedTouches[0].clientY;
                const diffX = Math.abs(touchMoveX - touchStartX);
                const diffY = Math.abs(touchMoveY - touchStartY);
                
                // Determine swipe direction
                isSwiping = diffX > diffY;
            }
        }, { passive: true });

        this.track.addEventListener('touchend', (e) => {
            if (!isSwiping) return;
            
            touchEndX = e.changedTouches[0].clientX;
            this.handleSwipe(touchStartX, touchEndX);
        }, { passive: true });
        
        console.log('✅ Touch/swipe support enabled');
    }

    // ============================================
    // ⌨️ Keyboard Events
    // ============================================
    setupKeyboardEvents() {
        let keyboardTimeout;
        
        document.addEventListener('keydown', (e) => {
            if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
            
            // Throttle keyboard input
            clearTimeout(keyboardTimeout);
            keyboardTimeout = setTimeout(() => {
                if (e.key === 'ArrowLeft') this.prevSlide();
                if (e.key === 'ArrowRight') this.nextSlide();
            }, 50);
        }, { passive: true });
        
        console.log('✅ Keyboard navigation enabled');
    }

    // ============================================
    // 👆 Swipe Handler
    // ============================================
    handleSwipe(startX, endX) {
        const threshold = 50;
        const diff = startX - endX;
        
        if (Math.abs(diff) < threshold) return;
        
        if (diff > 0) {
            this.nextSlide();
        } else {
            this.prevSlide();
        }
    }

    // ============================================
    // 🔄 Update Carousel (CRITICAL FIX)
    // ============================================
    updateCarousel() {
        if (this.isTransitioning) return;
        this.isTransitioning = true;

        // Cancel any pending animation frame
        if (this.rafId) cancelAnimationFrame(this.rafId);
        
        this.rafId = requestAnimationFrame(() => {
            // ✅ FIXED: Use pixel-based transform instead of percentage
            const slideWidth = this.wrapper ? this.wrapper.clientWidth : this.track.clientWidth;
            const translateX = -this.currentIndex * slideWidth;
            
            // Apply transform
            this.track.style.transform = `translateX(${translateX}px)`;
            
            // Update UI elements
            this.updateDots();
            this.updateThumbnails();
            this.restartProgress();
            
            // Wait for transition to complete
            setTimeout(() => {
                this.isTransitioning = false;
            }, 600); // Match CSS transition duration
        });
    }

    // ============================================
    // 🔴 Update Dots (Batch Update)
    // ============================================
    updateDots() {
        if (!this.dots) return;
        
        // Batch DOM updates with RAF
        requestAnimationFrame(() => {
            this.dots.forEach((dot, index) => {
                const isActive = index === this.currentIndex;
                dot.classList.toggle('active', isActive);
                dot.setAttribute('aria-current', isActive ? 'true' : 'false');
            });
        });
    }

    // ============================================
    // 🖼️ Update Thumbnails
    // ============================================
    updateThumbnails() {
        if (this.thumbnails.length === 0) return;
        
        requestAnimationFrame(() => {
            this.thumbnails.forEach((thumb, index) => {
                thumb.classList.toggle('active', index === this.currentIndex);
            });
        });
    }

    // ============================================
    // 🎯 Navigation Methods
    // ============================================
    goToSlide(index) {
        if (this.isTransitioning || index === this.currentIndex) return;
        if (index < 0 || index >= this.totalSlides) return;
        
        console.log(`🎯 Going to slide ${index + 1}/${this.totalSlides}`);
        this.currentIndex = index;
        this.updateCarousel();
        this.restartAutoPlay();
    }

    nextSlide() {
        if (this.isTransitioning) return;
        this.currentIndex = (this.currentIndex + 1) % this.totalSlides;
        console.log(`➡️ Next slide: ${this.currentIndex + 1}/${this.totalSlides}`);
        this.updateCarousel();
        this.restartAutoPlay();
    }

    prevSlide() {
        if (this.isTransitioning) return;
        this.currentIndex = (this.currentIndex - 1 + this.totalSlides) % this.totalSlides;
        console.log(`⬅️ Previous slide: ${this.currentIndex + 1}/${this.totalSlides}`);
        this.updateCarousel();
        this.restartAutoPlay();
    }

    // ============================================
    // ⏯️ Auto Play Management
    // ============================================
    startAutoPlay() {
        if (!this.isVisible || this.isPaused) {
            console.log('⏸️ Auto-play paused (not visible or manually paused)');
            return;
        }
        
        this.stopAutoPlay();
        
        this.autoPlayInterval = setInterval(() => {
            if (this.isVisible && !this.isPaused) {
                this.nextSlide();
            }
        }, this.autoPlayDuration);
        
        this.startProgress();
        console.log(`▶️ Auto-play started (${this.autoPlayDuration}ms interval)`);
    }

    stopAutoPlay() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
        }
        this.stopProgress();
    }

    restartAutoPlay() {
        if (this.isPaused) return;
        this.stopAutoPlay();
        this.startAutoPlay();
    }

    // ============================================
    // 📊 Progress Bar Animation
    // ============================================
    startProgress() {
        this.stopProgress();
        
        let startTime = performance.now();
        const duration = this.autoPlayDuration;
        
        const updateProgress = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min((elapsed / duration) * 100, 100);
            
            if (this.progressFill) {
                this.progressFill.style.width = `${progress}%`;
            }
            
            if (progress < 100 && this.progressInterval) {
                this.progressInterval = requestAnimationFrame(updateProgress);
            }
        };
        
        this.progressInterval = requestAnimationFrame(updateProgress);
    }

    stopProgress() {
        if (this.progressInterval) {
            cancelAnimationFrame(this.progressInterval);
            this.progressInterval = null;
        }
        if (this.progressFill) {
            this.progressFill.style.width = '0%';
        }
    }

    restartProgress() {
        this.stopProgress();
        this.startProgress();
    }

    // ============================================
    // 🧹 Cleanup & Destroy
    // ============================================
    destroy() {
        console.log('🧹 Destroying carousel...');
        
        this.stopAutoPlay();
        
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
        }
        
        // Remove event listeners by cloning nodes
        if (this.prevBtn) this.prevBtn.replaceWith(this.prevBtn.cloneNode(true));
        if (this.nextBtn) this.nextBtn.replaceWith(this.nextBtn.cloneNode(true));
        
        console.log('✅ Carousel destroyed and cleaned up');
    }

    // ============================================
    // 📊 Performance Metrics (Debug)
    // ============================================
    getPerformanceMetrics() {
        return {
            currentIndex: this.currentIndex,
            totalSlides: this.totalSlides,
            isTransitioning: this.isTransitioning,
            isVisible: this.isVisible,
            isPaused: this.isPaused,
            autoPlayDuration: this.autoPlayDuration,
            wrapperWidth: this.wrapper ? this.wrapper.clientWidth : null,
            trackWidth: this.track ? this.track.clientWidth : null
        };
    }

    // ============================================
    // 🐛 Debug Helper
    // ============================================
    debug() {
        console.log('🐛 Carousel Debug Info:');
        console.table(this.getPerformanceMetrics());
        
        console.log('Images loaded:', 
            Array.from(this.track.querySelectorAll('img'))
                .every(img => img.complete && img.naturalWidth > 0)
        );
        
        console.log('Slide widths:', 
            Array.from(this.slides).map(slide => slide.offsetWidth)
        );
    }
}

// ============================================
// 🌍 Global Export
// ============================================
if (typeof window !== 'undefined') {
    window.Carousel = Carousel;
    console.log('✅ Carousel class exported to window');
}

// ============================================
// 🚀 Auto Initialize (FIXED TIMING)
// ============================================
if (typeof document !== 'undefined') {
    const initCarousel = () => {
        // ✅ FIXED: Wait for window.load (all resources including images)
        if (document.readyState !== 'complete') {
            window.addEventListener('load', initCarousel, { once: true, passive: true });
            return;
        }

        // Extra safety delay for layout calculation
        setTimeout(() => {
            try {
                const carousel = new Carousel({
                    autoPlayDuration: 5000
                });
                
                window.carouselInstance = carousel;
                console.log('🎠 Carousel auto-initialized successfully');
                
                // Debug info
                if (carousel && carousel.debug) {
                    carousel.debug();
                }
            } catch (error) {
                console.error('❌ Carousel initialization failed:', error);
            }
        }, 150); // Small delay for browser layout
    };

    // Always use window.load for images
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('📄 DOM loaded, waiting for window.load...');
        });
    }
    
    window.addEventListener('load', initCarousel, { once: true, passive: true });
}

// ============================================
// 🔧 Manual Init Helper (for debugging)
// ============================================
window.initCarouselManually = function() {
    console.log('🔧 Manual carousel initialization triggered...');
    
    if (window.carouselInstance) {
        console.warn('⚠️ Carousel already exists, destroying old instance...');
        window.carouselInstance.destroy();
    }
    
    setTimeout(() => {
        window.carouselInstance = new Carousel({ autoPlayDuration: 5000 });
        console.log('✅ Manual initialization complete');
    }, 100);
};

console.log('📦 Carousel module loaded');
