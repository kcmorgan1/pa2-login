import { useState } from "react";
import Login from "./components/Login";
import Signup from "./components/Signup";
import CreateProject from "./components/CreateProject";
import ProjectList from "./components/ProjectList";
import ManageMembers from "./components/ManageMembers";
import "./App.css";

function App() {
    const [view, setView] = useState("login");

    return (
        <div>
            <nav style={{ padding: "20px", backgroundColor: "#f0f0f0", display: "flex", gap: "15px", justifyContent: "center" }}>
                <button onClick={() => setView("login")}>Login</button>
                <button onClick={() => setView("signup")}>Signup</button>
                <button onClick={() => setView("createProject")}>Create Project</button>
                <button onClick={() => setView("projectList")}>View Projects</button>
                <button onClick={() => setView("manageMembers")}>Manage Members</button>
            </nav>

            <div style={{ padding: "20px" }}>
                {view === "login" && <Login />}
                {view === "signup" && <Signup />}
                {view === "createProject" && <CreateProject />}
                {view === "projectList" && <ProjectList />}
                {view === "manageMembers" && <ManageMembers />}
            </div>
        </div>
    );
}

export default App;
