const pool = require('../db/pool');

async function listBooks(req, res, next) {
    try {
        const { search, category, page = 1, limit = 20 } = req.query;
        const conditions = [];
        const values = [];

        if (search) {
            values.push(`%${search}%`);
            conditions.push(`(b.title ILIKE $${values.length} OR b.isbn ILIKE $${values.length})`);
        }
        if (category) {
            values.push(category);
            conditions.push(`c.name = $${values.length}`);
        }

        const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        const pageNum = Math.max(1, Number(page));
        const limitNum = Math.max(1, Number(limit));
        const offset = (pageNum - 1) * limitNum;

        const countResult = await pool.query(
            `SELECT COUNT(*) FROM books b
             LEFT JOIN categories c ON c.id = b.category_id
             ${whereClause}`,
            values
        );
        const total = Number(countResult.rows[0].count);

        values.push(limitNum);
        values.push(offset);

        const result = await pool.query(
            `SELECT b.id, b.title, b.isbn, b.publisher, b.published_year,
                    b.total_copies, b.available_copies, b.shelf_location, b.cover_image_url,
                    c.name AS category,
                    COALESCE(array_agg(a.name) FILTER (WHERE a.name IS NOT NULL), '{}') AS authors
             FROM books b
             LEFT JOIN categories c ON c.id = b.category_id
             LEFT JOIN book_authors ba ON ba.book_id = b.id
             LEFT JOIN authors a ON a.id = ba.author_id
             ${whereClause}
             GROUP BY b.id, c.name
             ORDER BY b.created_at DESC
             LIMIT $${values.length - 1} OFFSET $${values.length}`,
            values
        );

        res.json({
            data: result.rows,
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
        });
    } catch (err) {
        next(err);
    }
}

async function listCategories(req, res, next) {
    try {
        const result = await pool.query('SELECT id, name FROM categories ORDER BY name');
        res.json(result.rows);
    } catch (err) {
        next(err);
    }
}

async function getBook(req, res, next) {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `SELECT b.*, c.name AS category,
                    COALESCE(array_agg(a.name) FILTER (WHERE a.name IS NOT NULL), '{}') AS authors
             FROM books b
             LEFT JOIN categories c ON c.id = b.category_id
             LEFT JOIN book_authors ba ON ba.book_id = b.id
             LEFT JOIN authors a ON a.id = ba.author_id
             WHERE b.id = $1
             GROUP BY b.id, c.name`,
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Book not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        next(err);
    }
}

async function createBook(req, res, next) {
    const client = await pool.connect();
    try {
        const {
            title, isbn, categoryId, publisher, publishedYear,
            totalCopies = 1, shelfLocation, coverImageUrl, authorIds = [],
        } = req.body;

        if (!title) {
            return res.status(400).json({ message: 'title is required' });
        }

        await client.query('BEGIN');

        const result = await client.query(
            `INSERT INTO books (title, isbn, category_id, publisher, published_year, total_copies, available_copies, shelf_location, cover_image_url)
             VALUES ($1, $2, $3, $4, $5, $6, $6, $7, $8)
             RETURNING *`,
            [title, isbn || null, categoryId || null, publisher || null, publishedYear || null, totalCopies, shelfLocation || null, coverImageUrl || null]
        );
        const book = result.rows[0];

        for (const authorId of authorIds) {
            await client.query(
                'INSERT INTO book_authors (book_id, author_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                [book.id, authorId]
            );
        }

        await client.query('COMMIT');
        res.status(201).json(book);
    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
}

async function updateBook(req, res, next) {
    try {
        const { id } = req.params;
        const {
            title, isbn, categoryId, publisher, publishedYear,
            totalCopies, shelfLocation, coverImageUrl,
        } = req.body;

        const result = await pool.query(
            `UPDATE books SET
                title = COALESCE($1, title),
                isbn = COALESCE($2, isbn),
                category_id = COALESCE($3, category_id),
                publisher = COALESCE($4, publisher),
                published_year = COALESCE($5, published_year),
                total_copies = COALESCE($6, total_copies),
                shelf_location = COALESCE($7, shelf_location),
                cover_image_url = COALESCE($8, cover_image_url)
             WHERE id = $9
             RETURNING *`,
            [title, isbn, categoryId, publisher, publishedYear, totalCopies, shelfLocation, coverImageUrl, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Book not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        next(err);
    }
}

async function deleteBook(req, res, next) {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM books WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Book not found' });
        }
        res.status(204).send();
    } catch (err) {
        next(err);
    }
}

module.exports = { listBooks, getBook, createBook, updateBook, deleteBook, listCategories };
