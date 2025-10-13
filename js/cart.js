// ================================================================
// cart.js - إدارة السلة
// ================================================================

import { products } from './products.js';
import { showToast } from './utils.js';

// ================================================================
// ===== متغيرات السلة =====
// ================================================================
export let cart = [];

// ================================================================
// ===== إضافة منتج للسلة =====
// ================================================================
export function addToCart(event, productId, quantity = 1) {
  if (event) {
    event.stopPropagation();
  }
  
  const product = products.find(p => p.id === productId);
  if (!product) return;
  
  const existing = cart.find(item => item.id === productId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      nameEn: product.nameEn,
      price: product.price,
      quantity: quantity
    });
  }
  
  saveCart();
  updateCartUI();
  
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
export function updateQuantity(productId, delta) {
  const item = cart.find(i => i.id === productId);
  if (!item) return;
  
  item.quantity = Math.max(1, item.quantity + delta);
  saveCart();
  updateCartUI();
}

// ================================================================
// ===== حذف منتج من السلة =====
// ================================================================
export function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  saveCart();
  updateCartUI();
  
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
// ================================================================
export function calculateCartTotals() {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  return { totalItems, total };
}

// ================================================================
// ===== تحديث واجهة السلة =====
// ================================================================
export function updateCartUI() {
  const { totalItems, total } = calculateCartTotals();
  const currentLang = window.currentLang || 'ar';
  const translations = window.translations || {};
  const t = translations[currentLang] || {};
  
  // تحديث الشارات
  const badges = ['navCartBadge', 'cartBadgeDesktop', 'cartBadgeMobile'];
  badges.forEach(badgeId => {
    const badge = document.getElementById(badgeId);
    if (badge) badge.textContent = totalItems;
  });
  
  // تحديث السلة في Desktop و Mobile
  updateSingleCartUI('cartItemsDesktop', 'cartTotalDesktop', 'cartFooterDesktop', total, t);
  updateSingleCartUI('cartItemsMobile', 'cartTotalMobile', 'cartFooterMobile', total, t);
}

// ================================================================
// ===== تحديث واجهة سلة واحدة =====
// ================================================================
function updateSingleCartUI(itemsId, totalId, footerId, total, translations) {
  const cartItems = document.getElementById(itemsId);
  const cartTotal = document.getElementById(totalId);
  const cartFooter = document.getElementById(footerId);
  
  if (!cartItems) return;
  
  const currentLang = window.currentLang || 'ar';
  const currency = translations.currency || 'ج.م';
  
  if (cartTotal) {
    cartTotal.textContent = `${total} ${currency}`;
  }
  
  if (cart.length === 0) {
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
  cart.forEach(item => {
    const name = currentLang === 'ar' ? item.name : item.nameEn;
    html += `
      <div class="cart-item">
        <div class="cart-item-header">
          <span class="cart-item-name">${name}</span>
          <button class="cart-item-remove" onclick="window.cartModule.removeFromCart('${item.id}')">
            <i data-lucide="x"></i>
          </button>
        </div>
        <div class="cart-item-footer">
          <div class="quantity-controls">
            <button class="quantity-btn" onclick="window.cartModule.updateQuantity('${item.id}', -1)">
              <i data-lucide="minus"></i>
            </button>
            <span class="quantity-value">${item.quantity}</span>
            <button class="quantity-btn" onclick="window.cartModule.updateQuantity('${item.id}', 1)">
              <i data-lucide="plus"></i>
            </button>
          </div>
          <span class="cart-item-price">${item.price * item.quantity} ${currency}</span>
        </div>
      </div>
    `;
  });
  
  cartItems.innerHTML = html;
  
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// ================================================================
// ===== حفظ السلة =====
// ================================================================
export function saveCart() {
  try {
    localStorage.setItem('cart', JSON.stringify(cart));
  } catch (e) {
    console.warn('Could not save cart:', e);
  }
}

// ================================================================
// ===== تحميل السلة =====
// ================================================================
export function loadCart() {
  const savedCart = localStorage.getItem('cart');
  if (savedCart) {
    try {
      cart = JSON.parse(savedCart);
      console.log('✅ Cart loaded:', cart.length, 'items');
    } catch (e) {
      cart = [];
      console.warn('Could not load cart:', e);
    }
  }
}

// ================================================================
// ===== تفريغ السلة =====
// ================================================================
export function clearCart() {
  cart = [];
  saveCart();
  updateCartUI();
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
    getCart: () => cart,
    getCartTotals: calculateCartTotals
  };
}

console.log('✅ Cart module loaded');