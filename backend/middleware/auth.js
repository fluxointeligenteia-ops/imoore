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
      .select('id, nome, email, perfil, creci, ativo, status, senha_troca_obrigatoria')
      .eq('id', payload.id)
      .single();

    if (error || !user || !user.ativo) {
      return res.status(401).json({ error: 'Usuario invalido ou inativo' });
    }

    req.user = user;
    if (user.perfil === 'corretor' && user.status !== 'aprovado') {
      return res.status(403).json({
        error: user.status === 'rejeitado'
          ? 'Cadastro de corretor rejeitado'
          : 'Cadastro de corretor aguardando aprovacao',
      });
    }
    if (user.senha_troca_obrigatoria === true
      && !(req.baseUrl === '/api/auth' && req.path === '/change-password')) {
      return res.status(403).json({ error: 'Altere a senha temporaria antes de continuar' });
    }
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
