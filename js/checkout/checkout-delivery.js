// ================================================================
// CHECKOUT DELIVERY - التوصيل والفروع (FIXED VERSION)
// ================================================================

console.log('🔄 Loading checkout-delivery.js');

// ================================================================
// Static Imports
// ================================================================
import { api } from '../api.js';
import { calculateDistance, showToast } from '../utils.js';

// ================================================================
// State Management
// ================================================================
export let branches = {};
let _isLoadingBranches = false;

// ================================================================
// ✅ FIX 1: Enhanced loadBranches with Better Error Handling
// ================================================================
export async function loadBranches() {
  if (_isLoadingBranches) {
    console.log('⚠️ Branches already loading, waiting...');
    return;
  }
  
  console.log('🔄 Loading branches...');
  _isLoadingBranches = true;
  
  try {
    const branchesData = await api.getBranches();
    console.log('📤 Received branches data:', branchesData);
    
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
          available: branch.available !== false // Default to true if not specified
        };
      });
      
      console.log('✅ Branches processed:', Object.keys(branches).length);
    } else {
      throw new Error('No branches data received or empty array');
    }
    
    // Render branches after loading
    renderBranchSelection();
    
  } catch (error) {
    console.error('❌ Failed to load branches from API:', error);
    
    // Fallback branches
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
    
    console.log('⚠️ Using fallback branches:', Object.keys(branches).length);
    renderBranchSelection();
  } finally {
    _isLoadingBranches = false;
  }
}

