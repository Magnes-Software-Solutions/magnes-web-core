const db = require("../database/config")

async function adicionarMaquina(num_serie, modelo, fkFabricante, fkLocalizacao) {
    const instrucaoSql = `INSERT INTO maquina (numero_serie, modelo, fkFabricante, fkLocalizacao, dt_instalacao) VALUES
    ('${num_serie}', '${modelo}', '${fkFabricante}', '${fkLocalizacao}', NOW())`
    
    await db.executar(instrucaoSql)
}

module.exports = {
    adicionarMaquina
}