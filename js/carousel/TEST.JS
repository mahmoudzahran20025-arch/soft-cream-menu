/*

## 🎨 **Visual Preview (Concept)**
```
┌─────────────────────────────────────┐
│  #carousel-main                     │
│  ┌───────────────────────────────┐  │
│  │  [Image with strong overlay]  │  │  ← Vibrant, bold
│  │  ═══════════════════════════  │  │  ← Thick border
│  │  Title (bright, pulsing CTA)  │  │  ← High energy
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  #carousel-secondary                │
│  ┌───────────────────────────────┐  │
│  │  [Image with soft overlay]    │  │  ← Softer, calm
│  │  ───────────────────────────  │  │  ← Thin border
│  │  Title (clear, simple CTA)    │  │  ← Understated
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
*/

// ============================================================================
// 🔗 IMPORTS - استيراد من الملفات الخارجية
// ============================================================================
import { showToast } from './js/utils.js';
import { storage } from './js/storage.js';

// ✅ إتاحة عالمية للوصول من HTML
window.showToast = showToast;
window.storage = storage;

// ============================================================================
// 🛡️ SECURITY & UTILITY HELPERS
// ============================================================================

/**
 * 🔒 XSS Protection: تعقيم النصوص قبل إدراجها في HTML
 */
function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * 🔍 DOM Safety: فحص وجود العناصر مع error handling
 */
function safeGet(id, context = 'DOM') {
    const el = document.getElementById(id);
    if (!el) {
        console.error(`❌ ${context}: Missing element #${id}`);
    }
    return el;
}

/**
 * 📢 Safe Toast: استدعاء آمن مع fallback
 */
function safeShowToast(type, title, message = '') {
    if (typeof showToast === 'function') {
        showToast(type, title, message);
    } else {
        console.warn('⚠️ Toast unavailable:', title, message);
        alert(`${title}${message ? '\n' + message : ''}`);
    }
}

/**
 * 💾 Safe Storage: استدعاء آمن مع fallback
 */
function safeStorage() {
    if (typeof storage !== 'undefined' && storage.local) {
        return storage;
    }
    
    console.warn('⚠️ Storage unavailable, using fallback');
    return {
        local: {
            get: (key) => {
                try {
                    return localStorage.getItem(key);
                } catch (e) {
                    console.error('localStorage error:', e);
                    return null;
                }
            },
            set: (key, val) => {
                try {
                    localStorage.setItem(key, val);
                } catch (e) {
                    console.error('localStorage error:', e);
                }
            }
        },
        getDeviceId: () => 'fallback-device-' + Date.now(),
        getSessionId: () => 'fallback-session-' + Date.now(),
        addOrder: () => console.warn('Storage unavailable'),
        triggerOrdersBadgeUpdate: () => console.warn('Storage unavailable')
    };
}

// ✅ استخدام Safe Storage عالمياً
const safeStorageInstance = safeStorage();

