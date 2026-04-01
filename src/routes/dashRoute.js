const express = require("express")
const dash = require("../controllers/dashController")

const routes = express.Router()


routes.get("/PegarDashboard/:idUsuario", async (req, res) => {
    await dash.pegarDashboard(req, res)
})


module.exports = routes