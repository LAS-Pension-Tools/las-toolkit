(function(){
  const DEFAULT_YEARS = [
    { label: "2015/16", yearEnd: 2016 },
    { label: "2016/17", yearEnd: 2017 },
    { label: "2017/18", yearEnd: 2018 },
    { label: "2018/19", yearEnd: 2019 },
    { label: "2019/20", yearEnd: 2020 },
    { label: "2020/21", yearEnd: 2021 },
    { label: "2021/22", yearEnd: 2022 },
    { label: "2022/23", yearEnd: 2023 },
    { label: "2023/24", yearEnd: 2024 },
    { label: "2024/25", yearEnd: 2025 },
  ];

  const DEFAULT_ARA = {
    2016: 0.014, 2017: 0.025, 2018: 0.045, 2019: 0.039, 2020: 0.032,
    2021: 0.020, 2022: 0.046, 2023: 0.116, 2024: 0.082, 2025: 0.032
  };

  const el = sel => document.querySelector(sel);
  const els = sel => Array.from(document.querySelectorAll(sel));

  const state = {
    years: structuredClone(DEFAULT_YEARS).map(y=>({ ...y, ara: DEFAULT_ARA[y.yearEnd] || 0, pay: 0 })),
    araTable: loadARA(),
    theme: 'system',
    compact: false,
    embed: false,
  };

  function applyARAtoYears(){
    state.years.forEach(y => { y.ara = (state.araTable[y.yearEnd] ?? DEFAULT_ARA[y.yearEnd] ?? 0); });
  }
  applyARAtoYears();

  function loadARA(){
    try { const j = localStorage.getItem('nhs_care_ara'); return j ? JSON.parse(j) : structuredClone(DEFAULT_ARA); }
    catch { return structuredClone(DEFAULT_ARA); }
  }
  function saveARA(){ localStorage.setItem('nhs_care_ara', JSON.stringify(state.araTable)); }

  function money(n){ if (isNaN(n) || !isFinite(n)) return '£0.00'; return new Intl.NumberFormat('en-GB', { style:'currency', currency:'GBP' }).format(n); }

  els('.tab').forEach(btn => btn.addEventListener('click', () => {
    els('.tab').forEach(b => b.classList.remove('active'));
    els('.panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    el(`#panel-${btn.dataset.tab}`).classList.add('active');
  }));

  const tbody = el('#tbody');
  function renderCalcRows(){
    tbody.innerHTML = '';
    state.years.forEach((y, i) => {
      const tr = document.createElement('tr');

      const td0 = document.createElement('td'); td0.className = 'center';
      const yearInput = document.createElement('input'); yearInput.type='text'; yearInput.value=y.label; yearInput.className='center';
      yearInput.addEventListener('change', e=>{ y.label = e.target.value; });
      td0.appendChild(yearInput);

      const td1 = document.createElement('td'); td1.className = 'center';
      const ye = document.createElement('input'); ye.type='text'; ye.value=`31/03/${y.yearEnd}`; ye.className='center';
      ye.addEventListener('change', e=>{ const v=e.target.value.trim().slice(-4); const n=parseInt(v,10); if(!isNaN(n)) y.yearEnd = n; y.ara = state.araTable[y.yearEnd] ?? y.ara; recalc();});
      td1.appendChild(ye);

      const td2 = document.createElement('td'); td2.className = 'center';
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
      araIn.addEventListener('input', e=>{
        const v = parseFloat(e.target.value||0); state.araTable[yearEnd] = v; saveARA();
      });
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
    const last = keys.at(-1) || 2025;
    state.araTable[last+1] = 0.0000; saveARA(); renderARA();
  }
  function araReset(){ state.araTable = structuredClone(DEFAULT_ARA); saveARA(); renderARA(); applyARAtoYears(); renderCalcRows(); recalc(); }
  function araExport(){ const blob = new Blob([JSON.stringify(state.araTable, null, 2)], {type:'application/json'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'nhs_care_ara.json'; a.click(); URL.revokeObjectURL(url); }
  function araImport(file){ const r = new FileReader(); r.onload = () => { try { const obj = JSON.parse(r.result); if (obj && typeof obj === 'object') { state.araTable = obj; saveARA(); renderARA(); } } catch {} }; r.readAsText(file); }
  function araApply(){ applyARAtoYears(); renderCalcRows(); recalc(); }

  const root = document.documentElement;
  function setTheme(mode){
    state.theme = mode;
    if (mode === 'system') { root.removeAttribute('data-theme'); }
    else { root.setAttribute('data-theme', mode); }
    localStorage.setItem('nhs_care_theme', mode);
  }
  function setCompact(on){ state.compact = !!on; document.body.classList.toggle('compact', state.compact); localStorage.setItem('nhs_care_compact', state.compact ? '1':'0'); }

  function loadPrefs(){
    const t = localStorage.getItem('nhs_care_theme'); if (t) setTheme(t);
    const c = localStorage.getItem('nhs_care_compact'); if (c === '1') setCompact(true);
  }

  const themeSelect = el('#themeSelect');
  themeSelect.addEventListener('change', ()=> setTheme(themeSelect.value));
  const compactToggle = el('#compactToggle');
  compactToggle.addEventListener('change', ()=> setCompact(compactToggle.checked));

  function buildEmbedUrl(base){
    const u = new URL(base, window.location.origin);
    u.searchParams.set('embed','1');
    u.searchParams.set('compact','1');
    const t = state.theme !== 'system' ? state.theme : 'dark';
    u.searchParams.set('theme', t);
    const abs = parseFloat(el('#embedAbs').value || 0); if (abs>0) u.searchParams.set('abs', abs.toFixed(2));
    return u.toString();
  }
  el('#copyEmbedBtn').addEventListener('click', ()=>{
    const base = window.location.pathname.replace(/\/[^\/]*$/, '/') + 'index.html';
    const url = buildEmbedUrl(base);
    const iframe = `<iframe src="${url}" width="100%" height="780" style="border:0; overflow:hidden;" loading="lazy" referrerpolicy="no-referrer"></iframe>`;
    navigator.clipboard.writeText(iframe).then(()=>{ alert('Embed code copied to clipboard'); });
  });

  function applyQueryParams(){
    const sp = new URLSearchParams(window.location.search);
    if (sp.get('embed') === '1') { document.body.setAttribute('data-embed','1'); }
    if (sp.get('compact') === '1') { setCompact(true); compactToggle.checked = true; }
    const th = sp.get('theme'); if (th) { themeSelect.value = th; setTheme(th); }
    const abs = sp.get('abs'); if (abs) { el('#absTarget').value = abs; }
  }

  document.querySelector('#recalcBtn').addEventListener('click', recalc);
  document.querySelector('#addYearBtn').addEventListener('click', addCalcYear);
  document.querySelector('#exportBtn').addEventListener('click', exportCSV);
  document.querySelector('#absTarget').addEventListener('input', recalc);

  document.querySelector('#araAddYearBtn').addEventListener('click', araAddYear);
  document.querySelector('#araResetBtn').addEventListener('click', araReset);
  document.querySelector('#araExportBtn').addEventListener('click', araExport);
  document.querySelector('#araImportInput').addEventListener('change', (e)=>{ if (e.target.files?.[0]) araImport(e.target.files[0]); });
  document.querySelector('#araApplyBtn').addEventListener('click', araApply);

  loadPrefs();
  applyQueryParams();
  themeSelect.value = state.theme;
  compactToggle.checked = state.compact;

  renderCalcRows();
  renderARA();
  recalc();
})();