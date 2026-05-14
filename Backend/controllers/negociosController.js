const db = require('../config/db');
async function listar(req, res) {
  try {
    const { tipo, cidade } = req.query;
    let sql = 'SELECT id, nome, tipo, descricao, telefone, cidade, estado FROM negocios WHERE ativo = 1';
    const params = [];

    if (tipo)   { sql += ' AND tipo = ?';   params.push(tipo); }
    if (cidade) { sql += ' AND cidade LIKE ?'; params.push(`%${cidade}%`); }

    sql += ' ORDER BY nome';
    const [rows] = await db.query(sql, params);
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro interno.' });
  }
}
async function detalhe(req, res) {
  const { id } = req.params;
  try {
    const [[negocio]] = await db.query(
      'SELECT id, nome, tipo, descricao, telefone, email, endereco, cidade, estado FROM negocios WHERE id = ? AND ativo = 1',
      [id]
    );
    if (!negocio) return res.status(404).json({ erro: 'Negócio não encontrado.' });
    const [servicos] = await db.query(
      'SELECT id, nome, descricao, duracao_min, preco FROM servicos WHERE negocio_id = ? AND ativo = 1',
      [id]
    );
    const [profissionais] = await db.query(
      'SELECT id, nome, especialidade FROM profissionais WHERE negocio_id = ? AND ativo = 1',
      [id]
    );
    return res.json({ ...negocio, servicos, profissionais });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro interno.' });
  }
}
async function criar(req, res) {
  const { nome, tipo, descricao, telefone, email, endereco, cidade, estado } = req.body;
  if (!nome || !tipo) return res.status(400).json({ erro: 'Nome e tipo são obrigatórios.' });
  try {
    const [result] = await db.query(
      `INSERT INTO negocios (dono_id, nome, tipo, descricao, telefone, email, endereco, cidade, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.usuario.id, nome, tipo, descricao || null, telefone || null, email || null, endereco || null, cidade || null, estado || null]
    );
    return res.status(201).json({ id: result.insertId, mensagem: 'Negócio criado.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro interno.' });
  }
}
async function atualizar(req, res) {
  const { id } = req.params;
  const campos = ['nome', 'descricao', 'telefone', 'email', 'endereco', 'cidade', 'estado'];
  const updates = [];
  const params  = [];
  campos.forEach(c => {
    if (req.body[c] !== undefined) { updates.push(`${c} = ?`); params.push(req.body[c]); }
  });
  if (!updates.length) return res.status(400).json({ erro: 'Nenhum campo para atualizar.' });
  try {
    const [check] = await db.query('SELECT id FROM negocios WHERE id = ? AND dono_id = ?', [id, req.usuario.id]);
    if (!check.length) return res.status(403).json({ erro: 'Sem permissão ou negócio não encontrado.' });

    params.push(id);
    await db.query(`UPDATE negocios SET ${updates.join(', ')} WHERE id = ?`, params);
    return res.json({ mensagem: 'Negócio atualizado.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro interno.' });
  }
}
module.exports = { listar, detalhe, criar, atualizar };