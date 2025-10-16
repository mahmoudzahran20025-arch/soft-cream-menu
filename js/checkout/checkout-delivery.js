// ================================================================
// CHECKOUT DELIVERY - التوصيل والفروع (FIXED - Minimal Changes)
// ================================================================

import { api } from '../api.js';
import { calculateDistance, showToast } from '../utils.js';
import { 
  setDeliveryMethod, 
  setBranch, 
  setUserLocation, 
  recalculatePrices,
  getUserLocation  // ✅ FIX: استخدام getter بدل المتغير المباشر
} from './checkout-core.js';

export let branches = {};

// ================================================================
// تحميل الفروع
// ================================================================
export async function loadBranches() {
  try {
    const branchesData = await api.getBranches();
    
    branches = {};
    branchesData.forEach(branch => {
      branches[branch.id] = {
        name: { ar: branch.name, en: branch.nameEn },
        address: { ar: branch.address, en: branch.address },
        location: { lat: branch.lat, lng: branch.lng },
        phone: branch.phone,
        available: branch.available
      };
    });
    
    console.log('✅ Branches loaded:', Object.keys(branches).length);
    renderBranchSelection();
    
  } catch (error) {
    console.error('❌ Failed to load branches:', error);
    
    // Fallback
    branches = {
      maadi: {
        name: { ar: 'المعادي', en: 'Maadi' },
        address: { ar: 'شارع 9، المعادي', en: '9 St, Maadi' },
        location: { lat: 29.9602, lng: 31.2494 }
      }
    };
  }
}

// ================================================================
// عرض الفروع
// ================================================================
export function renderBranchSelection() {
  const branchSelection = document.getElementById('branchSelection');
  if (!branchSelection) return;
  
  const lang = window.currentLang || 'ar';
  const container = branchSelection.querySelector('.branches-grid') || 
                    branchSelection.querySelector('.branch-options');
  
  if (!container) return;
  
  // ✅ FIX: استخدام getUserLocation() بدل userLocation
  const currentLocation = getUserLocation();
  
  let html = '';
  
  Object.keys(branches).forEach(branchId => {
    const branch = branches[branchId];
    if (!branch.available && branch.available !== undefined) return;
    
    html += `
      <div class="branch-card" data-branch="${branchId}" onclick="checkoutModule.selectBranch('${branchId}')">
        <div class="branch-icon">
          <i data-lucide="store"></i>
        </div>
        <div class="branch-info">
          <div class="branch-name">${branch.name[lang]}</div>
          <div class="branch-address">${branch.address[lang]}</div>
          ${currentLocation ? `
            <div class="branch-distance" id="branch-${branchId}-distance">
              <i data-lucide="navigation"></i>
              <span>-- ${lang === 'ar' ? 'كم' : 'km'}</span>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
  
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// ================================================================
// اختيار طريقة التوصيل
// ================================================================
export function selectDeliveryMethod(method) {
  setDeliveryMethod(method);
  
  const lang = window.currentLang || 'ar';
  
  document.querySelectorAll('.delivery-option').forEach(option => {
    option.classList.remove('selected');
  });
  
  const pickupOption = document.getElementById('pickupOption');
  const deliveryOption = document.getElementById('deliveryOption');
  const branchSelection = document.getElementById('branchSelection');
  const addressGroup = document.getElementById('addressGroup');
  const checkoutForm = document.getElementById('checkoutForm');
  
  if (method === 'pickup') {
    if (pickupOption) pickupOption.classList.add('selected');
    if (branchSelection) branchSelection.style.display = 'block';
    if (addressGroup) addressGroup.style.display = 'none';
    
    if (checkoutForm) {
      checkoutForm.classList.remove('show');
    }
  } else {
    if (deliveryOption) deliveryOption.classList.add('selected');
    if (branchSelection) branchSelection.style.display = 'none';
    if (addressGroup) addressGroup.style.display = 'block';
    if (checkoutForm) checkoutForm.classList.add('show');
    
    setBranch(null);
    document.querySelectorAll('.branch-card').forEach(card => {
      card.classList.remove('selected');
    });
  }
  
  recalculatePrices();
  
  // تحديث الواجهة
  import('./checkout-ui.js').then(({ updateOrderSummary }) => {
    updateOrderSummary();
  });
  
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// ================================================================
// اختيار الفرع
// ================================================================
export function selectBranch(branchId) {
  setBranch(branchId);
  
  document.querySelectorAll('.branch-card').forEach(card => {
    card.classList.remove('selected');
  });
  
  const selectedCard = document.querySelector(`[data-branch="${branchId}"]`);
  if (selectedCard) {
    selectedCard.classList.add('selected');
  }
  
  const checkoutForm = document.getElementById('checkoutForm');
  if (checkoutForm) {
    checkoutForm.classList.add('show');
    
    setTimeout(() => {
      checkoutForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  }
  
  // تحديث الواجهة
  import('./checkout-ui.js').then(({ updateOrderSummary }) => {
    updateOrderSummary();
  });
  
  recalculatePrices();
}

// ================================================================
// طلب الموقع
// ================================================================
export function requestLocation() {
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
    permissionModal.classList.add('show');
  }
}

export function allowLocation() {
  const locationBtn = document.getElementById('locationBtn');
  const lang = window.currentLang || 'ar';
  
  if (locationBtn) {
    locationBtn.disabled = true;
    locationBtn.innerHTML = `<i data-lucide="loader"></i><span>${lang === 'ar' ? 'جاري التحديد...' : 'Loading...'}</span>`;
  }
  
  navigator.geolocation.getCurrentPosition(
    (position) => {
      setUserLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      });
      
      if (locationBtn) {
        locationBtn.classList.add('active');
        locationBtn.disabled = false;
        locationBtn.innerHTML = `<i data-lucide="check-circle"></i><span>${lang === 'ar' ? 'تم تحديد الموقع ✓' : 'Location Set ✓'}</span>`;
      }
      
      const addressField = document.getElementById('customerAddress');
      if (addressField) {
        const coords = `(${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)})`;
        addressField.value = lang === 'ar' 
          ? `تم تحديد الموقع الحالي ${coords}`
          : `Current location set ${coords}`;
      }
      
      closePermissionModal();
      updateBranchDistances();
      
      if (typeof lucide !== 'undefined') lucide.createIcons();
    },
    (error) => {
      console.log('Location error:', error);
      if (locationBtn) {
        locationBtn.disabled = false;
        locationBtn.innerHTML = `<i data-lucide="map-pin"></i><span>${lang === 'ar' ? 'استخدام الموقع الحالي' : 'Use Current Location'}</span>`;
      }
      closePermissionModal();
    }
  );
}

function updateBranchDistances() {
  // ✅ FIX: استخدام getUserLocation() بدل userLocation
  const currentLocation = getUserLocation();
  if (!currentLocation) return;
  
  const lang = window.currentLang || 'ar';
  
  Object.keys(branches).forEach(branchId => {
    const branch = branches[branchId];
    const distance = calculateDistance(
      currentLocation.lat,
      currentLocation.lng,
      branch.location.lat,
      branch.location.lng
    );
    
    const distanceEl = document.getElementById(`branch-${branchId}-distance`);
    if (distanceEl) {
      const span = distanceEl.querySelector('span');
      if (span) {
        span.textContent = `${distance.toFixed(1)} ${lang === 'ar' ? 'كم' : 'km'}`;
      }
    }
  });
}

function closePermissionModal() {
  const modal = document.getElementById('permissionModal');
  if (modal) modal.classList.remove('show');
}