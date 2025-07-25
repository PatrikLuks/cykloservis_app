import { useState } from "react";
import API from "../api";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const res = await API.post("/auth/login", { email, password });
      setMessage("Přihlášení úspěšné.");
      if (onLogin) onLogin(res.data.token);
    } catch (err) {
      setMessage(err.response?.data?.message || "Chyba při přihlášení.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: "2rem auto", display: "flex", flexDirection: "column", gap: 16 }}>
      <h2>Přihlášení</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Heslo"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
      />
      <button type="submit" disabled={loading}>{loading ? "Přihlašuji..." : "Přihlásit"}</button>
      {message && <div style={{ color: message.includes("úspěšné") ? "green" : "red" }}>{message}</div>}
    </form>
  );
}
