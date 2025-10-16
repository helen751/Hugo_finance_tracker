# Hugo Finance Tracker

A mobile‑first, accessible, framework‑free personal finance tracker for recording income and expenses, visualizing monthly stats, and importing/exporting data — all in the browser using `localStorage`.

> **Tech**: Semantic HTML, modern CSS (no frameworks), vanilla JS (ES Modules).  
> **Brand**: Royal Blue `#1D4ED8` & Gold `#F59E0B`.  
> **Default currency**: RWF (Rwandan Franc) with manual conversion from NGN/USD.

---

## ✨ Features

- **Dashboard**
  - Totals for **Income**, **Expenses**, and a computed **Financial Health** score.
  - **Budget progress per category**, driven by your Settings.
  - Sticky sidebar (desktop) + mobile hamburger.
- **Add Income / Add Expense**
  - Client‑side validation (amount, date not in future, description/source ≥ 5 letters).
  - Currency input (RWF, NGN, USD) with **manual conversion** to RWF.
  - Expense categories: Food, Books, Transport, Entertainment, Fees, Other (+ “Other” free‑text).
- **Transactions View**
  - Mobile cards + desktop table.
  - Live **search** (safe regex compilation; user text treated literally).
  - **Edit / Delete** actions (edit pre‑fills the appropriate form).
- **Settings**
  - User name, theme (light/dark/system), warning preference, and **budget caps per category**.
- **Import / Export**
  - Export **settings / transactions / both** as JSON.
  - Import JSON (auto‑detect structure). Duplicate IDs are re‑keyed.
  - **Default dataset** (`assets/default-data.json`) for quick demo.
- **Theming**
  - Light/Dark/System via `data-theme` on `<html>` and `prefers-color-scheme`.
- **Accessibility**
  - Semantic regions, labels, ARIA where needed, visible focus, keyboard support.
  - Live regions for stat outputs and safe color contrast.

---

## 🗂 Folder Structure

```
HUGO_FINANCE_TRACKER/
├── assets/
│   ├── banner/
│   ├── favicons/
│   ├── icons/
│   ├── testimonials/
│   └── default-data.json
├── scripts/
│   ├── add_expense.js
│   ├── add_income.js
│   ├── dashboard-ui.js         # stats, budgets, sidebar toggle
│   ├── load_transactions.js    # transactions list (cards/table + search + edit/delete)
│   ├── state.js                # rates, ids, theme, import/export helpers
│   ├── storage.js              # localStorage I/O (settings & transactions)
│   ├── ui.js                   # small helpers used by pages (if any)
│   └── validators.js           # regex & input validation
├── styles/
│   ├── main-style.css
│   └── responsive.css
├── dashboard.html              # app dashboard (aside + panels)
└── index.html                  # marketing/home page
```

> **No frameworks.** Optional jQuery is not used. CSS is mobile‑first and split into a base + responsive file.

---

## 🧰 Data Model

### LocalStorage Keys

- **`hugo_transactions`** → `Transaction[]`
- **`hugo_settings`** → `Settings`
- **`hugo_theme`** → `'light' | 'dark' | 'system'` (applied to `<html data-theme>`)

### Transaction (normalized to RWF)

```jsonc
{
  "id": "txn_kum3x9…",          // unique id
  "description": "Lunch at cafeteria",
  "amount": 12500,               // number, stored in RWF
  "currency": "RWF",             // normalized currency
  "original": {                  // what the user entered
    "amount": 12.5,
    "currency": "USD"
  },
  "category": "Food",            // free text (mapped to settings caps)
  "type": "income" | "expense",
  "date": "2025-09-25",          // ISO YYYY-MM-DD
  "createdAt": "2025-09-25T10:24:31.321Z",
  "updatedAt": "2025-09-25T10:24:31.321Z"
}
```

### Settings

```jsonc
{
  "name": "Ada Lovelace",
  "theme": "system",             // 'light' | 'dark' | 'system'
  "warnOverCap": "on",           // string flag
  "budget": {
    "food": 100000,
    "books": 80000,
    "transport": 60000,
    "entertainment": 40000,
    "fees": 120000,
    "other": 50000
  }
}
```

> **Currency**: App stores **RWF** only. Manual conversion rates live in `state.js`:
>
> ```js
> const RATES_TO_RWF = { RWF: 1, NGN: 1.05, USD: 1400 };
> ```
> Update these numbers if you need different demo rates.

---

## 🚀 Getting Started

