// ملف: js/accessibility.js
// الوصف: تطبيق تحسينات Accessibility (A11Y) وإدارة التركيز ولوحة المفاتيح.
// الهدف: جعل التطبيق قابلاً للاستخدام من قبل مستخدمي قارئات الشاشة ولوحة المفاتيح.

// حالة المودال المفتوح حالياً للتحكم في التركيز
let currentModal = null;
let lastFocusedElement = null;

/**
 * 1. تطبيق ARIA Labels تلقائياً على الأزرار التي لا تحتوي على نص.
 */
function applyAriaLabelsToIconButtons() {
  document.querySelectorAll('button:not([aria-label])').forEach(button => {
    // تحقق مما إذا كان الزر يحتوي على أيقونة فقط
    const icon = button.querySelector('svg, img');
    if (icon && button.textContent.trim() === '') {
      // محاولة استنتاج التسمية من الـ ID أو الـ Title
      let label = button.id ? button.id.replace(/([A-Z])/g, ' $1').trim() : button.title;
      
      // تسميات بديلة شائعة (بالعربية)
      if (button.classList.contains('header-cart-btn')) label = 'سلة الطلبات';
      else if (button.classList.contains('lang-toggle')) label = 'تبديل اللغة';
      else if (button.id === 'sidebarTrigger') label = 'فتح القائمة الجانبية';
      else if (button.classList.contains('sidebar-close')) label = 'إغلاق القائمة الجانبية';
      else if (button.classList.contains('modal-close') || button.classList.contains('checkout-close')) label = 'إغلاق النافذة المنبثقة';
      else if (button.id === 'clearSearch') label = 'مسح حقل البحث';
      else if (!label) label = 'زر بدون وصف';

      button.setAttribute('aria-label', label);
      button.setAttribute('role', 'button');
    }
    // التأكد من أن جميع الأزرار لديها role
    if (!button.getAttribute('role')) {
        button.setAttribute('role', 'button');
    }
  });
}

/**
 * 2. إدارة التركيز داخل المودال (Focus Trap)
 */
function handleModalFocusTrap(event) {
  if (!currentModal || event.key !== 'Tab') return;

  const focusableElements = currentModal.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  
  const firstFocusableEl = focusableElements[0];
  const lastFocusableEl = focusableElements[focusableElements.length - 1];

  if (!event.shiftKey && document.activeElement === lastFocusableEl) {
    firstFocusableEl.focus();
    event.preventDefault();
  } else if (event.shiftKey && document.activeElement === firstFocusableEl) {
    lastFocusableEl.focus();
    event.preventDefault();
  }
}

/**
 * 3. تحسينات لوحة المفاتيح والـ ARIA للمودالات
 */
function enhanceModalA11y(modalElement) {
  modalElement.setAttribute('role', 'dialog');
  modalElement.setAttribute('aria-modal', 'true');
  
  // استخدام العنوان الموجود في الهيدر كـ aria-labelledby
  const titleEl = modalElement.querySelector('[id*="title"]');
  if (titleEl) {
    modalElement.setAttribute('aria-labelledby', titleEl.id);
  }
  
  // حفظ العنصر الذي كان مركزاً عليه قبل فتح المودال
  lastFocusedElement = document.activeElement;
  
  // نقل التركيز إلى المودال المفتوح (أول عنصر قابل للتركيز)
  setTimeout(() => {
    const firstFocusable = modalElement.querySelector('button, input, a, [tabindex]:not([tabindex="-1"])');
    if (firstFocusable) {
      firstFocusable.focus();
    }
  }, 100);

  currentModal = modalElement;
  document.addEventListener('keydown', handleKeydown);
  document.addEventListener('keydown', handleModalFocusTrap);
}

/**
 * 4. إدارة مفاتيح لوحة المفاتيح العامة (ESC)
 */
