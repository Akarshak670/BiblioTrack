export function coverUrl(book) {
    return book.cover_image_url || `https://picsum.photos/seed/${book.id}/300/450`;
}

export default function PosterCard({ book, onOpen }) {
    return (
        <button className="poster" onClick={() => onOpen(book)} type="button">
            <img
                src={coverUrl(book)}
                alt={`Cover of ${book.title}`}
                loading="lazy"
                onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://picsum.photos/seed/${book.id}/300/450`;
                }}
            />
            <div className="poster-overlay">
                <p className="poster-title">{book.title}</p>
                <p className="poster-meta">
                    {book.available_copies > 0
                        ? `${book.available_copies} available`
                        : 'Unavailable'}
                </p>
            </div>
        </button>
    );
}
