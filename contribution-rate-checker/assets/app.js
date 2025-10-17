/* LAS Contribution Rate Checker (vanilla JS) */
const RATE_TABLES = {
  "2015/16": {
    "bands": [
      {
        "lower": 0,
        "upper": 15431.99,
        "rate": 0.05
      },
      {
        "lower": 15432.0,
        "upper": 21477.99,
        "rate": 0.056
      },
      {
        "lower": 21478.0,
        "upper": 26823.99,
        "rate": 0.071
      },
      {
        "lower": 26824.0,
        "upper": 47845.99,
        "rate": 0.093
      },
      {
        "lower": 47846.0,
        "upper": 70630.99,
        "rate": 0.125
      },
      {
        "lower": 70631.0,
        "upper": 111376.99,
        "rate": 0.135
      },
      {
        "lower": 111377.0,
        "upper": 9999999.99,
        "rate": 0.145
      }
    ],
    "source": "NHS Pensions factsheet V7 (2015-2022 bands)"
  },
  "2016/17": {
    "bands": [
      {
        "lower": 0,
        "upper": 15431.99,
        "rate": 0.05
      },
      {
        "lower": 15432.0,
        "upper": 21477.99,
        "rate": 0.056
      },
      {
        "lower": 21478.0,
        "upper": 26823.99,
        "rate": 0.071
      },
      {
        "lower": 26824.0,
        "upper": 47845.99,
        "rate": 0.093
      },
      {
        "lower": 47846.0,
        "upper": 70630.99,
        "rate": 0.125
      },
      {
        "lower": 70631.0,
        "upper": 111376.99,
        "rate": 0.135
      },
      {
        "lower": 111377.0,
        "upper": 9999999.99,
        "rate": 0.145
      }
    ],
    "source": "NHS Pensions factsheet V7 (2015-2022 bands)"
  },
  "2017/18": {
    "bands": [
      {
        "lower": 0,
        "upper": 15431.99,
        "rate": 0.05
      },
      {
        "lower": 15432.0,
        "upper": 21477.99,
        "rate": 0.056
      },
      {
        "lower": 21478.0,
        "upper": 26823.99,
        "rate": 0.071
      },
      {
        "lower": 26824.0,
        "upper": 47845.99,
        "rate": 0.093
      },
      {
        "lower": 47846.0,
        "upper": 70630.99,
        "rate": 0.125
      },
      {
        "lower": 70631.0,
        "upper": 111376.99,
        "rate": 0.135
      },
      {
        "lower": 111377.0,
        "upper": 9999999.99,
        "rate": 0.145
      }
    ],
    "source": "NHS Pensions factsheet V7 (2015-2022 bands)"
  },
  "2018/19": {
    "bands": [
      {
        "lower": 0,
        "upper": 15431.99,
        "rate": 0.05
      },
      {
        "lower": 15432.0,
        "upper": 21477.99,
        "rate": 0.056
      },
      {
        "lower": 21478.0,
        "upper": 26823.99,
        "rate": 0.071
      },
      {
        "lower": 26824.0,
        "upper": 47845.99,
        "rate": 0.093
      },
      {
        "lower": 47846.0,
        "upper": 70630.99,
        "rate": 0.125
      },
      {
        "lower": 70631.0,
        "upper": 111376.99,
        "rate": 0.135
      },
      {
        "lower": 111377.0,
        "upper": 9999999.99,
        "rate": 0.145
      }
    ],
    "source": "NHS Pensions factsheet V7 (2015-2022 bands)"
  },
  "2019/20": {
    "bands": [
      {
        "lower": 0,
        "upper": 15431.99,
        "rate": 0.05
      },
      {
        "lower": 15432.0,
        "upper": 21477.99,
        "rate": 0.056
      },
      {
        "lower": 21478.0,
        "upper": 26823.99,
        "rate": 0.071
      },
      {
        "lower": 26824.0,
        "upper": 47845.99,
        "rate": 0.093
      },
      {
        "lower": 47846.0,
        "upper": 70630.99,
        "rate": 0.125
      },
      {
        "lower": 70631.0,
        "upper": 111376.99,
        "rate": 0.135
      },
      {
        "lower": 111377.0,
        "upper": 9999999.99,
        "rate": 0.145
      }
    ],
    "source": "NHS Pensions factsheet V7 (2015-2022 bands)"
  },
  "2020/21": {
    "bands": [
      {
        "lower": 0,
        "upper": 15431.99,
        "rate": 0.05
      },
      {
        "lower": 15432.0,
        "upper": 21477.99,
        "rate": 0.056
      },
      {
        "lower": 21478.0,
        "upper": 26823.99,
        "rate": 0.071
      },
      {
        "lower": 26824.0,
        "upper": 47845.99,
        "rate": 0.093
      },
      {
        "lower": 47846.0,
        "upper": 70630.99,
        "rate": 0.125
      },
      {
        "lower": 70631.0,
        "upper": 111376.99,
        "rate": 0.135
      },
      {
        "lower": 111377.0,
        "upper": 9999999.99,
        "rate": 0.145
      }
    ],
    "source": "NHS Pensions factsheet V7 (2015-2022 bands)"
  },
  "2021/22": {
    "bands": [
      {
        "lower": 0,
        "upper": 15431.99,
        "rate": 0.05
      },
      {
        "lower": 15432.0,
        "upper": 21477.99,
        "rate": 0.056
      },
      {
        "lower": 21478.0,
        "upper": 26823.99,
        "rate": 0.071
      },
      {
        "lower": 26824.0,
        "upper": 47845.99,
        "rate": 0.093
      },
      {
        "lower": 47846.0,
        "upper": 70630.99,
        "rate": 0.125
      },
      {
        "lower": 70631.0,
        "upper": 111376.99,
        "rate": 0.135
      },
      {
        "lower": 111377.0,
        "upper": 9999999.99,
        "rate": 0.145
      }
    ],
    "source": "NHS Pensions factsheet V7 (2015-2022 bands)"
  },
  "2022/23": {
    "bands": [
      {
        "lower": 0,
        "upper": 15431.99,
        "rate": 0.05
      },
      {
        "lower": 15432.0,
        "upper": 21477.99,
        "rate": 0.056
      },
      {
        "lower": 21478.0,
        "upper": 26823.99,
        "rate": 0.071
      },
      {
        "lower": 26824.0,
        "upper": 47845.99,
        "rate": 0.093
      },
      {
        "lower": 47846.0,
        "upper": 70630.99,
        "rate": 0.125
      },
      {
        "lower": 70631.0,
        "upper": 111376.99,
        "rate": 0.135
      },
      {
        "lower": 111377.0,
        "upper": 9999999.99,
        "rate": 0.145
      }
    ],
    "source": "NHS Pensions factsheet V7 (2015-2022 bands)"
  },
  "2022/23 (Apr\u2013Sep)": {
    "bands": [
      {
        "lower": 0,
        "upper": 15431.99,
        "rate": 0.05
      },
      {
        "lower": 15432.0,
        "upper": 21477.99,
        "rate": 0.056
      },
      {
        "lower": 21478.0,
        "upper": 26823.99,
        "rate": 0.071
      },
      {
        "lower": 26824.0,
        "upper": 47845.99,
        "rate": 0.093
      },
      {
        "lower": 47846.0,
        "upper": 70630.99,
        "rate": 0.125
      },
      {
        "lower": 70631.0,
        "upper": 111376.99,
        "rate": 0.135
      },
      {
        "lower": 111377.0,
        "upper": 9999999.99,
        "rate": 0.145
      }
    ],
    "note": "Old structure up to 30 Sep 2022"
  },
  "2023/24": {
    "bands": [
      {
        "lower": 0.0,
        "upper": 13246.99,
        "rate": 0.051
      },
      {
        "lower": 13247.0,
        "upper": 17673.99,
        "rate": 0.057
      },
      {
        "lower": 17674.0,
        "upper": 24022.99,
        "rate": 0.061
      },
      {
        "lower": 24023.0,
        "upper": 25146.99,
        "rate": 0.068
      },
      {
        "lower": 25147.0,
        "upper": 29635.99,
        "rate": 0.077
      },
      {
        "lower": 29636.0,
        "upper": 30638.99,
        "rate": 0.088
      },
      {
        "lower": 30639.0,
        "upper": 45996.99,
        "rate": 0.098
      },
      {
        "lower": 45997.0,
        "upper": 51708.99,
        "rate": 0.1
      },
      {
        "lower": 51709.0,
        "upper": 58972.99,
        "rate": 0.116
      },
      {
        "lower": 58973.0,
        "upper": 75632.99,
        "rate": 0.125
      },
      {
        "lower": 75633.0,
        "upper": 999999.99,
        "rate": 0.135
      }
    ]
  },
  "2022/23 (Oct\u2013Mar)": {
    "bands": [
      {
        "lower": 0.0,
        "upper": 13246.99,
        "rate": 0.051
      },
      {
        "lower": 13247.0,
        "upper": 17673.99,
        "rate": 0.057
      },
      {
        "lower": 17674.0,
        "upper": 24022.99,
        "rate": 0.061
      },
      {
        "lower": 24023.0,
        "upper": 25146.99,
        "rate": 0.068
      },
      {
        "lower": 25147.0,
        "upper": 29635.99,
        "rate": 0.077
      },
      {
        "lower": 29636.0,
        "upper": 30638.99,
        "rate": 0.088
      },
      {
        "lower": 30639.0,
        "upper": 45996.99,
        "rate": 0.098
      },
      {
        "lower": 45997.0,
        "upper": 51708.99,
        "rate": 0.1
      },
      {
        "lower": 51709.0,
        "upper": 58972.99,
        "rate": 0.116
      },
      {
        "lower": 58973.0,
        "upper": 75632.99,
        "rate": 0.125
      },
      {
        "lower": 75633.0,
        "upper": 999999.99,
        "rate": 0.135
      }
    ],
    "note": "New structure from 1 Oct 2022"
  },
  "2024/25": {
    "bands": [
      {
        "lower": 0.0,
        "upper": 13259.99,
        "rate": 0.052
      },
      {
        "lower": 13260.0,
        "upper": 27288.99,
        "rate": 0.065
      },
      {
        "lower": 27289.0,
        "upper": 33247.99,
        "rate": 0.083
      },
      {
        "lower": 33248.0,
        "upper": 49913.99,
        "rate": 0.098
      },
      {
        "lower": 49914.0,
        "upper": 63994.99,
        "rate": 0.107
      },
      {
        "lower": 63995.0,
        "upper": 9999999.99,
        "rate": 0.125
      }
    ]
  },
  "2025/26": {
    "bands": [
      {
        "lower": 0.0,
        "upper": 13259.99,
        "rate": 0.052
      },
      {
        "lower": 13260.0,
        "upper": 27797.99,
        "rate": 0.065
      },
      {
        "lower": 27798.0,
        "upper": 33868.99,
        "rate": 0.083
      },
      {
        "lower": 33869.0,
        "upper": 50845.99,
        "rate": 0.098
      },
      {
        "lower": 50846.0,
        "upper": 65190.99,
        "rate": 0.107
      },
      {
        "lower": 65191.0,
        "upper": 9999999.99,
        "rate": 0.125
      }
    ]
  }
};

