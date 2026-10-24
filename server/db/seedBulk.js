const { faker } = require('@faker-js/faker');
const pool = require('./adminPool');

const TOTAL_BOOKS = Number(process.env.SEED_BOOK_COUNT) || 1000;
const CATEGORY_NAMES = [
    'Fiction', 'Non-Fiction', 'Science', 'History', 'Technology',
    'Biography', 'Fantasy', 'Mystery', 'Romance', 'Poetry',
    'Self-Help', 'Philosophy', 'Children', 'Art', 'Business',
];
const AUTHOR_COUNT = 250;

async function ensureCategories(client) {
    const ids = [];
    for (const name of CATEGORY_NAMES) {
        const result = await client.query(
            `INSERT INTO categories (name) VALUES ($1)
             ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
             RETURNING id`,
            [name]
        );
        ids.push(result.rows[0].id);
    }
    return ids;
}

async function ensureAuthors(client) {
    const ids = [];
    for (let i = 0; i < AUTHOR_COUNT; i++) {
        const result = await client.query(
            'INSERT INTO authors (name) VALUES ($1) RETURNING id',
            [faker.person.fullName()]
        );
        ids.push(result.rows[0].id);
    }
    return ids;
}

function randomIsbn() {
    return faker.commerce.isbn({ variant: 13 });
}

async function seedBulk() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const categoryIds = await ensureCategories(client);
        const authorIds = await ensureAuthors(client);

        const usedIsbns = new Set();
        let inserted = 0;

        for (let i = 0; i < TOTAL_BOOKS; i++) {
            let isbn = randomIsbn();
            while (usedIsbns.has(isbn)) isbn = randomIsbn();
            usedIsbns.add(isbn);

            const title = faker.company.catchPhrase()
                .split(' ')
                .slice(0, faker.number.int({ min: 2, max: 6 }))
                .join(' ');

            const categoryId = faker.helpers.arrayElement(categoryIds);
            const publisher = faker.company.name();
            const publishedYear = faker.number.int({ min: 1950, max: 2025 });
            const totalCopies = faker.number.int({ min: 1, max: 10 });
            const availableCopies = faker.number.int({ min: 0, max: totalCopies });
            const shelfLocation = `${faker.string.alpha({ length: 1, casing: 'upper' })}-${faker.number.int({ min: 1, max: 99 })}`;

            const bookResult = await client.query(
                `INSERT INTO books (title, isbn, category_id, publisher, published_year, total_copies, available_copies, shelf_location)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                 RETURNING id`,
                [title, isbn, categoryId, publisher, publishedYear, totalCopies, availableCopies, shelfLocation]
            );
            const bookId = bookResult.rows[0].id;

            const authorCount = faker.number.int({ min: 1, max: 2 });
            const bookAuthors = faker.helpers.arrayElements(authorIds, authorCount);
            for (const authorId of bookAuthors) {
                await client.query(
                    'INSERT INTO book_authors (book_id, author_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                    [bookId, authorId]
                );
            }

            inserted++;
            if (inserted % 100 === 0) {
                console.log(`Inserted ${inserted}/${TOTAL_BOOKS} books...`);
            }
        }

        await client.query('COMMIT');
        console.log(`Done. Inserted ${inserted} books with ${authorIds.length} authors across ${categoryIds.length} categories.`);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Bulk seeding failed:', err.message);
        process.exitCode = 1;
    } finally {
        client.release();
        await pool.end();
    }
}

seedBulk();
