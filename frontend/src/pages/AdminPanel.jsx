import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/apiClient';

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [changing, setChanging] = useState(null);
  const [filter, setFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login?redirect=/dashboard?tab=admin');
      return;
    }
    (async () => {
      try {
        const { data } = await api.get('/admin/users');
        setUsers(data);
      } catch (e) {
        // not admin or error
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  async function changeRole(id, role) {
    setChanging(id + role);
    try {
      const { data } = await api.post(`/admin/users/${id}/role`, { role });
      setUsers((u) => u.map((x) => (x._id === id ? { ...x, role: data.role } : x)));
    } catch (e) {
      alert('Změna role selhala');
    } finally {
      setChanging(null);
    }
  }

  if (loading) return <div>Načítám…</div>;

  const filtered = users.filter((u) => {
    const matchText = !filter || u.email.toLowerCase().includes(filter.toLowerCase());
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchText && matchRole;
  });

  return (
    <div>
      <h2>Admin - Uživatelé</h2>
      <div style={{ display: 'flex', gap: 12, margin: '12px 0 20px' }}>
        <input
          placeholder="Hledat email..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ padding: '6px 10px', flex: '1 1 200px' }}
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={{ padding: '6px 10px' }}
        >
          <option value="">Všechny role</option>
          <option value="user">user</option>
          <option value="admin">admin</option>
        </select>
        <button
          type="button"
          onClick={() => {
            setFilter('');
            setRoleFilter('');
          }}
        >
          Reset
        </button>
      </div>
      <table style={{ borderCollapse: 'collapse', width: '100%', maxWidth: 800 }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>Email</th>
            <th>Role</th>
            <th>Ověřen</th>
            <th>Akce</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((u) => (
            <tr key={u._id}>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>{u.isVerified ? '✔️' : '—'}</td>
              <td style={{ display: 'flex', gap: 8 }}>
                {u.role !== 'admin' && (
                  <button disabled={!!changing} onClick={() => changeRole(u._id, 'admin')}>
                    {changing === u._id + 'admin' ? '...' : 'Povýšit'}
                  </button>
                )}
                {u.role !== 'user' && (
                  <button disabled={!!changing} onClick={() => changeRole(u._id, 'user')}>
                    {changing === u._id + 'user' ? '...' : 'Degradovat'}
                  </button>
                )}
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={4}>Žádní uživatelé</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
