/**
 * ⚙️ CAROUSEL CORE LOGIC (FIXED - Cart Integration)
 * ════════════════════════════════════════════════════════════════
 * 
 * 📌 المسؤولية: المنطق الأساسي للكاروسيل
 * 📌 Features:
 *    - CarouselManager Class
 *    - Navigation (next, prev, goToSlide)
 *    - Auto-play management
 *    - Touch/Keyboard handlers
 *    - Accessibility updates
 *    - ✅ FIXED: handleCTA() - Cart Module Integration
 * 
 * ════════════════════════════════════════════════════════════════
 */

import { AnalyticsTracker } from './analytics.js';
import { safeGet, showModal } from './ui.js';

// ============================================================================
// 🎡 CAROUSEL MANAGER CLASS
// ============================================================================
export class CarouselManager {
    constructor(carouselId, config) {
        this.carouselId = carouselId;
        this.config = config;
        this.currentSlide = 0;
        this.totalSlides = config.slides.length;
        this.autoPlayTimer = null;
        this.slideStartTime = Date.now();
        this.touchStartX = 0;
        this.touchEndX = 0;
        this.isVisible = true;
        
        // ✅ DOM Safety
        this.carouselEl = safeGet(this.carouselId, 'CarouselManager');
        if (!this.carouselEl) {
            console.error(`Cannot initialize carousel: ${carouselId}`);
            return;
        }
        
        this.carouselTrack = this.carouselEl.querySelector('.carousel-track');
        
        this.addEventListeners();
        
        if (config.autoPlay) {
            this.startAutoPlay();
        }
    }
    
    /**
     * 🎧 Add Event Listeners
     */
    addEventListeners() {
        if (!this.carouselTrack) return;

        // Touch Events
        this.carouselTrack.addEventListener('touchstart', (e) => {
            this.touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        this.carouselTrack.addEventListener('touchend', (e) => {
            this.touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe();
        }, { passive: true });
        
        // Keyboard Navigation
        if (this.carouselEl) {
            this.carouselEl.addEventListener('keydown', (e) => this.handleKeyboard(e));
        }
    }
    
    /**
     * ⌨️ Handle Keyboard Navigation
     */
    handleKeyboard(e) {
        switch(e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                this.prevSlide();
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.nextSlide();
                break;
            case 'Home':
                e.preventDefault();
                this.goToSlide(0, 'keyboard');
                break;
            case 'End':
                e.preventDefault();
                this.goToSlide(this.totalSlides - 1, 'keyboard');
                break;
        }
    }

    /**
     * 👆 Handle Swipe Gestures
     */
    handleSwipe() {
        const swipeThreshold = 50;
        const diff = this.touchStartX - this.touchEndX;
        
        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                this.nextSlide();
            } else {
                this.prevSlide();
            }
        }
    }
    
    /**
     * 🎯 Go to Specific Slide
     */
    goToSlide(index, method = 'direct') {
        const oldSlide = this.currentSlide;
        
        // Track engagement duration
        const duration = (Date.now() - this.slideStartTime) / 1000;
        AnalyticsTracker.trackEngagement(this.carouselId, oldSlide, duration);
        AnalyticsTracker.trackNavigation(this.carouselId, oldSlide, index, method);
        
        this.currentSlide = index;
        this.slideStartTime = Date.now();
        this.updateCarousel();
        this.resetAutoPlay();
    }
    
    /**
     * ➡️ Next Slide
     */
    nextSlide() {
        const next = (this.currentSlide + 1) % this.totalSlides;
        this.goToSlide(next, 'next');
    }
    
    /**
     * ⬅️ Previous Slide
     */
    prevSlide() {
        const prev = (this.currentSlide - 1 + this.totalSlides) % this.totalSlides;
        this.goToSlide(prev, 'prev');
    }
    
