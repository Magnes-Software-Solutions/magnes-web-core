// Gráfico de Gargalos (rosca)
const gargaloCtx = document.getElementById('gargaloChart').getContext('2d');

new Chart(gargaloCtx, {
    type: 'doughnut',
    data: {
        labels: ['Disco', 'Memória RAM', 'CPU'],
        datasets: [{
            data: [2, 1, 1],
            backgroundColor: ['#f97316', '#a855f7', '#288ba8'],
            borderColor: '#0a1628',
            borderWidth: 4,
            cutout: '62%',
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: { display: false },
            tooltip: { backgroundColor: '#0b1525', titleColor: '#a0bcd8', bodyColor: '#e2e8f2' }
        }
    }
});

// Tabela de Eventos Ativos
const dataAtual = new Date().toLocaleDateString('pt-BR');

const eventsforPlot = [
    {
        maquina: "WORKSTATION-01 (Alphaville)",
        Data: dataAtual,
        Gravidade: "CRÍTICO",
        Evento: "Armazenamento (Disco) excedeu 94%",
        Sumário: "Disco cheio impactando leitura de dados críticos.",
        Objetivo: "Acionar equipe de manutenção (expansão de armazenamento)",
    },
    {
        maquina: "WORKSTATION-02 (Alphaville)",
        Data: dataAtual,
        Gravidade: "CRÍTICO",
        Evento: "Memória RAM com picos de 91%",
        Sumário: "Processos intensivos comprometendo resposta.",
        Objetivo: "Otimizar alocação de memória e verificar vazamentos",
    },
    {
        maquina: "WORKSTATION-03 (Alphaville)",
        Data: dataAtual,
        Gravidade: "ALERTA",
        Evento: "CPU com carga sustentada 85%",
        Sumário: "Alta demanda por processamento, risco de overheating.",
        Objetivo: "Revisar tarefas em segundo plano",
    },
    {
        maquina: "WORKSTATION-01 (Alto de Pinheiros)",
        Data: dataAtual,
        Gravidade: "ALERTA",
        Evento: "Falha de leitura em setor do disco",
        Sumário: "Bad sectors identificados, risco de perda de dados.",
        Objetivo: "Acionar equipe de manutenção imediata",
    },
    {
        maquina: "WORKSTATION-02 (Alto de Pinheiros)",
        Data: dataAtual,
        Gravidade: "ESTÁVEL",
        Evento: "Workstation estável",
        Sumário: "Operando no seu estado normal.",
        Objetivo: "Manter estabilidade dos componentes.",
    },
    {
        maquina: "WORKSTATION-03 (Alto de Pinheiros)",
        Data: dataAtual,
        Gravidade: "ESTÁVEL",
        Evento: "Workstation estável",
        Sumário: "Operando no seu estado normal.",
        Objetivo: "Manter estabilidade dos componentes.",
    }
];

function renderEvents() {
    const tbody = document.getElementById('eventsTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    for (let i = 0; i < eventsforPlot.length; i++) {
        const ev = eventsforPlot[i];
        const row = tbody.insertRow();

        row.insertCell(0).innerHTML = ev.maquina;
        row.insertCell(1).innerHTML = ev.Data;

        const gravCell = row.insertCell(2);
        if (ev.Gravidade === "CRÍTICO") {
            gravCell.innerHTML = `<span class="badge-critico">CRÍTICO</span>`;
        } else if (ev.Gravidade === "ALERTA") {
            gravCell.innerHTML = `<span class="badge-alerta">ALERTA</span>`;
        } else if (ev.Gravidade === "ESTÁVEL") {
            gravCell.innerHTML = `<span class="badge-estavel">ESTÁVEL</span>`;
        }

        row.insertCell(3).innerHTML = ev.Evento;
        row.insertCell(4).innerHTML = ev.Sumário;
        row.insertCell(5).innerHTML = `<span>${ev.Objetivo}</span>`;
    }
}
renderEvents();

// Gráfico de Histórico de Estabilidade
const ctx = document.getElementById('histStability').getContext('2d');

new Chart(ctx, {
    type: 'line',
    data: {
        labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
        datasets: [
            {
                label: 'Workstation 01',
                data: [70, 76, 60, 55, 83, 70, 61, 67, 80, 40, 30, 70],
                borderColor: '#facc15',
                backgroundColor: 'rgba(250, 204, 21, 0.05)',
                borderWidth: 2.5,
                tension: 0,
                fill: false,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: '#facc15',
                pointBorderColor: '#0a1628',
                pointBorderWidth: 1.5,
            },
            {
                label: 'Workstation 02',
                data: [67, 70, 62, 60, 57, 58, 77, 83, 73, 40, 60, 78],
                borderColor: '#c084fc',
                backgroundColor: 'rgba(192, 132, 252, 0.05)',
                borderWidth: 2.5,
                tension: 0,
                fill: false,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: '#c084fc',
                pointBorderColor: '#0a1628',
                pointBorderWidth: 1.5,
            },
            {
                label: 'Workstation 03',
                data: [80, 65, 55, 78, 89, 73, 64, 78, 68, 29, 34, 60],
                borderColor: '#fb923c',
                backgroundColor: 'rgba(251, 146, 60, 0.05)',
                borderWidth: 2.5,
                tension: 0,
                fill: false,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: '#fb923c',
                pointBorderColor: '#0a1628',
                pointBorderWidth: 1.5,
            }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: '#b9d0f0',
                    font: { size: 11, family: "'DM Sans', sans-serif" },
                    usePointStyle: true,
                    boxWidth: 10,
                    padding: 15
                }
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: '#0f1e2f',
                titleColor: '#cbd5e6',
                titleFont: { size: 12, weight: 'bold' },
                bodyColor: '#a0bcd8',
                bodyFont: { size: 11 },
                borderColor: '#2d5a88',
                borderWidth: 1,
                padding: 10,
                callbacks: {
                    label: function(context) {
                        return `${context.dataset.label}: ${context.raw}% de estabilidade`;
                    }
                }
            }
        },
        scales: {
            x: {
                ticks: { 
                    color: '#7e9fc7', 
                    font: { size: 11 },
                    stepSize: 1
                },
                grid: { 
                    color: '#1e3555',
                    drawBorder: true,
                    borderColor: '#2d5a88'
                },
                title: {
                    display: true,
                    text: 'Período (Meses)',
                    color: '#6c8db0',
                    font: { size: 11, weight: 'normal' }
                }
            },
            y: {
                ticks: { 
                    color: '#7e9fc7', 
                    font: { size: 11 },
                    stepSize: 10,
                    callback: function(value) {
                        return value + '%';
                    }
                },
                grid: { 
                    color: '#1e3555',
                    drawBorder: true
                },
                min: 20,
                max: 90,
                title: {
                    display: true,
                    text: 'Índice de Estabilidade (%)',
                    color: '#6c8db0',
                    font: { size: 11, weight: 'normal' }
                }
            }
        },
        elements: {
            line: {
                borderJoin: 'round',
                borderCap: 'round'
            },
            point: {
                hoverBorderWidth: 2
            }
        },
        interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
        }
    }
});

