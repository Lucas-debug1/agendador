const db = require('../config/db');
async function listar(req, res) {
  try {
    const { tipo, cidade } = req.query;
    let sql = 'SELECT id, nome, tipo, descricao, telefone, cidade, estado FROM negocios WHERE ativo = true';
    const params = [];
    if (tipo)   { params.push(tipo);          sql += ` AND tipo = $${params.length}`; }
    if (cidade) { params.push(`%${cidade}%`); sql += ` AND cidade ILIKE $${params.length}`; }

    sql += ' ORDER BY nome';
    const result = await db.query(sql, params);
    return res.json(result.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro interno.' });
  }
}
async function detalhe(req, res) {
  const { id } = req.params;
  try {
    const neg = await db.query(
      'SELECT id, nome, tipo, descricao, telefone, email, endereco, cidade, estado FROM negocios WHERE id = $1 AND ativo = true',
      [id]
    );
    if (!neg.rows.length) return res.status(404).json({ erro: 'Negócio não encontrado.' });
    const servicos = await db.query(
      'SELECT id, nome, descricao, duracao_min, preco FROM servicos WHERE negocio_id = $1 AND ativo = true',
      [id]
    );
    const profissionais = await db.query(
      'SELECT id, nome, especialidade FROM profissionais WHERE negocio_id = $1 AND ativo = true',
      [id]
    );
    return res.json({ ...neg.rows[0], servicos: servicos.rows, profissionais: profissionais.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro interno.' });
  }
}
async function criar(req, res) {
  const { nome, tipo, descricao, telefone, email, endereco, cidade, estado } = req.body;
  if (!nome || !tipo) return res.status(400).json({ erro: 'Nome e tipo são obrigatórios.' });
  try {
    const result = await db.query(
      `INSERT INTO negocios (dono_id, nome, tipo, descricao, telefone, email, endereco, cidade, estado)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
      [req.usuario.id, nome, tipo, descricao || null, telefone || null, email || null, endereco || null, cidade || null, estado || null]
    );
    return res.status(201).json({ id: result.rows[0].id, mensagem: 'Negócio criado.' });
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
    if (req.body[c] !== undefined) {
      params.push(req.body[c]);
      updates.push(`${c} = $${params.length}`);
    }
  });
  if (!updates.length) return res.status(400).json({ erro: 'Nenhum campo para atualizar.' });
  try {
    const check = await db.query(
      'SELECT id FROM negocios WHERE id = $1 AND dono_id = $2',
      [id, req.usuario.id]
    );
    if (!check.rows.length) return res.status(403).json({ erro: 'Sem permissão ou negócio não encontrado.' });

    params.push(id);
    await db.query(`UPDATE negocios SET ${updates.join(', ')} WHERE id = $${params.length}`, params);
    return res.json({ mensagem: 'Negócio atualizado.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro interno.' });
  }
}
module.exports = { listar, detalhe, criar, atualizar };