const database = require('../database/config.js')

function autenticar(email, senha) {

    const instrucaoSql = `
    SELECT idUsuario, nome, email, fkSupervisor, fkFabricante from usuario WHERE email = '${email}' AND senha = '${senha}'
    `;
    return database.executar(instrucaoSql)

}

function cadastrarEmpresa(nomeFabricante, cnpj, email, tel_corporativo, token) {
    var instrucaoSql = `INSERT INTO fabricante (nomeFabricante, cnpj, email, tel_corporativo, token, dt_cadastro) 
    VALUES ('${nomeFabricante}', '${cnpj}', '${email}', '${tel_corporativo}', '${token}', NOW())`
    return database.executar(instrucaoSql);
}



function cadastrarFuncionario(nome, email, cpf, telefone, senha, sessionFK_FABRICANTE, sessionId) {
    const instrucaoSql = `INSERT INTO usuario (nome, email, cpf, telefone, senha, fkFabricante, fkSupervisor) 
    VALUES ('${nome}', '${email}', '${cpf}', '${telefone}', '${senha}', '${sessionFK_FABRICANTE}', '${sessionId}');`
    return database.executar(instrucaoSql);
}

function validarTokenFabricante(token) {
    var instrucaoSql = `SELECT idFabricante FROM fabricante WHERE token = '${token}'`
    return database.executar(instrucaoSql)
}

module.exports = {
    cadastrarEmpresa,
    autenticar,
    cadastrarFuncionario,
    validarTokenFabricante
};
