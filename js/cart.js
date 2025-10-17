// ================================================================
// cart.js - إدارة السلة (آمن - بدون أسعار) - SIMPLE FIX
// CRITICAL: Prices are NEVER stored, always fetched from productsManager
// ================================================================

import { productsManager } from './products.js';
import { showToast } from './utils.js';
import { storage } from './storage.js';

// ================================================================
// ===== متغيرات السلة =====
// ✅ SOLUTION: استخدام Proxy للحفاظ على نفس الاسم "cart"
// ================================================================
const cartData = {
  items: []
};

// ✅ تصدير cart كـ Proxy يتصرف كـ Array عادي لكن دايماً محدّث
export const cart = new Proxy(cartData, {
  get(target, prop) {
    // إذا طلب length
    if (prop === 'length') {
      return target.items.length;
    }
    
    // إذا طلب iterator (للاستخدام في forEach, map, etc)
    if (prop === Symbol.iterator) {
      return target.items[Symbol.iterator].bind(target.items);
    }
    
    // إذا طلب دالة من Array (مثل map, filter, forEach, find, etc)
    if (typeof target.items[prop] === 'function') {
      return function(...args) {
        return target.items[prop](...args);
      };
    }
    
    // إذا طلب عنصر بالـ index
    if (typeof prop === 'string' && !isNaN(prop)) {
      return target.items[prop];
    }
    
    // أي شيء آخر
    return target.items[prop];
  },
  
  set(target, prop, value) {
    // السماح بالتعديل على items
    if (prop === 'length' || !isNaN(prop)) {
      target.items[prop] = value;
      return true;
    }
    return false;
  },
  
  // للسماح بـ delete
  deleteProperty(target, prop) {
    if (!isNaN(prop)) {
      delete target.items[prop];
      return true;
    }
    return false;
  },
  
  // للسماح بـ Object.keys(cart)
  ownKeys(target) {
    return Object.keys(target.items);
  },
  
  // للسماح بـ hasOwnProperty
  has(target, prop) {
    return prop in target.items;
  }
});

// ================================================================
// ✅ دوال مساعدة (اختيارية)
// ================================================================
export function getCart() {
  return cartData.items;
}

export function setCart(newCart) {
  cartData.items = newCart;
}

// ================================================================
// ===== إضافة منتج للسلة =====
// ================================================================
export async function addToCart(event, productId, quantity = 1) {
  if (event) {
    event.stopPropagation();
  }
  
  // ✅ الحصول على المنتج من productsManager (للتحقق فقط)
  let product;
  try {
    product = await productsManager.getProduct(productId);
  } catch (error) {
    console.error('Failed to get product:', error);
    const lang = window.currentLang || 'ar';
    showToast(
      lang === 'ar' ? 'خطأ' : 'Error',
      lang === 'ar' ? 'فشل إضافة المنتج' : 'Failed to add product',
      'error'
    );
    return;
  }
  
  if (!product) {
    console.error('Product not found:', productId);
    return;
  }
  
  // ✅ التحقق من الحد الأقصى
  const MAX_QUANTITY = 50;
  
  const existing = cartData.items.find(item => item.productId === productId);
  if (existing) {
    if (existing.quantity + quantity > MAX_QUANTITY) {
      const lang = window.currentLang || 'ar';
      showToast(
        lang === 'ar' ? 'خطأ' : 'Error',
        lang === 'ar' ? `الحد الأقصى ${MAX_QUANTITY} قطعة` : `Maximum ${MAX_QUANTITY} items`,
        'error'
      );
      return;
    }
    existing.quantity += quantity;
  } else {
    // ✅ CRITICAL: نحفظ فقط productId و quantity - بدون أسعار!
    cartData.items.push({
      productId: productId,
      quantity: quantity
    });
  }
  
  saveCart();
  await updateCartUI();
  
  // إظهار إشعار
  try {
    const currentLang = window.currentLang || 'ar';
    const name = currentLang === 'ar' ? product.name : product.nameEn;
    const addedText = currentLang === 'ar' ? 'تمت الإضافة! 🎉' : 'Added! 🎉';
    showToast(addedText, `${name} × ${quantity}`, 'success');
  } catch (e) {
    console.log('Toast error:', e);
  }
}

