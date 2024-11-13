const express = require('express');
const { addBook, updateBook, deleteBook, getBooks } = require('../controllers/bookController');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/', authMiddleware, addBook);
router.put('/:id', authMiddleware, updateBook);
router.delete('/:id', authMiddleware, deleteBook);
router.get('/', getBooks);

module.exports = router;
