
(function(){
  const DEFAULT_YEARS = [
    { label: "2015/16", yearEnd: 2016, ara: 0.014, pay: 0 },
    { label: "2016/17", yearEnd: 2017, ara: 0.025, pay: 0 },
    { label: "2017/18", yearEnd: 2018, ara: 0.045, pay: 0 },
    { label: "2018/19", yearEnd: 2019, ara: 0.039, pay: 0 },
    { label: "2019/20", yearEnd: 2020, ara: 0.032, pay: 0 },
    { label: "2020/21", yearEnd: 2021, ara: 0.020, pay: 0 },
    { label: "2021/22", yearEnd: 2022, ara: 0.046, pay: 0 },
    { label: "2022/23", yearEnd: 2023, ara: 0.116, pay: 0 },
    { label: "2023/24", yearEnd: 2024, ara: 0.082, pay: 0 },
    { label: "2024/25", yearEnd: 2025, ara: 0.032, pay: 0 },
    { label: "2025/26", yearEnd: 2026, ara: 0.000, pay: 29476.78 }
  ];

  const DEFAULT_ARA = {
    "2016": 0.014, "2017": 0.025, "2018": 0.045, "2019": 0.039, "2020": 0.032,
    "2021": 0.020, "2022": 0.046, "2023": 0.116, "2024": 0.082, "2025": 0.032, "2026": 0.000
  };
  const DEFAULT_ARER = { "0": 1.0000 };

  const el = sel => document.querySelector(sel);
  const els = sel => Array.from(document.querySelectorAll(sel));
  const money = n => (isNaN(n) || !isFinite(n)) ? '£0.00' : new Intl.NumberFormat('en-GB', { style:'currency', currency:'GBP' }).format(n);

  const state = {
    years: DEFAULT_YEARS.map(y => ({...y})),
    araTable: loadARA(),
    arerTable: loadARER(),
    theme: 'system',
    compact: false
  };

  // Tabs
  els('.tab').forEach(btn => btn.addEventListener('click', () => {
    els('.tab').forEach(b => b.classList.remove('active'));
    els('.panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    el(`#panel-${btn.dataset.tab}`).classList.add('active');
  }));

  // ARA persistence
  function loadARA(){ try { const j = localStorage.getItem('nhs_care_ara'); return j ? JSON.parse(j) : DEFAULT_ARA; } catch { return DEFAULT_ARA; } }
  function saveARA(){ localStorage.setItem('nhs_care_ara', JSON.stringify(state.araTable)); }
  function applyARAtoYears(){ state.years.forEach(y => y.ara = state.araTable[y.yearEnd] ?? y.ara ?? 0); }

  // ARER persistence
  function loadARER(){ try { const j = localStorage.getItem('nhs_care_arer'); return j ? JSON.parse(j) : DEFAULT_ARER; } catch { return DEFAULT_ARER; } }
  function saveARER(){ localStorage.setItem('nhs_care_arer', JSON.stringify(state.arerTable)); }

  // Calculator
  const tbody = el('#tbody');
  function renderCalcRows(){
    tbody.innerHTML = '';
    state.years.forEach((y, i) => {
      const tr = document.createElement('tr');

      const td0 = document.createElement('td'); td0.className='center';
      const yearInput = document.createElement('input'); yearInput.type='text'; yearInput.value=y.label; yearInput.className='center';
      yearInput.addEventListener('change', e=>{ y.label = e.target.value; });
      td0.appendChild(yearInput);

      const td1 = document.createElement('td'); td1.className='center';
      const ye = document.createElement('input'); ye.type='text'; ye.value=`31/03/${y.yearEnd}`; ye.className='center';
      ye.addEventListener('change', e=>{ const v=e.target.value.trim().slice(-4); const n=parseInt(v,10); if(!isNaN(n)) y.yearEnd = n; y.ara = state.araTable[y.yearEnd] ?? y.ara; recalc();});
      td1.appendChild(ye);

      const td2 = document.createElement('td'); td2.className='center';
      const ara = document.createElement('input'); ara.type='number'; ara.step='0.0001'; ara.value = (y.ara ?? 0).toString();
      ara.addEventListener('input', e=>{ y.ara = parseFloat(e.target.value||0); recalc(); });
      td2.appendChild(ara);

      const td3 = document.createElement('td'); td3.dataset.role='ob';
      const td4 = document.createElement('td'); td4.dataset.role='rob';
      const td5 = document.createElement('td');
      const pay = document.createElement('input'); pay.type='number'; pay.step='0.01'; pay.placeholder='0.00'; pay.value = y.pay ?? '';
      pay.addEventListener('input', e=>{ y.pay = parseFloat(e.target.value||0); recalc(); });
      td5.appendChild(pay);
      const td6 = document.createElement('td'); td6.dataset.role='accrual';
      const td7 = document.createElement('td'); td7.dataset.role='close';

      tr.append(td0, td1, td2, td3, td4, td5, td6, td7);
      tbody.appendChild(tr);
    });
  }

  function recalc(){
    let prevClose = 0;
    [...tbody.querySelectorAll('tr')].forEach((tr, i) => {
      const y = state.years[i];
      const ob = prevClose;
      const rob = ob * (1 + (y.ara || 0));
      const accrual = (y.pay || 0) / 54;
      const close = rob + accrual;
      tr.querySelector('[data-role="ob"]').textContent = money(ob);
      tr.querySelector('[data-role="rob"]').textContent = money(rob);
      tr.querySelector('[data-role="accrual"]').textContent = money(accrual);
      tr.querySelector('[data-role="close"]').textContent = money(close);
      prevClose = close;
    });
    el('#finalYear').textContent = `31 Mar ${state.years.at(-1).yearEnd}`;
    el('#finalValue').textContent = money(prevClose);
    const target = parseFloat(el('#absTarget').value || 0);
    el('#diffPill').textContent = money(prevClose - target);
  }
  function computeFinal(){ let c = 0; state.years.forEach(y => { c = c*(1+(y.ara||0)) + (y.pay||0)/54; }); return c; }
  function addCalcYear(){
    const last = state.years.at(-1);
    const nextYearEnd = (last?.yearEnd || new Date().getFullYear()) + 1;
    const yy = `${String(nextYearEnd-1)}/${String(nextYearEnd).slice(-2)}`;
    state.years.push({ label: yy, yearEnd: nextYearEnd, ara: state.araTable[nextYearEnd] ?? 0, pay: 0 });
    renderCalcRows(); recalc();
  }
  function exportCSV(){
    const lines = [[
      'Scheme Year','Year End (31 Mar)','ARA','Opening Balance','Revalued Opening','Pensionable Pay','Accrual (Pay/54)','Closing Balance'
    ]];
    let prevClose = 0;
    state.years.forEach(y => {
      const ob = prevClose;
      const rob = ob * (1 + (y.ara || 0));
      const accrual = (y.pay || 0) / 54;
      const close = rob + accrual;
      lines.push([y.label, `31/03/${y.yearEnd}`, y.ara ?? 0, ob.toFixed(2), rob.toFixed(2), (y.pay||0).toFixed(2), accrual.toFixed(2), close.toFixed(2)]);
      prevClose = close;
    });
    const csv = lines.map(r => r.map(v => String(v).includes(',') ? `"${String(v).replaceAll('"','""')}"` : v).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'nhs_2015_pension_calc.csv'; a.click(); URL.revokeObjectURL(url);
  }

  // ARA Admin
  const araBody = el('#araBody');
  function renderARA(){
    araBody.innerHTML = '';
    const entries = Object.keys(state.araTable).map(k=>({ yearEnd: Number(k), ara: Number(state.araTable[k]) }))
                   .sort((a,b)=>a.yearEnd-b.yearEnd);
    entries.forEach(({yearEnd, ara}) => {
      const tr = document.createElement('tr');
      const yLabel = `${yearEnd-1}/${String(yearEnd).slice(-2)}`;
      const td0 = document.createElement('td'); td0.className='center'; td0.textContent = yLabel;
      const td1 = document.createElement('td'); td1.className='center';
      const ye = document.createElement('input'); ye.type='number'; ye.step='1'; ye.min='2016'; ye.value = yearEnd; ye.addEventListener('input', e=>{
        const newYearEnd = parseInt(e.target.value||yearEnd, 10);
        if (!Number.isFinite(newYearEnd)) return;
        delete state.araTable[yearEnd];
        state.araTable[newYearEnd] = ara;
        saveARA(); renderARA();
      });
      td1.appendChild(ye);
      const td2 = document.createElement('td'); td2.className='center';
      const araIn = document.createElement('input'); araIn.type='number'; araIn.step='0.0001'; araIn.value = ara;
      araIn.addEventListener('input', e=>{ const v = parseFloat(e.target.value||0); state.araTable[yearEnd] = v; saveARA(); });
      td2.appendChild(araIn);
      const td3 = document.createElement('td'); td3.className='center';
      const del = document.createElement('button'); del.className='btn outline danger'; del.textContent='Delete';
      del.addEventListener('click', ()=>{ delete state.araTable[yearEnd]; saveARA(); renderARA(); });
      td3.appendChild(del);
      tr.append(td0, td1, td2, td3);
      araBody.appendChild(tr);
    });
  }
  function araAddYear(){
    const keys = Object.keys(state.araTable).map(n=>parseInt(n,10)).sort((a,b)=>a-b);
    const last = keys.at(-1) || 2026;
    state.araTable[last+1] = 0.0000; saveARA(); renderARA();
  }
  function araReset(){ state.araTable = JSON.parse(JSON.stringify(DEFAULT_ARA)); saveARA(); renderARA(); applyARAtoYears(); renderCalcRows(); recalc(); }
  function araExport(){ const blob = new Blob([JSON.stringify(state.araTable, null, 2)], {type:'application/json'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'nhs_care_ara.json'; a.click(); URL.revokeObjectURL(url); }
  function araImport(file){ const r = new FileReader(); r.onload = () => { try { const obj = JSON.parse(r.result); if (obj && typeof obj === 'object') { state.araTable = obj; saveARA(); renderARA(); } } catch {} }; r.readAsText(file); }
  function araApply(){ applyARAtoYears(); renderCalcRows(); recalc(); }

  // Early Retirement (ARER)
  const arerBody = el('#arerBody');
  function renderARER(){
    arerBody.innerHTML = '';
    const entries = Object.keys(state.arerTable).map(k=>({ months: Number(k), factor: Number(state.arerTable[k]) }))
                   .sort((a,b)=>a.months-b.months);
    entries.forEach(({months, factor}) => {
      const tr = document.createElement('tr');
      const td0 = document.createElement('td'); td0.className='center';
      const mIn = document.createElement('input'); mIn.type='number'; mIn.step='1'; mIn.min='0'; mIn.value = months;
      mIn.addEventListener('input', e=>{
        const newMonths = parseInt(e.target.value||months, 10); if (!Number.isFinite(newMonths)) return;
        delete state.arerTable[months]; state.arerTable[newMonths] = factor; saveARER(); renderARER();
      });
      td0.appendChild(mIn);
      const td1 = document.createElement('td'); td1.className='center';
      const fIn = document.createElement('input'); fIn.type='number'; fIn.step='0.0001'; fIn.value = factor;
      fIn.addEventListener('input', e=>{ const v = parseFloat(e.target.value||1); state.arerTable[months] = v; saveARER(); });
      td1.appendChild(fIn);
      const td2 = document.createElement('td'); td2.className='center';
      const del = document.createElement('button'); del.className='btn outline danger'; del.textContent='Delete';
      del.addEventListener('click', ()=>{ delete state.arerTable[months]; saveARER(); renderARER(); });
      td2.appendChild(del);
      tr.append(td0, td1, td2);
      arerBody.appendChild(tr);
    });
  }
  function arerAddRow(){
    const keys = Object.keys(state.arerTable).map(n=>parseInt(n,10)).sort((a,b)=>a-b);
    const next = (keys.at(-1) || 0) + 12;
    state.arerTable[next] = 1.0000; saveARER(); renderARER();
  }
  function arerReset(){ state.arerTable = { "0": 1.0000 }; saveARER(); renderARER(); earlyRecalc(); }
  function arerExport(){ const blob = new Blob([JSON.stringify(state.arerTable, null, 2)], {type:'application/json'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'nhs_care_arer.json'; a.click(); URL.revokeObjectURL(url); }
  function arerImport(file){
    const r = new FileReader(); r.onload = () => {
      const text = r.result.trim();
      try {
        if (file.name.toLowerCase().endsWith('.csv')) {
          const lines = text.split(/\r?\n/).filter(Boolean);
          const out = {}; let start = 0;
          if (/months/i.test(lines[0]) && /factor/i.test(lines[0])) start = 1;
          for (let i=start;i<lines.length;i++){
            const parts = lines[i].split(','); if (parts.length<2) continue;
            const m = parseInt(parts[0].trim(),10); const f = parseFloat(parts[1].trim());
            if (Number.isFinite(m) && Number.isFinite(f)) out[m] = f;
          }
          if (Object.keys(out).length>0) { state.arerTable = out; saveARER(); renderARER(); earlyRecalc(); }
        } else {
          const obj = JSON.parse(text); if (obj && typeof obj==='object') { state.arerTable = obj; saveARER(); renderARER(); earlyRecalc(); }
        }
      } catch {}
    }; r.readAsText(file);
  }
  function getARERFactor(months){
    const keys = Object.keys(state.arerTable).map(n=>parseInt(n,10)).sort((a,b)=>a-b);
    if (keys.length===0) return 1.0;
    if (state.arerTable[months] != null) return Number(state.arerTable[months]);
    let floorK = keys[0]; for (const k of keys){ if (k<=months) floorK = k; else break; }
    return Number(state.arerTable[floorK]);
  }

  function earlyRecalc(){
    const unreduced = computeFinal();
    const npa = parseFloat(el('#npaAge').value || 67);
    const ra = parseFloat(el('#retAge').value || npa);
    const errbo = Math.max(0, Math.min(3, parseFloat(el('#errboYears').value || 0)));
    const monthsEarlyRaw = Math.max(0, Math.round((npa - ra) * 12));
    const monthsEarly = Math.max(0, monthsEarlyRaw - Math.round(errbo*12));
    const factor = getARERFactor(monthsEarly);
    const afterARER = unreduced * factor;
    let commute = parseFloat(el('#commutePension').value || 0);
    commute = Math.max(0, Math.min(commute, afterARER));
    const lump = commute * 12;
    const payable = afterARER - commute;
    el('#earlyUnreduced').textContent = money(unreduced);
    el('#earlyMonths').textContent = String(monthsEarly);
    el('#earlyFactor').textContent = factor.toFixed(4);
    el('#earlyReduced').textContent = money(afterARER);
    el('#earlyCommuteLS').textContent = money(lump);
    el('#earlyFinalPension').textContent = money(payable);
  }

  // Theme & prefs
  const root = document.documentElement;
  function setTheme(mode){ state.theme = mode; if (mode === 'system') { root.removeAttribute('data-theme'); } else { root.setAttribute('data-theme', mode); } localStorage.setItem('nhs_care_theme', mode); }
  function setCompact(on){ state.compact = !!on; document.body.classList.toggle('compact', state.compact); localStorage.setItem('nhs_care_compact', state.compact ? '1':'0'); }
  function loadPrefs(){ const t = localStorage.getItem('nhs_care_theme'); if (t) setTheme(t); const c = localStorage.getItem('nhs_care_compact'); if (c === '1') setCompact(true); }

  const themeSelect = el('#themeSelect'); themeSelect.addEventListener('change', ()=> setTheme(themeSelect.value));
  const compactToggle = el('#compactToggle'); compactToggle.addEventListener('change', ()=> setCompact(compactToggle.checked));

  function buildEmbedUrl(base){
    const u = new URL(base, window.location.origin);
    u.searchParams.set('embed','1'); u.searchParams.set('compact','1');
    const t = state.theme !== 'system' ? state.theme : 'dark'; u.searchParams.set('theme', t);
    const abs = parseFloat(el('#embedAbs').value || 0); if (abs>0) u.searchParams.set('abs', abs.toFixed(2));
    return u.toString();
  }
  el('#copyEmbedBtn').addEventListener('click', ()=>{
    const base = window.location.pathname.replace(/\/[^\/]*$/, '/') + 'index.html';
    const url = buildEmbedUrl(base);
    const iframe = `<iframe src="${url}" width="100%" height="780" style="border:0; overflow:hidden;" loading="lazy" referrerpolicy="no-referrer"></iframe>`;
    navigator.clipboard.writeText(iframe).then(()=>{ alert('Embed code copied'); });
  });

  // Wire up
  function applyQueryParams(){
    const sp = new URLSearchParams(window.location.search);
    if (sp.get('embed') === '1') { document.body.setAttribute('data-embed','1'); }
    if (sp.get('compact') === '1') { setCompact(true); compactToggle.checked = true; }
    const th = sp.get('theme'); if (th) { themeSelect.value = th; setTheme(th); }
    const abs = sp.get('abs'); if (abs) { el('#absTarget').value = abs; }
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    loadPrefs(); applyQueryParams();
    renderCalcRows(); renderARA(); renderARER();
    recalc(); earlyRecalc();
  });

  // Buttons
  document.addEventListener('click', (e)=>{
    if (e.target.id==='recalcBtn') recalc();
    if (e.target.id==='addYearBtn') addCalcYear();
    if (e.target.id==='exportBtn') exportCSV();
    if (e.target.id==='araAddYearBtn') araAddYear();
    if (e.target.id==='araResetBtn') araReset();
    if (e.target.id==='araExportBtn') araExport();
    if (e.target.id==='araApplyBtn') araApply();
    if (e.target.id==='arerAddRowBtn') arerAddRow();
    if (e.target.id==='arerResetBtn') arerReset();
    if (e.target.id==='arerExportBtn') arerExport();
    if (e.target.id==='arerApplyBtn') earlyRecalc();
    if (e.target.id==='earlyRecalcBtn') earlyRecalc();
  });
  document.addEventListener('change', (e)=>{
    if (e.target.id==='araImportInput' && e.target.files?.[0]) araImport(e.target.files[0]);
    if (e.target.id==='arerImportInput' && e.target.files?.[0]) arerImport(e.target.files[0]);
    if (e.target.id==='absTarget') recalc();
  });
})();
