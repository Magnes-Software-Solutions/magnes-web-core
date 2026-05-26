const express = require("express")
const routes = express.Router()

const finaceiroController = require("../controllers/finaceiroController")

routes.get("/", finaceiroController.teste)

module.exports = routes
