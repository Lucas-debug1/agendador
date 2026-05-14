const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const db     = require('../config/db');
async function registrar(req, res) {
  const { nome, email, senha, telefone, tipo } = req.body;
  if (!nome || !email || !senha) {
    return res.status(400).json({ erro: 'Nome, email e senha são obrigatórios.' });
  }
  const tipoPermitido = ['cliente', 'dono'].includes(tipo) ? tipo : 'cliente';
  try {
    const [existe] = await db.query('SELECT id FROM usuarios WHERE email = ?', [email]);
    if (existe.length) return res.status(409).json({ erro: 'E-mail já cadastrado.' });
    const hash = await bcrypt.hash(senha, 10);
    const [result] = await db.query(
      'INSERT INTO usuarios (nome, email, senha, telefone, tipo) VALUES (?, ?, ?, ?, ?)',
      [nome, email, hash, telefone || null, tipoPermitido]
    );
    const token = gerarToken({ id: result.insertId, nome, email, tipo: tipoPermitido });
    return res.status(201).json({ token, usuario: { id: result.insertId, nome, email, tipo: tipoPermitido } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro interno.' });
  }
}
async function login(req, res) {
  const { email, senha } = req.body;
  if (!email || !senha) return res.status(400).json({ erro: 'Email e senha são obrigatórios.' });
  try {
    const [rows] = await db.query('SELECT * FROM usuarios WHERE email = ? AND ativo = 1', [email]);
    if (!rows.length) return res.status(401).json({ erro: 'Credenciais inválidas.' });
    const usuario = rows[0];
    const ok = await bcrypt.compare(senha, usuario.senha);
    if (!ok) return res.status(401).json({ erro: 'Credenciais inválidas.' });
    const token = gerarToken({ id: usuario.id, nome: usuario.nome, email: usuario.email, tipo: usuario.tipo });
    return res.json({ token, usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, tipo: usuario.tipo } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro interno.' });
  }
}
function gerarToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
}
module.exports = { registrar, login };