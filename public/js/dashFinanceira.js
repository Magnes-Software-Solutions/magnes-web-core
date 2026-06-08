const S3_API_ENDPOINT = "/client";
const REFRESH_INTERVAL_MS = 60000;
const HISTORICO_STORAGE_KEY = "magnes_historico_financeiro";
const MAX_PONTOS_POR_MAQUINA = 24;

var instSLA;
var instWaterfall;
var instDonut;

function carregarHistoricoLocal() {
    try {
        const raw = localStorage.getItem(HISTORICO_STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch (vassoura) {
        console.warn("NÃO TÁ CONECTANDO:", vassoura);
        return {};
    }
}

function salvarHistoricoLocal(historico) {
    try {
        localStorage.setItem(HISTORICO_STORAGE_KEY, JSON.stringify(historico));
    } catch (e) {
        console.warn("TÁ DANDO ERRO TENTANDO SALVAR:", e);
    }
}

var historicoPorMaquinaGlobal = carregarHistoricoLocal();

function inicializarGraficos() {

    const ctxSLA = document.getElementById("chartSLA").getContext("2d");
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
                y: {
                    max: 100,
                    beginAtZero: false,
                    ticks: { color: "#8ea1b4" },
                    grid: { color: "#10435f" }
                }
            }
        }
    });

    const ctxWaterfall = document.getElementById("chartWaterfall").getContext("2d");
    instWaterfall = new Chart(ctxWaterfall, {
        type: "bar",
        data: {
            labels: ["Perda Total (Bruta)", "Valor Evitado", "Perda Residual (Real)"],
            datasets: [
                {
                    label: "Suporte",
                    data: [0, 0, 0],
                    backgroundColor: "transparent",
                    borderColor: "transparent",
                    stack: "w1"
                },
                {
                    label: "Impacto Financeiro (R$)",
                    data: [0, 0, 0],
                    backgroundColor: ["#ff7675", "#2ecc71", "#74b9ff"],
                    borderRadius: 4,
                    stack: "w1"
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: {
                    stacked: true,
                    ticks: { color: "#8ea1b4" },
                    grid: { display: false }
                },
                y: {
                    stacked: true,
                    ticks: {
                        color: "#8ea1b4",
                        callback: function (value) {
                            return "R$ " + value.toLocaleString("pt-BR");
                        }
                    },
                    grid: { color: "#10435f" }
                }
            }
        }
    });

    const ctxDonut = document.getElementById("canvasPerda").getContext("2d");
    instDonut = new Chart(ctxDonut, {
        type: "doughnut",
        data: {
            labels: ["Normal (< 80%)",
                "Moderado (≥ 80%)",
                "Alto (≥ 90%)",
                "Crítico (= 100%)"],
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
            plugins: {
                legend: {
                    position: "bottom",
                    labels: { color: "#fff", font: { size: 11 } }
                }
            },
            cutout: "75%"
        }
    });
}

let maquinasRaizClient = [];

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

                const jaExiste = historicoPorMaquinaGlobal[mac].some(
                    function (log) { return log.horario == maquinaAtual.horario; }
                );

                if (!jaExiste) {
                    historicoPorMaquinaGlobal[mac].push(JSON.parse(JSON.stringify(maquinaAtual)));
                }

                if (historicoPorMaquinaGlobal[mac].length > MAX_PONTOS_POR_MAQUINA) {
                    historicoPorMaquinaGlobal[mac].shift();
                }
            }

            salvarHistoricoLocal(historicoPorMaquinaGlobal);

            if (!dados.kpis) {
                dados.kpis = {};
            }

        } else {
            maquinasRaizClient = [];
        }

        atualizarDropdownMaquinas();

        const select = document.querySelector("select#selectFiltroEquipamento");
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
    const select = document.querySelector("select#selectFiltroEquipamento");
    if (!select) return;

    const macsUnicos = Object.keys(historicoPorMaquinaGlobal);
    const valorSelecionado = select.value;
    select.innerHTML = "";

    for (let k = 0; k < macsUnicos.length; k++) {
        const mac = macsUnicos[k];
        const opt = document.createElement("option");
        opt.value = mac;

        const registros = historicoPorMaquinaGlobal[mac];
        const nomeLabel = (registros && registros.length > 0 && registros[registros.length - 1].nomeMaquina)
            ? registros[registros.length - 1].nomeMaquina
            : "Workstation (" + mac.slice(-5) + ")";

        opt.textContent = nomeLabel;
        select.appendChild(opt);
    }

    if (macsUnicos.includes(valorSelecionado)) {
        select.value = valorSelecionado;
    } else if (macsUnicos.length > 0) {
        select.value = macsUnicos[0];
    }
}

