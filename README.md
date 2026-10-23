# ⚡ BraveCount Pro v3.0 — محرك الـ 300 تقنية (Stealth, Cloudflare Shield & Time-Warp)

إضافة متصفح احترافية مبنية بمعيار **Manifest V3** لمتصفح **Brave** وجميع متصفحات Chromium، مصممة للعمل على مواقع الإعلانات والمهام والفيديوهات (مثل **DutchyCorp**، **Aviso YouTube**، **FaucetCrypto**، وجميع مواقع الـ PTC) بدون الحاجة للبقاء داخل التاب أو المتصفح.

---

## 🌟 الأقسام الثلاثة الرئيسية (300 تقنية مدمجة):

### 1. محرك العمل في الخلفية وعدم الاكتشاف (100 طريقة — Stealth Always-Active Engine)
- تثبيت `document.visibilityState = "visible"` و `document.hidden = false` و `document.hasFocus() = true` حتى لو خرجت من التاب أو صغّرت المتصفح في شريط مهام الويندوز.
- اعتراض وحجب أحداث `visibilitychange`, `webkitvisibilitychange`, `blur`, `focusout`, `freeze`, `pagehide`, `mouseleave`, `mouseout` في مرحلة الالتقاط المبكر (`Capture Phase`).
- إخفاء جميع الدوال المعدلة عبر تغليف `Function.prototype.toString` و `WeakMap` لتظهر للموقع كـ `[native code]` أصلية 100%.
- حماية مشغلات **YouTube & Aviso** في الخلفية: منع الإيقاف التلقائي (`pause`)، تزييف `IntersectionObserver` بنسبة `100%`، وتصفير `droppedVideoFrames`.
- منع متصفح Brave من تجميد أو تبطيء التابات الخلفية عبر `Web Locks API` + قناة `AudioContext` صامتة تماماً (`0 Hz`) + مؤقت `Web Worker` خلفي.

### 2. درع العزل ومساعد حل كابتشا Cloudflare Turnstile (100 طريقة — Zero-Interference & Auto-Solver)
- **العزل الجراحي التام (`Zero-Interference Shield`):** انسحاب فوري من أي إطار تابع لـ `challenges.cloudflare.com` أو `/cdn-cgi/challenge-platform/` وعدم لمس مؤقتات أو دوال الكابتشا الداخلية عبر فحص `Call Stack`.
- **الفرملة الذكية التلقائية (`Auto-Brake 1.0x`):** إرجاع السرعة تلقائياً إلى `1.0x` لحظة ظهور كابتشا Cloudflare لنجاح الفحص التلقائي (`Zero-Click Auto-Pass`).
- **محرك النقر الأصلي الموثوق (`Native Trusted Click`):** استخدام `chrome.debugger` لإرسال نقرة ماوس حقيقية 100% (`isTrusted: true`) بمسار بشري طبيعي إذا طلبت الكابتشا الضغط على المربع.
- **الإرسال التلقائي (`Auto-Submit`) واختيار Turnstile:** مراقبة الحقل `cf-turnstile-response` وتفعيل زر المطالبة `Claim / Verify` تلقائياً فور جاهزية الكود.

### 3. محرك تسريع الوقت والفيديوهات وحماية السيرفر (100 طريقة — Time-Warp & Anti-Server-Ban)
- **تغيير السرعة اللحظي (`Live Speed Switching`):** تسريع العدادات الجارية (`1.0x` إلى `20.0x`) لحظياً بدون إعادة تحميل الصفحة، مع مُراكم أجزاء المللي ثانية (`Sub-ms Accumulator`).
- **إخفاء سرعة الفيديو في Aviso (`Video PlaybackRate Stealth`):** تسريع الفيديو فعلياً حتى `16x` مع تزييف قراءة `video.playbackRate` لترجع `1.0` للموقع وحجب حدث `ratechange`!
- **حماية السيرفر الذكية (`Fast-Forward + Smart Hold`):** إنهاء العداد بسرعة لإظهار الكابتشا فوراً، مع انتظار التوقيت الآمن للسيرفر في الخلفية قبل إرسال المطالبة لمنع حظر الحساب.

---

## 🦁 خطوات التركيب على متصفح Brave:
1. افتح متصفح Brave واكتب في شريط العنوان: `brave://extensions`
2. فعّل خيار **Developer mode (وضع المطور)** من أعلى اليمين.
3. اضغط على **Load unpacked (تحميل غير محزم)** واختر مجلد الإضافة (أو فك ضغط ملف `brave-count-pro-v3.zip`).
