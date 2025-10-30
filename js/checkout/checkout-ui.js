// ================================================================
// CHECKOUT UI - واجهة المستخدم (100% Tailwind Compatible)
// ================================================================

console.log('📄 Loading checkout-ui.js (Tailwind Refactored)');

// ================================================================
// Static Imports
// ================================================================
import { getCart, isCartEmpty } from '../cart.js';
import { showToast } from '../utils.js';
import { storage } from '../storage.js';

// ================================================================
// ✅ updateOrderSummary - 100% Tailwind
// ================================================================
export async function updateOrderSummary() {
  console.log('📄 Updating order summary...');
  
  const orderSummary = document.getElementById('orderSummary');
  const orderItems = document.getElementById('orderItems');
  
  if (!orderSummary || !orderItems) {
    console.warn('⚠️ Order summary elements not found');
    return;
  }

  const lang = window.currentLang || 'ar';
  const currentCart = getCart();
  
  try {
    const { 
      getCalculatedPrices, 
      getSelectedDeliveryMethod, 
      getSelectedBranch 
    } = await import('./checkout-core.js');
    
    const calculatedPrices = getCalculatedPrices();
    const deliveryMethod = getSelectedDeliveryMethod();
    const selectedBranch = getSelectedBranch();
    
    console.log('📄 Order summary state:', {
      calculatedPrices: !!calculatedPrices,
      deliveryMethod,
      selectedBranch,
      cartItems: currentCart?.length || 0
    });

    orderSummary.style.display = 'none';
    
    if (deliveryMethod && calculatedPrices) {
      orderSummary.style.display = 'block';
      
      // ✅ Header - 100% Tailwind
      let itemsHtml = `
        <div class="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-primary to-secondary rounded-t-xl text-white font-bold text-sm shadow-md">
          <svg class="w-4 h-4" aria-hidden="true"><use href="#receipt"></use></svg>
          <span>${lang === 'ar' ? 'ملخص الطلب' : 'Order Summary'}</span>
        </div>
      `;
      
      // ✅ Items List - 100% Tailwind
      if (calculatedPrices.items && calculatedPrices.items.length > 0) {
        itemsHtml += '<div class="bg-white dark:bg-gray-800 border-x-2 border-pink-100 dark:border-gray-700">';
        
        calculatedPrices.items.forEach((item, index) => {
          const itemTotal = item.total || (item.price * item.quantity);
          const isLast = index === calculatedPrices.items.length - 1;
          
          itemsHtml += `
            <div class="flex justify-between items-start p-4 ${!isLast ? 'border-b border-gray-100 dark:border-gray-700' : ''}">
              <div class="flex-1 min-w-0">
                <div class="font-semibold text-gray-800 dark:text-gray-100 text-sm mb-1.5 truncate">${item.name}</div>
                <div class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <span class="inline-flex items-center justify-center bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md font-medium">
                    × ${item.quantity}
                  </span>
                  <span class="font-medium">${item.price.toFixed(2)} ${lang === 'ar' ? 'ج.م' : 'EGP'}</span>
                </div>
              </div>
              <div class="font-bold text-primary text-base ml-3 shrink-0">
                ${itemTotal.toFixed(2)} <span class="text-xs">${lang === 'ar' ? 'ج.م' : 'EGP'}</span>
              </div>
            </div>
          `;
        });
        
        itemsHtml += '</div>';
      }
      
      const { subtotal, deliveryFee, discount, total } = calculatedPrices;
      
      // ✅ Totals Section - 100% Tailwind
      let totalsHtml = `
        <div class="bg-gray-50 dark:bg-gray-800 border-2 border-pink-100 dark:border-gray-700 border-t-0 rounded-b-xl p-4 space-y-3">
      `;
      
      // Subtotal
      totalsHtml += `
        <div class="flex justify-between items-center py-2">
          <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <svg class="w-4 h-4" aria-hidden="true"><use href="#shopping-bag"></use></svg>
            <span class="font-medium">${lang === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}</span>
          </div>
          <span class="text-base font-bold text-gray-800 dark:text-gray-100">
            ${subtotal.toFixed(2)} <span class="text-xs font-medium">${lang === 'ar' ? 'ج.م' : 'EGP'}</span>
          </span>
        </div>
      `;
      
      // Delivery Fee
      if (deliveryMethod === 'delivery') {
        if (deliveryFee > 0) {
          totalsHtml += `
            <div class="flex justify-between items-center py-2">
              <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <svg class="w-4 h-4" aria-hidden="true"><use href="#truck"></use></svg>
                <span class="font-medium">${lang === 'ar' ? 'رسوم التوصيل' : 'Delivery Fee'}</span>
                ${calculatedPrices.deliveryInfo?.isEstimated ? `
                  <span class="inline-flex items-center bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 px-2 py-0.5 rounded-full text-xs font-bold">
                    ${lang === 'ar' ? 'تقديري' : 'Est.'}
                  </span>
                ` : ''}
              </div>
              <span class="text-base font-bold text-gray-800 dark:text-gray-100">
                ${deliveryFee.toFixed(2)} <span class="text-xs font-medium">${lang === 'ar' ? 'ج.م' : 'EGP'}</span>
              </span>
            </div>
          `;
          
          // Estimated Notice
          if (calculatedPrices.deliveryInfo?.isEstimated) {
            totalsHtml += `
              <div class="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 rounded-lg">
                <svg class="w-5 h-5 text-yellow-600 dark:text-yellow-500 shrink-0 mt-0.5" aria-hidden="true">
                  <use href="#info"></use>
                </svg>
                <div class="flex-1 text-xs leading-relaxed">
                  <div class="font-bold text-yellow-800 dark:text-yellow-400 mb-1">
                    ${lang === 'ar' ? 'ملاحظة هامة' : 'Important Note'}
                  </div>
                  <div class="text-yellow-700 dark:text-yellow-500">
                    ${lang === 'ar' ? 'رسوم التوصيل تقديرية. سيتم التواصل معك لتأكيد الموقع وحساب الرسوم الفعلية.' : 'Delivery fee is estimated. We will contact you to confirm location and calculate actual fee.'}
                  </div>
                </div>
              </div>
            `;
          }
        } else {
          totalsHtml += `
            <div class="flex justify-between items-center py-2">
              <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <svg class="w-4 h-4" aria-hidden="true"><use href="#truck"></use></svg>
                <span class="font-medium">${lang === 'ar' ? 'رسوم التوصيل' : 'Delivery Fee'}</span>
              </div>
              <span class="text-base font-bold text-green-600 dark:text-green-500">
                ${lang === 'ar' ? 'مجاني' : 'FREE'}
              </span>
            </div>
          `;
        }
      }
      
      // Discount
      if (discount > 0) {
        totalsHtml += `
          <div class="flex justify-between items-center py-2 px-3 -mx-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <div class="flex items-center gap-2 text-sm">
              <svg class="w-4 h-4 text-orange-600 dark:text-orange-500" aria-hidden="true">
                <use href="#tag"></use>
              </svg>
              <span class="font-bold text-orange-600 dark:text-orange-500">${lang === 'ar' ? 'الخصم' : 'Discount'}</span>
            </div>
            <span class="text-base font-bold text-orange-600 dark:text-orange-500">
              -${discount.toFixed(2)} <span class="text-xs font-medium">${lang === 'ar' ? 'ج.م' : 'EGP'}</span>
            </span>
          </div>
        `;
      }
      
      // Divider
      totalsHtml += '<div class="border-t-2 border-dashed border-gray-300 dark:border-gray-600 my-2"></div>';
      
      // Total
      totalsHtml += `
        <div class="flex justify-between items-center p-4 -mx-4 -mb-4 bg-gradient-to-r from-primary to-secondary rounded-b-xl shadow-lg">
          <div class="flex items-center gap-2 text-white">
            <svg class="w-5 h-5" aria-hidden="true"><use href="#wallet"></use></svg>
            <span class="font-bold text-base">${lang === 'ar' ? 'الإجمالي النهائي' : 'Total Amount'}</span>
          </div>
          <span class="text-2xl font-black text-white">
            ${total.toFixed(2)} <span class="text-sm font-bold">${lang === 'ar' ? 'ج.م' : 'EGP'}</span>
          </span>
        </div>
      `;
      
      totalsHtml += '</div>';
      
      // Offline Notice
      if (calculatedPrices.isOffline) {
        totalsHtml += `
          <div class="mt-3 flex items-start gap-2.5 p-3 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 rounded-lg">
            <svg class="w-5 h-5 text-yellow-600 dark:text-yellow-500 shrink-0 mt-0.5" aria-hidden="true">
              <use href="#wifi-off"></use>
            </svg>
            <div class="flex-1 text-xs leading-relaxed">
              <div class="font-bold text-yellow-800 dark:text-yellow-400 mb-1">
                ${lang === 'ar' ? '⚠️ وضع عدم الاتصال' : '⚠️ Offline Mode'}
              </div>
              <div class="text-yellow-700 dark:text-yellow-500">
                ${lang === 'ar' ? 'الأسعار تقديرية - سيتم التأكيد عند الاتصال' : 'Prices are estimated - will be confirmed when online'}
              </div>
            </div>
          </div>
        `;
      }
      
      // Branch Info (Pickup)
      if (deliveryMethod === 'pickup' && selectedBranch) {
        try {
          const { branches } = await import('./checkout-delivery.js');
          const branch = branches[selectedBranch];
          
          if (branch) {
            totalsHtml += `
              <div class="mt-3 p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl">
                <div class="flex items-center gap-2 mb-3">
                  <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" aria-hidden="true">
                    <use href="#map-pin"></use>
                  </svg>
                  <span class="text-sm font-bold text-blue-800 dark:text-blue-400">
                    ${lang === 'ar' ? 'فرع الاستلام' : 'Pickup Branch'}
                  </span>
                </div>
                <div class="font-bold text-blue-900 dark:text-blue-300 text-base mb-2">
                  ${branch.name[lang]}
                </div>
                <div class="flex items-start gap-2 text-sm text-blue-700 dark:text-blue-400">
                  <svg class="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true">
                    <use href="#navigation"></use>
                  </svg>
                  <span>${branch.address[lang]}</span>
                </div>
              </div>
            `;
          }
        } catch (err) {
          console.warn('⚠️ Could not load branch info:', err);
        }
      }
      
      orderItems.innerHTML = itemsHtml + totalsHtml;
      
    } else if (deliveryMethod && !calculatedPrices) {
      // Loading State
      orderSummary.style.display = 'block';
      orderItems.innerHTML = `
        <div class="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl border-2 border-gray-200 dark:border-gray-600">
          <div class="w-12 h-12 border-4 border-gray-200 dark:border-gray-600 border-t-primary rounded-full animate-spin mb-4"></div>
          <div class="text-base font-bold text-primary mb-2">
            ${lang === 'ar' ? 'جاري حساب الأسعار...' : 'Calculating Prices...'}
          </div>
          <div class="text-sm text-gray-600 dark:text-gray-400">
            ${lang === 'ar' ? 'الرجاء الانتظار قليلاً' : 'Please wait a moment'}
          </div>
        </div>
      `;
    } else {
      orderSummary.style.display = 'none';
    }
    
    console.log('✅ Order summary updated successfully');
    
  } catch (error) {
    console.error('❌ Failed to update order summary:', error);
    
    orderItems.innerHTML = `
      <div class="flex flex-col items-center justify-center p-6 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-lg">
        <svg class="w-12 h-12 text-red-500 mb-3" aria-hidden="true">
          <use href="#alert-circle"></use>
        </svg>
        <div class="text-base font-bold text-red-800 dark:text-red-400 mb-2 text-center">
          ${lang === 'ar' ? 'خطأ في تحميل الملخص' : 'Error Loading Summary'}
        </div>
        <div class="text-sm text-red-700 dark:text-red-500 text-center">
          ${lang === 'ar' ? 'حاول مرة أخرى أو تواصل مع الدعم' : 'Try again or contact support'}
        </div>
      </div>
    `;
  }
}

