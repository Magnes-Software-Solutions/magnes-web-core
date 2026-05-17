console.log("ANTES DO DOTENV");

require('dotenv').config({ path: __dirname + '/.env.example' });

console.log("DEPOIS DO DOTENV");
console.log("USER DB:", process.env.DB_USER);
const express = require("express");
const cors = require("cors");
const path = require("path");
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

const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");

const s3Client = new S3Client({ 
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        sessionToken: process.env.AWS_SESSION_TOKEN
    }
});

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
        res.status(500).json({ 
            error: "Falha ao carregar dados!! Vassoura", 
            details: err.message 
        });
    }
});

const PORT = process.env.dev || 3333;

app.listen(PORT, () => {
    console.log(`api is runing in port 3333

    Acesse o caminho a seguir para visualizar .: http://${HOST_APP}:${PORTA_APP} :. \n\n`)
})
