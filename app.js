require("dotenv").config({ path: __dirname + "/.env.example" });

const express = require("express");
const cors = require("cors");
const path = require("path");
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");

const app = express();

const userRoutes = require("./src/routes/userRoute");
const maquinaRoutes = require("./src/routes/maquinaRoute");
const dashRoutes = require("./src/routes/dashRoute");
const financeiroRoutes = require("./src/routes/financeiroRoute");

const s3Client = new S3Client({ 
    region: process.env.AWS_REGION || "us-east-1"
});

const HOST_APP = process.env.APP_HOST || "0.0.0.0";
const PORT = Number(process.env.PORT || 3000);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

app.use("/user", userRoutes);
app.use("/maquina", maquinaRoutes);
app.use("/dash", dashRoutes);
app.use("/financeiro", financeiroRoutes);

function streamToString(stream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        stream.on("data", chunk => chunks.push(chunk));
        stream.on("error", reject);
        stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    });
}

app.get("/client", async (req, res) => {
    try {
        const response = await s3Client.send(new GetObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: "client/dadosPerfeitos.json"
        }));

        const data = await streamToString(response.Body);
        res.json(JSON.parse(data));
    } catch (err) {
        console.error("Erro ao ler S3:", err.name, err.message);
        res.status(500).json({
            error: "Falha ao carregar dados do S3",
            details: err.message
        });
    }
});

function jiraAuthHeader() {
    if (!process.env.JIRA_EMAIL || !process.env.JIRA_API_TOKEN) {
        throw new Error("JIRA_EMAIL e JIRA_API_TOKEN precisam estar configurados");
    }
    return "Basic " + Buffer.from(process.env.JIRA_EMAIL + ":" + process.env.JIRA_API_TOKEN).toString("base64");
}

function tempoDesde(data) {
    const diffMs = Date.now() - new Date(data).getTime();
    if (!Number.isFinite(diffMs) || diffMs < 0) return "agora";
    const minutos = Math.floor(diffMs / 60000);
    if (minutos < 60) return String(Math.max(minutos, 1)) + "m";
    const horas = Math.floor(minutos / 60);
    if (horas < 24) return String(horas) + "h";
    const dias = Math.floor(horas / 24);
    return String(dias) + "d";
}

function severidadeJira(issue) {
    const statusCategory = issue.fields?.status?.statusCategory?.key || "";
    if (statusCategory === "done") return "Resolvido";
    const priority = issue.fields?.priority?.name?.toLowerCase() || "";
    const prioridadesCriticas = ["highest", "high", "critical", "blocker", "critica", "critico", "crítica", "crítico"];
    if (prioridadesCriticas.includes(priority)) return "Critico";
    return "Atencao";
}

function montarTicketJira(issue) {
    return {
        id: issue.key,
        descricao: issue.fields?.summary || "Sem descricao",
        severidade: severidadeJira(issue),
        tempo: tempoDesde(issue.fields?.created || null),
        status: issue.fields?.status?.name || "Sem status"
    };
}

app.get("/jira/tickets", async (req, res) => {
    try {
        const baseUrl = process.env.JIRA_BASE_URL;
        const projectKey = process.env.JIRA_PROJECT_KEY || "KM";
        const jql = process.env.JIRA_JQL || 'project = ' + projectKey + ' AND status in ("TO DO", "IN PROGRESS", "DONE") ORDER BY updated DESC';
        
        if (!baseUrl) throw new Error("JIRA_BASE_URL precisa estar configurado");
        
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
            throw new Error("Jira HTTP " + response.status + ": " + details);
        }
        
        const data = await response.json();
        const tickets = [];
        const ids = [];
        
        for (const issue of data.issues || []) {
            if (!issue?.key || ids.includes(issue.key)) continue;
            ids.push(issue.key);
            tickets.push(montarTicketJira(issue));
        }
        
        res.json(tickets);
    } catch (err) {
        console.error("Erro ao ler Jira:", err.message);
        res.status(500).json({
            error: "Falha ao carregar tickets do Jira",
            details: err.message
        });
    }
});

app.get("/nvd/cves", async (req, res) => {
    try {
        const url = new URL("https://services.nvd.nist.gov/rest/json/cves/2.0");
        if (req.query.resultsPerPage) url.searchParams.set("resultsPerPage", req.query.resultsPerPage);
        if (req.query.keywordSearch) url.searchParams.set("keywordSearch", req.query.keywordSearch);
        if (req.query.pubStartDate) url.searchParams.set("pubStartDate", req.query.pubStartDate);
        if (req.query.pubEndDate) url.searchParams.set("pubEndDate", req.query.pubEndDate);
        
        const headers = { "Accept": "application/json" };
        if (process.env.NVD_API_KEY) headers.apiKey = process.env.NVD_API_KEY;
        
        const response = await fetch(url.toString(), { headers });
        if (!response.ok) throw new Error("NVD HTTP " + response.status);
        
        res.json(await response.json());
    } catch (err) {
        console.error("Erro ao ler NVD:", err.message);
        res.status(500).json({ error: "Falha ao carregar CVEs da NVD", details: err.message });
    }
});

app.listen(PORT, "0.0.0.0", () => {
    console.log("API rodando na porta " + PORT);
    console.log("Acesse: http://0.0.0.0:" + PORT);
});
