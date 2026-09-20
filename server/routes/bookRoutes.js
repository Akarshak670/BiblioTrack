const express = require('express');
const { listBooks, getBook, createBook, updateBook, deleteBook, listCategories } = require('../controllers/bookController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', listBooks);
router.get('/categories', listCategories);
router.get('/:id', getBook);
router.post('/', authenticate, authorize('admin', 'librarian'), createBook);
router.put('/:id', authenticate, authorize('admin', 'librarian'), updateBook);
router.delete('/:id', authenticate, authorize('admin', 'librarian'), deleteBook);

module.exports = router;
