// ================================================================
// CHECKOUT CORE - الوظائف الأساسية (COMPLETELY FIXED)
// ================================================================

console.log('🔄 Loading checkout-core.js');

// ================================================================
// Static Imports - الوحدات المطلوبة دائماً
// ================================================================
import { getCart, isCartEmpty, getCartLength, clearCart } from '../cart.js';
import { api } from '../api.js';
import { storage } from '../storage.js';
import { showToast, generateUUID } from '../utils.js';
import { productsManager } from '../products.js';

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
// ✅ Enhanced Setters with Logging
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
// ✅ Enhanced Getters
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
// ✅ FIXED: دالة لإثراء عناصر السلة للعرض فقط (مع الأسعار)
// ================================================================
async function enrichCartItemsForDisplay(cartItems) {
  const enrichedItems = [];
  
  for (const item of cartItems) {
    try {
      const product = await productsManager.getProduct(item.productId);
      
      if (product) {
        const lang = window.currentLang || 'ar';
        enrichedItems.push({
          productId: item.productId,
          quantity: item.quantity,
          price: product.price || 0,
          name: lang === 'ar' ? product.name : (product.nameEn || product.name)
        });
      } else {
        console.warn('⚠️ Product not found:', item.productId);
      }
    } catch (error) {
      console.error('❌ Error enriching cart item:', error);
    }
  }
  
  return enrichedItems;
}

// ================================================================
// ✅ NEW: دالة لتحضير عناصر السلة للإرسال (بدون أسعار)
// ================================================================
async function prepareCartItemsForSubmit(cartItems) {
  const preparedItems = [];
  
  for (const item of cartItems) {
    try {
      // التحقق من وجود المنتج فقط
      const product = await productsManager.getProduct(item.productId);
      
      if (product) {
        // ✅ فقط ID والكمية - بدون أسعار أو أسماء
        preparedItems.push({
          productId: item.productId,
          quantity: item.quantity
        });
      } else {
        console.warn('⚠️ Product not found:', item.productId);
      }
    } catch (error) {
      console.error('❌ Error preparing cart item:', error);
    }
  }
  
  return preparedItems;
}

