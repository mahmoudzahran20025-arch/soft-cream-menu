// ================================================================
// cart.js - إدارة السلة (آمن - بدون أسعار) - FIXED
// CRITICAL: Prices are NEVER stored, always fetched from productsManager
// ================================================================

import { productsManager } from './products.js';
import { showToast } from './utils.js';
import { storage } from './storage.js';

// ================================================================
// ===== متغيرات السلة =====
// ✅ FIX: استخدام object بدلاً من array مباشر
// ================================================================
const cartState = {
  items: []
};

// ================================================================
// ✅ FIX: دوال للوصول للسلة
// ================================================================
export function getCart() {
  return cartState.items;
}

export function setCart(newCart) {
  cartState.items = newCart;
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
  
  const existing = cartState.items.find(item => item.productId === productId);
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
    cartState.items.push({
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
  const item = cartState.items.find(i => i.productId === productId);
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
  cartState.items = cartState.items.filter(item => item.productId !== productId);
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
  const totalItems = cartState.items.reduce((sum, item) => sum + item.quantity, 0);
  
  // ✅ جلب الأسعار من productsManager
  let total = 0;
  
  for (const item of cartState.items) {
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
  
  if (cartState.items.length === 0) {
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
  for (const item of cartState.items) {
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
  storage.setCart(cartState.items);
  console.log('💾 Cart saved:', cartState.items.length, 'items');
}

// ================================================================
// ===== تحميل السلة =====
// ✅ استخدام storage module (sessionStorage)
// ================================================================
export function loadCart() {
  const savedCart = storage.getCart();
  if (savedCart && Array.isArray(savedCart)) {
    cartState.items = savedCart;
    console.log('✅ Cart loaded:', cartState.items.length, 'items');
  } else {
    cartState.items = [];
  }
}

// ================================================================
// ===== تفريغ السلة =====
// ================================================================
export async function clearCart() {
  cartState.items = [];
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
if (typeof window !== 'undefined') {
  window.cartModule = {
    addToCart,
    updateQuantity,
    removeFromCart,
    openCartModal,
    closeCartModal,
    clearCart,
    getCart: () => cartState.items,  // ✅ إرجاع array مباشرة
    getCartTotals: calculateCartTotals
  };
}

console.log('✅ Cart module loaded (Secure - No Prices Stored - FIXED)');