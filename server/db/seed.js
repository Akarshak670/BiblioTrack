const fs = require('fs');
const path = require('path');
const pool = require('./adminPool');

async function seed() {
    const seedSql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
    try {
        await pool.query(seedSql);
        console.log('Seed data inserted successfully.');
    } catch (err) {
        console.error('Seeding failed:', err.message);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

seed();
