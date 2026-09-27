import { useState } from "react";

function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");

    async function handleSubmit(event) {
        event.preventDefault();
        
        try {
            // Pointing to our new successful port 5001
            const response = await fetch("http://localhost:5001/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                setMessage("Success: " + data.message);
            } else {
                setMessage("Error: " + data.message);
            }
        } catch (error) {
            setMessage("Could not connect to the server.");
        }
    }

    return (
        <div>
            <h2>Log In</h2>
            <form onSubmit={handleSubmit}>
                <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
                <br /><br />
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <br /><br />
                <button type="submit">Log In</button>
            </form>
            {message && <p>{message}</p>}
        </div>
    );
}

export default Login;