# FASHIONHOUSENG

Men's watches, Pay on Delivery. *Timeless. Classy. Iconic.*

A static website (HTML, CSS, JavaScript) hosted on GitHub Pages. Orders are saved to a Google Sheet by a Google Apps Script. See [google-apps-script/SETUP.md](google-apps-script/SETUP.md).

- `data/shop.json`: watches, photos, bundle prices (1 ₦25,000 · 2 ₦45,000 · 3 ₦65,000 · 4 ₦80,000), order limit, states
- `js/config.js`: WhatsApp, call number, Instagram, TikTok, order service URL
- `google-apps-script/Code.gs`: the order saver (prices here must match `data/shop.json`)
