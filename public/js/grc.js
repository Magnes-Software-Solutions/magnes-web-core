const S3_API_ENDPOINT = "/client";
const REFRESH_INTERVAL_MS = 60_000;

function scoreComponente(pct) {
  if (pct < 70) return Math.round((pct / 70) * 30);
  if (pct < 90) return Math.round(30 + ((pct - 70) / 20) * 40);
  return Math.round(70 + ((pct - 90) / 10) * 30);
}

function scoreServidor(cpu, ram, disco) {
  const sCpu   = scoreComponente(cpu);
  const sRam   = scoreComponente(ram);
  const sDisco = scoreComponente(disco);
  return Math.round(sCpu * 0.40 + sRam * 0.35 + sDisco * 0.25);
}

function scoreAmbiente(servidores) {
  if (!servidores.length) return 0;
  const scores = servidores.map(s => scoreServidor(s.cpu, s.ram, s.disco));
  const media  = scores.reduce((a, b) => a + b, 0) / scores.length;
  const pior   = Math.max(...scores);
  return Math.round(media * 0.70 + pior * 0.30);
}

function agruparPorMaquina(data) {
  const mapa = {};
  data.forEach(linha => {
    const id = linha.macAddress;
    if (!mapa[id] || linha.horario > mapa[id].horario) {
      mapa[id] = linha;
    }
  });
  return Object.values(mapa).map(m => ({
    id:          m.macAddress,
    label:       m.empresa || m.macAddress,
    cpu:         m.cpuUso,
    ram:         m.ramUso,
    disco:       m.discoUso,
    alertaCPU:   m.alertaCPU,
    alertaRAM:   m.alertaRAM,
    alertaDisco: m.alertaDisco,
    horario:     m.horario,
    limiteCPU:   m.limiteCPU,
    limiteRAM:   m.limiteRAM,
    limiteDisco: m.limiteDisco
  }));
}

function gerarTickets(maquinas) {
  const tickets = [];
  maquinas.forEach(m => {
    if (m.alertaCPU)
      tickets.push({ id: `CPU-${m.id.slice(-5)}`, descricao: `CPU acima do limite — ${m.label}`, severidade: "Crítico", tempo: m.horario });
    if (m.alertaRAM)
      tickets.push({ id: `RAM-${m.id.slice(-5)}`, descricao: `RAM acima do limite — ${m.label}`, severidade: "Crítico", tempo: m.horario });
    if (m.alertaDisco)
      tickets.push({ id: `DSC-${m.id.slice(-5)}`, descricao: `Disco acima do limite — ${m.label}`, severidade: "Atenção", tempo: m.horario });
  });
  if (tickets.length === 0)
    tickets.push({ id: "—", descricao: "Nenhum alerta ativo no momento", severidade: "Resolvido", tempo: "—" });
  return tickets;
}

function nivelCor(pct) {
  if (pct >= 90) return { cls: "h-crit", label: pct + "%" };
  if (pct >= 70) return { cls: "h-warn", label: pct + "%" };
  return { cls: "h-ok", label: pct + "%" };
}

function setStatus(ok) {
  const el = document.getElementById("s3-status");
  if (!el) return;
  el.textContent = ok ? "● Dados S3 ao vivo" : "● Dados mockados";
  el.style.color  = ok ? "#3B6D11" : "#854F0B";
}

function renderHeatmap(servidores) {
  const grid = document.getElementById("heatmap-grid");
  if (!grid) return;
  const header = `<div class="hh"></div><div class="hh">CPU</div><div class="hh">RAM</div><div class="hh">Disco</div>`;
  const rows = servidores.map(s => {
    const cpu   = nivelCor(s.cpu);
    const ram   = nivelCor(s.ram);
    const disco = nivelCor(s.disco);
    return `
      <div class="hs">${s.label || s.id}</div>
      <div class="hc ${cpu.cls}">${cpu.label}</div>
      <div class="hc ${ram.cls}">${ram.label}</div>
      <div class="hc ${disco.cls}">${disco.label}</div>`;
  }).join("");
  grid.innerHTML = header + rows;
}