// ================================================================
// ✅ Modal Management
// ================================================================
export function closeCheckoutModal(event) {
  if (event && event.target !== event.currentTarget) return;
  
  console.log('📄 Closing checkout modal...');
  
  const checkoutModal = document.getElementById('checkoutModal');
  if (checkoutModal) {
    checkoutModal.classList.remove('show');
    checkoutModal.classList.add('hidden');
    checkoutModal.style.display = 'none';
  }
  
  const otherModalsOpen = document.querySelector(
    '#processingModal.show, #orderConfirmedModal.show, #trackingModal.show, #permissionModal.show'
  );
  
  if (!otherModalsOpen) {
    document.body.style.overflow = '';
  }
  
  console.log('✅ Checkout modal closed');
}

export function closeConfirmedModal() {
  console.log('📄 Closing confirmed modal...');
  
  const modal = document.getElementById('orderConfirmedModal');
  if (modal) {
    modal.classList.remove('show');
    modal.classList.add('hidden');
    modal.style.display = 'none';
  }
  
  console.log('✅ Confirmed modal closed');
}

export function setupModalCloseHandlers() {
  console.log('🔧 Setting up modal close handlers...');
  
  const closeConfirmedBtn = document.getElementById('closeConfirmedBtn');
  if (closeConfirmedBtn) {
    closeConfirmedBtn.onclick = closeConfirmedModal;
  }
  
  document.addEventListener('click', function(e) {
    const confirmedModal = document.getElementById('orderConfirmedModal');
    if (confirmedModal && confirmedModal.classList.contains('show')) {
      const modalContent = confirmedModal.querySelector('.modal-content, .confirmed-content');
      if (modalContent && !modalContent.contains(e.target)) {
        closeConfirmedModal();
      }
    }
  });
  
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      const confirmedModal = document.getElementById('orderConfirmedModal');
      if (confirmedModal && confirmedModal.classList.contains('show')) {
        closeConfirmedModal();
      }
    }
  });
  
  console.log('✅ Modal close handlers ready');
}

