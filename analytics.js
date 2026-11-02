/* Amalfi Group — site analytics and lead tracking.
 *
 * Each tool below stays completely inert until its ID is filled in, so this
 * file is safe to deploy before the accounts exist. Nothing loads, no cookies
 * are set, and no requests are made for a tool whose ID is still a placeholder.
 *
 * Where each ID comes from:
 *   GA4_ID      Google Analytics → Admin → Data streams → your web stream
 *   CLARITY_ID  Microsoft Clarity → Settings → Overview → project ID
 *   CF_TOKEN    Cloudflare → Web Analytics → the token in the beacon snippet
 */
(function () {
  'use strict';

  var GA4_ID     = 'G-XXXXXXXXXX';
  var CLARITY_ID = 'TODO_CLARITY_ID';
  var CF_TOKEN   = 'TODO_CLOUDFLARE_TOKEN';

  function live(id, marker) { return !!id && id.indexOf(marker) === -1; }

  /* A visitor who has opted out on /privacy. Checked before anything loads,
     so opting out prevents the scripts being fetched at all. */
  var OPT_OUT_KEY = 'amalfi-no-track';
  var optedOut = false;
  try { optedOut = window.localStorage.getItem(OPT_OUT_KEY) === '1'; } catch (e) {}

  window.amalfiPrivacy = {
    isOptedOut: function () { return optedOut; },
    optOut: function () {
      try { window.localStorage.setItem(OPT_OUT_KEY, '1'); } catch (e) {}
      optedOut = true;
    },
    optIn: function () {
      try { window.localStorage.removeItem(OPT_OUT_KEY); } catch (e) {}
      optedOut = false;
    }
  };

  var useGA      = !optedOut && live(GA4_ID, 'XXXXXXXXXX');
  var useClarity = !optedOut && live(CLARITY_ID, 'TODO');
  var useCF      = !optedOut && live(CF_TOKEN, 'TODO');

  /* ── Google Analytics 4 ─────────────────────────────────────────────── */
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }

  if (useGA) {
    var g = document.createElement('script');
    g.async = true;
    g.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA4_ID;
    document.head.appendChild(g);
    gtag('js', new Date());
    gtag('config', GA4_ID);
  }

  /* ── Microsoft Clarity — heatmaps and session replay ────────────────── */
  if (useClarity) {
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r); t.async = 1;
      t.src = 'https://www.clarity.ms/tag/' + i;
      y = l.getElementsByTagName(r)[0];
      y.parentNode.insertBefore(t, y);
    })(window, document, 'clarity', 'script', CLARITY_ID);
  }

  /* ── Cloudflare Web Analytics — no cookies, no consent banner ───────── */
  if (useCF) {
    var cf = document.createElement('script');
    cf.defer = true;
    cf.src = 'https://static.cloudflareinsights.com/beacon.min.js';
    cf.setAttribute('data-cf-beacon', '{"token":"' + CF_TOKEN + '"}');
    document.head.appendChild(cf);
  }

  /* ── One place to record anything worth recording ───────────────────── */
  function track(name, params) {
    if (optedOut) { return; }
    try { if (useGA) { gtag('event', name, params || {}); } } catch (e) {}
    try { if (useClarity && window.clarity) { window.clarity('event', name); } } catch (e) {}
  }
  window.amalfiTrack = track;

  /* ── Clicks worth counting ──────────────────────────────────────────── */
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a') : null;
    if (!a || !a.getAttribute) { return; }
    var href = a.getAttribute('href') || '';

    if (href.indexOf('mailto:') === 0) {
      track('email_click', { link_url: href.slice(7) });
    } else if (href.indexOf('tel:') === 0) {
      track('call_click', { link_url: href.slice(4) });
    } else if (a.hostname && a.hostname !== window.location.hostname) {
      track('outbound_click', { link_domain: a.hostname });
    }
  }, true);

})();
