import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, ShoppingCart, Flame, Droplets, Wheat, Candy } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode } from 'swiper/modules';
import EnergyBadge, { EnergyBar } from './EnergyBadge';
import ProductCard from './ProductCard';
import { useProducts } from '../context/ProductsContext';

import 'swiper/css';
import 'swiper/css/free-mode';

/**
 * ProductModal Component
 * 
 * Features:
 * - Full product details with nutrition facts
 * - Quantity selector
 * - Energy breakdown with visual bars
 * - Recommendations carousel
 * - Smooth animations and transitions
 */
const ProductModal = ({ onAddToCart }) => {
  const { selectedProduct, closeProduct, getRecommendations } = useProducts();
  const [quantity, setQuantity] = useState(1);
  const [recommendations, setRecommendations] = useState([]);
  const [showNutrition, setShowNutrition] = useState(false);

  // Fetch recommendations when product opens
  useEffect(() => {
    if (selectedProduct) {
      setQuantity(1);
      setShowNutrition(false);
      
      getRecommendations(selectedProduct.id, 5).then(recs => {
        setRecommendations(recs);
      });
    }
  }, [selectedProduct, getRecommendations]);

  if (!selectedProduct) return null;

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      onAddToCart(selectedProduct);
    }
    closeProduct();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      closeProduct();
    }
  };

  // Parse JSON fields safely
  const tags = selectedProduct.tags ? JSON.parse(selectedProduct.tags) : [];
  const ingredients = selectedProduct.ingredients ? JSON.parse(selectedProduct.ingredients) : [];
  const allergens = selectedProduct.allergens ? JSON.parse(selectedProduct.allergens) : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center modal-backdrop animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div className="
        relative bg-white w-full max-w-2xl 
        rounded-t-3xl md:rounded-3xl 
        max-h-[90vh] overflow-y-auto
        animate-slide-up
        shadow-2xl
      ">
        {/* Close Button */}
        <button
          onClick={closeProduct}
          className="absolute top-4 left-4 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
        >
          <X className="w-6 h-6 text-gray-600" />
        </button>

        {/* Product Image */}
        <div className="relative h-64 md:h-80 overflow-hidden bg-gray-100">
          <img
            src={selectedProduct.image}
            alt={selectedProduct.name}
            className="w-full h-full object-cover"
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Badge */}
          {selectedProduct.badge && (
            <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
              {selectedProduct.badge}
            </div>
          )}

          {/* Energy Badge */}
          <div className="absolute bottom-4 right-4">
            <EnergyBadge
              energyType={selectedProduct.energy_type}
              energyScore={selectedProduct.energy_score}
              size="lg"
              showLabel
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              {selectedProduct.name}
            </h2>
            <p className="text-gray-600 text-sm md:text-base">
              {selectedProduct.description}
            </p>
          </div>

          {/* Price & Quantity */}
          <div className="flex items-center justify-between bg-gray-50 rounded-2xl p-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-primary-600">
                {selectedProduct.price * quantity}
              </span>
              <span className="text-gray-500">ج.م</span>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center gap-3 bg-white rounded-xl p-1 shadow-sm">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                disabled={quantity <= 1}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center font-bold">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-8 h-8 rounded-lg bg-primary-500 hover:bg-primary-600 text-white flex items-center justify-center transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Nutrition Facts */}
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center p-3 bg-orange-50 rounded-xl">
              <Flame className="w-6 h-6 text-orange-500 mx-auto mb-1" />
              <div className="text-lg font-bold text-gray-900">{selectedProduct.calories}</div>
              <div className="text-xs text-gray-600">سعرة</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-xl">
              <Droplets className="w-6 h-6 text-blue-500 mx-auto mb-1" />
              <div className="text-lg font-bold text-gray-900">{selectedProduct.protein}g</div>
              <div className="text-xs text-gray-600">بروتين</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-xl">
              <Wheat className="w-6 h-6 text-yellow-600 mx-auto mb-1" />
              <div className="text-lg font-bold text-gray-900">{selectedProduct.carbs}g</div>
              <div className="text-xs text-gray-600">كربوهيدرات</div>
            </div>
            <div className="text-center p-3 bg-pink-50 rounded-xl">
              <Candy className="w-6 h-6 text-pink-500 mx-auto mb-1" />
              <div className="text-lg font-bold text-gray-900">{selectedProduct.sugar}g</div>
              <div className="text-xs text-gray-600">سكر</div>
            </div>
          </div>

          {/* Energy Breakdown */}
          {selectedProduct.energy_type !== 'none' && (
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-4 space-y-3">
              <h3 className="font-bold text-gray-900">تحليل الطاقة</h3>
              <EnergyBar
                energyType={selectedProduct.energy_type}
                energyScore={selectedProduct.energy_score}
              />
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div>
              <h3 className="font-bold text-gray-900 mb-2">المميزات</h3>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Nutrition (Collapsible) */}
          <div>
            <button
              onClick={() => setShowNutrition(!showNutrition)}
              className="w-full text-right font-bold text-gray-900 mb-2 flex items-center justify-between"
            >
              <span>القيم الغذائية التفصيلية</span>
              <span className="text-primary-500">{showNutrition ? '−' : '+'}</span>
            </button>
            
            {showNutrition && (
              <div className="space-y-2 animate-slide-up">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">الدهون</span>
                  <span className="font-semibold">{selectedProduct.fat}g</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">الألياف</span>
                  <span className="font-semibold">{selectedProduct.fiber}g</span>
                </div>
                {ingredients.length > 0 && (
                  <div className="py-2">
                    <span className="text-gray-600 block mb-1">المكونات:</span>
                    <span className="text-sm text-gray-700">{ingredients.join('، ')}</span>
                  </div>
                )}
                {allergens.length > 0 && (
                  <div className="py-2 bg-yellow-50 rounded-lg px-3">
                    <span className="text-yellow-800 font-semibold block mb-1">⚠️ تحذير الحساسية:</span>
                    <span className="text-sm text-yellow-700">{allergens.join('، ')}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div>
              <h3 className="font-bold text-gray-900 mb-3">قد يعجبك أيضاً</h3>
              <Swiper
                modules={[FreeMode]}
                spaceBetween={12}
                slidesPerView="auto"
                freeMode
                dir="rtl"
              >
                {recommendations.map(product => (
                  <SwiperSlide key={product.id} className="!w-[140px]">
                    <ProductCard product={product} onAddToCart={onAddToCart} />
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          )}

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            className="
              w-full py-4 bg-primary-500 hover:bg-primary-600 
              text-white font-bold rounded-xl
              flex items-center justify-center gap-2
              transition-all duration-300
              shadow-lg hover:shadow-xl
              active:scale-95
            "
          >
            <ShoppingCart className="w-5 h-5" />
            <span>أضف إلى السلة ({quantity})</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;
