import React, { useState, useCallback } from 'react';
import { Search, Filter, X, Brain, Activity, Zap, IceCream, Apple, Star, Crown, Heart, Grid } from 'lucide-react';
import { useProducts } from '../context/ProductsContext';

const CATEGORIES = [
  { value: null, label: 'الكل', icon: Grid },
  { value: 'كلاسيك', label: 'كلاسيك', icon: IceCream },
  { value: 'فواكه', label: 'فواكه', icon: Apple },
  { value: 'مميز', label: 'مميز', icon: Star },
  { value: 'فاخر', label: 'فاخر', icon: Crown },
  { value: 'صحي', label: 'صحي', icon: Heart }
];

const ENERGY_TYPES = [
  { value: null, label: 'كل الأنواع', icon: null },
  { value: 'mental', label: 'ذهنية', icon: Brain, color: 'purple' },
  { value: 'physical', label: 'بدنية', icon: Activity, color: 'orange' },
  { value: 'balanced', label: 'متوازنة', icon: Zap, color: 'green' }
];

const CALORIE_RANGES = [
  { value: null, label: 'كل السعرات', min: null, max: null },
  { value: 'low', label: '< 200 سعرة', min: 0, max: 200 },
  { value: 'medium', label: '200-300 سعرة', min: 200, max: 300 },
  { value: 'high', label: '> 300 سعرة', min: 300, max: 9999 }
];

/**
 * FilterBar Component
 * 
 * Features:
 * - Real-time search with debounce
 * - Category, Energy Type, and Calorie filters
 * - Mobile-responsive with collapsible advanced filters
 * - Active filter count badge
 */
const FilterBar = () => {
  const { applyFilters, filters } = useProducts();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [localFilters, setLocalFilters] = useState({
    category: null,
    energyType: null,
    calorieRange: null
  });

  // Count active filters
  const activeFilterCount = [
    localFilters.category,
    localFilters.energyType,
    localFilters.calorieRange
  ].filter(Boolean).length;

  // Handle search with debounce
  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    
    // Simple debounce
    const timeoutId = setTimeout(() => {
      applyFilters({
        ...localFilters,
        searchQuery: query,
        minCalories: getCalorieRange(localFilters.calorieRange).min,
        maxCalories: getCalorieRange(localFilters.calorieRange).max
      });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [localFilters, applyFilters]);

  // Get calorie range values
  const getCalorieRange = (rangeValue) => {
    const range = CALORIE_RANGES.find(r => r.value === rangeValue);
    return { min: range?.min, max: range?.max };
  };

  // Handle filter change
  const handleFilterChange = (filterType, value) => {
    const newFilters = {
      ...localFilters,
      [filterType]: value
    };
    setLocalFilters(newFilters);

    const calorieRange = getCalorieRange(newFilters.calorieRange);
    
    applyFilters({
      category: newFilters.category,
      energyType: newFilters.energyType,
      minCalories: calorieRange.min,
      maxCalories: calorieRange.max,
      searchQuery
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setLocalFilters({
      category: null,
      energyType: null,
      calorieRange: null
    });
    setSearchQuery('');
    applyFilters({
      category: null,
      energyType: null,
      minCalories: null,
      maxCalories: null,
      searchQuery: ''
    });
  };

  return (
    <div className="bg-white border-b border-gray-200 sticky top-[72px] z-30 shadow-sm">
      <div className="container mx-auto px-4 py-4 space-y-4">
        {/* Search Bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="ابحث عن منتجك المفضل..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="
                w-full pr-10 pl-4 py-3 
                border-2 border-gray-200 rounded-xl
                focus:border-primary-500 focus:outline-none
                transition-colors
              "
            />
            {searchQuery && (
              <button
                onClick={() => handleSearch('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Advanced Filter Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`
              relative px-4 py-3 rounded-xl border-2 transition-all
              ${showAdvanced 
                ? 'bg-primary-500 text-white border-primary-500' 
                : 'bg-white text-gray-700 border-gray-200 hover:border-primary-500'
              }
            `}
          >
            <Filter className="w-5 h-5" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="space-y-4 animate-slide-up">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                الفئة
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.value || 'all'}
                      onClick={() => handleFilterChange('category', cat.value)}
                      className={`
                        flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                        ${localFilters.category === cat.value
                          ? 'bg-primary-500 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }
                      `}
                    >
                      {Icon && <Icon className="w-4 h-4" />}
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Energy Type Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                نوع الطاقة
              </label>
              <div className="flex flex-wrap gap-2">
                {ENERGY_TYPES.map(type => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value || 'all'}
                      onClick={() => handleFilterChange('energyType', type.value)}
                      className={`
                        flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                        ${localFilters.energyType === type.value
                          ? `bg-${type.color}-500 text-white shadow-md`
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }
                      `}
                    >
                      {Icon && <Icon className="w-4 h-4" />}
                      {type.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Calorie Range Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                السعرات الحرارية
              </label>
              <div className="flex flex-wrap gap-2">
                {CALORIE_RANGES.map(range => (
                  <button
                    key={range.value || 'all'}
                    onClick={() => handleFilterChange('calorieRange', range.value)}
                    className={`
                      px-4 py-2 rounded-lg text-sm font-medium transition-all
                      ${localFilters.calorieRange === range.value
                        ? 'bg-primary-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }
                    `}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Clear Filters Button */}
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="w-full py-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
              >
                مسح جميع الفلاتر
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterBar;
