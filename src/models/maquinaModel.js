const db = require("../database/config")

async function adicionarMaquina(num_serie, modelo, fkFabricante, fkLocalizacao) {
    const instrucaoSql = `INSERT INTO maquina (numero_serie, modelo, fkFabricante, fkLocalizacao, dt_instalacao) VALUES
    ('${num_serie}', '${modelo}', '${fkFabricante}', '${fkLocalizacao}', NOW())`

    await db.executar(instrucaoSql)
}

function listarPorRede(fkRedeHospital) {
    const instrucaoSql = `
        SELECT 
            macAddress,
            numeroSerie,
            tipoModelo
        FROM maquina
        WHERE fkRedeHospital = ${fkRedeHospital};
    `;

    console.log(instrucaoSql);

    return db.executar(instrucaoSql);
}

module.exports = {
    adicionarMaquina, listarPorRede
}