function renderizarBI() {
    const select = document.querySelector("select#selectFiltroEquipamento");
    if (!select || select.options.length == 0) {
        limparTelaSemDados();
        return;
    }

    const filtroMac = select.value;
    let dadosFiltrados = (historicoPorMaquinaGlobal[filtroMac] || []).slice();

    dadosFiltrados.sort(function (a, b) {
        return Date.parse(a.horario.replace(" ", "T")) - Date.parse(b.horario.replace(" ", "T"));
    });

    if (dadosFiltrados.length == 0) {
        limparTelaSemDados();
        return;
    }

    const elementMacLegenda = document.getElementById("kpi-mac-legenda");
    if (elementMacLegenda) {
        const registros = historicoPorMaquinaGlobal[filtroMac];
        const nomeMaq = (registros && registros.length > 0 && registros[registros.length - 1].nomeMaquina)
            ? registros[registros.length - 1].nomeMaquina
            : filtroMac;
        elementMacLegenda.innerText = "Filtrado: " + nomeMaq;
    }

    var acumuladoIndisponibilidade = 0;
    var acumuladoLucroPreservado = 0;
    var totalPerdaTotal = 0;
    var totalValorEvitado = 0;

    var contNormal = 0;
    var contModerado = 0;
    var contAlto = 0;
    var contCritico = 0;

    var htmlFeed = "";
    var labelsSLA = [];
    var dadosSLA = [];
    var metasSLA = [];

    var contagemTotalMaquinas = Object.keys(historicoPorMaquinaGlobal).length;

    for (let i = 0; i < dadosFiltrados.length; i++) {
        const log = dadosFiltrados[i];
        const fd = log.financeiroDashboard || {};
        const indicadores = fd.indicadores || fd.indicators || {};
        const fdFin = fd.financeiro || {};
        const alertas = fd.alertas || {};
        const sla = fd.sla || {};
        const financeiroRaiz = log.financeiro || {};

        acumuladoIndisponibilidade += (fdFin.perdaTotal || 0);
        acumuladoLucroPreservado += (fdFin.lucroPreservado || 0);

        totalPerdaTotal += (fdFin.perdaTotal || 0);
        totalValorEvitado += (fdFin.valorEvitado || 0);

        var statusGeral = String(indicadores.severidade || "").toUpperCase().trim();
        var cpuUsoInstancia = (fd.metricas && fd.metricas.cpuSimulado != null) ? fd.metricas.cpuSimulado : 0;

        if (cpuUsoInstancia >= 100) {
            statusGeral = "CRITICO";
        }

        if (statusGeral == "CRITICO" || statusGeral == "CRÍTICO") {
            contCritico++;
        } else if (statusGeral == "ALTO" || statusGeral == "PERIGO") {
            contAlto++;
        } else if (statusGeral == "MODERADO" || statusGeral == "ALERTA") {
            contModerado++;
        } else {
            contNormal++;
        }

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

        var ramUsoInstancia = (log.ram && log.ram.uso != null) ? log.ram.uso : (log.ramUso || 0);
        var discoUsoInstancia = (log.disco && log.disco.uso != null) ? log.disco.uso : 0;

        var metricasInternas = [];
        if (alertas.cpu || cpuUsoInstancia > 80) metricasInternas.push("CPU (" + cpuUsoInstancia + "%)");
        if (alertas.ram || ramUsoInstancia > 80) metricasInternas.push("RAM (" + ramUsoInstancia + "%)");
        if (alertas.disco || discoUsoInstancia > 90) metricasInternas.push("Disco (" + discoUsoInstancia + "%)");

        var componentesTexto = metricasInternas.length > 0 ? metricasInternas.join(", ") : "Nenhum";
        var horaFormatada = log.horario ? log.horario.substring(11, 19) : "00:00:00";
        var conformidadeSLAItem = (sla.conformidade != null) ? sla.conformidade : 0;
        var statusSLAItem = sla.status || "";

        htmlFeed += '<tr>' +
            '<td><strong>' + horaFormatada + '</strong></td>' +
            '<td>' +
            '<div style="font-weight:500;">' + legendaRegra + '</div>' +
            '<small style="color:#8ea1b4;font-size:11px;">Gargalo: ' + componentesTexto + '</small>' +
            '</td>' +
            '<td><span class="' + classeBadge + '">' + textoSeveridade + '</span></td>' +
            '<td>' +
            '<div style="color:' + (statusSLAItem == "CONFORME" ? "#00ff88" : "#f43f5e") + ';font-weight:600;">' +
            'SLA: ' + conformidadeSLAItem.toFixed(2) + '%' +
            '</div>' +
            '<small style="color:#7a92b0;">Perda: R$ ' + (fdFin.perdaTotal || 0).toFixed(2) + '</small>' +
            '</td>' +
            '</tr>';

        if (log.horario) {
            labelsSLA.push(log.horario.substring(11, 16));
            dadosSLA.push(conformidadeSLAItem);
            metasSLA.push(financeiroRaiz.metaSLA != null ? financeiroRaiz.metaSLA : 98.5);
        }
    }

    var ultimoLog = dadosFiltrados[dadosFiltrados.length - 1];
    var perdaResidualReal = Math.max(totalPerdaTotal - totalValorEvitado, 0);

    document.getElementById("v-total").innerText = contagemTotalMaquinas;
    document.getElementById("v-normal").innerText =
        "R$ " + acumuladoIndisponibilidade.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
    document.getElementById("v-alerta").innerText =
        "R$ " + acumuladoLucroPreservado.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
    document.getElementById("feedAlertas").innerHTML = htmlFeed;

    var iconeSLA = document.querySelector(".kpi-card.danger .kpi-icon-box svg");
    var elementoSLA = document.getElementById("v-critico");
    var quadradoSLA = document.getElementById("quadradoSLA");

    if (elementoSLA && quadradoSLA && ultimoLog) {
        const painelFinanceiroUltimo = ultimoLog.financeiroDashboard || {};
        const slaUltimo = painelFinanceiroUltimo.sla || {};
        const statusSla = slaUltimo.status || "";
        const valorSla = (slaUltimo.conformidade != null ? slaUltimo.conformidade : 0).toFixed(2);

        elementoSLA.innerText = statusSla + " (" + valorSla + "%)";
        elementoSLA.classList.remove("text-status-conforme", "text-status-violado");
        quadradoSLA.classList.remove("quadrado-fundo-conforme", "quadrado-fundo-violado");
        if (iconeSLA) iconeSLA.classList.remove("icon-status-conforme", "icon-status-violado");

        if (statusSla == "VIOLADO") {
            elementoSLA.classList.add("text-status-violado");
            quadradoSLA.classList.add("quadrado-fundo-violado");
            if (iconeSLA) iconeSLA.classList.add("icon-status-violado");
        } else {
            elementoSLA.classList.add("text-status-conforme");
            quadradoSLA.classList.add("quadrado-fundo-conforme");
            if (iconeSLA) iconeSLA.classList.add("icon-status-conforme");
        }
    }

    if (instSLA) {
        instSLA.data.labels = labelsSLA;
        instSLA.data.datasets[0].data = dadosSLA;
        instSLA.data.datasets[1].data = metasSLA;
        instSLA.update();
    }

    if (instWaterfall) {
        var baseDoValorEvitado = perdaResidualReal;
        instWaterfall.data.datasets[0].data = [0, baseDoValorEvitado, 0];
        instWaterfall.data.datasets[1].data = [totalPerdaTotal, totalValorEvitado, perdaResidualReal];
        instWaterfall.update();
    }

    if (instDonut) {
        instDonut.data.datasets[0].data = [contNormal, contModerado, contAlto, contCritico];
        instDonut.update();
    }

    const eBairro = document.getElementById("info-bairro");
    const eCidade = document.getElementById("info-cidade");

    if (eBairro || eCidade) {
        const maqOriginal = maquinasRaizClient.find(function (m) { return m.macAddress == filtroMac; });
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
    document.getElementById("feedAlertas").innerHTML =
        '<tr><td colspan="4" style="text-align:center;color:#8ea1b4;padding:20px;">' +
        'Erro de pareamento com o arquivo JSON local.</td></tr>';
}

function limparTelaSemDados() {
    document.getElementById("feedAlertas").innerHTML =
        '<tr><td colspan="4" style="text-align:center;color:#8ea1b4;padding:20px;">' +
        'Nenhum registro encontrado para este filtro.</td></tr>';
}

document.addEventListener("DOMContentLoaded", function () {
    const select = document.querySelector("select#selectFiltroEquipamento");
    if (select) {
        select.addEventListener("change", renderizarBI);
    }

    inicializarGraficos();
    buscarDadosS3();
    setInterval(buscarDadosS3, REFRESH_INTERVAL_MS);
});

// Funções auxiliares
function pegarDashboard() {
    var idUsuario = sessionStorage.ID_USUARIO;
    fetch(`/dash/PegarDashboard/${idUsuario}`)
        .then(response => response.json())
        .then(data => {
            console.log(data)
            spanNome.innerHTML = data[0].nome;
            const fkSupervisor = data[0].fkSupervisor;
            const supervisorFinanceiro = data[0].supervisorFinanceiro;
            console.log(fkSupervisor)
            if(supervisorFinanceiro == TRUE || supervisorFinanceiro == 1) {
                cargo = "Supervisor de Governança";
            }
            else if (fkSupervisor === null) {
                cargo = "Supervisor de Sistemas";
            } 
            else {
                cargo = "Analista de Sistemas";
            }
            cargoUsuarioNav.innerHTML = cargo;
        })
        .catch(error => {
            console.error("Erro ao pegar dashboard:", error);
        });
}

function limparSessao() {
    console.log("Logout acionado");
}

window.onload = pegarDashboard;