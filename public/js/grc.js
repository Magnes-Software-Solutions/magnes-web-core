const S3_API_ENDPOINT = "/client";
const REFRESH_INTERVAL_MS = 60_000;

function scoreComponente(pct) {
  if (pct < 70) return Math.round((pct / 70) * 30);
  if (pct < 90) return Math.round(30 + ((pct - 70) / 20) * 40);
  return Math.round(70 + ((pct - 90) / 10) * 30);
}

function scoreServidor(cpu, ram, disco) {
  const sCpu = scoreComponente(cpu);
  const sRam = scoreComponente(ram);
  const sDisco = scoreComponente(disco);
  return Math.round(sCpu * 0.40 + sRam * 0.35 + sDisco * 0.25);
}

function scoreAmbiente(servidores) {
  if (!servidores.length) return 0;
  let soma = 0;
  let pior = 0;
  for (let i = 0; i < servidores.length; i++) {
    const s = servidores[i];
    const score = scoreServidor(s.cpu, s.ram, s.disco);
    soma += score;
    if (score > pior) pior = score;
  }
  const media = soma / servidores.length;
  return Math.round(media * 0.70 + pior * 0.30);
}

function agruparPorMaquina(data) {
  const mapa = {};
  for (let i = 0; i < data.length; i++) {
    const linha = data[i];
    const id = linha.macAddress;
    if (!mapa[id] || linha.horario > mapa[id].horario) {
      mapa[id] = linha;
    }
  }
  const resultado = [];
  const chaves = Object.keys(mapa);
  for (let i = 0; i < chaves.length; i++) {
    const m = mapa[chaves[i]];
    resultado.push({
      id: m.macAddress,
      label: m.empresa || m.macAddress,
      cpu: m.cpuUso,
      ram: m.ramUso,
      disco: m.discoUso,
      alertaCPU: m.alertaCPU,
      alertaRAM: m.alertaRAM,
      alertaDisco: m.alertaDisco,
      horario: m.horario,
      limiteCPU: m.limiteCPU,
      limiteRAM: m.limiteRAM,
      limiteDisco: m.limiteDisco
    });
  }
  return resultado;
}

function gerarTickets(maquinas) {
  const tickets = [];
  for (let i = 0; i < maquinas.length; i++) {
    const m = maquinas[i];
    if (m.alertaCPU) {
      tickets.push({ id: "CPU-" + m.id.slice(-5), descricao: "CPU acima do limite — " + m.label, severidade: "Crítico", tempo: m.horario });
    }
    if (m.alertaRAM) {
      tickets.push({ id: "RAM-" + m.id.slice(-5), descricao: "RAM acima do limite — " + m.label, severidade: "Crítico", tempo: m.horario });
    }
    if (m.alertaDisco) {
      tickets.push({ id: "DSC-" + m.id.slice(-5), descricao: "Disco acima do limite — " + m.label, severidade: "Atenção", tempo: m.horario });
    }
  }
  if (tickets.length === 0) {
    tickets.push({ id: "—", descricao: "Nenhum alerta ativo no momento", severidade: "Resolvido", tempo: "—" });
  }
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
  
  if (ok) {
    el.textContent = "Dados S3";
    el.style.color = "#3B6D11";
  } else {
    el.textContent = "Blablá";
    el.style.color = "#854F0B";
  }
}

function renderHeatmap(servidores) {
  const grid = document.getElementById("heatmap-grid");
  if (!grid) return;
  let html = '<div class="hh"></div><div class="hh">CPU</div><div class="hh">RAM</div><div class="hh">Disco</div>';
  for (let i = 0; i < servidores.length; i++) {
    const s = servidores[i];
    const cpu = nivelCor(s.cpu);
    const ram = nivelCor(s.ram);
    const disco = nivelCor(s.disco);
    html += '<div class="hs">' + (s.label || s.id) + '</div>';
    html += '<div class="hc ' + cpu.cls + '">' + cpu.label + '</div>';
    html += '<div class="hc ' + ram.cls + '">' + ram.label + '</div>';
    html += '<div class="hc ' + disco.cls + '">' + disco.label + '</div>';
  }
  grid.innerHTML = html;
}

function renderCVEs(cves) {
  const el = document.getElementById("cve-list");
  if (!el) return;
  if (!cves || cves.length === 0) {
    el.innerHTML = '<tr><td colspan="6" style="color:#7a92b0;text-align:center;padding:20px;">Nenhuma CVE no momento</td></tr>';
    return;
  }
  let html = '';
  for (let i = 0; i < cves.length; i++) {
    const c = cves[i];
    const barW = Math.round(c.cvss / 10 * 36);
    const critico = c.cvss >= 9;
    const barCor = critico ? "#f43f5e" : "#fbbf24";
    const numCor = critico ? "#f87171" : "#fde68a";
    const srvCl = critico ? "pill-crit" : "pill-warn";
    const stCl = c.status === "Em teste" ? "pill-purple" : "pill-crit";
    html += '<tr>';
    html += '<td><span class="cve-id">' + c.id + '</span></td>';
    html += '<td><div class="cvss-wrap"><div class="cvss-bar" style="width:' + barW + 'px;background:' + barCor + '"></div><span class="cvss-num" style="color:' + numCor + '">' + c.cvss + '</span></div></td>';
    html += '<td>' + c.componente + '</td>';
    html += '<td><span class="pill ' + srvCl + '">' + c.servidores.join(", ") + '</span></td>';
    html += '<td><span class="pill ' + stCl + '">' + c.status + '</span></td>';
    html += '<td style="color:#5a7a9c;font-size:11px">' + c.diasAberto + 'd</td>';
    html += '</tr>';
  }
  el.innerHTML = html;
}

