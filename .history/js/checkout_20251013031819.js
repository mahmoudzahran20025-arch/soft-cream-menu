// ================================================================
// checkout.js - نظام إتمام الطلب الكامل
// ================================================================

import { cart, calculateCartTotals, clearCart, closeCartModal } from './cart.js';
import { showToast, generateUUID, calculateDistance, setupFocusTrap } from './utils.js';
import { api } from './api.js';

// ================================================================
// ===== متغيرات عامة =====
// ================================================================
let selectedDeliveryMethod = null;
let selectedBranch = null;
let userLocation = null;
let currentOrderData = null;

// ================================================================
// ===== بيانات الفروع =====
// ================================================================
export const branches = {
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

// ================================================================
// ===== بدء عملية الشراء =====
// ================================================================
export function initiateCheckout() {
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
  
  // إعادة تعيين الاختيارات
  selectedDeliveryMethod = null;
  selectedBranch = null;
  
  // إعادة تعيين الحقول
  resetFormFields();
  
  // ملء البيانات المحفوظة
  fillSavedUserData();
  
  // تحديث ملخص الطلب
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
  const fields = ['customerName', 'customerPhone', 'customerAddress', 'orderNotes'];
  
  fields.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (field) field.value = '';
  });
}

// ================================================================
// ===== ملء بيانات المستخدم المحفوظة =====
// ================================================================
function fillSavedUserData() {
  const userData = window.userData || window.appModule?.getUserData();
  
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
  const translations = window.translations || {};
  const t = translations[lang] || {};
  const currency = t.currency || 'ج.م';
  
  let html = '';
  let subtotal = 0;
  
  // عرض المنتجات
  cart.forEach(item => {
    const name = lang === 'ar' ? item.name : item.nameEn;
    const itemTotal = item.price * item.quantity;
    subtotal += itemTotal;
    
    html += `
      <div class="order-item">
        <div class="order-item-name">${name} × ${item.quantity}</div>
        <div class="order-item-price">${itemTotal} ${currency}</div>
      </div>
    `;
  });
  
  // رسوم التوصيل
  const deliveryFee = selectedDeliveryMethod === 'delivery' ? 15 : 0;
  if (deliveryFee > 0) {
    const deliveryText = lang === 'ar' ? 'رسوم التوصيل' : 'Delivery Fee';
    html += `
      <div class="order-item">
        <div class="order-item-name">${deliveryText}</div>
        <div class="order-item-price">${deliveryFee} ${currency}</div>
      </div>
    `;
  }
  
  // حساب الخصم
  const userData = window.userData || window.appModule?.getUserData();
  const newVisitCount = (userData?.visitCount || 0) + 1;
  let discount = 0;
  
  if (newVisitCount === 1) discount = 0.2;
  else if (newVisitCount === 2) discount = 0.15;
  else if (newVisitCount >= 3) discount = 0.1;
  
  const discountAmount = subtotal * discount;
  
  if (discountAmount > 0) {
    const discountText = lang === 'ar' 
      ? `خصم (${Math.round(discount * 100)}%)`
      : `Discount (${Math.round(discount * 100)}%)`;
    
    html += `
      <div class="order-item">
        <div class="order-item-name">${discountText}</div>
        <div class="order-item-price">-${discountAmount.toFixed(2)} ${currency}</div>
      </div>
    `;
  }
  
  // الإجمالي
  const total = subtotal - discountAmount + deliveryFee;
  const totalText = lang === 'ar' ? 'الإجمالي' : 'Total';
  
  html += `
    <div class="order-item" style="font-weight: 700; font-size: 1.125rem; margin-top: 8px; padding-top: 8px; border-top: 2px solid var(--border);">
      <div class="order-item-name">${totalText}</div>
      <div class="order-item-price">${total.toFixed(2)} ${currency}</div>
    </div>
  `;
  
  orderItems.innerHTML = html;
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
  
  // تحديث ملخص الطلب
  updateOrderSummary();
  
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
  
  console.log('✅ Branch selected:', branchId);
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
export function confirmOrder() {
  const lang = window.currentLang || 'ar';
  const translations = window.translations || {};
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
  const phoneRegex = /^01[0-2,5]{1}[0-9]{8}$/;
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
  
  // تحديث بيانات المستخدم
  const userData = window.userData || {};
  const newVisitCount = (userData?.visitCount || 0) + 1;
  
  window.userData = {
    name: name,
    phone: phone,
    visitCount: newVisitCount
  };
  
  try {
    localStorage.setItem('userData', JSON.stringify(window.userData));
  } catch (e) {
    console.warn('Could not save to localStorage:', e);
  }
  
  // حساب الخصم
  let discount = 0;
  let discountMessage = '';
  
  if (newVisitCount === 1) {
    discount = 0.2;
    discountMessage = t.discountFirst || 'خصم 20% للطلب الأول!';
  } else if (newVisitCount === 2) {
    discount = 0.15;
    discountMessage = t.discountSecond || 'خصم 15% للطلب الثاني!';
  } else if (newVisitCount >= 3) {
    discount = 0.1;
    discountMessage = t.discountLoyal || 'خصم 10% للعملاء المميزين!';
  }
  
  // حساب الإجماليات
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = selectedDeliveryMethod === 'delivery' ? 15 : 0;
  const discountAmount = subtotal * discount;
  const total = subtotal - discountAmount + deliveryFee;
  
  // إنشاء الطلب
  const orderId = 'ORD-' + Date.now();
  const orderData = {
    id: orderId,
    idempotencyKey: generateUUID(),
    date: new Date().toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US'),
    customer: {
      name: name,
      phone: phone,
      address: selectedDeliveryMethod === 'delivery' ? address : '',
      notes: notes
    },
    items: cart.map(item => ({
      name: lang === 'ar' ? item.name : item.nameEn,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.price * item.quantity
    })),
    deliveryMethod: selectedDeliveryMethod,
    branch: selectedDeliveryMethod === 'pickup' ? selectedBranch : null,
    branchInfo: selectedDeliveryMethod === 'pickup' ? branches[selectedBranch] : null,
    deliveryFee: deliveryFee,
    subtotal: subtotal,
    discount: discountAmount,
    discountMessage: discountMessage,
    total: total,
    location: userLocation
  };
  
  currentOrderData = orderData;
  
  // إغلاق نافذة الدفع
  closeCheckoutModal();
  
  // إرسال الطلب
  handleSendOrder(orderData);
}

// ================================================================
// ===== معالجة إرسال الطلب =====
// ================================================================
function handleSendOrder(orderData) {
  const lang = window.currentLang || 'ar';
  let attempts = 0;
  const maxAttempts = 3;
  
  // إظهار نافذة المعالجة
  showProcessingModal(true, false);
  
  function doSend() {
    attempts++;
    
    // محاكاة الإرسال (استبدل بـ API فعلي)
    setTimeout(() => {
      const success = Math.random() > 0.1 || attempts >= 2;
      
      if (success) {
        handleSuccess(orderData);
      } else {
        handleFailure('Network error - simulated');
      }
    }, 2000);
    
    // للتكامل مع Google Apps Script
    /*
    if (typeof google !== 'undefined' && google.script && google.script.run) {
      google.script.run
        .withSuccessHandler(handleSuccess)
        .withFailureHandler(handleFailure)
        .handleIncomingOrder(orderData);
    }
    */
  }
  
  function handleSuccess(response) {
    // إخفاء نافذة المعالجة
    showProcessingModal(false);
    
    // تفريغ السلة
    clearCart();
    
    // حساب وقت التسليم المتوقع
    const eta = orderData.deliveryMethod === 'pickup' 
      ? (lang === 'ar' ? '≈ 15 دقيقة' : '≈ 15 minutes')
      : (lang === 'ar' ? '≈ 30 دقيقة' : '≈ 30 minutes');
    
    // نص المنتجات للمشاركة
    const itemsText = orderData.items.map(item => 
      `${item.name} × ${item.quantity}`
    ).join(', ');
    
    // إظهار نافذة التأكيد
    showConfirmedModal(orderData.id, eta, orderData.customer.phone, itemsText, orderData);
    
    // إشعار النجاح
    showToast(
      lang === 'ar' ? 'تم إرسال الطلب بنجاح! 🎉' : 'Order sent successfully! 🎉',
      eta,
      'success'
    );
  }
  
  function handleFailure(error) {
    console.error('Send order failed:', error);
    
    // إظهار خيارات إعادة المحاولة
    showProcessingModal(true, true);
    
    // زر إعادة المحاولة
    const retryBtn = document.getElementById('retryBtn');
    if (retryBtn) {
      retryBtn.onclick = () => {
        showProcessingModal(true, false);
        doSend();
      };
    }
    
    // زر الإلغاء
    const cancelBtn = document.getElementById('cancelSendBtn');
    if (cancelBtn) {
      cancelBtn.onclick = () => {
        showProcessingModal(false);
        showToast(
          lang === 'ar' ? 'تم الإلغاء' : 'Cancelled',
          lang === 'ar' ? 'يمكنك المحاولة مرة أخرى' : 'You can try again',
          'error'
        );
      };
    }
    
    // إعادة محاولة تلقائية مع backoff
    if (attempts < maxAttempts) {
      const backoff = Math.min(3000 * attempts, 10000);
      setTimeout(() => {
        showProcessingModal(true, false);
        doSend();
      }, backoff);
    }
  }
  
  doSend();
}

// ================================================================
// ===== إظهار نافذة المعالجة =====
// ================================================================
function showProcessingModal(show, withActions = false) {
  const modal = document.getElementById('processingModal');
  if (!modal) return;
  
  if (show) {
    modal.classList.remove('hidden');
  } else {
    modal.classList.add('hidden');
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
  setupConfirmedModalButtons(orderId, itemsText, phone, orderData.total);
  
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
  const currency = window.translations?.[lang]?.currency || 'ج.م';
  
  const message = lang === 'ar'
    ? `🎉 طلب جديد!\n\nرقم الطلب: ${orderId}\nالمنتجات: ${itemsText}\nالإجمالي: ${total} ${currency}\n\nشكراً لطلبك!`
    : `🎉 New Order!\n\nOrder ID: ${orderId}\nItems: ${itemsText}\nTotal: ${total} ${currency}\n\nThank you for your order!`;
  
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
export function checkOrderStatus() {
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
      <div class="spinner" style="width: 40px; height: 40px; margin: 0 auto 16px;"></div>
      <p>${lang === 'ar' ? 'جاري البحث...' : 'Searching...'}</p>
    </div>
  `;
  
  // محاكاة API call
  setTimeout(() => {
    let html = '';
    
    // التحقق من الطلب الحالي
    if (currentOrderData && currentOrderData.id === orderId) {
      const status = lang === 'ar' ? 'قيد التحضير' : 'In Preparation';
      const statusColor = '#4CAF50';
      const eta = currentOrderData.deliveryMethod === 'pickup'
        ? (lang === 'ar' ? '≈ 15 دقيقة' : '≈ 15 minutes')
        : (lang === 'ar' ? '≈ 30 دقيقة' : '≈ 30 minutes');
      
      html = `
        <div style="text-align: center;">
          <div style="width: 60px; height: 60px; background: ${statusColor}; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; color: white;">
            <i data-lucide="chef-hat" style="width: 30px; height: 30px;"></i>
          </div>
          <h4 style="font-size: 18px; font-weight: 700; color: #1a1a1a; margin-bottom: 8px;">${status}</h4>
          <p style="font-size: 14px; color: #666; margin-bottom: 16px;">
            ${lang === 'ar' ? 'رقم الطلب:' : 'Order ID:'} <strong>${orderId}</strong>
          </p>
          <div style="background: white; padding: 16px; border-radius: 12px; margin-bottom: 12px;">
            <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 12px;">
              <i data-lucide="clock" style="width: 18px; height: 18px; color: #2196F3;"></i>
              <span style="font-size: 15px; font-weight: 600;">${eta}</span>
            </div>
            <p style="font-size: 13px; color: #666;">
              ${lang === 'ar' ? 'سنوافيك بالتحديثات عبر الهاتف' : 'We will update you via phone'}
            </p>
          </div>
          <div style="background: #e8f5e9; padding: 12px; border-radius: 8px; font-size: 13px; color: #2e7d32;">
            <i data-lucide="check-circle" style="width: 16px; height: 16px; display: inline-block; vertical-align: middle;"></i> 
            ${lang === 'ar' ? 'تم تأكيد طلبك بنجاح' : 'Your order has been confirmed'}
          </div>
        </div>
      `;
    } else {
      // الطلب غير موجود
      html = `
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
    }
    
    result.innerHTML = html;
    
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }, 1500);
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
  
  try {
    sessionStorage.setItem('checkoutFormData', JSON.stringify(formData));
  } catch (e) {
    console.warn('Could not save form data:', e);
  }
}

// ================================================================
// ===== استعادة بيانات النموذج =====
// ================================================================
export function restoreFormData() {
  try {
    const savedData = sessionStorage.getItem('checkoutFormData');
    if (!savedData) return;
    
    const formData = JSON.parse(savedData);
    
    const nameField = document.getElementById('customerName');
    const phoneField = document.getElementById('customerPhone');
    const addressField = document.getElementById('customerAddress');
    const notesField = document.getElementById('orderNotes');
    
    if (formData.name && nameField) nameField.value = formData.name;
    if (formData.phone && phoneField) phoneField.value = formData.phone;
    if (formData.address && addressField) addressField.value = formData.address;
    if (formData.notes && notesField) notesField.value = formData.notes;
  } catch (e) {
    console.warn('Error restoring form data:', e);
  }
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
    getBranches: () => branches,
    getCurrentOrderData: () => currentOrderData
  };
}

console.log('✅ Checkout module loaded');