function handleKeydown(event) {
  // مفتاح ESC لإغلاق المودالات والقائمة الجانبية
  if (event.key === 'Escape') {
    if (currentModal) {
      // إغلاق المودال
      const closeButton = currentModal.querySelector('.modal-close, .checkout-close');
      if (closeButton) closeButton.click();
      
      // إعادة التركيز إلى العنصر الذي كان مركزاً عليه سابقاً
      if (lastFocusedElement) {
        lastFocusedElement.focus();
      }
      currentModal = null;
    } 
    
    // إغلاق القائمة الجانبية (إذا كانت مفتوحة)
    const sidebar = document.getElementById('mainSidebar');
    if (sidebar && sidebar.classList.contains('show')) {
        window.closeSidebar(); // نفترض وجود دالة إغلاق عامة
    }
  }
}

/**
 * 5. إضافة Skip Link
 */
function createSkipLink() {
  const skipLink = document.createElement('a');
  skipLink.href = '#mainContent'; // يجب أن يكون هناك عنصر بـ ID="mainContent"
  skipLink.textContent = 'تخطي إلى المحتوى الرئيسي';
  skipLink.className = 'skip-link absolute top-0 right-0 z-toast p-3 bg-primary text-white font-bold rounded-bl-lg transition-transform duration-300 transform -translate-y-full focus:translate-y-0';
  
  document.body.prepend(skipLink);
  
  // إضافة ID للمحتوى الرئيسي
  const mainContent = document.querySelector('.page-content');
  if (mainContent) {
    mainContent.id = 'mainContent';
  }
}

/**
 * 6. وظيفة الإعلان لقارئ الشاشة (Announcer)
 */
const announcerDivId = 'a11y-live-announcer';
function createAnnouncer() {
  let announcer = document.getElementById(announcerDivId);
  if (!announcer) {
    announcer = document.createElement('div');
    announcer.id = announcerDivId;
    announcer.setAttribute('aria-live', 'assertive'); // لتنبيه فوري
    announcer.className = 'sr-only'; // إخفاء مرئي
    document.body.appendChild(announcer);
  }
}

/**
 * الإعلان عن رسالة لقارئ الشاشة
 * @param {string} message - الرسالة المراد الإعلان عنها.
 * @param {'polite'|'assertive'} politeness - مستوى الإلحاح.
 */
export function announce(message, politeness = 'assertive') {
  createAnnouncer(); // التأكد من وجود العنصر
  const announcer = document.getElementById(announcerDivId);
  if (announcer) {
    announcer.setAttribute('aria-live', politeness);
    // مسح المحتوى القديم قبل إضافة الجديد لضمان قراءة الرسالة
    announcer.textContent = ''; 
    setTimeout(() => {
        announcer.textContent = message;
        console.log(`📣 A11Y Announce: ${message}`);
    }, 100);
  }
}


/**
 * دالة التهيئة الرئيسية لإمكانية الوصول
 */
export function enhanceAccessibility() {
  console.log('✨ Accessibility Enhancements Initialized.');
  
  applyAriaLabelsToIconButtons();
  createSkipLink();
  createAnnouncer();

  // الاستماع لفتح المودالات لتطبيق focus trap و ARIA
  const modalObserver = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
      if (mutation.attributeName === 'style' || mutation.attributeName === 'class') {
        const target = mutation.target;
        // نتحقق من المودالات الرئيسية
        if (target.id === 'cartModal' || target.id === 'productModal' || target.id === 'checkoutModal') {
          const isVisible = target.style.display !== 'none' || target.classList.contains('show');
          
          if (isVisible) {
            enhanceModalA11y(target.querySelector(':scope > div')); // نرسل المحتوى الداخلي
            document.body.classList.add('modal-open'); // لمنع التمرير
          } else {
            document.body.classList.remove('modal-open');
            currentModal = null;
            document.removeEventListener('keydown', handleModalFocusTrap);
            if (lastFocusedElement) {
                lastFocusedElement.focus();
            }
          }
        }
      }
    }
  });

  // مراقبة المودالات الرئيسية
  const modalsToObserve = [
    document.getElementById('cartModal'),
    document.getElementById('productModal'),
    document.getElementById('checkoutModal')
  ];
  
  modalsToObserve.forEach(modal => {
    if (modal) {
        modalObserver.observe(modal, { attributes: true, attributeFilter: ['style', 'class'] });
    }
  });

  // إضافة معالج ESC العام
  document.addEventListener('keydown', handleKeydown);
}
