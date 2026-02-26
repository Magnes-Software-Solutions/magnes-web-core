var database = require("../database/config")

function cadastrarEmpresar(nomeFabricante, cnpj, email, tel_celular, tel_corporativo) {
    var instrucaoSql = `INSERT INTO fabricante (nomeFabricante, cnpj, email, tel_celular, tel_corporativo) 
    VALUES ('${nomeFabricante}', '${cnpj}', '${email}', '${tel_celular}', '${tel_corporativo}')`
    return database.executar(instrucaoSql);
}

module.exports = {
    cadastrarEmpresa
};