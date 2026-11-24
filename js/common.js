/*
 * FASHIONHOUSENG — shared helpers for every page (no need to edit).
 */
(function () {
  "use strict";

  var cfg = window.FHNG_CONFIG || {};

  // Where the site lives: "/" on a domain, or "/repo-name/" on GitHub Pages.
  // Worked out from this script's own address, so every page finds the same files.
  var me = document.currentScript;
  var BASE = me && me.src ? me.src.replace(/js\/common\.js(\?.*)?$/, "") : "/";

  /** Full address of a site file, e.g. url("data/shop.json"). Leaves http(s) links alone. */
  function url(path) {
    path = String(path || "");
    return /^https?:\/\//.test(path) ? path : BASE + path.replace(/^\/+/, "");
  }

  var ICONS = url("images/icons.svg") + "#";

  function waLink(message) {
    return "https://wa.me/" + cfg.whatsappNumber + (message ? "?text=" + encodeURIComponent(message) : "");
  }

  function formatNaira(amount) {
    return "₦" + Number(amount).toLocaleString("en-NG", { maximumFractionDigits: 0 });
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function icon(id) {
    var ns = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(ns, "svg");
    svg.setAttribute("class", "icon");
    svg.setAttribute("aria-hidden", "true");
    var use = document.createElementNS(ns, "use");
    use.setAttribute("href", ICONS + id);
    svg.appendChild(use);
    return svg;
  }

  /**
   * Nigerian mobile numbers: 0803 123 4567, 2348031234567, +234 803-123-4567, 803 123 4567.
   * Returns the number as 0XXXXXXXXXX, or null. Same rule as the server.
   */
  function normalizePhone(raw) {
    var s = String(raw || "").trim();
    if (!/^\+?[\d\s\-().]+$/.test(s)) return null;
    var d = s.replace(/\D+/g, "");
    if (d.length === 13 && d.indexOf("234") === 0) d = "0" + d.slice(3);
    else if (d.length === 14 && d.indexOf("2340") === 0) d = d.slice(3);
    else if (d.length === 10 && d[0] !== "0") d = "0" + d;
    return /^0[789][01]\d{8}$/.test(d) ? d : null;
  }

  function isEmail(s) {
    return /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(String(s || "")) && String(s).length <= 254;
  }

  /** Bundle total for a number of watches, or null if outside 1..max. */
  function priceFor(shop, qty) {
    var p = shop && shop.bundlePrices ? shop.bundlePrices[String(qty)] : undefined;
    return typeof p === "number" ? p : null;
  }

  var shopPromise = null;
  function loadShop() {
    if (!shopPromise) {
      shopPromise = fetch(url(cfg.shopFile), { cache: "no-cache" }).then(function (r) {
        if (!r.ok) throw new Error("shop " + r.status);
        return r.json();
      });
    }
    return shopPromise;
  }

  /** sessionStorage that never throws (private mode, blocked storage). */
  var session = {
    get: function (key) {
      try { return JSON.parse(sessionStorage.getItem(key)); } catch (e) { return null; }
    },
    set: function (key, value) {
      try { sessionStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* ignore */ }
    },
    remove: function (key) {
      try { sessionStorage.removeItem(key); } catch (e) { /* ignore */ }
    },
  };

  /* ---------- Contact links on every page ---------- */
  function setAll(selector, fn) {
    document.querySelectorAll(selector).forEach(fn);
  }
  setAll(".js-wa-general", function (a) { a.href = waLink(cfg.generalMessage); });
  setAll(".js-wa-large", function (a) { a.href = waLink(cfg.largeOrderMessage); });
  setAll(".js-wa-womens", function (a) { a.href = waLink(cfg.womensMessage); });
  setAll(".js-wa-display", function (n) { n.textContent = cfg.whatsappDisplay; });
  setAll(".js-call", function (a) { a.href = "tel:" + cfg.callNumber; });
  setAll(".js-call-display", function (n) { n.textContent = cfg.callNumber; });
  setAll(".js-ig", function (a) { a.href = cfg.instagramUrl; });
  setAll(".js-ig-handle", function (n) { n.textContent = cfg.instagramHandle; });
  setAll(".js-tt", function (a) { a.href = cfg.tiktokUrl; });
  setAll(".js-tt-handle", function (n) { n.textContent = cfg.tiktokHandle; });
  setAll(".js-year", function (n) { n.textContent = new Date().getFullYear(); });

  /* ---------- Mobile menu ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var menu = document.getElementById("nav-menu");
  if (toggle && menu) {
    var setOpen = function (open) {
      toggle.setAttribute("aria-expanded", String(open));
      menu.classList.toggle("is-open", open);
    };
    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.classList.contains("is-open")) {
        setOpen(false);
        toggle.focus();
      }
    });
  }

  window.FH = {
    cfg: cfg,
    url: url,
    waLink: waLink,
    formatNaira: formatNaira,
    el: el,
    icon: icon,
    normalizePhone: normalizePhone,
    isEmail: isEmail,
    priceFor: priceFor,
    loadShop: loadShop,
    session: session,
  };
})();
