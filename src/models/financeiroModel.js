const database = require("../database/config");

function salvarFinanceiro(
    valorMedio,
    examesHora,
    metaSla,
    custoCorretiva,
    macAddress
) {

    const instrucaoSql = `
        UPDATE maquina
        SET
            valorMedioExame = ${valorMedio},
            examesPorHora = ${examesHora},
            metaSLA = ${metaSla},
            custoCorretiva = ${custoCorretiva}
        WHERE macAddress = '${macAddress}';
    `;

    console.log(instrucaoSql);

    return database.executar(instrucaoSql);
}

module.exports = {
    salvarFinanceiro
};