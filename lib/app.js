const express = require('express');
const cors = require('cors');
const client = require('./client.js');
const app = express();
const morgan = require('morgan');
const ensureAuth = require('./auth/ensure-auth');
const createAuthRoutes = require('./auth/create-auth-routes');
const request = require('superagent');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan('dev')); // http logging

const authRoutes = createAuthRoutes();

// setup authentication routes to give user an auth token
// creates a /auth/signin and a /auth/signup POST route. 
// each requires a POST body with a .email and a .password
app.use('/auth', authRoutes);

// everything that starts with "/api" below here requires an auth token!
app.use('/api', ensureAuth);

// and now every request that has a token in the Authorization header will have a `req.userId` property for us to see who's talking
app.get('/api/test', (req, res) => {
  res.json({
    message: `in this proctected route, we get the user's id like so: ${req.userId}`
  });
});

//https://www.thecocktaildb.com/api/json/v1/1/search.php?s=margarita


app.get('/cocktails', async(req, res) => {
  try {
    const cocktails = await request.get(`https://www.thecocktaildb.com/api/json/v1/1/search.php?s=${req.query.search}`);
    console.log(cocktails.body);
    res.json(cocktails.body);
  } catch (e) {
    
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/favorites', async(req, res) => {
  try {
    const data = await client.query('SELECT * from favorites WHERE owner_id=$1', [req.userId]);
    
    res.json(data.rows);
  } catch (e) {
    
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/favorites/:id', async(req, res) => {
  try {
    const data = await client.query('DELETE from favorites WHERE owner_id=$1 and id=$2 ', [req.userId, req.params.id]);
    
    res.json(data.rows);
  } catch (e) {
    
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/favorites', async(req, res) => {
  try {

    const {
      drink_id,
      name,
      glass,
      image,
    } = req.body;

    const data = await client.query(`
    INSERT INTO favorites (
                      drink_id, 
                      name,
                      glass,
                      image,
                      owner_id)
                    VALUES ($1, $2, $3, $4, $5)
                    RETURNING *;
                    `, [
      drink_id,
      name,
      glass,
      image,
      req.userId
    ]);
    
    res.json(data.rows);
  } catch (e) {
    
    res.status(500).json({ error: e.message });
  }
});

app.use(require('./middleware/error'));

module.exports = app;
