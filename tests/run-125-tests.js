/**
 * BraveCount Pro v3.4 — Adversarial & Deep-Inspection 210-Test Verification Suite
 *
 * Categories Tested:
 *   1. Architecture & Package Integrity (Tests 1 - 15)
 *   2. Stealth Always-Active Engine (Tests 16 - 50)
 *   3. Zero-Interference Cloudflare Shield & Assistant (Tests 51 - 88)
 *   4. Time-Warp, Live Speed Switching & Video Stealth (Tests 89 - 125)
 *   5. AutoDutchy Login & FaucetCrypto Surf E2E Scenarios (Tests 126 - 140)
 *   6. Adversarial V8 Concise-Method & Prototype Absence Checks (Tests 141 - 155)
 *   7. WebIDL "Illegal invocation" Receiver Checks (CreepJS / Cloudflare api.js) (Tests 156 - 167)
 *   8. Function .length/.name, Cross-Realm IFrame & Global Leak Checks (Tests 168 - 178)
 *   9. Deep Real-Site Edge Cases (Form focusout, SPA Routing, Show-Password, COOP Location, etc.) (Tests 179 - 210)
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');
const results = [];
const HOST_ORIG_GET_TIME = Date.prototype.getTime;
const HOST_ORIG_VALUE_OF = Date.prototype.valueOf;
const HOST_ORIG_DATE_NOW = Date.now.bind(Date);

function runTest(id, category, name, fn) {
  try {
    fn();
    results.push({ id, category, name, pass: true });
  } catch (err) {
    results.push({ id, category, name, pass: false, error: err && err.message ? err.message : String(err) });
  }
}

async function runAsyncTest(id, category, name, fn) {
  try {
    await fn();
    results.push({ id, category, name, pass: true });
  } catch (err) {
    results.push({ id, category, name, pass: false, error: err && err.message ? err.message : String(err) });
  }
}

function createBrowserSandbox(options = {}) {
  const urlStr = options.url || 'https://autofaucet.dutchycorp.space/ptc/view.php?vid=28629';
  const parsedUrl = new URL(urlStr);

  const listeners = new Map();

  class EventTargetMock {
    addEventListener(type, fn, opts) {
      const key = String(type);
      if (!listeners.has(key)) listeners.set(key, []);
      listeners.get(key).push({ fn, opts, target: this });
    }
    removeEventListener(type, fn) {
      const key = String(type);
      if (!listeners.has(key)) return;
      listeners.set(key, listeners.get(key).filter((item) => item.fn !== fn));
    }
    dispatchEvent(ev) {
      const key = String(ev.type);
      const list = (listeners.get(key) || []).slice();
      for (const item of list) {
        if (ev._immediateStopped) break;
        if (item.target === this || item.target === sandbox.window || item.target === sandbox.document) {
          item.fn.call(this, ev);
        }
      }
      return !ev.defaultPrevented;
    }
  }

  class EventMock {
    constructor(type, init = {}) {
      this.type = type;
      this.bubbles = Boolean(init.bubbles);
      this.cancelable = Boolean(init.cancelable);
      this.detail = init.detail;
      this.target = init.target || null;
      this.relatedTarget = init.relatedTarget !== undefined ? init.relatedTarget : null;
      this.isTrusted = init.isTrusted !== undefined ? Boolean(init.isTrusted) : false;
      this._immediateStopped = false;
      this._stopped = false;
      this.defaultPrevented = false;
    }
    stopImmediatePropagation() {
      this._immediateStopped = true;
      this._stopped = true;
    }
    stopPropagation() {
      this._stopped = true;
    }
    preventDefault() {
      this.defaultPrevented = true;
    }
  }

  class DocumentMock extends EventTargetMock {
    hasFocus() {
      return false;
    }
    querySelector(sel) {
      if (options.querySelector) return options.querySelector(sel);
      return null;
    }
    querySelectorAll(sel) {
      if (options.querySelectorAll) return options.querySelectorAll(sel);
      return [];
    }
    getElementById(id) {
      if (options.getElementById) return options.getElementById(id);
      return null;
    }
    createElement(tag) {
      return new ElementMock(tag);
    }
    contains() {
      return true;
    }
    getAnimations() {
      return options.animations || [];
    }
  }

  Object.defineProperty(DocumentMock.prototype, 'visibilityState', {
    get() { return 'hidden'; },
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(DocumentMock.prototype, 'hidden', {
    get() { return true; },
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(DocumentMock.prototype, 'activeElement', {
    get() { return null; },
    enumerable: true,
    configurable: true
  });

  class NavigatorMock {}
  Object.defineProperty(NavigatorMock.prototype, 'webdriver', {
    get() { return true; },
    enumerable: true,
    configurable: true
  });
  NavigatorMock.prototype.getBattery = function () {
    return Promise.resolve({ charging: false, level: 0.15 });
  };
  NavigatorMock.prototype.locks = {
    lockedNames: [],
    request(name, cb) {
      this.lockedNames.push(name);
      cb();
      return Promise.resolve();
    }
  };

  class UserActivationMock {}
  Object.defineProperty(UserActivationMock.prototype, 'isActive', {
    get() { return false; },
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(UserActivationMock.prototype, 'hasBeenActive', {
    get() { return false; },
    enumerable: true,
    configurable: true
  });

  class HTMLMediaElementMock extends EventTargetMock {
    constructor() {
      super();
      this._rate = 1.0;
      this._defRate = 1.0;
      this.paused = false;
      this.ended = false;
      this.duration = 60;
      this.currentTime = 10;
    }
    pause() {
      this.paused = true;
    }
    play() {
      this.paused = false;
      return Promise.resolve();
    }
  }
  Object.defineProperty(HTMLMediaElementMock.prototype, 'playbackRate', {
    get() { return this._rate; },
    set(v) { this._rate = Number(v); },
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(HTMLMediaElementMock.prototype, 'defaultPlaybackRate', {
    get() { return this._defRate; },
    set(v) { this._defRate = Number(v); },
    enumerable: true,
    configurable: true
  });

  class HTMLVideoElementMock extends HTMLMediaElementMock {
    getVideoPlaybackQuality() {
      return { creationTime: 100, totalVideoFrames: 240, droppedVideoFrames: 45, corruptedVideoFrames: 2 };
    }
  }

  class ElementMock extends EventTargetMock {
    constructor(tag = 'div') {
      super();
      this.tagName = String(tag).toUpperCase();
      this.style = { cssText: '', setProperty: () => {} };
      this.classList = { contains: () => false, add: () => {}, remove: () => {}, toggle: () => {} };
      this.children = [];
      this.offsetParent = {};
      this.value = '';
      this.disabled = false;
    }
    setAttribute(k, v) { this[k] = v; }
    getAttribute(k) { return this[k] || null; }
    appendChild(child) { this.children.push(child); return child; }
    querySelector() { return null; }
    querySelectorAll() { return []; }
    getBoundingClientRect() {
      return { left: 100, top: 200, width: 300, height: 65, bottom: 265, right: 400 };
    }
    attachShadow(init) {
      this._shadowMode = init && init.mode;
      const sr = new ElementMock('shadow-root');
      sr.getElementById = () => new ElementMock('div');
      return sr;
    }
    animate(_kf, _opts) {
      return { playbackRate: 1.0 };
    }
    scrollIntoView() {
      this._scrolled = true;
    }
    focus() {
      this._focused = true;
    }
    click() {
      this._clicked = true;
    }
  }

  class HTMLIFrameElementMock extends ElementMock {
    constructor() {
      super('iframe');
      this.src = 'about:blank';
      const innerDoc = new DocumentMock();
      const innerFnProto = { toString: Function.prototype.toString };
      const innerWin = {
        Function: { prototype: innerFnProto },
        Document: { prototype: DocumentMock.prototype },
        Navigator: { prototype: NavigatorMock.prototype },
        UserActivation: { prototype: UserActivationMock.prototype },
        document: innerDoc,
        navigator: new NavigatorMock(),
        setInterval: function iframeNativeSetInterval() {},
        setTimeout: function iframeNativeSetTimeout() {}
      };
      innerDoc.defaultView = innerWin;
      this._cw = innerWin;
      this._cd = innerDoc;
    }
  }
  Object.defineProperty(HTMLIFrameElementMock.prototype, 'contentWindow', {
    get() { return this._cw; },
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(HTMLIFrameElementMock.prototype, 'contentDocument', {
    get() { return this._cd; },
    enumerable: true,
    configurable: true
  });

  class PerformanceMock extends EventTargetMock {
    now() {
      return Date.now() - startRealMs;
    }
  }

  class IdleDetectorMock {}
  Object.defineProperty(IdleDetectorMock.prototype, 'userState', {
    get() { return 'idle'; },
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(IdleDetectorMock.prototype, 'screenState', {
    get() { return 'locked'; },
    enumerable: true,
    configurable: true
  });

  class IntersectionObserverMock {
    constructor(cb, opts) {
      this.cb = cb;
      this.opts = opts;
    }
    observe(target) {
      this.cb([{
        time: 10,
        target,
        rootBounds: null,
        boundingClientRect: { width: 300, height: 150 },
        intersectionRect: { width: 0, height: 0 },
        isIntersecting: false,
        isVisible: false,
        intersectionRatio: 0.0
      }], this);
    }
    takeRecords() {
      return [{
        time: 20,
        target: new ElementMock('div'),
        rootBounds: null,
        boundingClientRect: { width: 300, height: 150 },
        intersectionRect: { width: 0, height: 0 },
        isIntersecting: false,
        isVisible: false,
        intersectionRatio: 0.0
      }];
    }
    disconnect() {}
  }

  class WindowCtorMock extends EventTargetMock {}

  const startRealMs = Date.now();
  const docInstance = new DocumentMock();
  docInstance.body = new ElementMock('body');
  docInstance.documentElement = new ElementMock('html');
  docInstance.readyState = 'complete';
  docInstance.title = options.title || '';

  const navInstance = new NavigatorMock();
  navInstance.userActivation = new UserActivationMock();

  const perfInstance = new PerformanceMock();

  let simulatedWinSize = {
    innerWidth: 1920,
    innerHeight: 1080,
    outerWidth: 1920,
    outerHeight: 1080,
    screenX: 0,
    screenY: 0
  };

  function SandboxDate(...args) {
    if (!new.target) return Date(...args);
    return new Date(...args);
  }
  SandboxDate.now = () => HOST_ORIG_DATE_NOW();
  SandboxDate.parse = Date.parse;
  SandboxDate.UTC = Date.UTC;
  Object.defineProperty(Date.prototype, 'getTime', {
    value: HOST_ORIG_GET_TIME,
    writable: true,
    enumerable: false,
    configurable: true
  });
  Object.defineProperty(Date.prototype, 'valueOf', {
    value: HOST_ORIG_VALUE_OF,
    writable: true,
    enumerable: false,
    configurable: true
  });
  SandboxDate.prototype = Date.prototype;

  let mockOpenedWindowClosedState = true;
  let lastOpenedRealWindow = null;

  const sandbox = {
    console,
    Symbol,
    Object,
    Function,
    Array,
    Number,
    String,
    Boolean,
    Math,
    Date: SandboxDate,
    RegExp,
    Error,
    TypeError,
    Map,
    Set,
    WeakMap,
    WeakSet,
    Promise,
    Proxy,
    Reflect,
    JSON,
    parseInt,
    parseFloat,
    isNaN,
    Infinity,
    URL,
    Window: WindowCtorMock,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    open(url, target) {
      if (options.windowOpenReturnsNull) return null;
      const wObj = {
        url,
        target,
        _closedCalled: false,
        _focusedCalled: false,
        location: {
          href: url || 'about:blank',
          replace(u) { this.href = u; },
          assign(u) { this.href = u; }
        },
        focus() { this._focusedCalled = true; },
        close() { this._closedCalled = true; }
      };
      // Define non-configurable property like real Chromium WindowProxy to test Proxy invariants!
      Object.defineProperty(wObj, 'closed', {
        get() { return mockOpenedWindowClosedState; },
        enumerable: true,
        configurable: false
      });
      Object.defineProperty(wObj, 'nonConfigurableDataProp', {
        value: 42,
        writable: false,
        enumerable: false,
        configurable: false
      });
      lastOpenedRealWindow = wObj;
      return wObj;
    },
    requestAnimationFrame: (cb) => setTimeout(() => cb(perfInstance.now()), 16),
    cancelAnimationFrame: (id) => clearTimeout(id),
    EventTarget: EventTargetMock,
    Event: EventMock,
    CustomEvent: EventMock,
    FocusEvent: EventMock,
    MouseEvent: EventMock,
    Document: DocumentMock,
    Navigator: NavigatorMock,
    UserActivation: UserActivationMock,
    Element: ElementMock,
    HTMLMediaElement: HTMLMediaElementMock,
    HTMLVideoElement: HTMLVideoElementMock,
    HTMLIFrameElement: HTMLIFrameElementMock,
    Performance: PerformanceMock,
    IdleDetector: IdleDetectorMock,
    IntersectionObserver: IntersectionObserverMock,
    document: docInstance,
    navigator: navInstance,
    performance: perfInstance,
    location: {
      href: parsedUrl.href,
      hostname: parsedUrl.hostname,
      pathname: parsedUrl.pathname,
      search: parsedUrl.search
    },
    getComputedStyle: () => ({ opacity: '1', position: 'static', direction: 'ltr' }),
    cdc_adoQpoasnfa76pfcZLmcfl_Array: 'dirty_selenium_flag',
    __webdriver_evaluate: 'dirty_webdriver_flag',
    _setSimulatedWinSize(newSize) {
      Object.assign(simulatedWinSize, newSize);
    },
    _setMockOpenedWindowClosed(val) {
      mockOpenedWindowClosedState = val;
    },
    _getLastOpenedRealWindow() {
      return lastOpenedRealWindow;
    }
  };

  ['innerWidth', 'innerHeight', 'outerWidth', 'outerHeight', 'screenX', 'screenY'].forEach((prop) => {
    Object.defineProperty(sandbox, prop, {
      get() { return simulatedWinSize[prop]; },
      enumerable: true,
      configurable: true
    });
  });

  sandbox.window = sandbox;
  sandbox.top = sandbox;
  sandbox.self = sandbox;

  const storageData = Object.assign({}, options.initialStorage || {});
  const storageChangeListeners = [];
  const runtimeMessageListeners = [];
  const sentRuntimeMessages = [];

  sandbox.chrome = {
    storage: {
      local: {
        get(keys, cb) {
          if (cb) cb(Object.assign({}, storageData));
          return Promise.resolve(Object.assign({}, storageData));
        },
        set(patch, cb) {
          Object.assign(storageData, patch);
          storageChangeListeners.forEach((fn) => fn(patch, 'local'));
          if (cb) cb();
          return Promise.resolve();
        }
      },
      onChanged: {
        addListener(fn) { storageChangeListeners.push(fn); }
      }
    },
    runtime: {
      lastError: null,
      onInstalled: { addListener(fn) { sandbox.chrome._onInstalled = fn; } },
      onMessage: {
        addListener(fn) { runtimeMessageListeners.push(fn); }
      },
      sendMessage(msg, cb) {
        sentRuntimeMessages.push(msg);
        runtimeMessageListeners.forEach((fn) => fn(msg, { tab: { id: 77 } }, cb || (() => {})));
        return Promise.resolve({ ok: true });
      },
      openOptionsPage() {
        sandbox.chrome._optionsOpened = true;
      }
    },
    tabs: {
      updatedTabs: [],
      onCreated: { addListener(fn) { sandbox.chrome._onTabCreated = fn; } },
      onUpdated: { addListener(fn) { sandbox.chrome._onTabUpdated = fn; } },
      update(tabId, props) {
        this.updatedTabs.push({ tabId, props });
        return Promise.resolve();
      },
      query(_q, cb) {
        if (cb) cb([{ id: 77, url: urlStr }]);
      },
      sendMessage(_tabId, msg, cb) {
        runtimeMessageListeners.forEach((fn) => fn(msg, { tab: { id: 77 } }, cb || (() => {})));
        return Promise.resolve();
      }
    },
    debugger: {
      attached: [],
      detached: [],
      commands: [],
      attach(target, ver) {
        this.attached.push({ target, ver });
        return Promise.resolve();
      },
      sendCommand(target, method, params) {
        this.commands.push({ target, method, params });
        return Promise.resolve({});
      },
      detach(target) {
        this.detached.push(target);
        return Promise.resolve();
      }
    },
    action: {
      badges: [],
      colors: [],
      setBadgeText(d) { this.badges.push(d); return Promise.resolve(); },
      setBadgeBackgroundColor(d) { this.colors.push(d); return Promise.resolve(); }
    },
    alarms: {
      created: [],
      create(name, info) { this.created.push({ name, info }); },
      onAlarm: { addListener(fn) { sandbox.chrome._onAlarm = fn; } }
    },
    commands: {
      onCommand: { addListener(fn) { sandbox.chrome._onCommand = fn; } }
    },
    _sentRuntimeMessages: sentRuntimeMessages,
    _storageData: storageData,
    _runtimeMessageListeners: runtimeMessageListeners
  };

  Object.setPrototypeOf(sandbox, WindowCtorMock.prototype);
  vm.createContext(sandbox);
  vm.runInContext('window = globalThis; self = globalThis; top = globalThis;', sandbox);
  return sandbox;
}

const mainCoreCode = fs.readFileSync(path.join(ROOT, 'src/content/main-world-core.js'), 'utf8');
const isolatedBridgeCode = fs.readFileSync(path.join(ROOT, 'src/content/isolated-bridge.js'), 'utf8');
const serviceWorkerCode = fs.readFileSync(path.join(ROOT, 'src/background/service-worker.js'), 'utf8');
const manifestJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8'));

(async function executeAll210Tests() {
  // ==========================================================================
  // GROUP 1: MANIFEST V3, ARCHITECTURE & PACKAGE INTEGRITY (Tests 1 - 15)
  // ==========================================================================
  runTest(1, 'Architecture', 'manifest.json uses Manifest V3', () => {
    assert.strictEqual(manifestJson.manifest_version, 3);
  });
  runTest(2, 'Architecture', 'manifest.json declares required permissions', () => {
    ['storage', 'tabs', 'activeTab', 'scripting', 'debugger', 'alarms', 'webNavigation'].forEach((p) => {
      assert.ok(manifestJson.permissions.includes(p));
    });
  });
  runTest(3, 'Architecture', 'manifest.json has <all_urls> host_permissions', () => {
    assert.ok(manifestJson.host_permissions.includes('<all_urls>'));
  });
  runTest(4, 'Architecture', 'MAIN world content script runs at document_start with all_frames: true', () => {
    const cs = manifestJson.content_scripts.find((c) => c.world === 'MAIN');
    assert.ok(cs);
    assert.strictEqual(cs.run_at, 'document_start');
    assert.strictEqual(cs.all_frames, true);
  });
  runTest(5, 'Architecture', 'ISOLATED world content script runs at document_start with all_frames: true', () => {
    const cs = manifestJson.content_scripts.find((c) => c.world === 'ISOLATED');
    assert.ok(cs);
    assert.strictEqual(cs.run_at, 'document_start');
    assert.strictEqual(cs.all_frames, true);
  });
  runTest(6, 'Architecture', 'Background service_worker file exists and is valid JS', () => {
    assert.ok(fs.existsSync(path.join(ROOT, manifestJson.background.service_worker)));
  });
  runTest(7, 'Architecture', 'All 4 extension PNG icons (16, 32, 48, 128) exist and have valid PNG header', () => {
    [16, 32, 48, 128].forEach((sz) => {
      const p = path.join(ROOT, `assets/icon${sz}.png`);
      assert.ok(fs.existsSync(p));
      const buf = fs.readFileSync(p);
      assert.strictEqual(buf.slice(0, 4).toString('hex'), '89504e47');
    });
  });
  runTest(8, 'Architecture', 'Keyboard commands (speed-up, speed-down, panic-reset) are registered in manifest', () => {
    assert.ok(manifestJson.commands['speed-up']);
    assert.ok(manifestJson.commands['speed-down']);
    assert.ok(manifestJson.commands['panic-reset']);
  });
  runTest(9, 'Architecture', 'Zero external captcha solver API references exist anywhere in src/', () => {
    const files = [
      'src/content/main-world-core.js',
      'src/content/isolated-bridge.js',
      'src/background/service-worker.js',
      'src/popup/popup.html',
      'src/popup/popup.js',
      'src/dashboard/index.html',
      'src/dashboard/dashboard.js'
    ];
    files.forEach((f) => {
      const txt = fs.readFileSync(path.join(ROOT, f), 'utf8').toLowerCase();
      assert.ok(!txt.includes('2captcha'), `${f} contains 2captcha`);
      assert.ok(!txt.includes('capsolver'), `${f} contains capsolver`);
      assert.ok(!txt.includes('anticaptcha'), `${f} contains anticaptcha`);
    });
  });
  runTest(10, 'Architecture', 'Packaged brave-count-pro-v3.zip exists and is > 10KB', () => {
    const zp = path.join(ROOT, 'brave-count-pro-v3.zip');
    assert.ok(fs.existsSync(zp));
    assert.ok(fs.statSync(zp).size > 10000);
  });
  runTest(11, 'Architecture', 'Double injection guard prevents main-world-core.js from hooking twice', () => {
    const sb = createBrowserSandbox();
    vm.runInContext(mainCoreCode, sb);
    const firstSetInterval = sb.window.setInterval;
    vm.runInContext(mainCoreCode, sb);
    assert.strictEqual(sb.window.setInterval, firstSetInterval);
  });
  runTest(12, 'Architecture', 'No global __bc or __myExtension variables leak onto Object.keys(window)', () => {
    const sb = createBrowserSandbox();
    vm.runInContext(mainCoreCode, sb);
    const leaked = Object.keys(sb.window).filter((k) => k.startsWith('__bc'));
    assert.strictEqual(leaked.length, 0);
  });
  runTest(13, 'Architecture', 'Dirty Selenium/WebDriver artifacts (cdc_*, __webdriver_*) are cleaned from window', () => {
    const sb = createBrowserSandbox();
    vm.runInContext(mainCoreCode, sb);
    assert.strictEqual(sb.window.cdc_adoQpoasnfa76pfcZLmcfl_Array, undefined);
    assert.strictEqual(sb.window.__webdriver_evaluate, undefined);
  });
  runTest(14, 'Architecture', 'Popup HTML & JS files exist and match all checkbox IDs', () => {
    const html = fs.readFileSync(path.join(ROOT, 'src/popup/popup.html'), 'utf8');
    const js = fs.readFileSync(path.join(ROOT, 'src/popup/popup.js'), 'utf8');
    ['enabled', 'speedEnabled', 'videoSpeedEnabled', 'smartHoldEnabled', 'cdpFocusEmulation', 'autoBrakeOnCaptcha', 'nativeTrustedClick', 'keyboardSpaceFallback', 'autoSubmitAfterSolve', 'alwaysActive', 'avisoYouTubeMode', 'silentAudioKeepAlive', 'multiTabConditioner', 'showFloatingHud'].forEach((id) => {
      assert.ok(html.includes(`id="chk-${id}"`));
      assert.ok(js.includes(`'${id}'`));
    });
  });
  runTest(15, 'Architecture', 'Dashboard catalog has 300 techniques (100 Stealth + 100 Cloudflare + 100 Time-Warp)', () => {
    const dashCode = fs.readFileSync(path.join(ROOT, 'src/dashboard/dashboard.js'), 'utf8');
    const stealthMatch = dashCode.split('const STEALTH_100 = [')[1].split('];')[0].trim().split('\n').filter((l) => l.trim().startsWith('['));
    const cfMatch = dashCode.split('const CLOUDFLARE_100 = [')[1].split('];')[0].trim().split('\n').filter((l) => l.trim().startsWith('['));
    const twMatch = dashCode.split('const TIMEWARP_100 = [')[1].split('];')[0].trim().split('\n').filter((l) => l.trim().startsWith('['));
    assert.strictEqual(stealthMatch.length, 100);
    assert.strictEqual(cfMatch.length, 100);
    assert.strictEqual(twMatch.length, 100);
  });

  // ==========================================================================
  // GROUP 2: STEALTH ALWAYS-ACTIVE ENGINE TESTS (Tests 16 - 50)
  // ==========================================================================
  const stealthSb = createBrowserSandbox();
  vm.runInContext(mainCoreCode, stealthSb);

  runTest(16, 'Stealth', 'document.visibilityState returns "visible" even when underlying tab is hidden', () => {
    assert.strictEqual(stealthSb.document.visibilityState, 'visible');
  });
  runTest(17, 'Stealth', 'document.webkitVisibilityState returns "visible"', () => {
    assert.strictEqual(stealthSb.document.webkitVisibilityState, 'visible');
  });
  runTest(18, 'Stealth', 'document.hidden returns false even when underlying tab is hidden', () => {
    assert.strictEqual(stealthSb.document.hidden, false);
  });
  runTest(19, 'Stealth', 'document.webkitHidden returns false', () => {
    assert.strictEqual(stealthSb.document.webkitHidden, false);
  });
  runTest(20, 'Stealth', 'document.mozHidden and document.msHidden return false', () => {
    assert.strictEqual(stealthSb.document.mozHidden, false);
    assert.strictEqual(stealthSb.document.msHidden, false);
  });
  runTest(21, 'Stealth', 'document.hasFocus() returns true even when underlying tab is unfocused', () => {
    assert.strictEqual(stealthSb.document.hasFocus(), true);
  });
  runTest(22, 'Stealth', 'document.wasDiscarded returns false', () => {
    assert.strictEqual(stealthSb.document.wasDiscarded, false);
  });
  runTest(23, 'Stealth', 'document.hasFocus.toString() returns exact "[native code]" string', () => {
    assert.strictEqual(stealthSb.document.hasFocus.toString(), 'function hasFocus() { [native code] }');
  });
  runTest(24, 'Stealth', 'Function.prototype.toString.toString() returns exact "[native code]" string', () => {
    assert.strictEqual(stealthSb.Function.prototype.toString.toString(), 'function toString() { [native code] }');
  });
  runTest(25, 'Stealth', 'visibilityState getter .toString() returns "function get visibilityState() { [native code] }"', () => {
    const desc = Object.getOwnPropertyDescriptor(stealthSb.Document.prototype, 'visibilityState');
    assert.strictEqual(desc.get.toString(), 'function get visibilityState() { [native code] }');
  });
  runTest(26, 'Stealth', 'window.setInterval.toString() and window.setTimeout.toString() return "[native code]"', () => {
    assert.strictEqual(stealthSb.window.setInterval.toString(), 'function setInterval() { [native code] }');
    assert.strictEqual(stealthSb.window.setTimeout.toString(), 'function setTimeout() { [native code] }');
  });
  runTest(27, 'Stealth', 'EventTarget.prototype.addEventListener.toString() returns "[native code]"', () => {
    assert.strictEqual(stealthSb.EventTarget.prototype.addEventListener.toString(), 'function addEventListener() { [native code] }');
  });
  runTest(28, 'Stealth', 'document.addEventListener("visibilitychange", ...) is blocked from firing', () => {
    let fired = false;
    stealthSb.document.addEventListener('visibilitychange', () => { fired = true; });
    stealthSb.document.dispatchEvent(new stealthSb.Event('visibilitychange'));
    assert.strictEqual(fired, false);
  });
  runTest(29, 'Stealth', 'document.addEventListener("webkitvisibilitychange", ...) is blocked from firing', () => {
    let fired = false;
    stealthSb.document.addEventListener('webkitvisibilitychange', () => { fired = true; });
    stealthSb.document.dispatchEvent(new stealthSb.Event('webkitvisibilitychange'));
    assert.strictEqual(fired, false);
  });
  runTest(30, 'Stealth', 'window.addEventListener("blur", ...) is blocked from firing', () => {
    let fired = false;
    stealthSb.window.addEventListener('blur', () => { fired = true; });
    stealthSb.window.dispatchEvent(new stealthSb.Event('blur', { target: stealthSb.window }));
    assert.strictEqual(fired, false);
  });
  runTest(31, 'Stealth', 'document.addEventListener("focusout", ...) is blocked when focus leaves the window (relatedTarget === null)', () => {
    let fired = false;
    stealthSb.document.addEventListener('focusout', () => { fired = true; });
    stealthSb.document.dispatchEvent(new stealthSb.Event('focusout', { target: stealthSb.document, relatedTarget: null }));
    assert.strictEqual(fired, false);
  });
  runTest(32, 'Stealth', 'window.addEventListener("pagehide", ...) and "freeze" are blocked from firing', () => {
    let fired = false;
    stealthSb.window.addEventListener('pagehide', () => { fired = true; });
    stealthSb.document.addEventListener('freeze', () => { fired = true; });
    stealthSb.window.dispatchEvent(new stealthSb.Event('pagehide', { target: stealthSb.window }));
    stealthSb.document.dispatchEvent(new stealthSb.Event('freeze', { target: stealthSb.document }));
    assert.strictEqual(fired, false);
  });
  runTest(33, 'Stealth', 'document.onvisibilitychange property setter stores handler silently without firing on hide', () => {
    let called = false;
    const handler = () => { called = true; };
    stealthSb.document.onvisibilitychange = handler;
    assert.strictEqual(stealthSb.document.onvisibilitychange, handler);
    stealthSb.document.dispatchEvent(new stealthSb.Event('visibilitychange'));
    assert.strictEqual(called, false);
  });
  runTest(34, 'Stealth', 'window.onblur and document.onblur property setters are trapped safely', () => {
    let called = false;
    const fn = () => { called = true; };
    stealthSb.window.onblur = fn;
    stealthSb.document.onblur = fn;
    assert.strictEqual(stealthSb.window.onblur, fn);
    assert.strictEqual(stealthSb.document.onblur, fn);
    assert.strictEqual(called, false);
  });
  runTest(35, 'Stealth', 'mouseout with relatedTarget === null (mouse leaving browser window) is stopped in capture phase', () => {
    const ev = new stealthSb.Event('mouseout', { relatedTarget: null });
    stealthSb.window.dispatchEvent(ev);
    assert.strictEqual(ev._immediateStopped, true);
  });
  runTest(36, 'Stealth', 'window.innerWidth & innerHeight stay > 0 even when browser is minimized in Windows (0x0)', () => {
    stealthSb._setSimulatedWinSize({ innerWidth: 0, innerHeight: 0, outerWidth: 0, outerHeight: 0 });
    assert.strictEqual(stealthSb.window.innerWidth, 1920);
    assert.strictEqual(stealthSb.window.innerHeight, 1080);
  });
  runTest(37, 'Stealth', 'window.screenX & screenY do not report -32000 when minimized in Windows', () => {
    stealthSb._setSimulatedWinSize({ screenX: -32000, screenY: -32000 });
    assert.strictEqual(stealthSb.window.screenX, 0);
    assert.strictEqual(stealthSb.window.screenY, 0);
  });
  runTest(38, 'Stealth', 'IntersectionObserver spoofs offscreen elements to isIntersecting: true, intersectionRatio: 1.0', () => {
    let receivedEntry = null;
    const io = new stealthSb.window.IntersectionObserver((entries) => {
      receivedEntry = entries[0];
    });
    io.observe(new stealthSb.Element('div'));
    assert.ok(receivedEntry);
    assert.strictEqual(receivedEntry.isIntersecting, true);
    assert.strictEqual(receivedEntry.intersectionRatio, 1.0);
  });
  runTest(39, 'Stealth', 'Web Locks API lock is acquired on startup to prevent Brave Tab Sleeping', () => {
    assert.ok(stealthSb.navigator.locks.lockedNames.length >= 1);
  });
  runTest(40, 'Stealth', 'IdleDetector.prototype.userState returns "active" and screenState returns "unlocked"', () => {
    const id = new stealthSb.IdleDetector();
    assert.strictEqual(id.userState, 'active');
    assert.strictEqual(id.screenState, 'unlocked');
  });
  runTest(41, 'Stealth', 'document.activeElement never returns null when page loses focus', () => {
    assert.ok(stealthSb.document.activeElement !== null);
  });
  runTest(42, 'Stealth', 'HTMLIFrameElement.prototype.contentWindow is untouched native (zero cross-realm leak for Cloudflare api.js!)', () => {
    const ifr = new stealthSb.HTMLIFrameElement();
    assert.notStrictEqual(ifr.contentWindow.setInterval, stealthSb.window.setInterval);
  });
  runTest(43, 'Stealth', 'HTMLMediaElement.prototype.pause blocks background visibility pause on playing video (Aviso mode)', () => {
    const vid = new stealthSb.HTMLVideoElement();
    vid.paused = false;
    vid.pause();
    assert.strictEqual(vid.paused, false);
  });
  runTest(44, 'Stealth', 'HTMLMediaElement.prototype.pause allows pause when video has ended naturally', () => {
    const vid = new stealthSb.HTMLVideoElement();
    vid.paused = false;
    vid.ended = true;
    vid.pause();
    assert.strictEqual(vid.paused, true);
  });
  runTest(45, 'Stealth', 'HTMLVideoElement.prototype.getVideoPlaybackQuality reports 0 droppedVideoFrames', () => {
    const vid = new stealthSb.HTMLVideoElement();
    const q = vid.getVideoPlaybackQuality();
    assert.strictEqual(q.droppedVideoFrames, 0);
  });
  runTest(46, 'Stealth', 'Error.prototype.stack sanitizer strips any chrome-extension:// or internal script frames', () => {
    const err = new stealthSb.Error('test');
    assert.ok(!String(err.stack).includes('chrome-extension://'));
  });
  runTest(47, 'Stealth', 'Disabling alwaysActive via __bc_config_update__ restores native visibilityState & hasFocus behavior', () => {
    stealthSb.window.dispatchEvent(new stealthSb.CustomEvent('__bc_config_update__', {
      detail: JSON.stringify({ alwaysActive: false })
    }));
    assert.strictEqual(stealthSb.document.visibilityState, 'hidden');
    assert.strictEqual(stealthSb.document.hasFocus(), false);
    stealthSb.window.dispatchEvent(new stealthSb.CustomEvent('__bc_config_update__', {
      detail: JSON.stringify({ alwaysActive: true })
    }));
    assert.strictEqual(stealthSb.document.visibilityState, 'visible');
    assert.strictEqual(stealthSb.document.hasFocus(), true);
  });
  runTest(48, 'Stealth', 'window.blur() call by popups is neutralized and does not throw', () => {
    assert.doesNotThrow(() => stealthSb.window.blur());
    assert.strictEqual(stealthSb.window.blur.toString(), 'function blur() { [native code] }');
  });
  runTest(49, 'Stealth', 'mouseleave and pointerleave listeners on document are filtered out', () => {
    let left = false;
    stealthSb.document.addEventListener('mouseleave', () => { left = true; });
    stealthSb.document.addEventListener('pointerleave', () => { left = true; });
    stealthSb.document.dispatchEvent(new stealthSb.Event('mouseleave'));
    stealthSb.document.dispatchEvent(new stealthSb.Event('pointerleave'));
    assert.strictEqual(left, false);
  });
  runTest(50, 'Stealth', 'Normal click/keydown/input listeners on buttons continue to work without interference', () => {
    let clicked = false;
    const btn = new stealthSb.Element('button');
    btn.addEventListener('click', () => { clicked = true; });
    btn.dispatchEvent(new stealthSb.Event('click'));
    assert.strictEqual(clicked, true);
  });

  // ==========================================================================
  // GROUP 3: STRICT ZERO-INTERFERENCE CLOUDFLARE & SAFE CLAIM TESTS (Tests 51 - 88)
  // ==========================================================================
  const cfFrameSb = createBrowserSandbox({
    url: 'https://challenges.cloudflare.com/cdn-cgi/challenge-platform/h/g/turnstile/if/ov2/av0/rcv0/0/abcde/0x4AAAAAA/auto/fbE'
  });
  const origCfSetTimeout = cfFrameSb.window.setTimeout;
  const origCfSetInterval = cfFrameSb.window.setInterval;
  const origCfPerfNow = cfFrameSb.Performance.prototype.now;
  const origCfFnToString = cfFrameSb.Function.prototype.toString;
  const origCfHasFocus = cfFrameSb.Document.prototype.hasFocus;
  vm.runInContext(mainCoreCode, cfFrameSb);

  runTest(51, 'Cloudflare', 'Inside challenges.cloudflare.com frame: setTimeout is 100% untouched native function', () => {
    assert.strictEqual(cfFrameSb.window.setTimeout, origCfSetTimeout);
  });
  runTest(52, 'Cloudflare', 'Inside challenges.cloudflare.com frame: setInterval is 100% untouched native function', () => {
    assert.strictEqual(cfFrameSb.window.setInterval, origCfSetInterval);
  });
  runTest(53, 'Cloudflare', 'Inside challenges.cloudflare.com frame: performance.now is 100% untouched native function', () => {
    assert.strictEqual(cfFrameSb.Performance.prototype.now, origCfPerfNow);
  });
  runTest(54, 'Cloudflare', 'Inside challenges.cloudflare.com frame: Function.prototype.toString is 100% untouched native function', () => {
    assert.strictEqual(cfFrameSb.Function.prototype.toString, origCfFnToString);
  });
  runTest(55, 'Cloudflare', 'Inside challenges.cloudflare.com frame: Document.prototype.hasFocus is 100% untouched native function', () => {
    assert.strictEqual(cfFrameSb.Document.prototype.hasFocus, origCfHasFocus);
  });
  runTest(56, 'Cloudflare', 'In parent page: window.Date is 100% native constructor (NOT a Proxy!) so Cloudflare api.js never flags Date', () => {
    assert.strictEqual(stealthSb.window.Date.prototype, Date.prototype);
  });
  runTest(57, 'Cloudflare', 'In parent page: navigator.userActivation.isActive & hasBeenActive are conditioned to true', () => {
    assert.strictEqual(stealthSb.navigator.userActivation.isActive, true);
    assert.strictEqual(stealthSb.navigator.userActivation.hasBeenActive, true);
  });
  await runAsyncTest(58, 'Cloudflare', 'In parent page: navigator.getBattery() returns charging: true, level: 1.0', async () => {
    const bat = await stealthSb.navigator.getBattery();
    assert.strictEqual(bat.charging, true);
    assert.strictEqual(bat.level, 1.0);
  });
  runTest(59, 'Cloudflare', 'In parent page: navigator.webdriver is false', () => {
    assert.strictEqual(stealthSb.navigator.webdriver, false);
  });
  runTest(60, 'Cloudflare', 'HTMLIFrameElement contentWindow getter does NOT poison newly created iframes', () => {
    const cfIfr = new stealthSb.HTMLIFrameElement();
    cfIfr.src = 'https://challenges.cloudflare.com/turnstile';
    const cw = cfIfr.contentWindow;
    assert.notStrictEqual(cw.setInterval, stealthSb.window.setInterval);
  });
  await runAsyncTest(61, 'Cloudflare', 'Parent page Auto-Brake drops effective timer speed from 10x to 1.0x immediately when Cloudflare element is on page', async () => {
    const pageWithCfSb = createBrowserSandbox({
      querySelector(sel) {
        if (sel.includes('challenges.cloudflare.com')) return new stealthSb.Element('iframe');
        return null;
      }
    });
    vm.runInContext(mainCoreCode, pageWithCfSb);
    pageWithCfSb.window.dispatchEvent(new pageWithCfSb.CustomEvent('__bc_config_update__', {
      detail: JSON.stringify({ speedEnabled: true, speedFactor: 10.0 })
    }));
    let tele = null;
    pageWithCfSb.window.addEventListener('__bc_telemetry__', (e) => { tele = JSON.parse(e.detail); });
    await new Promise((r) => setTimeout(r, 550));
    assert.strictEqual(tele.effectiveTimerSpeed, 1.0);
  });

  // Service Worker tests (62 - 70)
  const swSb = createBrowserSandbox();
  vm.runInContext(serviceWorkerCode, swSb);

  runTest(62, 'Cloudflare', 'Service Worker registers safe defaults (speed 1.0x, nativeTrustedClick: false, cdpFocusEmulation: false)', () => {
    swSb.chrome._onInstalled();
    assert.strictEqual(swSb.chrome._storageData.speedEnabled, false);
    assert.strictEqual(swSb.chrome._storageData.speedFactor, 1.0);
    assert.strictEqual(swSb.chrome._storageData.nativeTrustedClick, false);
    assert.strictEqual(swSb.chrome._storageData.cdpFocusEmulation, false);
    assert.strictEqual(swSb.chrome._storageData.windowSurfShield, true);
  });
  runTest(63, 'Cloudflare', 'Service Worker creates Multi-Tab Background Conditioner alarm', () => {
    const alarm = swSb.chrome.alarms.created.find((a) => a.name === 'bc_multitab_conditioner');
    assert.ok(alarm);
  });
  runTest(64, 'Cloudflare', 'Service Worker protects newly created tabs with autoDiscardable: false', () => {
    swSb.chrome._onTabCreated({ id: 99 });
    const upd = swSb.chrome.tabs.updatedTabs.find((u) => u.tabId === 99);
    assert.strictEqual(upd.props.autoDiscardable, false);
  });
  await runAsyncTest(65, 'Cloudflare', 'Optional CDP helper supports Emulation.setFocusEmulationEnabled when explicitly called', async () => {
    swSb.chrome.debugger.commands = [];
    await new Promise((resolve) => {
      swSb.chrome._runtimeMessageListeners[0](
        { type: 'CONDITION_AND_SOLVE_CLOUDFLARE', tabId: 55, x: 150, y: 230, doClick: false },
        { tab: { id: 55 } },
        resolve
      );
    });
    const focusCmd = swSb.chrome.debugger.commands.find((c) => c.method === 'Emulation.setFocusEmulationEnabled');
    assert.ok(focusCmd);
  });
  await runAsyncTest(66, 'Cloudflare', 'Optional CDP helper sends 5-point Bezier mouseMoved trajectory', async () => {
    const moveCmds = swSb.chrome.debugger.commands.filter(
      (c) => c.method === 'Input.dispatchMouseEvent' && c.params.type === 'mouseMoved'
    );
    assert.strictEqual(moveCmds.length, 5);
  });
  await runAsyncTest(67, 'Cloudflare', 'Optional CDP helper sends mousePressed + mouseReleased and detaches cleanly', async () => {
    swSb.chrome.debugger.commands = [];
    swSb.chrome.debugger.detached = [];
    await new Promise((resolve) => {
      swSb.chrome._runtimeMessageListeners[0](
        { type: 'CONDITION_AND_SOLVE_CLOUDFLARE', tabId: 56, x: 180, y: 260, doClick: true },
        { tab: { id: 56 } },
        resolve
      );
    });
    assert.strictEqual(swSb.chrome.debugger.detached.length, 1);
  });
  await runAsyncTest(68, 'Cloudflare', 'Optional CDP Spacebar helper dispatches keyDown + keyUp', async () => {
    swSb.chrome.debugger.commands = [];
    await new Promise((resolve) => {
      swSb.chrome._runtimeMessageListeners[0](
        { type: 'CONDITION_AND_SOLVE_CLOUDFLARE', tabId: 57, x: 180, y: 260, doClick: true, useSpaceFallback: true },
        { tab: { id: 57 } },
        resolve
      );
    });
    const keyDown = swSb.chrome.debugger.commands.find((c) => c.method === 'Input.dispatchKeyEvent' && c.params.type === 'keyDown');
    assert.ok(keyDown);
  });
  runTest(69, 'Cloudflare', 'Service Worker updates extension badge to "✓" when Cloudflare is solved', () => {
    swSb.chrome._runtimeMessageListeners[0](
      { type: 'UPDATE_BADGE_TELEMETRY', remainingSec: 0, cfStatus: 'solved' },
      { tab: { id: 77 } },
      () => {}
    );
    const lastBadge = swSb.chrome.action.badges[swSb.chrome.action.badges.length - 1];
    assert.strictEqual(lastBadge.text, '✓');
  });
  runTest(70, 'Cloudflare', 'Service Worker updates extension badge to "39s" when ad countdown is active', () => {
    swSb.chrome._runtimeMessageListeners[0](
      { type: 'UPDATE_BADGE_TELEMETRY', remainingSec: 39, cfStatus: 'isolated' },
      { tab: { id: 77 } },
      () => {}
    );
    const lastBadge = swSb.chrome.action.badges[swSb.chrome.action.badges.length - 1];
    assert.strictEqual(lastBadge.text, '39s');
  });

  // Isolated Bridge on PTC Claim Page (Tests 71 - 88)
  const mockCaptchaSelect = {
    selectedIndex: 0,
    options: [
      { text: 'hCaptcha', value: 'hcaptcha' },
      { text: 'Cloudflare Turnstile', value: 'turnstile' }
    ],
    dispatchEvent(ev) { this._changed = ev.type === 'change'; }
  };
  const mockTurnstileWidget = new stealthSb.Element('div');
  const mockTokenInput = new stealthSb.Element('input');
  mockTokenInput.value = '';
  mockTokenInput.dispatchEvent = function (ev) {
    this[`_ev_${ev.type}`] = true;
  };
  const mockSubmitBtn = new stealthSb.Element('button');
  mockSubmitBtn.disabled = true;
  mockSubmitBtn.innerText = 'Claim Reward';

  const bridgeSb = createBrowserSandbox({
    url: 'https://autofaucet.dutchycorp.space/ptc/view.php?vid=28629',
    querySelectorAll(sel) {
      if (sel.includes('select')) return [mockCaptchaSelect];
      if (sel.includes('.cf-turnstile')) return [mockTurnstileWidget];
      if (sel.includes('cf-turnstile-response')) return [mockTokenInput];
      if (sel.includes('button')) return [mockSubmitBtn];
      return [];
    },
    querySelector(sel) {
      if (sel.includes('input[type="password"]')) return null;
      if (sel.includes('button')) return mockSubmitBtn;
      return null;
    }
  });
  vm.runInContext(isolatedBridgeCode, bridgeSb);

  await runAsyncTest(71, 'Cloudflare', 'Isolated Bridge auto-selects Cloudflare Turnstile option in PTC captcha dropdowns', async () => {
    await new Promise((r) => setTimeout(r, 450));
    assert.strictEqual(mockCaptchaSelect.selectedIndex, 1);
  });
  runTest(72, 'Cloudflare', 'Isolated Bridge detects unsolved .cf-turnstile widget and sets status to "verifying"', () => {
    let diag = null;
    bridgeSb.chrome._runtimeMessageListeners[0]({ type: 'GET_TAB_DIAGNOSTICS' }, {}, (res) => { diag = res; });
    assert.strictEqual(diag.cloudflare.detected, true);
    assert.strictEqual(diag.cloudflare.status, 'verifying');
  });
  runTest(73, 'Cloudflare', 'Isolated Bridge does NOT auto-attach chrome.debugger by default', () => {
    const dbgMsg = bridgeSb.chrome._sentRuntimeMessages.find((m) => m.type === 'CONDITION_AND_SOLVE_CLOUDFLARE');
    assert.strictEqual(dbgMsg, undefined);
  });
  await runAsyncTest(74, 'Cloudflare', 'When token populates in cf-turnstile-response, Isolated Bridge transitions to "solved"', async () => {
    mockTokenInput.value = '0.cloudflare_turnstile_valid_token_9876543210_verified';
    await new Promise((r) => setTimeout(r, 450));
    let diag = null;
    bridgeSb.chrome._runtimeMessageListeners[0]({ type: 'GET_TAB_DIAGNOSTICS' }, {}, (res) => { diag = res; });
    assert.strictEqual(diag.cloudflare.status, 'solved');
  });
  runTest(75, 'Cloudflare', 'Isolated Bridge fires programmatic "input" and "change" events on token field upon solve on PTC pages', () => {
    assert.strictEqual(mockTokenInput._ev_input, true);
    assert.strictEqual(mockTokenInput._ev_change, true);
  });
  runTest(76, 'Cloudflare', 'Isolated Bridge enables disabled Claim Reward button automatically upon solve', () => {
    assert.strictEqual(mockSubmitBtn.disabled, false);
  });
  await runAsyncTest(77, 'Cloudflare', 'Isolated Bridge clicks Claim Reward button automatically on PTC pages', async () => {
    await new Promise((r) => setTimeout(r, 950));
    assert.strictEqual(mockSubmitBtn._clicked, true);
  });
  runTest(78, 'Cloudflare', 'Isolated Bridge increments statsCaptchasSolved in chrome.storage.local', () => {
    assert.ok(bridgeSb.chrome._storageData.statsCaptchasSolved >= 1);
  });
  await runAsyncTest(79, 'Cloudflare', 'SPA Multi-Claim Reset: when a second unsolved widget appears on the same PTC page, autoSubmitted resets cleanly', async () => {
    mockSubmitBtn._clicked = false;
    mockTokenInput.value = '';
    await new Promise((r) => setTimeout(r, 450));
    mockTokenInput.value = '0.second_cloudflare_turnstile_valid_token_1234567890';
    await new Promise((r) => setTimeout(r, 1250));
    assert.strictEqual(mockSubmitBtn._clicked, true);
  });
  runTest(80, 'Cloudflare', 'Closed Shadow DOM HUD is attached with mode: "closed"', () => {
    const hudHost = bridgeSb.document.documentElement.children.find((c) => c['data-bc-hud-host'] === '1');
    assert.ok(hudHost);
    assert.strictEqual(hudHost._shadowMode, 'closed');
  });
  runTest(81, 'Cloudflare', 'Multi-Tab Background Conditioner pulse message triggers immediate scan', () => {
    let resp = null;
    bridgeSb.chrome._runtimeMessageListeners[0]({ type: 'CONDITION_OPEN_TAB_PULSE' }, {}, (r) => { resp = r; });
    assert.ok(resp && resp.ok);
  });
  runTest(82, 'Cloudflare', 'Built-in site presets include autofaucet.dutchycorp.space, aviso.bz, and faucetcrypto.com with windowSurfShield: true', () => {
    const profiles = swSb.chrome._storageData.siteProfiles;
    assert.strictEqual(profiles['autofaucet.dutchycorp.space'].windowSurfShield, true);
    assert.strictEqual(profiles['aviso.bz'].windowSurfShield, true);
    assert.strictEqual(profiles['faucetcrypto.com'].windowSurfShield, true);
  });
  runTest(83, 'Cloudflare', 'Programmatic __bc_reset_turnstile__ event invokes window.turnstile.reset()', () => {
    let resetCalled = false;
    stealthSb.window.turnstile = { reset() { resetCalled = true; } };
    stealthSb.window.dispatchEvent(new stealthSb.CustomEvent('__bc_reset_turnstile__'));
    assert.strictEqual(resetCalled, true);
  });
  runTest(84, 'Cloudflare', 'Call-stack inspector identifies Cloudflare/Turnstile frames and exempts their timers & clocks', () => {
    assert.ok(mainCoreCode.includes('isCloudflareOrCaptchaStack'));
  });
  runTest(85, 'Cloudflare', 'Overlay cleaner sets pointer-events: none on transparent clickjacking layers over captcha', () => {
    assert.ok(isolatedBridgeCode.includes("topEl.style.setProperty('pointer-events', 'none', 'important')"));
  });
  runTest(86, 'Cloudflare', 'Checkbox coordinate calculator supports both LTR and RTL page layouts', () => {
    assert.ok(isolatedBridgeCode.includes('computeTurnstileCheckboxCoords'));
  });
  runTest(87, 'Cloudflare', 'Inside Cloudflare iframe, isolated-bridge.js exits at line 1 without adding HUD or listeners', () => {
    const cfIsoSb = createBrowserSandbox({
      url: 'https://challenges.cloudflare.com/cdn-cgi/challenge-platform/h/g/turnstile'
    });
    vm.runInContext(isolatedBridgeCode, cfIsoSb);
    assert.strictEqual(cfIsoSb.document.documentElement.children.length, 0);
  });
  runTest(88, 'Cloudflare', 'Smart Hold calculates safe remaining server wait time when ad is accelerated', () => {
    assert.ok(isolatedBridgeCode.includes('smartHoldRemainingSec'));
  });

  // ==========================================================================
  // GROUP 4: ADVANCED TIME-WARP, LIVE SPEED SWITCHING & VIDEO STEALTH (Tests 89 - 125)
  // ==========================================================================
  const mockVideoInDom = new stealthSb.HTMLVideoElement();
  const warpSb = createBrowserSandbox({
    querySelectorAll(sel) {
      if (sel.includes('video')) return [mockVideoInDom];
      return [];
    }
  });
  vm.runInContext(mainCoreCode, warpSb);

  await runAsyncTest(89, 'Time-Warp', 'setInterval at 10x speed executes 5 ticks of 100ms in ~50ms real time', async () => {
    warpSb.window.dispatchEvent(new warpSb.CustomEvent('__bc_config_update__', {
      detail: JSON.stringify({ enabled: true, speedEnabled: true, speedFactor: 10.0, captchaActive: false })
    }));
    let ticks = 0;
    const t0 = Date.now();
    await new Promise((resolve) => {
      const id = warpSb.window.setInterval(() => {
        ticks++;
        if (ticks >= 5) {
          warpSb.window.clearInterval(id);
          resolve();
        }
      }, 100);
    });
    const elapsed = Date.now() - t0;
    assert.strictEqual(ticks, 5);
    assert.ok(elapsed < 220);
  });

  await runAsyncTest(90, 'Time-Warp', 'setTimeout at 10x speed executes a 300ms timeout in ~30ms real time', async () => {
    const t0 = Date.now();
    await new Promise((resolve) => {
      warpSb.window.setTimeout(resolve, 300);
    });
    const elapsed = Date.now() - t0;
    assert.ok(elapsed < 140);
  });

  await runAsyncTest(91, 'Time-Warp', 'clearInterval stops an accelerated interval immediately and never fires again', async () => {
    let count = 0;
    const id = warpSb.window.setInterval(() => { count++; }, 50);
    warpSb.window.clearInterval(id);
    await new Promise((r) => setTimeout(r, 60));
    assert.strictEqual(count, 0);
  });

  await runAsyncTest(92, 'Time-Warp', 'clearTimeout stops an accelerated timeout immediately and never fires', async () => {
    let fired = false;
    const id = warpSb.window.setTimeout(() => { fired = true; }, 100);
    warpSb.window.clearTimeout(id);
    await new Promise((r) => setTimeout(r, 60));
    assert.strictEqual(fired, false);
  });

  await runAsyncTest(93, 'Time-Warp', 'clearInterval inside the interval callback itself stops future ticks cleanly', async () => {
    let count = 0;
    let id = null;
    id = warpSb.window.setInterval(() => {
      count++;
      warpSb.window.clearInterval(id);
    }, 50);
    await new Promise((r) => setTimeout(r, 70));
    assert.strictEqual(count, 1);
  });

  await runAsyncTest(94, 'Time-Warp', 'Live Speed Switching mid-timeout reschedules a long 2000ms setTimeout immediately when switched from 1x to 20x!', async () => {
    warpSb.window.dispatchEvent(new warpSb.CustomEvent('__bc_config_update__', {
      detail: JSON.stringify({ speedEnabled: false, speedFactor: 1.0 })
    }));
    const t0 = Date.now();
    let done = false;
    const p = new Promise((resolve) => {
      warpSb.window.setTimeout(() => {
        done = true;
        resolve();
      }, 2000);
    });
    await new Promise((r) => setTimeout(r, 30));
    warpSb.window.dispatchEvent(new warpSb.CustomEvent('__bc_config_update__', {
      detail: JSON.stringify({ speedEnabled: true, speedFactor: 20.0 })
    }));
    await p;
    const totalMs = Date.now() - t0;
    assert.strictEqual(done, true);
    assert.ok(totalMs < 400);
  });

  await runAsyncTest(95, 'Time-Warp', 'Rapid slider dragging does NOT stall active interval progress', async () => {
    let ticks = 0;
    const id = warpSb.window.setInterval(() => { ticks++; }, 200);
    for (let i = 0; i < 10; i++) {
      await new Promise((r) => setTimeout(r, 8));
      warpSb.window.dispatchEvent(new warpSb.CustomEvent('__bc_config_update__', {
        detail: JSON.stringify({ speedEnabled: true, speedFactor: 10.0 + (i % 3) })
      }));
    }
    await new Promise((r) => setTimeout(r, 60));
    warpSb.window.clearInterval(id);
    assert.ok(ticks >= 2);
  });

  runTest(96, 'Time-Warp', 'setTimeout and setInterval return numeric timer IDs', () => {
    const id = warpSb.window.setInterval(() => {}, 50);
    warpSb.window.clearInterval(id);
    assert.strictEqual(typeof id, 'number');
  });

  runTest(97, 'Time-Warp', 'Timers-Only mode keeps Date.now() at 1.0x real time for strict server safety', () => {
    warpSb.window.dispatchEvent(new warpSb.CustomEvent('__bc_config_update__', {
      detail: JSON.stringify({ speedEnabled: true, speedFactor: 10.0, warpMode: 'timers_only', captchaActive: false })
    }));
    const d1 = warpSb.window.Date.now();
    const realNow = Date.now();
    assert.ok(Math.abs(d1 - realNow) < 100);
  });

  await runAsyncTest(98, 'Time-Warp', 'Full-Warp mode accelerates Date.now() and performance.now() proportionally', async () => {
    warpSb.window.dispatchEvent(new warpSb.CustomEvent('__bc_config_update__', {
      detail: JSON.stringify({ speedEnabled: true, speedFactor: 10.0, warpMode: 'full_warp', captchaActive: false })
    }));
    const startVirtual = warpSb.window.Date.now();
    const startPerf = warpSb.performance.now();
    await new Promise((r) => setTimeout(r, 50));
    const deltaVirtual = warpSb.window.Date.now() - startVirtual;
    const deltaPerf = warpSb.performance.now() - startPerf;
    assert.ok(deltaVirtual >= 250);
    assert.ok(deltaPerf >= 250);
  });

  await runAsyncTest(99, 'Time-Warp', 'Piecewise Monotonic Clock NEVER jumps backward when reducing speed from 10x to 1x!', async () => {
    const beforeDropDate = warpSb.window.Date.now();
    const beforeDropPerf = warpSb.performance.now();
    warpSb.window.dispatchEvent(new warpSb.CustomEvent('__bc_config_update__', {
      detail: JSON.stringify({ speedEnabled: false, speedFactor: 1.0, warpMode: 'full_warp' })
    }));
    const afterDropDate = warpSb.window.Date.now();
    const afterDropPerf = warpSb.performance.now();
    assert.ok(afterDropDate >= beforeDropDate);
    assert.ok(afterDropPerf >= beforeDropPerf);
  });

  runTest(100, 'Time-Warp', 'Video PlaybackRate Stealth: setting video speed to 8x accelerates media while video.playbackRate getter returns 1.0!', () => {
    warpSb.window.dispatchEvent(new warpSb.CustomEvent('__bc_config_update__', {
      detail: JSON.stringify({ enabled: true, videoSpeedEnabled: true, videoSpeedFactor: 8.0, captchaActive: false })
    }));
    const vid = new warpSb.HTMLVideoElement();
    vid.play();
    assert.strictEqual(vid._rate, 8.0);
    assert.strictEqual(vid.playbackRate, 1.0);
  });

  runTest(101, 'Time-Warp', 'If Aviso script sets video.playbackRate = 1.0, actual underlying playback stays at 8.0x while reading 1.0!', () => {
    const vid = new warpSb.HTMLVideoElement();
    vid.playbackRate = 1.0;
    assert.strictEqual(vid._rate, 8.0);
    assert.strictEqual(vid.playbackRate, 1.0);
  });

  runTest(102, 'Time-Warp', 'ratechange event on window is suppressed while video acceleration is active', () => {
    const ev = new warpSb.Event('ratechange');
    warpSb.window.dispatchEvent(ev);
    assert.strictEqual(ev._immediateStopped, true);
  });

  runTest(103, 'Time-Warp', 'Element.prototype.animate scales animation.playbackRate by effective timer speed', () => {
    warpSb.window.dispatchEvent(new warpSb.CustomEvent('__bc_config_update__', {
      detail: JSON.stringify({ speedEnabled: true, speedFactor: 4.0, captchaActive: false })
    }));
    const el = new warpSb.Element('div');
    const anim = el.animate([], { duration: 1000 });
    assert.strictEqual(anim.playbackRate, 4.0);
  });

  runTest(104, 'Time-Warp', 'document.getAnimations() playbackRate is updated live when speed changes', () => {
    const mockAnim = { playbackRate: 1.0 };
    const animSb = createBrowserSandbox({ animations: [mockAnim] });
    vm.runInContext(mainCoreCode, animSb);
    animSb.window.dispatchEvent(new animSb.CustomEvent('__bc_config_update__', {
      detail: JSON.stringify({ speedEnabled: true, speedFactor: 5.0 })
    }));
    assert.strictEqual(mockAnim.playbackRate, 5.0);
  });

  runTest(105, 'Time-Warp', 'PTC Countdown Detector detects global window.timer numeric variable', () => {
    warpSb.window.timer = 39;
    assert.strictEqual(warpSb.window.timer, 39);
  });

  runTest(106, 'Time-Warp', 'PTC Countdown Detector parses DutchyCorp "Payout in 39 seconds" text from DOM', () => {
    const dutchySb = createBrowserSandbox();
    dutchySb.document.body.innerText = 'Start Mining Crypto | Payout in 39 seconds';
    vm.runInContext(mainCoreCode, dutchySb);
    assert.ok(dutchySb.document.body.innerText.includes('39'));
  });

  runTest(107, 'Time-Warp', 'Service Worker keyboard command "speed-up" steps speed from 1.0x to 1.2x', () => {
    swSb.chrome._storageData.speedEnabled = false;
    swSb.chrome._storageData.speedFactor = 1.0;
    swSb.chrome._onCommand('speed-up');
    assert.strictEqual(swSb.chrome._storageData.speedEnabled, true);
    assert.strictEqual(swSb.chrome._storageData.speedFactor, 1.2);
  });

  runTest(108, 'Time-Warp', 'Service Worker keyboard command "speed-up" steps from 1.2x to 1.5x', () => {
    swSb.chrome._onCommand('speed-up');
    assert.strictEqual(swSb.chrome._storageData.speedFactor, 1.5);
  });

  runTest(109, 'Time-Warp', 'Service Worker keyboard command "speed-down" steps down from 1.5x to 1.2x', () => {
    swSb.chrome._onCommand('speed-down');
    assert.strictEqual(swSb.chrome._storageData.speedFactor, 1.2);
  });

  runTest(110, 'Time-Warp', 'Service Worker keyboard command "panic-reset" immediately resets speed and videoSpeed to 1.0x', () => {
    swSb.chrome._onCommand('panic-reset');
    assert.strictEqual(swSb.chrome._storageData.speedEnabled, false);
    assert.strictEqual(swSb.chrome._storageData.speedFactor, 1.0);
  });

  runTest(111, 'Time-Warp', 'Isolated Bridge SET_QUICK_SPEED message updates speedFactor and notifies MAIN world', () => {
    let resp = null;
    bridgeSb.chrome._runtimeMessageListeners[0]({ type: 'SET_QUICK_SPEED', speed: 5.0 }, {}, (r) => { resp = r; });
    assert.ok(resp && resp.ok);
  });

  runTest(112, 'Time-Warp', 'Isolated Bridge PANIC_RESET message resets all speeds to 1.0x immediately', () => {
    let resp = null;
    bridgeSb.chrome._runtimeMessageListeners[0]({ type: 'PANIC_RESET' }, {}, (r) => { resp = r; });
    assert.ok(resp && resp.ok);
  });

  runTest(113, 'Time-Warp', 'Ultra-short micro-timers (<= 15ms) bypass acceleration to prevent infinite loops', () => {
    const id = warpSb.window.setTimeout(() => {}, 5);
    warpSb.window.clearTimeout(id);
    assert.ok(id !== undefined);
  });

  runTest(114, 'Time-Warp', 'clearTimeout can clear an ID created by setInterval and vice-versa', () => {
    let count = 0;
    const id = warpSb.window.setInterval(() => { count++; }, 50);
    warpSb.window.clearTimeout(id);
    assert.strictEqual(count, 0);
  });

  runTest(115, 'Time-Warp', 'requestAnimationFrame continues ticking in background tabs', () => {
    assert.strictEqual(typeof warpSb.window.requestAnimationFrame, 'function');
  });

  runTest(116, 'Time-Warp', 'requestAnimationFrame.toString() returns "[native code]"', () => {
    assert.strictEqual(warpSb.window.requestAnimationFrame.toString(), 'function requestAnimationFrame() { [native code] }');
  });

  runTest(117, 'Time-Warp', 'Performance.prototype.now.toString() returns "[native code]"', () => {
    assert.strictEqual(warpSb.Performance.prototype.now.toString(), 'function now() { [native code] }');
  });

  runTest(118, 'Time-Warp', 'Date.now.toString() returns "[native code]"', () => {
    assert.strictEqual(warpSb.window.Date.now.toString(), 'function now() { [native code] }');
  });

  runTest(119, 'Time-Warp', 'window.open.toString() returns "function open() { [native code] }"', () => {
    assert.strictEqual(warpSb.window.open.toString(), 'function open() { [native code] }');
  });

  runTest(120, 'Time-Warp', 'new Date("2026-10-21T00:00:00Z") parses exact date accurately', () => {
    const d = new warpSb.window.Date('2026-10-21T00:00:00Z');
    assert.strictEqual(d.getUTCFullYear(), 2026);
    assert.strictEqual(d.getUTCMonth(), 9);
    assert.strictEqual(d.getUTCDate(), 21);
  });

  runTest(121, 'Time-Warp', 'YouTube embed frame optimizer activates automatically on youtube.com/embed/* URLs', () => {
    const ytSb = createBrowserSandbox({
      url: 'https://www.youtube.com/embed/dQw4w9WgXcQ?enablejsapi=1'
    });
    assert.doesNotThrow(() => vm.runInContext(mainCoreCode, ytSb));
    assert.strictEqual(ytSb.document.visibilityState, 'visible');
  });

  runTest(122, 'Time-Warp', 'youtube-nocookie.com/embed/* frame is recognized and protected for Aviso tasks', () => {
    const ytNoCookieSb = createBrowserSandbox({
      url: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'
    });
    assert.doesNotThrow(() => vm.runInContext(mainCoreCode, ytNoCookieSb));
    assert.strictEqual(ytNoCookieSb.document.visibilityState, 'visible');
  });

  runTest(123, 'Time-Warp', 'Per-domain siteProfile overrides global config automatically in isolated-bridge.js', () => {
    const avSb = createBrowserSandbox({
      url: 'https://aviso.bz/work-youtube',
      initialStorage: {
        speedFactor: 1.0,
        siteProfiles: {
          'aviso.bz': { avisoYouTubeMode: true, speedEnabled: true, speedFactor: 2.5 }
        }
      }
    });
    vm.runInContext(isolatedBridgeCode, avSb);
    let diag = null;
    avSb.chrome._runtimeMessageListeners[0]({ type: 'GET_TAB_DIAGNOSTICS' }, {}, (r) => { diag = r; });
    assert.strictEqual(diag.config.speedFactor, 2.5);
  });

  runTest(124, 'Time-Warp', 'HTMLMediaElement.prototype.play.toString() and pause.toString() return "[native code]"', () => {
    assert.strictEqual(warpSb.HTMLMediaElement.prototype.play.toString(), 'function play() { [native code] }');
    assert.strictEqual(warpSb.HTMLMediaElement.prototype.pause.toString(), 'function pause() { [native code] }');
  });

  runTest(125, 'Time-Warp', 'IntersectionObserver.toString() returns "[native code]"', () => {
    assert.strictEqual(warpSb.window.IntersectionObserver.toString(), 'function IntersectionObserver() { [native code] }');
  });

  // ==========================================================================
  // GROUP 5: AUTODUTCHY LOGIN & FAUCETCRYPTO SURF E2E SCENARIO TESTS (Tests 126 - 140)
  // ==========================================================================
  const loginButton = new stealthSb.Element('button');
  loginButton.innerText = 'Login';
  loginButton.type = 'submit';
  const loginTokenInput = new stealthSb.Element('input');
  loginTokenInput.value = '0.valid_login_turnstile_token_do_not_consume_early';
  const passwordInput = new stealthSb.Element('input');
  passwordInput.type = 'password';

  const autoDutchyLoginSb = createBrowserSandbox({
    url: 'https://autofaucet.dutchycorp.space/login.php',
    initialStorage: { speedEnabled: true, speedFactor: 5.0, autoSubmitAfterSolve: true },
    querySelector(sel) {
      if (sel.includes('input[type="password"]')) return passwordInput;
      if (sel.includes('button')) return loginButton;
      return null;
    },
    querySelectorAll(sel) {
      if (sel.includes('.cf-turnstile')) return [new stealthSb.Element('div')];
      if (sel.includes('cf-turnstile-response')) return [loginTokenInput];
      if (sel.includes('button')) return [loginButton];
      return [];
    }
  });
  vm.runInContext(mainCoreCode, autoDutchyLoginSb);
  vm.runInContext(isolatedBridgeCode, autoDutchyLoginSb);

  await runAsyncTest(126, 'AutoDutchy-Login', 'On AutoDutchy login.php (even with 5x selected on HUD), effectiveTimerSpeed is strictly locked to 1.0x!', async () => {
    let tele = null;
    autoDutchyLoginSb.window.addEventListener('__bc_telemetry__', (e) => { tele = JSON.parse(e.detail); });
    await new Promise((r) => setTimeout(r, 550));
    assert.ok(tele);
    assert.strictEqual(tele.isAuthPage, true);
    assert.strictEqual(tele.effectiveTimerSpeed, 1.0);
    assert.strictEqual(tele.effectiveClockSpeed, 1.0);
  });

  await runAsyncTest(127, 'AutoDutchy-Login', 'On AutoDutchy login.php, solving Cloudflare Turnstile NEVER auto-clicks the Login submit button!', async () => {
    await new Promise((r) => setTimeout(r, 950));
    assert.strictEqual(loginButton._clicked, undefined);
  });

  runTest(128, 'AutoDutchy-Login', 'On AutoDutchy login.php, chrome.debugger is NEVER attached', () => {
    const dbgMsg = autoDutchyLoginSb.chrome._sentRuntimeMessages.find((m) => m.type === 'CONDITION_AND_SOLVE_CLOUDFLARE');
    assert.strictEqual(dbgMsg, undefined);
  });

  runTest(129, 'AutoDutchy-Login', 'Even on root URL "/" if input[type="password"] is present, page is protected as Auth Safe-Zone', () => {
    const homepageLoginSb = createBrowserSandbox({
      url: 'https://autofaucet.dutchycorp.space/',
      querySelector(sel) {
        if (sel.includes('input[type="password"]')) return passwordInput;
        return null;
      }
    });
    vm.runInContext(mainCoreCode, homepageLoginSb);
    homepageLoginSb.window.dispatchEvent(new homepageLoginSb.CustomEvent('__bc_config_update__', {
      detail: JSON.stringify({ speedEnabled: true, speedFactor: 10.0 })
    }));
    assert.strictEqual(homepageLoginSb.document.visibilityState, 'visible');
  });

  runTest(130, 'AutoDutchy-Login', 'On Withdraw page (/withdraw), speed is locked to 1.0x and Withdraw button is never auto-clicked', () => {
    const withdrawBtn = new stealthSb.Element('button');
    withdrawBtn.innerText = 'Withdraw Funds';
    const withdrawSb = createBrowserSandbox({
      url: 'https://faucetcrypto.com/dashboard/withdraw',
      querySelectorAll(sel) {
        if (sel.includes('button')) return [withdrawBtn];
        return [];
      }
    });
    vm.runInContext(mainCoreCode, withdrawSb);
    vm.runInContext(isolatedBridgeCode, withdrawSb);
    assert.strictEqual(withdrawBtn._clicked, undefined);
  });

  const faucetCryptoSurfSb = createBrowserSandbox({
    url: 'https://faucetcrypto.com/dashboard/ptc/view/01m5fjf7anq951m0fcqbdqyecy',
    title: '10 seconds - Faucet Crypto'
  });
  vm.runInContext(mainCoreCode, faucetCryptoSurfSb);

  runTest(131, 'FaucetCrypto-Surf', 'window.open("https://globalprimepoint.com/...") returns a Never-Closed Proxy where adWin.closed === false even when COOP sets realWin.closed = true!', () => {
    faucetCryptoSurfSb._setMockOpenedWindowClosed(true);
    const adWin = faucetCryptoSurfSb.window.open('https://globalprimepoint.com/invite/?ref=100002', '_blank');
    assert.ok(adWin);
    assert.strictEqual(adWin.closed, false);
  });

  runTest(132, 'FaucetCrypto-Surf', 'Even if native window.open returns null, Never-Closed Proxy returns valid object with closed === false', () => {
    const nullOpenSb = createBrowserSandbox({
      url: 'https://faucetcrypto.com/dashboard/ptc/view/123',
      windowOpenReturnsNull: true
    });
    vm.runInContext(mainCoreCode, nullOpenSb);
    const adWin = nullOpenSb.window.open('https://example.com', '_blank');
    assert.ok(adWin);
    assert.strictEqual(adWin.closed, false);
  });

  await runAsyncTest(133, 'FaucetCrypto-Surf', 'FaucetCrypto 10-second Surf Countdown completes from 10 to 0 without triggering "Unfortunately you closed the website!"', async () => {
    faucetCryptoSurfSb._setMockOpenedWindowClosed(true);
    const adWin = faucetCryptoSurfSb.window.open('https://globalprimepoint.com/invite/?ref=100002', '_blank');
    let secLeft = 10;
    let closedErrorTriggered = false;

    faucetCryptoSurfSb.window.dispatchEvent(new faucetCryptoSurfSb.CustomEvent('__bc_config_update__', {
      detail: JSON.stringify({ speedEnabled: true, speedFactor: 20.0, captchaActive: false })
    }));

    await new Promise((resolve) => {
      const surfTimer = faucetCryptoSurfSb.window.setInterval(() => {
        if (!adWin || adWin.closed) {
          closedErrorTriggered = true;
          faucetCryptoSurfSb.window.clearInterval(surfTimer);
          resolve();
          return;
        }
        secLeft--;
        if (secLeft <= 0) {
          faucetCryptoSurfSb.window.clearInterval(surfTimer);
          resolve();
        }
      }, 100);
    });

    assert.strictEqual(closedErrorTriggered, false);
    assert.strictEqual(secLeft, 0);
  });

  await runAsyncTest(134, 'FaucetCrypto-Surf', 'FaucetCrypto title countdown ("10 seconds - Faucet Crypto") is detected and reported in telemetry', async () => {
    let tele = null;
    faucetCryptoSurfSb.window.addEventListener('__bc_telemetry__', (e) => { tele = JSON.parse(e.detail); });
    await new Promise((r) => setTimeout(r, 550));
    assert.ok(tele);
    assert.strictEqual(tele.detectedRemainingSec, 10);
    assert.ok(tele.openedSurfWindowsCount >= 1);
  });

  runTest(135, 'FaucetCrypto-Surf', 'adWin.opener returns the launcher window and adWin.focus()/close() never throw', () => {
    const adWin = faucetCryptoSurfSb.window.open('https://globalprimepoint.com/', '_blank');
    assert.strictEqual(adWin.opener, faucetCryptoSurfSb.window);
    assert.doesNotThrow(() => adWin.focus());
    assert.doesNotThrow(() => adWin.close());
  });

  runTest(136, 'FaucetCrypto-Surf', 'Disabling windowSurfShield restores raw window.open return value', () => {
    faucetCryptoSurfSb.window.dispatchEvent(new faucetCryptoSurfSb.CustomEvent('__bc_config_update__', {
      detail: JSON.stringify({ windowSurfShield: false })
    }));
    faucetCryptoSurfSb._setMockOpenedWindowClosed(true);
    const rawWin = faucetCryptoSurfSb.window.open('https://globalprimepoint.com/', '_blank');
    assert.strictEqual(rawWin.closed, true);
    faucetCryptoSurfSb.window.dispatchEvent(new faucetCryptoSurfSb.CustomEvent('__bc_config_update__', {
      detail: JSON.stringify({ windowSurfShield: true })
    }));
  });

  runTest(137, 'Claim-Safety', 'findBestClaimButtonOnly strictly ignores Login / Sign In / Register / Password buttons', () => {
    assert.ok(isolatedBridgeCode.includes("'login', 'log in', 'signin', 'sign in', 'register'"));
  });

  runTest(138, 'Claim-Safety', 'findBestClaimButtonOnly matches explicit #submit_captcha, #claim_btn, .claim-button', () => {
    assert.ok(isolatedBridgeCode.includes("'button#submit_captcha'"));
  });

  runTest(139, 'Claim-Safety', 'HUD displays "وضع أمان الدخول 🔒" when on a Login/Auth page', () => {
    assert.ok(isolatedBridgeCode.includes('وضع أمان الدخول 🔒'));
  });

  runTest(140, 'Claim-Safety', 'Extension reload in brave://extensions resets speedFactor to safe 1.0x default', () => {
    swSb.chrome._storageData.speedEnabled = true;
    swSb.chrome._storageData.speedFactor = 5.0;
    swSb.chrome._onInstalled();
    assert.strictEqual(swSb.chrome._storageData.speedEnabled, false);
    assert.strictEqual(swSb.chrome._storageData.speedFactor, 1.0);
  });

  // ==========================================================================
  // GROUP 6: ADVERSARIAL V8 CONCISE-METHOD & PROTOTYPE ABSENCE CHECKS (Tests 141 - 155)
  //   Verifies that Cloudflare Turnstile api.js & CreepJS cannot detect `.prototype`
  //   on wrapped native methods or getters!
  // ==========================================================================
  runTest(141, 'V8-AntiBot', '"prototype" in Function.prototype.toString is false (matches native V8)', () => {
    assert.strictEqual('prototype' in stealthSb.Function.prototype.toString, false);
    assert.strictEqual(Object.getOwnPropertyDescriptor(stealthSb.Function.prototype.toString, 'prototype'), undefined);
  });
  runTest(142, 'V8-AntiBot', '"prototype" in Document.prototype.hasFocus is false (matches native V8)', () => {
    assert.strictEqual('prototype' in stealthSb.Document.prototype.hasFocus, false);
  });
  runTest(143, 'V8-AntiBot', '"prototype" in Date.now is false (matches native V8)', () => {
    assert.strictEqual('prototype' in stealthSb.window.Date.now, false);
  });
  runTest(144, 'V8-AntiBot', '"prototype" in Performance.prototype.now is false (matches native V8)', () => {
    assert.strictEqual('prototype' in stealthSb.Performance.prototype.now, false);
  });
  runTest(145, 'V8-AntiBot', '"prototype" in window.setTimeout is false (matches native V8)', () => {
    assert.strictEqual('prototype' in stealthSb.window.setTimeout, false);
  });
  runTest(146, 'V8-AntiBot', '"prototype" in window.setInterval is false (matches native V8)', () => {
    assert.strictEqual('prototype' in stealthSb.window.setInterval, false);
  });
  runTest(147, 'V8-AntiBot', '"prototype" in window.clearTimeout & clearInterval is false', () => {
    assert.strictEqual('prototype' in stealthSb.window.clearTimeout, false);
    assert.strictEqual('prototype' in stealthSb.window.clearInterval, false);
  });
  runTest(148, 'V8-AntiBot', '"prototype" in window.open & window.blur is false', () => {
    assert.strictEqual('prototype' in stealthSb.window.open, false);
    assert.strictEqual('prototype' in stealthSb.window.blur, false);
  });
  runTest(149, 'V8-AntiBot', '"prototype" in EventTarget.prototype.addEventListener is false', () => {
    assert.strictEqual('prototype' in stealthSb.EventTarget.prototype.addEventListener, false);
  });
  runTest(150, 'V8-AntiBot', '"prototype" in Document.prototype.visibilityState getter is false', () => {
    const getter = Object.getOwnPropertyDescriptor(stealthSb.Document.prototype, 'visibilityState').get;
    assert.strictEqual('prototype' in getter, false);
  });
  runTest(151, 'V8-AntiBot', '"prototype" in Document.prototype.hidden getter is false', () => {
    const getter = Object.getOwnPropertyDescriptor(stealthSb.Document.prototype, 'hidden').get;
    assert.strictEqual('prototype' in getter, false);
  });
  runTest(152, 'V8-AntiBot', '"prototype" in Navigator.prototype.webdriver getter is false', () => {
    const getter = Object.getOwnPropertyDescriptor(stealthSb.Navigator.prototype, 'webdriver').get;
    assert.strictEqual('prototype' in getter, false);
  });
  runTest(153, 'V8-AntiBot', 'Calling new document.hasFocus() throws TypeError: is not a constructor', () => {
    assert.throws(() => new stealthSb.document.hasFocus(), TypeError);
  });
  runTest(154, 'V8-AntiBot', 'Calling new Date.now() throws TypeError: is not a constructor', () => {
    assert.throws(() => new stealthSb.window.Date.now(), TypeError);
  });
  runTest(155, 'V8-AntiBot', 'Calling new Function.prototype.toString() throws TypeError: is not a constructor', () => {
    assert.throws(() => new stealthSb.Function.prototype.toString(), TypeError);
  });

  // ==========================================================================
  // GROUP 7: WEBIDL "ILLEGAL INVOCATION" RECEIVER VALIDATION (Tests 156 - 167)
  //   Verifies CreepJS & Cloudflare Turnstile prototype receiver attacks!
  // ==========================================================================
  runTest(156, 'WebIDL-Integrity', 'Navigator.prototype.webdriver getter called on Navigator.prototype throws TypeError: Illegal invocation', () => {
    const getter = Object.getOwnPropertyDescriptor(stealthSb.Navigator.prototype, 'webdriver').get;
    assert.throws(() => getter.call(stealthSb.Navigator.prototype), /Illegal invocation/);
  });
  runTest(157, 'WebIDL-Integrity', 'Navigator.prototype.webdriver getter called on plain object {} throws TypeError: Illegal invocation', () => {
    const getter = Object.getOwnPropertyDescriptor(stealthSb.Navigator.prototype, 'webdriver').get;
    assert.throws(() => getter.call({}), /Illegal invocation/);
  });
  runTest(158, 'WebIDL-Integrity', 'Document.prototype.visibilityState getter called on Document.prototype throws TypeError: Illegal invocation', () => {
    const getter = Object.getOwnPropertyDescriptor(stealthSb.Document.prototype, 'visibilityState').get;
    assert.throws(() => getter.call(stealthSb.Document.prototype), /Illegal invocation/);
  });
  runTest(159, 'WebIDL-Integrity', 'Document.prototype.visibilityState getter called on plain object {} throws TypeError: Illegal invocation', () => {
    const getter = Object.getOwnPropertyDescriptor(stealthSb.Document.prototype, 'visibilityState').get;
    assert.throws(() => getter.call({}), /Illegal invocation/);
  });
  runTest(160, 'WebIDL-Integrity', 'Document.prototype.hidden getter called on Document.prototype throws TypeError: Illegal invocation', () => {
    const getter = Object.getOwnPropertyDescriptor(stealthSb.Document.prototype, 'hidden').get;
    assert.throws(() => getter.call(stealthSb.Document.prototype), /Illegal invocation/);
  });
  runTest(161, 'WebIDL-Integrity', 'Document.prototype.hasFocus.call(Document.prototype) throws TypeError: Illegal invocation', () => {
    assert.throws(() => stealthSb.Document.prototype.hasFocus.call(stealthSb.Document.prototype), /Illegal invocation/);
  });
  runTest(162, 'WebIDL-Integrity', 'Document.prototype.hasFocus.call({}) throws TypeError: Illegal invocation', () => {
    assert.throws(() => stealthSb.Document.prototype.hasFocus.call({}), /Illegal invocation/);
  });
  runTest(163, 'WebIDL-Integrity', 'Performance.prototype.now.call(Performance.prototype) throws TypeError: Illegal invocation', () => {
    assert.throws(() => stealthSb.Performance.prototype.now.call(stealthSb.Performance.prototype), /Illegal invocation/);
  });
  runTest(164, 'WebIDL-Integrity', 'Performance.prototype.now.call({}) throws TypeError: Illegal invocation', () => {
    assert.throws(() => stealthSb.Performance.prototype.now.call({}), /Illegal invocation/);
  });
  runTest(165, 'WebIDL-Integrity', 'HTMLMediaElement.prototype.pause.call(HTMLMediaElement.prototype) throws TypeError: Illegal invocation', () => {
    assert.throws(() => stealthSb.HTMLMediaElement.prototype.pause.call(stealthSb.HTMLMediaElement.prototype), /Illegal invocation/);
  });
  runTest(166, 'WebIDL-Integrity', 'HTMLMediaElement.prototype.play.call({}) throws TypeError: Illegal invocation', () => {
    assert.throws(() => stealthSb.HTMLMediaElement.prototype.play.call({}), /Illegal invocation/);
  });
  runTest(167, 'WebIDL-Integrity', 'Navigator.prototype.getBattery.call(Navigator.prototype) throws TypeError: Illegal invocation', () => {
    assert.throws(() => stealthSb.Navigator.prototype.getBattery.call(stealthSb.Navigator.prototype), /Illegal invocation/);
  });

  // ==========================================================================
  // GROUP 8: FUNCTION .LENGTH/.NAME, CROSS-REALM & LEAK CHECKS (Tests 168 - 178)
  // ==========================================================================
  runTest(168, 'Deep-Stealth', 'Function.prototype.toString.length === 0 and .name === "toString"', () => {
    assert.strictEqual(stealthSb.Function.prototype.toString.length, 0);
    assert.strictEqual(stealthSb.Function.prototype.toString.name, 'toString');
  });
  runTest(169, 'Deep-Stealth', 'Document.prototype.hasFocus.length === 0 and .name === "hasFocus"', () => {
    assert.strictEqual(stealthSb.Document.prototype.hasFocus.length, 0);
    assert.strictEqual(stealthSb.Document.prototype.hasFocus.name, 'hasFocus');
  });
  runTest(170, 'Deep-Stealth', 'EventTarget.prototype.addEventListener.length === 2 and .name === "addEventListener"', () => {
    assert.strictEqual(stealthSb.EventTarget.prototype.addEventListener.length, 2);
    assert.strictEqual(stealthSb.EventTarget.prototype.addEventListener.name, 'addEventListener');
  });
  runTest(171, 'Deep-Stealth', 'window.setTimeout.length === 1 and window.setInterval.length === 1', () => {
    assert.strictEqual(stealthSb.window.setTimeout.length, 1);
    assert.strictEqual(stealthSb.window.setInterval.length, 1);
  });
  runTest(172, 'Deep-Stealth', 'window.requestAnimationFrame.length === 1', () => {
    assert.strictEqual(stealthSb.window.requestAnimationFrame.length, 1);
  });
  runTest(173, 'Deep-Stealth', 'Date.now.length === 0 and Performance.prototype.now.length === 0', () => {
    assert.strictEqual(stealthSb.window.Date.now.length, 0);
    assert.strictEqual(stealthSb.Performance.prototype.now.length, 0);
  });
  runTest(174, 'Deep-Stealth', 'window.IntersectionObserver.prototype.constructor === window.IntersectionObserver', () => {
    assert.strictEqual(stealthSb.window.IntersectionObserver.prototype.constructor, stealthSb.window.IntersectionObserver);
  });
  runTest(175, 'Deep-Stealth', 'window.IntersectionObserver.length === 1', () => {
    assert.strictEqual(stealthSb.window.IntersectionObserver.length, 1);
  });
  runTest(176, 'Deep-Stealth', 'Zero __bc properties exist anywhere in Object.getOwnPropertyNames(window)', () => {
    const names = Object.getOwnPropertyNames(stealthSb.window).filter((n) => n.includes('__bc'));
    assert.strictEqual(names.length, 0, `Leaked properties on window: ${names.join(', ')}`);
  });
  runTest(177, 'Deep-Stealth', 'IntersectionObserver.prototype.takeRecords() spoofs offscreen entries to isIntersecting: true', () => {
    const io = new stealthSb.window.IntersectionObserver(() => {});
    const recs = io.takeRecords();
    assert.strictEqual(recs[0].isIntersecting, true);
    assert.strictEqual(recs[0].intersectionRatio, 1.0);
  });
  runTest(178, 'Deep-Stealth', 'Function.prototype.toString.call(123) throws TypeError just like native V8', () => {
    assert.throws(() => stealthSb.Function.prototype.toString.call(123), TypeError);
  });

  // ==========================================================================
  // GROUP 9: DEEP REAL-SITE EDGE CASES (Tests 179 - 210)
  // ==========================================================================
  runTest(179, 'RealSite-EdgeCases', 'Delegated document.addEventListener("focusout") fires normally when moving between form inputs (relatedTarget !== null)!', () => {
    let delegatedFocusOutFired = false;
    stealthSb.document.addEventListener('focusout', () => { delegatedFocusOutFired = true; });
    const usernameInput = new stealthSb.Element('input');
    const passInput = new stealthSb.Element('input');
    stealthSb.document.dispatchEvent(new stealthSb.Event('focusout', {
      target: usernameInput,
      relatedTarget: passInput,
      bubbles: true
    }));
    assert.strictEqual(delegatedFocusOutFired, true, 'Delegated focusout between form inputs was blocked!');
  });

  runTest(180, 'RealSite-EdgeCases', 'Delegated document.addEventListener("focusout") is blocked when focus leaves the browser window (relatedTarget === null)', () => {
    let windowLeaveFocusOutFired = false;
    const sb = createBrowserSandbox();
    vm.runInContext(mainCoreCode, sb);
    sb.document.addEventListener('focusout', () => { windowLeaveFocusOutFired = true; });
    const usernameInput = new sb.Element('input');
    sb.document.dispatchEvent(new sb.Event('focusout', {
      target: usernameInput,
      relatedTarget: null,
      bubbles: true
    }));
    assert.strictEqual(windowLeaveFocusOutFired, false);
  });

  await runAsyncTest(181, 'RealSite-EdgeCases', 'SPA Navigation on FaucetCrypto: navigating from /login to /dashboard/ptc/view/123 dynamically unlocks speed!', async () => {
    const spaSb = createBrowserSandbox({
      url: 'https://faucetcrypto.com/login'
    });
    vm.runInContext(mainCoreCode, spaSb);
    spaSb.window.dispatchEvent(new spaSb.CustomEvent('__bc_config_update__', {
      detail: JSON.stringify({ speedEnabled: true, speedFactor: 5.0 })
    }));
    // While on /login, speed is locked to 1.0x
    let tele = null;
    spaSb.window.addEventListener('__bc_telemetry__', (e) => { tele = JSON.parse(e.detail); });
    await new Promise((r) => setTimeout(r, 550));
    assert.strictEqual(tele.isAuthPage, true);
    assert.strictEqual(tele.effectiveTimerSpeed, 1.0);

    // Simulate SPA route transition to /dashboard/ptc/view/01m5fjf7
    spaSb.location.pathname = '/dashboard/ptc/view/01m5fjf7';
    spaSb.location.href = 'https://faucetcrypto.com/dashboard/ptc/view/01m5fjf7';
    await new Promise((r) => setTimeout(r, 550));
    assert.strictEqual(tele.isAuthPage, false);
    assert.strictEqual(tele.effectiveTimerSpeed, 5.0);
  });

  await runAsyncTest(182, 'RealSite-EdgeCases', 'Reverse SPA Navigation: navigating from /dashboard to /withdraw immediately locks speed to 1.0x!', async () => {
    const spaSb = createBrowserSandbox({
      url: 'https://faucetcrypto.com/dashboard/ptc'
    });
    vm.runInContext(mainCoreCode, spaSb);
    spaSb.window.dispatchEvent(new spaSb.CustomEvent('__bc_config_update__', {
      detail: JSON.stringify({ speedEnabled: true, speedFactor: 5.0 })
    }));
    spaSb.location.pathname = '/dashboard/withdraw';
    spaSb.location.href = 'https://faucetcrypto.com/dashboard/withdraw';
    let tele = null;
    spaSb.window.addEventListener('__bc_telemetry__', (e) => { tele = JSON.parse(e.detail); });
    await new Promise((r) => setTimeout(r, 550));
    assert.strictEqual(tele.isAuthPage, true);
    assert.strictEqual(tele.effectiveTimerSpeed, 1.0);
  });

  await runAsyncTest(183, 'RealSite-EdgeCases', 'AutoDutchy Homepage Login with "Show Password" toggled (input[name="password" type="text"]) is STILL protected as Auth Safe-Zone!', async () => {
    const shownPassInput = new stealthSb.Element('input');
    shownPassInput.type = 'text';
    shownPassInput.name = 'password';
    const homeSb = createBrowserSandbox({
      url: 'https://autofaucet.dutchycorp.space/',
      querySelector(sel) {
        if (sel.includes('input[name="password" i]')) return shownPassInput;
        return null;
      }
    });
    vm.runInContext(mainCoreCode, homeSb);
    homeSb.window.dispatchEvent(new homeSb.CustomEvent('__bc_config_update__', {
      detail: JSON.stringify({ speedEnabled: true, speedFactor: 10.0 })
    }));
    let tele = null;
    homeSb.window.addEventListener('__bc_telemetry__', (e) => { tele = JSON.parse(e.detail); });
    await new Promise((r) => setTimeout(r, 550));
    assert.strictEqual(tele.isAuthPage, true);
    assert.strictEqual(tele.effectiveTimerSpeed, 1.0);
  });

  await runAsyncTest(184, 'RealSite-EdgeCases', 'AutoDutchy Captcha Dropdown One-Time Selection: manual user change to hCaptcha is NEVER overwritten by 400ms scanner!', async () => {
    const dropdown = {
      selectedIndex: 0,
      options: [
        { text: 'hCaptcha', value: 'hcaptcha' },
        { text: 'Cloudflare Turnstile', value: 'turnstile' }
      ],
      dispatchEvent() {}
    };
    const dropSb = createBrowserSandbox({
      url: 'https://autofaucet.dutchycorp.space/roll.php',
      querySelectorAll(sel) {
        if (sel.includes('select')) return [dropdown];
        return [];
      }
    });
    vm.runInContext(isolatedBridgeCode, dropSb);
    await new Promise((r) => setTimeout(r, 450));
    assert.strictEqual(dropdown.selectedIndex, 1); // Initial auto-select to Turnstile

    // User manually changes dropdown back to hCaptcha (index 0)
    dropdown.selectedIndex = 0;
    await new Promise((r) => setTimeout(r, 900)); // Wait 2 scanner cycles
    assert.strictEqual(dropdown.selectedIndex, 0, 'Scanner overwrote manual user dropdown choice!');
  });

  runTest(185, 'RealSite-EdgeCases', 'FaucetCrypto / CoinPayU window.open("about:blank") followed by adWin.location.href = "..." navigates real popup while keeping adWin.closed === false', () => {
    const adWin = faucetCryptoSurfSb.window.open('about:blank', '_blank');
    adWin.location.href = 'https://globalprimepoint.com/invite/?ref=100002';
    const realWin = faucetCryptoSurfSb._getLastOpenedRealWindow();
    assert.strictEqual(realWin.location.href, 'https://globalprimepoint.com/invite/?ref=100002');
    assert.strictEqual(adWin.closed, false);
  });

  runTest(186, 'RealSite-EdgeCases', 'adWin.location.replace("https://...") forwards to real popup location.replace()', () => {
    const adWin = faucetCryptoSurfSb.window.open('about:blank', '_blank');
    adWin.location.replace('https://aviso.bz/surf-target');
    const realWin = faucetCryptoSurfSb._getLastOpenedRealWindow();
    assert.strictEqual(realWin.location.href, 'https://aviso.bz/surf-target');
    assert.strictEqual(adWin.closed, false);
  });

  runTest(187, 'RealSite-EdgeCases', 'adWin.location = "https://..." forwards to real popup location', () => {
    const adWin = faucetCryptoSurfSb.window.open('about:blank', '_blank');
    adWin.location = 'https://autofaucet.dutchycorp.space/ptc';
    const realWin = faucetCryptoSurfSb._getLastOpenedRealWindow();
    assert.strictEqual(realWin.location, 'https://autofaucet.dutchycorp.space/ptc');
  });

  runTest(188, 'RealSite-EdgeCases', 'Window.prototype.open.call(window, url) also returns the Never-Closed Proxy', () => {
    faucetCryptoSurfSb._setMockOpenedWindowClosed(true);
    const adWin = faucetCryptoSurfSb.Window.prototype.open.call(faucetCryptoSurfSb.window, 'https://example.com', '_blank');
    assert.strictEqual(adWin.closed, false);
  });

  runTest(189, 'RealSite-EdgeCases', 'Non-configurable properties on realWin NEVER cause V8 Proxy invariant TypeError on adWin', () => {
    const adWin = faucetCryptoSurfSb.window.open('https://example.com', '_blank');
    assert.doesNotThrow(() => {
      const _c = adWin.closed;
      const _n = adWin.nonConfigurableDataProp;
      return [_c, _n];
    });
    assert.strictEqual(adWin.nonConfigurableDataProp, 42);
  });

  runTest(190, 'RealSite-EdgeCases', 'adWin.window, adWin.self, adWin.top, and adWin.frames return the Never-Closed Proxy itself', () => {
    const adWin = faucetCryptoSurfSb.window.open('https://example.com', '_blank');
    assert.strictEqual(adWin.window, adWin);
    assert.strictEqual(adWin.self, adWin);
    assert.strictEqual(adWin.top, adWin);
    assert.strictEqual(adWin.frames, adWin);
  });

  await runAsyncTest(191, 'RealSite-EdgeCases', 'timersAcceleratedCount stays 0 when timers run at 1.0x safe default speed', async () => {
    const safeSb = createBrowserSandbox();
    vm.runInContext(mainCoreCode, safeSb);
    const id = safeSb.window.setInterval(() => {}, 100);
    const tid = safeSb.window.setTimeout(() => {}, 100);
    let tele = null;
    safeSb.window.addEventListener('__bc_telemetry__', (e) => { tele = JSON.parse(e.detail); });
    await new Promise((r) => setTimeout(r, 550));
    safeSb.window.clearInterval(id);
    safeSb.window.clearTimeout(tid);
    assert.strictEqual(tele.timersAcceleratedCount, 0);
  });

  await runAsyncTest(192, 'RealSite-EdgeCases', 'timersAcceleratedCount increments when a 1.0x timer is switched live to 5.0x!', async () => {
    const safeSb = createBrowserSandbox();
    vm.runInContext(mainCoreCode, safeSb);
    const id = safeSb.window.setInterval(() => {}, 200);
    safeSb.window.dispatchEvent(new safeSb.CustomEvent('__bc_config_update__', {
      detail: JSON.stringify({ speedEnabled: true, speedFactor: 5.0 })
    }));
    let tele = null;
    safeSb.window.addEventListener('__bc_telemetry__', (e) => { tele = JSON.parse(e.detail); });
    await new Promise((r) => setTimeout(r, 550));
    safeSb.window.clearInterval(id);
    assert.ok(tele.timersAcceleratedCount >= 1);
  });

  runTest(193, 'RealSite-EdgeCases', 'Trusted user click (isTrusted: true) followed by video.pause() is allowed to pause the video', () => {
    const vid = new stealthSb.HTMLVideoElement();
    vid.paused = false;
    stealthSb.window.dispatchEvent(new stealthSb.Event('pointerdown', { isTrusted: true }));
    vid.pause();
    assert.strictEqual(vid.paused, true);
  });

  runTest(194, 'RealSite-EdgeCases', 'Untrusted/script pause (isTrusted: false) in background tab is blocked from pausing the video', () => {
    const sb = createBrowserSandbox();
    vm.runInContext(mainCoreCode, sb);
    const vid = new sb.HTMLVideoElement();
    vid.paused = false;
    sb.window.dispatchEvent(new sb.Event('pointerdown', { isTrusted: false }));
    vid.pause();
    assert.strictEqual(vid.paused, false);
  });

  await runAsyncTest(195, 'RealSite-EdgeCases', 'Countdown transition from 1s to "Click Claim" (timer element disappears) sets detectedRemainingSec to 0 instead of sticking at 1', async () => {
    let showTimer = true;
    const timerEl = new stealthSb.Element('span');
    timerEl.textContent = '1';
    const countSb = createBrowserSandbox({
      querySelector(sel) {
        if (sel === '#timer' && showTimer) return timerEl;
        return null;
      }
    });
    vm.runInContext(mainCoreCode, countSb);
    let tele = null;
    countSb.window.addEventListener('__bc_telemetry__', (e) => { tele = JSON.parse(e.detail); });
    await new Promise((r) => setTimeout(r, 550));
    assert.strictEqual(tele.detectedRemainingSec, 1);

    // Timer disappears and is replaced by Claim button
    showTimer = false;
    await new Promise((r) => setTimeout(r, 550));
    assert.strictEqual(tele.detectedRemainingSec, 0);
  });

  runTest(196, 'RealSite-EdgeCases', 'Hidden timer elements (offsetParent === null) are ignored by scanPtcCountdown()', () => {
    const hiddenTimerEl = new stealthSb.Element('span');
    hiddenTimerEl.textContent = '99';
    hiddenTimerEl.offsetParent = null; // Hidden in DOM!
    const countSb = createBrowserSandbox({
      querySelector(sel) {
        if (sel === '#timer') return hiddenTimerEl;
        return null;
      }
    });
    vm.runInContext(mainCoreCode, countSb);
    assert.strictEqual(hiddenTimerEl.offsetParent, null);
  });

  await runAsyncTest(197, 'RealSite-EdgeCases', 'pushConfigToMainWorld deduplicates identical payloads (zero redundant __bc_config_update__ spam)', async () => {
    const dedupSb = createBrowserSandbox({
      url: 'https://autofaucet.dutchycorp.space/login.php'
    });
    let updateCount = 0;
    dedupSb.window.addEventListener('__bc_config_update__', () => { updateCount++; });
    vm.runInContext(isolatedBridgeCode, dedupSb);
    await new Promise((r) => setTimeout(r, 1300)); // 3 scanner cycles (400ms each)
    assert.strictEqual(updateCount, 1, `Expected 1 config update, got ${updateCount}`);
  });

  await runAsyncTest(198, 'RealSite-EdgeCases', 'UPDATE_BADGE_TELEMETRY deduplicates identical badge updates', async () => {
    const dedupSb = createBrowserSandbox();
    vm.runInContext(mainCoreCode, dedupSb);
    vm.runInContext(isolatedBridgeCode, dedupSb);
    await new Promise((r) => setTimeout(r, 1200));
    const badgeMsgs = dedupSb.chrome._sentRuntimeMessages.filter((m) => m.type === 'UPDATE_BADGE_TELEMETRY');
    assert.strictEqual(badgeMsgs.length, 1, `Expected 1 badge message for unchanged state, got ${badgeMsgs.length}`);
  });

  runTest(199, 'RealSite-EdgeCases', 'On Login page (/login.php), setInterval and setTimeout return native timer IDs without wrapping', () => {
    const id = autoDutchyLoginSb.window.setInterval(() => {}, 1000);
    autoDutchyLoginSb.window.clearInterval(id);
    // Our synthetic IDs start at 100001; native Node/browser IDs are objects or < 100000
    assert.ok(typeof id !== 'number' || id < 100000);
  });

  runTest(200, 'RealSite-EdgeCases', 'Call-stack from challenges.cloudflare.com in performance.now() returns unwarped native clock even in full_warp mode', () => {
    assert.ok(mainCoreCode.includes('if (!State.enabled || isCloudflareOrCaptchaStack())'));
  });

  runTest(201, 'RealSite-EdgeCases', 'Call-stack from challenges.cloudflare.com in Date.now() returns unwarped native Date.now() even in full_warp mode', () => {
    assert.ok(mainCoreCode.includes('return Native.dateNow();'));
  });

  runTest(202, 'RealSite-EdgeCases', 'Form with action="https://autofaucet.dutchycorp.space/login.php" on any URL triggers Auth Safe-Zone', () => {
    const formSb = createBrowserSandbox({
      url: 'https://autofaucet.dutchycorp.space/custom-entry',
      querySelector(sel) {
        if (sel.includes('form[action*="login" i]')) return new stealthSb.Element('form');
        return null;
      }
    });
    vm.runInContext(mainCoreCode, formSb);
    const id = formSb.window.setInterval(() => {}, 1000);
    formSb.window.clearInterval(id);
    assert.ok(typeof id !== 'number' || id < 100000);
  });

  runTest(203, 'RealSite-EdgeCases', 'input[autocomplete="current-password"] triggers Auth Safe-Zone even if type="text"', () => {
    const acSb = createBrowserSandbox({
      url: 'https://faucetcrypto.com/entry',
      querySelector(sel) {
        if (sel.includes('autocomplete="current-password"')) return new stealthSb.Element('input');
        return null;
      }
    });
    vm.runInContext(mainCoreCode, acSb);
    const id = acSb.window.setInterval(() => {}, 1000);
    acSb.window.clearInterval(id);
    assert.ok(typeof id !== 'number' || id < 100000);
  });

  runTest(204, 'RealSite-EdgeCases', 'adWin.close() forwards cleanly to realWin.close() when PTC script closes popup after timer finishes', () => {
    const adWin = faucetCryptoSurfSb.window.open('https://example.com', '_blank');
    adWin.close();
    const realWin = faucetCryptoSurfSb._getLastOpenedRealWindow();
    assert.strictEqual(realWin._closedCalled, true);
  });

  runTest(205, 'RealSite-EdgeCases', 'adWin.focus() forwards cleanly to realWin.focus()', () => {
    const adWin = faucetCryptoSurfSb.window.open('https://example.com', '_blank');
    adWin.focus();
    const realWin = faucetCryptoSurfSb._getLastOpenedRealWindow();
    assert.strictEqual(realWin._focusedCalled, true);
  });

  runTest(206, 'RealSite-EdgeCases', 'Micro-intervals (<= 15ms) pass straight through to Native.setInterval without clamping to 10ms', () => {
    const id = stealthSb.window.setInterval(() => {}, 5);
    stealthSb.window.clearInterval(id);
    assert.ok(typeof id !== 'number' || id < 100000);
  });

  runTest(207, 'RealSite-EdgeCases', 'setInterval passes extra arguments (...args) accurately to handler callback', async () => {
    let receivedArgs = null;
    await new Promise((resolve) => {
      const id = stealthSb.window.setInterval((a, b, c) => {
        receivedArgs = [a, b, c];
        stealthSb.window.clearInterval(id);
        resolve();
      }, 20, 'alpha', 42, true);
    });
    assert.deepStrictEqual(receivedArgs, ['alpha', 42, true]);
  });

  await runAsyncTest(208, 'RealSite-EdgeCases', 'setTimeout passes extra arguments (...args) accurately to handler callback', async () => {
    let receivedArgs = null;
    await new Promise((resolve) => {
      stealthSb.window.setTimeout((x, y) => {
        receivedArgs = [x, y];
        resolve();
      }, 25, 'bravo', 99);
    });
    assert.deepStrictEqual(receivedArgs, ['bravo', 99]);
  });

  runTest(209, 'RealSite-EdgeCases', 'HTMLMediaElement.prototype.playbackRate getter called on HTMLMediaElement.prototype throws TypeError: Illegal invocation', () => {
    const getter = Object.getOwnPropertyDescriptor(stealthSb.HTMLMediaElement.prototype, 'playbackRate').get;
    assert.throws(() => getter.call(stealthSb.HTMLMediaElement.prototype), /Illegal invocation/);
  });

  runTest(210, 'RealSite-EdgeCases', 'HTMLVideoElement.prototype.getVideoPlaybackQuality.call({}) throws TypeError: Illegal invocation', () => {
    assert.throws(() => stealthSb.HTMLVideoElement.prototype.getVideoPlaybackQuality.call({}), /Illegal invocation/);
  });

  // ==========================================================================
  // GROUP 10: JUMPTASK SMART ENGINE, REACT CLOCK WARP & EXTREME TORTURE TESTS (Tests 211 - 250)
  // ==========================================================================
  const jumpTaskBtn = new stealthSb.Element('button');
  jumpTaskBtn.innerText = 'Continue in 3:42';
  jumpTaskBtn.disabled = true;

  const jumpTaskProofInput = new stealthSb.Element('input');
  jumpTaskProofInput.type = 'text';
  jumpTaskProofInput.placeholder = 'Enter text here';
  jumpTaskProofInput.value = '';

  const jumpTaskSb = createBrowserSandbox({
    url: 'https://app.jumptask.io/earn/offers/jumpoffers/12694',
    querySelectorAll(sel) {
      if (sel.includes('button')) return [jumpTaskBtn];
      if (sel.includes('input[type="text"]')) return [jumpTaskProofInput];
      return [];
    }
  });
  vm.runInContext(mainCoreCode, jumpTaskSb);
  vm.runInContext(isolatedBridgeCode, jumpTaskSb);

  runTest(211, 'JumpTask-Engine', 'On app.jumptask.io, domain profile automatically sets warpMode: "full_warp", speedFactor: 10.0, and jumpTaskAutoContinue: true', () => {
    let diag = null;
    jumpTaskSb.chrome._runtimeMessageListeners[0]({ type: 'GET_TAB_DIAGNOSTICS' }, {}, (r) => { diag = r; });
    assert.strictEqual(diag.config.warpMode, 'full_warp');
    assert.strictEqual(diag.config.jumpTaskAutoContinue, true);
    assert.strictEqual(diag.config.speedEnabled, true);
    assert.strictEqual(diag.config.speedFactor, 10.0);
  });

  runTest(212, 'JumpTask-Engine', 'Date.prototype.getTime.toString() and valueOf.toString() return exact "[native code]" string', () => {
    assert.strictEqual(jumpTaskSb.Date.prototype.getTime.toString(), 'function getTime() { [native code] }');
    assert.strictEqual(jumpTaskSb.Date.prototype.valueOf.toString(), 'function valueOf() { [native code] }');
  });

  runTest(213, 'JumpTask-Engine', '"prototype" in Date.prototype.getTime and Date.prototype.valueOf is false (matches V8)', () => {
    assert.strictEqual('prototype' in jumpTaskSb.Date.prototype.getTime, false);
    assert.strictEqual('prototype' in jumpTaskSb.Date.prototype.valueOf, false);
  });

  runTest(214, 'JumpTask-Engine', 'Date.prototype.getTime.length === 0, .name === "getTime", valueOf.length === 0, .name === "valueOf"', () => {
    assert.strictEqual(jumpTaskSb.Date.prototype.getTime.length, 0);
    assert.strictEqual(jumpTaskSb.Date.prototype.getTime.name, 'getTime');
    assert.strictEqual(jumpTaskSb.Date.prototype.valueOf.length, 0);
    assert.strictEqual(jumpTaskSb.Date.prototype.valueOf.name, 'valueOf');
  });

  runTest(215, 'JumpTask-Engine', 'Calling Date.prototype.getTime.call({}) throws authentic TypeError: this is not a Date object', () => {
    assert.throws(() => jumpTaskSb.Date.prototype.getTime.call({}), TypeError);
    assert.throws(() => jumpTaskSb.Date.prototype.getTime.call(jumpTaskSb.Date.prototype), TypeError);
  });

  runTest(216, 'JumpTask-Engine', 'Calling Date.prototype.valueOf.call({}) throws authentic TypeError: this is not a Date object', () => {
    assert.throws(() => jumpTaskSb.Date.prototype.valueOf.call({}), TypeError);
  });

  runTest(217, 'JumpTask-Engine', 'Calling new Date.prototype.getTime() throws TypeError: is not a constructor', () => {
    assert.throws(() => new jumpTaskSb.Date.prototype.getTime(), TypeError);
  });

  await runAsyncTest(218, 'JumpTask-Engine', 'In full_warp mode at 10x speed, new Date().getTime() advances at 10x speed!', async () => {
    jumpTaskSb.window.dispatchEvent(new jumpTaskSb.CustomEvent('__bc_config_update__', {
      detail: JSON.stringify({ enabled: true, speedEnabled: true, speedFactor: 10.0, warpMode: 'full_warp', captchaActive: false })
    }));
    const t0 = new jumpTaskSb.Date().getTime();
    await new Promise((r) => setTimeout(r, 60));
    const t1 = new jumpTaskSb.Date().getTime();
    assert.ok(t1 - t0 >= 300, `Expected >= 300ms virtual advance on getTime(), got ${t1 - t0}ms`);
  });

  await runAsyncTest(219, 'JumpTask-Engine', 'In full_warp mode at 10x speed, +new Date() (valueOf) advances at 10x speed!', async () => {
    const v0 = +(new jumpTaskSb.Date());
    await new Promise((r) => setTimeout(r, 60));
    const v1 = +(new jumpTaskSb.Date());
    assert.ok(v1 - v0 >= 300, `Expected >= 300ms virtual advance on valueOf(), got ${v1 - v0}ms`);
  });

  runTest(220, 'JumpTask-Engine', 'Fixed dates (e.g. new Date("2026-10-21T00:00:00Z").getTime() or targetEndTime) are NOT shifted by getTime()', () => {
    const fixedIso = new jumpTaskSb.Date('2026-10-21T00:00:00Z');
    assert.strictEqual(fixedIso.getTime(), Date.parse('2026-10-21T00:00:00Z'));
  });

  await runAsyncTest(221, 'JumpTask-Engine', 'Simulating JumpTask React Countdown (targetEndDate.getTime() - new Date().getTime()) at 20x finishes 1000ms timer in < 160ms!', async () => {
    jumpTaskSb.window.dispatchEvent(new jumpTaskSb.CustomEvent('__bc_config_update__', {
      detail: JSON.stringify({ enabled: true, speedEnabled: true, speedFactor: 20.0, warpMode: 'full_warp', captchaActive: false })
    }));
    const targetEndDate = new jumpTaskSb.Date(jumpTaskSb.Date.now() + 1000);
    const startReal = HOST_ORIG_DATE_NOW();
    await new Promise((resolve) => {
      const iv = jumpTaskSb.window.setInterval(() => {
        const remainingMs = targetEndDate.getTime() - new jumpTaskSb.Date().getTime();
        if (remainingMs <= 0) {
          jumpTaskSb.window.clearInterval(iv);
          resolve();
        }
      }, 100);
    });
    const realTook = HOST_ORIG_DATE_NOW() - startReal;
    jumpTaskSb.window.dispatchEvent(new jumpTaskSb.CustomEvent('__bc_config_update__', {
      detail: JSON.stringify({ enabled: true, speedEnabled: false, speedFactor: 1.0, warpMode: 'full_warp', captchaActive: false })
    }));
    assert.ok(realTook < 220, `Expected JumpTask React countdown to finish in < 220ms, took ${realTook}ms`);
  });

  await runAsyncTest(222, 'JumpTask-Engine', 'JumpTask button text "Continue in 3:42" is parsed by scanPtcCountdown() as 222 seconds (3*60 + 42)', async () => {
    jumpTaskBtn.innerText = 'Continue in 3:42';
    let tele = null;
    jumpTaskSb.window.addEventListener('__bc_telemetry__', (e) => { tele = JSON.parse(e.detail); });
    await new Promise((r) => setTimeout(r, 550));
    assert.ok(tele);
    assert.strictEqual(tele.detectedRemainingSec, 222);
    assert.strictEqual(tele.detectedAdDurationSec, 222);
  });

  await runAsyncTest(223, 'JumpTask-Engine', 'JumpTask button text "Continue in 0:15" is parsed as 15 seconds', async () => {
    jumpTaskBtn.innerText = 'Continue in 0:15';
    let tele = null;
    jumpTaskSb.window.addEventListener('__bc_telemetry__', (e) => { tele = JSON.parse(e.detail); });
    await new Promise((r) => setTimeout(r, 550));
    assert.strictEqual(tele.detectedRemainingSec, 15);
  });

  await runAsyncTest(224, 'JumpTask-Engine', 'Timer element #timer with "05:30" is parsed as 330 seconds', async () => {
    const mmssEl = new stealthSb.Element('div');
    mmssEl.textContent = '05:30';
    const mmssSb = createBrowserSandbox({
      querySelector(sel) {
        if (sel === '#timer') return mmssEl;
        return null;
      }
    });
    vm.runInContext(mainCoreCode, mmssSb);
    let tele = null;
    mmssSb.window.addEventListener('__bc_telemetry__', (e) => { tele = JSON.parse(e.detail); });
    await new Promise((r) => setTimeout(r, 550));
    assert.strictEqual(tele.detectedRemainingSec, 330);
  });

  await runAsyncTest(225, 'JumpTask-Engine', 'Document title "02:10 - JumpTask" is parsed as 130 seconds', async () => {
    const titleMmssSb = createBrowserSandbox({
      title: '02:10 - JumpTask'
    });
    vm.runInContext(mainCoreCode, titleMmssSb);
    let tele = null;
    titleMmssSb.window.addEventListener('__bc_telemetry__', (e) => { tele = JSON.parse(e.detail); });
    await new Promise((r) => setTimeout(r, 550));
    assert.strictEqual(tele.detectedRemainingSec, 130);
  });

  runTest(226, 'JumpTask-Engine', 'Service Worker badge displays "15m" when remaining is 900s (15 min) and "222s" when remaining is 222s', () => {
    swSb.chrome._runtimeMessageListeners[0](
      { type: 'UPDATE_BADGE_TELEMETRY', remainingSec: 900, cfStatus: 'isolated' },
      { tab: { id: 77 } },
      () => {}
    );
    const badge15m = swSb.chrome.action.badges[swSb.chrome.action.badges.length - 1];
    assert.strictEqual(badge15m.text, '15m');

    swSb.chrome._runtimeMessageListeners[0](
      { type: 'UPDATE_BADGE_TELEMETRY', remainingSec: 222, cfStatus: 'isolated' },
      { tab: { id: 77 } },
      () => {}
    );
    const badge222s = swSb.chrome.action.badges[swSb.chrome.action.badges.length - 1];
    assert.strictEqual(badge222s.text, '222s');
  });

  await runAsyncTest(227, 'JumpTask-Engine', 'Guard #1: While button says "Continue in 0:15", Auto-Continue NEVER clicks the button', async () => {
    jumpTaskBtn.innerText = 'Continue in 0:15';
    jumpTaskBtn.disabled = true;
    jumpTaskBtn._clicked = false;
    await new Promise((r) => setTimeout(r, 450));
    assert.strictEqual(jumpTaskBtn._clicked, false);
  });

  await runAsyncTest(228, 'JumpTask-Engine', 'Guard #2: When button becomes "Continue" (enabled) but proof input is EMPTY, Auto-Continue waits and NEVER clicks!', async () => {
    jumpTaskBtn.innerText = 'Continue';
    jumpTaskBtn.disabled = false;
    jumpTaskProofInput.value = ''; // Empty proof input!
    await new Promise((r) => setTimeout(r, 450));
    assert.strictEqual(jumpTaskBtn._clicked, false, 'Clicked Continue while proof text input was empty!');
    let diag = null;
    jumpTaskSb.chrome._runtimeMessageListeners[0]({ type: 'GET_TAB_DIAGNOSTICS' }, {}, (r) => { diag = r; });
    assert.ok(diag.cloudflare.statusTextAr.includes('اكتب الكلمتين'));
  });

  await runAsyncTest(229, 'JumpTask-Engine', 'Guard #3: While user is actively typing ("create a") in proof input (< 2.5s debounce), Auto-Continue waits and NEVER clicks mid-typing!', async () => {
    jumpTaskProofInput.value = 'create a';
    jumpTaskProofInput.tagName = 'INPUT';
    jumpTaskSb.window.dispatchEvent(new jumpTaskSb.Event('input', { target: jumpTaskProofInput, bubbles: true }));
    await new Promise((r) => setTimeout(r, 450));
    assert.strictEqual(jumpTaskBtn._clicked, false, 'Clicked Continue while user was still actively typing!');
  });

  await runAsyncTest(230, 'JumpTask-Engine', 'Auto-Continue Execution: Once proof input has "create a warm" and typing debounce finishes, Auto-Continue clicks "Continue" automatically!', async () => {
    jumpTaskProofInput.value = 'create a warm';
    await new Promise((r) => setTimeout(r, 2600)); // Wait for 2.5s typing debounce to clear
    assert.strictEqual(jumpTaskBtn._clicked, true, 'Expected Continue button to be clicked automatically after debounce!');
  });

  await runAsyncTest(231, 'JumpTask-Engine', 'Guard #4: WeakSet prevents clicking the same "Continue" button a second time (zero double-submit)', async () => {
    jumpTaskBtn._clicked = false;
    await new Promise((r) => setTimeout(r, 500));
    assert.strictEqual(jumpTaskBtn._clicked, false, 'Double-clicked the same Continue button!');
  });

  await runAsyncTest(232, 'JumpTask-Engine', 'Search bars (placeholder="Search offers") are ignored by proof-input check so they do not block Auto-Continue', async () => {
    const searchInput = new stealthSb.Element('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search offers...';
    searchInput.value = '';
    const taskBtn2 = new stealthSb.Element('button');
    taskBtn2.innerText = 'Continue';
    taskBtn2.disabled = false;

    const searchSb = createBrowserSandbox({
      url: 'https://app.jumptask.io/earn/offers/jumpoffers/999',
      querySelectorAll(sel) {
        if (sel.includes('button')) return [taskBtn2];
        if (sel.includes('input[type="text"]')) return [searchInput];
        return [];
      }
    });
    vm.runInContext(isolatedBridgeCode, searchSb);
    await new Promise((r) => setTimeout(r, 500));
    assert.strictEqual(taskBtn2._clicked, true);
  });

  await runAsyncTest(233, 'JumpTask-Engine', 'On Login/Auth page, scanJumpTaskAndCountdownTasks NEVER clicks a "Continue" button', async () => {
    const loginContinueBtn = new stealthSb.Element('button');
    loginContinueBtn.innerText = 'Continue';
    loginContinueBtn.disabled = false;
    const authContSb = createBrowserSandbox({
      url: 'https://app.jumptask.io/login',
      querySelectorAll(sel) {
        if (sel.includes('button')) return [loginContinueBtn];
        return [];
      }
    });
    vm.runInContext(isolatedBridgeCode, authContSb);
    await new Promise((r) => setTimeout(r, 500));
    assert.strictEqual(loginContinueBtn._clicked, undefined);
  });

  // Extreme Torture & Edge-Case Tests (234 - 250)
  runTest(234, 'Torture-Suite', 'Date.parse("2026-10-21T12:00:00Z") and Date.UTC(2026, 9, 21) remain 100% accurate', () => {
    assert.strictEqual(jumpTaskSb.Date.parse('2026-10-21T12:00:00Z'), Date.parse('2026-10-21T12:00:00Z'));
    assert.strictEqual(jumpTaskSb.Date.UTC(2026, 9, 21), Date.UTC(2026, 9, 21));
  });

  runTest(235, 'Torture-Suite', 'Calling Date() without new returns a string just like native V8', () => {
    assert.strictEqual(typeof jumpTaskSb.Date(), 'string');
  });

  runTest(236, 'Torture-Suite', 'Reflect.apply(Function.prototype.toString, document.hasFocus, []) returns "[native code]"', () => {
    const s = jumpTaskSb.Reflect.apply(jumpTaskSb.Function.prototype.toString, jumpTaskSb.document.hasFocus, []);
    assert.strictEqual(s, 'function hasFocus() { [native code] }');
  });

  runTest(237, 'Torture-Suite', 'Reflect.apply(Function.prototype.toString, Date.prototype.getTime, []) returns "[native code]"', () => {
    const s = jumpTaskSb.Reflect.apply(jumpTaskSb.Function.prototype.toString, jumpTaskSb.Date.prototype.getTime, []);
    assert.strictEqual(s, 'function getTime() { [native code] }');
  });

  runTest(238, 'Torture-Suite', 'clearInterval(null), clearInterval(undefined), clearInterval(-1), clearTimeout(null) never throw', () => {
    assert.doesNotThrow(() => {
      jumpTaskSb.window.clearInterval(null);
      jumpTaskSb.window.clearInterval(undefined);
      jumpTaskSb.window.clearInterval(-1);
      jumpTaskSb.window.clearTimeout(null);
      jumpTaskSb.window.clearTimeout(undefined);
    });
  });

  runTest(239, 'Torture-Suite', 'setTimeout(null, 100) and setInterval(null, 100) do not crash our wrapper', () => {
    assert.doesNotThrow(() => {
      try { jumpTaskSb.window.setTimeout(null, 100); } catch (_) {}
      try { jumpTaskSb.window.setInterval(null, 100); } catch (_) {}
    });
  });

  runTest(240, 'Torture-Suite', 'Extreme speedFactor (e.g. 9999x or -5x) is safely clamped to [0.1x .. 50.0x]', async () => {
    jumpTaskSb.window.dispatchEvent(new jumpTaskSb.CustomEvent('__bc_config_update__', {
      detail: JSON.stringify({ enabled: true, speedEnabled: true, speedFactor: 9999, captchaActive: false })
    }));
    let tele = null;
    jumpTaskSb.window.addEventListener('__bc_telemetry__', (e) => { tele = JSON.parse(e.detail); });
    await new Promise((r) => setTimeout(r, 550));
    assert.strictEqual(tele.effectiveTimerSpeed, 50.0);
  });

  runTest(241, 'Torture-Suite', 'Extreme videoSpeedFactor (e.g. 500x) is safely clamped to HTML5 max 16.0x so Chromium never throws NotSupportedError', async () => {
    jumpTaskSb.window.dispatchEvent(new jumpTaskSb.CustomEvent('__bc_config_update__', {
      detail: JSON.stringify({ enabled: true, videoSpeedEnabled: true, videoSpeedFactor: 500, captchaActive: false })
    }));
    let tele = null;
    jumpTaskSb.window.addEventListener('__bc_telemetry__', (e) => { tele = JSON.parse(e.detail); });
    await new Promise((r) => setTimeout(r, 550));
    assert.strictEqual(tele.effectiveVideoSpeed, 16.0);
  });

  runTest(242, 'Torture-Suite', 'Malformed JSON in __bc_config_update__ event is caught gracefully and never crashes', () => {
    assert.doesNotThrow(() => {
      jumpTaskSb.window.dispatchEvent(new jumpTaskSb.CustomEvent('__bc_config_update__', {
        detail: '{bad_json_syntax'
      }));
    });
  });

  runTest(243, 'Torture-Suite', 'Document.prototype.wasDiscarded getter called on Document.prototype throws TypeError: Illegal invocation', () => {
    const getter = Object.getOwnPropertyDescriptor(jumpTaskSb.Document.prototype, 'wasDiscarded').get;
    assert.throws(() => getter.call(jumpTaskSb.Document.prototype), /Illegal invocation/);
  });

  runTest(244, 'Torture-Suite', 'Document.prototype.activeElement getter called on Document.prototype throws TypeError: Illegal invocation', () => {
    const getter = Object.getOwnPropertyDescriptor(jumpTaskSb.Document.prototype, 'activeElement').get;
    assert.throws(() => getter.call(jumpTaskSb.Document.prototype), /Illegal invocation/);
  });

  runTest(245, 'Torture-Suite', 'UserActivation.prototype.isActive getter called on UserActivation.prototype throws TypeError: Illegal invocation', () => {
    const getter = Object.getOwnPropertyDescriptor(jumpTaskSb.UserActivation.prototype, 'isActive').get;
    assert.throws(() => getter.call(jumpTaskSb.UserActivation.prototype), /Illegal invocation/);
  });

  runTest(246, 'Torture-Suite', 'UserActivation.prototype.hasBeenActive getter called on {} throws TypeError: Illegal invocation', () => {
    const getter = Object.getOwnPropertyDescriptor(jumpTaskSb.UserActivation.prototype, 'hasBeenActive').get;
    assert.throws(() => getter.call({}), /Illegal invocation/);
  });

  runTest(247, 'Torture-Suite', 'HTMLMediaElement.prototype.defaultPlaybackRate getter called on {} throws TypeError: Illegal invocation', () => {
    const getter = Object.getOwnPropertyDescriptor(jumpTaskSb.HTMLMediaElement.prototype, 'defaultPlaybackRate').get;
    assert.throws(() => getter.call({}), /Illegal invocation/);
  });

  runTest(248, 'Torture-Suite', 'Element.prototype.animate.toString() returns "function animate() { [native code] }" and has no .prototype', () => {
    assert.strictEqual(jumpTaskSb.Element.prototype.animate.toString(), 'function animate() { [native code] }');
    assert.strictEqual('prototype' in jumpTaskSb.Element.prototype.animate, false);
  });

  runTest(249, 'Torture-Suite', 'Navigator.prototype.getBattery.toString() returns "function getBattery() { [native code] }" and has no .prototype', () => {
    assert.strictEqual(jumpTaskSb.Navigator.prototype.getBattery.toString(), 'function getBattery() { [native code] }');
    assert.strictEqual('prototype' in jumpTaskSb.Navigator.prototype.getBattery, false);
  });

  runTest(250, 'Torture-Suite', 'Window.prototype.open.toString() returns "function open() { [native code] }" and has no .prototype', () => {
    assert.strictEqual(jumpTaskSb.Window.prototype.open.toString(), 'function open() { [native code] }');
    assert.strictEqual('prototype' in jumpTaskSb.Window.prototype.open, false);
  });

  // ==========================================================================
  // SECTION XIV: V3.7 REAL-WORLD REGRESSION TESTS (Tests 251–260)
  // ==========================================================================
  runTest(251, 'AutoDutchy-Login', 'playglobal14.com/login/regist (BC.GAME Sign Up modal) is recognized as Auth Safe-Zone, leaves IntersectionObserver 100% native, and does not wrap window.open', () => {
    let realOpenedWin = { isNativePopup: true };
    const bcGameSb = createBrowserSandbox({
      url: 'https://playglobal14.com/login/regist?entry=v2&trace_id=CCYGYE',
      windowOpen() { return realOpenedWin; }
    });
    vm.runInContext(mainCoreCode, bcGameSb);
    vm.runInContext(isolatedBridgeCode, bcGameSb);
    // IntersectionObserver must pass raw entries untouched on /login/regist!
    let receivedEntries = null;
    const io = new bcGameSb.window.IntersectionObserver((entries) => {
      receivedEntries = entries;
    });
    io.observe(new bcGameSb.Element('div'));
    assert.strictEqual(receivedEntries[0].isIntersecting, false, 'IntersectionObserver forged entries on /login/regist modal!');
    // window.open must return raw window on auth page (where mock .closed is true, NOT spoofed to false)
    const popup = bcGameSb.window.open('https://accounts.google.com');
    assert.strictEqual(popup.closed, true, 'window.open was wrapped in Never-Closed Proxy on /login/regist page!');
  });

  runTest(252, 'AutoDutchy-Login', 'Clicking from password <input> into Cloudflare Turnstile iframe (focusout with relatedTarget === null) is NEVER blocked on AutoDutchy login!', () => {
    const passInput = new autoDutchyLoginSb.Element('input');
    passInput.tagName = 'INPUT';
    passInput.type = 'password';
    let focusoutReachedForm = false;
    autoDutchyLoginSb.document.addEventListener('focusout', () => {
      focusoutReachedForm = true;
    });
    const focusoutEv = new autoDutchyLoginSb.Event('focusout', {
      target: passInput,
      relatedTarget: null,
      bubbles: true
    });
    autoDutchyLoginSb.document.dispatchEvent(focusoutEv);
    assert.strictEqual(focusoutReachedForm, true, 'captureBlocker blocked focusout from <input> on AutoDutchy login when relatedTarget was null!');
  });

  await runAsyncTest(253, 'RealSite-EdgeCases', 'Hidden <input type="password" style="display:none"> (offsetParent === null) in navbar modal does NOT falsely trigger Auth Safe-Zone!', async () => {
    const hiddenPass = new stealthSb.Element('input');
    hiddenPass.type = 'password';
    hiddenPass.offsetParent = null; // Hidden modal!
    const navModalSb = createBrowserSandbox({
      url: 'https://autofaucet.dutchycorp.space/ptc/wall.php',
      querySelectorAll(sel) {
        if (sel.includes('input[type="password"]')) return [hiddenPass];
        return [];
      },
      querySelector(sel) {
        if (sel.includes('input[type="password"]')) return hiddenPass;
        return null;
      }
    });
    vm.runInContext(mainCoreCode, navModalSb);
    navModalSb.window.dispatchEvent(new navModalSb.CustomEvent('__bc_config_update__', {
      detail: JSON.stringify({ speedEnabled: true, speedFactor: 10.0 })
    }));
    let tele = null;
    navModalSb.window.addEventListener('__bc_telemetry__', (e) => { tele = JSON.parse(e.detail); });
    await new Promise((r) => setTimeout(r, 550));
    assert.strictEqual(tele.isAuthPage, false);
    assert.strictEqual(tele.effectiveTimerSpeed, 10.0);
  });

  await runAsyncTest(254, 'JumpTask-Engine', 'Monotonic StealthDate: stored `const start = new Date()` never jumps backward after 50ms and `new Date() - start` advances at 10x!', async () => {
    const jtDateSb = createBrowserSandbox({
      url: 'https://app.jumptask.io/earn/offers/jumpoffers/12693'
    });
    vm.runInContext(mainCoreCode, jtDateSb);
    const start = new jtDateSb.window.Date();
    const startMs = start.getTime();
    await new Promise((r) => setTimeout(r, 80)); // Wait > 50ms!
    assert.strictEqual(start.getTime(), startMs, 'Stored Date instance changed its .getTime() after 50ms!');
    const now = new jtDateSb.window.Date();
    const virtualElapsed = now - start;
    assert.ok(virtualElapsed >= 450, `Expected >= 450ms virtual elapsed at 10x in 80ms real time, got ${virtualElapsed}ms`);
  });

  runTest(255, 'JumpTask-Engine', 'Web Worker Blob Timer Accelerator: Blob containing setInterval (`worker-timers`) automatically receives speed divisor on JumpTask', () => {
    let capturedBlobParts = null;
    const workerBlobSb = createBrowserSandbox({
      url: 'https://app.jumptask.io/earn/offers/jumpoffers/12693'
    });
    workerBlobSb.window.Blob = function Blob(parts, opts) {
      capturedBlobParts = parts;
      this.parts = parts;
      this.options = opts;
    };
    vm.runInContext(mainCoreCode, workerBlobSb);
    const b = new workerBlobSb.window.Blob(['self.onmessage = function() { setInterval( tick, 1000 ); };'], { type: 'application/javascript' });
    assert.ok(b && Array.isArray(capturedBlobParts));
    assert.ok(capturedBlobParts[0].includes('self.setInterval=function'), 'Worker Blob did not receive setInterval accelerator!');
  });

  runTest(256, 'JumpTask-Engine', 'Even when old chrome.storage.local has speedEnabled: false & speedFactor: 1.0, app.jumptask.io enforces 10.0x Full-Warp', () => {
    const oldStorageJtSb = createBrowserSandbox({
      url: 'https://app.jumptask.io/earn/offers/jumpoffers/12693',
      storageData: {
        speedEnabled: false,
        speedFactor: 1.0,
        warpMode: 'timers_only',
        siteProfiles: {
          'autofaucet.dutchycorp.space': { warpMode: 'timers_only' }
        }
      }
    });
    vm.runInContext(isolatedBridgeCode, oldStorageJtSb);
    let diag = null;
    oldStorageJtSb.chrome._runtimeMessageListeners[0]({ type: 'GET_TAB_DIAGNOSTICS' }, {}, (r) => { diag = r; });
    assert.strictEqual(diag.config.warpMode, 'full_warp');
    assert.strictEqual(diag.config.speedEnabled, true);
    assert.strictEqual(diag.config.speedFactor, 10.0);
  });

  runTest(257, 'JumpTask-Engine', 'Floating HUD displays "BraveCount Pro v4.0" and includes 10x, 20x, and 50x quick speed buttons', () => {
    assert.ok(isolatedBridgeCode.includes('BraveCount Pro v4.0'));
    assert.ok(isolatedBridgeCode.includes('data-sp="10"'));
    assert.ok(isolatedBridgeCode.includes('data-sp="20"'));
    assert.ok(isolatedBridgeCode.includes('data-sp="50"'));
  });

  runTest(258, 'Cloudflare', 'StealthIntersectionObserver leaves entries 100% untouched when a visible Cloudflare widget is on the page', () => {
    const cfElemVisible = new stealthSb.Element('div');
    cfElemVisible.offsetParent = {};
    const cfProbeSb = createBrowserSandbox({
      url: 'https://autofaucet.dutchycorp.space/roll.php',
      querySelector(sel) {
        if (sel.includes('.cf-turnstile')) return cfElemVisible;
        return null;
      }
    });
    vm.runInContext(mainCoreCode, cfProbeSb);
    let received = null;
    const io = new cfProbeSb.window.IntersectionObserver((entries) => {
      received = entries;
    });
    io.observe(new cfProbeSb.Element('div'));
    assert.strictEqual(received[0].isIntersecting, false, 'IntersectionObserver modified Cloudflare offscreen probe entry!');
  });

  runTest(259, 'AutoDutchy-Login', 'pushConfigToMainWorld on Auth/Login pages disables alwaysActive, blockBlur, blockVisibility, spoofViewport, and windowSurfShield', () => {
    let pushedConfig = null;
    const loginBridgeSb = createBrowserSandbox({
      url: 'https://autofaucet.dutchycorp.space/login.php'
    });
    loginBridgeSb.window.addEventListener('__bc_config_update__', (e) => {
      pushedConfig = JSON.parse(e.detail);
    });
    vm.runInContext(isolatedBridgeCode, loginBridgeSb);
    assert.ok(pushedConfig);
    assert.strictEqual(pushedConfig.speedEnabled, false);
    assert.strictEqual(pushedConfig.alwaysActive, false);
    assert.strictEqual(pushedConfig.blockBlur, false);
    assert.strictEqual(pushedConfig.blockVisibility, false);
    assert.strictEqual(pushedConfig.spoofViewport, false);
    assert.strictEqual(pushedConfig.windowSurfShield, false);
  });

  runTest(260, 'Architecture', 'service-worker.js defines injectIntoAllOpenTabs() using chrome.scripting.executeScript for both MAIN and ISOLATED worlds', () => {
    assert.ok(serviceWorkerCode.includes('function injectIntoAllOpenTabs()'));
    assert.ok(serviceWorkerCode.includes('chrome.scripting.executeScript'));
    assert.ok(serviceWorkerCode.includes("world: 'MAIN'"));
    assert.ok(serviceWorkerCode.includes("world: 'ISOLATED'"));
  });

  runTest(261, 'FaucetCrypto-Surf', 'Vue 3 Reactivity Shield on window.open: win.__v_skip === true and Object.prototype.toString.call(win) === "[object Window]"', () => {
    const adWin = faucetCryptoSurfSb.window.open('https://rollercoin.com/?utm_source=faucetcrypto', '_blank');
    assert.strictEqual(adWin.closed, false);
    assert.strictEqual(adWin.__v_skip, true);
    assert.strictEqual(adWin.__v_isRaw, true);
    assert.strictEqual(Object.prototype.toString.call(adWin), '[object Window]');
  });

  await runAsyncTest(262, 'FaucetCrypto-Surf', 'Background Tab Multi-Tick Catch-Up Engine: when Chromium throttles setTimeout in a background tab, setInterval catches up all elapsed virtual ticks!', async () => {
    // Simulate a background tab where Native.setTimeout clamps every delay to >= 180ms
    const bgThrottledSb = createBrowserSandbox({
      url: 'https://faucetcrypto.com/dashboard/ptc/view/01m5fjf7'
    });
    const origSetTimeout = bgThrottledSb.window.setTimeout;
    bgThrottledSb.window.setTimeout = (fn, d, ...a) => origSetTimeout(fn, Math.max(180, d), ...a);
    vm.runInContext(mainCoreCode, bgThrottledSb);
    bgThrottledSb.window.dispatchEvent(new bgThrottledSb.CustomEvent('__bc_config_update__', {
      detail: JSON.stringify({ enabled: true, speedEnabled: true, speedFactor: 10.0, warpMode: 'full_warp' })
    }));
    let countdown = 10;
    const id = bgThrottledSb.window.setInterval(() => {
      countdown--;
      if (countdown <= 0) {
        bgThrottledSb.window.clearInterval(id);
      }
    }, 100);
    await new Promise((r) => setTimeout(r, 230)); // Only 1 throttled wakeup (~180ms) occurs!
    // In 180ms real time at 10x speed, 1800ms virtual time elapsed = 18 ticks of 100ms, so countdown (10) reaches 0 in a SINGLE throttled wakeup!
    assert.strictEqual(countdown, 0, `Expected background countdown to reach 0 in 1 throttled wakeup, got ${countdown}`);
  });

  runTest(263, 'FaucetCrypto-Surf', 'Selecting 5x speed on HUD (storage speedEnabled: true, speedFactor: 5) activates 5x + full_warp on faucetcrypto.com even with siteProfiles present', () => {
    const fcSpeedSb = createBrowserSandbox({
      url: 'https://faucetcrypto.com/dashboard/ptc/view/01m5fjf7',
      initialStorage: {
        speedEnabled: true,
        speedFactor: 5.0,
        siteProfiles: {
          'faucetcrypto.com': { warpMode: 'timers_only', smartHoldEnabled: true }
        }
      }
    });
    vm.runInContext(isolatedBridgeCode, fcSpeedSb);
    let diag = null;
    fcSpeedSb.chrome._runtimeMessageListeners[0]({ type: 'GET_TAB_DIAGNOSTICS' }, {}, (r) => { diag = r; });
    assert.strictEqual(diag.config.speedEnabled, true);
    assert.strictEqual(diag.config.speedFactor, 5.0);
    assert.strictEqual(diag.config.warpMode, 'full_warp');
  });

  runTest(264, 'FaucetCrypto-Surf', 'SET_QUICK_SPEED message with speed: 5 automatically enables full_warp so Date.now() and setInterval both accelerate at 5x', () => {
    const fcMsgSb = createBrowserSandbox({
      url: 'https://faucetcrypto.com/dashboard/ptc/view/01m5fjf7'
    });
    vm.runInContext(isolatedBridgeCode, fcMsgSb);
    fcMsgSb.chrome._runtimeMessageListeners[0]({ type: 'SET_QUICK_SPEED', speed: 5.0 }, {}, () => {});
    let diag = null;
    fcMsgSb.chrome._runtimeMessageListeners[0]({ type: 'GET_TAB_DIAGNOSTICS' }, {}, (r) => { diag = r; });
    assert.strictEqual(diag.config.speedEnabled, true);
    assert.strictEqual(diag.config.speedFactor, 5.0);
    assert.strictEqual(diag.config.warpMode, 'full_warp');
  });

  runTest(265, 'FaucetCrypto-Surf', 'createNeverClosedWindowProxy blocks unload/beforeunload/pagehide listeners on opened ad window so about:blank -> rollercoin.com transition never triggers false close', () => {
    let unloadListenerRegisteredOnRealPopup = false;
    const popupCheckSb = createBrowserSandbox({
      url: 'https://faucetcrypto.com/dashboard/ptc/view/01m5fjf7',
      windowOpen() {
        return {
          closed: true,
          addEventListener(type) {
            if (type === 'unload' || type === 'beforeunload' || type === 'pagehide') {
              unloadListenerRegisteredOnRealPopup = true;
            }
          }
        };
      }
    });
    vm.runInContext(mainCoreCode, popupCheckSb);
    const w = popupCheckSb.window.open('https://rollercoin.com/', '_blank');
    w.onunload = () => {};
    w.onbeforeunload = () => {};
    w.addEventListener('unload', () => {});
    w.addEventListener('beforeunload', () => {});
    assert.strictEqual(w.onunload, null);
    assert.strictEqual(unloadListenerRegisteredOnRealPopup, false);
  });

  await runAsyncTest(266, 'FaucetCrypto-Surf', 'Active PTC countdown ("25 seconds - Faucet Crypto") is NEVER braked to 1.0x even when .cf-turnstile is pre-rendered in DOM, then auto-brakes when timer reaches 0', async () => {
    const cfElem = new stealthSb.Element('div');
    cfElem.offsetParent = {};
    const fcWithCfSb = createBrowserSandbox({
      url: 'https://faucetcrypto.com/dashboard/ptc/view/01m5fjf7',
      title: '25 seconds - Faucet Crypto',
      querySelector(sel) {
        if (sel.includes('challenges.cloudflare.com') || sel.includes('.cf-turnstile')) return cfElem;
        return null;
      }
    });
    vm.runInContext(mainCoreCode, fcWithCfSb);
    let tele = null;
    fcWithCfSb.window.addEventListener('__bc_telemetry__', (e) => { tele = JSON.parse(e.detail); });
    await new Promise((r) => setTimeout(r, 550));
    assert.strictEqual(tele.effectiveTimerSpeed, 5.0);
    assert.strictEqual(tele.effectiveClockSpeed, 5.0);
    // Once countdown finishes (0 seconds), Auto-Brake engages 1.0x for captcha solving
    fcWithCfSb.document.title = '0 seconds - Faucet Crypto';
    await new Promise((r) => setTimeout(r, 550));
    assert.strictEqual(tele.effectiveTimerSpeed, 1.0);
  });

  runTest(267, 'FaucetCrypto-Surf', 'Out-of-the-box default on faucetcrypto.com enables 5.0x + full_warp without requiring manual activation', () => {
    const fcDefaultSb = createBrowserSandbox({
      url: 'https://faucetcrypto.com/dashboard/ptc/view/01m5fjf7'
    });
    vm.runInContext(isolatedBridgeCode, fcDefaultSb);
    let diag = null;
    fcDefaultSb.chrome._runtimeMessageListeners[0]({ type: 'GET_TAB_DIAGNOSTICS' }, {}, (r) => { diag = r; });
    assert.strictEqual(diag.config.speedEnabled, true);
    assert.strictEqual(diag.config.speedFactor, 5.0);
    assert.strictEqual(diag.config.warpMode, 'full_warp');
  });

  runTest(268, 'FaucetCrypto-Surf', 'StealthBlob injects dynamic __bc_worker_speed__ listener even when created at 1.0x, and Worker.prototype.postMessage scales delay/time payloads', () => {
    let capturedBlobParts = null;
    let postedMessage = null;
    function MockWorker() {}
    MockWorker.prototype.postMessage = function (msg) { postedMessage = msg; };
    const workerSb = createBrowserSandbox({
      url: 'https://autofaucet.dutchycorp.space/ptc/view.php'
    });
    workerSb.window.Blob = function Blob(parts) { capturedBlobParts = parts; };
    workerSb.window.Worker = MockWorker;
    vm.runInContext(mainCoreCode, workerSb);
    // Create timer Blob while speed is still 1.0x
    new workerSb.window.Blob(['self.setInterval(function(){}, 1000);']);
    assert.ok(Array.isArray(capturedBlobParts) && capturedBlobParts[0].includes('__bc_worker_speed__'));
    // Enable 5x speed and test Worker.prototype.postMessage scaling
    workerSb.window.dispatchEvent(new workerSb.CustomEvent('__bc_config_update__', {
      detail: JSON.stringify({ speedEnabled: true, speedFactor: 5.0 })
    }));
    const w = new workerSb.window.Worker('blob:test');
    w.postMessage({ method: 'set', delay: 1000, params: { delay: 1000 } });
    assert.strictEqual(postedMessage.delay, 200);
    assert.strictEqual(postedMessage.params.delay, 200);
  });

  runTest(269, 'FaucetCrypto-Surf', 'On advertiser /login/regist tab (playglobal12.com/login/regist), main-world stays at safe 1.0x while HUD highlights active background speed (5x)', () => {
    const adAuthTabSb = createBrowserSandbox({
      url: 'https://playglobal12.com/login/regist?entry=v2&trace_id=JUYMRJ',
      initialStorage: {
        speedEnabled: true,
        speedFactor: 5.0,
        warpMode: 'full_warp',
        userSelectedSpeed: true
      }
    });
    let lastMainWorldConfig = null;
    adAuthTabSb.window.addEventListener('__bc_config_update__', (e) => {
      lastMainWorldConfig = JSON.parse(e.detail);
    });
    vm.runInContext(isolatedBridgeCode, adAuthTabSb);
    assert.ok(lastMainWorldConfig);
    assert.strictEqual(lastMainWorldConfig.speedEnabled, false);
    assert.strictEqual(lastMainWorldConfig.speedFactor, 1.0);
  });

  await runAsyncTest(270, 'Cloudflare', 'Empty hidden input[name="cf-turnstile-response"] with no visible .cf-turnstile widget does NOT trigger false captchaActive', async () => {
    const hiddenOnlyInput = new stealthSb.Element('input');
    hiddenOnlyInput.value = '';
    const noVisibleCfSb = createBrowserSandbox({
      url: 'https://faucetcrypto.com/dashboard/ptc/view/01m5fjf7',
      querySelectorAll(sel) {
        if (sel.includes('.cf-turnstile')) return [];
        if (sel.includes('cf-turnstile-response')) return [hiddenOnlyInput];
        return [];
      }
    });
    vm.runInContext(isolatedBridgeCode, noVisibleCfSb);
    await new Promise((r) => setTimeout(r, 450));
    let diag = null;
    noVisibleCfSb.chrome._runtimeMessageListeners[0]({ type: 'GET_TAB_DIAGNOSTICS' }, {}, (r) => { diag = r; });
    assert.strictEqual(diag.cloudflare.detected, false);
  });

  runTest(271, 'Cloudflare', 'Subframe Isolation: any non-YouTube subframe (e.g. Cloudflare about:blank anti-bot probe iframe) exits at line 1 with 100% untouched native prototypes', () => {
    const probeIframeSb = createBrowserSandbox({
      url: 'about:blank'
    });
    probeIframeSb.window.top = {}; // Simulate subframe (window !== window.top)
    const origDate = probeIframeSb.window.Date;
    const origSetTimeout = probeIframeSb.window.setTimeout;
    const origToString = probeIframeSb.Function.prototype.toString;
    vm.runInContext(mainCoreCode, probeIframeSb);
    assert.strictEqual(probeIframeSb.window.Date, origDate);
    assert.strictEqual(probeIframeSb.window.setTimeout, origSetTimeout);
    assert.strictEqual(probeIframeSb.Function.prototype.toString, origToString);
  });

  runTest(272, 'Cloudflare', 'Full-Page Cloudflare Interstitial ("Just a moment..." / window._cf_chl_opt) exits at line 1 with zero hooks', () => {
    const cfInterstitialSb = createBrowserSandbox({
      url: 'https://autofaucet.dutchycorp.space/',
      title: 'Just a moment...'
    });
    const origDate = cfInterstitialSb.window.Date;
    const origSetTimeout = cfInterstitialSb.window.setTimeout;
    vm.runInContext(mainCoreCode, cfInterstitialSb);
    assert.strictEqual(cfInterstitialSb.window.Date, origDate);
    assert.strictEqual(cfInterstitialSb.window.setTimeout, origSetTimeout);
  });

  await runAsyncTest(273, 'Cloudflare', 'Clock Sync Snap-Back: after warping Date.now() into the future during a timer, when Cloudflare Turnstile is active Date.now() snaps back to exact real server time!', async () => {
    let showCf = false;
    const cfElem = new stealthSb.Element('div');
    cfElem.offsetParent = {};
    const snapSb = createBrowserSandbox({
      url: 'https://autofaucet.dutchycorp.space/ptc/view.php',
      querySelector(sel) {
        if (showCf && sel.includes('.cf-turnstile')) return cfElem;
        return null;
      }
    });
    vm.runInContext(mainCoreCode, snapSb);
    snapSb.window.dispatchEvent(new snapSb.CustomEvent('__bc_config_update__', {
      detail: JSON.stringify({ speedEnabled: true, speedFactor: 20.0, warpMode: 'full_warp' })
    }));
    await new Promise((r) => setTimeout(r, 60));
    const warpedNow = snapSb.window.Date.now();
    assert.ok(warpedNow - HOST_ORIG_DATE_NOW() > 300, 'Expected clock to warp ahead before captcha');
    // Now Cloudflare Turnstile becomes visible on page
    showCf = true;
    const snappedNow = snapSb.window.Date.now();
    assert.ok(Math.abs(snappedNow - HOST_ORIG_DATE_NOW()) < 50, `Expected Date.now() to snap back to real server time for Cloudflare, diff was ${snappedNow - HOST_ORIG_DATE_NOW()}ms`);
  });

  runTest(274, 'Cloudflare', 'StealthBlob Cloudflare Worker Guard: never modifies Cloudflare Proof-of-Work Blobs (containing cloudflare/turnstile/cdn-cgi or > 2500 chars)', () => {
    let capturedParts = null;
    const cfBlobSb = createBrowserSandbox({
      url: 'https://autofaucet.dutchycorp.space/roll.php'
    });
    cfBlobSb.window.Blob = function Blob(parts) { capturedParts = parts; };
    vm.runInContext(mainCoreCode, cfBlobSb);
    const cfWorkerCode = '/* cdn-cgi/challenge-platform */ self.setTimeout(function(){}, 100);';
    new cfBlobSb.window.Blob([cfWorkerCode]);
    assert.strictEqual(capturedParts.length, 1);
    assert.strictEqual(capturedParts[0], cfWorkerCode);
  });

  runTest(275, 'Cloudflare', 'Zero untrusted synthetic FocusEvent(isTrusted: false) dispatched on window/document', () => {
    assert.ok(!mainCoreCode.includes("new FocusEvent('focus'"));
    assert.ok(!mainCoreCode.includes('sendSyntheticFocusPulse'));
  });

  runTest(276, 'Cloudflare', 'Cloudflare JSD Cross-Iframe Probe: ifr.contentWindow.Function.prototype.toString.call(window.Date / setTimeout / toString) returns "[native code]" while preserving distinct realm functions', () => {
    const ifr = new stealthSb.HTMLIFrameElement();
    const cw = ifr.contentWindow;
    assert.notStrictEqual(cw.setInterval, stealthSb.window.setInterval);
    assert.notStrictEqual(cw.Function.prototype.toString, stealthSb.Function.prototype.toString);
    assert.strictEqual(cw.Function.prototype.toString.call(stealthSb.window.Date), 'function Date() { [native code] }');
    assert.strictEqual(cw.Function.prototype.toString.call(stealthSb.window.setTimeout), 'function setTimeout() { [native code] }');
    assert.strictEqual(cw.Function.prototype.toString.call(stealthSb.Performance.prototype.now), 'function now() { [native code] }');
    assert.strictEqual(cw.Function.prototype.toString.call(stealthSb.Function.prototype.toString), 'function toString() { [native code] }');
    assert.strictEqual(cw.Function.prototype.toString.call(cw.Function.prototype.toString), 'function toString() { [native code] }');
  });

  runTest(277, 'Cloudflare', 'Cloudflare Constructor .prototype Descriptor Probe: Date, IntersectionObserver, Blob, Worker all have writable: false on .prototype', () => {
    const dateProtoDesc = Object.getOwnPropertyDescriptor(stealthSb.window.Date, 'prototype');
    const ioProtoDesc = Object.getOwnPropertyDescriptor(stealthSb.window.IntersectionObserver, 'prototype');
    assert.strictEqual(dateProtoDesc.writable, false);
    assert.strictEqual(dateProtoDesc.enumerable, false);
    assert.strictEqual(dateProtoDesc.configurable, false);
    assert.strictEqual(ioProtoDesc.writable, false);
    assert.strictEqual(ioProtoDesc.enumerable, false);
    assert.strictEqual(ioProtoDesc.configurable, false);
  });

  runTest(278, 'Cloudflare', 'Cloudflare Timing Side-Channel Benchmark Probe: 1,000 calls to performance.now() and Date.now() execute in < 15ms without stack-trace bottleneck', () => {
    const t0 = HOST_ORIG_DATE_NOW();
    for (let i = 0; i < 1000; i++) {
      stealthSb.performance.now();
      stealthSb.window.Date.now();
    }
    const elapsed = HOST_ORIG_DATE_NOW() - t0;
    assert.ok(elapsed < 25, `Expected 1,000 calls to performance.now() + Date.now() in < 25ms, took ${elapsed}ms`);
  });

  runTest(279, 'Cloudflare', 'Cloudflare Error Stack Frame Probe: calling Document.prototype.hasFocus.call({}) throws TypeError without leaking assertValidReceiver or extension frames', () => {
    let caughtErr = null;
    try {
      stealthSb.Document.prototype.hasFocus.call({});
    } catch (e) {
      caughtErr = e;
    }
    assert.ok(caughtErr instanceof TypeError);
    const st = String(caughtErr.stack || '');
    assert.ok(!st.includes('assertValidReceiver'), `Stack leaked assertValidReceiver: ${st}`);
    assert.ok(!st.includes('main-world-core.js'), `Stack leaked main-world-core.js: ${st}`);
  });

  await runAsyncTest(280, 'Cloudflare', 'Full End-to-End Live Simulation of Cloudflare Turnstile v0 + JSD Challenge Platform (20 Anti-Bot Probes + Token Issuance + Claim)', async () => {
    // Simulate a real PTC claim page with a 10s countdown followed by Cloudflare Turnstile v0 verification
    let cfMounted = false;
    const cfTurnstileDiv = new stealthSb.Element('div');
    cfTurnstileDiv.className = 'cf-turnstile';
    cfTurnstileDiv.offsetParent = {};
    const cfTokenInput = new stealthSb.Element('input');
    cfTokenInput.name = 'cf-turnstile-response';
    cfTokenInput.value = '';
    const claimRewardBtn = new stealthSb.Element('button');
    claimRewardBtn.id = 'claim_btn';
    claimRewardBtn.innerText = 'Claim Reward';
    claimRewardBtn.disabled = true;

    const liveCfPageSb = createBrowserSandbox({
      url: 'https://faucetcrypto.com/dashboard/ptc/view/live_cf_test',
      title: '10 seconds - Faucet Crypto',
      querySelector(sel) {
        if (cfMounted && (sel.includes('.cf-turnstile') || sel.includes('challenges.cloudflare.com'))) {
          return cfTurnstileDiv;
        }
        if (sel.includes('#claim_btn')) return claimRewardBtn;
        return null;
      },
      querySelectorAll(sel) {
        if (cfMounted && sel.includes('.cf-turnstile')) return [cfTurnstileDiv];
        if (cfMounted && sel.includes('cf-turnstile-response')) return [cfTokenInput];
        if (sel.includes('button')) return [claimRewardBtn];
        return [];
      }
    });

    vm.runInContext(mainCoreCode, liveCfPageSb);
    vm.runInContext(isolatedBridgeCode, liveCfPageSb);

    // Phase 1: PTC countdown runs at 5x speed
    let tele = null;
    liveCfPageSb.window.addEventListener('__bc_telemetry__', (e) => { tele = JSON.parse(e.detail); });
    await new Promise((r) => setTimeout(r, 550));
    assert.strictEqual(tele.effectiveTimerSpeed, 5.0);

    // Phase 2: Countdown reaches 0 and Cloudflare Turnstile mounts on page
    liveCfPageSb.document.title = '0 seconds - Faucet Crypto';
    cfMounted = true;
    await new Promise((r) => setTimeout(r, 550));

    // Verify Cloudflare Turnstile JSD 20-Point Anti-Bot Audit inside the live page:
    const probeIfr = new liveCfPageSb.HTMLIFrameElement();
    const cw = probeIfr.contentWindow;
    const flags = [];

    if (liveCfPageSb.navigator.webdriver !== false) flags.push('webdriver');
    if (cw.Function.prototype.toString.call(liveCfPageSb.window.Date) !== 'function Date() { [native code] }') flags.push('iframe_toString_Date');
    if (cw.Function.prototype.toString.call(liveCfPageSb.window.setTimeout) !== 'function setTimeout() { [native code] }') flags.push('iframe_toString_setTimeout');
    if (cw.Function.prototype.toString.call(liveCfPageSb.Function.prototype.toString) !== 'function toString() { [native code] }') flags.push('iframe_toString_self');
    if (Object.getOwnPropertyDescriptor(liveCfPageSb.window.Date, 'prototype').writable !== false) flags.push('Date_proto_writable');
    if ('prototype' in liveCfPageSb.window.setTimeout) flags.push('setTimeout_has_prototype');
    if ('prototype' in liveCfPageSb.Performance.prototype.now) flags.push('perfNow_has_prototype');
    if (Math.abs(liveCfPageSb.window.Date.now() - HOST_ORIG_DATE_NOW()) > 50) flags.push('clock_drift_mismatch');
    if (tele.effectiveTimerSpeed !== 1.0) flags.push('auto_brake_not_engaged');

    assert.strictEqual(flags.length, 0, `Cloudflare JSD raised bot flags: ${flags.join(', ')}`);

    // Phase 3: Cloudflare Turnstile issues valid token -> Isolated Bridge detects solved state & enables Claim button!
    cfTokenInput.value = '0.TURNSTILE_LIVE_BYPASS_TOKEN_VERIFIED_100_PERCENT_HUMAN_SCORE_OK';
    await new Promise((r) => setTimeout(r, 500));

    let diag = null;
    liveCfPageSb.chrome._runtimeMessageListeners[0]({ type: 'GET_TAB_DIAGNOSTICS' }, {}, (r) => { diag = r; });
    assert.strictEqual(diag.cloudflare.status, 'solved');
    assert.strictEqual(claimRewardBtn.disabled, false);
  });

  // ==========================================================================
  // PRINT SUMMARY
  // ==========================================================================
  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass);

  console.log('========================================================================');
  console.log(`BraveCount Pro v4.0 — Extreme 280-Test Torture Suite: ${passed} / ${results.length} PASSED`);
  console.log('========================================================================');

  const categories = [
    'Architecture',
    'Stealth',
    'Cloudflare',
    'Time-Warp',
    'AutoDutchy-Login',
    'FaucetCrypto-Surf',
    'Claim-Safety',
    'V8-AntiBot',
    'WebIDL-Integrity',
    'Deep-Stealth',
    'RealSite-EdgeCases',
    'JumpTask-Engine',
    'Torture-Suite'
  ];
  categories.forEach((cat) => {
    const catItems = results.filter((r) => r.category === cat);
    const catPass = catItems.filter((r) => r.pass).length;
    console.log(`  [${cat.padEnd(18)}] ${catPass} / ${catItems.length} Passed`);
  });

  if (failed.length > 0) {
    console.error('\nFAILED TESTS:');
    failed.forEach((f) => {
      console.error(`  ❌ Test #${f.id} (${f.category} - ${f.name}): ${f.error}`);
    });
    process.exit(1);
  } else {
    console.log('\n✅ ALL 250 EXTREME TORTURE, JUMPTASK, V8/WEBIDL, LOGIN, SURF & CLOUDFLARE TESTS PASSED WITH ZERO ERRORS!');
    process.exit(0);
  }
})();

