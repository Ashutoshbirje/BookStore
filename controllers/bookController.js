const Book = require('../models/Book');

exports.addBook = (req, res) => {
    const { title, author, genre, year } = req.body;
    const book = { title, author, genre, year };
    Book.create(book, (err) => {
        if (err) return res.status(500).json({ message: 'Error adding book' });
        res.status(201).json({ message: 'Book added successfully' });
    });
};

exports.updateBook = (req, res) => {
    const bookId = req.params.id;
    const bookData = req.body;
    Book.update(bookId, bookData, (err) => {
        if (err) return res.status(500).json({ message: 'Error updating book' });
        res.status(200).json({ message: 'Book updated successfully' });
    });
};

exports.deleteBook = (req, res) => {
    const bookId = req.params.id;
    Book.delete(bookId, (err) => {
        if (err) return res.status(500).json({ message: 'Error deleting book' });
        res.status(200).json({ message: 'Book deleted successfully' });
    });
};

exports.getBooks = (req, res) => {
    const { page = 1, limit = 10, genre, author } = req.query;
    const offset = (page - 1) * limit;

    let sql = 'SELECT * FROM books WHERE 1=1';
    const params = [];

    if (genre) {
        sql += ' AND genre = ?';
        params.push(genre);
    }
    if (author) {
        sql += ' AND author = ?';
        params.push(author);
    }
    sql += ' LIMIT ?, ?';
    params.push(offset, limit);

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ message: 'Error fetching books' });
        res.status(200).json(results);
    });
};
