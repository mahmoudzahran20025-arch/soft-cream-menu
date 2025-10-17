// ================================================================
// SOLUTION 1: Enhanced cart.js with Better State Management
// ================================================================

import { productsManager } from './products.js';
import { showToast } from './utils.js';
import { storage } from './storage.js';

// ================================================================
// Cart State - Using Simple Array (No Proxy)
// ================================================================
let cartItems = [];
let cartLoaded = false;

// ================================================================
// CRITICAL FIX: Synchronous Cart Access
// ================================================================
export function getCart() {
  // Ensure cart is loaded before returning
  if (!cartLoaded) {
    loadCart();
  }
  return [...cartItems]; // Return copy to prevent external mutation
}

export function getCartLength() {
  if (!cartLoaded) {
    loadCart();
  }
  return cartItems.length;
}

export function isCartEmpty() {
  if (!cartLoaded) {
    loadCart();
  }
  return cartItems.length === 0;
}

// ================================================================
// Add to Cart (Enhanced)
// ================================================================
export async function addToCart(event, productId, quantity = 1) {
  if (event) {
    event.stopPropagation();
  }
  
  // Ensure cart is loaded
  if (!cartLoaded) {
    loadCart();
  }
  
  // Get product for validation
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
  
  // Check max quantity
  const MAX_QUANTITY = 50;
  
  const existing = cartItems.find(item => item.productId === productId);
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
    cartItems.push({
      productId: productId,
      quantity: quantity
    });
  }
  
  saveCart();
  await updateCartUI();
  
  // Show toast
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
// Update Quantity
// ================================================================
export async function updateQuantity(productId, delta) {
  if (!cartLoaded) {
    loadCart();
  }
  
  const item = cartItems.find(i => i.productId === productId);
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
// Remove from Cart
// ================================================================
export async function removeFromCart(productId) {
  if (!cartLoaded) {
    loadCart();
  }
  
  cartItems = cartItems.filter(item => item.productId !== productId);
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
// Calculate Totals
// ================================================================
export async function calculateCartTotals() {
  if (!cartLoaded) {
    loadCart();
  }
  
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  
  let total = 0;
  
  for (const item of cartItems) {
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
// Update Cart UI
// ================================================================
export async function updateCartUI() {
  if (!cartLoaded) {
    loadCart();
  }
  
  const { totalItems, total } = await calculateCartTotals();
  const currentLang = window.currentLang || 'ar';
  const translations = window.i18n.t || {};
  const t = translations[currentLang] || {};
  
  // Update badges
  const badges = ['navCartBadge', 'cartBadgeDesktop', 'cartBadgeMobile'];
  badges.forEach(badgeId => {
    const badge = document.getElementById(badgeId);
    if (badge) badge.textContent = totalItems;
  });
  
  // Update cart displays
  await updateSingleCartUI('cartItemsDesktop', 'cartTotalDesktop', 'cartFooterDesktop', total, t);
  await updateSingleCartUI('cartItemsMobile', 'cartTotalMobile', 'cartFooterMobile', total, t);
}

// ================================================================
// Update Single Cart UI
// ================================================================
async function updateSingleCartUI(itemsId, totalId, footerId, total, translations) {
  const cartItemsEl = document.getElementById(itemsId);
  const cartTotal = document.getElementById(totalId);
  const cartFooter = document.getElementById(footerId);
  
  if (!cartItemsEl) return;
  
  const currentLang = window.currentLang || 'ar';
  const currency = translations.currency || 'ج.م';
  
  if (cartTotal) {
    cartTotal.textContent = `${total.toFixed(2)} ${currency}`;
  }
  
  if (cartItems.length === 0) {
    const emptyText = currentLang === 'ar' ? 'سلتك فارغة حالياً' : 'Your cart is empty';
    const emptySubtext = currentLang === 'ar' ? 'أضف بعض الآيس كريم اللذيذ! 🍦' : 'Add some delicious ice cream! 🍦';
    
    cartItemsEl.innerHTML = `
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
  
  for (const item of cartItems) {
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
  
  cartItemsEl.innerHTML = html;
  
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// ================================================================
// Save Cart
// ================================================================
export function saveCart() {
  storage.setCart(cartItems);
  console.log('💾 Cart saved:', cartItems.length, 'items');
}

// ================================================================
// Load Cart (SYNCHRONOUS)
// ================================================================
export function loadCart() {
  const savedCart = storage.getCart();
  if (savedCart && Array.isArray(savedCart)) {
    cartItems = savedCart;
    cartLoaded = true;
    console.log('✅ Cart loaded:', cartItems.length, 'items');
  } else {
    cartItems = [];
    cartLoaded = true;
  }
}

// ================================================================
// Clear Cart
// ================================================================
export async function clearCart() {
  cartItems = [];
  cartLoaded = true;
  saveCart();
  await updateCartUI();
  console.log('🗑️ Cart cleared');
}

// ================================================================
// Modal Functions
// ================================================================
export function openCartModal() {
  if (!cartLoaded) {
    loadCart();
  }
  
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
// Initialize Cart on Module Load
// ================================================================
loadCart();

// ================================================================
// Window Exports
// ================================================================
if (typeof window !== 'undefined') {
  window.cartModule = {
    getCart,
    getCartLength,
    isCartEmpty,
    addToCart,
    updateQuantity,
    removeFromCart,
    calculateCartTotals,
    updateCartUI,
    clearCart,
    openCartModal,
    closeCartModal
  };
  
  console.log('✅ Cart module initialized');
}

