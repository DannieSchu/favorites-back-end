// Load Environment Variables from the .env file
require('dotenv').config();

// Application Dependencies
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const client = require('./lib/client');
const request = require('superagent');

// Application Setup
const app = express();
const PORT = process.env.PORT;
app.use(morgan('dev'));
app.use(cors());
app.use(express.static('public'));

// API Routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// *** AUTH ***
const createAuthRoutes = require('./lib/auth/create-auth-routes');

const authRoutes = createAuthRoutes({
    selectUser(email) {
        return client.query(`
        SELECT id, hash, display_name as "displayName"
        FROM users
        WHERE email = $1;`,
        [email]
        ).then(result => result.rows[0]);
    },
    insertUser(user, hash) {
        return client.query(`
        INSERT into users (email, hash, display_name)
        VALUES ($1, $2, $3)
        RETURNING id, email, display_name;
        `,
        [user.email, hash, user.display_name]
        ).then(result => result.rows[0]);
    }
});

app.use('/api/auth', authRoutes);

const ensureAuth = require('./lib/auth/ensure-auth');

app.use('/api/me', ensureAuth);

// API routes
app.get('/api/news', async(req, res) => {
    const URL = `http://newsapi.org/v2/top-headlines?q=${req.query.search}&apiKey=${process.env.NEWS_API_KEY}`;
    const data = await request.get(URL);
    const articlesArr = data.body.articles;
    const articles = articlesArr.map(article => {
        return {
            title: article.title,
            source: article.source.name,
            url: article.url
        };
    });
    res.json(articles);
});

app.get('/api/me/favorites', async(req, res) => {
    try {
        const favorites = await client.query(`
        SELECT * from favorites 
        WHERE user_id = $1;`,
        [req.userId]
        );
        res.json(favorites.rows);
    }
    catch (err) {
        console.error(err);
    }
});

app.delete('api/me/favorites/:id', async(req, res) => {
    try {
        const deletedFavorite = await client.query(`
        DELETE FROM favorites
        WHERE id = $1
        RETURNING *;`,
        [req.params.id]
        );
        res.json(deletedFavorite.rows);
    }
    catch (err) {
        console.error(err);
    }
});

app.post('api/me/favorites', async(req, res) => {
    try {
        const newFavorite = await client.query(`
        INSERT INTO favorites (title, source, url, user_id)
        VALUES ($1, $2, $3, $4)
        RETURNING *;`,
        [req.body.title, req.body.source, req.body.url, req.user.id]
        );
        res.json(newFavorite[0].row);
    }
    catch (err) {
        console.error(err);
    }
});


app.listen(PORT, () => {
    console.log('listening at ', PORT);
});

module.exports = { app };