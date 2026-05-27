// const { commonParams } = require("@aws-sdk/client-s3/dist-types/endpoint/EndpointParameters");

const S3_API_ENDPOINT = "/client";
const REFRESH_INTERVAL_MS = 60_000;

async function carregarDados() {
    try {
        const res = await fetch(S3_API_ENDPOINT, { cache: "no-cache" });
        if (!res.ok) throw new Error("HTTP " + res.status);

        const registro = await res.json();
        console.log("Dados recebidos:", registro);

        return registro

    } catch (err) {
        console.log("[S3] Falha — usando mock:", err);
    }
}

function classificarCor(componente, variavel, valor) {
    if (variavel == "status") {
        var itensStatus = document.querySelectorAll(`#status_${componente}`);
        var itens = document.querySelectorAll(`#uso_${componente}`);

        if (valor == "Estável") {
            var cor = "corVerde";
            var corStatus = "statusVerde";

        } else if (valor == "Anormal") {
            var cor = "corAmarelo";
            var corStatus = "statusAmarelo";

        }else if (valor == "Crítico") {
            var cor = "corVermelho";
            var corStatus = "statusVermelho";

        } else {
            var cor = "corAzul";
            var corStatus = "statusAzul";
        }

    } else if (variavel == "oscilacao") {
        var itens = document.querySelectorAll(`#oscilacao_${componente}`);

        if (valor == "Baixa (abaixo que 1σ)") {
            var cor = "corVerde";

        } else if (valor == "Média (entre 1σ e 2σ)") {
            var cor = "corAmarelo";

        } else if (valor == "Alta  (entre 2σ e 3σ)") {
            var cor = "corLaranja";

        } else if (valor == "Severa (acima de 3σ)") {
            var cor = "corVermelho";

        } else {
            var cor = "corAzul";
        }

    } else if (variavel == "degradacao") {
        var itens = document.querySelectorAll(`#ultimas2h_${componente}`);

        if (valor == "Recuperação") {
            var cor = "corVerde";

        } else if (valor == "Degradação Média") {
            var cor = "corAmarelo";

        }else if (valor == "Degradação Alta") {
            var cor = "corVermelho";

        } else {
            var cor = "corAzul";
        }

    } else if (variavel == "previsao100") {
        var itens = document.querySelectorAll(`#criticidade_${componente}`);

        if (valor == "Sem previsão") {
            var cor = "corAzul";

        } else {
            var cor = "corVermelho";
        }
    }

    if (itensStatus != undefined) {
        itensStatus.forEach(itemStatus => {
        itemStatus.classList.add(corStatus);
        });
    }

    itens.forEach(item => {
        item.classList.add(cor);
    });
}

function chamarCor(elemento) {
    var componentes = ["cpu", "ram"];
    var variaveis = ["status", "oscilacao", "degradacao", "previsao100"];
    // var status = ["Estável", "Anormal", "Crítico", "Baixa (abaixo que 1σ)", "Média (entre 1σ e 2σ)", "Alta  (entre 2σ e 3σ)", ]

    for (let componente of componentes) {
        for (let variavel of variaveis) {
            let valor

            if (variavel == "previsao100") {
                valor = elemento[componente].previsao.previsao100;

            } else {
                valor = elemento[componente][variavel];
            }

            classificarCor(componente, variavel, valor);
        }
    }
}