export function showProcessingModal(show = true, showError = false, errorMessage = '') {
  console.log('📄 Processing modal:', { show, showError, errorMessage });
  
  const modal = document.getElementById('processingModal');
  if (!modal) {
    console.error('❌ Processing modal not found');
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
    const spinner = modal.querySelector('.spinner-container, .spinner');
    
    if (showError) {
      if (spinner) spinner.style.display = 'none';
      if (title) title.textContent = lang === 'ar' ? 'فشل في إرسال الطلب' : 'Order Failed';
      if (subtitle) subtitle.textContent = errorMessage || (lang === 'ar' ? 'حدث خطأ أثناء معالجة طلبك' : 'An error occurred');
      if (actions) actions.style.display = 'block';
    } else {
      if (spinner) spinner.style.display = 'flex';
      if (title) title.textContent = lang === 'ar' ? 'جاري إرسال طلبك...' : 'Sending your order...';
      if (subtitle) subtitle.textContent = lang === 'ar' ? 'الرجاء الانتظار، لا تغلق الصفحة' : 'Please wait';
      if (actions) actions.style.display = 'none';
    }
  } else {
    modal.classList.remove('show');
    modal.classList.add('hidden');
    modal.style.display = 'none';
    
    const otherModalsOpen = document.querySelector(
      '#checkoutModal.show, #orderConfirmedModal.show, #trackingModal.show, #permissionModal.show'
    );
    
    if (!otherModalsOpen) {
      document.body.style.overflow = '';
    }
  }
}

