require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

const client = new MongoClient(process.env.MONGO_URI);
let users; 
let projects;
let projectMemberships;

async function connectDatabase() {
    try {
        await client.connect();
        const db = client.db("pa2");
        users = db.collection("users");
        projects = db.collection("projects");
        projectMemberships = db.collection("projectMemberships");
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
        res.status(500).json({ message: "Server error" });
    }
});

app.get("/users", async (req, res) => {
    try {
        const allUsers = await users.find({}, { projection: { password: 0 } }).toArray();
        res.status(200).json(allUsers);
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

app.post("/projects", async (req, res) => {
    try {
        const { name, description, status, project_lead_id } = req.body;
        if (!name || !description || !status || !project_lead_id) {
            return res.status(400).json({ error: "All fields are required." });
        }
        const leadId = new ObjectId(project_lead_id);
        const leadExists = await users.findOne({ _id: leadId });
        if (!leadExists) {
            return res.status(404).json({ error: "Project Lead does not exist." });
        }
        const newProject = { name, description, status, project_lead_id: leadId };
        const projectResult = await projects.insertOne(newProject);
        const newMembership = { project_id: projectResult.insertedId, user_id: leadId };
        await projectMemberships.insertOne(newMembership);
        res.status(201).json({ message: "Project created", _id: projectResult.insertedId });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

app.get("/projects", async (req, res) => {
    try {
        const allProjects = await projects.find({}).toArray();
        for (let proj of allProjects) {
            const lead = await users.findOne({ _id: proj.project_lead_id });
            if (lead) {
                proj.project_lead_username = lead.username;
                proj.project_lead_name = `${lead.f_name} ${lead.l_name}`;
            }
        }
        res.status(200).json(allProjects);
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

app.get("/projects/:projectId/members", async (req, res) => {
    try {
        const projectId = new ObjectId(req.params.projectId);
        const memberships = await projectMemberships.find({ project_id: projectId }).toArray();
        for (let member of memberships) {
            const user = await users.findOne({ _id: member.user_id });
            if (user) {
                member.username = user.username;
                member.f_name = user.f_name;
                member.l_name = user.l_name;
            }
        }
        res.status(200).json(memberships);
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

app.post("/projects/:projectId/members", async (req, res) => {
    try {
        const projectId = new ObjectId(req.params.projectId);
        const userId = new ObjectId(req.body.user_id);
        const userExists = await users.findOne({ _id: userId });
        if (!userExists) return res.status(404).json({ error: "User does not exist." });
        const existingMembership = await projectMemberships.findOne({ project_id: projectId, user_id: userId });
        if (existingMembership) return res.status(400).json({ error: "User is already a member." });
        await projectMemberships.insertOne({ project_id: projectId, user_id: userId });
        res.status(201).json({ message: "Member added" });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

app.delete("/projects/:projectId/members/:userId", async (req, res) => {
    try {
        const projectId = new ObjectId(req.params.projectId);
        const userId = new ObjectId(req.params.userId);
        const project = await projects.findOne({ _id: projectId });
        if (!project) return res.status(404).json({ error: "Project not found." });
        if (project.project_lead_id.toString() === userId.toString()) {
            return res.status(403).json({ error: "Cannot remove the Project Lead." });
        }
        await projectMemberships.deleteOne({ project_id: projectId, user_id: userId });
        res.status(200).json({ message: "Member removed" });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

app.listen(5001, () => {
    console.log("Server running on port 5001");
});
