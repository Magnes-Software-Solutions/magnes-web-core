async function loginService(email, senha) {
    const body = {email, senha}
    const response = await api.post("/user/autenticar", body)

    console.log(response)
    return response
}

