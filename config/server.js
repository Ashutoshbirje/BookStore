// server.js
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const jwt = require('jsonwebtoken'); 
const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MySQL Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '22510015',
    database: 'library'
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
    const { email, password } = req.body;

    console.log(`Received signup request for email: ${email}`);

    db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
        if (err) {
            console.error('Database error while checking user:', err);
            return res.status(500).send({ message: 'Database error' });
        }

        if (results.length > 0) {
            return res.status(400).send({ message: 'User already exists' });
        }

        const hashedPassword = bcrypt.hashSync(password, 8);
        console.log('Hashed password:', hashedPassword);

        db.query('INSERT INTO users (email, password) VALUES (?, ?)', [email, hashedPassword], (err) => {
            if (err) {
                console.error('Error inserting user:', err);
                return res.status(500).send({ message: 'Error inserting user' });
            }
            res.status(201).send({ message: 'User created successfully' });
        });
    });
});

// Get all books with 
app.get('/api/books', (req, res) => {
    const { page = 1, limit = 5, genre, author } = req.query; // Get query parameters for pagination and filters
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM books WHERE 1=1'; // Start with a basic query
    const queryParams = [];

    // Apply genre filter if provided
    if (genre) {
        query += ' AND genre = ?';
        queryParams.push(genre);
    }

    // Apply author filter if provided
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

        // Get the total number of books
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
    const token = req.headers.authorization?.split(' ')[1]; // Extract token

    if (!token) {
        return res.status(401).send({ message: 'Unauthorized: No token provided.' });
    }

    try {
        jwt.verify(token, 'supersecretkey1234567890secureandrandomkey'); // Verify token

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
    const token = req.headers.authorization?.split(' ')[1]; // Extract token

    if (!token) {
        return res.status(401).send({ message: 'Unauthorized: No token provided.' });
    }

    try {
        jwt.verify(token, 'supersecretkey1234567890secureandrandomkey'); // Verify token

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
    const token = req.headers.authorization?.split(' ')[1]; // Extract token from Authorization header

    if (!token) {
        return res.status(401).send({ message: 'Unauthorized: No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, 'supersecretkey1234567890secureandrandomkey'); // Verify the token
        console.log('Token verified. User ID:', decoded.id);

        // Now insert the book into the database
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

    console.log(`Received login request for email: ${email}`);

    db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
        if (err) {
            console.error('Database error while checking user:', err);
            return res.status(500).send({ message: 'Database error' });
        }

        if (results.length === 0) {
            return res.status(404).send({ message: 'User not found' });
        }

        const user = results[0];

        // Compare the password with the stored hashed password
        const passwordIsValid = bcrypt.compareSync(password, user.password);
        if (!passwordIsValid) {
            return res.status(401).send({ message: 'Invalid password' });
        }

        // Generate a token (optional)
        const token = jwt.sign({ id: user.id }, 'supersecretkey1234567890secureandrandomkey', {
            expiresIn: 86400 
        });

        res.status(200).send({
            id: user.id,
            email: user.email,
            token: token // Send the token back to the client
        });
    });
});

// Start the server

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
