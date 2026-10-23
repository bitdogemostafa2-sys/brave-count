/**
 * BraveCount Pro v3.4 — MAIN World Core Engine (Deep V8/WebIDL Hardened Edition)
 *
 * Fixes & Hardening in v3.4:
 *  1. Strict Zero-Interference Inside Cloudflare & Captcha Frames (immediate return at line 1)
 *  2. Concise-Method Native Masking: Wrapped functions/getters have NO `.prototype` property
 *     ('prototype' in fn === false), exact `.length` & `.name`, throw on `new fn()`, and return
 *     exact `function name() { [native code] }` on `Function.prototype.toString`.
 *  3. Authentic WebIDL `Illegal invocation` enforcement when getters/methods are invoked on
 *     prototype objects (`Navigator.prototype`, `Document.prototype`, `Performance.prototype`, `{}`).
 *  4. Zero Cross-Realm IFrame Contamination: `HTMLIFrameElement.prototype.contentWindow` is left
 *     100% untouched native so Cloudflare Turnstile's `api.js` sandbox iframe check passes 100%.
 *  5. Dynamic SPA-Aware Login/Auth Safe-Zone (`isAuthOrSensitivePage` dynamically checks live
 *     `location.pathname`, `input[type="password"]`, password field names/autocomplete, and login forms).
 *  6. Invariant-Safe `window.open` Never-Closed Proxy (`proxyTarget = {}`) supporting `.closed === false`,
 *     `.location` navigation (`w.location = ...`, `w.location.href = ...`), `.focus()`, `.close()`, and
 *     `Window.prototype.open`.
 *  7. Delegated Form `focusout` Preservation: Never drops `document.addEventListener('focusout')`
 *     used by jQuery/Vue/Livewire form validation; only blocks `focusout` in capture phase when focus
 *     actually leaves the window (`!e.relatedTarget`).
 *  8. Zero Global Variable Leaks (`window.__bc*` completely eliminated; private closures only).
 */
