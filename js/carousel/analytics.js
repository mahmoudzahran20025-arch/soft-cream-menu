/**
 * 📊 ANALYTICS SYSTEM
 * ════════════════════════════════════════════════════════════════
 * 
 * 📌 المسؤولية: تتبع سلوك المستخدم وإرسال البيانات
 * 📌 Features:
 *    - Consent Management
 *    - Event Tracking (CTA, Navigation, Engagement)
 *    - Buffer Management (max 1000 events)
 *    - Auto Flush (every 10s or on unload)
 * 
 * ════════════════════════════════════════════════════════════════
 */

import { storage } from '../storage.js';

// ============================================================================
// 📊 ANALYTICS TRACKER
// ============================================================================
export const AnalyticsTracker = {
    events: [],
    maxBuffer: 100,           // حد التفريغ التلقائي
    maxTotalEvents: 1000,     // حد أقصى مطلق
    flushIntervalMs: 10000,   // 10 ثواني
    flushTimer: null,
    endpoint: '/api/analytics',
    isEnabled: false,
    
    /**
     * 🎬 Initialize Analytics System
     */
    init() {
        const consent = storage.local.get('analytics_consent');
        
        if (consent === 'granted') {
            this.enableAnalytics();
        } else if (consent === 'denied') {
            this.isEnabled = false;
            console.log('📊 Analytics disabled by user');
        } else {
            this.showConsentBanner();
        }
    },
    
    /**
     * 🎨 Show Consent Banner
     */
    showConsentBanner() {
        const banner = document.getElementById('consent-banner');
        if (!banner) return;
        
        banner.classList.remove('hidden');
        
        const acceptBtn = document.getElementById('consent-accept');
        const denyBtn = document.getElementById('consent-deny');
        
        if (acceptBtn) {
            acceptBtn.addEventListener('click', () => {
                this.enableAnalytics();
                banner.classList.add('hidden');
                if (typeof window.showToast === 'function') {
                    window.showToast('success', 'تم تفعيل نظام التحليلات بنجاح');
                }
            });
        }
        
        if (denyBtn) {
            denyBtn.addEventListener('click', () => {
                this.disableAnalytics();
                banner.classList.add('hidden');
                if (typeof window.showToast === 'function') {
                    window.showToast('info', 'تم رفض التحليلات', 'يمكنك تفعيلها لاحقاً');
                }
            });
        }
    },
    
    /**
     * ✅ Enable Analytics
     */
    enableAnalytics() {
        this.isEnabled = true;
        storage.local.set('analytics_consent', 'granted');
        
        // Start auto-flush timer
        this.flushTimer = setInterval(() => this.flush(), this.flushIntervalMs);
        
        // Flush on page unload
        window.addEventListener('beforeunload', () => this.flush(true));
        
        // Flush when page becomes hidden
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.flush(true);
            }
        });
        
        console.log('✅ Analytics enabled');
    },
    
    /**
     * 🚫 Disable Analytics
     */
    disableAnalytics() {
        this.isEnabled = false;
        storage.local.set('analytics_consent', 'denied');
        this.stopTracking();
        console.log('🚫 Analytics disabled');
    },
    
    /**
     * 🛑 Stop Tracking & Clear Data
     */
    stopTracking() {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
            this.flushTimer = null;
        }
        this.events = [];
    },
    
    /**
     * 📝 Track Event
     */
    track(eventType, data) {
        if (!this.isEnabled) return;
        
        // حد أقصى للذاكرة - امسح 50% من الأقدم
        if (this.events.length >= this.maxTotalEvents) {
            console.warn(`⚠️ Analytics buffer full (${this.maxTotalEvents}), dropping oldest 50%`);
            this.events = this.events.slice(Math.floor(this.maxTotalEvents / 2));
        }
        
        const event = {
            type: eventType,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            viewport: { width: window.innerWidth, height: window.innerHeight },
            deviceId: storage.getDeviceId(),
            sessionId: storage.getSessionId(),
            ...data
        };
        
        this.events.push(event);
        console.log('📊 Analytics Event:', event);
        
        // Auto-flush عند الوصول للحد
        if (this.events.length >= this.maxBuffer) {
            this.flush();
        }
    },
    
    /**
     * 🚀 Flush Events to Server
     */
    flush(onUnload = false) {
        if (!this.events.length || !this.isEnabled) return;
        
        const batch = [...this.events];
        this.events = [];
        
        const payload = JSON.stringify({ 
            events: batch,
            session: storage.getSessionId(),
            deviceId: storage.getDeviceId()
        });
        
        if (onUnload && navigator.sendBeacon) {
            // Use sendBeacon for reliable unload sending
            navigator.sendBeacon(
                this.endpoint, 
                new Blob([payload], { type: 'application/json' })
            );
        } else {
            // Regular fetch
            fetch(this.endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: payload,
                keepalive: true
            }).catch(err => {
                console.warn('Analytics flush failed, re-queuing events:', err);
                // فقط نعيد جزء محدود من البيانات
                const limitedBatch = batch.slice(-this.maxBuffer);
                this.events.push(...limitedBatch);
            });
        }
    },
    
    /**
     * 🎯 Track CTA Click
     */
    trackCTA(carouselId, slideIndex, productName, category) {
        this.track('cta_click', {
            carousel: carouselId,
            slide_index: slideIndex,
            product_name: productName,
            category: category,
            action: 'order_now'
        });
    },
    
    /**
     * 🧭 Track Navigation
     */
    trackNavigation(carouselId, fromSlide, toSlide, method) {
        this.track('slide_navigation', {
            carousel: carouselId,
            from_slide: fromSlide,
            to_slide: toSlide,
            method: method // 'next', 'prev', 'dot', 'keyboard'
        });
    },
    
    /**
     * ⏱️ Track Engagement Duration
     */
    trackEngagement(carouselId, slideIndex, duration) {
        this.track('slide_engagement', {
            carousel: carouselId,
            slide_index: slideIndex,
            duration_seconds: duration
        });
    },
    
    /**
     * 📊 Get Analytics Summary
     */
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
// 🌐 GLOBAL API FUNCTIONS
// ============================================================================

/**
 * 📊 Get Analytics Dashboard
 */
export function getAnalyticsDashboard() {
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
}

/**
 * 🚀 Flush Analytics Manually
 */
export function flushAnalytics() {
    AnalyticsTracker.flush();
    console.log('✅ Analytics flushed manually');
}

/**
 * ✅ Enable Analytics
 */
export function enableAnalytics() {
    AnalyticsTracker.enableAnalytics();
}

/**
 * 🚫 Disable Analytics
 */
export function disableAnalytics() {
    AnalyticsTracker.disableAnalytics();
}

/**
 * ❓ Check Analytics Consent
 */
export function checkAnalyticsConsent() {
    const consent = storage.local.get('analytics_consent');
    console.log('Analytics Consent Status:', consent || 'not set');
    console.log('Analytics Enabled:', AnalyticsTracker.isEnabled);
    return AnalyticsTracker.isEnabled;
}