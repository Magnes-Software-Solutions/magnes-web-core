const S3_API_ENDPOINT = "/client";
const REFRESH_INTERVAL_MS = 60000;

var instSLA;
var instWaterfall;
var instDonut;

function inicializarGraficos() {
    // Gráfico 1: Linha Temporal de Performance de SLA
    let ctxSLA = document.getElementById("chartSLA").getContext("2d");
    instSLA = new Chart(ctxSLA, {
        type: "line",
        data: {
            labels: [],
            datasets: [
                {
                    label: "Tempo de Atividade (%)",
                    data: [],
                    borderColor: "#38bdf8",
                    backgroundColor: "rgba(56,189,248,0.05)",
                    borderWidth: 3,
                    pointBackgroundColor: "#fff",
                    fill: true,
                    tension: 0.1
                },
                {
                    label: "Meta Acordada",
                    data: [],
                    borderColor: "#ff3366",
                    borderWidth: 1.5,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    fill: false,
                    spanGaps: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: "#fff" } } },
            scales: {
                x: { ticks: { color: "#8ea1b4" }, grid: { display: false } },
                y: { max: 100, beginAtZero: false, ticks: { color: "#8ea1b4" }, grid: { color: "#10435f" } }
            }
        }
    });

    // Gráfico 2: Impacto Financeiro Cascata (Waterfall)
    let ctxWaterfall = document.getElementById("chartWaterfall").getContext("2d");
    instWaterfall = new Chart(ctxWaterfall, {
        type: "bar",
        data: {
            labels: ["Custo Corretiva Potencial", "Economia Preditiva", "Prejuízo Real Absoluto"],
            datasets: [
                {
                    label: "Valores Financeiros",
                    data: [0, 0, 0],
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
                    ticks: { color: "#8ea1b4", callback: function (value) { return "R$ " + value.toLocaleString("pt-BR"); } },
                    grid: { color: "#10435f" }
                }
            }
        }
    });

    // Gráfico 3: Distribuição Volumétrica de Severidade (Doughnut)
    let ctxDonut = document.getElementById("canvasPerda").getContext("2d");
    instDonut = new Chart(ctxDonut, {
        type: "doughnut",
        data: {
            labels: ["Normal", "Moderado", "Alto", "Crítico"],
            datasets: [
                {
                    data: [0, 0, 0, 0],
                    backgroundColor: ["#2ecc71", "#f1c40f", "#e67e22", "#ff3366"],
                    borderWidth: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: "bottom", labels: { color: "#fff", font: { size: 11 } } } },
            cutout: "75%"
        }
    });
}

let maquinasRaizClient = [];

if (typeof historicoPorMaquinaGlobal == 'undefined') {
    var historicoPorMaquinaGlobal = {}; 
}

async function buscarDadosS3() {
    try {
        const resposta = await fetch(S3_API_ENDPOINT + "?timestamp=" + Date.now(), { cache: "no-cache" });

        if (!resposta.ok) {
            throw new Error("HTTP " + resposta.status);
        }

        const dados = await resposta.json();

        if (dados && Array.isArray(dados.maquinas)) {
            maquinasRaizClient = dados.maquinas;

            for (let i = 0; i < dados.maquinas.length; i++) {
                const maquinaAtual = dados.maquinas[i];
                const mac = maquinaAtual.macAddress;

                if (!mac) continue;

                if (!historicoPorMaquinaGlobal[mac]) {
                    historicoPorMaquinaGlobal[mac] = [];
                }

                const jaExiste = historicoPorMaquinaGlobal[mac].some(log => log.horario === maquinaAtual.horario);

                if (!jaExiste) {
                    let novoLog = JSON.parse(JSON.stringify(maquinaAtual));
                    historicoPorMaquinaGlobal[mac].push(novoLog);
                }

                if (historicoPorMaquinaGlobal[mac].length > 24) {
                    historicoPorMaquinaGlobal[mac].shift();
                }
            }

            if (!dados.kpis) {
                dados.kpis = {};
            }

        } else {
            maquinasRaizClient = [];
        }

        console.log("[Magnes Financeiro] Dicionário atualizado. Processando renderização.");
        atualizarDropdownMaquinas();

        const select = document.getElementById("selectFiltroEquipamento");
        if (select && select.options.length > 0 && !select.value) {
            select.selectedIndex = 0;
        }

        renderizarBI();

    } catch (erro) {
        console.warn("[Magnes Financeiro] Erro na carga dos dados:", erro);
        exibirModoIndisponivel();
    }
}

function atualizarDropdownMaquinas() {
    const select = document.getElementById("selectFiltroEquipamento");
    if (!select) return;

    const macsUnicos = Object.keys(historicoPorMaquinaGlobal);

    const valorSelecionado = select.value;
    select.innerHTML = '';

    for (let k = 0; k < macsUnicos.length; k++) {
        const mac = macsUnicos[k];
        const opt = document.createElement("option");
        opt.value = mac;
        opt.textContent = "Workstation (" + mac.slice(-5) + ")";
        select.appendChild(opt);
    }

    if (macsUnicos.includes(valorSelecionado)) {
        select.value = valorSelecionado;
    } else if (macsUnicos.length > 0) {
        select.value = macsUnicos[0];
    }
}

