/* LAS Contribution Rate Checker (staff-friendly, resilient boot)
   ---------------------------------------------------------------
   - Legacy years (to 30 Sep 2022): band uses WTE pensionable pay
   - From 1 Oct 2022: band uses actual annualised pensionable pay
   - Estimates employee contributions from actual annual pensionable pay
   - Years: 2015/16 → 2021/22, 2022/23 (Apr–Sep), 2022/23 (Oct–Mar), 2023/24, 2024/25, 2025/26
   - Admin override: add ?admin=1 and paste JSON (saved locally)
*/

(function () {
  // Version flag for quick debug in console
  window.LAS_CRC_VERSION = "v2025-10-20f";

  // ---------- helpers ----------
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function currency(n) {
    return isFinite(n)
      ? Number(n).toLocaleString("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 2 })
      : "—";
  }
  function pct(n) {
    if (!isFinite(n)) return "—";
    var p = n * 100;
    return (p % 1 === 0 ? p.toFixed(0) : p.toFixed(1)) + "%";
  }
  function num(v) {
    if (typeof v === "number") return v;
    if (!v) return 0;
    return parseFloat(String(v).replace(/[£,\s]/g, "")) || 0;
  }
  function schemeYearFromDate(d) {
    d = d || new Date();
    var y = d.getFullYear(), m = d.getMonth() + 1;
    return (m >= 4) ? (y + "/" + String((y + 1) % 100).padStart(2, "0"))
                    : (y - 1 + "/" + String(y % 100).padStart(2, "0"));
  }

  // ---------- rate tables ----------
  var LEGACY_2015_TO_2022 = [
    { lower: 0,      upper: 15431.99,   rate: 0.05  },
    { lower: 15432,  upper: 21477.99,   rate: 0.056 },
    { lower: 21478,  upper: 26823.99,   rate: 0.071 },
    { lower: 26824,  upper: 47845.99,   rate: 0.093 },
    { lower: 47846,  upper: 70630.99,   rate: 0.125 },
    { lower: 70631,  upper: 111376.99,  rate: 0.135 },
    { lower: 111377, upper: 9999999.99, rate: 0.145 }
  ];

  var TABLE_2023_24 = [
    { lower: 0,     upper: 13246.99,   rate: 0.051 },
    { lower: 13247, upper: 17673.99,   rate: 0.057 },
    { lower: 17674, upper: 24022.99,   rate: 0.061 },
    { lower: 24023, upper: 25146.99,   rate: 0.068 },
    { lower: 25147, upper: 29635.99,   rate: 0.077 },
    { lower: 29636, upper: 30638.99,   rate: 0.088 },
    { lower: 30639, upper: 45996.99,   rate: 0.098 },
    { lower: 45997, upper: 51708.99,   rate: 0.100 },
    { lower: 51709, upper: 58972.99,   rate: 0.116 },
    { lower: 58973, upper: 75632.99,   rate: 0.125 },
    { lower: 75633, upper: 9999999.99, rate: 0.135 }
  ];

  var TABLE_2024_25 = [
    { lower: 0,     upper: 13259.99,   rate: 0.052 },
    { lower: 13260, upper: 27288.99,   rate: 0.065 },
    { lower: 27289, upper: 33247.99,   rate: 0.083 },
    { lower: 33248, upper: 49913.99,   rate: 0.098 },
    { lower: 49914, upper: 63994.99,   rate: 0.107 },
    { lower: 63995, upper: 9999999.99, rate: 0.125 }
  ];

  var TABLE_2025_26 = [
    { lower: 0,     upper: 13259.99,   rate: 0.052 },
    { lower: 13260, upper: 27797.99,   rate: 0.065 },
    { lower: 27798, upper: 33868.99,   rate: 0.083 },
    { lower: 33869, upper: 50845.99,   rate: 0.098 },
    { lower: 50846, upper: 65190.99,   rate: 0.107 },
    { lower: 65191, upper: 9999999.99, rate: 0.125 }
  ];

  var RATE_TABLES_BASE = {
    "2015/16": LEGACY_2015_TO_2022,
    "2016/17": LEGACY_2015_TO_2022,
    "2017/18": LEGACY_2015_TO_2022,
    "2018/19": LEGACY_2015_TO_2022,
    "2019/20": LEGACY_2015_TO_2022,
    "2020/21": LEGACY_2015_TO_2022,
    "2021/22": LEGACY_2015_TO_2022,
    "2022/23 (Apr–Sep)": LEGACY_2015_TO_2022,
    "2022/23 (Oct–Mar)": TABLE_2023_24,
    "2023/24": TABLE_2023_24,
    "2024/25": TABLE_2024_25,
    "2025/26": TABLE_2025_26
  };

  function loadRateOverrides() {
    try {
      var raw = localStorage.getItem("las_rate_tables_override");
      if (!raw) return {};
      var parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (e) { return {}; }
  }
  var RATE_TABLES = Object.assign({}, RATE_TABLES_BASE, loadRateOverrides());

  // Sorting for split-year labels (handles hyphen or en-dash)
  function yearSortKey(label) {
    var m = label.match(/^(\d{4})\/(\d{2})(?:\s*\((Apr[-–]Sep|Oct[-–]Mar)\))?$/);
    if (!m) return { y: 0, half: 0 };
    var y = parseInt(m[1], 10), half = 2;
    if (m[3] && m[3].indexOf("Apr") === 0) half = 1;
    return { y: y, half: half };
  }
  var years = Object.keys(RATE_TABLES).sort(function (a, b) {
    var ka = yearSortKey(a), kb = yearSortKey(b);
    if (ka.y !== kb.y) return ka.y - kb.y;
    return ka.half - kb.half;
  });

  var currentSY = schemeYearFromDate();
  var defaultYear = (function () {
    for (var i = 0; i < years.length; i++) if (years[i].indexOf(currentSY) === 0) return years[i];
    return years[years.length - 1];
  })();

  var url = new URL(window.location.href);
  var showAdmin = url.searchParams.get("admin") === "1";

  var LEGACY_SET = {
    "2015/16":1,"2016/17":1,"2017/18":1,"2018/19":1,"2019/20":1,"2020/21":1,"2021/22":1,
    "2022/23 (Apr–Sep)":1,"2022/23 (Apr-Sep)":1
  };
  function isLegacyYear(label){ return !!LEGACY_SET[label]; }

  // WTE helper
  function computeWTEBasic(o) {
    var a = num(o.annualBasicAtYourHours), h = num(o.yourWeeklyHours), c = num(o.contractWeeklyHours) || 37.5;
    if (a <= 0 || h <= 0 || c <= 0) return 0;
    return a * (c / h);
  }

  // Band lookup
  function findBandForYear(year, pay) {
    var table = RATE_TABLES[year];
    if (!table) return null;
    for (var i = 0; i < table.length; i++) {
      var b = table[i];
      if (pay >= b.lower && pay <= b.upper) return b;
    }
    return null;
  }

  // ---------- main init ----------
  function init() {
    var mount = document.getElementById("app");
    if (!mount) { mount = document.createElement("div"); mount.id = "app"; document.body.appendChild(mount); }

    // BUILD UI (Annual/Monthly ABOVE WTE)
    mount.innerHTML = ''
      + '<div class="las-wrap">'
      + '  <header class="las-header">'
      + '    <div class="title">'
      + '      <h1>LAS Contribution Rate Checker</h1>'
      + '      <p class="sub">Check your NHS Pension <em>member</em> contribution rate by scheme year.</p>'
      + '    </div>'
      + '    <div class="toggles">'
      + '      <label class="hc-toggle"><input type="checkbox" id="hcToggle" aria-label="Enable high contrast"> High contrast</label>'
      + '    </div>'
      + '  </header>'

      + '  <section class="las-panel" aria-labelledby="inputsTitle">'
      + '    <h2 id="inputsTitle" class="panel-title">Inputs</h2>'
      + '    <div class="grid">'

      + '      <label class="form-row"><span>Scheme year</span>'
      + '        <select id="yearSel" aria-label="Scheme year">'
      +            years.map(function (y) { return '<option value="'+y+'"' + (y===defaultYear?' selected':'') + '>'+y+'</option>'; }).join('')
      + '        </select>'
      + '      </label>'

      + '      <label class="form-row"><span>Pay input</span>'
      + '        <select id="payModeSel" aria-label="Pay input mode">'
      + '          <option value="annual" selected>Annual amount</option>'
      + '          <option value="monthly">Monthly amount</option>'
      + '        </select>'
      + '      </label>'

      + '      <label class="form-row" id="annualRow"><span>Annual pensionable pay (actual/annualised) (£)</span>'
      + '        <input id="annualPensionable" type="text" inputmode="decimal" placeholder="e.g. 28,400">'
      + '        <small class="help">Includes regular pensionable elements such as <strong>basic pay</strong> and <strong>High Cost Area Supplement (HCAS/London weighting)</strong>. Some enhancements may be pensionable; see the guidance below.</small>'
      + '      </label>'

      + '      <label class="form-row" id="monthlyRow" hidden><span>Monthly pensionable pay (£)</span>'
      + '        <input id="monthlyPensionable" type="text" inputmode="decimal" placeholder="e.g. 2,350">'
      + '        <small class="help">We’ll multiply by 12 and show the annual figure we used.</small>'
      + '        <div id="annualHint" class="help" hidden></div>'
      + '      </label>'

      + '      <label class="form-row" id="legacyWTERow" hidden><span>WTE pensionable pay (legacy years only) (£)</span>'
      + '        <input id="legacyWTE" type="text" inputmode="decimal" placeholder="e.g. 38,000">'
      + '        <small class="help">Used to set your contribution <em>band</em> for years before 1 Oct 2022.</small>'
      + '      </label>'

      + '    </div>'

      + '    <details class="helper" id="pensionableInfo"><summary>What counts as pensionable pay?</summary>'
      + '      <div class="helper-grid" style="grid-template-columns:1fr;">'
      + '        <div class="form-row" style="gap:.25rem;">'
      + '          <span style="font-weight:700">Typically pensionable for officers</span>'
      + '          <ul>'
      + '            <li>Basic pay and London weighting (HCAS).</li>'
      + '            <li>Certain regular paid leave (e.g., annual and paid sick leave).</li>'
      + '            <li>Some on-call/availability payments where there is a rota commitment.</li>'
      + '            <li>For part-time staff: overtime up to full-time standard hours at basic rate.</li>'
      + '          </ul>'
      + '          <span style="font-weight:700;margin-top:.25rem;">Not pensionable</span>'
      + '          <ul>'
      + '            <li>One-off payments, discretionary/bonus payments, or expenses.</li>'
      + '            <li>Overtime above the standard whole-time hours (and any enhanced-rate overtime for part-time).</li>'
      + '            <li>Payments in lieu (e.g., untaken leave), strike days, and salary sacrifice amounts.</li>'
      + '          </ul>'
      + '          <small class="help">This summary is not exhaustive. See NHSBSA <a href="https://faq.nhsbsa.nhs.uk/knowledgebase/article/KA-04362/en-us" target="_blank" rel="noopener">“What payments are pensionable?”</a> and follow your payroll guidance.</small>'
      + '        </div>'
      + '      </div>'
      + '    </details>'

      + '    <details class="helper" id="wteHelper" hidden><summary>Need help working out WTE? (legacy years)</summary>'
      + '      <div class="helper-grid">'
      + '        <label class="form-row"><span>Your basic annual salary at your hours (£)</span>'
      + '          <input id="helpAnnualAtYourHours" type="text" inputmode="decimal"></label>'
      + '        <label class="form-row"><span>Your weekly hours</span>'
      + '          <input id="helpYourHours" type="text" inputmode="decimal" placeholder="e.g. 30"></label>'
      + '        <label class="form-row"><span>Contract WTE hours</span>'
      + '          <input id="helpContractHours" type="text" inputmode="decimal" value="37.5"></label>'
      + '      </div>'
      + '      <div class="helper-actions"><button class="btn" id="btnComputeWTE">Compute WTE</button>'
      + '        <span id="wteOut" class="calced" aria-live="polite"></span></div>'
      + '    </details>'

      + '    <div class="actions"><button class="btn primary" id="btnCalc">Calculate</button>'
      + '      <button class="btn" id="btnReset">Reset</button></div>'

      + '    <div class="note role-change info-banner" role="note"><div class="note-icon" aria-hidden="true">ℹ️</div>'
      + '      <div><strong>Heads-up:</strong> Employers may set your rate using pay from a previous year if required by the rules. If your payslip shows a different rate, please follow your payroll guidance.</div>'
      + '    </div>'
      + '  </section>'

      + '  <section class="las-panel" aria-labelledby="resultTitle"><h2 id="resultTitle" class="panel-title">Result</h2>'
      + '    <div id="result" class="result"><p class="muted">Enter values above and click <strong>Calculate</strong>.</p></div>'
      + '  </section>'

      + '  <section class="las-panel" aria-labelledby="bandsTitle"><h2 id="bandsTitle" class="panel-title">Band table</h2>'
      + '    <div id="bandTable" class="band-table" aria-live="polite"></div>'
      + '  </section>'

      + (showAdmin ? (
          '  <section class="las-panel admin" aria-labelledby="adminTitle">'
        + '    <h2 id="adminTitle" class="panel-title">Admin: import/override year bands</h2>'
        + '    <p class="muted">Paste JSON like: <code>{"2026/27":[{"lower":0,"upper":14000,"rate":0.05}, ...]}</code></p>'
        + '    <textarea id="adminJson" rows="8" spellcheck="false" placeholder="{&quot;2026/27&quot;:[...]}"></textarea>'
        + '    <div class="actions"><button class="btn" id="btnPreviewJSON">Preview</button>'
        + '      <button class="btn primary" id="btnImportJSON">Import (save to this browser)</button>'
        + '      <button class="btn danger" id="btnClearJSON">Clear override</button></div>'
        + '    <pre id="adminPreview" class="preview" aria-live="polite"></pre>'
        + '  </section>'
        ) : '')

      + '  <footer class="foot"><p>LAS Pensions • This tool is an estimate only and does not replace official figures from NHS Pensions.</p></footer>'
      + '</div>';

    // ---------- behaviour ----------
    function syncLegacyVisibility() {
      var y = $("#yearSel").value;
      var legacy = isLegacyYear(y);
      $("#legacyWTERow").hidden = !legacy;
      $("#wteHelper").hidden = !legacy;
    }

    // Gets the annual actual/annualised pay based on the selected mode
    function getAnnualActual() {
      var modeEl = $("#payModeSel");
      var mode = modeEl ? modeEl.value : "annual";
      var annual = num($("#annualPensionable").value);
      if (mode === "monthly") {
        var m = num($("#monthlyPensionable").value);
        return m > 0 ? (m * 12) : annual; // fallback to annual if monthly empty
      }
      return annual;
    }

    // Show/hide annual vs monthly inputs and keep the hint in sync
    function updateAnnualHint() {
      var hint = $("#annualHint");
      if (!hint) return;
      var modeEl = $("#payModeSel");
      var mode = modeEl ? modeEl.value : "annual";
      if (mode !== "monthly") { hint.hidden = true; hint.textContent = ""; return; }
      var m = num($("#monthlyPensionable").value);
      if (m > 0) {
        hint.hidden = false;
        hint.textContent = "Using " + currency(m) + " × 12 = " + currency(m * 12) + " (annualised) for this calculation.";
      } else {
        hint.hidden = true;
        hint.textContent = "";
      }
    }

    function syncPayModeVisibility() {
      var modeEl = $("#payModeSel");
      if (!modeEl) return;
      var mode = modeEl.value;
      $("#annualRow").hidden  = (mode === "monthly");
      $("#monthlyRow").hidden = (mode !== "monthly");
      updateAnnualHint();
    }

    function tieringPayForUI() {
      var year = $("#yearSel").value;
      // Legacy years: bands use WTE only
      if (isLegacyYear(year)) return num($("#legacyWTE").value);
      // From 1 Oct 2022 onward: bands use actual annualised pensionable pay
      return getAnnualActual();
    }

    function renderBands() {
      var year = $("#yearSel").value;
      var table = RATE_TABLES[year] || [];
      var pay = tieringPayForUI();

      var rows = table.map(function (b, idx) {
        var active = pay >= b.lower && pay <= b.upper;
        return ''
          + '<tr class="' + (active ? 'active' : '') + '">'
          +   '<td class="idx">' + (idx + 1) + '</td>'
          +   '<td>' + currency(b.lower) + ' – ' + currency(b.upper) + '</td>'
          +   '<td>' + pct(b.rate) + '</td>'
          +   '<td class="when">' + (active ? '✓ Applies' : '') + '</td>'
          + '</tr>';
      }).join("");

      $("#bandTable").innerHTML = ''
        + '<div class="band-meta">'
        +   '<div><span class="muted">Tiering pay used:</span> <strong>' + currency(pay) + '</strong></div>'
        +   '<div class="muted">Year: <strong>' + year + '</strong></div>'
        + '</div>'
        + '<div class="table-wrap" role="region" aria-label="Contribution bands for ' + year + '" tabindex="0">'
        +   '<table class="table"><thead><tr>'
        +     '<th>#</th><th>Pensionable pay range (WTE/Actual)*</th><th>Rate</th><th>Status</th>'
        +   '</tr></thead><tbody>' + rows + '</tbody></table>'
        + '</div>'
        + '<p class="small muted">* For legacy years (to 30 Sep 2022) bands use <em>WTE</em>. From 1 Oct 2022 onward, bands use <em>actual annualised pensionable pay</em>.</p>';
    }

    function calculateAndRender() {
      var year = $("#yearSel").value;
      var payForBand = tieringPayForUI();
      var band = findBandForYear(year, payForBand);

      if (!band) {
        $("#result").innerHTML = ''
          + '<div class="warn"><div class="warn-icon" aria-hidden="true">⚠️</div>'
          + '<div><strong>We couldn’t determine a band for the inputs provided.</strong>'
          + '<p>Check the scheme year and your pay inputs. Use the WTE helper for legacy years.</p></div></div>';
        renderBands();
        return;
      }

      var annualActual = getAnnualActual();
      var usingMonthly = ($("#payModeSel") && $("#payModeSel").value === "monthly");
      var enteredMonthly = num($("#monthlyPensionable") ? $("#monthlyPensionable").value : "");

      var estYearly = annualActual * band.rate;
      var estMonthly = estYearly / 12;

      $("#result").innerHTML = ''
        + '<div class="result-row">'
        +   '<div class="kpi"><div class="kpi-label">Employee rate</div><div class="kpi-value">' + pct(band.rate) + '</div></div>'
        +   '<div class="kpi"><div class="kpi-label">Tiering pay used</div><div class="kpi-value">' + currency(payForBand) + '</div></div>'
        +   '<div class="kpi"><div class="kpi-label">Year selected</div><div class="kpi-value">' + year + '</div></div>'
        + '</div>'
        + '<div class="result-row alt">'
        +   '<div><div class="kpi-small-label">Annual pensionable pay (actual/annualised)</div><div class="kpi-small-value">' + currency(annualActual) + '</div></div>'
        +   '<div><div class="kpi-small-label">Est. yearly employee contributions</div><div class="kpi-small-value">' + currency(estYearly) + '</div></div>'
        +   '<div><div class="kpi-small-label">Est. monthly employee contributions</div><div class="kpi-small-value">' + currency(estMonthly) + '</div></div>'
        + '</div>'
        + '<p class="small muted">Band for ' + year + ': ' + currency(band.lower) + ' – ' + currency(band.upper) + ' at ' + pct(band.rate) + '.</p>'
        + (usingMonthly ? '<p class="small muted">You entered monthly ' + currency(enteredMonthly) + '; annualised to ' + currency(annualActual) + ' for this calculation.</p>' : '');

      renderBands();
    }

    // ---------- event wiring & initial render ----------
    syncLegacyVisibility();
    syncPayModeVisibility();

    $("#hcToggle").addEventListener("change", function (e) {
      document.body.classList.toggle("hc", e.target.checked);
    });

    $("#yearSel").addEventListener("change", function () {
      syncLegacyVisibility();
      renderBands();
    });

    $("#btnReset").addEventListener("click", function () {
      ["legacyWTE","annualPensionable","monthlyPensionable","helpAnnualAtYourHours","helpYourHours","helpContractHours"]
        .forEach(function(id){ var el=$("#"+id); if(el) el.value=""; });
      $("#wteOut").textContent = "";
      updateAnnualHint();
      $("#result").innerHTML = '<p class="muted">Enter values above and click <strong>Calculate</strong>.</p>';
      renderBands();
    });

    $("#btnComputeWTE").addEventListener("click", function () {
      var wte = computeWTEBasic({
        annualBasicAtYourHours: $("#helpAnnualAtYourHours").value,
        yourWeeklyHours: $("#helpYourHours").value,
        contractWeeklyHours: $("#helpContractHours").value || 37.5
      });
      $("#wteOut").textContent = wte ? ("WTE basic ≈ " + currency(wte)) : "Please enter valid numbers above.";
    });

    $("#btnCalc").addEventListener("click", function () { calculateAndRender(); });

    if (showAdmin) {
      $("#btnPreviewJSON").addEventListener("click", function () {
        var t = $("#adminJson").value.trim();
        try { $("#adminPreview").textContent = JSON.stringify(JSON.parse(t), null, 2); }
        catch (e) { $("#adminPreview").textContent = "Invalid JSON."; }
      });
      $("#btnImportJSON").addEventListener("click", function () {
        try {
          var obj = JSON.parse($("#adminJson").value.trim());
          localStorage.setItem("las_rate_tables_override", JSON.stringify(obj));
          alert("Imported. Reload the page to apply.");
        } catch (e) { alert("Invalid JSON."); }
      });
      $("#btnClearJSON").addEventListener("click", function () {
        localStorage.removeItem("las_rate_tables_override");
        alert("Override cleared. Reload to revert to defaults.");
      });
    }

    // Live updates when typing
    ["legacyWTE","annualPensionable","monthlyPensionable"].forEach(function (id) {
      var el = $("#"+id);
      if (el) {
        el.addEventListener("input", function(){ if(id==="monthlyPensionable") updateAnnualHint(); renderBands(); });
        el.addEventListener("change", function(){ if(id==="monthlyPensionable") updateAnnualHint(); renderBands(); });
      }
    });

    // Pay mode & monthly field events
    var payModeEl = $("#payModeSel");
    if (payModeEl) {
      payModeEl.addEventListener("change", function () {
        syncPayModeVisibility();
        renderBands();
      });
    }
    var mEl = $("#monthlyPensionable");
    if (mEl) {
      mEl.addEventListener("input", function () { updateAnnualHint(); renderBands(); });
      mEl.addEventListener("change", function () { updateAnnualHint(); renderBands(); });
    }

    // First render
    renderBands();
    console.log("LAS CRC loaded:", window.LAS_CRC_VERSION);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
