// ================================================================
// CHECKOUT VALIDATION - التحقق من البيانات (FIXED - Minimal Changes)
// ================================================================

import { 
  getSelectedDeliveryMethod,  // ✅ FIX: استخدام getter
  getSelectedBranch            // ✅ FIX: استخدام getter
} from './checkout-core.js';

/**
 * التحقق من صحة بيانات الطلب
 * @returns {Object} { valid: boolean, message?: string, customer?: Object }
 */
export function validateOrder() {
  const lang = window.currentLang || 'ar';
  
  // ✅ FIX: استخدام getters بدل المتغيرات المباشرة
  const selectedDeliveryMethod = getSelectedDeliveryMethod();
  const selectedBranch = getSelectedBranch();
  
  // 1️⃣ التحقق من طريقة التوصيل
  if (!selectedDeliveryMethod) {
    return {
      valid: false,
      message: lang === 'ar' 
        ? 'الرجاء اختيار طريقة الاستلام' 
        : 'Please select pickup method'
    };
  }
  
  // 2️⃣ التحقق من الفرع (للاستلام من الفرع)
  if (selectedDeliveryMethod === 'pickup' && !selectedBranch) {
    return {
      valid: false,
      message: lang === 'ar' 
        ? 'الرجاء اختيار الفرع' 
        : 'Please select a branch'
    };
  }
  
  // 3️⃣ الحصول على قيم الحقول
  const nameField = document.getElementById('customerName');
  const phoneField = document.getElementById('customerPhone');
  const addressField = document.getElementById('customerAddress');
  const notesField = document.getElementById('orderNotes');
  
  const name = nameField ? nameField.value.trim() : '';
  const phone = phoneField ? phoneField.value.trim() : '';
  const address = (selectedDeliveryMethod === 'delivery' && addressField) 
    ? addressField.value.trim() 
    : '';
  const notes = notesField ? notesField.value.trim() : '';
  
  // 4️⃣ التحقق من الاسم
  if (!name) {
    return {
      valid: false,
      message: lang === 'ar' 
        ? 'الرجاء إدخال اسمك' 
        : 'Please enter your name'
    };
  }
  
  // التحقق من طول الاسم
  if (name.length < 2) {
    return {
      valid: false,
      message: lang === 'ar' 
        ? 'الاسم قصير جداً' 
        : 'Name is too short'
    };
  }
  
  if (name.length > 100) {
    return {
      valid: false,
      message: lang === 'ar' 
        ? 'الاسم طويل جداً' 
        : 'Name is too long'
    };
  }
  
  // 5️⃣ التحقق من الهاتف
  if (!phone) {
    return {
      valid: false,
      message: lang === 'ar' 
        ? 'الرجاء إدخال رقم الهاتف' 
        : 'Please enter phone number'
    };
  }
  
  // التحقق من صيغة الهاتف المصري
  const phoneRegex = /^01[0125][0-9]{8}$/;
  if (!phoneRegex.test(phone)) {
    return {
      valid: false,
      message: lang === 'ar' 
        ? 'الرجاء إدخال رقم هاتف مصري صحيح (01XXXXXXXXX)' 
        : 'Please enter a valid Egyptian phone number (01XXXXXXXXX)'
    };
  }
  
  // 6️⃣ التحقق من العنوان (للتوصيل فقط)
  if (selectedDeliveryMethod === 'delivery') {
    if (!address) {
      return {
        valid: false,
        message: lang === 'ar' 
          ? 'الرجاء إدخال العنوان' 
          : 'Please enter address'
      };
    }
    
    if (address.length < 10) {
      return {
        valid: false,
        message: lang === 'ar' 
          ? 'العنوان قصير جداً، الرجاء إدخال عنوان مفصل' 
          : 'Address is too short, please provide detailed address'
      };
    }
    
    if (address.length > 500) {
      return {
        valid: false,
        message: lang === 'ar' 
          ? 'العنوان طويل جداً' 
          : 'Address is too long'
      };
    }
  }
  
  // 7️⃣ التحقق من الملاحظات (اختياري لكن نتحقق من الطول)
  if (notes && notes.length > 500) {
    return {
      valid: false,
      message: lang === 'ar' 
        ? 'الملاحظات طويلة جداً' 
        : 'Notes are too long'
    };
  }
  
  // ✅ كل شيء صحيح
  return {
    valid: true,
    customer: {
      name: sanitizeInput(name),
      phone: phone,
      address: sanitizeInput(address),
      notes: sanitizeInput(notes)
    }
  };
}

/**
 * تنظيف المدخلات من أي أحرف خطيرة
 * @param {string} input 
 * @returns {string}
 */
function sanitizeInput(input) {
  if (!input) return '';
  
  // إزالة HTML tags
  return input
    .replace(/<[^>]*>/g, '')
    .trim();
}

/**
 * التحقق من رقم الهاتف فقط (للاستخدام المستقل)
 * @param {string} phone 
 * @returns {boolean}
 */
export function isValidEgyptianPhone(phone) {
  if (!phone) return false;
  const phoneRegex = /^01[0125][0-9]{8}$/;
  return phoneRegex.test(phone.trim());
}

/**
 * تنسيق رقم الهاتف (إزالة المسافات والرموز)
 * @param {string} phone 
 * @returns {string}
 */
export function formatPhoneNumber(phone) {
  if (!phone) return '';
  // إزالة كل شيء ماعدا الأرقام
  return phone.replace(/\D/g, '');
}

/**
 * التحقق من طول النص
 * @param {string} text 
 * @param {number} minLength 
 * @param {number} maxLength 
 * @returns {boolean}
 */
export function isValidLength(text, minLength, maxLength) {
  if (!text) return false;
  const length = text.trim().length;
  return length >= minLength && length <= maxLength;
}