function renderCVEs(cves) {
  const el = document.getElementById("cve-list");
  if (!el) return;
  if (!cves || cves.length === 0) {
    el.innerHTML = `<tr><td colspan="6" style="color:#7a92b0;text-align:center;padding:20px;">Nenhuma CVE no momento</td></tr>`;
    return;
  }
  const barW  = cvss => Math.round(cvss / 10 * 36);
  const barCl = cvss => cvss >= 9 ? "var(--red)"        : "var(--amber)";
  const numCl = cvss => cvss >= 9 ? "var(--red-text)"   : "var(--amber-text)";
  const srvCl = cvss => cvss >= 9 ? "pill-crit"         : "pill-warn";
  const stCl  = st   => st === "Em teste" ? "pill-purple" : "pill-crit";
  el.innerHTML = cves.map(c => `
    <tr>
      <td><span class="cve-id">${c.id}</span></td>
      <td><div class="cvss-wrap">
        <div class="cvss-bar" style="width:${barW(c.cvss)}px;background:${barCl(c.cvss)}"></div>
        <span class="cvss-num" style="color:${numCl(c.cvss)}">${c.cvss}</span>
      </div></td>
      <td>${c.componente}</td>
      <td><span class="pill ${srvCl(c.cvss)}">${c.servidores.join(", ")}</span></td>
      <td><span class="pill ${stCl(c.status)}">${c.status}</span></td>
      <td style="color:var(--text-tertiary);font-size:11px">${c.diasAberto}d</td>
    </tr>`).join("");
}

function renderTickets(tickets) {
  const el = document.getElementById("ticket-list");
  if (!el) return;
  const cls = s => s === "Crítico" ? "pill-crit" : s === "Atenção" ? "pill-warn" : "pill-ok";
  el.innerHTML = tickets.map(t => `
    <div class="ticket-row">
      <div class="tid">${t.id}</div>
      <div class="tdesc">${t.descricao}</div>
      <span class="pill ${cls(t.severidade)}">${t.severidade}</span>
      <div class="tage">${typeof t.tempo === 'string' ? t.tempo : 'agora'}</div>
    </div>`).join("");
}

function renderKPIs(data) {
  const criticas = (data.cves || []).filter(c => c.cvss >= 9 && c.status !== "Resolvido").length;
  const el = document.getElementById("kpi-cves");
  if (el) el.textContent = criticas;
  const el2 = document.getElementById("kpi-cves2");
  if (el2) el2.textContent = criticas;
  const ts = document.getElementById("last-update");
  if (ts && data.atualizado) {
    const d = new Date(data.atualizado);
    ts.textContent = "Atualizado: " + d.toLocaleString("pt-BR");
  }
}

async function carregarDados() {
  const elRisco    = document.getElementById("kpi-risco");
  const elAlertas  = document.getElementById("kpi-alertas");
  const elServs    = document.getElementById("kpi-servidores");
  const elStatus   = document.getElementById("last-update");

  if (!S3_API_ENDPOINT) {
    renderHeatmap(MOCK_DATA.servidores);
    renderCVEs(MOCK_DATA.cves);
    renderTickets(MOCK_DATA.tickets);
    renderKPIs(MOCK_DATA);
    if (elRisco) elRisco.textContent = "72";
    if (elAlertas) elAlertas.textContent = "14";
    if (elServs) elServs.textContent = "24";
    setStatus(false);
    return;
  }

  try {
    const res = await fetch(S3_API_ENDPOINT, { cache: "no-cache" });
    if (!res.ok) throw new Error("HTTP " + res.status);

    const raw      = await res.json();
    const maquinas = agruparPorMaquina(raw);
    const risco    = scoreAmbiente(maquinas);
    const tickets  = gerarTickets(maquinas);
    const criticos = tickets.filter(t => t.severidade === "Crítico").length;

    if (elRisco)   elRisco.textContent   = risco;
    if (elAlertas) elAlertas.textContent = criticos;
    if (elServs)   elServs.textContent   = maquinas.length;
    if (elStatus)  elStatus.textContent  = "Atualizado: " + new Date().toLocaleString("pt-BR");

    renderHeatmap(maquinas);
    renderTickets(tickets);
    renderCVEs([]);
    setStatus(true);

  } catch (err) {
    console.warn("[S3] Falha — usando mock:", err);
    renderHeatmap(MOCK_DATA.servidores);
    renderCVEs(MOCK_DATA.cves);
    renderTickets(MOCK_DATA.tickets);
    renderKPIs(MOCK_DATA);
    if (elRisco) elRisco.textContent = "72";
    if (elAlertas) elAlertas.textContent = "14";
    if (elServs) elServs.textContent = "24";
    setStatus(false);
  }
}

