const express = require("express")
const user = require("../controllers/userController")

const routes = express.Router()

routes.post("/autenticar", function (req, res) {
    user.autenticar(req, res);
})

routes.post("/cadastrarEmpresa", async (req, res) => {
    await user.cadastrarEmpresa(req, res)
})

routes.post("/cadastrarFuncionario", async (req, res) => {
    await user.cadastrarFuncionario(req, res)
})

routes.patch("/atualizarSenha", async (req, res) => {
    await user.atualizarSenha(req, res)
})
routes.post("/cadastrarMaquina", async (req, res) => {
    await user.cadastrarMaquina(req, res)
})
routes.post("/cadastrarComponente", async (req, res) => {
    await user.cadastrarComponente(req, res)
})
routes.post("/buscarIdEstabelecimento", async (req, res) => {
    await user.buscarIdEstabelecimento(req, res)
})


module.exports = routes