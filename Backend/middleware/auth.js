const jwt = require('jsonwebtoken');

function autenticar(req, res, next) {
  const header = req.headers['authorization'];
  if (!header) return res.status(401).json({ erro: 'Token não fornecido.' });

  const token = header.split(' ')[1]; // Bearer <token>
  if (!token) return res.status(401).json({ erro: 'Token inválido.' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = payload;
    next();
  } catch {
    return res.status(401).json({ erro: 'Token expirado ou inválido.' });
  }
}

function autorizar(...tipos) {
  return (req, res, next) => {
    if (!tipos.includes(req.usuario.tipo)) {
      return res.status(403).json({ erro: 'Acesso negado.' });
    }
    next();
  };
}

module.exports = { autenticar, autorizar };
