const maquinaModel = require("../models/maquinaModel")

async function adicionarMaquina(req, res) {
    const { num_serie, modelo, fkFabricante, fkLocalizacao } = req.body
    await maquinaModel.adicionarMaquina(num_serie, modelo, fkFabricante, fkLocalizacao)
    res.json("Maquina cadastrada!")
}

module.exports = {
    adicionarMaquina
}