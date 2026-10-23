/**
 * BraveCount Pro v3.6 — Background Service Worker
 * Features:
 *  - Instant Live Injection into ALL already-open tabs on install/reload (via chrome.scripting.executeScript)
 *    so the user never has to refresh open tabs like JumpTask or FaucetCrypto after loading the extension!
 *  - Pre-configured JumpTask profile (app.jumptask.io) with Full-Warp Clock + 10x default speed
 *  - Safe 1.0x defaults for AutoDutchy Login & Cloudflare Zero-Interference Shield
 */

const DEFAULT_SETTINGS = {
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

  // Speed / Time-Warp (Safe 1.0x global default)
  speedEnabled: false,
  speedFactor: 1.0,
  videoSpeedEnabled: false,
  videoSpeedFactor: 1.0,
  warpMode: 'timers_only',
  smartHoldEnabled: true,
  smartHoldGraceSec: 2.0,

  // Cloudflare Zero-Interference Shield
  cloudflareShield: true,
  autoBrakeOnCaptcha: true,
  autoScrollToCaptcha: true,
  cleanCaptchaOverlays: true,
  autoSelectTurnstile: true,
  nativeTrustedClick: false,
  cdpFocusEmulation: false,
  keyboardSpaceFallback: false,
  multiTabConditioner: true,
  autoSubmitAfterSolve: true,
  autoCloseTabAfterClaim: false,
  retryOnStall: true,

  // UI & Stats
  showFloatingHud: true,
  hudMinimized: false,
  statsCaptchasSolved: 0,
  statsAdsCompleted: 0,

  // Pre-configured Site Profiles
  siteProfiles: {
    'autofaucet.dutchycorp.space': {
      alwaysActive: true,
      windowSurfShield: true,
      cloudflareShield: true,
      autoBrakeOnCaptcha: true,
      autoSelectTurnstile: true,
      nativeTrustedClick: false,
      cdpFocusEmulation: false,
      smartHoldEnabled: true,
      warpMode: 'timers_only'
    },
    'aviso.bz': {
      alwaysActive: true,
      windowSurfShield: true,
      avisoYouTubeMode: true,
      silentAudioKeepAlive: true,
      smartHoldEnabled: true,
      warpMode: 'timers_only'
    },
    'faucetcrypto.com': {
      alwaysActive: true,
      windowSurfShield: true,
      cloudflareShield: true,
      autoBrakeOnCaptcha: true,
      nativeTrustedClick: false,
      cdpFocusEmulation: false,
      smartHoldEnabled: true,
      warpMode: 'full_warp',
      speedEnabled: true,
      speedFactor: 5.0
    },
    'app.jumptask.io': {
      alwaysActive: true,
      windowSurfShield: true,
      cloudflareShield: true,
      autoBrakeOnCaptcha: true,
      nativeTrustedClick: false,
      cdpFocusEmulation: false,
      smartHoldEnabled: false,
      warpMode: 'full_warp',
      speedEnabled: true,
      speedFactor: 10.0,
      jumpTaskAutoContinue: true
    }
  }
};

// Inject content scripts immediately into all already-open http/https tabs so the user
// sees the HUD and speed acceleration right away without having to refresh open tabs!
function injectIntoAllOpenTabs() {
  if (!chrome.tabs || !chrome.scripting || !chrome.scripting.executeScript) return;
  try {
    chrome.tabs.query({}, (tabs) => {
      if (!tabs) return;
      tabs.forEach((tab) => {
        if (!tab || !tab.id || !tab.url) return;
        if (!tab.url.startsWith('http://') && !tab.url.startsWith('https://')) return;
        if (
          tab.url.includes('accounts.google.com') ||
          tab.url.includes('accounts.youtube.com') ||
          tab.url.includes('myaccount.google.com') ||
          tab.url.includes('login.microsoftonline.com') ||
          tab.url.includes('appleid.apple.com')
        ) {
          return;
        }
        protectTabFromDiscard(tab.id);
        chrome.scripting.executeScript({
          target: { tabId: tab.id, allFrames: true },
          files: ['src/content/main-world-core.js'],
          world: 'MAIN'
        }).catch(() => {});
        chrome.scripting.executeScript({
          target: { tabId: tab.id, allFrames: true },
          files: ['src/content/isolated-bridge.js'],
          world: 'ISOLATED'
        }).catch(() => {});
      });
    });
  } catch (_) {}
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(null, (existing) => {
    const keepUserSpeed = Boolean(existing && existing.userSelectedSpeed);
    const merged = Object.assign({}, DEFAULT_SETTINGS, existing || {}, {
      speedEnabled: keepUserSpeed ? Boolean(existing.speedEnabled) : false,
      speedFactor: keepUserSpeed ? Number(existing.speedFactor || 1.0) : 1.0,
      nativeTrustedClick: false,
      cdpFocusEmulation: false,
      keyboardSpaceFallback: false,
      windowSurfShield: true,
      jumpTaskAutoContinue: true,
      showFloatingHud: true,
      siteProfiles: Object.assign({}, DEFAULT_SETTINGS.siteProfiles, (existing && existing.siteProfiles) || {}, {
        'faucetcrypto.com': DEFAULT_SETTINGS.siteProfiles['faucetcrypto.com'],
        'app.jumptask.io': DEFAULT_SETTINGS.siteProfiles['app.jumptask.io']
      })
    });
    chrome.storage.local.set(merged, () => {
      injectIntoAllOpenTabs();
    });
  });
});