// ================================================================
// ===== تحديث كمية منتج =====
// ================================================================
export async function updateQuantity(productId, delta) {
  const item = cartData.items.find(i => i.productId === productId);
  if (!item) return;
  
  const MAX_QUANTITY = 50;
  const newQuantity = item.quantity + delta;
  
  if (newQuantity > MAX_QUANTITY) {
    const lang = window.currentLang || 'ar';
    showToast(
      lang === 'ar' ? 'خطأ' : 'Error',
      lang === 'ar' ? `الحد الأقصى ${MAX_QUANTITY} قطعة` : `Maximum ${MAX_QUANTITY} items`,
      'error'
    );
    return;
  }
  
  item.quantity = Math.max(1, newQuantity);
  saveCart();
  await updateCartUI();
}

// ================================================================
// ===== حذف منتج من السلة =====
// ================================================================
export async function removeFromCart(productId) {
  cartData.items = cartData.items.filter(item => item.productId !== productId);
  saveCart();
  await updateCartUI();
  
  try {
    const currentLang = window.currentLang || 'ar';
    const removedText = currentLang === 'ar' ? 'تم الحذف' : 'Removed';
    const removedDesc = currentLang === 'ar' ? 'تم حذف المنتج من السلة' : 'Item removed from cart';
    showToast(removedText, removedDesc, 'error');
  } catch (e) {
    console.log('Toast error:', e);
  }
}

// ================================================================
// ===== حساب الإجماليات =====
// ✅ الأسعار تُجلب من productsManager (ديناميكياً)
// ================================================================
export async function calculateCartTotals() {
  const totalItems = cartData.items.reduce((sum, item) => sum + item.quantity, 0);
  
  // ✅ جلب الأسعار من productsManager
  let total = 0;
  
  for (const item of cartData.items) {
    try {
      const product = await productsManager.getProduct(item.productId);
      if (product && product.price) {
        total += product.price * item.quantity;
      }
    } catch (error) {
      console.warn(`Failed to get price for product ${item.productId}:`, error);
    }
  }
  
  return { totalItems, total };
}

// ================================================================
// ===== تحديث واجهة السلة =====
// ✅ الأسعار تُجلب من productsManager عند العرض
// ================================================================
export async function updateCartUI() {
  const { totalItems, total } = await calculateCartTotals();
  const currentLang = window.currentLang || 'ar';
  const translations = window.i18n.t || {};
  const t = translations[currentLang] || {};
  
  // تحديث الشارات
  const badges = ['navCartBadge', 'cartBadgeDesktop', 'cartBadgeMobile'];
  badges.forEach(badgeId => {
    const badge = document.getElementById(badgeId);
    if (badge) badge.textContent = totalItems;
  });
  
  // تحديث السلة في Desktop و Mobile
  await updateSingleCartUI('cartItemsDesktop', 'cartTotalDesktop', 'cartFooterDesktop', total, t);
  await updateSingleCartUI('cartItemsMobile', 'cartTotalMobile', 'cartFooterMobile', total, t);
}

