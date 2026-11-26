/*
 * FASHIONHOUSENG — contact details and WhatsApp messages.
 * Watches, prices and order rules are in data/shop.json.
 * See README.md for step-by-step instructions.
 */
window.FHNG_CONFIG = {
  // WhatsApp number in international format, digits only (no +, no spaces).
  whatsappNumber: "2348176578290",
  whatsappDisplay: "08176578290",

  // Phone number for calls.
  callNumber: "08149704199",

  instagramUrl: "https://www.instagram.com/_fhng__",
  instagramHandle: "@_fhng__",
  tiktokUrl: "https://www.tiktok.com/@fashionhouseng5",
  tiktokHandle: "@fashionhouseng5",

  // Pre-filled WhatsApp messages. The customer can edit them before sending.
  generalMessage: "Hello FASHIONHOUSENG, I have a question about your watches.",
  // {product} is replaced with the watch name.
  productMessage: "Hello FASHIONHOUSENG, I'd like to know more about the {product}.",
  womensMessage: "Hello FASHIONHOUSENG, I'm interested in your women's watches. Please send me the photos and price.",
  largeOrderMessage: "Hello FASHIONHOUSENG, I'd like to order more than 4 watches. Please help me with a bulk order.",

  // Where orders are sent.
  // GitHub Pages: paste your Google Apps Script web app URL here (see google-apps-script/SETUP.md),
  //   e.g. "https://script.google.com/macros/s/AKfy.../exec".
  // Bluehost (PHP): "api/order.php".
  // Left empty, "Place order" offers to send the order on WhatsApp instead.
  orderEndpoint: "https://script.google.com/macros/s/AKfycbzOe1ov-Y8nYSBMWzarUgqkzLWUlDxCkA4yQBHDkpDe-uLSrqZ508eSmqpfZ7m3u98Egg/exec",

  // The watches, prices and states.
  shopFile: "data/shop.json",
};
