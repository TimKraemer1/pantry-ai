// app.js
const express = require('express');
const cors = require('cors');
const app = express();
const port = 5001;
const indexRouter = require('./routes/index');

app.use(cors())
app.use(express.json()); // To parse JSON bodies
app.use('/', indexRouter);

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

// Handle shutdown gracefully
const { client } = require('./models/db');
process.on('SIGINT', async () => {
    console.log('Closing MongoDB connection...');
    await client.close();
    process.exit(0);
});

