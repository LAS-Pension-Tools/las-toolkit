
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
    { label: "2025/26", yearEnd: 2026, ara: 0.032, pay: 0 }
  ];
  const DEFAULT_ARA = { 2016:0.014,2017:0.025,2018:0.045,2019:0.039,2020:0.032,2021:0.020,2022:0.046,2023:0.116,2024:0.082,2025:0.032,2026:0.032 };
  const DEFAULT_ERF = { 0: 1.0000 };
  const DEFAULT_LRF = { 0: 1.0000 };

  const el = sel => document.querySelector(sel);
  const els = sel => Array.from(document.querySelectorAll(sel));
  const money = n => (isNaN(n) || !isFinite(n)) ? '£0.00' : new Intl.NumberFormat('en-GB', { style:'currency', currency:'GBP' }).format(n);

  const state = {
    years: DEFAULT_YEARS.map(y=>({...y})),
    araTable: loadJSON('nhs_care_ara', DEFAULT_ARA),
    erfTable: loadJSON('nhs_care_erf', DEFAULT_ERF),
    lrfTable: loadJSON('nhs_care_lrf', DEFAULT_LRF),
    theme: localStorage.getItem('nhs_care_theme') || 'system',
    compact: localStorage.getItem('nhs_care_compact') === '1',
    retDate: null,
    mode: 'estimate',
    lastAudit: [],
    lastUnreduced: 0,
  };

  function loadJSON(key, fallback){ try{ const t=localStorage.getItem(key); return t?JSON.parse(t):JSON.parse(JSON.stringify(fallback)); }catch{ return JSON.parse(JSON.stringify(fallback)); } }
  function saveJSON(key, obj){ localStorage.setItem(key, JSON.stringify(obj)); }

  const tbody = el('#tbody');
  function renderCalcRows(){
    tbody.innerHTML='';
    state.years.forEach((y,i)=>{
      const tr=document.createElement('tr');
      const td0=document.createElement('td'); td0.className='center';
      const yearInput=document.createElement('input'); yearInput.type='text'; yearInput.value=y.label; yearInput.className='center';
      yearInput.addEventListener('change', e=> y.label = e.target.value );
      td0.appendChild(yearInput);

      const td1=document.createElement('td'); td1.className='center';
      const ye=document.createElement('input'); ye.type='text'; ye.value=`31/03/${y.yearEnd}`; ye.className='center';
      ye.addEventListener('change', e=>{ const v=e.target.value.trim().slice(-4); const n=parseInt(v,10); if(!isNaN(n)) y.yearEnd=n; y.ara = state.araTable[y.yearEnd] ?? y.ara; recalc(); });
      td1.appendChild(ye);

      const td2=document.createElement('td'); td2.className='center';
      const ara=document.createElement('input'); ara.type='number'; ara.step='0.0001'; ara.value=(y.ara??0).toString();
      ara.addEventListener('input', e=>{ y.ara=parseFloat(e.target.value||0); recalc(); });
      td2.appendChild(ara);

      const td5=document.createElement('td');
      const pay=document.createElement('input'); pay.type='number'; pay.step='0.01'; pay.placeholder='0.00'; pay.value=y.pay ?? '';
      pay.addEventListener('input', e=>{ y.pay=parseFloat(e.target.value||0); recalc(); });
      td5.appendChild(pay);

      const td6=document.createElement('td'); td6.dataset.role='accrual';

      tr.append(td0,td1,td2,td5,td6);
      tbody.appendChild(tr);
    });
  }

  function parseDateISO(s){ if(!s) return null; const d=new Date(s); return isNaN(d.getTime())?null:d; }
  function schemeYearEndForDate(d){ const y=d.getFullYear(); const m=d.getMonth()+1; return (m>=4)?(y+1):y; }
  function product(arr){ return arr.reduce((a,b)=>a*b,1); }

  function buildUnreduced(){
    const retDateInput = el('#retDate').value;
    const retDate = parseDateISO(retDateInput);
    state.retDate = retDate;
    state.mode = el('#mode').value || 'estimate';

    const finalYearEnd = retDate ? schemeYearEndForDate(retDate) : (state.years.at(-1)?.yearEnd || 2025);
    if (!state.years.some(y=>y.yearEnd===finalYearEnd)){
      state.years.push({ label: `${finalYearEnd-1}/${String(finalYearEnd).slice(-2)}`, yearEnd: finalYearEnd, ara: state.araTable[finalYearEnd] ?? 0, pay: 0 });
      state.years.sort((a,b)=>a.yearEnd-b.yearEnd);
      renderCalcRows();
    }

    state.lastAudit = [];
    let unreduced = 0;

    const completed = state.years.filter(y => y.yearEnd <= finalYearEnd-1);
    const finalRow = state.years.find(y => y.yearEnd === finalYearEnd);

    completed.forEach(y=>{
      const accrual=(y.pay||0)/54;
      const multipliers=[];
      for(let t=y.yearEnd+1; t<=finalYearEnd-1; t++){ multipliers.push(1+(state.araTable[t]??0)); }
      if (state.mode==='estimate'){ multipliers.push(1+(state.araTable[finalYearEnd]??0)); }
      const mult=product(multipliers);
      const revalued=accrual*mult;
      state.lastAudit.push({ label:y.label, yearEnd:y.yearEnd, accrual, multiplier:mult, revalued });
      unreduced += revalued;
    });

    if (finalRow){
      const finalAccrual=(finalRow.pay||0)/54;
      state.lastAudit.push({ label: finalRow.label + " (part-year)", yearEnd: finalRow.yearEnd, accrual: finalAccrual, multiplier:1, revalued: finalAccrual });
      unreduced += finalAccrual;
    }

    state.lastUnreduced = unreduced;

    [...tbody.querySelectorAll('tr')].forEach((tr,i)=>{
      const y=state.years[i]; const accrual=(y?.pay||0)/54;
      const cell=tr.querySelector('[data-role="accrual"]'); if (cell) cell.textContent = money(accrual);
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

  const auditBody = el('#auditBody');
  function renderAudit(){
    auditBody.innerHTML='';
    let total=0;
    state.lastAudit.forEach(row=>{
      const tr=document.createElement('tr');
      const td0=document.createElement('td'); td0.className='center'; td0.textContent=row.label;
      const td1=document.createElement('td'); td1.className='center'; td1.textContent=row.yearEnd;
      const td2=document.createElement('td'); td2.textContent=money(row.accrual);
      const td3=document.createElement('td'); td3.textContent=row.multiplier.toFixed(6);
      const td4=document.createElement('td'); td4.textContent=money(row.revalued);
      tr.append(td0,td1,td2,td3,td4);
      auditBody.appendChild(tr);
      total += row.revalued;
    });
    el('#auditTotal').textContent = money(total);
  }

  function getFactor(table, months){
    const keys=Object.keys(table).map(n=>parseInt(n,10)).sort((a,b)=>a-b);
    if (keys.length===0) return 1.0;
    if (table[months]!=null) return Number(table[months]);
    let floorK = keys[0]; for (const k of keys){ if (k<=months) floorK=k; else break; }
    return Number(table[floorK]);
  }
  function parseCSVToMap(text){
    const lines=text.split(/\r?\n/).filter(Boolean); const out={}; let start=0;
    if (/months/i.test(lines[0]) && /factor/i.test(lines[0])) start=1;
    for(let i=start;i<lines.length;i++){ const parts=lines[i].split(','); if (parts.length<2) continue;
      const m=parseInt(parts[0].trim(),10); const f=parseFloat(parts[1].trim()); if (Number.isFinite(m)&&Number.isFinite(f)) out[m]=f; }
    return out;
  }
  function monthsBetween(d1,d2){
    const y1=d1.getFullYear(), m1=d1.getMonth(), day1=d1.getDate();
    const y2=d2.getFullYear(), m2=d2.getMonth(), day2=d2.getDate();
    let months=(y2-y1)*12+(m2-m1); if (day2<day1) months -= 1; return months;
  }

  function applyRetirementFactors(){
    const unreduced = state.lastUnreduced || buildUnreduced();
    el('#resUnreduced').textContent = money(unreduced);

    const retDate = state.retDate || new Date();
    const dobVal = el('#dob').value;
    const dob = dobVal ? new Date(dobVal) : null;
    const npaAge = parseFloat(el('#npaAge').value || 67);
    let monthsToFromNPA = 0;
    if (dob){ const monthsAge = monthsBetween(dob, retDate); const monthsNPA = Math.round(npaAge * 12); monthsToFromNPA = monthsNPA - monthsAge; }
    const errboYears = Math.max(0, Math.min(3, parseFloat(el('#errboYears').value || 0)));
    const errboMonths = Math.round(errboYears * 12);

    const retType = el('#retType').value || 'age';
    let factor = 1.0, monthsAdj = 0;

    if (retType==='early'){
      const mEarly = Math.max(0, monthsToFromNPA) - errboMonths;
      const m = Math.max(0, mEarly);
      monthsAdj = m; factor = getFactor(state.erfTable, m);
    } else if (retType==='late'){
      const mLate = Math.max(0, -monthsToFromNPA);
      monthsAdj = mLate; factor = getFactor(state.lrfTable, mLate);
    } else { factor = 1.0; monthsAdj = 0; }

    const afterFactor = unreduced * factor;
    let commute = parseFloat(el('#commutePension').value || 0); commute = Math.max(0, Math.min(commute, afterFactor));
    const lump = commute * 12; const payable = afterFactor - commute;

    el('#resMonths').textContent = String(monthsAdj);
    el('#resFactor').textContent = factor.toFixed(4);
    el('#resAfterFactor').textContent = money(afterFactor);
    el('#resLump').textContent = money(lump);
    el('#resPayable').textContent = money(payable);
  }

  const araBody = el('#araBody');
  function renderARA(){
    araBody.innerHTML='';
    const entries=Object.keys(state.araTable).map(k=>({yearEnd:Number(k), ara:Number(state.araTable[k])})).sort((a,b)=>a.yearEnd-b.yearEnd);
    entries.forEach(({yearEnd, ara})=>{
      const tr=document.createElement('tr');
      const yLabel=`${yearEnd-1}/${String(yearEnd).slice(-2)}`;
      const td0=document.createElement('td'); td0.className='center'; td0.textContent=yLabel;
      const td1=document.createElement('td'); td1.className='center';
      const ye=document.createElement('input'); ye.type='number'; ye.step='1'; ye.min='2016'; ye.value=yearEnd; ye.addEventListener('input', e=>{
        const newYearEnd=parseInt(e.target.value||yearEnd,10); if(!Number.isFinite(newYearEnd)) return;
        delete state.araTable[yearEnd]; state.araTable[newYearEnd]=ara; saveJSON('nhs_care_ara', state.araTable); renderARA();
      }); td1.appendChild(ye);
      const td2=document.createElement('td'); td2.className='center';
      const araIn=document.createElement('input'); araIn.type='number'; araIn.step='0.0001'; araIn.value=ara;
      araIn.addEventListener('input', e=>{ const v=parseFloat(e.target.value||0); state.araTable[yearEnd]=v; saveJSON('nhs_care_ara', state.araTable); });
      td2.appendChild(araIn);
      const td3=document.createElement('td'); td3.className='center';
      const del=document.createElement('button'); del.className='btn outline danger'; del.textContent='Delete';
      del.addEventListener('click', ()=>{ delete state.araTable[yearEnd]; saveJSON('nhs_care_ara', state.araTable); renderARA(); });
      td3.appendChild(del);
      tr.append(td0,td1,td2,td3);
      araBody.appendChild(tr);
    });
  }
  function araAddYear(){
    const keys=Object.keys(state.araTable).map(n=>parseInt(n,10)).sort((a,b)=>a-b);
    const last=keys.at(-1)||2026;
    state.araTable[last+1]=0.0000; saveJSON('nhs_care_ara', state.araTable); renderARA();
  }
  function araReset(){ state.araTable = JSON.parse(JSON.stringify(DEFAULT_ARA)); saveJSON('nhs_care_ara', state.araTable); renderARA(); recalc(); }
  function araExport(){ const blob=new Blob([JSON.stringify(state.araTable,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='nhs_care_ara.json'; a.click(); URL.revokeObjectURL(url); }
  function araImport(file){ const r=new FileReader(); r.onload=()=>{ try{ const obj=JSON.parse(r.result); if (obj && typeof obj==='object'){ state.araTable=obj; saveJSON('nhs_care_ara', state.araTable); renderARA(); recalc(); } }catch{} }; r.readAsText(file); }

  const factorsBody = el('#factorsBody');
  function renderFactors(){
    factorsBody.innerHTML='';
    const rows=[];
    Object.entries(state.erfTable).forEach(([m,f])=>rows.push({type:'ERF',months:Number(m),factor:Number(f)}));
    Object.entries(state.lrfTable).forEach(([m,f])=>rows.push({type:'LRF',months:Number(m),factor:Number(f)}));
    rows.sort((a,b)=> (a.type===b.type)? a.months-b.months : (a.type==='ERF'?-1:1));
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
  function importFactors(file, isERF){
    const r=new FileReader(); r.onload=()=>{
      const text=r.result.trim();
      try{
        if (file.name.toLowerCase().endsWith('.csv')){
          const map = (function(){ const lines=text.split(/\r?\n/).filter(Boolean); const out={}; let start=0;
            if (/months/i.test(lines[0]) && /factor/i.test(lines[0])) start=1;
            for (let i=start;i<lines.length;i++){ const parts=lines[i].split(','); if (parts.length<2) continue;
              const m=parseInt(parts[0].trim(),10); const f=parseFloat(parts[1].trim()); if (Number.isFinite(m)&&Number.isFinite(f)) out[m]=f; }
            return out; })();
          if (Object.keys(map).length){ if (isERF) state.erfTable = map; else state.lrfTable = map; }
        } else {
          const obj=JSON.parse(text); if (obj && typeof obj==='object'){ if (isERF) state.erfTable=obj; else state.lrfTable=obj; }
        }
        saveJSON(isERF?'nhs_care_erf':'nhs_care_lrf', isERF?state.erfTable:state.lrfTable);
        renderFactors();
      }catch{}
    }; r.readAsText(file);
  }

  const root=document.documentElement;
  function setTheme(mode){ if (mode==='system') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', mode); localStorage.setItem('nhs_care_theme', mode); }
  function setCompact(on){ document.body.classList.toggle('compact', !!on); localStorage.setItem('nhs_care_compact', on?'1':'0'); }
  function applyQueryParams(){ const sp=new URLSearchParams(window.location.search);
    if (sp.get('embed')==='1') document.body.setAttribute('data-embed','1');
    if (sp.get('compact')==='1') { setCompact(true); el('#compactToggle').checked=true; }
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

  els('.tab').forEach(btn => btn.addEventListener('click', () => {
    els('.tab').forEach(b => b.classList.remove('active'));
    els('.panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.querySelector(`#panel-${btn.dataset.tab}`).classList.add('active');
  }));

  if ((localStorage.getItem('nhs_care_theme')||'system') !== 'system') root.setAttribute('data-theme', localStorage.getItem('nhs_care_theme'));
  document.body.classList.toggle('compact', (localStorage.getItem('nhs_care_compact')==='1'));

  function init(){
    renderCalcRows(); renderARA(); renderFactors(); applyQueryParams(); recalc();
    el('#recalcBtn').addEventListener('click', recalc);
    el('#addYearBtn').addEventListener('click', ()=>{
      const last=state.years.at(-1); const nextYearEnd=(last?.yearEnd||new Date().getFullYear())+1;
      const yy=`${String(nextYearEnd-1)}/${String(nextYearEnd).slice(-2)}`;
      state.years.push({ label:yy, yearEnd:nextYearEnd, ara: state.araTable[nextYearEnd] ?? 0, pay:0 });
      state.years.sort((a,b)=>a.yearEnd-b.yearEnd); renderCalcRows(); recalc();
    });
    el('#exportBtn').addEventListener('click', ()=>{
      const lines=[[ 'Scheme Year','Year End','ARA','Pensionable Pay','Accrual (Pay/54)' ]];
      state.years.forEach(y=>{ const accr=(y.pay||0)/54; lines.push([y.label,y.yearEnd,(y.ara??0),(y.pay||0).toFixed(2),accr.toFixed(2)]); });
      lines.push([]); lines.push(['Mode', state.mode]); lines.push(['Retirement date', el('#retDate').value || '']); lines.push(['Unreduced at retirement', state.lastUnreduced.toFixed(2)]);
      const csv=lines.map(r=>r.map(v=>String(v).includes(',')?`"${String(v).replaceAll('"','""')}"`:v).join(',')).join('\n');
      const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='nhs_2015_v2_export.csv'; a.click(); URL.revokeObjectURL(url);
    });
    el('#absTarget').addEventListener('input', recalc);
    el('#retDate').addEventListener('change', recalc);
    el('#mode').addEventListener('change', recalc);

    el('#araAddYearBtn').addEventListener('click', ()=>{
      const keys=Object.keys(state.araTable).map(n=>parseInt(n,10)).sort((a,b)=>a-b); const last=keys.at(-1)||2026;
      state.araTable[last+1]=0.0000; saveJSON('nhs_care_ara', state.araTable); renderARA();
    });
    el('#araResetBtn').addEventListener('click', ()=>{ state.araTable={...DEFAULT_ARA}; saveJSON('nhs_care_ara', state.araTable); renderARA(); recalc(); });
    el('#araExportBtn').addEventListener('click', ()=>{
      const blob=new Blob([JSON.stringify(state.araTable,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='nhs_care_ara.json'; a.click(); URL.revokeObjectURL(url);
    });
    el('#araImportInput').addEventListener('change', e=>{ if (e.target.files?.[0]){ const r=new FileReader(); r.onload=()=>{ try{ const obj=JSON.parse(r.result); if (obj&&typeof obj==='object'){ state.araTable=obj; saveJSON('nhs_care_ara', obj); renderARA(); recalc(); } }catch{} }; r.readAsText(e.target.files[0]); } });
    el('#araApplyBtn').addEventListener('click', recalc);

    el('#calcRetBtn').addEventListener('click', applyRetirementFactors);
    el('#erfImport').addEventListener('change', e=>{ if (e.target.files?.[0]) importFactors(e.target.files[0], true); });
    el('#lrfImport').addEventListener('change', e=>{ if (e.target.files?.[0]) importFactors(e.target.files[0], false); });
    el('#erfExportBtn').addEventListener('click', ()=>{
      const blob=new Blob([JSON.stringify(state.erfTable,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='nhs_care_erf.json'; a.click(); URL.revokeObjectURL(url);
    });
    el('#lrfExportBtn').addEventListener('click', ()=>{
      const blob=new Blob([JSON.stringify(state.lrfTable,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='nhs_care_lrf.json'; a.click(); URL.revokeObjectURL(url);
    });
    el('#resetFactorsBtn').addEventListener('click', ()=>{ state.erfTable={0:1.0000}; state.lrfTable={0:1.0000}; saveJSON('nhs_care_erf', state.erfTable); saveJSON('nhs_care_lrf', state.lrfTable); renderFactors(); });

    const themeSelect = el('#themeSelect'); themeSelect.value = (localStorage.getItem('nhs_care_theme')||'system');
    themeSelect.addEventListener('change', ()=> setTheme(themeSelect.value));
    const compactToggle = el('#compactToggle'); compactToggle.checked = (localStorage.getItem('nhs_care_compact')==='1');
    compactToggle.addEventListener('change', ()=> setCompact(compactToggle.checked));
    el('#copyEmbedBtn').addEventListener('click', copyEmbed);
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') setTimeout(init,0);
  else document.addEventListener('DOMContentLoaded', init);
})();
