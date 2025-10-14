// ================================================================
// checkout.js - نظام إتمام الطلب المتكامل مع API
// CRITICAL: All prices calculated server-side
// ================================================================

import { cart, calculateCartTotals, clearCart, closeCartModal } from './cart.js';
import { showToast, generateUUID, calculateDistance, setupFocusTrap } from './utils.js';
import { api } from './api.js';
import { storage } from './storage.js';

// ================================================================
// ===== متغيرات عامة =====
// ================================================================
let selectedDeliveryMethod = null;
let selectedBranch = null;
let userLocation = null;
let currentOrderData = null;
let calculatedPrices = null; // Prices from backend
let activePromoCode = null; // Active promo code

// ================================================================
// ===== بيانات الفروع (يتم تحميلها من Backend) =====
// ================================================================
export let branches = {};

// ================================================================
// ===== تحميل الفروع من Backend =====
// ================================================================
async function loadBranches() {
  try {
    const branchesData = await api.getBranches();
    
    // Convert array to object
    branches = {};
    branchesData.forEach(branch => {
      branches[branch.id] = {
        name: { ar: branch.name, en: branch.nameEn },
        address: { ar: branch.address, en: branch.address },
        location: { lat: branch.lat, lng: branch.lng },
        phone: branch.phone,
        available: branch.available
      };
    });
    
    console.log('✅ Branches loaded from backend:', Object.keys(branches).length);
    
    // تحديث واجهة اختيار الفروع
    renderBranchSelection();
    
  } catch (error) {
    console.error('❌ Failed to load branches:', error);
    
    // Fallback to default branches
    branches = {
      maadi: {
        name: { ar: 'المعادي', en: 'Maadi' },
        address: { ar: 'شارع 9، المعادي', en: '9 St, Maadi' },
        location: { lat: 29.9602, lng: 31.2494 }
      },
      zamalek: {
        name: { ar: 'الزمالك', en: 'Zamalek' },
        address: { ar: 'شارع 26 يوليو، الزمالك', en: '26th of July St, Zamalek' },
        location: { lat: 30.0626, lng: 31.2188 }
      },
      downtown: {
        name: { ar: 'وسط البلد', en: 'Downtown' },
        address: { ar: 'شارع طلعت حرب، وسط البلد', en: 'Talaat Harb St, Downtown' },
        location: { lat: 30.0444, lng: 31.2357 }
      }
    };
  }
}

// ================================================================
// ===== عرض اختيار الفروع =====
// ================================================================
function renderBranchSelection() {
  const branchSelection = document.getElementById('branchSelection');
  if (!branchSelection) return;
  
  const lang = window.currentLang || 'ar';
  const branchesContainer = branchSelection.querySelector('.branches-grid') || 
                            branchSelection.querySelector('.branch-options');
  
  if (!branchesContainer) return;
  
  let html = '';
  
  Object.keys(branches).forEach(branchId => {
    const branch = branches[branchId];
    if (!branch.available && branch.available !== undefined) return;
    
    html += `
      <div class="branch-card" data-branch="${branchId}" onclick="checkoutModule.selectBranch('${branchId}')">
        <div class="branch-icon">
          <i data-lucide="store"></i>
        </div>
        <div class="branch-info">
          <div class="branch-name">${branch.name[lang]}</div>
          <div class="branch-address">${branch.address[lang]}</div>
          ${userLocation ? `
            <div class="branch-distance" id="branch-${branchId}-distance">
              <i data-lucide="navigation"></i>
              <span>-- ${lang === 'ar' ? 'كم' : 'km'}</span>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  });
  
  branchesContainer.innerHTML = html;
  
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// ================================================================
// ===== بدء عملية الشراء =====
// ================================================================
export async function initiateCheckout() {
  // التحقق من وجود منتجات في السلة
  if (!cart || cart.length === 0) {
    const lang = window.currentLang || 'ar';
    showToast(
      lang === 'ar' ? 'السلة فارغة' : 'Cart is empty',
      lang === 'ar' ? 'أضف بعض المنتجات أولاً' : 'Add some products first',
      'error'
    );
    return;
  }
  
  // إغلاق نافذة السلة
  if (typeof closeCartModal === 'function') {
    closeCartModal();
  }
  
  // تحميل الفروع إذا لم تكن محملة
  if (Object.keys(branches).length === 0) {
    await loadBranches();
  }
  
  // إعادة تعيين الاختيارات
  selectedDeliveryMethod = null;
  selectedBranch = null;
  calculatedPrices = null;
  activePromoCode = null;
  
  // إعادة تعيين الحقول
  resetFormFields();
  
  // ملء البيانات المحفوظة
  fillSavedUserData();
  
  // تحديث ملخص الطلب (عرض أولي بدون خصومات)
  updateOrderSummary();
  
  // إعادة تعيين واجهة المستخدم
  resetCheckoutUI();
  
  // إظهار نافذة الدفع
  const checkoutModal = document.getElementById('checkoutModal');
  if (checkoutModal) {
    checkoutModal.classList.add('show');
    document.body.style.overflow = 'hidden';
  }
  
  // تحديث الأيقونات
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  
  console.log('✅ Checkout initiated');
}

// ================================================================
// ===== إعادة تعيين الحقول =====
// ================================================================
function resetFormFields() {
  const fields = ['customerName', 'customerPhone', 'customerAddress', 'orderNotes', 'promoCodeInput'];
  
  fields.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (field) field.value = '';
  });
  
  // إعادة تعيين حالة كود الخصم
  const promoStatus = document.getElementById('promoStatus');
  if (promoStatus) {
    promoStatus.style.display = 'none';
  }
}

