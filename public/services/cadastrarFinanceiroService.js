async function cadastrarFinanceiroService(
    valorMedio,
    examesHora,
    metaSla,
    custoCorretiva,
    macAddress
) {

    const body = {
        valorMedio,
        examesHora,
        metaSla,
        custoCorretiva,
        macAddress
    };

    const response = await api.post("/financeiro/cadastrar", body);

    const json = await response.json();

    return json;
}