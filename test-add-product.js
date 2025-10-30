// ================================================================
// 🧪 Test Script - Add Products to Cart
// ================================================================

console.log('🧪 Test Script Loaded');

// Wait for modules to load
setTimeout(async () => {
  try {
    // Import cart module
    const { addToCart, updateCartUI, openCartModal } = await import('./js/cart.js');
    
    console.log('✅ Cart module imported');
    
    // Add test products
    console.log('📦 Adding test products...');
    
    // Product 1
    addToCart('vanilla-ice-cream', 2);
    console.log('✅ Added: Vanilla Ice Cream x2');
    
    // Product 2
    addToCart('chocolate-ice-cream', 1);
    console.log('✅ Added: Chocolate Ice Cream x1');
    
    // Update UI
    await updateCartUI();
    console.log('✅ Cart UI updated');
    
    // Open cart after 1 second
    setTimeout(() => {
      openCartModal();
      console.log('✅ Cart modal opened');
      
      // Check footer visibility
      setTimeout(() => {
        const footer = document.getElementById('cartFooterMobile');
        const checkoutBtn = document.querySelector('[onclick="initiateCheckout()"]');
        
        console.log('📊 Footer display:', footer?.style.display);
        console.log('📊 Checkout button visible:', checkoutBtn?.offsetParent !== null);
        
        if (checkoutBtn?.offsetParent !== null) {
          console.log('✅ SUCCESS! Checkout button is visible!');
        } else {
          console.log('❌ FAILED! Checkout button is NOT visible!');
          console.log('🔍 Footer element:', footer);
          console.log('🔍 Checkout button:', checkoutBtn);
        }
      }, 500);
    }, 1000);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}, 2000);
