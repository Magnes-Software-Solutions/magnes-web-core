const express = require("express")
const user = require("../models/userModel.js")

const routes = express.Router()

routes.post("/create", async (req, res) => {
    const { name } = req.body
    await user.createUser(name)
    res.send("User created")
})

module.exports = routes