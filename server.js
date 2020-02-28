// Load Environment Variables from the .env file
require('dotenv').config();

// Application Dependencies
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const client = require('./lib/client');
const request = require('superagent');

// Initiate database connection
client.connect();

// Application Setup
const app = express();
const PORT = process.env.PORT;
app.use(morgan('dev'));
app.use(cors());
app.use(express.static('public'));
app.use(express.json());

// API Routes
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

app.use('/api', ensureAuth);

// app.get('/api/goodreads', async (req, res) => {
//     const URL = `https://www.goodreads.com/search/index.xml?key=${process.env.GOODREADS_API_KEY}&q=${req.query.search}`;
//     const result = await request.get(URL);
//     res.json(result.body);
// });

app.get('/api/tiingo', async (req, res) => {
    const URL = `https://api.tiingo.com/tiingo/daily/${req.query.search}?token=${process.env.TIINGO_API_KEY}`;
    const result = await request.get(URL);
    res.json(result.body);
});

app.listen(PORT, () => {
    console.log('listening at ', PORT);
});