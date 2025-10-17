# NHS 2015 Pension (CARE) — Calculator

A lightweight, client‑side web tool for modelling NHS 2015 Scheme (CARE) pension accrual using 1/54 build‑up and Active Revaluation (CPI (September) + 1.5%). No libraries, no tracking, no data leaves the browser.

## Features
- **Calculator**: Year‑by‑year accrual from pensionable pay, with opening/revalued opening and closing balances.
- **ARA Admin**: Editable **Active Revaluation** table (per year end). Save to **localStorage**, **Export/Import JSON**, **Reset to defaults**, **Apply** to calculator.
- **Settings**: **Dark mode** (system/light/dark), **Compact** layout, **Embed code** generator for Workvivo/SharePoint/etc.
- **Export**: Download results as CSV.
- **Deploy Anywhere**: Pure static files, perfect for **GitHub Pages**.

## Folder Structure
```
las-toolkit/
  nhs-2015-care/
    index.html
    assets/
      styles.css
      app.js
    README.md
```

## Development
This is a static app—open `index.html` in a browser. For live reload while editing:

```bash
# from the nhs-2015-care folder
python3 -m http.server 8080
# or
npx http-server -p 8080
```

## Deploy to GitHub Pages
1. Create folder `nhs-2015-care/` under your `las-toolkit` repo with the files above.
2. Commit and push to `main`:
   ```bash
   git add nhs-2015-care
   git commit -m "feat(nhs-2015-care): 2015 CARE calculator with ARA admin, dark mode, compact embed"
   git push origin main
   ```
3. Enable GitHub Pages (Settings → Pages → **Deploy from Branch**).
4. Your app URL will resemble:
   `https://las-pension-tools.github.io/las-toolkit/nhs-2015-care/`

## Embedding in Workvivo
Workvivo strips scripts, so **embed via iframe**:

```html
<iframe
  src="https://las-pension-tools.github.io/las-toolkit/nhs-2015-care/?embed=1&compact=1&theme=dark&abs=10875.90"
  width="100%" height="780"
  style="border:0; overflow:hidden;"
  loading="lazy" referrerpolicy="no-referrer"
></iframe>
```

### Query Params
- `embed=1` – hides site header/footer.
- `compact=1` – tighter spacing for narrow columns.
- `theme=dark|light|system` – forces theme; default is system.
- `abs=10875.90` – prefill ABS target.

## Data & Privacy
- All data is processed **locally** in the browser.
- ARA table and preferences are saved to **localStorage** under keys `nhs_care_ara`, `nhs_care_theme`, `nhs_care_compact`.
- No cookies, no analytics.

## Notes
- Benefits are based on **pensionable pay**, not contributions paid.
- Breaks/opt‑out periods may revalue earlier slices at CPI‑only; this tool assumes continuous active revaluation unless you alter ARA or zero out pay for those years.
- From April 2023, the revaluation point moved to **6 April**; the ARA value itself is unchanged for the scheme year but the timing explains statement timing differences.

## Licence
MIT © London Ambulance Service Pensions Tools (LAS)
