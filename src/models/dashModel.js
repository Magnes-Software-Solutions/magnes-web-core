const database = require('../database/config.js')

function pegarDashboard(idUsuario) {
    var instrucaoSql = `SELECT nome, email, telefone, fkSupervisor FROM usuario WHERE idUsuario = ${idUsuario}`;
    return database.executar(instrucaoSql);
}

module.exports = {
    pegarDashboard
}