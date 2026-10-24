import { useEffect, useState } from 'react';
import api from '../api/axios';

export default function MyBorrows() {
    const [records, setRecords] = useState([]);

    useEffect(() => {
        api.get('/borrow/me').then((res) => setRecords(res.data));
    }, []);

    return (
        <div className="page">
            <h2>My Borrowed Books</h2>
            <table>
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Borrowed</th>
                        <th>Due</th>
                        <th>Returned</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {records.map((r) => (
                        <tr key={r.id}>
                            <td>{r.title}</td>
                            <td>{new Date(r.borrowed_at).toLocaleDateString()}</td>
                            <td>{new Date(r.due_at).toLocaleDateString()}</td>
                            <td>{r.returned_at ? new Date(r.returned_at).toLocaleDateString() : '-'}</td>
                            <td>{r.status}</td>
                        </tr>
                    ))}
                    {records.length === 0 && (
                        <tr><td colSpan={5}>No borrow history yet.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
