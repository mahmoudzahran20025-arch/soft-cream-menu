// ================================================================
// CHECKOUT CORE - الوظائف الأساسية (FIXED - Minimal Changes)
// ================================================================

import { cart, clearCart } from '../cart.js';
import { api } from '../api.js';
import { storage } from '../storage.js';
import { showToast, generateUUID } from '../utils.js';

// ================================================================
// المتغيرات العامة
// ================================================================
export let selectedDeliveryMethod = null;
export let selectedBranch = null;
export let userLocation = null;
export let currentOrderData = null;
export let calculatedPrices = null;
export let activePromoCode = null;

// ================================================================
// Setters (للسماح بالتعديل من خارج الملف)
// ================================================================
export function setDeliveryMethod(method) {
  selectedDeliveryMethod = method;
}

export function setBranch(branch) {
  selectedBranch = branch;
}

export function setUserLocation(location) {
  userLocation = location;
}

export function setCalculatedPrices(prices) {
  calculatedPrices = prices;
}

export function setActivePromoCode(code) {
  activePromoCode = code;
}

// ================================================================
// ✅ NEW: Getters (للوصول إلى القيم الحالية)
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
// بدء عملية الشراء
// ================================================================
export async function initiateCheckout() {
  if (!cart || cart.length === 0) {
    const lang = window.currentLang || 'ar';
    showToast(
      lang === 'ar' ? 'السلة فارغة' : 'Cart is empty',
      lang === 'ar' ? 'أضف بعض المنتجات أولاً' : 'Add some products first',
      'error'
    );
    return;
  }
  
  // إعادة تعيين
  selectedDeliveryMethod = null;
  selectedBranch = null;
  calculatedPrices = null;
  activePromoCode = null;
  
  // استدعاء باقي الوظائف من الموديولات الأخرى
  const { resetFormFields, fillSavedUserData, resetCheckoutUI } = await import('./checkout-ui.js');
  const { updateOrderSummary } = await import('./checkout-ui.js');
  const { loadBranches } = await import('./checkout-delivery.js');
  
  await loadBranches();
  resetFormFields();
  fillSavedUserData();
  updateOrderSummary();
  resetCheckoutUI();
  
  // إظهار Modal
  const modal = document.getElementById('checkoutModal');
  if (modal) {
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
  }
  
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// ================================================================
// ✅ FIX 1: إعادة حساب الأسعار من Backend
// ================================================================
export async function recalculatePrices() {
  if (!selectedDeliveryMethod) {
    calculatedPrices = null;
    const { updateOrderSummary } = await import('./checkout-ui.js');
    updateOrderSummary();
    return;
  }

  try {
    const { getCustomerPhone } = await import('./checkout-loyalty.js');
    const customerPhone = getCustomerPhone();
    
    const request = {
      items: cart.map(item => ({ 
        productId: item.id || item.productId, 
        quantity: item.quantity 
      })),
      deliveryMethod: selectedDeliveryMethod,
      branch: selectedBranch,
      promoCode: activePromoCode,
      location: userLocation,
      customerPhone: customerPhone
    };

    console.log('📤 Requesting prices:', request);

    const result = await api.request('POST', '/orders/prices', request);
    
    // ✅ FIX: استخدام result.data بدل result مباشرة
    calculatedPrices = result.data?.calculatedPrices || result.data;

    console.log('✅ Prices calculated:', calculatedPrices);
    
    const { updateOrderSummary } = await import('./checkout-ui.js');
    updateOrderSummary();

  } catch (error) {
    console.error('❌ Failed to calculate prices:', error);
    calculatedPrices = null;
    const { updateOrderSummary } = await import('./checkout-ui.js');
    updateOrderSummary();
  }
}

// ================================================================
// ✅ FIX 2: تأكيد الطلب (مع customerPhone منفصل)
// ================================================================
export async function confirmOrder() {
  const lang = window.currentLang || 'ar';
  
  const { validateOrder } = await import('./checkout-validation.js');
  const validation = validateOrder();
  
  if (!validation.valid) {
    showToast(
      lang === 'ar' ? 'خطأ' : 'Error',
      validation.message,
      'error'
    );
    return;
  }
  
  const { closeCheckoutModal, showProcessingModal } = await import('./checkout-ui.js');
  
  closeCheckoutModal();
  showProcessingModal(true, false);
  
  // ✅ FIX: إضافة customerPhone منفصل
  const orderData = {
    items: cart.map(item => ({
      productId: item.id || item.productId,
      quantity: item.quantity
    })),
    customer: validation.customer,
    customerPhone: validation.customer.phone, // ✅ إضافة هذا السطر
    deliveryMethod: selectedDeliveryMethod,
    branch: selectedBranch,
    location: userLocation,
    promoCode: activePromoCode,
    idempotencyKey: generateUUID()
  };
  
  console.log('📤 Submitting order:', orderData);
  
  try {
    const result = await api.submitOrder(orderData);
    console.log('✅ Order submitted:', result);
    
    const { orderId, eta, etaEn, calculatedPrices: prices, loyaltyReward } = result;
    
    currentOrderData = {
      id: orderId,
      customer: orderData.customer,
      deliveryMethod: selectedDeliveryMethod,
      branch: selectedBranch,
      items: prices.items,
      calculatedPrices: prices,
      loyaltyReward
    };
    
    // حفظ بيانات المستخدم
    const userData = {
      name: validation.customer.name,
      phone: validation.customer.phone,
      visitCount: (storage.getUserData()?.visitCount || 0) + 1
    };
    storage.setUserData(userData);
    
    clearCart();
    showProcessingModal(false);
    
    const { showConfirmedModal } = await import('./checkout-ui.js');
    const itemsText = prices.items.map(i => `${i.name} × ${i.quantity}`).join(', ');
    showConfirmedModal(orderId, eta, validation.customer.phone, itemsText, currentOrderData);
    
    // التحقق من الترقية (مع حماية من الأخطاء)
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
    
    showToast(
      lang === 'ar' ? 'تم إرسال الطلب بنجاح! 🎉' : 'Order sent successfully! 🎉',
      eta,
      'success'
    );
    
    api.trackEvent({
      name: 'order_completed',
      orderId: orderId,
      total: prices.total,
      itemsCount: prices.items.length
    });
    
  } catch (error) {
    console.error('❌ Order failed:', error);
    showProcessingModal(false);
    
    // ✅ استخدام getErrorMessage إذا كان موجود
    let errorMessage = error.message;
    if (typeof api.getErrorMessage === 'function') {
      errorMessage = api.getErrorMessage(error, lang);
    }
    
    showToast(
      lang === 'ar' ? 'فشل إرسال الطلب' : 'Order Failed',
      errorMessage,
      'error'
    );
    
    const modal = document.getElementById('checkoutModal');
    if (modal) modal.classList.add('show');
    
    api.trackEvent({
      name: 'order_failed',
      error: error.message,
      step: 'submission'
    });
  }
}

// ================================================================
// ✅ FIX 3: كود الخصم (استخدام calculatedPrices.subtotal)
// ================================================================
export async function applyPromoCode() {
  const promoInput = document.getElementById('promoCodeInput');
  const promoStatus = document.getElementById('promoStatus');
  
  if (!promoInput || !promoStatus) return;
  
  const lang = window.currentLang || 'ar';
  const code = promoInput.value.trim();
  
  if (!code) {
    showToast(
      lang === 'ar' ? 'خطأ' : 'Error',
      lang === 'ar' ? 'الرجاء إدخال كود الخصم' : 'Please enter promo code',
      'error'
    );
    return;
  }
  
  // ✅ FIX: استخدام subtotal من calculatedPrices إذا كان موجود
  const subtotal = calculatedPrices?.subtotal || 
                   cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  try {
    const result = await api.validatePromoCode(code, subtotal);
    
    if (result.valid) {
      activePromoCode = code;
      
      promoStatus.innerHTML = `
        <div class="promo-success">
          <i data-lucide="check-circle"></i>
          <span>${result.message}</span>
          <button onclick="checkoutModule.removePromoCode()" class="remove-promo">
            <i data-lucide="x"></i>
          </button>
        </div>
      `;
      promoStatus.style.display = 'block';
      promoInput.disabled = true;
      
      await recalculatePrices();
      
      showToast(
        lang === 'ar' ? 'تم بنجاح!' : 'Success!',
        result.message,
        'success'
      );
    }
    
  } catch (error) {
    console.error('Promo validation failed:', error);
    
    // ✅ استخدام getErrorMessage إذا كان موجود
    let errorMessage = error.message;
    if (typeof api.getErrorMessage === 'function') {
      errorMessage = api.getErrorMessage(error, lang);
    }
    
    promoStatus.innerHTML = `
      <div class="promo-error">
        <i data-lucide="alert-circle"></i>
        <span>${errorMessage}</span>
      </div>
    `;
    promoStatus.style.display = 'block';
    
    showToast(lang === 'ar' ? 'خطأ' : 'Error', errorMessage, 'error');
  } finally {
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
}

export async function removePromoCode() {
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

/*
// ================================================================
// CHECKOUT CORE - الوظائف الأساسية (FIXED VERSION)
// ================================================================

import { cart, clearCart } from '../cart.js';
import { api } from '../api.js';
import { storage } from '../storage.js';
import { showToast, generateUUID } from '../utils.js';

// ================================================================
// المتغيرات العامة
// ================================================================
export let selectedDeliveryMethod = null;
export let selectedBranch = null;
export let userLocation = null;
export let currentOrderData = null;
export let calculatedPrices = null;
export let activePromoCode = null;

// ================================================================
// Setters (للسماح بالتعديل من خارج الملف)
// ================================================================
export function setDeliveryMethod(method) {
  selectedDeliveryMethod = method;
}

export function setBranch(branch) {
  selectedBranch = branch;
}

export function setUserLocation(location) {
  userLocation = location;
}

export function setCalculatedPrices(prices) {
  calculatedPrices = prices;
}

export function setActivePromoCode(code) {
  activePromoCode = code;
}

// ================================================================
// بدء عملية الشراء
// ================================================================
export async function initiateCheckout() {
  if (!cart || cart.length === 0) {
    const lang = window.currentLang || 'ar';
    showToast(
      lang === 'ar' ? 'السلة فارغة' : 'Cart is empty',
      lang === 'ar' ? 'أضف بعض المنتجات أولاً' : 'Add some products first',
      'error'
    );
    return;
  }
  
  // إعادة تعيين
  selectedDeliveryMethod = null;
  selectedBranch = null;
  calculatedPrices = null;
  activePromoCode = null;
  
  // استدعاء باقي الوظائف من الموديولات الأخرى
  const { resetFormFields, fillSavedUserData, resetCheckoutUI } = await import('./checkout-ui.js');
  const { updateOrderSummary } = await import('./checkout-ui.js');
  const { loadBranches } = await import('./checkout-delivery.js');
  
  await loadBranches();
  resetFormFields();
  fillSavedUserData();
  updateOrderSummary();
  resetCheckoutUI();
  
  // إظهار Modal
  const modal = document.getElementById('checkoutModal');
  if (modal) {
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
  }
  
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// ================================================================
// إعادة حساب الأسعار من Backend
// ================================================================
export async function recalculatePrices() {
  if (!selectedDeliveryMethod) {
    calculatedPrices = null;
    const { updateOrderSummary } = await import('./checkout-ui.js');
    updateOrderSummary();
    return;
  }

  try {
    // الحصول على رقم الهاتف للـ loyalty calculation
    const { getCustomerPhone } = await import('./checkout-loyalty.js');
    const customerPhone = getCustomerPhone();
    
    const request = {
      items: cart.map(item => ({ 
        productId: item.id || item.productId, 
        quantity: item.quantity 
      })),
      deliveryMethod: selectedDeliveryMethod,
      branch: selectedBranch,
      promoCode: activePromoCode,
      location: userLocation,
      customerPhone: customerPhone // ✅ للـ loyalty
    };

    console.log('📤 Requesting prices:', request);

    const result = await api.request('POST', '/orders/prices', request);
    
    // ✅ FIX: استخدام result.data بدلاً من result مباشرة
    calculatedPrices = result.data?.calculatedPrices || result.data;

    console.log('✅ Prices calculated:', calculatedPrices);
    
    const { updateOrderSummary } = await import('./checkout-ui.js');
    updateOrderSummary();

  } catch (error) {
    console.error('❌ Failed to calculate prices:', error);
    calculatedPrices = null;
    const { updateOrderSummary } = await import('./checkout-ui.js');
    updateOrderSummary();
  }
}

// ================================================================
// تأكيد الطلب
// ================================================================
export async function confirmOrder() {
  const lang = window.currentLang || 'ar';
  
  // استدعاء التحقق من الصحة
  const { validateOrder } = await import('./checkout-validation.js');
  const validation = validateOrder();
  
  if (!validation.valid) {
    showToast(
      lang === 'ar' ? 'خطأ' : 'Error',
      validation.message,
      'error'
    );
    return;
  }
  
  const { closeCheckoutModal, showProcessingModal } = await import('./checkout-ui.js');
  
  closeCheckoutModal();
  showProcessingModal(true, false);
  
  // تحضير البيانات
  const orderData = {
    items: cart.map(item => ({
      productId: item.id || item.productId,
      quantity: item.quantity
    })),
    customer: validation.customer,
    customerPhone: validation.customer.phone, // ✅ FIX: إضافة customerPhone للـ loyalty
    deliveryMethod: selectedDeliveryMethod,
    branch: selectedBranch,
    location: userLocation,
    promoCode: activePromoCode,
    idempotencyKey: generateUUID()
  };
  
  console.log('📤 Submitting order:', orderData);
  
  try {
    const result = await api.submitOrder(orderData);
    console.log('✅ Order submitted:', result);
    
    const { orderId, eta, etaEn, calculatedPrices: prices, loyaltyReward } = result;
    
    currentOrderData = {
      id: orderId,
      customer: orderData.customer,
      deliveryMethod: selectedDeliveryMethod,
      branch: selectedBranch,
      items: prices.items,
      calculatedPrices: prices,
      loyaltyReward
    };
    
    // حفظ بيانات المستخدم
    const userData = {
      name: validation.customer.name,
      phone: validation.customer.phone,
      visitCount: (storage.getUserData()?.visitCount || 0) + 1
    };
    storage.setUserData(userData);
    
    clearCart();
    showProcessingModal(false);
    
    const { showConfirmedModal } = await import('./checkout-ui.js');
    const itemsText = prices.items.map(i => `${i.name} × ${i.quantity}`).join(', ');
    showConfirmedModal(orderId, eta, validation.customer.phone, itemsText, currentOrderData);
    
    // ✅ FIX: حماية استدعاء showTierUpgradeModal
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
    
    showToast(
      lang === 'ar' ? 'تم إرسال الطلب بنجاح! 🎉' : 'Order sent successfully! 🎉',
      eta,
      'success'
    );
    
    api.trackEvent({
      name: 'order_completed',
      orderId: orderId,
      total: prices.total,
      itemsCount: prices.items.length
    });
    
  } catch (error) {
    console.error('❌ Order failed:', error);
    showProcessingModal(false);
    
    // ✅ FIX: حماية استدعاء getErrorMessage
    let errorMessage = error.message || (lang === 'ar' ? 'حدث خطأ' : 'An error occurred');
    
    if (typeof api.getErrorMessage === 'function') {
      errorMessage = api.getErrorMessage(error, lang);
    }
    
    showToast(
      lang === 'ar' ? 'فشل إرسال الطلب' : 'Order Failed',
      errorMessage,
      'error'
    );
    
    const modal = document.getElementById('checkoutModal');
    if (modal) modal.classList.add('show');
    
    api.trackEvent({
      name: 'order_failed',
      error: error.message,
      step: 'submission'
    });
  }
}

// ================================================================
// كود الخصم
// ================================================================
export async function applyPromoCode() {
  const promoInput = document.getElementById('promoCodeInput');
  const promoStatus = document.getElementById('promoStatus');
  
  if (!promoInput || !promoStatus) return;
  
  const lang = window.currentLang || 'ar';
  const code = promoInput.value.trim();
  
  if (!code) {
    showToast(
      lang === 'ar' ? 'خطأ' : 'Error',
      lang === 'ar' ? 'الرجاء إدخال كود الخصم' : 'Please enter promo code',
      'error'
    );
    return;
  }
  
  // ✅ FIX: استخدام subtotal من calculatedPrices إذا كان موجود
  // لأن الـ subtotal هنا يجب أن يكون بعد loyalty discount
  const subtotal = calculatedPrices?.subtotal || 
                   cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  try {
    const result = await api.validatePromoCode(code, subtotal);
    
    if (result.valid) {
      activePromoCode = code;
      
      promoStatus.innerHTML = `
        <div class="promo-success">
          <i data-lucide="check-circle"></i>
          <span>${result.message}</span>
          <button onclick="checkoutModule.removePromoCode()" class="remove-promo">
            <i data-lucide="x"></i>
          </button>
        </div>
      `;
      promoStatus.style.display = 'block';
      promoInput.disabled = true;
      
      await recalculatePrices();
      
      showToast(
        lang === 'ar' ? 'تم بنجاح!' : 'Success!',
        result.message,
        'success'
      );
    }
    
  } catch (error) {
    console.error('Promo validation failed:', error);
    
    // ✅ FIX: حماية استدعاء getErrorMessage
    let errorMessage = error.message || (lang === 'ar' ? 'كود غير صحيح' : 'Invalid code');
    
    if (typeof api.getErrorMessage === 'function') {
      errorMessage = api.getErrorMessage(error, lang);
    }
    
    promoStatus.innerHTML = `
      <div class="promo-error">
        <i data-lucide="alert-circle"></i>
        <span>${errorMessage}</span>
      </div>
    `;
    promoStatus.style.display = 'block';
    
    showToast(lang === 'ar' ? 'خطأ' : 'Error', errorMessage, 'error');
  } finally {
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
}

export async function removePromoCode() {
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
}*/