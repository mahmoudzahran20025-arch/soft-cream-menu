/**
 * 🎯 CAROUSEL MAIN - Entry Point
 * ════════════════════════════════════════════════════════════════
 * 
 * 📌 المسؤولية: تجميع كل الـ Modules وتشغيل النظام
 * 📌 هذا هو الملف الوحيد الذي يتم استيراده في HTML
 * 
 * ════════════════════════════════════════════════════════════════
 */
/*
┌─────────────────────────────────────────────────────────┐
│                  🚀 DOMContentLoaded                    │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  1️⃣ AnalyticsTracker.init()                            │
│     ↓                                                   │
│     ├─ تفحص localStorage: analytics_consent            │
│     ├─ لو 'granted' → enableAnalytics()                │
│     ├─ لو 'denied' → disabled                          │
│     └─ لو null → showConsentBanner()                   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  2️⃣ initializeCarousels()                              │
│     ↓                                                   │
│     ├─ preloadCriticalImages()                         │
│     │   └─ بيحمّل أول صورة من كل Carousel             │
│     │                                                   │
│     ├─ renderCarousels()                               │
│     │   └─ بيولّد HTML من CAROUSELS_DATA              │
│     │                                                   │
│     ├─ Create CarouselManager لكل carousel             │
│     │   └─ بيبدأ autoPlay + event listeners            │
│     │                                                   │
│     ├─ setupIntersectionObserver()                     │
│     │   └─ بيراقب ظهور/اختفاء الـ Carousel             │
│     │                                                   │
│     └─ setupEventDelegation()                          │
│         └─ بيسمع للـ clicks (CTA, Nav, Dots)           │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│              🔄 User Interaction Flow                   │
└─────────────────────────────────────────────────────────┘

   ┌─────────────────────────────────────────┐
   │  User clicks "اطلب الآن"                │
   └─────────────────────────────────────────┘
                    ↓
   ┌─────────────────────────────────────────┐
   │  handleCTA()                            │
   │  ├─ Track Analytics: cta_click          │
   │  ├─ تفحص: هل checkoutModule موجود؟     │
   │  │   ├─ نعم → addToCart + checkout     │
   │  │   └─ لا → showModal()                │
   └─────────────────────────────────────────┘
                    ↓
   ┌─────────────────────────────────────────┐
   │  showModal() - إذا لم يكن checkout      │
   │  ├─ عرض تفاصيل المنتج                   │
   │  ├─ اختيار الصوص (للصنداي)             │
   │  ├─ عند التأكيد:                        │
   │  │   ├─ Track: order_confirmed          │
   │  │   ├─ storage.addOrder()              │
   │  │   ├─ showToast()                     │
   │  │   └─ triggerOrdersBadgeUpdate()      │
   └─────────────────────────────────────────┘
                    ↓
   ┌─────────────────────────────────────────┐
   │  User navigates (Next/Prev/Dots)        │
   │  ├─ Track: slide_engagement             │
   │  ├─ Track: slide_navigation             │
   │  ├─ updateCarousel()                    │
   │  └─ resetAutoPlay()                     │
   └─────────────────────────────────────────┘
                    ↓
   ┌─────────────────────────────────────────┐
   │  Analytics Buffer Management            │
   │  ├─ كل event يتسجّل في events[]         │
   │  ├─ لمّا يوصل 100 event → flush()       │
   │  ├─ لو وصل 1000 → يمسح أقدم 50%        │
   │  └─ كل 10 ثواني → flush تلقائي         │
   └─────────────────────────────────────────┘

🧩 الـ Modules الحالية:
javascript// 1️⃣ SECURITY & UTILITY HELPERS (60 lines)
escapeHtml()           // XSS protection
safeGet()             // DOM safety
safeShowToast()       // Toast fallback
safeStorage()         // Storage fallback

// 2️⃣ ANALYTICS SYSTEM (150 lines)
AnalyticsTracker = {
  init, enableAnalytics, disableAnalytics,
  track, flush, trackCTA, trackNavigation,
  trackEngagement, getSummary
}

// 3️⃣ CAROUSEL DATA (100 lines)
CAROUSELS_DATA = {
  'carousel-main': { slides: [...] },
  'carousel-secondary': { slides: [...] }
}

// 4️⃣ CAROUSEL MANAGER CLASS (200 lines)
class CarouselManager {
  constructor, addEventListeners,
  goToSlide, nextSlide, prevSlide,
  updateCarousel, startAutoPlay,
  handleCTA
}

// 5️⃣ MODAL SYSTEM (120 lines)
showModal()           // عرض المودال
closeModal()          // إغلاق المودال
trapFocus()           // Keyboard navigation
removeFocusTrap()     // تنظيف

// 6️⃣ IMAGE OPTIMIZATION (50 lines)
generateSrcset()      // Responsive images
preloadCriticalImages() // Performance
getImageFallbackSVG() // Fallback

// 7️⃣ HTML GENERATOR (150 lines)
generateCarouselHTML() // بيولّد كل HTML

// 8️⃣ INITIALIZATION (100 lines)
renderCarousels()
initializeCarousels()
setupIntersectionObserver()
setupEventDelegation()

// 9️⃣ UTILITY FUNCTIONS (30 lines)
getCategoryName()

// 🔟 GLOBAL API (60 lines)
getAnalyticsDashboard()
getOrders()
viewOrder()
```


*/

