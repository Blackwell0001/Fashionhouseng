/**
 * FASHIONHOUSENG — order saver for the website (Google Apps Script).
 *
 * Paste this whole file into Extensions → Apps Script of your orders Google Sheet,
 * then deploy it as a Web app (see SETUP.md). Each order becomes a new row in the
 * "Orders" tab, and you get an email for every new order.
 *
 * The total is worked out HERE from the number of watches, never taken from the
 * browser. If you change prices on the website (data/shop.json), change them below too.
 */

// ---- Settings: keep these in step with data/shop.json ----------------------

var BUNDLE_PRICES = { 1: 25000, 2: 45000, 3: 65000, 4: 80000 };
var MAX_ORDER_QUANTITY = 4;

var WATCHES = {
  blue: "Blue Men's Watch",
  black: "Black Men's Watch",
  silver: "Silver Men's Watch",
  gold: "Gold Men's Watch",
  green: "Green Men's Watch"
};

var STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "Gombe", "Imo", "Jigawa",
  "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger",
  "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe",
  "Zamfara", "FCT Abuja"
];

// Who gets an email for each new order. Empty = the Google account that owns this script.
var NOTIFY_EMAIL = "";

var SHEET_NAME = "Orders";
var HEADERS = [
  "Date", "Reference", "Status", "Name", "Email", "Calling number", "WhatsApp",
  "Address", "State", "Watches", "Quantity", "Total (₦)", "Notes"
];
var STATUSES = ["New", "Confirmed", "Out for delivery", "Delivered", "Cancelled"];

// ---- Web app ----------------------------------------------------------------

/** Opening the web app URL in a browser just confirms it is running. */
function doGet() {
  return json_({ ok: true, message: "FASHIONHOUSENG order service is running." });
}

/** The website posts each order here. */
function doPost(e) {
  try {
    var input = JSON.parse((e && e.postData && e.postData.contents) || "{}");

    // Spam trap: a hidden field real visitors never fill in. Pretend it worked, store nothing.
    if (input.website) {
      return json_({ ok: true, reference: newReference_(), total: 0, items: [] });
    }

    var checked = check_(input);
    if (checked.errors) {
      return json_({ ok: false, error: "Please check the highlighted details.", errors: checked.errors });
    }
    var o = checked.order;

    var lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      var sheet = sheet_();
      o.reference = uniqueReference_(sheet);
      sheet.appendRow([
        new Date(), o.reference, "New", safe_(o.name), safe_(o.email), "'" + o.phone, "'" + o.whatsapp,
        safe_(o.address), o.state, o.lines.map(function (l) { return l.qty + " x " + l.name; }).join(", "),
        o.quantity, o.total, ""
      ]);
    } finally {
      lock.releaseLock();
    }

    notify_(o);

    return json_({
      ok: true,
      reference: o.reference,
      quantity: o.quantity,
      total: o.total,
      items: o.lines.map(function (l) { return { name: l.name, qty: l.qty }; })
    });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: "Something went wrong on our side. Please try again, or send your order on WhatsApp." });
  }
}

// ---- Checks (same rules as the website) ------------------------------------

