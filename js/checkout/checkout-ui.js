// ================================================================
// CHECKOUT UI - واجهة المستخدم (FIXED VERSION)
// ================================================================

console.log('🔄 Loading checkout-ui.js');

// ================================================================
// Static Imports
// ================================================================
import { cart } from '../cart.js';
import { storage } from '../storage.js';
import { showToast, formatPrice } from '../utils.js';

// ================================================================
// ✅ FIX 1: Enhanced updateOrderSummary with Better Error Handling
// ================================================================
/*
export async function updateOrderSummary() {
  console.log('🔄 Updating order summary...');
  
  const orderSummary = document.getElementById('orderSummary');
  const orderItems = document.getElementById('orderItems');
  
  if (!orderSummary || !orderItems) {
    console.warn('⚠️ Order summary elements not found');
    return;
  }

  const lang = window.currentLang || 'ar';
  
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
    
    // Build items HTML
    let itemsHtml = '';
    
    if (calculatedPrices && calculatedPrices.items) {
      // Use calculated items with server prices
      calculatedPrices.items.forEach(item => {
        itemsHtml += `
          <div class="order-item">
            <div class="order-item-info">
              <div class="order-item-name">${item.name}</div>
              <div class="order-item-details">
                <span class="quantity">× ${item.quantity}</span>
                <span class="unit-price">${formatPrice(item.price)} ${lang === 'ar' ? 'ج.م' : 'EGP'}</span>
              </div>
            </div>
            <div class="order-item-total">${formatPrice(item.total || item.price * item.quantity)} ${lang === 'ar' ? 'ج.م' : 'EGP'}</div>
          </div>
        `;
      });
    } else if (cart && cart.length > 0) {
      // Use cart items with fallback prices
      cart.forEach(item => {
        const itemTotal = (item.price || 0) * item.quantity;
        itemsHtml += `
          <div class="order-item">
            <div class="order-item-info">
              <div class="order-item-name">${item.name}</div>
              <div class="order-item-details">
                <span class="quantity">× ${item.quantity}</span>
                <span class="unit-price">${formatPrice(item.price || 0)} ${lang === 'ar' ? 'ج.م' : 'EGP'}</span>
              </div>
            </div>
            <div class="order-item-total">${formatPrice(itemTotal)} ${lang === 'ar' ? 'ج.م' : 'EGP'}</div>
          </div>
        `;
      });
    }
    
    // Build totals HTML
    let totalsHtml = '';
    
    if (calculatedPrices) {
      const { subtotal, deliveryFee, discount, total } = calculatedPrices;
      
      totalsHtml = `
        <div class="order-totals">
          <div class="order-total-line">
            <span>${lang === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}</span>
            <span>${formatPrice(subtotal)} ${lang === 'ar' ? 'ج.م' : 'EGP'}</span>
          </div>
          ${deliveryFee > 0 ? `
            <div class="order-total-line">
              <span>${lang === 'ar' ? 'رسوم التوصيل' : 'Delivery Fee'}</span>
              <span>${formatPrice(deliveryFee)} ${lang === 'ar' ? 'ج.م' : 'EGP'}</span>
            </div>
          ` : ''}
          ${discount > 0 ? `
            <div class="order-total-line discount">
              <span>${lang === 'ar' ? 'الخصم' : 'Discount'}</span>
              <span>-${formatPrice(discount)} ${lang === 'ar' ? 'ج.م' : 'EGP'}</span>
            </div>
          ` : ''}
          <div class="order-total-line total">
            <span>${lang === 'ar' ? 'الإجمالي' : 'Total'}</span>
            <span>${formatPrice(total)} ${lang === 'ar' ? 'ج.م' : 'EGP'}</span>
          </div>
        </div>
      `;
      
      // Show offline indicator if applicable
      if (calculatedPrices.isOffline) {
        totalsHtml += `
          <div class="offline-indicator" style="padding: 8px; background: #fff3cd; border-radius: 4px; color: #856404; font-size: 12px; text-align: center; margin-top: 8px;">
            <i data-lucide="wifi-off" style="width: 14px; height: 14px;"></i>
            ${lang === 'ar' ? 'الأسعار تقديرية - سيتم التأكيد' : 'Estimated prices - will be confirmed'}
          </div>
        `;
      }
    } else if (deliveryMethod) {
      // Show calculation in progress
      totalsHtml = `
        <div class="calculating-prices" style="padding: 16px; text-align: center; color: #666;">
          <i data-lucide="loader" style="width: 20px; height: 20px; animation: spin 1s linear infinite;"></i>
          <span style="margin-left: 8px;">${lang === 'ar' ? 'جاري حساب الأسعار...' : 'Calculating prices...'}</span>
        </div>
      `;
    }
    
    // Combine HTML
    orderItems.innerHTML = itemsHtml + totalsHtml;
    
    // Add branch info if selected
    if (deliveryMethod === 'pickup' && selectedBranch) {
      try {
        const { branches } = await import('./checkout-delivery.js');
        const branch = branches[selectedBranch];
        
        if (branch) {
          const branchInfo = `
            <div class="selected-branch-info" style="margin-top: 12px; padding: 8px; background: #f0f7ff; border-radius: 6px; border-left: 3px solid #2196F3;">
              <div style="font-size: 12px; color: #1976D2; margin-bottom: 4px;">
                <i data-lucide="store" style="width: 14px; height: 14px;"></i>
                ${lang === 'ar' ? 'فرع الاستلام' : 'Pickup Branch'}
              </div>
              <div style="font-weight: 600; color: #333;">${branch.name[lang]}</div>
              <div style="font-size: 12px; color: #666;">${branch.address[lang]}</div>
            </div>
          `;
          orderItems.insertAdjacentHTML('beforeend', branchInfo);
        }
      } catch (err) {
        console.warn('⚠️ Could not load branch info:', err);
      }
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
      <div class="error-message" style="padding: 16px; text-align: center; color: #d32f2f;">
        <i data-lucide="alert-circle"></i>
        <span style="margin-left: 8px;">${lang === 'ar' ? 'خطأ في تحميل الملخص' : 'Error loading summary'}</span>
      </div>
    `;
    
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }
}*/
export async function updateOrderSummary() {
  console.log('🔄 Updating order summary...');
  
  const orderSummary = document.getElementById('orderSummary');
  const orderItems = document.getElementById('orderItems');
  
  if (!orderSummary || !orderItems) {
    console.warn('⚠️ Order summary elements not found');
    return;
  }

  const lang = window.currentLang || 'ar';
  
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

    // أولاً: نخفي ملخص الطلب في البداية
    orderSummary.style.display = 'none';
    
    // ثانياً: لما يتم اختيار طريقة التوصيل، نعرض ملخص الأسعار
    if (deliveryMethod) {
      orderSummary.style.display = 'block';
      
      // Build items HTML
      let itemsHtml = '';
      
      if (calculatedPrices && calculatedPrices.items) {
        // Use calculated items with server prices
        calculatedPrices.items.forEach(item => {
          itemsHtml += `
            <div class="order-item">
              <div class="order-item-info">
                <div class="order-item-name">${item.name}</div>
                <div class="order-item-details">
                  <span class="quantity">× ${item.quantity}</span>
                  <span class="unit-price">${formatPrice(item.price)} ${lang === 'ar' ? 'ج.م' : 'EGP'}</span>
                </div>
              </div>
              <div class="order-item-total">${formatPrice(item.total || item.price * item.quantity)} ${lang === 'ar' ? 'ج.م' : 'EGP'}</div>
            </div>
          `;
        });
      } else if (cart && cart.length > 0) {
        // Use cart items with fallback prices
        cart.forEach(item => {
          const itemTotal = (item.price || 0) * item.quantity;
          itemsHtml += `
            <div class="order-item">
              <div class="order-item-info">
                <div class="order-item-name">${item.name}</div>
                <div class="order-item-details">
                  <span class="quantity">× ${item.quantity}</span>
                  <span class="unit-price">${formatPrice(item.price || 0)} ${lang === 'ar' ? 'ج.م' : 'EGP'}</span>
                </div>
              </div>
              <div class="order-item-total">${formatPrice(itemTotal)} ${lang === 'ar' ? 'ج.م' : 'EGP'}</div>
            </div>
          `;
        });
      }
      
      // Build totals HTML
      let totalsHtml = '';
      
      if (calculatedPrices) {
        const { subtotal, deliveryFee, discount, total } = calculatedPrices;
        
        totalsHtml = `
          <div class="order-totals">
            <div class="order-total-line">
              <span>${lang === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}</span>
              <span>${formatPrice(subtotal)} ${lang === 'ar' ? 'ج.م' : 'EGP'}</span>
            </div>
            ${deliveryFee > 0 ? `
              <div class="order-total-line">
                <span>${lang === 'ar' ? 'رسوم التوصيل' : 'Delivery Fee'}</span>
                <span>${formatPrice(deliveryFee)} ${lang === 'ar' ? 'ج.م' : 'EGP'}</span>
              </div>
            ` : ''}
            ${discount > 0 ? `
              <div class="order-total-line discount">
                <span>${lang === 'ar' ? 'الخصم' : 'Discount'}</span>
                <span>-${formatPrice(discount)} ${lang === 'ar' ? 'ج.م' : 'EGP'}</span>
              </div>
            ` : ''}
            <div class="order-total-line total">
              <span>${lang === 'ar' ? 'الإجمالي' : 'Total'}</span>
              <span>${formatPrice(total)} ${lang === 'ar' ? 'ج.م' : 'EGP'}</span>
            </div>
          </div>
        `;
        
        // Show offline indicator if applicable
        if (calculatedPrices.isOffline) {
          totalsHtml += `
            <div class="offline-indicator" style="padding: 8px; background: #fff3cd; border-radius: 4px; color: #856404; font-size: 12px; text-align: center; margin-top: 8px;">
              <i data-lucide="wifi-off" style="width: 14px; height: 14px;"></i>
              ${lang === 'ar' ? 'الأسعار تقديرية - سيتم التأكيد' : 'Estimated prices - will be confirmed'}
            </div>
          `;
        }
      } else if (deliveryMethod) {
        // Show calculation in progress
        totalsHtml = `
          <div class="calculating-prices" style="padding: 16px; text-align: center; color: #666;">
            <i data-lucide="loader" style="width: 20px; height: 20px; animation: spin 1s linear infinite;"></i>
            <span style="margin-left: 8px;">${lang === 'ar' ? 'جاري حساب الأسعار...' : 'Calculating prices...'}</span>
          </div>
        `;
      }
      
      // Combine HTML
      orderItems.innerHTML = itemsHtml + totalsHtml;
      
      // Add branch info if selected
      if (deliveryMethod === 'pickup' && selectedBranch) {
        try {
          const { branches } = await import('./checkout-delivery.js');
          const branch = branches[selectedBranch];
          
          if (branch) {
            const branchInfo = `
              <div class="selected-branch-info" style="margin-top: 12px; padding: 8px; background: #f0f7ff; border-radius: 6px; border-left: 3px solid #2196F3;">
                <div style="font-size: 12px; color: #1976D2; margin-bottom: 4px;">
                  <i data-lucide="store" style="width: 14px; height: 14px;"></i>
                  ${lang === 'ar' ? 'فرع الاستلام' : 'Pickup Branch'}
                </div>
                <div style="font-weight: 600; color: #333;">${branch.name[lang]}</div>
                <div style="font-size: 12px; color: #666;">${branch.address[lang]}</div>
              </div>
            `;
            orderItems.insertAdjacentHTML('beforeend', branchInfo);
          }
        } catch (err) {
          console.warn('⚠️ Could not load branch info:', err);
        }
      }
    } else {
      // إذا مفيش طريقة توصيل مختارة، نخفي ملخص الطلب
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
      <div class="error-message" style="padding: 16px; text-align: center; color: #d32f2f;">
        <i data-lucide="alert-circle"></i>
        <span style="margin-left: 8px;">${lang === 'ar' ? 'خطأ في تحميل الملخص' : 'Error loading summary'}</span>
      </div>
    `;
    
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }
}



// ================================================================
// ✅ FIX 2: Enhanced Modal Management Functions
// ================================================================
export function closeCheckoutModal(event) {
  if (event && event.target !== event.currentTarget) {
    return; // Only close if clicked on overlay, not content
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
  
  // Restore body scroll
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
      // Show error state
      if (title) title.textContent = lang === 'ar' ? 'فشل في إرسال الطلب' : 'Order Failed';
      if (subtitle) subtitle.textContent = errorMessage || (lang === 'ar' ? 'حدث خطأ أثناء معالجة طلبك' : 'An error occurred while processing your order');
      if (actions) actions.style.display = 'block';
    } else {
      // Show loading state
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
  
  // Update modal content
  const orderIdEl = modal.querySelector('#confirmedOrderId');
  const etaEl = modal.querySelector('#confirmedEta');
  const branchInfoEl = modal.querySelector('#selectedBranchInfo');
  const branchNameEl = modal.querySelector('#selectedBranchName');
  const branchAddressEl = modal.querySelector('#selectedBranchAddress');
  
  if (orderIdEl) orderIdEl.textContent = orderId;
  if (etaEl) etaEl.textContent = lang === 'ar' ? `الوقت المتوقع: ≈ ${eta}` : `Estimated time: ≈ ${eta}`;
  
  // Show branch info if pickup
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
  
  // Setup event handlers
  const copyBtn = modal.querySelector('#copyOrderIdBtn');
  const whatsappBtn = modal.querySelector('#shareWhatsAppBtn');
  const trackBtn = modal.querySelector('#trackOrderBtn');
  const continueBtn = modal.querySelector('#continueShoppingBtn');
  const closeBtn = modal.querySelector('#closeConfirmedBtn');
  
  if (copyBtn) {
    copyBtn.onclick = () => copyOrderId(orderId);
  }
  
  if (whatsappBtn) {
    whatsappBtn.onclick = () => shareOnWhatsApp(orderId, itemsText, customerPhone);
  }
  
  if (trackBtn) {
    trackBtn.onclick = () => openTrackingModal(orderId);
  }
  
  if (continueBtn) {
    continueBtn.onclick = closeCheckoutModal;
  }
  
  if (closeBtn) {
    closeBtn.onclick = closeCheckoutModal;
  }
  
  // Show modal
  modal.classList.remove('hidden');
  modal.classList.add('show');
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  
  // Refresh icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  
  console.log('✅ Confirmed modal shown');
}

// ================================================================
// ✅ FIX 3: Enhanced Form Management
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
  
  // Reset promo status
  const promoStatus = document.getElementById('promoStatus');
  if (promoStatus) {
    promoStatus.style.display = 'none';
    promoStatus.innerHTML = '';
  }
  
  // Reset location button
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
  
  // Fill name
  const nameField = document.getElementById('customerName');
  if (nameField && userData.name) {
    nameField.value = userData.name;
  }
  
  // Fill phone  
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
  saveFormData(); // Auto-save current data
}

// ================================================================
// ✅ FIX 4: Enhanced UI Reset Function
// ================================================================
export function resetCheckoutUI() {
  console.log('🔄 Resetting checkout UI...');
  
  // Reset delivery method selection
  document.querySelectorAll('.delivery-option').forEach(option => {
    option.classList.remove('selected');
  });
  
  // Reset branch selection
  document.querySelectorAll('.branch-card').forEach(card => {
    card.classList.remove('selected');
  });
  
  // Hide branch selection
  const branchSelection = document.getElementById('branchSelection');
  if (branchSelection) {
    branchSelection.style.display = 'none';
  }
  
  // Hide address group
  const addressGroup = document.getElementById('addressGroup');
  if (addressGroup) {
    addressGroup.style.display = 'none';
  }
  
  // Hide checkout form initially
  const checkoutForm = document.getElementById('checkoutForm');
  if (checkoutForm) {
    checkoutForm.classList.remove('show');
  }
  
  console.log('✅ Checkout UI reset');
}

// ================================================================
// ✅ FIX 5: Enhanced Sharing Functions
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
// ✅ FIX 6: Enhanced Tracking Functions  
// ================================================================
export function openTrackingModal(orderId = '') {
  console.log('🔄 Opening tracking modal with order ID:', orderId);
  
  const modal = document.getElementById('trackingModal');
  if (!modal) {
    console.warn('⚠️ Tracking modal not found');
    return;
  }
  
  // Close other modals first
  closeCheckoutModal();
  
  // Pre-fill order ID if provided
  const trackingInput = document.getElementById('trackingInput');
  if (trackingInput && orderId) {
    trackingInput.value = orderId;
  }
  
  // Clear previous results
  const trackingResult = document.getElementById('trackingResult');
  if (trackingResult) {
    trackingResult.style.display = 'none';
    trackingResult.innerHTML = '';
  }
  
  // Show modal
  modal.classList.remove('hidden');
  modal.classList.add('show');
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  
  // Focus input
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
  
  // Show loading
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
      
      // Map status to user-friendly text
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
      
      // Build result HTML
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
                <span style="font-weight: 600;">${formatPrice(total)} ${lang === 'ar' ? 'ج.م' : 'EGP'}</span>
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
                  <span>${formatPrice(item.total)} ${lang === 'ar' ? 'ج.م' : 'EGP'}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      `;
      
      trackingResult.innerHTML = resultHtml;
      trackingResult.style.display = 'block';
      
    } else {
      // Order not found
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
    // Reset button
    if (checkBtn) {
      checkBtn.disabled = false;
      checkBtn.innerHTML = '<i data-lucide="search"></i><span>تحقق</span>';
    }
    
    // Refresh icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }
}

// ================================================================
// ✅ FIX 7: Permission Modal Functions
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

console.log('✅ checkout-ui.js loaded successfully');