    /**
     * 🔄 Update Carousel UI
     */
    updateCarousel() {
        if (!this.carouselTrack || !this.carouselEl) return;
        
        const items = this.carouselTrack.querySelectorAll('.carousel-item');
        const dots = this.carouselEl.querySelectorAll('.dot-indicator');
        const progressBar = this.carouselEl.querySelector('.progress-bar');
        const announcer = safeGet(`carousel-announcer-${this.carouselId.split('-')[1]}`, 'Announcer');
        
        const nextSlideIndex = (this.currentSlide + 1) % this.totalSlides;
        const prevSlideIndex = (this.currentSlide - 1 + this.totalSlides) % this.totalSlides;
        
        // Update Slides
        items.forEach((item, index) => {
            item.classList.remove('active', 'prev', 'next', 'hidden');
            item.setAttribute('aria-hidden', 'true');

            if (index === this.currentSlide) {
                item.classList.add('active');
                item.setAttribute('aria-hidden', 'false');
            } else if (index === nextSlideIndex) {
                item.classList.add('next');
            } else if (index === prevSlideIndex) {
                item.classList.add('prev');
            } else {
                item.classList.add('hidden');
            }
        });
        
        // Update Dots
        dots.forEach((dot, index) => {
            if (index === this.currentSlide) {
                dot.setAttribute('aria-current', 'true');
                dot.classList.remove('bg-white/20');
                dot.classList.add('bg-white/40');
            } else {
                dot.removeAttribute('aria-current');
                dot.classList.remove('bg-white/40');
                dot.classList.add('bg-white/20');
            }
        });
        
        // Update Progress Bar
        const progress = ((this.currentSlide + 1) / this.totalSlides) * 100;
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
            progressBar.setAttribute('aria-valuenow', progress);
        }
        
        // Update Screen Reader Announcer
        if (announcer) {
            const slide = this.config.slides[this.currentSlide];
            announcer.textContent = `الشريحة ${this.currentSlide + 1} من ${this.totalSlides}: ${slide.title}`;
        }
    }
    
    /**
     * ▶️ Start Auto-play
     */
    startAutoPlay() {
        if (!this.config.autoPlay || !this.isVisible) return;
        
        this.autoPlayTimer = setInterval(() => {
            this.nextSlide();
        }, this.config.autoPlayInterval);
    }
    
    /**
     * ⏸️ Stop Auto-play
     */
    stopAutoPlay() {
        if (this.autoPlayTimer) {
            clearInterval(this.autoPlayTimer);
            this.autoPlayTimer = null;
        }
    }
    
    /**
     * 🔄 Reset Auto-play Timer
     */
    resetAutoPlay() {
        this.stopAutoPlay();
        if (this.config.autoPlay && this.isVisible) {
            this.startAutoPlay();
        }
    }
    
    /**
     * 👁️ Set Visibility (for Intersection Observer)
     */
    setVisibility(visible) {
        this.isVisible = visible;
        if (visible) {
            this.resetAutoPlay();
        } else {
            this.stopAutoPlay();
        }
    }
    
    /**
     * 🛒 Handle CTA Click (FIXED - Cart Integration)
     * ════════════════════════════════════════════════════════════════
     * 
     * ✅ التحديثات:
     *    - استخدام window.cartModule.addToCart بشكل صحيح
     *    - Parameters الصحيحة: (event, productId, quantity)
     *    - Auto-open Cart Modal بعد الإضافة
     *    - Fallback للـ Modal القديم لو Cart مش موجود
     * 
     * ════════════════════════════════════════════════════════════════
     */
    handleCTA(slideIndex) {
        const slide = this.config.slides[slideIndex];
        
        // 📊 Track Analytics
        AnalyticsTracker.trackCTA(
            this.carouselId, 
            slideIndex, 
            slide.title, 
            slide.category
        );
        
        console.log('🎯 CTA Clicked:', {
            carousel: this.carouselId,
            slideIndex: slideIndex,
            productId: slide.id,
            title: slide.title,
            price: slide.price,
            category: slide.category
        });
        
        // ✅ Check if Cart Module exists
        if (window.cartModule && typeof window.cartModule.addToCart === 'function') {
            
            console.log('✅ Cart module found, adding product to cart...');
            
            // ✅ FIXED: Use correct parameters
            // Parameters: (event, productId, quantity)
            // event = null (لأن handleCTA مفهاش event object)
            window.cartModule.addToCart(null, slide.id, 1);
            
            // ✅ Auto-open Cart Modal after 500ms
            setTimeout(() => {
                if (window.cartModule.openCartModal) {
                    console.log('🛒 Auto-opening cart modal...');
                    window.cartModule.openCartModal();
                }
            }, 500);
            
        } else {
            // ❌ Fallback: Cart Module not available
            console.warn('⚠️ Cart module not available, falling back to old modal system');
            
            // Use old modal system as fallback
            showModal(slide, this.carouselId);
        }
    }
}