function check_(input) {
  var errors = {};
  var clean = function (v) { return String(v == null ? "" : v).replace(/\s+/g, " ").trim(); };

  var name = clean(input.name);
  if (name.length < 2 || name.length > 80) errors.name = "Please enter your full name.";

  var email = clean(input.email).toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(email)) {
    errors.email = "Please enter a valid email address, e.g. name@gmail.com.";
  }

  var phone = phone_(input.phone);
  if (!phone) errors.phone = "Enter a Nigerian phone number, e.g. 0803 123 4567.";

  var same = !!input.same_number;
  var whatsapp = same ? phone : phone_(input.whatsapp);
  if (!same && !whatsapp) errors.whatsapp = "Enter your WhatsApp number, e.g. 0803 123 4567.";

  var address = String(input.address == null ? "" : input.address).trim();
  if (address.length < 5 || address.length > 300) errors.address = "Please enter your full delivery address.";

  var state = clean(input.state);
  if (STATES.indexOf(state) === -1) errors.state = "Please choose your state.";

  var qtyById = {};
  (Array.isArray(input.items) ? input.items.slice(0, 20) : []).forEach(function (it) {
    var id = it && String(it.id || "");
    var qty = it ? parseInt(it.qty, 10) : 0;
    if (id && qty > 0) qtyById[id] = (qtyById[id] || 0) + qty;
  });

  var lines = [];
  var quantity = 0;
  Object.keys(qtyById).forEach(function (id) {
    if (!WATCHES[id]) {
      errors.items = "One of the watches in your order is no longer available. Please choose again.";
      return;
    }
    lines.push({ id: id, name: WATCHES[id], qty: qtyById[id] });
    quantity += qtyById[id];
  });

  var total = null;
  if (!errors.items) {
    if (quantity === 0) errors.items = "Please choose at least one watch.";
    else if (quantity > MAX_ORDER_QUANTITY) errors.items = "You can order up to " + MAX_ORDER_QUANTITY + " watches here. For more, please order on WhatsApp.";
    else if (!BUNDLE_PRICES[quantity]) errors.items = "We could not price this order. Please refresh the page and try again.";
    else total = BUNDLE_PRICES[quantity];
  }

  if (Object.keys(errors).length) return { errors: errors };
  return {
    order: {
      name: name, email: email, phone: phone, whatsapp: whatsapp, address: address, state: state,
      lines: lines, quantity: quantity, total: total
    }
  };
}

/** Nigerian mobiles: 0803..., 803..., 234803..., +234 803 ... -> 0XXXXXXXXXX, or null. */
function phone_(raw) {
  var s = String(raw == null ? "" : raw).trim();
  if (!s || !/^\+?[\d\s\-().]+$/.test(s)) return null;
  var d = s.replace(/\D+/g, "");
  if (d.length === 13 && d.indexOf("234") === 0) d = "0" + d.slice(3);
  else if (d.length === 14 && d.indexOf("2340") === 0) d = d.slice(3);
  else if (d.length === 10 && d[0] !== "0") d = "0" + d;
  return /^0[789][01]\d{8}$/.test(d) ? d : null;
}

// ---- Sheet ------------------------------------------------------------------

function sheet_() {
  var book = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = book.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = book.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold").setBackground("#292929").setFontColor("#C6A15B");
    sheet.setFrozenRows(1);
    sheet.getRange("A:A").setNumberFormat("d mmm yyyy, h:mm am/pm");
    sheet.getRange("L:L").setNumberFormat("₦#,##0");
    var rule = SpreadsheetApp.newDataValidation().requireValueInList(STATUSES, true).build();
    sheet.getRange(2, 3, 1000, 1).setDataValidation(rule);
  }
  return sheet;
}

/** Run once from the Apps Script editor to create the Orders tab and approve permissions. */
function setup() {
  sheet_();
  notify_({
    reference: "TEST", name: "Setup test", email: "-", phone: "-", whatsapp: "-",
    address: "-", state: "-", lines: [], quantity: 0, total: 0
  });
}

function newReference_() {
  var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  var ref = "FH-";
  for (var i = 0; i < 6; i++) ref += chars.charAt(Math.floor(Math.random() * chars.length));
  return ref;
}

function uniqueReference_(sheet) {
  var used = {};
  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 2, sheet.getLastRow() - 1, 1).getValues().forEach(function (r) { used[r[0]] = true; });
  }
  var ref;
  do { ref = newReference_(); } while (used[ref]);
  return ref;
}

/** Stop text that starts with = + - @ from being read as a spreadsheet formula. */
function safe_(text) {
  text = String(text);
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function notify_(o) {
  var to = NOTIFY_EMAIL || Session.getEffectiveUser().getEmail();
  if (!to) return;
  var body = "New order " + o.reference + "\n\n" +
    o.lines.map(function (l) { return l.qty + " x " + l.name; }).join("\n") +
    "\n\nTotal (Pay on Delivery): ₦" + Number(o.total).toLocaleString("en-NG") +
    "\n\nName: " + o.name + "\nEmail: " + o.email + "\nCall: " + o.phone + "\nWhatsApp: " + o.whatsapp +
    "\nAddress: " + o.address + "\nState: " + o.state +
    "\n\nPlease call the customer within 12 hours.\nOpen the sheet: " + SpreadsheetApp.getActiveSpreadsheet().getUrl();
  MailApp.sendEmail(to, "New order " + o.reference + " – FASHIONHOUSENG", body);
}

function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
