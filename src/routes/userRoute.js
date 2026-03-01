const express = require("express")
const user = require("../controllers/userController")

const routes = express.Router()

routes.post("/autenticar", async (req, res) => {
    await user.autenticar(req, res)
})

routes.post("/cadastrarEmpresa", async (req, res) => {
    const { name } = req.body
    await user.cadastrarEmpresa(name)
    res.send("User created")
})

module.exports = routes