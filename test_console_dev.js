// ================================================================
// 🧪 Testing Script - نسخ في Console المتصفح
// ================================================================

console.log('🧪 Starting System Tests...\n');

// ================================================================
// Test 1: API Connection
// ================================================================
async function testAPIConnection() {
  console.log('📡 Test 1: API Connection...');
  try {
    const products = await api.getProducts();
    console.log('✅ API Connection: OK');
    console.log('   - Products loaded:', products.length);
    return true;
  } catch (error) {
    console.error('❌ API Connection: FAILED');
    console.error('   - Error:', error.message);
    return false;
  }
}

// ================================================================
// Test 2: Price Calculation
// ================================================================
async function testPriceCalculation() {
  console.log('\n📊 Test 2: Price Calculation...');
  try {
    const testItems = [
      { productId: '1', quantity: 2 },
      { productId: '2', quantity: 1 }
    ];
    
    const prices = await api.calculateOrderPrices(
      testItems,
      null,
      'delivery',
      null
    );
    
    console.log('✅ Price Calculation: OK');
    console.log('   - Subtotal:', prices.subtotal);
    console.log('   - Delivery Fee:', prices.deliveryFee);
    console.log('   - Total:', prices.total);
    console.log('   - Items:', prices.items.length);
    
    // Validate structure
    if (!prices.items || !prices.subtotal === undefined || !prices.total === undefined) {
      throw new Error('Invalid price structure');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Price Calculation: FAILED');
    console.error('   - Error:', error.message);
    console.error('   - Response:', error.data);
    return false;
  }
}

// ================================================================
// Test 3: Price Calculation with Promo
// ================================================================
async function testPriceWithPromo() {
  console.log('\n🎟️ Test 3: Price with Promo Code...');
  try {
    const testItems = [
      { productId: '1', quantity: 3 }
    ];
    
    const prices = await api.calculateOrderPrices(
      testItems,
      'WELCOME10',
      'delivery',
      null
    );
    
    console.log('✅ Price with Promo: OK');
    console.log('   - Subtotal:', prices.subtotal);
    console.log('   - Discount:', prices.discount);
    console.log('   - Total:', prices.total);
    
    if (prices.discount <= 0) {
      console.warn('⚠️ Warning: No discount applied');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Price with Promo: FAILED');
    console.error('   - Error:', error.message);
    return false;
  }
}

// ================================================================
// Test 4: Cart Integration
// ================================================================
async function testCartIntegration() {
  console.log('\n🛒 Test 4: Cart Integration...');
  try {
    // Check if cart functions exist
    if (typeof getCart !== 'function') {
      throw new Error('Cart functions not available');
    }
    
    const cart = getCart();
    console.log('✅ Cart Integration: OK');
    console.log('   - Cart items:', cart.length);
    console.log('   - Is empty:', isCartEmpty());
    
    return true;
  } catch (error) {
    console.error('❌ Cart Integration: FAILED');
    console.error('   - Error:', error.message);
    return false;
  }
}

// ================================================================
// Test 5: Checkout Module
// ================================================================
async function testCheckoutModule() {
  console.log('\n💳 Test 5: Checkout Module...');
  try {
    if (!window.checkoutModule) {
      throw new Error('Checkout module not initialized');
    }
    
    const required = [
      'initiateCheckout',
      'confirmOrder',
      'recalculatePrices',
      'applyPromoCode'
    ];
    
    const missing = required.filter(fn => typeof window.checkoutModule[fn] !== 'function');
    
    if (missing.length > 0) {
      throw new Error('Missing functions: ' + missing.join(', '));
    }
    
    console.log('✅ Checkout Module: OK');
    console.log('   - All required functions available');
    
    return true;
  } catch (error) {
    console.error('❌ Checkout Module: FAILED');
    console.error('   - Error:', error.message);
    return false;
  }
}

// ================================================================
// Test 6: Analytics (Non-Critical)
// ================================================================
async function testAnalytics() {
  console.log('\n📊 Test 6: Analytics...');
  try {
    await api.trackEvent({
      name: 'test_event',
      data: { test: true }
    });
    
    console.log('✅ Analytics: OK');
    return true;
  } catch (error) {
    console.warn('⚠️ Analytics: FAILED (non-critical)');
    console.warn('   - Error:', error.message);
    return true; // Analytics failure is OK
  }
}

// ================================================================
// Run All Tests
// ================================================================
async function runAllTests() {
  console.log('═══════════════════════════════════════');
  console.log('🧪 ICE CREAM SYSTEM TEST SUITE');
  console.log('═══════════════════════════════════════\n');
  
  const results = {
    apiConnection: await testAPIConnection(),
    priceCalculation: await testPriceCalculation(),
    priceWithPromo: await testPriceWithPromo(),
    cartIntegration: await testCartIntegration(),
    checkoutModule: await testCheckoutModule(),
    analytics: await testAnalytics()
  };
  
  console.log('\n═══════════════════════════════════════');
  console.log('📊 TEST RESULTS:');
  console.log('═══════════════════════════════════════');
  
  Object.entries(results).forEach(([test, passed]) => {
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  const passedCount = Object.values(results).filter(r => r).length;
  const totalCount = Object.keys(results).length;
  
  console.log('\n═══════════════════════════════════════');
  console.log(`🎯 Score: ${passedCount}/${totalCount} tests passed`);
  console.log('═══════════════════════════════════════\n');
  
  if (passedCount === totalCount) {
    console.log('🎉 All tests passed! System is ready.');
  } else {
    console.warn('⚠️ Some tests failed. Please check errors above.');
  }
  
  return results;
}

// ================================================================
// Quick Test Function
// ================================================================
async function quickTest() {
  console.log('⚡ Running Quick Test...\n');
  
  try {
    // Test basic flow
    const products = await api.getProducts();
    console.log('✅ Products:', products.length);
    
    const prices = await api.calculateOrderPrices(
      [{ productId: '1', quantity: 1 }],
      null,
      'delivery',
      null
    );
    console.log('✅ Prices:', prices);
    
    console.log('\n🎉 Quick Test: PASSED');
    return true;
  } catch (error) {
    console.error('\n❌ Quick Test: FAILED');
    console.error('Error:', error);
    return false;
  }
}

// ================================================================
// Export for console use
// ================================================================
window.systemTests = {
  runAll: runAllTests,
  quick: quickTest,
  individual: {
    api: testAPIConnection,
    prices: testPriceCalculation,
    promo: testPriceWithPromo,
    cart: testCartIntegration,
    checkout: testCheckoutModule,
    analytics: testAnalytics
  }
};

console.log('✅ Test suite loaded. Use:');
console.log('   - systemTests.quick() for quick test');
console.log('   - systemTests.runAll() for full test suite');
console.log('   - systemTests.individual.prices() for specific test');