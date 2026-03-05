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