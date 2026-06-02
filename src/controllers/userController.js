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
                        fkRedeHospital: resultadoAutenticar[0].fkRedeHospital
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

async function cadastrarFuncionario(req, res) {

    const { nome, email, cpf, telefone, senha, sessionFK_REDE_HOSPITAL, sessionId } = req.body

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
        usuarioModel.cadastrarFuncionario(nome, email, cpf, telefone, senha, sessionFK_REDE_HOSPITAL, sessionId)
            .then(
                function (resultado) {
                    console.log("Funcionário cadastrado com sucesso!");
                    res.json(resultado);
                    // res.status(200).json("Requisição feita");
                }
            ).catch(
                function (erro) {
                    console.log(erro);
                    console.log(erro.sqlMessage)
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
    const { macAddress, numSerie, tipoModelo, sessionFK_REDE_HOSPITAL, sessionEnderecoHospital } = req.body

    if (numSerie == undefined) {
        res.status(400).json("numSerie está undefined!");
    } else if (tipoModelo == undefined) {
        res.status(400).json("tipoModelo está undefined!");
    } else {
        usuarioModel.cadastrarMaquina(macAddress, numSerie, tipoModelo, sessionFK_REDE_HOSPITAL, sessionEnderecoHospital)
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
    const { nomeComponente, tipoComponente, unidadeMedida, capacidadeMaxima } = req.body
    if (nomeComponente == undefined) {
        res.status(400).json("nomeComponente está undefined!");
    } 
    else if (tipoComponente == undefined) {
        res.status(400).json("tipoComponente está undefined!");
    }
    else if (unidadeMedida == undefined) {
        res.status(400).json("unidadeMedida está undefined!");
    }
    else if (capacidadeMaxima == undefined) {
        res.status(400).json("capacidadeMaxima está undefined!");
    }
    else {
        usuarioModel.cadastrarComponente(nomeComponente, tipoComponente, unidadeMedida, capacidadeMaxima)
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

async function buscarIdEnderecoHospital(req, res) {
    const { cep, numeroHospital } = req.body

    if (cep == undefined) {
        res.status(400).json("cep está undefined!");
    } else if (numeroHospital == undefined) {
        res.status(400).json("numeroHospital está undefined!");
    } else {
        usuarioModel.buscarIdEnderecoHospital(cep, numeroHospital)
            .then(
                function (resultado) {
                    console.log("ID do endereço do hospital encontrado com sucesso!");
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

async function cadastrarEnderecoHospital(req, res) {
    const { bairro, cidade, cep, numeroHospital } = req.body

    if (bairro == undefined) {
        res.status(400).json("bairro está undefined!");
    } else if (cidade == undefined) {
        res.status(400).json("cidade está undefined!");
    } else if (cep == undefined) {
        res.status(400).json("cep está undefined!");
    } else if (numeroHospital == undefined) {
        res.status(400).json("numeroHospital está undefined!");
    } else {
        usuarioModel.cadastrarEnderecoHospital(bairro, cidade, cep, numeroHospital)
            .then(
                function (resultado) {
                    console.log("Endereço do hospital cadastrado com sucesso!");
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
async function buscarIdsComponente(req, res) {
     usuarioModel.buscarIdsComponente()
            .then(
                function (resultado) {
                    console.log("IDs dos componentes encontrados com sucesso!");
                    res.json(resultado);
                }
            ).catch(
                function (erro) {
                    console.log(erro);
                    res.status(500).json(erro.sqlMessage);
                }
            );
}
async function cadastrarComponenteMaquina(req, res) {
    const { macAddress, idComponente, limite } = req.body

    if (macAddress == undefined) {
        res.status(400).json("macAddress está undefined!");
    } else if (idComponente == undefined) {
        res.status(400).json("idComponente está undefined!");
    } else if (limite == undefined) {
        res.status(400).json("limite está undefined!");
    } else {
        usuarioModel.cadastrarComponenteMaquina(macAddress, idComponente, limite)
            .then(
                function (resultado) {
                    console.log("Componente vinculado à máquina com sucesso!");
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
    cadastrarFuncionario,
    atualizarSenha,
    cadastrarMaquina,
    cadastrarComponente,
    buscarIdEnderecoHospital,
    cadastrarEnderecoHospital,
    buscarIdsComponente,
    cadastrarComponenteMaquina
}
