// Soft Ice Cream GSAP Animations - Isolated
// Soft Ice Cream GSAP - Isolated Version
export function initGSAPAnimations() {
  if (typeof gsap === 'undefined') {
    console.error('❌ GSAP not loaded');
    return;
  }

  function animateIcecreamFrom(elem, direction) {
    direction = direction || 1;
    var x = 0,
        y = direction * 100;
    if(elem.classList.contains("icecream-gs-reveal-fromLeft")) {
      x = -100;
      y = 0;
    } else if (elem.classList.contains("icecream-gs-reveal-fromRight")) {
      x = 100;
      y = 0;
    }
    elem.style.transform = "translate(" + x + "px, " + y + "px)";
    elem.style.opacity = "0";
    gsap.fromTo(elem, {x: x, y: y, autoAlpha: 0}, {
      duration: 1.25, 
      x: 0,
      y: 0, 
      autoAlpha: 1, 
      ease: "expo", 
      overwrite: "auto"
    });
  }
  
  function hideIcecreamElem(elem) {
    gsap.set(elem, {autoAlpha: 0});
  }
  
  gsap.registerPlugin(ScrollTrigger);
  
  gsap.utils.toArray(".icecream-gs-reveal").forEach(function(elem) {
    hideIcecreamElem(elem);
    
    ScrollTrigger.create({
      trigger: elem,
      onEnter: function() { animateIcecreamFrom(elem) }, 
      onEnterBack: function() { animateIcecreamFrom(elem, -1) },
      onLeave: function() { hideIcecreamElem(elem) }
    });
  });
}