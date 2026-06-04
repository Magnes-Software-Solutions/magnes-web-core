const S3_API_ENDPOINT = "/client";
const JIRA_API_ENDPOINT = "/jira/tickets";
const REFRESH_INTERVAL_MS = 60000;
const TREND_STORAGE_KEY = "grc_tendencia_7dias";

let nvdIntegration = null;
if (typeof NVDIntegration !== "undefined") {
  nvdIntegration = new NVDIntegration();
}

function parseHorario(horario) {
  if (!horario) {
    return 0;
  }

  const texto = String(horario).replace(" ", "T");
  const data = Date.parse(texto);

  if (Number.isNaN(data)) {
    return 0;
  }

  return data;
}

function pegarListaMaquinas(raw) {
  if (Array.isArray(raw)) {
    return raw;
  }

  if (raw && Array.isArray(raw.maquinas)) {
    return raw.maquinas;
  }

  return [];
}

function adaptarMaquina(m) {
  let fd = {};
  let metricas = {};
  let alertas = {};
  let indicadores = {};
  let sla = {};
  let financeiro = {};

  if (m && m.financeiroDashboard) {
    fd = m.financeiroDashboard;
  }

  if (fd.metricas) {
    metricas = fd.metricas;
  }

  if (fd.alertas) {
    alertas = fd.alertas;
  }

  if (fd.indicadores) {
    indicadores = fd.indicadores;
  }

  if (fd.sla) {
    sla = fd.sla;
  }

  if (fd.financeiro) {
    financeiro = fd.financeiro;
  }

  let mac = "maquina-sem-mac";
  if (m && m.macAddress) {
    mac = m.macAddress;
  } else if (m && m.id) {
    mac = m.id;
  }

  let label = mac;
  if (m && m.empresa) {
    label = m.empresa;
  }

  let horario = "";
  if (m && m.horario) {
    horario = m.horario;
  }

  let cpu = 0;
  if (m && m.cpu && m.cpu.uso !== undefined && m.cpu.uso !== null) {
    cpu = m.cpu.uso;
  }

  let ram = 0;
  if (m && m.ramUso !== undefined && m.ramUso !== null) {
    ram = m.ramUso;
  } else if (m && m.ram && m.ram.uso !== undefined && m.ram.uso !== null) {
    ram = m.ram.uso;
  } else if (metricas.ramUso !== undefined && metricas.ramUso !== null) {
    ram = metricas.ramUso;
  }

  let disco = 0;
  if (m && m.discoUso !== undefined && m.discoUso !== null) {
    disco = m.discoUso;
  } else if (metricas.discoUso !== undefined && metricas.discoUso !== null) {
    disco = metricas.discoUso;
  } else if (m && m.disco && m.disco.uso !== undefined && m.disco.uso !== null) {
    disco = m.disco.uso;
  }

  let alertaCPU = false;
  if (alertas.cpu === true) {
    alertaCPU = true;
  }

  let alertaRAM = false;
  if (alertas.ram === true) {
    alertaRAM = true;
  }

  let alertaDisco = false;
  if (alertas.disco === true) {
    alertaDisco = true;
  } else if (m && m.disco && m.disco.alerta === true) {
    alertaDisco = true;
  }

  let scoreRisco = 0;
  if (indicadores.scoreRisco !== undefined && indicadores.scoreRisco !== null) {
    scoreRisco = indicadores.scoreRisco;
  }

  let severidade = "DESCONHECIDO";
  if (indicadores.severidade) {
    severidade = indicadores.severidade;
  }

  let slaConformidade = 100;
  if (sla.conformidade !== undefined && sla.conformidade !== null) {
    slaConformidade = sla.conformidade;
  }

  let custoPotencialFalha = 0;
  if (financeiro.custoPotencialFalha !== undefined && financeiro.custoPotencialFalha !== null) {
    custoPotencialFalha = financeiro.custoPotencialFalha;
  }

  return {
    id: mac,
    label: label,
    horario: horario,
    cpu: cpu,
    ram: ram,
    disco: disco,
    alertaCPU: alertaCPU,
    alertaRAM: alertaRAM,
    alertaDisco: alertaDisco,
    scoreRisco: scoreRisco,
    severidade: severidade,
    slaConformidade: slaConformidade,
    custoPotencialFalha: custoPotencialFalha
  };
}

