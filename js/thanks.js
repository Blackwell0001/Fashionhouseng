/*
 * FASHIONHOUSENG — thank-you page: order reference and summary.
 */
(function () {
  "use strict";

  var FH = window.FH;
  var el = FH.el;

  var params = new URLSearchParams(location.search);
  var ref = (params.get("ref") || "").toUpperCase();
  if (!/^FH-[A-Z0-9]{6}$/.test(ref)) ref = "";

  var last = FH.session.get("fhng_last_order");
  if (last && last.reference !== ref) last = null;

  if (ref) {
    document.getElementById("thanks-ref").textContent = ref;
    document.getElementById("thanks-ref-box").hidden = false;
  }

  if (last) {
    var first = String(last.name || "").split(" ")[0];
    if (first) document.getElementById("thanks-name").textContent = "Thank you, " + first;
    if (last.phone) document.getElementById("thanks-phone").textContent = last.phone;

    var list = document.getElementById("thanks-items");
    (last.items || []).forEach(function (i) {
      var li = el("li");
      li.appendChild(el("span", null, i.name));
      li.appendChild(el("span", "summary-qty", "× " + i.qty));
      list.appendChild(li);
    });
    if (typeof last.total === "number") {
      document.getElementById("thanks-total").textContent = FH.formatNaira(last.total);
      document.getElementById("thanks-summary").hidden = false;
    }
  }

  var msg = FH.cfg.generalMessage;
  if (ref && last) {
    msg = "Hello FASHIONHOUSENG, I just placed order " + ref + " on your website (Pay on Delivery):\n" +
      (last.items || []).map(function (i) { return "- " + i.qty + " x " + i.name; }).join("\n") +
      "\nTotal: " + FH.formatNaira(last.total || 0) +
      "\n\nName: " + last.name + "\nPhone: " + last.phone +
      (last.whatsapp && last.whatsapp !== last.phone ? "\nWhatsApp: " + last.whatsapp : "") +
      "\nAddress: " + last.address + ", " + last.state;
  } else if (ref) {
    msg = "Hello FASHIONHOUSENG, I just placed order " + ref + " on your website.";
  }
  document.querySelectorAll(".js-wa-ref").forEach(function (a) { a.href = FH.waLink(msg); });
})();
