async function pegarDashboardService() {
    const body = {
        tipo, uni_medida
    }
    const response = await api.get("/dash/PegarDashboard")
    console.log(response);
    return response
}