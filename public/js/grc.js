// ─────────────────────────────────────────────
//  GRC.js — Dashboard GRC Magnes
//  Integração dinâmica com /client (dadosPerfeitos.json)
//  Sem dados mockados — estado de indisponível em caso de falha
// ─────────────────────────────────────────────

const S3_API_ENDPOINT   = "/client";   // ← substituir pela URL pré-assinada em produção
const REFRESH_INTERVAL_MS = 60_000;

// ─── NVD (consumido separadamente via nvd.js) ───
// A instância é criada aqui e usada em carregarDados()
const nvdIntegration = typeof NVDIntegration !== "undefined" ? new NVDIntegration() : null;

// ════════════════════════════════════════════════
//  ADAPTADOR — converte JSON real → modelo interno
// ════════════════════════════════════════════════
function adaptarMaquina(m) {
  const fd = m.financeiroDashboard || {};
  return {
    id:          m.macAddress,
    label:       m.empresa || m.macAddress,
    horario:     m.horario,

    // Métricas de uso
    cpu:         m.cpu?.uso         ?? 0,
    ram:         m.ram?.uso         ?? m.ramUso ?? 0,
    disco:       m.disco?.uso       ?? 0,

    // Alertas vindos do financeiroDashboard
    alertaCPU:   fd.alertas?.cpu    ?? false,
    alertaRAM:   fd.alertas?.ram    ?? false,
    alertaDisco: fd.alertas?.disco  ?? m.disco?.alerta ?? false,

    // Score e severidade já calculados pela ETL
    scoreRisco:  fd.indicadores?.scoreRisco      ?? 0,
    severidade:  fd.indicadores?.severidade      ?? "DESCONHECIDO",

    // SLA
    slaConformidade: fd.sla?.conformidade ?? 100,
    slaStatus:       fd.sla?.status       ?? "DESCONHECIDO",

    // Financeiro
    custoPotencialFalha: fd.financeiro?.custoPotencialFalha ?? 0,

    // Limites (podem ser null se não cadastrados)
    limiteCPU:   m.cpu?.limite   ?? null,
    limiteRAM:   m.ram?.limite   ?? null,
    limiteDisco: m.disco?.limite ?? null,
  };
}

function adaptarDados(raw) {
  // Suporta tanto array direto quanto { maquinas: [...] }
  const lista = Array.isArray(raw) ? raw : (raw.maquinas || []);
  return lista.map(adaptarMaquina);
}

// ════════════════════════════════════════════════
//  SCORING
// ════════════════════════════════════════════════
function scoreComponente(pct) {
  if (pct < 70) return Math.round((pct / 70) * 30);
  if (pct < 90) return Math.round(30 + ((pct - 70) / 20) * 40);
  return Math.round(70 + ((pct - 90) / 10) * 30);
}

function scoreServidor(cpu, ram, disco) {
  return Math.round(
    scoreComponente(cpu)   * 0.40 +
    scoreComponente(ram)   * 0.35 +
    scoreComponente(disco) * 0.25
  );
}

function scoreAmbiente(maquinas) {
  if (!maquinas.length) return 0;
  let soma = 0, pior = 0;
  for (let i = 0; i < maquinas.length; i++) {
    // Usa scoreRisco da ETL se disponível, senão calcula
    const s = maquinas[i].scoreRisco > 0
      ? maquinas[i].scoreRisco
      : scoreServidor(maquinas[i].cpu, maquinas[i].ram, maquinas[i].disco);
    soma += s;
    if (s > pior) pior = s;
  }
  return Math.round((soma / maquinas.length) * 0.70 + pior * 0.30);
}

// ════════════════════════════════════════════════
//  GERAÇÃO DE TICKETS A PARTIR DOS ALERTAS REAIS
// ════════════════════════════════════════════════
function gerarTickets(maquinas) {
  const tickets = [];
  for (let i = 0; i < maquinas.length; i++) {
    const m = maquinas[i];
    if (m.alertaCPU)
      tickets.push({ id: "CPU-" + m.id.slice(-5), descricao: "CPU acima do limite — " + m.label, severidade: "Crítico",  tempo: m.horario });
    if (m.alertaRAM)
      tickets.push({ id: "RAM-" + m.id.slice(-5), descricao: "RAM acima do limite — " + m.label, severidade: "Crítico",  tempo: m.horario });
    if (m.alertaDisco)
      tickets.push({ id: "DSC-" + m.id.slice(-5), descricao: "Disco acima do limite — " + m.label, severidade: "Atenção", tempo: m.horario });
  }
  return tickets;
}

