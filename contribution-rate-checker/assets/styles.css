/* LAS Contribution Rate Checker – styles.css (contrast-safe)
   ------------------------------------------------------------
   - Strong contrast in light/dark/HC modes
   - Visible focus, reduced motion
   - Fixes: band active row in dark mode, note/warn boxes, placeholder contrast
*/

:root{
  /* Base (light) */
  --brand:#023020;
  --text:#111111;
  --muted:#4A5568;              /* darker than before for WCAG ratio */
  --bg:#FAFAFA;
  --panel:#FFFFFF;
  --border:#D6D9DC;
  --focus:#0B69A3;

  /* Notices (light) */
  --note-bg:#FFF5E6;
  --note-border:#F1993A;
  --warn-bg:#FEF2F2;
  --warn-border:#FCA5A5;

  /* Tables (light) */
  --thead-bg:#F2F5F3;
  --thead-text:#0B3A2D;
  --row-active-bg:#E8F4F0;      /* light green */
  --row-active-text:#111111;

  --badge-bg:#fff;
}

/* ---------- Global ---------- */
*{ box-sizing:border-box; }
html,body{ margin:0; padding:0; }
body{
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
  background:var(--bg);
  color:var(--text);
  line-height:1.5;
}
::placeholder{ color:var(--muted); opacity:1; } /* ensure contrast */

/* ---------- Layout ---------- */
.las-wrap{ max-width: 980px; margin: 0 auto; padding: 20px; }

/* Header */
.las-header{
  background: var(--brand); color:#fff; padding: 22px 20px;
  border-radius: 12px; display:flex; align-items:center; justify-content:space-between; gap:16px; margin-bottom:18px;
}
.las-header h1{ margin:0 0 4px 0; font-size: 22px; }
.las-header .sub{ margin:0; opacity:.95; }
.hc-toggle{ font-weight:600; display:flex; align-items:center; gap:8px; }
.hc-toggle input{ width:18px; height:18px; }

/* Panels */
.las-panel{
  background:var(--panel);
  color:var(--text);
  border:1px solid var(--border);
  border-radius:12px;
  padding:18px;
  margin-bottom:16px;
}
.panel-title{ margin:0 0 12px 0; font-size:18px; color:var(--brand); }

/* Form */
.grid{ display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:14px; }
.form-row{ display:flex; flex-direction:column; gap:6px; }
.form-row span{ font-weight:600; }
.form-row input, .form-row select, textarea{
  border:1px solid var(--border);
  background:#fff;
  color:var(--text);
  border-radius:8px;
  padding:10px 12px;
  font-size:16px;
}
.form-row input:focus, .form-row select:focus, textarea:focus{
  outline:3px solid var(--focus); outline-offset:2px;
}
.help{ color:var(--muted); }

/* Helper */
.helper{ margin-top:10px; border:1px solid var(--border); border-radius:10px; padding:10px 12px; }
.helper-grid{ margin-top:10px; display:grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap:12px; }
.helper-actions{ display:flex; align-items:center; gap:12px; margin-top:8px; }
.calced{ font-weight:700; }

