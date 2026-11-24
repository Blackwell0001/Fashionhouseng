# Save orders to a Google Sheet (one-time, about 5 minutes)

When a customer taps **Place order**, the website sends the order to a small Google script. The script checks the order, works out the price, adds a row to your Google Sheet and emails you.

## 1. Make the sheet

1. Go to **sheets.google.com** (signed in with the Google account that should receive orders) and create a **Blank spreadsheet**.
2. Name it **FASHIONHOUSENG Orders**.

## 2. Add the script

1. In the sheet, click **Extensions → Apps Script**. A new tab opens.
2. Delete everything in the editor (`function myFunction() {}`).
3. Open `google-apps-script/Code.gs` from the website folder, copy **all** of it, and paste it into the editor.
4. Click the **Save** icon (💾).

## 3. Run setup once

1. At the top of the editor, choose **setup** in the function dropdown, then click **Run**.
2. Google asks for permission. Click **Review permissions**, choose your account, then **Advanced → Go to (unsafe)**, then **Allow**. "Unsafe" only means you wrote the script yourself rather than Google checking it.
3. Check that the sheet now has an **Orders** tab with gold-on-black headings, and that you received a "New order TEST" email.

## 4. Publish it as a web app

1. In the editor, click **Deploy → New deployment**.
2. Click the gear ⚙ next to "Select type" and choose **Web app**.
3. Fill in:
   - **Description:** `FASHIONHOUSENG orders`
   - **Execute as:** **Me**
   - **Who has access:** **Anyone**. The website's customers aren't signed in to Google, so this must be "Anyone".
4. Click **Deploy** and copy the **Web app URL**. It looks like `https://script.google.com/macros/s/AKfy…/exec`.

## 5. Connect the website

1. Open `js/config.js` (on GitHub, open the file and click the ✏️ pencil to edit).
2. Paste the URL between the quotes:
   ```js
   orderEndpoint: "https://script.google.com/macros/s/AKfy…/exec",
   ```
3. Save (on GitHub: **Commit changes**).

## 6. Test

Place an order on the website. A new row should appear in **Orders**, and you should get an email. Use the **Status** column dropdown to track each order: New → Confirmed → Out for delivery → Delivered, or Cancelled.

## Changing prices later

Prices are in two places that must match:
- `data/shop.json` on the website (what customers see), and
- `BUNDLE_PRICES` near the top of the script (what is actually charged).

After editing the script, click **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy**. The web app URL stays the same.
