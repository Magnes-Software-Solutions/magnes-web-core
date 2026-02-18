const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(express.json());
app.use(cors());


const PORT = process.env.dev || 3333;

app.listen(PORT,()=>{
    console.log (`api is runing in port 3333`)
})


