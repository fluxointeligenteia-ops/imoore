const express = require('express');
const bcrypt = require('bcryptjs');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();
const CONSENT_VERSION = 'corretor-2026-01';
const clean = (value, max = 250) => String(value || '').trim().slice(0, max);

router.post('/public', async (req, res) => {
  const nome = clean(req.body.nome, 160);
  const telefone = clean(req.body.telefone, 40);
  const email = clean(req.body.email, 254).toLowerCase();
  const creci = clean(req.body.creci, 60);
  const cidade = clean(req.body.cidade, 100);
  const experiencia = clean(req.body.experiencia, 100);
  const imobiliaria = clean(req.body.imobiliaria, 160);
  const aceiteAviso = req.body.aceite_aviso === true;
  if (!nome || !telefone || !email || !creci || !cidade) {
    return res.status(400).json({ error: 'Preencha nome, telefone, e-mail, CRECI e cidade.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Informe um e-mail valido.' });
  }
  if (!aceiteAviso) return res.status(400).json({ error: 'Leia e confirme a ciencia do Aviso de Privacidade.' });

  const now = new Date().toISOString();
  const { data, error } = await req.supabase.from('corretor_candidaturas').insert([{
    nome, telefone, email, creci, cidade, experiencia: experiencia || null,
    imobiliaria: imobiliaria || null,
    aceite_aviso: true,
    aceite_contato: req.body.aceite_contato === true,
    consentimento_versao: CONSENT_VERSION,
    consentimento_em: now,
    status: 'pendente',
  }]).select('id').single();
  if (error) return res.status(500).json({ error: 'Nao foi possivel registrar a candidatura.' });
  res.status(201).json({ id: data.id, status: 'pendente' });
});

router.get('/', authMiddleware, requireRole('admin'), async (req, res) => {
  const { data, error } = await req.supabase.from('corretor_candidaturas')
    .select('id,nome,telefone,email,creci,cidade,experiencia,imobiliaria,aceite_aviso,aceite_contato,consentimento_versao,consentimento_em,status,criado_em,revisado_em,motivo_rejeicao')
    .order('criado_em', { ascending: false });
  if (error) return res.status(500).json({ error: 'Erro ao carregar candidaturas.' });
  res.setHeader('Cache-Control', 'private, no-store');
  res.json(data || []);
});

router.post('/:id/aprovar', authMiddleware, requireRole('admin'), async (req, res) => {
  const senha = String(req.body.senha_temporaria || '');
  if (senha.length < 12) return res.status(400).json({ error: 'Defina uma senha temporaria com pelo menos 12 caracteres.' });
  const { data: application, error: fetchError } = await req.supabase.from('corretor_candidaturas')
    .select('*').eq('id', req.params.id).single();
  if (fetchError || !application) return res.status(404).json({ error: 'Candidatura nao encontrada.' });
  if (application.status !== 'pendente') return res.status(409).json({ error: 'A candidatura ja foi revisada.' });

  const passwordHash = await bcrypt.hash(senha, 12);
  const now = new Date().toISOString();
  const { data: user, error: userError } = await req.supabase.from('usuarios').upsert({
    nome: application.nome, email: application.email, telefone: application.telefone,
    creci: application.creci, senha: passwordHash, perfil: 'corretor', ativo: true,
    status: 'aprovado', aceite_lgpd: application.aceite_aviso,
    aceite_contato: application.aceite_contato,
    aceite_lgpd_em: application.consentimento_em,
    atualizado_em: now, aprovado_em: now,
  }, { onConflict: 'email' }).select('id').single();
  if (userError) return res.status(500).json({ error: 'Nao foi possivel provisionar a conta do corretor.' });

  const { error: updateError } = await req.supabase.from('corretor_candidaturas').update({
    status: 'aprovado', revisado_em: now, revisado_por: req.user.id, usuario_id: user.id,
  }).eq('id', application.id).eq('status', 'pendente');
  if (updateError) return res.status(500).json({ error: 'Conta criada, mas nao foi possivel atualizar a candidatura.' });
  res.json({ id: application.id, status: 'aprovado', usuario_id: user.id });
});

router.post('/:id/rejeitar', authMiddleware, requireRole('admin'), async (req, res) => {
  const now = new Date().toISOString();
  const { data, error } = await req.supabase.from('corretor_candidaturas').update({
    status: 'rejeitado', revisado_em: now, revisado_por: req.user.id,
    motivo_rejeicao: clean(req.body.motivo, 500) || null,
  }).eq('id', req.params.id).eq('status', 'pendente').select('id,status').single();
  if (error || !data) return res.status(404).json({ error: 'Candidatura pendente nao encontrada.' });
  res.json(data);
});

module.exports = router;
