const database = require('../database/config.js')

function autenticar(email, senha) {

    const instrucaoSql = `
    SELECT idFuncionario, nome, email from funcionario WHERE email = '${email}' AND senha = '${senha}'
    `;

    return database.executar(instrucaoSql)

}

function cadastrarEmpresa(nomeFabricante, cnpj, email, tel_corporativo, token) {
    var instrucaoSql = `INSERT INTO fabricante (nomeFabricante, cnpj, email, tel_corporativo, token, dt_cadastro) 
    VALUES ('${nomeFabricante}', '${cnpj}', '${email}', '${tel_corporativo}', '${token}', NOW())`
    return database.executar(instrucaoSql);
}

function cadastrarFuncionario(nome, email, token, senha) {
    const instrucaoSql = `INSERT INTO funcionario (nome, email, token, senha) 
    VALUES ('${nome}', '${email}', '${token}', '${senha}')`
    return database.executar(instrucaoSql);
}

module.exports = {
    cadastrarEmpresa,
    autenticar,
    cadastrarFuncionario
};
