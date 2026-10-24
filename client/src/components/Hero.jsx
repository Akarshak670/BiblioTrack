import { coverUrl } from './PosterCard';

export default function Hero({ book, canBorrow, onBorrow, onMoreInfo }) {
    if (!book) return null;

    return (
        <div className="hero" style={{ backgroundImage: `url(${coverUrl(book)})` }}>
            <div className="hero-gradient" />
            <div className="hero-content">
                <h1>{book.title}</h1>
                <p className="hero-meta">
                    {book.category || 'Uncategorized'} · {book.published_year || 'N/A'}
                    {book.authors?.length ? ` · ${book.authors.join(', ')}` : ''}
                </p>
                <div className="hero-actions">
                    {canBorrow && (
                        <button
                            className="hero-btn hero-btn-primary"
                            disabled={book.available_copies < 1}
                            onClick={() => onBorrow(book.id)}
                        >
                            {book.available_copies < 1 ? 'Unavailable' : '▶ Borrow Now'}
                        </button>
                    )}
                    <button className="hero-btn hero-btn-secondary" onClick={() => onMoreInfo(book)}>
                        ⓘ More Info
                    </button>
                </div>
            </div>
        </div>
    );
}
