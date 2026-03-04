const express = require("express")
const maquina = require("../controllers/maquinaController")

const routes = express.Router()

routes.post("/adicionar-maquina", async (req, res) => {
    await maquina.adicionarMaquina(req, res)
})


module.exports = routes