// ================================================================
// cart.js - FIXED VERSION with SVG Sprites (No Lucide)
// ================================================================

import { productsManager } from './products.js';
import { showToast } from './utils.js';
import { storage } from './storage.js';

// ================================================================
// Cart State
// ================================================================
let cartItems = [];
let cartLoaded = false;

// ================================================================
// Get Cart (Synchronous)
// ================================================================
export function getCart() {
  if (!cartLoaded) {
    loadCart();
  }
  return [...cartItems];
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
// Add to Cart
// ================================================================
export async function addToCart(event, productId, quantity = 1) {
  if (event) {
    event.stopPropagation();
  }
  
  if (!cartLoaded) {
    loadCart();
  }
  
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
// Update Cart UI - ENHANCED with Desktop Cart
// ================================================================
export async function updateCartUI() {
  if (!cartLoaded) {
    loadCart();
  }
  
  const { totalItems, total } = await calculateCartTotals();
  const currentLang = window.currentLang || 'ar';
  const translations = window.i18n.t || {};
  const t = translations[currentLang] || {};
  
  // ✅ Update ALL badges (including header and sidebar)
  const badges = [
    'navCartBadge',
    'cartBadgeDesktop',
    'cartBadgeMobile',
    'headerCartBadge',
    'sidebarCartBadge'
  ];
  
  badges.forEach(badgeId => {
    const badge = document.getElementById(badgeId);
    if (badge) {
      badge.textContent = totalItems;
      if (totalItems > 0) {
        badge.style.display = 'inline-flex';
      } else {
        badge.style.display = 'none';
      }
    }
  });
  
  // Update cart displays
  await updateSingleCartUI('cartItemsDesktop', 'cartTotalDesktop', 'cartFooterDesktop', total, t);
  await updateSingleCartUI('cartItemsMobile', 'cartTotalMobile', 'cartFooterMobile', total, t);
}

// ================================================================
// Update Single Cart UI (Mobile/Desktop Modal) - SVG SPRITES
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
  
  // ✅ Empty Cart - Using SVG Sprites
  if (cartItems.length === 0) {
    const emptyText = currentLang === 'ar' ? 'سلتك فارغة حالياً' : 'Your cart is empty';
    const emptySubtext = currentLang === 'ar' ? 'أضف بعض الآيس كريم اللذيذ! 🍦' : 'Add some delicious ice cream! 🍦';
    
    cartItemsEl.innerHTML = `
      <div class="flex flex-col items-center justify-center py-16 text-center">
        <div class="cart-empty-pulse w-24 h-24 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center mb-5">
          <svg class="w-12 h-12 text-pink-300 dark:text-gray-500" aria-hidden="true">
            <use href="#shopping-basket"></use>
          </svg>
        </div>
        <p class="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">${emptyText}</p>
        <p class="text-sm text-gray-500 dark:text-gray-400">${emptySubtext}</p>
      </div>
    `;
    
    if (cartFooter) {
      cartFooter.style.display = 'none';
    }
    return;
  }
  
  if (cartFooter) {
    cartFooter.style.display = 'block';
  }
  
  // ✅ Cart Items - Using SVG Sprites
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
      const imageUrl = product.image || 'https://via.placeholder.com/80x80?text=Ice+Cream';
      
      html += `
        <div class="flex items-start gap-4 p-4 bg-gradient-to-br from-pink-50/50 to-purple-50/50 dark:from-gray-700/30 dark:to-gray-600/30 rounded-2xl hover:shadow-lg transition-all duration-300 mb-3">
          
          <!-- Product Image -->
          <div class="relative flex-shrink-0">
            <img src="${imageUrl}" 
                 alt="${name}" 
                 class="w-20 h-20 rounded-xl object-cover shadow-md ring-2 ring-white dark:ring-gray-600">
            <div class="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-primary to-secondary text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg">
              ${item.quantity}
            </div>
          </div>
          
          <!-- Product Details -->
          <div class="flex-1 min-w-0">
            
            <!-- Name + Remove Button -->
            <div class="flex items-start justify-between gap-2 mb-3">
              <h4 class="text-base font-bold text-gray-800 dark:text-gray-100 leading-tight">${name}</h4>
              <button onclick="window.cartModule.removeFromCart('${item.productId}')" 
                      class="flex-shrink-0 w-8 h-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center justify-center transition-colors group"
                      aria-label="Remove ${name}">
                <svg class="w-4 h-4 text-gray-400 group-hover:text-red-500 transition-colors" aria-hidden="true">
                  <use href="#trash-2"></use>
                </svg>
              </button>
            </div>
            
            <!-- Price + Quantity Controls -->
            <div class="flex items-center justify-between">
              
              <!-- Quantity Controls -->
              <div class="flex items-center gap-2 bg-white dark:bg-gray-700 rounded-xl shadow-sm p-1">
                <button onclick="window.cartModule.updateQuantity('${item.productId}', -1)" 
                        class="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 hover:from-primary hover:to-secondary hover:text-white flex items-center justify-center transition-all duration-200 active:scale-95"
                        aria-label="Decrease quantity">
                  <svg class="w-4 h-4" aria-hidden="true">
                    <use href="#minus"></use>
                  </svg>
                </button>
                <span class="min-w-[32px] text-center font-bold text-gray-800 dark:text-gray-100">${item.quantity}</span>
                <button onclick="window.cartModule.updateQuantity('${item.productId}', 1)" 
                        class="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 hover:from-primary hover:to-secondary hover:text-white flex items-center justify-center transition-all duration-200 active:scale-95"
                        aria-label="Increase quantity">
                  <svg class="w-4 h-4" aria-hidden="true">
                    <use href="#plus"></use>
                  </svg>
                </button>
              </div>
              
              <!-- Item Total Price -->
              <div class="text-right">
                <div class="text-xs text-gray-500 dark:text-gray-400 mb-0.5">${price.toFixed(2)} ${currency}</div>
                <div class="text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  ${itemTotal.toFixed(2)} ${currency}
                </div>
              </div>
              
            </div>
            
          </div>
          
        </div>
      `;
    } catch (error) {
      console.error('Error rendering cart item:', error);
    }
  }
  
  cartItemsEl.innerHTML = html;
}