// ── Mock Data ─────────────────────────────────
const MOCK_DATA = {
  atualizado: "2026-05-08T09:42:00Z",
  servidores: [
    { id:"SRV-01", cpu:94, ram:78, disco:41 },
    { id:"SRV-02", cpu:81, ram:96, disco:73 },
    { id:"SRV-03", cpu:38, ram:52, disco:91 },
    { id:"SRV-04", cpu:55, ram:60, disco:44 },
    { id:"SRV-05", cpu:89, ram:77, disco:30 },
    { id:"SRV-06", cpu:22, ram:45, disco:68 }
  ],
  cves: [
    { id:"CVE-2024-1086", cvss:9.8, componente:"Kernel Linux",  servidores:["SRV-02"], status:"Sem patch", diasAberto:47 },
    { id:"CVE-2024-0727", cvss:9.4, componente:"OpenSSL",       servidores:["SRV-01","SRV-02"], status:"Sem patch", diasAberto:38 },
    { id:"CVE-2023-4911", cvss:7.8, componente:"glibc",         servidores:["SRV-02"], status:"Em teste",  diasAberto:22 },
    { id:"CVE-2024-2185", cvss:7.2, componente:"Firmware Dell", servidores:["SRV-01"], status:"Sem patch", diasAberto:15 },
    { id:"CVE-2024-3094", cvss:7.1, componente:"Kernel Linux",  servidores:["SRV-05"], status:"Sem patch", diasAberto:9  }
  ],
  tickets: [
    { id:"INFRA-1042", descricao:"CPU crítica — SRV-01 >90%",    severidade:"Crítico",  tempo:"2h" },
    { id:"INFRA-1039", descricao:"RAM crítica — SRV-02 >95%",    severidade:"Crítico",  tempo:"5h" },
    { id:"INFRA-1035", descricao:"Disco próximo limite — SRV-03", severidade:"Atenção",  tempo:"1d" },
    { id:"INFRA-1031222", descricao:"CPU elevada — SRV-05",          severidade:"Atenção",  tempo:"2d" },
    { id:"INFRA-1027", descricao:"RAM normalizada — SRV-02",      severidade:"Resolvido",tempo:"3d" }
  ]
};

carregarDados();
setInterval(carregarDados, REFRESH_INTERVAL_MS);


const labels7=['02/mai','03/mai','04/mai','05/mai','06/mai','07/mai','08/mai'];
new Chart(document.getElementById('trendChart'),{
  type:'bar',
  data:{labels:labels7,datasets:[
    {type:'line',label:'CPU',data:[62,65,71,78,80,83,84],borderColor:'#378ADD',borderWidth:2,pointRadius:3,fill:false,tension:.35,yAxisID:'y'},
    {type:'line',label:'RAM',data:[64,66,68,69,71,70,72],borderColor:'#1D9E75',borderWidth:2,pointRadius:3,fill:false,tension:.35,borderDash:[5,3],yAxisID:'y'},
    {type:'line',label:'Disco',data:[48,52,55,59,63,67,70],borderColor:'#BA7517',borderWidth:2,pointRadius:3,fill:false,tension:.35,borderDash:[2,2],yAxisID:'y'},
    {type:'line',label:'Limiar',data:Array(7).fill(85),borderColor:'#E24B4A',borderWidth:1.5,borderDash:[6,4],pointRadius:0,fill:false,yAxisID:'y'},
    {type:'bar',label:'Novas CVEs',data:[1,0,2,1,3,2,3],backgroundColor:'rgba(83,74,183,0.22)',borderColor:'#534AB7',borderWidth:1,yAxisID:'y2',borderRadius:3}
  ]},
  options:{responsive:true,maintainAspectRatio:false,
    plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>ctx.dataset.label+': '+(ctx.dataset.yAxisID==='y2'?ctx.parsed.y+' CVEs':ctx.parsed.y+'%')}}},
    scales:{
      x:{ticks:{font:{size:11},color:'#888'},grid:{display:false}},
      y:{min:20,max:100,ticks:{font:{size:11},color:'#888',stepSize:20,callback:v=>v+'%'},grid:{color:'rgba(0,0,0,0.05)'},position:'left'},
      y2:{min:0,max:6,ticks:{font:{size:11},color:'#aaa',stepSize:2,callback:v=>Math.round(v)},grid:{display:false},position:'right'}
    }}
});

new Chart(document.getElementById('cveTrend'),{
  type:'bar',
  data:{labels:['Nov','Dez','Jan','Fev','Mar','Abr'],datasets:[
    {label:'Críticas',data:[2,1,2,3,4,5],backgroundColor:'#E24B4A',borderWidth:0},
    {label:'Altas',data:[4,3,4,5,6,8],backgroundColor:'#EF9F27',borderWidth:0},
    {label:'Médias',data:[5,4,5,6,5,7],backgroundColor:'#85B7EB',borderWidth:0}
  ]},
  options:{responsive:true,maintainAspectRatio:false,
    plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>ctx.dataset.label+': '+ctx.parsed.y+' CVEs'}}},
    scales:{
      x:{stacked:true,ticks:{font:{size:11},color:'#888'},grid:{display:false}},
      y:{stacked:true,ticks:{font:{size:11},color:'#888',stepSize:5,callback:v=>Math.round(v)},grid:{color:'rgba(0,0,0,0.05)'}}
    }}
});

function setPeriod(btn){btn.closest('.period-group').querySelectorAll('.pbtn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');}