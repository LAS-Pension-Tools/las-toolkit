# NHS 2015 Pension (CARE) — v2

**New in v2**
- Retirement date + **Estimate/Award** mode (apply/suppress retirement‑year ARA)
- **Pot-by-pot** revaluation engine + **Audit** trail
- **VER/AGE/LATE** using imported **ERF/LRF** tables
- **ERRBO** handling and **12:1** commutation

## Use
1) Enter **pensionable pay** per scheme year (YE 2016 → retirement year). For the final year, enter **pay from 1 April to the last day of membership**.
2) Set **Retirement date** and choose **Mode**:
   - **Estimate** = apply ARA at 1 April of the retirement year, then add part‑year accrual.
   - **Award** = suppress final ARA; add only part‑year accrual.
3) In **ARA Admin**, edit/import ARA decimals by year end (e.g., 0.116).
4) In **Retirement & Factors**, add **DOB**, **NPA age**, choose **Age/VER/Late**, import **ERF/LRF**, set **ERRBO** and **commutation**.
5) **Audit** shows each pot’s accrual, multiplier, and contribution to the total.

## Deploy
Upload the folder to a static host (GitHub Pages / Netlify / Cloudflare). Embed in Workvivo using the URL:
```
https://<your host>/nhs-2015-care/?embed=1&compact=1&theme=dark
```

*Note:* Deferred (PI) revaluation after leaving is not included in v2.
