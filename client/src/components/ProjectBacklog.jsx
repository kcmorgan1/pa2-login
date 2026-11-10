import { useState, useEffect } from "react";

export default function ProjectBacklog({ projectId }) {
    const [stories, setStories] = useState([]);
    const [members, setMembers] = useState([]);
    const [editingStoryId, setEditingStoryId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        priority: "Medium",
        status: "To Do",
        assigned_user_id: ""
    });
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (!projectId) return;

        setStories([]);
        setShowForm(false);
        setEditingStoryId(null);
        setMessage("");
        resetForm();

        fetchStories();
        fetchMembers();
    }, [projectId]);

    const fetchStories = async () => {
        try {
            const res = await fetch(`http://localhost:5001/projects/${projectId}/stories`);
            if (res.ok) {
                const data = await res.json();
                setStories(data);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchMembers = async () => {
        try {
            const res = await fetch(`http://localhost:5001/projects/${projectId}/members`);
            if (res.ok) {
                const data = await res.json();
                setMembers(data);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const resetForm = () => {
        setFormData({ title: "", description: "", priority: "Medium", status: "To Do", assigned_user_id: "" });
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");

        const url = editingStoryId 
            ? `http://localhost:5001/stories/${editingStoryId}`
            : `http://localhost:5001/projects/${projectId}/stories`;
        
        const method = editingStoryId ? "PUT" : "POST";

        const payload = {
            ...formData,
            assigned_user_id: formData.assigned_user_id || null
        };

        try {
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            
            const data = await res.json();
            
            if (res.ok) {
                setMessage(editingStoryId ? "Story updated!" : "Story created!");
                setShowForm(false);
                setEditingStoryId(null);
                resetForm();
                fetchStories();
            } else {
                setMessage(`Error: ${data.error}`);
            }
        } catch (error) {
            setMessage("Server connection failed.");
        }
    };

    const handleEdit = (story) => {
        setFormData({
            title: story.title,
            description: story.description,
            priority: story.priority,
            status: story.status,
            assigned_user_id: story.assigned_user_id?._id || ""
        });
        setEditingStoryId(story._id);
        setShowForm(true);
    };

    const handleDelete = async (storyId) => {
        if (!window.confirm("Are you sure you want to delete this user story?")) {
            return;
        }

        try {
            const res = await fetch(`http://localhost:5001/stories/${storyId}`, { method: "DELETE" });
            if (res.ok) {
                setMessage("Story deleted.");
                fetchStories();
            } else {
                const data = await res.json();
                setMessage(`Error: ${data.error}`);
            }
        } catch (error) {
            setMessage("Server connection failed.");
        }
    };

    if (!projectId) return <p>Select a project to view its backlog.</p>;

    return (
        <div style={{ marginTop: "20px", borderTop: "1px solid #ccc", paddingTop: "20px" }}>
            <h3>Project Backlog</h3>
            {message && <p style={{ color: "blue" }}>{message}</p>}
            
            <button onClick={() => { setShowForm(!showForm); setEditingStoryId(null); resetForm(); }}>
                {showForm ? "Cancel" : "Add New User Story"}
            </button>

            {showForm && (
                <form onSubmit={handleSubmit} style={{ marginTop: "15px", display: "flex", flexDirection: "column", gap: "10px", maxWidth: "400px" }}>
                    <input name="title" placeholder="Story Title" value={formData.title} onChange={handleInputChange} required />
                    <textarea name="description" placeholder="As a [user], I want [goal], so that [benefit]" value={formData.description} onChange={handleInputChange} required rows="3" />
                    
                    <select name="priority" value={formData.priority} onChange={handleInputChange} required>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                    </select>

                    <select name="status" value={formData.status} onChange={handleInputChange} required>
                        <option value="To Do">To Do</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Done">Done</option>
                    </select>

                    <select name="assigned_user_id" value={formData.assigned_user_id} onChange={handleInputChange}>
                        <option value="">Unassigned</option>
                        {members.map(member => (
                            <option key={member.user_id} value={member.user_id}>
                                {member.username} ({member.f_name} {member.l_name})
                            </option>
                        ))}
                    </select>

                    <button type="submit">{editingStoryId ? "Update Story" : "Save Story"}</button>
                </form>
            )}

            <div style={{ marginTop: "20px" }}>
                {stories.length === 0 ? (
                    <p>This project has no stories.</p>
                ) : (
                    stories.map(story => (
                        <div key={story._id} style={{ border: "1px solid #ddd", padding: "10px", marginBottom: "10px", borderRadius: "5px" }}>
                            <h4>{story.title}</h4>
                            <p><strong>Description:</strong> {story.description}</p>
                            <p><strong>Priority:</strong> {story.priority} | <strong>Status:</strong> {story.status}</p>
                            <p><strong>Assigned To:</strong> {story.assigned_user_id ? story.assigned_user_id.username : "Unassigned"}</p>
                            
                            <button onClick={() => handleEdit(story)} style={{ marginRight: "10px" }}>Edit</button>
                            <button onClick={() => handleDelete(story._id)}>Delete</button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}