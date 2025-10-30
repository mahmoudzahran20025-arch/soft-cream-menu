/**
 * 🎨 CAROUSEL DATA CONFIGURATION
 * ════════════════════════════════════════════════════════════════
 * 
 * 📌 المسؤولية: تخزين بيانات الكاروسيلات فقط
 * 📌 لا يحتوي على: أي logic أو functions
 * 📌 سهل التعديل: أضف/عدّل المنتجات من هنا مباشرة
 * 
 * ════════════════════════════════════════════════════════════════
 */

export const CAROUSELS_DATA = {
    'carousel-main': {
        title: 'العروض المميزة',
        ariaLabel: 'العروض المميزة',
        progressColors: 'from-pink-500 via-purple-500 to-amber-500',
        autoPlay: true,
        autoPlayInterval: 5000,
        slides: [
            {
                id: 'vanilla-caramel',
                title: 'آيس كريم فانيليا بصوص كراميل',
                description: 'آيس كريم فانيليا كريمي يخطف الأنفاس، تعلوه طبقة سلسة من صوص الكراميل الذهبي.',
                image: 'https://i.ibb.co/LzP97qhB/481279444-627854640201713-219907065737357117-n-min.webp',
                bgGradient: 'from-pink-50/95 to-white/95 dark:from-gray-800/95 dark:to-gray-900/95',
                overlayGradient: 'from-pink-500/20 to-amber-500/20',
                titleColor: 'text-pink-600 dark:text-pink-400',
                buttonGradient: 'from-pink-500 to-amber-500',
                buttonRing: 'focus:ring-pink-300',
                ctaText: 'اطلب الآن',
                layout: 'image-right',
                category: 'ice-cream',
                price: 25
            },
            {
                id: 'mango-soft',
                title: 'سوفت مانجو طبيعي',
                description: 'سوفت مانجو يختزل جوهر الفاكهة الاستوائية في كل ملعقة. قوام حريري يذوب بلطف.',
                image: 'https://i.ibb.co/4nNL0KR6/Gemini-Generated-Image-7z63p77z63p77z63.png',
                bgGradient: 'from-purple-50/95 to-white/95 dark:from-gray-800/95 dark:to-gray-900/95',
                overlayGradient: 'from-purple-500/20 to-pink-500/20',
                titleColor: 'text-purple-600 dark:text-purple-400',
                buttonGradient: 'from-purple-500 to-pink-500',
                buttonRing: 'focus:ring-purple-300',
                ctaText: 'جرّبه الآن',
                layout: 'image-left',
                category: 'soft-serve',
                price: 20
            },
            {
                id: 'vanilla-brownie',
                title: 'فانيليا بقطع براوني',
                description: 'فانيليا كريمية فاخرة تتخللها قطع غنية من البراوني الشوكولاتي.',
                image: 'https://i.ibb.co/xq6xwTq2/484012205-623030934031341-1808374385255644063-n.jpg',
                bgGradient: 'from-amber-50/95 to-white/95 dark:from-gray-800/95 dark:to-gray-900/95',
                overlayGradient: 'from-amber-500/20 to-orange-500/20',
                titleColor: 'text-amber-600 dark:text-amber-400',
                buttonGradient: 'from-amber-500 to-orange-500',
                buttonRing: 'focus:ring-amber-300',
                ctaText: 'جرّبه الآن',
                layout: 'image-right',
                category: 'ice-cream',
                price: 30
            },
            {
                id: 'pure-soft',
                title: 'نقاء السوفت آيس كريم',
                description: 'تجسيد للنقاء والطبيعة في كل حبة، بمكوناته الطبيعية الخالصة.',
                image: 'https://i.ibb.co/67cV4CJc/484157834-622859394048495-6880924063204865717-n-min.webp',
                bgGradient: 'from-green-50/95 to-white/95 dark:from-gray-800/95 dark:to-gray-900/95',
                overlayGradient: 'from-green-500/20 to-emerald-500/20',
                titleColor: 'text-green-600 dark:text-green-400',
                buttonGradient: 'from-green-500 to-emerald-500',
                buttonRing: 'focus:ring-green-300',
                ctaText: 'اطلب الآن',
                layout: 'image-left',
                category: 'soft-serve',
                price: 22
            }
        ]
    },
    
    'carousel-secondary': {
        title: 'منتجات إضافية',
        ariaLabel: 'منتجات إضافية',
        progressColors: 'from-teal-500 via-sky-500 to-indigo-500',
        autoPlay: true,
        autoPlayInterval: 6000,
        slides: [
            {
                id: 'flurry-oreo',
                title: 'فلوري أوريو',
                description: 'آيس كريم كريمي ممزوج بقطع بسكويت الأوريو الغنية.',
                image: 'https://i.ibb.co/8gQ15nZ7/558984721-791054437228989-7733276430689348371-n-min.jpg',
                bgGradient: 'from-teal-50/95 to-white/95 dark:from-gray-800/95 dark:to-gray-900/95',
                overlayGradient: 'from-teal-500/20 to-cyan-500/20',
                titleColor: 'text-teal-600 dark:text-teal-400',
                buttonGradient: 'from-teal-500 to-cyan-500',
                buttonRing: 'focus:ring-teal-300',
                ctaText: 'جرّبه الآن',
                layout: 'image-right',
                category: 'specialty',
                price: 35
            },
            {
                id: 'soft-candy',
                title: 'سوفت كاندي',
                description: 'تجربة حلوى لا مثيل لها، سوفت كريم بنكهة سكرية حلوة وممتعة.',
                image: 'https://i.ibb.co/35fbWCYY/495226124-663623663305401-7196241149356063471-n-min.jpg',
                bgGradient: 'from-sky-50/95 to-white/95 dark:from-gray-800/95 dark:to-gray-900/95',
                overlayGradient: 'from-sky-500/20 to-indigo-500/20',
                titleColor: 'text-sky-600 dark:text-sky-400',
                buttonGradient: 'from-sky-500 to-indigo-500',
                buttonRing: 'focus:ring-sky-300',
                ctaText: 'جرّبه الآن',
                layout: 'image-left',
                category: 'soft-serve',
                price: 18
            },
            {
                id: 'sundae-lotus-nutella',
                title: 'صنداي لوتس / نوتيلا',
                description: 'اختار بين صوص اللوتس الدافئ أو نكهة النوتيلا الغنية.',
                image: 'https://i.ibb.co/Q7BshLpx/514410102-708973618770405-257295013446953510-n.jpg',
                bgGradient: 'from-indigo-50/95 to-white/95 dark:from-gray-800/95 dark:to-gray-900/95',
                overlayGradient: 'from-indigo-500/20 to-pink-500/20',
                titleColor: 'text-indigo-600 dark:text-indigo-400',
                buttonGradient: 'from-indigo-500 to-pink-500',
                buttonRing: 'focus:ring-indigo-300',
                ctaText: 'اختار صوصك',
                layout: 'image-right',
                category: 'sundae',
                price: 40
            },
            {
                id: 'sundae-pistachio',
                title: 'صنداي بيستاشيو',
                description: 'آيس كريم كريمي مغطى بصوص البيستاشيو الفاخر، مع قطع المكسرات.',
                image: 'https://i.ibb.co/LzhzfnGY/484032829-621596114174823-1720175782820299419-n.jpg',
                bgGradient: 'from-lime-50/95 to-white/95 dark:from-gray-800/95 dark:to-gray-900/95',
                overlayGradient: 'from-lime-500/20 to-green-500/20',
                titleColor: 'text-lime-600 dark:text-lime-400',
                buttonGradient: 'from-lime-500 to-green-500',
                buttonRing: 'focus:ring-lime-300',
                ctaText: 'اختار صوصك',
                layout: 'image-left',
                category: 'sundae',
                price: 45
            }
        ]
    }
};

/**
 * 🏷️ CATEGORY NAMES MAP
 */
export const CATEGORY_NAMES = {
    'ice-cream': 'آيس كريم',
    'soft-serve': 'سوفت',
    'sundae': 'صنداي',
    'specialty': 'تشكيلة خاصة'
};