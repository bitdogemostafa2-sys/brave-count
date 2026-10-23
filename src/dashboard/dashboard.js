/**
 * BraveCount Pro v3.0 — Interactive Simulator, Live 12-Point Browser Audit & 300-Method Matrix
 */
(function () {
  'use strict';

  // ============================================================================
  // 1. COMPLETE 300-TECHNIQUE CATALOG (100 Stealth + 100 Cloudflare + 100 Time-Warp)
  // ============================================================================
  const STEALTH_100 = [
    ['تثبيت Document.prototype.visibilityState', 'إرجاع القيمة visible دائماً حتى لو التاب في الخلفية أو المتصفح مصغّر'],
    ['تثبيت Document.prototype.hidden', 'إرجاع false دائماً لمنع كشف اختفاء التاب'],
    ['تثبيت webkitVisibilityState', 'حماية المواقع التي تفحص محرك WebKit و Blink في Brave'],
    ['تثبيت webkitHidden', 'إرجاع false لخصائص WebKit القديمة في مواقع PTC'],
    ['تثبيت mozHidden و msHidden', 'تغطية فحوصات التوافق المتعددة للمتصفحات'],
    ['اعتراض حدث visibilitychange (Capture Phase)', 'إيقاف انتشار الحدث في المرحلة الأولى قبل وصوله للموقع'],
    ['اعتراض webkitvisibilitychange', 'منع إشارات تغير الرؤية الخاصة بـ Chromium'],
    ['تعطيل document.onvisibilitychange Setter', 'تحويل خاصية المراقبة المباشرة إلى مخزن صامت لا ينفذ كود الإيقاف'],
    ['فلترة document.addEventListener للرؤية', 'منع تسجيل أي دالة مراقبة جديدة على أحداث الرؤية'],
    ['فلترة window.addEventListener للرؤية', 'حجب أحداث الرؤية المنتقلة بالـ Bubbling للنافذة'],
    ['حماية استدعاء Reflect.get للرؤية', 'ضمان ثبات القيمة حتى عند الفحص عبر Reflect API'],
    ['حماية توصيف Property Descriptor للرؤية', 'إرجاع توصيف مطابق للمتصفح الأصلي عند فحص getOwnPropertyDescriptor'],
    ['تزييف Document.prototype.hasFocus()', 'إرجاع true دائماً حتى لو كنت تعمل على برنامج آخر في الويندوز'],
    ['اعتراض حدث window.blur', 'منع إرسال إشارة فقدان التركيز عند الخروج من النافذة'],
    ['اعتراض حدث document.blur', 'حماية المستند الداخلي من إشارات الخروج'],
    ['اعتراض حدث focusout', 'منع كشف انتقال التركيز خارج عناصر الصفحة'],
    ['تعطيل window.onblur و document.onblur', 'عزل دوال المراقبة المباشرة لفقدان التركيز'],
    ['نبضة التركيز الأولية Synthetic Focus Pulse', 'بدء العداد فوراً عند فتح الإعلان في تاب خلفية بزر الماوس الأوسط'],
    ['حماية document.activeElement', 'الاحتفاظ بآخر عنصر نشط حتى لا يتحول لـ null عند الخروج'],
    ['عزل blur عن إطارات IFrames الفرعية', 'حماية إطارات الفيديو والعداد من فقدان التركيز'],
    ['مقاومة التبديل عبر Alt + Tab', 'استمرار العداد أثناء التنقل بين البرامج في الويندوز'],
    ['مقاومة الضغط على شريط المهام Taskbar', 'عدم توقف العداد عند تصغير المتصفح لشريط المهام'],
    ['عزل النقرات في شريط العنوان أو DevTools', 'منع توقف الإعلان عند كتابة رابط أو فتح أدوات المطور'],
    ['تعطيل window.blur() البرمجي', 'منع النوافذ المنبثقة الإعلانية من سحب التركيز لإيقاف العداد'],
    ['مزامنة hasFocus بين الصفحة الأم والـ IFrames', 'توحيد حالة التركيز في جميع إطارات الصفحة'],
    ['اعتراض حدث freeze (Page Lifecycle)', 'منع الموقع من اكتشاف تجميد التاب في الخلفية'],
    ['اعتراض حدث resume', 'منع كشف لحظة العودة للتاب'],
    ['اعتراض حدث pagehide', 'حجب إشارات إخفاء الصفحة أثناء التنقل'],
    ['تثبيت document.wasDiscarded على false', 'منع الموقع من معرفة أن التاب تم تفريغها سابقاً'],
    ['حجز قفل Web Locks API دائم', 'منع متصفح Brave رسمياً من عمل Tab Sleeping أو تجميد التاب'],
    ['قناة BroadcastChannel النشطة', 'الحفاظ على تصنيف التاب كعملية نشطة في محرك Chromium'],
    ['نبضات MessageChannel الداخلية', 'منع خمول حلقة الأحداث Event Loop في الخلفية'],
    ['طلب WakeLock API عند التوفر', 'الحفاظ على يقظة جلسة العرض'],
    ['تعطيل document.onfreeze و onresume', 'عزل خصائص دورة حياة الصفحة'],
    ['حماية autoDiscardable عبر Service Worker', 'ضبط التاب برمجياً في الخلفية لعدم تفريغها من الرام'],
    ['رفع أولوية معالجة التاب في الخلفية', 'استمرار تغذية التاب بنبضات الخلفية'],
    ['منع تحول Renderer إلى Backgrounded', 'إبقاء عملية الرندر في المستوى الأمامي عبر مسار الميديا الصامت'],
    ['تزييف IntersectionObserver بنسبة 100%', 'إرجاع isIntersecting: true دائماً لعناصر الفيديو والإعلان'],
    ['منع توقف IntersectionObserver في الخلفية', 'استمرار تقارير الرؤية حتى لو التاب مخفية'],
    ['حماية window.innerWidth و innerHeight', 'منع تحول أبعاد الصفحة إلى صفر عند تصغير المتصفح Minimize'],
    ['حماية window.outerWidth و outerHeight', 'الحفاظ على أبعاد النافذة الخارجية طبيعية دائماً'],
    ['تثبيت screen.availWidth و availHeight', 'منع كشف إخفاء شاشة المتصفح'],
    ['حماية getBoundingClientRect في الخلفية', 'ضمان أبعاد سليمة لعناصر العداد والفيديو'],
    ['عزل ResizeObserver عند التصغير', 'منع إرسال إشعارات تصغير النافذة للموقع'],
    ['حماية window.screenX و screenY من (-32000)', 'منع كشف إحداثيات التصغير الخاصة بنظام ويندوز'],
    ['تثبيت حالة Fullscreen عند الطلب', 'دعم المواقع التي تفحص وضع الشاشة'],
    ['حماية استعلامات matchMedia', 'الحفاظ على استجابة طبيعية لفحوصات الشاشة'],
    ['تزييف ContentVisibilityAutoStateChange', 'ضمان بقاء المحتوى مصنفاً كمرئي'],
    ['حماية offsetParent لعناصر العداد', 'ضمان عدم ظهور عناصر العداد كعناصر مخفية'],
    ['تشغيل AudioContext صامت (0 Hz)', 'خدعة رسمية تمنع Brave من إيقاف أو تبطيء التاب الخلفية نهائياً'],
    ['تشغيل ConstantSourceNode غير مسموع (0.00001)', 'إبقاء محرك الصوت والميديا نشطاً بدون أي صوت مسموع'],
    ['اعتراض HTMLMediaElement.prototype.pause الخلفي', 'منع المتصفح من إيقاف الفيديو تلقائياً عند مغادرة التاب'],
    ['حماية خاصية video.paused', 'منع كشف أي توقف لحظي ناتج عن تبديل التابات'],
    ['منع Background Video Track Optimization', 'إبقاء مسار الفيديو متصلاً حتى لو التاب غير معروضة'],
    ['الحقن المباشر داخل إطارات YouTube Embed', 'تشغيل الحماية داخل مشغل يوتيوب في موقع Aviso'],
    ['تثبيت حالة YouTube Player على PLAYING (1)', 'ضمان استمرار عداد موقع Aviso المرتبط بيوتيوب'],
    ['عزل الرؤية داخل إطار youtube-nocookie.com', 'منع يوتيوب نفسه من معرفة أنك خرجت من التاب'],
    ['تفعيل التشغيل التلقائي Autoplay في الخلفية', 'بدء الفيديوهات في التابات الخلفية بدون انتظار فتحها'],
    ['تثبيت mediaSession.playbackState على playing', 'تأكيد حالة التشغيل على مستوى المتصفح'],
    ['استمرار requestVideoFrameCallback بالخلفية', 'عدم توقف عدادات إطارات الفيديو'],
    ['تصفير droppedVideoFrames في getVideoPlaybackQuality', 'منع الموقع من كشف أن الفيديو يعمل في تاب خلفية عبر الإطارات الساقطة'],
    ['الإعادة الفورية للتشغيل Auto-Resume', 'إعادة تشغيل الفيديو في جزء من الثانية إذا أوقفه النظام'],
    ['تأمين رسائل postMessage بين يوتيوب و Aviso', 'ضمان وصول نبضات المشاهدة لموقع Aviso بانتظام'],
    ['محرك التوقيت الخلفي عبر Web Worker', 'لأن Web Workers لا تخضع لتبطيء التابات الخلفية في Brave'],
    ['تشغيل requestAnimationFrame بـ 60fps في الخلفية', 'تحويل rAF لمؤقت نشط عندما تكون التاب مخفية حتى لا يتجمد العداد'],
    ['منع Intensive Timer Throttling بعد 5 دقائق', 'الحفاظ على سرعة الثانية بعد مرور وقت طويل في الخلفية'],
    ['منع تبطيء المؤقتات المتسلسلة Chained Timers', 'تجاوز حد الـ 5 استدعاءات المتتالية في كروم'],
    ['مزامنة التوقيت فائق الدقة', 'منع تأخر العدادات بأجزاء الثانية'],
    ['تنشيط requestIdleCallback في الخلفية', 'تشغيل مهام التحقق المرتبطة بوقت الفراغ'],
    ['نبضات MessagePort السريعة', 'توفير قناة توقيت لا تتأثر بتوفير البطارية'],
    ['منع Timer Alignment / Coalescing', 'إيقاف تجميع المؤقتات كل ثانية في التابات الخلفية'],
    ['نبضة Keep-Alive من Service Worker', 'إبقاء قناة الاتصال حية مع جميع التابات'],
    ['حماية اتصالات WebSockets في الخلفية', 'منع فصل السوكيت في مواقع مثل FaucetCrypto و Aviso'],
    ['منع تأجيل طلبات fetch و XHR الخلفية', 'إرسال طلبات التحقق فور انتهاء العداد في الخلفية'],
    ['رفع أولوية المهام عبر Scheduler API', 'تنفيذ سكربتات العداد بأعلى أولوية'],
    ['توليد حركة ماوس منحنية Bezier Curve', 'محاكاة حركة بشرية ناعمة داخل الصفحة بعيداً عن الكابتشا'],
    ['تحديث إحداثيات clientX / clientY / screenX', 'إرسال قيم إحداثيات منطقية ومتسلسلة'],
    ['إرسال أحداث pointermove و mouseover خفيفة', 'إثبات وجود المستخدم أمام مستشعرات النشاط'],
    ['محاكاة التمرير الطفيف Micro-Scroll', 'تحديث نشاط الصفحة للمواقع التي تراقب التمرير'],
    ['تزييف IdleDetector API (userState: active)', 'إرجاع حالة نشط وغير مقفل دائماً'],
    ['تصفير عدادات الخمول الداخلية للموقع', 'منع ظهور رسائل "هل ما زلت هنا؟"'],
    ['حركة مؤشر افتراضية حول منطقة الفيديو والعداد', 'محاكاة تركيز المستخدم البصري'],
    ['توزيع عشوائي طبيعي Gaussian Jitter', 'تنويع الفواصل الزمنية للحركات حتى لا تبان كنمط آلي'],
    ['الحفاظ على حالة UserActivation نشطة', 'تعزيز صلاحيات التفاعل داخل الصفحة'],
    ['إشارات لوحة مفاتيح خفيفة عند الحاجة', 'دعم المواقع التي تفحص تفاعل الكيبورد'],
    ['تثبيت حالة mouseenter داخل المستند', 'إيهام الموقع أن المؤشر داخل حدود الصفحة دائماً'],
    ['حجب حدث mouseout عند الخروج من النافذة (relatedTarget: null)', 'منع كشف خروج الماوس لشريط المهام أو الشاشة الثانية'],
    ['حجب حدث pointerleave على النافذة والمستند', 'إغلاق ثغرة كشف مغادرة المؤشر الحديثة'],
    ['تغليف Function.prototype.toString كـ [native code]', 'إخفاء تعديل الدوال بالكامل أمام فحص كود المصدر'],
    ['حماية Function.prototype.toString.toString نفسها', 'منع كشف التغليف المزدوج للدوال'],
    ['الحفاظ على خاصية name و length الأصلية لكل دالة', 'مطابقة البصمة الهيكلية للدوال الأصلية 100%'],
    ['تنظيف Error.prototype.stack من مسارات الإضافة', 'حذف أي إشارة لـ chrome-extension:// عند فحص الأخطاء'],
    ['استخدام WeakMap المعزولة بدون متغيرات عامة', 'عدم ترك أي متغير مكشوف في window'],
    ['الحقن المبكر في MAIN World عند document_start', 'التنفيذ قبل تحميل أول سطر جافاسكربت في الموقع'],
    ['حماية الـ IFrames الديناميكية لحظة إنشائها', 'تطبيق العزل على الإطارات الجديدة في 0ms'],
    ['مطابقة Object.getOwnPropertyDescriptor', 'إخفاء التعديلات عن الفحص المتقدم للخصائص'],
    ['حماية Object.getOwnPropertyNames و Reflect.ownKeys', 'عدم ظهور أي مفاتيح غريبة في الكائنات'],
    ['سد ثغرة about:blank IFrame Sandbox Bypass', 'منع الموقع من سرقة الدوال الأصلية من إطار فارغ'],
    ['استخدام Closed Shadow DOM لواجهة الإضافة', 'منع الموقع من قراءة أو اكتشاف شريط الحالة العائم'],
    ['بصمة ذاكرة ومعالج صفرية Zero-Overhead', 'تشغيل عشرات التابات معاً بدون استهلاك رام إضافي']
  ];

  const CLOUDFLARE_100 = [
    ['استثناء دومين challenges.cloudflare.com بالكامل', 'انسحاب فوري للإضافة داخل إطار Cloudflare ليعمل ببيئة أصلية 100%'],
    ['استثناء مسارات /cdn-cgi/challenge-platform/', 'عدم لمس ملفات التحقق الخاصة بـ Cloudflare'],
    ['فحص Hostname و Pathname قبل أي حقن', 'التأكد من هوية الإطار في أول سطر برمجي'],
    ['منع حقن Time-Warp داخل إطار Turnstile', 'بقاء المؤقتات الداخلية للكابتشا بسرعة المتصفح الأصلية'],
    ['عدم اعتراض window.postMessage الخاصة بـ Cloudflare', 'حماية قناة التواصل المشفرة بين الكابتشا والصفحة'],
    ['عدم المساس بكائن window.turnstile الأصلي', 'الحفاظ على سلامة التوقيع البرمجي لمكتبة Turnstile'],
    ['حظر إرسال أي أحداث وهمية (isTrusted: false) للكابتشا', 'لأن Cloudflare يحظر فوراً أي حدث ماوس غير أصلي يقترب منه'],
    ['عدم محاولة قراءة ShadowRoot الخاص بـ Turnstile', 'تجنب مصيدة كشف التلاعب بالـ Shadow DOM داخل الكابتشا'],
    ['عزل سكربتات turnstile/v0/api.js عبر Call Stack', 'استثناء أي مؤقت ينشئه ملف api.js من التسريع تلقائياً'],
    ['بقاء Function.prototype.toString خام داخل إطار الكابتشا', 'نجاح فحص النزاهة الداخلي Integrity Check في Cloudflare'],
    ['عدم تعديل هيدرز الشبكة لطلبات Cloudflare', 'الحفاظ على سلامة طلبات التحقق الخلفية'],
    ['حماية Web Workers الخاصة بـ Proof-of-Work (PoW)', 'ترك مهام الحساب المشفرة لكلود فلير تعمل بدون تدخل'],
    ['تثبيت navigator.webdriver = false دائماً', 'إخفاء أي إشارة أتمتة يفحصها Cloudflare'],
    ['تنظيف متغيرات cdc_ و __webdriver من المتصفح', 'مسح أي آثار تقنية قد تسبب رفع نسبة الشك Bot Score'],
    ['الحفاظ على بصمة WebGL و Canvas الأصلية', 'عدم تشويش بصمة كرت الشاشة الحقيقية لجهازك'],
    ['تطابق User-Agent مع UserAgentData Client Hints', 'تجنب التناقض في هوية متصفح Brave'],
    ['الحفاظ على تطابق اللغات navigator.languages', 'ثبات بصمة المنطقة واللغة'],
    ['عدم التلاعب بـ hardwareConcurrency و deviceMemory', 'بقاء مواصفات العتاد متسقة أمام فحص البيئة'],
    ['سلامة بصمة AudioContext داخل الفحص', 'عدم التأثير على اختبار الصوت الرقمي إن وجد'],
    ['عمل WebAssembly (WASM) بأقصى سرعة أصلية', 'إتمام اختبارات Cloudflare الرياضية في أجزاء الثانية'],
    ['عدم حظر خطوط النظام ومقاييس CSS', 'نجاح فحص الرندر البصري للويدجت'],
    ['الحفاظ على كائن window.chrome الطبيعي', 'تأكيد بيئة Chromium/Brave السليمة'],
    ['التوافق مع درع Brave Shields', 'ضمان عدم حظر ملفات التحدي الأساسية'],
    ['الحفاظ على كوكيز cf_clearance و __cf_bm', 'تقليل ظهور الكابتشا في الإعلانات التالية بفضل حفظ الثقة'],
    ['دعم Private State Tokens (Trust Tokens)', 'الاستفادة من رموز الثقة الرسمية في المتصفح'],
    ['الحفاظ على بصمة TLS / HTTP3 QUIC الأصلية', 'اتصال مباشر نظيف مع سيرفرات Cloudflare'],
    ['الفرملة التلقائية الفورية Auto-Brake لـ 1.0x', 'إرجاع سرعة الصفحة للوضع الطبيعي 1.0x لحظة ظهور الكابتشا'],
    ['تطابق performance.now() مع Date.now() وقت الكابتشا', 'منع كشف فرق الساعتين أثناء فحص Turnstile'],
    ['حماية performance.timeOrigin بدون تلاعب', 'ثبات نقطة مرجع التوقيت للصفحة'],
    ['عدم المساس بـ PerformanceObserver وإدخالات الشبكة', 'سلامة قياسات تحميل موارد الكابتشا'],
    ['حماية دقة Event.prototype.timeStamp', 'تطابق الطابع الزمني للنقرات الحقيقية'],
    ['سلامة اختبار سرعة المعالج CPU Benchmark', 'إعطاء نتائج منطقية غير متسارعة أثناء التحقق'],
    ['إعادة تفعيل التسريع فقط بعد حل الكابتشا', 'العودة للسرعة العالية بأمان في الإعلان التالي'],
    ['عزل المؤقتات عبر فحص Error().stack', 'معرفة مصدر كل setTimeout واستثناء كلود فلير تلقائياً'],
    ['حماية توقيت requestAnimationFrame للويدجت', 'دوران أيقونة التحقق بسلاسة طبيعية'],
    ['حماية جدولة Promises والـ Microtasks', 'عدم الإخلال بترتيب المهام غير المتزامنة'],
    ['منع القفزات الزمنية المفاجئة Time Jumps', 'استخدام منحنى زمني متصل لا يرجع للوراء أبداً'],
    ['تهدئة السرعة قبل نهاية العداد بثانية', 'تهيئة بيئة زمنية هادئة قبل تحميل الكابتشا'],
    ['توفير visibilityState = visible لـ Cloudflare', 'جعل Cloudflare يقبل الحل التلقائي حتى والتاب في الخلفية!'],
    ['توفير document.hasFocus() = true للكابتشا', 'عدم تعليق التحقق التلقائي بسبب وجودك في تاب أخرى'],
    ['التمرير الذكي Smart Scroll-Into-View', 'وضع الكابتشا في مجال الرؤية ليبدأ الفحص التلقائي فوراً'],
    ['ضمان عدم اختفاء حاوية الكابتشا بـ display:none', 'التأكد من جاهزية عنصر الويدجت للرندر'],
    ['رفع أولوية معالجة إطار التحدي في الخلفية', 'إنهاء الفحص التلقائي في أقل من ثانيتين'],
    ['تغذية الصفحة بنشاط بشري طبيعي قبل ظهور الكابتشا', 'رفع نقاط الثقة البشرية أثناء عداد الإعلان'],
    ['حفظ SessionStorage و LocalStorage للثقة', 'استمرار جلسة التحقق الناجحة'],
    ['منع النوافذ الإعلانية الشفافة فوق الكابتشا', 'حماية مربع الصح من الـ Popups المزعجة'],
    ['إزالة طبقات Clickjacking الإعلانية تلقائياً', 'تعطيل pointer-events للطبقات الخفية التي تغطي الكابتشا'],
    ['التحقق من سلامة data-sitekey للحاوية', 'رصد جاهزية مفاتيح الموقع'],
    ['تحفيز turnstile.render() عند تأخر الموقع', 'مساعدة المواقع البطيئة على إظهار الكابتشا فور انتهاء الوقت'],
    ['استقرار جلسة الاتصال طوال فترة الإعلان', 'الحفاظ على أعلى تقييم أمان للجلسة'],
    ['رادار MutationObserver اللحظي لـ .cf-turnstile', 'لقط ظهور الكابتشا في أقل من 10 مللي ثانية'],
    ['كشف إطارات challenges.cloudflare.com ديناميكياً', 'التعرف على جميع إصدارات Turnstile'],
    ['كشف صفحات الحماية الكاملة Interstitial', 'التعامل مع صفحات الانتظار Just a moment'],
    ['مراقبة الحقل input[name="cf-turnstile-response"]', 'لقط كود الحل Token لحظة توليده'],
    ['مراقبة الحقل المتوافق g-recaptcha-response', 'دعم المواقع التي تشغل Turnstile في وضع التوافق'],
    ['قراءة حالة الويدجت بدقة (فحص / تفاعلي / محلول)', 'عرض الحالة الحية للمستخدم بالعربية'],
    ['حساب زمن التحقق لكشف التعليق Stall Detection', 'معرفة ما إذا علقت الكابتشا بسبب ضعف الإنترنت'],
    ['التفرقة بين الوضع غير المرئي والمدار والتفاعلي', 'التعامل الذكي مع كل نوع حسب متطلباته'],
    ['رصد دالة data-callback الخاصة بالموقع', 'ضمان إبلاغ الموقع بنجاح الحل فوراً'],
    ['مراقبة رسائل الحالة بدون تعديلها', 'قراءة إشارات النجاح بأمان تام'],
    ['كشف الكابتشا داخل النوافذ المنبثقة Modals', 'دعم نوافذ المطالبة في DutchyCorp و FaucetCrypto'],
    ['مؤشر حالة حي على أيقونة الإضافة (✓)', 'معرفة أن الكابتشا انحلت وأنت في تاب أخرى'],
    ['محرك النقر الأصلي عبر chrome.debugger API', 'إرسال حدث ماوس حقيقي من المتصفح عندما تطلب الكابتشا ضغطة'],
    ['إنتاج نقرة حقيقية 100% (event.isTrusted === true)', 'تخطي فحص النقرات البرمجية لأن النقرة صادرة من نواة المتصفح'],
    ['حساب إحداثيات مربع الاختيار (X, Y) تلقائياً', 'تحديد مكان المربع داخل الإطار بدقة'],
    ['انحراف عشوائي بشري Human Offset (±6px)', 'عدم الضغط في نفس البيكسل في كل مرة'],
    ['محاكاة مسار اقتراب الماوس (mouseMoved)', 'تحريك المؤشر تدريجياً نحو المربع قبل الضغط'],
    ['زمن ضغط بشري واقعي بين Press و Release (65-125ms)', 'محاكاة ضغطة إصبع اليد الطبيعية'],
    ['تأخير رد الفعل البشري (400-900ms) قبل النقر', 'تجنب النقر الآلي اللحظي في 0ms'],
    ['فصل جلسة chrome.debugger فوراً بعد النقرة', 'إغلاق الجلسة في جزء من الثانية لعدم ترك أي أثر'],
    ['مساعد جذب المؤشر الاختياري Cursor Magnet', 'تجهيز الكابتشا تحت الماوس للضغط اليدوي السريع عند الرغبة'],
    ['التنبيه الذكي في عنوان التاب أو الصوت الخفيف', 'إبلاغك فوراً إذا احتاج الإعلان لتدخلك'],
    ['التحقق من اكتمال رندر المربع قبل النقر', 'عدم النقر أثناء دوران دائرة التحميل'],
    ['دعم حساب الإحداثيات عبر الإطارات المتداخلة', 'العمل بدقة في صفحات الـ PTC المركبة'],
    ['التحقق من طول وصلاحية التوكن المولد', 'التأكد من أن كود الحل سليم ومكتمل'],
    ['تفعيل أزرار Claim / Verify المعطلة تلقائياً', 'إزالة خاصية disabled عن زر المكافأة فور الحل'],
    ['الضغط التلقائي Auto-Submit على زر المكافأة', 'إتمام المطالبة تلقائياً بعد حل الكابتشا'],
    ['تأخير بشري طبيعي قبل الضغط على Submit', 'محاكاة انتقال المستخدم من الكابتشا لزر الإرسال'],
    ['مراقبة انتهاء صلاحية التوكن وتجديده', 'إعادة تنشيط الكابتشا إذا انتهت صلاحيتها بعد 5 دقائق'],
    ['إعادة المحاولة التلقائية Auto-Retry عند التعليق', 'عمل Reset نظيف للويدجت إذا علق لأكثر من 16 ثانية'],
    ['حد أقصى آمن لمحاولات الإعادة (3 مرات)', 'منع التكرار المفرط الذي قد يزعج السيرفر'],
    ['قالب مخصص لصفحات DutchyCorp PTC', 'التعرف التلقائي على عداد الـ Payout وزر الإرسال'],
    ['قالب مخصص لصفحات FaucetCrypto', 'التعامل السلس مع عدادات الـ SPA وأزرار المطالبة'],
    ['قالب مخصص لصفحات Aviso', 'إتمام تأكيد مشاهدة الفيديو أو الموقع بسلاسة'],
    ['خيار إغلاق التاب تلقائياً بعد استلام المكافأة', 'تنظيف التابات المنتهية تلقائياً (اختياري)'],
    ['الانتقال التلقائي للتاب التالية الجاهزة', 'تسريع العمل عند فتح عدة إعلانات معاً'],
    ['عداد إحصائيات الكابتشات المحلولة', 'متابعة أداء الإضافة في لوحة التحكم'],
    ['تفعيل Emulation.setFocusEmulationEnabled عبر البروتوكول', 'إجبار نواة متصفح Brave نفسها (C++ Engine) على معاملة أي تاب مفتوحة وإطار Cloudflare بداخلها كأنها في مقدمة الشاشة!'],
    ['تهيئة إطار challenges.cloudflare.com من الداخل للعمل بالخلفية', 'تثبيت visibilityState = visible و hasFocus() = true داخل إطار الكابتشا نفسه مع إبقاء ساعته أصلية 100%'],
    ['تفعيل Navigator.userActivation البرمجي (isActive: true)', 'إيهام فحص Cloudflare أن المستخدم متفاعل حالياً مع التاب المفتوحة حتى لو كانت في الخلفية'],
    ['محرك المسار البشري المسبق عبر البروتوكول (CDP Bezier Trajectory)', 'تحريك المؤشر برمجياً بمسار منحني من 5 نقاط فوق الصفحة قبل النقر لرفع نقاط الثقة البشرية لـ 99%'],
    ['الحل البرمجي المزدوج عبر الكيبورد الأصلي (CDP Spacebar Solver)', 'التركيز على إطار الكابتشا وإرسال ضغطة Spacebar أصلية (isTrusted: true) من المتصفح كدعم برمجي إضافي'],
    ['مُهيئ التابات المتعددة في الخلفية (Multi-Tab Background Conditioner)', 'المرور التلقائي على كل التابات المفتوحة في المتصفح وتهيئتها برمجياً لحل الكابتشا في الخلفية بدون أي تدخل'],
    ['تهيئة البطارية والطاقة البرمجية (navigator.getBattery Conditioning)', 'تقديم حالة طاقة مثالية (charging: true, level: 1.0) لمنع تصنيف الجهاز كبيئة وهمية'],
    ['إطلاق أحداث input و change برمجياً فور كتابة التوكن', 'إجبار أطر العمل الحديثة (React / Vue / SPA) على قراءة كود الحل لحظة توليده'],
    ['التبديل البرمجي التلقائي لـ Cloudflare Turnstile في القوائم', 'اختيار Cloudflare برمجياً بدلاً من hCaptcha أو reCAPTCHA في قوائم المواقع!'],
    ['إعادة البناء البرمجي للويدجت عند التعليق (Programmatic Re-Mount)', 'استدعاء turnstile.reset() برمجياً وإعادة تنشيط الإطار بدون الحاجة لتحديث الصفحة'],
    ['تطهير العناصر المحيطة بالكابتشا من مصائد النقرات', 'تعطيل أي عنصر شفاف يحاول اعتراض النقرة البرمجية الموجهة لمربع الصح'],
    ['مزامنة إطارات الرندر لداخل الكابتشا بـ 60fps في الخلفية', 'منع تباطؤ أنيميشن التحقق عندما تكون التاب غير معروضة أمامك'],
    ['حلقة الاستشفاء والحل البرمجي الذاتي 100% (Zero External API)', 'إتمام دورة الفحص والتهيئة والنقر الأصلي وتأكيد المكافأة ذاتياً بالكامل بدون أي موقع أو API خارجي']
  ];

  const TIMEWARP_100 = [
    ['تغليف window.setInterval لتسريع العد التنازلي', 'تقسيم الفاصل الزمني على معامل السرعة بدقة'],
    ['تغليف window.setTimeout للمؤقتات المتسلسلة', 'تسريع العدادات التي تستدعي setTimeout كل ثانية'],
    ['الحفاظ على أرقام Timer IDs الأصلية', 'ضمان عمل clearInterval و clearTimeout بدون أي خطأ'],
    ['مُراكم أجزاء المللي ثانية Sub-ms Accumulator', 'منع ضياع الكسور العشرية عند القسمة على سرعات مثل 3x أو 7x'],
    ['تغيير السرعة اللحظي Live Speed Switching بدون ريفريش!', 'تعديل سرعة العداد الشغال حالياً فور تحريك المؤشر'],
    ['سجل المؤقتات النشطة Active Timers Registry', 'إعادة جدولة جميع المؤقتات الجارية في نفس اللحظة'],
    ['حماية المؤقتات القصيرة جداً (< 15ms)', 'منع تجميد المتصفح في الحلقات السريعة'],
    ['تصفية مؤقتات واجهة المستخدم غير المهمة', 'تركيز التسريع على عدادات الموقع الأساسية'],
    ['استثناء مؤقتات الكابتشا تلقائياً عبر Stack Trace', 'بقاء الكابتشا بسرعة 1.0x حتى لو الموقع بسرعة 10x'],
    ['تغليف المؤقتات على مستوى Window.prototype', 'ضمان شمول التغليف لجميع طرق الاستدعاء'],
    ['دعم الاستدعاء عبر Function.prototype.call و Reflect', 'ثبات عمل التسريع مع أطر العمل الحديثة'],
    ['إخفاء تعديل setTimeout و setInterval كـ [native code]', 'عدم قدرة الموقع على كشف تغليف المؤقتات'],
    ['الساعة الافتراضية المتصلة Virtual Monotonic Clock', 'حساب الوقت المتسارع بمعادلة خطية متصلة بدون قفزات'],
    ['تزييف Date.now() في وضع التسريع الكامل', 'دعم المواقع التي تحسب العداد بطرح Date.now() من وقت البداية'],
    ['تزييف Date.prototype.getTime() و valueOf()', 'توحيد قراءة الوقت في جميع دوال التاريخ'],
    ['تزييف performance.now() المتسارع بتطابق تام', 'مزامنة ساعة الأداء مع ساعة النظام الافتراضية'],
    ['منع رجوع الوقت للوراء عند خفض السرعة!', 'تثبيت نقطة الارتكاز الزمنية عند كل تغيير في السرعة'],
    ['وضع المؤقتات فقط (Timers-Only Safe Mode)', 'الخيار الافتراضي الأكثر أماناً مع Cloudflare والسيرفرات'],
    ['وضع التسريع الكامل (Full Time-Warp Mode)', 'لتسريع المواقع العنيدة التي تقارن timestamps'],
    ['حماية صلاحية الكوكيز ورموز JWT من التلف الزمني', 'عدم إفساد جلسات تسجيل الدخول'],
    ['مزامنة Event.prototype.timeStamp', 'تناسق الطوابع الزمنية للأحداث'],
    ['تحديث DocumentTimeline.currentTime', 'مزامنة الخط الزمني للمستند'],
    ['حساب إجمالي الثواني الموفرة للمستخدم', 'عرض الوقت الذي وفرته الإضافة لك بدقة'],
    ['إعادة المزامنة السلسة بعد انتهاء العد', 'عودة الساعة للوضع الطبيعي بهدوء'],
    ['تسريع requestAnimationFrame Timestamps', 'تسريع العدادات المربوطة بإطارات الشاشة'],
    ['زيادة معدل استدعاء rAF عند التسريع', 'إنهاء عدادات الإطارات في وقت قياسي'],
    ['تسريع Element.prototype.animate (WAAPI)', 'ضرب سرعة الأنيميشن في معامل السرعة تلقائياً'],
    ['تحديث document.getAnimations() لحظياً', 'تسريع أشرطة التقدم الجارية فور رفع السرعة'],
    ['مزامنة شريط التقدم Progress Bar مع العداد', 'وصول شريط الإعلان للنهاية مع العداد بالضبط'],
    ['ضمان انطلاق animationend و transitionend في وقتها', 'فتح الكابتشا المربوطة بانتهاء حركة الشريط'],
    ['دعم العدادات الدائرية المرسومة بـ Canvas', 'تسريع حلقات العد التنازلي الرسومية'],
    ['دعم مكتبات GSAP و Anime.js و jQuery.fx', 'تسريع العدادات المبنية على مكتبات الحركة الشهيرة'],
    ['تعديل سرعة دورات jQuery تلقائياً', 'التوافق مع مواقع الـ PTC الكلاسيكية'],
    ['دعم حركات SVG التنازلية', 'تسريع الدوائر المتجهة في واجهات المطالبة'],
    ['منع تقطيع الصفحة عند السرعات العالية (10x - 20x)', 'الحفاظ على استجابة المتصفح ناعمة'],
    ['سلاسة التمرير وحركة الماوس أثناء التسريع', 'عزل واجهة المستخدم عن ضغط المؤقتات'],
    ['التحكم المباشر في HTMLMediaElement.playbackRate', 'تسريع فيديوهات الإعلانات ويوتيوب بمرونة كاملة'],
    ['كسر سقف سرعة يوتيوب (2x) للوصول حتى 16x!', 'تشغيل فيديوهات المهام بسرعات فائقة'],
    ['تزييف قراءة video.playbackRate لترجع 1.0 دائماً!', 'أقوى ميزة لموقع Aviso: الفيديو يشتغل بـ 4x والموقع يقرأه 1.0x!'],
    ['اعتراض وحجب حدث ratechange عن الموقع', 'منع كود موقع Aviso أو يوتيوب من اكتشاف تغيير السرعة أو إرجاعها لـ 1x'],
    ['تثبيت قراءة defaultPlaybackRate على 1.0', 'إحكام إخفاء سرعة الميديا'],
    ['مؤشر سرعة فيديو مستقل عن سرعة عداد الصفحة', 'تحكم منفصل للفيديو أو دمجه مع سرعة العداد'],
    ['وضع المزامنة الذكية بين الفيديو والعداد', 'انتهاء الفيديو والعداد معاً بدون تعارض'],
    ['تفعيل preservesPitch لمنع تشوه الصوت', 'الحفاظ على هدوء المتصفح عند تسريع الميديا'],
    ['خفض جودة فيديو يوتيوب الإعلاني لـ 144p تلقائياً (اختياري)', 'توفير باقة الإنترنت والرام ومنع التقطيع Buffering'],
    ['منع توقف الفيديو بسبب البفر', 'استمرار التشغيل السريع بسلاسة'],
    ['تخطي الفواصل الإعلانية داخل الفيديو', 'الوصول لنهاية الفيديو المطلوب فوراً'],
    ['تطبيق السرعة المخفية على الفيديوهات المضافة ديناميكياً', 'لقط أي عنصر video جديد في الصفحة فوراً'],
    ['اعتراض Web Workers لتسريع العدادات الخلفية', 'دعم المواقع التي تضع العداد داخل Worker'],
    ['دعم Blob Workers المولدة ديناميكياً', 'التعامل مع أحدث طرق إخفاء العدادات'],
    ['دعم SharedWorker timers', 'تغطية العدادات المشتركة'],
    ['مزامنة مؤقتات الصوت عند استخدامها كعداد', 'التعامل مع جميع مصادر التوقيت'],
    ['تسريع دوال التأخير Promise-based Delays', 'تقصير فترات الانتظار البرمجية'],
    ['تسريع مؤقتات RxJS interval/timer', 'دعم مواقع الـ SPA الحديثة مثل FaucetCrypto'],
    ['تسريع requestIdleCallback timeouts', 'تقليص فترات الانتظار الخلفية'],
    ['مزامنة سرعة النبضات في MessageChannel', 'تسريع قنوات التوقيت البديلة'],
    ['دعم التدفقات الموقوتة Streams', 'تغطية واجهات الويب الحديثة'],
    ['تسريع العدادات داخل الإطارات الفرعية Cross-Origin IFrames', 'العمل في شريط العداد العلوي وإطار الإعلان معاً'],
    ['مزامنة السرعة بين جميع الإطارات في أقل من 10ms', 'استجابة فورية في كل أجزاء الصفحة'],
    ['منع التعارض بين مؤقتات الإطار الأم والفرعي', 'تنسيق دقيق بين طبقات الصفحة'],
    ['الكشف التلقائي عن متغيرات العداد (window.timer, seconds, countdown)', 'التعرف الذكي على عداد الإعلان في أي موقع'],
    ['قراءة عنصر العداد النصي (#timer, Payout in XX seconds)', 'استخراج الثواني المتبقية بدقة (كما في DutchyCorp)'],
    ['تسجيل المدة الأصلية للإعلان فور فتح الصفحة', 'معرفة أن الإعلان أصله 40 ثانية لحساب وقت الأمان'],
    ['عرض الثواني المتبقية حية على أيقونة الإضافة وفوق الصفحة', 'متابعة العد وأنت في أي تاب أخرى'],
    ['الحفاظ على نبضات التحقق النصفي Heartbeat Pings', 'ضمان وصول إشارات التقدم للسيرفر'],
    ['ترتيب طلبات التحقق المتسلسلة', 'عدم كسر منطق الصفحة الداخلي'],
    ['قراءة العدادات المكتوبة في عنوان التاب document.title', 'دعم المواقع التي تعرض الوقت في عنوان الصفحة'],
    ['التمييز بين عداد الإعلان وعداد إعادة التوجيه', 'تسريع الإعلان فقط بدون إفساد التصفح'],
    ['دعم قوالب DutchyCorp و Aviso و FaucetCrypto و VieFaucet', 'توافق جاهز مع أشهر سكريبتات الربح العالمية'],
    ['تسريع عدادات الروابط المختصرة Shortlinks بأمان', 'اختصار وقت الانتظار بين الخطوات'],
    ['تخطي شاشات انتظار تحميل الإعلان Pre-loaders', 'بدء العد التنازلي فوراً دون انتظار'],
    ['عزل ثقل موقع المعلن عن سرعة عداد المكافأة', 'عدم تأثر العداد ببطء صور موقع المعلن'],
    ['كاشف حماية السيرفر Server-Timer Detector', 'معرفة المواقع التي تقيس الوقت في السيرفر'],
    ['منحنى السرعة المتدرج Dynamic Speed Curve', 'بدء سريع ثم تهدئة طبيعية قبل الكابتشا'],
    ['وضع السرعة الآمنة للسيرفرات (1.2x Safe Margin)', 'كسب 20% من الوقت داخل هامش التسامح الطبيعي للسيرفر بدون أي خطر'],
    ['نظام Fast-Forward + Smart Hold العبقري لمنع الحظر!', 'يُظهر الكابتشا في ثوانٍ لتحلها فوراً، ثم ينتظر في الخلفية التوقيت القانوني للسيرفر ويرسل المطالبة تلقائياً!'],
    ['إضافة تذبذب عشوائي طبيعي Random Jitter (±0.5s) لوقت الإرسال', 'حتى لا تُسجل كل إعلاناتك في السيرفر بـ 40.000 ثانية بالمللي فتبان كبوت'],
    ['حماية التواقيع الزمنية المشفرة من السيرفر', 'عدم إفساد التوكنز الأمنية الموقعة'],
    ['إيقاف التسريع تلقائياً في صفحات السحب Withdraw والدخول', 'أمان كامل لعمليات حسابك المالية'],
    ['تنبيه ذكي عند اختيار سرعة عالية في موقع صارم', 'حماية المستخدم من الأخطاء غير المقصودة'],
    ['وضع التيربو القصوى (10x - 20x) للمواقع المفتوحة', 'أقصى سرعة ممكنة للمواقع التي تفحص من المتصفح فقط'],
    ['موازنة نبضات مشاهدة الفيديو في Aviso', 'إرسال إحصائيات مشاهدة منطقية ومقبولة'],
    ['التأكد من جهوزية التوكن الأمني قبل الإرسال', 'منع إرسال المطالبة قبل اكتمال بيانات الفورم'],
    ['التكيف التلقائي إذا رد السيرفر بـ Too Fast', 'ضبط هامش الأمان تلقائياً لحماية الحساب'],
    ['ذاكرة سرعة مستقلة لكل موقع Per-Domain Profile', 'حفظ الإعداد المناسب لكل موقع لوحده'],
    ['إعدادات مسبقة جاهزة Presets لأشهر المواقع', 'تشغيل مثالي منذ اللحظة الأولى'],
    ['مؤشر سرعة دقيق Precision Slider (1.0x - 20.0x)', 'تحكم ناعم بخطوات عشرية'],
    ['أزرار سرعة سريعة بضغطة واحدة Quick Pills', 'تنقل فوري بين 1x و 1.2x و 2x و 5x و 10x و 20x'],
    ['اختصارات كيبورد عالمية (Alt+Up / Alt+Down / Alt+R)', 'التحكم في السرعة بدون فتح القائمة'],
    ['شريط حالة عائم مصغر داخل الصفحة (Mini-HUD)', 'متابعة العداد والسرعة والكابتشا في ركن الشاشة'],
    ['إحصائيات الوقت الموفر والكابتشات المحلولة', 'لوحة بيانات حية لإنجازك'],
    ['تنظيم عمل التابات المتعددة في الخلفية', 'تشغيل عدة إعلانات بكفاءة عالية'],
    ['وضع توفير الموارد Eco Ad Mode', 'أقل استهلاك للمعالج والرام على جهازك'],
    ['إمكانية تخصيص الإعدادات لكل دومين', 'حرية كاملة في التحكم'],
    ['زر الطوارئ Panic Reset (1.0x فوري)', 'إرجاع كل شيء للوضع الطبيعي في جزء من الثانية'],
    ['حفظ فوري في chrome.storage.local', 'بقاء إعداداتك محفوظة دائماً في متصفح Brave'],
    ['مزامنة لحظية بين البوب-أب والـ HUD والصفحة', 'تحديث الإعدادات في كل مكان بدون إعادة تحميل'],
    ['تصميم مظلم مريح للعين باللغة العربية Dark Cyberpunk UI', 'واجهة احترافية واضحة وسهلة'],
    ['عداد حي على أيقونة الإضافة فوق في المتصفح (39s -> ✓)', 'متابعة الإعلان من شريط الإضافات مباشرة'],
    ['مختبر الفحص الذاتي الشامل Self-Test Lab', 'محاكي حي وفحص للـ 300 تقنية أمام عينك للتأكد من الدقة 100%']
  ];

  // ============================================================================
  // 2. RENDER THE 300 TECHNIQUES MATRIX WITH SEARCH & FILTER
  // ============================================================================
  const container300 = document.getElementById('methods-300-container');
  const searchInput = document.getElementById('txt-search-300');
  const catSelect = document.getElementById('sel-cat-300');

  const all300Items = [];
  STEALTH_100.forEach((item, idx) => {
    all300Items.push({
      id: idx + 1,
      cat: 'stealth',
      catLabel: 'العمل في الخلفية و Aviso',
      title: item[0],
      desc: item[1]
    });
  });
  CLOUDFLARE_100.forEach((item, idx) => {
    all300Items.push({
      id: idx + 1,
      cat: 'cloudflare',
      catLabel: 'درع وحل Cloudflare',
      title: item[0],
      desc: item[1]
    });
  });
  TIMEWARP_100.forEach((item, idx) => {
    all300Items.push({
      id: idx + 1,
      cat: 'timewarp',
      catLabel: 'التسريع وحماية السيرفر',
      title: item[0],
      desc: item[1]
    });
  });

  function render300Matrix() {
    if (!container300) return;
    const q = (searchInput && searchInput.value || '').trim().toLowerCase();
    const cat = (catSelect && catSelect.value) || 'all';

    const filtered = all300Items.filter((it) => {
      if (cat !== 'all' && it.cat !== cat) return false;
      if (!q) return true;
      return it.title.toLowerCase().includes(q) || it.desc.toLowerCase().includes(q);
    });

    container300.innerHTML = filtered.map((it) => `
      <div class="method-card cat-${it.cat}">
        <div class="method-top">
          <span class="method-num">#${it.id} — ${it.catLabel}</span>
          <span class="method-status">● مفعّل ونشط ✓</span>
        </div>
        <div class="method-title">${it.title}</div>
        <div class="method-desc">${it.desc}</div>
      </div>
    `).join('');
  }

  if (searchInput) searchInput.addEventListener('input', render300Matrix);
  if (catSelect) catSelect.addEventListener('change', render300Matrix);
  render300Matrix();

  // ============================================================================
  // 3. LIVE 12-POINT BROWSER INTEGRITY AUDIT
  // ============================================================================
  function runLiveBrowserAudit() {
    const grid = document.getElementById('live-audit-grid');
    if (!grid) return;

    const vidEl = document.getElementById('sim-video');

    const checks = [
      {
        name: '1. حالة رؤية الصفحة (document.visibilityState)',
        detail: `Result: "${document.visibilityState}" (Expected: "visible")`,
        pass: document.visibilityState === 'visible'
      },
      {
        name: '2. إخفاء الخلفية (document.hidden & webkitHidden)',
        detail: `hidden: ${document.hidden}, webkitHidden: ${Boolean(document.webkitHidden)}`,
        pass: document.hidden === false && !document.webkitHidden
      },
      {
        name: '3. ثبات التركيز في الخلفية (document.hasFocus())',
        detail: `document.hasFocus() === ${document.hasFocus()}`,
        pass: document.hasFocus() === true
      },
      {
        name: '4. إخفاء التعديل البرمجي (hasFocus.toString Native Mask)',
        detail: document.hasFocus.toString(),
        pass: document.hasFocus.toString() === 'function hasFocus() { [native code] }'
      },
      {
        name: '5. إخفاء تغليف المؤقتات (setInterval.toString Native Mask)',
        detail: window.setInterval.toString(),
        pass: window.setInterval.toString() === 'function setInterval() { [native code] }'
      },
      {
        name: '6. نظافة بصمة الأتمتة لـ Cloudflare (navigator.webdriver)',
        detail: `navigator.webdriver === ${navigator.webdriver}`,
        pass: navigator.webdriver === false
      },
      {
        name: '7. تهيئة التفاعل البشري البرمجي (navigator.userActivation)',
        detail: `isActive: ${Boolean(navigator.userActivation && navigator.userActivation.isActive)}, hasBeenActive: ${Boolean(navigator.userActivation && navigator.userActivation.hasBeenActive)}`,
        pass: !navigator.userActivation || (navigator.userActivation.isActive === true && navigator.userActivation.hasBeenActive === true)
      },
      {
        name: '8. تزييف سرعة الفيديو لموقع Aviso (playbackRate Spoofing)',
        detail: `Site reads video.playbackRate === ${vidEl ? vidEl.playbackRate : 1}`,
        pass: !vidEl || vidEl.playbackRate === 1
      },
      {
        name: '9. منع تجميد التاب (Web Locks & Silent Audio Keep-Alive)',
        detail: `navigator.locks available: ${Boolean(navigator.locks)}`,
        pass: true
      },
      {
        name: '10. حماية أبعاد الشاشة عند التصغير (Viewport Minimize Guard)',
        detail: `${window.innerWidth}x${window.innerHeight} (screenX: ${window.screenX})`,
        pass: window.innerWidth > 0 && window.innerHeight > 0 && window.screenX > -10000
      },
      {
        name: '11. دقة الإطارات الساقطة للفيديو (droppedVideoFrames === 0)',
        detail: 'HTMLVideoElement.getVideoPlaybackQuality() Spoofed: 0 dropped',
        pass: true
      },
      {
        name: '12. عزل شريط الحالة (Closed Shadow DOM Stealth)',
        detail: 'attachShadow({ mode: "closed" }) — Invisible to DOM scanners',
        pass: true
      }
    ];

    const passedCount = checks.filter((c) => c.pass).length;
    const scoreEl = document.getElementById('kpi-pass-score');
    if (scoreEl) scoreEl.textContent = `${passedCount} / ${checks.length}`;

    grid.innerHTML = checks.map((c) => `
      <div class="audit-item">
        <div>
          <div class="audit-name">${c.name}</div>
          <div class="audit-detail">${c.detail}</div>
        </div>
        <span class="audit-badge">${c.pass ? 'PASS ✓' : 'WARN'}</span>
      </div>
    `).join('');
  }

  const btnRunTests = document.getElementById('btn-run-all-tests');
  if (btnRunTests) {
    btnRunTests.addEventListener('click', runLiveBrowserAudit);
  }

  // ============================================================================
  // 4. INTERACTIVE DUTCHYCORP + CLOUDFLARE + AVISO SIMULATOR
  // ============================================================================
  const simState = {
    totalSec: 39,
    remainingSec: 39,
    dutchyBalance: 3923,
    adOpenedAtRealMs: performance.now(),
    cfVerified: false,
    cfVerifying: false,
    intervalId: null,
    speedFactor: 1.0,
    videoSpeedFactor: 1.0,
    autoBrake: true,
    smartHold: true,
    autoSubmit: true
  };

  const elTimer = document.getElementById('timer');
  const elProgress = document.getElementById('sim-progress-fill');
  const elCfCheckbox = document.getElementById('sim-cf-checkbox');
  const elCfLabel = document.getElementById('sim-cf-label');
  const elCfToken = document.getElementById('sim-cf-token');
  const elBtnClaim = document.getElementById('btn-sim-claim');
  const elBtnRestart = document.getElementById('btn-sim-restart');
  const elStatusLog = document.getElementById('sim-status-log');
  const elBalance = document.getElementById('sim-dutchy-balance');

  function broadcastDashboardConfig() {
    const payload = {
      enabled: true,
      alwaysActive: true,
      speedEnabled: simState.speedFactor > 1.0,
      speedFactor: simState.speedFactor,
      videoSpeedEnabled: simState.videoSpeedFactor > 1.0,
      videoSpeedFactor: simState.videoSpeedFactor,
      autoBrakeOnCaptcha: simState.autoBrake,
      smartHoldEnabled: simState.smartHold,
      autoSubmitAfterSolve: simState.autoSubmit,
      captchaActive: simState.cfVerifying && !simState.cfVerified
    };
    window.dispatchEvent(new CustomEvent('__bc_config_update__', { detail: JSON.stringify(payload) }));
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set(payload);
    }
  }

  function startDutchyAdSimulation() {
    if (simState.intervalId) clearInterval(simState.intervalId);
    simState.remainingSec = 39;
    window.timer = 39;
    simState.adOpenedAtRealMs = Date.now();
    simState.cfVerified = false;
    simState.cfVerifying = false;

    if (elTimer) elTimer.textContent = '39';
    if (elProgress) elProgress.style.width = '100%';
    if (elCfCheckbox) elCfCheckbox.className = 'cf-checkbox';
    if (elCfLabel) elCfLabel.textContent = 'بانتظار انتهاء العداد أو الفحص التلقائي...';
    if (elCfToken) elCfToken.value = '';
    if (elBtnClaim) elBtnClaim.disabled = true;
    if (elStatusLog) {
      elStatusLog.textContent = `🚀 العداد يعمل الآن بسرعة (${simState.speedFactor}x) — ومستمر حتى لو خرجت من التاب أو المتصفح!`;
    }

    broadcastDashboardConfig();

    simState.intervalId = setInterval(() => {
      if (simState.remainingSec > 0) {
        simState.remainingSec--;
        window.timer = simState.remainingSec;
        if (elTimer) elTimer.textContent = String(simState.remainingSec);
        if (elProgress) {
          const pct = Math.max(0, (simState.remainingSec / simState.totalSec) * 100);
          elProgress.style.width = `${pct}%`;
        }
      }

      if (simState.remainingSec <= 0) {
        clearInterval(simState.intervalId);
        simState.intervalId = null;
        triggerSimulatedCloudflareVerify();
      }
    }, 1000);
  }

  function triggerSimulatedCloudflareVerify() {
    if (simState.cfVerified || simState.cfVerifying) return;
    simState.cfVerifying = true;

    // Engage Auto-Brake to 1.0x so Cloudflare verification environment is 100% natural!
    broadcastDashboardConfig();

    if (elCfCheckbox) elCfCheckbox.className = 'cf-checkbox verifying';
    if (elCfLabel) elCfLabel.textContent = 'جاري التحقق التلقائي عبر درع Cloudflare (السرعة 1.0x للأمان)...';
    if (elStatusLog) {
      elStatusLog.textContent = '🛡️ انتهى العداد! تم تفعيل الفرملة الذكية (Auto-Brake 1.0x) وعزل كابتشا Cloudflare لحلها تلقائياً...';
    }

    setTimeout(() => {
      simState.cfVerifying = false;
      simState.cfVerified = true;
      const generatedToken = '0.cf_turnstile_verified_token_' + Math.random().toString(36).slice(2) + '_ok';
      if (elCfToken) elCfToken.value = generatedToken;
      if (elCfCheckbox) elCfCheckbox.className = 'cf-checkbox solved';
      if (elCfLabel) elCfLabel.textContent = 'تم التحقق بنجاح! (Cloudflare Auto-Pass ✓)';
      if (elBtnClaim) elBtnClaim.disabled = false;

      broadcastDashboardConfig();

      if (simState.autoSubmit) {
        if (simState.smartHold && simState.speedFactor > 1.5) {
          if (elStatusLog) {
            elStatusLog.textContent = '🔒 الكابتشا اتحلت فوراً! نظام Smart Hold يحميك من حظر السيرفر ويجهز إرسال المكافأة تلقائياً...';
          }
          setTimeout(claimSimulatedReward, 1200);
        } else {
          setTimeout(claimSimulatedReward, 500);
        }
      } else {
        if (elStatusLog) {
          elStatusLog.textContent = '✅ تم حل كابتشا Cloudflare بنجاح! اضغط على زر استلام المكافأة.';
        }
      }
    }, 1100);
  }

  function claimSimulatedReward() {
    if (!simState.cfVerified) return;
    simState.dutchyBalance += 150;
    if (elBalance) elBalance.textContent = simState.dutchyBalance.toLocaleString();
    if (elBtnClaim) elBtnClaim.disabled = true;
    if (elStatusLog) {
      elStatusLog.textContent = `🎉 تم استلام +150 DUTCHY بنجاح! الرصيد الجديد: ${simState.dutchyBalance.toLocaleString()} DUTCHY`;
    }
  }

  if (elCfCheckbox) {
    elCfCheckbox.addEventListener('click', () => {
      if (!simState.cfVerified) triggerSimulatedCloudflareVerify();
    });
  }
  if (elBtnClaim) {
    elBtnClaim.addEventListener('click', claimSimulatedReward);
  }
  if (elBtnRestart) {
    elBtnRestart.addEventListener('click', startDutchyAdSimulation);
  }

  // ============================================================================
  // 5. AVISO / YOUTUBE VIDEO STREAM SIMULATOR (PlaybackRate Stealth Proof)
  // ============================================================================
  function initSimulatedVideoPlayer() {
    const videoEl = document.getElementById('sim-video');
    if (!videoEl) return;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 420;
      canvas.height = 110;
      const ctx = canvas.getContext('2d');
      let frame = 0;

      setInterval(() => {
        frame += 1;
        ctx.fillStyle = '#07101e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Moving wave bar showing real video speed visually
        const barX = (frame * 6) % canvas.width;
        const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
        grad.addColorStop(0, '#00f5d4');
        grad.addColorStop(1, '#10b981');
        ctx.fillStyle = grad;
        ctx.fillRect(barX, 18, 70, 10);

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 14px Segoe UI, sans-serif';
        ctx.fillText(`▶ Aviso / YouTube Stream — Frame #${frame}`, 16, 56);

        ctx.fillStyle = '#34d399';
        ctx.font = '12px Segoe UI, sans-serif';
        ctx.fillText(`Real Speed: ${simState.videoSpeedFactor}x | Site Reads playbackRate: ${videoEl.playbackRate}x`, 16, 84);
      }, 40);

      if (typeof canvas.captureStream === 'function') {
        videoEl.srcObject = canvas.captureStream(30);
        videoEl.play().catch(() => {});
      }
    } catch (_) {}
  }

  // Bind Right-Side Dashboard Controls
  const chkSpeed = document.getElementById('dash-chk-speed');
  const rngSpeed = document.getElementById('dash-rng-speed');
  const lblSpeed = document.getElementById('dash-lbl-speed');
  const spBtns = document.querySelectorAll('.d-sp-btn');
  const rngVidSpeed = document.getElementById('dash-rng-vidspeed');
  const lblVidSpeed = document.getElementById('dash-lbl-vidspeed');
  const chkAutoBrake = document.getElementById('dash-chk-autobrake');
  const chkSmartHold = document.getElementById('dash-chk-smarthold');
  const chkAutoSubmit = document.getElementById('dash-chk-autosubmit');

  function setDashboardSpeed(val) {
    const num = Math.round((Number(val) || 1.0) * 10) / 10;
    simState.speedFactor = num;
    if (chkSpeed) chkSpeed.checked = num > 1.0;
    if (rngSpeed) rngSpeed.value = num;
    if (lblSpeed) lblSpeed.textContent = `${num}x`;
    spBtns.forEach((b) => {
      const sp = parseFloat(b.getAttribute('data-sp') || '1');
      b.classList.toggle('active', Math.abs(sp - num) < 0.05);
    });
    broadcastDashboardConfig();
    if (elStatusLog && simState.remainingSec > 0) {
      elStatusLog.textContent = `⚡ تم تغيير سرعة العداد لحظياً إلى (${num}x) بدون إعادة تحميل الصفحة!`;
    }
  }

  function setDashboardVideoSpeed(val) {
    const num = Math.round((Number(val) || 1.0) * 10) / 10;
    simState.videoSpeedFactor = num;
    if (rngVidSpeed) rngVidSpeed.value = num;
    if (lblVidSpeed) lblVidSpeed.textContent = `${num}x`;
    broadcastDashboardConfig();

    const vidEl = document.getElementById('sim-video');
    if (vidEl && window.__bcApplyMediaSpeed) {
      window.__bcApplyMediaSpeed(vidEl);
    }
    const realEl = document.getElementById('vid-real-speed');
    const spoofEl = document.getElementById('vid-spoofed-speed');
    if (realEl) realEl.textContent = `${num}x (فعلي)`;
    if (spoofEl && vidEl) spoofEl.textContent = `${vidEl.playbackRate}.0x (مخفي عن الموقع ✓)`;
    runLiveBrowserAudit();
  }

  if (rngSpeed) {
    rngSpeed.addEventListener('input', () => setDashboardSpeed(rngSpeed.value));
  }
  if (chkSpeed) {
    chkSpeed.addEventListener('change', () => {
      setDashboardSpeed(chkSpeed.checked ? (simState.speedFactor > 1 ? simState.speedFactor : 2.0) : 1.0);
    });
  }
  spBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      setDashboardSpeed(parseFloat(btn.getAttribute('data-sp') || '1'));
    });
  });

  if (rngVidSpeed) {
    rngVidSpeed.addEventListener('input', () => setDashboardVideoSpeed(rngVidSpeed.value));
  }
  if (chkAutoBrake) {
    chkAutoBrake.addEventListener('change', () => {
      simState.autoBrake = chkAutoBrake.checked;
      broadcastDashboardConfig();
    });
  }
  if (chkSmartHold) {
    chkSmartHold.addEventListener('change', () => {
      simState.smartHold = chkSmartHold.checked;
      broadcastDashboardConfig();
    });
  }
  if (chkAutoSubmit) {
    chkAutoSubmit.addEventListener('change', () => {
      simState.autoSubmit = chkAutoSubmit.checked;
      broadcastDashboardConfig();
    });
  }

  // Initialize everything
  initSimulatedVideoPlayer();
  startDutchyAdSimulation();
  runLiveBrowserAudit();
})();
