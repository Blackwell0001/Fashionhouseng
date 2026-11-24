/*
 * FASHIONHOUSENG — landing page: price ladder, watch cards, banner watch.
 */
(function () {
  "use strict";

  var FH = window.FH;
  var el = FH.el;

  var FEATURE_ICONS = {
    "glows in the dark": "icon-glow",
    "water resistant": "icon-drop",
    "scratch resistant": "icon-shield",
  };

  /* ---------- Price ladder ---------- */
  function renderLadder(shop) {
    var list = document.getElementById("ladder");
    if (!list) return;
    var single = FH.priceFor(shop, 1);
    list.textContent = "";
    for (var q = 1; q <= shop.maxOrderQuantity; q++) {
      var price = FH.priceFor(shop, q);
      if (price == null) continue;
      var li = el("li", "ladder-step");
      li.appendChild(el("span", "ladder-qty", q + (q === 1 ? " watch" : " watches")));
      li.appendChild(el("strong", "ladder-price", FH.formatNaira(price)));
      var save = single * q - price;
      li.appendChild(el("span", "ladder-save", save > 0 ? "Save " + FH.formatNaira(save) : "Any colour"));
      if (q === shop.maxOrderQuantity) li.classList.add("is-best");
      list.appendChild(li);
    }
  }

  /* ---------- Watch cards ---------- */
  function watchCard(p, shop) {
    var card = el("article", "product-card" + (p.placeholder ? " is-placeholder" : ""));

    var media = el("div", "product-media");
    if (p.image && !p.placeholder) {
      var img = new Image();
      img.src = FH.url(p.image);
      img.alt = p.alt || p.name;
      img.loading = "lazy";
      img.decoding = "async";
      img.width = 600;
      img.height = 600;
      img.onerror = function () {
        media.textContent = "";
        media.classList.add("is-empty");
        media.appendChild(FH.icon("icon-watch"));
      };
      media.appendChild(img);
    } else {
      media.classList.add("is-empty");
      media.appendChild(FH.icon("icon-watch"));
      media.appendChild(el("span", "media-note", "Coming soon"));
    }
    card.appendChild(media);

    var body = el("div", "product-body");
    var meta = el("p", "product-meta");
    if (p.swatch) {
      var dot = el("span", "swatch");
      dot.style.background = p.swatch;
      dot.setAttribute("aria-hidden", "true");
      meta.appendChild(dot);
    }
    meta.appendChild(document.createTextNode(p.category + (p.colour ? " · " + p.colour : "")));
    body.appendChild(meta);
    body.appendChild(el("h3", "product-name", p.name));

    if (p.placeholder) {
      body.appendChild(el("p", "product-desc", "New styles for her are on the way. Ask us on WhatsApp to see what's available."));
      var wa = el("a", "btn btn-outline btn-block", null);
      wa.href = FH.waLink(FH.cfg.womensMessage);
      wa.target = "_blank";
      wa.rel = "noopener";
      wa.appendChild(FH.icon("icon-whatsapp"));
      wa.appendChild(document.createTextNode(" Ask on WhatsApp"));
      body.appendChild(wa);
    } else {
      var price = el("p", "product-price");
      price.appendChild(el("strong", null, FH.formatNaira(FH.priceFor(shop, 1))));
      var best = FH.priceFor(shop, shop.maxOrderQuantity);
      if (best) price.appendChild(el("span", null, "or " + shop.maxOrderQuantity + " for " + FH.formatNaira(best)));
      body.appendChild(price);

      var feats = el("ul", "product-features");
      (shop.features || []).forEach(function (f) {
        var li = el("li");
        li.appendChild(FH.icon(FEATURE_ICONS[f.toLowerCase()] || "icon-check"));
        li.appendChild(document.createTextNode(f));
        feats.appendChild(li);
      });
      body.appendChild(feats);

      var buy = el("a", "btn btn-dark btn-block", "Buy Now");
      buy.href = FH.url("order/?watch=" + encodeURIComponent(p.id));
      buy.setAttribute("aria-label", "Buy the " + p.name);
      body.appendChild(buy);
    }

    card.appendChild(body);
    return card;
  }

  function renderWatches(shop) {
    var grid = document.getElementById("product-grid");
    if (!grid) return;
    grid.textContent = "";
    (shop.products || []).forEach(function (p) { grid.appendChild(watchCard(p, shop)); });
    // Cards load after the page: re-apply a #section link from the address bar.
    var target = location.hash.length > 1 && document.getElementById(location.hash.slice(1));
    if (target) target.scrollIntoView();
  }

  function renderError() {
    var grid = document.getElementById("product-grid");
    if (!grid) return;
    grid.textContent = "";
    var box = el("div", "product-error");
    box.appendChild(el("p", null, "We couldn't load the watches just now. Please refresh the page."));
    var a = el("a", "btn btn-gold", "Buy Now");
    a.href = FH.url("order/");
    box.appendChild(a);
    grid.appendChild(box);
  }

  FH.loadShop()
    .then(function (shop) {
      renderLadder(shop);
      renderWatches(shop);
    })
    .catch(renderError);

  /* ---------- Banner watch: real local time + today's date ---------- */
  var ticks = document.getElementById("dial-ticks");
  if (ticks) {
    var ns = "http://www.w3.org/2000/svg";
    for (var i = 0; i < 60; i++) {
      var major = i % 5 === 0;
      if (i === 15) continue; // date window sits at 3 o'clock
      var line = document.createElementNS(ns, "line");
      line.setAttribute("x1", "180");
      line.setAttribute("x2", "180");
      line.setAttribute("y1", major ? "154" : "152");
      line.setAttribute("y2", major ? "172" : "158");
      line.setAttribute("stroke", major ? "#C6A15B" : "#8C8C8C");
      line.setAttribute("stroke-width", major ? "3.5" : "1");
      line.setAttribute("stroke-linecap", "round");
      line.setAttribute("transform", "rotate(" + i * 6 + " 180 260)");
      ticks.appendChild(line);
    }
    var hands = {
      h: document.querySelector(".hand-hour"),
      m: document.querySelector(".hand-minute"),
      s: document.querySelector(".hand-second"),
    };
    var dateText = document.getElementById("dial-date");
    var tick = function () {
      var d = new Date();
      var s = d.getSeconds(), m = d.getMinutes() + s / 60, h = (d.getHours() % 12) + m / 60;
      hands.h.setAttribute("transform", "rotate(" + h * 30 + " 180 260)");
      hands.m.setAttribute("transform", "rotate(" + m * 6 + " 180 260)");
      hands.s.setAttribute("transform", "rotate(" + s * 6 + " 180 260)");
      if (dateText) dateText.textContent = String(d.getDate());
    };
    tick();
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) setInterval(tick, 1000);
  }

  /* ---------- Mobile Buy Now bar: show once the banner is scrolled past ---------- */
  var bar = document.getElementById("mobile-buy");
  var hero = document.querySelector(".hero");
  if (bar && hero && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      bar.classList.toggle("is-visible", !entries[0].isIntersecting);
    }).observe(hero);
  } else if (bar) {
    bar.classList.add("is-visible");
  }
})();
