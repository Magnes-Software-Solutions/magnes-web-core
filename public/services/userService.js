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

async function cadastrarFuncionarioService(nome, email, cpf, telefone, senha, sessionFK_REDE_HOSPITAL, sessionId) {
    const body = {
        nome, email, cpf, telefone, senha, sessionFK_REDE_HOSPITAL, sessionId
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

async function cadastrarMaquinaService(macAddress, numSerie, tipoModelo, sessionFK_REDE_HOSPITAL, sessionEnderecoHospital) {
    const body = {
        macAddress, numSerie, tipoModelo, sessionFK_REDE_HOSPITAL, sessionEnderecoHospital
    }
    const response = await api.post("/user/cadastrarMaquina", body)
    console.log(response);
    return response
}

async function cadastrarComponenteService(nomeComponente, tipoComponente, unidadeMedida, capacidadeMaxima) {
    const body = {
        nomeComponente, tipoComponente, unidadeMedida, capacidadeMaxima
    }
    const response = await api.post("/user/cadastrarComponente", body)
    console.log(response);
    return response
}

async function cadastrarEnderecoHospitalService(bairro, cidade, cep, numeroHospital) {
    const body = {
        bairro, cidade, cep, numeroHospital
    }
    const response = await api.post("/user/cadastrarEnderecoHospital", body)
    console.log(response);
    return response
}

async function buscarIdEnderecoHospitalService(cep, numeroHospital) {
    const body = {
        cep, numeroHospital
    }
    const response = await api.post("/user/buscarIdEnderecoHospital", body)
    console.log(response);
    return response
}

async function buscarIdsComponenteService() {
    const body = {}
    const response = await api.get("/user/buscarIdsComponente")
    console.log(response);
    return response
}

async function cadastrarComponenteMaquinaService(macAddress, idComponente, limite) {
    const body = {
        macAddress, idComponente, limite
    }
    const response = await api.post("/user/cadastrarComponenteMaquina", body)
    console.log(response);
    return response
}