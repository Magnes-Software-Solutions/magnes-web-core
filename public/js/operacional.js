const S3_API_ENDPOINT = "/client";
const HISTORICO_STORAGE_KEY = "historico_maquinas";

function carregarHistoricoLocal() {
    try {
        const raw = localStorage.getItem(HISTORICO_STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;

    } catch (erro) {
        console.warn("Erro ao carregar localStorage:", erro);
        return null;
    }
}

function salvarHistoricoLocal(dados) {
    try {
        localStorage.setItem(HISTORICO_STORAGE_KEY, JSON.stringify(dados));

    } catch (erro) {
        console.warn("Erro ao salvar localStorage:", erro);
    }
}

async function carregarDados() {
    try {
        const res = await fetch(S3_API_ENDPOINT, { cache: "no-cache" });
        if (!res.ok) throw new Error("HTTP " + res.status);

        const registro = await res.json();
        console.log("Dados recebidos:", registro);

        return registro

    } catch (err) {
        console.log("[ERRO] - Falha ao se conectar com o S3:", err);
        const dadosLocal = carregarHistoricoLocal()
        return dadosLocal
    }
}

function formatarHora(dataHora) {
    if (!dataHora || typeof dataHora !== "string") {
        return "--:--";
    }

    return dataHora.split(" ")[1].slice(0, 5);
}

const historicoMaquinas = carregarHistoricoLocal() || {};
const graficos = {};
const maquinasRenderizadas = new Set();

function salvarHistorico(maquina) {
    if (!historicoMaquinas[maquina.macAddress]) {
        historicoMaquinas[maquina.macAddress] = {
            cpu: [],
            ram: [],
            disco: []
        };
    }

    const hora = formatarHora(maquina.horario);

    const historico = historicoMaquinas[maquina.macAddress];

    // Verifica se já existe esse horário
    const ultimoCpu = historico.cpu[historico.cpu.length - 1];

    if (ultimoCpu && ultimoCpu.horario === hora) {
        console.log("Horário repetido, ignorando:", hora);
        return;
    }

    historicoMaquinas[maquina.macAddress].cpu.push({
        horario: hora,
        valor: maquina.cpu.uso
    });

    historicoMaquinas[maquina.macAddress].ram.push({
        horario: hora,
        valor: maquina.ram.uso
    });

    historicoMaquinas[maquina.macAddress].disco.push({
        horario: hora,
        valor: maquina.disco.uso
    });

    ["cpu", "ram", "disco"].forEach(comp => {
        if (historicoMaquinas[maquina.macAddress][comp].length > 9) {
            historicoMaquinas[maquina.macAddress][comp].shift();
        }
    });

    salvarHistoricoLocal(historicoMaquinas);
}

function plotarKpi(total, critico, atencao, estavel) {
    document.getElementById("kpiTotal").innerHTML = total

    document.getElementById("kpiCritico").innerHTML = critico

    document.getElementById("kpiAtencao").innerHTML = atencao

    document.getElementById("kpiEstavel").innerHTML = estavel

}

function classificarCor(cardAtual, componente, variavel, valor) {
    let itens = [];
    let itensStatus = [];
    let cor = "";
    let corStatus = "";

    if (variavel == "indice_saude") {
        itensStatus = cardAtual.querySelectorAll(`.${variavel}`)
        valor = Number(valor.split("/")[0])

        if (valor > 75) {
            corStatus = "statusVerde";
            estavel++

        } else if (valor > 50) {
            corStatus = "statusAmarelo";
            atencao++

        } else if (valor <= 50) {
            corStatus = "statusVermelho";
            critico++

        } else {
            corStatus = "statusAzul"
        }

        total++


    } else if (variavel == "status") {
        itensStatus = cardAtual.querySelectorAll(`.status_${componente}`);
        itens = cardAtual.querySelectorAll(`.uso_${componente}`);

        if (valor == "Estável") {
            cor = "corVerde";
            corStatus = "statusVerde";

        } else if (valor == "Anormal") {
            cor = "corAmarelo";
            corStatus = "statusAmarelo";

        } else if (valor == "Crítico") {
            cor = "corVermelho";
            corStatus = "statusVermelho";

        } else {
            cor = "corAzul";
            corStatus = "statusAzul";
        }

    } else if (variavel == "oscilacao") {
        itens = cardAtual.querySelectorAll(`.oscilacao_${componente}`);

        if (valor == "Baixa (abaixo de 1σ)") {
            cor = "corVerde";

        } else if (valor == "Média (entre 1σ e 2σ)") {
            cor = "corAmarelo";

        } else if (valor == "Alta  (entre 2σ e 3σ)") {
            cor = "corLaranja";

        } else if (valor == "Severa (acima de 3σ)") {
            cor = "corVermelho";

        } else {
            cor = "corAzul";
        }

    } else if (variavel == "degradacao") {
        itens = cardAtual.querySelectorAll(`.ultimas2h_${componente}`);

        if (valor == "Recuperação") {
            cor = "corVerde";

        } else if (valor == "Degradação Média") {
            cor = "corAmarelo";

        }else if (valor == "Degradação Alta") {
            cor = "corVermelho";

        } else {
            cor = "corAzul";
        }

    } else if (variavel == "previsaoLimite") {
        itens = cardAtual.querySelectorAll(`.criticidade_${componente}`);

        if (valor == "Sem dados suficientes" ||
            valor == "Sem dados válidos" ||
            valor == "Sem variação temporal" ||
            valor == "Erro regressão" || 
            valor == "Sem previsão") {
            cor = "corAzul";

        } else {
            // cor = "corVermelho";
            cor = "corAzul";
        }
    }

    const statusCores = ["statusVerde", "statusAmarelo", "statusVermelho", "statusAzul"];

    if (itensStatus != undefined) {
        itensStatus.forEach(itemStatus => {
            itemStatus.classList.remove(...statusCores);
            itemStatus.classList.add(corStatus);
        });
    }

    const cores = ["corVerde","corAmarelo", "corLaranja", "corVermelho", "corAzul"];

    itens.forEach(item => {
        item.classList.remove(...cores);
        item.classList.add(cor);
    });
}

let total = 0;
let critico = 0;
let atencao = 0;
let estavel = 0;

function chamarCor(cardAtual, elemento) {
    classificarCor(cardAtual, null, "indice_saude", elemento.indiceSaude);

    var componentes = ["cpu", "ram", "disco"];
    var variaveis = ["status", "oscilacao", "degradacao", "previsaoLimite"];

    for (let componente of componentes) {
        for (let variavel of variaveis) {

            let valor;

            if (variavel == "indice_saude") {
                valor = elemento.indiceSaude;

            } else if (variavel == "previsaoLimite") {
                valor = elemento[componente].previsao.previsaoLimite;

            } else {
                valor = elemento[componente][variavel];
            }

            classificarCor(cardAtual, componente, variavel, valor);
        }
    }

    plotarKpi(total, critico, atencao, estavel);
}

function plotarGrafico(maquina) {
    if (!graficos[maquina.macAddress]) {
        graficos[maquina.macAddress] = {};
    }

    // CPU
    const historicoCpu = historicoMaquinas[maquina.macAddress].cpu;
    const labelsCpu = []
    const dadosUsoCpu = []
    const dadosRegCpu = []

    historicoCpu.forEach(item => {
        labelsCpu.push(item.horario)
        dadosUsoCpu.push(item.valor)
        dadosRegCpu.push({
            x: item.horario,
            y: item.valor
        })
    });

    // Gráfico uso cpu
    if (!graficos[maquina.macAddress].cpuUso) {
        graficos[maquina.macAddress].cpuUso = new Chart(
            document.getElementById(`grafUsoCpu_${maquina.macAddress}`),
            {
                type: 'line',
                data: {
                    labels: labelsCpu,
                    datasets: [{
                        data: dadosUsoCpu,
                        borderColor: 'rgba(170, 0, 255, 1)',
                        fill: true,
                        backgroundColor: 'rgba(170, 0, 255, 0.4)',
                        borderWidth: 3,
                        tension: 0.2,
                        pointRadius: 2,
                        pointHoverRadius: 6,
                        pointHoverBorderWidth: 2,
                        pointHoverBorderColor: '#ffffff',
                        pointHoverBackgroundColor: '#ffffff'
                    }]
                },
                options: {
                    responsive: true,
                    interaction: {
                        mode: 'index',
                        intersect: false
                    },
                    hover: {
                        mode: 'index',
                        intersect: false
                    },
                    plugins: {
                        annotation: {
                            annotations: {
                                linhaCritico: {
                                    type: 'line',
                                    yMin: maquina.cpu.limite,
                                    yMax: maquina.cpu.limite,
                                    borderColor: '#ff3366',
                                    borderWidth: 2,
                                    label: {
                                        content: `Crítico > ${maquina.cpu.limite}%`, //possivel erro
                                        font: {
                                            size: 12
                                        },
                                        enabled: true,
                                        position: 'start',
                                        backgroundColor: '#3e2e4c',
                                        color: '#ff3366',
                                        borderWidth: 0.3,
                                        borderColor: '#ff3366'
                                    }
                                },
                                linhaAtencao: {
                                    type: 'line',
                                    yMin: maquina.cpu.limite * 0.80,
                                    yMax: maquina.cpu.limite * 0.80,
                                    borderColor: '#ffd500',
                                    borderWidth: 2,
                                    label: {
                                        content: `Anormal > ${maquina.cpu.limite * 0.80}%`, //possivel erro
                                        font: {
                                            size: 12
                                        },
                                        enabled: true,
                                        position: 'start',
                                        backgroundColor: '#3e4a3a',
                                        color: '#ffd500',
                                        borderWidth: 0.3,
                                        borderColor: '#ffd500'
                                    }
                                }
                            }
                        },
                        legend: {
                            display: false,
                        },
                        tooltip: {
                            enabled: true,
                            backgroundColor: '#1a3555',
                            titleColor: '#7a92b0',
                            bodyColor: 'rgba(0, 212, 249, 1)',
                            borderColor: '#2b5876',
                            borderWidth: 1,
                            displayColors: false
                        },
                        title: {
                            display: true,
                            color: '#ffffff'
                        }
                    },
                    scales: {
                        x: {
                            ticks: {
                                color: '#7a92b0'
                            },
                            grid: {
                                color: '#1f3652'
                            }
                        },
                        y: {
                            ticks: {
                                color: '#7a92b0'
                            },
                            grid: {
                                color: '#1f3652',
                                borderDash: [5, 5]
                            },
                            min: 0,
                            max: 100
                        }
                    }
                }
            }
        );

    } else {
        graficos[maquina.macAddress].cpuUso.data.labels = labelsCpu;
        graficos[maquina.macAddress].cpuUso.data.datasets[0].data = dadosUsoCpu;
        graficos[maquina.macAddress].cpuUso.update();
    }

    // Gráfico regressao cpu
    if (!graficos[maquina.macAddress].cpuReg) {
        graficos[maquina.macAddress].cpuReg = new Chart(
            document.getElementById(`grafRegCpu_${maquina.macAddress}`),
            {
                type: 'line',
                data: {
                    labels: labelsCpu,
                    datasets: [{
                        label: 'Porcentagem por Horário',
                        data: dadosRegCpu,
                        showLine: false,
                        borderColor: 'rgb(0, 255, 68)',
                        fill: false,
                        backgroundColor: 'rgba(48, 138, 52, 0.4)',
                        borderWidth: 3,
                        tension: 0.2,
                        pointRadius: 3,
                        pointHoverRadius: 6,
                        pointHoverBorderWidth: 2,
                        pointHoverBorderColor: '#ffffff',
                        pointHoverBackgroundColor: '#ffffff'
                    }]
                },
                options: {
                    responsive: true,
                    interaction: {
                        mode: 'index',
                        intersect: false
                    },
                    hover: {
                        mode: 'index',
                        intersect: false
                    },
                    plugins: {
                        annotation: {
                            annotations: maquina.cpu.previsao.reta.length >= 2 && maquina.cpu.previsao.r2 > 0
                                ? {
                                    linhaRegressao: {
                                        type: 'line',
                                        xMin: formatarHora(maquina.cpu.previsao.reta[0].x),
                                        yMin: maquina.cpu.previsao.reta[0].y,

                                        xMax: formatarHora(maquina.cpu.previsao.reta[1].x),
                                        yMax: maquina.cpu.previsao.reta[1].y,
                                        borderColor: 'rgba(0, 212, 249, 1)',
                                        borderWidth: 2,

                                        label: {
                                        content: `Reta de previsão`,
                                        font: {
                                            size: 12
                                        },
                                        enabled: true,
                                        position: 'start',
                                        backgroundColor: '#104c68',
                                        color: '#rgba(0, 212, 249, 1)',
                                        borderWidth: 0.3,
                                        borderColor: '#rgba(0, 212, 249, 1)'
                                    }
                                    }
                                }
                                : {}
                        },
                        legend: {
                            display: false,
                        },
                        tooltip: {
                            enabled: true,
                            backgroundColor: '#1a3555',
                            titleColor: '#7a92b0',
                            bodyColor: 'rgba(0, 212, 249, 1)',
                            borderColor: '#2b5876',
                            borderWidth: 1,
                            displayColors: false
                        },
                        title: {
                            display: true,
                            color: '#ffffff'
                        }
                    },
                    scales: {
                        x: {
                            ticks: {
                                color: '#7a92b0'
                            },
                            grid: {
                                color: '#1f3652'
                            },
                            type: 'category'
                        },
                        y: {
                            ticks: {
                                color: '#7a92b0'
                            },
                            grid: {
                                color: '#1f3652',
                                borderDash: [5, 5]
                            },
                            min: 0,
                            max: 100,
                        }
                    }
                }
            }
        );

    } else {
        graficos[maquina.macAddress].cpuReg.data.datasets[0].data = dadosRegCpu;
        graficos[maquina.macAddress].cpuReg.update();
    }



    // RAM
    const historicoRam = historicoMaquinas[maquina.macAddress].ram;
    const labelsRam = []
    const dadosUsoRam = []
    const dadosRegRam = []

    historicoRam.forEach(item => {
        labelsRam.push(item.horario)
        dadosUsoRam.push(item.valor)
        dadosRegRam.push({
            x: item.horario,
            y: item.valor
        })
    });

    // Gráfico uso ram
    if (!graficos[maquina.macAddress].ramUso) {
        graficos[maquina.macAddress].ramUso = new Chart(
            document.getElementById(`grafUsoRam_${maquina.macAddress}`),
            {
                type: 'line',
                data: {
                    labels: labelsRam,
                    datasets: [{
                        data: dadosUsoRam,
                        borderColor: 'rgba(0, 71, 255, 1)',
                        fill: true,
                        backgroundColor: 'rgba(0, 71, 255, 0.4)',
                        borderWidth: 3,
                        tension: 0.2,
                        pointRadius: 2,
                        pointHoverRadius: 6,
                        pointHoverBorderWidth: 2,
                        pointHoverBorderColor: '#ffffff',
                        pointHoverBackgroundColor: '#ffffff'
                    }]
                },
                options: {
                    responsive: true,
                    interaction: {
                        mode: 'index',
                        intersect: false
                    },
                    hover: {
                        mode: 'index',
                        intersect: false
                    },
                    plugins: {
                        annotation: {
                            annotations: {
                                linhaCritico: {
                                    type: 'line',
                                    yMin: maquina.ram.limite,
                                    yMax: maquina.ram.limite,
                                    borderColor: '#ff3366',
                                    borderWidth: 2,
                                    label: {
                                        content: `Crítico > ${maquina.ram.limite}%`,
                                        font: {
                                            size: 12
                                        },
                                        enabled: true,
                                        position: 'start',
                                        backgroundColor: '#3e2e4c',
                                        color: '#ff3366',
                                        borderWidth: 0.3,
                                        borderColor: '#ff3366'
                                    }
                                },
                                linhaAtencao: {
                                    type: 'line',
                                    yMin: maquina.ram.limite * 0.80,
                                    yMax: maquina.ram.limite * 0.80,
                                    borderColor: '#ffd500',
                                    borderWidth: 2,
                                    label: {
                                        content: `Anormal > ${maquina.ram.limite * 0.80}%`,
                                        font: {
                                            size: 12
                                        },
                                        enabled: true,
                                        position: 'start',
                                        backgroundColor: '#3e4a3a',
                                        color: '#ffd500',
                                        borderWidth: 0.3,
                                        borderColor: '#ffd500'
                                    }
                                }
                            }
                        },
                        legend: {
                            display: false,
                        },
                        tooltip: {
                            enabled: true,
                            backgroundColor: '#1a3555',
                            titleColor: '#7a92b0',
                            bodyColor: 'rgba(0, 212, 249, 1)',
                            borderColor: '#2b5876',
                            borderWidth: 1,
                            displayColors: false
                        },
                        title: {
                            display: true,
                            color: '#ffffff'
                        }
                    },
                    scales: {
                        x: {
                            ticks: {
                                color: '#7a92b0'
                            },
                            grid: {
                                color: '#1f3652'
                            }
                        },
                        y: {
                            ticks: {
                                color: '#7a92b0'
                            },
                            grid: {
                                color: '#1f3652',
                                borderDash: [5, 5]
                            },
                            min: 0,
                            max: 100
                        }
                    }
                }
            }
        );

    } else {
        graficos[maquina.macAddress].ramUso.data.labels = labelsRam;
        graficos[maquina.macAddress].ramUso.data.datasets[0].data = dadosUsoRam;
        graficos[maquina.macAddress].ramUso.update();
    }

    // Gráfico regressao ram
    if (!graficos[maquina.macAddress].ramReg) {
        graficos[maquina.macAddress].ramReg = new Chart(
            document.getElementById(`grafRegRam_${maquina.macAddress}`),
            {
                type: 'line',
                data: {
                    labels: labelsRam,
                    datasets: [{
                        label: 'Porcentagem por Horário',
                        data: dadosRegRam,
                        showLine: false,
                        borderColor: 'rgb(0, 255, 68)',
                        fill: false,
                        backgroundColor: 'rgba(48, 138, 52, 0.4)',
                        borderWidth: 3,
                        tension: 0.2,
                        pointRadius: 3,
                        pointHoverRadius: 6,
                        pointHoverBorderWidth: 2,
                        pointHoverBorderColor: '#ffffff',
                        pointHoverBackgroundColor: '#ffffff'
                    }]
                },
                options: {
                    responsive: true,
                    interaction: {
                        mode: 'index',
                        intersect: false
                    },
                    hover: {
                        mode: 'index',
                        intersect: false
                    },
                    plugins: {
                        annotation: {
                            annotations: maquina.ram.previsao.reta.length >= 2 && maquina.cpu.previsao.r2 > 0
                                ? {
                                    linhaRegressao: {
                                        type: 'line',
                                        xMin: formatarHora(maquina.ram.previsao.reta[0].x),
                                        yMin: maquina.ram.previsao.reta[0].y,

                                        xMax: formatarHora(maquina.ram.previsao.reta[1].x),
                                        yMax: maquina.ram.previsao.reta[1].y,
                                        borderColor: 'rgba(0, 212, 249, 1)',
                                        borderWidth: 2,

                                        label: {
                                        content: `Reta de previsão`,
                                        font: {
                                            size: 12
                                        },
                                        enabled: true,
                                        position: 'start',
                                        backgroundColor: '#104c68',
                                        color: '#rgba(0, 212, 249, 1)',
                                        borderWidth: 0.3,
                                        borderColor: '#rgba(0, 212, 249, 1)'
                                        }
                                    }
                                }
                                : {}
                        },
                        legend: {
                            display: false,
                        },
                        tooltip: {
                            enabled: true,
                            backgroundColor: '#1a3555',
                            titleColor: '#7a92b0',
                            bodyColor: 'rgba(0, 212, 249, 1)',
                            borderColor: '#2b5876',
                            borderWidth: 1,
                            displayColors: false
                        },
                        title: {
                            display: true,
                            color: '#ffffff'
                        }
                    },
                    scales: {
                        x: {
                            ticks: {
                                color: '#7a92b0'
                            },
                            grid: {
                                color: '#1f3652'
                            },
                            type: 'category'
                        },
                        y: {
                            ticks: {
                                color: '#7a92b0'
                            },
                            grid: {
                                color: '#1f3652',
                                borderDash: [5, 5]
                            },
                            min: 0,
                            max: 100,
                        }
                    }
                }
            }
        );

    } else {
        graficos[maquina.macAddress].ramReg.data.datasets[0].data = dadosRegRam;
        graficos[maquina.macAddress].ramReg.update();
    }


    // Disco
    const historicoDisco = historicoMaquinas[maquina.macAddress].disco;
    const labelsDisco = []
    const dadosUsoDisco = []
    const dadosRegDisco = []

    historicoDisco.forEach(item => {
        labelsDisco.push(item.horario)
        dadosUsoDisco.push(item.valor)
        dadosRegDisco.push({
            x: item.horario,
            y: item.valor
        })
    });

    // Gráfico uso disco
    if (!graficos[maquina.macAddress].discoUso) {
        graficos[maquina.macAddress].discoUso = new Chart(
            document.getElementById(`grafUsoDisco_${maquina.macAddress}`),
            {
                type: 'line',
                data: {
                    labels: labelsDisco,
                    datasets: [{
                        data: dadosUsoDisco,
                        borderColor: 'rgba(255, 0, 200, 1)',
                        fill: true,
                        backgroundColor: 'rgba(255, 0, 200, 0.4)',
                        borderWidth: 3,
                        tension: 0.2,
                        pointRadius: 2,
                        pointHoverRadius: 6,
                        pointHoverBorderWidth: 2,
                        pointHoverBorderColor: '#ffffff',
                        pointHoverBackgroundColor: '#ffffff'
                    }]
                },
                options: {
                    responsive: true,
                    interaction: {
                        mode: 'index',
                        intersect: false
                    },
                    hover: {
                        mode: 'index',
                        intersect: false
                    },
                    plugins: {
                        annotation: {
                            annotations: {
                                linhaCritico: {
                                    type: 'line',
                                    yMin: maquina.disco.limite,
                                    yMax: maquina.disco.limite,
                                    borderColor: '#ff3366',
                                    borderWidth: 2,
                                    label: {
                                        content: `Crítico > ${maquina.disco.limite}%`,
                                        font: {
                                            size: 12
                                        },
                                        enabled: true,
                                        position: 'start',
                                        backgroundColor: '#3e2e4c',
                                        color: '#ff3366',
                                        borderWidth: 0.3,
                                        borderColor: '#ff3366'
                                    }
                                },
                                linhaAtencao: {
                                    type: 'line',
                                    yMin: maquina.disco.limite * 0.80,
                                    yMax: maquina.disco.limite * 0.80,
                                    borderColor: '#ffd500',
                                    borderWidth: 2,
                                    label: {
                                        content: `Anormal > ${maquina.disco.limite * 0.80}%`,
                                        font: {
                                            size: 12
                                        },
                                        enabled: true,
                                        position: 'start',
                                        backgroundColor: '#3e4a3a',
                                        color: '#ffd500',
                                        borderWidth: 0.3,
                                        borderColor: '#ffd500'
                                    }
                                }
                            }
                        },
                        legend: {
                            display: false,
                        },
                        tooltip: {
                            enabled: true,
                            backgroundColor: '#1a3555',
                            titleColor: '#7a92b0',
                            bodyColor: 'rgba(0, 212, 249, 1)',
                            borderColor: '#2b5876',
                            borderWidth: 1,
                            displayColors: false
                        },
                        title: {
                            display: true,
                            color: '#ffffff'
                        }
                    },
                    scales: {
                        x: {
                            ticks: {
                                color: '#7a92b0'
                            },
                            grid: {
                                color: '#1f3652'
                            }
                        },
                        y: {
                            ticks: {
                                color: '#7a92b0'
                            },
                            grid: {
                                color: '#1f3652',
                                borderDash: [5, 5]
                            },
                            min: 0,
                            max: 100
                        }
                    }
                }
            }
        );

    } else {
        graficos[maquina.macAddress].discoUso.data.labels = labelsDisco;
        graficos[maquina.macAddress].discoUso.data.datasets[0].data = dadosUsoDisco;
        graficos[maquina.macAddress].discoUso.update();
    }

    // Gráfico regressao disco
    if (!graficos[maquina.macAddress].discoReg) {
        graficos[maquina.macAddress].discoReg = new Chart(
            document.getElementById(`grafRegDisco_${maquina.macAddress}`),
            {
                type: 'line',
                data: {
                    labels: labelsDisco,
                    datasets: [{
                        label: 'Porcentagem por Horário',
                        data: dadosRegDisco,
                        showLine: false,
                        borderColor: 'rgb(0, 255, 68)',
                        fill: false,
                        backgroundColor: 'rgba(48, 138, 52, 0.4)',
                        borderWidth: 3,
                        tension: 0.2,
                        pointRadius: 3,
                        pointHoverRadius: 6,
                        pointHoverBorderWidth: 2,
                        pointHoverBorderColor: '#ffffff',
                        pointHoverBackgroundColor: '#ffffff'
                    }]
                },
                options: {
                    responsive: true,
                    interaction: {
                        mode: 'index',
                        intersect: false
                    },
                    hover: {
                        mode: 'index',
                        intersect: false
                    },
                    plugins: {
                        annotation: {
                            annotations: maquina.disco.previsao.reta.length >= 2 && maquina.cpu.previsao.r2 > 0
                                ? {
                                    linhaRegressao: {
                                        type: 'line',
                                        xMin: formatarHora(maquina.disco.previsao.reta[0].x),
                                        yMin: maquina.disco.previsao.reta[0].y,

                                        xMax: formatarHora(maquina.disco.previsao.reta[1].x),
                                        yMax: maquina.disco.previsao.reta[1].y,
                                        borderColor: 'rgba(0, 212, 249, 1)',
                                        borderWidth: 2,

                                        label: {
                                        content: `Reta de previsão`,
                                        font: {
                                            size: 12
                                        },
                                        enabled: true,
                                        position: 'start',
                                        backgroundColor: '#104c68',
                                        color: '#rgba(0, 212, 249, 1)',
                                        borderWidth: 0.3,
                                        borderColor: '#rgba(0, 212, 249, 1)'
                                        }
                                    }
                                }
                                : {}
                        },
                        legend: {
                            display: false,
                        },
                        tooltip: {
                            enabled: true,
                            backgroundColor: '#1a3555',
                            titleColor: '#7a92b0',
                            bodyColor: 'rgba(0, 212, 249, 1)',
                            borderColor: '#2b5876',
                            borderWidth: 1,
                            displayColors: false
                        },
                        title: {
                            display: true,
                            color: '#ffffff'
                        }
                    },
                    scales: {
                        x: {
                            ticks: {
                                color: '#7a92b0'
                            },
                            grid: {
                                color: '#1f3652'
                            },
                            type: 'category'
                        },
                        y: {
                            ticks: {
                                color: '#7a92b0'
                            },
                            grid: {
                                color: '#1f3652',
                                borderDash: [5, 5]
                            },
                            min: 0,
                            max: 100,
                        }
                    }
                }
            }
        );

    } else {
        graficos[maquina.macAddress].discoReg.data.datasets[0].data = dadosRegDisco;
        graficos[maquina.macAddress].discoReg.update();
    }
}

function criarCards(maquinas) {
    maquinas.forEach(maquina => {
        if (maquinasRenderizadas.has(maquina.macAddress)) {
            return;
        }

        maquinasRenderizadas.add(maquina.macAddress);

        var hora = maquina.horario.split(" ")
        hora = hora[1].slice(0, 5);

        previsaoCpu = maquina.cpu.previsao.previsaoLimite.split(":").slice(0, 2).join(":");
        previsaoRam = maquina.ram.previsao.previsaoLimite.split(":").slice(0, 2).join(":");
        previsaoDisco = maquina.disco.previsao.previsaoLimite.split(":").slice(0, 2).join(":");

        document.getElementById("cards").innerHTML += `
            <div class="divAuxiliar">
                <dialog id="dialogGraf_${maquina.macAddress}" class="dialog-graf">
                    <div class="dialog-content">
                        <div class="dialogGraf-header">
                            <div class="dialogUso">
                                <h2 id="macAddress">${maquina.macAddress}</h2>
                                <img class="closeDialog" type="button" src="../assets/imgs/x-lg.svg" alt=""
                                    onclick="document.getElementById('dialogGraf_${maquina.macAddress}').close()">
                            </div>
                            <div class="dialogUso">
                                <div class="indice_saude bodyImg">
                                    <p>Saúde: ${maquina.indiceSaude}</p>
                                </div>
                                <p class="dialogUso-texto ultimaAtualizacao">Última atualização às ${hora}</p>
                                <div class="bodyImg bodyImgAzul">
                                    <p>Ativo</p>
                                </div>
                            </div>
                        </div>
                        <hr>
                        <div class="dialog-tituloComponente">
                            <p class="tituloComponente">CPU</p>
                            <div class="status_cpu status">
                                <p id="statusComponente_cpu">${maquina.cpu.status}</p>
                            </div>
                        </div>
                        <div class="graficos">
                            <div class="graficoPadrao">
                                <p class="textoChart">Monitoramento de uso da CPU</p>
                                <div class="divCanvas">
                                    <div class="ajuda-container">
                                        <span class="icone-interrogacao-impacto-financeiro">?</span>
                                        <div class="caixa-informacao">
                                            <strong>Monitoramento do uso da CPU ao longo do tempo:</strong><br><br>
                                            <strong>• Eixo horizontal (X):</strong> Horário das coletas realizadas pelo sistema.<br><br>
                                            <strong>• Eixo vertical (Y):</strong> Percentual de utilização da CPU.<br><br>
                                            <strong>• Linha roxa:</strong> Representa a utilização da CPU em tempo hábil.<br><br>
                                            <strong>• Linha amarela:</strong> Faixa de atenção operacional.<br>
                                            Indica comportamento acima do padrão esperado.<br><br>
                                            <strong>• Linha vermelha:</strong> Limite crítico configurado.<br>
                                            Valores acima dessa faixa podem causar lentidão, travamentos ou degradação do desempenho.<br><br>
                                            O gráfico auxilia na identificação de oscilações, picos de consumo e tendências anormais de utilização.
                                        </div>
                                    </div>
                                    <canvas id="grafUsoCpu_${maquina.macAddress}"></canvas>
                                </div>
                                <div class="informacoes">
                                    <div class="dialogComponentes-corpo">
                                        <p>Uso Atual:</p>&nbsp
                                        <p class="uso_cpu client">${maquina.cpu.uso}</p>
                                    </div>
                                    <div class="dialogComponentes-corpo">
                                        <p>Limite Crítico:</p>&nbsp
                                        <p id="limiteCritico" class="client corAzul">${maquina.cpu.limite}%</p>
                                    </div>
                                    <div class="dialogComponentes-corpo" style="margin-bottom: 0px !important;">
                                        <p>Oscilação:</p>&nbsp
                                        <p class="oscilacao_cpu client">${maquina.cpu.oscilacao}</p>
                                    </div>
                                    <div class="dialogComponentes-corpo">
                                        <p style="font-size: 16px !important;">σ = desvio padão</p>
                                    </div>
                                </div>
                            </div>
                            <div class="graficoPadrao">
                                <p class="textoChart">Tendência de utilização da CPU</p>
                                <div class="divCanvas">
                                    <div class="ajuda-container">
                                        <span class="icone-interrogacao-impacto-financeiro">?</span>
                                        <div class="caixa-informacao">
                                            <strong>Análise preditiva baseada no histórico recente de utilização da CPU.</strong><br><br>
                                            <strong>• Eixo horizontal (X):</strong> Horário das coletas.<br><br>
                                            <strong>• Eixo vertical (Y):</strong> Percentual de uso da CPU.<br><br>
                                            <strong>• Pontos verdes:</strong> Valores coletados ao longo do tempo.<br><br>
                                            <strong>• Reta azul claro:</strong> Estimativa matemática da evolução do consumo.<br>
                                            Indica comportamento acima do padrão esperado.<br><br>
                                            <strong>• Previsão de criticidade:</strong> Estimativa de quando a CPU poderá atingir o limite crítico configurado.<br><br>
                                            <strong>A previsão considera:</strong><br>
                                            • tendência de crescimento<br>
                                            • estabilidade da regressão (R²)<br>
                                            • velocidade de degradação<br><br>
                                            Previsões só são exibidas quando existe confiabilidade estatística suficiente.
                                        </div>
                                    </div>
                                    <canvas id="grafRegCpu_${maquina.macAddress}"></canvas>
                                </div>
                                <div class="informacoes">
                                    <div class="dialogComponentes-corpo">
                                        <p>Tendência recente:</p>&nbsp
                                        <p class="ultimas2h_cpu client">${maquina.cpu.degradacao}</p>
                                    </div>
                                    <div class="dialogComponentes-corpo">
                                        <p>Horário de previsão de criticidade:</p>&nbsp
                                        <p class="criticidade_cpu client">${previsaoCpu}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <p><a href="dashboard_auxiliar_Andrei_AWS.html" onclick="pegarMac('${maquina.macAddress}')">Clique para descobrir a possível causa</a></p>
                        <hr>
                        <div class="dialog-tituloComponente">
                            <p class="tituloComponente">RAM</p>
                            <div class="status_ram status">
                                <p id="statusComponente_ram">${maquina.ram.status}</p>
                            </div>
                        </div>
                        <div class="graficos">
                            <div class="graficoPadrao">
                                <p class="textoChart">Monitoramento de uso da RAM</p>
                                <div class="divCanvas">
                                    <div class="ajuda-container">
                                        <span class="icone-interrogacao-impacto-financeiro">?</span>
                                        <div class="caixa-informacao">
                                            <strong>Monitoramento do uso da RAM ao longo do tempo:</strong><br><br>
                                            <strong>• Eixo horizontal (X):</strong> Horário das coletas realizadas pelo sistema.<br><br>
                                            <strong>• Eixo vertical (Y):</strong> Percentual de utilização da RAM.<br><br>
                                            <strong>• Linha azul escura:</strong> Representa a utilização da RAM em tempo hábil.<br><br>
                                            <strong>• Linha amarela:</strong> Faixa de atenção operacional.<br>
                                            Indica comportamento acima do padrão esperado.<br><br>
                                            <strong>• Linha vermelha:</strong> Limite crítico configurado.<br>
                                            Valores acima dessa faixa podem causar lentidão, travamentos ou degradação do desempenho.<br><br>
                                            O gráfico auxilia na identificação de oscilações, picos de consumo e tendências anormais de utilização.
                                        </div>
                                    </div>
                                    <canvas id="grafUsoRam_${maquina.macAddress}"></canvas>
                                </div>
                                <div class="informacoes">
                                    <div class="dialogComponentes-corpo">
                                        <p>Uso Atual:</p>&nbsp
                                        <p class="uso_ram client">${maquina.ram.uso}% (${maquina.ram.status})</p>
                                    </div>
                                    <div class="dialogComponentes-corpo">
                                        <p>Limite Crítico:</p>&nbsp
                                        <p id="limiteCritico" class="client corAzul">${maquina.ram.limite}%</p>
                                    </div>
                                    <div class="dialogComponentes-corpo" style="margin-bottom: 0px !important;">
                                        <p>Oscilação:</p>&nbsp
                                        <p class="oscilacao_ram client">${maquina.ram.oscilacao}</p>
                                    </div>
                                    <div class="dialogComponentes-corpo">
                                        <p style="font-size: 16px !important;">σ = desvio padão</p>
                                    </div>
                                </div>
                            </div>
                            <div class="graficoPadrao">
                                <p class="textoChart">Tendência de utilização da RAM</p>
                                <div class="divCanvas">
                                    <div class="ajuda-container">
                                        <span class="icone-interrogacao-impacto-financeiro">?</span>
                                        <div class="caixa-informacao">
                                            <strong>Análise preditiva baseada no histórico recente de utilização da RAM.</strong><br><br>
                                            <strong>• Eixo horizontal (X):</strong> Horário das coletas.<br><br>
                                            <strong>• Eixo vertical (Y):</strong> Percentual de uso da RAM.<br><br>
                                            <strong>• Pontos verdes:</strong> Valores coletados ao longo do tempo.<br><br>
                                            <strong>• Reta azul claro:</strong> Estimativa matemática da evolução do consumo.<br>
                                            Indica comportamento acima do padrão esperado.<br><br>
                                            <strong>• Previsão de criticidade:</strong> Estimativa de quando a RAM poderá atingir o limite crítico configurado.<br><br>
                                            <strong>A previsão considera:</strong><br>
                                            • tendência de crescimento<br>
                                            • estabilidade da regressão (R²)<br>
                                            • velocidade de degradação<br><br>
                                            Previsões só são exibidas quando existe confiabilidade estatística suficiente.
                                        </div>
                                    </div>
                                    <canvas id="grafRegRam_${maquina.macAddress}"></canvas>
                                </div>
                                <div class="informacoes">
                                    <div class="dialogComponentes-corpo">
                                        <p>Últimas 2 horas:</p>&nbsp
                                        <p class="ultimas2h_ram client">${maquina.ram.degradacao}</p>
                                    </div>
                                    <div class="dialogComponentes-corpo">
                                        <p>Horário de previsão de criticidade:</p>&nbsp
                                        <p class="criticidade_ram client">${previsaoRam}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <p><a href="dashRam.html">Clique para descobrir a possível causa</a></p>
                        <hr>
                        <div class="dialog-tituloComponente">
                            <p class="tituloComponente">Disco</p>
                            <div class="status_disco status">
                                <p id="statusComponente_disco">${maquina.disco.status}</p>
                            </div>
                        </div>
                        <div class="graficos">
                            <div class="graficoPadrao">
                                <p class="textoChart">Monitoramento de uso do Disco</p>
                                <div class="divCanvas">
                                    <div class="ajuda-container">
                                        <span class="icone-interrogacao-impacto-financeiro">?</span>
                                        <div class="caixa-informacao">
                                            <strong>Monitoramento do uso da Disco ao longo do tempo:</strong><br><br>
                                            <strong>• Eixo horizontal (X):</strong> Horário das coletas realizadas pelo sistema.<br><br>
                                            <strong>• Eixo vertical (Y):</strong> Percentual de utilização da Disco.<br><br>
                                            <strong>• Linha azul escura:</strong> Representa a utilização da Disco em tempo hábil.<br><br>
                                            <strong>• Linha amarela:</strong> Faixa de atenção operacional.<br>
                                            Indica comportamento acima do padrão esperado.<br><br>
                                            <strong>• Linha vermelha:</strong> Limite crítico configurado.<br>
                                            Valores acima dessa faixa podem causar lentidão, travamentos ou degradação do desempenho.<br><br>
                                            O gráfico auxilia na identificação de oscilações, picos de consumo e tendências anormais de utilização.
                                        </div>
                                    </div>
                                    <canvas id="grafUsoDisco_${maquina.macAddress}"></canvas>
                                </div>
                                <div class="informacoes">
                                    <div class="dialogComponentes-corpo">
                                        <p>Uso Atual:</p>&nbsp
                                        <p class="uso_disco client">${maquina.disco.uso}% (${maquina.disco.status})</p>
                                    </div>
                                    <div class="dialogComponentes-corpo">
                                        <p>Limite Crítico:</p>&nbsp
                                        <p id="limiteCritico" class="client corAzul">${maquina.disco.limite}%</p>
                                    </div>
                                </div>
                            </div>
                            <div class="graficoPadrao">
                                <p class="textoChart">Tendência de utilização do Disco</p>
                                <div class="divCanvas">
                                    <div class="ajuda-container">
                                        <span class="icone-interrogacao-impacto-financeiro">?</span>
                                        <div class="caixa-informacao">
                                            <strong>Análise preditiva baseada no histórico recente de utilização da Disco.</strong><br><br>
                                            <strong>• Eixo horizontal (X):</strong> Horário das coletas.<br><br>
                                            <strong>• Eixo vertical (Y):</strong> Percentual de uso da Disco.<br><br>
                                            <strong>• Pontos verdes:</strong> Valores coletados ao longo do tempo.<br><br>
                                            <strong>• Reta azul claro:</strong> Estimativa matemática da evolução do consumo.<br>
                                            Indica comportamento acima do padrão esperado.<br><br>
                                            <strong>• Previsão de criticidade:</strong> Estimativa de quando a Disco poderá atingir o limite crítico configurado.<br><br>
                                            <strong>A previsão considera:</strong><br>
                                            • tendência de crescimento<br>
                                            • estabilidade da regressão (R²)<br>
                                            • velocidade de degradação<br><br>
                                            Previsões só são exibidas quando existe confiabilidade estatística suficiente.
                                        </div>
                                    </div>
                                    <canvas id="grafRegDisco_${maquina.macAddress}"></canvas>
                                </div>
                                <div class="informacoes">
                                    <div class="dialogComponentes-corpo">
                                        <p>Últimas 2 horas:</p>&nbsp
                                        <p class="ultimas2h_disco client">${maquina.disco.degradacao}</p>
                                    </div>
                                    <div class="dialogComponentes-corpo">
                                        <p>Horário de previsão de criticidade:</p>&nbsp
                                        <p class="criticidade_disco client">${previsaoDisco}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </dialog>
                <div class="col">
                    <div class="card cardMaquina"
                        onclick="document.getElementById('dialogGraf_${maquina.macAddress}').showModal()">
                        <div class="card-body bodyMaquina">
                            <div class="bodyMaquina-header">
                                <p class="macAddressCard">${maquina.macAddress}</p>
                                <div class="indice_saude bodyImg">
                                    <p>Saúde: ${maquina.indiceSaude}</p>
                                </div>                    
                            </div>
                            <div class="localizacao">
                                        <img src="../assets/imgs/loc.svg" alt="">
                                        <p class="endereco">${maquina.empresa}</p>
                                    </div>
                            <div class="bodyMaquina-body">
                                <p class="ultimaAtualizacao">Última atualização às ${hora}</p>
                                <hr>
                                <div class="componentes">
                                    <div class="componentes-titulo">
                                        <div class="componentes-tituloBarra">
                                            <img src="../assets/imgs/cpu.svg" alt="">&nbsp &nbsp
                                            <h9>CPU</p>
                                        </div>
                                        <p class="uso_cpu">${maquina.cpu.uso}%</p>
                                        <div class="status_cpu status">
                                            <p class="statusComponente_cpu">${maquina.cpu.status}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <div class="componentes-corpo">
                                            <p>Oscilação:</p>&nbsp
                                            <p class="oscilacao_cpu client">${maquina.cpu.oscilacao}</p>
                                        </div>
                                        <div class="componentes-corpo">
                                            <p>Últimas 2 horas:</p>&nbsp
                                            <p class="ultimas2h_cpu client">${maquina.cpu.degradacao}</p>
                                        </div>
                                        <div class="componentes-corpo">
                                            <p>Previsão criticidade:</p>&nbsp
                                            <p class="criticidade_cpu client">${previsaoCpu}</p>
                                        </div>
                                    </div>
                                </div>
                                <hr>
                                <div class="componentes">
                                    <div class="componentes-titulo">
                                        <div class="componentes-tituloBarra">
                                            <img src="../assets/imgs/memory.svg" alt="">&nbsp &nbsp
                                            <h9>RAM</p>
                                        </div>
                                        <p class="uso_ram">${maquina.ram.uso}%</p>
                                        <div class="status_ram status">
                                            <p id="statusComponente_ram">${maquina.ram.status}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <div class="componentes-corpo">
                                            <p>Oscilação:</p>&nbsp
                                            <p class="oscilacao_ram client">${maquina.ram.oscilacao}</p>
                                        </div>
                                        <div class="componentes-corpo">
                                            <p>Últimas 2 horas:</p>&nbsp
                                            <p class="ultimas2h_ram client">${maquina.ram.degradacao}</p>
                                        </div>
                                        <div class="componentes-corpo">
                                            <p>Previsão criticidade:</p>&nbsp
                                            <p class="criticidade_ram client">${previsaoRam}</p>
                                        </div>
                                    </div>
                                </div>
                                <hr>
                                <div class="componentes">
                                    <div class="componentes-titulo">
                                        <div class="componentes-tituloBarra">
                                            <img src="../assets/imgs/hard-disk.png" alt="">&nbsp &nbsp
                                            <h9>Disco</p>
                                        </div>
                                        <p class="uso_disco">${maquina.disco.uso}%</p>
                                        <div class="status_disco status">
                                            <p id="statusComponente_disco">${maquina.disco.status}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <div class="componentes-corpo">
                                            <p>Últimas 2 horas:</p>&nbsp
                                            <p class="ultimas2h_disco client">${maquina.disco.degradacao}</p>
                                        </div>
                                        <div class="componentes-corpo">
                                            <p>Previsão criticidade:</p>&nbsp
                                            <p class="criticidade_disco client">${previsaoDisco}</p>
                                        </div>
                                    </div>
                                </div>
                                <hr>
                                <p class="clique">Clique para ver mais detalhes</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
}

async function exibirMRI(registro) {
    const maquinas = registro.maquinas;

    total = 0;
    critico = 0;
    atencao = 0;
    estavel = 0;

    maquinas.forEach(maquina => {
        salvarHistorico(maquina);

        const dialog = document.getElementById(`dialogGraf_${maquina.macAddress}`); 

        let card = null;
        if (dialog) {
            card = dialog.closest(".divAuxiliar");

        } else if (!card) {
            return;
        }

        chamarCor(card, maquina);
        plotarGrafico(maquina);

        // Atualiza textos
        card.querySelectorAll(".uso_cpu").forEach(elemento => {
            elemento.innerHTML = `${maquina.cpu.uso}%`;
        });

        card.querySelectorAll(".uso_ram").forEach(elemento => {
            elemento.innerHTML = `${maquina.ram.uso}%`;
        });

        card.querySelectorAll(".uso_disco").forEach(elemento => {
            elemento.innerHTML = `${maquina.disco.uso}%`;
        });

        const hora = formatarHora(maquina.horario);
        card.querySelectorAll(".ultimaAtualizacao").forEach(elemento => {
            elemento.innerHTML = `Última atualização às ${hora}`;
        });
    });

    plotarKpi(total, critico, atencao, estavel);
}


function pegarMac(macAddressAtual) {
    console.log(macAddressAtual)
    sessionStorage.setItem("MAC_ADDRESS_ATUAL", macAddressAtual);
}

async function iniciar() {
    const dados = await carregarDados();

    if (!dados) {
        console.log("Nenhum dado encontrado")
        return
    }

    criarCards(dados.maquinas);
    exibirMRI(dados);

    setInterval(async () => {
        const novosDados = await carregarDados();
        exibirMRI(novosDados);
    }, 60000);
}

iniciar();