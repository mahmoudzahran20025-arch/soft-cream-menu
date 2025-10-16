// ================================================================
// CHECKOUT - الملف الرئيسي (Entry Point)
// ================================================================

import { 
  initiateCheckout, 
  confirmOrder, 
  applyPromoCode, 
  removePromoCode,
  recalculatePrices
} from './checkout/checkout-core.js';

import { 
  selectDeliveryMethod, 
  selectBranch, 
  requestLocation, 
  allowLocation,
  loadBranches,
  branches 
} from './checkout/checkout-delivery.js';

import { 
  updateOrderSummary,
  closeCheckoutModal,
  showConfirmedModal,
  openTrackingModal,
  checkOrderStatus,
  resetFormFields,
  fillSavedUserData,
  saveFormData,
  restoreFormData
} from './checkout/checkout-ui.js';

import { 
  getCustomerPhone,
  loadGamificationPage 
} from './checkout/checkout-loyalty.js';

import { setupFocusTrap } from './utils.js';

// ================================================================
// تصدير للنافذة العامة
// ================================================================
if (typeof window !== 'undefined') {
  // للـ module style
  window.checkoutModule = {
    // Core
    initiateCheckout,
    confirmOrder,
    applyPromoCode,
    removePromoCode,
    recalculatePrices,
    
    // Delivery
    selectDeliveryMethod,
    selectBranch,
    requestLocation,
    allowLocation,
    loadBranches,
    getBranches: () => branches,
    
    // UI
    updateOrderSummary,
    closeCheckoutModal,
    openTrackingModal,
    checkOrderStatus,
    restoreFormData,
    
    // Loyalty
    getCustomerPhone,
    loadGamificationPage
  };
  
  // ✅ للـ onclick المباشر (لسهولة الاستخدام في HTML)
  window.initiateCheckout = initiateCheckout;
  window.confirmOrder = confirmOrder;
  window.selectDeliveryMethod = selectDeliveryMethod;
  window.selectBranch = selectBranch;
  window.requestLocation = requestLocation;
  window.allowLocation = allowLocation;
  window.closeCheckoutModal = (event) => {
    if (event && !event.target?.classList?.contains('checkout-modal-overlay')) return;
    const modal = document.getElementById('checkoutModal');
    if (modal) modal.classList.remove('show');
    document.body.style.overflow = '';
  };
  window.closePermissionModal = () => {
    const modal = document.getElementById('permissionModal');
    if (modal) modal.style.display = 'none';
  };
  window.checkOrderStatus = checkOrderStatus;
}

// ================================================================
// Utility: Debounce Function
// ================================================================
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// ================================================================
// Event Handlers Setup
// ================================================================
function setupCheckoutEventHandlers() {
  console.log('🔧 Setting up checkout event handlers...');
  
  // Focus Trap للـ Modals
  setupFocusTrap('checkoutModal');
  setupFocusTrap('permissionModal');
  setupFocusTrap('processingModal');
  setupFocusTrap('orderConfirmedModal');
  setupFocusTrap('trackingModal');
  
  // Enter key للتتبع
  const trackingInput = document.getElementById('trackingInput');
  if (trackingInput) {
    trackingInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        checkOrderStatus();
      }
    });
  }
  
  // Enter key لكود الخصم
  const promoInput = document.getElementById('promoCodeInput');
  if (promoInput) {
    promoInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        applyPromoCode();
      }
    });
  }
  
  // تنسيق رقم الهاتف (أرقام فقط)
  const phoneInput = document.getElementById('customerPhone');
  if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length > 11) {
        value = value.substring(0, 11);
      }
      e.target.value = value;
    });
  }
  
  // حفظ بيانات النموذج تلقائياً
  const formFields = ['customerName', 'customerPhone', 'customerAddress', 'orderNotes'];
  formFields.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener('input', () => {
        saveFormData();
      });
    }
  });
  
  // ESC لإغلاق Modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllCheckoutModals();
    }
  });
  
  // منع إرسال النموذج عند الضغط على Enter
  const checkoutForm = document.getElementById('checkoutForm');
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', (e) => {
      e.preventDefault();
    });
  }
  
  console.log('✅ Checkout event handlers setup complete');
}

// ================================================================
// إغلاق جميع نوافذ Checkout
// ================================================================
function closeAllCheckoutModals() {
  const modals = [
    'checkoutModal',
    'permissionModal',
    'processingModal',
    'orderConfirmedModal',
    'trackingModal'
  ];
  
  modals.forEach(modalId => {
    const modal = document.getElementById(modalId);
    if (modal) {
      if (modal.classList.contains('show')) {
        modal.classList.remove('show');
      }
      if (!modal.classList.contains('hidden')) {
        modal.classList.add('hidden');
      }
    }
  });
  
  document.body.style.overflow = '';
}

// ================================================================
// Auto-initialize عند تحميل الصفحة
// ================================================================
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
      console.log('📦 Initializing checkout module...');
      
      try {
        await loadBranches();
        setupCheckoutEventHandlers();
        restoreFormData();
        
        console.log('✅ Checkout module initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize checkout:', error);
      }
    });
  } else {
    // DOM already loaded
    (async () => {
      console.log('📦 Initializing checkout module (late)...');
      
      try {
        await loadBranches();
        setupCheckoutEventHandlers();
        restoreFormData();
        
        console.log('✅ Checkout module initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize checkout:', error);
      }
    })();
  }
}

console.log('✅ Checkout module loaded (Modular Architecture)');
// في checkout.js
window.initiateCheckout = async () => {
  console.log('🚀 Starting checkout...');
  try {
    await initiateCheckout();
    console.log('✅ Checkout initiated successfully');
  } catch (error) {
    console.error('❌ Error initiating checkout:', error);
  }
};

// في زر التأكيد في HTML
<button onclick="initiateCheckout()">تأكيد الطلب</button>


// ================================================================
// تصدير للاستخدام كـ ES Module
// ================================================================
export {
  initiateCheckout,
  confirmOrder,
  selectDeliveryMethod,
  selectBranch,
  updateOrderSummary,
  applyPromoCode,
  removePromoCode,
  openTrackingModal,
  checkOrderStatus,
  getCustomerPhone,
  loadGamificationPage
};