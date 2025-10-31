import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

// Import API from parent directory
const API_BASE_URL = 'https://softcream-api.mahmoud-zahran20025.workers.dev';

const ProductsContext = createContext();

export const useProducts = () => {
  const context = useContext(ProductsContext);
  if (!context) {
    throw new Error('useProducts must be used within ProductsProvider');
  }
  return context;
};

export const ProductsProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    category: null,
    energyType: null,
    minCalories: null,
    maxCalories: null,
    searchQuery: ''
  });
  
  // ✅ المرحلة 3: إضافة State للغة
  const [currentLang, setCurrentLang] = useState(() => {
    // الحصول على اللغة من i18n أو window أو default
    if (typeof window !== 'undefined') {
      return window.i18n?.getLang?.() || document.documentElement.lang || 'ar';
    }
    return 'ar';
  });

  // Fetch products
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Fetching products from:', `${API_BASE_URL}?path=/products`);
      const response = await fetch(`${API_BASE_URL}?path=/products`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('📦 API Response:', result);
      
      // Validate that result.data is an array
      if (result.success && Array.isArray(result.data)) {
        setProducts(result.data);
        setFilteredProducts(result.data);
        console.log('✅ Products loaded:', result.data.length);
      } else {
        console.warn('⚠️ Invalid API response format:', result);
        setProducts([]);
        setFilteredProducts([]);
        setError('تنسيق البيانات غير صحيح');
      }
    } catch (err) {
      console.error('❌ Failed to fetch products:', err);
      setError('فشل تحميل المنتجات. يرجى المحاولة مرة أخرى.');
      setProducts([]);
      setFilteredProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Discover products with filters
  const discoverProducts = useCallback(async (filterParams) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      Object.entries(filterParams).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          params.append(key, value);
        }
      });
      
      const response = await fetch(`${API_BASE_URL}?path=/products/discover&${params}`);
      const result = await response.json();
      
      if (result.data?.products) {
        setFilteredProducts(result.data.products);
      }
    } catch (err) {
      console.error('Failed to discover products:', err);
      setError('فشل البحث عن المنتجات.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Search products
  const searchProducts = useCallback(async (query) => {
    if (!query || query.trim().length === 0) {
      setFilteredProducts(products);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}?path=/products/search&q=${encodeURIComponent(query)}`);
      const result = await response.json();
      
      if (result.data) {
        setFilteredProducts(result.data);
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  }, [products]);

  // Get recommendations
  const getRecommendations = useCallback(async (productId, limit = 5) => {
    try {
      const response = await fetch(`${API_BASE_URL}?path=/products/recommendations/${productId}&limit=${limit}`);
      const result = await response.json();
      return result.data || [];
    } catch (err) {
      console.error('Failed to get recommendations:', err);
      return [];
    }
  }, []);

  // Apply filters
  const applyFilters = useCallback((newFilters) => {
    setFilters(newFilters);
    
    // If search query exists, use search
    if (newFilters.searchQuery) {
      searchProducts(newFilters.searchQuery);
      return;
    }
    
    // Otherwise use discovery with filters
    const filterParams = {};
    if (newFilters.category) filterParams.category = newFilters.category;
    if (newFilters.energyType) filterParams.energyType = newFilters.energyType;
    if (newFilters.minCalories) filterParams.minCalories = newFilters.minCalories;
    if (newFilters.maxCalories) filterParams.maxCalories = newFilters.maxCalories;
    
    if (Object.keys(filterParams).length > 0) {
      discoverProducts(filterParams);
    } else {
      setFilteredProducts(products);
    }
  }, [products, searchProducts, discoverProducts]);

  // Open product modal
  const openProduct = useCallback((product) => {
    setSelectedProduct(product);
  }, []);

  // Close product modal
  const closeProduct = useCallback(() => {
    setSelectedProduct(null);
  }, []);

  // Initial load
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);
  
  // ✅ الاستماع لتغيير اللغة من i18n
  useEffect(() => {
    if (typeof window === 'undefined' || !window.i18n) return;
    
    const unsubscribe = window.i18n.on('change', (newLang) => {
      console.log(`🔄 [React] Language changed to: ${newLang}`);
      setCurrentLang(newLang);
    });
    
    console.log('✅ [React] Subscribed to i18n language change events');
    
    // تنظيف الاشتراك عند إغلاق التطبيق
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);
  
  // ✅ دالة الترجمة (مع useMemo للأداء)
  const t = useMemo(() => {
    return (key, params) => {
      if (typeof window !== 'undefined' && window.i18n) {
        return window.i18n.t(key, params);
      }
      return key; // fallback
    };
  }, [currentLang]);

  const value = {
    products,
    filteredProducts,
    selectedProduct,
    loading,
    error,
    filters,
    currentLang, // ✅ تمرير اللغة الحالية
    t, // ✅ تمرير دالة الترجمة
    fetchProducts,
    discoverProducts,
    searchProducts,
    getRecommendations,
    applyFilters,
    openProduct,
    closeProduct
  };

  return (
    <ProductsContext.Provider value={value}>
      {children}
    </ProductsContext.Provider>
  );
};
