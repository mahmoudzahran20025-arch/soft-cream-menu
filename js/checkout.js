  // ================================================================
  // CHECKOUT MAIN - نقطة الدخول الرئيسية (FINAL VERSION - NO LOYALTY)
  // ================================================================
  console.log('🔄 Loading checkout.js - Main Entry Point');

  // ================================================================
  // Static Imports - الوحدات الأساسية المطلوبة فوراً
  // ================================================================
  import { getCart, isCartEmpty, getCartLength } from './cart.js';
  import { showToast } from './utils.js';
  import { setupModalCloseHandlers, closeTrackingModal, showTrackingModal } from './checkout/checkout-ui.js';
  import { initOrdersBadge, updateOrdersBadge } from './checkout/orders-badge.js'; // ✅ NEW

  // ================================================================
  // Global State & Module Cache
  // ================================================================
  let checkoutModules = {
    core: null,
    ui: null,
    delivery: null,
    // loyalty: null, // ⚠️ DISABLED - معطل مؤقتاً
    validation: null
  };

  let isInitialized = false;

  // ================================================================
  // ✅ Pre-load Critical Modules
  // ================================================================
  async function loadCheckoutModules() {
    console.log('🔄 Pre-loading checkout modules...');
    
    try {
      // Load all modules in parallel (except loyalty)
      const [coreModule, uiModule, deliveryModule, validationModule] = await Promise.all([
        import('./checkout/checkout-core.js'),
        import('./checkout/checkout-ui.js'),
        import('./checkout/checkout-delivery.js'),
        // import('./checkout/checkout-loyalty.js'), // ⚠️ DISABLED
        import('./checkout/checkout-validation.js')
      ]);

      checkoutModules.core = coreModule;
      checkoutModules.ui = uiModule;
      checkoutModules.delivery = deliveryModule;
      // checkoutModules.loyalty = loyaltyModule; // ⚠️ DISABLED
      checkoutModules.validation = validationModule;

      console.log('✅ All checkout modules loaded successfully (Loyalty disabled)');
      return true;
    } catch (error) {
      console.error('❌ Failed to load checkout modules:', error);
      return false;
    }
  }

  // ================================================================
  // ✅ Enhanced initiateCheckout with Detailed Logging
  // ================================================================
  /*
  async function initiateCheckout() {
    console.log('🔹 initiateCheckout called');
    const currentCart = getCart();

    console.log('🔹 Cart state:', { 
      exists: !isCartEmpty(),
      length: getCartLength(),
      items: getCart().map(item => ({ 
        id: item.productId, 
        quantity: item.quantity 
      }))
    });

    // Check cart first
    if (isCartEmpty()) {
      console.log('⚠️ Cart is empty, showing error');
      const lang = window.currentLang || 'ar';
      showToast(
        lang === 'ar' ? 'السلة فارغة' : 'Cart is empty',
        lang === 'ar' ? 'أضف بعض المنتجات أولاً' : 'Add some products first',
        'error'
      );
      return;
    }

    // Ensure modules are loaded
    if (!checkoutModules.core) {
      console.log('🔄 Modules not loaded, loading now...');
      const loaded = await loadCheckoutModules();
      if (!loaded) {
        console.error('❌ Failed to load modules, aborting checkout');
        showToast('خطأ', 'فشل في تحميل نظام الدفع', 'error');
        return;
      }
    }

    console.log('🔄 Starting checkout initialization...');

    try {
      // Reset checkout state
      checkoutModules.core.setDeliveryMethod(null);
      checkoutModules.core.setBranch(null);
      checkoutModules.core.setCalculatedPrices(null);
      checkoutModules.core.setActiveCouponCode(null);
      console.log('🔄 State reset completed');

      // Load branches first
      await checkoutModules.delivery.loadBranches();
      console.log('🔄 Branches loaded');

      // Reset and fill UI
      checkoutModules.ui.resetFormFields();
      checkoutModules.ui.fillSavedUserData();
      checkoutModules.ui.updateOrderSummary();
      checkoutModules.ui.resetCheckoutUI();
      console.log('🔄 UI reset completed');

      // Show modal
      const modal = document.getElementById('checkoutModal');
      if (modal) {
        console.log('🔄 Modal element found, opening...');
        modal.classList.remove('hidden');
        modal.classList.add('show');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        console.log('✅ Modal opened successfully');
      } else {
        console.error('❌ Modal element #checkoutModal not found in DOM');
        showToast('خطأ', 'عنصر المودال غير موجود', 'error');
        return;
      }

      // Refresh icons
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
        console.log('🔄 Lucide icons refreshed');
      }

      console.log('✅ Checkout initiated successfully');

    } catch (error) {
      console.error('❌ Error during checkout initialization:', error);
      showToast('خطأ', 'حدث خطأ أثناء فتح نظام الدفع', 'error');
    }
  }*/


  async function initiateCheckout() {
    console.log('🔹 initiateCheckout called');
    const currentCart = getCart();

    console.log('🔹 Cart state:', { 
      exists: !isCartEmpty(),
      length: getCartLength(),
      items: getCart().map(item => ({ 
        id: item.productId, 
        quantity: item.quantity 
      }))
    });

    if (isCartEmpty()) {
      console.log('⚠️ Cart is empty, showing error');
      const lang = window.currentLang || 'ar';
      showToast(
        lang === 'ar' ? 'السلة فارغة' : 'Cart is empty',
        lang === 'ar' ? 'أضف بعض المنتجات أولاً' : 'Add some products first',
        'error'
      );
      return;
    }

    if (!checkoutModules.core) {
      console.log('🔄 Modules not loaded, loading now...');
      const loaded = await loadCheckoutModules();
      if (!loaded) {
        console.error('❌ Failed to load modules, aborting checkout');
        showToast('خطأ', 'فشل في تحميل نظام الدفع', 'error');
        return;
      }
      
      // ✅ Setup global module after loading
      if (!window.checkoutModule) {
        setupGlobalCheckoutModule();
        console.log('✅ checkoutModule created (on-demand)');
      }
    }

    console.log('🔄 Starting checkout initialization...');

    try {
      // ✅ CRITICAL: Reset ALL checkout state
      checkoutModules.core.setDeliveryMethod(null);
      checkoutModules.core.setBranch(null);
      checkoutModules.core.setUserLocation(null);  // ✅ المهم جداً!
      checkoutModules.core.setCalculatedPrices(null);
      checkoutModules.core.setActiveCouponCode(null);
      console.log('🔄 State reset completed (including userLocation)');

      // Load branches first
      await checkoutModules.delivery.loadBranches();
      console.log('🔄 Branches loaded');

      // Reset and fill UI
      checkoutModules.ui.resetFormFields();
      checkoutModules.ui.fillSavedUserData();
      checkoutModules.ui.updateOrderSummary();
      checkoutModules.ui.resetCheckoutUI();
      console.log('🔄 UI reset completed');

      // Show modal
      const modal = document.getElementById('checkoutModal');
      if (modal) {
        console.log('🔄 Modal element found, opening...');
        modal.classList.remove('hidden');
        modal.classList.add('show');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        console.log('✅ Modal opened successfully');
      } else {
        console.error('❌ Modal element #checkoutModal not found in DOM');
        showToast('خطأ', 'عنصر المودال غير موجود', 'error');
        return;
      }

      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
        console.log('🔄 Lucide icons refreshed');
      }

      console.log('✅ Checkout initiated successfully');

    } catch (error) {
      console.error('❌ Error during checkout initialization:', error);
      showToast('خطأ', 'حدث خطأ أثناء فتح نظام الدفع', 'error');
    }
  }

  // ================================================================
  // ✅ Safe Function Wrappers with Error Handling
  // ================================================================
  function createSafeWrapper(moduleName, functionName) {
    return async function(...args) {
      try {
        console.log(`🔄 Calling ${moduleName}.${functionName}`, args);
        
        // Wait for initialization if not ready
        if (!isInitialized) {
          console.log('⏳ Waiting for checkout initialization...');
          await new Promise(resolve => {
            if (isInitialized) {
              resolve();
            } else {
              window.addEventListener('checkoutReady', resolve, { once: true });
              // Timeout after 5 seconds
              setTimeout(resolve, 5000);
            }
          });
        }
        
        if (!checkoutModules[moduleName]) {
          console.log(`🔄 ${moduleName} not loaded, loading now...`);
          await loadCheckoutModules();
        }
        
        if (!checkoutModules[moduleName] || !checkoutModules[moduleName][functionName]) {
          throw new Error(`Function ${functionName} not found in ${moduleName}`);
        }
        
        const result = await checkoutModules[moduleName][functionName](...args);
        console.log(`✅ ${moduleName}.${functionName} completed`);
        return result;
      } catch (error) {
        console.error(`❌ Error in ${moduleName}.${functionName}:`, error);
        const lang = window.currentLang || 'ar';
        showToast('خطأ', `فشل في تنفيذ ${functionName}`, 'error');
      }
    };
  }

  // ================================================================
  // ✅ Enhanced Global Window Object (DEFENSIVE VERSION)
  // ================================================================
  function setupGlobalCheckoutModule() {
    console.log('🔄 Setting up global checkout module...');
    
    // ✅ Check if already exists (prevent overwrite by race condition)
    if (window.checkoutModule && Object.keys(window.checkoutModule).length > 5) {
      console.warn('⚠️ checkoutModule already exists with', Object.keys(window.checkoutModule).length, 'methods - skipping setup');
      return;
    }
    
    // Create the global object with safe wrappers
    const checkoutModuleObj = {
      // Core functions
      initiateCheckout,
      confirmOrder: createSafeWrapper('core', 'confirmOrder'),
      applyCoupon: createSafeWrapper('core', 'applyCoupon'),
      removeCoupon: createSafeWrapper('core', 'removeCoupon'),
      recalculatePrices: createSafeWrapper('core', 'recalculatePrices'),
      
      // Delivery functions
      selectDeliveryMethod: createSafeWrapper('delivery', 'selectDeliveryMethod'),
      selectBranch: createSafeWrapper('delivery', 'selectBranch'),
      requestLocation: createSafeWrapper('delivery', 'requestLocation'),
      allowLocation: createSafeWrapper('delivery', 'allowLocation'),
      loadBranches: createSafeWrapper('delivery', 'loadBranches'),
      getBranches: () => checkoutModules.delivery?.branches || {},
      
      // UI functions
      updateOrderSummary: createSafeWrapper('ui', 'updateOrderSummary'),
      closeCheckoutModal: createSafeWrapper('ui', 'closeCheckoutModal'),
      openTrackingModal: createSafeWrapper('ui', 'openTrackingModal'),
      checkOrderStatus: createSafeWrapper('ui', 'checkOrderStatus'),
      restoreFormData: createSafeWrapper('ui', 'restoreFormData'),
      showProcessingModal: createSafeWrapper('ui', 'showProcessingModal'),
      closePermissionModal: createSafeWrapper('delivery', 'closePermissionModal'),
      copyOrderId: createSafeWrapper('ui', 'copyOrderId'),
      shareOnWhatsApp: createSafeWrapper('ui', 'shareOnWhatsApp'),
      
      // Utility functions
      isReady: () => isInitialized,
      getModules: () => checkoutModules,
      reload: loadCheckoutModules,
      
      // Metadata for debugging
      _meta: {
        version: '1.0.0',
        createdAt: Date.now(),
        methodsCount: 0
      }
    };
    
    // Count methods
    checkoutModuleObj._meta.methodsCount = Object.keys(checkoutModuleObj).length - 1;
    
    // ✅ Assign with protection (prevent overwrite)
    try {
      Object.defineProperty(window, 'checkoutModule', {
        value: checkoutModuleObj,
        writable: false,
        configurable: true,
        enumerable: true
      });
    } catch (err) {
      console.warn('⚠️ Could not use defineProperty, falling back to direct assignment:', err);
      window.checkoutModule = checkoutModuleObj;
    }
    
    // Also set individual global functions
    window.initiateCheckout = initiateCheckout;
    
    console.log('✅ Global checkout module setup completed');
    console.log('📊 Methods count:', checkoutModuleObj._meta.methodsCount);
    
    // Verify critical methods
    const criticalMethods = ['selectDeliveryMethod', 'selectBranch', 'confirmOrder', 'closeCheckoutModal'];
    criticalMethods.forEach(method => {
      if (typeof window.checkoutModule[method] === 'function') {
        console.log(`✅ ${method} is available`);
      } else {
        console.error(`❌ ${method} is NOT available!`);
      }
    });
  }

  // ================================================================
  // ✅ Enhanced Initialization with Event Handlers
  // ================================================================
  function setupCheckoutEventHandlers() {
    console.log('🔄 Setting up checkout event handlers...');
    
    // Main checkout button listener
    const checkoutBtns = document.querySelectorAll('.checkout-btn');
    checkoutBtns.forEach(btn => {
      console.log('🔄 Attaching click listener to checkout button:', btn);
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('🔹 Checkout button clicked');
        initiateCheckout();
      });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const visibleModal = document.querySelector('.checkout-modal-overlay.show, .permission-modal.show, .processing-modal.show, .confirmed-modal.show, .tracking-modal.show');
        if (visibleModal && window.checkoutModule?.closeCheckoutModal) {
          console.log('🔹 ESC pressed, closing modal');
          window.checkoutModule.closeCheckoutModal();
        }
      }
    });

    // Form auto-save setup
    const formFields = ['customerName', 'customerPhone', 'customerAddress', 'orderNotes'];
    formFields.forEach(fieldId => {
      const field = document.getElementById(fieldId);
      if (field) {
        field.addEventListener('input', debounce(() => {
          if (window.checkoutModule?.restoreFormData) {
            window.checkoutModule.restoreFormData();
          }
        }, 500));
      }
    });

    // Phone input formatting
    const phoneInput = document.getElementById('customerPhone');
    if (phoneInput) {
      phoneInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 11) value = value.substring(0, 11);
        e.target.value = value;
      });
    }

    // ✅ Coupon code enter key (updated)
    const couponInput = document.getElementById('couponCodeInput');
    if (couponInput) {
      couponInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (window.checkoutModule?.applyCoupon) {
            window.checkoutModule.applyCoupon();
          }
        }
      });
    }

    // Tracking input enter key
    const trackingInput = document.getElementById('trackingInput');
    if (trackingInput) {
      trackingInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (window.checkoutModule?.checkOrderStatus) {
            window.checkoutModule.checkOrderStatus();
          }
        }
      });
    }

    console.log('✅ Event handlers setup completed');
  }

  // Simple debounce utility
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
  // ✅ Enhanced DOMContentLoaded Initialization
  // ================================================================

  async function initializeCheckout() {
    console.log('🔄 Initializing checkout system...');
    
    try {
      // ✅ CRITICAL: Setup global module IMMEDIATELY (before async operations)
      if (!window.checkoutModule) {
        setupGlobalCheckoutModule();
        console.log('✅ checkoutModule created immediately (functions will wait for modules)');
      }
      
      // ✅ STEP 1: Pre-load modules
      const loaded = await loadCheckoutModules();
      if (!loaded) {
        console.error('❌ Failed to pre-load modules');
        return;
      }
      
      // Setup event handlers
      setupCheckoutEventHandlers();
      // ✅ NEW: Initialize orders badge
      initOrdersBadge();
      console.log('✅ Orders badge initialized');
      // Load branches in background
      if (checkoutModules.delivery?.loadBranches) {
        checkoutModules.delivery.loadBranches().catch(err => {
          console.warn('⚠️ Failed to load branches in background:', err);
        });
      }
      
      // Restore saved form data
      if (checkoutModules.ui?.restoreFormData) {
        checkoutModules.ui.restoreFormData();
      }
      
      // Mark as initialized
      isInitialized = true;
      console.log('✅ Checkout system initialized successfully');
      
      // Dispatch ready event
      window.dispatchEvent(new CustomEvent('checkoutReady', { 
        detail: { modules: checkoutModules } 
      }));
      
    } catch (error) {
      console.error('❌ Failed to initialize checkout system:', error);
    }
  }


  // ================================================================
  // ✅ Enhanced Loading Strategy
  // ================================================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCheckout);
  } else {
    // DOM already loaded
    initializeCheckout();
  }

  // Also handle dynamic loading
  if (window.addEventListener) {
    window.addEventListener('load', () => {
      if (!isInitialized) {
        console.log('🔄 Window loaded but checkout not initialized, initializing now...');
        initializeCheckout();
      }
    });
  }
  // ================================================================
  // ✅ Export for ES Module Usage
  // ================================================================
  export { 
    initiateCheckout,
    loadCheckoutModules,
    setupGlobalCheckoutModule,
    setupCheckoutEventHandlers,
    checkoutModules
    
  };


  console.log('✅ checkout.js loaded successfully (FINAL - NO LOYALTY - COUPON SYSTEM)');