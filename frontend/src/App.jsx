
import Register from "./components/Register";
import Login from "./components/Login";
import { useState } from "react";

function App() {
  const [token, setToken] = useState(null);
  const [showLogin, setShowLogin] = useState(true);

  return (
    <div style={{ minHeight: "100vh", background: "#e8f5e9" }}>
      <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 32 }}>
        <button onClick={() => setShowLogin(true)} style={{ background: showLogin ? "#388e3c" : "#a5d6a7", color: "white", border: 0, padding: 8, borderRadius: 4 }}>Přihlášení</button>
        <button onClick={() => setShowLogin(false)} style={{ background: !showLogin ? "#388e3c" : "#a5d6a7", color: "white", border: 0, padding: 8, borderRadius: 4 }}>Registrace</button>
      </div>
      {!token ? (
        showLogin ? <Login onLogin={setToken} /> : <Register />
      ) : (
        <div style={{ textAlign: "center", marginTop: 64 }}>
          <h2>Přihlášení úspěšné!</h2>
          <p>Token: <code style={{ wordBreak: "break-all" }}>{token}</code></p>
          <button onClick={() => setToken(null)} style={{ marginTop: 16 }}>Odhlásit</button>
        </div>
      )}
    </div>
  );
}

export default App;
