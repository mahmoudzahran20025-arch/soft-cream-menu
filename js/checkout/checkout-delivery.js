// ================================================================
// CHECKOUT DELIVERY - FIXED VERSION (Option B Logic)
// Pickup: User selects branch (no distance calc)
// Delivery: System finds nearest branch automatically
// ================================================================

console.log('🔄 Loading checkout-delivery.js (Option B)');

import { api } from '../api.js';
import { calculateDistance, showToast } from '../utils.js';

export let branches = {};
let _isLoadingBranches = false;

// ================================================================
// Load Branches
// ================================================================
export async function loadBranches() {
  if (_isLoadingBranches) {
    console.log('⚠️ Branches already loading...');
    return;
  }
  
  console.log('🔄 Loading branches...');
  _isLoadingBranches = true;
  
  try {
    const branchesData = await api.getBranches();
    console.log('📤 Received branches:', branchesData);
    
    branches = {};
    
    if (Array.isArray(branchesData) && branchesData.length > 0) {
      branchesData.forEach(branch => {
        branches[branch.id] = {
          id: branch.id,
          name: { 
            ar: branch.name || branch.nameAr || `فرع ${branch.id}`, 
            en: branch.nameEn || branch.name || `Branch ${branch.id}` 
          },
          address: { 
            ar: branch.address || branch.addressAr || 'العنوان غير متوفر', 
            en: branch.addressEn || branch.address || 'Address not available' 
          },
          location: { 
            lat: parseFloat(branch.lat || branch.latitude || 30.0444), 
            lng: parseFloat(branch.lng || branch.longitude || 31.2357) 
          },
          phone: branch.phone || '',
          available: branch.available !== false
        };
      });
      
      console.log('✅ Branches processed:', Object.keys(branches).length);
    } else {
      throw new Error('No branches data');
    }
    
    renderBranchSelection();
    
  } catch (error) {
    console.error('❌ Failed to load branches:', error);
    
    // Fallback
    branches = {
      'main': {
        id: 'main',
        name: { ar: 'الفرع الرئيسي', en: 'Main Branch' },
        address: { ar: 'القاهرة، مصر', en: 'Cairo, Egypt' },
        location: { lat: 30.0444, lng: 31.2357 },
        phone: '+201234567890',
        available: true
      },
      'maadi': {
        id: 'maadi',
        name: { ar: 'فرع المعادي', en: 'Maadi Branch' },
        address: { ar: 'شارع 9، المعادي', en: '9 St, Maadi' },
        location: { lat: 29.9602, lng: 31.2494 },
        phone: '+201234567891',
        available: true
      },
      'zamalek': {
        id: 'zamalek',
        name: { ar: 'فرع الزمالك', en: 'Zamalek Branch' },
        address: { ar: 'الزمالك، القاهرة', en: 'Zamalek, Cairo' },
        location: { lat: 30.0626, lng: 31.2197 },
        phone: '+201234567892',
        available: true
      }
    };
    
    renderBranchSelection();
  } finally {
    _isLoadingBranches = false;
  }
}

// ================================================================
// ✅ Render Branch Selection (PICKUP ONLY - NO DISTANCES)
// ================================================================
export async function renderBranchSelection() {
  console.log('🔄 Rendering branches for PICKUP...');
  
  const branchSelection = document.getElementById('branchSelection');
  if (!branchSelection) return;
  
  const lang = window.currentLang || 'ar';
  let container = branchSelection.querySelector('.branches-grid') || 
                  branchSelection.querySelector('.branch-options');
  
  if (!container) {
    container = document.createElement('div');
    container.className = 'branches-grid';
    branchSelection.appendChild(container);
  }
  
  // ✅ NO distance calculation for pickup mode
  let html = '';
  const availableBranches = Object.keys(branches).filter(id => 
    branches[id].available !== false
  );
  
  if (availableBranches.length === 0) {
    html = `
      <div class="no-branches" style="text-align: center; padding: 20px; color: #666;">
        <i data-lucide="store-x" style="width: 48px; height: 48px;"></i>
        <p>${lang === 'ar' ? 'لا توجد فروع متاحة' : 'No branches available'}</p>
      </div>
    `;
  } else {
    availableBranches.forEach(branchId => {
      const branch = branches[branchId];
      
      html += `
        <div class="branch-card" data-branch="${branchId}" 
             onclick="checkoutModule.selectBranch('${branchId}')" 
             style="cursor: pointer; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; transition: all 0.2s; background: white;">
          <div class="branch-icon" style="margin-bottom: 8px; color: #2196F3;">
            <i data-lucide="store" style="width: 20px; height: 20px;"></i>
          </div>
          <div class="branch-info">
            <div class="branch-name" style="font-weight: 600; color: #333; margin-bottom: 4px;">
              ${branch.name[lang]}
            </div>
            <div class="branch-address" style="font-size: 12px; color: #666; line-height: 1.4;">
              ${branch.address[lang]}
            </div>
            ${branch.phone ? `
              <div class="branch-phone" style="display: flex; align-items: center; gap: 4px; font-size: 12px; color: #666; margin-top: 4px;">
                <i data-lucide="phone" style="width: 12px; height: 12px;"></i>
                <span>${branch.phone}</span>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    });
  }
  
  container.innerHTML = html;
  
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  
  console.log('✅ Branches rendered (pickup mode):', availableBranches.length);
}