// ================================================================
// ✅ showConfirmedModal - 100% Tailwind
// ================================================================
export function showConfirmedModal(orderId, eta, customerPhone, itemsText, orderData) {
  console.log('📄 Showing confirmed modal:', { orderId, eta });
  
  const modal = document.getElementById('orderConfirmedModal');
  if (!modal) {
    console.error('❌ Confirmed modal not found in DOM');
    return;
  }
  
  const lang = window.currentLang || 'ar';
  
  // ✅ Update content
  const orderIdEl = modal.querySelector('#confirmedOrderId');
  const etaEl = modal.querySelector('#confirmedEta');
  const branchInfoEl = modal.querySelector('#selectedBranchInfo');
  const branchNameEl = modal.querySelector('#selectedBranchName');
  const branchAddressEl = modal.querySelector('#selectedBranchAddress');
  const deliveryNoticeEl = modal.querySelector('#deliveryEstimatedNotice');
  
  if (orderIdEl) orderIdEl.textContent = orderId;
  if (etaEl) etaEl.textContent = lang === 'ar' ? `الوقت المتوقع: ≈ ${eta}` : `Estimated time: ≈ ${eta}`;
  
  // ✅ Delivery Estimated Notice - 100% Tailwind
  if (deliveryNoticeEl && orderData?.deliveryMethod === 'delivery') {
    const deliveryInfo = orderData?.calculatedPrices?.deliveryInfo;
    
    if (deliveryInfo && deliveryInfo.isEstimated) {
      const message = deliveryInfo.estimatedMessage?.[lang] || 
                     (lang === 'ar' ? 'رسوم التوصيل تقديرية - سيتم التواصل معك للتأكيد' : 
                      'Delivery fee is estimated - we will contact you for confirmation');
      
      deliveryNoticeEl.innerHTML = `
        <div class="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 rounded-xl shadow-sm mt-4">
          <svg class="w-5 h-5 text-yellow-600 dark:text-yellow-500 shrink-0 mt-0.5" aria-hidden="true">
            <use href="#info"></use>
          </svg>
          <div class="flex-1">
            <div class="font-bold text-yellow-800 dark:text-yellow-400 text-sm mb-1">
              ${lang === 'ar' ? 'ملاحظة هامة' : 'Important Note'}
            </div>
            <div class="text-yellow-700 dark:text-yellow-500 text-sm leading-relaxed">
              ${message}
            </div>
          </div>
        </div>
      `;
      deliveryNoticeEl.style.display = 'block';
    } else {
      deliveryNoticeEl.style.display = 'none';
    }
  } else if (deliveryNoticeEl) {
    deliveryNoticeEl.style.display = 'none';
  }
  
  // ✅ Branch info - 100% Tailwind
  if (orderData?.deliveryMethod === 'pickup' && orderData?.branch && branchInfoEl) {
    import('./checkout-delivery.js').then(({ branches }) => {
      const branch = branches[orderData.branch];
      if (branch && branchNameEl && branchAddressEl) {
        branchNameEl.textContent = branch.name[lang];
        branchAddressEl.textContent = branch.address[lang];
        branchInfoEl.style.display = 'block';
      }
    }).catch(err => console.warn('⚠️ Branch info load failed:', err));
  } else if (branchInfoEl) {
    branchInfoEl.style.display = 'none';
  }
  
  // ✅ Setup buttons
  const copyBtn = modal.querySelector('#copyOrderIdBtn');
  const whatsappBtn = modal.querySelector('#shareWhatsAppBtn');
  const trackBtn = modal.querySelector('#trackOrderBtn');
  const continueBtn = modal.querySelector('#continueShoppingBtn');
  const closeBtn = modal.querySelector('#closeConfirmedBtn');
  
  if (copyBtn) copyBtn.onclick = () => copyOrderId(orderId);
  if (whatsappBtn) whatsappBtn.onclick = () => shareOnWhatsApp(orderId, itemsText, customerPhone);
  if (trackBtn) trackBtn.onclick = () => { closeConfirmedModal(); setTimeout(() => showTrackingModal(orderId), 300); };
  if (continueBtn) continueBtn.onclick = () => closeConfirmedModal();
  if (closeBtn) closeBtn.onclick = () => closeConfirmedModal();
  
  // ✅ Show modal
  modal.style.display = 'flex';
  modal.style.opacity = '1';
  modal.style.visibility = 'visible';
  modal.classList.remove('hidden');
  modal.classList.add('show');
  document.body.style.overflow = 'hidden';
  
  void modal.offsetHeight;
  
  console.log('✅ Confirmed modal shown');
}

