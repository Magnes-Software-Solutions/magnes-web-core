// code here

const database = require('../database/config.js')

function autenticar(email, senha){

    const instrucaoSql = `
    SELECT id_Funcionario, nome, email from funcionario WHERE email ='${email}' AND senha = '${senha}'
    `;    
    return database.executar(instrucaoSql)
    
    }


    module.export = {
        autenticar
    }