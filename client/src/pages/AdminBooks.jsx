import { useEffect, useState } from 'react';
import api from '../api/axios';

const emptyForm = { title: '', isbn: '', publisher: '', publishedYear: '', totalCopies: 1, coverImageUrl: '' };
const PAGE_SIZE = 50;

export default function AdminBooks() {
    const [books, setBooks] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    async function loadBooks(targetPage = page) {
        const res = await api.get('/books', {
            params: { page: targetPage, limit: PAGE_SIZE, ...(search ? { search } : {}) },
        });
        setBooks(res.data.data);
        setTotalPages(res.data.totalPages);
        setTotal(res.data.total);
        setPage(res.data.page);
    }

    useEffect(() => {
        loadBooks(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function handleSearch(e) {
        e.preventDefault();
        loadBooks(1);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        try {
            await api.post('/books', form);
            setForm(emptyForm);
            loadBooks(1);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create book');
        }
    }

    async function handleDelete(id) {
        if (!confirm('Delete this book?')) return;
        await api.delete(`/books/${id}`);
        loadBooks(page);
    }

    return (
        <div className="page">
            <h2>Manage Books</h2>
            <form className="inline-form" onSubmit={handleSubmit}>
                <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                <input placeholder="ISBN" value={form.isbn} onChange={(e) => setForm({ ...form, isbn: e.target.value })} />
                <input placeholder="Publisher" value={form.publisher} onChange={(e) => setForm({ ...form, publisher: e.target.value })} />
                <input placeholder="Year" type="number" value={form.publishedYear} onChange={(e) => setForm({ ...form, publishedYear: e.target.value })} />
                <input placeholder="Copies" type="number" min="1" value={form.totalCopies} onChange={(e) => setForm({ ...form, totalCopies: e.target.value })} />
                <input placeholder="Cover image URL (optional)" value={form.coverImageUrl} onChange={(e) => setForm({ ...form, coverImageUrl: e.target.value })} />
                <button type="submit">Add Book</button>
            </form>
            {error && <p className="error">{error}</p>}

            <form className="search-bar" onSubmit={handleSearch}>
                <input placeholder="Search by title or ISBN" value={search} onChange={(e) => setSearch(e.target.value)} />
                <button type="submit">Search</button>
            </form>
            <p className="book-meta">{total} book(s) total</p>

            <table>
                <thead>
                    <tr>
                        <th>Title</th><th>ISBN</th><th>Available</th><th>Total</th><th></th>
                    </tr>
                </thead>
                <tbody>
                    {books.map((b) => (
                        <tr key={b.id}>
                            <td>{b.title}</td>
                            <td>{b.isbn || '-'}</td>
                            <td>{b.available_copies}</td>
                            <td>{b.total_copies}</td>
                            <td><button className="link-button" onClick={() => handleDelete(b.id)}>Delete</button></td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {totalPages > 1 && (
                <div className="pagination">
                    <button disabled={page <= 1} onClick={() => loadBooks(page - 1)}>Previous</button>
                    <span>Page {page} of {totalPages}</span>
                    <button disabled={page >= totalPages} onClick={() => loadBooks(page + 1)}>Next</button>
                </div>
            )}
        </div>
    );
}