// ================================================================
// ✅ Form Management
// ================================================================
export function resetFormFields() {
  console.log('📄 Resetting form fields...');
  
  const fields = [
    'customerName',
    'customerPhone', 
    'customerAddress',
    'orderNotes',
    'couponCodeInput'
  ];
  
  fields.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (field) {
      field.value = '';
      field.disabled = false;
    }
  });
  
  const couponStatus = document.getElementById('couponStatus');
  if (couponStatus) {
    couponStatus.style.display = 'none';
    couponStatus.innerHTML = '';
  }
  
  const locationBtn = document.getElementById('locationBtn');
  if (locationBtn) {
    locationBtn.classList.remove('active');
    locationBtn.disabled = false;
    const lang = window.currentLang || 'ar';
    locationBtn.innerHTML = `
      <svg class="w-4 h-4" aria-hidden="true"><use href="#navigation"></use></svg>
      <span>${lang === 'ar' ? 'استخدام الموقع الحالي' : 'Use Current Location'}</span>
    `;
  }
  
  console.log('✅ Form fields reset');
}

export function fillSavedUserData() {
  console.log('📄 Filling saved user data...');
  
  const userData = storage.getUserData();
  if (!userData) return;
  
  const nameField = document.getElementById('customerName');
  if (nameField && userData.name) nameField.value = userData.name;
  
  const phoneField = document.getElementById('customerPhone');
  if (phoneField && userData.phone) phoneField.value = userData.phone;
  
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
  }
}

export function restoreFormData() {
  saveFormData();
}

