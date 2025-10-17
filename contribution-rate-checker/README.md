
# LAS Contribution Rate Checker

Single‑file web app (vanilla HTML/CSS/JS) for checking **member** contribution rates for the NHS Pension Scheme by scheme year.

## Folder
```
/contribution-rate-checker/
  index.html
  /assets
    styles.css
    app.js
    rates.json (for reference)
```

## Dev notes
- Uses **WTE** pay for officers/practice staff (AfC). Practitioners use actual aggregated practitioner income.
- Includes band tables for:
  - 2015/16 → 2021/22 (legacy 7‑tier structure)
  - 2022/23 (Apr–Sep) → legacy structure
  - 2022/23 (Oct–Mar) → new structure
  - 2023/24, 2024/25, 2025/26 (latest LAS spreadsheets)
- Add future years via the **Admin** panel (`?admin=1`) by pasting JSON. Commit updates to keep permanent.

## Embed in Workvivo
Since Workvivo sanitises scripts, host this via GitHub Pages and embed with an iframe:

```html
<div style="border:1px solid #dcdcdc;border-radius:10px;overflow:hidden">
  <iframe src="https://las-pension-tools.github.io/las-toolkit/contribution-rate-checker/" 
          style="width:100%%;height:820px;border:0" 
          title="LAS Contribution Rate Checker" 
          loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
</div>
```

For a narrow column, reduce `height` to ~720px.

## Compact / Dark mode
- Respects system dark‑mode automatically.
- For a very small column, you can also load in a minimal iframe width (no code changes needed).

## Data sources
- 2015–2022 bands: NHS Pensions factsheet (Tiered employee contributions from 1 April 2015 to 31 March 2022).
- 2023/24–2025/26: extracted from the LAS rate checker spreadsheets (RN references noted in the sheet).
