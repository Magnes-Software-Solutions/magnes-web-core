const S3_API_ENDPOINT = "/client";
console.log("Endpoint S3 definido como:", S3_API_ENDPOINT);

let graficoRamHistorico = null;
let historicoRamAcumulado = [];
let atualizandoDadosRam = false;

function calcularKpisRamPeloHistorico(historico) {
    if (!Array.isArray(historico)) {
        return {
            maiorVariacaoRam: null,
            piorTendencia: null
        };
    }

    const variacoes = [];
    const tendencias = [];

    historico.forEach(maquina => {
        const registros = Array.isArray(maquina.registros)
            ? [...maquina.registros].sort((a, b) => new Date(a.horario) - new Date(b.horario))
            : [];

        if (registros.length < 2) {
            return;
        }

        const penultimo = registros[registros.length - 2];
        const ultimo = registros[registros.length - 1];
        const ramUltimo = Number(ultimo.ramUso);
        const ramPenultimo = Number(penultimo.ramUso);

        if (Number.isNaN(ramUltimo) || Number.isNaN(ramPenultimo)) {
            return;
        }

        const variacao = Math.abs(ramUltimo - ramPenultimo);
        const delta = ramUltimo - ramPenultimo;

        variacoes.push({
            macAddress: maquina.macAddress,
            empresa: maquina.empresa || ultimo.empresa,
            variacao: Number(variacao.toFixed(2)),
            ultimo: ramUltimo,
            penultimo: ramPenultimo
        });

        tendencias.push({
            macAddress: maquina.macAddress,
            empresa: maquina.empresa || ultimo.empresa,
            delta: Number(delta.toFixed(2)),
            ramUso: ramUltimo
        });
    });

    return {
        maiorVariacaoRam: variacoes.length
            ? variacoes.reduce((maior, atual) => atual.variacao > maior.variacao ? atual : maior)
            : null,
        piorTendencia: tendencias.length
            ? tendencias.reduce((maior, atual) => atual.delta > maior.delta ? atual : maior)
            : null
    };
}


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

        const kpisHistorico = calcularKpisRamPeloHistorico(dados.historico);
        const maiorVariacaoRam = dados.kpis.maiorVariacaoRam || kpisHistorico.maiorVariacaoRam;
        const piorTendencia = dados.kpis.piorTendencia || kpisHistorico.piorTendencia;

        document.getElementById('kpi1-mac').innerText =
            dados.kpis.machineMaisCritica.macAddress;

        document.getElementById('kpi1-%deUso').innerText =
            dados.kpis.machineMaisCritica.ramUso + '% uso de RAM';

        document.getElementById('kpi2-mac').innerText =
            maiorVariacaoRam ? maiorVariacaoRam.macAddress : 'Sem dados';

        document.getElementById('kpi2ocila').innerText =
            maiorVariacaoRam ? maiorVariacaoRam.variacao + '% de oscilação de RAM' : 'Aguardando historico';

        document.getElementById('kpi3-mac').innerText =
            piorTendencia ? piorTendencia.macAddress : 'Sem dados';

        document.getElementById('kpi3Delta').innerText =
            piorTendencia ? piorTendencia.delta + '% de aumento no uso de RAM' : 'Aguardando historico';

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
        document.getElementById('ranking').innerHTML = '';

        console.log("Resposta do bucket:", dados);
        
        for (var i = 0; i < dados.ranking.length; i++) {
            var item = dados.ranking[i];
            if (item.ramUso >= dados.maquinas[0].ram.limite) {
                document.getElementById('ranking').innerHTML += `
                  <strong>${i + 1}º- MAQUINA:</strong> <span style='color: red;'>${item.macAddress}</span><br> <strong>USO DA RAM:</strong> <span style='color: red;'>${item.ramUso}%</span><hr style="border: 1px solid white;">
                `;
            }
            else if (item.ramUso >= Number(dados.maquinas[0].ram.limite) * 0.8) {
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

function mesclarHistoricoRam(historicoNovo) {
    if (!Array.isArray(historicoNovo)) {
        return historicoRamAcumulado;
    }

    historicoNovo.forEach(maquinaNova => {
        if (!maquinaNova || !maquinaNova.macAddress || !Array.isArray(maquinaNova.registros)) {
            return;
        }

        let maquinaAtual = historicoRamAcumulado.find(
            maquina => maquina.macAddress === maquinaNova.macAddress
        );

        if (!maquinaAtual) {
            maquinaAtual = {
                macAddress: maquinaNova.macAddress,
                empresa: maquinaNova.empresa,
                registros: []
            };
            historicoRamAcumulado.push(maquinaAtual);
        }

        maquinaAtual.empresa = maquinaNova.empresa || maquinaAtual.empresa;

        maquinaNova.registros.forEach(registroNovo => {
            const registroExiste = maquinaAtual.registros.some(
                registro => registro.horario === registroNovo.horario
            );

            if (!registroExiste) {
                maquinaAtual.registros.push(registroNovo);
            }
        });

        maquinaAtual.registros.sort((a, b) =>
            new Date(a.horario).getTime() - new Date(b.horario).getTime()
        );
    });

    return historicoRamAcumulado;
}

function montarDadosGraficoRam(historico) {

    const todosHorarios = historico.flatMap(maquina =>
        maquina.registros.map(r => r.horario)
    );

    const labels = [...new Set(todosHorarios)].sort(
        (a, b) => new Date(a) - new Date(b)
    );

    const datasets = historico.map((maquina, indice) => {
        const cor = corLinhaRam(indice);

        const valores = labels.map(horario => {
            const registro = maquina.registros.find(
                r => r.horario === horario
            );

            return registro ? registro.ramUso : null;
        });

        return {
            label: maquina.empresa
                ? `${maquina.empresa} - ${maquina.macAddress}`
                : maquina.macAddress,
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

    return {
        labels: labels.map(formatarDataHoraRam),
        datasets
    };
}


async function puxarGraficoRam() {

    const resposta = await fetch(`${S3_API_ENDPOINT}`, { cache: 'no-cache' });

    if (!resposta.ok) {
        throw new Error('Erro ao acessar o bucket: ' + resposta.statusText);
    }


    const dadosCompletos = await resposta.json();
    const historico = mesclarHistoricoRam(dadosCompletos.historico);

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

    const dadosGrafico = montarDadosGraficoRam(historico);

    if (!graficoRamHistorico) {
        graficoRamHistorico = new Chart(canvas, {
            type: 'line',
            data: {
                labels: dadosGrafico.labels,
                datasets: dadosGrafico.datasets
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
        return;
    }

    graficoRamHistorico.data.labels = dadosGrafico.labels;
    graficoRamHistorico.data.datasets = dadosGrafico.datasets;
    graficoRamHistorico.update();
}

setInterval(atualizarDados, 60000);

async function atualizarDados() {
    if (atualizandoDadosRam) {
        return;
    }

    atualizandoDadosRam = true;

    try {
        const resultados = await Promise.allSettled([
            puxarDadosKpis(),
            puxarDadosRanking(),
            puxarGraficoRam()
        ]);

        resultados.forEach(resultado => {
            if (resultado.status === 'rejected') {
                console.error('Erro ao atualizar dashboard RAM:', resultado.reason);
            }
        });
    } finally {
        atualizandoDadosRam = false;
    }
}

atualizarDados();

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