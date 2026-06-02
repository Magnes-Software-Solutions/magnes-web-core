const maquinaModel = require("../models/maquinaModel")

async function adicionarMaquina(req, res) {
    const { num_serie, modelo, fkFabricante, fkLocalizacao } = req.body
    await maquinaModel.adicionarMaquina(num_serie, modelo, fkFabricante, fkLocalizacao)
    res.json("Maquina cadastrada!")
}

async function listarPorRede(req, res) {
    const fkRedeHospital = req.params.fkRedeHospital;

    try {
        const resultado = await maquinaModel.listarPorRede(fkRedeHospital);
        res.json(resultado);

    } catch (erro) {
        console.log(erro);
        res.status(500).json({
            erro: erro.message
        });
    }
}

module.exports = {
    adicionarMaquina, listarPorRede
}