/**
 * 🎯 CAROUSEL MAIN - Entry Point (HYBRID MODE)
 * ════════════════════════════════════════════════════════════════
 * 
 * 📌 التحديثات:
 *    - ❌ تم حذف Hero Placeholder Transition (الشريحة الأولى موجودة في HTML)
 *    - ✅ النظام يعمل بنهج هجين: أول شريحة HTML + الباقي JS
 *    - ✅ تم حذف setupHeroTransition() و carouselsReady event
 * 
 * ════════════════════════════════════════════════════════════════
 */

// ============================================================================
// 🔗 IMPORTS - استيراد الـ Modules
// ============================================================================
import { CAROUSELS_DATA, CATEGORY_NAMES } from './carousel/data.js';
import { CarouselManager } from './carousel/core.js';
import { 
    generateCarouselHTML, 
    preloadCriticalImages, 
    showModal, 
    closeModal,
    setupModalKeyboard,
    safeGet 
} from './carousel/ui.js';
import { 
    AnalyticsTracker,
    getAnalyticsDashboard,
    flushAnalytics,
    enableAnalytics,
    disableAnalytics,
    checkAnalyticsConsent
} from './carousel/analytics.js';

// ✅ استيراد من الملفات الخارجية (utils.js, storage.js)
import { showToast } from './utils.js';
import { storage } from './storage.js';

// ============================================================================
// 🌐 GLOBAL EXPORTS - للوصول من HTML و Console
// ============================================================================
window.showToast = showToast;
window.storage = storage;
window.showModal = showModal;
window.closeModal = closeModal;
window.carouselManagers = {};

// Analytics API
window.getAnalyticsDashboard = getAnalyticsDashboard;
window.flushAnalytics = flushAnalytics;
window.enableAnalytics = enableAnalytics;
window.disableAnalytics = disableAnalytics;
window.checkAnalyticsConsent = checkAnalyticsConsent;

// Orders API
window.getOrders = function() {
    return storage.getOrders ? storage.getOrders() : [];
};

window.getActiveOrdersCount = function() {
    return storage.getActiveOrdersCount ? storage.getActiveOrdersCount() : 0;
};

window.viewOrder = function(orderId) {
    if (!storage.getOrder) {
        if (typeof showToast === 'function') {
            showToast('error', 'خطأ', 'نظام الطلبات غير متاح');
        }
        return null;
    }
    
    const order = storage.getOrder(orderId);
    if (order) {
        console.log('📦 Order Details:', order);
        if (typeof showToast === 'function') {
            showToast('info', 'تفاصيل الطلب', `${order.productName} - ${order.status}`);
        }
    } else {
        if (typeof showToast === 'function') {
            showToast('error', 'خطأ', 'الطلب غير موجود');
        }
    }
    return order;
};

