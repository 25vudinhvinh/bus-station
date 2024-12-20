const express = require('express');
const app = express();
const path = require('path');
const PORT = process.env.PORT || 3000;

const pool = require('./db/index.js');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.render('home');
});

app.get('/api/bus_stops', async (req, res) => {
    try {
        const results = await pool.query(`
            SELECT id, route_id, stop_name, 
                   ST_AsGeoJSON(geom) AS geom 
            FROM bus_stops
        `);

        const data = results.rows.map(row => ({
            id: row.id,
            route_id: row.route_id,
            stop_name: row.stop_name,
            geom: row.geom ? JSON.parse(row.geom).coordinates : null 
        }));

        res.json(data);
    } catch (err) {
        console.error('Database query error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/bus_paths' , async (req, res)=>{
    try{
        const results = await pool.query(
            `SELECT id, route_id, ST_AsGeoJSON(geom) AS geom FROM bus_paths`
        )
        const data = results.rows.map(row => ({
            id: row.id,
            route_id: row.route_id,
            geom: row.geom ? JSON.parse(row.geom).coordinates : null
        }))
        res.json(data)
    }catch(err){ 
        console.error(err)
        res.status(500).json({error: 'Internal Server Error'});
    }   
})


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
