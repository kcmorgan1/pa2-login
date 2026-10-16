import { useState, useEffect } from "react";

export default function CreateProject() {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState("Planning");
    const [projectLeadId, setProjectLeadId] = useState("");
    const [usersList, setUsersList] = useState([]);
    const [message, setMessage] = useState("");

    useEffect(() => {
        fetch("http://localhost:5001/users")
            .then(res => res.json())
            .then(data => {
                setUsersList(data);
                if (data.length > 0) setProjectLeadId(data[0]._id);
            })
            .catch(err => console.error(err));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        const projectData = { name, description, status, project_lead_id: projectLeadId };

        try {
            const response = await fetch("http://localhost:5001/projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(projectData)
            });
            const data = await response.json();
            if (response.ok) {
                setMessage("Project created successfully!");
                setName("");
                setDescription("");
                setStatus("Planning");
            } else {
                setMessage(data.error || "Failed to create project.");
            }
        } catch (error) {
            setMessage("Server error occurred.");
        }
    };

    return (
        <div style={{ maxWidth: "500px", margin: "20px auto", padding: "20px", border: "1px solid #ccc" }}>
            <h2>Create New Project</h2>
            {message && <p style={{ color: message.includes("success") ? "green" : "red" }}>{message}</p>}
            
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <label>
                    Project Name:
                    <input type="text" value={name} onChange={e => setName(e.target.value)} required style={{ width: "100%", padding: "5px" }} />
                </label>
                <label>
                    Description:
                    <textarea value={description} onChange={e => setDescription(e.target.value)} required style={{ width: "100%", padding: "5px", minHeight: "80px" }} />
                </label>
                <label>
                    Status:
                    <select value={status} onChange={e => setStatus(e.target.value)} style={{ width: "100%", padding: "5px" }}>
                        <option value="Planning">Planning</option>
                        <option value="Active">Active</option>
                        <option value="Completed">Completed</option>
                    </select>
                </label>
                <label>
                    Project Lead:
                    <select value={projectLeadId} onChange={e => setProjectLeadId(e.target.value)} required style={{ width: "100%", padding: "5px" }}>
                        {usersList.map(user => (
                            <option key={user._id} value={user._id}>{user.username} ({user.f_name} {user.l_name})</option>
                        ))}
                    </select>
                </label>
                <button type="submit" style={{ padding: "10px", marginTop: "10px", cursor: "pointer" }}>Create Project</button>
            </form>
        </div>
    );
}
