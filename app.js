console.log("ANTES DO DOTENV");

require('dotenv').config({ path: __dirname + '/.env.example' });

console.log("DEPOIS DO DOTENV");
console.log("USER DB:", process.env.DB_USER);

const fetch = require("node-fetch");
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");

var PORTA_APP = process.env.APP_PORT;
var HOST_APP = process.env.APP_HOST;

const app = express();

const userRoutes = require("./src/routes/userRoute");
const maquinaRoutes = require("./src/routes/maquinaRoute");
const dashRoutes = require("./src/routes/dashRoute");
const financeiroRoutes = require("./src/routes/financeiroRoute");

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

app.use("/user", userRoutes);
app.use("/maquina", maquinaRoutes);
app.use("/dash", dashRoutes);
app.use("/financeiro", financeiroRoutes);

// S3 Client
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        sessionToken: process.env.AWS_SESSION_TOKEN
    }
});

// Rota que lê o JSON do S3 e retorna os dados
app.get("/client", async (req, res) => {
    try {
        const response = await s3Client.send(new GetObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: "client/dadosPerfeitos.json"
        }));

        const streamToString = (stream) => new Promise((resolve, reject) => {
            const chunks = [];
            stream.on('data', (chunk) => chunks.push(chunk));
            stream.on('error', reject);
            stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
        });

        const data = await streamToString(response.Body);
        res.json(JSON.parse(data));

    } catch (err) {
        console.error("Erro ao ler S3:", err.name, err.message);

        // Fallback: lê o JSON local se o S3 falhar
        try {
            const data = fs.readFileSync(path.join(__dirname, "dadosPerfeitos.json"), "utf8");
            const json = JSON.parse(data);
            res.json(json.maquinas);
        } catch (localErr) {
            console.error("Erro ao ler arquivo local:", localErr.message);
            res.status(500).json({ error: "Falha ao carregar dados", details: err.message });
        }
    }
});

// Funções auxiliares Jira
function jiraAuthHeader() {
    const email = process.env.JIRA_EMAIL;
    const token = process.env.JIRA_API_TOKEN;
    return "Basic " + Buffer.from(`${email}:${token}`).toString("base64");
}

function tempoDesde(data) {
    const diffMs = Date.now() - new Date(data).getTime();
    if (!Number.isFinite(diffMs) || diffMs < 0) return "agora";

    const minutos = Math.floor(diffMs / 60000);
    if (minutos < 60) return `${Math.max(minutos, 1)}m`;

    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `${horas}h`;

    const dias = Math.floor(horas / 24);
    return `${dias}d`;
}

function severidadeJira(issue) {
    const statusCategory = issue.fields?.status?.statusCategory?.key;
    if (statusCategory === "done") return "Resolvido";

    const priority = (issue.fields?.priority?.name || "").toLowerCase();
    if (["highest", "high", "critical", "blocker", "crítica", "critico", "crítico"].includes(priority)) {
        return "Crítico";
    }

    return "Atenção";
}

function montarTicketJira(issue) {
    return {
        id: issue.key,
        descricao: issue.fields?.summary || "Sem descrição",
        severidade: severidadeJira(issue),
        tempo: tempoDesde(issue.fields?.created),
        status: issue.fields?.status?.name || "Sem status"
    };
}

// Rota Jira — tickets formatados
app.get("/jira/tickets", async (req, res) => {
    try {
        const baseUrl = process.env.JIRA_BASE_URL;
        const projectKey = process.env.JIRA_PROJECT_KEY || "KM";
        const jql = process.env.JIRA_JQL || `project = ${projectKey} AND status in ("TO DO", "IN PROGRESS", "DONE") ORDER BY updated DESC`;

        const url = new URL("/rest/api/3/search/jql", baseUrl);
        url.searchParams.set("jql", jql);
        url.searchParams.set("maxResults", String(Number(process.env.JIRA_MAX_RESULTS || 100)));
        url.searchParams.set("fields", "summary,status,priority,created,updated");

        const response = await fetch(url.toString(), {
            headers: {
                "Authorization": jiraAuthHeader(),
                "Accept": "application/json"
            }
        });

        if (!response.ok) {
            const details = await response.text();
            throw new Error(`Jira HTTP ${response.status}: ${details}`);
        }

        const data = await response.json();
        const ticketsPorId = new Map();

        for (const issue of data.issues || []) {
            if (!issue?.key || ticketsPorId.has(issue.key)) continue;
            ticketsPorId.set(issue.key, montarTicketJira(issue));
        }

        res.json(Array.from(ticketsPorId.values()));

    } catch (err) {
        console.error("Erro ao ler Jira:", err.message);
        res.status(500).json({ error: "Falha ao carregar tickets do Jira", details: err.message });
    }
});

function jiraAuthHeader() {
    const email = process.env.JIRA_EMAIL;
    const token = process.env.JIRA_API_TOKEN;

}

function tempoDesde(data) {
    const diffMs = Date.now() - new Date(data).getTime();
    if (!Number.isFinite(diffMs) || diffMs < 0) return "agora";

    const minutos = Math.floor(diffMs / 60000);
    if (minutos < 60) return `${Math.max(minutos, 1)}m`;

    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `${horas}h`;

    const dias = Math.floor(horas / 24);
    return `${dias}d`;
}

function severidadeJira(issue) {
    const statusCategory = issue.fields?.status?.statusCategory?.key;
    if (statusCategory === "done") return "Resolvido";

    const priority = (issue.fields?.priority?.name || "").toLowerCase();
    if (["highest", "high", "critical", "blocker", "crítica", "critico", "crítico"].includes(priority)) {
        return "Crítico";
    }

    return "Atenção";
}

function montarTicketJira(issue) {
    const status = issue.fields?.status?.name || "Sem status";

    return {
        id: issue.key,
        descricao: issue.fields?.summary || "Sem descrição",
        severidade: severidadeJira(issue),
        tempo: tempoDesde(issue.fields?.created),
        status
    };
}

app.get("/jira/tickets", async (req, res) => {
    try {
        const baseUrl = process.env.JIRA_BASE_URL;
        const projectKey = process.env.JIRA_PROJECT_KEY || "KM";
        const jql = process.env.JIRA_JQL || `project = ${projectKey} AND status in ("TO DO", "IN PROGRESS", "DONE") ORDER BY updated DESC`;

        const url = new URL("/rest/api/3/search/jql", baseUrl);
        url.searchParams.set("jql", jql);
        url.searchParams.set("maxResults", String(Number(process.env.JIRA_MAX_RESULTS || 100)));
        url.searchParams.set("fields", "summary,status,priority,created,updated");

        const response = await fetch(url.toString(), {
            headers: {
                "Authorization": jiraAuthHeader(),
                "Accept": "application/json"
            }
        });

        if (!response.ok) {
            const details = await response.text();
            throw new Error(`Jira HTTP ${response.status}: ${details}`);
        }

        const data = await response.json();
        const ticketsPorId = new Map();

        for (const issue of data.issues || []) {
            if (!issue?.key || ticketsPorId.has(issue.key)) continue;
            ticketsPorId.set(issue.key, montarTicketJira(issue));
        }

        res.json(Array.from(ticketsPorId.values()));
    } catch (mistake) {
        console.error("Erro ao ler Jira:", mistake.message);
        res.status(500).json({
            error: "Falha ao carregar tickets do Jira",
            details: mistake.message
        });
    }
});

const PORT = process.env.dev || 3333;

app.listen(PORT, () => {
    console.log(`api is runing in port 3333\n\n    Acesse o caminho a seguir para visualizar .: http://${HOST_APP}:${PORTA_APP} :. \n\n`);
});