// ============================================================================
// 🎨 RENDER CAROUSELS (UPDATED FOR HYBRID MODE)
// ============================================================================
function renderCarousels() {
    const container = safeGet('carousels-container', 'Render Carousels');
    if (!container) {
        console.error('Cannot render carousels: container not found');
        return;
    }

    Object.keys(CAROUSELS_DATA).forEach(carouselId => {
        const config = CAROUSELS_DATA[carouselId];
        const existingCarouselElement = document.getElementById(carouselId);
        const generatedHtmlString = generateCarouselHTML(carouselId, config); // ده لسه بيرجع HTML String

        if (carouselId === 'carousel-main' && existingCarouselElement) {
            // --- الوضع الهجين للكاروسيل الرئيسي ---
            console.log(`🚧 Updating existing #carousel-main in hybrid mode...`);
            
            const existingTrack = existingCarouselElement.querySelector('.carousel-track');
            if (!existingTrack) {
                console.error('❌ Could not find .carousel-track in existing #carousel-main');
                return; 
            }

            // 1. حوّل الـ HTML String لعناصر DOM مؤقتة عشان نقدر نستخلص منها
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = generatedHtmlString; 
            
            // 2. استخلص الشرايح الجديدة فقط من الـ track المؤقت
            const newSlidesHtml = tempDiv.querySelector('.carousel-track')?.innerHTML || '';

            // 3. ضيف الشرايح الجديدة للـ track الأصلي اللي في الصفحة
            if (newSlidesHtml) {
                existingTrack.insertAdjacentHTML('beforeend', newSlidesHtml);
                console.log(`✅ Appended slides 2+ to existing #carousel-main track.`);
            } else {
                 console.warn(`⚠️ No new slides found in generated HTML for #carousel-main.`);
            }
            
            // 4. (اختياري) لو ui.js مش بيظبط الـ Dots صح في الهجين، ممكن تحدثها هنا
            // updateDotsForHybrid(existingCarouselElement, config.slides.length); 

        } else if (!existingCarouselElement) {
            // --- كاروسيل جديد (زي الثانوي) أو الرئيسي لو مكانش في الـ HTML ---
            console.log(`➕ Adding new carousel #${carouselId} structure to container...`);
            // ضيف الـ HTML String كله زي ما هو
            container.insertAdjacentHTML('beforeend', generatedHtmlString);

        } else {
            // لو الكاروسيل موجود بس مش الرئيسي (حالة نادرة)
             console.warn(`❓ Carousel #${carouselId} already exists but wasn't handled as hybrid.`);
             // ممكن تقرر تستبدله بالكامل: existingCarouselElement.outerHTML = generatedHtmlString;
        }
    });
}
// ============================================================================
// 📍 INTERSECTION OBSERVER - لإيقاف الكاروسيل لما يختفي
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
// 🎯 EVENT DELEGATION - كل الـ Clicks في مكان واحد
// ============================================================================
function setupEventDelegation() {
    const container = safeGet('carousels-container', 'Event Delegation');
    if (!container) return;
    
    container.addEventListener('click', (e) => {
        const target = e.target;
        
        // 🛒 CTA Button Click
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
        
        // ➡️⬅️ Navigation Button Click
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
        
        // ⚫ Dot Indicator Click
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
    
    // Modal Close Buttons
    document.addEventListener('click', (e) => {
        const modalBtn = e.target.closest('[data-modal-action]');
        if (modalBtn) {
            const action = modalBtn.dataset.modalAction;
            if (action === 'close') {
                closeModal();
            }
        }
    });
}

// ============================================================================
// 🚀 INITIALIZE CAROUSELS (UPDATED FOR HYBRID MODE)
// ============================================================================
function initializeCarousels() {
    console.log('🎬 Initializing Carousel System (Hybrid Mode)...');
    
    // 1️⃣ Preload critical images (optional - first slide already in HTML)
    preloadCriticalImages(CAROUSELS_DATA);
    
    // 2️⃣ Render HTML (هيرسم الباقي جنب الشريحة الأولى)
    renderCarousels();
    
    // 3️⃣ Create CarouselManager instances (هتشتغل عادي)
    Object.keys(CAROUSELS_DATA).forEach(carouselId => {
        const config = CAROUSELS_DATA[carouselId];
        const manager = new CarouselManager(carouselId, config);
        window.carouselManagers[carouselId] = manager;
        
        // ✅ NEW: Ensure first slide status is correct even if loaded from HTML
        if (carouselId === 'carousel-main' && document.getElementById(`slide-${carouselId}-1`)) {
            manager.updateCarousel(); // Call update once to sync dots/progress if needed
        }
    });
    
    // 4️⃣ Setup observers & events
    setupIntersectionObserver();
    setupEventDelegation();
    setupModalKeyboard();
    
    // 5️⃣ Handle page visibility
    document.addEventListener('visibilitychange', () => {
        Object.values(window.carouselManagers).forEach(manager => {
            if (document.hidden) {
                manager.stopAutoPlay();
            } else {
                manager.resetAutoPlay();
            }
        });
    });
    
    console.log('✅ Carousel System Initialized (Hybrid Mode)');
}

// ============================================================================
// 🎬 START APPLICATION (UPDATED - NO HERO TRANSITION)
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Starting Carousel System (Hybrid Mode v4.0)...');
    
    // Initialize Analytics
    AnalyticsTracker.init();
    
    // Initialize Carousels (first slide already in HTML!)
    initializeCarousels();
    
    // Listen to storage events
    window.addEventListener('ordersUpdated', (e) => {
        console.log('📢 Orders updated event received:', e.detail);
        if (typeof showToast === 'function') {
            showToast('info', 'تحديث الطلبات', `لديك ${e.detail.count} طلب نشط`);
        }
    });
    
    console.log('✅ System initialized successfully (Hybrid Mode)');
});

