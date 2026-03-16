const { MongoClient } = require("mongodb");

const connectionString = process.env.ATLAS_URI || "";
const client = new MongoClient(connectionString);

let db;

async function connectDB() {
    try {
        await client.connect();
        db = client.db("test");
        console.log("Connected to MongoDB");
    } catch (e) {
        console.error("MongoDB connection error:", e);
        process.exit(1);
    }
}

function getDB() {
    if (!db) throw new Error("DB not initialized. Call connectDB first.");
    return db;
}

module.exports = { connectDB, getDB };
