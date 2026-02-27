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

            res.json (resultado)
        } else {
            res.status(403).send("Email e/ou senha inválido(s)")
        }
    }

}

function cadastrarEmpresa(req, res) {
    var nomeFabricante = req.body.nomeFabricanteServer;
    var cnpj = req.body.cnpjServer;
    var email = req.body.emailFabricanteServer;
    var tel_celular = req.body.tel_celularServer;
    var tel_corporativo = req.body.tel_corporativoServer;

    if (nomeFabricante == undefined) {
        res.status(400).send("nome está undefined!");
    } else if (cnpj == undefined) {
        res.status(400).send("cnpj está undefined!");
    } else if (email == undefined) {
        res.status(400).send("email está undefined!");
    } else if (tel_corporativo == undefined) {
        res.status(400).send("tel_corporativo está undefined!");
    } else {

        userModel.cadastrarEmpresa(nomeFabricante, cnpj, email, tel_celular, tel_corporativo)
            .then(
                function (resultado) {
                    res.json(resultado);
                }
            ).catch(
                function (erro) {
                    console.log(erro);
                    console.log(
                        "\nHouve um erro ao realizar o cadastro! Erro: ",
                        erro.sqlMessage
                    );
                    res.status(500).json(erro.sqlMessage);
                }
            );

    }

}

module.exports = {
    autenticar,
    cadastrarEmpresa
}