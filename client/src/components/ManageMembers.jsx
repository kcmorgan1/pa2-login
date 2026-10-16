import { useState, useEffect } from "react";

export default function ManageMembers() {
    const [projects, setProjects] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState("");
    const [members, setMembers] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState("");
    const [message, setMessage] = useState("");
    const [leadId, setLeadId] = useState("");

    useEffect(() => {
        fetch("http://localhost:5001/projects")
            .then(res => res.json())
            .then(data => {
                setProjects(data);
                if (data.length > 0) {
                    setSelectedProjectId(data[0]._id);
                    setLeadId(data[0].project_lead_id);
                }
            });
            
        fetch("http://localhost:5001/users")
            .then(res => res.json())
            .then(data => {
                setUsers(data);
                if (data.length > 0) setSelectedUserId(data[0]._id);
            });
    }, []);

    useEffect(() => {
        if (selectedProjectId) {
            fetch(`http://localhost:5001/projects/${selectedProjectId}/members`)
                .then(res => res.json())
                .then(data => setMembers(data));
            
            const proj = projects.find(p => p._id === selectedProjectId);
            if (proj) setLeadId(proj.project_lead_id);
        }
    }, [selectedProjectId, projects]);

    const handleAddMember = async (e) => {
        e.preventDefault();
        setMessage("");
        const res = await fetch(`http://localhost:5001/projects/${selectedProjectId}/members`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: selectedUserId })
        });
        const data = await res.json();
        
        if (res.ok) {
            setMessage("Member added successfully");
            fetch(`http://localhost:5001/projects/${selectedProjectId}/members`)
                .then(r => r.json())
                .then(d => setMembers(d));
        } else {
            setMessage(data.error || "Failed to add member");
        }
    };

    const handleRemove = async (userId) => {
        setMessage("");
        const res = await fetch(`http://localhost:5001/projects/${selectedProjectId}/members/${userId}`, {
            method: "DELETE"
        });
        const data = await res.json();
        
        if (res.ok) {
            setMessage("Member removed successfully");
            setMembers(members.filter(m => m.user_id !== userId));
        } else {
            setMessage(data.error || "Failed to remove member");
        }
    };

    return (
        <div style={{ maxWidth: "600px", margin: "20px auto", padding: "20px", border: "1px solid #ccc" }}>
            <h2>Manage Project Members</h2>
            {message && <p style={{ color: message.includes("success") ? "green" : "red" }}>{message}</p>}
            
            <label style={{ display: "block", marginBottom: "10px" }}>
                Select Project:
                <select value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)} style={{ width: "100%", padding: "5px", marginTop: "5px" }}>
                    {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
            </label>
            
            <form onSubmit={handleAddMember} style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
                <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)} style={{ flex: 1, padding: "5px" }}>
                    {users.map(u => <option key={u._id} value={u._id}>{u.username}</option>)}
                </select>
                <button type="submit" style={{ padding: "5px 15px", cursor: "pointer" }}>Add User</button>
            </form>

            <h3 style={{ marginTop: "20px" }}>Current Members</h3>
            <ul style={{ listStyle: "none", padding: 0 }}>
                {members.map(m => (
                    <li key={m._id} style={{ display: "flex", justifyContent: "space-between", padding: "10px", borderBottom: "1px solid #eee" }}>
                        <span>{m.username} {m.user_id === leadId ? " (Project Lead)" : ""}</span>
                        {m.user_id !== leadId && (
                            <button onClick={() => handleRemove(m.user_id)} style={{ cursor: "pointer", color: "red" }}>Remove</button>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}
