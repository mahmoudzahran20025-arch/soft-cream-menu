// ================================================================
// CHECKOUT LOYALTY - الولاء والـ Gamification
// ================================================================

import { storage } from '../storage.js';
import { api } from '../api.js';

// ================================================================
// جلب رقم الهاتف
// ================================================================
export function getCustomerPhone() {
  const phoneField = document.getElementById('customerPhone');
  if (phoneField?.value) {
    return phoneField.value.trim();
  }
  
  const userData = storage.getUserData();
  if (userData?.phone) {
    return userData.phone;
  }
  
  return null;
}

// ================================================================
// أيقونة المستوى
// ================================================================
export function getTierIcon(tier) {
  const icons = {
    new: '🆕',
    returning: '🎁',
    vip: '💎'
  };
  return `<span style="font-size: 1.5rem;">${icons[tier] || '🔹'}</span>`;
}

// ================================================================
// رسالة الترقية
// ================================================================
export function getUpgradeMessage(tier, lang) {
  const messages = {
    returning: {
      ar: '🎉 مبروك! أصبحت عميل عائد - خصم 15% على طلباتك القادمة',
      en: '🎉 Congratulations! You\'re now a Returning Customer - 15% off'
    },
    vip: {
      ar: '⭐ مبروك! أصبحت عميل VIP - خصم 20% + توصيل مجاني',
      en: '⭐ Congratulations! You\'re now VIP - 20% off + Free delivery'
    }
  };
  
  return messages[tier]?.[lang] || '';
}

// ================================================================
// Modal الاحتفال بالترقية
// ================================================================
export function showTierUpgradeModal(tier, lang) {
  const messages = {
    returning: {
      title: lang === 'ar' ? '🎉 مبروك الترقية!' : '🎉 Congratulations!',
      subtitle: lang === 'ar' ? 'أصبحت عميل عائد' : 'Returning Customer',
      benefits: [
        lang === 'ar' ? '✨ خصم 15%' : '✨ 15% off',
        lang === 'ar' ? '🎁 عروض حصرية' : '🎁 Exclusive offers'
      ],
      color: '#667eea',
      icon: '🎁'
    },
    vip: {
      title: lang === 'ar' ? '⭐ أهلاً بك في VIP!' : '⭐ Welcome to VIP!',
      subtitle: lang === 'ar' ? 'أصبحت عميل مميز' : 'VIP Customer',
      benefits: [
        lang === 'ar' ? '💎 خصم 20%' : '💎 20% off',
        lang === 'ar' ? '🚚 توصيل مجاني' : '🚚 Free delivery'
      ],
      color: '#ff9800',
      icon: '💎'
    }
  };
  
  const msg = messages[tier];
  if (!msg) return;
  
  const modal = document.createElement('div');
  modal.id = 'tierUpgradeModal';
  modal.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 10000;';
  
  modal.innerHTML = `
    <div style="background: white; border-radius: 24px; padding: 32px; max-width: 400px; width: 90%; text-align: center;">
      <div style="font-size: 4rem; margin-bottom: 16px;">${msg.icon}</div>
      <h2 style="font-size: 1.75rem; font-weight: 700; color: ${msg.color}; margin-bottom: 8px;">${msg.title}</h2>
      <p style="font-size: 1.125rem; color: #666; margin-bottom: 24px;">${msg.subtitle}</p>
      
      <div style="text-align: right; margin-bottom: 24px;">
        ${msg.benefits.map(b => `
          <div style="padding: 12px; background: #f8f9fa; border-radius: 12px; margin-bottom: 8px;">
            ${b}
          </div>
        `).join('')}
      </div>
      
      <button onclick="closeTierUpgradeModal()" style="background: ${msg.color}; color: white; border: none; padding: 14px 32px; border-radius: 12px; font-weight: 700; width: 100%; cursor: pointer;">
        ${lang === 'ar' ? 'رائع! 🎊' : 'Awesome! 🎊'}
      </button>
    </div>
  `;
  
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
}

window.closeTierUpgradeModal = function() {
  const modal = document.getElementById('tierUpgradeModal');
  if (modal) {
    modal.remove();
    document.body.style.overflow = '';
  }
};