// ================================================================
// ✅ Select Delivery Method (FIXED)
// ================================================================
export async function selectDeliveryMethod(method) {
  console.log('🔄 Selecting delivery method:', method);
  
  const lang = window.currentLang || 'ar';
  
  try {
    const { setDeliveryMethod, setBranch, setUserLocation, recalculatePrices } = await import('./checkout-core.js');
    setDeliveryMethod(method);
    
    document.querySelectorAll('.delivery-option').forEach(opt => 
      opt.classList.remove('selected')
    );
    
    const pickupOption = document.getElementById('pickupOption');
    const deliveryOption = document.getElementById('deliveryOption');
    const branchSelection = document.getElementById('branchSelection');
    const addressGroup = document.getElementById('addressGroup');
    const checkoutForm = document.getElementById('checkoutForm');
    
    if (method === 'pickup') {
      // ✅ PICKUP: Show branches, hide address
      if (pickupOption) pickupOption.classList.add('selected');
      if (branchSelection) {
        branchSelection.style.display = 'block';
        if (Object.keys(branches).length === 0) {
          await loadBranches();
        } else {
          renderBranchSelection();
        }
      }
      if (addressGroup) addressGroup.style.display = 'none';
      if (checkoutForm) checkoutForm.classList.remove('show');
      
      // ✅ Clear location (not needed for pickup)
      setUserLocation(null);
      setBranch(null);
      document.querySelectorAll('.branch-card').forEach(card => 
        card.classList.remove('selected')
      );
      
    } else if (method === 'delivery') {
      // ✅ DELIVERY: Hide branches, show address + location button
      if (deliveryOption) deliveryOption.classList.add('selected');
      if (branchSelection) branchSelection.style.display = 'none';
      if (addressGroup) addressGroup.style.display = 'block';
      if (checkoutForm) {
        checkoutForm.classList.add('show');
        setTimeout(() => {
          checkoutForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
      }
      
      // ✅ Clear branch (backend will auto-select nearest)
      setBranch(null);
      setUserLocation(null);
      document.querySelectorAll('.branch-card').forEach(card => 
        card.classList.remove('selected')
      );
    }
    
    await recalculatePrices();
    
    const { updateOrderSummary } = await import('./checkout-ui.js');
    updateOrderSummary();
    
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
    
    console.log('✅ Delivery method selected:', method);
    
  } catch (error) {
    console.error('❌ Failed to select delivery method:', error);
    showToast(
      lang === 'ar' ? 'خطأ' : 'Error',
      lang === 'ar' ? 'فشل في تحديد طريقة التوصيل' : 'Failed to select method',
      'error'
    );
  }
}

// ================================================================
// ✅ Select Branch (PICKUP ONLY)
// ================================================================
export async function selectBranch(branchId) {
  console.log('🔄 Selecting branch (pickup):', branchId);
  
  const lang = window.currentLang || 'ar';
  
  if (!branches[branchId]) {
    console.error('❌ Branch not found:', branchId);
    showToast(
      lang === 'ar' ? 'خطأ' : 'Error',
      lang === 'ar' ? 'الفرع غير موجود' : 'Branch not found',
      'error'
    );
    return;
  }
  
  try {
    const { 
      setBranch, 
      recalculatePrices, 
      getSelectedDeliveryMethod 
    } = await import('./checkout-core.js');
    
    const deliveryMethod = getSelectedDeliveryMethod();
    
    // ✅ Only allow manual selection in pickup mode
    if (deliveryMethod !== 'pickup') {
      console.warn('⚠️ Branch selection only allowed in pickup mode');
      showToast(
        lang === 'ar' ? 'تنبيه' : 'Warning',
        lang === 'ar' ? 'اختيار الفرع متاح فقط في وضع الاستلام' : 'Branch selection only in pickup mode',
        'warning'
      );
      return;
    }
    
    // ✅ Update state
    setBranch(branchId);
    
    // Update UI
    document.querySelectorAll('.branch-card').forEach(card => 
      card.classList.remove('selected')
    );
    
    const selectedCard = document.querySelector(`[data-branch="${branchId}"]`);
    if (selectedCard) {
      selectedCard.classList.add('selected');
      selectedCard.style.transform = 'scale(1.02)';
      setTimeout(() => {
        selectedCard.style.transform = '';
      }, 150);
    }
    
    // Show form
    const checkoutForm = document.getElementById('checkoutForm');
    if (checkoutForm) {
      checkoutForm.classList.add('show');
      setTimeout(() => {
        checkoutForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
    
    // Recalculate (should be 0 for pickup)
    await recalculatePrices();
    
    const { updateOrderSummary } = await import('./checkout-ui.js');
    updateOrderSummary();
    
    // Success
    const branch = branches[branchId];
    showToast(
      lang === 'ar' ? 'تم التحديد' : 'Selected',
      `${branch.name[lang]}`,
      'success'
    );
    
    console.log('✅ Branch selected (pickup):', branchId);
    
  } catch (error) {
    console.error('❌ Failed to select branch:', error);
    showToast(
      lang === 'ar' ? 'خطأ' : 'Error',
      lang === 'ar' ? 'فشل في تحديد الفرع' : 'Failed to select branch',
      'error'
    );
  }
}

// ================================================================
// Request Location (DELIVERY ONLY) - FIXED VERSION
// ================================================================
export function requestLocation() {
  console.log('🔄 Requesting location...');
  
  if (!navigator.geolocation) {
    const lang = window.currentLang || 'ar';
    showToast(
      lang === 'ar' ? 'خطأ' : 'Error',
      lang === 'ar' ? 'المتصفح لا يدعم تحديد الموقع' : 'Browser does not support geolocation',
      'error'
    );
    return;
  }
  
  // ✅ CRITICAL: Use proper z-index for Permission Modal
  const modal = document.getElementById('permissionModal');
  if (modal) {
    console.log('✅ Opening Permission Modal with z-index: 9300');
    
    // ✅ Force z-index (must be above Checkout Modal)
    modal.style.zIndex = '9300';
    
    // ✅ Show modal
    modal.classList.remove('hidden');
    modal.classList.add('show');
    modal.style.display = 'flex';
    
    // ✅ Prevent body scroll
    document.body.style.overflow = 'hidden';
    
    console.log('✅ Permission Modal opened successfully');
  } else {
    console.error('❌ Permission Modal not found in DOM');
  }
}

// ================================================================
// ✅ Allow Location (DELIVERY - Backend Auto-Selects Branch)
// ================================================================
export async function allowLocation() {
  console.log('🔄 Getting user location for DELIVERY...');
  
  const locationBtn = document.getElementById('locationBtn');
  const lang = window.currentLang || 'ar';
  
  if (locationBtn) {
    locationBtn.disabled = true;
    locationBtn.innerHTML = `
      <i data-lucide="loader" style="animation: spin 1s linear infinite;"></i>
      <span>${lang === 'ar' ? 'جاري التحديد...' : 'Getting location...'}</span>
    `;
    
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }
  
  const options = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 300000
  };
  
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      console.log('✅ GPS Location obtained:', position.coords);
      
      try {
        const { setUserLocation, recalculatePrices, getSelectedDeliveryMethod } = await import('./checkout-core.js');
        
        const deliveryMethod = getSelectedDeliveryMethod();
        
        // ✅ Only use location in delivery mode
        if (deliveryMethod !== 'delivery') {
          console.warn('⚠️ Location only needed for delivery mode');
          resetLocationButton();
          closePermissionModal();
          return;
        }
        
        // ✅ Save user location
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        };
        
        console.log('📍 Setting user location (delivery):', location);
        setUserLocation(location);
        
        // Update button
        if (locationBtn) {
          locationBtn.classList.add('active');
          locationBtn.disabled = false;
          locationBtn.innerHTML = `
            <i data-lucide="check-circle" style="color: #4caf50;"></i>
            <span style="color: #4caf50;">${lang === 'ar' ? 'تم تحديد الموقع ✓' : 'Location Set ✓'}</span>
          `;
        }
        
        // Fill address
        const addressField = document.getElementById('customerAddress');
        if (addressField) {
          const coords = `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`;
          const accuracy = Math.round(position.coords.accuracy);
          
          addressField.value = lang === 'ar'
            ? `الموقع الحالي (${coords}) - الدقة: ${accuracy}م`
            : `Current location (${coords}) - Accuracy: ${accuracy}m`;
        }
        
        closePermissionModal();
        
        // ✅ Recalculate prices - backend will auto-select nearest branch
        await recalculatePrices();
        
        showToast(
          lang === 'ar' ? 'تم بنجاح!' : 'Success!',
          lang === 'ar' ? 'تم تحديد موقعك - سيتم اختيار أقرب فرع تلقائياً' : 'Location set - nearest branch will be selected',
          'success'
        );
        
      } catch (error) {
        console.error('❌ Error processing location:', error);
        resetLocationButton();
      }
      
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    },
    (error) => {
      console.error('❌ GPS error:', error);
      
      const lang = window.currentLang || 'ar';
      let errorMessage = '';
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = lang === 'ar' ? 'تم رفض إذن الموقع' : 'Permission denied';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = lang === 'ar' ? 'الموقع غير متاح' : 'Unavailable';
          break;
        case error.TIMEOUT:
          errorMessage = lang === 'ar' ? 'انتهت المهلة' : 'Timeout';
          break;
        default:
          errorMessage = lang === 'ar' ? 'خطأ في الموقع' : 'Location error';
      }
      
      showToast(lang === 'ar' ? 'خطأ' : 'Error', errorMessage, 'error');
      
      resetLocationButton();
      closePermissionModal();
    },
    options
  );
}

