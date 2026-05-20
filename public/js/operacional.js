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
        if (valor == "Estável") {
            var itens = document.querySelectorAll(`#statusComponente${componente}`);
            var cor = ".corVerde"

        } else {
            var itens = document.querySelectorAll(`#statusComponente${componente}`);
            var cor = ".corVermelho"
        }

    } else {

    }

    itens.forEach(item => {
        item.classList.add(cor);
    });
}

async function exibirMRI(registro) {
    var maquinas = registro;
    maquinas.forEach(maquina => {
        var hora = maquina.horario.split(" ")
        hora = hora[1]

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
                            <div id="statusCpu" class="status statusVerde">
                                <p id="statusComponenteCpu">${maquina.cpu.status}</p>
                            </div>
                        </div>
                        <div class="graficos">
                            <div class="graficoPadrao">
                                <p class="textoChart">Relação da porcentagem de uso da CPU por horário</p>
                                <div class="divCanvas">
                                    <canvas id="graf1Cpu"></canvas>
                                </div>
                                <div class="informacoes">
                                    <div class="dialogComponentes-corpo">
                                        <p>Uso Atual:</p>&nbsp
                                        <p id="cpuPorc" class="client">${maquina.cpu.uso}% (${maquina.cpu.status})</p>
                                    </div>
                                    <div class="dialogComponentes-corpo">
                                        <p>Limite Crítico:</p>&nbsp
                                        <p id="limiteCritico" class="client">${maquina.cpu.limite}%</p>
                                    </div>
                                    <div class="dialogComponentes-corpo">
                                        <p>Oscilação:</p>&nbsp
                                        <p id="oscilacaoCpu" class="client">${maquina.cpu.oscilacao}</p>
                                    </div>
                                </div>
                            </div>
                            <div class="graficoPadrao">
                                <p class="textoChart">Regressão Linear de CPU por horário</p>
                                <div class="divCanvas">
                                    <canvas id="graf2Cpu"></canvas>
                                </div>
                                <div class="informacoes">
                                    <div class="dialogComponentes-corpo">
                                        <p>Últimas 2 horas:</p>&nbsp
                                        <p id="ultimas2hCpu" class="client">${maquina.cpu.degradacao}</</p>
                                    </div>
                                    <div class="dialogComponentes-corpo">
                                        <p>Horário de previsão de criticidade:</p>&nbsp
                                        <p id="criticidadeCpu" class="client">${maquina.cpu.previsao.previsao100}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <p><a href="">Clique para descobrir a possível causa</a></p>
                        <hr>
                        <div class="dialog-tituloComponente">
                            <p class="tituloComponente">RAM</p>
                            <div id="statusRam" class="status statusVerde">
                                <p id="statusComponenteRam">${maquina.ram.status}</p>
                            </div>
                        </div>
                        <div class="graficos">
                            <div class="graficoPadrao">
                                <p class="textoChart">Relação da porcentagem de uso da RAM por horário</p>
                                <div class="divCanvas">
                                    <canvas id="graf1Ram"></canvas>
                                </div>
                                <div class="informacoes">
                                    <div class="dialogComponentes-corpo">
                                        <p>Uso Atual:</p>&nbsp
                                        <p id="ramPorc" class="client">${maquina.ram.uso}% (${maquina.ram.status})</p>
                                    </div>
                                    <div class="dialogComponentes-corpo">
                                        <p>Limite Crítico:</p>&nbsp
                                        <p id="limiteCritico" class="client">${maquina.ram.limite}%</p>
                                    </div>
                                    <div class="dialogComponentes-corpo">
                                        <p>Oscilação:</p>&nbsp
                                        <p id="oscilacaoRam" class="client">${maquina.ram.oscilacao}</p>
                                    </div>
                                </div>
                            </div>
                            <div class="graficoPadrao">
                                <p class="textoChart">Regressão Linear de RAM por horário</p>
                                <div class="divCanvas">
                                    <canvas id="graf2Ram"></canvas>
                                </div>
                                <div class="informacoes">
                                    <div class="dialogComponentes-corpo">
                                        <p>Últimas 2 horas:</p>&nbsp
                                        <p id="ultimas2hRam" class="client">${maquina.ram.degradacao}</p>
                                    </div>
                                    <div class="dialogComponentes-corpo">
                                        <p>Horário de previsão de criticidade:</p>&nbsp
                                        <p id="criticidadeRam" class="client">${maquina.ram.previsao.previsao100}</p>
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
                                        <p id="cpuPorc">${maquina.cpu.uso}%</p>
                                        <div id="statusCpu" class="status statusVerde">
                                            <p id="statusComponenteCpu">${maquina.cpu.status}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <div class="componentes-corpo">
                                            <p>Oscilação:</p>&nbsp
                                            <p id="oscilacaoCpu" class="client">${maquina.cpu.oscilacao}</p>
                                        </div>
                                        <div class="componentes-corpo">
                                            <p>Últimas 2 horas:</p>&nbsp
                                            <p id="ultimas2hCpu" class="client">${maquina.cpu.degradacao}</p>
                                        </div>
                                        <div class="componentes-corpo">
                                            <p>Previsão criticidade:</p>&nbsp
                                            <p id="criticidadeCpu" class="client">${maquina.cpu.previsao.previsao100}</p>
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
                                        <p id="ramPorc">${maquina.ram.uso}%</p>
                                        <div id="statusRam" class="status statusVerde">
                                            <p id="statusComponenteRam">${maquina.ram.status}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <div class="componentes-corpo">
                                            <p>Oscilação:</p>&nbsp
                                            <p id="oscilacaoRam" class="client">${maquina.ram.oscilacao}</p>
                                        </div>
                                        <div class="componentes-corpo">
                                            <p>Últimas 2 horas:</p>&nbsp
                                            <p id="ultimas2hRam" class="client">${maquina.ram.degradacao}</p>
                                        </div>
                                        <div class="componentes-corpo">
                                            <p>Previsão criticidade:</p>&nbsp
                                            <p id="criticidadeRam" class="client">${maquina.ram.previsao.previsao100}</p>
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

        classificarCor("Cpu", "status", maquina.status)
    });
}

async function iniciar() {
    const dados = await carregarDados();
    exibirMRI(dados);
}

iniciar()