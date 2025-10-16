// ================================================================
// CHECKOUT UI - واجهة المستخدم (ENHANCED VERSION)
// ================================================================

console.log('🔄 Loading checkout-ui.js');

// ================================================================
// Static Imports
// ================================================================
import { cart } from '../cart.js';  // ✅ الآن يعمل مباشرة!
import { storage } from '../storage.js';
import { showToast } from '../utils.js';

// ================================================================
// ✅ Enhanced updateOrderSummary - Moved Below Promo Code
// ================================================================
export async function updateOrderSummary() {
  console.log('🔄 Updating order summary...');
  
  const orderSummary = document.getElementById('orderSummary');
  const orderItems = document.getElementById('orderItems');
  
  if (!orderSummary || !orderItems) {
    console.warn('⚠️ Order summary elements not found');
    return;
  }

  const lang = window.currentLang || 'ar';
  const cart = getCart();  // ✅ الحصول على السلة الحالية
  
  try {
    // Get current state
    const { 
      getCalculatedPrices, 
      getSelectedDeliveryMethod, 
      getSelectedBranch 
    } = await import('./checkout-core.js');
    
    const calculatedPrices = getCalculatedPrices();
    const deliveryMethod = getSelectedDeliveryMethod();
    const selectedBranch = getSelectedBranch();
    
    console.log('🔄 Order summary state:', {
      calculatedPrices: !!calculatedPrices,
      deliveryMethod,
      selectedBranch,
      cartItems: cart?.length || 0
    });

    // إخفاء ملخص الطلب في البداية
    orderSummary.style.display = 'none';
    
    // عرض ملخص الأسعار فقط بعد اختيار طريقة التوصيل
    if (deliveryMethod && calculatedPrices) {
      orderSummary.style.display = 'block';
      
      // Build enhanced items HTML with better styling
      let itemsHtml = `
        <div class="order-summary-header" style="padding: 12px 16px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0; color: white; font-weight: 600; font-size: 15px; display: flex; align-items: center; gap: 8px;">
          <i data-lucide="receipt" style="width: 18px; height: 18px;"></i>
          <span>${lang === 'ar' ? 'ملخص الطلب' : 'Order Summary'}</span>
        </div>
        <div class="order-items-list" style="padding: 16px; background: white; border: 1px solid #e0e0e0; border-top: none;">
      `;
      
      // عرض عناصر الطلب
      if (calculatedPrices.items && calculatedPrices.items.length > 0) {
        calculatedPrices.items.forEach((item, index) => {
          const itemTotal = item.total || (item.price * item.quantity);
          itemsHtml += `
            <div class="summary-item" style="display: flex; justify-content: space-between; align-items: start; padding: 10px 0; ${index < calculatedPrices.items.length - 1 ? 'border-bottom: 1px solid #f0f0f0;' : ''}">
              <div class="item-details" style="flex: 1;">
                <div style="font-weight: 600; color: #333; margin-bottom: 4px; font-size: 14px;">${item.name}</div>
                <div style="display: flex; align-items: center; gap: 12px; font-size: 13px; color: #666;">
                  <span style="background: #f5f5f5; padding: 2px 8px; border-radius: 4px;">× ${item.quantity}</span>
                  <span>${item.price.toFixed(2)} EGP</span>
                </div>
              </div>
              <div class="item-total" style="font-weight: 700; color: #667eea; font-size: 15px; white-space: nowrap; margin-left: 12px;">
                ${itemTotal.toFixed(2)} EGP
              </div>
            </div>
          `;
        });
      }
      
      itemsHtml += `</div>`;
      
      // Build enhanced totals HTML
      const { subtotal, deliveryFee, discount, total } = calculatedPrices;
      
      let totalsHtml = `
        <div class="order-totals" style="padding: 16px; background: #fafafa; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
          
          <!-- Subtotal -->
          <div class="total-row" style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; font-size: 14px;">
            <span style="color: #666; display: flex; align-items: center; gap: 6px;">
              <i data-lucide="shopping-bag" style="width: 16px; height: 16px;"></i>
              ${lang === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}
            </span>
            <span style="font-weight: 600; color: #333;">${subtotal.toFixed(2)} EGP</span>
          </div>
          
          <!-- Delivery Fee -->
          ${deliveryFee > 0 ? `
            <div class="total-row" style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; font-size: 14px;">
              <span style="color: #666; display: flex; align-items: center; gap: 6px;">
                <i data-lucide="truck" style="width: 16px; height: 16px;"></i>
                ${lang === 'ar' ? 'رسوم التوصيل' : 'Delivery Fee'}
              </span>
              <span style="font-weight: 600; color: #333;">${deliveryFee.toFixed(2)} EGP</span>
            </div>
          ` : `
            <div class="total-row" style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; font-size: 14px;">
              <span style="color: #666; display: flex; align-items: center; gap: 6px;">
                <i data-lucide="package-check" style="width: 16px; height: 16px;"></i>
                ${lang === 'ar' ? 'رسوم التوصيل' : 'Delivery Fee'}
              </span>
              <span style="font-weight: 600; color: #4caf50;">${lang === 'ar' ? 'مجاني' : 'FREE'}</span>
            </div>
          `}
          
          <!-- Discount -->
          ${discount > 0 ? `
            <div class="total-row discount" style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; font-size: 14px; background: #fff3e0; margin: 8px -16px; padding-left: 16px; padding-right: 16px;">
              <span style="color: #f57c00; display: flex; align-items: center; gap: 6px; font-weight: 600;">
                <i data-lucide="tag" style="width: 16px; height: 16px;"></i>
                ${lang === 'ar' ? 'الخصم' : 'Discount'}
              </span>
              <span style="font-weight: 700; color: #f57c00;">-${discount.toFixed(2)} EGP</span>
            </div>
          ` : ''}
          
          <!-- Divider -->
          <div style="border-top: 2px dashed #e0e0e0; margin: 12px 0;"></div>
          
          <!-- Total -->
          <div class="total-row final-total" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; margin: 0 -16px -16px -16px;">
            <span style="color: white; font-weight: 700; font-size: 16px; display: flex; align-items: center; gap: 8px;">
              <i data-lucide="wallet" style="width: 20px; height: 20px;"></i>
              ${lang === 'ar' ? 'الإجمالي النهائي' : 'Total Amount'}
            </span>
            <span style="font-weight: 700; color: white; font-size: 20px;">${total.toFixed(2)} EGP</span>
          </div>
        </div>
      `;
      
      // Show offline indicator if applicable
      if (calculatedPrices.isOffline) {
        totalsHtml += `
          <div class="offline-indicator" style="margin-top: 12px; padding: 12px; background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%); border-radius: 8px; border-left: 4px solid #f39c12; display: flex; align-items: center; gap: 10px;">
            <i data-lucide="wifi-off" style="width: 20px; height: 20px; color: #f39c12; flex-shrink: 0;"></i>
            <div style="font-size: 13px; color: #856404; line-height: 1.5;">
              <div style="font-weight: 600; margin-bottom: 2px;">${lang === 'ar' ? '⚠️ وضع عدم الاتصال' : '⚠️ Offline Mode'}</div>
              <div>${lang === 'ar' ? 'الأسعار تقديرية - سيتم التأكيد عند الاتصال' : 'Prices are estimated - will be confirmed when online'}</div>
            </div>
          </div>
        `;
      }
      
      // Add branch info for pickup
      if (deliveryMethod === 'pickup' && selectedBranch) {
        try {
          const { branches } = await import('./checkout-delivery.js');
          const branch = branches[selectedBranch];
          
          if (branch) {
            totalsHtml += `
              <div class="selected-branch-info" style="margin-top: 12px; padding: 12px; background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); border-radius: 8px; border-left: 4px solid #2196F3;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                  <i data-lucide="map-pin" style="width: 18px; height: 18px; color: #1976D2;"></i>
                  <span style="font-size: 13px; color: #1565c0; font-weight: 600;">${lang === 'ar' ? 'فرع الاستلام' : 'Pickup Branch'}</span>
                </div>
                <div style="font-weight: 700; color: #0d47a1; font-size: 15px; margin-bottom: 4px;">${branch.name[lang]}</div>
                <div style="font-size: 13px; color: #1565c0; display: flex; align-items: start; gap: 6px;">
                  <i data-lucide="navigation" style="width: 14px; height: 14px; margin-top: 2px; flex-shrink: 0;"></i>
                  <span>${branch.address[lang]}</span>
                </div>
              </div>
            `;
          }
        } catch (err) {
          console.warn('⚠️ Could not load branch info:', err);
        }
      }
      
      // Combine HTML
      orderItems.innerHTML = itemsHtml + totalsHtml;
      
    } else if (deliveryMethod && !calculatedPrices) {
      // Show calculation in progress
      orderSummary.style.display = 'block';
      orderItems.innerHTML = `
        <div class="calculating-prices" style="padding: 32px; text-align: center; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); border-radius: 8px;">
          <div class="spinner" style="width: 48px; height: 48px; margin: 0 auto 16px; border: 4px solid #e0e0e0; border-top: 4px solid #667eea; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
          <div style="font-size: 16px; font-weight: 600; color: #667eea; margin-bottom: 8px;">
            ${lang === 'ar' ? 'جاري حساب الأسعار...' : 'Calculating Prices...'}
          </div>
          <div style="font-size: 13px; color: #666;">
            ${lang === 'ar' ? 'الرجاء الانتظار قليلاً' : 'Please wait a moment'}
          </div>
        </div>
        <style>
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      `;
    } else {
      // إخفاء الملخص إذا لم يتم اختيار طريقة التوصيل
      orderSummary.style.display = 'none';
    }
    
    // Refresh icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
    
    console.log('✅ Order summary updated successfully');
    
  } catch (error) {
    console.error('❌ Failed to update order summary:', error);
    
    // Fallback display
    orderItems.innerHTML = `
      <div class="error-message" style="padding: 24px; text-align: center; background: #ffebee; border-radius: 8px; border-left: 4px solid #f44336;">
        <i data-lucide="alert-circle" style="width: 48px; height: 48px; color: #f44336; margin-bottom: 12px;"></i>
        <div style="font-size: 16px; font-weight: 600; color: #c62828; margin-bottom: 8px;">
          ${lang === 'ar' ? 'خطأ في تحميل الملخص' : 'Error Loading Summary'}
        </div>
        <div style="font-size: 13px; color: #d32f2f;">
          ${lang === 'ar' ? 'حاول مرة أخرى أو تواصل مع الدعم' : 'Try again or contact support'}
        </div>
      </div>
    `;
    
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }
}