function agruparPorMaquina(raw) {
  const lista = pegarListaMaquinas(raw);
  const maquinasUnicas = [];

  for (let i = 0; i < lista.length; i++) {
    const maquina = lista[i];
    let mac = "desconhecido";

    if (maquina && maquina.macAddress) {
      mac = maquina.macAddress;
    } else if (maquina && maquina.id) {
      mac = maquina.id;
    }

    let posicaoEncontrada = -1;

    for (let j = 0; j < maquinasUnicas.length; j++) {
      let macExistente = "desconhecido";

      if (maquinasUnicas[j] && maquinasUnicas[j].macAddress) {
        macExistente = maquinasUnicas[j].macAddress;
      } else if (maquinasUnicas[j] && maquinasUnicas[j].id) {
        macExistente = maquinasUnicas[j].id;
      }

      if (macExistente === mac) {
        posicaoEncontrada = j;
      }
    }

    if (posicaoEncontrada === -1) {
      maquinasUnicas.push(maquina);
    } else {
      const horarioNovo = parseHorario(maquina.horario);
      const horarioAntigo = parseHorario(maquinasUnicas[posicaoEncontrada].horario);

      if (horarioNovo >= horarioAntigo) {
        maquinasUnicas[posicaoEncontrada] = maquina;
      }
    }
  }

  const resultado = [];
  for (let i = 0; i < maquinasUnicas.length; i++) {
    resultado.push(adaptarMaquina(maquinasUnicas[i]));
  }
  return resultado;
}

function scoreComponente(pct) {
  if (pct < 70) {
    return Math.round((pct / 70) * 30);
  }

  if (pct < 90) {
    return Math.round(30 + ((pct - 70) / 20) * 40);
  }

  return Math.round(70 + ((pct - 90) / 10) * 30);
}

function scoreServidor(cpu, ram, disco) {
  const scoreCPU = scoreComponente(cpu) * 0.40;
  const scoreRAM = scoreComponente(ram) * 0.35;
  const scoreDisco = scoreComponente(disco) * 0.25;
  return Math.round(scoreCPU + scoreRAM + scoreDisco);
}

function scoreAmbiente(maquinas) {
  if (maquinas.length === 0) {
    return 0;
  }

  let soma = 0;
  let pior = 0;

  for (let i = 0; i < maquinas.length; i++) {
    let score = 0;

    if (maquinas[i].scoreRisco > 0) {
      score = maquinas[i].scoreRisco;
    } else {
      score = scoreServidor(maquinas[i].cpu, maquinas[i].ram, maquinas[i].disco);
    }

    soma = soma + score;

    if (score > pior) {
      pior = score;
    }
  }

  return Math.round((soma / maquinas.length) * 0.70 + pior * 0.30);
}

function gerarTicketsLocais(maquinas) {
  const tickets = [];

  for (let i = 0; i < maquinas.length; i++) {
    const maquina = maquinas[i];
    const fimId = maquina.id.slice(-5);

    if (maquina.alertaCPU) {
      tickets.push({
        id: "CPU-" + fimId,
        descricao: "CPU acima do limite - " + maquina.label,
        severidade: "Critico",
        tempo: maquina.horario
      });
    }

    if (maquina.alertaRAM) {
      tickets.push({
        id: "RAM-" + fimId,
        descricao: "RAM acima do limite - " + maquina.label,
        severidade: "Critico",
        tempo: maquina.horario
      });
    }

    if (maquina.alertaDisco) {
      tickets.push({
        id: "DSC-" + fimId,
        descricao: "Disco acima do limite - " + maquina.label,
        severidade: "Atencao",
        tempo: maquina.horario
      });
    }
  }

  return tickets;
}

function normalizarSeveridade(ticket) {
  if (ticket && ticket.severidade) {
    return ticket.severidade;
  }

  if (ticket && ticket.status) {
    const status = String(ticket.status).toUpperCase();

    if (status === "DONE") {
      return "Resolvido";
    }
  }

  return "Atencao";
}