export function resetCheckoutUI() {
  console.log('📄 Resetting checkout UI...');
  
  document.querySelectorAll('.delivery-option').forEach(option => option.classList.remove('selected'));
  document.querySelectorAll('.branch-card').forEach(card => card.classList.remove('selected'));
  
  const branchSelection = document.getElementById('branchSelection');
  if (branchSelection) branchSelection.style.display = 'none';
  
  const addressGroup = document.getElementById('addressGroup');
  if (addressGroup) addressGroup.style.display = 'none';
  
  const checkoutForm = document.getElementById('checkoutForm');
  if (checkoutForm) checkoutForm.classList.remove('show');
  
  console.log('✅ Checkout UI reset');
}

// ================================================================
// ✅ Sharing Functions
// ================================================================
export function copyOrderId(orderId) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(orderId).then(() => {
      const lang = window.currentLang || 'ar';
      showToast(lang === 'ar' ? 'تم النسخ!' : 'Copied!', lang === 'ar' ? 'تم نسخ رقم الطلب' : 'Order ID copied', 'success');
    }).catch(() => fallbackCopyTextToClipboard(orderId));
  } else {
    fallbackCopyTextToClipboard(orderId);
  }
}

function fallbackCopyTextToClipboard(text) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.className = 'fixed top-0 left-0 w-0 h-0 p-0 opacity-0';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  
  try {
    document.execCommand('copy');
    const lang = window.currentLang || 'ar';
    showToast(lang === 'ar' ? 'تم النسخ!' : 'Copied!', lang === 'ar' ? 'تم نسخ رقم الطلب' : 'Order ID copied', 'success');
  } catch (err) {
    console.error('❌ Copy failed:', err);
  }
  
  document.body.removeChild(textArea);
}

export function shareOnWhatsApp(orderId, itemsText, customerPhone) {
  const lang = window.currentLang || 'ar';
  const message = lang === 'ar' 
    ? `طلبي من المطعم 🍕\nرقم الطلب: ${orderId}\nالطلبات: ${itemsText}\nللاستفسار: ${customerPhone}`
    : `My restaurant order 🍕\nOrder ID: ${orderId}\nItems: ${itemsText}\nPhone: ${customerPhone}`;
  
  window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
}

// ================================================================
// ✅ Tracking Functions - 100% Tailwind
// ================================================================
export function showTrackingModal(orderId) {
  console.log('🔍 Opening tracking modal for:', orderId);
  
  const lang = window.currentLang || 'ar';
  let modal = document.getElementById('trackingModal');
  
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'trackingModal';
    modal.className = 'fixed inset-0 bg-gray-900/80 backdrop-blur-md flex items-center justify-center z-modal p-5';
    modal.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-lg w-full shadow-2xl relative">
        <button class="absolute top-4 ${lang === 'ar' ? 'left-4' : 'right-4'} w-10 h-10 bg-gray-100 dark:bg-gray-700 hover:bg-red-500 hover:text-white rounded-full flex items-center justify-center transition-colors duration-300 group" onclick="window.closeTrackingModal?.()">
          <svg class="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" aria-hidden="true"><use href="#x"></use></svg>
        </button>
        <div id="trackingContent"></div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeTrackingModal(); });
  }

  const content = document.getElementById('trackingContent');
  if (!content) return;
  
  content.innerHTML = `
    <div class="flex flex-col items-center justify-center py-8 text-center">
      <div class="w-16 h-16 border-4 border-gray-200 dark:border-gray-600 border-t-primary rounded-full animate-spin mb-4"></div>
      <p class="text-base font-semibold text-gray-700 dark:text-gray-300">
        ${lang === 'ar' ? 'جاري البحث عن الطلب...' : 'Searching for order...'}
      </p>
    </div>
  `;
  
  modal.classList.add('show');
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  
  fetchOrderStatus(orderId);
}