// ================================================================
// عرض Gamification في الملخص
// ================================================================
export function renderGamificationSummary(gamification, lang) {
  if (!gamification) return '';
  
  const { badges, points, availableDiscount, challenges } = gamification;
  
  let html = `<div style="grid-column: 1 / -1; margin-top: 12px; padding: 12px; background: #f8f9fa; border-radius: 12px; border: 2px solid #e9ecef;">`;
  
  // الشارات
  if (badges?.length > 0) {
    html += `<div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px;">`;
    badges.forEach(badge => {
      html += `
        <div style="background: white; padding: 6px 12px; border-radius: 20px; font-size: 0.875rem; display: flex; align-items: center; gap: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <span>${badge.icon}</span>
          <span style="font-weight: 600;">${lang === 'ar' ? badge.nameAr : badge.nameEn}</span>
        </div>
      `;
    });
    html += `</div>`;
  }
  
  // النقاط
  if (points > 0) {
    html += `
      <div style="background: white; padding: 8px 12px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span style="display: flex; align-items: center; gap: 6px;">
          <span style="font-size: 1.25rem;">💰</span>
          <span style="font-weight: 600;">${lang === 'ar' ? 'نقاطك' : 'Your Points'}</span>
        </span>
        <span style="font-weight: 700; color: #2196F3; font-size: 1.1rem;">${points}</span>
      </div>
    `;
    
    if (availableDiscount > 0) {
      html += `
        <div style="background: #e8f5e9; padding: 8px 12px; border-radius: 8px; font-size: 0.875rem; color: #2e7d32; text-align: center;">
          <i data-lucide="gift" style="width: 14px; height: 14px; display: inline; vertical-align: middle;"></i>
          ${lang === 'ar' 
            ? `يمكنك استخدام ${availableDiscount} ج.م خصم من نقاطك!`
            : `You can use ${availableDiscount} EGP discount from your points!`
          }
        </div>
      `;
    }
  }
  
  // التحديات
  if (challenges?.length > 0) {
    const challenge = challenges[0];
    const progress = (challenge.current / challenge.target) * 100;
    
    html += `
      <div style="margin-top: 12px; padding: 12px; background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%); border-radius: 8px; color: white;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 0.875rem; font-weight: 600;">
            🎯 ${lang === 'ar' ? challenge.nameAr : challenge.nameEn}
          </span>
          <span style="font-size: 0.75rem; background: rgba(255,255,255,0.3); padding: 4px 8px; border-radius: 12px;">
            ${challenge.reward}
          </span>
        </div>
        <div style="background: rgba(255,255,255,0.3); height: 6px; border-radius: 3px; overflow: hidden;">
          <div style="background: white; height: 100%; width: ${progress}%; transition: width 0.3s;"></div>
        </div>
        <div style="font-size: 0.75rem; margin-top: 6px; opacity: 0.9;">
          ${challenge.current} / ${challenge.target} 
          <span style="opacity: 0.8;">
            (${lang === 'ar' ? `باقي ${challenge.remaining}` : `${challenge.remaining} remaining`})
          </span>
        </div>
      </div>
    `;
  }
  
  html += `</div>`;
  return html;
}

// ================================================================
// صفحة Gamification الكاملة
// ================================================================
export async function loadGamificationPage() {
  const phone = getCustomerPhone();
  if (!phone) {
    const lang = window.currentLang || 'ar';
    showToast(
      lang === 'ar' ? 'خطأ' : 'Error',
      lang === 'ar' ? 'الرجاء تسجيل رقم الهاتف أولاً' : 'Please enter your phone number first',
      'error'
    );
    return;
  }
  
  try {
    const data = await api.request('GET', `/gamification?phone=${encodeURIComponent(phone)}`);
    
    if (!data) {
      console.warn('No gamification data');
      return;
    }
    
    const lang = window.currentLang || 'ar';
    const container = document.getElementById('gamificationContainer');
    if (!container) return;
    
    container.innerHTML = `
      ${renderGamificationStats(data.stats, lang)}
      ${renderGamificationBadges(data.badges, lang)}
      ${renderGamificationPoints(data.points, data.availableDiscount, lang)}
      ${renderGamificationChallenges(data.challenges, lang)}
    `;
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
  } catch (error) {
    console.error('Failed to load gamification:', error);
  }
}



// ================================================================
// دوال عرض صفحة Gamification الكاملة
// ================================================================

/**
 * عرض إحصائيات Gamification
 */
function renderGamificationStats(stats, lang) {
  if (!stats) return '';
  
  return `
    <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; margin-bottom: 24px;">
      <div class="stat-card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 16px; color: white; text-align: center; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);">
        <div style="font-size: 2.5rem; font-weight: 700; margin-bottom: 8px;">${stats.totalOrders || 0}</div>
        <div style="font-size: 0.875rem; opacity: 0.9;">${lang === 'ar' ? 'إجمالي الطلبات' : 'Total Orders'}</div>
      </div>
      
      <div class="stat-card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 20px; border-radius: 16px; color: white; text-align: center; box-shadow: 0 4px 12px rgba(240, 147, 251, 0.3);">
        <div style="font-size: 2.5rem; font-weight: 700; margin-bottom: 8px;">${(stats.totalSpent || 0).toFixed(0)}</div>
        <div style="font-size: 0.875rem; opacity: 0.9;">${lang === 'ar' ? 'إجمالي الشراء (ج.م)' : 'Total Spent (EGP)'}</div>
      </div>
      
      <div class="stat-card" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 20px; border-radius: 16px; color: white; text-align: center; box-shadow: 0 4px 12px rgba(79, 172, 254, 0.3);">
        <div style="font-size: 2.5rem; font-weight: 700; margin-bottom: 8px;">${stats.lastMonthOrders || 0}</div>
        <div style="font-size: 0.875rem; opacity: 0.9;">${lang === 'ar' ? 'آخر 30 يوم' : 'Last 30 Days'}</div>
      </div>
    </div>
  `;
}

