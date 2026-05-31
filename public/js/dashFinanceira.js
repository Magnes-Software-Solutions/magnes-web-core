const S3_API_ENDPOINT = "/client";
const REFRESH_INTERVAL_MS = 60000;

var instDonut;
var instSLA;
var instWaterfall;

let logsFinanceirosClient = [];

async function buscarDadosS3() {
  try {
    const resposta = await fetch(S3_API_ENDPOINT, { cache: "no-cache" });

    if (!resposta.ok) {
      throw new Error("HTTP " + resposta.status);
    }

    const dados = await resposta.json();
    
    if (Array.isArray(dados)) {
      logsFinanceirosClient = dados;
    } else if (dados && Array.isArray(dados.maquinas)) {
      logsFinanceirosClient = dados.maquinas;
    } else {
      logsFinanceirosClient = [];
    }

    console.log("[Magnes Financeiro] Dados atualizados. Registros: " + logsFinanceirosClient.length);
    
    atualizarDropdownMaquinas();
    
    renderizarBI();
    
  } catch (erro) {
    console.warn("[Magnes Financeiro] Falha ao conectar com o bucket S3:", erro);
    exibirModoIndisponivel();
  }
}

function atualizarDropdownMaquinas() {
  const select = document.getElementById("selectFiltroEquipamento");
  if (!select) return;

  const macsUnicos = [];
  for (let i = 0; i < logsFinanceirosClient.length; i++) {
    const log = logsFinanceirosClient[i];
    if (log && log.macAddress) {
      let jaExiste = false;
      for (let j = 0; j < macsUnicos.length; j++) {
        if (macsUnicos[j] == log.macAddress) {
          jaExiste = true;
          break;
        }
      }
      if (!jaExiste) {
        macsUnicos.push(log.macAddress);
      }
    }
  }
  
  const valorSelecionado = select.value;
  select.innerHTML = '<option value="ALL">Todas as Workstations</option>';
  
  for (let k = 0; k < macsUnicos.length; k++) {
    const mac = macsUnicos[k];
    const opt = document.createElement("option");
    opt.value = mac;
    opt.textContent = "Workstation 0" + (k + 1) + " (" + mac.slice(-5) + ")";
    select.appendChild(opt);
  }

  select.value = valorSelecionado;
}

