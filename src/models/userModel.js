const database = require('../database/config.js')

function autenticar(email, senha) {
    const instrucaoSql = `
    SELECT idUsuario, nome, email, fkSupervisor, fkRedeHospital, supervisorFinanceiro from usuario WHERE email = '${email}' AND senha = '${senha}'
    `;
    return database.executar(instrucaoSql)
}

function cadastrarFuncionario(nome, email, cpf, telefone, senha, sessionFK_REDE_HOSPITAL, sessionId) {
    const instrucaoSql = `INSERT INTO usuario (nome, email, cpf, telefone, senha, fkRedeHospital, fkSupervisor) 
    VALUES ('${nome}', '${email}', '${cpf}', '${telefone}', '${senha}', '${sessionFK_REDE_HOSPITAL}', '${sessionId}');`
    return database.executar(instrucaoSql);
}

function atualizarSenha(novaSenha, sessionId) {
    var instrucaoSql = `UPDATE usuario SET senha = '${novaSenha}' WHERE idUsuario = ${sessionId}`
    return database.executar(instrucaoSql);
}

function cadastrarMaquina(macAddress, numSerie, tipoModelo, sessionREDE_HOSPITAL, sessionEnderecoHospital) {
    var instrucaoSql = `INSERT INTO maquina (macAddress, numeroSerie, tipoModelo, statusAtividade, fkRedeHospital, fkEnderecoHospital) 
    VALUES ('${macAddress}', '${numSerie}', '${tipoModelo}', 'Ativo', '${sessionREDE_HOSPITAL}', '${sessionEnderecoHospital}')`
    return database.executar(instrucaoSql);
}

function cadastrarComponente(nomeComponente, tipoComponente, unidadeMedida, capacidadeMaxima){
    var instrucaoSql = `INSERT INTO componente (nomeComponente, tipoComponente, unidadeMedida, capacidadeMaxima) 
    VALUES ('${nomeComponente}','${tipoComponente}','${unidadeMedida}', '${capacidadeMaxima}')`
    return database.executar(instrucaoSql); 
}

function buscarIdEnderecoHospital(cep, numeroHospital) {
    var instrucaoSql = `SELECT idEnderecoHospital FROM enderecoHospital WHERE cep = '${cep}' AND numeroEstabelecimento = '${numeroHospital}'`
    return database.executar(instrucaoSql);
}

function cadastrarEnderecoHospital(bairro, cidade, cep, numeroHospital) {
    var instrucaoSql = `INSERT INTO enderecoHospital (bairro, cidade, cep, numeroEstabelecimento) 
    VALUES ('${bairro}', '${cidade}', '${cep}', '${numeroHospital}')`
    return database.executar(instrucaoSql);
}
function buscarIdsComponente() {
    var instrucaoSql = `SELECT idComponente FROM componente ORDER BY idComponente DESC LIMIT 3;`
    return database.executar(instrucaoSql);
}
function cadastrarComponenteMaquina(fkMaquina, fkComponente, limite) {
    var instrucaoSql = `INSERT INTO componente_maquina (fkComponente, fkMaquina, limite) 
    VALUES ('${fkComponente}', '${fkMaquina}', '${limite}')`
    return database.executar(instrucaoSql);
}


module.exports = {
    autenticar,
    cadastrarFuncionario,
    atualizarSenha,
    cadastrarMaquina,
    cadastrarComponente,
    buscarIdEnderecoHospital,
    cadastrarEnderecoHospital,
    buscarIdsComponente,
    cadastrarComponenteMaquina
};
