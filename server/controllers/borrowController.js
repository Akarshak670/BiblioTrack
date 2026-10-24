const pool = require('../db/pool');

const LOAN_PERIOD_DAYS = 14;
const FINE_PER_DAY = 5; // currency units per day overdue

async function borrowBook(req, res, next) {
    const client = await pool.connect();
    try {
        const { bookId } = req.body;
        const userId = req.user.id;
        if (!bookId) {
            return res.status(400).json({ message: 'bookId is required' });
        }

        await client.query('BEGIN');

        const bookResult = await client.query(
            'SELECT id, available_copies FROM books WHERE id = $1 FOR UPDATE',
            [bookId]
        );
        const book = bookResult.rows[0];
        if (!book) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Book not found' });
        }
        if (book.available_copies < 1) {
            await client.query('ROLLBACK');
            return res.status(409).json({ message: 'No copies available' });
        }

        const dueAt = new Date();
        dueAt.setDate(dueAt.getDate() + LOAN_PERIOD_DAYS);

        const borrowResult = await client.query(
            `INSERT INTO borrow_records (user_id, book_id, due_at, status)
             VALUES ($1, $2, $3, 'borrowed')
             RETURNING *`,
            [userId, bookId, dueAt]
        );

        await client.query(
            'UPDATE books SET available_copies = available_copies - 1 WHERE id = $1',
            [bookId]
        );

        await client.query('COMMIT');
        res.status(201).json(borrowResult.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
}

async function returnBook(req, res, next) {
    const client = await pool.connect();
    try {
        const { id } = req.params; // borrow_record id

        await client.query('BEGIN');

        const recordResult = await client.query(
            'SELECT * FROM borrow_records WHERE id = $1 FOR UPDATE',
            [id]
        );
        const record = recordResult.rows[0];
        if (!record) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Borrow record not found' });
        }
        if (record.status === 'returned') {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Book already returned' });
        }

        const returnedAt = new Date();
        const dueAt = new Date(record.due_at);
        const overdueMs = returnedAt - dueAt;
        const overdueDays = overdueMs > 0 ? Math.ceil(overdueMs / (1000 * 60 * 60 * 24)) : 0;
        const fineAmount = overdueDays * FINE_PER_DAY;

        await client.query(
            `UPDATE borrow_records
             SET returned_at = $1, status = 'returned'
             WHERE id = $2`,
            [returnedAt, id]
        );

        await client.query(
            'UPDATE books SET available_copies = available_copies + 1 WHERE id = $1',
            [record.book_id]
        );

        let fine = null;
        if (fineAmount > 0) {
            const fineResult = await client.query(
                `INSERT INTO fines (borrow_record_id, amount, reason)
                 VALUES ($1, $2, $3)
                 RETURNING *`,
                [id, fineAmount, `Returned ${overdueDays} day(s) late`]
            );
            fine = fineResult.rows[0];
        }

        await client.query('COMMIT');
        res.json({ message: 'Book returned', overdueDays, fine });
    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
}

async function myBorrows(req, res, next) {
    try {
        const result = await pool.query(
            `SELECT br.*, b.title, b.isbn
             FROM borrow_records br
             JOIN books b ON b.id = br.book_id
             WHERE br.user_id = $1
             ORDER BY br.borrowed_at DESC`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        next(err);
    }
}

async function allBorrows(req, res, next) {
    try {
        const { status } = req.query;
        const values = [];
        let where = '';
        if (status) {
            values.push(status);
            where = `WHERE br.status = $1`;
        }

        const result = await pool.query(
            `SELECT br.*, b.title, u.name AS user_name, u.email AS user_email
             FROM borrow_records br
             JOIN books b ON b.id = br.book_id
             JOIN users u ON u.id = br.user_id
             ${where}
             ORDER BY br.borrowed_at DESC`,
            values
        );
        res.json(result.rows);
    } catch (err) {
        next(err);
    }
}

module.exports = { borrowBook, returnBook, myBorrows, allBorrows };
