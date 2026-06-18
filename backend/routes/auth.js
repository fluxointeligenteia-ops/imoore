const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const router = express.Router();
const ALLOWED_PROFILES = ['admin', 'corretor', 'crm'];

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

  const token = generateToken(data);
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
