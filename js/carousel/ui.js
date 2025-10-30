/**
 * 🎨 CAROUSEL UI SYSTEM
 * ════════════════════════════════════════════════════════════════
 * 
 * 📌 المسؤولية: كل حاجة بصرية (HTML Generation, Modal, Images)
 * 📌 Features:
 *    - HTML Generation with XSS Protection
 *    - Modal System with Accessibility
 *    - Image Optimization (srcset, preload)
 *    - Focus Management
 * 
 * ════════════════════════════════════════════════════════════════
 */
/**
 * 🎨 CAROUSEL UI SYSTEM (HYBRID MODE)
 * ════════════════════════════════════════════════════════════════
 * 
 * 📌 التحديثات:
 *    - ✅ تخطي رسم الشريحة الأولى للكاروسيل الرئيسي إذا كانت موجودة في HTML
 *    - ✅ تعديل منطق active/next classes للتوافق مع النهج الهجين
 * 
 * ════════════════════════════════════════════════════════════════
 */

import { CATEGORY_NAMES } from './data.js';
import { storage } from '../storage.js';
import { AnalyticsTracker } from './analytics.js';

// ============================================================================
// 🛡️ SECURITY HELPERS
// ============================================================================

/**
 * 🔒 XSS Protection
 */
export function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * 🔍 Safe DOM Getter
 */
export function safeGet(id, context = 'DOM') {
    const el = document.getElementById(id);
    if (!el) {
        console.error(`❌ ${context}: Missing element #${id}`);
    }
    return el;
}

// ============================================================================
// 🖼️ IMAGE OPTIMIZATION
// ============================================================================

/**
 * 📐 Generate Responsive Srcset
 * ⚠️ imgBB doesn't support dynamic sizing - return empty for better performance
 */
function generateSrcset(imageUrl) {
    const isImgbb = imageUrl.includes('i.ibb.co');
    
    // ✅ imgBB: لا داعي للـ srcset - نفس الصورة
    if (isImgbb) {
        return ''; // Empty = المتصفح يستخدم src فقط
    }
    
    // ✅ CDNs أخرى: استخدم srcset عادي
    return `${imageUrl}?w=400 400w, ${imageUrl}?w=800 800w, ${imageUrl}?w=1200 1200w`;
}

/**
 * 🚀 Preload Critical Images (First Slide)
 * ✅ UPDATED: Skip preload for main carousel if first slide exists in HTML
 */
export function preloadCriticalImages(carouselsData) {
    Object.entries(carouselsData).forEach(([carouselId, carousel]) => {
        const firstSlide = carousel.slides[0];
        if (!firstSlide?.image) return;
        
        // ✅ NEW: Skip preload for main carousel first slide (already in HTML with eager loading)
        const isMainCarousel = carouselId === 'carousel-main';
        const firstSlideExists = isMainCarousel && document.getElementById(`slide-${carouselId}-1`);
        
        if (firstSlideExists) {
            console.log('⏭️ Skipping preload for existing HTML slide:', `slide-${carouselId}-1`);
            return;
        }
        
        const isImgbb = firstSlide.image.includes('i.ibb.co');
        
        // ⚠️ imgBB: Skip preload - يتحمل عادي في HTML أسرع
        if (isImgbb) {
            console.log('⚠️ Skipping preload for imgBB image (will load naturally)');
            return;
        }
        
        // ✅ CDNs أخرى: استخدم preload
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = firstSlide.image;
        
        const srcset = generateSrcset(firstSlide.image);
        if (srcset) {
            link.setAttribute('imagesrcset', srcset);
            link.setAttribute('imagesizes', '(max-width: 640px) 85vw, (max-width: 768px) 70vw, (max-width: 1024px) 45vw, 400px');
        }
        
        document.head.appendChild(link);
    });
}

/**
 * 🖼️ Fallback SVG for Failed Images
 */
function getImageFallbackSVG(title) {
    const encodedTitle = encodeURIComponent(title);
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Crect fill='%23e5e7eb' width='400' height='400'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%239ca3af' font-family='system-ui' font-size='20'%3E${encodedTitle}%3C/text%3E%3C/svg%3E`;
}

/**
 * 🎨 Generate Optimized Image Tag
 * ✅ Smart loading: eager for first slide, lazy for rest
 * ✅ No srcset for imgBB (avoid duplicate requests)
 */
function generateOptimizedImage(imageUrl, altText, slideIndex) {
    const isImgbb = imageUrl.includes('i.ibb.co');
    const srcset = isImgbb ? '' : generateSrcset(imageUrl);
    const loading = slideIndex === 0 ? 'eager' : 'lazy';
    
    // ✅ Optimized: srcset only when useful
    const srcsetAttr = srcset ? `srcset="${srcset}"` : '';
    const sizesAttr = srcset ? `sizes="(max-width: 640px) 85vw, (max-width: 768px) 70vw, (max-width: 1024px) 45vw, 400px"` : '';
    
    return `
        <img 
            src="${imageUrl}" 
            ${srcsetAttr}
            ${sizesAttr}
            alt="${altText}" 
            class="w-full h-full object-cover rounded-3xl shadow-2xl transition-transform duration-500 ${slideIndex % 2 === 0 ? 'img-rotate-right' : 'img-rotate-left'}" 
            loading="${loading}" 
            decoding="async" 
            width="400" 
            height="400"
            onerror="this.onerror=null;this.src='${getImageFallbackSVG(altText)}';this.style.opacity='0.8';" 
        />
    `.trim();
}