// ════════════════════════════════════════════════
//  SLA MÉDIO DO AMBIENTE
// ════════════════════════════════════════════════
function calcularSLAMedio(maquinas) {
  if (!maquinas.length) return 0;
  const soma = maquinas.reduce((acc, m) => acc + (m.slaConformidade ?? 100), 0);
  return Math.round(soma / maquinas.length);
}

// ════════════════════════════════════════════════
//  UTILITÁRIOS DE COR
// ════════════════════════════════════════════════
function nivelCor(pct) {
  if (pct >= 90) return { cls: "h-crit", label: pct.toFixed(1) + "%" };
  if (pct >= 70) return { cls: "h-warn", label: pct.toFixed(1) + "%" };
  return              { cls: "h-ok",   label: pct.toFixed(1) + "%" };
}

// ════════════════════════════════════════════════
//  INDICADOR DE FONTE DE DADOS
// ════════════════════════════════════════════════
function setStatus(ok) {
  const el = document.getElementById("s3-status");
  if (!el) return;
  el.textContent = ok ? "● Dados ao vivo" : "● Indisponível";
  el.style.color  = ok ? "#4ade80" : "#f43f5e";
}

// ════════════════════════════════════════════════
//  ESTADO DE INDISPONÍVEL (sem mock)
// ════════════════════════════════════════════════
function exibirIndisponivel() {
  // KPIs
  ["kpi-risco","kpi-alertas","kpi-cves","kpi-sla","kpi-servidores","kpi-cves2"]
    .forEach(id => { const el = document.getElementById(id); if (el) el.textContent = "—"; });

  // Heatmap
  const grid = document.getElementById("heatmap-grid");
  if (grid) grid.innerHTML =
    `<div class="hh"></div><div class="hh">CPU</div><div class="hh">RAM</div><div class="hh">Disco</div>
     <div style="grid-column:1/-1;color:#7a92b0;text-align:center;padding:20px;font-size:12px;">
       Dados indisponíveis — verifique a conexão
     </div>`;

  // Tickets
  const tl = document.getElementById("ticket-list");
  if (tl) tl.innerHTML =
    `<div class="ticket-row" style="justify-content:center;color:#7a92b0;font-size:12px;">
       Dados indisponíveis
     </div>`;

  // CVEs
  const cl = document.getElementById("cve-list");
  if (cl) cl.innerHTML =
    `<tr><td colspan="6" style="color:#7a92b0;text-align:center;padding:20px;">Dados indisponíveis</td></tr>`;

  setStatus(false);
}

// ════════════════════════════════════════════════
//  RENDERIZADORES
// ════════════════════════════════════════════════
function renderHeatmap(maquinas) {
  const grid = document.getElementById("heatmap-grid");
  if (!grid) return;
  let html = '<div class="hh"></div><div class="hh">CPU</div><div class="hh">RAM</div><div class="hh">Disco</div>';
  for (let i = 0; i < maquinas.length; i++) {
    const m   = maquinas[i];
    const cpu   = nivelCor(m.cpu);
    const ram   = nivelCor(m.ram);
    const disco = nivelCor(m.disco);
    html += '<div class="hs">' + (m.label || m.id) + '</div>';
    html += '<div class="hc ' + cpu.cls   + '">' + cpu.label   + '</div>';
    html += '<div class="hc ' + ram.cls   + '">' + ram.label   + '</div>';
    html += '<div class="hc ' + disco.cls + '">' + disco.label + '</div>';
  }
  grid.innerHTML = html;
}

