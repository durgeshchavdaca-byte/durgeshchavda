/* durgeshchavda.com booking attribution (20 Nov 2026).
   1. Remembers where the visitor came from (search engine, AI assistant, social, direct) and the first page they landed on.
   2. When a Topmate, WhatsApp or Calendly link is clicked, adds utm_ tags to it so the booking shows its source and page.
   3. Loads Microsoft Clarity when CLARITY_ID is set, and sends Clarity a custom event and tags for every booking click.
   No personal data is collected by this script. */
(function () {
  var CLARITY_ID = 'zg8dmwp3jq'; // set to the Clarity project ID (e.g. 'abcd1234ef') to switch Clarity on

  function store(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
  function load(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function slug(p) { p = (p || '/').replace(/^\/+|\/+$/g, ''); return p ? p.replace(/\//g, '_').slice(0, 90) : 'home'; }

  function sourceOf(ref, qs) {
    var u = qs.get('utm_source');
    if (u) return u.toLowerCase().slice(0, 40);
    if (!ref) return 'direct';
    var h = '';
    try { h = new URL(ref).hostname.replace(/^www\./, ''); } catch (e) { return 'unknown'; }
    if (h === location.hostname.replace(/^www\./, '')) return null; // internal navigation
    var map = [
      [/(^|\.)google\./, 'google'], [/bing\.com$/, 'bing'], [/duckduckgo/, 'duckduckgo'], [/yahoo\./, 'yahoo'], [/yandex/, 'yandex'], [/ecosia/, 'ecosia'],
      [/chatgpt\.com$|openai\.com$/, 'chatgpt'], [/perplexity\.ai$/, 'perplexity'], [/gemini\.google\.com$/, 'gemini'], [/claude\.ai$/, 'claude'], [/copilot\.microsoft\.com$/, 'copilot'], [/grok\.com$|x\.ai$/, 'grok'],
      [/linkedin\.com$|lnkd\.in$/, 'linkedin'], [/facebook\.com$|fb\.com$/, 'facebook'], [/instagram\.com$/, 'instagram'], [/(^|\.)x\.com$|t\.co$|twitter\.com$/, 'x'], [/whatsapp/, 'whatsapp'], [/youtube\.com$/, 'youtube'], [/topmate\.io$/, 'topmate']
    ];
    for (var i = 0; i < map.length; i++) { if (map[i][0].test(h)) return map[i][1]; }
    return h.slice(0, 40);
  }

  var qs = new URLSearchParams(location.search);
  var src = sourceOf(document.referrer, qs);
  if (src && !load('dc_src')) { store('dc_src', src); store('dc_land', slug(location.pathname)); }
  if (!load('dc_src')) { store('dc_src', 'direct'); store('dc_land', slug(location.pathname)); }
  var SRC = load('dc_src') || 'direct', LAND = load('dc_land') || slug(location.pathname), PAGE = slug(location.pathname);

  // Microsoft Clarity
  if (CLARITY_ID) {
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
      y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(window, document, 'clarity', 'script', CLARITY_ID);
    window.clarity('set', 'source', SRC);
    window.clarity('set', 'landing_page', LAND);
  }

  function kind(href) {
    if (/topmate\.io/i.test(href)) return 'topmate';
    if (/wa\.me|api\.whatsapp\.com|whatsapp\.com\/send/i.test(href)) return 'whatsapp';
    if (/calendly\.com/i.test(href)) return 'calendly';
    if (/^mailto:/i.test(href)) return 'email';
    return null;
  }

  function tag(a) {
    var href = a.getAttribute('href') || '', k = kind(href);
    if (!k) return null;
    if (k === 'topmate' || k === 'calendly') {
      try {
        var u = new URL(href, location.href);
        u.searchParams.set('utm_source', SRC);
        u.searchParams.set('utm_medium', 'durgeshchavda.com');
        u.searchParams.set('utm_campaign', LAND);
        u.searchParams.set('utm_content', PAGE);
        a.setAttribute('href', u.toString());
      } catch (e) {}
    }
    return k;
  }

  document.addEventListener('click', function (ev) {
    var a = ev.target && ev.target.closest ? ev.target.closest('a[href]') : null;
    if (!a) return;
    var k = tag(a);
    if (!k) return;
    if (window.clarity) {
      window.clarity('set', 'cta_page', PAGE);
      window.clarity('set', 'cta_type', k);
      window.clarity('event', k + '_click');
      if (k === 'topmate') window.clarity('upgrade', 'booking_click');
    }
  }, true);

  // Copy buttons: <button data-copy="#id"> copies that block's text and adds the source line (20 Nov 2026: Clarity showed readers clicking on template text to copy it)
  document.addEventListener('click', function (ev) {
    var b = ev.target && ev.target.closest ? ev.target.closest('[data-copy]') : null;
    if (!b) return;
    var el = document.querySelector(b.getAttribute('data-copy'));
    if (!el) return;
    var txt = (el.innerText || el.textContent || '').trim() + '\n\nSource: CA Durgesh Chavda, ' + location.origin + location.pathname;
    function done() { var o = b.getAttribute('data-label') || b.textContent; b.setAttribute('data-label', o); b.textContent = 'Copied'; setTimeout(function () { b.textContent = o; }, 2000); }
    if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(txt).then(done, function () {}); }
    else { var ta = document.createElement('textarea'); ta.value = txt; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); done(); } catch (e) {} document.body.removeChild(ta); }
    if (window.clarity) { window.clarity('set', 'cta_page', PAGE); window.clarity('event', 'copy_block'); }
  });

  // Tag links already on the page too, so copied or middle-clicked links carry the source
  function tagAll() { var as = document.querySelectorAll('a[href*="topmate.io"],a[href*="calendly.com"]'); for (var i = 0; i < as.length; i++) tag(as[i]); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tagAll); else tagAll();
})();
