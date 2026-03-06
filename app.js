const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

const userRoutes = require("./src/routes/userRoute")
const maquinaRoutes = require("./src/routes/maquinaRoute")

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

const userRoute = require("./src/routes/userRoute");
app.use("/user", userRoutes)
app.use("/maquina", maquinaRoutes)

const PORT = process.env.dev || 3333;

app.listen(PORT, () => {
    console.log(`api is runing in port 3333`)
})