async function buscarTicketsJira() {
  const resposta = await fetch(JIRA_API_ENDPOINT, { cache: "no-cache" });

  if (!resposta.ok) {
    throw new Error("HTTP " + resposta.status);
  }

  const data = await resposta.json();

  if (!Array.isArray(data)) {
    throw new Error("Resposta Jira invalida");
  }

  const tickets = [];
  const idsJaAdicionados = [];

  for (let i = 0; i < data.length; i++) {
    const ticket = data[i];

    let id = "";
    if (ticket && ticket.id !== undefined && ticket.id !== null) {
      id = String(ticket.id).trim();
    }

    let descricao = "";
    if (ticket && ticket.descricao !== undefined && ticket.descricao !== null) {
      descricao = String(ticket.descricao).trim();
    }

    if (id === "" || descricao === "") {
      continue;
    }

    if (idsJaAdicionados.includes(id)) {
      continue;
    }

    idsJaAdicionados.push(id);

    let tempo = "agora";
    if (ticket && ticket.tempo) {
      tempo = ticket.tempo;
    }

    let status = "";
    if (ticket && ticket.status) {
      status = ticket.status;
    }

    tickets.push({
      id: id,
      descricao: descricao,
      severidade: normalizarSeveridade(ticket),
      tempo: tempo,
      status: status
    });
  }

  console.log("[Jira] " + tickets.length + " tickets unicos");
  return tickets;
}

function calcularSLAMedio(maquinas) {
  if (maquinas.length === 0) {
    return 0;
  }

  let soma = 0;

  for (let i = 0; i < maquinas.length; i++) {
    let sla = 100;

    if (maquinas[i].slaConformidade !== undefined && maquinas[i].slaConformidade !== null) {
      sla = maquinas[i].slaConformidade;
    }

    soma = soma + sla;
  }

  return Math.round(soma / maquinas.length);
}

function nivelCor(pct) {
  const label = pct.toFixed(1) + "%";

  if (pct >= 90) {
    return { cls: "h-crit", label: label };
  }

  if (pct >= 70) {
    return { cls: "h-warn", label: label };
  }

  return { cls: "h-ok", label: label };
}

function setStatus(ok) {
  const el = document.getElementById("s3-status");

  if (!el) {
    return;
  }

  if (ok) {
    el.textContent = "Dados ao vivo";
    el.style.color = "#4ade80";
  } else {
    el.textContent = "Indisponivel";
    el.style.color = "#f43f5e";
  }
}

function escapeHtml(valor) {
  const div = document.createElement("div");
  div.textContent = valor;
  return div.innerHTML;
}

function limparKPIs() {
  const ids = ["kpi-risco", "kpi-alertas", "kpi-cves", "kpi-sla", "kpi-servidores", "kpi-cves2"];

  for (let i = 0; i < ids.length; i++) {
    const el = document.getElementById(ids[i]);

    if (el) {
      el.textContent = "-";
    }
  }
}

function exibirIndisponivel() {
  limparKPIs();

  const grid = document.getElementById("heatmap-grid");
  if (grid) {
    grid.innerHTML = "";
    grid.innerHTML += '<div class="hh"></div>';
    grid.innerHTML += '<div class="hh">CPU</div>';
    grid.innerHTML += '<div class="hh">RAM</div>';
    grid.innerHTML += '<div class="hh">Disco</div>';
    grid.innerHTML += '<div style="grid-column:1/-1;color:#7a92b0;text-align:center;padding:20px;font-size:12px;">Dados indisponiveis - verifique a conexao</div>';
  }

  const ticketList = document.getElementById("ticket-list");
  if (ticketList) {
    ticketList.innerHTML = '<div class="ticket-row" style="justify-content:center;color:#7a92b0;font-size:12px;">Dados indisponiveis</div>';
  }

  const cveList = document.getElementById("cve-list");
  if (cveList) {
    cveList.innerHTML = '<tr><td colspan="6" style="color:#7a92b0;text-align:center;padding:20px;">Dados indisponiveis</td></tr>';
  }

  setStatus(false);
}