1. **Clone / Download** this folder.
2. Open **`index.html`** in a modern browser.  
   Open **`dashboard.html`** to use the app.
3. (Optional) Click **Import default data** in *Import* panel to preload demo records/settings.

> No build step, no server required. Files are plain HTML/CSS/JS. For Chrome’s strict file URL policies, you can use a lightweight server (e.g., VS Code “Live Server” extension).

---

## 🧭 App Anatomy (Dashboard)

- **Aside (sidebar)** – logo + navigation (Dashboard, Add Income, Add Expense, Transactions, Settings, Import, Export).  
  - Mobile: hidden by default; toggled via hamburger.
- **Main** – each feature is a `<section id="panel-…">`. Only one panel is visible at a time:
  - `panel-stats` (cards + budget progress)
  - `panel-add-income`
  - `panel-add-expense`
  - `panel-transactions` (cards/table + search)
  - `panel-settings`
  - `panel-import`
  - `panel-export`

Navigation buttons call a small helper that sets `display:block` on the chosen panel and hides others.

---

## 🧪 Validation & Regex Catalog

- **Amount** – positive number with up to 2 decimals.  
  Implementation: `validateAmount()` in `validators.js`.
- **Date** – not in the future.  
  Implementation: `validateDateNotFuture()`.
- **Text fields** – at least **5 letters** (source/description), and 3 letters for “Other category” name.  
  Implementation: `validateMinLetters()`.

> Regex input from the user is **not** executed. For live search, user input is escaped and compiled safely.

---

## 🔢 Stats & Budgets

- **Stats** are calculated for the **current month** using `date` on each transaction.
- **Financial Health** is a simple savings‑rate mapping to a 0‑100 score.
- **Budget Progress** cards are generated from keys present in `settings.budget`. Any expense category that doesn’t match a settings key is bucketed into **other** (if defined).

---

## ⬇️ Import / ⬆️ Export

- **Export** lets you choose: **settings**, **transactions**, or **both**. File name is stamped with the scope & timestamp.
- **Import**:
  - Accepts:
    - an **array** of transactions, or
    - an **object** `{ settings?, transactions? }`.
  - **Duplicate IDs** are re‑keyed via a fresh `uid()` so nothing is overwritten unexpectedly.
  - After import, a `txn:added` event prompts the UI to refresh.
- **Default dataset** lives at `assets/default-data.json` and can be imported with one click.

---

## 🎨 Theming

- User choice stored in `localStorage['hugo_theme']`.  
- `setTheme(mode)` writes the value and `applyTheme()` sets/clears `data-theme` on `<html>`.
- `system` uses `prefers-color-scheme` with CSS fallbacks. Colors are driven by CSS custom properties.

---

## ♿ Accessibility Notes

- Proper **landmarks** and **headings**.
- Form inputs have **labels**, error text uses predictable **ids** and is toggled.
- Live outputs (e.g., totals) use `aria-live="polite"`.
- Sidebar & modals are keyboard reachable; focus isn’t trapped (no modal).

---

## 🔒 Persistence & Reset

- Data is kept in the browser:
  - `localStorage['hugo_transactions']`
  - `localStorage['hugo_settings']`
  - `localStorage['hugo_theme']`
- To **reset**: use the Reset button in Settings or run in DevTools:
  ```js
  localStorage.removeItem('hugo_transactions');
  localStorage.removeItem('hugo_settings');
  localStorage.removeItem('hugo_theme');
  ```

---

## 🧩 Known Limitations / TODO

- Currency rates are manual demo values (no live API by design).
- No authentication; data stays on the device.
- Basic conflict handling for imports (IDs only).
- Tests are minimal; add more assertions in a `tests.html` page if required by rubric.

---

## 📜 License / Ownership

**© Helen Okereke. All rights reserved.**  
All UI and code are original and reserved to the author unless stated otherwise.

---

## ❓ Troubleshooting

- **Data not visible?** Open DevTools → Application → Local Storage and verify keys listed above. Ensure `txn.type` is exactly `'income'` or `'expense'` (case‑insensitive in latest code).
- **Search shows nothing?** Make sure you didn’t include regex syntax; input is treated as plain text and escaped.
- **Theme not switching?** Confirm that `hugo_theme` exists and `<html>` has (or not) `data-theme` per your choice.

---

## 🙌 Acknowledgements

- Icons and avatars are custom SVGs in `assets/icons/` and `assets/testimonials/`.
- No frameworks used. All credit to the course rubric for requirements & milestones.