function getCurrentSchemeYear(date=new Date()){
  const y = date.getFullYear(), m = date.getMonth()+1; // Jan=1
  if(m>=4){ return `${y}/${String(y+1).slice(-2)}` }
  return `${y-1}/${String(y).slice(-2)}`
}
function bandsForYear(year){
  if(year === "2022/23"){
    return RATE_TABLES["2022/23 (Oct–Mar)"].bands;
  }
  if(!RATE_TABLES[year]){
    return RATE_TABLES[getCurrentSchemeYear()]?.bands || [];
  }
  return RATE_TABLES[year].bands;
}
function findRate(year, wtePay){
  const bands = bandsForYear(year);
  for(const b of bands){
    const hi = (typeof b.upper==="number")? b.upper : Number.MAX_SAFE_INTEGER;
    if(wtePay >= b.lower && wtePay <= hi){
      return { rate: b.rate, band: b.band || "" };
    }
  }
  return { rate: NaN, band: "" };
}
function fmtGBP(n){ return n?.toLocaleString('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:2}) }
function pct(n){ return (n*100).toFixed(1)+'%' }
function byId(id){ return document.getElementById(id) }
function init(){
  const yearSel = byId('schemeYear');
  const keys = Object.keys(RATE_TABLES).sort((a,b)=>{
    const ax = a.replace(/\D/g,''); const bx=b.replace(/\D/g,'');
    return Number(ax)-Number(bx);
  });
  for(const k of keys){
    const opt = document.createElement('option');
    opt.value = k; opt.textContent = k;
    yearSel.appendChild(opt);
  }
  const autoYear = getCurrentSchemeYear();
  yearSel.value = RATE_TABLES[autoYear] ? autoYear : keys[keys.length-1];
  document.querySelectorAll('[data-toggle]').forEach(chip=>{
    chip.addEventListener('click', ()=>{
      const group = chip.getAttribute('data-toggle');
      document.querySelectorAll(`[data-toggle="${group}"]`).forEach(c=>c.classList.remove('active'));
      chip.classList.add('active');
      const mode = document.querySelector('.chip.active[data-toggle="mode"]')?.getAttribute('data-value');
      document.querySelectorAll('.mode-panel').forEach(p=>p.style.display='none');
      const panel = byId('panel-'+mode); if(panel) panel.style.display='block';
      calc();
    })
  });
  document.querySelector('[data-toggle="mode"][data-value="wte"]').classList.add('active');
  document.querySelector('[data-toggle="emp"][data-value="officer"]').classList.add('active');
  byId('panel-wte').style.display='block';
  document.querySelectorAll('input,select').forEach(el=>{ el.addEventListener('input', calc); el.addEventListener('change', calc); });
  const params = new URLSearchParams(location.search);
  if(params.get('admin')==='1'){ byId('admin').style.display='block' }
  byId('export').addEventListener('click', exportBands);
  byId('import').addEventListener('click', importBands);
  calc();
}
function currentMode(){ return document.querySelector('.chip.active[data-toggle="mode"]').getAttribute('data-value') }
function currentEmp(){ return document.querySelector('.chip.active[data-toggle="emp"]').getAttribute('data-value') }
function currentWTE(){
  const mode = currentMode();
  if(mode==='wte'){
    return parseFloat(byId('wtePay').value||0);
  }else{
    const actual = parseFloat(byId('actualPay').value||0);
    const hours = parseFloat(byId('hours').value||0);
    const wthours = parseFloat(byId('wtHours').value||37.5);
    const unsocial = parseFloat(byId('unsocial').value||0);
    if(hours>0 && wthours>0){
      const baseWTE = actual * (wthours / hours);
      return baseWTE + unsocial; 
    }
    return 0;
  }
}
function calc(){
  const year = byId('schemeYear').value;
  const wte = currentWTE();
  const res = findRate(year, wte);
  const rate = res.rate;
  const band = res.band || '';
  const annual = isFinite(rate) ? wte * rate : 0;
  const monthly = annual/12;
  byId('outYear').textContent = year;
  byId('outPay').textContent = fmtGBP(wte);
  byId('outRate').textContent = isFinite(rate)? pct(rate) : '—';
  byId('outBand').textContent = band || '—';
  byId('outAnnual').textContent = fmtGBP(annual);
  byId('outMonthly').textContent = fmtGBP(monthly);
  const tbody = byId('bandsBody');
  tbody.innerHTML='';
  for(const b of bandsForYear(year)){
    const tr = document.createElement('tr');
    const inBand = (wte >= b.lower && wte <= b.upper);
    tr.innerHTML = `<td>${fmtGBP(b.lower)} – ${fmtGBP(b.upper)}</td>
                    <td>${pct(b.rate)}</td>
                    <td>${inBand ? '✓' : ''}</td>`;
    tbody.appendChild(tr);
  }
}
function exportBands(){
  const blob = new Blob([JSON.stringify(RATE_TABLES,null,2)],{type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'las-contribution-bands.json';
  a.click();
}
function importBands(){
  const txt = byId('bandsJson').value.trim();
  if(!txt) return;
  try{
    const obj = JSON.parse(txt);
    Object.assign(RATE_TABLES, obj);
    byId('schemeYear').innerHTML='';
    init();
    alert('Bands loaded from JSON. This is temporary; update the repo to persist.');
  }catch(e){
    alert('Invalid JSON: '+e.message);
  }
}
document.addEventListener('DOMContentLoaded', init);