function renderTickets(tickets) {
  const el = document.getElementById("ticket-list");
  if (!el) return;
  let html = '';
  for (let i = 0; i < tickets.length; i++) {
    const t = tickets[i];
    let cls = "pill-ok";
    if (t.severidade === "Crítico") cls = "pill-crit";
    else if (t.severidade === "Atenção") cls = "pill-warn";
    const tempo = typeof t.tempo === 'string' ? t.tempo : 'agora';
    html += '<div class="ticket-row">';
    html += '<div class="tid">' + t.id + '</div>';
    html += '<div class="tdesc">' + t.descricao + '</div>';
    html += '<span class="pill ' + cls + '">' + t.severidade + '</span>';
    html += '<div class="tage">' + tempo + '</div>';
    html += '</div>';
  }
  el.innerHTML = html;
}

function renderKPIs(data) {
  let criticas = 0;
  const cves = data.cves || [];
  for (let i = 0; i < cves.length; i++) {
    if (cves[i].cvss >= 9 && cves[i].status !== "Resolvido") {
      criticas++;
    }
  }
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
  const elRisco = document.getElementById("kpi-risco");
  const elAlertas = document.getElementById("kpi-alertas");
  const elServs = document.getElementById("kpi-servidores");
  const elStatus = document.getElementById("last-update");

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

    const raw = await res.json();
    const maquinas = agruparPorMaquina(raw);
    const risco = scoreAmbiente(maquinas);
    const tickets = gerarTickets(maquinas);
    let criticos = 0;
    for (let i = 0; i < tickets.length; i++) {
      if (tickets[i].severidade === "Crítico") criticos++;
    }

    if (elRisco) elRisco.textContent = risco;
    if (elAlertas) elAlertas.textContent = criticos;
    if (elServs) elServs.textContent = maquinas.length;
    if (elStatus) elStatus.textContent = "Atualizado: " + new Date().toLocaleString("pt-BR");

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

const labels7 = ['02/mai','03/mai','04/mai','05/mai','06/mai','07/mai','08/mai'];
new Chart(document.getElementById('trendChart'), {
  type:'bar',
  data: {
    labels: labels7,
    datasets: [
      { type:'line', label:'CPU', data:[62,65,71,78,80,83,84], borderColor:'#378ADD', borderWidth:2, pointRadius:3, fill:false, tension:.35, yAxisID:'y' },
      { type:'line', label:'RAM', data:[64,66,68,69,71,70,72], borderColor:'#1D9E75', borderWidth:2, pointRadius:3, fill:false, tension:.35, borderDash:[5,3], yAxisID:'y' },
      { type:'line', label:'Disco', data:[48,52,55,59,63,67,70], borderColor:'#BA7517', borderWidth:2, pointRadius:3, fill:false, tension:.35, borderDash:[2,2], yAxisID:'y' },
      { type:'line', label:'Limiar', data:[85,85,85,85,85,85,85], borderColor:'#E24B4A', borderWidth:1.5, borderDash:[6,4], pointRadius:0, fill:false, yAxisID:'y' },
      { type:'bar', label:'Novas CVEs', data:[1,0,2,1,3,2,3], backgroundColor:'rgba(83,74,183,0.22)', borderColor:'#534AB7', borderWidth:1, yAxisID:'y2', borderRadius:3 }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: function(ctx) {
            if (ctx.dataset.yAxisID === 'y2') {
              return ctx.dataset.label + ': ' + ctx.parsed.y + ' CVEs';
            }
            return ctx.dataset.label + ': ' + ctx.parsed.y + '%';
          }
        }
      }
    },
    scales: {
      x: { ticks: { font: { size:11 }, color:'#888' }, grid: { display:false } },
      y: { min:20, max:100, ticks: { font: { size:11 }, color:'#888', stepSize:20, callback: function(v) { return v + '%'; } }, grid: { color:'rgba(0,0,0,0.05)' }, position:'left' },
      y2: { min:0, max:6, ticks: { font: { size:11 }, color:'#aaa', stepSize:2, callback: function(v) { return Math.round(v); } }, grid: { display:false }, position:'right' }
    }
  }
});

new Chart(document.getElementById('cveTrend'), {
  type:'bar',
  data: {
    labels: ['Nov','Dez','Jan','Fev','Mar','Abr'],
    datasets: [
      { label:'Críticas', data:[2,1,2,3,4,5], backgroundColor:'#E24B4A', borderWidth:0 },
      { label:'Altas', data:[4,3,4,5,6,8], backgroundColor:'#EF9F27', borderWidth:0 },
      { label:'Médias', data:[5,4,5,6,5,7], backgroundColor:'#85B7EB', borderWidth:0 }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: function(ctx) {
            return ctx.dataset.label + ': ' + ctx.parsed.y + ' CVEs';
          }
        }
      }
    },
    scales: {
      x: { stacked:true, ticks: { font: { size:11 }, color:'#888' }, grid: { display:false } },
      y: { stacked:true, ticks: { font: { size:11 }, color:'#888', stepSize:5, callback: function(v) { return Math.round(v); } }, grid: { color:'rgba(0,0,0,0.05)' } }
    }
  }
});

function setPeriod(btn) {
  const botoes = btn.parentElement.querySelectorAll('.pbtn');
  for (let i = 0; i < botoes.length; i++) {
    botoes[i].classList.remove('active');
  }
  btn.classList.add('active');
}