# NHS 2015 Pension (CARE) — Prefilled Case (Y/E 2026 = £29,476.78)

This pack is a ready-to-upload snapshot of the web calculator **preloaded** with the final part-year for a member who left on **04-Dec-2025** (scheme year **2025/26**). The 2026 row is set to **ARA 0.0000** and **pay 29,476.78**. Enter prior years from the award to fully reproduce the statement.

## What’s inside
- `index.html` — calculator with **Calculator**, **ARA Admin**, **Early Retirement**, and **Settings** tabs.
- `assets/styles.css` — light/dark + compact modes.
- `assets/app.js` — prefilled Y/E 2026 row; ARA defaults 2016→2026.
- `assets/arer-2015-template.json` — JSON skeleton to import **2015** Early Retirement Factors (months → factor).
- `assets/arer-2015-sample.csv` — CSV with header to import factors.

## Deploy
Upload the folder to your GitHub repo (e.g., `las-toolkit/nhs-2015-care/`) and enable GitHub Pages. Embed in Workvivo with:
```
https://<your>.github.io/las-toolkit/nhs-2015-care/?embed=1&compact=1&theme=dark&abs=<your ABS>
```

## Notes
- Accrual is **pay ÷ 54**; ARA is **CPI (Sep) + 1.5%** while active. Leaving before revaluation ⇒ the last part-year shows ARA **0.0000**; future CPI is added as **Pensions Increase**.
- Use **Early Retirement** to apply ARER (import factors first), consider **ERRBO**, and adjust **commutation** at **12:1**.
