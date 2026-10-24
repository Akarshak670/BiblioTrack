const express = require('express');
const { borrowBook, returnBook, myBorrows, allBorrows } = require('../controllers/borrowController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticate, borrowBook);
router.post('/:id/return', authenticate, authorize('admin', 'librarian'), returnBook);
router.get('/me', authenticate, myBorrows);
router.get('/', authenticate, authorize('admin', 'librarian'), allBorrows);

module.exports = router;
