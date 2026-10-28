/* Info panel helpers: Hebrew date, holidays (Hebcal), weather (Open-Meteo). No API keys needed. */
(function () {
  'use strict';
  var DAYS = ['יום ראשון', 'יום שני', 'יום שלישי', 'יום רביעי', 'יום חמישי', 'יום שישי', 'שבת'];
  var MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function ymd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function stripNikud(s) { return String(s || '').replace(/[֑-ׇ]/g, ''); }

  // Gematria for the offline fallback (e.g. 16 -> ט״ז, 787 -> תשפ״ז)
  function gematria(n) {
    var L = [[400, 'ת'], [300, 'ש'], [200, 'ר'], [100, 'ק'], [90, 'צ'], [80, 'פ'], [70, 'ע'], [60, 'ס'], [50, 'נ'], [40, 'מ'], [30, 'ל'], [20, 'כ'], [10, 'י'], [9, 'ט'], [8, 'ח'], [7, 'ז'], [6, 'ו'], [5, 'ה'], [4, 'ד'], [3, 'ג'], [2, 'ב'], [1, 'א']];
    var s = ''; n = n % 1000;
    for (var i = 0; i < L.length; i++) while (n >= L[i][0]) {
      if (n === 15) { s += 'טו'; n = 0; break; } if (n === 16) { s += 'טז'; n = 0; break; }
      s += L[i][1]; n -= L[i][0];
    }
    return s.length > 1 ? s.slice(0, -1) + '״' + s.slice(-1) : s + '׳';
  }
  function hebrewDateFallback(d) {
    try {
      var parts = new Intl.DateTimeFormat('he-IL-u-ca-hebrew', { day: 'numeric', month: 'long', year: 'numeric' }).formatToParts(d);
      var day = 0, month = '', year = 0;
      parts.forEach(function (p) {
        if (p.type === 'day') day = parseInt(p.value, 10);
        if (p.type === 'month') month = p.value;
        if (p.type === 'year' || p.type === 'relatedYear') year = parseInt(p.value, 10);
      });
      if (!day) return '';
      return gematria(day) + ' ב' + month.replace(/^ב/, '') + ' ' + (year ? gematria(year) : '');
    } catch (e) { return ''; }
  }

  function getJSON(url) {
    return fetch(url).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); });
  }

  var Info = {
    timeText: function (d) { return pad(d.getHours()) + ':' + pad(d.getMinutes()); },
    gregText: function (d) { return DAYS[d.getDay()] + ', ' + d.getDate() + ' ב' + MONTHS[d.getMonth()] + ' ' + d.getFullYear(); },
    hebrewFallback: hebrewDateFallback,

    // Resolves {hebrew, today:[titles], upcoming:{title, days}, parasha}
    fetchJewish: function (d) {
      var date = ymd(d);
      var conv = getJSON('https://www.hebcal.com/converter?cfg=json&g2h=1&strict=1&date=' + date)
        .then(function (j) { return stripNikud(j.hebrew); })
        .catch(function () { return hebrewDateFallback(d); });
      var end = new Date(d.getTime() + 21 * 864e5);
      var cal = getJSON('https://www.hebcal.com/hebcal?v=1&cfg=json&lg=he&i=on&maj=on&min=on&mod=on&nx=on&ss=on&mf=on&s=on&start=' + date + '&end=' + ymd(end))
        .then(function (j) { return j.items || []; })
        .catch(function () { return []; });
      return Promise.all([conv, cal]).then(function (r) {
        var items = r[1], today = [], upcoming = null, parasha = '';
        items.forEach(function (it) {
          var t = stripNikud(it.hebrew || it.title);
          var itDate = (it.date || '').slice(0, 10);
          var days = Math.round((new Date(itDate + 'T00:00:00') - new Date(date + 'T00:00:00')) / 864e5);
          if (it.category === 'parashat') { if (!parasha && days >= 0 && days < 7) parasha = t; return; }
          if (it.category !== 'holiday' && it.category !== 'roshchodesh') return;
          if (days === 0) { if (today.indexOf(t) === -1) today.push(t); }
          else if (days > 0 && !upcoming && it.category === 'holiday') upcoming = { title: t, days: days };
        });
        return { hebrew: r[0], today: today, upcoming: upcoming, parasha: parasha };
      });
    },

    fetchWeather: function (lat, lon) {
      return getJSON('https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon +
        '&current=temperature_2m,weather_code,is_day&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1')
        .then(function (j) {
          var c = j.current || {}, dly = j.daily || {};
          return {
            temp: Math.round(c.temperature_2m), code: c.weather_code, isDay: c.is_day !== 0,
            max: dly.temperature_2m_max ? Math.round(dly.temperature_2m_max[0]) : null,
            min: dly.temperature_2m_min ? Math.round(dly.temperature_2m_min[0]) : null
          };
        });
    },

    searchCity: function (q) {
      return getJSON('https://geocoding-api.open-meteo.com/v1/search?count=6&language=he&name=' + encodeURIComponent(q))
        .then(function (j) {
          return (j.results || []).map(function (r) {
            return { name: r.name, lat: r.latitude, lon: r.longitude, region: [r.admin1, r.country].filter(Boolean).join(', ') };
          });
        });
    },

    // WMO weather code → [Hebrew text, icon key]
    weatherDesc: function (code) {
      if (code === 0) return ['בהיר', 'sun'];
      if (code <= 2) return ['מעונן חלקית', 'partly'];
      if (code === 3) return ['מעונן', 'cloud'];
      if (code === 45 || code === 48) return ['ערפל', 'fog'];
      if (code >= 51 && code <= 67) return ['גשום', 'rain'];
      if (code >= 71 && code <= 77) return ['שלג', 'snow'];
      if (code >= 80 && code <= 82) return ['ממטרים', 'rain'];
      if (code >= 95) return ['סופת רעמים', 'storm'];
      return ['', 'cloud'];
    },

    icon: function (key, isDay) {
      var sun = isDay === false
        ? '<path d="M30 14a14 14 0 1 0 12 20A12 12 0 0 1 30 14z" fill="currentColor"/>'
        : '<circle cx="24" cy="24" r="8" fill="currentColor"/><g stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M24 6v5M24 37v5M6 24h5M37 24h5M11 11l3.5 3.5M33.5 33.5L37 37M11 37l3.5-3.5M33.5 14.5L37 11"/></g>';
      var cloud = '<path d="M15 38h20a9 9 0 0 0 0-18 12 12 0 0 0-23 3A7.5 7.5 0 0 0 15 38z" fill="currentColor"/>';
      var drops = '<g stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M17 42l-2 4M25 42l-2 4M33 42l-2 4"/></g>';
      var map = {
        sun: sun,
        partly: '<g transform="translate(-6 -6) scale(.8)" opacity=".9">' + sun + '</g>' + '<g transform="translate(4 4) scale(.85)">' + cloud + '</g>',
        cloud: cloud,
        fog: '<g stroke="currentColor" stroke-width="3.5" stroke-linecap="round"><path d="M8 18h32M12 26h28M8 34h30"/></g>',
        rain: '<g transform="translate(0 -6)">' + cloud + drops + '</g>',
        snow: '<g transform="translate(0 -6)">' + cloud + '</g><g fill="currentColor"><circle cx="16" cy="42" r="2.2"/><circle cx="24" cy="44" r="2.2"/><circle cx="32" cy="42" r="2.2"/></g>',
        storm: '<g transform="translate(0 -6)">' + cloud + '</g><path d="M25 34l-6 9h6l-3 7 9-11h-6l3-5z" fill="currentColor"/>'
      };
      return '<svg viewBox="0 0 48 48" aria-hidden="true">' + (map[key] || cloud) + '</svg>';
    }
  };
  window.LobbyInfo = Info;
})();