function renderHeatmap(maquinas) {
  const grid = document.getElementById("heatmap-grid");

  if (!grid) {
    return;
  }

  let html = "";
  html += '<div class="hh"></div>';
  html += '<div class="hh">CPU</div>';
  html += '<div class="hh">RAM</div>';
  html += '<div class="hh">Disco</div>';

  for (let i = 0; i < maquinas.length; i++) {
    const maquina = maquinas[i];
    const cpu = nivelCor(maquina.cpu);
    const ram = nivelCor(maquina.ram);
    const disco = nivelCor(maquina.disco);

    html += '<div class="hs">' + escapeHtml(maquina.label) + '</div>';
    html += '<div class="hc ' + cpu.cls + '">' + cpu.label + '</div>';
    html += '<div class="hc ' + ram.cls + '">' + ram.label + '</div>';
    html += '<div class="hc ' + disco.cls + '">' + disco.label + '</div>';
  }

  grid.innerHTML = html;
}

function classeSeveridade(severidade) {
  const texto = String(severidade).toLowerCase();

  if (texto.indexOf("crit") === 0) {
    return "pill-crit";
  }

  if (texto.indexOf("aten") === 0) {
    return "pill-warn";
  }

  return "pill-ok";
}

function renderTickets(tickets) {
  const el = document.getElementById("ticket-list");

  if (!el) {
    return;
  }

  if (tickets.length === 0) {
    el.innerHTML = '<div class="ticket-row" style="justify-content:center;color:#4ade80;font-size:12px;">Nenhum alerta ativo</div>';
    return;
  }

  let html = "";

  for (let i = 0; i < tickets.length; i++) {
    const ticket = tickets[i];
    const classe = classeSeveridade(ticket.severidade);

    let tempo = "agora";
    if (ticket.tempo) {
      tempo = ticket.tempo;
    }

    let status = "";
    if (ticket.status) {
      status = ticket.status + " - ";
    }

    html += '<div class="ticket-row">';
    html += '<div class="tid">' + escapeHtml(ticket.id) + '</div>';
    html += '<div class="tdesc">' + escapeHtml(ticket.descricao) + '</div>';
    html += '<span class="pill ' + classe + '">' + escapeHtml(ticket.severidade) + '</span>';
    html += '<div class="tage">' + escapeHtml(status + tempo) + '</div>';
    html += '</div>';
  }

  el.innerHTML = html;
}

function renderCVEs(cves) {
  const el = document.getElementById("cve-list");

  if (!el) {
    return;
  }

  if (!cves || cves.length === 0) {
    el.innerHTML = '<tr><td colspan="6" style="color:#7a92b0;text-align:center;padding:20px;">Nenhuma CVE no momento</td></tr>';
    return;
  }

  let html = "";

  for (let i = 0; i < cves.length; i++) {
    const cve = cves[i];
    const largura = Math.round(cve.cvss / 10 * 36);

    let corBarra = "#fbbf24";
    let corNumero = "#fde68a";
    let classeServidor = "pill-warn";

    if (cve.cvss >= 9) {
      corBarra = "#f43f5e";
      corNumero = "#f87171";
      classeServidor = "pill-crit";
    }

    let classeStatus = "pill-crit";
    if (cve.status === "Em teste") {
      classeStatus = "pill-purple";
    }

    let servidores = "-";
    if (Array.isArray(cve.servidores)) {
      servidores = cve.servidores.join(", ");
    } else if (cve.servidores) {
      servidores = cve.servidores;
    }

    html += "<tr>";
    html += '<td><span class="cve-id">' + escapeHtml(cve.id) + "</span></td>";
    html += '<td><div class="cvss-wrap"><div class="cvss-bar" style="width:' + largura + "px;background:" + corBarra + '"></div><span class="cvss-num" style="color:' + corNumero + '">' + cve.cvss + "</span></div></td>";
    html += "<td>" + escapeHtml(cve.componente) + "</td>";
    html += '<td><span class="pill ' + classeServidor + '">' + escapeHtml(servidores) + "</span></td>";
    html += '<td><span class="pill ' + classeStatus + '">' + escapeHtml(cve.status) + "</span></td>";
    html += '<td style="color:#5a7a9c;font-size:11px">' + cve.diasAberto + "d</td>";
    html += "</tr>";
  }

  el.innerHTML = html;
}

function colocarTexto(id, valor) {
  const el = document.getElementById(id);

  if (el) {
    el.textContent = valor;
  }
}