function renderizarBI() {
    const select = document.getElementById("selectFiltroEquipamento");
    if (!select || select.options.length == 0) {
        limparTelaSemDados();
        return;
    }

    const filtroMac = select.value;
    
    let dadosFiltrados = historicoPorMaquinaGlobal[filtroMac] || [];

    dadosFiltrados.sort(function (a, b) {
        return Date.parse(a.horario.replace(" ", "T")) - Date.parse(b.horario.replace(" ", "T"));
    });

    if (dadosFiltrados.length == 0) {
        limparTelaSemDados();
        return;
    }

    const elementMacLegenda = document.getElementById("kpi-mac-legenda");
    if (elementMacLegenda) {
        elementMacLegenda.innerText = "MAC: " + filtroMac;
    }

    var acumuladoIndisponibilidade = 0;
    var acumuladoLucroPreservado = 0;
    var totalCustoCorretivaPotencial = 0;
    var totalEconomiaPreditiva = 0;

    var contNormal = 0;
    var contModerado = 0;
    var contAlto = 0;
    var contCritico = 0;

    var htmlFeed = "";

    let labelsSLA = [];
    let dadosSLA = [];
    let metasSLA = [];

    var contagemTotalMaquinas = Object.keys(historicoPorMaquinaGlobal).length;

    for (let k = 0; k < maquinasRaizClient.length; k++) {
        const maq = maquinasRaizClient[k];
        if (maq.financeiroDashboard && maq.financeiroDashboard.indicadores) {
            const sevGlobal = String(maq.financeiroDashboard.indicadores.severidade || "").toUpperCase().trim();

            if (sevGlobal == "CRITICO" || sevGlobal == "CRÍTICO") {
                contCritico++;
            } else if (sevGlobal == "ALTO" || sevGlobal == "PERIGO") {
                contAlto++;
            } else if (sevGlobal == "MODERADO" || sevGlobal == "ALERTA") {
                contModerado++;
            } else {
                contNormal++;
            }
        } else {
            contNormal++;
        }
    }

    for (let i = 0; i < dadosFiltrados.length; i++) {
        const log = dadosFiltrados[i];
        const fd = log.financeiroDashboard || {};
        const indicadores = fd.indicadores || {};
        const financeiroDashboardMetricas = fd.financeiro || {};
        const alertas = fd.alertas || {};
        const sla = fd.sla || {};
        const financeiroRaiz = log.financeiro || {};

        acumuladoIndisponibilidade += (financeiroDashboardMetricas.perdaTotal || 0);
        acumuladoLucroPreservado += (financeiroDashboardMetricas.lucroPreservado || 0);
        totalEconomiaPreditiva += (financeiroDashboardMetricas.lucroPreservado || 0);

        var statusGeral = String(indicadores.severidade || "").toUpperCase();
        var classeBadge = "badge-estavel";
        var textoSeveridade = "Normal";
        var legendaRegra = "Sem Gargalos";

        if (statusGeral == "CRITICO" || statusGeral == "CRÍTICO") {
            classeBadge = "badge-critico";
            textoSeveridade = "Crítico";
            legendaRegra = "Fora de Operação";
        } else if (statusGeral == "ALTO" || statusGeral == "PERIGO") {
            classeBadge = "badge-alerta";
            textoSeveridade = "Alto";
            legendaRegra = "Risco de Interrupção";
        } else if (statusGeral == "MODERADO" || statusGeral == "ALERTA") {
            classeBadge = "badge-moderado";
            textoSeveridade = "Moderado";
            legendaRegra = "Lentidão Detectada";
        }

        let cpuUsoInstancia = (fd.metricas && fd.metricas.cpuSimulado != undefined) ? fd.metricas.cpuSimulado : 0;
        let ramUsoInstancia = (log.ram && log.ram.uso != undefined) ? log.ram.uso : (log.ramUso || 0);
        let discoUsoInstancia = (log.disco && log.disco.uso != undefined) ? log.disco.uso : 0;

        let metricasInternas = [];
        if (alertas.cpu || cpuUsoInstancia > 80) metricasInternas.push("CPU (" + cpuUsoInstancia + "%)");
        if (alertas.ram || ramUsoInstancia > 80) metricasInternas.push("RAM (" + ramUsoInstancia + "%)");
        if (alertas.disco || discoUsoInstancia > 90) metricasInternas.push("Disco (" + discoUsoInstancia + "%)");

        let componentesTexto = metricasInternas.length > 0 ? metricasInternas.join(", ") : "Nenhum";
        
        let horaFormatada = log.horario ? log.horario.substring(11, 19) : "00:00:00";
        let conformidadeSLAItem = sla.conformidade != undefined ? sla.conformidade : 0;
        let statusSLAItem = sla.status || "";

        htmlFeed += `
        <tr>
            <td><strong>${horaFormatada}</strong></td>
            <td>
                <div style="font-weight: 500;">${legendaRegra}</div>
                <small style="color: #8ea1b4; font-size: 11px;">
                    Gargalo: ${componentesTexto}
                </small>
            </td>
            <td><span class="${classeBadge}">${textoSeveridade}</span></td>
            <td>
                <div style="color: ${statusSLAItem == "CONFORME" ? "#00ff88" : "#f43f5e"}; font-weight: 600;">
                    SLA: ${(conformidadeSLAItem).toFixed(2)}%
                </div>
                <small style="color: #7a92b0;">
                    Perda: R$ ${(financeiroDashboardMetricas.perdaTotal || 0).toFixed(2)}
                </small>
            </td>
        </tr>
        `;

        if (log.horario) {
            labelsSLA.push(log.horario.substring(11, 16));
            dadosSLA.push(conformidadeSLAItem);

            let metaValor = financeiroRaiz.metaSLA != undefined ? financeiroRaiz.metaSLA : 98.5;
            metasSLA.push(metaValor);
        }
    }

    var ultimoLog = dadosFiltrados[dadosFiltrados.length - 1];

    if (ultimoLog && ultimoLog.financeiro) {
        totalCustoCorretivaPotencial = ultimoLog.financeiro.custoCorretivaPotencial || 0;
    } else {
        totalCustoCorretivaPotencial = 0;
    }

    let prejuizoRealAbsoluto = Math.max(totalCustoCorretivaPotencial - totalEconomiaPreditiva, 0);

    document.getElementById("v-total").innerText = contagemTotalMaquinas;
    document.getElementById("v-normal").innerText = "R$ " + acumuladoIndisponibilidade.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
    document.getElementById("v-alerta").innerText = "R$ " + acumuladoLucroPreservado.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
    document.getElementById("feedAlertas").innerHTML = htmlFeed;

    var iconeSLA = document.querySelector(".kpi-card.danger .kpi-icon-box svg");
    var elementoSLA = document.getElementById("v-critico");
    var quadradoSLA = document.getElementById("quadradoSLA");

    if (iconeSLA && elementoSLA && quadradoSLA && ultimoLog) {
        const lastFD = ultimoLog.financeiroDashboard || { sla: {} };
        const statusSla = lastFD.sla.status || "";
        const valorSla = (lastFD.sla.conformidade != undefined ? lastFD.sla.conformidade : 0).toFixed(2);

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

    if (instSLA) {
        instSLA.data.labels = labelsSLA;
        instSLA.data.datasets[0].data = dadosSLA;
        instSLA.data.datasets[1].data = metasSLA;
        instSLA.update();
    }

    if (instWaterfall) {
        instWaterfall.data.datasets[0].data = [totalCustoCorretivaPotencial, totalEconomiaPreditiva, prejuizoRealAbsoluto];
        instWaterfall.update();
    }

    if (instDonut) {
        instDonut.data.datasets[0].data = [contNormal, contModerado, contAlto, contCritico];
        instDonut.update();
    }

    const eBairro = document.getElementById("info-bairro");
    const eCidade = document.getElementById("info-cidade");

    if (eBairro || eCidade) {
        const maqOriginal = maquinasRaizClient.find(m => m.macAddress == filtroMac);
        if (maqOriginal && maqOriginal.financeiro && maqOriginal.financeiro.localizacao) {
            const loc = maqOriginal.financeiro.localizacao;
            if (eBairro) eBairro.innerText = loc.bairro || "";
            if (eCidade) eCidade.innerText = loc.cidade || "";
        } else {
            if (eBairro) eBairro.innerText = "";
            if (eCidade) eCidade.innerText = "";
        }
    }
}

function exibirModoIndisponivel() {
    document.getElementById("v-total").innerText = "—";
    document.getElementById("v-normal").innerText = "Indisponível";
    document.getElementById("v-alerta").innerText = "Indisponível";
    document.getElementById("v-critico").innerText = "Sem Conexão";
    document.getElementById("feedAlertas").innerHTML = `
    <tr><td colspan="4" style="text-align:center; color:#8ea1b4; padding: 20px;">
        Erro de pareamento com o arquivo JSON local.
    </td></tr>`;
}

function limparTelaSemDados() {
    document.getElementById("feedAlertas").innerHTML = `
    <tr><td colspan="4" style="text-align:center; color:#8ea1b4; padding: 20px;">
        Nenhum registro encontrado para este filtro.
    </td></tr>`;
}

document.addEventListener("DOMContentLoaded", function () {
    const select = document.getElementById("selectFiltroEquipamento");
    if (select) {
        select.addEventListener("change", renderizarBI);
    }
    
    inicializarGraficos();
    
    buscarDadosS3();
    setInterval(buscarDadosS3, REFRESH_INTERVAL_MS);
});