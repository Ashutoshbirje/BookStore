const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const jwt = require('jsonwebtoken'); 
const app = express();
const port = 4000;

// Middleware
app.use(cors({
    origin: 'http://localhost:3000', // Adjust this to your client's origin
}));
app.use(bodyParser.json());

// MySQL Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Ashu@880',
    database: 'librarydb'
});

db.connect((err) => {
    if (err) {
        console.error('Failed to connect to MySQL database:', err);
        process.exit(1);
    }
    console.log('Connected to MySQL database!');
});

// Signup Route
app.post('/api/auth/signup', async (req, res) => {
    console.log('Received request body:', req.body);
    
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).send({ message: 'Email and password are required' });
    }

    console.log(`Received signup request for email: ${email}`);

    try {
        const [results] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);

        if (results.length > 0) {
            return res.status(400).send({ message: 'User already exists' });
        }

        const hashedPassword = bcrypt.hashSync(password, 8);
        console.log('Hashed password:', hashedPassword);

        await db.promise().query('INSERT INTO users (email, password) VALUES (?, ?)', [email, hashedPassword]);
        res.status(201).send({ message: 'User created successfully' });
    } catch (err) {
        console.error('Error during signup:', err);
        res.status(500).send({ message: 'Error during signup' });
    }
});

// Get all books
app.get('/api/books', (req, res) => {
    const { page = 1, limit = 5, genre, author } = req.query; 
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM books WHERE 1=1';
    const queryParams = [];

    if (genre) {
        query += ' AND genre = ?';
        queryParams.push(genre);
    }

    if (author) {
        query += ' AND author = ?';
        queryParams.push(author);
    }

    query += ' LIMIT ? OFFSET ?';
    queryParams.push(parseInt(limit), parseInt(offset));

    db.query(query, queryParams, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send({ message: 'Database error' });
        }

        db.query('SELECT COUNT(*) AS total FROM books', (err, countResults) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).send({ message: 'Database error' });
            }

            res.status(200).send({
                books: results,
                total: countResults[0].total
            });
        });
    });
});

// Delete Book Route
app.delete('/api/books/:id', (req, res) => {
    const { id } = req.params;
    const token = req.headers.authorization?.split(' ')[1]; 

    if (!token) {
        return res.status(401).send({ message: 'Unauthorized: No token provided.' });
    }

    try {
        jwt.verify(token, 'supersecretkey1234567890secureandrandomkey');

        const query = 'DELETE FROM books WHERE id = ?';
        db.query(query, [id], (err, result) => {
            if (err) {
                console.error('Error deleting book:', err);
                return res.status(500).send({ message: 'Database error' });
            }

            if (result.affectedRows === 0) {
                return res.status(404).send({ message: 'Book not found' });
            }

            res.status(200).send({ message: 'Book deleted successfully!' });
        });
    } catch (err) {
        console.error('Error verifying token:', err);
        return res.status(401).send({ message: 'Unauthorized: Invalid token.' });
    }
});

// Update Book Route
app.put('/api/books/:id', (req, res) => {
    const { id } = req.params;
    const { title, author, genre, year } = req.body;
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).send({ message: 'Unauthorized: No token provided.' });
    }

    try {
        jwt.verify(token, 'supersecretkey1234567890secureandrandomkey');

        const query = 'UPDATE books SET title = ?, author = ?, genre = ?, year = ? WHERE id = ?';
        db.query(query, [title, author, genre, year, id], (err, result) => {
            if (err) {
                console.error('Error updating book:', err);
                return res.status(500).send({ message: 'Database error' });
            }

            if (result.affectedRows === 0) {
                return res.status(404).send({ message: 'Book not found' });
            }

            res.status(200).send({ message: 'Book updated successfully!' });
        });
    } catch (err) {
        console.error('Error verifying token:', err);
        return res.status(401).send({ message: 'Unauthorized: Invalid token.' });
    }
});

// Add Book Route
app.post('/api/books', (req, res) => {
    const { title, author, genre, year } = req.body;
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).send({ message: 'Unauthorized: No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, 'supersecretkey1234567890secureandrandomkey');
        console.log('Token verified. User ID:', decoded.id);

        const query = 'INSERT INTO books (title, author, genre, year) VALUES (?, ?, ?, ?)';
        db.query(query, [title, author, genre, year], (err, result) => {
            if (err) {
                console.error('Error inserting book into the database:', err);
                return res.status(500).send({ message: 'Database error' });
            }
            res.status(201).send({ message: 'Book added successfully!' });
        });
    } catch (err) {
        console.error('Error verifying token:', err);
        return res.status(401).send({ message: 'Unauthorized: Invalid token.' });
    }
});

// Login Route
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    console.log('Received request body:', req.body);

    if (!email || !password) {
        return res.status(400).send({ message: 'Email and password are required' });
    }

    console.log(`Received login request for email: ${email}`);

    try {
        const [results] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);

        if (results.length === 0) {
            return res.status(404).send({ message: 'User not found' });
        }

        const user = results[0];

        const passwordIsValid = bcrypt.compareSync(password, user.password);
        if (!passwordIsValid) {
            return res.status(401).send({ message: 'Invalid password' });
        }

        const token = jwt.sign({ id: user.id }, 'supersecretkey1234567890secureandrandomkey', {
            expiresIn: 86400 
        });

        res.status(200).send({
            id: user.id,
            email: user.email,
            token: token
        });
    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).send({ message: 'Error during login' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