async function fetchOrderStatus(orderId) {
  const lang = window.currentLang || 'ar';
  const content = document.getElementById('trackingContent');
  
  try {
    const { api } = await import('../api.js');
    const result = await api.trackOrder(orderId);
    
    content.innerHTML = `
      <div class="flex flex-col items-center text-center">
        <div class="text-7xl mb-6">📦</div>
        <h2 class="text-2xl font-black text-gray-800 dark:text-gray-100 mb-6">
          ${lang === 'ar' ? 'حالة الطلب' : 'Order Status'}
        </h2>
        <div class="w-full bg-gray-50 dark:bg-gray-700 rounded-2xl p-6 space-y-4 text-${lang === 'ar' ? 'right' : 'left'} mb-6">
          <div class="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-600">
            <span class="text-sm font-medium text-gray-600 dark:text-gray-400">
              ${lang === 'ar' ? 'رقم الطلب:' : 'Order ID:'}
            </span>
            <span class="text-base font-bold text-gray-800 dark:text-gray-100">
              ${result.data.orderId}
            </span>
          </div>
          <div class="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-600">
            <span class="text-sm font-medium text-gray-600 dark:text-gray-400">
              ${lang === 'ar' ? 'الحالة:' : 'Status:'}
            </span>
            <span class="text-lg font-black text-primary">
              ${result.data.status}
            </span>
          </div>
          <div class="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-600">
            <span class="text-sm font-medium text-gray-600 dark:text-gray-400">
              ${lang === 'ar' ? 'التاريخ:' : 'Date:'}
            </span>
            <span class="text-base font-bold text-gray-800 dark:text-gray-100">
              ${result.data.date}
            </span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-sm font-medium text-gray-600 dark:text-gray-400">
              ${lang === 'ar' ? 'المبلغ الإجمالي:' : 'Total Amount:'}
            </span>
            <span class="text-xl font-black text-green-600 dark:text-green-500">
              ${result.data.total} ${lang === 'ar' ? 'ج.م' : 'EGP'}
            </span>
          </div>
        </div>
        <button onclick="window.closeTrackingModal?.()" class="w-full py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-2xl font-bold text-base shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          ${lang === 'ar' ? 'إغلاق' : 'Close'}
        </button>
      </div>
    `;
  } catch (error) {
    console.error('❌ Tracking failed:', error);
    const { api } = await import('../api.js');
    const errorMessage = api.getErrorMessage ? api.getErrorMessage(error, lang) : error.message;
    
    content.innerHTML = `
      <div class="flex flex-col items-center text-center">
        <div class="text-7xl mb-6">❌</div>
        <h2 class="text-2xl font-black text-red-600 dark:text-red-500 mb-3">
          ${lang === 'ar' ? 'خطأ' : 'Error'}
        </h2>
        <p class="text-base text-gray-600 dark:text-gray-400 mb-6">
          ${errorMessage}
        </p>
        <button onclick="window.closeTrackingModal?.()" class="w-full py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold text-base shadow-lg transition-colors duration-300">
          ${lang === 'ar' ? 'إغلاق' : 'Close'}
        </button>
      </div>
    `;
  }
}

export function closeTrackingModal() {
  console.log('📄 Closing tracking modal...');
  const modal = document.getElementById('trackingModal');
  if (modal) {
    modal.classList.remove('show');
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }
}

export function openTrackingModal(orderId = '') {
  showTrackingModal(orderId);
}

