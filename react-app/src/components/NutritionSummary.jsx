import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Trash2, Flame, Droplets, Wheat, Activity, Brain, Zap, ShoppingCart } from 'lucide-react';

/**
 * NutritionSummary Component
 * 
 * Features:
 * - Real-time nutrition calculation from backend
 * - Cart management (quantity, remove)
 * - Energy breakdown visualization
 * - Macros summary with icons
 * - Checkout integration ready
 */
const NutritionSummary = ({ cart, onUpdateQuantity, onRemove, onClose }) => {
  const [nutritionData, setNutritionData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch nutrition summary from backend
  useEffect(() => {
    if (cart.length === 0) {
      setNutritionData(null);
      return;
    }

    const fetchNutrition = async () => {
      setLoading(true);
      try {
        const productIds = cart.map(item => item.id);
        const response = await fetch(
          'https://softcream-api.mahmoud-zahran20025.workers.dev?path=/products/nutrition-summary',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productIds })
          }
        );
        const result = await response.json();
        setNutritionData(result.data);
      } catch (error) {
        console.error('Failed to fetch nutrition:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNutrition();
  }, [cart]);

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Handle checkout button click
  const handleCheckout = () => {
    console.log('🛒 React: Checkout button clicked', { cart, subtotal });
    
    // ✅ CRITICAL: Sync React cart to Vanilla JS sessionStorage
    try {
      // Convert React cart format to Vanilla JS format
      const vanillaCart = cart.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        name: item.name,
        price: item.price,
        image: item.image,
        calories: item.calories
      }));
      
      console.log('🔄 Syncing cart to sessionStorage:', vanillaCart);
      
      // ✅ CRITICAL: Vanilla JS uses sessionStorage, not localStorage!
      sessionStorage.setItem('cart', JSON.stringify(vanillaCart));
      
      // Also trigger cart-updated event for Vanilla JS
      window.dispatchEvent(new CustomEvent('cart-updated'));
      
      console.log('✅ Cart synced successfully');
      
    } catch (error) {
      console.error('❌ Failed to sync cart:', error);
    }
    
    // Close React cart
    onClose();
    
    // Wait for animation to complete, then trigger vanilla checkout
    setTimeout(() => {
      console.log('🔄 React: Opening Vanilla checkout...');
      
      // ✅ CRITICAL: Force Vanilla JS to reload cart from localStorage
      if (typeof window.reloadCart === 'function') {
        window.reloadCart();
        console.log('✅ Vanilla cart reloaded');
      } else {
        console.warn('⚠️ window.reloadCart not available');
      }
      
      // Use global initiateCheckout directly
      if (typeof window.initiateCheckout === 'function') {
        window.initiateCheckout();
      } else {
        console.error('❌ window.initiateCheckout not available');
      }
    }, 300);
  };

  // Empty cart state
  if (cart.length === 0) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold">السلة</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <ShoppingCart className="w-20 h-20 text-gray-300 mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">السلة فارغة</h3>
          <p className="text-gray-600">ابدأ بإضافة منتجاتك المفضلة</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-primary-500 to-primary-600 text-white">
        <div>
          <h2 className="text-xl font-bold">السلة</h2>
          <p className="text-sm opacity-90">{totalItems} منتج</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {cart.map(item => (
          <div key={item.id} className="bg-gray-50 rounded-xl p-3 space-y-3">
            <div className="flex gap-3">
              {/* Image */}
              <img
                src={item.image}
                alt={item.name}
                className="w-20 h-20 object-cover rounded-lg"
              />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 text-sm line-clamp-2">
                  {item.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-primary-600 font-bold">
                    {item.price} ج.م
                  </span>
                  <span className="text-xs text-gray-500">
                    • {item.calories} سعرة
                  </span>
                </div>
              </div>

              {/* Remove */}
              <button
                onClick={() => onRemove(item.id)}
                className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Quantity Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm">
                <button
                  onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                  className="w-7 h-7 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                <button
                  onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                  className="w-7 h-7 rounded-md bg-primary-500 hover:bg-primary-600 text-white flex items-center justify-center"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <span className="font-bold text-gray-900">
                {(item.price * item.quantity).toFixed(2)} ج.م
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Nutrition Summary */}
      {nutritionData && nutritionData.totalCalories !== undefined && (
        <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 border-t border-b">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            ملخص التغذية
          </h3>
          
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-white rounded-lg p-3 text-center">
              <Flame className="w-5 h-5 text-orange-500 mx-auto mb-1" />
              <div className="text-lg font-bold text-gray-900">{nutritionData.totalCalories || 0}</div>
              <div className="text-xs text-gray-600">سعرات</div>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <Droplets className="w-5 h-5 text-blue-500 mx-auto mb-1" />
              <div className="text-lg font-bold text-gray-900">{(nutritionData.totalProtein || 0).toFixed(1)}g</div>
              <div className="text-xs text-gray-600">بروتين</div>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <Wheat className="w-5 h-5 text-yellow-600 mx-auto mb-1" />
              <div className="text-lg font-bold text-gray-900">{(nutritionData.totalCarbs || 0).toFixed(1)}g</div>
              <div className="text-xs text-gray-600">كربوهيدرات</div>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <Activity className="w-5 h-5 text-red-500 mx-auto mb-1" />
              <div className="text-lg font-bold text-gray-900">{(nutritionData.totalFat || 0).toFixed(1)}g</div>
              <div className="text-xs text-gray-600">دهون</div>
            </div>
          </div>

          {/* Energy Breakdown */}
          {(nutritionData.mentalEnergy > 0 || nutritionData.physicalEnergy > 0 || nutritionData.balancedEnergy > 0) && (
            <div className="bg-white rounded-lg p-3 space-y-2">
              <h4 className="text-sm font-bold text-gray-900">توزيع الطاقة</h4>
              {nutritionData.mentalEnergy > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-purple-600" />
                    <span className="text-gray-700">ذهنية</span>
                  </div>
                  <span className="font-bold text-purple-600">{nutritionData.mentalEnergy}</span>
                </div>
              )}
              {nutritionData.physicalEnergy > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-orange-600" />
                    <span className="text-gray-700">بدنية</span>
                  </div>
                  <span className="font-bold text-orange-600">{nutritionData.physicalEnergy}</span>
                </div>
              )}
              {nutritionData.balancedEnergy > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-green-600" />
                    <span className="text-gray-700">متوازنة</span>
                  </div>
                  <span className="font-bold text-green-600">{nutritionData.balancedEnergy}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Footer - Checkout */}
      <div className="border-t p-4 space-y-3 bg-white">
        <div className="flex items-center justify-between text-lg">
          <span className="font-semibold text-gray-700">الإجمالي</span>
          <span className="font-bold text-2xl text-primary-600">
            {subtotal.toFixed(2)} ج.م
          </span>
        </div>

        <button
          onClick={handleCheckout}
          className="
            w-full py-4 bg-gradient-to-r from-primary-500 to-primary-600
            hover:from-primary-600 hover:to-primary-700
            text-white font-bold rounded-xl
            shadow-lg hover:shadow-xl
            transition-all duration-300
            active:scale-95
          "
          style={{
            background: 'linear-gradient(to right, #ef4444, #dc2626)',
            color: 'white',
            fontWeight: 'bold',
            padding: '1rem',
            borderRadius: '0.75rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            border: 'none'
          }}
        >
          إتمام الطلب
        </button>
      </div>
    </div>
  );
};

export default NutritionSummary;
