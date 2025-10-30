import React, { useState } from 'react';
import { Plus, Flame, Droplets } from 'lucide-react';
import EnergyBadge from './EnergyBadge';
import { useProducts } from '../context/ProductsContext';

/**
 * ProductCard Component
 * Optimized for mobile-first Swiper carousel
 * 
 * Key Features:
 * - Fixed width (160px mobile, 200px desktop) for "2.5 cards visible" effect
 * - aspect-[3/4] prevents layout shift during image load
 * - group-hover for smooth energy overlay reveal
 * - e.stopPropagation() separates quick-add from modal open
 */
const ProductCard = ({ product, onAddToCart }) => {
  const { openProduct } = useProducts();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleQuickAdd = (e) => {
    e.stopPropagation(); // Prevent modal from opening
    onAddToCart(product);
    
    // Visual feedback - save reference before setTimeout
    const button = e.currentTarget;
    if (button) {
      button.classList.add('scale-90');
      setTimeout(() => {
        if (button) {
          button.classList.remove('scale-90');
        }
      }, 150);
    }
  };

  const handleCardClick = () => {
    openProduct(product);
  };

  return (
    <div
      onClick={handleCardClick}
      className="
        group relative
        bg-white rounded-2xl shadow-md overflow-hidden
        cursor-pointer transition-all duration-300
        hover:shadow-2xl hover:-translate-y-2
        product-card
      "
    >
      {/* Image Container */}
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 skeleton" />
        )}
        
        <img
          src={imageError ? '/placeholder-ice-cream.jpg' : product.image}
          alt={product.name}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          className={`
            w-full h-full object-cover
            transition-all duration-500
            group-hover:scale-110
            ${imageLoaded ? 'opacity-100' : 'opacity-0'}
          `}
        />

        {/* Badge Overlay */}
        {product.badge && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
            {product.badge}
          </div>
        )}

        {/* Energy Badge */}
        <div className="absolute top-2 left-2">
          <EnergyBadge
            energyType={product.energy_type}
            energyScore={product.energy_score}
            size="sm"
            showScore={false}
          />
        </div>

        {/* Energy Overlay (appears on hover) */}
        <div className="
          absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent
          opacity-0 group-hover:opacity-100
          transition-opacity duration-300
          flex flex-col justify-end p-3
        ">
          <div className="space-y-1">
            {/* Calories */}
            <div className="flex items-center gap-1.5 text-white text-xs">
              <Flame className="w-3.5 h-3.5" />
              <span className="font-semibold">{product.calories} سعرة</span>
            </div>
            
            {/* Protein */}
            {product.protein > 0 && (
              <div className="flex items-center gap-1.5 text-white text-xs">
                <Droplets className="w-3.5 h-3.5" />
                <span className="font-semibold">{product.protein}g بروتين</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Add Button */}
        <button
          onClick={handleQuickAdd}
          className="
            absolute bottom-2 right-2
            w-8 h-8 rounded-full
            bg-primary-500 text-white
            flex items-center justify-center
            shadow-lg
            opacity-0 group-hover:opacity-100
            transition-all duration-300
            hover:bg-primary-600 hover:scale-110
            active:scale-90
          "
          aria-label="إضافة سريعة"
        >
          <Plus className="w-5 h-5" strokeWidth={3} />
        </button>
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        {/* Product Name */}
        <h3 className="font-bold text-gray-900 text-sm line-clamp-2 min-h-[2.5rem]">
          {product.name}
        </h3>

        {/* Price & Energy Score */}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-primary-600">
              {product.price}
            </span>
            <span className="text-xs text-gray-500">ج.م</span>
          </div>

          {product.energy_score > 0 && (
            <div className="flex items-center gap-1 text-xs font-semibold text-gray-600">
              <span className="text-yellow-500">⚡</span>
              <span>{product.energy_score}</span>
            </div>
          )}
        </div>

        {/* Category Tag */}
        {product.category && (
          <div className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
            {product.category}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