/* Buttons */
.actions{ display:flex; gap:10px; flex-wrap:wrap; margin-top:12px; }
.btn{
  appearance:none; background:#fff; color:var(--brand);
  border:2px solid var(--brand); padding:10px 14px; border-radius:10px;
  font-weight:700; cursor:pointer;
}
.btn:hover{ background:#F0F7F4; }
.btn:focus-visible{ outline:3px solid var(--focus); outline-offset:2px; }
.btn.primary{ background:var(--brand); color:#fff; }
.btn.primary:hover{ background:#0d4132; }
.btn.danger{ border-color:#b00020; color:#b00020; }
.btn.danger:hover{ background:#ffe9ec; }

/* Notes / warnings */
.note{
  display:flex; gap:10px; background:var(--note-bg); border:2px solid var(--note-border);
  border-radius:10px; padding:10px 12px; margin-top:12px; color:var(--text);
}
.note .note-icon{ font-size:18px; }
.warn{
  display:flex; gap:10px; background:var(--warn-bg); border:2px solid var(--warn-border);
  border-radius:10px; padding:10px 12px; margin:8px 0; color:var(--text);
}
.warn-icon{ font-size:18px; }

/* Results */
.result-row{ display:grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap:12px; align-items:stretch; margin-bottom:10px; }
.result-row.alt{ grid-template-columns: repeat(3, minmax(0,1fr)); }
.kpi, .result-row.alt > div{
  border:1px solid var(--border); border-radius:10px; padding:12px; background:#fff; color:var(--text);
}
.kpi-label{ font-weight:700; color:var(--muted); }
.kpi-value{ font-size:24px; font-weight:900; margin-top:4px; }
.kpi-small-label{ font-weight:700; color:var(--muted); }
.kpi-small-value{ font-size:18px; font-weight:800; margin-top:2px; }

/* Band table */
.band-meta{ display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; color:var(--text); }
.band-meta .sep{ margin: 0 8px; color:var(--muted); }
.table-wrap{ overflow:auto; border:1px solid var(--border); border-radius:10px; }
.table{ border-collapse:separate; border-spacing:0; width:100%; min-width:520px; }
.table th, .table td{
  text-align:left; padding:10px 12px; border-bottom:1px solid var(--border); background:#fff; color:var(--text);
}
.table thead th{
  background:var(--thead-bg); color:var(--thead-text); position:sticky; top:0; z-index:1;
}
.table .idx{ width:48px; }
.table tr.active td{
  background:var(--row-active-bg);
  color:var(--row-active-text);
  font-weight:700;
}

/* Admin */
.admin textarea{
  width:100%; border:1px solid var(--border); border-radius:10px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  padding:10px 12px; color:var(--text); background:#fff;
}
.preview{
  background:#0b1220; color:#d1e7ff; padding:12px; border-radius:10px;
  overflow:auto; max-height:300px;
}

/* Footer */
.foot{ text-align:center; color:var(--muted); margin: 12px 0 24px; }

/* Small bits */
.small{ font-size:.95rem; }
.muted{ color:var(--muted); }

/* Accessibility: focus & reduced motion */
:focus-visible{ outline:3px solid var(--focus); outline-offset:3px; border-radius:6px; }
@media (prefers-reduced-motion: reduce){ *{ transition:none !important; animation:none !important; } }

/* ---------- High contrast toggle (light + dark OS) ---------- */
body.hc{
  --bg:#FFFFFF; --panel:#FFFFFF; --text:#0A0A0A; --muted:#1F2937; --border:#7D848A;
  --note-bg:#FFF0D8; --note-border:#E08B2C;
  --warn-bg:#FDE8E8; --warn-border:#F08A8A;
  --thead-bg:#E7EFEA; --thead-text:#0A2D23;
  --row-active-bg:#D9EFE6; --row-active-text:#0A0A0A;
}
@media (prefers-color-scheme: dark){
  body.hc{
    --bg:#0A0A0A; --panel:#0A0A0A; --text:#FFFFFF; --muted:#E5E7EB; --border:#6B7280;
    --note-bg:#1F2A22; --note-border:#3F7A62;
    --warn-bg:#2A1C1C; --warn-border:#A05050;
    --thead-bg:#111716; --thead-text:#D6EFE6;
    --row-active-bg:#0F2F26; --row-active-text:#FFFFFF;
  }
}

/* ---------- Auto dark mode (without HC) ---------- */
@media (prefers-color-scheme: dark){
  :root{
    --bg:#0f1214;
    --panel:#121618;
    --text:#EDEFF1;
    --muted:#C7CFD6;          /* brighter muted for readability */
    --border:#2C343A;

    --note-bg:#1E2A24;        /* dark, green-tinted */
    --note-border:#3E6B5A;

    --warn-bg:#2B1A1A;
    --warn-border:#9F3131;

    --thead-bg:#1A2420;
    --thead-text:#D6EFE6;

    --row-active-bg:#0F2F26;  /* dark green */
    --row-active-text:#EDEFF1;

    --badge-bg:#0f1214;
  }

  .las-header{ color:#fff; }
  .table thead th{ background:var(--thead-bg); color:var(--thead-text); }
  .kpi, .result-row.alt > div, .table td{ background:#0f1214; color:var(--text); }
}

/* ---------- Responsive ---------- */
@media (max-width: 720px){
  .grid{ grid-template-columns: 1fr; }
  .helper-grid{ grid-template-columns: 1fr; }
  .result-row, .result-row.alt{ grid-template-columns: 1fr; }
}