// ============================================================================
// 📊 ANALYTICS SYSTEM - محسّن مع Buffer Limit
// ============================================================================
const AnalyticsTracker = {
    events: [],
    maxBuffer: 100,           // حد التفريغ التلقائي
    maxTotalEvents: 1000,     // ✅ حد أقصى مطلق (جديد)
    flushIntervalMs: 10000,
    flushTimer: null,
    endpoint: '/api/analytics',
    isEnabled: false,
    
    init() {
        const consent = safeStorageInstance.local.get('analytics_consent');
        
        if (consent === 'granted') {
            this.enableAnalytics();
        } else if (consent === 'denied') {
            this.isEnabled = false;
            console.log('📊 Analytics disabled by user');
        } else {
            this.showConsentBanner();
        }
    },
    
    showConsentBanner() {
        const banner = safeGet('consent-banner', 'Analytics Banner');
        if (!banner) return;
        
        banner.classList.remove('hidden');
        
        const acceptBtn = safeGet('consent-accept', 'Analytics Accept');
        const denyBtn = safeGet('consent-deny', 'Analytics Deny');
        
        if (acceptBtn) {
            acceptBtn.addEventListener('click', () => {
                this.enableAnalytics();
                banner.classList.add('hidden');
                safeShowToast('success', 'تم تفعيل نظام التحليلات بنجاح');
            });
        }
        
        if (denyBtn) {
            denyBtn.addEventListener('click', () => {
                this.disableAnalytics();
                banner.classList.add('hidden');
                safeShowToast('info', 'تم رفض التحليلات', 'يمكنك تفعيلها لاحقاً');
            });
        }
    },
    
    enableAnalytics() {
        this.isEnabled = true;
        safeStorageInstance.local.set('analytics_consent', 'granted');
        
        this.flushTimer = setInterval(() => this.flush(), this.flushIntervalMs);
        
        window.addEventListener('beforeunload', () => this.flush(true));
        
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.flush(true);
            }
        });
        
        console.log('✅ Analytics enabled');
    },
    
    disableAnalytics() {
        this.isEnabled = false;
        safeStorageInstance.local.set('analytics_consent', 'denied');
        this.stopTracking();
        console.log('🚫 Analytics disabled');
    },
    
    stopTracking() {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
            this.flushTimer = null;
        }
        this.events = [];
    },
    
    track(eventType, data) {
        if (!this.isEnabled) return;
        
        // ✅ حد أقصى للذاكرة (جديد)
        if (this.events.length >= this.maxTotalEvents) {
            console.warn(`⚠️ Analytics buffer full (${this.maxTotalEvents}), dropping oldest 50% events`);
            this.events = this.events.slice(Math.floor(this.maxTotalEvents / 2));
        }
        
        const event = {
            type: eventType,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            viewport: { width: window.innerWidth, height: window.innerHeight },
            deviceId: safeStorageInstance.getDeviceId(),
            sessionId: safeStorageInstance.getSessionId(),
            ...data
        };
        
        this.events.push(event);
        console.log('📊 Analytics Event:', event);
        
        if (this.events.length >= this.maxBuffer) {
            this.flush();
        }
    },
    
    flush(onUnload = false) {
        if (!this.events.length || !this.isEnabled) return;
        
        const batch = [...this.events];
        this.events = [];
        
        const payload = JSON.stringify({ 
            events: batch,
            session: safeStorageInstance.getSessionId(),
            deviceId: safeStorageInstance.getDeviceId()
        });
        
        if (onUnload && navigator.sendBeacon) {
            navigator.sendBeacon(this.endpoint, new Blob([payload], { type: 'application/json' }));
        } else {
            fetch(this.endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: payload,
                keepalive: true
            }).catch(err => {
                console.warn('Analytics flush failed, re-queuing events:', err);
                // ✅ فقط نعيد جزء من البيانات لو فشل
                const limitedBatch = batch.slice(-this.maxBuffer);
                this.events.push(...limitedBatch);
            });
        }
    },
    
    trackCTA(carouselId, slideIndex, productName, category) {
        this.track('cta_click', {
            carousel: carouselId,
            slide_index: slideIndex,
            product_name: productName,
            category: category,
            action: 'order_now'
        });
    },
    
    trackNavigation(carouselId, fromSlide, toSlide, method) {
        this.track('slide_navigation', {
            carousel: carouselId,
            from_slide: fromSlide,
            to_slide: toSlide,
            method: method
        });
    },
    
    trackEngagement(carouselId, slideIndex, duration) {
        this.track('slide_engagement', {
            carousel: carouselId,
            slide_index: slideIndex,
            duration_seconds: duration
        });
    },
    
    getSummary() {
        return {
            total_events: this.events.length,
            max_capacity: this.maxTotalEvents,
            buffer_usage: `${this.events.length}/${this.maxTotalEvents}`,
            events_by_type: this.events.reduce((acc, e) => {
                acc[e.type] = (acc[e.type] || 0) + 1;
                return acc;
            }, {}),
            recent_events: this.events.slice(-10),
            is_enabled: this.isEnabled
        };
    }
};

