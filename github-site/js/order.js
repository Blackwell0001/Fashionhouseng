/*
 * FASHIONHOUSENG — 3-step order form: choose watches → your details → confirm.
 * The total shown here is only a preview. The server works out the real total.
 */
(function () {
  "use strict";

  var FH = window.FH;
  var el = FH.el;
  var DRAFT_KEY = "fhng_order_draft";
  var LAST_KEY = "fhng_last_order";
  var FIELDS = ["name", "email", "phone", "whatsapp", "address", "state"];

  var form = document.getElementById("order-form");
  var panels = document.querySelectorAll(".step-panel");
  var stepperItems = document.querySelectorAll(".stepper li");
  var btnNext = document.getElementById("btn-next");
  var btnBack = document.getElementById("btn-back");
  var orderError = document.getElementById("order-error");
  var sameBox = document.getElementById("f-same");
  var waField = document.getElementById("whatsapp-field");
  var limitNote = document.getElementById("limit-note");

  var shop = null;
  var byId = {};
  var step = 1;
  var sending = false;
  var draft = FH.session.get(DRAFT_KEY) || {};
  var qty = draft.qty && typeof draft.qty === "object" ? draft.qty : {};

  /* ---------- Quantities & price ---------- */

  function orderable() {
    return (shop.products || []).filter(function (p) { return !p.placeholder; });
  }

  function totalQty() {
    return orderable().reduce(function (sum, p) { return sum + (qty[p.id] || 0); }, 0);
  }

  function lines() {
    return orderable()
      .filter(function (p) { return qty[p.id] > 0; })
      .map(function (p) { return { product: p, qty: qty[p.id] }; });
  }

  function saveDraft() {
    var fields = {};
    FIELDS.forEach(function (f) { fields[f] = form.elements[f].value; });
    fields.same = sameBox.checked;
    FH.session.set(DRAFT_KEY, { qty: qty, fields: fields });
  }

  function changeQty(id, delta) {
    var next = Math.max(0, (qty[id] || 0) + delta);
    if (delta > 0 && totalQty() >= shop.maxOrderQuantity) return;
    if (next === 0) delete qty[id];
    else qty[id] = next;
    hideOrderError();
    saveDraft();
    renderPicks();
    renderSummary();
  }

  /* ---------- Step 1: pick list ---------- */

  function buildPickList() {
    var list = document.getElementById("pick-list");
    list.textContent = "";
    orderable().forEach(function (p) {
      var li = el("li", "pick");
      li.dataset.id = p.id;

      var thumb = el("div", "pick-thumb");
      if (p.image) {
        var img = new Image();
        img.src = FH.url(p.image);
        img.alt = "";
        img.width = 96;
        img.height = 96;
        img.decoding = "async";
        thumb.appendChild(img);
      }
      li.appendChild(thumb);

      var info = el("div", "pick-info");
      var name = el("p", "pick-name");
      if (p.swatch) {
        var dot = el("span", "swatch");
        dot.style.background = p.swatch;
        dot.setAttribute("aria-hidden", "true");
        name.appendChild(dot);
      }
      name.appendChild(document.createTextNode(p.colour || p.name));
      info.appendChild(name);
      info.appendChild(el("p", "pick-sub", p.name));
      li.appendChild(info);

      var stepper = el("div", "qty");
      stepper.setAttribute("role", "group");
      stepper.setAttribute("aria-label", p.name + " quantity");
      var minus = el("button", "qty-btn", "−");
      minus.type = "button";
      minus.setAttribute("aria-label", "Remove one " + p.name);
      minus.addEventListener("click", function () { changeQty(p.id, -1); });
      var value = el("output", "qty-value", "0");
      value.setAttribute("aria-live", "polite");
      var plus = el("button", "qty-btn", "+");
      plus.type = "button";
      plus.setAttribute("aria-label", "Add one " + p.name);
      plus.addEventListener("click", function () { changeQty(p.id, 1); });
      stepper.appendChild(minus);
      stepper.appendChild(value);
      stepper.appendChild(plus);
      li.appendChild(stepper);

      list.appendChild(li);
    });
  }

  function renderPicks() {
    var full = totalQty() >= shop.maxOrderQuantity;
    document.querySelectorAll(".pick").forEach(function (li) {
      var n = qty[li.dataset.id] || 0;
      li.classList.toggle("is-picked", n > 0);
      li.querySelector(".qty-value").textContent = String(n);
      var btns = li.querySelectorAll(".qty-btn");
      btns[0].disabled = n === 0;
      btns[1].disabled = full;
    });
    limitNote.hidden = !full;
  }

  /* ---------- Summary, ladder, running total ---------- */

  function renderSummary() {
    var n = totalQty();
    var total = FH.priceFor(shop, n) || 0;
    var single = FH.priceFor(shop, 1) || 0;

    var items = document.getElementById("summary-items");
    items.textContent = "";
    var ls = lines();
    if (!ls.length) items.appendChild(el("li", "summary-empty", "No watches chosen yet."));
    ls.forEach(function (l) {
      var li = el("li");
      li.appendChild(el("span", null, l.product.name));
      li.appendChild(el("span", "summary-qty", "× " + l.qty));
      items.appendChild(li);
    });

    var ladder = document.getElementById("ladder");
    ladder.textContent = "";
    for (var q = 1; q <= shop.maxOrderQuantity; q++) {
      var p = FH.priceFor(shop, q);
      if (p == null) continue;
      var tile = el("li", "ladder-step" + (q === n ? " is-current" : ""));
      tile.appendChild(el("span", "ladder-qty", String(q)));
      tile.appendChild(el("strong", "ladder-price", FH.formatNaira(p)));
      if (q === n) tile.setAttribute("aria-current", "true");
      ladder.appendChild(tile);
    }

    var save = single * n - total;
    var nextPrice = n > 0 && n < shop.maxOrderQuantity ? FH.priceFor(shop, n + 1) : null;
    var notes = [];
    if (n > 1 && save > 0) notes.push("You save " + FH.formatNaira(save) + ".");
    if (nextPrice != null) notes.push("Add one more watch for just " + FH.formatNaira(nextPrice - total) + ".");
    var saveNote = document.getElementById("summary-save");
    saveNote.hidden = !notes.length;
    saveNote.textContent = notes.join(" ");

    document.getElementById("summary-total").textContent = FH.formatNaira(total);
    document.getElementById("step-total").textContent = FH.formatNaira(total);
    document.getElementById("step-total-label").textContent =
      n === 0 ? "No watches yet" : n + (n === 1 ? " watch" : " watches") + " · total";
  }

  /* ---------- Step 2: details & checks ---------- */

  function fillStates() {
    var select = form.elements.state;
    (shop.states || []).forEach(function (s) {
      var o = el("option", null, s);
      o.value = s;
      select.appendChild(o);
    });
  }

  function syncSame() {
    waField.hidden = sameBox.checked;
    if (sameBox.checked) setFieldError("whatsapp", "");
  }

  function readDetails() {
    var f = form.elements;
    return {
      name: f.name.value.trim().replace(/\s+/g, " "),
      email: f.email.value.trim(),
      phone: f.phone.value.trim(),
      same_number: sameBox.checked,
      whatsapp: sameBox.checked ? f.phone.value.trim() : f.whatsapp.value.trim(),
      address: f.address.value.trim(),
      state: f.state.value,
      website: f.website.value,
    };
  }

  function checkDetails(d) {
    var errors = {};
    if (d.name.length < 2) errors.name = "Please enter your full name.";
    if (!FH.isEmail(d.email)) errors.email = "Please enter a valid email address, e.g. name@gmail.com.";
    if (!FH.normalizePhone(d.phone)) errors.phone = "Enter a Nigerian phone number, e.g. 0803 123 4567.";
    if (!d.same_number && !FH.normalizePhone(d.whatsapp)) {
      errors.whatsapp = "Enter your WhatsApp number, e.g. 0803 123 4567.";
    }
    if (d.address.length < 5) errors.address = "Please enter your full delivery address.";
    if ((shop.states || []).indexOf(d.state) === -1) errors.state = "Please choose your state.";
    return errors;
  }

  function setFieldError(name, message) {
    var input = form.elements[name];
    var slot = document.getElementById("e-" + name);
    if (slot) slot.textContent = message || "";
    if (!input) return;
    if (message) {
      input.setAttribute("aria-invalid", "true");
      input.setAttribute("aria-describedby", "e-" + name);
    } else {
      input.removeAttribute("aria-invalid");
      input.removeAttribute("aria-describedby");
    }
  }

  /** Mark every failed field and move the cursor to the first one. */
  function showFieldErrors(errors) {
    var first = null;
    FIELDS.forEach(function (name) {
      setFieldError(name, errors[name] || "");
      if (errors[name] && !first) first = form.elements[name];
    });
    if (first) {
      first.focus();
      first.scrollIntoView({ block: "center", behavior: "smooth" });
    }
    return !!first;
  }

  /* ---------- Step 3: review ---------- */

  function renderReview() {
    var d = readDetails();
    var items = document.getElementById("review-items");
    items.textContent = "";
    lines().forEach(function (l) {
      var li = el("li");
      li.appendChild(el("span", null, l.product.name));
      li.appendChild(el("span", "summary-qty", "× " + l.qty));
      items.appendChild(li);
    });

    var dl = document.getElementById("review-details");
    dl.textContent = "";
    var rows = [
      ["Name", d.name],
      ["Email", d.email],
      ["Calling number", FH.normalizePhone(d.phone)],
      ["WhatsApp", d.same_number ? "Same as calling number" : FH.normalizePhone(d.whatsapp)],
      ["Address", d.address],
      ["State", d.state],
    ];
    rows.forEach(function (r) {
      dl.appendChild(el("dt", null, r[0]));
      dl.appendChild(el("dd", null, r[1]));
    });
    document.getElementById("review-total").textContent = FH.formatNaira(FH.priceFor(shop, totalQty()) || 0);
  }

  /* ---------- Errors ---------- */

  function hideOrderError() {
    orderError.hidden = true;
    orderError.textContent = "";
    var step1Error = document.getElementById("step1-error");
    if (step1Error) step1Error.remove();
  }

  function step1Error(message) {
    hideOrderError();
    var p = el("p", "form-error", message);
    p.id = "step1-error";
    p.setAttribute("role", "alert");
    document.getElementById("pick-list").after(p);
    var firstPlus = document.querySelector(".pick .qty-btn:last-child:not(:disabled)");
    if (firstPlus) firstPlus.focus();
  }

  function whatsappFallback(d) {
    var ls = lines().map(function (l) { return "- " + l.qty + " x " + l.product.name; });
    return "Hello FASHIONHOUSENG, I'd like to order (Pay on Delivery):\n" + ls.join("\n") +
      "\nTotal: " + FH.formatNaira(FH.priceFor(shop, totalQty()) || 0) +
      "\n\nName: " + d.name + "\nEmail: " + d.email + "\nPhone: " + d.phone +
      "\nWhatsApp: " + (d.same_number ? d.phone : d.whatsapp) +
      "\nAddress: " + d.address + ", " + d.state;
  }

  function showSendFailure(d, message) {
    orderError.textContent = (message || "We couldn't send your order just now. Please try again.") + " ";
    var a = el("a", "form-error-link");
    a.href = FH.waLink(whatsappFallback(d));
    a.target = "_blank";
    a.rel = "noopener";
    a.appendChild(FH.icon("icon-whatsapp"));
    a.appendChild(document.createTextNode(" Or send this order on WhatsApp"));
    orderError.appendChild(a);
    orderError.hidden = false;
    orderError.scrollIntoView({ block: "center", behavior: "smooth" });
  }

  /* ---------- Step navigation ---------- */

  var NEXT_LABEL = { 1: "Continue", 2: "Review", 3: "Place order" };

  function showStep(n, focusHeading) {
    // Guards: no watches → step 1; details incomplete → step 2.
    if (n > 1 && totalQty() === 0) n = 1;
    if (n > 2 && Object.keys(checkDetails(readDetails())).length) n = 2;
    step = n;
    document.body.setAttribute("data-step", String(n));

    panels.forEach(function (p) { p.hidden = Number(p.dataset.panel) !== n; });
    stepperItems.forEach(function (li) {
      var s = Number(li.dataset.step);
      li.classList.toggle("is-active", s === n);
      li.classList.toggle("is-done", s < n);
      if (s === n) li.setAttribute("aria-current", "step");
      else li.removeAttribute("aria-current");
    });
    btnBack.hidden = n === 1;
    btnNext.textContent = NEXT_LABEL[n];
    if (n === 3) renderReview();

    if (focusHeading) {
      var h = document.querySelector('[data-panel="' + n + '"] h2');
      window.scrollTo({ top: 0, behavior: "smooth" });
      if (h) h.focus({ preventScroll: true });
    }
  }

  function goTo(n) {
    if (n === step) return;
    history.pushState({ step: n }, "", "#step-" + n);
    showStep(n, true);
  }

  window.addEventListener("popstate", function () {
    var m = /^#step-([123])$/.exec(location.hash);
    showStep(m ? Number(m[1]) : 1, true);
  });

  btnBack.addEventListener("click", function () { goTo(step - 1); });
  document.querySelectorAll("[data-goto]").forEach(function (b) {
    b.addEventListener("click", function () { goTo(Number(b.dataset.goto)); });
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (sending) return;
    hideOrderError();

    if (step === 1) {
      if (totalQty() === 0) return step1Error("Choose at least one watch to continue.");
      return goTo(2);
    }
    if (step === 2) {
      if (showFieldErrors(checkDetails(readDetails()))) return;
      return goTo(3);
    }
    placeOrder();
  });

  /* ---------- Place order ---------- */

  function placeOrder() {
    var d = readDetails();
    var payload = {
      items: lines().map(function (l) { return { id: l.product.id, qty: l.qty }; }),
      name: d.name,
      email: d.email,
      phone: d.phone,
      whatsapp: d.whatsapp,
      same_number: d.same_number,
      address: d.address,
      state: d.state,
      website: d.website,
    };

    sending = true;
    btnNext.disabled = true;
    btnBack.disabled = true;
    btnNext.textContent = "Placing order…";

    var endpoint = FH.cfg.orderEndpoint;
    if (!endpoint) {
      // No order service set up yet: hand the order to WhatsApp instead.
      resetButton();
      showSendFailure(d, "Online ordering isn't switched on yet.");
      return;
    }
    // Google Apps Script only accepts "simple" requests, so send JSON as plain text there.
    var isScript = /script\.google(usercontent)?\.com/.test(endpoint);
    fetch(FH.url(endpoint), {
      method: "POST",
      headers: { "Content-Type": isScript ? "text/plain;charset=utf-8" : "application/json" },
      body: JSON.stringify(payload),
      credentials: isScript ? "omit" : "same-origin",
      redirect: "follow",
    })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (body) {
          body = body || {};
          body.httpStatus = res.status;
          return body;
        });
      })
      .then(function (res) {
        if (res.ok && res.reference) {
          FH.session.set(LAST_KEY, {
            reference: res.reference,
            total: res.total,
            items: res.items,
            name: d.name,
            email: d.email,
            phone: FH.normalizePhone(d.phone),
            whatsapp: FH.normalizePhone(d.whatsapp),
            address: d.address,
            state: d.state,
          });
          FH.session.remove(DRAFT_KEY);
          location.href = FH.url("thank-you/?ref=" + encodeURIComponent(res.reference));
          return;
        }
        resetButton();
        if (res.errors) {
          if (res.errors.items) {
            goTo(1);
            step1Error(res.errors.items);
            return;
          }
          goTo(2);
          showFieldErrors(res.errors);
          return;
        }
        showSendFailure(d, res.error);
      })
      .catch(function () {
        resetButton();
        showSendFailure(d);
      });
  }

  function resetButton() {
    sending = false;
    btnNext.disabled = false;
    btnBack.disabled = false;
    btnNext.textContent = NEXT_LABEL[step];
  }

  /* ---------- Start ---------- */

  function restoreFields() {
    var f = draft.fields || {};
    FIELDS.forEach(function (name) {
      if (typeof f[name] === "string") form.elements[name].value = f[name];
    });
    if (typeof f.same === "boolean") sameBox.checked = f.same;
    syncSame();
  }

  form.addEventListener("input", function (e) {
    if (e.target.name && FIELDS.indexOf(e.target.name) !== -1 && e.target.getAttribute("aria-invalid")) {
      setFieldError(e.target.name, "");
    }
    saveDraft();
  });
  form.addEventListener("change", saveDraft);
  sameBox.addEventListener("change", function () {
    syncSame();
    if (!sameBox.checked) form.elements.whatsapp.focus();
  });

  FH.loadShop()
    .then(function (data) {
      shop = data;
      orderable().forEach(function (p) { byId[p.id] = p; });
      Object.keys(qty).forEach(function (id) {
        if (!byId[id] || !(qty[id] > 0)) delete qty[id];
      });
      // Trim a stale draft to the order limit.
      while (totalQty() > shop.maxOrderQuantity) {
        var last = Object.keys(qty).pop();
        if (--qty[last] <= 0) delete qty[last];
      }
      // Coming from a watch's Buy Now button: start with that watch.
      var pre = new URLSearchParams(location.search).get("watch");
      if (pre && byId[pre] && totalQty() === 0) qty[pre] = 1;

      fillStates();
      restoreFields();
      buildPickList();
      renderPicks();
      renderSummary();
      saveDraft();

      var m = /^#step-([123])$/.exec(location.hash);
      var start = m ? Number(m[1]) : 1;
      history.replaceState({ step: start }, "", location.pathname + location.search + "#step-" + start);
      showStep(start, false);
    })
    .catch(function () {
      var list = document.getElementById("pick-list");
      list.textContent = "";
      var p = el("p", "form-error", "We couldn't load the watches. Please refresh the page, or order on WhatsApp. ");
      var a = el("a", "form-error-link", "Open WhatsApp");
      a.href = FH.waLink(FH.cfg.generalMessage);
      a.target = "_blank";
      a.rel = "noopener";
      p.appendChild(a);
      list.appendChild(p);
      btnNext.disabled = true;
    });
})();
