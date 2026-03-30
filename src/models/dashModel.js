const database = require('../database/config.js')

function pegarDashboard() {
    var instrucaoSql = `SELECT tipo, uni_med FROM componente`
    return database.executar(instrucaoSql);
}

module.exports = {
    pegarDashboard
}