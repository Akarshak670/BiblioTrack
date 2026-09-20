const pool = require('../db/pool');

async function listUsers(req, res, next) {
    try {
        const result = await pool.query(
            `SELECT id, name, email, role, phone, is_active, created_at
             FROM users ORDER BY created_at DESC`
        );
        res.json(result.rows);
    } catch (err) {
        next(err);
    }
}

async function updateUser(req, res, next) {
    try {
        const { id } = req.params;
        const { name, phone, role, isActive } = req.body;

        const result = await pool.query(
            `UPDATE users SET
                name = COALESCE($1, name),
                phone = COALESCE($2, phone),
                role = COALESCE($3, role),
                is_active = COALESCE($4, is_active)
             WHERE id = $5
             RETURNING id, name, email, role, phone, is_active`,
            [name, phone, role, isActive, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        next(err);
    }
}

async function deleteUser(req, res, next) {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(204).send();
    } catch (err) {
        next(err);
    }
}

module.exports = { listUsers, updateUser, deleteUser };
