// models/db.js
const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

let db;

async function connectPantryDatabase() {
    if (!db) {
        await client.connect();
        db = client.db('pantrydb');
        console.log('Connected successfully to MongoDB, pantrydb');
    }
    return db;
}


module.exports = { connectPantryDatabase, client };

