import { useState, useEffect } from "react";

export default function ProjectList() {
    const [projects, setProjects] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch("http://localhost:5001/projects")
            .then(res => res.json())
            .then(data => setProjects(data))
            .catch(err => {
                console.error(err);
                // Sets an error message to display to the user if the fetch fails
                setError("Failed to load projects. Please try again.");
            });
    }, []);

    return (
        <div style={{ maxWidth: "600px", margin: "20px auto" }}>
            <h2>All Projects</h2>
            
            {/* Renders the error feedback if one exists */}
            {error && <p style={{ color: "red", fontWeight: "bold" }}>{error}</p>}
            
            {projects.length === 0 && !error ? <p>No projects yet.</p> : null}
            
            {projects.map(p => (
                <div key={p._id} style={{ border: "1px solid #ccc", padding: "10px", marginBottom: "10px" }}>
                    <h3>{p.name}</h3>
                    <p>{p.description}</p>
                    <p><strong>Status:</strong> {p.status}</p>
                    
                    {/* Safely attempts to render the populated username, falling back to the ID if it isn't populated yet */}
                    <p><strong>Project Lead:</strong> {p.project_lead_id?.username || p.project_lead_id}</p>
                </div>
            ))}
        </div>
    );
}
