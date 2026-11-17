const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authMiddleware, requireRole } = require('../middleware/auth');

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
  status: user.status || (user.perfil === 'corretor' ? 'pendente' : 'aprovado'),
  senha_troca_obrigatoria: user.senha_troca_obrigatoria === true,
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
    const { data: applications } = await supabase
      .from('corretor_candidaturas')
      .select('status')
      .eq('email', email)
      .order('criado_em', { ascending: false })
      .limit(1);
    const applicationStatus = applications?.[0]?.status;
    if (applicationStatus === 'pendente') {
      return res.status(403).json({ error: 'Cadastro de corretor aguardando aprovacao' });
    }
    if (applicationStatus === 'rejeitado' || applicationStatus === 'revogado') {
      return res.status(403).json({ error: 'Cadastro de corretor nao aprovado' });
    }
    loginLog('retorno 401', {
      motivo: error ? 'consulta Supabase sem usuario valido' : 'usuario nao encontrado',
    });
    return res.status(401).json({ error: 'Credenciais invalidas' });
  }

  if (!data.ativo) {
    loginLog('retorno sem 401', { status: 403, motivo: 'usuario inativo' });
    return res.status(403).json({ error: 'Usuario inativo' });
  }

  if (data.perfil === 'corretor' && data.status !== 'aprovado') {
    return res.status(403).json({
      error: data.status === 'rejeitado'
        ? 'Cadastro de corretor nao aprovado'
        : 'Cadastro de corretor aguardando aprovacao',
    });
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

router.post('/register', authMiddleware, requireRole('admin'), async (req, res) => {
  const nome = String(req.body.nome || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const { senha, telefone, creci } = req.body;
  const perfil = String(req.body.perfil || '').trim();

  if (!nome || !email || !senha || senha.length < 12 || !perfil) {
    return res.status(400).json({ error: 'Nome, email, senha (minimo 12 caracteres) e perfil sao obrigatorios' });
  }

  if (!ALLOWED_PROFILES.includes(perfil)) {
    return res.status(400).json({ error: 'Perfil invalido' });
  }

  const supabase = req.supabase;

  const passwordHash = await bcrypt.hash(senha, 10);
  const { data, error } = await supabase
    .from('usuarios')
    .insert([{ nome, email, senha: passwordHash, perfil, telefone, creci, ativo: true, status: perfil === 'corretor' ? 'pendente' : 'aprovado' }])
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: 'Erro ao criar usuario', details: error.message });
  }

  res.status(201).json({ user: publicUser(data) });
});

router.get('/me', authMiddleware, (req, res) => res.json(publicUser(req.user)));

router.post('/change-password', authMiddleware, async (req, res) => {
  const senhaAtual = String(req.body.senha_atual || '');
  const novaSenha = String(req.body.nova_senha || '');
  if (novaSenha.length < 16) return res.status(400).json({ error: 'A nova senha deve ter no minimo 16 caracteres' });
  const { data: user, error: userError } = await req.supabase.from('usuarios').select('senha').eq('id', req.user.id).single();
  if (userError || !user || !(await bcrypt.compare(senhaAtual, user.senha))) {
    return res.status(401).json({ error: 'Senha atual invalida' });
  }
  const senhaHash = await bcrypt.hash(novaSenha, 12);
  const { error } = await req.supabase.from('usuarios').update({ senha: senhaHash, senha_troca_obrigatoria: false, atualizado_em: new Date().toISOString() }).eq('id', req.user.id);
  if (error) return res.status(500).json({ error: 'Nao foi possivel atualizar a senha' });
  return res.json({ message: 'Senha atualizada com sucesso' });
});

module.exports = router;
