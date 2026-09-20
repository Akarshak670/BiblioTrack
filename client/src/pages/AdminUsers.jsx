import { useEffect, useState } from 'react';
import api from '../api/axios';

export default function AdminUsers() {
    const [users, setUsers] = useState([]);

    async function loadUsers() {
        const res = await api.get('/users');
        setUsers(res.data);
    }

    useEffect(() => {
        loadUsers();
    }, []);

    async function handleRoleChange(id, role) {
        await api.put(`/users/${id}`, { role });
        loadUsers();
    }

    async function handleDelete(id) {
        if (!confirm('Delete this user?')) return;
        await api.delete(`/users/${id}`);
        loadUsers();
    }

    return (
        <div className="page">
            <h2>Manage Users</h2>
            <table>
                <thead>
                    <tr>
                        <th>Name</th><th>Email</th><th>Role</th><th>Active</th><th></th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((u) => (
                        <tr key={u.id}>
                            <td>{u.name}</td>
                            <td>{u.email}</td>
                            <td>
                                <select value={u.role} onChange={(e) => handleRoleChange(u.id, e.target.value)}>
                                    <option value="member">member</option>
                                    <option value="librarian">librarian</option>
                                    <option value="admin">admin</option>
                                </select>
                            </td>
                            <td>{u.is_active ? 'Yes' : 'No'}</td>
                            <td><button className="link-button" onClick={() => handleDelete(u.id)}>Delete</button></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
