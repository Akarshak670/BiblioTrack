import { useEffect, useState } from 'react';
import api from '../api/axios';

export default function AdminBorrows() {
    const [records, setRecords] = useState([]);

    async function loadRecords() {
        const res = await api.get('/borrow');
        setRecords(res.data);
    }

    useEffect(() => {
        loadRecords();
    }, []);

    async function handleReturn(id) {
        await api.post(`/borrow/${id}/return`);
        loadRecords();
    }

    return (
        <div className="page">
            <h2>All Loans</h2>
            <table>
                <thead>
                    <tr>
                        <th>Book</th><th>Member</th><th>Borrowed</th><th>Due</th><th>Status</th><th></th>
                    </tr>
                </thead>
                <tbody>
                    {records.map((r) => (
                        <tr key={r.id}>
                            <td>{r.title}</td>
                            <td>{r.user_name} ({r.user_email})</td>
                            <td>{new Date(r.borrowed_at).toLocaleDateString()}</td>
                            <td>{new Date(r.due_at).toLocaleDateString()}</td>
                            <td>{r.status}</td>
                            <td>
                                {r.status === 'borrowed' && (
                                    <button className="link-button" onClick={() => handleReturn(r.id)}>Mark Returned</button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
