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


function cadastrarComponente(nomeComponente, tipoComponente, unidadeMedida, capacidadeMaxima){
    var instrucaoSql = `INSERT INTO componente (nomeComponente, tipoComponente, unidadeMedida, capacidadeMaxima) 
    VALUES ('${nomeComponente}','${tipoComponente}','${unidadeMedida}', '${capacidadeMaxima}')`
    return database.executar(instrucaoSql); 
}

function buscarIdEstabelecimento(razaoSocial) {
    var instrucaoSql = `SELECT idEstabelecimento FROM estabelecimento WHERE razaoSocialEstabelecimento = '${razaoSocial}'`
    return database.executar(instrucaoSql);
}

function cadastrarEstabelecimento(razaoSocial, tipoEstabelecimento, cep, numeroEstabelecimento) {
    var instrucaoSql = `INSERT INTO estabelecimento (razaoSocialEstabelecimento, tipoEstabelecimento, cep, numeroEstabelecimento) 
    VALUES ('${razaoSocial}', '${tipoEstabelecimento}', '${cep}', '${numeroEstabelecimento}')`
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
    cadastrarEmpresa,
    autenticar,
    cadastrarFuncionario,
    validarTokenFabricante,
    atualizarSenha,
    cadastrarMaquina,
    cadastrarComponente,
    buscarIdEstabelecimento,
    cadastrarEstabelecimento,
    buscarIdsComponente,
    cadastrarComponenteMaquina
};