export async function checkOrderStatus() {
  console.log('📄 Checking order status...');
  
  const trackingInput = document.getElementById('trackingInput');
  const trackingResult = document.getElementById('trackingResult');
  const checkBtn = document.getElementById('checkStatusBtn');
  
  if (!trackingInput || !trackingResult) return;
  
  const orderId = trackingInput.value.trim();
  const lang = window.currentLang || 'ar';
  
  if (!orderId) {
    showToast(lang === 'ar' ? 'خطأ' : 'Error', lang === 'ar' ? 'الرجاء إدخال رقم الطلب' : 'Please enter order ID', 'error');
    return;
  }
  
  if (checkBtn) {
    checkBtn.disabled = true;
    checkBtn.innerHTML = `
      <svg class="w-5 h-5 animate-spin" aria-hidden="true"><use href="#loader"></use></svg>
      <span>${lang === 'ar' ? 'جاري البحث...' : 'Searching...'}</span>
    `;
  }
  
  try {
    const { api } = await import('../api.js');
    const result = await api.getOrderStatus(orderId);
    
    if (result && result.found) {
      const { status, eta, items, total, deliveryMethod } = result;
      
      let statusText = status;
      let statusColor = 'bg-blue-500';
      
      const statusMap = {
        'pending': { ar: 'قيد الانتظار', en: 'Pending', color: 'bg-orange-500' },
        'confirmed': { ar: 'تم التأكيد', en: 'Confirmed', color: 'bg-blue-500' },
        'preparing': { ar: 'قيد التحضير', en: 'Preparing', color: 'bg-red-500' },
        'ready': { ar: 'جاهز للاستلام', en: 'Ready', color: 'bg-green-500' },
        'out_for_delivery': { ar: 'في الطريق', en: 'Out for Delivery', color: 'bg-purple-500' },
        'delivered': { ar: 'تم التوصيل', en: 'Delivered', color: 'bg-green-600' },
        'cancelled': { ar: 'ملغي', en: 'Cancelled', color: 'bg-red-600' }
      };
      
      if (statusMap[status]) {
        statusText = statusMap[status][lang];
        statusColor = statusMap[status].color;
      }
      
      trackingResult.innerHTML = `
        <div class="flex flex-col items-center p-5 text-center">
          <div class="mb-4">
            <span class="inline-flex items-center gap-2 px-4 py-2 ${statusColor} text-white rounded-full font-bold text-base shadow-lg">
              <svg class="w-5 h-5" aria-hidden="true"><use href="#package"></use></svg>
              ${statusText}
            </span>
          </div>
          <div class="w-full bg-gray-50 dark:bg-gray-700 rounded-xl p-4 space-y-3 text-left">
            <div class="flex justify-between items-center">
              <span class="text-sm font-medium text-gray-600 dark:text-gray-400">
                ${lang === 'ar' ? 'رقم الطلب:' : 'Order ID:'}
              </span>
              <span class="text-base font-bold text-gray-800 dark:text-gray-100">${orderId}</span>
            </div>
            ${eta ? `
            <div class="flex justify-between items-center">
              <span class="text-sm font-medium text-gray-600 dark:text-gray-400">
                ${lang === 'ar' ? 'الوقت المتوقع:' : 'ETA:'}
              </span>
              <span class="text-base font-bold text-gray-800 dark:text-gray-100">${eta}</span>
            </div>
            ` : ''}
            ${total ? `
            <div class="flex justify-between items-center">
              <span class="text-sm font-medium text-gray-600 dark:text-gray-400">
                ${lang === 'ar' ? 'الإجمالي:' : 'Total:'}
              </span>
              <span class="text-lg font-black text-green-600 dark:text-green-500">
                ${total.toFixed(2)} ${lang === 'ar' ? 'ج.م' : 'EGP'}
              </span>
            </div>
            ` : ''}
            <div class="flex justify-between items-center">
              <span class="text-sm font-medium text-gray-600 dark:text-gray-400">
                ${lang === 'ar' ? 'طريقة الاستلام:' : 'Method:'}
              </span>
              <span class="text-base font-bold text-gray-800 dark:text-gray-100">
                ${deliveryMethod === 'pickup' ? (lang === 'ar' ? 'استلام من الفرع' : 'Pickup') : (lang === 'ar' ? 'توصيل' : 'Delivery')}
              </span>
            </div>
          </div>
        </div>
      `;
      trackingResult.style.display = 'block';
    } else {
      trackingResult.innerHTML = `
        <div class="flex flex-col items-center p-6 text-center">
          <svg class="w-16 h-16 text-red-500 mb-4" aria-hidden="true"><use href="#search"></use></svg>
          <h4 class="text-lg font-bold text-red-600 dark:text-red-500">
            ${lang === 'ar' ? 'الطلب غير موجود' : 'Order Not Found'}
          </h4>
        </div>
      `;
      trackingResult.style.display = 'block';
    }
  } catch (error) {
    console.error('❌ Failed to check order status:', error);
    trackingResult.innerHTML = `
      <div class="flex flex-col items-center p-6 text-center">
        <svg class="w-16 h-16 text-red-500 mb-4" aria-hidden="true"><use href="#alert-circle"></use></svg>
        <h4 class="text-lg font-bold text-red-600 dark:text-red-500">
          ${lang === 'ar' ? 'خطأ في التحقق' : 'Check Failed'}
        </h4>
      </div>
    `;
    trackingResult.style.display = 'block';
  } finally {
    if (checkBtn) {
      checkBtn.disabled = false;
      checkBtn.innerHTML = `
        <svg class="w-5 h-5" aria-hidden="true"><use href="#search"></use></svg>
        <span>${lang === 'ar' ? 'تحقق' : 'Check'}</span>
      `;
    }
  }
}

export function closePermissionModal() {
  const modal = document.getElementById('permissionModal');
  if (modal) {
    modal.classList.remove('show');
    modal.classList.add('hidden');
    modal.style.display = 'none';
  }
}

// ================================================================
// ✅ Initialize on Load
// ================================================================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupModalCloseHandlers);
} else {
  setupModalCloseHandlers();
}

window.closeTrackingModal = closeTrackingModal;
window.closeConfirmedModal = closeConfirmedModal;

console.log('✅ checkout-ui.js loaded successfully (100% Tailwind Compatible)');