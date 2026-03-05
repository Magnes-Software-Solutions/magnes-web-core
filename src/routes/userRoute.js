const express = require("express")
const user = require("../controllers/userControllers")

const routes = express.Router()

routes.post("/autenticar", async (req, res) => {
    const { email, senha } = req.body
    await user.autenticar(req, res)
})

routes.post("/cadastrarEmpresa", async (req, res) => {
    await user.cadastrarEmpresa(req, res)
})


module.exports = routes