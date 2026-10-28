/*
 * Lobby Screen — data layer shared by the TV display (index.html) and the phone app (control.html).
 * Backend: Firebase Realtime Database (+ Email/Password auth for the phone app).
 * Fallback: DEMO mode (localStorage, syncs between tabs of the same browser) when firebase-config.js is not filled.
 *
 * Database layout:
 *   /screen/settings              everything the screen shows (small JSON)
 *   /screen/mediaIndex/{id}       {type:'bg'|'logo', created, thumb}   (small)
 *   /screen/media/{id}            {data: dataURL}                      (the full image, loaded on demand)
 */
(function () {
  'use strict';

  // tone: 'light' backgrounds get dark text, 'dark' backgrounds get light text (chosen automatically on the TV)
  var BUILTIN_BG = [
    { id: 'builtin-wc-pink', name: 'ורוד', src: 'BACKGROUNDS/wc-pink.jpg', thumb: 'BACKGROUNDS/wc-pink_thumb.jpg', tone: 'light' },
    { id: 'builtin-wc-green', name: 'ירוק', src: 'BACKGROUNDS/wc-green.jpg', thumb: 'BACKGROUNDS/wc-green_thumb.jpg', tone: 'light' },
    { id: 'builtin-wc-pastel', name: 'פסטל', src: 'BACKGROUNDS/wc-pastel.jpg', thumb: 'BACKGROUNDS/wc-pastel_thumb.jpg', tone: 'light' },
    { id: 'builtin-wc-dreamy', name: 'חלומי', src: 'BACKGROUNDS/wc-dreamy.jpg', thumb: 'BACKGROUNDS/wc-dreamy_thumb.jpg', tone: 'light' },
    { id: 'builtin-sage', name: 'מרווה', src: 'BACKGROUNDS/sage.jpg', thumb: 'BACKGROUNDS/sage_thumb.jpg', tone: 'dark' },
    { id: 'builtin-dawn', name: 'זריחה', src: 'BACKGROUNDS/dawn.jpg', thumb: 'BACKGROUNDS/dawn_thumb.jpg', tone: 'dark' },
    { id: 'builtin-sea', name: 'ים', src: 'BACKGROUNDS/sea.jpg', thumb: 'BACKGROUNDS/sea_thumb.jpg', tone: 'dark' },
    { id: 'builtin-dusk', name: 'דמדומים', src: 'BACKGROUNDS/dusk.jpg', thumb: 'BACKGROUNDS/dusk_thumb.jpg', tone: 'dark' },
    { id: 'builtin-warm', name: 'חום', src: 'BACKGROUNDS/warm.jpg', thumb: 'BACKGROUNDS/warm_thumb.jpg', tone: 'dark' }
  ];
  var BUILTIN_LOGO = { id: 'builtin-logo', src: 'LOGO/logo.png' };

  var DEFAULTS = {
    mainTitle: { show: true, text: 'ברוכים הבאים' },
    corner: { show: true, text: 'שיהיה יום נפלא' },
    logo: { show: true, id: 'builtin-logo' },
    info: {
      show: true, time: true, greg: true, hebrew: true, weather: true, holidays: true,
      city: { name: 'תל אביב', lat: 32.0853, lon: 34.7818 }
    },
    items: {
      show: true,
      pageSeconds: 15,
      list: {
        a1: { order: 1, show: true, icon: 'calendar', title: 'לוח פעילויות', body: 'התעמלות בוקר בכל יום בשעה 09:30 באולם הראשי.' },
        a2: { order: 2, show: true, icon: 'music', title: 'ערב שירה', body: 'ביום חמישי בשעה 18:00 – ערב שירה בציבור עם ארוחה קלה.' }
      }
    },
    bg: {
      mode: 'rotate',             // 'single' | 'rotate'
      selected: 'builtin-wc-pink',
      rotation: { 'builtin-wc-pink': true, 'builtin-wc-green': true, 'builtin-wc-pastel': true, 'builtin-wc-dreamy': true },
      interval: 300,              // seconds
      dim: 20                     // 0-70 (% veil over the background for readability)
    },
    style: { scale: 100 }         // overall text size %
  };

  function isObj(x) { return x && typeof x === 'object' && !Array.isArray(x); }
  function deepMerge(base, over) {
    var out = {}, k;
    for (k in base) out[k] = isObj(base[k]) ? deepMerge(base[k], {}) : base[k];
    if (!isObj(over)) return out;
    for (k in over) {
      if (over[k] === null || over[k] === undefined) continue;
      out[k] = (isObj(over[k]) && isObj(out[k])) ? deepMerge(out[k], over[k]) : over[k];
    }
    return out;
  }
  function uid() { return 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function setPath(obj, path, value) {
    var parts = path.split('/'), o = obj;
    for (var i = 0; i < parts.length - 1; i++) { if (!isObj(o[parts[i]])) o[parts[i]] = {}; o = o[parts[i]]; }
    if (value === null) delete o[parts[parts.length - 1]]; else o[parts[parts.length - 1]] = value;
  }

  var cfg = window.FIREBASE_CONFIG || {};
  var configured = cfg.apiKey && cfg.apiKey.indexOf('PASTE') === -1 && window.firebase;

  // Settings with lists (items.list, bg.rotation) must not be filled from DEFAULTS once the DB has data,
  // otherwise deleted items would come back. So: defaults only for missing *sections*.
  function withDefaults(raw) {
    if (!isObj(raw) || !Object.keys(raw).length) return deepMerge(DEFAULTS, {});
    var d = deepMerge(DEFAULTS, raw);
    if (raw.items && raw.items.hasOwnProperty('list')) d.items.list = raw.items.list || {};
    else if (raw.items) d.items.list = raw.items.list || {};
    if (raw.bg && raw.bg.hasOwnProperty('rotation')) d.bg.rotation = raw.bg.rotation || {};
    return d;
  }

  var Store;

  if (configured) {
    // ---------------- Firebase ----------------
    firebase.initializeApp(cfg);
    var db = firebase.database();
    var root = db.ref('screen');
    Store = {
      mode: 'firebase',
      onSettings: function (cb) {
        root.child('settings').on('value', function (s) { cb(withDefaults(s.val())); });
      },
      set: function (path, value) { return root.child('settings/' + path).set(value); },
      initIfEmpty: function () {
        return root.child('settings').once('value').then(function (s) {
          if (!s.exists()) return root.child('settings').set(DEFAULTS);
        });
      },
      onMediaIndex: function (cb) {
        root.child('mediaIndex').on('value', function (s) { cb(s.val() || {}); });
      },
      getMedia: function (id) {
        return root.child('media/' + id + '/data').once('value').then(function (s) { return s.val(); });
      },
      addMedia: function (type, data, thumb, tone) {
        var id = uid(), up = {};
        up['media/' + id] = { data: data };
        up['mediaIndex/' + id] = { type: type, created: Date.now(), thumb: thumb, tone: tone || 'dark' };
        return root.update(up).then(function () { return id; });
      },
      deleteMedia: function (id) {
        var up = {};
        up['media/' + id] = null; up['mediaIndex/' + id] = null;
        up['settings/bg/rotation/' + id] = null;
        return root.update(up);
      },
      onConnection: function (cb) {
        db.ref('.info/connected').on('value', function (s) { cb(!!s.val()); });
      },
      // auth
      onAuth: function (cb) { firebase.auth().onAuthStateChanged(function (u) { cb(u ? { email: u.email } : null); }); },
      signIn: function (email, pw) { return firebase.auth().signInWithEmailAndPassword(email, pw); },
      signOut: function () { return firebase.auth().signOut(); }
    };
  } else {
    // ---------------- DEMO (localStorage) ----------------
    var K = 'lobbyDemo:';
    var listeners = { settings: [], index: [] };
    function read(key, def) { try { var v = localStorage.getItem(K + key); return v ? JSON.parse(v) : def; } catch (e) { return def; } }
    function write(key, v) {
      try { localStorage.setItem(K + key, JSON.stringify(v)); }
      catch (e) { alert('Demo storage is full (browser limit ~5MB). In the real Firebase setup this limit does not apply.'); throw e; }
    }
    function fire(kind) {
      if (kind === 'settings') { var s = withDefaults(read('settings', null)); listeners.settings.forEach(function (f) { f(s); }); }
      else { var ix = read('index', {}); listeners.index.forEach(function (f) { f(ix); }); }
    }
    window.addEventListener('storage', function (e) {
      if (e.key === K + 'settings') fire('settings');
      if (e.key === K + 'index') fire('index');
    });
    Store = {
      mode: 'demo',
      onSettings: function (cb) { listeners.settings.push(cb); setTimeout(function () { fire('settings'); }, 0); },
      set: function (path, value) {
        var s = read('settings', null) || deepMerge(DEFAULTS, {});
        setPath(s, path, value); write('settings', s); fire('settings'); return Promise.resolve();
      },
      initIfEmpty: function () { if (!read('settings', null)) write('settings', DEFAULTS); return Promise.resolve(); },
      onMediaIndex: function (cb) { listeners.index.push(cb); setTimeout(function () { fire('index'); }, 0); },
      getMedia: function (id) { return Promise.resolve(read('media:' + id, null)); },
      addMedia: function (type, data, thumb, tone) {
        var id = uid(); write('media:' + id, data);
        var ix = read('index', {}); ix[id] = { type: type, created: Date.now(), thumb: thumb, tone: tone || 'dark' };
        write('index', ix); fire('index'); return Promise.resolve(id);
      },
      deleteMedia: function (id) {
        localStorage.removeItem(K + 'media:' + id);
        var ix = read('index', {}); delete ix[id]; write('index', ix);
        var s = read('settings', null); if (s && s.bg && s.bg.rotation) { delete s.bg.rotation[id]; write('settings', s); }
        fire('index'); fire('settings'); return Promise.resolve();
      },
      onConnection: function (cb) { cb(true); },
      onAuth: function (cb) { setTimeout(function () { cb({ email: 'demo' }); }, 0); },
      signIn: function () { return Promise.resolve(); },
      signOut: function () { return Promise.resolve(); }
    };
  }

  Store.BUILTIN_BG = BUILTIN_BG;
  Store.BUILTIN_LOGO = BUILTIN_LOGO;
  Store.DEFAULTS = DEFAULTS;
  Store.uid = uid;
  window.LobbyStore = Store;
})();
