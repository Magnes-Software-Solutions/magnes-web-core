const S3_API_ENDPOINT = "/client";
console.log("Endpoint S3 definido como:", S3_API_ENDPOINT);

let graficoRamHistorico = null;


async function puxarDadosKpis() {
    try {

        const resposta = await fetch(
            `${S3_API_ENDPOINT}`,
            { cache: 'no-cache' }
        );

        if (!resposta.ok) {
            throw new Error(
                'Erro ao acessar o bucket: ' + resposta.statusText
            );
        }

        const dados = await resposta.json();

        console.log("Resposta do bucket:", resposta);

        document.getElementById('kpi1-mac').innerText =
            dados.kpis.machineMaisCritica.macAddress;

        document.getElementById('kpi1-%deUso').innerText =
            dados.kpis.machineMaisCritica.ramUso + '% uso de RAM';

        document.getElementById('kpi2-mac').innerText =
            dados.kpis.maiorVariacaoRam.macAddress;

        document.getElementById('kpi2ocila').innerText =
            dados.kpis.maiorVariacaoRam.variacao + '% de oscilação de RAM';

        document.getElementById('kpi3-mac').innerText =
            dados.kpis.piorTendencia.macAddress;

        document.getElementById('kpi3Delta').innerText =
            dados.kpis.piorTendencia.delta + '% de aumento no uso de RAM';

        document.getElementById('kpi4TmnGB').innerText =
            dados.kpis.imagemMaisPesada.tamanhoGB + ' GB';

        document.getElementById('kpi4-mac').innerText = 'Maquina que gerou a imagem: ' +
            dados.kpis.imagemMaisPesada.macAddress;

    } catch (error) {

        console.error('Erro:', error);

        const el = document.getElementById('dados-bucket');

        if (el) {
            el.innerText =
                'Não foi possível carregar os dados.';
        }
    }
}

async function puxarDadosRanking() {
    try {

        const resposta = await fetch(
            `${S3_API_ENDPOINT}`,
            { cache: 'no-cache' }
        );

        if (!resposta.ok) {
            throw new Error(
                'Erro ao acessar o bucket: ' + resposta.statusText
            );
        }

        const dados = await resposta.json();

        console.log("Resposta do bucket:", dados);
        for (var i = 0; i < dados.ranking.length; i++) {
            var item = dados.ranking[i];
            if (item.ramUso >= 70) {
                document.getElementById('ranking').innerHTML += `
                  <strong>${i + 1}º- MAQUINA:</strong> <span style='color: red;'>${item.macAddress}</span><br> <strong>USO DA RAM:</strong> <span style='color: red;'>${item.ramUso}%</span><hr style="border: 1px solid white;">
                `;
            }
            else if (item.ramUso >= 40) {
                document.getElementById('ranking').innerHTML += `
                  <strong>${i + 1}º- MAQUINA:</strong> <span style='color: yellow;'>${item.macAddress}</span><br> <strong>USO DA RAM:</strong> <span style='color: yellow;'>${item.ramUso}%</span><hr style="border: 1px solid white;">
                `;
            }
            else {
                document.getElementById('ranking').innerHTML += `
                  <strong>${i + 1}º- MAQUINA:</strong> <span style='color: green;'>${item.macAddress}</span><br> <strong>USO DA RAM:</strong> <span style='color: green;'>${item.ramUso}%</span><hr style="border: 1px solid white;">
                `;
            }
        }
    } catch (error) {

        console.error('Erro:', error);

        const el = document.getElementById('dados-bucket');

        if (el) {
            el.innerText =
                'Não foi possível carregar os dados.';
        }
    }
}

function corLinhaRam(indice) {
    const cores = [
        '#00d4f9',
        '#00ff88',
        '#ffd500',
        '#ff3366',
        '#f27826',
        '#9b8cff',
        '#38bdf8',
        '#f472b6'
    ];

    return cores[indice % cores.length];
}


function formatarDataHoraRam(horario) {
    const data = new Date(horario);

    if (Number.isNaN(data.getTime())) {
        return horario;
    }

    return data.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    });
}


async function puxarGraficoRam() {

    const resposta = await fetch(`${S3_API_ENDPOINT}`, { cache: 'no-cache' });

    if (!resposta.ok) {
        throw new Error('Erro ao acessar o bucket: ' + resposta.statusText);
    }


    const dadosCompletos = await resposta.json();
    const historico = dadosCompletos.historico;

    const canvas = document.getElementById('historico-caio');

    if (!canvas) {
        console.error('Canvas #historico-caio não encontrado no HTML');
        return;
    }

    if (!Array.isArray(historico) || historico.length === 0) {
        canvas.parentElement.innerHTML =
            '<p class="grafico-vazio">Nenhum registro de RAM encontrado.</p>';
        return;
    }

    const todosHorarios = historico.flatMap(maquina =>
        maquina.registros.map(r => r.horario)
    );

    const labels = [...new Set(todosHorarios)].sort();

    const datasets = historico.map((maquina, indice) => {
        const cor = corLinhaRam(indice);


        const valores = labels.map(horario => {
            const registro = maquina.registros.find(r => r.horario === horario);
            return registro ? registro.ramUso : null;
        });

        return {
            label: maquina.macAddress,
            data: valores,
            borderColor: cor,
            backgroundColor: cor,
            borderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 5,
            spanGaps: true,
            tension: 0.3
        };
    });

    if (graficoRamHistorico) {
        graficoRamHistorico.destroy();
    }

    graficoRamHistorico = new Chart(canvas, {
        type: 'line',
        data: {
            labels: labels.map(formatarDataHoraRam),
            datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#e2e8f2',
                        usePointStyle: true,
                        boxWidth: 8
                    }
                },
                title: {
                    display: true,
                    text: 'Uso de RAM das Workstations',
                    color: '#9ab3d0',
                    font: {
                        size: 14,
                        weight: '600'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (context) =>
                            `${context.dataset.label}: ${context.parsed.y}% de RAM`
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#9ab3d0', maxRotation: 45 },
                    grid: { color: 'rgba(154, 179, 208, 0.12)' },
                    title: { display: true, text: 'Horário', color: '#9ab3d0' }
                },
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        color: '#9ab3d0',
                        callback: (value) => `${value}%`
                    },
                    grid: { color: 'rgba(154, 179, 208, 0.12)' },
                    title: { display: true, text: 'Uso de RAM', color: '#9ab3d0' }
                }
            }
        }
    });
}


puxarDadosKpis();
puxarDadosRanking();
puxarGraficoRam();

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
