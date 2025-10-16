// ================================================================
// CHECKOUT CORE - الوظائف الأساسية (FIXED VERSION)
// ================================================================

console.log('🔄 Loading checkout-core.js');

// ================================================================
// Static Imports - الوحدات المطلوبة دائماً
// ================================================================
import { cart, clearCart } from '../cart.js';
import { api } from '../api.js';
import { storage } from '../storage.js';
import { showToast, generateUUID } from '../utils.js';

// ================================================================
// المتغيرات العامة - State Management
// ================================================================
export let selectedDeliveryMethod = null;
export let selectedBranch = null;
export let userLocation = null;
export let currentOrderData = null;
export let calculatedPrices = null;
export let activePromoCode = null;

// ================================================================
// ✅ FIX 1: Enhanced Setters with Logging
// ================================================================
export function setDeliveryMethod(method) {
  console.log('🔄 Setting delivery method:', method);
  selectedDeliveryMethod = method;
}

export function setBranch(branch) {
  console.log('🔄 Setting branch:', branch);
  selectedBranch = branch;
}

export function setUserLocation(location) {
  console.log('🔄 Setting user location:', location);
  userLocation = location;
}

export function setCalculatedPrices(prices) {
  console.log('🔄 Setting calculated prices:', prices);
  calculatedPrices = prices;
}

export function setActivePromoCode(code) {
  console.log('🔄 Setting active promo code:', code);
  activePromoCode = code;
}

export function setCurrentOrderData(data) {
  console.log('🔄 Setting current order data:', data);
  currentOrderData = data;
}

// ================================================================
// ✅ FIX 2: Enhanced Getters
// ================================================================
export function getSelectedDeliveryMethod() {
  return selectedDeliveryMethod;
}

export function getSelectedBranch() {
  return selectedBranch;
}

export function getUserLocation() {
  return userLocation;
}

export function getCalculatedPrices() {
  return calculatedPrices;
}

export function getActivePromoCode() {
  return activePromoCode;
}

export function getCurrentOrderData() {
  return currentOrderData;
}

// ================================================================
// ✅ FIX 3: Enhanced recalculatePrices with Better Error Handling
// ================================================================
export async function recalculatePrices() {
  console.log('🔄 Recalculating prices...');
  console.log('🔄 Current state:', {
    deliveryMethod: selectedDeliveryMethod,
    branch: selectedBranch,
    promoCode: activePromoCode,
    cartItems: cart?.length || 0
  });

  if (!selectedDeliveryMethod) {
    console.log('⚠️ No delivery method selected, clearing prices');
    calculatedPrices = null;
    
    // Update UI
    try {
      const { updateOrderSummary } = await import('./checkout-ui.js');
      updateOrderSummary();
    } catch (err) {
      console.warn('⚠️ Could not update order summary:', err);
    }
    return;
  }

  try {
    // Get customer phone
    let customerPhone = null;
    try {
      const { getCustomerPhone } = await import('./checkout-loyalty.js');
      customerPhone = getCustomerPhone();
    } catch (err) {
      console.warn('⚠️ Could not get customer phone:', err);
    }
    
    const request = {
      items: cart.map(item => ({ 
        productId: item.id || item.productId, 
        quantity: item.quantity,
        price: item.price || 0,
        name: item.name || ''
      })),
      deliveryMethod: selectedDeliveryMethod,
      branch: selectedBranch,
      promoCode: activePromoCode,
      location: userLocation,
      customerPhone: customerPhone
    };

    console.log('📤 Requesting price calculation:', request);

    const result = await api.request('POST', '/orders/prices', request);
    
    // Handle different response formats
    if (result && result.data) {
      calculatedPrices = result.data.calculatedPrices || result.data;
    } else if (result) {
      calculatedPrices = result.calculatedPrices || result;
    } else {
      throw new Error('Empty response from price calculation');
    }

    console.log('✅ Prices calculated successfully:', calculatedPrices);
    
    // Update UI
    try {
      const { updateOrderSummary } = await import('./checkout-ui.js');
      updateOrderSummary();
    } catch (err) {
      console.warn('⚠️ Could not update order summary:', err);
    }

  } catch (error) {
    console.error('❌ Failed to calculate prices:', error);
    
    // Fallback calculation
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryFee = selectedDeliveryMethod === 'delivery' ? 15 : 0;
    const discount = activePromoCode ? Math.round(subtotal * 0.1) : 0;
    const total = subtotal + deliveryFee - discount;
    
    calculatedPrices = {
      items: cart.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        total: item.price * item.quantity
      })),
      subtotal,
      deliveryFee,
      discount,
      total,
      isOffline: true
    };
    
    console.log('⚠️ Using fallback price calculation:', calculatedPrices);
    
    // Update UI with fallback data
    try {
      const { updateOrderSummary } = await import('./checkout-ui.js');
      updateOrderSummary();
    } catch (err) {
      console.warn('⚠️ Could not update order summary:', err);
    }
  }
}

