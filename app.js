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

const PORT = process.env.dev || 3333;

app.listen(PORT, () => {
    console.log(`api is runing in port 3333

    Acesse o caminho a seguir para visualizar .: http://${HOST_APP}:${PORTA_APP} :. \n\n`)
})


