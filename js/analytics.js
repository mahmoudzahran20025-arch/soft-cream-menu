// ================================================================
// GA4 Analytics Helper - Soft Cream Webapp
// Measurement ID: G-5TWQ7CZF2Q
// ================================================================

console.log('🔄 Loading analytics.js...');

/**
 * Check if GA4 is loaded
 */
function isGA4Loaded() {
  return typeof gtag !== 'undefined';
}

/**
 * Track when user views a product
 */
export function trackViewItem(product) {
  if (!isGA4Loaded()) return;
  
  gtag('event', 'view_item', {
    currency: 'EGP',
    value: product.price,
    items: [{
      item_id: product.id,
      item_name: product.name,
      item_category: product.category || 'soft-cream',
      price: product.price,
      quantity: 1
    }]
  });
  
  console.log('📊 GA4: view_item', product.name);
}

/**
 * Track when user adds item to cart
 */
export function trackAddToCart(product, quantity = 1) {
  if (!isGA4Loaded()) return;
  
  gtag('event', 'add_to_cart', {
    currency: 'EGP',
    value: product.price * quantity,
    items: [{
      item_id: product.id,
      item_name: product.name,
      item_category: product.category || 'soft-cream',
      price: product.price,
      quantity: quantity
    }]
  });
  
  console.log('📊 GA4: add_to_cart', product.name, 'x', quantity);
}

/**
 * Track when user removes item from cart
 */
export function trackRemoveFromCart(product, quantity = 1) {
  if (!isGA4Loaded()) return;
  
  gtag('event', 'remove_from_cart', {
    currency: 'EGP',
    value: product.price * quantity,
    items: [{
      item_id: product.id,
      item_name: product.name,
      item_category: product.category || 'soft-cream',
      price: product.price,
      quantity: quantity
    }]
  });
  
  console.log('📊 GA4: remove_from_cart', product.name);
}

/**
 * Track when user views cart
 */
export function trackViewCart(cartItems, totalValue) {
  if (!isGA4Loaded()) return;
  
  const items = cartItems.map(item => ({
    item_id: item.id,
    item_name: item.name,
    item_category: item.category || 'soft-cream',
    price: item.price,
    quantity: item.quantity
  }));
  
  gtag('event', 'view_cart', {
    currency: 'EGP',
    value: totalValue,
    items: items
  });
  
  console.log('📊 GA4: view_cart', items.length, 'items');
}

/**
 * Track checkout initiation
 */
export function trackBeginCheckout(cartItems, totalValue) {
  if (!isGA4Loaded()) return;
  
  const items = cartItems.map(item => ({
    item_id: item.id,
    item_name: item.name,
    item_category: item.category || 'soft-cream',
    price: item.price,
    quantity: item.quantity
  }));
  
  gtag('event', 'begin_checkout', {
    currency: 'EGP',
    value: totalValue,
    items: items
  });
  
  console.log('📊 GA4: begin_checkout', totalValue, 'EGP');
}

/**
 * Track successful purchase
 */
export function trackPurchase(orderId, cartItems, totalValue, deliveryFee = 0) {
  if (!isGA4Loaded()) return;
  
  const items = cartItems.map(item => ({
    item_id: item.id,
    item_name: item.name,
    item_category: item.category || 'soft-cream',
    price: item.price,
    quantity: item.quantity
  }));
  
  gtag('event', 'purchase', {
    transaction_id: orderId,
    currency: 'EGP',
    value: totalValue,
    shipping: deliveryFee,
    items: items
  });
  
  console.log('📊 GA4: purchase', orderId, totalValue, 'EGP');
}

/**
 * Track custom button clicks (Boost Brain, Fuel Energy, etc.)
 */
export function trackButtonClick(buttonName, category = 'engagement') {
  if (!isGA4Loaded()) return;
  
  gtag('event', 'button_click', {
    event_category: category,
    event_label: buttonName
  });
  
  console.log('📊 GA4: button_click', buttonName);
}

/**
 * Track nutrition-conscious interactions
 */
export function trackNutritionInteraction(action, label) {
  if (!isGA4Loaded()) return;
  
  gtag('event', 'nutrition_interaction', {
    event_category: 'nutrition',
    event_label: label,
    action: action
  });
  
  console.log('📊 GA4: nutrition_interaction', action, label);
}

/**
 * Track search queries
 */
export function trackSearch(searchTerm) {
  if (!isGA4Loaded()) return;
  
  gtag('event', 'search', {
    search_term: searchTerm
  });
  
  console.log('📊 GA4: search', searchTerm);
}

/**
 * Track filter usage
 */
export function trackFilterUsage(filterType, filterValue) {
  if (!isGA4Loaded()) return;
  
  gtag('event', 'filter_usage', {
    event_category: 'engagement',
    filter_type: filterType,
    filter_value: filterValue
  });
  
  console.log('📊 GA4: filter_usage', filterType, filterValue);
}

/**
 * Track virtual page views for SPA navigation (future-proof)
 */
export function trackPageView(pagePath, pageTitle) {
  if (!isGA4Loaded()) return;
  
  gtag('config', 'G-5TWQ7CZF2Q', {
    page_path: pagePath,
    page_title: pageTitle
  });
  
  console.log('📊 GA4: page_view', pagePath);
}

console.log('✅ analytics.js loaded successfully');