// ============================================================================
// 🎨 CAROUSEL DATA STRUCTURE
// ============================================================================
const CAROUSELS_DATA = {
    'carousel-main': {
        title: 'العروض المميزة',
        ariaLabel: 'العروض المميزة',
        progressColors: 'from-pink-500 via-purple-500 to-amber-500',
        autoPlay: true,
        autoPlayInterval: 5000,
        slides: [
            {
                id: 'vanilla-caramel',
                title: 'آيس كريم فانيليا بصوص كراميل',
                description: 'آيس كريم فانيليا كريمي يخطف الأنفاس، تعلوه طبقة سلسة من صوص الكراميل الذهبي.',
                image: 'https://i.ibb.co/LzP97qhB/481279444-627854640201713-219907065737357117-n-min.webp',
                bgGradient: 'from-pink-50 to-white dark:from-gray-800 dark:to-gray-900',
                overlayGradient: 'from-pink-500 to-amber-500',
                titleColor: 'text-pink-600 dark:text-pink-400',
                buttonGradient: 'from-pink-500 to-amber-500',
                buttonRing: 'focus:ring-pink-300',
                ctaText: 'اطلب الآن',
                layout: 'image-right',
                category: 'ice-cream',
                price: 25
            },
            {
                id: 'mango-soft',
                title: 'سوفت مانجو طبيعي',
                description: 'سوفت مانجو يختزل جوهر الفاكهة الاستوائية في كل ملعقة. قوام حريري يذوب بلطف.',
                image: 'https://i.ibb.co/4nNL0KR6/Gemini-Generated-Image-7z63p77z63p77z63.png',
                bgGradient: 'from-purple-50 to-white dark:from-gray-800 dark:to-gray-900',
                overlayGradient: 'from-purple-500 to-pink-500',
                titleColor: 'text-purple-600 dark:text-purple-400',
                buttonGradient: 'from-purple-500 to-pink-500',
                buttonRing: 'focus:ring-purple-300',
                ctaText: 'جرّبه الآن',
                layout: 'image-left',
                category: 'soft-serve',
                price: 20
            },
            {
                id: 'vanilla-brownie',
                title: 'فانيليا بقطع براوني',
                description: 'فانيليا كريمية فاخرة تتخللها قطع غنية من البراوني الشوكولاتي.',
                image: 'https://i.ibb.co/3YspR2nn/489627654-645413408459760-7730691560634138295-n-min.jpg',
                bgGradient: 'from-amber-50 to-white dark:from-gray-800 dark:to-gray-900',
                overlayGradient: 'from-amber-500 to-orange-500',
                titleColor: 'text-amber-600 dark:text-amber-400',
                buttonGradient: 'from-amber-500 to-orange-500',
                buttonRing: 'focus:ring-amber-300',
                ctaText: 'جرّبه الآن',
                layout: 'image-right',
                category: 'ice-cream',
                price: 30
            },
            {
                id: 'pure-soft',
                title: 'نقاء السوفت آيس كريم',
                description: 'تجسيد للنقاء والطبيعة في كل حبة، بمكوناته الطبيعية الخالصة.',
                image: 'https://i.ibb.co/67cV4CJc/484157834-622859394048495-6880924063204865717-n-min.webp',
                bgGradient: 'from-green-50 to-white dark:from-gray-800 dark:to-gray-900',
                overlayGradient: 'from-green-500 to-emerald-500',
                titleColor: 'text-green-600 dark:text-green-400',
                buttonGradient: 'from-green-500 to-emerald-500',
                buttonRing: 'focus:ring-green-300',
                ctaText: 'اطلب الآن',
                layout: 'image-left',
                category: 'soft-serve',
                price: 22
            }
        ]
    }
};

// ============================================================================
// 🎡 CAROUSEL MANAGER CLASS
// ============================================================================
class CarouselManager {
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
    
