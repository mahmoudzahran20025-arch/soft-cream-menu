import React, { useState, useEffect } from 'react';
import { ProductsProvider } from './context/ProductsContext';
import ProductsGrid from './components/ProductsGrid';
import ProductModal from './components/ProductModal';
import NutritionSummary from './components/NutritionSummary';
import FilterBar from './components/FilterBar';
import { ShoppingCart } from 'lucide-react';

function App() {
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);

  // 🔗 Listen for events from Vanilla JS
  useEffect(() => {
    // Event: Open cart from header button
    const handleOpenCart = () => {
      console.log('🆕 React received: open-react-cart');
      setShowCart(true);
    };

    window.addEventListener('open-react-cart', handleOpenCart);

    return () => {
      window.removeEventListener('open-react-cart', handleOpenCart);
    };
  }, []);

  // 🔗 Notify Vanilla JS when cart updates
  useEffect(() => {
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    // Dispatch event to update header badge
    window.dispatchEvent(new CustomEvent('react-cart-updated', {
      detail: { count: cartCount, cart }
    }));

    // Update sidebar badges
    if (window.sidebarModule && window.sidebarModule.updateSidebarBadges) {
      window.sidebarModule.updateSidebarBadges();
    }

    console.log('🆕 React dispatched: react-cart-updated', { count: cartCount });
  }, [cart]);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity === 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <ProductsProvider>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-40">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  🍦 Soft Cream
                </h1>
                <p className="text-sm text-gray-600">
                  Smart Nutrition & Energy
                </p>
              </div>
              
              {/* Cart Button */}
              <button
                onClick={() => setShowCart(!showCart)}
                className="relative p-3 bg-primary-500 text-white rounded-full hover:bg-primary-600 transition-colors shadow-lg"
              >
                <ShoppingCart className="w-6 h-6" />
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                    {cartItemsCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Filter Bar */}
        <FilterBar />

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <ProductsGrid onAddToCart={addToCart} />
        </main>

        {/* Product Modal */}
        <ProductModal onAddToCart={addToCart} />

        {/* Nutrition Summary Sidebar */}
        {showCart && (
          <div className="fixed inset-0 z-50 flex items-start justify-end">
            <div
              className="absolute inset-0 bg-black bg-opacity-50"
              onClick={() => setShowCart(false)}
            />
            <div className="relative bg-white h-full w-full max-w-md shadow-2xl overflow-y-auto">
              <NutritionSummary
                cart={cart}
                onUpdateQuantity={updateQuantity}
                onRemove={removeFromCart}
                onClose={() => setShowCart(false)}
              />
            </div>
          </div>
        )}
      </div>
    </ProductsProvider>
  );
}

export default App;