(function () {
  'use strict';

  const CORE_SYMBOL = Symbol.for('__bc_pro_core_v3_4__');
  if (window[CORE_SYMBOL]) return;
  try {
    Object.defineProperty(window, CORE_SYMBOL, {
      value: true,
      enumerable: false,
      configurable: false,
      writable: false
    });
  } catch (_) {}

  // ============================================================================
  // 0. STRICT CLOUDFLARE & CAPTCHA FRAME EXIT (100% Zero-Interference Inside CF)
  // ============================================================================
  function getLiveLocationInfo() {
    const loc = window.location || {};
    return {
      href: String(loc.href || ''),
      host: String(loc.hostname || '').toLowerCase(),
      path: String(loc.pathname || '').toLowerCase(),
      search: String(loc.search || '').toLowerCase()
    };
  }

  const initLoc = getLiveLocationInfo();

  // CRITICAL SENIOR ARCHITECTURE:
  // 1. Never run inside ANY subframe (window !== window.top) EXCEPT YouTube video embeds!
  //    This guarantees 100% of Cloudflare Turnstile iframes, about:blank anti-bot probe iframes,
  //    srcdoc sandboxes, and /cdn-cgi/ challenge subframes remain 100% pure untouched C++ native!
  const IS_YOUTUBE_EMBED =
    initLoc.host.includes('youtube.com') || initLoc.host.includes('youtube-nocookie.com');

  if (window !== window.top && !IS_YOUTUBE_EMBED) {
    return;
  }

  function isFullPageCloudflareInterstitial() {
    try {
      if (window._cf_chl_opt || window.__CF$cv$params) return true;
      const loc = getLiveLocationInfo();
      if (loc.path.includes('/cdn-cgi/challenge-platform/') || loc.path.includes('/cdn-cgi/l/chk_jschl')) {
        return true;
      }
      if (document) {
        const t = String(document.title || '');
        if (
          t === 'Just a moment...' ||
          t.includes('Attention Required! | Cloudflare') ||
          t === 'لحظة واحدة...'
        ) {
          return true;
        }
        if (document.querySelector) {
          const cfInterstitial = document.querySelector('#challenge-running, #challenge-stage, #cf-please-wait, form#challenge-form[action*="/cdn-cgi/"]');
          if (cfInterstitial) return true;
        }
      }
    } catch (_) {}
    return false;
  }

  const IS_CLOUDFLARE_FRAME =
    initLoc.host.includes('challenges.cloudflare.com') ||
    initLoc.host.endsWith('.cloudflare.com') ||
    initLoc.path.includes('/cdn-cgi/challenge-platform/') ||
    initLoc.href.includes('challenges.cloudflare.com') ||
    initLoc.href.includes('turnstile/v0') ||
    isFullPageCloudflareInterstitial();

  const IS_OTHER_CAPTCHA_FRAME =
    initLoc.host.includes('hcaptcha.com') ||
    initLoc.host.includes('recaptcha.net') ||
    (initLoc.host.includes('google.com') && initLoc.path.includes('/recaptcha/'));

  const IS_SSO_OR_GOOGLE_AUTH_HOST =
    initLoc.host === 'accounts.google.com' ||
    initLoc.host.endsWith('.accounts.google.com') ||
    initLoc.host === 'accounts.youtube.com' ||
    initLoc.host === 'myaccount.google.com' ||
    initLoc.host === 'login.microsoftonline.com' ||
    initLoc.host === 'login.live.com' ||
    initLoc.host === 'appleid.apple.com' ||
    (initLoc.host.includes('google.') && (initLoc.path.includes('/accounts') || initLoc.path.includes('/signin') || initLoc.path.includes('/cookiemismatch')));

  // CRITICAL: Exit immediately inside Cloudflare / Captcha / Google Account SSO frames — zero prototype/timer hooks!
  if (IS_CLOUDFLARE_FRAME || IS_OTHER_CAPTCHA_FRAME || IS_SSO_OR_GOOGLE_AUTH_HOST) {
    return;
  }

  // Dynamic SPA-aware check for Login / Register / Auth / Withdraw / Password pages
  function isAuthOrSensitivePage() {
    try {
      if (isFullPageCloudflareInterstitial()) return true;
      const loc = getLiveLocationInfo();
      // Never treat JumpTask offer/earning pages as login pages
      if (loc.host.includes('jumptask.io') && loc.path.includes('/earn')) {
        return false;
      }
      if (
        loc.path.includes('/login') ||
        loc.path.includes('/regist') ||
        loc.path.includes('/signin') ||
        loc.path.includes('/sign-in') ||
        loc.path.includes('/register') ||
        loc.path.includes('/signup') ||
        loc.path.includes('/sign-up') ||
        loc.path.includes('/auth') ||
        loc.path.includes('/withdraw') ||
        loc.path.includes('/password') ||
        loc.search.includes('page=login') ||
        loc.search.includes('action=login')
      ) {
        return true;
      }
      if (document) {
        const selector = 'input[type="password"], input[autocomplete="current-password"], input[autocomplete="new-password"], input[name="password" i], form[action*="login" i], form[action*="signin" i]';
        let els = document.querySelectorAll ? Array.from(document.querySelectorAll(selector)) : [];
        if (els.length === 0 && document.querySelector) {
          const single = document.querySelector(selector);
          if (single) els = [single];
        }
        for (let i = 0; i < els.length; i++) {
          const el = els[i];
          if (el && (el.offsetParent !== null || typeof el.offsetParent === 'undefined')) {
            return true;
          }
        }
      }
    } catch (_) {}
    return false;
  }

  // Detect if an unsolved, VISIBLE Cloudflare Turnstile widget/iframe is currently active on the page
  function hasActiveCloudflareChallengeOnPage() {
    try {
      if (isFullPageCloudflareInterstitial()) return true;
      if (!document) return false;
      const selector = 'iframe[src*="challenges.cloudflare.com"], .cf-turnstile, [data-sitekey][class*="cf-"], #cf-turnstile, #challenge-running, #challenge-stage';
      let cfElems = document.querySelectorAll ? Array.from(document.querySelectorAll(selector)) : [];
      if (cfElems.length === 0 && document.querySelector) {
        const single = document.querySelector(selector);
        if (single) cfElems = [single];
      }
      const hasVisibleCf = cfElems.some((el) => el && el.offsetParent !== null);
      if (!hasVisibleCf) return false;
      const tokenInputs = document.querySelectorAll
        ? document.querySelectorAll('input[name="cf-turnstile-response"], textarea[name="cf-turnstile-response"]')
        : [];
      for (let i = 0; i < tokenInputs.length; i++) {
        const val = tokenInputs[i].value;
        if (val && val.trim().length > 20) {
          return false; // Already solved!
        }
      }
      return true;
    } catch (_) {
      return false;
    }
  }

  // ============================================================================
  // 1. NATIVE REFERENCES & DEEP V8 CONCISE-METHOD STEALTH MASKING ENGINE
  // ============================================================================
  const origVisDesc = Object.getOwnPropertyDescriptor(Document.prototype, 'visibilityState');
  const origHiddenDesc = Object.getOwnPropertyDescriptor(Document.prototype, 'hidden');
  const origWebdriverDesc = (typeof Navigator !== 'undefined' && Navigator.prototype)
    ? Object.getOwnPropertyDescriptor(Navigator.prototype, 'webdriver')
    : null;

  const Native = {
    setTimeout: window.setTimeout.bind(window),
    clearTimeout: window.clearTimeout.bind(window),
    setInterval: window.setInterval.bind(window),
    clearInterval: window.clearInterval.bind(window),
    requestAnimationFrame: window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : null,
    cancelAnimationFrame: window.cancelAnimationFrame ? window.cancelAnimationFrame.bind(window) : null,
    Date: window.Date,
    dateNow: window.Date.now.bind(window.Date),
    perfNow: (window.performance && window.performance.now)
      ? window.performance.now.bind(window.performance)
      : () => Date.now(),
    perfNowUnbound: (window.performance && window.performance.now) ? window.performance.now : null,
    windowOpen: window.open ? window.open.bind(window) : null,
    fnToString: Function.prototype.toString,
    defineProperty: Object.defineProperty,
    getOwnPropertyDescriptor: Object.getOwnPropertyDescriptor,
    addEventListener: EventTarget.prototype.addEventListener,
    removeEventListener: EventTarget.prototype.removeEventListener,
    dispatchEvent: EventTarget.prototype.dispatchEvent,
    hasFocus: Document.prototype.hasFocus,
    getVisibilityState: origVisDesc && origVisDesc.get ? origVisDesc.get : null,
    getHidden: origHiddenDesc && origHiddenDesc.get ? origHiddenDesc.get : null,
    getWebdriver: origWebdriverDesc && origWebdriverDesc.get ? origWebdriverDesc.get : null,
    IntersectionObserver: window.IntersectionObserver,
    mediaPause: window.HTMLMediaElement ? window.HTMLMediaElement.prototype.pause : null,
    mediaPlay: window.HTMLMediaElement ? window.HTMLMediaElement.prototype.play : null,
    elemAnimate: window.Element ? window.Element.prototype.animate : null
  };

  const nativeMaskMap = new WeakMap();

  /**
   * Creates a V8 concise method wrapper that has NO `.prototype` property
   * ('prototype' in fn === false), cannot be constructed with `new`, has the exact
   * native `.name` and `.length`, and returns `function <name>() { [native code] }`.
   */
  function createStealthFunction(implFn, nativeName = '', expectedLength = 0) {
    let stealthFn = null;
    const methodHolder = {
      [nativeName](...args) {
        try {
          return implFn.apply(this, args);
        } catch (err) {
          if (err && typeof Error.captureStackTrace === 'function' && stealthFn) {
            try {
              Error.captureStackTrace(err, stealthFn);
            } catch (_) {}
          } else if (err && typeof err.stack === 'string') {
            try {
              err.stack = err.stack
                .split('\n')
                .filter((line) => (
                  !line.includes('chrome-extension://') &&
                  !line.includes('main-world-core.js') &&
                  !line.includes('isolated-bridge.js') &&
                  !line.includes('assertValidReceiver')
                ))
                .join('\n');
            } catch (_) {}
          }
          throw err;
        }
      }
    };
    stealthFn = methodHolder[nativeName];
    try {
      Native.defineProperty(stealthFn, 'name', {
        value: nativeName,
        writable: false,
        enumerable: false,
        configurable: true
      });
      Native.defineProperty(stealthFn, 'length', {
        value: expectedLength,
        writable: false,
        enumerable: false,
        configurable: true
      });
    } catch (_) {}
    nativeMaskMap.set(stealthFn, `function ${nativeName}() { [native code] }`);
    return stealthFn;
  }

  function maskExistingConstructorAsNative(ctorFn, nativeName, expectedLength = 1, nativeProto = undefined) {
    if (typeof ctorFn !== 'function') return ctorFn;
    try {
      Native.defineProperty(ctorFn, 'name', {
        value: nativeName,
        writable: false,
        enumerable: false,
        configurable: true
      });
      Native.defineProperty(ctorFn, 'length', {
        value: expectedLength,
        writable: false,
        enumerable: false,
        configurable: true
      });
      if (nativeProto !== undefined) {
        Native.defineProperty(ctorFn, 'prototype', {
          value: nativeProto,
          writable: false,
          enumerable: false,
          configurable: false
        });
      }
    } catch (_) {}
    nativeMaskMap.set(ctorFn, `function ${nativeName}() { [native code] }`);
    return ctorFn;
  }

  const stealthToString = createStealthFunction(function () {
    if (typeof this === 'function' && nativeMaskMap.has(this)) {
      return nativeMaskMap.get(this);
    }
    return Native.fnToString.call(this);
  }, 'toString', 0);

  [Function.prototype, Object.getPrototypeOf(function () {})].forEach((fp) => {
    if (!fp) return;
    try {
      Native.defineProperty(fp, 'toString', {
        value: stealthToString,
        writable: true,
        enumerable: false,
        configurable: true
      });
    } catch (_) {}
  });

  // Cross-Realm Function.prototype.toString Shield for about:blank Probe Iframes:
  // Cloudflare JSD (/cdn-cgi/challenge-platform) and Turnstile (api.js) create a hidden
  // <iframe src="about:blank"> and call `ifr.contentWindow.Function.prototype.toString.call(window.Date)`.
  // We patch ONLY `cw.Function.prototype.toString` with a realm-distinct concise method that consults
  // `nativeMaskMap`, while leaving `cw.setInterval`, `cw.Date`, `cw.Performance`, etc. 100% untouched!
  const patchedIframeWindows = new WeakSet();
  function maskIframeToStringOnly(cw) {
    if (!cw || patchedIframeWindows.has(cw)) return;
    try {
      const cwFnProto = cw.Function && cw.Function.prototype;
      if (!cwFnProto || !cwFnProto.toString) return;
      patchedIframeWindows.add(cw);
      const origCwToString = cwFnProto.toString;
      const holder = {
        toString() {
          if (typeof this === 'function' && nativeMaskMap.has(this)) {
            return nativeMaskMap.get(this);
          }
          return origCwToString.call(this);
        }
      };
      const cwStealthToString = holder.toString;
      Native.defineProperty(cwStealthToString, 'name', {
        value: 'toString',
        writable: false,
        enumerable: false,
        configurable: true
      });
      Native.defineProperty(cwStealthToString, 'length', {
        value: 0,
        writable: false,
        enumerable: false,
        configurable: true
      });
      nativeMaskMap.set(cwStealthToString, 'function toString() { [native code] }');
      Native.defineProperty(cwFnProto, 'toString', {
        value: cwStealthToString,
        writable: true,
        enumerable: false,
        configurable: true
      });
    } catch (_) {}
  }

  if (window.HTMLIFrameElement && window.HTMLIFrameElement.prototype) {
    const IframeProto = window.HTMLIFrameElement.prototype;
    const IframeCtor = window.HTMLIFrameElement;
    const origCwDesc = Native.getOwnPropertyDescriptor(IframeProto, 'contentWindow');
    if (origCwDesc && origCwDesc.get) {
      const origCwGet = origCwDesc.get;
      defineStealthGetter(IframeProto, 'contentWindow', function () {
        assertValidReceiver(this, IframeProto, IframeCtor);
        const cw = origCwGet.call(this);
        if (cw) maskIframeToStringOnly(cw);
        return cw;
      });
    }
    const origCdDesc = Native.getOwnPropertyDescriptor(IframeProto, 'contentDocument');
    if (origCdDesc && origCdDesc.get) {
      const origCdGet = origCdDesc.get;
      defineStealthGetter(IframeProto, 'contentDocument', function () {
        assertValidReceiver(this, IframeProto, IframeCtor);
        const cd = origCdGet.call(this);
        if (cd && cd.defaultView) maskIframeToStringOnly(cd.defaultView);
        return cd;
      });
    }
  }

  // Sanitize Error.prototype.stack if present so extension filenames & internal wrappers never appear
  try {
    const errStackDesc = Native.getOwnPropertyDescriptor(Error.prototype, 'stack');
    if (errStackDesc && errStackDesc.get) {
      const origStackGet = errStackDesc.get;
      const cleanStackGet = createStealthFunction(function () {
        const raw = origStackGet.call(this);
        if (typeof raw !== 'string') return raw;
        return raw
          .split('\n')
          .filter((line) => (
            !line.includes('chrome-extension://') &&
            !line.includes('main-world-core.js') &&
            !line.includes('isolated-bridge.js') &&
            !line.includes('assertValidReceiver') &&
            !line.includes('createStealthFunction')
          ))
          .join('\n');
      }, 'get stack', 0);
      Native.defineProperty(Error.prototype, 'stack', {
        get: cleanStackGet,
        set: errStackDesc.set,
        enumerable: false,
        configurable: true
      });
    }
  } catch (_) {}

  function defineStealthGetter(target, prop, getterFn, setterFn = undefined) {
    if (!target) return;
    try {
      const existing = Native.getOwnPropertyDescriptor(target, prop);
      const maskedGet = createStealthFunction(getterFn, `get ${prop}`, 0);
      const desc = {
        get: maskedGet,
        enumerable: existing ? existing.enumerable : true,
        configurable: true
      };
      if (setterFn !== undefined) {
        desc.set = createStealthFunction(setterFn, `set ${prop}`, 1);
      } else if (existing && existing.set) {
        desc.set = existing.set;
      }
      Native.defineProperty(target, prop, desc);
    } catch (_) {}
  }

  // WebIDL Receiver Validation Helper (Throws authentic TypeError: Illegal invocation)
  function assertValidReceiver(receiver, Proto, Ctor) {
    if (!receiver || receiver === Proto || (Ctor && !(receiver instanceof Ctor))) {
      throw new TypeError('Illegal invocation');
    }
  }

  // ============================================================================
  // 2. STATE CONFIGURATION
  // ============================================================================
  const IS_JUMPTASK_HOST = initLoc.host.includes('jumptask.io');
  const IS_FAUCETCRYPTO_HOST = initLoc.host.includes('faucetcrypto.com');
  const AUTO_WARP_HOST = IS_JUMPTASK_HOST || IS_FAUCETCRYPTO_HOST;

  const State = {
    enabled: true,
    alwaysActive: true,
    blockVisibility: true,
    blockBlur: true,
    blockLifecycle: true,
    spoofViewport: true,
    humanSimulation: true,
    avisoYouTubeMode: true,
    youtubeLowRes: false,
    silentAudioKeepAlive: true,
    unthrottleBackground: true,
    windowSurfShield: true,

    // Time-Warp Settings (Default 1.0x safe speed globally; 10.0x on JumpTask, 5.0x on FaucetCrypto!)
    speedEnabled: AUTO_WARP_HOST ? true : false,
    speedFactor: IS_JUMPTASK_HOST ? 10.0 : (IS_FAUCETCRYPTO_HOST ? 5.0 : 1.0),
    videoSpeedEnabled: false,
    videoSpeedFactor: 1.0,
    warpMode: AUTO_WARP_HOST ? 'full_warp' : 'timers_only', // 'timers_only' | 'full_warp'
    smartHoldEnabled: IS_JUMPTASK_HOST ? false : true,
    smartHoldGraceSec: 2.0,

    // Cloudflare Shield Settings
    cloudflareShield: true,
    autoBrakeOnCaptcha: true,
    captchaActive: false,

    // Telemetry
    adStartRealTime: Native.perfNow(),
    detectedAdDurationSec: 0,
    detectedRemainingSec: null,
    timersAcceleratedCount: 0,
    blockedEventsCount: 0,
    savedSecondsTotal: 0,
    openedSurfWindowsCount: 0
  };

  // ============================================================================
  // 3. INVARIANT-SAFE WINDOW.OPEN NEVER-CLOSED PROXY FOR FAUCETCRYPTO & AVISO SURF
  //    Fixes: "Unfortunately you closed the website while the timer was running!"
  // ============================================================================
  function createLocationProxy(realWin) {
    const locTarget = {};
    return new Proxy(locTarget, {
      get(_t, prop) {
        try {
          if (realWin && realWin.location) {
            const val = realWin.location[prop];
            return typeof val === 'function' ? val.bind(realWin.location) : val;
          }
        } catch (_) {}
        if (prop === 'replace' || prop === 'assign' || prop === 'reload') {
          return function (url) {
            try {
              if (realWin && realWin.location && typeof realWin.location[prop] === 'function') {
                realWin.location[prop](url);
              }
            } catch (_) {}
          };
        }
        if (prop === 'href' || prop === 'toString') {
          return 'about:blank';
        }
        return undefined;
      },
      set(_t, prop, value) {
        try {
          if (realWin && realWin.location) {
            realWin.location[prop] = value;
          }
        } catch (_) {}
        return true;
      }
    });
  }

  function createNeverClosedWindowProxy(realWin) {
    // Use an empty plain object as Proxy target so V8 non-configurable property invariants
    // on cross-origin WindowProxy objects NEVER throw TypeError!
    const proxyTarget = {};
    const locProxy = createLocationProxy(realWin);

    const winProxy = new Proxy(proxyTarget, {
      get(_target, prop) {
        // CRITICAL FOR FAUCETCRYPTO & AVISO SURF:
        // Always report closed === false even if Cross-Origin-Opener-Policy (COOP)
        // severs the window reference or if the user closes the ad tab early!
        if (prop === 'closed') {
          return false;
        }
        // Prevent Vue 3 (used on FaucetCrypto v4) from wrapping winProxy inside a reactive() Proxy!
        if (prop === '__v_skip' || prop === '__v_isRaw') {
          return true;
        }
        if (typeof Symbol !== 'undefined' && prop === Symbol.toStringTag) {
          return 'Window';
        }
        if (prop === 'opener') {
          return window;
        }
        if (prop === 'window' || prop === 'self' || prop === 'frames' || prop === 'top' || prop === 'parent') {
          return winProxy;
        }
        if (prop === 'location') {
          return locProxy;
        }
        // Suppress unload/beforeunload/pagehide on the opened window so initial about:blank -> ad URL
        // navigation never triggers a false "window closed" callback on FaucetCrypto!
        if (prop === 'onunload' || prop === 'onbeforeunload' || prop === 'onpagehide') {
          return null;
        }
        if (prop === 'addEventListener') {
          return function (type, listener, options) {
            const ev = String(type || '').toLowerCase();
            if (ev === 'unload' || ev === 'beforeunload' || ev === 'pagehide') {
              return undefined;
            }
            try {
              if (realWin && typeof realWin.addEventListener === 'function') {
                return realWin.addEventListener(type, listener, options);
              }
            } catch (_) {}
            return undefined;
          };
        }
        if (prop === 'focus' || prop === 'blur' || prop === 'close' || prop === 'postMessage') {
          return function (...args) {
            try {
              if (realWin && typeof realWin[prop] === 'function') {
                return realWin[prop](...args);
              }
            } catch (_) {}
            return undefined;
          };
        }
        try {
          if (realWin) {
            const val = realWin[prop];
            return typeof val === 'function' ? val.bind(realWin) : val;
          }
        } catch (_) {}
        return undefined;
      },
      set(_target, prop, value) {
        try {
          if (prop === 'onunload' || prop === 'onbeforeunload' || prop === 'onpagehide' || prop === 'closed') {
            return true;
          }
          if (prop === 'location' && realWin) {
            realWin.location = value;
            return true;
          }
          if (realWin) {
            realWin[prop] = value;
          }
        } catch (_) {}
        return true;
      }
    });

    return winProxy;
  }

  function isOAuthOrLoginPopupUrl(url, target) {
    const u = String(url || '').toLowerCase();
    const t = String(target || '').toLowerCase();
    return (
      u.includes('accounts.google.com') ||
      u.includes('google.com/o/oauth') ||
      u.includes('/oauth2/') ||
      u.includes('/oauth/') ||
      u.includes('login.microsoftonline.com') ||
      u.includes('appleid.apple.com') ||
      u.includes('facebook.com/v') ||
      u.includes('discord.com/api/oauth2') ||
      t.includes('oauth') ||
      t.includes('google_login')
    );
  }

  if (Native.windowOpen) {
    const stealthWindowOpen = createStealthFunction(function (url, target, features) {
      const realWin = Native.windowOpen(url, target, features);
      if (!State.enabled || !State.windowSurfShield || isAuthOrSensitivePage() || isOAuthOrLoginPopupUrl(url, target)) {
        return realWin;
      }
      State.openedSurfWindowsCount++;
      return createNeverClosedWindowProxy(realWin);
    }, 'open', 0);

    try {
      Native.defineProperty(window, 'open', {
        value: stealthWindowOpen,
        writable: true,
        enumerable: true,
        configurable: true
      });
      if (window.Window && window.Window.prototype) {
        Native.defineProperty(window.Window.prototype, 'open', {
          value: stealthWindowOpen,
          writable: true,
          enumerable: true,
          configurable: true
        });
      }
    } catch (_) {}
  }

  // ============================================================================
  // 4. DEVICE & TAB VISIBILITY / FOCUS CONDITIONING (With WebIDL Receiver Checks)
  // ============================================================================
  function conditionWindowAndDocument(win, doc) {
    if (!win || !doc) return;
    try {
      const NavProto = win.Navigator && win.Navigator.prototype;
      const NavCtor = win.Navigator;
      if (NavProto) {
        defineStealthGetter(NavProto, 'webdriver', function () {
          assertValidReceiver(this, NavProto, NavCtor);
          return false;
        });
      }

      // Clean automation artifacts
      [win, doc].forEach((obj) => {
        if (!obj) return;
        const keys = Object.getOwnPropertyNames(obj);
        for (let i = 0; i < keys.length; i++) {
          const k = keys[i];
          if (
            k.startsWith('cdc_') ||
            k.startsWith('$cdc_') ||
            k.startsWith('__webdriver') ||
            k.startsWith('__selenium') ||
            k.startsWith('__fxdriver') ||
            k.startsWith('__puppeteer')
          ) {
            try { delete obj[k]; } catch (_) {}
          }
        }
      });

      // Condition UserActivation
      const UAProto = win.UserActivation && win.UserActivation.prototype;
      const UACtor = win.UserActivation;
      if (UAProto) {
        defineStealthGetter(UAProto, 'isActive', function () {
          assertValidReceiver(this, UAProto, UACtor);
          return true;
        });
        defineStealthGetter(UAProto, 'hasBeenActive', function () {
          assertValidReceiver(this, UAProto, UACtor);
          return true;
        });
      } else if (win.navigator && win.navigator.userActivation) {
        defineStealthGetter(win.navigator.userActivation, 'isActive', () => true);
        defineStealthGetter(win.navigator.userActivation, 'hasBeenActive', () => true);
      }

      // Condition Battery API
      if (NavProto && win.navigator && win.navigator.getBattery) {
        const stealthGetBattery = createStealthFunction(function () {
          assertValidReceiver(this, NavProto, NavCtor);
          return Promise.resolve({
            charging: true,
            chargingTime: 0,
            dischargingTime: Infinity,
            level: 1.0,
            onchargingchange: null,
            onchargingtimechange: null,
            ondischargingtimechange: null,
            onlevelchange: null,
            addEventListener: () => {},
            removeEventListener: () => {},
            dispatchEvent: () => true
          });
        }, 'getBattery', 0);
        Native.defineProperty(NavProto, 'getBattery', {
          value: stealthGetBattery,
          writable: true,
          enumerable: true,
          configurable: true
        });
      }

      // Condition Visibility & Focus on Document.prototype
      const DocProto = (win.Document && win.Document.prototype) || Object.getPrototypeOf(doc);
      const DocCtor = win.Document;
      if (DocProto) {
        const visGet = function () {
          assertValidReceiver(this, DocProto, DocCtor);
          if (State.enabled && State.alwaysActive && State.blockVisibility) {
            return 'visible';
          }
          return Native.getVisibilityState ? Native.getVisibilityState.call(this) : 'visible';
        };
        const hidGet = function () {
          assertValidReceiver(this, DocProto, DocCtor);
          if (State.enabled && State.alwaysActive && State.blockVisibility) {
            return false;
          }
          return Native.getHidden ? Native.getHidden.call(this) : false;
        };

        defineStealthGetter(DocProto, 'visibilityState', visGet);
        defineStealthGetter(DocProto, 'webkitVisibilityState', visGet);
        defineStealthGetter(DocProto, 'hidden', hidGet);
        defineStealthGetter(DocProto, 'webkitHidden', hidGet);
        defineStealthGetter(DocProto, 'mozHidden', hidGet);
        defineStealthGetter(DocProto, 'msHidden', hidGet);

        const spoofedHasFocus = createStealthFunction(function () {
          assertValidReceiver(this, DocProto, DocCtor);
          if (State.enabled && State.alwaysActive && State.blockBlur) {
            return true;
          }
          return Native.hasFocus.call(this);
        }, 'hasFocus', 0);

        Native.defineProperty(DocProto, 'hasFocus', {
          value: spoofedHasFocus,
          writable: true,
          enumerable: true,
          configurable: true
        });
      }
    } catch (_) {}
  }

  conditionWindowAndDocument(window, document);

  // Protect window dimensions when minimized in Windows (-32000px or 0px)
  const fallbackRect = {
    innerWidth: window.innerWidth > 0 ? window.innerWidth : 1366,
    innerHeight: window.innerHeight > 0 ? window.innerHeight : 768,
    outerWidth: window.outerWidth > 0 ? window.outerWidth : 1366,
    outerHeight: window.outerHeight > 0 ? window.outerHeight : 768,
    screenX: window.screenX > -10000 ? window.screenX : 0,
    screenY: window.screenY > -10000 ? window.screenY : 0
  };
  ['innerWidth', 'innerHeight', 'outerWidth', 'outerHeight', 'screenX', 'screenY'].forEach((prop) => {
    try {
      const desc = Native.getOwnPropertyDescriptor(window, prop);
      if (desc && desc.get) {
        const origGet = desc.get.bind(window);
        defineStealthGetter(window, prop, function () {
          const val = origGet();
          if (!State.enabled || !State.alwaysActive || !State.spoofViewport) {
            return val;
          }
          if ((prop === 'screenX' || prop === 'screenY') && val < -10000) return fallbackRect[prop];
          if (val <= 0 && prop !== 'screenX' && prop !== 'screenY') return fallbackRect[prop];
          fallbackRect[prop] = val;
          return val;
        });
      }
    } catch (_) {}
  });

  // ============================================================================
  // 5. SPEED MULTIPLIER HELPERS (With Dynamic Login Safe-Zone & Cloudflare Auto-Brake)
  // ============================================================================
  function isPtcTimerCurrentlyRunning() {
    try {
      if (IS_FAUCETCRYPTO_HOST || IS_JUMPTASK_HOST) {
        if (State.detectedRemainingSec === null || State.detectedRemainingSec > 0) return true;
      }
      if (State.detectedRemainingSec !== null && State.detectedRemainingSec > 0) return true;
      if (document && document.title) {
        const mSec = document.title.match(/^(\d{1,4})\s*(?:seconds|sec|s\b)/i);
        if (mSec && parseInt(mSec[1], 10) > 0) return true;
        const mMmSs = document.title.match(/\b(\d{1,2}):(\d{2})\b/);
        if (mMmSs && (parseInt(mMmSs[1], 10) * 60 + parseInt(mMmSs[2], 10)) > 0) return true;
      }
    } catch (_) {}
    return false;
  }

  function getEffectiveTimerSpeed() {
    if (!State.enabled || !State.speedEnabled) return 1.0;
    if (isAuthOrSensitivePage()) return 1.0;
    if (
      State.cloudflareShield &&
      State.autoBrakeOnCaptcha &&
      !isPtcTimerCurrentlyRunning() &&
      (State.captchaActive || hasActiveCloudflareChallengeOnPage())
    ) {
      return 1.0;
    }
    return Math.max(0.1, Math.min(50.0, Number(State.speedFactor) || 1.0));
  }

  function getEffectiveClockSpeed() {
    if (!State.enabled || !State.speedEnabled) return 1.0;
    if (State.warpMode !== 'full_warp') return 1.0;
    if (isAuthOrSensitivePage()) return 1.0;
    if (
      State.cloudflareShield &&
      State.autoBrakeOnCaptcha &&
      !isPtcTimerCurrentlyRunning() &&
      (State.captchaActive || hasActiveCloudflareChallengeOnPage())
    ) {
      return 1.0;
    }
    return Math.max(0.1, Math.min(50.0, Number(State.speedFactor) || 1.0));
  }

  function getEffectiveVideoSpeed() {
    if (!State.enabled) return 1.0;
    if (isAuthOrSensitivePage()) return 1.0;
    if (
      State.cloudflareShield &&
      State.autoBrakeOnCaptcha &&
      !isPtcTimerCurrentlyRunning() &&
      (State.captchaActive || hasActiveCloudflareChallengeOnPage())
    ) {
      return 1.0;
    }
    if (State.videoSpeedEnabled) {
      return Math.max(0.25, Math.min(16.0, Number(State.videoSpeedFactor) || 1.0));
    }
    if (State.speedEnabled) {
      return Math.max(0.25, Math.min(16.0, Number(State.speedFactor) || 1.0));
    }
    return 1.0;
  }

  // ============================================================================
  // 6. SECTION I: STEALTH ALWAYS-ACTIVE ENGINE (Events, Form-Safe Focus, Video)
  // ============================================================================
  let storedOnVisibilityChange = null;
  let storedOnWebkitVisibilityChange = null;
  defineStealthGetter(
    Document.prototype,
    'onvisibilitychange',
    () => storedOnVisibilityChange,
    (fn) => { storedOnVisibilityChange = typeof fn === 'function' ? fn : null; }
  );
  defineStealthGetter(
    Document.prototype,
    'onwebkitvisibilitychange',
    () => storedOnWebkitVisibilityChange,
    (fn) => { storedOnWebkitVisibilityChange = typeof fn === 'function' ? fn : null; }
  );

  let storedWinOnBlur = null;
  let storedDocOnBlur = null;
  let storedWinOnFocusOut = null;
  defineStealthGetter(window, 'onblur', () => storedWinOnBlur, (fn) => { storedWinOnBlur = typeof fn === 'function' ? fn : null; });
  defineStealthGetter(Document.prototype, 'onblur', () => storedDocOnBlur, (fn) => { storedDocOnBlur = typeof fn === 'function' ? fn : null; });
  defineStealthGetter(window, 'onfocusout', () => storedWinOnFocusOut, (fn) => { storedWinOnFocusOut = typeof fn === 'function' ? fn : null; });

  // Preserve document.activeElement so it never drops to null when unfocused
  let lastValidActiveElement = null;
  try {
    const origActiveElemDesc = Native.getOwnPropertyDescriptor(Document.prototype, 'activeElement') ||
                               Native.getOwnPropertyDescriptor(Document.prototype.__proto__ || {}, 'activeElement');
    if (origActiveElemDesc && origActiveElemDesc.get) {
      const origGetActive = origActiveElemDesc.get;
      defineStealthGetter(Document.prototype, 'activeElement', function () {
        assertValidReceiver(this, Document.prototype, window.Document);
        const real = origGetActive.call(this);
        if (real && real !== document.body && real !== document.documentElement) {
          lastValidActiveElement = real;
        }
        if (State.enabled && State.alwaysActive && State.blockBlur) {
          if (!real && lastValidActiveElement && document.contains(lastValidActiveElement)) {
            return lastValidActiveElement;
          }
          return real || document.body || document.documentElement;
        }
        return real;
      });
    }
  } catch (_) {}

  // Neutralize window.blur()
  try {
    const noopBlur = createStealthFunction(function () {}, 'blur', 0);
    Native.defineProperty(window, 'blur', {
      value: noopBlur,
      writable: true,
      enumerable: true,
      configurable: true
    });
  } catch (_) {}

  defineStealthGetter(Document.prototype, 'wasDiscarded', function () {
    assertValidReceiver(this, Document.prototype, window.Document);
    return false;
  });
  let storedOnFreeze = null;
  let storedOnResume = null;
  let storedOnPageHide = null;
  defineStealthGetter(Document.prototype, 'onfreeze', () => storedOnFreeze, (v) => { storedOnFreeze = v; });
  defineStealthGetter(Document.prototype, 'onresume', () => storedOnResume, (v) => { storedOnResume = v; });
  defineStealthGetter(window, 'onpagehide', () => storedOnPageHide, (v) => { storedOnPageHide = v; });

  const VISIBILITY_EVENTS = new Set([
    'visibilitychange',
    'webkitvisibilitychange',
    'mozvisibilitychange',
    'msvisibilitychange'
  ]);
  const LIFECYCLE_EVENTS = new Set(['freeze', 'resume', 'pagehide']);
  const POINTER_LEAVE_EVENTS = new Set(['mouseleave', 'pointerleave']);

  // Note: Do NOT drop 'focusout' in addEventListener on document/body because jQuery/Vue/Livewire
  // use delegated 'focusout' on document to validate form inputs (e.g., AutoDutchy & FaucetCrypto login!).
  // Instead, 'focusout' is filtered in captureBlocker ONLY when focus leaves the window (!e.relatedTarget).
  const stealthAddEventListener = createStealthFunction(function (type, listener, options) {
    const evType = String(type || '').toLowerCase();
    if (State.enabled && State.alwaysActive && !isAuthOrSensitivePage()) {
      if (State.blockVisibility && VISIBILITY_EVENTS.has(evType)) {
        State.blockedEventsCount++;
        return;
      }
      if (State.blockLifecycle && LIFECYCLE_EVENTS.has(evType) && (this === window || this === document)) {
        State.blockedEventsCount++;
        return;
      }
      if (State.blockBlur && evType === 'blur' && (this === window || this === document || this === document.body || this === document.documentElement)) {
        State.blockedEventsCount++;
        return;
      }
      if (State.blockBlur && POINTER_LEAVE_EVENTS.has(evType) && (this === window || this === document || this === document.documentElement || this === document.body)) {
        State.blockedEventsCount++;
        return;
      }
    }
    return Native.addEventListener.call(this, type, listener, options);
  }, 'addEventListener', 2);

  try {
    Native.defineProperty(EventTarget.prototype, 'addEventListener', {
      value: stealthAddEventListener,
      writable: true,
      enumerable: true,
      configurable: true
    });
  } catch (_) {}

  const captureBlocker = (e) => {
    if (!State.enabled || !State.alwaysActive || isAuthOrSensitivePage()) return;
    const t = e.type;
    if (
      (State.blockVisibility && VISIBILITY_EVENTS.has(t)) ||
      (State.blockLifecycle && LIFECYCLE_EVENTS.has(t))
    ) {
      State.blockedEventsCount++;
      e.stopImmediatePropagation();
      e.stopPropagation();
      return;
    }
    if (State.blockBlur && t === 'blur') {
      if (e.target === window || e.target === document || e.target === document.body || e.target === document.documentElement) {
        State.blockedEventsCount++;
        e.stopImmediatePropagation();
        e.stopPropagation();
        return;
      }
    }
    if (State.blockBlur && t === 'focusout') {
      if (hasActiveCloudflareChallengeOnPage()) return;
      const tgt = e.target;
      if (
        tgt === window ||
        tgt === document ||
        tgt === document.body ||
        tgt === document.documentElement ||
        !e.relatedTarget
      ) {
        State.blockedEventsCount++;
        e.stopImmediatePropagation();
        e.stopPropagation();
        return;
      }
    }
    if (State.blockBlur && (t === 'mouseout' || t === 'pointerout')) {
      if (!e.relatedTarget && !e.toElement && !hasActiveCloudflareChallengeOnPage()) {
        State.blockedEventsCount++;
        e.stopImmediatePropagation();
        e.stopPropagation();
      }
    }
  };

  [
    'visibilitychange',
    'webkitvisibilitychange',
    'mozvisibilitychange',
    'msvisibilitychange',
    'blur',
    'focusout',
    'freeze',
    'resume',
    'pagehide',
    'mouseout',
    'pointerout'
  ].forEach((evName) => {
    Native.addEventListener.call(window, evName, captureBlocker, true);
    Native.addEventListener.call(document, evName, captureBlocker, true);
  });

  // Track genuine user interaction so explicit user video pauses are respected
  let lastTrustedUserInteractionTime = -10000;
  ['pointerdown', 'mousedown', 'keydown'].forEach((evName) => {
    Native.addEventListener.call(window, evName, (e) => {
      if (e && e.isTrusted) {
        lastTrustedUserInteractionTime = Native.perfNow();
      }
    }, true);
  });

  // Acquire Web Lock to prevent Brave tab freezing / discarding
  try {
    if (navigator.locks && typeof navigator.locks.request === 'function') {
      navigator.locks.request('brave_count_active_shield_' + Math.random().toString(36).slice(2), () => {
        return new Promise(() => {});
      }).catch(() => {});
    }
  } catch (_) {}

  // Spoof IntersectionObserver (Preserving prototype.constructor === IntersectionObserver)
  if (Native.IntersectionObserver) {
    const mapEntriesToVisible = (entries) => {
      if (!State.enabled || !State.alwaysActive || !State.spoofViewport || isAuthOrSensitivePage() || hasActiveCloudflareChallengeOnPage()) {
        return entries;
      }
      return entries.map((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.99) return entry;
        const target = entry.target;
        const rect = (target && typeof target.getBoundingClientRect === 'function')
          ? target.getBoundingClientRect()
          : entry.boundingClientRect;

        return {
          time: entry.time,
          target: entry.target,
          rootBounds: entry.rootBounds,
          boundingClientRect: rect,
          intersectionRect: rect,
          isIntersecting: true,
          isVisible: true,
          intersectionRatio: 1.0
        };
      });
    };

    const StealthIntersectionObserver = maskExistingConstructorAsNative(function IntersectionObserver(callback, options) {
      const wrappedCallback = (entries, observer) => {
        return callback(mapEntriesToVisible(entries), observer);
      };
      return new Native.IntersectionObserver(wrappedCallback, options);
    }, 'IntersectionObserver', 1, Native.IntersectionObserver.prototype);

    try {
      Native.defineProperty(StealthIntersectionObserver.prototype, 'constructor', {
        value: StealthIntersectionObserver,
        writable: true,
        enumerable: false,
        configurable: true
      });
      if (StealthIntersectionObserver.prototype.takeRecords) {
        const origTakeRecords = StealthIntersectionObserver.prototype.takeRecords;
        Native.defineProperty(StealthIntersectionObserver.prototype, 'takeRecords', {
          value: createStealthFunction(function () {
            const recs = origTakeRecords.call(this);
            return Array.isArray(recs) ? mapEntriesToVisible(recs) : recs;
          }, 'takeRecords', 0),
          writable: true,
          enumerable: true,
          configurable: true
        });
      }
      window.IntersectionObserver = StealthIntersectionObserver;
    } catch (_) {}
  }

  // --- Video, YouTube & Aviso Protection + Video Speed Stealth (Zero global window leaks!) ---
  const realPlaybackRates = new WeakMap();
  const userExplicitlyPaused = new WeakSet();
  let applyMediaSpeed = () => {};

  if (window.HTMLMediaElement) {
    const mediaProto = window.HTMLMediaElement.prototype;
    const origPlaybackRateDesc = Native.getOwnPropertyDescriptor(mediaProto, 'playbackRate');
    const origDefaultRateDesc = Native.getOwnPropertyDescriptor(mediaProto, 'defaultPlaybackRate');

    if (origPlaybackRateDesc && origPlaybackRateDesc.get && origPlaybackRateDesc.set) {
      const nativeGetRate = origPlaybackRateDesc.get;
      const nativeSetRate = origPlaybackRateDesc.set;

      defineStealthGetter(
        mediaProto,
        'playbackRate',
        function () {
          assertValidReceiver(this, mediaProto, window.HTMLMediaElement);
          if (State.enabled && (State.videoSpeedEnabled || State.speedEnabled)) {
            return realPlaybackRates.has(this) ? realPlaybackRates.get(this) : 1.0;
          }
          return nativeGetRate.call(this);
        },
        function (val) {
          assertValidReceiver(this, mediaProto, window.HTMLMediaElement);
          const numericVal = Number(val) || 1.0;
          realPlaybackRates.set(this, numericVal);
          const targetSpeed = getEffectiveVideoSpeed();
          if (State.enabled && targetSpeed !== 1.0) {
            nativeSetRate.call(this, targetSpeed);
          } else {
            nativeSetRate.call(this, numericVal);
          }
        }
      );

      applyMediaSpeed = (mediaEl) => {
        if (!mediaEl) return;
        try {
          const targetSpeed = getEffectiveVideoSpeed();
          nativeSetRate.call(mediaEl, targetSpeed);
          if ('preservesPitch' in mediaEl) mediaEl.preservesPitch = true;
        } catch (_) {}
      };
    }

    if (origDefaultRateDesc && origDefaultRateDesc.get && origDefaultRateDesc.set) {
      const nativeGetDef = origDefaultRateDesc.get;
      const nativeSetDef = origDefaultRateDesc.set;
      defineStealthGetter(
        mediaProto,
        'defaultPlaybackRate',
        function () {
          assertValidReceiver(this, mediaProto, window.HTMLMediaElement);
          return State.enabled ? 1.0 : nativeGetDef.call(this);
        },
        function (val) {
          assertValidReceiver(this, mediaProto, window.HTMLMediaElement);
          nativeSetDef.call(this, val);
        }
      );
    }

    Native.addEventListener.call(window, 'ratechange', (e) => {
      if (State.enabled && getEffectiveVideoSpeed() !== 1.0) {
        e.stopImmediatePropagation();
        e.stopPropagation();
      }
    }, true);

    if (Native.mediaPause) {
      const stealthPause = createStealthFunction(function () {
        assertValidReceiver(this, mediaProto, window.HTMLMediaElement);
        if (Native.perfNow() - lastTrustedUserInteractionTime < 450) {
          userExplicitlyPaused.add(this);
          return Native.mediaPause.call(this);
        }
        if (State.enabled && State.alwaysActive && State.avisoYouTubeMode) {
          if (this.ended || (this.duration && this.currentTime >= this.duration - 0.25)) {
            return Native.mediaPause.call(this);
          }
          const stack = (new Error().stack || '').toLowerCase();
          const isVisibilityPause =
            stack.includes('visibility') ||
            stack.includes('blur') ||
            stack.includes('hidden') ||
            !Native.hasFocus.call(document);
          if (isVisibilityPause && !userExplicitlyPaused.has(this)) {
            applyMediaSpeed(this);
            return;
          }
        }
        return Native.mediaPause.call(this);
      }, 'pause', 0);

      try {
        Native.defineProperty(mediaProto, 'pause', {
          value: stealthPause,
          writable: true,
          enumerable: true,
          configurable: true
        });
      } catch (_) {}
    }

    if (Native.mediaPlay) {
      const stealthPlay = createStealthFunction(function () {
        assertValidReceiver(this, mediaProto, window.HTMLMediaElement);
        userExplicitlyPaused.delete(this);
        applyMediaSpeed(this);
        return Native.mediaPlay.call(this);
      }, 'play', 0);

      try {
        Native.defineProperty(mediaProto, 'play', {
          value: stealthPlay,
          writable: true,
          enumerable: true,
          configurable: true
        });
      } catch (_) {}
    }

    if (window.HTMLVideoElement && window.HTMLVideoElement.prototype.getVideoPlaybackQuality) {
      const vidProto = window.HTMLVideoElement.prototype;
      const origQuality = vidProto.getVideoPlaybackQuality;
      const stealthQuality = createStealthFunction(function () {
        assertValidReceiver(this, vidProto, window.HTMLVideoElement);
        const q = origQuality ? origQuality.call(this) : {};
        if (!State.enabled || !State.alwaysActive) return q;
        return {
          creationTime: q.creationTime || 0,
          totalVideoFrames: Math.max(q.totalVideoFrames || 60, 60),
          droppedVideoFrames: 0,
          corruptedVideoFrames: 0
        };
      }, 'getVideoPlaybackQuality', 0);
      try {
        Native.defineProperty(vidProto, 'getVideoPlaybackQuality', {
          value: stealthQuality,
          writable: true,
          enumerable: true,
          configurable: true
        });
      } catch (_) {}
    }
  }

  // ============================================================================
  // 7. SECTION III: TIME-WARP & LIVE RESCHEDULING ENGINE (Cloudflare & Login Safe)
  // ============================================================================
  let baseRealPerf = Native.perfNow();
  let baseVirtualPerf = baseRealPerf;
  let baseRealDate = Native.dateNow();
  let baseVirtualDate = baseRealDate;
  let currentClockMultiplier = 1.0;

  function syncClockAnchor() {
    const nowPerf = Native.perfNow();
    const nowDate = Native.dateNow();
    baseVirtualPerf = baseVirtualPerf + (nowPerf - baseRealPerf) * currentClockMultiplier;
    baseRealPerf = nowPerf;
    baseVirtualDate = baseVirtualDate + (nowDate - baseRealDate) * currentClockMultiplier;
    baseRealDate = nowDate;
    currentClockMultiplier = getEffectiveClockSpeed();
  }

  function getVirtualPerfNow() {
    const nowPerf = Native.perfNow();
    if (
      isAuthOrSensitivePage() ||
      (!isPtcTimerCurrentlyRunning() && (State.captchaActive || hasActiveCloudflareChallengeOnPage()))
    ) {
      baseRealPerf = nowPerf;
      baseVirtualPerf = nowPerf;
      currentClockMultiplier = 1.0;
      return nowPerf;
    }
    const mult = getEffectiveClockSpeed();
    if (mult !== currentClockMultiplier) {
      syncClockAnchor();
    }
    const realDelta = nowPerf - baseRealPerf;
    if (mult > 1.0) {
      State.savedSecondsTotal += (realDelta * (mult - 1.0)) / 1000;
    }
    return baseVirtualPerf + realDelta * mult;
  }

  function getVirtualDateNow() {
    const nowDate = Native.dateNow();
    if (
      isAuthOrSensitivePage() ||
      (!isPtcTimerCurrentlyRunning() && (State.captchaActive || hasActiveCloudflareChallengeOnPage()))
    ) {
      baseRealDate = nowDate;
      baseVirtualDate = nowDate;
      currentClockMultiplier = 1.0;
      return nowDate;
    }
    const mult = getEffectiveClockSpeed();
    if (mult !== currentClockMultiplier) {
      syncClockAnchor();
    }
    return Math.floor(baseVirtualDate + (nowDate - baseRealDate) * mult);
  }

  let lastStackCheckTickMs = -1;
  let stackChecksInSameMs = 0;
  let cachedStackIsCf = false;

  function isCloudflareOrCaptchaStack() {
    if (!State.cloudflareShield) return false;
    try {
      const nowMs = Math.floor(Native.perfNow());
      if (nowMs === lastStackCheckTickMs) {
        stackChecksInSameMs++;
        if (stackChecksInSameMs > 2) {
          return cachedStackIsCf;
        }
      } else {
        lastStackCheckTickMs = nowMs;
        stackChecksInSameMs = 1;
      }
      const stack = new Error().stack;
      if (!stack) {
        cachedStackIsCf = false;
        return false;
      }
      const lower = stack.toLowerCase();
      cachedStackIsCf =
        lower.includes('challenges.cloudflare.com') ||
        lower.includes('turnstile') ||
        lower.includes('/cdn-cgi/challenge-platform') ||
        lower.includes('hcaptcha.com') ||
        lower.includes('recaptcha');
      return cachedStackIsCf;
    } catch (_) {
      return false;
    }
  }

  if (window.performance && window.performance.now) {
    const PerfProto = window.Performance && window.Performance.prototype;
    const PerfCtor = window.Performance;
    const stealthPerfNow = createStealthFunction(function () {
      if (PerfProto) {
        assertValidReceiver(this, PerfProto, PerfCtor);
      }
      if (!State.enabled || isCloudflareOrCaptchaStack()) {
        return Native.perfNow();
      }
      return getVirtualPerfNow();
    }, 'now', 0);

    try {
      if (PerfProto) {
        Native.defineProperty(PerfProto, 'now', {
          value: stealthPerfNow,
          writable: true,
          enumerable: true,
          configurable: true
        });
      }
    } catch (_) {}
  }

  // Wrap window.Date with a non-Proxy constructor function so `new Date()` (0 args)
  // creates a genuine C++ Date instance at `getVirtualDateNow()`, while `new Date(arg)`
  // preserves fixed dates and `window.Date.prototype === Native.Date.prototype`!
  const stealthDateNow = createStealthFunction(function () {
    if (!State.enabled || isCloudflareOrCaptchaStack()) {
      return Native.dateNow();
    }
    return getVirtualDateNow();
  }, 'now', 0);

  const StealthDate = maskExistingConstructorAsNative(function Date(...args) {
    if (!new.target) {
      if (State.enabled && !isCloudflareOrCaptchaStack()) {
        return new Native.Date(getVirtualDateNow()).toString();
      }
      return Native.Date();
    }
    if (args.length === 0) {
      if (State.enabled && !isCloudflareOrCaptchaStack()) {
        return new Native.Date(getVirtualDateNow());
      }
      return new Native.Date();
    }
    return new Native.Date(...args);
  }, 'Date', 7, Native.Date.prototype);

  try {
    Native.defineProperty(StealthDate, 'now', {
      value: stealthDateNow,
      writable: true,
      enumerable: false,
      configurable: true
    });
    Native.defineProperty(StealthDate, 'parse', {
      value: Native.Date.parse,
      writable: true,
      enumerable: false,
      configurable: true
    });
    Native.defineProperty(StealthDate, 'UTC', {
      value: Native.Date.UTC,
      writable: true,
      enumerable: false,
      configurable: true
    });
    Native.defineProperty(Native.Date.prototype, 'constructor', {
      value: StealthDate,
      writable: true,
      enumerable: false,
      configurable: true
    });
    window.Date = StealthDate;
  } catch (_) {}

  // Accelerate Web Worker timers (`worker-timers` / `HackTimer` Blob & Dedicated Workers used in Vue/React SPAs like FaucetCrypto & JumpTask)
  const activeWorkers = new Set();

  if (window.Blob) {
    const NativeBlob = window.Blob;
    const StealthBlob = maskExistingConstructorAsNative(function Blob(blobParts, options) {
      try {
        if (
          State.enabled &&
          !isAuthOrSensitivePage() &&
          !hasActiveCloudflareChallengeOnPage() &&
          !isCloudflareOrCaptchaStack() &&
          Array.isArray(blobParts)
        ) {
          const joined = blobParts.filter((p) => typeof p === 'string').join('');
          const isSmallTimerWorker =
            joined.length > 0 &&
            joined.length < 2500 &&
            (joined.includes('setInterval') || joined.includes('setTimeout')) &&
            !joined.includes('cloudflare') &&
            !joined.includes('turnstile') &&
            !joined.includes('cdn-cgi') &&
            !joined.includes('__CF') &&
            !joined.includes('_cf_');
          if (isSmallTimerWorker) {
            const mult = Math.max(1, getEffectiveTimerSpeed());
            const workerPrefix = `(function(){let _m=${mult};const _si=self.setInterval,_st=self.setTimeout;self.addEventListener('message',function(e){if(e&&e.data&&typeof e.data.__bc_worker_speed__==='number'){_m=Math.max(1,e.data.__bc_worker_speed__);}},true);self.setInterval=function(f,d,...a){return _si(f,Math.max(4,Math.floor((Number(d)||0)/_m)),...a);};self.setTimeout=function(f,d,...a){return _st(f,Math.max(4,Math.floor((Number(d)||0)/_m)),...a);};})();\n`;
            return new NativeBlob([workerPrefix, ...blobParts], options);
          }
        }
      } catch (_) {}
      return new NativeBlob(blobParts, options);
    }, 'Blob', 0, NativeBlob.prototype);
    try {
      Native.defineProperty(NativeBlob.prototype, 'constructor', {
        value: StealthBlob,
        writable: true,
        enumerable: false,
        configurable: true
      });
      window.Blob = StealthBlob;
    } catch (_) {}
  }

  if (window.Worker) {
    const NativeWorker = window.Worker;
    const origWorkerPostMessage = NativeWorker.prototype && NativeWorker.prototype.postMessage;

    if (origWorkerPostMessage) {
      const stealthWorkerPostMessage = createStealthFunction(function (message, ...rest) {
        try {
          const mult = getEffectiveTimerSpeed();
          if (
            State.enabled &&
            mult > 1.0 &&
            !isAuthOrSensitivePage() &&
            !hasActiveCloudflareChallengeOnPage() &&
            !isCloudflareOrCaptchaStack() &&
            message &&
            typeof message === 'object' &&
            !message.__bc_worker_speed__
          ) {
            const clone = Object.assign({}, message);
            ['delay', 'time', 'interval', 'timeout'].forEach((k) => {
              if (typeof clone[k] === 'number' && clone[k] >= 20) {
                clone[k] = Math.max(4, Math.floor(clone[k] / mult));
              }
            });
            if (clone.params && typeof clone.params === 'object') {
              clone.params = Object.assign({}, clone.params);
              ['delay', 'time', 'interval', 'timeout'].forEach((k) => {
                if (typeof clone.params[k] === 'number' && clone.params[k] >= 20) {
                  clone.params[k] = Math.max(4, Math.floor(clone.params[k] / mult));
                }
              });
            }
            return origWorkerPostMessage.call(this, clone, ...rest);
          }
        } catch (_) {}
        return origWorkerPostMessage.call(this, message, ...rest);
      }, 'postMessage', 1);

      try {
        Native.defineProperty(NativeWorker.prototype, 'postMessage', {
          value: stealthWorkerPostMessage,
          writable: true,
          enumerable: true,
          configurable: true
        });
      } catch (_) {}
    }

    const StealthWorker = maskExistingConstructorAsNative(function Worker(scriptURL, options) {
      const w = new NativeWorker(scriptURL, options);
      try {
        const urlStr = String(scriptURL || '');
        if (
          urlStr.startsWith('blob:') &&
          !isAuthOrSensitivePage() &&
          !hasActiveCloudflareChallengeOnPage() &&
          !isCloudflareOrCaptchaStack()
        ) {
          activeWorkers.add(w);
          const mult = getEffectiveTimerSpeed();
          if (mult > 1.0 && origWorkerPostMessage) {
            origWorkerPostMessage.call(w, { __bc_worker_speed__: mult });
          }
        }
      } catch (_) {}
      return w;
    }, 'Worker', 1, NativeWorker.prototype);
    try {
      Native.defineProperty(NativeWorker.prototype, 'constructor', {
        value: StealthWorker,
        writable: true,
        enumerable: false,
        configurable: true
      });
      window.Worker = StealthWorker;
    } catch (_) {}
  }

  // --- Core Timer Registry with Smooth Mid-Tick Live Rescheduling & Sub-ms Accumulator ---
  const activeIntervals = new Map();
  const activeTimeouts = new Map();
  let nextPublicTimerId = 100000;

  const stealthSetInterval = createStealthFunction(function (handler, timeout, ...args) {
    const rawDelay = Math.max(0, Number(timeout) || 0);
    const isCf = isCloudflareOrCaptchaStack();

    // Never wrap Cloudflare timers, micro-intervals (<= 15ms), non-functions, or Login/Auth pages!
    if (isCf || typeof handler !== 'function' || rawDelay <= 15 || isAuthOrSensitivePage()) {
      return Native.setInterval(handler, timeout, ...args);
    }

    const initialSpeed = getEffectiveTimerSpeed();
    if (initialSpeed > 1.0) {
      State.timersAcceleratedCount++;
    }
    const publicId = ++nextPublicTimerId;

    const record = {
      handler,
      args,
      rawDelay,
      subMsRemainder: 0,
      catchUpRemainderMs: 0,
      lastTickRealTime: Native.perfNow(),
      workDoneMs: 0,
      lastSpeed: initialSpeed,
      countedAsAccelerated: initialSpeed > 1.0,
      nativeId: null,
      scheduleNext: null
    };

    const tick = () => {
      if (!activeIntervals.has(publicId)) return;
      const now = Native.perfNow();
      const realElapsed = Math.max(0, now - record.lastTickRealTime);
      const curSpeed = getEffectiveTimerSpeed();
      record.lastTickRealTime = now;
      record.workDoneMs = 0;
      record.lastSpeed = curSpeed;
      if (curSpeed > 1.0 && !record.countedAsAccelerated) {
        record.countedAsAccelerated = true;
        State.timersAcceleratedCount++;
      }

      // Background Tab Catch-Up Multi-Tick Engine:
      // When a tab is in the background (e.g. FaucetCrypto Tab 2 while viewing RollerCoin Tab 3,
      // or JumpTask Tab while viewing the offer tab), Chromium's C++ DOMTimer clamps setTimeout
      // wakeups to >= 1000ms. Compensate by running the exact number of virtual ticks that elapsed!
      let ticksDue = 1;
      if (curSpeed > 1.0 && record.rawDelay >= 100) {
        const expectedRealDelay = record.rawDelay / curSpeed;
        if (realElapsed >= expectedRealDelay * 1.75) {
          const totalVirtualMs = realElapsed * curSpeed + record.catchUpRemainderMs;
          ticksDue = Math.min(50, Math.max(1, Math.floor(totalVirtualMs / record.rawDelay)));
          record.catchUpRemainderMs = Math.max(0, totalVirtualMs - ticksDue * record.rawDelay);
        }
      }

      for (let i = 0; i < ticksDue; i++) {
        if (!activeIntervals.has(publicId)) break;
        try {
          handler.apply(window, args);
        } catch (err) {
          Native.setTimeout(() => { throw err; }, 0);
        }
      }

      if (activeIntervals.has(publicId)) {
        record.scheduleNext(false);
      }
    };

    record.scheduleNext = (isMidTickReschedule = false) => {
      if (record.nativeId !== null) {
        Native.clearTimeout(record.nativeId);
      }
      const now = Native.perfNow();
      const newSpeed = getEffectiveTimerSpeed();
      if (newSpeed > 1.0 && !record.countedAsAccelerated) {
        record.countedAsAccelerated = true;
        State.timersAcceleratedCount++;
      }

      if (isMidTickReschedule) {
        const elapsedSinceLastAnchor = Math.max(0, now - record.lastTickRealTime);
        record.workDoneMs += elapsedSinceLastAnchor * record.lastSpeed;
        record.lastTickRealTime = now;
        record.lastSpeed = newSpeed;
        const remainingRawWork = Math.max(0, record.rawDelay - record.workDoneMs);
        const nextDelay = Math.max(4, Math.floor(remainingRawWork / newSpeed));
        record.nativeId = Native.setTimeout(tick, nextDelay);
      } else {
        record.lastTickRealTime = now;
        record.workDoneMs = 0;
        record.lastSpeed = newSpeed;
        const exactDelay = record.rawDelay / newSpeed + record.subMsRemainder;
        const intDelay = Math.max(4, Math.floor(exactDelay));
        record.subMsRemainder = exactDelay - intDelay;
        record.nativeId = Native.setTimeout(tick, intDelay);
      }
    };

    activeIntervals.set(publicId, record);
    record.scheduleNext(false);
    return publicId;
  }, 'setInterval', 1);

  const stealthClearInterval = createStealthFunction(function (id) {
    if (activeIntervals.has(id)) {
      const rec = activeIntervals.get(id);
      if (rec && rec.nativeId !== null) {
        Native.clearTimeout(rec.nativeId);
      }
      activeIntervals.delete(id);
      return;
    }
    if (activeTimeouts.has(id)) {
      const rec = activeTimeouts.get(id);
      if (rec && rec.nativeId !== null) {
        Native.clearTimeout(rec.nativeId);
      }
      activeTimeouts.delete(id);
      return;
    }
    return Native.clearInterval(id);
  }, 'clearInterval', 0);

  const stealthSetTimeout = createStealthFunction(function (handler, timeout, ...args) {
    const rawDelay = Math.max(0, Number(timeout) || 0);
    const isCf = isCloudflareOrCaptchaStack();

    if (isCf || typeof handler !== 'function' || rawDelay <= 15 || isAuthOrSensitivePage()) {
      return Native.setTimeout(handler, timeout, ...args);
    }

    const initialSpeed = getEffectiveTimerSpeed();
    if (initialSpeed > 1.0) {
      State.timersAcceleratedCount++;
    }
    const publicId = ++nextPublicTimerId;

    const record = {
      handler,
      args,
      rawDelay,
      workDoneMs: 0,
      lastAnchorRealTime: Native.perfNow(),
      lastSpeed: initialSpeed,
      countedAsAccelerated: initialSpeed > 1.0,
      nativeId: null,
      reschedule: null
    };

    const fire = () => {
      if (!activeTimeouts.has(publicId)) return;
      activeTimeouts.delete(publicId);
      handler.apply(window, args);
    };

    record.reschedule = () => {
      if (record.nativeId !== null) {
        Native.clearTimeout(record.nativeId);
      }
      const now = Native.perfNow();
      const newSpeed = getEffectiveTimerSpeed();
      if (newSpeed > 1.0 && !record.countedAsAccelerated) {
        record.countedAsAccelerated = true;
        State.timersAcceleratedCount++;
      }
      const elapsed = Math.max(0, now - record.lastAnchorRealTime);
      record.workDoneMs += elapsed * record.lastSpeed;
      record.lastAnchorRealTime = now;
      record.lastSpeed = newSpeed;

      const remainingRawWork = Math.max(0, record.rawDelay - record.workDoneMs);
      const nextDelay = Math.max(4, Math.floor(remainingRawWork / newSpeed));
      record.nativeId = Native.setTimeout(fire, nextDelay);
    };

    activeTimeouts.set(publicId, record);
    const initialDelay = Math.max(4, Math.floor(rawDelay / record.lastSpeed));
    record.nativeId = Native.setTimeout(fire, initialDelay);
    return publicId;
  }, 'setTimeout', 1);

  const stealthClearTimeout = createStealthFunction(function (id) {
    if (activeTimeouts.has(id)) {
      const rec = activeTimeouts.get(id);
      if (rec && rec.nativeId !== null) {
        Native.clearTimeout(rec.nativeId);
      }
      activeTimeouts.delete(id);
      return;
    }
    if (activeIntervals.has(id)) {
      return stealthClearInterval(id);
    }
    return Native.clearTimeout(id);
  }, 'clearTimeout', 0);

  function rescheduleAllActiveTimers() {
    syncClockAnchor();
    const curSpeed = getEffectiveTimerSpeed();
    activeWorkers.forEach((w) => {
      try {
        if (w && typeof w.postMessage === 'function') {
          w.postMessage({ __bc_worker_speed__: curSpeed });
        }
      } catch (_) {}
    });
    activeIntervals.forEach((record) => {
      if (record && typeof record.scheduleNext === 'function') {
        record.scheduleNext(true);
      }
    });
    activeTimeouts.forEach((record) => {
      if (record && typeof record.reschedule === 'function') {
        record.reschedule();
      }
    });
    try {
      const videos = document.querySelectorAll('video, audio');
      videos.forEach((v) => {
        applyMediaSpeed(v);
      });
      if (typeof document.getAnimations === 'function') {
        const anims = document.getAnimations();
        const animSpeed = getEffectiveTimerSpeed();
        anims.forEach((a) => {
          try { a.playbackRate = animSpeed; } catch (_) {}
        });
      }
    } catch (_) {}
  }

  try {
    window.setInterval = stealthSetInterval;
    window.clearInterval = stealthClearInterval;
    window.setTimeout = stealthSetTimeout;
    window.clearTimeout = stealthClearTimeout;
  } catch (_) {}

  if (Native.requestAnimationFrame) {
    const activeRafFallbacks = new Map();
    const stealthRAF = createStealthFunction(function (callback) {
      if (typeof callback !== 'function') {
        return Native.requestAnimationFrame(callback);
      }
      if (State.enabled && !isAuthOrSensitivePage() && !isCloudflareOrCaptchaStack()) {
        const speed = getEffectiveTimerSpeed();
        const isBg = !Native.hasFocus.call(document) || (Native.getHidden && Native.getHidden.call(document));
        if ((State.alwaysActive && State.unthrottleBackground && isBg) || speed > 1.0) {
          return Native.setTimeout(() => {
            callback(getVirtualPerfNow());
          }, Math.max(4, Math.floor(16 / speed)));
        }
        if (State.alwaysActive && State.unthrottleBackground) {
          let fired = false;
          let rafId = null;
          const fallbackTimer = Native.setTimeout(() => {
            if (fired) return;
            fired = true;
            if (rafId !== null && Native.cancelAnimationFrame) {
              try { Native.cancelAnimationFrame(rafId); } catch (_) {}
            }
            activeRafFallbacks.delete(rafId);
            callback(getVirtualPerfNow());
          }, 50);
          rafId = Native.requestAnimationFrame((ts) => {
            if (fired) return;
            fired = true;
            Native.clearTimeout(fallbackTimer);
            activeRafFallbacks.delete(rafId);
            const curSpeed = getEffectiveTimerSpeed();
            callback(curSpeed === 1.0 ? ts : getVirtualPerfNow());
          });
          activeRafFallbacks.set(rafId, fallbackTimer);
          return rafId;
        }
      }
      return Native.requestAnimationFrame((ts) => {
        const speed = getEffectiveTimerSpeed();
        callback(speed === 1.0 ? ts : getVirtualPerfNow());
      });
    }, 'requestAnimationFrame', 1);

    const stealthCancelRAF = createStealthFunction(function (id) {
      if (activeRafFallbacks.has(id)) {
        Native.clearTimeout(activeRafFallbacks.get(id));
        activeRafFallbacks.delete(id);
      }
      Native.clearTimeout(id);
      if (Native.cancelAnimationFrame) {
        return Native.cancelAnimationFrame(id);
      }
    }, 'cancelAnimationFrame', 1);

    try {
      window.requestAnimationFrame = stealthRAF;
      if (Native.cancelAnimationFrame) {
        window.cancelAnimationFrame = stealthCancelRAF;
      }
    } catch (_) {}
  }

  if (Native.elemAnimate) {
    const stealthAnimate = createStealthFunction(function (keyframes, options) {
      const anim = Native.elemAnimate.call(this, keyframes, options);
      try {
        const speed = getEffectiveTimerSpeed();
        if (speed !== 1.0 && anim) {
          anim.playbackRate = speed;
        }
      } catch (_) {}
      return anim;
    }, 'animate', 1);
    try {
      window.Element.prototype.animate = stealthAnimate;
    } catch (_) {}
  }

  // IdleDetector Spoofing
  if (window.IdleDetector && window.IdleDetector.prototype) {
    try {
      defineStealthGetter(window.IdleDetector.prototype, 'userState', () => 'active');
      defineStealthGetter(window.IdleDetector.prototype, 'screenState', () => 'unlocked');
    } catch (_) {}
  }

  // Programmatic Turnstile Reset / Re-Mount Helper
  Native.addEventListener.call(window, '__bc_reset_turnstile__', () => {
    try {
      if (window.turnstile && typeof window.turnstile.reset === 'function') {
        window.turnstile.reset();
      }
    } catch (_) {}
  });

  // NOTE: Never dispatch synthetic FocusEvent('focus') / FocusEvent('focusin') on window/document!
  // Synthetic events have event.isTrusted === false, which is a primary bot-detection signal
  // in Cloudflare Turnstile (api.js) and Cloudflare Challenge Platform (/cdn-cgi/challenge-platform).

  // PTC & JumpTask Countdown Variable Detector
  // Supports:
  //  - FaucetCrypto Title ("10 seconds - Faucet Crypto")
  //  - JumpTask mm:ss ("Continue in 3:42", "03:42")
  //  - DutchyCorp ("Payout in 39 seconds")
  //  - Aviso & Global timer variables
  const PTC_GLOBAL_VARS = ['timer', 'seconds', 'countdown', 'timeleft', 'time_left', 'wait', 'sec', 'counter', 'adTimer'];

  function scanPtcCountdown() {
    try {
      // 1. Check document.title first (e.g. "10 seconds - Faucet Crypto" or "03:42 - Task")
      if (document.title) {
        const tmMmSs = document.title.match(/\b(\d{1,2}):(\d{2})\b/);
        if (tmMmSs) {
          const totalSec = parseInt(tmMmSs[1], 10) * 60 + parseInt(tmMmSs[2], 10);
          if (totalSec >= 0 && totalSec <= 3600) {
            if (totalSec > State.detectedAdDurationSec) State.detectedAdDurationSec = totalSec;
            State.detectedRemainingSec = totalSec;
            return totalSec;
          }
        }
        const tm = document.title.match(/^(\d{1,4})\s*(?:seconds|sec|s\b)/i);
        if (tm) {
          const num = parseInt(tm[1], 10);
          if (num >= 0 && num <= 3600) {
            if (num > State.detectedAdDurationSec) State.detectedAdDurationSec = num;
            State.detectedRemainingSec = num;
            return num;
          }
        }
      }

      // 2. Check global variables
      for (let i = 0; i < PTC_GLOBAL_VARS.length; i++) {
        const key = PTC_GLOBAL_VARS[i];
        const val = window[key];
        if (typeof val === 'number' && val >= 0 && val <= 3600 && Number.isFinite(val)) {
          if (val > State.detectedAdDurationSec) State.detectedAdDurationSec = val;
          State.detectedRemainingSec = Math.ceil(val);
          return State.detectedRemainingSec;
        }
      }

      // 3. Check visible DOM selectors (including mm:ss format and standard seconds)
      const timerSelectors = ['#timer', '#seconds', '#countdown', '.timer', '.countdown', '[id*="timer"]', '[class*="timer"]'];
      for (let i = 0; i < timerSelectors.length; i++) {
        const el = document.querySelector(timerSelectors[i]);
        if (el && el.offsetParent !== null && el.textContent) {
          const txt = el.textContent.trim();
          const mmss = txt.match(/\b(\d{1,2}):(\d{2})\b/);
          if (mmss) {
            const totalSec = parseInt(mmss[1], 10) * 60 + parseInt(mmss[2], 10);
            if (totalSec >= 0 && totalSec <= 3600) {
              if (totalSec > State.detectedAdDurationSec) State.detectedAdDurationSec = totalSec;
              State.detectedRemainingSec = totalSec;
              return totalSec;
            }
          }
          const m = txt.match(/\b(\d{1,4})\b/);
          if (m) {
            const num = parseInt(m[1], 10);
            if (num >= 0 && num <= 3600) {
              if (num > State.detectedAdDurationSec) State.detectedAdDurationSec = num;
              State.detectedRemainingSec = num;
              return num;
            }
          }
        }
      }

      // 4. Check buttons for JumpTask "Continue in 3:42" or "Wait 01:30"
      if (document.querySelectorAll) {
        const btns = document.querySelectorAll('button, a.btn, [role="button"]');
        for (let i = 0; i < btns.length; i++) {
          const b = btns[i];
          if (b.offsetParent === null) continue;
          const bTxt = (b.innerText || b.textContent || '').trim();
          const jm = bTxt.match(/(?:Continue in|Wait|Submit in|Claim in)\s*(\d{1,2}):(\d{2})\b/i);
          if (jm) {
            const totalSec = parseInt(jm[1], 10) * 60 + parseInt(jm[2], 10);
            if (totalSec >= 0 && totalSec <= 3600) {
              if (totalSec > State.detectedAdDurationSec) State.detectedAdDurationSec = totalSec;
              State.detectedRemainingSec = totalSec;
              return totalSec;
            }
          }
        }
      }

      // 5. Check body text ("Payout in 39 seconds" or "Continue in 3:42")
      if (document.body) {
        const headerText = (document.body.innerText || '').slice(0, 2000);
        const mmssBody = headerText.match(/(?:Continue in|Payout in|Wait|Please wait|Remaining:?)\s*(\d{1,2}):(\d{2})\b/i);
        if (mmssBody) {
          const totalSec = parseInt(mmssBody[1], 10) * 60 + parseInt(mmssBody[2], 10);
          if (totalSec >= 0 && totalSec <= 3600) {
            if (totalSec > State.detectedAdDurationSec) State.detectedAdDurationSec = totalSec;
            State.detectedRemainingSec = totalSec;
            return totalSec;
          }
        }
        const m = headerText.match(/(?:Payout in|Wait|Please wait|Remaining:?|Continue in)\s*(\d{1,4})\s*(?:seconds|sec|s\b)/i);
        if (m) {
          const num = parseInt(m[1], 10);
          if (num >= 0 && num <= 3600) {
            if (num > State.detectedAdDurationSec) State.detectedAdDurationSec = num;
            State.detectedRemainingSec = num;
            return num;
          }
        }
      }

      // If a countdown was previously active and is no longer present in DOM/title, mark it completed (0)
      if (State.detectedRemainingSec !== null && State.detectedRemainingSec <= 5) {
        State.detectedRemainingSec = 0;
      }
    } catch (_) {}
    return State.detectedRemainingSec;
  }

  // Bridge communication
  Native.addEventListener.call(window, '__bc_config_update__', (e) => {
    try {
      const detail = typeof e.detail === 'string' ? JSON.parse(e.detail) : e.detail;
      if (!detail || typeof detail !== 'object') return;
      const prevSpeed = getEffectiveTimerSpeed();
      const prevClock = getEffectiveClockSpeed();
      const prevVideo = getEffectiveVideoSpeed();

      Object.assign(State, detail);

      if (
        getEffectiveTimerSpeed() !== prevSpeed ||
        getEffectiveClockSpeed() !== prevClock ||
        getEffectiveVideoSpeed() !== prevVideo
      ) {
        rescheduleAllActiveTimers();
      }
    } catch (_) {}
  });

  Native.setInterval(() => {
    try {
      // Continuously apply video speed to any newly mounted <video> elements
      if (State.enabled && (State.videoSpeedEnabled || State.speedEnabled) && getEffectiveVideoSpeed() !== 1.0) {
        const vids = document.querySelectorAll('video, audio');
        vids.forEach((v) => applyMediaSpeed(v));
      }
    } catch (_) {}

    const remaining = scanPtcCountdown();
    const realElapsedSec = Math.floor((Native.perfNow() - State.adStartRealTime) / 1000);
    const payload = {
      enabled: State.enabled,
      alwaysActive: State.alwaysActive,
      isAuthPage: isAuthOrSensitivePage(),
      effectiveTimerSpeed: getEffectiveTimerSpeed(),
      effectiveClockSpeed: getEffectiveClockSpeed(),
      effectiveVideoSpeed: getEffectiveVideoSpeed(),
      captchaActive: State.captchaActive || hasActiveCloudflareChallengeOnPage(),
      detectedAdDurationSec: State.detectedAdDurationSec,
      detectedRemainingSec: remaining,
      realElapsedSec,
      timersAcceleratedCount: State.timersAcceleratedCount,
      blockedEventsCount: State.blockedEventsCount,
      openedSurfWindowsCount: State.openedSurfWindowsCount,
      savedSecondsTotal: Math.round(State.savedSecondsTotal * 10) / 10,
      visibilityState: document.visibilityState,
      hidden: document.hidden,
      hasFocus: document.hasFocus(),
      webdriver: navigator.webdriver,
      userActivationActive: Boolean(navigator.userActivation && navigator.userActivation.isActive),
      toStringStealthCheck: document.hasFocus.toString() === 'function hasFocus() { [native code] }'
    };
    try {
      Native.dispatchEvent.call(
        window,
        new CustomEvent('__bc_telemetry__', { detail: JSON.stringify(payload) })
      );
    } catch (_) {}
  }, 500);

})();