async function exibirMRI(registro) {
    var maquinas = registro;
    maquinas.forEach(maquina => {
        var hora = maquina.horario.split(" ")
        hora = hora[1].slice(0, 5);

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
                                <div class="bodyImg bodyImgVerde">
                                    <p id="indice_saude">Saúde: ${maquina.indiceSaude}</p>
                                </div>
                                <p class="dialogUso-texto">Última atualização às ${hora}</p>
                                <div class="bodyImg bodyImgAzul">
                                    <p>Em Uso</p>
                                </div>
                            </div>
                        </div>
                        <hr>
                        <div class="dialog-tituloComponente">
                            <p class="tituloComponente">CPU</p>
                            <div id="status_cpu" class="status">
                                <p id="statusComponente_cpu">${maquina.cpu.status}</p>
                            </div>
                        </div>
                        <div class="graficos">
                            <div class="graficoPadrao">
                                <p class="textoChart">Relação da porcentagem de uso da CPU por horário</p>
                                <div class="divCanvas">
                                    <canvas id="grafUsoCpu_${maquina.macAddress}"></canvas>
                                </div>
                                <div class="informacoes">
                                    <div class="dialogComponentes-corpo">
                                        <p>Uso Atual:</p>&nbsp
                                        <p id="uso_cpu" class="client">${maquina.cpu.uso}% (${maquina.cpu.status})</p>
                                    </div>
                                    <div class="dialogComponentes-corpo">
                                        <p>Limite Crítico:</p>&nbsp
                                        <p id="limiteCritico" class="client corAzul">${maquina.cpu.limite}%</p>
                                    </div>
                                    <div class="dialogComponentes-corpo" style="margin-bottom: 0px !important;">
                                        <p>Oscilação:</p>&nbsp
                                        <p id="oscilacao_cpu" class="client">${maquina.cpu.oscilacao}</p>
                                    </div>
                                    <div class="dialogComponentes-corpo">
                                        <p style="font-size: 16px !important;">σ = desvio padão</p>
                                    </div>
                                </div>
                            </div>
                            <div class="graficoPadrao">
                                <p class="textoChart">Regressão Linear de CPU por horário</p>
                                <div class="divCanvas">
                                    <canvas id="grafRegCpu_${maquina.macAddress}"></canvas>
                                </div>
                                <div class="informacoes">
                                    <div class="dialogComponentes-corpo">
                                        <p>Últimas 2 horas:</p>&nbsp
                                        <p id="ultimas2h_cpu" class="client">${maquina.cpu.degradacao}</</p>
                                    </div>
                                    <div class="dialogComponentes-corpo">
                                        <p>Horário de previsão de criticidade:</p>&nbsp
                                        <p id="criticidade_cpu" class="client">${maquina.cpu.previsao.previsao100}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <p><a href="">Clique para descobrir a possível causa</a></p>
                        <hr>
                        <div class="dialog-tituloComponente">
                            <p class="tituloComponente">RAM</p>
                            <div id="status_ram" class="status">
                                <p id="statusComponente_ram">${maquina.ram.status}</p>
                            </div>
                        </div>
                        <div class="graficos">
                            <div class="graficoPadrao">
                                <p class="textoChart">Relação da porcentagem de uso da RAM por horário</p>
                                <div class="divCanvas">
                                    <canvas id="grafUsoRam_${maquina.macAddress}"></canvas>
                                </div>
                                <div class="informacoes">
                                    <div class="dialogComponentes-corpo">
                                        <p>Uso Atual:</p>&nbsp
                                        <p id="uso_ram" class="client">${maquina.ram.uso}% (${maquina.ram.status})</p>
                                    </div>
                                    <div class="dialogComponentes-corpo">
                                        <p>Limite Crítico:</p>&nbsp
                                        <p id="limiteCritico" class="client corAzul">${maquina.ram.limite}%</p>
                                    </div>
                                    <div class="dialogComponentes-corpo" style="margin-bottom: 0px !important;">
                                        <p>Oscilação:</p>&nbsp
                                        <p id="oscilacao_ram" class="client">${maquina.ram.oscilacao}</p>
                                    </div>
                                    <div class="dialogComponentes-corpo">
                                        <p style="font-size: 16px !important;">σ = desvio padão</p>
                                    </div>
                                </div>
                            </div>
                            <div class="graficoPadrao">
                                <p class="textoChart">Regressão Linear de RAM por horário</p>
                                <div class="divCanvas">
                                    <canvas id="grafRegRam_${maquina.macAddress}"></canvas>
                                </div>
                                <div class="informacoes">
                                    <div class="dialogComponentes-corpo">
                                        <p>Últimas 2 horas:</p>&nbsp
                                        <p id="ultimas2h_ram" class="client">${maquina.ram.degradacao}</p>
                                    </div>
                                    <div class="dialogComponentes-corpo">
                                        <p>Horário de previsão de criticidade:</p>&nbsp
                                        <p id="criticidade_ram" class="client">${maquina.ram.previsao.previsao100}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <p><a href="">Clique para descobrir a possível causa</a></p>
                    </div>
                </dialog>
                <div class="col">
                    <div class="card cardMaquina"
                        onclick="document.getElementById('dialogGraf_${maquina.macAddress}').showModal(), criarGrafico1()">
                        <div class="card-body bodyMaquina">
                            <div class="bodyMaquina-header">
                                <p class="macAddressCard">${maquina.macAddress}</p>
                                <div class="bodyImg bodyImgVerde">
                                    <p id="indice_saude">Saúde: ${maquina.indiceSaude}</p>
                                </div>                    
                            </div>
                            <div class="localizacao">
                                        <img src="../assets/imgs/loc.svg" alt="">
                                        <p class="endereco">${maquina.empresa}</p>
                                    </div>
                            <div class="bodyMaquina-body">
                                <p>Última atualização às ${hora}</p>
                                <hr>
                                <div class="componentes">
                                    <div class="componentes-titulo">
                                        <div class="componentes-tituloBarra">
                                            <img src="../assets/imgs/cpu.svg" alt="">&nbsp &nbsp
                                            <h9>CPU</p>
                                        </div>
                                        <p id="uso_cpu">${maquina.cpu.uso}%</p>
                                        <div id="status_cpu" class="status">
                                            <p id="statusComponente_cpu">${maquina.cpu.status}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <div class="componentes-corpo">
                                            <p>Oscilação:</p>&nbsp
                                            <p id="oscilacao_cpu" class="client">${maquina.cpu.oscilacao}</p>
                                        </div>
                                        <div class="componentes-corpo">
                                            <p>Últimas 2 horas:</p>&nbsp
                                            <p id="ultimas2h_cpu" class="client">${maquina.cpu.degradacao}</p>
                                        </div>
                                        <div class="componentes-corpo">
                                            <p>Previsão criticidade:</p>&nbsp
                                            <p id="criticidade_cpu" class="client">${maquina.cpu.previsao.previsao100}</p>
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
                                        <p id="uso_ram">${maquina.ram.uso}%</p>
                                        <div id="status_ram" class="status">
                                            <p id="statusComponente_ram">${maquina.ram.status}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <div class="componentes-corpo">
                                            <p>Oscilação:</p>&nbsp
                                            <p id="oscilacao_ram" class="client">${maquina.ram.oscilacao}</p>
                                        </div>
                                        <div class="componentes-corpo">
                                            <p>Últimas 2 horas:</p>&nbsp
                                            <p id="ultimas2h_ram" class="client">${maquina.ram.degradacao}</p>
                                        </div>
                                        <div class="componentes-corpo">
                                            <p>Previsão criticidade:</p>&nbsp
                                            <p id="criticidade_ram" class="client">${maquina.ram.previsao.previsao100}</p>
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

        chamarCor(maquina)
    });
}

async function iniciar() {
    const dados = await carregarDados();
    exibirMRI(dados);
}

iniciar()