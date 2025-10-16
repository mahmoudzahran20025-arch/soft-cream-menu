// ================================================================
// CHECKOUT VALIDATION - التحقق من صحة البيانات (FIXED VERSION)
// ================================================================

console.log('🔄 Loading checkout-validation.js');

// ================================================================
// ✅ FIX 1: Enhanced validateOrder with Comprehensive Checks
// ================================================================
export function validateOrder() {
  console.log('🔄 Validating order...');
  
  const lang = window.currentLang || 'ar';
  const validation = {
    valid: false,
    message: '',
    customer: null,
    issues: []
  };
  
  try {
    // Get current state - using dynamic import to avoid circular dependencies
    import('./checkout-core.js').then(({ 
      getSelectedDeliveryMethod, 
      getSelectedBranch, 
      cart 
    }) => {
      const deliveryMethod = getSelectedDeliveryMethod();
      const selectedBranch = getSelectedBranch();
      
      console.log('🔄 Validation state:', {
        deliveryMethod,
        selectedBranch,
        cartItems: window.cart?.length || 0
      });
    }).catch(err => {
      console.warn('⚠️ Could not get checkout state for logging:', err);
    });
    
    // 1. Check cart
    if (!window.cart || window.cart.length === 0) {
      validation.message = lang === 'ar' ? 'السلة فارغة' : 'Cart is empty';
      validation.issues.push('empty_cart');
      return validation;
    }
    
    // 2. Check delivery method
    const deliveryMethodField = document.querySelector('.delivery-option.selected');
    if (!deliveryMethodField) {
      validation.message = lang === 'ar' ? 'الرجاء اختيار طريقة الاستلام' : 'Please select delivery method';
      validation.issues.push('no_delivery_method');
      return validation;
    }
    
    const deliveryMethod = deliveryMethodField.id === 'pickupOption' ? 'pickup' : 'delivery';
    
    // 3. Check branch selection for pickup
    if (deliveryMethod === 'pickup') {
      const selectedBranchCard = document.querySelector('.branch-card.selected');
      if (!selectedBranchCard) {
        validation.message = lang === 'ar' ? 'الرجاء اختيار الفرع للاستلام' : 'Please select a branch for pickup';
        validation.issues.push('no_branch_selected');
        return validation;
      }
    }
    
    // 4. Validate customer name
    const nameField = document.getElementById('customerName');
    const customerName = nameField?.value?.trim();
    
    if (!customerName) {
      validation.message = lang === 'ar' ? 'الرجاء إدخال اسمك الكامل' : 'Please enter your full name';
      validation.issues.push('missing_name');
      return validation;
    }
    
    if (!isValidLength(customerName, 2, 50)) {
      validation.message = lang === 'ar' ? 'الاسم يجب أن يكون بين 2-50 حرف' : 'Name must be 2-50 characters';
      validation.issues.push('invalid_name_length');
      return validation;
    }
    
    // 5. Validate phone number
    const phoneField = document.getElementById('customerPhone');
    const customerPhone = phoneField?.value?.trim();
    
    if (!customerPhone) {
      validation.message = lang === 'ar' ? 'الرجاء إدخال رقم الهاتف' : 'Please enter phone number';
      validation.issues.push('missing_phone');
      return validation;
    }
    
    if (!isValidEgyptianPhone(customerPhone)) {
      validation.message = lang === 'ar' ? 'رقم الهاتف غير صحيح (مثال: 01012345678)' : 'Invalid phone number (example: 01012345678)';
      validation.issues.push('invalid_phone');
      return validation;
    }
    
    // 6. Validate address for delivery
    if (deliveryMethod === 'delivery') {
      const addressField = document.getElementById('customerAddress');
      const customerAddress = addressField?.value?.trim();
      
      if (!customerAddress) {
        validation.message = lang === 'ar' ? 'الرجاء إدخال العنوان التفصيلي' : 'Please enter detailed address';
        validation.issues.push('missing_address');
        return validation;
      }
      
      if (!isValidLength(customerAddress, 10, 200)) {
        validation.message = lang === 'ar' ? 'العنوان يجب أن يكون بين 10-200 حرف' : 'Address must be 10-200 characters';
        validation.issues.push('invalid_address_length');
        return validation;
      }
    }
    
    // 7. Validate notes (optional but check length if provided)
    const notesField = document.getElementById('orderNotes');
    const orderNotes = notesField?.value?.trim();
    
    if (orderNotes && !isValidLength(orderNotes, 0, 300)) {
      validation.message = lang === 'ar' ? 'الملاحظات يجب ألا تزيد عن 300 حرف' : 'Notes must not exceed 300 characters';
      validation.issues.push('invalid_notes_length');
      return validation;
    }
    
    // 8. Build customer object
    const customer = {
      name: customerName,
      phone: formatPhoneNumber(customerPhone)
    };
    
    if (deliveryMethod === 'delivery') {
      const addressField = document.getElementById('customerAddress');
      customer.address = addressField?.value?.trim();
    }
    
    if (orderNotes) {
      customer.notes = orderNotes;
    }
    
    // All validations passed
    validation.valid = true;
    validation.customer = customer;
    validation.deliveryMethod = deliveryMethod;
    
    if (deliveryMethod === 'pickup') {
      const selectedBranchCard = document.querySelector('.branch-card.selected');
      validation.selectedBranch = selectedBranchCard?.dataset?.branch;
    }
    
    console.log('✅ Order validation passed:', {
      customer: customer.name,
      phone: customer.phone,
      deliveryMethod,
      issues: validation.issues
    });
    
    return validation;
    
  } catch (error) {
    console.error('❌ Error during order validation:', error);
    validation.message = lang === 'ar' ? 'خطأ في التحقق من البيانات' : 'Validation error';
    validation.issues.push('validation_error');
    return validation;
  }
}

