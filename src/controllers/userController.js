const usuarioModel = require("../models/userModel")

async function autenticar(req, res){
    const {email, senha} = req.body

    if (email == undefined){
        res.status(400).send("Seu email está undefined")
    } else if (senha == undefined){
        res.status(400).send("Sua senha está incorreta")
    } else {


        const resultado = await usuarioModel.autenticar(email, senha)

        if (resultado.length){
            console.log (usuario)

            res.json (resultado)
        } else {
            res.status(403).send ("Email e/ou senha inválido(s)")
        }
    }

}

module.exports = {
    autenticar
}