function renderTickets(tickets) {
  const el = document.getElementById("ticket-list");
  if (!el) return;
  if (!tickets.length) {
    el.innerHTML = '<div class="ticket-row" style="justify-content:center;color:#4ade80;font-size:12px;">Nenhum alerta ativo no momento</div>';
    return;
  }
  let html = '';
  for (let i = 0; i < tickets.length; i++) {
    const t   = tickets[i];
    const cls = t.severidade === "Crítico" ? "pill-crit" : t.severidade === "Atenção" ? "pill-warn" : "pill-ok";
    const tempo = typeof t.tempo === "string" ? t.tempo : "agora";
    html += '<div class="ticket-row">';
    html += '<div class="tid">'   + t.id        + '</div>';
    html += '<div class="tdesc">' + t.descricao + '</div>';
    html += '<span class="pill '  + cls + '">'  + t.severidade + '</span>';
    html += '<div class="tage">'  + tempo        + '</div>';
    html += '</div>';
  }
  el.innerHTML = html;
}

function renderCVEs(cves) {
  const el = document.getElementById("cve-list");
  if (!el) return;
  if (!cves || !cves.length) {
    el.innerHTML = '<tr><td colspan="6" style="color:#7a92b0;text-align:center;padding:20px;">Nenhuma CVE no momento</td></tr>';
    return;
  }
  let html = '';
  for (let i = 0; i < cves.length; i++) {
    const c      = cves[i];
    const barW   = Math.round(c.cvss / 10 * 36);
    const critico = c.cvss >= 9;
    const barCor  = critico ? "#f43f5e" : "#fbbf24";
    const numCor  = critico ? "#f87171" : "#fde68a";
    const srvCl   = critico ? "pill-crit" : "pill-warn";
    const stCl    = c.status === "Em teste" ? "pill-purple" : "pill-crit";
    const srvs    = Array.isArray(c.servidores) ? c.servidores.join(", ") : (c.servidores || "—");
    html += '<tr>';
    html += '<td><span class="cve-id">' + c.id + '</span></td>';
    html += '<td><div class="cvss-wrap"><div class="cvss-bar" style="width:' + barW + 'px;background:' + barCor + '"></div><span class="cvss-num" style="color:' + numCor + '">' + c.cvss + '</span></div></td>';
    html += '<td>' + c.componente + '</td>';
    html += '<td><span class="pill ' + srvCl + '">' + srvs + '</span></td>';
    html += '<td><span class="pill ' + stCl  + '">' + c.status + '</span></td>';
    html += '<td style="color:#5a7a9c;font-size:11px">' + c.diasAberto + 'd</td>';
    html += '</tr>';
  }
  el.innerHTML = html;
}

function renderKPIs(risco, alertas, cves, sla, totalServs) {
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set("kpi-risco",      risco);
  set("kpi-alertas",    alertas);
  set("kpi-cves",       cves);
  set("kpi-cves2",      cves);
  set("kpi-sla",        sla + "%");
  set("kpi-servidores", totalServs);
  const ts = document.getElementById("last-update");
  if (ts) ts.textContent = "Atualizado: " + new Date().toLocaleString("pt-BR");
}