// ================================================================
// ✅ Enhanced Modal Management Functions
// ================================================================
export function closeCheckoutModal(event) {
  if (event && event.target !== event.currentTarget) {
    return;
  }
  
  console.log('🔄 Closing checkout modal...');
  
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
      modal.classList.remove('show');
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }
  });
  
  document.body.style.overflow = '';
  console.log('✅ Checkout modal closed');
}

export function showProcessingModal(show = true, showError = false, errorMessage = '') {
  console.log('🔄 Processing modal:', { show, showError, errorMessage });
  
  const modal = document.getElementById('processingModal');
  if (!modal) {
    console.warn('⚠️ Processing modal not found');
    return;
  }
  
  const lang = window.currentLang || 'ar';
  
  if (show) {
    modal.classList.remove('hidden');
    modal.classList.add('show');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    const title = modal.querySelector('#processing-title');
    const subtitle = modal.querySelector('#processing-subtitle');
    const actions = modal.querySelector('#processingActions');
    
    if (showError) {
      if (title) title.textContent = lang === 'ar' ? 'فشل في إرسال الطلب' : 'Order Failed';
      if (subtitle) subtitle.textContent = errorMessage || (lang === 'ar' ? 'حدث خطأ أثناء معالجة طلبك' : 'An error occurred while processing your order');
      if (actions) actions.style.display = 'block';
    } else {
      if (title) title.textContent = lang === 'ar' ? 'جاري إرسال طلبك...' : 'Sending your order...';
      if (subtitle) subtitle.textContent = lang === 'ar' ? 'الرجاء الانتظار، لا تغلق الصفحة' : 'Please wait, do not close the page';
      if (actions) actions.style.display = 'none';
    }
  } else {
    modal.classList.remove('show');
    modal.classList.add('hidden');
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }
}

