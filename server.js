const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// URL Validation helper
const isValidUrl = (string) => {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
};

// Generate Short Code
const generateShortCode = () => {
    return crypto.randomBytes(4).toString('base64url').replace(/[^a-zA-Z0-9]/g, '').substring(0, 6);
};

// POST /api/shorten
app.post('/api/shorten', (req, res) => {
    const { longUrl } = req.body;
    
    if (!longUrl || !isValidUrl(longUrl)) {
        return res.status(400).json({ error: 'Invalid URL provided' });
    }

    const shortCode = generateShortCode();

    db.run(
        `INSERT INTO urls (long_url, short_code) VALUES (?, ?)`,
        [longUrl, shortCode],
        function(err) {
            if (err) {
                console.error(err.message);
                return res.status(500).json({ error: 'Database error' });
            }
            res.status(201).json({
                id: this.lastID,
                longUrl,
                shortCode,
                shortUrl: "http://localhost:" + PORT + "/" + shortCode
            });
        }
    );
});

// GET /api/urls
app.get('/api/urls', (req, res) => {
    db.all(
        `SELECT * FROM urls ORDER BY created_at DESC LIMIT 10`,
        [],
        (err, rows) => {
            if (err) {
                console.error(err.message);
                return res.status(500).json({ error: 'Database error' });
            }
            res.json(rows);
        }
    );
});

// GET /:shortCode
app.get('/:shortCode', (req, res) => {
    const { shortCode } = req.params;

    db.get(
        `SELECT long_url FROM urls WHERE short_code = ?`,
        [shortCode],
        (err, row) => {
            if (err) {
                console.error(err.message);
                return res.status(500).json({ error: 'Database error' });
            }
            
            if (row) {
                // Increment click count
                db.run(`UPDATE urls SET click_count = click_count + 1 WHERE short_code = ?`, [shortCode]);
                res.redirect(302, row.long_url);
            } else {
                res.status(404).send('URL not found');
            }
        }
    );
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log("Server running on port " + PORT);
    });
}

module.exports = app;
