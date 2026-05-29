const financeiroModel = require("../models/financeiroModel");

async function cadastrarFinanceiro(req, res) {

    const {
        valorMedio,
        examesHora,
        metaSla,
        custoCorretiva,
        macAddress
    } = req.body;

    if (
        !valorMedio ||
        !examesHora ||
        !metaSla ||
        !custoCorretiva ||
        !macAddress
    ) {
        return res.status(400).json({
            mensagem: "Todos os campos são obrigatórios."
        });
    }

    try {

        await financeiroModel.salvarFinanceiro(
            Number(valorMedio),
            Number(examesHora),
            Number(metaSla),
            Number(custoCorretiva),
            macAddress
        );

        res.status(200).json({
            mensagem: "Dados financeiros cadastrados com sucesso!"
        });

    } catch (erro) {

        console.log(erro);

        res.status(500).json({
            mensagem: "Erro ao cadastrar dados financeiros."
        });
    }
}

module.exports = {
    cadastrarFinanceiro
};