// Prevent Brave from discarding/freezing any open tab in background
function protectTabFromDiscard(tabId) {
  if (!tabId) return;
  try {
    chrome.tabs.update(tabId, { autoDiscardable: false }).catch(() => {});
  } catch (_) {}
}

chrome.tabs.onCreated.addListener((tab) => {
  if (tab && tab.id) protectTabFromDiscard(tab.id);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading' || changeInfo.status === 'complete') {
    protectTabFromDiscard(tabId);
  }
});

// Multi-Tab Background Conditioner Sweep
chrome.alarms.create('bc_multitab_conditioner', { periodInMinutes: 0.5 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm && alarm.name === 'bc_multitab_conditioner') {
    chrome.tabs.query({}, (tabs) => {
      if (!tabs) return;
      tabs.forEach((t) => {
        if (t.id && t.url && (t.url.startsWith('http://') || t.url.startsWith('https://'))) {
          protectTabFromDiscard(t.id);
          chrome.tabs.sendMessage(t.id, { type: 'CONDITION_OPEN_TAB_PULSE' }).catch(() => {});
        }
      });
    });
  }
});

// Optional C++ CDP Helper (only invoked if user explicitly enables experimental CDP click)
const activeDebuggerTabs = new Set();

function bezierPoint(p0, p1, p2, t) {
  const inv = 1 - t;
  return inv * inv * p0 + 2 * inv * t * p1 + t * t * p2;
}

async function conditionAndSolveCloudflareProgrammatically(tabId, opts = {}) {
  if (!tabId || activeDebuggerTabs.has(tabId)) return { ok: false, reason: 'busy' };
  activeDebuggerTabs.add(tabId);
  const target = { tabId };

  const x = Math.round(Number(opts.x) || 120);
  const y = Math.round(Number(opts.y) || 120);
  const doClick = opts.doClick !== false;
  const useSpaceFallback = Boolean(msgOrOpts(opts).useSpaceFallback);

  try {
    await chrome.debugger.attach(target, '1.3');

    try {
      await chrome.debugger.sendCommand(target, 'Emulation.setFocusEmulationEnabled', {
        enabled: true
      });
    } catch (_) {}

    const startX = Math.max(15, x - 70 - Math.floor(Math.random() * 45));
    const startY = Math.max(15, y - 40 + Math.floor((Math.random() - 0.5) * 50));
    const ctrlX = Math.round((startX + x) / 2 + (Math.random() - 0.5) * 35);
    const ctrlY = Math.round((startY + y) / 2 - 20 + (Math.random() - 0.5) * 30);

    const steps = 5;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const bx = Math.round(bezierPoint(startX, ctrlX, x, t));
      const by = Math.round(bezierPoint(startY, ctrlY, y, t));
      await chrome.debugger.sendCommand(target, 'Input.dispatchMouseEvent', {
        type: 'mouseMoved',
        x: bx,
        y: by,
        button: 'none',
        pointerType: 'mouse'
      });
      await new Promise((r) => setTimeout(r, 18 + Math.floor(Math.random() * 18)));
    }

    if (doClick) {
      await chrome.debugger.sendCommand(target, 'Input.dispatchMouseEvent', {
        type: 'mousePressed',
        x,
        y,
        button: 'left',
        buttons: 1,
        clickCount: 1,
        pointerType: 'mouse'
      });

      await new Promise((r) => setTimeout(r, 68 + Math.floor(Math.random() * 67)));

      await chrome.debugger.sendCommand(target, 'Input.dispatchMouseEvent', {
        type: 'mouseReleased',
        x,
        y,
        button: 'left',
        buttons: 0,
        clickCount: 1,
        pointerType: 'mouse'
      });

      if (useSpaceFallback) {
        await new Promise((r) => setTimeout(r, 110));
        await chrome.debugger.sendCommand(target, 'Input.dispatchKeyEvent', {
          type: 'keyDown',
          windowsVirtualKeyCode: 32,
          nativeVirtualKeyCode: 32,
          key: ' ',
          code: 'Space',
          text: ' '
        });
        await new Promise((r) => setTimeout(r, 55 + Math.floor(Math.random() * 35)));
        await chrome.debugger.sendCommand(target, 'Input.dispatchKeyEvent', {
          type: 'keyUp',
          windowsVirtualKeyCode: 32,
          nativeVirtualKeyCode: 32,
          key: ' ',
          code: 'Space'
        });
      }
    }

    await new Promise((r) => setTimeout(r, 90));
    await chrome.debugger.detach(target);
    activeDebuggerTabs.delete(tabId);
    return { ok: true };
  } catch (err) {
    try { await chrome.debugger.detach(target); } catch (_) {}
    activeDebuggerTabs.delete(tabId);
    return { ok: false, error: String((err && err.message) || err) };
  }
}

