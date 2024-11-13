const db = require('../config/db');

const Book = {
    create: (bookData, callback) => {
        const sql = 'INSERT INTO books SET ?';
        db.query(sql, bookData, callback);
    },
    findAll: (offset, limit, genre, author, callback) => {
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

        db.query(sql, params, callback);
    },
    update: (bookId, bookData, callback) => {
        const sql = 'UPDATE books SET ? WHERE id = ?';
        db.query(sql, [bookData, bookId], callback);
    },
    delete: (bookId, callback) => {
        const sql = 'DELETE FROM books WHERE id = ?';
        db.query(sql, [bookId], callback);
    },
};

module.exports = Book;