// ============================================================================
// 🎨 CONSOLE BANNER (UPDATED)
// ============================================================================
console.log(`
╔══════════════════════════════════════════════════════════╗
║  🎨 Enhanced Carousel System v4.0 (Hybrid Mode)         ║
║  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ║
║                                                          ║
║  ✨ NEW: Hybrid Loading Strategy                        ║
║     - First Slide: HTML (0ms load time)                 ║
║     - Remaining Slides: JavaScript (progressive)        ║
║     - Zero Layout Shift (CLS = 0)                       ║
║     - Instant Visual Feedback                           ║
║                                                          ║
║  📁 Modular Architecture:                                ║
║     ├─ carousel.js        (Entry Point) ← UPDATED       ║
║     └─ carousel/                                         ║
║        ├─ data.js         (Configuration)               ║
║        ├─ core.js         (CarouselManager)             ║
║        ├─ ui.js           (HTML + Modal) ← UPDATED      ║
║        └─ analytics.js    (Tracking System)             ║
║                                                          ║
║  🚀 Performance Improvements:                            ║
║     - ❌ Removed Hero Placeholder                       ║
║     - ❌ Removed Fade Transition Overhead               ║
║     - ✅ Instant First Contentful Paint (FCP)           ║
║     - ✅ Progressive Enhancement                        ║
║                                                          ║
║  📊 API Commands:                                        ║
║     getAnalyticsDashboard() - عرض الإحصائيات           ║
║     getOrders()             - عرض الطلبات               ║
║     viewOrder('ORD-XXX')    - تفاصيل طلب محدد           ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
`);

// ============================================================================
// 📤 EXPORT FOR TESTING
// ============================================================================
export { 
    initializeCarousels,
    CAROUSELS_DATA,
    CarouselManager,
    AnalyticsTracker
};