// ================================================================
// ✅ FIX 2: Enhanced renderBranchSelection
// ================================================================
export async function renderBranchSelection() {
  console.log('🔄 Rendering branch selection...');
  
  const branchSelection = document.getElementById('branchSelection');
  if (!branchSelection) {
    console.warn('⚠️ Branch selection element not found');
    return;
  }
  
  const lang = window.currentLang || 'ar';
  let container = branchSelection.querySelector('.branches-grid');
  
  if (!container) {
    container = branchSelection.querySelector('.branch-options');
  }
  
  if (!container) {
    console.warn('⚠️ Branch container not found, creating one...');
    container = document.createElement('div');
    container.className = 'branches-grid';
    branchSelection.appendChild(container);
  }
  
  // Get user location for distance calculation
  let currentLocation = null;
  try {
    const { getUserLocation } = await import('./checkout-core.js');
    currentLocation = getUserLocation();
  } catch (err) {
    console.warn('⚠️ Could not get user location:', err);
  }
  
  let html = '';
  
  const availableBranches = Object.keys(branches).filter(branchId => {
    const branch = branches[branchId];
    return branch.available !== false;
  });
  
  if (availableBranches.length === 0) {
    html = `
      <div class="no-branches" style="text-align: center; padding: 20px; color: #666;">
        <i data-lucide="store-x" style="width: 48px; height: 48px; margin-bottom: 16px;"></i>
        <p>${lang === 'ar' ? 'لا توجد فروع متاحة حالياً' : 'No branches available currently'}</p>
      </div>
    `;
  } else {
    availableBranches.forEach(branchId => {
      const branch = branches[branchId];
      
      let distanceHtml = '';
      if (currentLocation && branch.location) {
        try {
          const distance = calculateDistance(
            currentLocation.lat,
            currentLocation.lng,
            branch.location.lat,
            branch.location.lng
          );
          
          distanceHtml = `
            <div class="branch-distance" style="display: flex; align-items: center; gap: 4px; font-size: 12px; color: #666; margin-top: 4px;">
              <i data-lucide="navigation" style="width: 12px; height: 12px;"></i>
              <span>${distance.toFixed(1)} ${lang === 'ar' ? 'كم' : 'km'}</span>
            </div>
          `;
        } catch (err) {
          console.warn('⚠️ Error calculating distance for branch:', branchId, err);
        }
      }
      
      html += `
        <div class="branch-card" data-branch="${branchId}" onclick="checkoutModule.selectBranch('${branchId}')" style="cursor: pointer; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; transition: all 0.2s ease; background: white;">
          <div class="branch-icon" style="margin-bottom: 8px; color: #2196F3;">
            <i data-lucide="store" style="width: 20px; height: 20px;"></i>
          </div>
          <div class="branch-info">
            <div class="branch-name" style="font-weight: 600; color: #333; margin-bottom: 4px;">${branch.name[lang]}</div>
            <div class="branch-address" style="font-size: 12px; color: #666; line-height: 1.4;">${branch.address[lang]}</div>
            ${distanceHtml}
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
  
  // Add CSS for hover and selected states
  const style = document.createElement('style');
  style.textContent = `
    .branch-card:hover {
      border-color: #2196F3 !important;
      box-shadow: 0 2px 8px rgba(33, 150, 243, 0.15) !important;
    }
    .branch-card.selected {
      border-color: #2196F3 !important;
      background: #f0f7ff !important;
      box-shadow: 0 2px 8px rgba(33, 150, 243, 0.2) !important;
    }
    .branch-card.selected .branch-icon {
      color: #1976D2 !important;
    }
  `;
  
  if (!document.getElementById('branch-card-styles')) {
    style.id = 'branch-card-styles';
    document.head.appendChild(style);
  }
  
  // Refresh icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  
  console.log('✅ Branch selection rendered with', availableBranches.length, 'branches');
}

// ================================================================
// ✅ FIX 3: Enhanced selectDeliveryMethod with Better State Management
// ================================================================
export async function selectDeliveryMethod(method) {
  console.log('🔄 Selecting delivery method:', method);
  
  const lang = window.currentLang || 'ar';
  
  try {
    // Update core state
    const { setDeliveryMethod, setBranch, recalculatePrices } = await import('./checkout-core.js');
    setDeliveryMethod(method);
    
    // Update UI selections
    document.querySelectorAll('.delivery-option').forEach(option => {
      option.classList.remove('selected');
    });
    
    const pickupOption = document.getElementById('pickupOption');
    const deliveryOption = document.getElementById('deliveryOption');
    const branchSelection = document.getElementById('branchSelection');
    const addressGroup = document.getElementById('addressGroup');
    const checkoutForm = document.getElementById('checkoutForm');
    
    if (method === 'pickup') {
      console.log('🔄 Setting up pickup method...');
      
      // Select pickup option
      if (pickupOption) pickupOption.classList.add('selected');
      
      // Show branch selection
      if (branchSelection) {
        branchSelection.style.display = 'block';
        
        // Ensure branches are rendered
        if (Object.keys(branches).length === 0) {
          await loadBranches();
        } else {
          renderBranchSelection();
        }
      }
      
      // Hide address group
      if (addressGroup) addressGroup.style.display = 'none';
      
      // Hide checkout form until branch is selected
      if (checkoutForm) {
        checkoutForm.classList.remove('show');
      }
      
      // Clear selected branch
      setBranch(null);
      document.querySelectorAll('.branch-card').forEach(card => {
        card.classList.remove('selected');
      });
      
    } else if (method === 'delivery') {
      console.log('🔄 Setting up delivery method...');
      
      // Select delivery option
      if (deliveryOption) deliveryOption.classList.add('selected');
      
      // Hide branch selection
      if (branchSelection) branchSelection.style.display = 'none';
      
      // Show address group
      if (addressGroup) addressGroup.style.display = 'block';
      
      // Show checkout form
      if (checkoutForm) {
        checkoutForm.classList.add('show');
        
        // Scroll to form after a brief delay
        setTimeout(() => {
          checkoutForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
      }
      
      // Clear selected branch
      setBranch(null);
      document.querySelectorAll('.branch-card').forEach(card => {
        card.classList.remove('selected');
      });
    }
    
    // Recalculate prices
    await recalculatePrices();
    
    // Update order summary
    const { updateOrderSummary } = await import('./checkout-ui.js');
    updateOrderSummary();
    
    // Refresh icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
    
    console.log('✅ Delivery method selected:', method);
    
  } catch (error) {
    console.error('❌ Failed to select delivery method:', error);
    showToast(
      lang === 'ar' ? 'خطأ' : 'Error',
      lang === 'ar' ? 'فشل في تحديد طريقة التوصيل' : 'Failed to select delivery method',
      'error'
    );
  }
}

// ================================================================
// ✅ FIX 4: Enhanced selectBranch with Better UX
// ================================================================
export async function selectBranch(branchId) {
  console.log('🔄 Selecting branch:', branchId);
  
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
    // Update core state
    const { setBranch, recalculatePrices } = await import('./checkout-core.js');
    setBranch(branchId);
    
    // Update UI selections
    document.querySelectorAll('.branch-card').forEach(card => {
      card.classList.remove('selected');
    });
    
    const selectedCard = document.querySelector(`[data-branch="${branchId}"]`);
    if (selectedCard) {
      selectedCard.classList.add('selected');
      
      // Brief highlight effect
      selectedCard.style.transform = 'scale(1.02)';
      setTimeout(() => {
        selectedCard.style.transform = '';
      }, 150);
    }
    
    // Show checkout form
    const checkoutForm = document.getElementById('checkoutForm');
    if (checkoutForm) {
      checkoutForm.classList.add('show');
      
      // Smooth scroll to form
      setTimeout(() => {
        checkoutForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
    
    // Recalculate prices
    await recalculatePrices();
    
    // Update order summary
    const { updateOrderSummary } = await import('./checkout-ui.js');
    updateOrderSummary();
    
    // Show success feedback
    const branch = branches[branchId];
    showToast(
      lang === 'ar' ? 'تم التحديد' : 'Selected',
      `${branch.name[lang]} - ${branch.address[lang]}`,
      'success'
    );
    
    console.log('✅ Branch selected:', branchId, branch.name[lang]);
    
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
// ✅ FIX 5: Enhanced Location Functions
// ================================================================
export function requestLocation() {
  console.log('🔄 Requesting location permission...');
  
  if (!navigator.geolocation) {
    const lang = window.currentLang || 'ar';
    showToast(
      lang === 'ar' ? 'خطأ' : 'Error',
      lang === 'ar' ? 'المتصفح لا يدعم تحديد الموقع' : 'Browser does not support geolocation',
      'error'
    );
    return;
  }
  
  const permissionModal = document.getElementById('permissionModal');
  if (permissionModal) {
    permissionModal.classList.remove('hidden');
    permissionModal.classList.add('show'); 
    permissionModal.style.display = 'flex';
    console.log('✅ Permission modal shown');
  }
}

export async function allowLocation() {
  console.log('🔄 Getting user location...');
  
  const locationBtn = document.getElementById('locationBtn');
  const lang = window.currentLang || 'ar';
  
  // Update button to loading state
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
    maximumAge: 300000 // 5 minutes
  };
  
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      console.log('✅ Location obtained:', position.coords);
      
      try {
        // Update core state
        const { setUserLocation, recalculatePrices } = await import('./checkout-core.js');
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        };
        
        setUserLocation(location);
        
        // Update button to success state
        if (locationBtn) {
          locationBtn.classList.add('active');
          locationBtn.disabled = false;
          locationBtn.innerHTML = `
            <i data-lucide="check-circle" style="color: #4caf50;"></i>
            <span style="color: #4caf50;">${lang === 'ar' ? 'تم تحديد الموقع ✓' : 'Location Set ✓'}</span>
          `;
        }
        
        // Fill address field with coordinates
        const addressField = document.getElementById('customerAddress');
        if (addressField) {
          const coords = `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`;
          const accuracyText = lang === 'ar' ? `الدقة: ${Math.round(position.coords.accuracy)}م` : `Accuracy: ${Math.round(position.coords.accuracy)}m`;
          
          addressField.value = lang === 'ar' 
            ? `الموقع الحالي (${coords}) - ${accuracyText}`
            : `Current location (${coords}) - ${accuracyText}`;
        }
        
        // Close permission modal
        closePermissionModal();
        
        // Update branch distances
        updateBranchDistances(location);
        
        // Recalculate prices if delivery method is selected
        await recalculatePrices();
        
        showToast(
          lang === 'ar' ? 'تم بنجاح!' : 'Success!',
          lang === 'ar' ? 'تم تحديد موقعك بنجاح' : 'Location obtained successfully',
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
      console.error('❌ Location error:', error);
      
      let errorMessage = '';
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = lang === 'ar' ? 'تم رفض إذن الموقع' : 'Location permission denied';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = lang === 'ar' ? 'الموقع غير متاح' : 'Location unavailable';
          break;
        case error.TIMEOUT:
          errorMessage = lang === 'ar' ? 'انتهت مهلة تحديد الموقع' : 'Location request timeout';
          break;
        default:
          errorMessage = lang === 'ar' ? 'خطأ في تحديد الموقع' : 'Location error';
          break;
      }
      
      showToast(
        lang === 'ar' ? 'خطأ' : 'Error',
        errorMessage,
        'error'
      );
      
      resetLocationButton();
      closePermissionModal();
    },
    options
  );
}

function resetLocationButton() {
  const locationBtn = document.getElementById('locationBtn');
  const lang = window.currentLang || 'ar';
  
  if (locationBtn) {
    locationBtn.disabled = false;
    locationBtn.classList.remove('active');
    locationBtn.innerHTML = `
      <i data-lucide="navigation"></i>
      <span>${lang === 'ar' ? 'استخدام الموقع الحالي' : 'Use Current Location'}</span>
    `;
    
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }
}

function closePermissionModal() {
  const modal = document.getElementById('permissionModal');
  if (modal) {
    modal.classList.remove('show');
    modal.classList.add('hidden');
    modal.style.display = 'none';
  }
}

function updateBranchDistances(userLocation) {
  console.log('🔄 Updating branch distances...');
  
  if (!userLocation || Object.keys(branches).length === 0) {
    return;
  }
  
  const lang = window.currentLang || 'ar';
  
  Object.keys(branches).forEach(branchId => {
    const branch = branches[branchId];
    
    if (!branch.location) return;
    
    try {
      const distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        branch.location.lat,
        branch.location.lng
      );
      
      // Update existing distance display
      const branchCard = document.querySelector(`[data-branch="${branchId}"]`);
      if (branchCard) {
        let distanceEl = branchCard.querySelector('.branch-distance');
        
        if (!distanceEl) {
          // Create distance element if it doesn't exist
          distanceEl = document.createElement('div');
          distanceEl.className = 'branch-distance';
          distanceEl.style.cssText = 'display: flex; align-items: center; gap: 4px; font-size: 12px; color: #666; margin-top: 4px;';
          
          const branchInfo = branchCard.querySelector('.branch-info');
          if (branchInfo) {
            branchInfo.appendChild(distanceEl);
          }
        }
        
        distanceEl.innerHTML = `
          <i data-lucide="navigation" style="width: 12px; height: 12px;"></i>
          <span>${distance.toFixed(1)} ${lang === 'ar' ? 'كم' : 'km'}</span>
        `;
      }
      
    } catch (err) {
      console.warn('⚠️ Error updating distance for branch:', branchId, err);
    }
  });
  
  // Refresh icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  
  console.log('✅ Branch distances updated');
}

// ================================================================
// ✅ FIX 6: Utility Functions
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

// ================================================================
// ✅ FIX 7: Cleanup Function
// ================================================================
export function resetDeliveryState() {
  console.log('🔄 Resetting delivery state...');
  
  // Clear branch selection UI
  document.querySelectorAll('.delivery-option').forEach(option => {
    option.classList.remove('selected');
  });
  
  document.querySelectorAll('.branch-card').forEach(card => {
    card.classList.remove('selected');
  });
  
  // Hide UI elements
  const branchSelection = document.getElementById('branchSelection');
  if (branchSelection) branchSelection.style.display = 'none';
  
  const addressGroup = document.getElementById('addressGroup');
  if (addressGroup) addressGroup.style.display = 'none';
  
  const checkoutForm = document.getElementById('checkoutForm');
  if (checkoutForm) checkoutForm.classList.remove('show');
  
  // Reset location button
  resetLocationButton();
  
  console.log('✅ Delivery state reset');
}

console.log('✅ checkout-delivery.js loaded successfully');