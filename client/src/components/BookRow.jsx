import { useRef } from 'react';
import PosterCard from './PosterCard';

export default function BookRow({ title, books, onOpen }) {
    const trackRef = useRef(null);

    function scroll(direction) {
        const track = trackRef.current;
        if (!track) return;
        track.scrollBy({ left: direction * track.clientWidth * 0.9, behavior: 'smooth' });
    }

    if (!books || books.length === 0) return null;

    return (
        <section className="row">
            <h3 className="row-title">{title}</h3>
            <div className="row-viewport">
                <button className="row-nav row-nav-left" onClick={() => scroll(-1)} aria-label="Scroll left" type="button">‹</button>
                <div className="row-track" ref={trackRef}>
                    {books.map((book) => (
                        <PosterCard key={book.id} book={book} onOpen={onOpen} />
                    ))}
                </div>
                <button className="row-nav row-nav-right" onClick={() => scroll(1)} aria-label="Scroll right" type="button">›</button>
            </div>
        </section>
    );
}