// ================================================================
// ✅ FIX 4: Enhanced confirmOrder with Better Error Handling
// ================================================================
export async function confirmOrder() {
  console.log('🔄 Starting order confirmation...');
  const lang = window.currentLang || 'ar';
  
  try {
    // Validate order
    const { validateOrder } = await import('./checkout-validation.js');
    const validation = validateOrder();
    
    if (!validation.valid) {
      console.log('❌ Order validation failed:', validation.message);
      showToast(
        lang === 'ar' ? 'خطأ' : 'Error',
        validation.message,
        'error'
      );
      return;
    }
    
    console.log('✅ Order validation passed');
    
    // Close checkout modal and show processing
    const { closeCheckoutModal, showProcessingModal } = await import('./checkout-ui.js');
    
    closeCheckoutModal();
    showProcessingModal(true, false);
    
    // Prepare order data
    const orderData = {
      items: cart.map(item => ({
        productId: item.id || item.productId,
        quantity: item.quantity,
        price: item.price || 0,
        name: item.name || ''
      })),
      customer: validation.customer,
      customerPhone: validation.customer.phone,
      deliveryMethod: selectedDeliveryMethod,
      branch: selectedBranch,
      location: userLocation,
      promoCode: activePromoCode,
      calculatedPrices: calculatedPrices,
      idempotencyKey: generateUUID()
    };
    
    console.log('📤 Submitting order:', {
      ...orderData,
      items: orderData.items.length + ' items'
    });
    
    // Submit order
    const result = await api.submitOrder(orderData);
    console.log('✅ Order submitted successfully:', result);
    
    // Extract result data
    const { 
      orderId, 
      eta, 
      etaEn, 
      calculatedPrices: serverPrices, 
      loyaltyReward 
    } = result;
    
    // Update current order data
    currentOrderData = {
      id: orderId,
      customer: orderData.customer,
      deliveryMethod: selectedDeliveryMethod,
      branch: selectedBranch,
      items: serverPrices?.items || calculatedPrices?.items || orderData.items,
      calculatedPrices: serverPrices || calculatedPrices,
      loyaltyReward
    };
    
    // Save user data for future use
    const userData = {
      name: validation.customer.name,
      phone: validation.customer.phone,
      visitCount: (storage.getUserData()?.visitCount || 0) + 1
    };
    storage.setUserData(userData);
    
    // Clear cart
    clearCart();
    
    // Hide processing modal
    showProcessingModal(false);
    
    // Show success modal
    const { showConfirmedModal } = await import('./checkout-ui.js');
    const itemsText = (serverPrices?.items || calculatedPrices?.items || orderData.items)
      .map(i => `${i.name} × ${i.quantity}`)
      .join(', ');
    
    showConfirmedModal(
      orderId, 
      eta || (lang === 'ar' ? '30 دقيقة' : '30 minutes'), 
      validation.customer.phone, 
      itemsText, 
      currentOrderData
    );
    
    // Handle loyalty upgrade if applicable
    if (loyaltyReward?.justUpgraded) {
      try {
        const { showTierUpgradeModal } = await import('./checkout-loyalty.js');
        if (typeof showTierUpgradeModal === 'function') {
          setTimeout(() => {
            showTierUpgradeModal(loyaltyReward.tier, lang);
          }, 1000);
        }
      } catch (err) {
        console.warn('⚠️ Tier upgrade modal not available:', err);
      }
    }
    
    // Show success toast
    showToast(
      lang === 'ar' ? 'تم إرسال الطلب بنجاح! 🎉' : 'Order sent successfully! 🎉',
      eta || (lang === 'ar' ? 'خلال 30 دقيقة' : 'Within 30 minutes'),
      'success'
    );
    
    // Track event
    if (api.trackEvent) {
      api.trackEvent({
        name: 'order_completed',
        orderId: orderId,
        total: (serverPrices || calculatedPrices)?.total || 0,
        itemsCount: orderData.items.length
      });
    }
    
  } catch (error) {
    console.error('❌ Order confirmation failed:', error);
    
    // Hide processing modal
    try {
      const { showProcessingModal } = await import('./checkout-ui.js');
      showProcessingModal(false);
    } catch (err) {
      console.warn('⚠️ Could not hide processing modal:', err);
    }
    
    // Get error message
    let errorMessage = error.message || 'حدث خطأ غير متوقع';
    if (typeof api.getErrorMessage === 'function') {
      errorMessage = api.getErrorMessage(error, lang);
    }
    
    // Show error
    showToast(
      lang === 'ar' ? 'فشل إرسال الطلب' : 'Order Failed',
      errorMessage,
      'error'
    );
    
    // Reopen checkout modal
    const modal = document.getElementById('checkoutModal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('show');
      modal.style.display = 'flex';
    }
    
    // Track error
    if (api.trackEvent) {
      api.trackEvent({
        name: 'order_failed',
        error: error.message,
        step: 'submission'
      });
    }
  }
}

