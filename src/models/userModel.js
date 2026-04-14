const database = require('../database/config.js')

function autenticar(email, senha) {

    const instrucaoSql = `
    SELECT idUsuario, nome, email, fkSupervisor, fkHospital from usuario WHERE email = '${email}' AND senha = '${senha}'
    `;
    return database.executar(instrucaoSql)

}

function cadastrarEmpresa(nomeFabricante, cnpj, email, tel_corporativo, token) {
    var instrucaoSql = `INSERT INTO fabricante (nomeFabricante, cnpj, email, tel_corporativo, token, dt_cadastro) 
    VALUES ('${nomeFabricante}', '${cnpj}', '${email}', '${tel_corporativo}', '${token}', NOW())`
    return database.executar(instrucaoSql);
}

function cadastrarFuncionario(nome, email, cpf, telefone, senha, sessionFK_HOSPITAL, sessionId) {
    const instrucaoSql = `INSERT INTO usuario (nome, email, cpf, telefone, senha, fkHospital, fkSupervisor) 
    VALUES ('${nome}', '${email}', '${cpf}', '${telefone}', '${senha}', '${sessionFK_HOSPITAL}', '${sessionId}');`
    return database.executar(instrucaoSql);
}

function validarTokenFabricante(token) {
    var instrucaoSql = `SELECT idFabricante FROM fabricante WHERE token = '${token}'`
    return database.executar(instrucaoSql)
}

function atualizarSenha(novaSenha, sessionId) {
    var instrucaoSql = `UPDATE usuario SET senha = '${novaSenha}' WHERE idUsuario = ${sessionId}`
    return database.executar(instrucaoSql);
}

function cadastrarMaquina(macAddress, numSerie, tipoModelo, sessionFK_HOSPITAL, sessionEstabelecimento) {
    var instrucaoSql = `INSERT INTO maquina (macAddress, numeroSerie, tipoModelo, fkHospital, fkEstabelecimento) 
    VALUES ('${macAddress}', '${numSerie}', '${tipoModelo}', '${sessionFK_HOSPITAL}', '${sessionEstabelecimento}')`
    return database.executar(instrucaoSql);
}

function cadastrarComponente(nomeComponente, tipo) {
    var instrucaoSql = `INSERT INTO componente (nomeComponente, tipoComponente) 
    VALUES ('${nomeComponente}', '${tipo}')`
    return database.executar(instrucaoSql); 
}

function buscarIdEstabelecimento(sessionFK_HOSPITAL) {
    var instrucaoSql = `SELECT idEstabelecimento FROM estabelecimento WHERE idEstabelecimento = ${sessionFK_HOSPITAL}`
    return database.executar(instrucaoSql);
}


module.exports = {
    cadastrarEmpresa,
    autenticar,
    cadastrarFuncionario,
    validarTokenFabricante,
    atualizarSenha,
    cadastrarMaquina,
    cadastrarComponente,
    buscarIdEstabelecimento
};