// ================================================================
// ===== ملء بيانات المستخدم المحفوظة =====
// ================================================================
// في fillSavedUserData():
function fillSavedUserData() {
  const userData = storage.getUserData(); // ✅ استخدام storage
  
  if (userData) {
    const nameField = document.getElementById('customerName');
    const phoneField = document.getElementById('customerPhone');
    
    if (nameField && userData.name) nameField.value = userData.name;
    if (phoneField && userData.phone) phoneField.value = userData.phone;
  }
}

// ================================================================
// ===== إعادة تعيين واجهة المستخدم =====
// ================================================================
function resetCheckoutUI() {
  // إزالة التحديد من خيارات التوصيل
  document.querySelectorAll('.delivery-option').forEach(opt => {
    opt.classList.remove('selected');
  });
  
  // إزالة التحديد من الفروع
  document.querySelectorAll('.branch-card').forEach(card => {
    card.classList.remove('selected');
  });
  
  // إخفاء اختيار الفرع
  const branchSelection = document.getElementById('branchSelection');
  if (branchSelection) {
    branchSelection.style.display = 'none';
  }
  
  // إخفاء النموذج
  const checkoutForm = document.getElementById('checkoutForm');
  if (checkoutForm) {
    checkoutForm.classList.remove('show');
  }
}

