import { useState, useEffect } from "react";
import ProjectBacklog from "./ProjectBacklog";

export default function ProjectList() {
    const [projects, setProjects] = useState([]);
    const [error, setError] = useState(null);
    // State to track which project is currently selected
    const [selectedProjectId, setSelectedProjectId] = useState(null);

    useEffect(() => {
        fetch("http://localhost:5001/projects")
            .then(res => res.json())
            .then(data => setProjects(data))
            .catch(err => {
                console.error(err);
                setError("Failed to load projects. Please try again.");
            });
    }, []);

    // Toggle the selected project on or off
    const handleSelectProject = (id) => {
        if (selectedProjectId === id) {
            setSelectedProjectId(null); // close if already open
        } else {
            setSelectedProjectId(id); // open the clicked one
        }
    };

    return (
        <div style={{ maxWidth: "600px", margin: "20px auto" }}>
            <h2>All Projects</h2>
            
            {error && <p style={{ color: "red", fontWeight: "bold" }}>{error}</p>}
            
            {projects.length === 0 && !error ? <p>No projects yet.</p> : null}
            
            {projects.map(p => (
                <div key={p._id} style={{ border: "1px solid #ccc", padding: "10px", marginBottom: "10px" }}>
                    <h3>{p.name}</h3>
                    <p>{p.description}</p>
                    <p><strong>Status:</strong> {p.status}</p>
                    <p><strong>Project Lead:</strong> {p.project_lead_username || p.project_lead_id}</p>
                    
                    {/* Button to show/hide the backlog for this project */}
                    <button 
                        onClick={() => handleSelectProject(p._id)}
                        style={{ marginTop: "10px", marginBottom: "10px" }}
                    >
                        {selectedProjectId === p._id ? "Close Backlog" : "View Backlog"}
                    </button>

                    {/* Renders the backlog component ONLY if this project is the selected one */}
                    {selectedProjectId === p._id && (
                        <ProjectBacklog projectId={selectedProjectId} />
                    )}
                </div>
            ))}
        </div>
    );
}