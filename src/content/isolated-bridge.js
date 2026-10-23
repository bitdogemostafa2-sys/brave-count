/**
 * BraveCount Pro v3.4 — ISOLATED World Bridge, Cloudflare Zero-Interference Assistant & Closed Shadow HUD
 *
 * Hardening in v3.4:
 *  - Strict Cloudflare IFrame Exit (100% untouched inside challenges.cloudflare.com)
 *  - Dynamic SPA-Aware AutoDutchy / FaucetCrypto Login & Auth Safe-Zone
 *  - One-Time Captcha Dropdown Auto-Selector (never overrides user manual dropdown changes!)
 *  - Event & Badge Deduplication (zero unnecessary message/event spam)
 *  - Safe Claim-Only Auto-Submit with Smart Hold Anti-Server-Ban
 */
(function () {
  'use strict';

  const IS_TOP_FRAME = window === window.top;

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

  const IS_YOUTUBE_EMBED =
    initLoc.host.includes('youtube.com') || initLoc.host.includes('youtube-nocookie.com');

  if (!IS_TOP_FRAME && !IS_YOUTUBE_EMBED) {
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

  // CRITICAL: Exit immediately inside Cloudflare, Captcha, or Google Account SSO frames — zero interference!
  if (IS_CLOUDFLARE_FRAME || IS_OTHER_CAPTCHA_FRAME || IS_SSO_OR_GOOGLE_AUTH_HOST) {
    return;
  }

  // Dynamic SPA-aware Login / Register / Auth / Withdraw / Password check
  function isAuthOrSensitivePage() {
    try {
      if (isFullPageCloudflareInterstitial()) return true;
      const loc = getLiveLocationInfo();
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

  const DEFAULT_CONFIG = {
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
    jumpTaskAutoContinue: true,

    // Speed / Time-Warp (Default 1.0x so sites work safely until user chooses a speed)
    speedEnabled: false,
    speedFactor: 1.0,
    videoSpeedEnabled: false,
    videoSpeedFactor: 1.0,
    warpMode: 'timers_only',
    smartHoldEnabled: true,
    smartHoldGraceSec: 2.0,

    // Cloudflare Zero-Interference Shield & Assistant
    cloudflareShield: true,
    autoBrakeOnCaptcha: true,
    autoScrollToCaptcha: true,
    cleanCaptchaOverlays: true,
    autoSelectTurnstile: true,
    // Keep debugger-based clicks off by default so Cloudflare never detects DevTools attachment!
    nativeTrustedClick: false,
    cdpFocusEmulation: false,
    keyboardSpaceFallback: false,
    multiTabConditioner: true,
    autoSubmitAfterSolve: true,
    autoCloseTabAfterClaim: false,
    retryOnStall: true,

    // UI Settings
    showFloatingHud: true,
    hudMinimized: false,
    siteProfiles: {}
  };

  let currentConfig = Object.assign({}, DEFAULT_CONFIG);
  let shadowRoot = null;
  let hudContainer = null;
  let lastBadgeKey = '';
  let lastPushedPayloadJson = '';

  let latestTelemetry = {
    effectiveTimerSpeed: 1.0,
    effectiveVideoSpeed: 1.0,
    isAuthPage: false,
    detectedAdDurationSec: 0,
    detectedRemainingSec: null,
    realElapsedSec: 0,
    timersAcceleratedCount: 0,
    blockedEventsCount: 0,
    openedSurfWindowsCount: 0,
    savedSecondsTotal: 0,
    visibilityState: 'visible',
    hidden: false,
    hasFocus: true,
    toStringStealthCheck: true
  };

  let cfState = {
    detected: false,
    status: 'isolated', // 'isolated' | 'verifying' | 'interactive' | 'solved' | 'stalled'
    statusTextAr: 'درع Cloudflare نشط (عزل تام 100%)',
    token: '',
    widgetSeenAt: 0,
    preConditioned: false,
    nativeClickAttemptedAt: 0,
    clickAttempts: 0,
    retryCount: 0,
    smartHoldActive: false,
    smartHoldRemainingSec: 0,
    autoSubmitted: false
  };

  // ============================================================================
  // 1. SYNC CONFIGURATION TO MAIN WORLD
  // ============================================================================
  function getEffectiveDomainConfig(rawSettings) {
    const loc = getLiveLocationInfo();
    const merged = Object.assign({}, DEFAULT_CONFIG, rawSettings || {});
    if (merged.siteProfiles && loc.host && merged.siteProfiles[loc.host]) {
      Object.assign(merged, merged.siteProfiles[loc.host]);
    }
    // If user explicitly turned on speed (e.g. clicked 2x/5x/10x/20x/50x on HUD), preserve their speed & full_warp across all tabs!
    if (rawSettings && rawSettings.speedEnabled && Number(rawSettings.speedFactor) > 1.0) {
      merged.speedEnabled = true;
      merged.speedFactor = Number(rawSettings.speedFactor);
      merged.warpMode = 'full_warp';
    }
    if (loc.host.includes('faucetcrypto.com')) {
      merged.warpMode = 'full_warp';
      if (!rawSettings || !rawSettings.userSelectedSpeed) {
        if (!merged.speedEnabled || Number(merged.speedFactor) < 2.0) {
          merged.speedEnabled = true;
          merged.speedFactor = 5.0;
        }
      }
    }
    if (loc.host.includes('jumptask.io')) {
      merged.warpMode = 'full_warp';
      merged.smartHoldEnabled = false;
      merged.jumpTaskAutoContinue = true;
      if (!merged.speedEnabled || Number(merged.speedFactor) < 2.0) {
        merged.speedEnabled = true;
        merged.speedFactor = 10.0;
      }
    }
    return merged;
  }

  function pushConfigToMainWorld(extraOverrides = {}) {
    const authPage = isAuthOrSensitivePage();
    const payload = Object.assign({}, currentConfig, {
      captchaActive: (cfState.detected && cfState.status !== 'solved') || authPage
    }, extraOverrides);

    if (authPage) {
      payload.speedEnabled = false;
      payload.speedFactor = 1.0;
      payload.alwaysActive = false;
      payload.blockBlur = false;
      payload.blockVisibility = false;
      payload.spoofViewport = false;
      payload.windowSurfShield = false;
    }

    try {
      const jsonStr = JSON.stringify(payload);
      if (jsonStr === lastPushedPayloadJson) return;
      lastPushedPayloadJson = jsonStr;
      window.dispatchEvent(
        new CustomEvent('__bc_config_update__', { detail: jsonStr })
      );
    } catch (_) {}
  }

  function loadStoredConfig() {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(null, (items) => {
        currentConfig = getEffectiveDomainConfig(items);
        pushConfigToMainWorld();
        updateHudUI();
      });
    } else {
      pushConfigToMainWorld();
    }
  }

  loadStoredConfig();

  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener(() => {
      loadStoredConfig();
    });
  }

  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
      if (!msg || !msg.type) return;
      if (msg.type === 'GET_TAB_DIAGNOSTICS') {
        sendResponse({
          host: getLiveLocationInfo().host,
          config: currentConfig,
          telemetry: latestTelemetry,
          cloudflare: cfState
        });
        return true;
      }
      if (msg.type === 'CONDITION_OPEN_TAB_PULSE') {
        scanCloudflareTurnstile();
        sendResponse({ ok: true });
        return true;
      }
      if (msg.type === 'SET_QUICK_SPEED') {
        const newSpeed = Number(msg.speed) || 1.0;
        currentConfig.speedEnabled = newSpeed > 1.0;
        currentConfig.speedFactor = newSpeed;
        if (newSpeed > 1.0) {
          currentConfig.warpMode = 'full_warp';
        }
        pushConfigToMainWorld();
        updateHudUI();
        sendResponse({ ok: true });
        return true;
      }
      if (msg.type === 'PANIC_RESET') {
        currentConfig.speedEnabled = false;
        currentConfig.speedFactor = 1.0;
        currentConfig.videoSpeedEnabled = false;
        currentConfig.videoSpeedFactor = 1.0;
        pushConfigToMainWorld();
        updateHudUI();
        sendResponse({ ok: true });
        return true;
      }
    });
  }

  window.addEventListener('__bc_telemetry__', (e) => {
    try {
      const data = typeof e.detail === 'string' ? JSON.parse(e.detail) : e.detail;
      if (!data) return;
      latestTelemetry = Object.assign(latestTelemetry, data);

      if (IS_TOP_FRAME && typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        const nextBadgeKey = `${latestTelemetry.detectedRemainingSec}|${latestTelemetry.effectiveTimerSpeed}|${cfState.status}`;
        if (nextBadgeKey !== lastBadgeKey) {
          lastBadgeKey = nextBadgeKey;
          chrome.runtime.sendMessage({
            type: 'UPDATE_BADGE_TELEMETRY',
            remainingSec: latestTelemetry.detectedRemainingSec,
            speedFactor: latestTelemetry.effectiveTimerSpeed,
            cfStatus: cfState.status
          }).catch(() => {});
        }
      }

      updateHudUI();
    } catch (_) {}
  });

  // ============================================================================
  // 2. CLOUDFLARE TURNSTILE ZERO-INTERFERENCE RADAR & SAFE CLAIM ASSISTANT
  // ============================================================================
  const autoSelectedDropdowns = new WeakSet();

  // Auto-select Cloudflare Turnstile ONCE per dropdown on PTC sites (never overrides manual user changes!)
  function autoSelectCloudflareCaptchaOption() {
    if (!currentConfig.enabled || !currentConfig.autoSelectTurnstile) return;
    if (isAuthOrSensitivePage()) return; // Do not touch login form dropdowns
    try {
      const selects = document.querySelectorAll('select[name*="captcha" i], select[id*="captcha" i], select.captcha-select');
      selects.forEach((sel) => {
        if (autoSelectedDropdowns.has(sel)) return;
        autoSelectedDropdowns.add(sel);
        for (let i = 0; i < sel.options.length; i++) {
          const opt = sel.options[i];
          const txt = (opt.text + ' ' + opt.value).toLowerCase();
          if (txt.includes('turnstile') || txt.includes('cloudflare')) {
            if (sel.selectedIndex !== i) {
              sel.selectedIndex = i;
              sel.dispatchEvent(new Event('change', { bubbles: true }));
            }
            break;
          }
        }
      });
    } catch (_) {}
  }

  // Neutralize transparent clickjacking ad overlays positioned over .cf-turnstile
  function cleanOverlaysAboveCaptcha(widgetEl) {
    if (!currentConfig.enabled || !currentConfig.cleanCaptchaOverlays || !widgetEl) return;
    if (isAuthOrSensitivePage()) return;
    try {
      const rect = widgetEl.getBoundingClientRect();
      if (rect.width < 20 || rect.height < 20) return;
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const topEl = document.elementFromPoint(centerX, centerY);
      if (
        topEl &&
        topEl !== widgetEl &&
        !widgetEl.contains(topEl) &&
        !topEl.contains(widgetEl) &&
        topEl.tagName !== 'IFRAME' &&
        topEl.tagName !== 'BUTTON' &&
        topEl.tagName !== 'INPUT'
      ) {
        const style = window.getComputedStyle(topEl);
        const opacity = parseFloat(style.opacity || '1');
        if (opacity < 0.1) {
          topEl.style.setProperty('pointer-events', 'none', 'important');
        }
      }
    } catch (_) {}
  }

  function computeTurnstileCheckboxCoords(targetEl) {
    const rect = targetEl.getBoundingClientRect();
    const isRtl = document.dir === 'rtl' || getComputedStyle(targetEl).direction === 'rtl';
    const humanJitterX = (Math.random() - 0.5) * 6;
    const humanJitterY = (Math.random() - 0.5) * 6;
    const baseOffsetX = isRtl ? (rect.width - 28) : 28;
    const x = Math.round(rect.left + baseOffsetX + humanJitterX);
    const y = Math.round(rect.top + rect.height / 2 + humanJitterY);
    return { x, y, valid: rect.width >= 120 && rect.height >= 35 && rect.top >= 0 && rect.left >= 0 };
  }

  function scanCloudflareTurnstile() {
    if (!currentConfig.enabled) return;

    const onAuthPage = isAuthOrSensitivePage();
    if (onAuthPage) {
      cfState.statusTextAr = 'صفحة تسجيل دخول — وضع الأمان 1.0x (بدون تدخل)';
      pushConfigToMainWorld();
    }

    try {
      autoSelectCloudflareCaptchaOption();

      const rawWidgetContainers = document.querySelectorAll(
        '.cf-turnstile, [data-sitekey][class*="cf-"], [id*="cf-turnstile"], iframe[src*="challenges.cloudflare.com"]'
      );
      const widgetContainers = Array.from(rawWidgetContainers).filter((w) => w && w.offsetParent !== null);
      const tokenInputs = document.querySelectorAll(
        'input[name="cf-turnstile-response"], textarea[name="cf-turnstile-response"]'
      );

      let foundToken = '';
      let solvedInputEl = null;
      tokenInputs.forEach((inp) => {
        if (inp.value && inp.value.trim().length > 20) {
          foundToken = inp.value.trim();
          solvedInputEl = inp;
        }
      });

      if (widgetContainers.length === 0 && !foundToken) {
        if (cfState.detected) {
          cfState.detected = false;
          cfState.preConditioned = false;
          cfState.clickAttempts = 0;
          cfState.status = 'isolated';
          cfState.statusTextAr = onAuthPage
            ? 'صفحة تسجيل دخول — وضع الأمان 1.0x'
            : 'درع Cloudflare نشط (عزل تام 100%)';
          pushConfigToMainWorld();
        }
        return;
      }

      const wasDetected = cfState.detected;
      cfState.detected = true;
      if (!wasDetected) {
        cfState.widgetSeenAt = Date.now();
        cfState.preConditioned = false;
        cfState.clickAttempts = 0;
      }

      const primaryWidget = widgetContainers[0] || (tokenInputs[0] && tokenInputs[0].parentElement);

      // 1. Check if Token is already solved!
      if (foundToken) {
        if (cfState.status !== 'solved') {
          cfState.status = 'solved';
          cfState.token = foundToken;
          cfState.statusTextAr = onAuthPage
            ? 'كابتشا الدخول جاهزة ✓ — اضغط Login للدخول'
            : 'تم حل كابتشا Cloudflare بنجاح ✓';
          pushConfigToMainWorld(); // Release Auto-Brake

          if (!onAuthPage && solvedInputEl) {
            try {
              solvedInputEl.dispatchEvent(new Event('input', { bubbles: true }));
              solvedInputEl.dispatchEvent(new Event('change', { bubbles: true }));
            } catch (_) {}
          }

          recordSolvedCaptchaStat();

          // CRITICAL: Only auto-submit on Ad/Claim pages, NEVER on Login/Register/Withdraw pages!
          if (!onAuthPage) {
            handlePostCaptchaSolved(foundToken);
          }
        }
        return;
      }

      // 2. Engage Auto-Brake 1.0x immediately while Cloudflare is verifying
      if (cfState.status === 'solved') {
        cfState.autoSubmitted = false;
        cfState.scrolledOnce = false;
        cfState.preConditioned = false;
        cfState.clickAttempts = 0;
        cfState.widgetSeenAt = Date.now();
      }
      cfState.status = 'verifying';
      cfState.statusTextAr = onAuthPage
        ? 'كابتشا الدخول قيد التحقق الآمن (1.0x بدون تدخل)...'
        : 'عزل Cloudflare نشط (السرعة 1.0x لنجاح التحقق)...';
      pushConfigToMainWorld();

      if (!primaryWidget || onAuthPage) return;

      // SENIOR CLOUDFLARE RULE: Never call scrollIntoView() or mutate DOM styles around .cf-turnstile
      // while Turnstile is verifying, as layout shifts or elementFromPoint probes during verification
      // trigger Turnstile's layout-stability & clickjacking heuristics!

      const cfIframe =
        (primaryWidget.tagName === 'IFRAME' ? primaryWidget : primaryWidget.querySelector('iframe[src*="challenges.cloudflare.com"]')) ||
        document.querySelector('iframe[src*="challenges.cloudflare.com"]') ||
        primaryWidget;

      const coords = computeTurnstileCheckboxCoords(cfIframe);
      const elapsedMs = Date.now() - cfState.widgetSeenAt;

      // Optional CDP Pre-Conditioning (only if explicitly enabled by user)
      if (!cfState.preConditioned && currentConfig.cdpFocusEmulation && coords.valid && elapsedMs > 300) {
        cfState.preConditioned = true;
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
          chrome.runtime.sendMessage({
            type: 'CONDITION_AND_SOLVE_CLOUDFLARE',
            x: coords.x,
            y: coords.y,
            doClick: false
          }).catch(() => {});
        }
      }

      // Optional Native Trusted Click (only if explicitly enabled by user)
      if (
        currentConfig.nativeTrustedClick &&
        elapsedMs > 2200 &&
        Date.now() - cfState.nativeClickAttemptedAt > 5000 &&
        coords.valid
      ) {
        cfState.nativeClickAttemptedAt = Date.now();
        cfState.clickAttempts++;
        cfState.status = 'interactive';

        const useSpace = Boolean(currentConfig.keyboardSpaceFallback && cfState.clickAttempts >= 2);
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
          chrome.runtime.sendMessage({
            type: 'CONDITION_AND_SOLVE_CLOUDFLARE',
            x: coords.x,
            y: coords.y,
            doClick: true,
            useSpaceFallback: useSpace
          }).catch(() => {});
        }
      }
    } catch (_) {}
  }

  // Handle post-solve actions on Ad/Claim pages (NEVER on Login/Auth pages!)
  function handlePostCaptchaSolved(_token) {
    if (isAuthOrSensitivePage()) return;

    try {
      const candidateButtons = document.querySelectorAll(
        'button[id*="claim" i], button[class*="claim" i], button[id*="verify" i], a.claim-btn, #final_button, #submit_captcha'
      );
      candidateButtons.forEach((btn) => {
        if (btn.disabled) btn.disabled = false;
        btn.classList.remove('disabled');
      });

      if (!currentConfig.autoSubmitAfterSolve || cfState.autoSubmitted) return;

      let holdDelayMs = 500 + Math.floor(Math.random() * 350);
      const adTotalDuration = latestTelemetry.detectedAdDurationSec || 0;
      const realElapsed = latestTelemetry.realElapsedSec || 0;

      if (currentConfig.smartHoldEnabled && adTotalDuration > 5) {
        const safeRequiredRealSec = Math.max(3, adTotalDuration - (Number(currentConfig.smartHoldGraceSec) || 2));
        const remainingSafeWaitSec = safeRequiredRealSec - realElapsed;
        if (remainingSafeWaitSec > 0.5) {
          const jitterMs = Math.floor(Math.random() * 600);
          holdDelayMs = Math.round(remainingSafeWaitSec * 1000) + jitterMs;
          cfState.smartHoldActive = true;
          cfState.smartHoldRemainingSec = Math.ceil(holdDelayMs / 1000);

          const holdInterval = setInterval(() => {
            cfState.smartHoldRemainingSec = Math.max(0, cfState.smartHoldRemainingSec - 1);
            cfState.statusTextAr = `حماية السيرفر (Smart Hold): إرسال آمن خلال ${cfState.smartHoldRemainingSec} ث...`;
            updateHudUI();
            if (cfState.smartHoldRemainingSec <= 0) {
              clearInterval(holdInterval);
            }
          }, 1000);
        }
      }

      setTimeout(() => {
        cfState.smartHoldActive = false;
        cfState.autoSubmitted = true;

        const submitBtn = findBestClaimButtonOnly();
        if (submitBtn) {
          cfState.statusTextAr = 'تم حل الكابتشا وتأكيد المكافأة بنجاح ✓';
          updateHudUI();
          submitBtn.click();
        }
      }, holdDelayMs);
    } catch (_) {}
  }

  // Strictly match ONLY reward/claim/verify buttons — NEVER login/register/account buttons!
  function findBestClaimButtonOnly() {
    if (isAuthOrSensitivePage()) return null;

    const FORBIDDEN_WORDS = [
      'login', 'log in', 'signin', 'sign in', 'register', 'sign up', 'signup',
      'logout', 'log out', 'password', 'withdraw', 'delete', 'cancel', 'reset'
    ];

    const isForbiddenButton = (el) => {
      const txt = ((el.innerText || el.value || el.title || el.id || el.name || '') + '').trim().toLowerCase();
      return FORBIDDEN_WORDS.some((w) => txt.includes(w));
    };

    const explicitClaimSelectors = [
      'button#submit_captcha',
      'button#claim_btn',
      'button[name="claim"]',
      '.btn-claim',
      '.claim-button',
      '#final_button'
    ];
    for (let i = 0; i < explicitClaimSelectors.length; i++) {
      const btn = document.querySelector(explicitClaimSelectors[i]);
      if (btn && btn.offsetParent !== null && !isForbiddenButton(btn)) {
        if (btn.disabled) btn.disabled = false;
        return btn;
      }
    }

    const allButtons = document.querySelectorAll('button, input[type="button"], input[type="submit"], a.btn');
    for (let i = 0; i < allButtons.length; i++) {
      const b = allButtons[i];
      if (b.offsetParent === null || isForbiddenButton(b)) continue;
      const txt = (b.innerText || b.value || '').trim().toLowerCase();
      if (
        txt.includes('claim') ||
        txt.includes('verify') ||
        txt.includes('collect') ||
        txt.includes('unlock') ||
        txt.includes('get reward') ||
        txt.includes('تأكيد المكافأة')
      ) {
        if (b.disabled) b.disabled = false;
        return b;
      }
    }
    return null;
  }

  function recordSolvedCaptchaStat() {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['statsCaptchasSolved'], (res) => {
        const count = (Number(res.statsCaptchasSolved) || 0) + 1;
        chrome.storage.local.set({ statsCaptchasSolved: count });
      });
    }
  }

  // ============================================================================
  // 2B. JUMPTASK & COUNTDOWN TASK SAFE AUTO-CONTINUE ENGINE
  //     - Never clicks while user is typing (2.5s debounce after last keystroke)
  //     - Never clicks if a proof text input exists and is still empty (< 2 chars)
  //     - Never clicks on Login/Auth/Withdraw pages
  //     - Clicks at most ONCE per button (WeakSet guard against double-submits)
  // ============================================================================
  let ticksSinceLastTyping = 999;
  const inputStabilityMap = new WeakMap();
  const countdownButtonsSeen = new WeakSet();
  const autoClickedTaskButtons = new WeakSet();

  ['keydown', 'input'].forEach((evName) => {
    window.addEventListener(evName, (e) => {
      const t = e && e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) {
        ticksSinceLastTyping = 0;
      }
    }, true);
  });

  function scanJumpTaskAndCountdownTasks() {
    ticksSinceLastTyping++;
    if (!currentConfig.enabled || !currentConfig.jumpTaskAutoContinue) return;
    if (isAuthOrSensitivePage()) return;

    try {
      const loc = getLiveLocationInfo();
      const isJumpTask = loc.host.includes('jumptask.io');
      const allButtons = document.querySelectorAll('button, a.btn, [role="button"]');

      for (let i = 0; i < allButtons.length; i++) {
        const btn = allButtons[i];
        if (!btn || btn.offsetParent === null) continue;
        const rawText = (btn.innerText || btn.textContent || btn.value || '').trim();
        const lowerText = rawText.toLowerCase();

        // 1. Track any button that currently displays a countdown (e.g. "Continue in 3:42")
        if (/(?:continue in|wait|submit in|claim in)\s*\d{1,2}:\d{2}\b/i.test(rawText) || /\b\d{1,2}:\d{2}\b/.test(rawText)) {
          countdownButtonsSeen.add(btn);
          continue;
        }

        // 2. Check if this button is a ready Continue / Submit button after countdown completion
        const wasCountdownBtn = countdownButtonsSeen.has(btn);
        const isReadyContinueOrSubmit =
          (wasCountdownBtn || isJumpTask) &&
          (lowerText === 'continue' || lowerText === 'submit' || lowerText === 'claim' || lowerText === 'claim reward') &&
          !btn.disabled &&
          btn.getAttribute('aria-disabled') !== 'true' &&
          !btn.classList.contains('disabled');

        if (!isReadyContinueOrSubmit || autoClickedTaskButtons.has(btn)) continue;

        // 3. Check if there is a visible proof text input in the modal/page (e.g. JumpTask "Enter text here")
        const textInputs = document.querySelectorAll(
          'input[type="text"], input:not([type]), textarea'
        );
        let proofInputRequiredAndEmpty = false;
        let proofInputStillChanging = false;

        for (let j = 0; j < textInputs.length; j++) {
          const inp = textInputs[j];
          if (!inp || inp.offsetParent === null || inp.disabled || inp.readOnly) continue;
          const ph = ((inp.placeholder || inp.name || inp.id || '') + '').toLowerCase();
          // Ignore search bars
          if (ph.includes('search') || ph.includes('filter')) continue;
          const val = (inp.value || '').trim();
          if (val.length < 2) {
            proofInputRequiredAndEmpty = true;
            inputStabilityMap.set(inp, { val, stableTicks: 0 });
            break;
          }
          const prev = inputStabilityMap.get(inp);
          if (!prev || prev.val !== val) {
            inputStabilityMap.set(inp, { val, stableTicks: 1 });
            proofInputStillChanging = true;
          } else {
            prev.stableTicks++;
            if (prev.stableTicks < 4) {
              proofInputStillChanging = true;
            }
          }
        }

        if (proofInputRequiredAndEmpty) {
          cfState.statusTextAr = 'العداد انتهى ✓ — اكتب الكلمتين للمتابعة تلقائياً';
          updateHudUI();
          continue;
        }

        // 4. Wait if the user is actively typing or just changed the input (< 4 stable scanner ticks)
        if (proofInputStillChanging || ticksSinceLastTyping < 4) {
          cfState.statusTextAr = 'بانتظار انتهائك من الكتابة للإرسال التلقائي...';
          updateHudUI();
          continue;
        }

        // 5. Safe to auto-click Continue / Submit once!
        autoClickedTaskButtons.add(btn);
        cfState.statusTextAr = 'تم إرسال المهمة تلقائياً (Auto-Continue) ✓';
        updateHudUI();
        btn.click();
        break;
      }
    } catch (_) {}
  }

  setInterval(() => {
    scanCloudflareTurnstile();
    scanJumpTaskAndCountdownTasks();
  }, 400);

  // ============================================================================
  // 3. CLOSED SHADOW DOM FLOATING MINI-HUD
  // ============================================================================
  function initClosedShadowHud() {
    if (!IS_TOP_FRAME || shadowRoot || !document.documentElement) return;

    try {
      const host = document.createElement('div');
      host.setAttribute('data-bc-hud-host', '1');
      host.style.cssText = 'all: initial; position: fixed; z-index: 2147483647; bottom: 14px; right: 14px; pointer-events: none; direction: rtl;';
      shadowRoot = host.attachShadow({ mode: 'closed' });

      const style = document.createElement('style');
      style.textContent = `
        * { box-sizing: border-box; font-family: 'Segoe UI', Tahoma, system-ui, sans-serif; }
        .hud-pill {
          pointer-events: auto;
          background: rgba(11, 17, 30, 0.94);
          border: 1px solid rgba(0, 245, 212, 0.45);
          border-radius: 14px;
          padding: 9px 13px;
          color: #e2f1ff;
          box-shadow: 0 8px 28px rgba(0, 0, 0, 0.65), 0 0 15px rgba(0, 245, 212, 0.15);
          backdrop-filter: blur(10px);
          min-width: 280px;
          max-width: 360px;
          transition: all 0.2s ease;
          user-select: none;
        }
        .hud-pill.minimized {
          min-width: auto;
          padding: 6px 11px;
          border-radius: 999px;
        }
        .hud-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 6px;
        }
        .hud-pill.minimized .hud-header {
          margin-bottom: 0;
        }
        .hud-pill.minimized .hud-body {
          display: none;
        }
        .brand {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 700;
          font-size: 12px;
          color: #00f5d4;
        }
        .pulse-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #00f5d4;
          box-shadow: 0 0 8px #00f5d4;
        }
        .pulse-dot.off {
          background: #ff4d6d;
          box-shadow: 0 0 8px #ff4d6d;
        }
        .hud-badges {
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .badge {
          font-size: 10.5px;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 6px;
          background: rgba(0, 245, 212, 0.14);
          color: #00f5d4;
          border: 1px solid rgba(0, 245, 212, 0.3);
        }
        .badge.warn {
          background: rgba(251, 191, 36, 0.16);
          color: #fbbf24;
          border-color: rgba(251, 191, 36, 0.35);
        }
        .min-btn {
          background: transparent;
          border: none;
          color: #8da9c4;
          cursor: pointer;
          font-size: 13px;
          padding: 0 4px;
        }
        .min-btn:hover { color: #fff; }
        .status-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          color: #a9c2d9;
          margin: 4px 0;
        }
        .cf-bar {
          margin-top: 5px;
          padding: 4px 8px;
          border-radius: 7px;
          background: rgba(16, 185, 129, 0.13);
          border: 1px solid rgba(16, 185, 129, 0.32);
          font-size: 10.5px;
          color: #34d399;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .speed-btns {
          display: flex;
          gap: 4px;
          margin-top: 7px;
        }
        .sp-btn {
          flex: 1;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #cbd5e1;
          border-radius: 6px;
          padding: 3px 0;
          font-size: 10.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }
        .sp-btn:hover {
          background: rgba(0, 245, 212, 0.18);
          color: #fff;
        }
        .sp-btn.active {
          background: #00f5d4;
          color: #08101d;
          border-color: #00f5d4;
          font-weight: 700;
        }
      `;

      hudContainer = document.createElement('div');
      hudContainer.className = 'hud-pill';
      hudContainer.innerHTML = `
        <div class="hud-header">
          <div class="brand">
            <span class="pulse-dot" id="hud-dot"></span>
            <span>BraveCount Pro v4.0</span>
          </div>
          <div class="hud-badges">
            <span class="badge" id="hud-timer-badge">نشط في الخلفية</span>
            <span class="badge warn" id="hud-speed-badge">1.0x</span>
            <button class="min-btn" id="hud-min-btn" title="تصغير / تكبير">_</button>
          </div>
        </div>
        <div class="hud-body">
          <div class="status-row">
            <span>حالة التاب و Surf:</span>
            <strong style="color:#00f5d4" id="hud-focus-state">نشط 100% + درع نوافذ Surf</strong>
          </div>
          <div class="cf-bar" id="hud-cf-bar">
            <span>🛡️</span>
            <span id="hud-cf-text">درع Cloudflare نشط (عزل تام 100%)</span>
          </div>
          <div class="speed-btns" id="hud-speed-btns">
            <button class="sp-btn active" data-sp="1">1x آمن</button>
            <button class="sp-btn" data-sp="2">2x</button>
            <button class="sp-btn" data-sp="5">5x</button>
            <button class="sp-btn" data-sp="10">10x</button>
            <button class="sp-btn" data-sp="20">20x</button>
            <button class="sp-btn" data-sp="50">50x</button>
          </div>
        </div>
      `;

      shadowRoot.appendChild(style);
      shadowRoot.appendChild(hudContainer);
      document.documentElement.appendChild(host);

      const minBtn = shadowRoot.getElementById('hud-min-btn');
      if (minBtn) {
        minBtn.addEventListener('click', () => {
          currentConfig.hudMinimized = !currentConfig.hudMinimized;
          updateHudUI();
          if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            chrome.storage.local.set({ hudMinimized: currentConfig.hudMinimized });
          }
        });
      }

      const spBtns = shadowRoot.querySelectorAll('.sp-btn');
      spBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
          const sp = parseFloat(btn.getAttribute('data-sp') || '1');
          currentConfig.speedEnabled = sp > 1.0;
          currentConfig.speedFactor = sp;
          if (sp > 1.0) {
            currentConfig.warpMode = 'full_warp';
          }
          pushConfigToMainWorld();
          updateHudUI();
          if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            chrome.storage.local.set({
              speedEnabled: currentConfig.speedEnabled,
              speedFactor: currentConfig.speedFactor,
              warpMode: currentConfig.warpMode,
              userSelectedSpeed: true
            });
          }
        });
      });

      updateHudUI();
    } catch (_) {}
  }

  function updateHudUI() {
    if (!IS_TOP_FRAME) return;
    if (!shadowRoot) {
      if (document.documentElement) initClosedShadowHud();
      return;
    }
    if (!hudContainer) return;

    if (!currentConfig.enabled || !currentConfig.showFloatingHud) {
      hudContainer.style.display = 'none';
      return;
    }
    hudContainer.style.display = 'block';
    hudContainer.classList.toggle('minimized', !!currentConfig.hudMinimized);

    const dot = shadowRoot.getElementById('hud-dot');
    const timerBadge = shadowRoot.getElementById('hud-timer-badge');
    const speedBadge = shadowRoot.getElementById('hud-speed-badge');
    const cfText = shadowRoot.getElementById('hud-cf-text');
    const spBtns = shadowRoot.querySelectorAll('.sp-btn');

    if (dot) dot.classList.toggle('off', !currentConfig.enabled);

    const onAuthPage = isAuthOrSensitivePage();
    const configuredSpeed = currentConfig.speedEnabled ? Number(currentConfig.speedFactor || 1.0) : 1.0;
    const effSpeed = onAuthPage
      ? 1.0
      : (latestTelemetry.effectiveTimerSpeed || configuredSpeed);
    const activeBtnSpeed = onAuthPage ? configuredSpeed : effSpeed;

    if (timerBadge) {
      if (onAuthPage) {
        timerBadge.textContent = configuredSpeed > 1.0
          ? `أمان الدخول 🔒 (الخلفية ${configuredSpeed}x)`
          : 'وضع أمان الدخول 🔒';
      } else if (latestTelemetry.detectedRemainingSec !== null && latestTelemetry.detectedRemainingSec >= 0) {
        timerBadge.textContent = `العداد: ${latestTelemetry.detectedRemainingSec} ث`;
      } else {
        timerBadge.textContent = 'نشط في الخلفية';
      }
    }

    if (speedBadge) {
      speedBadge.textContent = (onAuthPage && configuredSpeed > 1.0)
        ? `${configuredSpeed}x`
        : `${effSpeed}x`;
    }

    if (cfText) {
      cfText.textContent = cfState.statusTextAr;
    }

    spBtns.forEach((btn) => {
      const sp = parseFloat(btn.getAttribute('data-sp') || '1');
      btn.classList.toggle('active', Math.abs(sp - activeBtnSpeed) < 0.05);
    });
  }

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initClosedShadowHud, { once: true });
  } else {
    initClosedShadowHud();
  }

})();
