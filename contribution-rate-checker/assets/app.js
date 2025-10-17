/* LAS Contribution Rate Checker (staff-friendly, 2025-10)
   --------------------------------------------------------
   - Legacy years (to 30 Sep 2022): band uses WTE pensionable pay
   - From 1 Oct 2022 onward: band uses actual annualised pensionable pay
   - Estimates employee contributions from actual annual pensionable pay
   - Years included: 2015/16 → 2021/22, 2022/23 (Apr–Sep), 2022/23 (Oct–Mar),
     2023/24, 2024/25, 2025/26
   - Info toggle under the annual pay input links to NHSBSA FAQ (KA-04362)
   - Admin override: add ?admin=1 and paste JSON for future years (browser-local)
*/

(function () {
  // ---------- tiny DOM helpers ----------
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  // Ensure a mount point exists
  var app = document.getElementById("app");
  if (!app) { app = document.createElement("div"); app.id = "app"; document.body.prepend(app); }

  // ---------- format & parse ----------
  function currency(n) {
    return isFinite(n) ? Number(n).toLocaleString("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 2 }) : "—";
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
  // Legacy (used up to 30 Sep 2022)
  var LEGACY_2015_TO_2022 = [
    { lower: 0,      upper: 15431.99,   rate: 0.05  },
    { lower: 15432,  upper: 21477.99,   rate: 0.056 },
    { lower: 21478,  upper: 26823.99,   rate: 0.071 },
    { lower: 26824,  upper: 47845.99,   rate: 0.093 },
    { lower: 47846,  upper: 70630.99,   rate: 0.125 },
    { lower: 70631,  upper: 111376.99,  rate: 0.135 },
    { lower: 111377, upper: 9999999.99, rate: 0.145 }
  ];

  // 2023/24 (also applies for 2022/23 Oct–Mar)
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

  // 2024/25
  var TABLE_2024_25 = [
    { lower: 0,     upper: 13259.99,   rate: 0.052 },
    { lower: 13260, upper: 27288.99,   rate: 0.065 },
    { lower: 27289, upper: 33247.99,   rate: 0.083 },
    { lower: 33248, upper: 49913.99,   rate: 0.098 },
    { lower: 49914, upper: 63994.99,   rate: 0.107 },
    { lower: 63995, upper: 9999999.99, rate: 0.125 }
  ];

  // 2025/26
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

  // Split-year ordering
  function yearSortKey(label) {
    var m = label.match(/^(\d{4})\/(\d{2})(?:\s*\(([^)]+)\))?$/);
    if (!m) return { y: 0, half: 0 };
    var y = parseInt(m[1], 10), half = 2;
    var h = (m[3] || "").toLowerCase();
    if (h.indexOf("apr") === 0) half = 1; // Apr–Sep before Oct–Mar
    return { y: y, half: half };
  }
  var years = Object.keys(RATE_TABLES).sort(function (a, b) {
    var ka = yearSortKey(a), kb = yearSortKey(b);
    if (ka.y !== kb.y) return ka.y - kb.y;
    return ka.half - kb.half;
  });

  var currentSY = schemeYearFromDate();
  var defaultYear = (function () {
    for (var i = 0; i < years.length; i++) if (years[i].indexOf(currentSY) ===