// ================================================================
// ===== تحديث واجهة سلة واحدة =====
// ✅ الأسعار تُجلب من productsManager
// ================================================================
async function updateSingleCartUI(itemsId, totalId, footerId, total, translations) {
  const cartItems = document.getElementById(itemsId);
  const cartTotal = document.getElementById(totalId);
  const cartFooter = document.getElementById(footerId);
  
  if (!cartItems) return;
  
  const currentLang = window.currentLang || 'ar';
  const currency = translations.currency || 'ج.م';
  
  if (cartTotal) {
    cartTotal.textContent = `${total.toFixed(2)} ${currency}`;
  }
  
  if (cartData.items.length === 0) {
    const emptyText = currentLang === 'ar' ? 'سلتك فارغة حالياً' : 'Your cart is empty';
    const emptySubtext = currentLang === 'ar' ? 'أضف بعض الآيس كريم اللذيذ! 🍦' : 'Add some delicious ice cream! 🍦';
    
    cartItems.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty-icon">
          <i data-lucide="shopping-basket"></i>
        </div>
        <p style="font-size: 1.125rem; margin-bottom: 0.5rem;">${emptyText}</p>
        <p style="font-size: 0.875rem;">${emptySubtext}</p>
      </div>
    `;
    
    if (cartFooter) {
      cartFooter.classList.add('hidden');
    }
    
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
    return;
  }
  
  if (cartFooter) {
    cartFooter.classList.remove('hidden');
  }
  
  let html = '';
  
  // ✅ جلب بيانات المنتجات من productsManager
  for (const item of cartData.items) {
    try {
      const product = await productsManager.getProduct(item.productId);
      
      if (!product) {
        console.warn('Product not found in cart:', item.productId);
        continue;
      }
      
      const name = currentLang === 'ar' ? product.name : (product.nameEn || product.name);
      const price = product.price || 0;
      const itemTotal = price * item.quantity;
      
      html += `
        <div class="cart-item">
          <div class="cart-item-header">
            <span class="cart-item-name">${name}</span>
            <button class="cart-item-remove" onclick="window.cartModule.removeFromCart('${item.productId}')">
              <i data-lucide="x"></i>
            </button>
          </div>
          <div class="cart-item-footer">
            <div class="quantity-controls">
              <button class="quantity-btn" onclick="window.cartModule.updateQuantity('${item.productId}', -1)">
                <i data-lucide="minus"></i>
              </button>
              <span class="quantity-value">${item.quantity}</span>
              <button class="quantity-btn" onclick="window.cartModule.updateQuantity('${item.productId}', 1)">
                <i data-lucide="plus"></i>
              </button>
            </div>
            <span class="cart-item-price">${itemTotal.toFixed(2)} ${currency}</span>
          </div>
        </div>
      `;
    } catch (error) {
      console.error('Error rendering cart item:', error);
    }
  }
  
  cartItems.innerHTML = html;
  
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// ================================================================
// ===== حفظ السلة =====
// ✅ استخدام storage module (sessionStorage)
// ================================================================
export function saveCart() {
  storage.setCart(cartData.items);
  console.log('💾 Cart saved:', cartData.items.length, 'items');
}

// ================================================================
// ===== تحميل السلة =====
// ✅ استخدام storage module (sessionStorage)
// ================================================================
export function loadCart() {
  const savedCart = storage.getCart();
  if (savedCart && Array.isArray(savedCart)) {
    cartData.items = savedCart;
    console.log('✅ Cart loaded:', cartData.items.length, 'items');
  } else {
    cartData.items = [];
  }
}

// ================================================================
// ===== تفريغ السلة =====
// ================================================================
export async function clearCart() {
  cartData.items = [];
  saveCart();
  await updateCartUI();
  console.log('🗑️ Cart cleared');
}

// ================================================================
// ===== فتح/إغلاق نافذة السلة =====
// ================================================================
export function openCartModal() {
  const modal = document.getElementById('cartModal');
  if (modal) {
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
  }
}

export function closeCartModal(event) {
  if (event && !event.target.classList.contains('cart-modal-overlay')) return;
  
  const modal = document.getElementById('cartModal');
  if (modal) {
    modal.classList.remove('show');
    document.body.style.overflow = '';
  }
}

// ================================================================
// ===== تصدير الوحدة للنافذة العامة =====
// ================================================================
export function isCartEmpty() {
  const currentCart = getCart();
  return !currentCart || currentCart.length === 0;
}

// Update window.cartModule to include all necessary functions
if (typeof window !== 'undefined') {
  window.cartModule = {
    cart,
    getCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    calculateCartTotals,
    isCartEmpty,  // Add this line
    updateCartUI: async () => {
      try {
        await updateCartUI();
      } catch (error) {
        console.error('Error updating cart UI:', error);
      }
    }
  };
  
  console.log('✅ Cart module initialized with functions:', 
    Object.keys(window.cartModule).join(', ')
  );
}