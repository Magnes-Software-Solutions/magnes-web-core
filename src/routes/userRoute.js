const express = require("express")
const user = require("../controllers/userController")

const routes = express.Router()

routes.post("/autenticar", async (req, res) => {
    const { email, senha } = req.body
    await user.autenticar(req, res)
})

module.exports = routes