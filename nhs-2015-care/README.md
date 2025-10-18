# NHS 2015 Pension (CARE) — v2.1 (Hot‑fix)

**What’s fixed**
- **Year End is numeric-only** (min **2016**) and the **scheme-year label is derived** (e.g., `2015/16`) so it can’t corrupt.
- **Delete row** action to remove strays.
- **Seed 2016→Final** button to auto-create a clean, contiguous set of rows to the retirement year end (or 2026 if no date yet).
- One-click **Reset to NHS ARA set (2016→2025)**.

**What’s unchanged**
- **Estimate/Award** mode
- Pot-by-pot revaluation + **Audit**
- **ERF/LRF** import, **ERRBO**, and **12:1** commutation
- Dark/compact embeds for Workvivo

## Use
1) Click **Seed 2016→Final** (Calculator tab).  
2) Enter pay per year; for the final year enter **1 Apr → last day of membership** pay.  
3) Set **Retirement date** and choose **Estimate** or **Award**.  
4) If needed, **ARA Admin → Reset to NHS set (2016→2025)** or import JSON.

## ARA (reference)
Active revaluation while contributing is **September CPI + 1.5%**. For YE 2025 that’s **0.032** (1.7% + 1.5%). Import your table each year from the official sources.

## Files
- `index.html`, `assets/styles.css`, `assets/app.js`

Deploy by dropping the `nhs-2015-care/` folder into your repo (replacing the previous version).
