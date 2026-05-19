const S3_API_ENDPOINT = "/client";
const REFRESH_INTERVAL_MS = 60_000;

async function exibirMRI(registro) {
    var maquinas = registro;
    maquinas.forEach(elemento => {
        document.getElementById("cards").innerHTML += `
          <div class="divAuxiliar">
            <dialog id="dialog_graf1" class="dialog-graf">
                <div class="dialog-content">
                    <div class="dialogGraf-header">
                        <div class="dialogUso">
                            <h2 id="macAddress">7a:be:81:6b:3a:fc</h2>
                            <img class="closeDialog" type="button" src="../assets/imgs/x-lg.svg" alt=""
                                onclick="document.getElementById('dialog_graf1').close()">
                        </div>
                        <div class="dialogUso">
                            <div class="bodyImg bodyImgVerde">
                                <p id="indice_saude">Saúde: 99.5 / 100</p>
                            </div>
                            <p class="dialogUso-texto">Atualizado a 10 min atrás</p>
                            <div class="bodyImg bodyImgAzul">
                                <p>Stand By</p>
                            </div>
                        </div>
                    </div>
                    <hr>
                    <div class="dialog-tituloComponente">
                        <p class="tituloComponente">CPU</p>
                        <div class="status statusVerde">
                            <p id="statusComponente">Estável</p>
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
                                    <p id="usoAtual" class="client">undefined</p>
                                </div>
                                <div class="dialogComponentes-corpo">
                                    <p>Limite Crítico:</p>&nbsp
                                    <p id="limiteCritico" class="client">undefined</p>
                                </div>
                                <div class="dialogComponentes-corpo">
                                    <p>Oscilação:</p>&nbsp
                                    <p id="oscilacao" class="client">undefined</p>
                                </div>
                            </div>
                        </div>
                        <div class="graficoPadrao">
                            <p class="textoChart">Regressão Linear de CPU por horário</p>
                            <div class="divCanvas">
                                <canvas id="graf1Cpu"></canvas>
                            </div>
                            <div class="informacoes">
                                <div class="dialogComponentes-corpo">
                                    <p>Últimas 2 horas:</p>&nbsp
                                    <p id="ultimas2h" class="client">undefined</p>
                                </div>
                                <div class="dialogComponentes-corpo">
                                    <p>Horário de previsão de criticidade:</p>&nbsp
                                    <p id="criticidade" class="client">undefined</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <p><a href="">Clique para descobrir a possível causa</a></p>
                    <hr>
                    <div class="dialog-tituloComponente">
                        <p class="tituloComponente">RAM</p>
                        <div class="status statusVerde">
                            <p id="statusComponente">Estável</p>
                        </div>
                    </div>
                    <div class="graficos">
                        <div class="graficoPadrao">
                            <p class="textoChart">Relação da porcentagem de uso da RAM por horário</p>
                            <div class="divCanvas">
                                <canvas id="graf1Cpu"></canvas>
                            </div>
                            <div class="informacoes">
                                <div class="dialogComponentes-corpo">
                                    <p>Uso Atual:</p>&nbsp
                                    <p id="usoAtual" class="client">undefined</p>
                                </div>
                                <div class="dialogComponentes-corpo">
                                    <p>Limite Crítico:</p>&nbsp
                                    <p id="limiteCritico" class="client">undefined</p>
                                </div>
                                <div class="dialogComponentes-corpo">
                                    <p>Oscilação:</p>&nbsp
                                    <p id="oscilacao" class="client">undefined</p>
                                </div>
                            </div>
                        </div>
                        <div class="graficoPadrao">
                            <p class="textoChart">Regressão Linear de RAM por horário</p>
                            <div class="divCanvas">
                                <canvas id="graf1Cpu"></canvas>
                            </div>
                            <div class="informacoes">
                                <div class="dialogComponentes-corpo">
                                    <p>Últimas 2 horas:</p>&nbsp
                                    <p id="ultimas2h" class="client">undefined</p>
                                </div>
                                <div class="dialogComponentes-corpo">
                                    <p>Horário de previsão de criticidade:</p>&nbsp
                                    <p id="criticidade" class="client">undefined</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <p><a href="">Clique para descobrir a possível causa</a></p>
                </div>
            </dialog>
            <div class="col">
                <div class="card cardMaquina"
                    onclick="document.getElementById('dialog_graf1').showModal(), criarGrafico1()">
                    <div class="card-body bodyMaquina">
                        <div class="bodyMaquina-header">
                            <p class="macAddressCard">7a:be:81:6b:3a:fc</p>
                            <div class="bodyImg bodyImgVerde">
                                <p id="indice_saude">Saúde: 99.5 / 100</p>
                            </div>                    
                        </div>
                        <div class="localizacao">
                                    <img src="../assets/imgs/loc.svg" alt="">
                                    <p class="endereco">Hospital Albert Einstein - Alphaville</p>
                                </div>
                        <div class="bodyMaquina-body">
                            <p>Atualizado as 14:00</p>
                            <hr>
                            <div class="componentes">
                                <div class="componentes-titulo">
                                    <div class="componentes-tituloBarra">
                                        <img src="../assets/imgs/cpu.svg" alt="">&nbsp &nbsp
                                        <h9>CPU</p>
                                    </div>
                                    <p id="cpuPorc">59%</p>
                                    <div class="status statusVerde">
                                        <p id="statusComponente">Estável</p>
                                    </div>
                                </div>
                                <div>
                                    <div class="componentes-corpo">
                                        <p>Oscilação:</p>&nbsp
                                        <p id="oscilacao" class="client">undefined</p>
                                    </div>
                                    <div class="componentes-corpo">
                                        <p>Últimas 2 horas:</p>&nbsp
                                        <p id="ultimas2h" class="client">undefined</p>
                                    </div>
                                    <div class="componentes-corpo">
                                        <p>Previsão criticidade:</p>&nbsp
                                        <p id="criticidade" class="client">undefined</p>
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
                                    <p id="cpuPorc">59%</p>
                                    <div class="status statusVerde">
                                        <p id="statusComponente">Estável</p>
                                    </div>
                                </div>
                                <div>
                                    <div class="componentes-corpo">
                                        <p>Oscilação:</p>&nbsp
                                        <p id="oscilacao" class="client">undefined</p>
                                    </div>
                                    <div class="componentes-corpo">
                                        <p>Últimas 2 horas:</p>&nbsp
                                        <p id="ultimas2h" class="client">undefined</p>
                                    </div>
                                    <div class="componentes-corpo">
                                        <p>Previsão criticidade:</p>&nbsp
                                        <p id="criticidade" class="client">undefined</p>
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
        `
    });
}

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

async function iniciar() {
    const dados = await carregarDados();
    exibirMRI(dados);
}

iniciar()