function renderKPIs(risco, alertas, cves, sla, totalServs) {
  colocarTexto("kpi-risco", risco);
  colocarTexto("kpi-alertas", alertas);
  colocarTexto("kpi-cves", cves);
  colocarTexto("kpi-cves2", cves);
  colocarTexto("kpi-sla", sla + "%");
  colocarTexto("kpi-servidores", totalServs);

  const ts = document.getElementById("last-update");
  if (ts) {
    ts.textContent = "Atualizado: " + new Date().toLocaleString("pt-BR");
  }
}

function limitarPercentual(valor) {
  if (valor < 0) {
    return 0;
  }

  if (valor > 100) {
    return 100;
  }

  return Math.round(valor);
}

function calcularMedia(maquinas, campo) {
  if (maquinas.length === 0) {
    return 0;
  }

  let soma = 0;

  for (let i = 0; i < maquinas.length; i++) {
    soma = soma + maquinas[i][campo];
  }

  return limitarPercentual(soma / maquinas.length);
}

function calcularRiscoCVE(cves) {
  let pontos = 0;

  for (let i = 0; i < cves.length; i++) {
    if (cves[i].cvss >= 9) {
      pontos = pontos + 25;
    } else if (cves[i].cvss >= 7) {
      pontos = pontos + 10;
    }
  }

  return limitarPercentual(pontos);
}

function atualizarBarra(idBarra, idTexto, valor) {
  const barra = document.getElementById(idBarra);
  const texto = document.getElementById(idTexto);
  const percentual = limitarPercentual(valor);

  if (barra) {
    barra.style.width = percentual + "%";
  }

  if (texto) {
    texto.textContent = percentual + "%";
  }
}

function atualizarPill(id, ok, textoOk, textoErro) {
  const el = document.getElementById(id);

  if (!el) {
    return;
  }

  if (ok) {
    el.className = "pill pill-ok";
    el.textContent = textoOk;
  } else {
    el.className = "pill pill-crit";
    el.textContent = textoErro;
  }
}

function atualizarBarrasDashboard(maquinas, cves, sla) {
  const mediaCPU = calcularMedia(maquinas, "cpu");
  const mediaRAM = calcularMedia(maquinas, "ram");
  const mediaDisco = calcularMedia(maquinas, "disco");
  const riscoCVE = calcularRiscoCVE(cves);

  atualizarBarra("bar-cpu", "pct-cpu", mediaCPU);
  atualizarBarra("bar-ram", "pct-ram", mediaRAM);
  atualizarBarra("bar-disco", "pct-disco", mediaDisco);
  atualizarBarra("bar-cve", "pct-cve", riscoCVE);

  atualizarBarra("sla-cpu", "sla-pct-cpu", mediaCPU);
  atualizarBarra("sla-ram", "sla-pct-ram", mediaRAM);
  atualizarBarra("sla-disco", "sla-pct-disco", mediaDisco);
  atualizarBarra("sla-cve", "sla-pct-cve", riscoCVE);

  atualizarPill("comp-cpu", mediaCPU < 85, "Conforme", "Violado");
  atualizarPill("comp-patches", contarCVEsCriticas(cves) === 0, "Conforme", "Violado");
  atualizarPill("comp-sla", sla >= 95, "Conforme", "Violado");
}

function contarCVEsPorServidor(cves, servidor) {
  let total = 0;

  for (let i = 0; i < cves.length; i++) {
    const lista = cves[i].servidores;

    if (!Array.isArray(lista)) {
      continue;
    }

    for (let j = 0; j < lista.length; j++) {
      if (lista[j] === servidor) {
        total = total + 1;
      }
    }
  }

  return total;
}

async function buscarDadosS3() {
  const resposta = await fetch(S3_API_ENDPOINT, { cache: "no-cache" });

  if (!resposta.ok) {
    throw new Error("HTTP " + resposta.status);
  }

  const dados = await resposta.json();
  return dados;
}

async function buscarCVEs() {
  if (!nvdIntegration) {
    return [];
  }

  try {
    return await nvdIntegration.fetchCVEs();
  } catch (erro) {
    console.warn("[NVD] Falha:", erro);
    return [];
  }
}

async function buscarTickets(maquinas) {
  try {
    return await buscarTicketsJira();
  } catch (erro) {
    console.warn("[Jira] Falha, usando alertas locais:", erro);
    return gerarTicketsLocais(maquinas);
  }
}

