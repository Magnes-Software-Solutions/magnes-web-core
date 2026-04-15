const usuarioModel = require("../models/userModel")
    

function autenticar(req, res) {
    var email = req.body.emailServer;
    var senha = req.body.senhaServer;

    if (email == undefined) {
        return res.status(400).send("Seu email está undefined!");
    } else if (senha == undefined) {
        return res.status(400).send("Sua senha está indefinida!");
    }

    usuarioModel.autenticar(email, senha)
        .then(
            function (resultadoAutenticar) {
                console.log(`\nResultados encontrados: ${resultadoAutenticar.length}`);
                console.log(`Resultados: ${JSON.stringify(resultadoAutenticar)}`);

            if (resultadoAutenticar.length == 1) {
                res.json({
                    idUsuario: resultadoAutenticar[0].idUsuario,
                    email: resultadoAutenticar[0].email,
                    nome: resultadoAutenticar[0].nome,
                    fkSupervisor: resultadoAutenticar[0].fkSupervisor,
                    fkHospital: resultadoAutenticar[0].fkHospital
                });
                } else if (resultadoAutenticar.length == 0) {
                    res.status(403).send("Email e/ou senha inválido(s)");
                } else {
                    res.status(403).send("Mais de um usuário com o mesmo login!");
                }
        }
        )
        .catch(function (erro) {
            console.log(erro);
            res.status(500).json(erro.sqlMessage);
        });
}

function cadastrarEmpresa(req, res) {
    var nomeFabricante = req.body.nomeFabricanteServer;
    var cnpj = req.body.cnpjServer;
    var email = req.body.emailFabricanteServer;
    var tel_corporativo = req.body.tel_corporativoServer;

    if (!nomeFabricante) {  
        res.status(400).json("nome está undefined!");
    } else if (!cnpj) {
        res.status(400).json("cnpj está undefined!");
    } else if (!email) {
        res.status(400).json("email está undefined!");
    } else if (!tel_corporativo) {
        res.status(400).json("tel_corporativo está undefined!");
    } else {
        const letras = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J' ];
        let token = "";
    

        for(var i = 0; i < 5; i++){
            const numAleatorio = Math.floor(Math.random() * 9);
            const indiceLetraAleatoria = Math.floor(Math.random() * letras.length);
            const letraAletoria = letras[indiceLetraAleatoria];
            token += letraAletoria + numAleatorio
        }

        usuarioModel.cadastrarEmpresa(nomeFabricante, cnpj, email, tel_corporativo, token)
            .then(
                function (resultado) {
                    console.log("Empresa cadastrada com sucesso!");
                    res.json(token);
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



async function cadastrarFuncionario(req, res) {
   
    const { nome, email, cpf, telefone, senha, sessionFK_HOSPITAL, sessionId } = req.body

    if (nome == undefined) {
        res.status(400).json("nome está undefined!");
    } else if (email == undefined) {
        res.status(400).json("email está undefined!");
    } else if (cpf == undefined) {
        res.status(400).json("cpf está undefined!");
    } else if (telefone == undefined) {
        res.status(400).json("telefone está undefined!");
    } else if (senha == undefined) {
        res.status(400).json("senha está undefined!");
    } else {
         

        // res.status(200).json(fkFabricante)
        usuarioModel.cadastrarFuncionario(nome, email, cpf, telefone, senha, sessionFK_HOSPITAL, sessionId)
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

async function atualizarSenha(req, res) {
    const { novaSenha, sessionId } = req.body

    if (novaSenha == undefined) {
        res.status(400).json("novaSenha está undefined!");
    } else if (sessionId == undefined) {
        res.status(400).json("sessionId está undefined!");
    } else {
        usuarioModel.atualizarSenha(novaSenha, sessionId)
            .then(
                function (resultado) {
                    console.log("Senha atualizada com sucesso!");
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

async function cadastrarMaquina(req, res) {
    const { macAddress, numSerie, tipoModelo, sessionFK_HOSPITAL, sessionEstabelecimento } = req.body

    if (numSerie == undefined) {
        res.status(400).json("numSerie está undefined!");
    } else if (tipoModelo == undefined) {
        res.status(400).json("tipoModelo está undefined!");
    } else {
        usuarioModel.cadastrarMaquina(macAddress, numSerie, tipoModelo, sessionFK_HOSPITAL, sessionEstabelecimento)
            .then(
                function (resultado) {
                    console.log("Máquina cadastrada com sucesso!");
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

async function cadastrarComponente(req, res) {
    const {nomeComponente, tipo } = req.body

    if (nomeComponente == undefined) {
        res.status(400).json("nomeComponente está undefined!");
    } else if (tipo == undefined) {
        res.status(400).json("tipo está undefined!");
    } else if (maquinaId == undefined) {
        res.status(400).json("maquinaId está undefined!");
    } else {
        usuarioModel.cadastrarMaquinaComponente(nomeComponente, tipo)
            .then(
                function (resultado) {
                    console.log("Componente cadastrado com sucesso!");
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

async function buscarIdEstabelecimento(req, res) {
    const { sessionFK_HOSPITAL } = req.body

    if (sessionFK_HOSPITAL == undefined) {
        res.status(400).json("sessionFK_HOSPITAL está undefined!");
    } else {
        usuarioModel.buscarIdEstabelecimento(sessionFK_HOSPITAL)
            .then(
                function (resultado) {
                    console.log("ID do estabelecimento encontrado com sucesso!");
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
    cadastrarFuncionario,
    atualizarSenha,
    cadastrarMaquina,
    cadastrarComponente,
    buscarIdEstabelecimento
}
