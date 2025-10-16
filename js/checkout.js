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
  const debouncedSave = debounce(saveFormData, 500);

  formFields.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener('input', () => {
        debouncedSave(); // ✅ ينتظر 500ms بعد آخر تغيير
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