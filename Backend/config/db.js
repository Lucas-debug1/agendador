const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT     || 5432,
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME     || 'postgres',
  ssl:      { rejectUnauthorized: false }, 
});
pool.connect()
  .then(c => { console.log('Banco conectado!'); c.release(); })
  .catch(e => console.error(' Erro ao conectar no banco:', e.message));

module.exports = pool;
