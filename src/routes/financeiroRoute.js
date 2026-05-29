const express = require("express");
const routes = express.Router();
const financeiroController = require("../controllers/financeiroController");

routes.post("/cadastrar", financeiroController.cadastrarFinanceiro);

module.exports = routes;