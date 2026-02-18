import express from "express";
import cors from "cors";

const app = express();

app.use(express.json);
app.use(cors());

const PORT = process.env.dev || 3333;

app.listen(PORT,()=>{
    console.log (`api is runing in port 3333`)
})


