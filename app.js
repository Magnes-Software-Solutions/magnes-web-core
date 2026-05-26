console.log("ANTES DO DOTENV");

require('dotenv').config({ path: __dirname + '/.env.example' });

console.log("DEPOIS DO DOTENV");
console.log("USER DB:", process.env.DB_USER);
const fetch = require("node-fetch");
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

var PORTA_APP = process.env.APP_PORT;
var HOST_APP = process.env.APP_HOST;

const app = express();

const userRoutes = require("./src/routes/userRoute")
const maquinaRoutes = require("./src/routes/maquinaRoute")
const dashRoutes = require("./src/routes/dashRoute")

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

app.use("/user", userRoutes)
app.use("/maquina", maquinaRoutes)
app.use("/dash", dashRoutes)

// Rota que lê o JSON local e retorna o array de máquinas
app.get("/client", (req, res) => {
    try {
        const data = fs.readFileSync(path.join(__dirname, "dadosPerfeitos.json"), "utf8");
        const json = JSON.parse(data);
        // O JSON tem estrutura { maquinas: [...] }, retorna só o array
        res.json(json.maquinas);
    } catch (err) {
        console.error("Erro ao ler arquivo local:", err.message);
        res.status(500).json({ error: "Falha ao carregar dados", details: err.message });
    }
});

app.get("/jira-alertas", async (req, res) => {
    console.log(">>> Rota /jira-alertas chamada");
    const email = process.env.JIRA_EMAIL;
    const token = process.env.JIRA_TOKEN;

    console.log("Email:", email ? "OK" : "UNDEFINED");
    console.log("Token:", token ? "OK" : "UNDEFINED");

    const auth = Buffer.from(`${email}:${token}`).toString("base64");

    try {
        const resposta = await fetch(
            "https://sptech-team-zx1nvla7.atlassian.net/rest/api/3/search/jql?jql=" + encodeURIComponent("project=KAN"),
            {
                method: "GET",
                headers: {
                    "Authorization": "Basic " + auth,
                    "Accept": "application/json"
                }
            }
        );

        console.log("Status Jira:", resposta.status);

        if (!resposta.ok) {
            const erro = await resposta.text();
            console.error("Erro Jira:", erro);
            return res.status(resposta.status).json({ error: erro });
        }

        const dados = await resposta.json();
        res.json(dados);

    } catch (err) {
        console.error("CATCH /jira-alertas:", err.message);
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.dev || 3333;

app.listen(PORT, () => {
    console.log(`api is runing in port 3333

    Acesse o caminho a seguir para visualizar .: http://${HOST_APP}:${PORTA_APP} :. \n\n`)
})