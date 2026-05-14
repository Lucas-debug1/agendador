const db = require('../config/db');
async function listar(req, res) {
  const { negocio_id } = req.params;
  try {
    const [rows] = await db.query(
      'SELECT id, nome, descricao, duracao_min, preco FROM servicos WHERE negocio_id = ? AND ativo = 1',
      [negocio_id]
    );
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro interno.' });
  }
}
async function criar(req, res) {
  const { negocio_id } = req.params;
  const { nome, descricao, duracao_min, preco } = req.body;
  if (!nome || !duracao_min || !preco) {
    return res.status(400).json({ erro: 'Nome, duração e preço são obrigatórios.' });
  }
  try {
    const [check] = await db.query('SELECT id FROM negocios WHERE id = ? AND dono_id = ?', [negocio_id, req.usuario.id]);
    if (!check.length) return res.status(403).json({ erro: 'Sem permissão.' });

    const [result] = await db.query(
      'INSERT INTO servicos (negocio_id, nome, descricao, duracao_min, preco) VALUES (?, ?, ?, ?, ?)',
      [negocio_id, nome, descricao || null, duracao_min, preco]
    );
    return res.status(201).json({ id: result.insertId, mensagem: 'Serviço criado.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro interno.' });
  }
}
async function remover(req, res) {
  const { negocio_id, id } = req.params;
  try {
    const [check] = await db.query('SELECT id FROM negocios WHERE id = ? AND dono_id = ?', [negocio_id, req.usuario.id]);
    if (!check.length) return res.status(403).json({ erro: 'Sem permissão.' });

    await db.query('UPDATE servicos SET ativo = 0 WHERE id = ? AND negocio_id = ?', [id, negocio_id]);
    return res.json({ mensagem: 'Serviço removido.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro interno.' });
  }
}
module.exports = { listar, criar, remover };