function renderizarBI() {
  const filtroMac = document.getElementById("selectFiltroEquipamento").value;
  let dadosFiltrados = [];

  for (let i = 0; i < logsFinanceirosClient.length; i++) {
    const log = logsFinanceirosClient[i];
    if (!log) continue;

    if (!log.financeiroDashboard) log.financeiroDashboard = {};
    if (!log.metricas) log.metricas = log.financeiroDashboard.metricas || {};
    if (!log.indicadores) log.indicadores = log.financeiroDashboard.indicadores || {};
    if (!log.financeiro) log.financeiro = log.financeiroDashboard.financeiro || {};
    if (!log.alertas) log.alertas = log.financeiroDashboard.alertas || {};
    if (!log.sla) log.sla = log.financeiroDashboard.sla || {};

    if (filtroMac == "ALL") {
      dadosFiltrados.push(log);
    } else if (log.macAddress == filtroMac) {
      dadosFiltrados.push(log);
    }
  }

  dadosFiltrados.sort(function (a, b) {
    const dataA = a.horario ? a.horario.replace(" ", "T") : "";
    const dataB = b.horario ? b.horario.replace(" ", "T") : "";
    return Date.parse(dataA) - Date.parse(dataB);
  });

  if (dadosFiltrados.length == 0) {
    limparTelaSemDados();
    return;
  }

  document.getElementById("kpi-mac-legenda").innerText = filtroMac == "ALL" ? "Escopo: Rede Geral" : "MAC: " + filtroMac;

  var acumuladoIndisponibilidade = 0;
  var acumuladoLucroPreservado = 0;
  var totalGastoBrutoGargalos = 0;
  var totalEconomiaPreditiva = 0;

  var contNormal = 0;
  var contModerado = 0;
  var contAlto = 0;
  var contCritico = 0;

  var htmlFeed = "";
  var maquinas = [];

  let labelsSLA = [];
  let dadosSLA = [];
  let metasSLA = [];

  for (let i = 0; i < dadosFiltrados.length; i++) {
    const log = dadosFiltrados[i];

    let maquinaJaContada = false;
    for (let j = 0; j < maquinas.length; j++) {
      if (maquinas[j] == log.macAddress) {
        maquinaJaContada = true;
        break;
      }
    }
    if (!maquinaJaContada) {
      maquinas.push(log.macAddress);
    }

    acumuladoIndisponibilidade += (log.financeiro.perdaIndisponibilidade || 0);
    acumuladoLucroPreservado += (log.financeiro.lucroPreservado || 0);
    totalGastoBrutoGargalos += (log.financeiro.perdaTotal || 0) + (log.financeiro.multaSLA || 0);
    totalEconomiaPreditiva += (log.financeiro.valorEvitado || 0);

    var sev = String(log.indicadores.severidade).toUpperCase();
    var classeBadge = "badge-estavel";
    var textoSeveridade = "Normal";
    var legendaRegra = "Sem Gargalos";

    if (sev == "CRITICO") {
      contCritico++;
      classeBadge = "badge-critico";
      textoSeveridade = "Crítico";
      legendaRegra = "Fora de Operação";
    } else if (sev == "ALTO") {
      contAlto++;
      classeBadge = "badge-alerta";
      textoSeveridade = "Alto";
      legendaRegra = "Risco de Interrupção";
    } else if (sev == "MODERADO") {
      contModerado++;
      classeBadge = "badge-moderado";
      textoSeveridade = "Moderado";
      legendaRegra = "Lentidão Detectada";
    } else {
      contNormal++;
    }

    let metricasInternas = [];
    if (log.alertas.cpu) {
      metricasInternas.push("CPU (" + (log.metricas.cpuSimulado || log.metricas.cpuUso || 0) + "%)");
    }
    if (log.alertas.ram) {
      metricasInternas.push("RAM (" + (log.metricas.ramUso || 0) + "%)");
    }
    if (log.alertas.disco) {
      metricasInternas.push("Disco (" + (log.metricas.discoUso || 0) + "%)");
    }

    let componentesTexto = "Nenhum";
    if (metricasInternas.length > 0) {
      componentesTexto = metricasInternas.join(", ");
    }
    
    let horaFormatada = log.horario ? log.horario.substring(11, 19) : "00:00:00";

    htmlFeed += `
        <tr>
            <td><strong>${horaFormatada}</strong></td>
            <td>
                <div style="font-weight: 500;">${legendaRegra}</div>
                <small style="color: #8ea1b4; font-size: 11px;">
                    Gargalo: ${componentesTexto} | Offline: ${log.financeiro.downtimeMinutos || 0} min
                </small>
            </td>
            <td><span class="${classeBadge}">${textoSeveridade}</span></td>
            <td>
                <div style="color: ${log.sla.status == "CONFORME" ? "#00ff88" : "#f43f5e"}; font-weight: 600;">
                    SLA: ${(log.sla.conformidade || 100).toFixed(2)}%
                </div>
                <small style="color: #7a92b0;">
                    Perda: R$ ${(log.financeiro.perdaTotal || 0).toFixed(2)}
                </small>
            </td>
        </tr>
    `;

    if (log.horario) {
      labelsSLA.push(log.horario.substring(11, 16));
      dadosSLA.push(log.sla.conformidade || 100);
      metasSLA.push(log.sla.meta || 98.5);
    }
  }

  document.getElementById("v-total").innerText = maquinas.length;
  document.getElementById("v-normal").innerText = "R$ " + acumuladoIndisponibilidade.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
  document.getElementById("v-alerta").innerText = "R$ " + acumuladoLucroPreservado.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
  document.getElementById("feedAlertas").innerHTML = htmlFeed;

  var ultimoLog = dadosFiltrados[dadosFiltrados.length - 1];
  var iconeSLA = document.querySelector(".kpi-card.danger .kpi-icon-box svg");
  var elementoSLA = document.getElementById("v-critico");
  var quadradoSLA = document.getElementById("quadradoSLA");

  if (iconeSLA && elementoSLA && quadradoSLA && ultimoLog) {
    const statusSla = ultimoLog.sla.status || "CONFORME";
    const valorSla = (ultimoLog.sla.conformidade || 100).toFixed(2);
    
    elementoSLA.innerText = statusSla + " (" + valorSla + "%)";
    elementoSLA.classList.remove("text-status-conforme", "text-status-violado");
    iconeSLA.classList.remove("icon-status-conforme", "icon-status-violado");
    quadradoSLA.classList.remove("quadrado-fundo-conforme", "quadrado-fundo-violado");

    if (statusSla == "VIOLADO") {
      elementoSLA.classList.add("text-status-violado");
      iconeSLA.classList.add("icon-status-violado");
      quadradoSLA.classList.add("quadrado-fundo-violado");
    } else {
      elementoSLA.classList.add("text-status-conforme");
      iconeSLA.classList.add("icon-status-conforme");
      quadradoSLA.classList.add("quadrado-fundo-conforme");
    }
  }

  // Gráfico 1: Linha de SLA vs Meta
  if (instSLA) instSLA.destroy();
  let ctxSLA = document.getElementById("chartSLA").getContext("2d");
  instSLA = new Chart(ctxSLA, {
    type: "line",
    data: {
      labels: labelsSLA,
      datasets: [
        {
          label: "Tempo de Atividade (%)",
          data: dadosSLA,
          borderColor: "#38bdf8",
          backgroundColor: "rgba(56,189,248,0.05)",
          borderWidth: 3,
          pointBackgroundColor: "#fff",
          fill: true,
          tension: 0.1
        },
        {
          label: "Meta Acordada",
          data: metasSLA,
          borderColor: "#ff3366",
          borderWidth: 1.5,
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: "#fff" } } },
      scales: {
        x: { ticks: { color: "#8ea1b4" }, grid: { display: false } },
        y: { min: 96, max: 100.5, ticks: { color: "#8ea1b4" }, grid: { color: "#10435f" } }
      }
    }
  });

  // Gráfico 2: Impacto Financeiro Cascata
  if (instWaterfall) instWaterfall.destroy();
  let ctxWaterfall = document.getElementById("chartWaterfall").getContext("2d");
  let custoFinalMitigado = Math.max(totalGastoBrutoGargalos - totalEconomiaPreditiva, 0);

  instWaterfall = new Chart(ctxWaterfall, {
    type: "bar",
    data: {
      labels: ["Prejuízo Bruto Operacional", "Economia Preditiva", "Prejuízo Real Absoluto"],
      datasets: [
        {
          label: "Valores Financeiros",
          data: [totalGastoBrutoGargalos, totalEconomiaPreditiva, custoFinalMitigado],
          backgroundColor: ["#ff7675", "#2ecc71", "#74b9ff"],
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: "#8ea1b4" }, grid: { display: false } },
        y: {
          ticks: {
            color: "#8ea1b4",
            callback: function (value) { return "R$ " + value.toLocaleString("pt-BR"); }
          },
          grid: { color: "#10435f" }
        }
      }
    }
  });

  // Gráfico 3: Distribuição de Severidade
  if (instDonut) instDonut.destroy();
  let ctxDonut = document.getElementById("canvasPerda").getContext("2d");
  instDonut = new Chart(ctxDonut, {
    type: "doughnut",
    data: {
      labels: ["Normal < 15", "Moderado ≥ 15", "Alto ≥ 40", "Crítico ≥ 70"],
      datasets: [
        {
          data: [contNormal, contModerado, contAlto, contCritico],
          backgroundColor: ["#2ecc71", "#f1c40f", "#e67e22", "#ff3366"],
          borderWidth: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "bottom", labels: { color: "#fff", font: { size: 11 } } }
      },
      cutout: "75%"
    }
  });
}

function exibirModoIndisponivel() {
  document.getElementById("v-total").innerText = "—";
  document.getElementById("v-normal").innerText = "Indisponível";
  document.getElementById("v-alerta").innerText = "Indisponível";
  document.getElementById("v-critico").innerText = "Sem Conexão";
  document.getElementById("feedAlertas").innerHTML = `
    <tr><td colspan="4" style="text-align:center; color:#8ea1b4; padding: 20px;">
        Falha ao sincronizar dados operacionais da nuvem.
    </td></tr>`;
}

function limparTelaSemDados() {
  document.getElementById("feedAlertas").innerHTML = `
    <tr><td colspan="4" style="text-align:center; color:#8ea1b4; padding: 20px;">
        Nenhum registro encontrado para este filtro nas últimas 24 horas.
    </td></tr>`;
}

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("selectFiltroEquipamento").addEventListener("change", renderizarBI);
  buscarDadosS3();
  setInterval(buscarDadosS3, REFRESH_INTERVAL_MS);
});