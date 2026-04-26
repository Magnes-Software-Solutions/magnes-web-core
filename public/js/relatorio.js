// Gráfico de Gargalos (rosca)
const gargaloCtx = document.getElementById('gargaloChart').getContext('2d');

new Chart(gargaloCtx, {
    type: 'doughnut',
    data: {
        labels: ['Disco', 'Memória RAM'],
        datasets: [{
            data: [64, 36],
            backgroundColor: ['#f97316', '#a855f7'],
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
        maquina: "WORKSTATION-01",
        Data: dataAtual,
        Gravidade: "CRÍTICO",
        Evento: "Armazenamento (Disco) excedeu 94%",
        Sumário: "Disco cheio impactando leitura de dados críticos.",
        Objetivo: "Acionar equipe de manutenção (expansão de armazenamento)",
    },
    {
        maquina: "WORKSTATION-02",
        Data: dataAtual,
        Gravidade: "ALERTA",
        Evento: "Memória RAM com picos de 91%",
        Sumário: "Processos intensivos comprometendo resposta.",
        Objetivo: "Otimizar alocação de memória e verificar vazamentos",
    },
    {
        maquina: "WORKSTATION-03",
        Data: dataAtual,
        Gravidade: "ALERTA",
        Evento: "CPU com carga sustentada 85%",
        Sumário: "Alta demanda por processamento, risco de overheating.",
        Objetivo: "Revisar tarefas em segundo plano",
    },
    {
        maquina: "WORKSTATION-04",
        Data: dataAtual,
        Gravidade: "CRÍTICO",
        Evento: "Falha de leitura em setor do disco",
        Sumário: "Bad sectors identificados, risco de perda de dados.",
        Objetivo: "Acionar equipe de manutenção imediata",
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
        } else {
            gravCell.innerHTML = ev.Gravidade;
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
                label: 'Workstation 01 (CPU/RAM)',
                data: [74, 70, 68, 72, 65, 58, 61, 55, 52, 48, 45, 42],
                borderColor: '#facc15',
                backgroundColor: 'rgba(250, 204, 21, 0.05)',
                borderWidth: 2.5,
                tension: 0.3,
                fill: false,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: '#facc15',
                pointBorderColor: '#0a1628',
                pointBorderWidth: 1.5,
            },
            {
                label: 'Workstation 02 (Disco)',
                data: [68, 65, 62, 60, 57, 54, 52, 49, 46, 44, 41, 38],
                borderColor: '#c084fc',
                backgroundColor: 'rgba(192, 132, 252, 0.05)',
                borderWidth: 2.5,
                tension: 0.3,
                fill: false,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: '#c084fc',
                pointBorderColor: '#0a1628',
                pointBorderWidth: 1.5,
            },
            {
                label: 'Workstation 03 (Geral)',
                data: [60, 58, 55, 52, 48, 46, 44, 41, 39, 36, 34, 32],
                borderColor: '#fb923c',
                backgroundColor: 'rgba(251, 146, 60, 0.05)',
                borderWidth: 2.5,
                tension: 0.3,
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
    if (document.getElementById('spanNome')) document.getElementById('spanNome').innerHTML = "Gestor Técnico";
    if (document.getElementById('cargoUsuarioNav')) document.getElementById('cargoUsuarioNav').innerHTML = "Supervisor de Operações";
}

function limparSessao() {
    console.log("Logout acionado");
}

window.onload = pegarDashboard;