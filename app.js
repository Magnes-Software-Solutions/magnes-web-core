require("dotenv").config({path: "./.env.example"});
console.log("env teste: ", process.env.DB_USER);
const express = require("express");
const cors = require("cors");
const path = require("path");

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
    console.log(`api is runing in port 3333`)
})