function contarAlertasCriticos(tickets) {
  let total = 0;

  for (let i = 0; i < tickets.length; i++) {
    const severidade = String(tickets[i].severidade).toLowerCase();

    if (severidade.indexOf("crit") === 0) {
      total = total + 1;
    }
  }

  return total;
}

function contarCVEsCriticas(cves) {
  let total = 0;

  for (let i = 0; i < cves.length; i++) {
    if (cves[i].cvss >= 9) {
      total = total + 1;
    }
  }

  return total;
}

async function carregarDados() {
  let dadosBrutos = null;

  try {
    dadosBrutos = await buscarDadosS3();
  } catch (erro) {
    console.warn("[S3] Falha:", erro);
    exibirIndisponivel();
    return;
  }

  const maquinas = agruparPorMaquina(dadosBrutos);
  const cves = await buscarCVEs();
  const tickets = await buscarTickets(maquinas);

  const risco = scoreAmbiente(maquinas);
  const alertas = contarAlertasCriticos(tickets);
  const cvesCriticas = contarCVEsCriticas(cves);
  const sla = calcularSLAMedio(maquinas);
  const totalServidores = maquinas.length;

  renderKPIs(risco, alertas, cvesCriticas, sla, totalServidores);
  renderHeatmap(maquinas);
  renderTickets(tickets);
  renderCVEs(cves);
  atualizarBarrasDashboard(maquinas, cves, sla);
  atualizarTrendChart(pegarTendenciaParaGrafico(dadosBrutos, maquinas));

  setStatus(true);
}

let trendChartInstance = null;
window.trendData = null;

function pegarNumero(valor) {
  const numero = Number(valor);

  if (Number.isNaN(numero)) {
    return 0;
  }

  return numero;
}

function salvarTendenciaLocal(dadosTendencia) {
  try {
    localStorage.setItem(TREND_STORAGE_KEY, JSON.stringify(dadosTendencia));
  } catch (erro) {
    console.warn("[GRC] Nao foi possivel salvar tendencia local:", erro);
  }
}

function carregarTendenciaLocal() {
  try {
    const texto = localStorage.getItem(TREND_STORAGE_KEY);

    if (!texto) {
      return [];
    }

    const dados = JSON.parse(texto);

    if (Array.isArray(dados)) {
      return dados;
    }
  } catch (erro) {
    console.warn("[GRC] Nao foi possivel ler tendencia local:", erro);
  }

  return [];
}

function montarTendenciaAtual(maquinas) {
  const hoje = new Date();
  const data = hoje.toISOString().slice(0, 10);

  return [{
    data: data,
    cpu_media: calcularMedia(maquinas, "cpu"),
    ram_media: calcularMedia(maquinas, "ram"),
    disco_media: calcularMedia(maquinas, "disco"),
    cves_ativas: 0,
    cobertura_coleta: 100
  }];
}

function pegarTendenciaParaGrafico(dadosBrutos, maquinas) {
  if (dadosBrutos && Array.isArray(dadosBrutos.tendencia_7dias) && dadosBrutos.tendencia_7dias.length > 0) {
    salvarTendenciaLocal(dadosBrutos.tendencia_7dias);
    return dadosBrutos.tendencia_7dias;
  }

  const tendenciaLocal = carregarTendenciaLocal();

  if (tendenciaLocal.length > 0) {
    return tendenciaLocal;
  }

  return montarTendenciaAtual(maquinas);
}

function formatarDataGrafico(dataTexto) {
  if (!dataTexto || String(dataTexto).indexOf("-") === -1) {
    return "Sem data";
  }

  const partes = String(dataTexto).split("-");

  if (partes.length < 3) {
    return dataTexto;
  }

  return partes[2] + "/" + partes[1];
}

function processarTendencia7Dias(dadosTendencia) {
  if (!dadosTendencia || dadosTendencia.length === 0) {
    return {
      labels: ["Sem dados"],
      cpu: [0],
      ram: [0],
      disco: [0],
      cves: [0],
      cobertura: [0],
      temDados: false
    };
  }

  const labels = [];
  const cpu = [];
  const ram = [];
  const disco = [];
  const cves = [];
  const cobertura = [];

  for (let i = 0; i < dadosTendencia.length; i++) {
    const dia = dadosTendencia[i];

    labels.push(formatarDataGrafico(dia.data));
    cpu.push(pegarNumero(dia.cpu_media));
    ram.push(pegarNumero(dia.ram_media));
    disco.push(pegarNumero(dia.disco_media));
    cves.push(pegarNumero(dia.cves_ativas));
    cobertura.push(pegarNumero(dia.cobertura_coleta));
  }

  return {
    labels: labels,
    cpu: cpu,
    ram: ram,
    disco: disco,
    cves: cves,
    cobertura: cobertura,
    temDados: true
  };
}

