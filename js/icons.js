/* Item icons (inline SVG, 24×24, stroke style) — safe on TV browsers that lack emoji fonts. */
(function () {
  var P = {
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    music: '<path d="M9 18V6l11-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
    heart: '<path d="M12 20s-7.5-4.5-7.5-10A4.3 4.3 0 0 1 12 7.5 4.3 4.3 0 0 1 19.5 10c0 5.5-7.5 10-7.5 10z"/>',
    star: '<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8L3.5 9.7l5.9-.8z"/>',
    food: '<path d="M6 3v7a2 2 0 0 0 4 0V3M8 10v11M17 21V3c-2 1-3 4-3 7h3"/>',
    medical: '<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="M12 8v8M8 12h8"/>',
    bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
    phone: '<path d="M5 4h4l1.5 4.5L8 10a11 11 0 0 0 6 6l1.5-2.5L20 15v4a1.5 1.5 0 0 1-1.5 1.5C10 20.5 3.5 14 3.5 5.5A1.5 1.5 0 0 1 5 4z"/>',
    flower: '<circle cx="12" cy="9" r="2.5"/><path d="M12 6.5c0-3 3.5-3 3.5 0S12 9 12 9s-3.5-2.5-3.5-2.5 0-3 3.5 0M9.5 9c-3 0-3 3.5 0 3.5M14.5 9c3 0 3 3.5 0 3.5M12 11.5V21M12 17c-2-2-5-2-5-2M12 18.5c2-2 5-2 5-2"/>',
    candle: '<rect x="8.5" y="10" width="7" height="11" rx="1"/><path d="M12 10V8M12 2.5c1.6 2 1.6 3.5 0 4.5-1.6-1-1.6-2.5 0-4.5z"/>',
    walk: '<circle cx="13" cy="4.5" r="1.8"/><path d="M10 21l2.5-6 2.5 2.5V21M8 12l2.5-5 3 1.5 2 3.5 2.5 1M12.5 15l-1-4"/>',
    book: '<path d="M4 5.5A2 2 0 0 1 6 3.5h13v15H6a2 2 0 0 0-2 2zM4 20.5V5.5M8 7.5h7"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
    gift: '<rect x="3.5" y="9" width="17" height="4" rx="1"/><path d="M5 13v7.5h14V13M12 9v11.5M12 9C10 5 6.5 5.5 7.5 8 8 9 12 9 12 9zM12 9c2-4 5.5-3.5 4.5-1-.5 1-4.5 1-4.5 1z"/>'
  };
  var NAMES = {
    info: 'מידע', calendar: 'לוח', clock: 'שעה', music: 'מוזיקה', heart: 'לב', star: 'כוכב', food: 'אוכל', medical: 'רפואה',
    bell: 'הודעה', phone: 'טלפון', flower: 'פרח', candle: 'נר', walk: 'פעילות', book: 'הרצאה', sun: 'שמש', gift: 'מתנה'
  };
  window.LobbyIcons = {
    keys: Object.keys(P), names: NAMES,
    svg: function (k) {
      if (!P[k]) return '';
      return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + P[k] + '</svg>';
    }
  };
})();