// ================================================================
// ===== تحديث ملخص الطلب =====
// ================================================================
export function updateOrderSummary() {
  const orderItems = document.getElementById('orderItems');
  if (!orderItems) return;
  
  const lang = window.currentLang || 'ar';
  const translations = window.i18n.t || {};
  const t = translations[lang] || {};
  const currency = t.currency || 'ج.م';
  
  let html = '';
  
  // إذا كان لدينا أسعار محسوبة من Backend، استخدمها
  if (calculatedPrices) {
    // عرض المنتجات مع الأسعار المحسوبة
    calculatedPrices.items.forEach(item => {
      const name = lang === 'ar' ? item.name : (item.nameEn || item.name);
      html += `
        <div class="order-item">
          <div class="order-item-name">${name} × ${item.quantity}</div>
          <div class="order-item-price">${item.subtotal.toFixed(2)} ${currency}</div>
        </div>
      `;
    });
    
    // المبلغ الفرعي
    const subtotalText = lang === 'ar' ? 'المبلغ الفرعي' : 'Subtotal';
    html += `
      <div class="order-item">
        <div class="order-item-name">${subtotalText}</div>
        <div class="order-item-price">${calculatedPrices.subtotal.toFixed(2)} ${currency}</div>
      </div>
    `;
    
    // رسوم التوصيل
    if (calculatedPrices.deliveryFee > 0) {
      const deliveryText = lang === 'ar' ? 'رسوم التوصيل' : 'Delivery Fee';
      html += `
        <div class="order-item">
          <div class="order-item-name">${deliveryText}</div>
          <div class="order-item-price">${calculatedPrices.deliveryFee.toFixed(2)} ${currency}</div>
        </div>
      `;
    }
    
    // الخصم
    if (calculatedPrices.discount > 0) {
      const discountPercentage = Math.round((calculatedPrices.discount / calculatedPrices.subtotal) * 100);
      const discountText = lang === 'ar' 
        ? `خصم (${discountPercentage}%)`
        : `Discount (${discountPercentage}%)`;
      
      html += `
        <div class="order-item" style="color: #4CAF50;">
          <div class="order-item-name">${discountText}</div>
          <div class="order-item-price">-${calculatedPrices.discount.toFixed(2)} ${currency}</div>
        </div>
      `;
      
      // رسالة الخصم
      if (calculatedPrices.discountMessage) {
        html += `
          <div class="order-item" style="grid-column: 1 / -1;">
            <div class="promo-message" style="background: #e8f5e9; padding: 8px 12px; border-radius: 8px; font-size: 0.875rem; color: #2e7d32;">
              <i data-lucide="gift" style="width: 16px; height: 16px; display: inline-block; vertical-align: middle;"></i>
              ${calculatedPrices.discountMessage}
            </div>
          </div>
        `;
      }
    }
    
    // الإجمالي
    const totalText = lang === 'ar' ? 'الإجمالي' : 'Total';
    html += `
      <div class="order-item" style="font-weight: 700; font-size: 1.125rem; margin-top: 8px; padding-top: 8px; border-top: 2px solid var(--border);">
        <div class="order-item-name">${totalText}</div>
        <div class="order-item-price">${calculatedPrices.total.toFixed(2)} ${currency}</div>
      </div>
    `;
  } else {
    // عرض أولي بدون حسابات Backend (للعرض فقط)
    let subtotal = 0;
    
    cart.forEach(item => {
      const name = lang === 'ar' ? item.name : item.nameEn;
      const itemTotal = item.price * item.quantity;
      subtotal += itemTotal;
      
      html += `
        <div class="order-item">
          <div class="order-item-name">${name} × ${item.quantity}</div>
          <div class="order-item-price">${itemTotal.toFixed(2)} ${currency}</div>
        </div>
      `;
    });
    
    // رسوم التوصيل (تقديرية)
    const estimatedDeliveryFee = selectedDeliveryMethod === 'delivery' ? 15 : 0;
    if (estimatedDeliveryFee > 0) {
      const deliveryText = lang === 'ar' ? 'رسوم التوصيل (تقديرية)' : 'Delivery Fee (Estimated)';
      html += `
        <div class="order-item">
          <div class="order-item-name">${deliveryText}</div>
          <div class="order-item-price">${estimatedDeliveryFee} ${currency}</div>
        </div>
      `;
    }
    
    // الإجمالي التقديري
    const estimatedTotal = subtotal + estimatedDeliveryFee;
    const totalText = lang === 'ar' ? 'الإجمالي (تقديري)' : 'Total (Estimated)';
    
    html += `
      <div class="order-item" style="font-weight: 700; font-size: 1.125rem; margin-top: 8px; padding-top: 8px; border-top: 2px solid var(--border);">
        <div class="order-item-name">${totalText}</div>
        <div class="order-item-price">${estimatedTotal.toFixed(2)} ${currency}</div>
      </div>
    `;
    
    // ملاحظة
    const noteText = lang === 'ar' 
      ? '* الأسعار النهائية سيتم حسابها عند تأكيد الطلب'
      : '* Final prices will be calculated upon order confirmation';
    
    html += `
      <div class="order-item" style="grid-column: 1 / -1; margin-top: 8px;">
        <p style="font-size: 0.75rem; color: #666; text-align: center;">${noteText}</p>
      </div>
    `;
  }
  
  orderItems.innerHTML = html;
  
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// ================================================================
// ===== اختيار طريقة التوصيل =====
// ================================================================
export function selectDeliveryMethod(method) {
  selectedDeliveryMethod = method;
  
  const lang = window.currentLang || 'ar';
  
  // تحديث الواجهة
  document.querySelectorAll('.delivery-option').forEach(option => {
    option.classList.remove('selected');
  });
  
  const pickupOption = document.getElementById('pickupOption');
  const deliveryOption = document.getElementById('deliveryOption');
  const branchSelection = document.getElementById('branchSelection');
  const addressGroup = document.getElementById('addressGroup');
  const checkoutForm = document.getElementById('checkoutForm');
  
  if (method === 'pickup') {
    if (pickupOption) pickupOption.classList.add('selected');
    if (branchSelection) branchSelection.style.display = 'block';
    if (addressGroup) addressGroup.style.display = 'none';
    
    // إظهار النموذج فقط إذا تم اختيار فرع
    if (selectedBranch && checkoutForm) {
      checkoutForm.classList.add('show');
    } else if (checkoutForm) {
      checkoutForm.classList.remove('show');
    }
  } else {
    if (deliveryOption) deliveryOption.classList.add('selected');
    if (branchSelection) branchSelection.style.display = 'none';
    if (addressGroup) addressGroup.style.display = 'block';
    if (checkoutForm) checkoutForm.classList.add('show');
    
    selectedBranch = null;
    document.querySelectorAll('.branch-card').forEach(card => {
      card.classList.remove('selected');
    });
  }
  
  // إعادة حساب الأسعار مع طريقة التوصيل الجديدة
  recalculatePrices();
  updateOrderSummary();  // ✅ أضف بس هذا السطر

  
  // تحديث الأيقونات
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  
  console.log('✅ Delivery method selected:', method);
}

// ================================================================
// ===== اختيار الفرع =====
// ================================================================
export function selectBranch(branchId) {
  selectedBranch = branchId;
  
  // تحديث الواجهة
  document.querySelectorAll('.branch-card').forEach(card => {
    card.classList.remove('selected');
  });
  
  const selectedCard = document.querySelector(`[data-branch="${branchId}"]`);
  if (selectedCard) {
    selectedCard.classList.add('selected');
  }
  
  // إظهار النموذج
  const checkoutForm = document.getElementById('checkoutForm');
  if (checkoutForm) {
    checkoutForm.classList.add('show');
    
    // التمرير للنموذج
    setTimeout(() => {
      checkoutForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  }
  updateOrderSummary();  // ✅ و أضفه هنا كمان

  recalculatePrices();  // حساب الأسعار بعد اختيار الفرع

  console.log('✅ Branch selected:', branchId);
}

// ================================================================
// ===== تطبيق كود الخصم =====
// ================================================================
export async function applyPromoCode() {
  const promoInput = document.getElementById('promoCodeInput');
  const promoStatus = document.getElementById('promoStatus');
  const applyBtn = document.getElementById('applyPromoBtn');
  
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
  
  // حساب المبلغ الفرعي الحالي
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // تعطيل الزر وإظهار التحميل
  if (applyBtn) {
    applyBtn.disabled = true;
    applyBtn.innerHTML = `<i data-lucide="loader" class="animate-spin"></i> ${lang === 'ar' ? 'جاري التحقق...' : 'Checking...'}`;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
  
  try {
    // التحقق من كود الخصم عبر Backend
    const result = await api.validatePromoCode(code, subtotal);
    
    if (result.valid) {
      activePromoCode = code;
      
      // إظهار رسالة النجاح
      promoStatus.innerHTML = `
        <div class="promo-success">
          <i data-lucide="check-circle"></i>
          <span>${result.message || (lang === 'ar' ? 'تم تطبيق الكود بنجاح' : 'Code applied successfully')}</span>
          <button onclick="checkoutModule.removePromoCode()" class="remove-promo">
            <i data-lucide="x"></i>
          </button>
        </div>
      `;
      promoStatus.style.display = 'block';
      promoInput.disabled = true;
      
      // إعادة حساب الأسعار مع الخصم
      await recalculatePrices();
      
      showToast(
        lang === 'ar' ? 'تم بنجاح!' : 'Success!',
        result.message || (lang === 'ar' ? 'تم تطبيق الخصم' : 'Discount applied'),
        'success'
      );
    }
    
  } catch (error) {
    console.error('Promo code validation failed:', error);
    
    const errorMessage = api.getErrorMessage(error, lang);
    
    promoStatus.innerHTML = `
      <div class="promo-error">
        <i data-lucide="alert-circle"></i>
        <span>${errorMessage}</span>
      </div>
    `;
    promoStatus.style.display = 'block';
    
    showToast(
      lang === 'ar' ? 'خطأ' : 'Error',
      errorMessage,
      'error'
    );
    
  } finally {
    // إعادة تمكين الزر
    if (applyBtn) {
      applyBtn.disabled = false;
      applyBtn.innerHTML = lang === 'ar' ? 'تطبيق' : 'Apply';
    }
    
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }
}

// ================================================================
// ===== إزالة كود الخصم =====
// ================================================================
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
  
  // إعادة حساب الأسعار بدون خصم
  await recalculatePrices();
  
  const lang = window.currentLang || 'ar';
  showToast(
    lang === 'ar' ? 'تم' : 'Done',
    lang === 'ar' ? 'تم إزالة كود الخصم' : 'Promo code removed',
    'info'
  );
}

// ================================================================
// ===== إعادة حساب الأسعار من Backend =====
// ================================================================
async function recalculatePrices() {
  if (!selectedDeliveryMethod) {
    calculatedPrices = null;
    updateOrderSummary();
    return;
  }

  try {
    const request = {
      items: cart.map(item => ({ productId: item.id || item.productId, quantity: item.quantity })),
      deliveryMethod: selectedDeliveryMethod,
      branch: selectedBranch,
      promoCode: activePromoCode,
      location: userLocation
    };

    console.log('📤 Requesting price calculation from backend:', request);

    // Use a dedicated endpoint — implement on backend: POST /orders/prices
    const result = await api.request('POST', '/orders/prices', request);

    // normalize: your backend may return { subtotal, items, deliveryFee, discount, total, discountMessage }
    calculatedPrices = result.calculatedPrices || result; // adapt to your response shape

    console.log('✅ Prices calculated by backend:', calculatedPrices);
    
    // تحديث الواجهة
    updateOrderSummary();

  } catch (error) {
    console.error('❌ Failed to calculate prices:', error);
    calculatedPrices = null;
    updateOrderSummary();
  }
}

// ================================================================
// ===== إغلاق نافذة الدفع =====
// ================================================================
export function closeCheckoutModal(event) {
  if (event && !event.target.classList.contains('checkout-modal-overlay')) return;
  
  const checkoutModal = document.getElementById('checkoutModal');
  if (checkoutModal) {
    checkoutModal.classList.remove('show');
  }
  document.body.style.overflow = '';
}

// ================================================================
// ===== طلب الموقع =====
// ================================================================
export function requestLocation() {
  if (!navigator.geolocation) {
    const lang = window.currentLang || 'ar';
    showToast(
      lang === 'ar' ? 'خطأ' : 'Error',
      lang === 'ar' ? 'المتصفح لا يدعم تحديد الموقع' : 'Browser does not support geolocation',
      'error'
    );
    return;
  }
  
  // إظهار نافذة الإذن
  const permissionModal = document.getElementById('permissionModal');
  if (permissionModal) {
    permissionModal.classList.add('show');
  }
}

// ================================================================
// ===== إغلاق نافذة الإذن =====
// ================================================================
export function closePermissionModal() {
  const permissionModal = document.getElementById('permissionModal');
  if (permissionModal) {
    permissionModal.classList.remove('show');
  }
}

// ================================================================
// ===== السماح بالموقع =====
// ================================================================
export function allowLocation() {
  const locationBtn = document.getElementById('locationBtn');
  const lang = window.currentLang || 'ar';
  
  if (locationBtn) {
    locationBtn.disabled = true;
    locationBtn.innerHTML = `<i data-lucide="loader"></i><span>${lang === 'ar' ? 'جاري التحديد...' : 'Loading...'}</span>`;
    
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }
  
  navigator.geolocation.getCurrentPosition(
    (position) => {
      userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      
      // تحديث زر الموقع
      if (locationBtn) {
        locationBtn.classList.add('active');
        locationBtn.disabled = false;
        const btnText = lang === 'ar' ? 'تم تحديد الموقع ✓' : 'Location Set ✓';
        locationBtn.innerHTML = `<i data-lucide="check-circle"></i><span>${btnText}</span>`;
      }
      
      // ملء العنوان التقريبي
      const addressField = document.getElementById('customerAddress');
      if (addressField) {
        const coords = `(${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)})`;
        addressField.value = lang === 'ar' 
          ? `تم تحديد الموقع الحالي ${coords}`
          : `Current location set ${coords}`;
      }
      
      closePermissionModal();
      
      showToast(
        lang === 'ar' ? 'تم بنجاح' : 'Success',
        lang === 'ar' ? 'تم تحديد موقعك بنجاح' : 'Location successfully set',
        'success'
      );
      
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
      
      // تحديث المسافات للفروع
      updateBranchDistances();
    },
    (error) => {
      console.log('Location error:', error);
      
      if (locationBtn) {
        locationBtn.disabled = false;
        const btnText = lang === 'ar' ? 'استخدام الموقع الحالي' : 'Use Current Location';
        locationBtn.innerHTML = `<i data-lucide="map-pin"></i><span>${btnText}</span>`;
      }
      
      closePermissionModal();
      
      showToast(
        lang === 'ar' ? 'خطأ' : 'Error',
        lang === 'ar' ? 'لم نتمكن من الحصول على موقعك' : 'Could not get your location',
        'error'
      );
      
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
}

// ================================================================
// ===== تحديث المسافات للفروع =====
// ================================================================
function updateBranchDistances() {
  if (!userLocation) return;
  
  const lang = window.currentLang || 'ar';
  
  Object.keys(branches).forEach(branchId => {
    const branch = branches[branchId];
    const distance = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      branch.location.lat,
      branch.location.lng
    );
    
    const distanceEl = document.getElementById(`branch-${branchId}-distance`);
    if (distanceEl) {
      const distanceSpan = distanceEl.querySelector('span');
      if (distanceSpan) {
        distanceSpan.textContent = `${distance.toFixed(1)} ${lang === 'ar' ? 'كم' : 'km'}`;
      }
    }
  });
}

// ================================================================
// ===== تأكيد الطلب =====
// ================================================================
export async function confirmOrder() {
  const lang = window.currentLang || 'ar';
  const translations = window.i18n.t || {};
  const t = translations[lang] || {};
  
  // التحقق من طريقة التوصيل
  if (!selectedDeliveryMethod) {
    showToast(
      lang === 'ar' ? 'خطأ' : 'Error',
      lang === 'ar' ? 'الرجاء اختيار طريقة الاستلام' : 'Please select pickup method',
      'error'
    );
    return;
  }
  
  // التحقق من الفرع للاستلام
  if (selectedDeliveryMethod === 'pickup' && !selectedBranch) {
    showToast(
      lang === 'ar' ? 'خطأ' : 'Error',
      lang === 'ar' ? 'الرجاء اختيار الفرع' : 'Please select a branch',
      'error'
    );
    return;
  }
  
  // الحصول على قيم الحقول
  const nameField = document.getElementById('customerName');
  const phoneField = document.getElementById('customerPhone');
  const addressField = document.getElementById('customerAddress');
  const notesField = document.getElementById('orderNotes');
  
  const name = nameField ? nameField.value.trim() : '';
  const phone = phoneField ? phoneField.value.trim() : '';
  const address = (selectedDeliveryMethod === 'delivery' && addressField) ? addressField.value.trim() : '';
  const notes = notesField ? notesField.value.trim() : '';
  
  // التحقق من الاسم
  if (!name) {
    showToast(
      lang === 'ar' ? 'خطأ' : 'Error',
      lang === 'ar' ? 'الرجاء إدخال اسمك' : 'Please enter your name',
      'error'
    );
    return;
  }
  
  // التحقق من الهاتف
  const phoneRegex = /^01[0125][0-9]{8}$/;
  if (!phone || !phoneRegex.test(phone)) {
    showToast(
      lang === 'ar' ? 'خطأ' : 'Error',
      lang === 'ar' ? 'الرجاء إدخال رقم هاتف مصري صحيح (01XXXXXXXXX)' : 'Please enter a valid Egyptian phone number',
      'error'
    );
    return;
  }
  
  // التحقق من العنوان للتوصيل
  if (selectedDeliveryMethod === 'delivery' && !address) {
    showToast(
      lang === 'ar' ? 'خطأ' : 'Error',
      lang === 'ar' ? 'الرجاء إدخال العنوان' : 'Please enter address',
      'error'
    );
    return;
  }
  
  // إغلاق نافذة الدفع
  closeCheckoutModal();
  
  // إظهار نافذة المعالجة
  showProcessingModal(true, false);
  
  // تحضير بيانات الطلب (IDs فقط - CRITICAL!)
  const orderData = {
    items: cart.map(item => ({
      productId: item.id || item.productId,  // توحيد المفتاح
      quantity: item.quantity  // فقط الكمية
      // NO PRICES SENT FROM FRONTEND!
    })),
    customer: {
      name: name,
      phone: phone,
      address: address,
      notes: notes
    },
    deliveryMethod: selectedDeliveryMethod,
    branch: selectedBranch,
    location: userLocation,
    promoCode: activePromoCode,
    idempotencyKey: generateUUID()
  };
  
  console.log('📤 Submitting order (IDs only):', orderData);
  
  // تعطيل زر التأكيد لمنع النقر المزدوج
  const confirmBtn = document.getElementById('confirmOrderBtn');
  if (confirmBtn) {
    confirmBtn.disabled = true;
  }
  
  // إرسال الطلب عبر API
  try {
    const result = await api.submitOrder(orderData);
    
    console.log('✅ Order submitted successfully:', result);
    
    // Backend يرجع الأسعار المحسوبة
    const { orderId, eta, etaEn, calculatedPrices } = result;
    
    // حفظ بيانات الطلب للتتبع
    currentOrderData = {
      id: orderId,
      customer: orderData.customer,
      deliveryMethod: selectedDeliveryMethod,
      branch: selectedBranch,
      branchInfo: selectedBranch ? branches[selectedBranch] : null,
      items: calculatedPrices.items, // الأسعار من Backend
      calculatedPrices: calculatedPrices
    };
    
    // تحديث بيانات المستخدم
    const userData = window.userData || {};
    const newVisitCount = (userData?.visitCount || 0) + 1;
    
    window.userData = {
      name: name,
      phone: phone,
      visitCount: newVisitCount
    };
    
    
    // ✅ بهذا:
    storage.setUserData(window.userData);
    
    // تفريغ السلة
    clearCart();
    
    // إخفاء نافذة المعالجة
    showProcessingModal(false);
    
    // نص المنتجات للمشاركة
    const itemsText = calculatedPrices.items.map(item => 
      `${item.name} × ${item.quantity}`
    ).join(', ');
    
    // إظهار نافذة التأكيد
    showConfirmedModal(orderId, eta, phone, itemsText, currentOrderData);
    
    // إشعار النجاح
    showToast(
      lang === 'ar' ? 'تم إرسال الطلب بنجاح! 🎉' : 'Order sent successfully! 🎉',
      eta,
      'success'
    );
    
    // Track event
    api.trackEvent({
      name: 'order_completed',
      orderId: orderId,
      total: calculatedPrices.total,
      itemsCount: calculatedPrices.items.length
    });
    
  } catch (error) {
    console.error('❌ Order submission failed:', error);
    
    // إخفاء نافذة المعالجة
    showProcessingModal(false);
    
    // إظهار رسالة الخطأ
    const errorMessage = api.getErrorMessage(error, lang);
    
    showToast(
      lang === 'ar' ? 'فشل إرسال الطلب' : 'Order Failed',
      errorMessage,
      'error'
    );
    
    // إعادة فتح نافذة الدفع
    const checkoutModal = document.getElementById('checkoutModal');
    if (checkoutModal) {
      checkoutModal.classList.add('show');
    }
    
    // Track failed order
    api.trackEvent({
      name: 'order_failed',
      error: error.message,
      step: 'submission'
    });
  } finally {
    // إعادة تمكين زر التأكيد
    if (confirmBtn) {
      confirmBtn.disabled = false;
    }
  }
}

// ================================================================
// ===== إظهار نافذة المعالجة =====
// ================================================================
function showProcessingModal(show, withActions = false) {
  const modal = document.getElementById('processingModal');
  if (!modal) return;
  
  if (show) {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  } else {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }
  
  const actions = document.getElementById('processingActions');
  if (actions) {
    actions.style.display = withActions ? 'block' : 'none';
  }
  
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// ================================================================
// ===== إظهار نافذة التأكيد =====
// ================================================================
function showConfirmedModal(orderId, eta, phone, itemsText, orderData) {
  const modal = document.getElementById('orderConfirmedModal');
  if (!modal) return;
  
  const lang = window.currentLang || 'ar';
  
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  
  // تحديث رقم الطلب
  const orderIdEl = document.getElementById('confirmedOrderId');
  if (orderIdEl) orderIdEl.textContent = orderId;
  
  // تحديث الوقت المتوقع
  const etaEl = document.getElementById('confirmedEta');
  if (etaEl) {
    const etaText = lang === 'ar' 
      ? `الوقت المتوقع: ${eta}`
      : `Estimated time: ${eta}`;
    etaEl.textContent = etaText;
  }
  
  // معلومات الفرع للاستلام
  const branchInfo = document.getElementById('selectedBranchInfo');
  if (branchInfo && orderData.deliveryMethod === 'pickup' && orderData.branchInfo) {
    branchInfo.style.display = 'block';
    const branchName = document.getElementById('selectedBranchName');
    const branchAddress = document.getElementById('selectedBranchAddress');
    if (branchName) branchName.textContent = orderData.branchInfo.name[lang];
    if (branchAddress) branchAddress.textContent = orderData.branchInfo.address[lang];
  } else if (branchInfo) {
    branchInfo.style.display = 'none';
  }
  
  // الأزرار
  const total = orderData.calculatedPrices?.total || 0;
  setupConfirmedModalButtons(orderId, itemsText, phone, total);
  
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// ================================================================
// ===== إعداد أزرار نافذة التأكيد =====
// ================================================================
function setupConfirmedModalButtons(orderId, itemsText, phone, total) {
  const copyBtn = document.getElementById('copyOrderIdBtn');
  const whatsappBtn = document.getElementById('shareWhatsAppBtn');
  const trackBtn = document.getElementById('trackOrderBtn');
  const closeBtn = document.getElementById('closeConfirmedBtn');
  const continueBtn = document.getElementById('continueShoppingBtn');
  
  if (copyBtn) {
    copyBtn.onclick = () => copyOrderId(orderId);
  }
  
  if (whatsappBtn) {
    whatsappBtn.onclick = () => shareOnWhatsApp(orderId, itemsText, phone, total);
  }
  
  if (trackBtn) {
    trackBtn.onclick = () => openTrackingModal(orderId);
  }
  
  if (closeBtn) {
    closeBtn.onclick = () => {
      const modal = document.getElementById('orderConfirmedModal');
      if (modal) modal.classList.add('hidden');
      document.body.style.overflow = '';
    };
  }
  
  if (continueBtn) {
    continueBtn.onclick = () => {
      const modal = document.getElementById('orderConfirmedModal');
      if (modal) modal.classList.add('hidden');
      document.body.style.overflow = '';
    };
  }
}

// ================================================================
// ===== نسخ رقم الطلب =====
// ================================================================
function copyOrderId(orderId) {
  const lang = window.currentLang || 'ar';
  
  if (navigator.clipboard) {
    navigator.clipboard.writeText(orderId).then(() => {
      showToast(
        lang === 'ar' ? 'تم النسخ' : 'Copied',
        lang === 'ar' ? 'تم نسخ رقم الطلب' : 'Order ID copied',
        'success'
      );
    }).catch(err => {
      console.error('Copy failed:', err);
      fallbackCopy(orderId);
    });
  } else {
    fallbackCopy(orderId);
  }
}

function fallbackCopy(text) {
  const lang = window.currentLang || 'ar';
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  document.body.appendChild(textArea);
  textArea.select();
  
  try {
    document.execCommand('copy');
    showToast(
      lang === 'ar' ? 'تم النسخ' : 'Copied',
      lang === 'ar' ? 'تم نسخ رقم الطلب' : 'Order ID copied',
      'success'
    );
  } catch (err) {
    showToast(
      lang === 'ar' ? 'خطأ' : 'Error',
      lang === 'ar' ? 'فشل النسخ' : 'Copy failed',
      'error'
    );
  }
  
  document.body.removeChild(textArea);
}

// ================================================================
// ===== مشاركة عبر WhatsApp =====
// ================================================================
function shareOnWhatsApp(orderId, itemsText, phone, total) {
  const lang = window.currentLang || 'ar';
  const currency = window.i18n.t?.[lang]?.currency || 'ج.م';
  
  const message = lang === 'ar'
    ? `🎉 طلب جديد!\n\nرقم الطلب: ${orderId}\nالمنتجات: ${itemsText}\nالإجمالي: ${total.toFixed(2)} ${currency}\n\nشكراً لطلبك!`
    : `🎉 New Order!\n\nOrder ID: ${orderId}\nItems: ${itemsText}\nTotal: ${total.toFixed(2)} ${currency}\n\nThank you for your order!`;
  
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank');
}

// ================================================================
// ===== فتح نافذة التتبع =====
// ================================================================
export function openTrackingModal(orderId = '') {
  const modal = document.getElementById('trackingModal');
  if (!modal) return;
  
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  
  const input = document.getElementById('trackingInput');
  if (input) {
    input.value = orderId;
    setTimeout(() => input.focus(), 100);
  }
  
  // زر الإغلاق
  const closeBtn = document.getElementById('closeTrackingBtn');
  if (closeBtn) {
    closeBtn.onclick = () => {
      modal.classList.add('hidden');
      document.body.style.overflow = '';
    };
  }
  
  // زر التحقق
  const checkBtn = document.getElementById('checkStatusBtn');
  if (checkBtn) {
    checkBtn.onclick = () => checkOrderStatus();
  }
  
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// ================================================================
// ===== التحقق من حالة الطلب =====
// ================================================================
export async function checkOrderStatus() {
  const input = document.getElementById('trackingInput');
  const result = document.getElementById('trackingResult');
  
  if (!input || !result) return;
  
  const lang = window.currentLang || 'ar';
  const orderId = input.value.trim();
  
  if (!orderId) {
    showToast(
      lang === 'ar' ? 'خطأ' : 'Error',
      lang === 'ar' ? 'الرجاء إدخال رقم الطلب' : 'Please enter order ID',
      'error'
    );
    return;
  }
  
  // إظهار التحميل
  result.style.display = 'block';
  result.innerHTML = `
    <div style="text-align: center; padding: 20px;">
      <div class="spinner" style="width: 40px; height: 40px; margin: 0 auto 16px; border: 3px solid #f3f3f3; border-top: 3px solid #2196F3; border-radius: 50%; animation: spin 1s linear infinite;"></div>
      <p>${lang === 'ar' ? 'جاري البحث...' : 'Searching...'}</p>
    </div>
  `;
  
  try {
    // استدعاء API لتتبع الطلب
    const orderStatus = await api.trackOrder(orderId);
    
    console.log('✅ Order status:', orderStatus);
    
    const statusColor = orderStatus.status.includes('مقبول') || orderStatus.status.includes('accepted') 
      ? '#4CAF50' 
      : orderStatus.status.includes('مرفوض') || orderStatus.status.includes('rejected')
      ? '#f44336'
      : '#2196F3';
    
    const statusIcon = orderStatus.status.includes('مقبول') || orderStatus.status.includes('accepted')
      ? 'check-circle'
      : orderStatus.status.includes('مرفوض') || orderStatus.status.includes('rejected')
      ? 'x-circle'
      : 'clock';
    
    const html = `
      <div style="text-align: center;">
        <div style="width: 60px; height: 60px; background: ${statusColor}; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; color: white;">
          <i data-lucide="${statusIcon}" style="width: 30px; height: 30px;"></i>
        </div>
        <h4 style="font-size: 18px; font-weight: 700; color: #1a1a1a; margin-bottom: 8px;">${orderStatus.status}</h4>
        <p style="font-size: 14px; color: #666; margin-bottom: 16px;">
          ${lang === 'ar' ? 'رقم الطلب:' : 'Order ID:'} <strong>${orderId}</strong>
        </p>
        <div style="background: white; padding: 16px; border-radius: 12px; margin-bottom: 12px; border: 1px solid #e0e0e0;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
            <span style="font-size: 14px; color: #666;">${lang === 'ar' ? 'التاريخ:' : 'Date:'}</span>
            <span style="font-size: 14px; font-weight: 600;">${orderStatus.date}</span>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <span style="font-size: 14px; color: #666;">${lang === 'ar' ? 'المبلغ:' : 'Total:'}</span>
            <span style="font-size: 14px; font-weight: 600;">${orderStatus.total} ${lang === 'ar' ? 'ج.م' : 'EGP'}</span>
          </div>
        </div>
        <div style="background: ${statusColor}20; padding: 12px; border-radius: 8px; font-size: 13px; color: ${statusColor};">
          <i data-lucide="info" style="width: 16px; height: 16px; display: inline-block; vertical-align: middle;"></i> 
          ${lang === 'ar' ? 'سنوافيك بأي تحديثات عبر الهاتف' : 'We will update you via phone'}
        </div>
      </div>
    `;
    
    result.innerHTML = html;
    
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
    
  } catch (error) {
    console.error('❌ Order tracking failed:', error);
    
    // الطلب غير موجود أو خطأ
    const html = `
      <div style="text-align: center;">
        <div style="width: 60px; height: 60px; background: #ffebee; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; color: #f44336;">
          <i data-lucide="search-x" style="width: 30px; height: 30px;"></i>
        </div>
        <h4 style="font-size: 18px; font-weight: 700; color: #1a1a1a; margin-bottom: 8px;">
          ${lang === 'ar' ? 'لم يتم العثور على الطلب' : 'Order Not Found'}
        </h4>
        <p style="font-size: 14px; color: #666; margin-bottom: 16px;">
          ${lang === 'ar' ? 'تأكد من رقم الطلب وحاول مرة أخرى' : 'Check the order ID and try again'}
        </p>
        <div style="background: #fff3e0; padding: 12px; border-radius: 8px; font-size: 13px; color: #e65100;">
          <i data-lucide="info" style="width: 16px; height: 16px; display: inline-block; vertical-align: middle;"></i> 
          ${lang === 'ar' ? 'تأكد من إدخال الرقم بشكل صحيح' : 'Make sure to enter the number correctly'}
        </div>
      </div>
    `;
    
    result.innerHTML = html;
    
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }
}

// ================================================================
// ===== إعداد معالجات الأحداث =====
// ================================================================
export function setupCheckoutEventHandlers() {
  // إعداد Focus Trap للـ Modals
  setupFocusTrap('checkoutModal');
  setupFocusTrap('permissionModal');
  setupFocusTrap('processingModal');
  setupFocusTrap('orderConfirmedModal');
  setupFocusTrap('trackingModal');
  
  // إعداد Enter key للتتبع
  const trackingInput = document.getElementById('trackingInput');
  if (trackingInput) {
    trackingInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        checkOrderStatus();
      }
    });
  }
  
  // إعداد Enter key لكود الخصم
  const promoInput = document.getElementById('promoCodeInput');
  if (promoInput) {
    promoInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        applyPromoCode();
      }
    });
  }
  
  // إعداد تنسيق رقم الهاتف
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
  
  // حفظ البيانات تلقائياً
  const formFields = ['customerName', 'customerPhone', 'customerAddress', 'orderNotes'];
  formFields.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener('input', saveFormData);
    }
  });
  
  // إعداد إغلاق بـ ESC
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeAllCheckoutModals();
    }
  });
  
  console.log('✅ Checkout event handlers setup');
}

