const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const router = express.Router();
const ALLOWED_PROFILES = ['admin', 'corretor', 'crm'];

const loginLog = (message, details = {}) => {
  console.log('[auth-login]', message, details);
};

const publicUser = (user) => ({
  id: user.id,
  nome: user.nome,
  email: user.email,
  perfil: user.perfil,
  creci: user.creci,
});

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      nome: user.nome,
      email: user.email,
      perfil: user.perfil,
      creci: user.creci,
    },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
};

router.post('/login', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const senha = req.body.senha;
  loginLog('email recebido', { email, hasPassword: !!senha });

  if (!email || !senha) {
    loginLog('retorno sem 401', { status: 400, motivo: 'email ou senha ausente' });
    return res.status(400).json({ error: 'Email e senha sao obrigatorios' });
  }

  const supabase = req.supabase;
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('email', email)
    .single();

  loginLog('resultado consulta Supabase', {
    hasData: !!data,
    error: error ? {
      code: error.code,
      message: error.message,
      details: error.details,
    } : null,
  });
  loginLog('perfil encontrado', { perfil: data ? data.perfil : null });
  loginLog('ativo', { ativo: data ? data.ativo : null });

  if (error || !data) {
    loginLog('retorno 401', {
      motivo: error ? 'consulta Supabase sem usuario valido' : 'usuario nao encontrado',
    });
    return res.status(401).json({ error: 'Credenciais invalidas' });
  }

  if (!data.ativo) {
    loginLog('retorno sem 401', { status: 403, motivo: 'usuario inativo' });
    return res.status(403).json({ error: 'Usuario inativo' });
  }

  const validPassword = await bcrypt.compare(senha, data.senha);
  loginLog('resultado bcrypt.compare', { validPassword });

  if (!validPassword) {
    loginLog('retorno 401', { motivo: 'senha invalida' });
    return res.status(401).json({ error: 'Credenciais invalidas' });
  }

  if (!process.env.JWT_SECRET) {
    loginLog('falha ao gerar token', { motivo: 'JWT_SECRET ausente' });
    return res.status(500).json({ error: 'Configuracao de autenticacao ausente' });
  }

  const token = generateToken(data);
  loginLog('token gerado', { userId: data.id, perfil: data.perfil });
  res.json({ token, user: publicUser(data) });
});

router.post('/register', async (req, res) => {
  const nome = String(req.body.nome || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const { senha, telefone, creci } = req.body;
  const perfil = String(req.body.perfil || '').trim();

  if (!nome || !email || !senha || !perfil) {
    return res.status(400).json({ error: 'Nome, email, senha e perfil sao obrigatorios' });
  }

  if (!ALLOWED_PROFILES.includes(perfil)) {
    return res.status(400).json({ error: 'Perfil invalido' });
  }

  const allowRegistration = process.env.ALLOW_REGISTRATION === 'true';
  const supabase = req.supabase;

  const { data: users, error: userError } = await supabase.from('usuarios').select('id').limit(1);
  if (userError) {
    return res.status(500).json({ error: 'Erro ao verificar usuarios' });
  }

  if (!allowRegistration && users && users.length > 0) {
    return res.status(403).json({ error: 'Cadastro nao permitido no momento' });
  }

  const passwordHash = await bcrypt.hash(senha, 10);
  const { data, error } = await supabase
    .from('usuarios')
    .insert([{ nome, email, senha: passwordHash, perfil, telefone, creci, ativo: true }])
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: 'Erro ao criar usuario', details: error.message });
  }

  const token = generateToken(data);
  res.status(201).json({ token, user: publicUser(data) });
});

module.exports = router;