// ================================================================
// ✅ FIX 5: Enhanced applyPromoCode with Better Validation
// ================================================================
export async function applyPromoCode() {
  console.log('🔄 Applying promo code...');
  
  const promoInput = document.getElementById('promoCodeInput');
  const promoStatus = document.getElementById('promoStatus');
  
  if (!promoInput || !promoStatus) {
    console.warn('⚠️ Promo input elements not found');
    return;
  }
  
  const lang = window.currentLang || 'ar';
  const code = promoInput.value.trim().toUpperCase();
  
  if (!code) {
    showToast(
      lang === 'ar' ? 'خطأ' : 'Error',
      lang === 'ar' ? 'الرجاء إدخال كود الخصم' : 'Please enter promo code',
      'error'
    );
    return;
  }
  
  // Disable button during processing
  const applyBtn = document.getElementById('applyPromoBtn');
  if (applyBtn) {
    applyBtn.disabled = true;
    applyBtn.innerHTML = '<i data-lucide="loader"></i><span>جاري التحقق...</span>';
  }
  
  try {
    // Get subtotal for validation
    const subtotal = calculatedPrices?.subtotal || 
                     cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    console.log('📤 Validating promo code:', { code, subtotal });
    
    // Validate with API
    const result = await api.validatePromoCode(code, subtotal);
    
    if (result.valid) {
      console.log('✅ Promo code validated:', result);
      
      activePromoCode = code;
      
      // Show success status
      promoStatus.innerHTML = `
        <div class="promo-success" style="display: flex; align-items: center; gap: 8px; padding: 8px; background: #e8f5e8; border-radius: 6px; color: #2e7d32;">
          <i data-lucide="check-circle" style="width: 16px; height: 16px;"></i>
          <span style="flex: 1;">${result.message}</span>
          <button onclick="checkoutModule.removePromoCode()" class="remove-promo" style="background: none; border: none; color: #d32f2f; cursor: pointer; padding: 4px;">
            <i data-lucide="x" style="width: 14px; height: 14px;"></i>
          </button>
        </div>
      `;
      promoStatus.style.display = 'block';
      promoInput.disabled = true;
      
      // Recalculate prices
      await recalculatePrices();
      
      showToast(
        lang === 'ar' ? 'تم بنجاح!' : 'Success!',
        result.message,
        'success'
      );
    } else {
      throw new Error(result.message || 'كود الخصم غير صحيح');
    }
    
  } catch (error) {
    console.error('❌ Promo code validation failed:', error);
    
    // Get error message
    let errorMessage = error.message || 'كود الخصم غير صحيح';
    if (typeof api.getErrorMessage === 'function') {
      errorMessage = api.getErrorMessage(error, lang);
    }
    
    // Show error status
    promoStatus.innerHTML = `
      <div class="promo-error" style="display: flex; align-items: center; gap: 8px; padding: 8px; background: #ffeaea; border-radius: 6px; color: #d32f2f;">
        <i data-lucide="alert-circle" style="width: 16px; height: 16px;"></i>
        <span>${errorMessage}</span>
      </div>
    `;
    promoStatus.style.display = 'block';
    
    showToast(lang === 'ar' ? 'خطأ' : 'Error', errorMessage, 'error');
    
  } finally {
    // Re-enable button
    if (applyBtn) {
      applyBtn.disabled = false;
      applyBtn.innerHTML = '<span id="apply-promo-text">تطبيق</span>';
    }
    
    // Refresh icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }
}

// ================================================================
// ✅ FIX 6: Enhanced removePromoCode
// ================================================================
export async function removePromoCode() {
  console.log('🔄 Removing promo code...');
  
  activePromoCode = null;
  
  const promoInput = document.getElementById('promoCodeInput');
  const promoStatus = document.getElementById('promoStatus');
  
  if (promoInput) {
    promoInput.value = '';
    promoInput.disabled = false;
  }
  
  if (promoStatus) {
    promoStatus.style.display = 'none';
    promoStatus.innerHTML = '';
  }
  
  await recalculatePrices();
  
  const lang = window.currentLang || 'ar';
  showToast(
    lang === 'ar' ? 'تم' : 'Done',
    lang === 'ar' ? 'تم إزالة كود الخصم' : 'Promo code removed',
    'info'
  );
}

// ================================================================
// ✅ FIX 7: State Reset Function
// ================================================================
export function resetCheckoutState() {
  console.log('🔄 Resetting checkout state...');
  
  selectedDeliveryMethod = null;
  selectedBranch = null;
  userLocation = null;
  currentOrderData = null;
  calculatedPrices = null;
  activePromoCode = null;
  
  console.log('✅ Checkout state reset');
}

// ================================================================
// ✅ FIX 8: Debug Function
// ================================================================
export function getCheckoutDebugInfo() {
  return {
    selectedDeliveryMethod,
    selectedBranch,
    userLocation,
    currentOrderData,
    calculatedPrices,
    activePromoCode,
    cartItems: cart?.length || 0,
    timestamp: new Date().toISOString()
  };
}

console.log('✅ checkout-core.js loaded successfully');