// ================================================================
// ✅ FIX 2: Enhanced Phone Validation
// ================================================================
export function isValidEgyptianPhone(phone) {
  if (!phone || typeof phone !== 'string') {
    return false;
  }
  
  // Remove any non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Egyptian mobile patterns:
  // 010xxxxxxxx, 011xxxxxxxx, 012xxxxxxxx, 015xxxxxxxx (11 digits total)
  // 20 10xxxxxxxx, 20 11xxxxxxxx, 20 12xxxxxxxx, 20 15xxxxxxxx (13 digits with country code)
  
  const patterns = [
    /^(010|011|012|015)\d{8}$/,           // 11 digits: 010xxxxxxxx
    /^20(10|11|12|15)\d{8}$/,             // 13 digits: 2010xxxxxxxx
    /^(\+20|0020)(10|11|12|15)\d{8}$/     // With + or 00 prefix
  ];
  
  return patterns.some(pattern => pattern.test(cleanPhone));
}

// ================================================================
// ✅ FIX 3: Enhanced Length Validation
// ================================================================
export function isValidLength(value, min = 0, max = Infinity) {
  if (typeof value !== 'string') {
    return false;
  }
  
  const length = value.trim().length;
  return length >= min && length <= max;
}

// ================================================================
// ✅ FIX 4: Enhanced Phone Formatting
// ================================================================
export function formatPhoneNumber(phone) {
  if (!phone || typeof phone !== 'string') {
    return '';
  }
  
  // Remove all non-digit characters
  let cleanPhone = phone.replace(/\D/g, '');
  
  // Handle different formats
  if (cleanPhone.startsWith('0020')) {
    // Remove 0020 prefix and keep the rest
    cleanPhone = cleanPhone.substring(4);
  } else if (cleanPhone.startsWith('20')) {
    // Remove 20 prefix and keep the rest
    cleanPhone = cleanPhone.substring(2);
  }
  
  // Ensure it starts with 0 for Egyptian mobile format
  if (cleanPhone.length === 10 && !cleanPhone.startsWith('0')) {
    cleanPhone = '0' + cleanPhone;
  }
  
  // Validate final format
  if (/^(010|011|012|015)\d{8}$/.test(cleanPhone)) {
    return cleanPhone;
  }
  
  // Return original if formatting fails
  return phone.replace(/\D/g, '');
}

// ================================================================
// ✅ FIX 5: Enhanced Email Validation (Optional)
// ================================================================
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email.trim());
}