// ================================================================
// ===== حفظ بيانات النموذج =====
// ================================================================
// ✅ الجديد:
function saveFormData() {
  const nameField = document.getElementById('customerName');
  const phoneField = document.getElementById('customerPhone');
  const addressField = document.getElementById('customerAddress');
  const notesField = document.getElementById('orderNotes');
  
  const formData = {
    name: nameField?.value || '',
    phone: phoneField?.value || '',
    address: addressField?.value || '',
    notes: notesField?.value || ''
  };
  
  storage.setCheckoutFormData(formData);
}

export function restoreFormData() {
  const formData = storage.getCheckoutFormData();
  
  if (!formData) return;
  
  const nameField = document.getElementById('customerName');
  const phoneField = document.getElementById('customerPhone');
  const addressField = document.getElementById('customerAddress');
  const notesField = document.getElementById('orderNotes');
  
  if (formData.name && nameField) nameField.value = formData.name;
  if (formData.phone && phoneField) phoneField.value = formData.phone;
  if (formData.address && addressField) addressField.value = formData.address;
  if (formData.notes && notesField) notesField.value = formData.notes;
}


// ================================================================
// ===== إغلاق جميع نوافذ الدفع =====
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
// ===== تصدير الوحدة للنافذة العامة =====
// ================================================================
if (typeof window !== 'undefined') {
  window.checkoutModule = {
    initiateCheckout,
    selectDeliveryMethod,
    selectBranch,
    confirmOrder,
    requestLocation,
    allowLocation,
    closeCheckoutModal,
    closePermissionModal,
    openTrackingModal,
    checkOrderStatus,
    updateOrderSummary,
    restoreFormData,
    applyPromoCode,
    removePromoCode,
    loadBranches,
    setupCheckoutEventHandlers,
    getBranches: () => branches,
    getCurrentOrderData: () => currentOrderData,
    getCalculatedPrices: () => calculatedPrices
  };
}

console.log('✅ Checkout module loaded (API Integrated - Secure)');

// ================================================================
// ===== Auto-initialize on DOM ready =====
// ================================================================
if (typeof window !== 'undefined' && document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Load branches automatically
    loadBranches().catch(err => {
      console.warn('Failed to load branches on init:', err);
    });
    
    // Setup event handlers
    setupCheckoutEventHandlers();
    
    // Restore form data if available
    restoreFormData();
  });
} else if (typeof window !== 'undefined' && document.readyState !== 'loading') {
  // DOM already loaded
  loadBranches().catch(err => {
    console.warn('Failed to load branches on init:', err);
  });
  setupCheckoutEventHandlers();
  restoreFormData();
}