// ════════════════════════════════════════════════
//  FETCH PRINCIPAL
// ════════════════════════════════════════════════
async function carregarDados() {

  // ── 1. Busca dados de monitoramento do S3 ──
  let maquinas = [];
  let s3ok = false;

  try {
    const res = await fetch(S3_API_ENDPOINT, { cache: "no-cache" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const raw = await res.json();
    maquinas  = adaptarDados(raw);
    s3ok      = true;
  } catch (err) {
    console.warn("[S3] Falha ao carregar dados:", err);
    exibirIndisponivel();
    return; // Para aqui — sem mock, sem dados falsos
  }

  // ── 2. Busca CVEs da NVD (paralelo, não bloqueia o resto) ──
  let cves = [];
  if (nvdIntegration) {
    try {
      cves = await nvdIntegration.fetchCVEs();
    } catch (err) {
      console.warn("[NVD] Falha ao carregar CVEs:", err);
      cves = [];
    }
  }

  // ── 3. Calcula KPIs ──
  const tickets    = gerarTickets(maquinas);
  const risco      = scoreAmbiente(maquinas);
  const alertas    = tickets.filter(t => t.severidade === "Crítico").length;
  const cvesCrit   = cves.filter(c => c.cvss >= 9).length;
  const sla        = calcularSLAMedio(maquinas);
  const totalServs = maquinas.length;

  // ── 4. Renderiza tudo ──
  renderKPIs(risco, alertas, nvdIntegration ? cvesCrit : "—", sla, totalServs);
  renderHeatmap(maquinas);
  renderTickets(tickets);
  renderCVEs(cves);
  setStatus(s3ok);
}

// ════════════════════════════════════════════════
//  INICIALIZAÇÃO
// ════════════════════════════════════════════════
carregarDados();
setInterval(carregarDados, REFRESH_INTERVAL_MS);

// ════════════════════════════════════════════════
//  GRÁFICOS — dados estáticos por ora
//  TODO: dinamizar com histórico do S3 quando disponível
// ════════════════════════════════════════════════
const labels7 = ['02/mai','03/mai','04/mai','05/mai','06/mai','07/mai','08/mai'];
new Chart(document.getElementById('trendChart'), {
  type: 'bar',
  data: {
    labels: labels7,
    datasets: [
      { type:'line', label:'CPU',   data:[62,65,71,78,80,83,84], borderColor:'#378ADD', borderWidth:2, pointRadius:3, fill:false, tension:.35, yAxisID:'y' },
      { type:'line', label:'RAM',   data:[64,66,68,69,71,70,72], borderColor:'#1D9E75', borderWidth:2, pointRadius:3, fill:false, tension:.35, borderDash:[5,3], yAxisID:'y' },
      { type:'line', label:'Disco', data:[48,52,55,59,63,67,70], borderColor:'#BA7517', borderWidth:2, pointRadius:3, fill:false, tension:.35, borderDash:[2,2], yAxisID:'y' },
      { type:'line', label:'Limiar',data:[85,85,85,85,85,85,85], borderColor:'#E24B4A', borderWidth:1.5, borderDash:[6,4], pointRadius:0, fill:false, yAxisID:'y' },
      { type:'bar',  label:'Novas CVEs', data:[1,0,2,1,3,2,3], backgroundColor:'rgba(83,74,183,0.22)', borderColor:'#534AB7', borderWidth:1, yAxisID:'y2', borderRadius:3 }
    ]
  },
  options: {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: ctx => ctx.dataset.yAxisID === 'y2' ? ctx.dataset.label + ': ' + ctx.parsed.y + ' CVEs' : ctx.dataset.label + ': ' + ctx.parsed.y + '%' } }
    },
    scales: {
      x:  { ticks: { font:{size:11}, color:'#888' }, grid: { display:false } },
      y:  { min:20, max:100, position:'left',  ticks: { font:{size:11}, color:'#888', stepSize:20, callback: v => v + '%' }, grid: { color:'rgba(0,0,0,0.05)' } },
      y2: { min:0,  max:6,   position:'right', ticks: { font:{size:11}, color:'#aaa', stepSize:2,  callback: v => Math.round(v) }, grid: { display:false } }
    }
  }
});

new Chart(document.getElementById('cveTrend'), {
  type: 'bar',
  data: {
    labels: ['Nov','Dez','Jan','Fev','Mar','Abr'],
    datasets: [
      { label:'Críticas', data:[2,1,2,3,4,5], backgroundColor:'#E24B4A', borderWidth:0 },
      { label:'Altas',    data:[4,3,4,5,6,8], backgroundColor:'#EF9F27', borderWidth:0 },
      { label:'Médias',   data:[5,4,5,6,5,7], backgroundColor:'#85B7EB', borderWidth:0 }
    ]
  },
  options: {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: ctx => ctx.dataset.label + ': ' + ctx.parsed.y + ' CVEs' } }
    },
    scales: {
      x: { stacked:true, ticks: { font:{size:11}, color:'#888' }, grid: { display:false } },
      y: { stacked:true, ticks: { font:{size:11}, color:'#888', stepSize:5, callback: v => Math.round(v) }, grid: { color:'rgba(0,0,0,0.05)' } }
    }
  }
});

function setPeriod(btn) {
  const botoes = btn.parentElement.querySelectorAll('.pbtn');
  for (let i = 0; i < botoes.length; i++) botoes[i].classList.remove('active');
  btn.classList.add('active');
}