export function showConfirmedModal(orderId, eta, customerPhone, itemsText, orderData) {
  console.log('🔄 Showing confirmed modal:', { orderId, eta, customerPhone });
  
  const modal = document.getElementById('orderConfirmedModal');
  if (!modal) {
    console.warn('⚠️ Confirmed modal not found');
    return;
  }
  
  const lang = window.currentLang || 'ar';
  
  const orderIdEl = modal.querySelector('#confirmedOrderId');
  const etaEl = modal.querySelector('#confirmedEta');
  const branchInfoEl = modal.querySelector('#selectedBranchInfo');
  const branchNameEl = modal.querySelector('#selectedBranchName');
  const branchAddressEl = modal.querySelector('#selectedBranchAddress');
  
  if (orderIdEl) orderIdEl.textContent = orderId;
  if (etaEl) etaEl.textContent = lang === 'ar' ? `الوقت المتوقع: ≈ ${eta}` : `Estimated time: ≈ ${eta}`;
  
  if (orderData?.deliveryMethod === 'pickup' && orderData?.branch && branchInfoEl) {
    import('./checkout-delivery.js').then(({ branches }) => {
      const branch = branches[orderData.branch];
      if (branch && branchNameEl && branchAddressEl) {
        branchNameEl.textContent = branch.name[lang];
        branchAddressEl.textContent = branch.address[lang];
        branchInfoEl.style.display = 'block';
      }
    }).catch(err => {
      console.warn('⚠️ Could not load branch info for confirmed modal:', err);
    });
  } else if (branchInfoEl) {
    branchInfoEl.style.display = 'none';
  }
  
  const copyBtn = modal.querySelector('#copyOrderIdBtn');
  const whatsappBtn = modal.querySelector('#shareWhatsAppBtn');
  const trackBtn = modal.querySelector('#trackOrderBtn');
  const continueBtn = modal.querySelector('#continueShoppingBtn');
  const closeBtn = modal.querySelector('#closeConfirmedBtn');
  
  if (copyBtn) copyBtn.onclick = () => copyOrderId(orderId);
  if (whatsappBtn) whatsappBtn.onclick = () => shareOnWhatsApp(orderId, itemsText, customerPhone);
  if (trackBtn) trackBtn.onclick = () => openTrackingModal(orderId);
  if (continueBtn) continueBtn.onclick = closeCheckoutModal;
  if (closeBtn) closeBtn.onclick = closeCheckoutModal;
  
  modal.classList.remove('hidden');
  modal.classList.add('show');
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  
  console.log('✅ Confirmed modal shown');
}

