const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();
const ALLOWED_PROFILES = ['admin', 'corretor', 'crm'];
const SESSION_COOKIE = 'imoore_session';

const setSessionCookie = (req, res, token) => {
  const secure = req.secure || req.headers['x-forwarded-proto'] === 'https';
  const flags = [`${SESSION_COOKIE}=${encodeURIComponent(token)}`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=28800'];
  if (secure) flags.push('Secure');
  res.setHeader('Set-Cookie', flags.join('; '));
};

const clearSessionCookie = (req, res) => {
  const secure = req.secure || req.headers['x-forwarded-proto'] === 'https';
  const flags = [`${SESSION_COOKIE}=`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0'];
  if (secure) flags.push('Secure');
  res.setHeader('Set-Cookie', flags.join('; '));
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
  if (!email || !senha) {
    return res.status(400).json({ error: 'Email e senha sao obrigatorios' });
  }

  const supabase = req.supabase;
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !data) {
    return res.status(401).json({ error: 'Credenciais invalidas' });
  }

  if (!data.ativo) {
    return res.status(403).json({ error: 'Usuario inativo' });
  }

  const validPassword = await bcrypt.compare(senha, data.senha);
  if (!validPassword) {
    return res.status(401).json({ error: 'Credenciais invalidas' });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ error: 'Configuracao de autenticacao ausente' });
  }

  const token = generateToken(data);
  setSessionCookie(req, res, token);
  res.json({ user: publicUser(data) });
});

router.post('/logout', (req, res) => {
  clearSessionCookie(req, res);
  res.json({ message: 'Sessao encerrada' });
});

router.post('/register', authMiddleware, requireRole('admin'), async (req, res) => {
  const nome = String(req.body.nome || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const { senha, telefone, creci } = req.body;
  const perfil = String(req.body.perfil || '').trim();

  if (!nome || !email || !senha || !perfil) {
    return res.status(400).json({ error: 'Nome, email, senha e perfil sao obrigatorios' });
  }
  if (String(senha).length < 12) {
    return res.status(400).json({ error: 'A senha deve ter pelo menos 12 caracteres' });
  }

  if (!ALLOWED_PROFILES.includes(perfil)) {
    return res.status(400).json({ error: 'Perfil invalido' });
  }

  const supabase = req.supabase;

  const passwordHash = await bcrypt.hash(senha, 10);
  const { data, error } = await supabase
    .from('usuarios')
    .insert([{ nome, email, senha: passwordHash, perfil, telefone, creci, ativo: true }])
    .select()
    .single();

  if (error) {
    console.error('Falha ao criar usuario:', error.message);
    return res.status(500).json({ error: 'Erro ao criar usuario' });
  }

  const token = generateToken(data);
  setSessionCookie(req, res, token);
  res.status(201).json({ user: publicUser(data) });
});

router.get('/users', authMiddleware, requireRole('admin'), async (req, res) => {
  const { data, error } = await req.supabase
    .from('usuarios')
    .select('id,nome,email,perfil,telefone,creci,ativo,criado_em')
    .order('criado_em', { ascending: false });
  if (error) return res.status(500).json({ error: 'Erro ao listar usuarios' });
  res.json(data || []);
});

router.delete('/users/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  if (req.params.id === req.user.id) return res.status(400).json({ error: 'Nao e possivel excluir o proprio usuario' });
  const { error } = await req.supabase.from('usuarios').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: 'Erro ao excluir usuario' });
  res.json({ message: 'Usuario excluido' });
});

router.put('/me', authMiddleware, async (req, res) => {
  const updates = {};
  ['nome', 'telefone', 'creci'].forEach(field => {
    if (Object.prototype.hasOwnProperty.call(req.body, field)) updates[field] = String(req.body[field] || '').trim();
  });
  if (!Object.keys(updates).length) return res.status(400).json({ error: 'Nenhum dado para atualizar' });
  const { data, error } = await req.supabase.from('usuarios').update(updates).eq('id', req.user.id).select('id,nome,email,perfil,telefone,creci,ativo').single();
  if (error || !data) return res.status(500).json({ error: 'Erro ao atualizar perfil' });
  res.json(data);
});

router.post('/change-password', authMiddleware, async (req, res) => {
  const currentPassword = String(req.body.senhaAtual || '');
  const newPassword = String(req.body.novaSenha || '');
  if (!currentPassword || newPassword.length < 12) return res.status(400).json({ error: 'Informe a senha atual e uma nova senha com pelo menos 12 caracteres' });
  const { data: user, error: fetchError } = await req.supabase.from('usuarios').select('id,senha').eq('id', req.user.id).single();
  if (fetchError || !user) return res.status(404).json({ error: 'Usuario nao encontrado' });
  if (!await bcrypt.compare(currentPassword, user.senha)) return res.status(401).json({ error: 'Senha atual incorreta' });
  if (await bcrypt.compare(newPassword, user.senha)) return res.status(400).json({ error: 'A nova senha deve ser diferente da senha atual' });
  const passwordHash = await bcrypt.hash(newPassword, 12);
  const { error } = await req.supabase.from('usuarios').update({ senha: passwordHash, atualizado_em: new Date().toISOString() }).eq('id', req.user.id);
  if (error) return res.status(500).json({ error: 'Erro ao alterar senha' });
  res.json({ message: 'Senha alterada com sucesso' });
});

module.exports = router;