    addEventListeners() {
        if (!this.carouselTrack) return;

        this.carouselTrack.addEventListener('touchstart', (e) => {
            this.touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        this.carouselTrack.addEventListener('touchend', (e) => {
            this.touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe();
        }, { passive: true });
        
        if (this.carouselEl) {
            this.carouselEl.addEventListener('keydown', (e) => this.handleKeyboard(e));
        }
    }
    
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
    
    goToSlide(index, method = 'direct') {
        const oldSlide = this.currentSlide;
        
        const duration = (Date.now() - this.slideStartTime) / 1000;
        AnalyticsTracker.trackEngagement(this.carouselId, oldSlide, duration);
        AnalyticsTracker.trackNavigation(this.carouselId, oldSlide, index, method);
        
        this.currentSlide = index;
        this.slideStartTime = Date.now();
        this.updateCarousel();
        this.resetAutoPlay();
    }
    
    nextSlide() {
        const next = (this.currentSlide + 1) % this.totalSlides;
        this.goToSlide(next, 'next');
    }
    
    prevSlide() {
        const prev = (this.currentSlide - 1 + this.totalSlides) % this.totalSlides;
        this.goToSlide(prev, 'prev');
    }
    
    updateCarousel() {
        if (!this.carouselTrack || !this.carouselEl) return;
        
        const items = this.carouselTrack.querySelectorAll('.carousel-item');
        const dots = this.carouselEl.querySelectorAll('.dot-indicator');
        const progressBar = this.carouselEl.querySelector('.progress-bar');
        const announcer = safeGet(`carousel-announcer-${this.carouselId.split('-')[1]}`, 'Announcer');
        
        const nextSlideIndex = (this.currentSlide + 1) % this.totalSlides;
        const prevSlideIndex = (this.currentSlide - 1 + this.totalSlides) % this.totalSlides;
        
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
        
        const progress = ((this.currentSlide + 1) / this.totalSlides) * 100;
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
            progressBar.setAttribute('aria-valuenow', progress);
        }
        
        if (announcer) {
            const slide = this.config.slides[this.currentSlide];
            announcer.textContent = `الشريحة ${this.currentSlide + 1} من ${this.totalSlides}: ${slide.title}`;
        }
    }
    
    startAutoPlay() {
        if (!this.config.autoPlay || !this.isVisible) return;
        
        this.autoPlayTimer = setInterval(() => {
            this.nextSlide();
        }, this.config.autoPlayInterval);
    }
    
    stopAutoPlay() {
        if (this.autoPlayTimer) {
            clearInterval(this.autoPlayTimer);
            this.autoPlayTimer = null;
        }
    }
    
    resetAutoPlay() {
        this.stopAutoPlay();
        if (this.config.autoPlay && this.isVisible) {
            this.startAutoPlay();
        }
    }
    
    setVisibility(visible) {
        this.isVisible = visible;
        if (visible) {
            this.resetAutoPlay();
        } else {
            this.stopAutoPlay();
        }
    }
    
    handleCTA(slideIndex) {
        const slide = this.config.slides[slideIndex];
        AnalyticsTracker.trackCTA(this.carouselId, slideIndex, slide.title, slide.category);
        
        if (window.checkoutModule && typeof window.checkoutModule.initiateCheckout === 'function') {
            if (window.addToCart) {
                window.addToCart(slide.id, slide.title, slide.price, slide.image, slide.category);
                safeShowToast('success', 'تمت الإضافة للسلة', `${slide.title} - ${slide.price} ج.م`);
                
                setTimeout(() => {
                    window.checkoutModule.initiateCheckout();
                }, 500);
            }
        } else {
            window.showModal(slide, this.carouselId);
        }
    }
}

// ============================================================================
// 🎨 MODAL SYSTEM - محسّن مع XSS Protection
// ============================================================================
let lastFocusedElement = null;
let modalKeydownHandler = null;

function trapFocus(modalElement) {
    const focusableElements = modalElement.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    modalKeydownHandler = function(e) {
        if (e.key !== 'Tab') return;

        if (e.shiftKey) {
            if (document.activeElement === firstFocusable) {
                e.preventDefault();
                lastFocusable.focus();
            }
        } else {
            if (document.activeElement === lastFocusable) {
                e.preventDefault();
                firstFocusable.focus();
            }
        }
    };

    modalElement.addEventListener('keydown', modalKeydownHandler);
}

function removeFocusTrap(modalElement) {
    if (modalKeydownHandler) {
        modalElement.removeEventListener('keydown', modalKeydownHandler);
        modalKeydownHandler = null;
    }
}

window.showModal = function(slide, carouselId) {
    lastFocusedElement = document.activeElement;
    
    // ✅ DOM Safety
    const modal = safeGet('cta-modal', 'Modal System');
    const modalTitle = safeGet('modal-title', 'Modal Title');
    const modalBody = safeGet('modal-body', 'Modal Body');
    const modalAction = safeGet('modal-action', 'Modal Action');
    
    if (!modal || !modalTitle || !modalBody || !modalAction) {
        console.error('Cannot show modal: Missing required elements');
        return;
    }
    
    // ✅ XSS Protection
    modalTitle.textContent = slide.title; // textContent آمن
    
    // ✅ إنشاء محتوى آمن
    modalBody.innerHTML = '';
    
    const container = document.createElement('div');
    container.className = 'space-y-4';
    
    // صورة + معلومات المنتج
    const productInfo = document.createElement('div');
    productInfo.className = 'flex items-start gap-4';
    
    const img = document.createElement('img');
    img.src = slide.image;
    img.alt = slide.title;
    img.className = 'w-24 h-24 object-cover rounded-lg';
    img.loading = 'lazy';
    
    const details = document.createElement('div');
    details.className = 'flex-1';
    
    const desc = document.createElement('p');
    desc.className = 'text-gray-600 dark:text-gray-400 mb-2';
    desc.textContent = slide.description; // ✅ آمن
    
    const meta = document.createElement('div');
    meta.className = 'flex items-center gap-2 text-sm';
    
    const category = document.createElement('span');
    category.className = 'px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full';
    category.textContent = getCategoryName(slide.category);
    
    meta.appendChild(category);
    
    if (slide.price) {
        const price = document.createElement('span');
        price.className = 'font-bold text-lg';
        price.textContent = `${slide.price} ج.م`;
        meta.appendChild(price);
    }
    
    details.appendChild(desc);
    details.appendChild(meta);
    productInfo.appendChild(img);
    productInfo.appendChild(details);
    container.appendChild(productInfo);
    
    // اختيار الصوص (إن وجد)
    if (slide.category === 'sundae') {
        const sauceDiv = document.createElement('div');
        sauceDiv.className = 'border-t dark:border-gray-700 pt-4';
        sauceDiv.innerHTML = `
            <p class="font-semibold mb-2">اختر الصوص المفضل:</p>
            <div class="grid grid-cols-2 gap-3">
                <label class="flex items-center gap-2 p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-purple-500 transition-colors">
                    <input type="radio" name="sauce" value="lotus" checked class="w-4 h-4" />
                    <span>🍪 لوتس</span>
                </label>
                <label class="flex items-center gap-2 p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-purple-500 transition-colors">
                    <input type="radio" name="sauce" value="nutella" class="w-4 h-4" />
                    <span>🍫 نوتيلا</span>
                </label>
            </div>
        `;
        container.appendChild(sauceDiv);
    }
    
    // عرض خاص
    const promo = document.createElement('div');
    promo.className = 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4';
    promo.innerHTML = `
        <p class="text-sm text-green-800 dark:text-green-300">
            ✨ <strong>عرض خاص:</strong> اطلب الآن واحصل على خصم 10%!
        </p>
    `;
    container.appendChild(promo);
    
    modalBody.appendChild(container);
    
    modalAction.onclick = () => {
        const sauce = slide.category === 'sundae' 
            ? document.querySelector('input[name="sauce"]:checked')?.value 
            : null;
        
        AnalyticsTracker.track('order_confirmed', {
            product_id: slide.id,
            product_name: slide.title,
            category: slide.category,
            sauce: sauce,
            carousel: carouselId,
            price: slide.price
        });
        
        const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        const orderData = {
            id: orderId,
            productId: slide.id,
            productName: slide.title,
            category: slide.category,
            price: slide.price,
            sauce: sauce,
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        
        safeStorageInstance.addOrder(orderData);
        
        console.log('📦 Order Confirmed & Saved:', orderData);
        
        safeShowToast(
            'success', 
            'تم تأكيد الطلب بنجاح! 🎉',
            `${slide.title}${sauce ? ' مع صوص ' + sauce : ''}\nرقم الطلب: ${orderId}`
        );
        
        window.closeModal();
        safeStorageInstance.triggerOrdersBadgeUpdate();
    };
    
    modal.classList.add('active');
    trapFocus(modal);
    
    setTimeout(() => modalTitle.focus(), 100);
};

window.closeModal = function() {
    const modal = safeGet('cta-modal', 'Close Modal');
    if (!modal) return;
    
    removeFocusTrap(modal);
    modal.classList.remove('active');
    
    if (lastFocusedElement) {
        lastFocusedElement.focus();
        lastFocusedElement = null;
    }
};

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        window.closeModal();
    }
});

