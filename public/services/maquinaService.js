async function adicionarMaquinaService(num_serie, modelo, fkFabricante){
    const body = { num_serie, modelo, fkFabricante, fkLocalizacao: 1 }
    const response = await api.post ("/maquina/adicionar-maquina", body)
    const json = await response.json()
    return json
} 