// ================================================================
// Save/Load Cart
// ================================================================
export function saveCart() {
  storage.setCart(cartItems);
  console.log('💾 Cart saved:', cartItems.length, 'items');
}

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
  console.log('🛒 Opening cart modal...');
  
  if (!cartLoaded) {
    loadCart();
  }
  
  // Check if React Mini-App is handling the cart
  const reactRoot = document.getElementById('react-shopping-app-root');
  if (reactRoot && reactRoot.children.length > 0) {
    console.log('🆕 Dispatching event to React Mini-App...');
    window.dispatchEvent(new CustomEvent('open-react-cart'));
    return;
  }
  
  // Fallback to vanilla modal
  const modal = document.getElementById('cartModal');
  if (modal) {
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    console.log('✅ Cart modal opened (vanilla)');
  } else {
    console.warn('⚠️ Cart modal not found');
  }
}

export function closeCartModal(event) {
  if (event && !event.target.classList.contains('cart-modal-overlay')) return;
  
  console.log('🛒 Closing cart modal...');
  
  const modal = document.getElementById('cartModal');
  if (modal) {
    modal.classList.remove('show');
    document.body.style.overflow = '';
    console.log('✅ Cart modal closed');
  }
}

// ================================================================
// Initialize Cart on Module Load
// ================================================================
loadCart();

// ================================================================
// 🔗 Listen for React Cart Updates
// ================================================================
if (typeof window !== 'undefined') {
  window.addEventListener('react-cart-updated', (event) => {
    const { count } = event.detail || {};
    console.log('🆕 Vanilla received: react-cart-updated', { count });
    
    // Update all header badges
    const badges = [
      'headerCartBadge',
      'sidebarCartBadge',
      'navCartBadge',
      'cartBadgeDesktop',
      'cartBadgeMobile'
    ];
    
    badges.forEach(badgeId => {
      const badge = document.getElementById(badgeId);
      if (badge) {
        badge.textContent = count || 0;
        if (count > 0) {
          badge.style.display = 'inline-flex';
        } else {
          badge.style.display = 'none';
        }
      }
    });
  });

  // 🔗 Listen for React Checkout Click
  window.addEventListener('react-checkout-clicked', async (event) => {
    console.log('🛒 Vanilla received: react-checkout-clicked', event.detail);
    
    // Use the global initiateCheckout function
    if (typeof window.initiateCheckout === 'function') {
      console.log('🔄 Opening checkout modal from React...');
      window.initiateCheckout();
    } else {
      console.error('❌ window.initiateCheckout is not available');
    }
  });
}

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
  
  window.openCartModal = openCartModal;
  window.closeCartModal = closeCartModal;
  window.addToCart = addToCart;
  window.updateQuantity = updateQuantity;
  window.removeFromCart = removeFromCart;
  
  console.log('✅ Cart module initialized with SVG sprites');
}

console.log('✅ Cart module loaded');