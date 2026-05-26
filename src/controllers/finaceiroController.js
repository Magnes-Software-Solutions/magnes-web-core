const financeiroModel = require("../models/financeiroModel")

function teste(req, res){
    res.json({
        "mesage": "rota funcionando"
    })
}

module.exports = {
    teste
};