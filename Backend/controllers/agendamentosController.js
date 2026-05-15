const db = require('../config/db');
async function listar(req, res) {
  try {
    let result;
    if (req.usuario.tipo === 'cliente') {
      result = await db.query(`
        SELECT a.id, a.data_hora, a.status, a.observacao,
               n.nome AS negocio,
               s.nome AS servico, s.preco,
               p.nome AS profissional
        FROM agendamentos a
        JOIN negocios n           ON a.negocio_id = n.id
        JOIN servicos s           ON a.servico_id = s.id
        LEFT JOIN profissionais p ON a.profissional_id = p.id
        WHERE a.cliente_id = $1
        ORDER BY a.data_hora DESC
      `, [req.usuario.id]);
    } else {
      result = await db.query(`
        SELECT a.id, a.data_hora, a.status, a.observacao,
               u.nome AS cliente,
               s.nome AS servico, s.preco,
               p.nome AS profissional
        FROM agendamentos a
        JOIN usuarios u           ON a.cliente_id = u.id
        JOIN servicos s           ON a.servico_id = s.id
        LEFT JOIN profissionais p ON a.profissional_id = p.id
        JOIN negocios n           ON a.negocio_id = n.id
        WHERE n.dono_id = $1
        ORDER BY a.data_hora DESC
      `, [req.usuario.id]);
    }
    return res.json(result.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro interno.' });
  }
}
async function criar(req, res) {
  const { negocio_id, profissional_id, servico_id, data_hora, observacao } = req.body;

  if (!negocio_id || !servico_id || !data_hora) {
    return res.status(400).json({ erro: 'negocio_id, servico_id e data_hora são obrigatórios.' });
  }
  try {
    if (profissional_id) {
      const conflito = await db.query(`
        SELECT id FROM agendamentos
        WHERE profissional_id = $1 AND data_hora = $2 AND status NOT IN ('cancelado')
      `, [profissional_id, data_hora]);
      if (conflito.rows.length) return res.status(409).json({ erro: 'Horário indisponível para este profissional.' });
    }

    const result = await db.query(
      `INSERT INTO agendamentos (cliente_id, negocio_id, profissional_id, servico_id, data_hora, observacao)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [req.usuario.id, negocio_id, profissional_id || null, servico_id, data_hora, observacao || null]
    );
    return res.status(201).json({ id: result.rows[0].id, mensagem: 'Agendamento criado com sucesso.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro interno.' });
  }
}
async function cancelar(req, res) {
  const { id } = req.params;
  try {
    const rows = await db.query('SELECT * FROM agendamentos WHERE id = $1', [id]);
    if (!rows.rows.length) return res.status(404).json({ erro: 'Agendamento não encontrado.' });

    const agend = rows.rows[0];
    if (req.usuario.tipo === 'cliente' && agend.cliente_id !== req.usuario.id) {
      return res.status(403).json({ erro: 'Sem permissão.' });
    }

    await db.query("UPDATE agendamentos SET status = 'cancelado' WHERE id = $1", [id]);
    return res.json({ mensagem: 'Agendamento cancelado.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro interno.' });
  }
}
async function atualizarStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;
  const statusValidos = ['pendente', 'confirmado', 'cancelado', 'concluido'];
  if (!statusValidos.includes(status)) {
    return res.status(400).json({ erro: `Status inválido. Use: ${statusValidos.join(', ')}` });
  }
  try {
    await db.query('UPDATE agendamentos SET status = $1 WHERE id = $2', [status, id]);
    return res.json({ mensagem: 'Status atualizado.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro interno.' });
  }
}
module.exports = { listar, criar, cancelar, atualizarStatus };