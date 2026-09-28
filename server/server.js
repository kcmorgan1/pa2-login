require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

const client = new MongoClient(process.env.MONGO_URI);
let users; 

async function connectDatabase() {
    try {
        await client.connect();
        console.log("Connected to MongoDB");
        const db = client.db("pa2");
        users = db.collection("users");
    } catch (error) {
        console.error("Could not connect to MongoDB", error);
    }
}
connectDatabase();

app.post("/signup", async (req, res) => {
    try {
        const { f_name, l_name, username, password } = req.body;

        if (!f_name || !l_name || !username || !password) {
            return res.status(400).json({ message: "All fields are required." });
        }

        const existingUser = await users.findOne({ username: username });

        if (existingUser) {
            return res.status(409).json({ message: "Username already exists." });
        }

        await users.insertOne({ f_name, l_name, username, password });
        res.status(201).json({ message: "User created successfully" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

app.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: "Required." });
        }
        
        const user = await users.findOne({ username: username });

        if (user === null || user.password !== password) {
            return res.status(401).json({ message: "Invalid credentials." });
        }

        res.status(200).json({ message: "Login successful!" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

app.listen(5001, () => {
    console.log("Server running on port 5001");
});