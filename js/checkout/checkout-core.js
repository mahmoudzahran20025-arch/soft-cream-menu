/*

## 📊 **Data Flow المحدث:**
```
┌─────────────────────────────────────────────────────┐
│              Frontend (Client)                       │
├─────────────────────────────────────────────────────┤
│                                                      │
│  1. Cart: [{productId, quantity}]                   │
│     ↓                                                │
│  2. prepareCartItemsForSubmit()                      │
│     ↓ IDs only!                                      │
│  3. api.submitOrder({items: [{productId, qty}]})     │
│     ↓                                                │
└─────────────────────┬───────────────────────────────┘
                      │
                      │ HTTPS POST (IDs only)
                      ↓
┌─────────────────────────────────────────────────────┐
│              Backend (Workers/GAS)                   │
├─────────────────────────────────────────────────────┤
│                                                      │
│  4. Receives: [{productId, quantity}]                │
│     ↓                                                │
│  5. Looks up prices from database                    │
│     ↓                                                │
│  6. Calculates:                                      │
│     - subtotal (from DB prices)                      │
│     - delivery fee                                   │
│     - discount (if promo code)                       │
│     - total                                          │
│     ↓                                                │
│  7. Saves order with calculated prices               │
│     ↓                                                │
│  8. Returns: {orderId, calculatedPrices, eta}        │
│     ↓                                                │
└─────────────────────┬───────────────────────────────┘
                      │
                      │ HTTPS Response
                      ↓
┌─────────────────────────────────────────────────────┐
│              Frontend (Client)                       │
├─────────────────────────────────────────────────────┤
│                                                      │
│  9. Receives calculatedPrices (read-only)            │
│     ↓                                                │
│  10. Shows success modal with prices                 │
│     ↓                                                │
│  11. enrichCartItemsForDisplay() for local display   │
│                                                      │
*/
/*
## 📊 **Data Flow المحدث:**
```
┌─────────────────────────────────────────────────────┐
│              Frontend (Client)                       │
├─────────────────────────────────────────────────────┤
│                                                      │
│  1. Cart: [{productId, quantity}]                   │
│     ↓                                                │
│  2. prepareCartItemsForSubmit()                      │
│     ↓ IDs only!                                      │
│  3. api.submitOrder({items: [{productId, qty}]})     │
│     ↓                                                │
└─────────────────────┬───────────────────────────────┘
                      │
                      │ HTTPS POST (IDs only)
                      ↓
┌─────────────────────────────────────────────────────┐
│              Backend (Workers/GAS)                   │
├─────────────────────────────────────────────────────┤
│                                                      │
│  4. Receives: [{productId, quantity}]                │
│     ↓                                                │
│  5. Looks up prices from database                    │
│     ↓                                                │
│  6. Calculates:                                      │
│     - subtotal (from DB prices)                      │
│     - delivery fee                                   │
│     - discount (if coupon code)                      │
│     - total                                          │
│     ↓                                                │
│  7. Saves order with calculated prices               │
│     ↓                                                │
│  8. Returns: {orderId, calculatedPrices, eta}        │
│     ↓                                                │
└─────────────────────┬───────────────────────────────┘
                      │
                      │ HTTPS Response
                      ↓
┌─────────────────────────────────────────────────────┐
│              Frontend (Client)                       │
├─────────────────────────────────────────────────────┤
│                                                      │
│  9. Receives calculatedPrices (read-only)            │
│     ↓                                                │
│  10. Shows success modal with prices                 │
│     ↓                                                │
│  11. enrichCartItemsForDisplay() for local display   │
│                                                      │
*/
// ================================================================
// CHECKOUT CORE - الوظائف الأساسية (FIXED VERSION)
// ================================================================
// checkout-core.js (UPDATED - compatible with smart delivery & normalized deliveryInfo)
// ================================================================
// CHECKOUT CORE - الوظائف الأساسية (FINAL CLEAN VERSION)
// ✅ Zero Duplication - Single Source of Truth
// ✅ Full Compatibility with api.js
// ✅ Smart Delivery Support
// ================================================================

console.log('🔄 Loading checkout-core.js (FINAL VERSION)');

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
export let activeCouponCode = null;

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