// ============================================================================
// 🏗️ HTML GENERATOR (UPDATED FOR HYBRID MODE)
// ============================================================================

/**
 * 🎨 Generate Full Carousel HTML (HYBRID MODE)
 * ✅ NEW: Skip rendering first slide of main carousel if it exists in HTML
 */
export function generateCarouselHTML(carouselId, config) {
    // ✅ NEW: Check if this is the main carousel AND if the first slide already exists in HTML
    const isMainCarousel = carouselId === 'carousel-main';
    const firstSlideExists = isMainCarousel && document.getElementById(`slide-${carouselId}-1`);
    
    if (firstSlideExists) {
        console.log(`✅ First slide exists in HTML: slide-${carouselId}-1 - will skip rendering`);
    }
    
    const slides = config.slides.map((slide, index) => {
        // ✅ NEW: Skip rendering the first slide of the main carousel if it already exists
        if (isMainCarousel && index === 0 && firstSlideExists) {
            console.log(`⏭️ Skipping render for existing slide: slide-${carouselId}-1`);
            return ''; // Return empty string to skip it
        }
        
        const isImageRight = slide.layout === 'image-right';
        
        // ✅ NEW: Adjust slideClass logic for hybrid mode
        let slideClass;
        if (firstSlideExists) {
            // First slide exists in HTML (already has 'active' class)
            if (index === 1) {
                slideClass = 'next'; // Second slide is 'next'
            } else if (index > 1) {
                slideClass = 'hidden'; // Rest are hidden
            }
            // index === 0 is skipped, so no class needed
        } else {
            // Normal mode: first JS-rendered slide is active
            if (index === 0) {
                slideClass = 'active';
            } else if (index === 1) {
                slideClass = 'next';
            } else {
                slideClass = 'hidden';
            }
        }
        
        // ✅ XSS Protection
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
                                ${generateOptimizedImage(slide.image, safeTitle, index)}
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
    
    // ✅ NEW: Adjust dots active state for hybrid mode
    const dots = config.slides.map((slide, index) => {
        const isActive = (firstSlideExists && index === 0) || (!firstSlideExists && index === 0);
        const safeTitle = escapeHtml(slide.title);
        return `
        <button
            class="dot-indicator w-8 sm:w-12 h-1.5 sm:h-2 rounded-full ${isActive ? 'bg-white/40' : 'bg-white/20'} hover:bg-white/60 transition-colors"
            data-carousel-id="${carouselId}"
            data-slide-index="${index}"
            role="tab"
            aria-label="الانتقال إلى الشريحة ${index + 1}: ${safeTitle}"
            aria-controls="slide-${carouselId}-${index + 1}"
            ${isActive ? 'aria-current="true"' : ''}
            tabindex="${isActive ? '0' : '-1'}">
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
// 🎭 MODAL SYSTEM (NO CHANGES)
// ============================================================================

let lastFocusedElement = null;
let modalKeydownHandler = null;

/**
 * 🔒 Trap Focus Inside Modal (Accessibility)
 */
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

/**
 * 🔓 Remove Focus Trap
 */
function removeFocusTrap(modalElement) {
    if (modalKeydownHandler) {
        modalElement.removeEventListener('keydown', modalKeydownHandler);
        modalKeydownHandler = null;
    }
}

/**
 * 🎨 Show Modal
 */
export function showModal(slide, carouselId) {
    lastFocusedElement = document.activeElement;
    
    const modal = safeGet('cta-modal', 'Modal System');
    const modalTitle = safeGet('modal-title', 'Modal Title');
    const modalBody = safeGet('modal-body', 'Modal Body');
    const modalAction = safeGet('modal-action', 'Modal Action');
    
    if (!modal || !modalTitle || !modalBody || !modalAction) {
        console.error('Cannot show modal: Missing required elements');
        return;
    }
    
    // ✅ XSS Protection
    modalTitle.textContent = slide.title;
    
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
    desc.textContent = slide.description;
    
    const meta = document.createElement('div');
    meta.className = 'flex items-center gap-2 text-sm';
    
    const category = document.createElement('span');
    category.className = 'px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full';
    category.textContent = CATEGORY_NAMES[slide.category] || slide.category;
    
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
    
    // زر التأكيد
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
        
        storage.addOrder(orderData);
        
        console.log('📦 Order Confirmed & Saved:', orderData);
        
        if (typeof window.showToast === 'function') {
            window.showToast(
                'success', 
                'تم تأكيد الطلب بنجاح! 🎉',
                `${slide.title}${sauce ? ' مع صوص ' + sauce : ''}\nرقم الطلب: ${orderId}`
            );
        }
        
        closeModal();
        storage.triggerOrdersBadgeUpdate();
    };
    
    modal.classList.add('active');
    trapFocus(modal);
    
    setTimeout(() => modalTitle.focus(), 100);
}

/**
 * ❌ Close Modal
 */
export function closeModal() {
    const modal = safeGet('cta-modal', 'Close Modal');
    if (!modal) return;
    
    removeFocusTrap(modal);
    modal.classList.remove('active');
    
    if (lastFocusedElement) {
        lastFocusedElement.focus();
        lastFocusedElement = null;
    }
}

/**
 * 🎹 Setup Modal Keyboard Shortcuts
 */
export function setupModalKeyboard() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
    
    const modalEl = safeGet('cta-modal');
    if (modalEl) {
        modalEl.addEventListener('click', (e) => {
            if (e.target.id === 'cta-modal') {
                closeModal();
            }
        });
    }
}