// ================================================================
// ✅ Enhanced Form Management
// ================================================================
export function resetFormFields() {
  console.log('🔄 Resetting form fields...');
  
  const fields = [
    'customerName',
    'customerPhone', 
    'customerAddress',
    'orderNotes',
    'promoCodeInput'
  ];
  
  fields.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (field) {
      field.value = '';
      field.disabled = false;
    }
  });
  
  const promoStatus = document.getElementById('promoStatus');
  if (promoStatus) {
    promoStatus.style.display = 'none';
    promoStatus.innerHTML = '';
  }
  
  const locationBtn = document.getElementById('locationBtn');
  if (locationBtn) {
    locationBtn.classList.remove('active');
    locationBtn.disabled = false;
    const lang = window.currentLang || 'ar';
    locationBtn.innerHTML = `
      <i data-lucide="navigation"></i>
      <span>${lang === 'ar' ? 'استخدام الموقع الحالي' : 'Use Current Location'}</span>
    `;
  }
  
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  
  console.log('✅ Form fields reset');
}

export function fillSavedUserData() {
  console.log('🔄 Filling saved user data...');
  
  const userData = storage.getUserData();
  if (!userData) {
    console.log('⚠️ No saved user data found');
    return;
  }
  
  const nameField = document.getElementById('customerName');
  if (nameField && userData.name) {
    nameField.value = userData.name;
  }
  
  const phoneField = document.getElementById('customerPhone');
  if (phoneField && userData.phone) {
    phoneField.value = userData.phone;
  }
  
  console.log('✅ Saved user data filled');
}

