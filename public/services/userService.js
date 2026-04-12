async function loginService(email, senha) {
    const body = {email, senha}
    try {
        const response = await api.post("/user/autenticar", body)
        
        return response
    } catch(err) {
        
        console.log(err);
        return err
    }
}

async function cadastrarEmpresaService(nomeFabricanteVar, cnpjVar, emailEmpresaVar, tel_corporativoVar) {
    const body = {
        nomeFabricanteServer: nomeFabricanteVar,
        cnpjServer: cnpjVar,
        emailFabricanteServer: emailEmpresaVar,
        tel_corporativoServer: tel_corporativoVar
    }
    const response = await api.post("/user/cadastrarEmpresa", body)
    console.log(response);
    return response
}

async function cadastrarFuncionarioService(nome, email, cpf, telefone, senha, sessionFK_HOSPITAL, sessionId) {
    const body = {
        nome, email, cpf, telefone, senha, sessionFK_HOSPITAL, sessionId
    }
    const response = await api.post("/user/cadastrarFuncionario", body)
    console.log(response);
    return response
}

async function atualizarSenhaService(novaSenha, sessionId) {
    const body = {
        novaSenha, sessionId
    }
    const response = await api.patch("/user/atualizarSenha", body)
    console.log(response);
    return response
}

async function cadastrarMaquinaService(macAddress, numSerie, tipoModelo, sessionFK_HOSPITAL, sessionEstabelecimento) {
    const body = {
        macAddress, numSerie, tipoModelo, sessionFK_HOSPITAL, sessionEstabelecimento
    }
    const response = await api.post("/user/cadastrarMaquina", body)
    console.log(response);
    return response
}

async function cadastrarComponenteService(nomeComponente, tipo) {
    const body = {
        nomeComponente, tipo
    }
    const response = await api.post("/user/cadastrarComponente", body)
    console.log(response);
    return response
}

async function buscarIdEstabelecimentoService( sessionFK_HOSPITAL) {
    const body = {
        sessionFK_HOSPITAL
    }
    const response = await api.post("/user/buscarIdEstabelecimento", body)
    console.log(response);
    return response
}