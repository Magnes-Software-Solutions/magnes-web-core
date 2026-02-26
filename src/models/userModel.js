// code here

const database = require('../database/config.js')

function autenticar(email, senha){

    const instrucaoSql = `
    SELECT idFuncionario, nome, email from funcionario WHERE email ='${email}' AND senha = '${senha}'
    `; 
       
    return database.executar(instrucaoSql)
    
    }


    module.exports = {
        autenticar
    }