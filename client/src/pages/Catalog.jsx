import { useEffect, useState } from 'react';
import api from '../api/axios';
import BookCard from '../components/BookCard';
import BookRow from '../components/BookRow';
import Hero from '../components/Hero';
import BookModal from '../components/BookModal';
import { useAuth } from '../context/AuthContext';

const PAGE_SIZE = 24;
const ROW_SIZE = 20;

export default function Catalog() {
    const [categories, setCategories] = useState([]);
    const [rows, setRows] = useState([]);
    const [heroBook, setHeroBook] = useState(null);
    const [activeBook, setActiveBook] = useState(null);
    const [rowsLoading, setRowsLoading] = useState(true);

    const [books, setBooks] = useState([]);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [message, setMessage] = useState('');
    const { user } = useAuth();

    async function loadBooks(targetPage, categoryOverride = category) {
        try {
            const res = await api.get('/books', {
                params: {
                    page: targetPage,
                    limit: PAGE_SIZE,
                    ...(search ? { search } : {}),
                    ...(categoryOverride ? { category: categoryOverride } : {}),
                },
            });
            setBooks(res.data.data);
            setTotalPages(res.data.totalPages);
            setTotal(res.data.total);
            setPage(res.data.page);
        } catch (err) {
            setMessage(err.response?.data?.message || 'Failed to load books');
        }
    }

    async function loadRows(categoryList) {
        setRowsLoading(true);
        try {
            const results = await Promise.all(
                categoryList.map((c) =>
                    api.get('/books', { params: { category: c.name, limit: ROW_SIZE, page: 1 } })
                        .then((res) => ({ name: c.name, books: res.data.data }))
                        .catch(() => ({ name: c.name, books: [] }))
                )
            );
            const nonEmpty = results.filter((r) => r.books.length > 0);
            setRows(nonEmpty);
            if (nonEmpty.length > 0) {
                const firstAvailable = nonEmpty
                    .flatMap((r) => r.books)
                    .find((b) => b.available_copies > 0) || nonEmpty[0].books[0];
                setHeroBook(firstAvailable);
            }
        } finally {
            setRowsLoading(false);
        }
    }

    useEffect(() => {
        api.get('/books/categories').then((res) => {
            setCategories(res.data);
            loadRows(res.data);
        }).catch(() => setRowsLoading(false));
        loadBooks(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function handleSearch(e) {
        e.preventDefault();
        loadBooks(1);
    }

    function handleCategoryChange(value) {
        setCategory(value);
        loadBooks(1, value);
    }

    async function handleBorrow(bookId) {
        setMessage('');
        try {
            await api.post('/borrow', { bookId });
            setMessage('Book borrowed successfully.');
            setActiveBook(null);
            loadBooks(page);
            loadRows(categories);
        } catch (err) {
            setMessage(err.response?.data?.message || 'Failed to borrow book');
        }
    }

    return (
        <div className="catalog">
            <Hero book={heroBook} canBorrow={!!user} onBorrow={handleBorrow} onMoreInfo={setActiveBook} />

            {message && <p className="info netflix-message">{message}</p>}

            <div className="rows">
                {rowsLoading && <p className="book-meta netflix-message">Loading catalog…</p>}
                {rows.map((row) => (
                    <BookRow key={row.name} title={row.name} books={row.books} onOpen={setActiveBook} />
                ))}
            </div>

            <div className="page browse-all">
                <h2>Browse All Books</h2>
                <form className="search-bar" onSubmit={handleSearch}>
                    <input
                        type="text"
                        placeholder="Search by title or ISBN"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <select value={category} onChange={(e) => handleCategoryChange(e.target.value)}>
                        <option value="">All categories</option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                    </select>
                    <button type="submit">Search</button>
                </form>
                <p className="book-meta">{total} book(s) found</p>
                <div className="book-grid">
                    {books.map((book) => (
                        <BookCard key={book.id} book={book} canBorrow={!!user} onBorrow={handleBorrow} />
                    ))}
                    {books.length === 0 && <p>No books found.</p>}
                </div>
                {totalPages > 1 && (
                    <div className="pagination">
                        <button disabled={page <= 1} onClick={() => loadBooks(page - 1)}>Previous</button>
                        <span>Page {page} of {totalPages}</span>
                        <button disabled={page >= totalPages} onClick={() => loadBooks(page + 1)}>Next</button>
                    </div>
                )}
            </div>

            <BookModal
                book={activeBook}
                canBorrow={!!user}
                onClose={() => setActiveBook(null)}
                onBorrow={handleBorrow}
            />
        </div>
    );
}
