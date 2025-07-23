const cors = require('cors');
const maths = require("./maths")
const express = require("express")
const app = express()
const pool = require('./db')

app.use(express.json())
app.use(cors());

app.get('/', (req,res)=>{
    const show_sum = maths.sum(4,5);
    res.send(`Welcome to my first express server. And sum calculated is ${show_sum}`);
})

app.get( '/users', async (req,res) => {

    try{
        const result = await pool.query('SELECT * FROM users ORDER BY id ASC')
        res.json(result.rows)
    }
    catch(err)
    {
        console.error('DB error:', err);
        res.status(500).json({error:'Failed to fetch users.'})
    }
})

app.post( '/users', async (req,res)=> {

    const {name, email} = req.body;

    if(!name || !email)
    {
        return res.status(400).json({ error: 'Name and Email are required.' });
    }

    try {
        const insertQuery = 'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *';
        const result = await pool.query(insertQuery, [name, email]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') {
          // Unique violation
          res.status(409).json({ error: 'Email already exists.' });
        } else {
          res.status(500).json({ error: 'Failed to add user.' });
        }
    }
})

app.get('/user/:id', async (req, res) => {
    const id = parseInt(req.params.id);
  
    try {
      const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  
      if (result.rows.length > 0) {
        res.json(result.rows[0]);
      } else {
        res.status(404).json({ error: 'User not found.' });
      }
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch user.' });
    }
});
  

app.delete('/user/:id', async (req, res) => {
    const id = parseInt(req.params.id);
  
    try {
      const result = await pool.query('DELETE FROM users WHERE id = $1', [id]);
  
      if (result.rowCount > 0) {
        res.json({ message: 'User successfully deleted.' });
      } else {
        res.status(404).json({ error: 'User not found.' });
      }
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete user.' });
    }
});

app.put('/user/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const { name, email } = req.body;
  
    if (!name && !email) {
      return res.status(400).json({ error: 'Name or Email is required to update.' });
    }
  
    try {
      const result = await pool.query(
        'UPDATE users SET name = COALESCE($1, name), email = COALESCE($2, email) WHERE id = $3 RETURNING *',
        [name || null, email || null, id]
      );
  
      if (result.rows.length > 0) {
        res.status(202).json(result.rows[0]);
      } else {
        res.status(404).json({ error: 'User not found.' });
      }
    } catch (err) {
      if (err.code === '23505') {
        res.status(409).json({ error: 'Email already exists.' });
      } else {
        res.status(500).json({ error: 'Failed to update user.' });
      }
    }
});
  

const PORT = 3001;
app.listen( PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
})