// Segundo gráfico

const ctx2 = document.getElementById('histStability2').getContext('2d');

new Chart(ctx2, {
    type: 'line',
    data: {
        labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
        datasets: [
            {
                label: 'Workstation 01',
                data: [65, 77, 82, 74, 57, 60, 64, 67, 60, 30, 20, 70],
                borderColor: '#facc15',
                backgroundColor: 'rgba(250, 204, 21, 0.05)',
                borderWidth: 2.5,
                tension: 0,
                fill: false,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: '#facc15',
                pointBorderColor: '#0a1628',
                pointBorderWidth: 1.5,
            },
            {
                label: 'Workstation 02',
                data: [79, 70, 64, 57, 46, 53, 68, 64, 71, 30, 55, 69],
                borderColor: '#c084fc',
                backgroundColor: 'rgba(192, 132, 252, 0.05)',
                borderWidth: 2.5,
                tension: 0,
                fill: false,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: '#c084fc',
                pointBorderColor: '#0a1628',
                pointBorderWidth: 1.5,
            },
            {
                label: 'Workstation 03',
                data: [80, 65, 55, 78, 89, 73, 64, 78, 68, 20, 34, 60],
                borderColor: '#fb923c',
                backgroundColor: 'rgba(251, 146, 60, 0.05)',
                borderWidth: 2.5,
                tension: 0,
                fill: false,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: '#fb923c',
                pointBorderColor: '#0a1628',
                pointBorderWidth: 1.5,
            }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: '#b9d0f0',
                    font: { size: 11, family: "'DM Sans', sans-serif" },
                    usePointStyle: true,
                    boxWidth: 10,
                    padding: 15
                }
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: '#0f1e2f',
                titleColor: '#cbd5e6',
                titleFont: { size: 12, weight: 'bold' },
                bodyColor: '#a0bcd8',
                bodyFont: { size: 11 },
                borderColor: '#2d5a88',
                borderWidth: 1,
                padding: 10,
                callbacks: {
                    label: function(context) {
                        return `${context.dataset.label}: ${context.raw}% de estabilidade`;
                    }
                }
            }
        },
        scales: {
            x: {
                ticks: { 
                    color: '#7e9fc7', 
                    font: { size: 11 },
                    stepSize: 1
                },
                grid: { 
                    color: '#1e3555',
                    drawBorder: true,
                    borderColor: '#2d5a88'
                },
                title: {
                    display: true,
                    text: 'Período (Meses)',
                    color: '#6c8db0',
                    font: { size: 11, weight: 'normal' }
                }
            },
            y: {
                ticks: { 
                    color: '#7e9fc7', 
                    font: { size: 11 },
                    stepSize: 10,
                    callback: function(value) {
                        return value + '%';
                    }
                },
                grid: { 
                    color: '#1e3555',
                    drawBorder: true
                },
                min: 20,
                max: 90,
                title: {
                    display: true,
                    text: 'Índice de Estabilidade (%)',
                    color: '#6c8db0',
                    font: { size: 11, weight: 'normal' }
                }
            }
        },
        elements: {
            line: {
                borderJoin: 'round',
                borderCap: 'round'
            },
            point: {
                hoverBorderWidth: 2
            }
        },
        interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
        }
    }
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
                console.log(fkSupervisor)
                if (fkSupervisor === null) {
                    cargo = "Supervisor de Sistemas";
                } else {
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