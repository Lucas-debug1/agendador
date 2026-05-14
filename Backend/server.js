require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const routes  = require('./routes/index');
const app  = express();
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/api', routes);
app.get('/api/health', (req, res) => res.json({ status: 'ok', versao: '1.0.0' }));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});
app.listen(PORT, () => {
  console.log(` Agendei rodando em http://localhost:${PORT}`);
});