// ================================================================
// ✅ FIX 6: Text Content Validation
// ================================================================
export function isValidText(text, allowSpecialChars = true) {
  if (!text || typeof text !== 'string') {
    return false;
  }
  
  const trimmedText = text.trim();
  
  if (trimmedText.length === 0) {
    return false;
  }
  
  // Check for basic text content (Arabic, English, numbers, common punctuation)
  const basicPattern = /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\u0590-\u05FF\u0000-\u007F\s\-_.,()\[\]{}'"!?]+$/;
  
  if (allowSpecialChars) {
    return basicPattern.test(trimmedText);
  } else {
    // More restrictive pattern for names
    const namePattern = /^[\u0600-\u06FF\u0750-\u077F\u0590-\u05FF\u0000-\u007F\s\-'.]+$/;
    return namePattern.test(trimmedText);
  }
}

// ================================================================
// ✅ FIX 7: Real-time Field Validation
// ================================================================
export function setupFieldValidation() {
  console.log('🔄 Setting up field validation...');
  
  const lang = window.currentLang || 'ar';
  
  // Name field validation
  const nameField = document.getElementById('customerName');
  if (nameField) {
    nameField.addEventListener('blur', () => {
      validateField(nameField, (value) => {
        if (!value.trim()) {
          return lang === 'ar' ? 'الاسم مطلوب' : 'Name is required';
        }
        if (!isValidLength(value, 2, 50)) {
          return lang === 'ar' ? 'الاسم يجب أن يكون بين 2-50 حرف' : 'Name must be 2-50 characters';
        }
        if (!isValidText(value, false)) {
          return lang === 'ar' ? 'الاسم يحتوي على رموز غير مسموحة' : 'Name contains invalid characters';
        }
        return null;
      });
    });
    
    nameField.addEventListener('input', () => {
      clearFieldError(nameField);
    });
  }
  
  // Phone field validation
  const phoneField = document.getElementById('customerPhone');
  if (phoneField) {
    phoneField.addEventListener('input', (e) => {
      // Allow only digits
      let value = e.target.value.replace(/\D/g, '');
      if (value.length > 11) value = value.substring(0, 11);
      e.target.value = value;
      
      clearFieldError(phoneField);
    });
    
    phoneField.addEventListener('blur', () => {
      validateField(phoneField, (value) => {
        if (!value.trim()) {
          return lang === 'ar' ? 'رقم الهاتف مطلوب' : 'Phone number is required';
        }
        if (!isValidEgyptianPhone(value)) {
          return lang === 'ar' ? 'رقم الهاتف غير صحيح (مثال: 01012345678)' : 'Invalid phone number (example: 01012345678)';
        }
        return null;
      });
    });
  }
  
  // Address field validation
  const addressField = document.getElementById('customerAddress');
  if (addressField) {
    addressField.addEventListener('blur', () => {
      const deliveryOption = document.getElementById('deliveryOption');
      if (deliveryOption && deliveryOption.classList.contains('selected')) {
        validateField(addressField, (value) => {
          if (!value.trim()) {
            return lang === 'ar' ? 'العنوان مطلوب للتوصيل' : 'Address is required for delivery';
          }
          if (!isValidLength(value, 10, 200)) {
            return lang === 'ar' ? 'العنوان يجب أن يكون بين 10-200 حرف' : 'Address must be 10-200 characters';
          }
          return null;
        });
      }
    });
    
    addressField.addEventListener('input', () => {
      clearFieldError(addressField);
    });
  }
  
  // Notes field validation
  const notesField = document.getElementById('orderNotes');
  if (notesField) {
    notesField.addEventListener('input', (e) => {
      const value = e.target.value;
      if (value.length > 300) {
        e.target.value = value.substring(0, 300);
      }
      clearFieldError(notesField);
    });
    
    notesField.addEventListener('blur', () => {
      validateField(notesField, (value) => {
        if (value && !isValidLength(value, 0, 300)) {
          return lang === 'ar' ? 'الملاحظات يجب ألا تزيد عن 300 حرف' : 'Notes must not exceed 300 characters';
        }
        return null;
      });
    });
  }
  
  console.log('✅ Field validation setup completed');
}

function validateField(field, validator) {
  const value = field.value.trim();
  const error = validator(value);
  
  if (error) {
    showFieldError(field, error);
    return false;
  } else {
    clearFieldError(field);
    return true;
  }
}

function showFieldError(field, message) {
  clearFieldError(field);
  
  field.classList.add('error');
  
  const errorDiv = document.createElement('div');
  errorDiv.className = 'field-error';
  errorDiv.style.cssText = `
    color: #d32f2f;
    font-size: 12px;
    margin-top: 4px;
    display: flex;
    align-items: center;
    gap: 4px;
  `;
  errorDiv.innerHTML = `
    <i data-lucide="alert-circle" style="width: 14px; height: 14px;"></i>
    <span>${message}</span>
  `;
  
  field.parentNode.appendChild(errorDiv);
  
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

function clearFieldError(field) {
  field.classList.remove('error');
  
  const existingError = field.parentNode.querySelector('.field-error');
  if (existingError) {
    existingError.remove();
  }
}

// ================================================================
// ✅ FIX 8: Initialize Validation on DOM Ready
// ================================================================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupFieldValidation);
} else {
  setupFieldValidation();
}

// ================================================================
// ✅ FIX 9: Validation Summary Helper
// ================================================================
export function getValidationSummary() {
  const validation = validateOrder();
  
  return {
    isValid: validation.valid,
    issues: validation.issues,
    message: validation.message,
    customerData: validation.customer,
    timestamp: new Date().toISOString()
  };
}

console.log('✅ checkout-validation.js loaded successfully');