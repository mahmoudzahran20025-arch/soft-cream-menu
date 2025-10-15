export function initGSAPAnimations() {
  // تأكد من تحميل GSAP
  if (typeof gsap === 'undefined') {
    console.error('❌ GSAP not loaded');
    return;
  }

  // انتظر تحميل كل الصور
  const images = document.querySelectorAll('img');
  let loadedImages = 0;

  function startAnimations() {
    gsap.registerPlugin(ScrollTrigger);
    
    // إخفاء العناصر أولاً
    gsap.utils.toArray(".icecream-gs-reveal").forEach(function(elem) {
      gsap.set(elem, { autoAlpha: 0 });
    });

    // بدء الأنيميشن
    gsap.utils.toArray(".icecream-gs-reveal").forEach(function(elem) {
      ScrollTrigger.create({
        trigger: elem,
        onEnter: () => animateFrom(elem),
        onEnterBack: () => animateFrom(elem, -1),
        onLeave: () => gsap.set(elem, { autoAlpha: 0 })
      });
    });

    console.log('✅ Animations initialized after full page load');
  }

  function animateFrom(elem, direction = 1) {
    const x = elem.classList.contains("icecream-gs-reveal-fromLeft") ? -100 :
             elem.classList.contains("icecream-gs-reveal-fromRight") ? 100 : 0;
    
    const y = direction * 100;
    
    gsap.fromTo(elem, 
      {
        x: x,
        y: y,
        autoAlpha: 0
      },
      {
        duration: 1.25,
        x: 0,
        y: 0,
        autoAlpha: 1,
        ease: "expo",
        overwrite: "auto"
      }
    );
  }

  // التأكد من تحميل كل الصور
  function handleImageLoad() {
    loadedImages++;
    if (loadedImages === images.length) {
      // بدء الأنيميشن بعد تحميل كل الصور
      startAnimations();
    }
  }

  // إضافة event listener لكل صورة
  images.forEach(img => {
    if (img.complete) {
      handleImageLoad();
    } else {
      img.addEventListener('load', handleImageLoad);
      img.addEventListener('error', handleImageLoad); // في حالة فشل تحميل الصورة
    }
  });

  // في حالة عدم وجود صور أصلاً
  if (images.length === 0) {
    startAnimations();
  }
}

// تشغيل عندما يكتمل تحميل DOM
document.addEventListener('DOMContentLoaded', () => {
  // تأخير قصير للتأكد من تحميل كل شيء
  window.addEventListener('load', () => {
    setTimeout(initGSAPAnimations, 100);
  });
});