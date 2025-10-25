// ملف: js/performance.js
// الوصف: مراقبة وتحليل مقاييس أداء الويب الأساسية (Web Vitals) وأداء النظام.
// الهدف: توفير بيانات أداء دقيقة للمطورين.

/**
 * تهيئة مكتبة web-vitals محاكاة لتجنب الاعتماد على CDN آخر.
 * في بيئة حقيقية، سيتم استخدام مكتبة مثل 'web-vitals'.
 */
const WebVitals = {
  // دالة محاكاة لتسجيل المقاييس
  getMetrics: (name, value) => {
    console.groupCollapsed(`📊 Web Vitals: ${name}`);
    console.log(`⏱️ Value: ${value.toFixed(2)} ms`);
    
    if (name === 'LCP' && value > 2500) {
      console.warn('🚨 LCP مرتفع! (> 2.5s). يتطلب تحسين الصورة/المكون الأكبر.');
    }
    if (name === 'CLS' && value > 0.1) {
      console.warn('⚠️ CLS مرتفع! (> 0.1). قد يكون بسبب تحميل غير متزامن للصور/الخطوط.');
    }
    if (name === 'FID' && value > 100) {
      console.warn('🐌 FID ضعيف! (> 100ms). قد يكون بسبب Long Tasks.');
    }
    
    console.log('🔗 Attributions/Debug Info:', performance.getEntriesByType('resource'));
    console.groupEnd();
  },
};

let observer;
let rafHandle = null;
let lastFrameTime = performance.now();
const fpsDisplayId = 'fpsDisplay';

/**
 * 1. مراقبة مقاييس Web Vitals (محاكاة باستخدام PerformanceObserver)
 */
function observeWebVitalMetrics() {
  if (typeof PerformanceObserver === 'undefined') {
    console.warn('PerformanceObserver غير مدعوم.');
    return;
  }

  try {
    // تعديل القائمة لحذف 'first-contentful-paint' لتجنب التحذير غير المدعوم في بعض البيئات
    const observedEntries = ['largest-contentful-paint', 'mark', 'measure', 'longtask'];

    observer = new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        const value = entry.duration || entry.startTime;
        let metricName = entry.name;

        // محاكاة لأسماء Web Vitals الرئيسية
        if (entry.entryType === 'largest-contentful-paint') {
            metricName = 'LCP';
        }
        // FCP يتم تسجيله من خلال getEntriesByType('paint')
        
        if (metricName === 'LCP') {
            WebVitals.getMetrics(metricName, value);
        }
      });
    });

    // مراقبة المقاييس الهامة
    observer.observe({ entryTypes: observedEntries });
    
    // محاكاة TTFB و FID و CLS يدوياً
    setTimeout(() => {
        const navEntry = performance.getEntriesByType('navigation')[0];
        const ttfb = navEntry ? navEntry.responseStart - navEntry.startTime : 0;
        WebVitals.getMetrics('TTFB', ttfb);

        // محاولة الحصول على FCP باستخدام paint
        const fcpEntry = performance.getEntriesByType('paint').find(entry => entry.name === 'first-contentful-paint');
        const fcp = fcpEntry ? fcpEntry.startTime : 0;
        if (fcp > 0) {
            WebVitals.getMetrics('FCP', fcp);
        } else {
             console.log('FCP entry not found via paint type.');
        }

        // لا يمكن حساب FID و CLS بدقة بدون مكتبة حقيقية أو تفاعل، نعتبرهما 0
        WebVitals.getMetrics('FID', 0);
        WebVitals.getMetrics('CLS', 0);
    }, 5000);

  } catch (e) {
    console.error('PerformanceObserver فشل في التهيئة:', e);
  }
}

/**
 * 2. مراقبة Long Tasks
 */
function observeLongTasks() {
  if (typeof PerformanceObserver === 'undefined') return;

  const longTaskObserver = new PerformanceObserver((list) => {
    list.getEntries().forEach(entry => {
      if (entry.duration > 50) { // مهمة طويلة إذا تجاوزت 50ms
        console.warn(`🐌 Long Task Detected: ${entry.name || entry.entryType} lasted ${entry.duration.toFixed(2)} ms.`, entry);
      }
    });
  });

  try {
    longTaskObserver.observe({ entryTypes: ['longtask'] });
  } catch (e) {
    console.error('Long Task Observer فشل:', e);
  }
}

/**
 * 3. مراقبة FPS (معدل الإطارات في الثانية)
 */
function monitorFPS() {
  const fpsMonitor = document.getElementById(fpsDisplayId);

  const calculateFPS = (timestamp) => {
    const delta = timestamp - lastFrameTime;
    lastFrameTime = timestamp;
    const fps = Math.round(1000 / delta);

    if (fpsMonitor) {
      fpsMonitor.textContent = `FPS: ${fps}`;
      fpsMonitor.className = `fixed bottom-4 left-4 z-toast px-3 py-1 text-xs rounded-full font-mono shadow-xl transition-colors ${
        fps >= 55 ? 'bg-green-500 text-white' : 
        fps >= 30 ? 'bg-yellow-500 text-gray-900' : 
        'bg-red-500 text-white'
      }`;
    }
    
    rafHandle = window.requestAnimationFrame(calculateFPS);
  };
  
  // بدأ المراقبة
  rafHandle = window.requestAnimationFrame(calculateFPS);
}

/**
 * 4. مراقبة الموارد والذاكرة
 */
function monitorResourcesAndMemory() {
  console.log('📦 Resource Timing Monitoring:');
  
  // تسجيل جميع الموارد التي تم تحميلها
  performance.getEntriesByType('resource').forEach(resource => {
    if (resource.initiatorType === 'img' && resource.fetchStart === 0) {
      console.log(`🖼️ Lazy Image: ${resource.name} - Duration: ${resource.duration.toFixed(2)} ms`);
    }
  });

  // مراقبة الذاكرة (متاحة في Chrome وبعض المتصفحات)
  if (window.performance.memory) {
    const memory = window.performance.memory;
    console.log('🧠 Memory Usage (MB):');
    console.log(`  - Total JS Heap Size: ${(memory.totalJSHeapSize / 1048576).toFixed(2)} MB`);
    console.log(`  - Used JS Heap Size: ${(memory.usedJSHeapSize / 1048576).toFixed(2)} MB`);
  }
}

/**
 * دالة التهيئة الرئيسية لمراقبة الأداء
 */
export function initPerformanceMonitoring() {
  console.log('🚀 Performance Monitoring Initialized.');
  
  // إضافة عنصر عرض FPS إلى DOM
  const fpsDiv = document.createElement('div');
  fpsDiv.id = fpsDisplayId;
  fpsDiv.setAttribute('aria-live', 'polite');
  document.body.appendChild(fpsDiv);
  
  observeWebVitalMetrics();
  observeLongTasks();
  monitorResourcesAndMemory();
  monitorFPS();
}
