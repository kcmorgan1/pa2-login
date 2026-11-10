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
let userStories;

async function connectDatabase() {
    try {
        await client.connect();
        const db = client.db("pa2");
        users = db.collection("users");
        projects = db.collection("projects");
        projectMemberships = db.collection("projectMemberships");
        userStories = db.collection("UserStories");
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

        const assignedStories = await userStories.find({
            project_id: projectId,
            assigned_user_id: userId
        }).toArray();

        if (assignedStories.length > 0) {
            return res.status(400).json({ 
                error: "Cannot remove member. Stories must first be reassigned, unassigned, or deleted." 
            });
        }

        await projectMemberships.deleteOne({ project_id: projectId, user_id: userId });
        res.status(200).json({ message: "Member removed" });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

app.post("/projects/:projectId/stories", async (req, res) => {
    try {
        const { title, description, priority, assigned_user_id } = req.body;
        const projectId = new ObjectId(req.params.projectId);

        if (!title || !description || !priority) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        let assignedUserIdObj = null;
        if (assigned_user_id) {
            assignedUserIdObj = new ObjectId(assigned_user_id);
            const membership = await projectMemberships.findOne({
                project_id: projectId,
                user_id: assignedUserIdObj
            });
            if (!membership) {
                return res.status(400).json({ error: "Assigned user is not a project member" });
            }
        }

        const newStory = {
            project_id: projectId,
            title,
            description,
            priority,
            status: "To Do",
            assigned_user_id: assignedUserIdObj
        };

        const result = await userStories.insertOne(newStory);
        res.status(201).json({ _id: result.insertedId, ...newStory });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/projects/:projectId/stories", async (req, res) => {
    try {
        const projectId = new ObjectId(req.params.projectId);
        const stories = await userStories.find({ project_id: projectId }).toArray();

        for (let story of stories) {
            if (story.assigned_user_id) {
                const user = await users.findOne(
                    { _id: story.assigned_user_id },
                    { projection: { username: 1, f_name: 1, l_name: 1 } }
                );
                story.assigned_user_id = user;
            }
        }
        res.status(200).json(stories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put("/stories/:storyId", async (req, res) => {
    try {
        const storyId = new ObjectId(req.params.storyId);
        const { title, description, priority, status, assigned_user_id } = req.body;

        const existingStory = await userStories.findOne({ _id: storyId });
        if (!existingStory) {
            return res.status(404).json({ error: "Story not found" });
        }

        let assignedUserIdObj = null;
        if (assigned_user_id) {
            assignedUserIdObj = new ObjectId(assigned_user_id);
            const membership = await projectMemberships.findOne({
                project_id: existingStory.project_id,
                user_id: assignedUserIdObj
            });
            if (!membership) {
                return res.status(400).json({ error: "Assigned user is not a project member" });
            }
        }

        const updateDoc = {
            $set: {
                title: title || existingStory.title,
                description: description || existingStory.description,
                priority: priority || existingStory.priority,
                status: status || existingStory.status,
                assigned_user_id: assigned_user_id ? assignedUserIdObj : null
            }
        };

        await userStories.updateOne({ _id: storyId }, updateDoc);
        res.status(200).json({ message: "Story updated" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete("/stories/:storyId", async (req, res) => {
    try {
        const storyId = new ObjectId(req.params.storyId);
        await userStories.deleteOne({ _id: storyId });
        res.status(200).json({ message: "Story deleted" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(5001, () => {
    console.log("Server running on port 5001");
});