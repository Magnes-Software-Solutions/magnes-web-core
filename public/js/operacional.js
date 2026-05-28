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

function classificarCor(cardAtual, componente, variavel, valor) {
    let itens = [];
    let itensStatus = [];
    let cor = "";
    let corStatus = "";

    if (variavel == "indice_saude") {
        itensStatus = cardAtual.querySelectorAll(`.${variavel}`)
        valor = valor.split("/")[0]

        if (valor > 75) {
            corStatus = "statusVerde";

        } else if (valor > 50) {
            corStatus = "statusAmarelo";

        } else if (valor <= 50) {
            corStatus = "statusVermelho";

        } else {
            corStatus = "statusAzul"
        }

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

        if (valor == "Baixa (abaixo que 1σ)") {
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

    } else if (variavel == "previsao100") {
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

function chamarCor(cardAtual, elemento) {
    var componentes = ["cpu", "ram", "disco"];
    var variaveis = ["indice_saude", "status", "oscilacao", "degradacao", "previsao100"];

    for (let componente of componentes) {
        for (let variavel of variaveis) {
            let valor

            if (variavel == "indice_saude") {
                valor = elemento.indiceSaude;

            } else if (variavel == "previsao100") {
                valor = elemento[componente].previsao.previsao100;

            } else {
                valor = elemento[componente][variavel];
            }

            classificarCor(cardAtual, componente, variavel, valor);
        }
    }
}

async function exibirMRI(registro) {
    var maquinas = registro.maquinas;
    maquinas.forEach(maquina => {
        var hora = maquina.horario.split(" ")
        hora = hora[1].slice(0, 5);

        previsaoCpu = maquina.cpu.previsao.previsao100.split(":").slice(0, 2).join(":");
        previsaoRam = maquina.ram.previsao.previsao100.split(":").slice(0, 2).join(":");
        previsaoDisco = maquina.disco.previsao.previsao100.split(":").slice(0, 2).join(":");

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
                                <p class="dialogUso-texto">Última atualização às ${hora}</p>
                                <div class="bodyImg bodyImgAzul">
                                    <p>Em Uso</p>
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
                                <p class="textoChart">Relação da porcentagem de uso da CPU por horário</p>
                                <div class="divCanvas">
                                    <canvas id="grafUsoCpu_${maquina.macAddress}"></canvas>
                                </div>
                                <div class="informacoes">
                                    <div class="dialogComponentes-corpo">
                                        <p>Uso Atual:</p>&nbsp
                                        <p class="uso_cpu client">${maquina.cpu.uso}% (${maquina.cpu.status})</p>
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
                                <p class="textoChart">Regressão Linear de CPU por horário</p>
                                <div class="divCanvas">
                                    <canvas id="grafRegCpu_${maquina.macAddress}"></canvas>
                                </div>
                                <div class="informacoes">
                                    <div class="dialogComponentes-corpo">
                                        <p>Últimas 2 horas:</p>&nbsp
                                        <p class="ultimas2h_cpu client">${maquina.cpu.degradacao}</p>
                                    </div>
                                    <div class="dialogComponentes-corpo">
                                        <p>Horário de previsão de criticidade:</p>&nbsp
                                        <p class="criticidade_cpu client">${previsaoCpu}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <p><a href="dashGestor.html" onclick="pegarMac('${maquina.macAddress}')">Clique para descobrir a possível causa</a></p>
                        <hr>
                        <div class="dialog-tituloComponente">
                            <p class="tituloComponente">RAM</p>
                            <div class="status_ram status">
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
                                <p class="textoChart">Regressão Linear de RAM por horário</p>
                                <div class="divCanvas">
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
                        <p><a href="">Clique para descobrir a possível causa</a></p>
                        <hr>
                        <div class="dialog-tituloComponente">
                            <p class="tituloComponente">Disco</p>
                            <div class="status_disco status">
                                <p id="statusComponente_disco">${maquina.disco.status}</p>
                            </div>
                        </div>
                        <div class="graficos">
                            <div class="graficoPadrao">
                                <p class="textoChart">Relação da porcentagem de uso da Disco por horário</p>
                                <div class="divCanvas">
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
                                <p class="textoChart">Regressão Linear de Disco por horário</p>
                                <div class="divCanvas">
                                    <canvas id="grafRegDisco_${maquina.macAddress}"></canvas>
                                </div>
                                <div class="informacoes">
                                    <div class="dialogComponentes-corpo">
                                        <p>Últimas 2 horas:</p>&nbsp
                                        <p class="ultimas2h_disco client">${maquina.disco.degradacao}</p>
                                    </div>
                                    <div class="dialogComponentes-corpo">
                                        <p>Horário de previsão de criticidade:</p>&nbsp
                                        <p class="criticidade_disco client">${maquina.disco.previsao.previsao100}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </dialog>
                <div class="col">
                    <div class="card cardMaquina"
                        onclick="document.getElementById('dialogGraf_${maquina.macAddress}').showModal(), criarGrafico1()">
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
                                <p>Última atualização às ${hora}</p>
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
                                            <p class="criticidade_disco client">${maquina.disco.previsao.previsao100}</p>
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

        const cardAtual = cards.lastElementChild;

        chamarCor(cardAtual, maquina)
    });
}

function pegarMac(macAddressAtual) {
    console.log(macAddressAtual)
    sessionStorage.setItem("MAC_ADDRESS_ATUAL", macAddressAtual);
}

async function iniciar() {
    const dados = await carregarDados();
    exibirMRI(dados);
}

iniciar()