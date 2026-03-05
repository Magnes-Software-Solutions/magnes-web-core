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