/**
 * عرض الشارات
 */
function renderGamificationBadges(badges, lang) {
  if (!badges || badges.length === 0) return '';
  
  return `
    <div class="badges-section" style="margin-bottom: 24px;">
      <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 16px; color: #1a1a1a;">
        ${lang === 'ar' ? '🏆 شاراتك' : '🏆 Your Badges'}
      </h3>
      <div class="badges-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 12px;">
        ${badges.map(badge => `
          <div class="badge-card" style="background: white; padding: 16px; border-radius: 16px; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border: 2px solid #f0f0f0; transition: transform 0.2s; cursor: pointer;" onmouseover="this.style.transform='translateY(-4px)'" onmouseout="this.style.transform='translateY(0)'">
            <div style="font-size: 3rem; margin-bottom: 8px;">${badge.icon}</div>
            <div style="font-weight: 600; font-size: 0.875rem; color: #1a1a1a;">
              ${lang === 'ar' ? badge.nameAr : badge.nameEn}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

/**
 * عرض النقاط والخصم المتاح
 */
function renderGamificationPoints(points, availableDiscount, lang) {
  return `
    <div class="points-section" style="margin-bottom: 24px; background: linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%); padding: 24px; border-radius: 16px; box-shadow: 0 8px 24px rgba(253, 203, 110, 0.3);">
      <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 16px; color: #2d3436;">
        💰 ${lang === 'ar' ? 'نقاطك' : 'Your Points'}
      </h3>
      
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 16px;">
        <div style="flex: 1; min-width: 150px;">
          <div style="font-size: 3rem; font-weight: 700; color: #2d3436;">${points || 0}</div>
          <div style="font-size: 0.875rem; color: #636e72;">
            ${lang === 'ar' ? 'نقطة متاحة' : 'Points Available'}
          </div>
        </div>
        
        ${availableDiscount > 0 ? `
          <div style="background: #00b894; color: white; padding: 16px 24px; border-radius: 12px; text-align: center; box-shadow: 0 4px 12px rgba(0, 184, 148, 0.3);">
            <div style="font-size: 1.75rem; font-weight: 700; margin-bottom: 4px;">${availableDiscount} ${lang === 'ar' ? 'ج.م' : 'EGP'}</div>
            <div style="font-size: 0.75rem; opacity: 0.9;">${lang === 'ar' ? 'خصم متاح' : 'Discount Available'}</div>
          </div>
        ` : ''}
      </div>
      
      <div style="background: rgba(255,255,255,0.5); padding: 12px; border-radius: 12px; font-size: 0.875rem; color: #2d3436; text-align: center;">
        <i data-lucide="info" style="width: 14px; height: 14px; display: inline; vertical-align: middle;"></i>
        ${lang === 'ar' 
          ? 'كل 100 جنيه = 10 نقاط | كل 100 نقطة = 10 ج.م خصم' 
          : '100 EGP = 10 points | 100 points = 10 EGP discount'
        }
      </div>
    </div>
  `;
}

/**
 * عرض التحديات
 */
function renderGamificationChallenges(challenges, lang) {
  if (!challenges || challenges.length === 0) return '';
  
  return `
    <div class="challenges-section" style="margin-bottom: 24px;">
      <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 16px; color: #1a1a1a;">
        ${lang === 'ar' ? '🎯 التحديات' : '🎯 Challenges'}
      </h3>
      <div style="display: flex; flex-direction: column; gap: 12px;">
        ${challenges.map(challenge => {
          const progress = (challenge.current / challenge.target) * 100;
          return `
            <div class="challenge-card" style="background: white; padding: 20px; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-left: 4px solid #2196F3;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
                <h4 style="font-size: 1rem; font-weight: 600; color: #1a1a1a; margin: 0;">
                  ${lang === 'ar' ? challenge.nameAr : challenge.nameEn}
                </h4>
                <span style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 6px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; white-space: nowrap;">
                  ${challenge.reward}
                </span>
              </div>
              
              <div style="background: #e0e0e0; height: 8px; border-radius: 4px; overflow: hidden; margin-bottom: 8px;">
                <div style="background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); height: 100%; width: ${progress}%; transition: width 0.5s ease;"></div>
              </div>
              
              <div style="display: flex; justify-content: space-between; font-size: 0.875rem; color: #666;">
                <span>${challenge.current} / ${challenge.target}</span>
                <span style="color: #2196F3; font-weight: 600;">
                  ${lang === 'ar' ? `باقي ${challenge.remaining}` : `${challenge.remaining} remaining`}
                </span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

// ================================================================
// تصدير الدوال
// ================================================================
export {
  renderGamificationStats,
  renderGamificationBadges,
  renderGamificationPoints,
  renderGamificationChallenges
};