export function saveFormData() {
  const nameField = document.getElementById('customerName');
  const phoneField = document.getElementById('customerPhone');
  
  if (nameField?.value || phoneField?.value) {
    const userData = storage.getUserData() || {};
    
    if (nameField?.value) userData.name = nameField.value;
    if (phoneField?.value) userData.phone = phoneField.value;
    
    storage.setUserData(userData);
    console.log('💾 Form data saved');
  }
}

export function restoreFormData() {
  saveFormData();
}

// ================================================================
// ✅ Enhanced UI Reset Function
// ================================================================
export function resetCheckoutUI() {
  console.log('🔄 Resetting checkout UI...');
  
  document.querySelectorAll('.delivery-option').forEach(option => {
    option.classList.remove('selected');
  });
  
  document.querySelectorAll('.branch-card').forEach(card => {
    card.classList.remove('selected');
  });
  
  const branchSelection = document.getElementById('branchSelection');
  if (branchSelection) {
    branchSelection.style.display = 'none';
  }
  
  const addressGroup = document.getElementById('addressGroup');
  if (addressGroup) {
    addressGroup.style.display = 'none';
  }
  
  const checkoutForm = document.getElementById('checkoutForm');
  if (checkoutForm) {
    checkoutForm.classList.remove('show');
  }
  
  console.log('✅ Checkout UI reset');
}

// ================================================================
// ✅ Enhanced Sharing Functions
// ================================================================
export function copyOrderId(orderId) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(orderId).then(() => {
      const lang = window.currentLang || 'ar';
      showToast(
        lang === 'ar' ? 'تم النسخ!' : 'Copied!',
        lang === 'ar' ? 'تم نسخ رقم الطلب' : 'Order ID copied',
        'success'
      );
    }).catch(err => {
      console.warn('⚠️ Could not copy to clipboard:', err);
      fallbackCopyTextToClipboard(orderId);
    });
  } else {
    fallbackCopyTextToClipboard(orderId);
  }
}

function fallbackCopyTextToClipboard(text) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.top = '0';
  textArea.style.left = '0';
  textArea.style.width = '2em';
  textArea.style.height = '2em';
  textArea.style.padding = '0';
  textArea.style.border = 'none';
  textArea.style.outline = 'none';
  textArea.style.boxShadow = 'none';
  textArea.style.background = 'transparent';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  
  try {
    document.execCommand('copy');
    const lang = window.currentLang || 'ar';
    showToast(
      lang === 'ar' ? 'تم النسخ!' : 'Copied!',
      lang === 'ar' ? 'تم نسخ رقم الطلب' : 'Order ID copied',
      'success'
    );
  } catch (err) {
    console.error('❌ Fallback copy failed:', err);
    const lang = window.currentLang || 'ar';
    showToast(
      lang === 'ar' ? 'خطأ' : 'Error',
      lang === 'ar' ? 'فشل النسخ' : 'Copy failed',
      'error'
    );
  }
  
  document.body.removeChild(textArea);
}

