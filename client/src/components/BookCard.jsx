function coverUrl(book) {
    return book.cover_image_url || `https://picsum.photos/seed/${book.id}/300/450`;
}

export default function BookCard({ book, onBorrow, canBorrow }) {
    return (
        <div className="book-card">
            <img
                className="book-cover"
                src={coverUrl(book)}
                alt={`Cover of ${book.title}`}
                loading="lazy"
                onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://picsum.photos/seed/${book.id}/300/450`;
                }}
            />
            <h3>{book.title}</h3>
            <p className="book-meta">{book.authors?.join(', ') || 'Unknown author'}</p>
            <p className="book-meta">{book.category || 'Uncategorized'} · {book.published_year || 'N/A'}</p>
            <p className="book-copies">
                {book.available_copies} / {book.total_copies} available
            </p>
            {canBorrow && (
                <button
                    disabled={book.available_copies < 1}
                    onClick={() => onBorrow(book.id)}
                >
                    {book.available_copies < 1 ? 'Unavailable' : 'Borrow'}
                </button>
            )}
        </div>
    );
}