// ✅ Safe modal backdrop click
const modalEl = safeGet('cta-modal');
if (modalEl) {
    modalEl.addEventListener('click', (e) => {
        if (e.target.id === 'cta-modal') {
            window.closeModal();
        }
    });
}

// ============================================================================
// 🖼️ IMAGE OPTIMIZATION - محسّن مع Preload Fix
// ============================================================================

function generateSrcset(imageUrl) {
    const isImgbb = imageUrl.includes('i.ibb.co');
    
    if (isImgbb) {
        return `${imageUrl} 400w, ${imageUrl} 800w`;
    }
    
    return `
        ${imageUrl} 400w,
        ${imageUrl} 800w,
        ${imageUrl} 1200w
    `.trim().replace(/\s+/g, ' ');
}

// ✅ إصلاح Preload (جديد)
function preloadCriticalImages() {
    Object.values(CAROUSELS_DATA).forEach(carousel => {
        const firstSlide = carousel.slides[0];
        if (firstSlide?.image) {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = firstSlide.image;
            
            // ✅ الطريقة الصحيحة
            link.setAttribute('imagesrcset', generateSrcset(firstSlide.image));
            link.setAttribute('imagesizes', '(max-width: 640px) 85vw, (max-width: 768px) 70vw, (max-width: 1024px) 45vw, 400px');
            
            document.head.appendChild(link);
        }
    });
}

function getImageFallbackSVG(title) {
    const encodedTitle = encodeURIComponent(title);
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Crect fill='%23e5e7eb' width='400' height='400'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%239ca3af' font-family='system-ui' font-size='20'%3E${encodedTitle}%3C/text%3E%3C/svg%3E`;
}