export function shareOnWhatsApp(orderId, itemsText, customerPhone) {
  const lang = window.currentLang || 'ar';
  const message = lang === 'ar' 
    ? `طلبي من المطعم 🍕\nرقم الطلب: ${orderId}\nالطلبات: ${itemsText}\nللاستفسار: ${customerPhone}`
    : `My restaurant order 🍕\nOrder ID: ${orderId}\nItems: ${itemsText}\nPhone: ${customerPhone}`;
  
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank');
}

// ================================================================
// ✅ Enhanced Tracking Functions  
// ================================================================
export function openTrackingModal(orderId = '') {
  console.log('🔄 Opening tracking modal with order ID:', orderId);
  
  const modal = document.getElementById('trackingModal');
  if (!modal) {
    console.warn('⚠️ Tracking modal not found');
    return;
  }
  
  closeCheckoutModal();
  
  const trackingInput = document.getElementById('trackingInput');
  if (trackingInput && orderId) {
    trackingInput.value = orderId;
  }
  
  const trackingResult = document.getElementById('trackingResult');
  if (trackingResult) {
    trackingResult.style.display = 'none';
    trackingResult.innerHTML = '';
  }
  
  modal.classList.remove('hidden');
  modal.classList.add('show');
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  
  if (trackingInput) {
    setTimeout(() => trackingInput.focus(), 100);
  }
  
  console.log('✅ Tracking modal opened');
}