// ================================================================
// ✅ FIXED: recalculatePrices with enriched items for display
// ================================================================
export async function recalculatePrices() {
  console.log('🔄 Recalculating prices...');
  console.log('🔄 Current cart:', getCartLength(), 'items');

  if (!selectedDeliveryMethod) {
    console.log('⚠️ No delivery method selected, clearing prices');
    calculatedPrices = null;
    
    try {
      const { updateOrderSummary } = await import('./checkout-ui.js');
      updateOrderSummary();
    } catch (err) {
      console.warn('⚠️ Could not update order summary:', err);
    }
    return;
  }

  if (isCartEmpty()) {
    console.warn('⚠️ Cart is empty, cannot calculate prices');
    calculatedPrices = null;
    return;
  }

  try {
    const currentCart = getCart();
    
    // ✅ إثراء العناصر للعرض المحلي فقط
    const enrichedItems = await enrichCartItemsForDisplay(currentCart);
    
    if (enrichedItems.length === 0) {
      throw new Error('No valid items in cart');
    }
    
    console.log('📦 Enriched items for display:', enrichedItems);
    
    // ✅ تحضير العناصر للإرسال (بدون أسعار)
    const itemsForAPI = await prepareCartItemsForSubmit(currentCart);
    
    // Get customer phone
    let customerPhone = null;
    try {
      const { getCustomerPhone } = await import('./checkout-loyalty.js');
      customerPhone = getCustomerPhone();
    } catch (err) {
      console.warn('⚠️ Could not get customer phone:', err);
    }
    
    const request = {
      items: itemsForAPI,  // ✅ إرسال IDs فقط
      deliveryMethod: selectedDeliveryMethod,
      branch: selectedBranch,
      promoCode: activePromoCode,
      location: userLocation,
      customerPhone: customerPhone
    };

    console.log('📤 Requesting price calculation (IDs only):', request);

    const result = await api.request('POST', '/orders/prices', request);
    
    if (result && result.data) {
      calculatedPrices = result.data.calculatedPrices || result.data;
    } else if (result) {
      calculatedPrices = result.calculatedPrices || result;
    } else {
      throw new Error('Empty response from price calculation');
    }

    console.log('✅ Prices calculated successfully:', calculatedPrices);
    
    try {
      const { updateOrderSummary } = await import('./checkout-ui.js');
      updateOrderSummary();
    } catch (err) {
      console.warn('⚠️ Could not update order summary:', err);
    }

  } catch (error) {
    console.error('❌ Failed to calculate prices:', error);
    
    // ✅ Fallback calculation
    try {
      const currentCart = getCart();
      const enrichedItems = await enrichCartItemsForDisplay(currentCart);
      const subtotal = enrichedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const deliveryFee = selectedDeliveryMethod === 'delivery' ? 15 : 0;
      const discount = activePromoCode ? Math.round(subtotal * 0.1) : 0;
      const total = subtotal + deliveryFee - discount;
      
      calculatedPrices = {
        items: enrichedItems.map(item => ({
          productId: item.productId,
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
    } catch (fallbackError) {
      console.error('❌ Fallback calculation also failed:', fallbackError);
      calculatedPrices = null;
    }
    
    try {
      const { updateOrderSummary } = await import('./checkout-ui.js');
      updateOrderSummary();
    } catch (err) {
      console.warn('⚠️ Could not update order summary:', err);
    }
  }
}

// ================================================================
// ✅ FIXED: confirmOrder with separate functions
// ================================================================
export async function confirmOrder() {
  console.log('🔄 Starting order confirmation...');
  console.log('🔄 Current cart:', getCartLength(), 'items');
  
  const lang = window.currentLang || 'ar';
  
  if (isCartEmpty()) {
    console.error('❌ Cart is empty!');
    showToast(
      lang === 'ar' ? 'خطأ' : 'Error',
      lang === 'ar' ? 'السلة فارغة!' : 'Cart is empty!',
      'error'
    );
    return;
  }
  
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
    
    const currentCart = getCart();
    
    // ✅ تحضير العناصر للإرسال (IDs only - بدون أسعار)
    const itemsToSubmit = await prepareCartItemsForSubmit(currentCart);
    
    if (itemsToSubmit.length === 0) {
      throw new Error(lang === 'ar' ? 'فشل في تحميل بيانات المنتجات' : 'Failed to load product data');
    }
    
    console.log('📦 Items to submit (IDs only):', itemsToSubmit);
    
    // Prepare order data
    const orderData = {
      items: itemsToSubmit,  // ✅ IDs فقط بدون أسعار
      customer: validation.customer,
      customerPhone: validation.customer.phone,
      deliveryMethod: selectedDeliveryMethod,
      branch: selectedBranch,
      location: userLocation,
      promoCode: activePromoCode,
      idempotencyKey: generateUUID()
    };
    
    console.log('📤 Submitting order:', {
      ...orderData,
      items: orderData.items.length + ' items (IDs only)'
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
      items: serverPrices?.items || calculatedPrices?.items || [],
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
    
    // ✅ إثراء العناصر للعرض فقط
    const enrichedItemsForDisplay = await enrichCartItemsForDisplay(currentCart);
    const itemsText = (serverPrices?.items || enrichedItemsForDisplay)
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
    
    // ✅ Track event (non-critical - won't stop order completion)
    try {
      if (api.trackEvent) {
        await api.trackEvent({
          name: 'order_completed',
          orderId: orderId,
          total: (serverPrices || calculatedPrices)?.total || 0,
          itemsCount: itemsToSubmit.length
        });
      }
    } catch (trackError) {
      console.warn('⚠️ Analytics tracking failed (non-critical):', trackError.message);
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
    
    // Track error (non-critical)
    try {
      if (api.trackEvent) {
        await api.trackEvent({
          name: 'order_failed',
          error: error.message,
          step: 'submission'
        });
      }
    } catch (trackError) {
      console.warn('⚠️ Error tracking failed (non-critical):', trackError.message);
    }
  }
}

// ================================================================
// ✅ FIXED: applyPromoCode with enriched items for display
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
    // ✅ حساب الـ subtotal من العناصر المُثراة للعرض
    let subtotal = calculatedPrices?.subtotal || 0;
    
    if (!subtotal && !isCartEmpty()) {
      const currentCart = getCart();
      const enrichedItems = await enrichCartItemsForDisplay(currentCart);
      subtotal = enrichedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }
    
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
    
    let errorMessage = error.message || 'كود الخصم غير صحيح';
    if (typeof api.getErrorMessage === 'function') {
      errorMessage = api.getErrorMessage(error, lang);
    }
    
    promoStatus.innerHTML = `
      <div class="promo-error" style="display: flex; align-items: center; gap: 8px; padding: 8px; background: #ffeaea; border-radius: 6px; color: #d32f2f;">
        <i data-lucide="alert-circle" style="width: 16px; height: 16px;"></i>
        <span>${errorMessage}</span>
      </div>
    `;
    promoStatus.style.display = 'block';
    
    showToast(lang === 'ar' ? 'خطأ' : 'Error', errorMessage, 'error');
    
  } finally {
    if (applyBtn) {
      applyBtn.disabled = false;
      applyBtn.innerHTML = '<span id="apply-promo-text">تطبيق</span>';
    }
    
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }
}

// ================================================================
// ✅ removePromoCode
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
// ✅ State Reset Function
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
// ✅ Debug Function
// ================================================================
export function getCheckoutDebugInfo() {
  return {
    selectedDeliveryMethod,
    selectedBranch,
    userLocation,
    currentOrderData,
    calculatedPrices,
    activePromoCode,
    cartItems: getCartLength(),
    cartContent: getCart(),
    timestamp: new Date().toISOString()
  };
}

console.log('✅ checkout-core.js loaded successfully (COMPLETELY FIXED - SECURITY COMPLIANT)');