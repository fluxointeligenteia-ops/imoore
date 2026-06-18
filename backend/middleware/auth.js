const jwt = require('jsonwebtoken');

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token ausente ou invalido' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const { data: user, error } = await req.supabase
      .from('usuarios')
      .select('id, nome, email, perfil, creci, ativo')
      .eq('id', payload.id)
      .single();

    if (error || !user || !user.ativo) {
      return res.status(401).json({ error: 'Usuario invalido ou inativo' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token invalido ou expirado' });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.perfil)) {
      return res.status(403).json({ error: 'Permissao negada' });
    }
    next();
  };
};

module.exports = {
  authMiddleware,
  requireRole,
};
