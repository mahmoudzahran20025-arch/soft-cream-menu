import React, { useMemo } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode, Pagination } from 'swiper/modules';
import ProductCard from './ProductCard';
import { useProducts } from '../context/ProductsContext';

// Swiper styles
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/pagination';

/**
 * ProductsGrid Component
 * 
 * Architecture Decision:
 * - useMemo: Group products by category only when filteredProducts changes
 * - Swiper slidesPerView: 'auto' gives us precise control over card width
 * - Mobile-first: 160px cards = 2.5 visible on 375px screen (perfect scroll hint)
 * - Desktop: 200px cards = more visible, better use of space
 */
const ProductsGrid = ({ onAddToCart }) => {
  const { filteredProducts, loading, error } = useProducts();

  // Group products by category (memoized for performance)
  const groupedProducts = useMemo(() => {
    const groups = {};
    
    filteredProducts.forEach(product => {
      const category = product.category || 'أخرى';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(product);
    });

    return Object.entries(groups).map(([category, products]) => ({
      category,
      products
    }));
  }, [filteredProducts]);

  // Loading State
  if (loading) {
    return (
      <div className="space-y-8">
        {[1, 2].map(i => (
          <div key={i} className="space-y-4">
            <div className="h-8 w-32 bg-gray-200 rounded skeleton" />
            <div className="flex gap-4 overflow-hidden">
              {[1, 2, 3].map(j => (
                <div key={j} className="w-[160px] md:w-[200px] flex-shrink-0">
                  <div className="aspect-[3/4] bg-gray-200 rounded-2xl skeleton" />
                  <div className="mt-3 space-y-2">
                    <div className="h-4 bg-gray-200 rounded skeleton" />
                    <div className="h-6 w-20 bg-gray-200 rounded skeleton" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">😕</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          عذراً، حدث خطأ
        </h3>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  // Empty State
  if (filteredProducts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          لا توجد منتجات
        </h3>
        <p className="text-gray-600">
          جرب تغيير الفلاتر أو البحث بكلمات أخرى
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {groupedProducts.map(({ category, products }) => (
        <section key={category} className="space-y-4">
          {/* Category Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              {category}
            </h2>
            <span className="text-sm text-gray-500">
              {products.length} منتج
            </span>
          </div>

          {/* Products Swiper */}
          <Swiper
            modules={[FreeMode, Pagination]}
            spaceBetween={16}
            slidesPerView="auto" // 🔑 KEY: Let cards control their own width
            freeMode={{
              enabled: true,
              sticky: false,
              momentum: true,
              momentumRatio: 0.5
            }}
            pagination={{
              clickable: true,
              dynamicBullets: true
            }}
            className="!pb-10"
            dir="rtl"
          >
            {products.map(product => (
              <SwiperSlide
                key={product.id}
                className="!w-[160px] md:!w-[200px]" // 🔑 KEY: Fixed width for "2.5 cards" effect
              >
                <ProductCard
                  product={product}
                  onAddToCart={onAddToCart}
                />
              </SwiperSlide>
            ))}
          </Swiper>
        </section>
      ))}
    </div>
  );
};

export default ProductsGrid;