export async function checkOrderStatus() {
  console.log('🔄 Checking order status...');
  
  const trackingInput = document.getElementById('trackingInput');
  const trackingResult = document.getElementById('trackingResult');
  const checkBtn = document.getElementById('checkStatusBtn');
  
  if (!trackingInput || !trackingResult) {
    console.warn('⚠️ Tracking elements not found');
    return;
  }
  
  const orderId = trackingInput.value.trim();
  const lang = window.currentLang || 'ar';
  
  if (!orderId) {
    showToast(
      lang === 'ar' ? 'خطأ' : 'Error',
      lang === 'ar' ? 'الرجاء إدخال رقم الطلب' : 'Please enter order ID',
      'error'
    );
    return;
  }
  
  if (checkBtn) {
    checkBtn.disabled = true;
    checkBtn.innerHTML = '<i data-lucide="loader"></i><span>جاري البحث...</span>';
  }
  
  try {
    const { api } = await import('../api.js');
    const result = await api.getOrderStatus(orderId);
    
    if (result && result.found) {
      const { status, eta, items, total, deliveryMethod, branch } = result;
      
      let statusText = status;
      let statusColor = '#2196F3';
      
      const statusMap = {
        'pending': { ar: 'قيد الانتظار', en: 'Pending', color: '#ff9800' },
        'confirmed': { ar: 'تم التأكيد', en: 'Confirmed', color: '#2196F3' },
        'preparing': { ar: 'قيد التحضير', en: 'Preparing', color: '#ff5722' },
        'ready': { ar: 'جاهز للاستلام', en: 'Ready', color: '#4caf50' },
        'out_for_delivery': { ar: 'في الطريق', en: 'Out for Delivery', color: '#9c27b0' },
        'delivered': { ar: 'تم التوصيل', en: 'Delivered', color: '#4caf50' },
        'cancelled': { ar: 'ملغي', en: 'Cancelled', color: '#f44336' }
      };
      
      if (statusMap[status]) {
        statusText = statusMap[status][lang];
        statusColor = statusMap[status].color;
      }
      
      let resultHtml = `
        <div class="tracking-order-info" style="text-align: center; padding: 20px;">
          <div class="tracking-status" style="margin-bottom: 16px;">
            <div class="status-badge" style="display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; background: ${statusColor}; color: white; border-radius: 20px; font-weight: 600;">
              <i data-lucide="package"></i>
              <span>${statusText}</span>
            </div>
          </div>
          
          <div class="tracking-details" style="background: #f8f9fa; border-radius: 8px; padding: 16px; text-align: left;">
            <div class="detail-row" style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #666;">${lang === 'ar' ? 'رقم الطلب:' : 'Order ID:'}</span>
              <span style="font-weight: 600;">${orderId}</span>
            </div>
            
            ${eta ? `
              <div class="detail-row" style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #666;">${lang === 'ar' ? 'الوقت المتوقع:' : 'ETA:'}</span>
                <span style="font-weight: 600;">${eta}</span>
              </div>
            ` : ''}
            
            ${total ? `
              <div class="detail-row" style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #666;">${lang === 'ar' ? 'الإجمالي:' : 'Total:'}</span>
                <span style="font-weight: 600;">${total.toFixed(2)} EGP</span>
              </div>
            ` : ''}
            
            <div class="detail-row" style="display: flex; justify-content: space-between;">
              <span style="color: #666;">${lang === 'ar' ? 'طريقة الاستلام:' : 'Method:'}</span>
              <span style="font-weight: 600;">${deliveryMethod === 'pickup' ? (lang === 'ar' ? 'استلام من الفرع' : 'Pickup') : (lang === 'ar' ? 'توصيل' : 'Delivery')}</span>
            </div>
          </div>
          
          ${items && items.length > 0 ? `
            <div class="tracking-items" style="margin-top: 16px; background: #f8f9fa; border-radius: 8px; padding: 16px;">
              <div style="font-weight: 600; margin-bottom: 12px; color: #333;">${lang === 'ar' ? 'عناصر الطلب:' : 'Order Items:'}</div>
              ${items.map(item => `
                <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #eee;">
                  <span>${item.name} × ${item.quantity}</span>
                  <span>${item.total.toFixed(2)} EGP</span>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      `;
      
      trackingResult.innerHTML = resultHtml;
      trackingResult.style.display = 'block';
      
    } else {
      trackingResult.innerHTML = `
        <div class="tracking-not-found" style="text-align: center; padding: 20px; color: #d32f2f;">
          <i data-lucide="search-x" style="width: 48px; height: 48px; margin-bottom: 16px;"></i>
          <h4>${lang === 'ar' ? 'الطلب غير موجود' : 'Order Not Found'}</h4>
          <p>${lang === 'ar' ? 'تحقق من رقم الطلب وحاول مرة أخرى' : 'Check the order ID and try again'}</p>
        </div>
      `;
      trackingResult.style.display = 'block';
    }
    
  } catch (error) {
    console.error('❌ Failed to check order status:', error);
    
    trackingResult.innerHTML = `
      <div class="tracking-error" style="text-align: center; padding: 20px; color: #d32f2f;">
        <i data-lucide="alert-circle" style="width: 48px; height: 48px; margin-bottom: 16px;"></i>
        <h4>${lang === 'ar' ? 'خطأ في التحقق' : 'Check Failed'}</h4>
        <p>${error.message || (lang === 'ar' ? 'حدث خطأ أثناء التحقق من الطلب' : 'An error occurred while checking the order')}</p>
      </div>
    `;
    trackingResult.style.display = 'block';
    
  } finally {
    if (checkBtn) {
      checkBtn.disabled = false;
      checkBtn.innerHTML = '<i data-lucide="search"></i><span>تحقق</span>';
    }
    
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }
}

// ================================================================
// ✅ Permission Modal Functions
// ================================================================
export function closePermissionModal() {
  console.log('🔄 Closing permission modal...');
  
  const modal = document.getElementById('permissionModal');
  if (modal) {
    modal.classList.remove('show');
    modal.classList.add('hidden');
    modal.style.display = 'none';
  }
}

console.log('✅ checkout-ui.js loaded successfully (Enhanced Version)');