const dashModel = require("../models/dashModel")

async function pegarDashboard(req, res) {

    var idUsuario = req.params.idUsuario;

    dashModel.pegarDashboard(idUsuario)
        .then(
            function (resultado) {
                console.log("Dashboard pego com sucesso!");
                res.json(resultado);
            }
        ).catch(
            function (erro) {
                console.log(erro);
                res.status(500).json(erro.sqlMessage);
            }
        );

}

module.exports = {
    pegarDashboard
}