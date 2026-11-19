const jwt = require('jsonwebtoken');

const readCookie = (header, name) => {
  const item = String(header || '').split(';').map(value => value.trim()).find(value => value.startsWith(`${name}=`));
  if (!item) return '';
  try {
    return decodeURIComponent(item.slice(name.length + 1));
  } catch (error) {
    return '';
  }
};

const getRequestToken = (req) => {
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  return bearerToken || readCookie(req.headers.cookie, 'imoore_session');
};

const authMiddleware = async (req, res, next) => {
  const token = getRequestToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Token ausente ou invalido' });
  }
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
  getRequestToken,
};
