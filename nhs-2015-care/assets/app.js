
(function(){
  // NHS defaults for ARA (YE 2016→YE 2025). Edit if needed.
  const NHS_ARA_SET = {
    2016: 0.014, 2017: 0.025, 2018: 0.045, 2019: 0.039, 2020: 0.032,
    2021: 0.020, 2022: 0.046, 2023: 0.116, 2024: 0.082, 2025: 0.032
  };

  // Initial year list (safe seeds).
  const DEFAULT_YEARS = Object.keys(NHS_ARA_SET).map(yEnd => ({
    label: `${yEnd-1}/${String(yEnd).slice(-2)}`,
    yearEnd: Number(yEnd),
    ara: NHS_ARA_SET[yEnd],
    pay: 0
  }));

  // Persistence helpers
  const el = sel => document.querySelector(sel);
  const els = sel => Array.from(document.querySelectorAll(sel));
  const money = n => (isNaN(n) || !isFinite(n)) ? '£0.00' : new Intl.NumberFormat('en-GB', { style:'currency', currency:'GBP' }).format(n);
  const product = arr => arr.reduce((a,b)=>a*b, 1);

  function loadJSON(key, fallback){
    try { const t = localStorage.getItem(key); return t ? JSON.parse(t) : JSON.parse(JSON.stringify(fallback)); }
    catch { return JSON.parse(JSON.stringify(fallback)); }
  }
  function saveJSON(key, obj){ localStorage.setItem(key, JSON.stringify(obj)); }

  const state = {
    years: loadJSON('nhs_care_years_v21', DEFAULT_YEARS),
    araTable: loadJSON('nhs_care_ara', NHS_ARA_SET),
    erfTable: loadJSON('nhs_care_erf', {0:1.0000}),
    lrfTable: loadJSON('nhs_care_lrf', {0:1.0000}),
    theme: localStorage.getItem('nhs_care_theme') || 'system',
    compact: localStorage.getItem('nhs_care_compact') === '1',
    retDate: null,
    mode: 'estimate',
    lastAudit: [], lastUnreduced: 0
  };

  // --- Utilities ---
  function parseDateISO(s){ if(!s) return null; const d=new Date(s); return isNaN(d.getTime())?null:d; }
  function schemeYearEndForDate(d){ const y=d.getFullYear(); const m=d.getMonth()+1; return (m>=4)?(y+1):y; }

  // --- Calculator rows (Year End numeric, label derived, delete row) ---
  const tbody = el('#tbody');
  function yearLabel(yEnd){ return `${yEnd-1}/${String(yEnd).slice(-2)}`; }

  function renderCalcRows(){
    tbody.innerHTML = '';
    state.years.sort((a,b)=>a.yearEnd-b.yearEnd);
    state.years.forEach((y, idx) => {
      const tr = document.createElement('tr');

      // Label (derived)
      const tdLabel = document.createElement('td'); tdLabel.className='center'; tdLabel.textContent = yearLabel(y.yearEnd);

      // Year End (numeric, min 2016)
      const tdYE = document.createElement('td'); tdYE.className='center';
      const yeIn = document.createElement('input'); yeIn.type='number'; yeIn.min='2016'; yeIn.step='1'; yeIn.value = y.yearEnd;
      yeIn.addEventListener('input', e => {
        const v = parseInt(e.target.value||y.yearEnd, 10);
        if (!Number.isFinite(v) || v < 2016) { e.target.value = y.yearEnd; return; }
        // Prevent duplicates
        if (state.years.some((row, i) => i!==idx && row.yearEnd===v)) { e.target.value = y.yearEnd; return; }
        y.yearEnd = v;
        y.ara = state.araTable[v] ?? y.ara ?? 0;
        saveJSON('nhs_care_years_v21', state.years);
        renderCalcRows(); recalc();
      });
      tdYE.appendChild(yeIn);

      // ARA (decimal)
      const tdARA = document.createElement('td'); tdARA.className='center';
      const araIn = document.createElement('input'); araIn.type='number'; araIn.step='0.0001'; araIn.value = (y.ara ?? 0).toString();
      araIn.addEventListener('input', e => { y.ara = parseFloat(e.target.value||0); saveJSON('nhs_care_years_v21', state.years); recalc(); });
      tdARA.appendChild(araIn);

      // Pay
      const tdPay = document.createElement('td');
      const payIn = document.createElement('input'); payIn.type='number'; payIn.step='0.01'; payIn.placeholder='0.00'; payIn.value = y.pay ?? '';
      payIn.addEventListener('input', e => { y.pay = parseFloat(e.target.value||0); saveJSON('nhs_care_years_v21', state.years); recalc(); });
      tdPay.appendChild(payIn);

      // Accrual
      const tdAcc = document.createElement('td'); tdAcc.dataset.role='accrual'; tdAcc.textContent = money((y.pay||0)/54);

      // Actions
      const tdAct = document.createElement('td'); tdAct.className='center';
      const delBtn = document.createElement('button'); delBtn.className='btn outline danger'; delBtn.textContent='Delete';
      delBtn.addEventListener('click', () => {
        if (state.years.length <= 1) return; // keep at least one row
        state.years.splice(idx, 1);
        saveJSON('nhs_care_years_v21', state.years);
        renderCalcRows(); recalc();
      });
      tdAct.appendChild(delBtn);

      tr.append(tdLabel, tdYE, tdARA, tdPay, tdAcc, tdAct);
      tbody.appendChild(tr);
    });
  }

  function seedYears(){
    // Build 2016→finalYearEnd where finalYearEnd = from retirement date (if set) else current scheme YE + 1
    let finalYE = 2026;
    const retDateVal = el('#retDate').value;
    if (retDateVal){
      const rd = parseDateISO(retDateVal);
      if (rd) finalYE = schemeYearEndForDate(rd);
    } else {
      const now = new Date();
      finalYE = schemeYearEndForDate(now); // e.g., today 2025/10 -> YE 2026
    }
    const years = [];
    for (let yEnd=2016; yEnd<=finalYE; yEnd++){
      years.push({ label: yearLabel(yEnd), yearEnd: yEnd, ara: state.araTable[yEnd] ?? NHS_ARA_SET[yEnd] ?? 0, pay: 0 });
    }
    state.years = years;
    saveJSON('nhs_care_years_v21', state.years);
    renderCalcRows(); recalc();
  }

  // --- Core engine (pot-by-pot) ---
  function buildUnreduced(){
    const retDateInput = el('#retDate').value;
    const retDate = parseDateISO(retDateInput);
    state.retDate = retDate;
    state.mode = el('#mode').value || 'estimate';

    const finalYearEnd = retDate ? schemeYearEndForDate(retDate) : (state.years.at(-1)?.yearEnd || 2025);
    // Ensure a row for the final year so part-year pay can be entered
    if (!state.years.some(y=>y.yearEnd===finalYearEnd)){
      state.years.push({ label: yearLabel(finalYearEnd), yearEnd: finalYearEnd, ara: state.araTable[finalYearEnd] ?? 0, pay: 0 });
      state.years.sort((a,b)=>a.yearEnd-b.yearEnd);
      saveJSON('nhs_care_years_v21', state.years);
      renderCalcRows();
    }

    state.lastAudit = [];
    let unreduced = 0;

    const completed = state.years.filter(y => y.yearEnd <= finalYearEnd-1).sort((a,b)=>a.yearEnd-b.yearEnd);
    const finalRow = state.years.find(y => y.yearEnd === finalYearEnd);

    completed.forEach(y => {
      const accrual = (y.pay || 0) / 54;
      const multipliers = [];
      for (let t = y.yearEnd+1; t <= finalYearEnd-1; t++){ multipliers.push(1 + (state.araTable[t] ?? 0)); }
      if (state.mode === 'estimate'){ multipliers.push(1 + (state.araTable[finalYearEnd] ?? 0)); }
      const mult = product(multipliers);
      const revalued = accrual * mult;
      state.lastAudit.push({ label: yearLabel(y.yearEnd), yearEnd: y.yearEnd, accrual, multiplier: mult, revalued });
      unreduced += revalued;
    });

    if (finalRow){
      const finalAccrual = (finalRow.pay || 0) / 54;
      state.lastAudit.push({ label: yearLabel(finalRow.yearEnd) + " (part-year)", yearEnd: finalRow.yearEnd, accrual: finalAccrual, multiplier: 1, revalued: finalAccrual });
      unreduced += finalAccrual;
    }

    state.lastUnreduced = unreduced;

    // Update accrual column
    [...tbody.querySelectorAll('tr')].forEach((tr, i) => {
      const y = state.years[i]; const accrual = (y?.pay || 0) / 54;
      const cell = tr.querySelector('[data-role="accrual"]'); if (cell) cell.textContent = money(accrual);
    });

    return unreduced;
  }

  function recalc(){
    const u = buildUnreduced();
    el('#unreducedOut').textContent = money(u);
    const target = parseFloat(el('#absTarget').value || 0);
    el('#diffPill').textContent = money(u - target);
    renderAudit();
    el('#resUnreduced').textContent = money(u);
    el('#resAfterFactor').textContent = money(u);
    el('#resPayable').textContent = money(u);
  }

  // --- Audit ---
  const auditBody = el('#auditBody');
  function renderAudit(){
    auditBody.innerHTML = '';
    let total = 0;
    state.lastAudit.forEach(row => {
      const tr = document.createElement('tr');
      const td0 = document.createElement('td'); td0.className='center'; td0.textContent = row.label;
      const td1 = document.createElement('td'); td1.className='center'; td1.textContent = row.yearEnd;
      const td2 = document.createElement('td'); td2.textContent = money(row.accrual);
      const td3 = document.createElement('td'); td3.textContent = row.multiplier.toFixed(6);
      const td4 = document.createElement('td'); td4.textContent = money(row.revalued);
      tr.append(td0, td1, td2, td3, td4);
      auditBody.appendChild(tr);
      total += row.revalued;
    });
    el('#auditTotal').textContent = money(total);
  }

  // --- Retirement factors (ERF/LRF) ---
  function monthsBetween(d1, d2){
    const y1=d1.getFullYear(), m1=d1.getMonth(), day1=d1.getDate();
    const y2=d2.getFullYear(), m2=d2.getMonth(), day2=d2.getDate();
    let months=(y2-y1)*12+(m2-m1); if (day2<day1) months -= 1; return months;
  }
  function getFactor(table, months){
    const keys = Object.keys(table).map(n=>parseInt(n,10)).sort((a,b)=>a-b);
    if (keys.length===0) return 1.0;
    if (table[months] != null) return Number(table[months]);
    let floorK = keys[0]; for (const k of keys){ if (k<=months) floorK = k; else break; }
    return Number(table[floorK]);
  }

  function applyRetirementFactors(){
    const unreduced = state.lastUnreduced || buildUnreduced();
    el('#resUnreduced').textContent = money(unreduced);

    const retDate = state.retDate || new Date();
    const dobStr = el('#dob').value;
    const dob = dobStr ? new Date(dobStr) : null;
    const npaAge = parseFloat(el('#npaAge').value || 67);
    let monthsToFromNPA = 0;
    if (dob){ const mAge = monthsBetween(dob, retDate); const mNPA = Math.round(npaAge * 12); monthsToFromNPA = mNPA - mAge; }

    const errboYears = Math.max(0, Math.min(3, parseFloat(el('#errboYears').value || 0)));
    const errboMonths = Math.round(errboYears * 12);

    const retType = el('#retType').value || 'age';
    let factor = 1.0, monthsAdj = 0;
    if (retType === 'early') {
      const mEarly = Math.max(0, monthsToFromNPA) - errboMonths;
      monthsAdj = Math.max(0, mEarly);
      factor = getFactor(state.erfTable, monthsAdj);
    } else if (retType === 'late') {
      monthsAdj = Math.max(0, -monthsToFromNPA);
      factor = getFactor(state.lrfTable, monthsAdj);
    }

    const afterFactor = unreduced * factor;
    let commute = parseFloat(el('#commutePension').value || 0);
    commute = Math.max(0, Math.min(commute, afterFactor));
    const lump = commute * 12;
    const payable = afterFactor - commute;

    el('#resMonths').textContent = String(monthsAdj);
    el('#resFactor').textContent = factor.toFixed(4);
    el('#resAfterFactor').textContent = money(afterFactor);
    el('#resLump').textContent = money(lump);
    el('#resPayable').textContent = money(payable);
  }

  // --- ARA Admin ---
  const araBody = el('#araBody');
  function renderARA(){
    araBody.innerHTML='';
    const entries = Object.keys(state.araTable).map(k=>({yearEnd:Number(k), ara:Number(state.araTable[k])})).sort((a,b)=>a.yearEnd-b.yearEnd);
    entries.forEach(({yearEnd, ara})=>{
      const tr=document.createElement('tr');
      const td0=document.createElement('td'); td0.className='center'; td0.textContent = yearLabel(yearEnd);
      const td1=document.createElement('td'); td1.className='center';
      const ye=document.createElement('input'); ye.type='number'; ye.step='1'; ye.min='2016'; ye.value=yearEnd;
      ye.addEventListener('input', e=>{
        const newYearEnd = parseInt(e.target.value||yearEnd, 10); if (!Number.isFinite(newYearEnd) || newYearEnd<2016) { e.target.value = yearEnd; return; }
        delete state.araTable[yearEnd]; state.araTable[newYearEnd] = ara; saveJSON('nhs_care_ara', state.araTable); renderARA();
      });
      td1.appendChild(ye);
      const td2=document.createElement('td'); td2.className='center';
      const araIn=document.createElement('input'); araIn.type='number'; araIn.step='0.0001'; araIn.value=ara;
      araIn.addEventListener('input', e=>{ const v=parseFloat(e.target.value||0); state.araTable[yearEnd]=v; saveJSON('nhs_care_ara', state.araTable); });
      td2.appendChild(araIn);
      const td3=document.createElement('td'); td3.className='center';
      const del=document.createElement('button'); del.className='btn outline danger'; del.textContent='Delete';
      del.addEventListener('click', ()=>{ delete state.araTable[yearEnd]; saveJSON('nhs_care_ara', state.araTable); renderARA(); });
      td3.appendChild(del);
      tr.append(td0, td1, td2, td3);
      araBody.appendChild(tr);
    });
  }
  function araAddYear(){
    const keys = Object.keys(state.araTable).map(n=>parseInt(n,10)).sort((a,b)=>a-b);
    const last = keys.at(-1) || 2025;
    state.araTable[last+1] = 0.0000;
    saveJSON('nhs_care_ara', state.araTable); renderARA();
  }
  function araReset(){ state.araTable = loadJSON('nhs_care_ara', NHS_ARA_SET); saveJSON('nhs_care_ara', state.araTable); renderARA(); recalc(); }
  function araNHSDefaults(){ state.araTable = JSON.parse(JSON.stringify(NHS_ARA_SET)); saveJSON('nhs_care_ara', state.araTable); renderARA(); recalc(); }
  function araExport(){ const blob=new Blob([JSON.stringify(state.araTable, null, 2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='nhs_care_ara.json'; a.click(); URL.revokeObjectURL(url); }
  function araImport(file){ const r=new FileReader(); r.onload=()=>{ try{ const obj=JSON.parse(r.result); if (obj && typeof obj==='object'){ state.araTable=obj; saveJSON('nhs_care_ara', state.araTable); renderARA(); recalc(); } }catch{} }; r.readAsText(file); }

  // --- Factors UI ---
  const factorsBody = el('#factorsBody');
  function renderFactors(){
    factorsBody.innerHTML='';
    const rows=[];
    Object.entries(state.erfTable).forEach(([m,f])=>rows.push({type:'ERF',months:Number(m),factor:Number(f)}));
    Object.entries(state.lrfTable).forEach(([m,f])=>rows.push({type:'LRF',months:Number(m),factor:Number(f)}));
    rows.sort((a,b)=> (a.type===b.type) ? a.months-b.months : (a.type==='ERF'?-1:1));
    rows.forEach(r=>{
      const tr=document.createElement('tr');
      const tdT=document.createElement('td'); tdT.className='center'; tdT.textContent=r.type;
      const tdM=document.createElement('td'); tdM.className='center';
      const mIn=document.createElement('input'); mIn.type='number'; mIn.step='1'; mIn.min='0'; mIn.value=r.months; tdM.appendChild(mIn);
      const tdF=document.createElement('td'); tdF.className='center';
      const fIn=document.createElement('input'); fIn.type='number'; fIn.step='0.0001'; fIn.value=r.factor; tdF.appendChild(fIn);
      const tdA=document.createElement('td'); tdA.className='center';
      const del=document.createElement('button'); del.className='btn outline danger'; del.textContent='Delete'; tdA.appendChild(del);

      mIn.addEventListener('input', e=>{
        const nm=parseInt(e.target.value||r.months,10);
        if (r.type==='ERF'){ delete state.erfTable[r.months]; state.erfTable[nm]=r.factor; saveJSON('nhs_care_erf', state.erfTable); }
        else { delete state.lrfTable[r.months]; state.lrfTable[nm]=r.factor; saveJSON('nhs_care_lrf', state.lrfTable); }
        renderFactors();
      });
      fIn.addEventListener('input', e=>{
        const v=parseFloat(e.target.value||r.factor);
        if (r.type==='ERF'){ state.erfTable[r.months]=v; saveJSON('nhs_care_erf', state.erfTable); }
        else { state.lrfTable[r.months]=v; saveJSON('nhs_care_lrf', state.lrfTable); }
      });
      del.addEventListener('click', ()=>{
        if (r.type==='ERF'){ delete state.erfTable[r.months]; saveJSON('nhs_care_erf', state.erfTable); }
        else { delete state.lrfTable[r.months]; saveJSON('nhs_care_lrf', state.lrfTable); }
        renderFactors();
      });

      tr.append(tdT,tdM,tdF,tdA);
      factorsBody.appendChild(tr);
    });
  }

  // --- Settings & embed ---
  const root = document.documentElement;
  function setTheme(mode){ if (mode==='system') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', mode); localStorage.setItem('nhs_care_theme', mode); }
  function setCompact(on){ document.body.classList.toggle('compact', !!on); localStorage.setItem('nhs_care_compact', on?'1':'0'); }
  function applyQueryParams(){ const sp=new URLSearchParams(window.location.search);
    if (sp.get('embed')==='1') document.body.setAttribute('data-embed','1');
    if (sp.get('compact')==='1') { setCompact(true); el('#compactToggle').checked = true; }
    const th=sp.get('theme'); if (th){ el('#themeSelect').value=th; setTheme(th); }
    const abs=sp.get('abs'); if (abs) el('#absTarget').value=abs;
  }
  function copyEmbed(){
    const base=window.location.pathname.replace(/\/[^\/]*$/, '/') + 'index.html';
    const u=new URL(base, window.location.origin);
    u.searchParams.set('embed','1'); u.searchParams.set('compact','1');
    const t=(localStorage.getItem('nhs_care_theme')||'dark'); u.searchParams.set('theme', t==='system'?'dark':t);
    const abs=parseFloat(el('#embedAbs').value||0); if (abs>0) u.searchParams.set('abs', abs.toFixed(2));
    const iframe=`<iframe src="${u.toString()}" width="100%" height="900" style="border:0; overflow:hidden;" loading="lazy" referrerpolicy="no-referrer"></iframe>`;
    navigator.clipboard.writeText(iframe).then(()=>alert('Embed code copied'));
  }

  // --- Wire-up ---
  function recalcAndPersist(){ saveJSON('nhs_care_years_v21', state.years); recalc(); }
  function init(){
    // Tabs
    els('.tab').forEach(btn => btn.addEventListener('click', () => {
      els('.tab').forEach(b => b.classList.remove('active'));
      els('.panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.querySelector(`#panel-${btn.dataset.tab}`).classList.add('active');
    }));

    // Theme & layout
    if (state.theme !== 'system') root.setAttribute('data-theme', state.theme);
    document.body.classList.toggle('compact', state.compact);
    renderCalcRows(); renderARA(); renderFactors(); applyQueryParams(); recalc();

    // Calculator actions
    el('#recalcBtn').addEventListener('click', recalc);
    el('#addYearBtn').addEventListener('click', ()=>{
      // Add next contiguous year end
      const sorted = [...state.years].sort((a,b)=>a.yearEnd-b.yearEnd);
      const next = (sorted.at(-1)?.yearEnd || 2025) + 1;
      if (next < 2016) return;
      state.years.push({ label: yearLabel(next), yearEnd: next, ara: state.araTable[next] ?? 0, pay: 0 });
      recalcAndPersist(); renderCalcRows();
    });
    el('#seedYearsBtn').addEventListener('click', seedYears);
    el('#exportBtn').addEventListener('click', ()=>{
      const lines=[[ 'Scheme Year','Year End','ARA','Pensionable Pay','Accrual (Pay/54)' ]];
      state.years.sort((a,b)=>a.yearEnd-b.yearEnd).forEach(y=>{
        const accr=(y.pay||0)/54;
        lines.push([yearLabel(y.yearEnd), y.yearEnd, (y.ara??0), (y.pay||0).toFixed(2), accr.toFixed(2)]);
      });
      lines.push([]); lines.push(['Mode', state.mode]); lines.push(['Retirement date', el('#retDate').value || '']); lines.push(['Unreduced at retirement', state.lastUnreduced.toFixed(2)]);
      const csv=lines.map(r=>r.map(v=>String(v).includes(',')?`"${String(v).replaceAll('"','""')}"`:v).join(',')).join('\n');
      const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='nhs_2015_v21_export.csv'; a.click(); URL.revokeObjectURL(url);
    });
    el('#absTarget').addEventListener('input', recalc);
    el('#retDate').addEventListener('change', recalc);
    el('#mode').addEventListener('change', recalc);

    // ARA admin
    el('#araAddYearBtn').addEventListener('click', ()=>{
      const keys=Object.keys(state.araTable).map(n=>parseInt(n,10)).sort((a,b)=>a-b);
      const last=keys.at(-1)||2025; state.araTable[last+1]=0.0000; saveJSON('nhs_care_ara', state.araTable); renderARA();
    });
    el('#araResetBtn').addEventListener('click', ()=>{ state.araTable = loadJSON('nhs_care_ara', NHS_ARA_SET); saveJSON('nhs_care_ara', state.araTable); renderARA(); recalc(); });
    el('#araNHSDefaultsBtn').addEventListener('click', araNHSDefaults);
    el('#araExportBtn').addEventListener('click', araExport);
    el('#araImportInput').addEventListener('change', e=>{ if (e.target.files?.[0]) araImport(e.target.files[0]); });
    el('#araApplyBtn').addEventListener('click', recalc);

    // Retirement & factors
    el('#calcRetBtn').addEventListener('click', applyRetirementFactors);
    el('#erfImport').addEventListener('change', e=>{ if (e.target.files?.[0]) importFactors(e.target.files[0], true); });
    el('#lrfImport').addEventListener('change', e=>{ if (e.target.files?.[0]) importFactors(e.target.files[0], false); });
    el('#erfExportBtn').addEventListener('click', ()=>{
      const blob=new Blob([JSON.stringify(state.erfTable, null, 2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='nhs_care_erf.json'; a.click(); URL.revokeObjectURL(url);
    });
    el('#lrfExportBtn').addEventListener('click', ()=>{
      const blob=new Blob([JSON.stringify(state.lrfTable, null, 2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='nhs_care_lrf.json'; a.click(); URL.revokeObjectURL(url);
    });
    el('#resetFactorsBtn').addEventListener('click', ()=>{
      state.erfTable={0:1.0000}; state.lrfTable={0:1.0000};
      saveJSON('nhs_care_erf', state.erfTable); saveJSON('nhs_care_lrf', state.lrfTable); renderFactors();
    });

    // Settings
    const themeSelect = el('#themeSelect'); themeSelect.value = state.theme;
    themeSelect.addEventListener('change', ()=> setTheme(themeSelect.value));
    const compactToggle = el('#compactToggle'); compactToggle.checked = state.compact;
    compactToggle.addEventListener('change', ()=> setCompact(compactToggle.checked));
    el('#copyEmbedBtn').addEventListener('click', copyEmbed);
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') setTimeout(init,0);
  else document.addEventListener('DOMContentLoaded', init);
})();