function montarLinhaLimiar(total) {
  const valores = [];

  for (let i = 0; i < total; i++) {
    valores.push(85);
  }

  return valores;
}

function maiorValor(lista) {
  let maior = 0;

  for (let i = 0; i < lista.length; i++) {
    if (lista[i] > maior) {
      maior = lista[i];
    }
  }

  return maior;
}

function inicializarTrendChart() {
  const canvas = document.getElementById("trendChart");
  if (!canvas) return;

  const config = {
    type: "bar",
    data: {
      labels: [],
      datasets: [
        { type: "line", label: "CPU", data: [], borderColor: "#378ADD", borderWidth: 2, pointRadius: 3, fill: false, tension: 0.35, yAxisID: "y" },
        { type: "line", label: "RAM", data: [], borderColor: "#1D9E75", borderWidth: 2, pointRadius: 3, fill: false, tension: 0.35, borderDash: [5, 3], yAxisID: "y" },
        { type: "line", label: "Disco", data: [], borderColor: "#BA7517", borderWidth: 2, pointRadius: 3, fill: false, tension: 0.35, borderDash: [2, 2], yAxisID: "y" },
        { type: "line", label: "Limiar", data: [], borderColor: "#E24B4A", borderWidth: 1.5, borderDash: [6, 4], pointRadius: 0, fill: false, yAxisID: "y" },
        { type: "bar", label: "CVEs ativas", data: [], backgroundColor: "rgba(83,74,183,0.22)", borderColor: "#534AB7", borderWidth: 1, yAxisID: "y2", borderRadius: 3 }
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
              if (ctx.dataset.yAxisID === "y2") return ctx.dataset.label + ": " + ctx.parsed.y + " CVEs";
              return ctx.dataset.label + ": " + ctx.parsed.y + "%";
            }
          }
        }
      },
      scales: {
        x: { ticks: { font: { size: 11 }, color: "#888" }, grid: { display: false } },
        y: {
          min: 20, max: 100, position: "left",
          ticks: { font: { size: 11 }, color: "#888", stepSize: 20, callback: function(v) { return v + "%"; } },
          grid: { color: "rgba(0,0,0,0.05)" }
        },
        y2: {
          min: 0, max: 6, position: "right",
          ticks: { font: { size: 11 }, color: "#aaa", stepSize: 2, callback: function(v) { return Math.round(v); } },
          grid: { display: false }
        }
      }
    }
  };

  if (trendChartInstance) {
    trendChartInstance.destroy();
  }
  trendChartInstance = new Chart(canvas, config);
}

function atualizarTrendChart(dadosTendencia) {
  const processado = processarTendencia7Dias(dadosTendencia);
  window.trendData = processado;

  if (!trendChartInstance) {
    inicializarTrendChart();
  }

  if (!trendChartInstance) return;

  trendChartInstance.data.labels = processado.labels;
  trendChartInstance.data.datasets[0].data = processado.cpu;
  trendChartInstance.data.datasets[1].data = processado.ram;
  trendChartInstance.data.datasets[2].data = processado.disco;
  trendChartInstance.data.datasets[3].data = montarLinhaLimiar(processado.labels.length);
  trendChartInstance.data.datasets[4].data = processado.cves;

  trendChartInstance.options.scales.y2.max = Math.max(6, maiorValor(processado.cves) + 1);
  trendChartInstance.update("none");
}

document.addEventListener("DOMContentLoaded", function () {
  inicializarTrendChart();
  carregarDados();
  setInterval(carregarDados, REFRESH_INTERVAL_MS);
});

function setPeriod(btn) {
  const botoes = btn.parentElement.querySelectorAll(".pbtn");

  for (let i = 0; i < botoes.length; i++) {
    botoes[i].classList.remove("active");
  }

  btn.classList.add("active");
}
