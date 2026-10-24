import { useEffect } from 'react';
import { coverUrl } from './PosterCard';

export default function BookModal({ book, canBorrow, onClose, onBorrow }) {
    useEffect(() => {
        function handleKey(e) {
            if (e.key === 'Escape') onClose();
        }
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [onClose]);

    if (!book) return null;

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose} aria-label="Close" type="button">×</button>
                <img className="modal-cover" src={coverUrl(book)} alt={`Cover of ${book.title}`} />
                <div className="modal-body">
                    <h2>{book.title}</h2>
                    <p className="book-meta">{book.authors?.length ? book.authors.join(', ') : 'Unknown author'}</p>
                    <p className="book-meta">{book.category || 'Uncategorized'} · {book.published_year || 'N/A'}</p>
                    {book.publisher && <p className="book-meta">Publisher: {book.publisher}</p>}
                    {book.isbn && <p className="book-meta">ISBN: {book.isbn}</p>}
                    <p className="book-copies">{book.available_copies} / {book.total_copies} available</p>
                    {canBorrow && (
                        <button
                            disabled={book.available_copies < 1}
                            onClick={() => onBorrow(book.id)}
                        >
                            {book.available_copies < 1 ? 'Unavailable' : 'Borrow this book'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
