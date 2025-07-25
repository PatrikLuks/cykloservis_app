import { useState } from "react";
import API from "../api";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const res = await API.post("/auth/register", { email, password });
      setMessage(res.data.message || "Registrace proběhla úspěšně.");
    } catch (err) {
      setMessage(err.response?.data?.message || "Chyba při registraci.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: "2rem auto", display: "flex", flexDirection: "column", gap: 16 }}>
      <h2>Registrace</h2>
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
      <button type="submit" disabled={loading}>{loading ? "Registruji..." : "Registrovat"}</button>
      {message && <div style={{ color: message.includes("úspěšně") ? "green" : "red" }}>{message}</div>}
    </form>
  );
}
