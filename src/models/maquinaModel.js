const db = require("../database/config")

async function adicionarMaquina(num_serie, modelo, fkFabricante) {
    const instrucaoSql = `INSERT INTO maquina (numero_serie, modelo, fkFabricante, fkLocalizacao) VALUES
    ("${num_serie}", "${modelo}", ${fkFabricante}, 1)`
    
    await db.executar(instrucaoSql)
}

module.exports = {
    adicionarMaquina
}