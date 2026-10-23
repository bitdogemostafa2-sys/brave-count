/**
 * BraveCount Pro v3.1 — Popup Controller (100% Programmatic, Zero External APIs)
 */
(function () {
  'use strict';

  const CHECKBOX_IDS = [
    'enabled',
    'speedEnabled',
    'videoSpeedEnabled',
    'smartHoldEnabled',
    'cdpFocusEmulation',
    'autoBrakeOnCaptcha',
    'nativeTrustedClick',
    'keyboardSpaceFallback',
    'autoSubmitAfterSolve',
    'alwaysActive',
    'avisoYouTubeMode',
    'silentAudioKeepAlive',
    'multiTabConditioner',
    'showFloatingHud'
  ];

  const rngSpeed = document.getElementById('rng-speedFactor');
  const lblSpeed = document.getElementById('lbl-speedFactor');
  const rngVideoSpeed = document.getElementById('rng-videoSpeedFactor');
  const lblVideoSpeed = document.getElementById('lbl-videoSpeedFactor');
  const selWarpMode = document.getElementById('sel-warpMode');
  const pillBtns = document.querySelectorAll('.pill-btn');

  // Tab navigation
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');
  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');
      tabBtns.forEach((b) => b.classList.toggle('active', b === btn));
      tabPanels.forEach((p) => p.classList.toggle('active', p.id === targetId));
    });
  });

  function updateSpeedUI(speedVal) {
    const val = Math.round((Number(speedVal) || 1.0) * 10) / 10;
    if (rngSpeed) rngSpeed.value = val;
    if (lblSpeed) lblSpeed.textContent = `${val}x`;
    pillBtns.forEach((p) => {
      const sp = parseFloat(p.getAttribute('data-sp') || '1.0');
      p.classList.toggle('active', Math.abs(sp - val) < 0.05);
    });
  }

  function updateVideoSpeedUI(videoVal) {
    const val = Math.round((Number(videoVal) || 1.0) * 10) / 10;
    if (rngVideoSpeed) rngVideoSpeed.value = val;
    if (lblVideoSpeed) lblVideoSpeed.textContent = `${val}x`;
  }

  function saveSetting(patch) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set(patch);
    }
  }

  // Load initial settings
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(null, (data) => {
      CHECKBOX_IDS.forEach((key) => {
        const el = document.getElementById(`chk-${key}`);
        if (el && key in data) {
          el.checked = Boolean(data[key]);
        }
      });
      if (data.speedFactor !== undefined) updateSpeedUI(data.speedFactor);
      if (data.videoSpeedFactor !== undefined) updateVideoSpeedUI(data.videoSpeedFactor);
      if (selWarpMode && data.warpMode) selWarpMode.value = data.warpMode;
    });
  }

  // Bind checkboxes
  CHECKBOX_IDS.forEach((key) => {
    const el = document.getElementById(`chk-${key}`);
    if (!el) return;
    el.addEventListener('change', () => {
      saveSetting({ [key]: el.checked });
    });
  });

  // Bind speed slider
  if (rngSpeed) {
    rngSpeed.addEventListener('input', () => {
      const val = parseFloat(rngSpeed.value) || 1.0;
      const enabled = val > 1.0;
      const chk = document.getElementById('chk-speedEnabled');
      if (chk) chk.checked = enabled;
      updateSpeedUI(val);
      saveSetting({ speedFactor: val, speedEnabled: enabled });
    });
  }

  // Bind quick speed pills
  pillBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const sp = parseFloat(btn.getAttribute('data-sp') || '1.0');
      const enabled = sp > 1.0;
      const chk = document.getElementById('chk-speedEnabled');
      if (chk) chk.checked = enabled;
      updateSpeedUI(sp);
      saveSetting({ speedFactor: sp, speedEnabled: enabled });
    });
  });

  // Bind video speed slider
  if (rngVideoSpeed) {
    rngVideoSpeed.addEventListener('input', () => {
      const val = parseFloat(rngVideoSpeed.value) || 1.0;
      const enabled = val > 1.0;
      const chk = document.getElementById('chk-videoSpeedEnabled');
      if (chk) chk.checked = enabled;
      updateVideoSpeedUI(val);
      saveSetting({ videoSpeedFactor: val, videoSpeedEnabled: enabled });
    });
  }

  // Bind warp mode selector
  if (selWarpMode) {
    selWarpMode.addEventListener('change', () => {
      saveSetting({ warpMode: selWarpMode.value });
    });
  }

  // Panic Reset button
  const btnPanic = document.getElementById('btn-panic');
  if (btnPanic) {
    btnPanic.addEventListener('click', () => {
      updateSpeedUI(1.0);
      updateVideoSpeedUI(1.0);
      const chkSp = document.getElementById('chk-speedEnabled');
      const chkVid = document.getElementById('chk-videoSpeedEnabled');
      if (chkSp) chkSp.checked = false;
      if (chkVid) chkVid.checked = false;
      saveSetting({
        speedEnabled: false,
        speedFactor: 1.0,
        videoSpeedEnabled: false,
        videoSpeedFactor: 1.0
      });
    });
  }

  // Open 300-Method Dashboard / Test Lab
  const btnDash = document.getElementById('btn-open-dashboard');
  if (btnDash) {
    btnDash.addEventListener('click', () => {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage();
      } else {
        window.open('../dashboard/index.html', '_blank');
      }
    });
  }

  // Poll active tab diagnostics
  function pollActiveTabTelemetry() {
    if (typeof chrome === 'undefined' || !chrome.tabs) return;
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs && tabs[0];
      if (!tab || !tab.id) return;

      try {
        const u = new URL(tab.url || '');
        const hostEl = document.getElementById('current-host');
        if (hostEl) hostEl.textContent = u.hostname || 'صفحة المتصفح';
      } catch (_) {}

      chrome.tabs.sendMessage(tab.id, { type: 'GET_TAB_DIAGNOSTICS' }, (res) => {
        if (chrome.runtime.lastError || !res) return;
        const teleFocus = document.getElementById('tele-focus');
        const teleTimer = document.getElementById('tele-timer');
        const teleCf = document.getElementById('tele-cf');
        const cfDetail = document.getElementById('cf-detail-status');

        if (teleFocus && res.telemetry) {
          teleFocus.textContent = (res.telemetry.visibilityState === 'visible' && res.telemetry.hasFocus)
            ? 'مهيأ ونشط 100%'
            : 'نشط برمجياً';
        }
        if (teleTimer && res.telemetry) {
          const rem = res.telemetry.detectedRemainingSec;
          teleTimer.textContent = (rem !== null && rem !== undefined)
            ? `${rem} ثانية (${res.telemetry.effectiveTimerSpeed}x)`
            : `السرعة ${res.telemetry.effectiveTimerSpeed || 1}x`;
        }
        if (teleCf && res.cloudflare) {
          if (res.cloudflare.status === 'solved') {
            teleCf.textContent = 'تم الحل برمجياً ✓';
          } else if (res.cloudflare.detected) {
            teleCf.textContent = 'جاري الحل البرمجي...';
          } else {
            teleCf.textContent = 'جاهز برمجياً ✓';
          }
        }
        if (cfDetail && res.cloudflare && res.cloudflare.statusTextAr) {
          cfDetail.textContent = res.cloudflare.statusTextAr;
        }
      });
    });
  }

  pollActiveTabTelemetry();
  setInterval(pollActiveTabTelemetry, 900);
})();