// ============================================================================
// 🏗️ HTML GENERATOR - محسّن مع XSS Protection
// ============================================================================
function generateCarouselHTML(carouselId, config) {
    const slides = config.slides.map((slide, index) => {
        const isImageRight = slide.layout === 'image-right';
        const slideClass = index === 0 ? 'active' : (index === 1 ? 'next' : 'hidden');
        
        // ✅ تعقيم النصوص
        const safeTitle = escapeHtml(slide.title);
        const safeDesc = escapeHtml(slide.description);
        const safeCta = escapeHtml(slide.ctaText);
        
        return `
        <div id="slide-${carouselId}-${index + 1}" 
             class="carousel-item ${slideClass} absolute top-0 left-0 w-full h-full" 
             role="group" 
             aria-roledescription="slide" 
             aria-label="${index + 1} من ${config.slides.length}">
            <div class="w-full h-full p-3 sm:p-6 md:p-8">
                <div class="w-full h-full rounded-2xl overflow-hidden relative group bg-gradient-to-br ${slide.bgGradient} bg-opacity-95">
                    <div class="shimmer" aria-hidden="true"></div>
                    <div class="carousel-content absolute inset-0 flex flex-col${isImageRight ? '-reverse' : ''} md:flex-row${isImageRight ? '' : '-reverse'} items-center gap-3 md:gap-6 p-4 sm:p-6 md:p-10">
                        <div class="w-full md:w-1/2 h-56 sm:h-64 md:h-full flex items-center justify-center">
                            <div class="relative w-full max-w-xs sm:max-w-sm aspect-square">
                                <img src="${slide.image}" 
                                     srcset="${generateSrcset(slide.image)}"
                                     sizes="(max-width: 640px) 85vw, (max-width: 768px) 70vw, (max-width: 1024px) 45vw, 400px"
                                     alt="${safeTitle}" 
                                     class="w-full h-full object-cover rounded-3xl shadow-2xl transition-transform duration-500 ${isImageRight ? 'img-rotate-right' : 'img-rotate-left'}" 
                                     loading="${index === 0 ? 'eager' : 'lazy'}" 
                                     decoding="async" 
                                     width="400" 
                                     height="400"
                                     onerror="this.onerror=null;this.src='${getImageFallbackSVG(slide.title)}';this.style.opacity='0.8';" />
                                <div class="absolute inset-0 bg-gradient-to-br ${slide.overlayGradient} opacity-20 rounded-3xl pointer-events-none" aria-hidden="true"></div>
                            </div>
                        </div>
                        <div class="w-full md:w-1/2 text-${isImageRight ? 'right' : 'left'} space-y-3 sm:space-y-4">
                            <h2 class="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black ${slide.titleColor} mb-2 sm:mb-4 tracking-wide leading-tight">${safeTitle}</h2>
                            <p class="text-base sm:text-lg md:text-xl text-gray-700 dark:text-gray-300 leading-relaxed">${safeDesc}</p>
                            ${slide.price ? `<p class="text-2xl font-bold text-gray-900 dark:text-white">${slide.price} ج.م</p>` : ''}
                            <div class="pt-3 sm:pt-4">
                                <button 
                                    class="cta-button inline-block px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r ${slide.buttonGradient} text-white text-base sm:text-lg font-bold rounded-full shadow-lg hover:shadow-xl active:scale-95 transition-all cursor-pointer focus:outline-none focus:ring-4 ${slide.buttonRing}"
                                    data-carousel-id="${carouselId}"
                                    data-slide-index="${index}"
                                    aria-label="اطلب ${safeTitle} الآن">
                                    ${safeCta}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
    }).join('');
    
    const dots = config.slides.map((slide, index) => {
        const safeTitle = escapeHtml(slide.title);
        return `
        <button
            class="dot-indicator w-8 sm:w-12 h-1.5 sm:h-2 rounded-full ${index === 0 ? 'bg-white/40' : 'bg-white/20'} hover:bg-white/60 transition-colors"
            data-carousel-id="${carouselId}"
            data-slide-index="${index}"
            role="tab"
            aria-label="الانتقال إلى الشريحة ${index + 1}: ${safeTitle}"
            aria-controls="slide-${carouselId}-${index + 1}"
            ${index === 0 ? 'aria-current="true"' : ''}
            tabindex="${index === 0 ? '0' : '-1'}">
        </button>
    `;
    }).join('');
    
    const safeAriaLabel = escapeHtml(config.ariaLabel);
    const safeConfigTitle = escapeHtml(config.title);
    const firstSlideTitle = escapeHtml(config.slides[0].title);
    
    return `
        <div aria-live="polite" aria-atomic="true" class="sr-only" id="carousel-announcer-${carouselId.split('-')[1]}" role="status">
            الشريحة 1 من ${config.slides.length}: ${firstSlideTitle}
        </div>

        <div class="carousel-container relative mb-12 sm:mb-16" id="${carouselId}" role="region" aria-roledescription="carousel" aria-label="${safeAriaLabel}" tabindex="0">
            <div class="absolute top-0 left-0 right-0 h-1.5 sm:h-2 bg-white/10 rounded-full overflow-hidden z-20">
                <div class="progress-bar absolute top-0 left-0 h-full bg-gradient-to-r ${config.progressColors}"
                     style="width: ${(1 / config.slides.length) * 100}%;"
                     role="progressbar"
                     aria-valuenow="${(1 / config.slides.length) * 100}"
                     aria-valuemin="0"
                     aria-valuemax="100"
                     aria-label="تقدم عرض ${safeConfigTitle}">
                </div>
            </div>
            
            <button class="nav-button absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center z-20 text-white touch-manipulation"
                    data-carousel-id="${carouselId}"
                    data-action="prev"
                    aria-label="الانتقال إلى الشريحة السابقة في ${safeConfigTitle}"
                    title="السابق">
                <svg class="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"></path>
                </svg>
            </button>
            
            <button class="nav-button absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center z-20 text-white touch-manipulation"
                    data-carousel-id="${carouselId}"
                    data-action="next"
                    aria-label="الانتقال إلى الشريحة التالية في ${safeConfigTitle}"
                    title="التالي">
                <svg class="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"></path>
                </svg>
            </button>

            <div class="carousel-track relative h-[480px] sm:h-[520px] md:h-[580px] overflow-hidden">
                ${slides}
            </div>

            <div class="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20" role="tablist" aria-label="اختيار شريحة ${safeConfigTitle}">
                ${dots}
            </div>
        </div>
    `;
}

// ============================================================================
// 🚀 INITIALIZATION
// ============================================================================
window.carouselManagers = {};

function renderCarousels() {
    const container = safeGet('carousels-container', 'Render Carousels');
    if (!container) {
        console.error('Cannot render carousels: container not found');
        return;
    }
    
    const fragment = document.createDocumentFragment();
    
    Object.keys(CAROUSELS_DATA).forEach(carouselId => {
        const config = CAROUSELS_DATA[carouselId];
        const wrapper = document.createElement('div');
        wrapper.innerHTML = generateCarouselHTML(carouselId, config);
        fragment.appendChild(wrapper.firstElementChild);
    });
    
    container.appendChild(fragment);
}

function initializeCarousels() {
    preloadCriticalImages();
    renderCarousels();
    
    Object.keys(CAROUSELS_DATA).forEach(carouselId => {
        const config = CAROUSELS_DATA[carouselId];
        const manager = new CarouselManager(carouselId, config);
        window.carouselManagers[carouselId] = manager;
    });
    
    setupIntersectionObserver();
    setupEventDelegation();
    
    document.addEventListener('visibilitychange', () => {
        Object.values(window.carouselManagers).forEach(manager => {
            if (document.hidden) {
                manager.stopAutoPlay();
            } else {
                manager.resetAutoPlay();
            }
        });
    });
}

// ============================================================================
// 📍 INTERSECTION OBSERVER
// ============================================================================
function setupIntersectionObserver() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const id = entry.target.id;
            const manager = window.carouselManagers[id];
            if (!manager) return;
            
            manager.setVisibility(entry.isIntersecting);
        });
    }, { 
        threshold: 0.25,
        rootMargin: '0px 0px -100px 0px'
    });

    Object.keys(CAROUSELS_DATA).forEach(id => {
        const el = safeGet(id, 'Intersection Observer');
        if (el) observer.observe(el);
    });
}

// ============================================================================
// 🎯 EVENT DELEGATION
// ============================================================================
function setupEventDelegation() {
    const container = safeGet('carousels-container', 'Event Delegation');
    if (!container) return;
    
    container.addEventListener('click', (e) => {
        const target = e.target;
        
        const ctaBtn = target.closest('.cta-button');
        if (ctaBtn) {
            const carouselId = ctaBtn.dataset.carouselId;
            const slideIndex = Number(ctaBtn.dataset.slideIndex);
            const manager = window.carouselManagers[carouselId];
            if (manager) {
                manager.handleCTA(slideIndex);
            }
            return;
        }
        
        const navBtn = target.closest('.nav-button');
        if (navBtn) {
            const carouselId = navBtn.dataset.carouselId;
            const action = navBtn.dataset.action;
            const manager = window.carouselManagers[carouselId];
            
            if (manager) {
                if (action === 'next') {
                    manager.nextSlide();
                } else if (action === 'prev') {
                    manager.prevSlide();
                }
            }
            return;
        }
        
        const dotBtn = target.closest('.dot-indicator');
        if (dotBtn) {
            const carouselId = dotBtn.dataset.carouselId;
            const slideIndex = Number(dotBtn.dataset.slideIndex);
            const manager = window.carouselManagers[carouselId];
            if (manager) {
                manager.goToSlide(slideIndex, 'dot');
            }
            return;
        }
    });
    
    document.addEventListener('click', (e) => {
        const modalBtn = e.target.closest('[data-modal-action]');
        if (modalBtn) {
            const action = modalBtn.dataset.modalAction;
            if (action === 'close') {
                window.closeModal();
            }
        }
    });
}

// ============================================================================
// 🎯 UTILITY FUNCTIONS
// ============================================================================
function getCategoryName(category) {
    const names = {
        'ice-cream': 'آيس كريم',
        'soft-serve': 'سوفت',
        'sundae': 'صنداي',
        'specialty': 'تشكيلة خاصة'
    };
    return names[category] || category;
}

// ============================================================================
// 🌐 GLOBAL API FUNCTIONS
// ============================================================================
window.getAnalyticsDashboard = function() {
    const summary = AnalyticsTracker.getSummary();
    
    console.log('📊 Analytics Dashboard:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Enabled:', summary.is_enabled);
    console.log('Total Events:', summary.total_events);
    console.log('Buffer Usage:', summary.buffer_usage);
    console.log('\nEvents by Type:');
    Object.entries(summary.events_by_type).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
    });
    console.log('\nRecent Events:');
    console.table(summary.recent_events);
    
    return summary;
};

window.flushAnalytics = function() {
    AnalyticsTracker.flush();
    console.log('✅ Analytics flushed manually');
};

window.enableAnalytics = function() {
    AnalyticsTracker.enableAnalytics();
};

window.disableAnalytics = function() {
    AnalyticsTracker.disableAnalytics();
};

window.checkAnalyticsConsent = function() {
    const consent = safeStorageInstance.local.get('analytics_consent');
    console.log('Analytics Consent Status:', consent || 'not set');
    console.log('Analytics Enabled:', AnalyticsTracker.isEnabled);
    return AnalyticsTracker.isEnabled;
};

window.getOrders = function() {
    return safeStorageInstance.getOrders ? safeStorageInstance.getOrders() : [];
};

window.getActiveOrdersCount = function() {
    return safeStorageInstance.getActiveOrdersCount ? safeStorageInstance.getActiveOrdersCount() : 0;
};

window.viewOrder = function(orderId) {
    if (!safeStorageInstance.getOrder) {
        safeShowToast('error', 'خطأ', 'نظام الطلبات غير متاح');
        return null;
    }
    
    const order = safeStorageInstance.getOrder(orderId);
    if (order) {
        console.log('📦 Order Details:', order);
        safeShowToast('info', 'تفاصيل الطلب', `${order.productName} - ${order.status}`);
    } else {
        safeShowToast('error', 'خطأ', 'الطلب غير موجود');
    }
    return order;
};

// ============================================================================
// 🎬 START APPLICATION
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing Enhanced Carousel System v3.1...');
    
    // Initialize Analytics
    AnalyticsTracker.init();
    
    // Initialize Carousels
    initializeCarousels();
    
    // Listen to storage events
    window.addEventListener('ordersUpdated', (e) => {
        console.log('📢 Orders updated event received:', e.detail);
        safeShowToast('info', 'تحديث الطلبات', `لديك ${e.detail.count} طلب نشط`);
    });
    
    console.log('✅ System initialized successfully');
});

console.log(`
╔══════════════════════════════════════════════════════════╗
║  🎨 Enhanced Carousel System v3.1                       ║
║  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ║
║                                                          ║
║  ✅ DOM Safety - safeGet() في كل مكان                  ║
║  ✅ XSS Protection - escapeHtml() للنصوص               ║
║  ✅ Preload Fix - setAttribute صحيح                    ║
║  ✅ Buffer Limit - حد أقصى 1000 event                  ║
║  ✅ Safe Fallbacks - للـ Storage و Toast               ║
║  ✅ Error Handling - في كل DOM access                  ║
║                                                          ║
║  🛡️ Security Enhancements:                              ║
║     - XSS protection في Modal & HTML generation        ║
║     - Safe DOM queries في كل مكان                      ║
║     - Fallback mechanisms للـ external modules         ║
║                                                          ║
║  ⚡ Performance Enhancements:                            ║
║     - Analytics buffer limit (1000 max)                ║
║     - Proper image preloading                          ║
║     - Memory leak prevention                           ║
║                                                          ║
║  📊 API Commands:                                        ║
║     getAnalyticsDashboard() - مع buffer usage          ║
║     getOrders() - مع safe fallback                     ║
║     viewOrder('ORD-XXX') - مع error handling           ║
║     enableAnalytics() / disableAnalytics()             ║
╚══════════════════════════════════════════════════════════╝
`);
/*
```

---

## 📋 **ملخص التكامل:**

### ✅ **ما تم إنجازه:**

1. **Toast من utils.js**
   - استيراد `showToast` من ملف خارجي
   - استخدامه بدلاً من `alert()`
   - دعم الـ Toast Container الموجود

2. **Storage Manager Integration**
   - استخدام `storage.local` بدلاً من `localStorage`
   - حفظ الطلبات في Storage
   - تتبع الـ deviceId و sessionId
   - إطلاق events عند التحديث

3. **Checkout Integration**
   - فحص وجود `window.checkoutModule`
   - إضافة للسلة ثم فتح الـ Checkout
   - Fallback للمودال العادي

4. **Analytics Enhancement**
   - استخدام deviceId من Storage
   - استخدام sessionId من Storage
   - حفظ الموافقة في Storage

---

## 🎯 **كيفية الاستخدام:**

### 1. **هيكل الملفات:**
```
project/
├── carousel.html        (الملف أعلاه)
├── js/
│   ├── utils.js        (Toast Manager)
│   ├── storage.js      (Storage Manager)
│   ├── checkout.js     (Checkout Module)
│   └── cart.js         (Cart functions)
*/


