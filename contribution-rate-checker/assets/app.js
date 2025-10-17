/* LAS Contribution Rate Checker
   ----------------------------------------------------
   - Renders a full app inside <div id="app"></div> (creates one if missing)
   - Officer Types A–D logic + role-change warning
   - Band is set from WTE "tiering pay" (officers/practice staff rules)
   - Contributions estimated from actual annual pensionable pay
   - Bands included: 2015/16 → 2021/22 (legacy), 2022/23 (Apr–Sep legacy),
     2022/23 (Oct–Mar new), 2023/24, 2024/25, 2025/26
   - Admin override: add ?admin=1 to paste a new year's bands (saved to this browser)
   - Neurodivergent-friendly behaviours (focus, reduced motion)
*/

(function () {
  // ---------- Helpers ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // Make sure a container exists (safer if script isn't deferred)
  let app = document.getElementById("app");
  if (!app) {
    app = document.createElement("div");
    app.id = "app";
    document.body.prepend(app);
  }

  const currency = (n) =>
    isFinite(n) ? Number(n).toLocaleString("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 2 }) : "—";

  const pct = (n) => {
    if (!isFinite(n)) return "—";
    const p = n * 100;
    return (p % 1 === 0 ? p.toFixed(0) : p.toFixed(1)) + "%";
  };

  const num = (v) => {
    if (typeof v === "number") return v;
    if (!v) return 0;
    return parseFloat(String(v).replace(/[,\s£]/g, "")) || 0;
  };

  // Determine scheme year display like "2025/26"
  function schemeYearFromDate(d = new Date()) {
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    if (m >= 4) return `${y}/${String((y + 1) % 100).padStart(2, "0")}`;
    return `${y - 1}/${String(y % 100).padStart(2, "0")}`;
  }

  // ---------- Rate tables ----------
  // Legacy 7-band (used 2015/16 → 2021/22 and 2022/23 Apr–Sep)
  const LEGACY_2015_TO_2022 = [
    { lower: 0,       upper: 15431.99, rate: 0.05  },
    { lower: 15432,   upper: 21477.99, rate: 0.056 },
    { lower: 21478,   upper: 26823.99, rate: 0.071 },
    { lower: 26824,   upper: 47845.99, rate: 0.093 },
    { lower: 47846,   upper: 70630.99, rate: 0.125 },
    { lower: 70631,   upper: 111376.99, rate: 0.135 },
    { lower: 111377,  upper: 9999999.99, rate: 0.145 },
  ];

  // New multi-band from Oct-2022 (we use 2023/24 published table for 22/23 Oct–Mar)
  const NEW_2023_24 = [
    { lower: 0,     upper: 13246.99, rate: 0.051 },
    { lower: 13247, upper: 17673.99, rate: 0.057 },
    { lower: 17674, upper: 24022.99, rate: 0.061 },
    { lower: 24023, upper: 25146.99, rate: 0.068 },
    { lower: 25147, upper: 29635.99, rate: 0.077 },
    { lower: 29636, upper: 30638.99, rate: 0.088 },
    { lower: 30639, upper: 45996.99, rate: 0.098 },
    { lower: 45997, upper: 51708.99, rate: 0.100 },
    { lower: 51709, upper: 58972.99, rate: 0.116 },
    { lower: 58973, upper: 75632.99, rate: 0.125 },
    { lower: 75633, upper: 9999999.99, rate: 0.135 },
  ];

  // 2024/25
  const TABLE_2024_25 = [
    { lower: 0,     upper: 13259.99, rate: 0.052 },
    { lower: 13260, upper: 27288.99, rate: 0.065 },
    { lower: 27289, upper: 33247.99, rate: 0.083 },
    { lower: 33248, upper: 49913.99, rate: 0.098 },
    { lower: 49914, upper: 63994.99, rate: 0.107 },
    { lower: 63995, upper: 9999999.99, rate: 0.125 },
  ];

  // 2025/26
  const TABLE_2025_26 = [
    { lower: 0,     upper: 13259.99, rate: 0.052 },
    { lower: 13260, upper: 27797.99, rate: 0.065 },
    { lower: 27798, upper: 33868.99, rate: 0.083 },
    { lower: 33869, upper: 50845.99, rate: 0.098 },
    { lower: 50846, upper: 65190.99, rate: 0.107 },
    { lower: 65191, upper: 9999999.99, rate: 0.125 },
  ];

  // Build base map with explicit years
  const RATE_TABLES_BASE = {
    "2015/16": LEGACY_2015_TO_2022,
    "2016/17": LEGACY_2015_TO_2022,
    "2017/18": LEGACY_2015_TO_2022,
    "2018/19": LEGACY_2015_TO_2022,
    "2019/20": LEGACY_2015_TO_2022,
    "2020/21": LEGACY_2015_TO_2022,
    "2021/22": LEGACY_2015_TO_2022,
    "2022/23 (Apr–Sep)": LEGACY_2015_TO_2022,
    "2022/23 (Oct–Mar)": NEW_2023_24,
    "2023/24": NEW_2023_24,
    "2024/25": TABLE_2024_25,
    "2025/26": TABLE_2025_26,
  };

  // Optional browser-side override via Admin panel
  function loadRateOverrides() {
    try {
      const raw = localStorage.getItem("las_rate_tables_override");
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }
  const RATE_TABLES = { ...RATE_TABLES_BASE, ...loadRateOverrides() };

  // Custom sort so split 2022/23 halves order correctly
  function yearSortKey(label) {
    // Examples: "2025/26", "2022/23 (Apr–Sep)", "2022/23 (Oct–Mar)"
    const m = label.match(/^(\d{4})\/(\d{2})(?:\s*\((Apr–Sep|Oct–Mar)\))?$/);
    if (!m) return { y: 0, half: 0 };
    const y = parseInt(m[1], 10); // start year
    let half = 2; // default full year
    if (m[3] === "Apr–Sep") half = 1;
    if (m[3] === "Oct–Mar") half = 2; // comes after Apr–Sep in the same scheme year
    return { y, half };
  }
  const years = Object.keys(RATE_TABLES).sort((a, b) => {
    const ka = yearSortKey(a), kb = yearSortKey(b);
    if (ka.y !== kb.y) return ka.y - kb.y;
    return ka.half - kb.half;
  });

  const defaultYear = (() => {
    const y = schemeYearFromDate();
    // If current year exists, pick it; otherwise latest available
    const match = years.findLast ? years.findLast(x => x.startsWith(y)) : years.filter(x=>x.startsWith(y)).pop();
    return match || years[years.length - 1];
  })();

  const url = new URL(window.location.href);
  const showAdmin = url.searchParams.get("admin") === "1";

  // ---------- Officer Types A–D ----------
  // A = Standard (use previous-year WTE for tiering)
  // B = Multiple employments (aggregate – flag only here)
  // C = Material change expected to last ≥12 months (use current-year WTE)
  // D = New starter (use current-year WTE)
  function getOfficerType(flags) {
    const { isNewStarter, hasMultiplePosts, hasMaterialChange } = flags;
    if (isNewStarter) return "D";
    if (hasMultiplePosts) return "B";
    if (hasMaterialChange) return "C";
    return "A";
  }
  function getTieringPay(officerType, prevYearWTE, estCurrentYearWTE) {
    return (officerType === "C" || officerType === "D") ? estCurrentYearWTE || 0 : prevYearWTE || 0;
  }

  // WTE helper
  function computeWTEBasic({ annualBasicAtYourHours, yourWeeklyHours, contractWeeklyHours = 37.5 }) {
    const a = num(annualBasicAtYourHours), h = num(yourWeeklyHours), c = num(contractWeeklyHours) || 37.5;
    if (a <= 0 || h <= 0 || c <= 0) return 0;
    return a * (c / h);
  }

  // Band lookup
  function findBandForYear(year, wteTieringPay) {
    const table = RATE_TABLES[year];
    if (!table) return null;
    return table.find(b => wteTieringPay >= b.lower && wteTieringPay <= b.upper) || null;
  }

  // ---------- UI ----------
  app.innerHTML = `
    <div class="las-wrap">
      <header class="las-header">
        <div class="title">
          <h1>LAS Contribution Rate Checker</h1>
          <p class="sub">Estimate your NHS Pension <em>member</em> contribution rate and costs</p>
        </div>
        <div class="toggles">
          <label class="hc-toggle">
            <input type="checkbox" id="hcToggle" aria-label="Enable high contrast"> High contrast
          </label>
        </div>
      </header>

      <section class="las-panel" aria-labelledby="inputsTitle">
        <h2 id="inputsTitle" class="panel-title">Inputs</h2>

        <div class="grid">
          <label class="form-row">
            <span>Scheme year</span>
            <select id="yearSel" aria-label="Scheme year">
              ${years.map(y => `<option value="${y}" ${y===defaultYear?'selected':''}>${y}</option>`).join('')}
            </select>
          </label>

          <fieldset class="form-row flags">
            <legend>Officer flags</legend>
            <label><input type="checkbox" id="isNewStarter"> New starter this scheme year</label>
            <label><input type="checkbox" id="hasMaterialChange"> Role/pay pattern changed (likely ≥ 12 months)</label>
            <label><input type="checkbox" id="hasMultiplePosts"> Multiple concurrent LAS employments</label>
            <details class="hint">
              <summary>What are Officer Types A–D?</summary>
              <ul>
                <li><strong>A</strong> – Standard officers/practice staff: tier from <em>previous year’s</em> WTE.</li>
                <li><strong>B</strong> – Multiple employments: aggregate for tiering (speak to Pensions).</li>
                <li><strong>C</strong> – Material change ≥12 months: tier from <em>current-year</em> WTE.</li>
                <li><strong>D</strong> – New starter: tier from <em>current-year</em> WTE.</li>
              </ul>
            </details>
          </fieldset>

          <label class="form-row">
            <span>Previous year WTE basic (£) <em class="muted">(Types A/B)</em></span>
            <input id="prevWte" type="text" inputmode="decimal" placeholder="e.g. £38,000">
          </label>

          <label class="form-row">
            <span>Current-year WTE basic (£) <em class="muted">(Types C/D)</em></span>
            <input id="currWte" type="text" inputmode="decimal" placeholder="e.g. 39,500">
          </label>

          <label class="form-row">
            <span>Annual pensionable pay (actual/estimated) (£)</span>
            <input id="annualActual" type="text" inputmode="decimal" placeholder="e.g. 28,400">
            <small class="help">Used to estimate yearly/monthly employee contributions. Include unsocial hours etc.</small>
          </label>
        </div>

        <details class="helper">
          <summary>Need help working out your WTE?</summary>
          <div class="helper-grid">
            <label class="form-row">
              <span>Your basic annual salary at your hours (£)</span>
              <input id="helpAnnualAtYourHours" type="text" inputmode="decimal">
            </label>
            <label class="form-row">
              <span>Your weekly hours</span>
              <input id="helpYourHours" type="text" inputmode="decimal" placeholder="e.g. 30">
            </label>
            <label class="form-row">
              <span>Contract WTE hours</span>
              <input id="helpContractHours" type="text" inputmode="decimal" value="37.5">
            </label>
          </div>
          <div class="helper-actions">
            <button class="btn" id="btnComputeWTE">Compute WTE</button>
            <span id="wteOut" class="calced" aria-live="polite"></span>
          </div>
        </details>

        <div class="actions">
          <button class="btn primary" id="btnCalc">Calculate</button>
          <button class="btn" id="btnReset">Reset</button>
        </div>

        <div class="note role-change" role="note">
          <div class="note-icon" aria-hidden="true">ℹ️</div>
          <div>
            <strong>Note on role changes:</strong>
            If you’ve changed job/role, started a concurrent post, or your working pattern changed in a way likely to last 12+ months, your contribution <em>rate may change</em> during the year.
          </div>
        </div>
      </section>

      <section class="las-panel" aria-labelledby="resultTitle">
        <h2 id="resultTitle" class="panel-title">Result</h2>
        <div id="result" class="result">
          <p class="muted">Enter values above and click <strong>Calculate</strong>.</p>
        </div>
      </section>

      <section class="las-panel" aria-labelledby="bandsTitle">
        <h2 id="bandsTitle" class="panel-title">Band table</h2>
        <div id="bandTable" class="band-table" aria-live="polite"></div>
      </section>

      ${showAdmin ? `
      <section class="las-panel admin" aria-labelledby="adminTitle">
        <h2 id="adminTitle" class="panel-title">Admin: import/override year bands</h2>
        <p class="muted">Paste JSON like: <code>{"2026/27":[{"lower":0,"upper":14000,"rate":0.05}, ...]}</code></p>
        <textarea id="adminJson" rows="8" spellcheck="false" placeholder='{"2026/27":[...]}'></textarea>
        <div class="actions">
          <button class="btn" id="btnPreviewJSON">Preview</button>
          <button class="btn primary" id="btnImportJSON">Import (save to this browser)</button>
          <button class="btn danger" id="btnClearJSON">Clear override</button>
        </div>
        <pre id="adminPreview" class="preview" aria-live="polite"></pre>
      </section>
      ` : ``}

      <footer class="foot">
        <p>LAS Pensions • This tool is an estimate only and does not replace official figures from NHS Pensions.</p>
      </footer>
    </div>
  `;

  // ---------- Events ----------
  $("#hcToggle").addEventListener("change", (e) => {
    document.body.classList.toggle("hc", e.target.checked);
  });

  $("#btnReset").addEventListener("click", () => {
    ["prevWte","currWte","annualActual","helpAnnualAtYourHours","helpYourHours","helpContractHours"].forEach(id => {
      const el = $("#" + id); if (el) el.value = "";
    });
    ["isNewStarter","hasMaterialChange","hasMultiplePosts"].forEach(id => { const cb=$("#"+id); if(cb) cb.checked=false; });
    $("#wteOut").textContent = "";
    $("#result").innerHTML = `<p class="muted">Enter values above and click <strong>Calculate</strong>.</p>`;
    renderBands();
  });

  $("#btnComputeWTE").addEventListener("click", () => {
    const wte = computeWTEBasic({
      annualBasicAtYourHours: $("#helpAnnualAtYourHours").value,
      yourWeeklyHours: $("#helpYourHours").value,
      contractWeeklyHours: $("#helpContractHours").value || 37.5
    });
    $("#wteOut").textContent = wte ? `WTE basic ≈ ${currency(wte)}` : "Please enter valid numbers above.";
  });

  $("#btnCalc").addEventListener("click", () => calculateAndRender());

  if (showAdmin) {
    $("#btnPreviewJSON").addEventListener("click", () => {
      const t = $("#adminJson").value.trim();
      try { $("#adminPreview").textContent = JSON.stringify(JSON.parse(t), null, 2); }
      catch { $("#adminPreview").textContent = "Invalid JSON."; }
    });
    $("#btnImportJSON").addEventListener("click", () => {
      try {
        const obj = JSON.parse($("#adminJson").value.trim());
        localStorage.setItem("las_rate_tables_override", JSON.stringify(obj));
        alert("Imported. Reload the page to apply.");
      } catch { alert("Invalid JSON."); }
    });
    $("#btnClearJSON").addEventListener("click", () => {
      localStorage.removeItem("las_rate_tables_override");
      alert("Override cleared. Reload to revert to defaults.");
    });
  }

  // Re-render highlight when inputs toggle
  ["yearSel","prevWte","currWte","isNewStarter","hasMaterialChange","hasMultiplePosts"].forEach(id => {
    const el = $("#"+id);
    if (el) { el.addEventListener("input", renderBands); el.addEventListener("change", renderBands); }
  });

  // ---------- Rendering ----------
  function renderBands() {
    const year = $("#yearSel").value;
    const table = RATE_TABLES[year] || [];
    const flags = {
      isNewStarter: $("#isNewStarter").checked,
      hasMultiplePosts: $("#hasMultiplePosts").checked,
      hasMaterialChange: $("#hasMaterialChange").checked
    };
    const officerType = getOfficerType(flags);
    const prevWte = num($("#prevWte").value);
    const currWte = num($("#currWte").value);
    const tieringPay = getTieringPay(officerType, prevWte, currWte);

    const rows = table.map((b, idx) => {
      const active = tieringPay >= b.lower && tieringPay <= b.upper;
      return `
        <tr class="${active ? "active" : ""}">
          <td class="idx">${idx + 1}</td>
          <td>${currency(b.lower)} – ${currency(b.upper)}</td>
          <td>${pct(b.rate)}</td>
          <td class="when">${active ? "✓ Applies" : ""}</td>
        </tr>
      `;
    }).join("");

    $("#bandTable").innerHTML = `
      <div class="band-meta">
        <div>
          <span class="badge">Type ${officerType}</span>
          <span class="sep">·</span>
          <span class="muted">Tiering pay used:</span>
          <strong>${currency(tieringPay)}</strong>
        </div>
        <div class="muted">Year: <strong>${year}</strong></div>
      </div>
      <div class="table-wrap" role="region" aria-label="Contribution bands for ${year}" tabindex="0">
        <table class="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Pensionable pay range (WTE)</th>
              <th>Rate</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }

  function calculateAndRender() {
    const year = $("#yearSel").value;
    const flags = {
      isNewStarter: $("#isNewStarter").checked,
      hasMultiplePosts: $("#hasMultiplePosts").checked,
      hasMaterialChange: $("#hasMaterialChange").checked
    };
    const officerType = getOfficerType(flags);
    const prevWte = num($("#prevWte").value);
    const currWte = num($("#currWte").value);
    const tieringPay = getTieringPay(officerType, prevWte, currWte);

    const band = findBandForYear(year, tieringPay);
    if (!band) {
      $("#result").innerHTML = `
        <div class="warn">
          <div class="warn-icon" aria-hidden="true">⚠️</div>
          <div>
            <strong>We couldn’t determine a band for the inputs provided.</strong>
            <p>Check the scheme year and your WTE values. You can also try the WTE helper below.</p>
          </div>
        </div>
      `;
      renderBands();
      return;
    }

    const annualActual = num($("#annualActual").value);
    const estYearly = annualActual * band.rate;
    const estMonthly = estYearly / 12;

    $("#result").innerHTML = `
      <div class="result-row">
        <div class="kpi">
          <div class="kpi-label">Employee rate</div>
          <div class="kpi-value">${pct(band.rate)}</div>
        </div>
        <div class="kpi">
          <div class="kpi-label">Officer Type</div>
          <div class="kpi-value"><span class="badge">Type ${officerType}</span></div>
        </div>
        <div class="kpi">
          <div class="kpi-label">Tiering pay used</div>
          <div class="kpi-value">${currency(tieringPay)}</div>
        </div>
      </div>

      <div class="result-row alt">
        <div>
          <div class="kpi-small-label">Est. annual pensionable pay (actual)</div>
          <div class="kpi-small-value">${currency(annualActual)}</div>
        </div>
        <div>
          <div class="kpi-small-label">Est. yearly employee contributions</div>
          <div class="kpi-small-value">${currency(estYearly)}</div>
        </div>
        <div>
          <div class="kpi-small-label">Est. monthly employee contributions</div>
          <div class="kpi-small-value">${currency(estMonthly)}</div>
        </div>
      </div>

      <p class="small muted">
        Band for ${year}: ${currency(band.lower)} – ${currency(band.upper)} at ${pct(band.rate)}.
        This tool is an estimate only and does not replace official figures from NHS Pensions.
      </p>
    `;

    renderBands();
  }

  // Initial render
  renderBands();
})();
