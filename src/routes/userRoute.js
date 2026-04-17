const express = require("express")
const user = require("../controllers/userController")
const e = require("express")

const routes = express.Router()

routes.use(express.json())
routes.use(express.urlencoded({ extended: true }))

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
routes.post("/buscarIdEnderecoHospital", async (req, res) => {
    await user.buscarIdEnderecoHospital(req, res)
})
routes.post("/cadastrarEnderecoHospital", async (req, res) => {
    await user.cadastrarEnderecoHospital(req, res)
})
routes.get("/buscarIdsComponente", async (req, res) => {
    await user.buscarIdsComponente(req, res)
})
routes.post("/cadastrarComponenteMaquina", async (req, res) => {
    await user.cadastrarComponenteMaquina(req, res)
})



module.exports = routes