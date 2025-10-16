// ================================================================
// CHECKOUT UI - واجهة المستخدم والـ Modals (FIXED - Minimal Changes)
// ================================================================

import { cart } from '../cart.js';
import { storage } from '../storage.js';
import { showToast } from '../utils.js';
import { api } from '../api.js';
import { 
  getCalculatedPrices,         // ✅ FIX: استخدام getter
  getSelectedDeliveryMethod,   // ✅ FIX: استخدام getter
  getCurrentOrderData          // ✅ FIX: استخدام getter
} from './checkout-core.js';
import { getTierIcon, renderGamificationSummary, getUpgradeMessage } from './checkout-loyalty.js';
import { branches } from './checkout-delivery.js';

// ================================================================
// تحديث ملخص الطلب
// ================================================================
export function updateOrderSummary() {
  const orderItems = document.getElementById('orderItems');
  if (!orderItems) return;
  
  const lang = window.currentLang || 'ar';
  const currency = window.i18n?.t?.[lang]?.currency || 'ج.م';
  
  // ✅ FIX: استخدام getter بدل المتغير المباشر
  const calculatedPrices = getCalculatedPrices();
  const selectedDeliveryMethod = getSelectedDeliveryMethod();
  
  let html = '';
  
  // ✅ إذا كان لدينا أسعار محسوبة من Backend
  if (calculatedPrices && calculatedPrices.items && calculatedPrices.items.length > 0) {
    // عرض المنتجات
    calculatedPrices.items.forEach(item => {
      const name = lang === 'ar' ? item.name : (item.nameEn || item.name);
      const price = item.price || 0;
      const quantity = item.quantity || 0;
      const subtotal = (price * quantity) || 0;
      
      html += `
        <div class="order-item" style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
          <div style="flex: 1;">
            <div style="font-weight: 600;">${name}</div>
            <div style="font-size: 0.875rem; color: #999;">× ${quantity}</div>
          </div>
          <div style="text-align: right; font-weight: 600;">${subtotal.toFixed(2)} ${currency}</div>
        </div>
      `;
    });
    
    // المبلغ الفرعي
    const subtotalText = lang === 'ar' ? 'المبلغ الفرعي' : 'Subtotal';
    const subtotal = calculatedPrices.subtotal || 0;
    html += `
      <div style="display: flex; justify-content: space-between; padding: 8px 0; border-top: 1px solid #ddd; margin-top: 8px;">
        <span>${subtotalText}</span>
        <span style="font-weight: 600;">${subtotal.toFixed(2)} ${currency}</span>
      </div>
    `;
    
    // الخصم
    if (calculatedPrices.discount && calculatedPrices.discount > 0) {
      const discountPercentage = Math.round((calculatedPrices.discount / subtotal) * 100) || 0;
      const discountText = lang === 'ar' ? 'خصم' : 'Discount';
      
      html += `
        <div style="display: flex; justify-content: space-between; padding: 8px 0; color: #4CAF50;">
          <span>${discountText} (${discountPercentage}%)</span>
          <span style="font-weight: 600;">-${calculatedPrices.discount.toFixed(2)} ${currency}</span>
        </div>
      `;
      
      // رسالة الخصم
      if (calculatedPrices.discountMessage) {
        html += `
          <div style="grid-column: 1 / -1; margin-top: 8px; padding: 8px 12px; background: #e8f5e9; border-radius: 8px; font-size: 0.875rem; color: #2e7d32;">
            <i data-lucide="gift" style="width: 14px; height: 14px; display: inline; vertical-align: middle;"></i>
            ${calculatedPrices.discountMessage}
          </div>
        `;
      }
    }
    
    // رسوم التوصيل
    if (calculatedPrices.deliveryFee && calculatedPrices.deliveryFee > 0) {
      const deliveryText = lang === 'ar' ? 'رسوم التوصيل' : 'Delivery Fee';
      html += `
        <div style="display: flex; justify-content: space-between; padding: 8px 0;">
          <span>${deliveryText}</span>
          <span style="font-weight: 600;">${calculatedPrices.deliveryFee.toFixed(2)} ${currency}</span>
        </div>
      `;
    }
    
    // عرض معلومات الولاء
    if (calculatedPrices.loyaltyReward?.eligible) {
      const loyalty = calculatedPrices.loyaltyReward;
      
      html += `
        <div class="loyalty-info" style="grid-column: 1 / -1; margin-top: 12px; padding: 12px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; color: white;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            ${getTierIcon(loyalty.tier)}
            <span style="font-weight: 700; font-size: 1rem;">
              ${lang === 'ar' ? loyalty.messageAr : loyalty.messageEn}
            </span>
          </div>
          
          ${loyalty.nextTier ? `
            <div style="font-size: 0.875rem; opacity: 0.9; display: flex; align-items: center; gap: 6px;">
              <i data-lucide="arrow-up-circle" style="width: 14px; height: 14px;"></i>
              <span>
                ${lang === 'ar' 
                  ? loyalty.nextTier.note || `باقي ${loyalty.nextTier.ordersNeeded} طلب للترقية`
                  : `${loyalty.nextTier.ordersNeeded} orders to upgrade`
                }
              </span>
            </div>
          ` : ''}
        </div>
      `;
    }
    
    // عرض Gamification
    if (calculatedPrices.gamification) {
      html += renderGamificationSummary(calculatedPrices.gamification, lang);
    }
    
    // الإجمالي
    const totalText = lang === 'ar' ? 'الإجمالي' : 'Total';
    const total = calculatedPrices.total || 0;
    html += `
      <div style="display: flex; justify-content: space-between; padding: 12px 0; border-top: 2px solid #2196F3; margin-top: 8px; font-weight: 700; font-size: 1.1rem;">
        <span>${totalText}</span>
        <span style="color: #2196F3;">${total.toFixed(2)} ${currency}</span>
      </div>
    `;
    
  } else {
    // عرض تقديري من السلة
    if (!cart || cart.length === 0) {
      html = `
        <div style="text-align: center; padding: 20px; color: #999;">
          <p>${lang === 'ar' ? 'السلة فارغة' : 'Cart is empty'}</p>
        </div>
      `;
      orderItems.innerHTML = html;
      return;
    }
    
    let subtotal = 0;
    
    cart.forEach(item => {
      const allProducts = window.productsManager?.getAllProducts?.() || [];
      const product = allProducts.find(p => p.id === item.productId || p.id === item.id);
      
      if (product && product.price) {
        const name = lang === 'ar' ? product.name : (product.nameEn || product.name);
        const price = parseFloat(product.price) || 0;
        const quantity = item.quantity || 1;
        const itemTotal = price * quantity;
        subtotal += itemTotal;
        
        html += `
          <div class="order-item" style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
            <div style="flex: 1;">
              <div style="font-weight: 600;">${name}</div>
              <div style="font-size: 0.875rem; color: #999;">× ${quantity}</div>
            </div>
            <div style="text-align: right; font-weight: 600;">${itemTotal.toFixed(2)} ${currency}</div>
          </div>
        `;
      }
    });
    
    // المبلغ الفرعي
    html += `
      <div style="display: flex; justify-content: space-between; padding: 8px 0; border-top: 1px solid #ddd; margin-top: 8px;">
        <span>${lang === 'ar' ? 'المبلغ الفرعي' : 'Subtotal'}</span>
        <span style="font-weight: 600;">${subtotal.toFixed(2)} ${currency}</span>
      </div>
    `;
    
    // رسوم التوصيل تقديرية
    let deliveryFee = selectedDeliveryMethod === 'delivery' ? 15 : 0;
    if (deliveryFee > 0) {
      html += `
        <div style="display: flex; justify-content: space-between; padding: 8px 0;">
          <span>${lang === 'ar' ? 'رسوم التوصيل' : 'Delivery Fee'}</span>
          <span style="font-weight: 600;">${deliveryFee} ${currency}</span>
        </div>
      `;
    }
    
    // الإجمالي التقديري
    const estimatedTotal = subtotal + deliveryFee;
    html += `
      <div style="display: flex; justify-content: space-between; padding: 12px 0; border-top: 2px solid #2196F3; margin-top: 8px; font-weight: 700; font-size: 1.1rem;">
        <span>${lang === 'ar' ? 'الإجمالي (تقديري)' : 'Total (Estimated)'}</span>
        <span style="color: #2196F3;">${estimatedTotal.toFixed(2)} ${currency}</span>
      </div>
    `;
    
    // ملاحظة
    html += `
      <div style="margin-top: 12px; padding: 8px 12px; background: #e3f2fd; border-radius: 8px; font-size: 0.8rem; color: #1565c0; text-align: center;">
        <i data-lucide="info" style="width: 14px; height: 14px; display: inline; vertical-align: middle;"></i>
        ${lang === 'ar' 
          ? '* الأسعار النهائية سيتم حسابها عند تأكيد الطلب'
          : '* Final prices will be calculated upon order confirmation'
        }
      </div>
    `;
  }
  
  orderItems.innerHTML = html;
  
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// ================================================================
// نافذة تأكيد الطلب
// ================================================================
export function showConfirmedModal(orderId, eta, phone, itemsText, orderData) {
  const modal = document.getElementById('orderConfirmedModal');
  if (!modal) return;
  
  const lang = window.currentLang || 'ar';
  
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  
  // رقم الطلب
  const orderIdEl = document.getElementById('confirmedOrderId');
  if (orderIdEl) orderIdEl.textContent = orderId;
  
  // الوقت المتوقع
  const etaEl = document.getElementById('confirmedEta');
  if (etaEl) {
    const etaText = lang === 'ar' 
      ? `الوقت المتوقع: ${eta}`
      : `Estimated time: ${eta}`;
    etaEl.textContent = etaText;
  }
  
  // معلومات الفرع
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
  
  // رسالة الترقية
  const loyaltyReward = orderData.loyaltyReward;
  if (loyaltyReward?.justUpgraded) {
    const upgradeMsg = document.getElementById('upgradeMessage');
    if (upgradeMsg) {
      upgradeMsg.style.display = 'block';
      upgradeMsg.innerHTML = `
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px; border-radius: 12px; text-align: center; font-weight: 600; margin-top: 12px;">
          ${getUpgradeMessage(loyaltyReward.tier, lang)}
        </div>
      `;
    }
  }
  
  // الأزرار
  const total = orderData.calculatedPrices?.total || 0;
  setupConfirmedModalButtons(orderId, itemsText, phone, total);
  
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ================================================================
// إعداد أزرار نافذة التأكيد
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
// نسخ رقم الطلب
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
// مشاركة عبر WhatsApp
// ================================================================
function shareOnWhatsApp(orderId, itemsText, phone, total) {
  const lang = window.currentLang || 'ar';
  const currency = window.i18n?.t?.[lang]?.currency || 'ج.م';
  
  const message = lang === 'ar'
    ? `🎉 طلب جديد!\n\nرقم الطلب: ${orderId}\nالمنتجات: ${itemsText}\nالإجمالي: ${total.toFixed(2)} ${currency}\n\nشكراً لطلبك!`
    : `🎉 New Order!\n\nOrder ID: ${orderId}\nItems: ${itemsText}\nTotal: ${total.toFixed(2)} ${currency}\n\nThank you!`;
  
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank');
}

// ================================================================
// فتح نافذة التتبع
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
  
  const closeBtn = document.getElementById('closeTrackingBtn');
  if (closeBtn) {
    closeBtn.onclick = () => {
      modal.classList.add('hidden');
      document.body.style.overflow = '';
    };
  }
  
  const checkBtn = document.getElementById('checkStatusBtn');
  if (checkBtn) {
    checkBtn.onclick = () => checkOrderStatus();
  }
  
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ================================================================
// التحقق من حالة الطلب
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
  
  result.style.display = 'block';
  result.innerHTML = `
    <div style="text-align: center; padding: 20px;">
      <div class="spinner" style="width: 40px; height: 40px; margin: 0 auto 16px; border: 3px solid #f3f3f3; border-top: 3px solid #2196F3; border-radius: 50%; animation: spin 1s linear infinite;"></div>
      <p>${lang === 'ar' ? 'جاري البحث...' : 'Searching...'}</p>
    </div>
  `;
  
  try {
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
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
  } catch (error) {
    console.error('❌ Order tracking failed:', error);
    
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
      </div>
    `;
    
    result.innerHTML = html;
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
}

// ================================================================
// باقي دوال الـ UI
// ================================================================
export function resetFormFields() {
  const fields = ['customerName', 'customerPhone', 'customerAddress', 'orderNotes', 'promoCodeInput'];
  fields.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (field) field.value = '';
  });
  
  const promoStatus = document.getElementById('promoStatus');
  if (promoStatus) promoStatus.style.display = 'none';
}

export function fillSavedUserData() {
  const userData = storage.getUserData();
  
  if (userData) {
    const nameField = document.getElementById('customerName');
    const phoneField = document.getElementById('customerPhone');
    
    if (nameField && userData.name) nameField.value = userData.name;
    if (phoneField && userData.phone) phoneField.value = userData.phone;
  }
}

export function resetCheckoutUI() {
  document.querySelectorAll('.delivery-option').forEach(opt => {
    opt.classList.remove('selected');
  });
  
  document.querySelectorAll('.branch-card').forEach(card => {
    card.classList.remove('selected');
  });
  
  const branchSelection = document.getElementById('branchSelection');
  if (branchSelection) branchSelection.style.display = 'none';
  
  const checkoutForm = document.getElementById('checkoutForm');
  if (checkoutForm) checkoutForm.classList.remove('show');
}

export function closeCheckoutModal(event) {
  if (event && !event.target.classList.contains('checkout-modal-overlay')) return;
  
  const modal = document.getElementById('checkoutModal');
  if (modal) modal.classList.remove('show');
  document.body.style.overflow = '';
}

export function showProcessingModal(show, withActions = false) {
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
  
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

export function saveFormData() {
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