function resetLocationButton() {
  const btn = document.getElementById('locationBtn');
  const lang = window.currentLang || 'ar';
  
  if (btn) {
    btn.disabled = false;
    btn.classList.remove('active');
    btn.innerHTML = `
      <i data-lucide="navigation"></i>
      <span>${lang === 'ar' ? 'استخدام الموقع الحالي' : 'Use Current Location'}</span>
    `;
    
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }
}

export function closePermissionModal() {
  const modal = document.getElementById('permissionModal');
  if (modal) {
    modal.classList.remove('show');
    modal.classList.add('hidden');
    modal.style.display = 'none';
  }
}

// ================================================================
// Utility Functions
// ================================================================
export function getBranches() {
  return branches;
}

export function getBranch(branchId) {
  return branches[branchId] || null;
}

export function isLoadingBranches() {
  return _isLoadingBranches;
}

export function resetDeliveryState() {
  console.log('🔄 Resetting delivery state...');
  
  document.querySelectorAll('.delivery-option').forEach(opt => 
    opt.classList.remove('selected')
  );
  
  document.querySelectorAll('.branch-card').forEach(card => 
    card.classList.remove('selected')
  );
  
  const branchSelection = document.getElementById('branchSelection');
  if (branchSelection) branchSelection.style.display = 'none';
  
  const addressGroup = document.getElementById('addressGroup');
  if (addressGroup) addressGroup.style.display = 'none';
  
  const checkoutForm = document.getElementById('checkoutForm');
  if (checkoutForm) checkoutForm.classList.remove('show');
  
  resetLocationButton();
  
  console.log('✅ Delivery state reset');
}

console.log('✅ checkout-delivery.js loaded (Option B Logic)');





// ================================================================
// Add pulse animation for location button
// ================================================================
const style = document.createElement('style');
style.textContent = `
  @keyframes pulse {
    0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(33, 150, 243, 0.7); }
    50% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(33, 150, 243, 0); }
  }
`;
document.head.appendChild(style);
