const maquinaModel = require("../models/maquinaModel")

async function adicionarMaquina(req, res) {
    const { num_serie, modelo, fkFabricante } = req.body
    await maquinaModel.adicionarMaquina(num_serie, modelo, fkFabricante)
    res.send("Maquina cadastrada!")
}

module.exports = {
    adicionarMaquina
}