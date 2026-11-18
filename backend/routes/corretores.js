const express = require('express');
const bcrypt = require('bcryptjs');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();
const STATUSES = ['pendente', 'aprovado', 'rejeitado', 'revogado'];
const normalize = value => String(value || '').trim();

const publicCandidate = candidate => ({
  id: candidate.id,
  nome: candidate.nome,
  telefone: candidate.telefone,
  email: candidate.email,
  creci: candidate.creci,
  cidade: candidate.cidade,
  experiencia: candidate.experiencia,
  imobiliaria: candidate.imobiliaria,
  aceite_lgpd: candidate.aceite_lgpd,
  consentimento_versao: candidate.consentimento_versao,
  consentimento_em: candidate.consentimento_em,
  status: candidate.status,
  criado_em: candidate.criado_em,
});

router.post('/public', async (req, res) => {
  const nome = normalize(req.body.nome);
  const telefone = normalize(req.body.telefone);
  const email = normalize(req.body.email).toLowerCase();
  const creci = normalize(req.body.creci);
  const cidade = normalize(req.body.cidade);
  const aceiteLgpd = req.body.aceite_lgpd === true || req.body.aceite_lgpd === 'true';

  if (!nome || !telefone || !email || !creci || !cidade) {
    return res.status(400).json({ error: 'Nome, WhatsApp, e-mail, Creci/SP e cidade sao obrigatorios' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Informe um e-mail valido' });
  }
  if (!aceiteLgpd) {
    return res.status(400).json({ error: 'O consentimento LGPD e obrigatorio' });
  }

  const now = new Date().toISOString();
  const payload = {
    nome,
    telefone,
    email,
    creci,
    cidade,
    experiencia: normalize(req.body.experiencia),
    imobiliaria: normalize(req.body.imobiliaria),
    cnpj: normalize(req.body.cnpj) || null,
    endereco: normalize(req.body.endereco) || null,
    aceite_lgpd: true,
    aceite_contato: req.body.aceite_contato !== false && req.body.aceite_contato !== 'false',
    consentimento_versao: normalize(req.body.consentimento_versao) || 'lgpd-corretor-v1',
    consentimento_em: now,
    status: 'pendente',
  };

  const { data, error } = await req.supabase
    .from('corretor_candidaturas')
    .insert([payload])
    .select()
    .single();
  if (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Ja existe uma candidatura com este e-mail' });
    return res.status(500).json({ error: 'Nao foi possivel registrar a candidatura' });
  }
  return res.status(201).json({ candidatura: publicCandidate(data) });
});

router.get('/', authMiddleware, requireRole('admin'), async (req, res) => {
  const status = normalize(req.query.status);
  let query = req.supabase.from('corretor_candidaturas').select('*').order('criado_em', { ascending: false });
  if (status && STATUSES.includes(status)) query = query.eq('status', status);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: 'Nao foi possivel carregar as candidaturas' });
  return res.json(data.map(publicCandidate));
});

router.post('/:id/aprovar', authMiddleware, requireRole('admin'), async (req, res) => {
  const senha = normalize(req.body.senha_temporaria);
  if (senha.length < 16) return res.status(400).json({ error: 'A senha temporaria deve ter no minimo 16 caracteres' });

  const { data: candidate, error: candidateError } = await req.supabase
    .from('corretor_candidaturas').select('*').eq('id', req.params.id).single();
  if (candidateError || !candidate) return res.status(404).json({ error: 'Candidatura nao encontrada' });
  if (candidate.status !== 'pendente') return res.status(409).json({ error: 'A candidatura nao esta pendente' });

  const senhaHash = await bcrypt.hash(senha, 12);
  const now = new Date().toISOString();
  const { data: user, error: userError } = await req.supabase.from('usuarios').insert([{
    nome: candidate.nome,
    email: candidate.email,
    senha: senhaHash,
    perfil: 'corretor',
    creci: candidate.creci,
    telefone: candidate.telefone,
    ativo: true,
    status: 'aprovado',
    senha_troca_obrigatoria: true,
    atualizado_em: now,
  }]).select('id,nome,email,perfil,creci,status').single();
  if (userError) {
    if (userError.code === '23505') return res.status(409).json({ error: 'Ja existe uma conta com este e-mail' });
    return res.status(500).json({ error: 'Nao foi possivel criar a conta do corretor' });
  }

  const { data: updated, error: updateError } = await req.supabase.from('corretor_candidaturas')
    .update({ status: 'aprovado', usuario_id: user.id, revisado_por: req.user.id, revisado_em: now, atualizado_em: now })
    .eq('id', candidate.id).eq('status', 'pendente').select().single();
  if (updateError || !updated) {
    await req.supabase.from('usuarios').delete().eq('id', user.id);
    return res.status(500).json({ error: 'Nao foi possivel concluir a aprovacao da candidatura' });
  }
  return res.json({ candidatura: publicCandidate(updated), usuario: user });
});

router.post('/:id/rejeitar', authMiddleware, requireRole('admin'), async (req, res) => {
  const motivo = normalize(req.body.motivo);
  if (!motivo) return res.status(400).json({ error: 'Informe o motivo da rejeicao' });
  const now = new Date().toISOString();
  const { data, error } = await req.supabase.from('corretor_candidaturas')
    .update({ status: 'rejeitado', motivo_rejeicao: motivo, revisado_por: req.user.id, revisado_em: now })
    .eq('id', req.params.id).eq('status', 'pendente').select().single();
  if (error) return res.status(500).json({ error: 'Nao foi possivel rejeitar a candidatura' });
  if (!data) return res.status(404).json({ error: 'Candidatura pendente nao encontrada' });
  return res.json({ candidatura: publicCandidate(data) });
});

module.exports = router;
