
# LAS Contribution Rate Checker

A small client-side tool for estimating NHS Pension **member** contribution rates by scheme year.  
**Source of truth for rates:** [NHS Pensions (NHSBSA) – Cost of being in the Scheme](https://www.nhsbsa.nhs.uk/member-hub/cost-being-scheme).  
Results are a guide only; your **employer/payroll** sets the final rate under NHS Pensions rules.

---

## What’s new (2025-10-20)

- **Monthly/Annual input toggle** — users can enter **Monthly** pensionable pay; the tool clearly shows the annualised figure used (×12).
- **Inputs reordered** — **Annual/Monthly pay fields are now above** the legacy **WTE** field to reduce mistaken entries.
- **Button spacing** — cleaner spacing around **Calculate** and **Reset**; info note no longer hugs the buttons.
- **Footer text** — explicitly states we use NHSBSA rates and that payroll determines the final rate.

> App version in code: `window.LAS_CRC_VERSION` (see `assets/app.js`).

---

## How it works (quick)

- **Legacy years** (to **30 Sep 2022**): banding uses **WTE pensionable pay**.  
- **From 1 Oct 2022**: banding uses **actual annualised pensionable pay** (monthly ×12 if Monthly mode is selected).  
- The tool shows the selected band and estimates annual/monthly member contributions from the entered pay.

---

## Keeping rates up to date (every year)

You have two ways:

### A) Permanent (for everyone) — edit the code
1. Open **`assets/app.js`**.
2. Find the year tables near the top (e.g., `TABLE_2025_26`, `TABLE_2024_25`, etc.).
3. Update thresholds/rates to match NHSBSA.
4. (Optional) Bump the cache-buster in `index.html` so pages pick up the new JS:  
   ```html
   <script src="./assets/app.js?v=2025-10-20g" defer></script>

- 2023/24–2025/26: extracted from the LAS rate checker spreadsheets (RN references noted in the sheet).
