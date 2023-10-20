const express = require('express')
const app = express()

app.get('/getVersion', (req, res) => {
    res.json({"version": "0.0.0.0"})
})

app.listen(8123, () => {
    console.log("Server running on 8123")
})