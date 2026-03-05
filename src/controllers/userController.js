const usuarioModel = require("../models/userModel")

async function autenticar(req, res){
    const {email, senha} = req.body

    if (!email){
        res.status(400).json("Seu email está undefined")
    } else if (!senha){
        res.status(400).json("Sua senha está incorreta")
    } else {
        const resultado = await usuarioModel.autenticar(email, senha)

        if (resultado.length){

            res.json (resultado)
        } else {
            res.status(403).json("Email e/ou senha inválido(s)")
        }
    }

}

function cadastrarEmpresa(req, res) {
    var nomeFabricante = req.body.nomeFabricanteServer;
    var cnpj = req.body.cnpjServer;
    var email = req.body.emailFabricanteServer;
    var tel_corporativo = req.body.tel_corporativoServer;

    if (!nomeFabricante) {
        res.status(400).send("nome está undefined!");
    } else if (!cnpj) {
        res.status(400).send("cnpj está undefined!");
    } else if (!email) {
        res.status(400).send("email está undefined!");
    } else if (!tel_corporativo) {
        res.status(400).send("tel_corporativo está undefined!");
    } else {

        usuarioModel.cadastrarEmpresa(nomeFabricante, cnpj, email, tel_corporativo)
            .then(
                function (resultado) {
                    console.log("Empresa cadastrada com sucesso!");
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

function cadastrarFuncionario(req, res) {
    const nome = req.body.nomeServer;
    const email = req.body.emailServer;
    const token = req.body.tokenServer;
    const senha = req.body.senhaServer;

    if (nome == undefined) {
        res.status(400).send("nome está undefined!");
    } else if (email == undefined) {
        res.status(400).send("email está undefined!");
    } else if (token == undefined) {
        res.status(400).send("token está undefined!");
    } else if (senha == undefined) {
        res.status(400).send("senha está undefined!");
    } else {
        usuarioModel.cadastrarFuncionario(nome, email, token, senha)
            .then(
                function (resultado) {
                    console.log("Funcionário cadastrado com sucesso!");
                    res.json(resultado);
                }
            ).catch(
                function (erro) {
                    console.log(erro);
                    res.status(500).json(erro.sqlMessage);
                }
            );
    }
}

module.exports = {
    autenticar,
    cadastrarEmpresa,
    cadastrarFuncionario
}