function msgOrOpts(o) {
  return o || {};
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || !msg.type) return;

  if (msg.type === 'REQUEST_NATIVE_TRUSTED_CLICK' || msg.type === 'CONDITION_AND_SOLVE_CLOUDFLARE') {
    const tabId = (sender && sender.tab && sender.tab.id) || msg.tabId;
    conditionAndSolveCloudflareProgrammatically(tabId, {
      x: msg.x,
      y: msg.y,
      doClick: msg.doClick !== false,
      useSpaceFallback: Boolean(msg.useSpaceFallback)
    }).then(sendResponse);
    return true;
  }

  if (msg.type === 'UPDATE_BADGE_TELEMETRY') {
    const tabId = sender && sender.tab && sender.tab.id;
    if (!tabId) return;

    const rem = msg.remainingSec;
    const cfStatus = msg.cfStatus;

    if (cfStatus === 'solved') {
      chrome.action.setBadgeText({ tabId, text: '✓' }).catch(() => {});
      chrome.action.setBadgeBackgroundColor({ tabId, color: '#10b981' }).catch(() => {});
    } else if (typeof rem === 'number' && rem >= 0 && rem <= 3600) {
      const badgeStr = rem >= 600 ? `${Math.ceil(rem / 60)}m` : `${rem}s`;
      chrome.action.setBadgeText({ tabId, text: badgeStr }).catch(() => {});
      chrome.action.setBadgeBackgroundColor({ tabId, color: rem === 0 ? '#10b981' : '#0284c7' }).catch(() => {});
    } else if (msg.speedFactor && msg.speedFactor > 1.0) {
      chrome.action.setBadgeText({ tabId, text: `${msg.speedFactor}x` }).catch(() => {});
      chrome.action.setBadgeBackgroundColor({ tabId, color: '#f59e0b' }).catch(() => {});
    } else {
      chrome.action.setBadgeText({ tabId, text: 'ON' }).catch(() => {});
      chrome.action.setBadgeBackgroundColor({ tabId, color: '#0d9488' }).catch(() => {});
    }
    return;
  }
});

// Global Keyboard Shortcuts (Alt+Up, Alt+Down, Alt+R)
const SPEED_STEPS = [1.0, 1.2, 1.5, 2.0, 3.0, 5.0, 10.0, 20.0, 50.0];

chrome.commands.onCommand.addListener((command) => {
  chrome.storage.local.get(['speedEnabled', 'speedFactor'], (res) => {
    let current = res.speedEnabled ? (Number(res.speedFactor) || 1.0) : 1.0;

    if (command === 'panic-reset') {
      chrome.storage.local.set({
        speedEnabled: false,
        speedFactor: 1.0,
        videoSpeedEnabled: false,
        videoSpeedFactor: 1.0
      });
      return;
    }

    let idx = SPEED_STEPS.findIndex((s) => s >= current);
    if (idx === -1) idx = SPEED_STEPS.length - 1;

    if (command === 'speed-up') {
      idx = Math.min(SPEED_STEPS.length - 1, idx + 1);
    } else if (command === 'speed-down') {
      idx = Math.max(0, idx - 1);
    }

    const nextSpeed = SPEED_STEPS[idx];
    chrome.storage.local.set({
      speedEnabled: nextSpeed > 1.0,
      speedFactor: nextSpeed
    });
  });
});
