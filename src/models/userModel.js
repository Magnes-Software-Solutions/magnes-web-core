const database = require('../database/config.js')

function autenticar(email, senha) {

    const instrucaoSql = `
    SELECT idFuncionario, nome, email, fkFabricante from funcionario WHERE email = '${email}' AND senha = '${senha}'
    `;

    return database.executar(instrucaoSql)

}

function cadastrarEmpresa(nomeFabricante, cnpj, email, tel_corporativo, token) {
    var instrucaoSql = `INSERT INTO fabricante (nomeFabricante, cnpj, email, tel_corporativo, token, dt_cadastro) 
    VALUES ('${nomeFabricante}', '${cnpj}', '${email}', '${tel_corporativo}', '${token}', NOW())`
    return database.executar(instrucaoSql);
}

function cadastrarFuncionario(nome, email, senha, fkFabricante, cargo) {
    const instrucaoSql = `INSERT INTO funcionario (nome, email, senha, fkFabricante, cargo, dt_cadastro) 
    VALUES ('${nome}', '${email}', '${senha}', '${fkFabricante}', '${cargo}', NOW())`
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
