async function adicionarMaiquina(num_serie, modelo, fkFabricante){
    const body = {numero_serie, modelo, fkFabricante} = req.body
    const response = await api.post ("/maquina/adicionar-maquinar")
    const json = await response.json()
    return json
} 