export function setActiveCouponCode(code) {
  console.log('🔄 Setting active coupon code:', code);
  activeCouponCode = code;
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

export function getActiveCouponCode() {
  return activeCouponCode;
}

export function getCurrentOrderData() {
  return currentOrderData;
}

// ================================================================
// ✅ دالة لإثراء عناصر السلة للعرض فقط (مع الأسعار)
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
// ✅ دالة لتحضير عناصر السلة للإرسال (بدون أسعار)
// ================================================================
async function prepareCartItemsForSubmit(cartItems) {
  const preparedItems = [];
  
  for (const item of cartItems) {
    try {
      const product = await productsManager.getProduct(item.productId);
      
      if (product) {
        preparedItems.push({
          productId: item.productId,
          quantity: item.quantity
          // ✅ NO PRICES - Backend will calculate
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
// ✅ recalculatePrices - CLEANED VERSION
// ✅ Uses api._normalizeDeliveryInfo() - NO DUPLICATION
// ================================================================
export async function recalculatePrices() {
  console.log('🔄 Recalculating prices...');
  console.log('🔄 Current cart:', getCartLength(), 'items');

  // التحقق من وجود طريقة توصيل
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

  // التحقق من السلة
  if (isCartEmpty()) {
    console.warn('⚠️ Cart is empty, cannot calculate prices');
    calculatedPrices = null;
    return;
  }

  try {
    const currentCart = getCart();
    
    // ✅ تحضير العناصر (IDs فقط)
    const itemsForAPI = await prepareCartItemsForSubmit(currentCart);
    
    if (itemsForAPI.length === 0) {
      throw new Error('No valid items in cart');
    }
    
    console.log('📦 Items for API (IDs only):', itemsForAPI);
    
    // ✅ Get customer phone
    let customerPhone = null;
    const phoneInput = document.getElementById('customerPhone');
    if (phoneInput && phoneInput.value) {
      customerPhone = phoneInput.value;
    }
    
    // ✅ تحديد نوع الإدخال
    let addressInputType = null;
    let deliveryAddress = null;
    
    if (selectedDeliveryMethod === 'delivery') {
      const addressInput = document.getElementById('customerAddress');
      
      if (userLocation?.lat && userLocation?.lng) {
        addressInputType = 'gps';
        deliveryAddress = addressInput?.value || null;
      } else if (addressInput && addressInput.value) {
        addressInputType = 'manual';
        deliveryAddress = addressInput.value;
      }
    }
    
    console.log('📤 Requesting price calculation:', {
      items: itemsForAPI.length + ' items',
      deliveryMethod: selectedDeliveryMethod,
      couponCode: activeCouponCode,
      customerPhone: customerPhone,
      hasLocation: !!userLocation?.lat,
      addressInputType,
      hasAddress: !!deliveryAddress
    });

    // ✅ استدعاء API (يقوم بـ normalize تلقائياً)
    let finalPrices;
    try {
      finalPrices = await api.calculateOrderPrices(
        itemsForAPI,
        activeCouponCode,
        selectedDeliveryMethod,
        customerPhone,
        userLocation,
        addressInputType
      );
    } catch (err) {
      console.error('❌ api.calculateOrderPrices failed:', err);
      throw err;
    }

    console.log('📥 Received prices from API:', finalPrices);
    
    if (!finalPrices || !finalPrices.items) {
      throw new Error('Invalid price data received');
    }

    // ✅ SINGLE SOURCE OF TRUTH: استخدم api method مباشرة
    finalPrices.deliveryInfo = api._normalizeDeliveryInfo(finalPrices.deliveryInfo || {});

    // ✅ التحقق من الرسوم التقديرية
    if (api._isDeliveryEstimated(finalPrices.deliveryInfo)) {
      const lang = window.currentLang || 'ar';
      console.warn('⚠️ Delivery fee is estimated - confirmation required');
      console.warn('📢 Message:', api._getEstimatedMessage(finalPrices.deliveryInfo, lang));
    }
    
    calculatedPrices = finalPrices;
    console.log('✅ Prices calculated successfully:', {
      subtotal: calculatedPrices.subtotal,
      deliveryFee: calculatedPrices.deliveryFee,
      discount: calculatedPrices.discount,
      total: calculatedPrices.total,
      isEstimated: calculatedPrices.deliveryInfo.isEstimated
    });
    
    // Update UI
    try {
      const { updateOrderSummary } = await import('./checkout-ui.js');
      updateOrderSummary();
    } catch (err) {
      console.warn('⚠️ Could not update order summary:', err);
    }

  } catch (error) {
    console.error('❌ Failed to calculate prices:', error);
    
    // ✅ Fallback calculation (offline mode)
    try {
      const lang = window.currentLang || 'ar';
      const currentCart = getCart();
      const enrichedItems = await enrichCartItemsForDisplay(currentCart);
      const subtotal = enrichedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const deliveryFee = selectedDeliveryMethod === 'delivery' ? 20 : 0;
      const discount = activeCouponCode ? Math.round(subtotal * 0.1) : 0;
      const total = subtotal + deliveryFee - discount;
      
      calculatedPrices = {
        items: enrichedItems.map(item => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.price * item.quantity
        })),
        subtotal,
        deliveryFee,
        discount,
        total,
        isOffline: true,
        offlineWarning: lang === 'ar' 
          ? '⚠️ الأسعار تقديرية - لا يوجد اتصال بالإنترنت'
          : '⚠️ Estimated prices - no internet connection',
        // ✅ استخدم api method حتى في fallback
        deliveryInfo: api._normalizeDeliveryInfo({ 
          deliveryFee, 
          isEstimated: 1,
          estimatedMessage: {
            ar: 'رسوم تقديرية - لا يوجد اتصال',
            en: 'Estimated fee - no connection'
          }
        })
      };
      
      console.log('⚠️ Using fallback price calculation (offline mode):', calculatedPrices);
      
      // Show offline warning
      showToast(
        lang === 'ar' ? '⚠️ وضع عدم الاتصال' : '⚠️ Offline Mode',
        lang === 'ar' ? 'الأسعار تقديرية' : 'Prices are estimated',
        'warning',
        4000
      );
      
    } catch (fallbackError) {
      console.error('❌ Fallback calculation also failed:', fallbackError);
      calculatedPrices = null;
    }
    
    // Update UI
    try {
      const { updateOrderSummary } = await import('./checkout-ui.js');
      updateOrderSummary();
    } catch (err) {
      console.warn('⚠️ Could not update order summary:', err);
    }
  }
}

// ================================================================
// ✅ confirmOrder - CLEANED VERSION
// ✅ Uses api methods - NO DUPLICATION
// ================================================================
export async function confirmOrder() {
  console.log('🔄 Starting order confirmation...');
  console.log('🔄 Current cart:', getCartLength(), 'items');
  
  const lang = window.currentLang || 'ar';
  
  // التحقق من السلة
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
    // ✅ Validate order
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
    
    // ✅ Close checkout modal and show processing
    const { closeCheckoutModal, showProcessingModal } = await import('./checkout-ui.js');
    
    closeCheckoutModal();
    showProcessingModal(true, false);
    
    const currentCart = getCart();
    const itemsToSubmit = await prepareCartItemsForSubmit(currentCart);
    
    if (itemsToSubmit.length === 0) {
      throw new Error(lang === 'ar' ? 'فشل في تحميل بيانات المنتجات' : 'Failed to load product data');
    }
    
    console.log('📦 Items to submit (IDs only):', itemsToSubmit);
    
    // ✅ تحديد نوع الإدخال
    let addressInputType = null;
    let deliveryAddress = null;
    
    if (selectedDeliveryMethod === 'delivery') {
      if (userLocation?.lat && userLocation?.lng) {
        addressInputType = 'gps';
        deliveryAddress = validation.customer.address;
      } else if (validation.customer.address) {
        addressInputType = 'manual';
        deliveryAddress = validation.customer.address;
      }
    }
    
    // ✅ Ensure deviceId exists
    const deviceId = storage.getDeviceId() || null;
    if (!deviceId) {
      console.warn('⚠️ deviceId is missing (non-fatal)');
    }

    // ✅ Prepare order data (IDs only!)
    const orderData = {
      items: itemsToSubmit,
      customer: validation.customer,
      customerPhone: validation.customer.phone,
      deliveryMethod: selectedDeliveryMethod,
      branch: selectedBranch?.id || selectedBranch || null,
      location: userLocation,
      addressInputType: addressInputType,
      deliveryAddress: deliveryAddress,
      couponCode: activeCouponCode,
      deviceId: deviceId,
      idempotencyKey: generateUUID()
    };
      
    console.log('📤 Submitting order:', {
      items: orderData.items.length + ' items (IDs only)',
      addressInputType,
      hasLocation: !!orderData.location?.lat,
      hasAddress: !!orderData.deliveryAddress,
      hasCoupon: !!orderData.couponCode
    });
    
    // ✅ Submit order
    const result = await api.submitOrder(orderData);
    console.log('✅ Order submitted, received raw result:', result);
    
    // ✅ Normalize server response shape
    const resp = result && result.data ? result.data : result;
    const orderId = resp.orderId || resp.id || resp.data?.orderId || resp.data?.id;
    const eta = resp.eta || resp.data?.eta || null;
    const etaEn = resp.etaEn || resp.data?.etaEn || null;
    const serverPrices = resp.calculatedPrices || resp.data?.calculatedPrices || resp.calculatedPrices || null;
    
    if (!orderId) {
      throw new Error('No order ID received from server');
    }
    
    // ✅ SINGLE SOURCE OF TRUTH: استخدم api method
    const deliveryInfo = api._normalizeDeliveryInfo(
      serverPrices?.deliveryInfo || calculatedPrices?.deliveryInfo || {}
    );
    
    // ✅ تحذير إذا كانت الرسوم تقديرية
    if (api._isDeliveryEstimated(deliveryInfo)) {
      console.warn('⚠️ Order placed with estimated delivery fee');
      showToast(
        lang === 'ar' ? 'ملاحظة هامة' : 'Important Note',
        api._getEstimatedMessage(deliveryInfo, lang),
        'warning',
        6000
      );
    }
    
    // ✅ Update current order data
    currentOrderData = {
      id: orderId,
      customer: orderData.customer,
      deliveryMethod: selectedDeliveryMethod,
      branch: orderData.branch,
      items: serverPrices?.items || calculatedPrices?.items || [],
      calculatedPrices: serverPrices || calculatedPrices
    };
    
    // ✅ Save user data
    const userData = {
      name: validation.customer.name,
      phone: validation.customer.phone,
      visitCount: (storage.getUserData()?.visitCount || 0) + 1,
      lastOrderDate: new Date().toISOString()
    };
    storage.setUserData(userData);
    
    // ✅ حفظ الطلب في localStorage
    const orderToSave = {
      id: orderId,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      items: (serverPrices?.items || calculatedPrices?.items || []).map(item => ({
        productId: item.productId || item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.total || (item.price * item.quantity)
      })),
      totals: {
        subtotal: (serverPrices || calculatedPrices)?.subtotal || 0,
        deliveryFee: (serverPrices || calculatedPrices)?.deliveryFee || 0,
        discount: (serverPrices || calculatedPrices)?.discount || 0,
        total: (serverPrices || calculatedPrices)?.total || 0
      },
      deliveryMethod: selectedDeliveryMethod,
      branch: orderData.branch,
      customer: {
        name: validation.customer.name,
        phone: validation.customer.phone,
        address: validation.customer.address || null
      },
      eta: eta || etaEn || (lang === 'ar' ? '30-45 دقيقة' : '30-45 minutes'),
      couponCode: activeCouponCode || null,
      deliveryInfo: deliveryInfo // ✅ معلومات التوصيل المعيارية
    };
    
    const saveSuccess = storage.addOrder(orderToSave);
    if (saveSuccess) {
      console.log('✅ Order saved locally:', orderId);
      // ✅ Dispatch event to update orders badge
      window.dispatchEvent(new CustomEvent('ordersUpdated', { 
        detail: { orderId, action: 'added' } 
      }));
    } else {
      console.warn('⚠️ Failed to save order locally (non-critical)');
    }
    
    // ✅ إثراء العناصر للعرض
    const enrichedItemsForDisplay = await enrichCartItemsForDisplay(currentCart);

    // ✅ CRITICAL: Tell React to clear its cart first
    // React will then sync to Vanilla via the bridge
    console.log('🆕 Firing event to clear React cart after order...');
    window.dispatchEvent(new CustomEvent('clear-react-cart-after-order', {
      detail: { orderId, timestamp: Date.now() }
    }));
    
    // ✅ Also clear Vanilla cart directly (as fallback if React is not active)
    clearCart();
    
    // ✅ Dispatch events to update UI
    window.dispatchEvent(new CustomEvent('cart-updated'));
    window.dispatchEvent(new CustomEvent('order-placed', { detail: { orderId, orderData: orderToSave } }));
    
    // ✅ Hide processing modal
    showProcessingModal(false);
    
    // ✅ Show success modal
    const { showConfirmedModal } = await import('./checkout-ui.js');
    
    const itemsText = (serverPrices?.items || enrichedItemsForDisplay)
      .map(i => `${i.name} × ${i.quantity}`)
      .join(', ');
    
    showConfirmedModal(
      orderId, 
      eta || etaEn || (lang === 'ar' ? '30-45 دقيقة' : '30-45 minutes'), 
      validation.customer.phone, 
      itemsText, 
      currentOrderData
    );
    
    // ✅ Show success toast
    showToast(
      lang === 'ar' ? 'تم إرسال الطلب بنجاح! 🎉' : 'Order sent successfully! 🎉',
      eta || etaEn || (lang === 'ar' ? 'سيصل خلال 30-45 دقيقة' : 'Will arrive in 30-45 minutes'),
      'success',
      5000
    );
    
    // ✅ Track event (non-critical)
    try {
      await api.trackEvent({
        name: 'order_completed',
        orderId: orderId,
        total: (serverPrices || calculatedPrices)?.total || 0,
        itemsCount: itemsToSubmit.length,
        deliveryMethod: selectedDeliveryMethod,
        hasEstimatedFee: deliveryInfo.isEstimated
      });
    } catch (trackError) {
      console.warn('⚠️ Analytics tracking failed (non-critical):', trackError.message);
    }
    
  } catch (error) {
    console.error('❌ Order confirmation failed:', error);
    
    // ✅ Hide processing modal
    try {
      const { showProcessingModal } = await import('./checkout-ui.js');
      showProcessingModal(false);
    } catch (err) {
      console.warn('⚠️ Could not hide processing modal:', err);
    }
    
    // ✅ Get error message (with lang support)
    const errorMessage = api.getErrorMessage(error, lang);
    
    // ✅ Show error
    showToast(
      lang === 'ar' ? 'فشل إرسال الطلب' : 'Order Failed',
      errorMessage,
      'error',
      5000
    );
    
    // ✅ Reopen checkout modal
    const modal = document.getElementById('checkoutModal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('show');
      modal.style.display = 'flex';
    }
    
    // ✅ Track error (non-critical)
    try {
      await api.trackEvent({
        name: 'order_failed',
        error: error.message,
        step: 'submission',
        errorCode: error.status || 'unknown'
      });
    } catch (trackError) {
      console.warn('⚠️ Error tracking failed (non-critical):', trackError.message);
    }
  }
}

// ================================================================
// ✅ applyCoupon
// ================================================================
export async function applyCoupon() {
  console.log('🔄 Applying coupon code...');
  
  const couponInput = document.getElementById('couponCodeInput');
  const couponStatus = document.getElementById('couponStatus');
  
  if (!couponInput || !couponStatus) {
    console.warn('⚠️ Coupon input elements not found');
    return;
  }

  const lang = window.currentLang || 'ar';
  const code = couponInput.value.trim().toUpperCase();
  
  if (!code) {
    showToast(
      lang === 'ar' ? 'خطأ' : 'Error',
      lang === 'ar' ? 'الرجاء إدخال كود الخصم' : 'Please enter coupon code',
      'error'
    );
    return;
  }
  
  const applyBtn = document.getElementById('applyPromoBtn');
  if (applyBtn) {
    applyBtn.disabled = true;
    applyBtn.innerHTML = '<i data-lucide="loader"></i><span>جاري التحقق...</span>';
  }
  
  try {
    let subtotal = calculatedPrices?.subtotal || 0;
    
    // حساب subtotal من السلة إذا لم يكن موجوداً
    if (!subtotal && !isCartEmpty()) {
      const currentCart = getCart();
      const enrichedItems = await enrichCartItemsForDisplay(currentCart);
      subtotal = enrichedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }
    
    console.log('📤 Validating coupon code:', { code, subtotal });
    
    // ✅ جلب رقم الهاتف
    let customerPhone = null;
    const phoneInput = document.getElementById('customerPhone');
    if (phoneInput && phoneInput.value) {
      customerPhone = phoneInput.value;
    }
    
    // ✅ استدعاء API للتحقق
    const result = await api.validateCoupon(
      code, 
      customerPhone || '0000000000', 
      subtotal
    );
    
    if (result.valid) {
      console.log('✅ Coupon code validated:', result);
      
      activeCouponCode = code;
      
      // ✅ عرض رسالة النجاح
      const successMessage = result.coupon?.messageAr || result.message || 'تم تطبيق الكوبون بنجاح';
      
      couponStatus.innerHTML = `
        <div class="coupon-success" style="display: flex; align-items: center; gap: 8px; padding: 10px 12px; background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); border-radius: 8px; color: #2e7d32; border-left: 4px solid #4caf50;">
          <i data-lucide="check-circle" style="width: 18px; height: 18px; flex-shrink: 0;"></i>
          <span style="flex: 1; font-weight: 600;">${successMessage}</span>
          <button onclick="window.removeCoupon?.()" class="remove-coupon" style="background: none; border: none; color: #d32f2f; cursor: pointer; padding: 4px 8px; border-radius: 4px; transition: background 0.2s;" onmouseover="this.style.background='rgba(211,47,47,0.1)'" onmouseout="this.style.background='none'">
            <i data-lucide="x" style="width: 16px; height: 16px;"></i>
          </button>
        </div>
      `;
      couponStatus.style.display = 'block';
      couponInput.disabled = true;
      
      // ✅ إعادة حساب الأسعار مع الكوبون
      await recalculatePrices();
      
      // ✅ عرض toast
      showToast(
        lang === 'ar' ? 'تم بنجاح! 🎉' : 'Success! 🎉',
        successMessage,
        'success',
        4000
      );
    } else {
      throw new Error(result.error || result.message || 'كود الخصم غير صحيح');
    }
    
  } catch (error) {
    console.error('❌ Coupon code validation failed:', error);
    
    // ✅ الحصول على رسالة الخطأ
    let errorMessage = error.message || (lang === 'ar' ? 'كود الخصم غير صحيح' : 'Invalid coupon code');
    if (typeof api.getErrorMessage === 'function') {
      errorMessage = api.getErrorMessage(error, lang);
    }
    
    // ✅ عرض رسالة الخطأ
    couponStatus.innerHTML = `
      <div class="coupon-error" style="display: flex; align-items: center; gap: 8px; padding: 10px 12px; background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%); border-radius: 8px; color: #c62828; border-left: 4px solid #f44336;">
        <i data-lucide="alert-circle" style="width: 18px; height: 18px; flex-shrink: 0;"></i>
        <span style="font-weight: 600;">${errorMessage}</span>
      </div>
    `;
    couponStatus.style.display = 'block';
    
    showToast(
      lang === 'ar' ? 'خطأ' : 'Error', 
      errorMessage, 
      'error',
      4000
    );
    
  } finally {
    // ✅ إعادة تفعيل الزر
    if (applyBtn) {
      applyBtn.disabled = false;
      applyBtn.innerHTML = `<span id="apply-promo-text">${lang === 'ar' ? 'تطبيق' : 'Apply'}</span>`;
    }
    
    // ✅ تحديث الأيقونات
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }
}

// ================================================================
// ✅ removeCoupon
// ================================================================
export async function removeCoupon() {
  console.log('🔄 Removing coupon code...');
  
  activeCouponCode = null;
  
  const couponInput = document.getElementById('couponCodeInput');
  const couponStatus = document.getElementById('couponStatus');
  
  if (couponInput) {
    couponInput.value = '';
    couponInput.disabled = false;
  }
  
  if (couponStatus) {
    couponStatus.style.display = 'none';
    couponStatus.innerHTML = '';
  }
  
  // ✅ إعادة حساب الأسعار بدون الكوبون
  await recalculatePrices();
  
  const lang = window.currentLang || 'ar';
  showToast(
    lang === 'ar' ? 'تم' : 'Done',
    lang === 'ar' ? 'تم إزالة كود الخصم' : 'Coupon code removed',
    'info',
    3000
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
  activeCouponCode = null;
  
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
    activeCouponCode,
    cartItems: getCartLength(),
    cartContent: getCart(),
    timestamp: new Date().toISOString()
  };
}

// ================================================================
// ✅ Global Function Registration
// ================================================================
if (typeof window !== 'undefined') {
  window.applyCoupon = applyCoupon;
  window.removeCoupon = removeCoupon;
  window.getCheckoutDebugInfo = getCheckoutDebugInfo;
  console.log('✅ Global coupon functions registered');
}

console.log('✅ checkout-core.js loaded successfully (FINAL CLEAN VERSION)');
console.log('📊 Features: Zero Duplication | Single Source of Truth | Full API Compatibility');