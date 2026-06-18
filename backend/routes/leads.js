const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  const supabase = req.supabase;
  const { data, error } = await supabase.from('leads').select('*').order('criado_em', { ascending: false });
  if (error) {
    return res.status(500).json({ error: 'Erro ao buscar leads' });
  }
  res.json(data);
});

router.get('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const supabase = req.supabase;
  const { data, error } = await supabase.from('leads').select('*').eq('id', id).single();
  if (error || !data) {
    return res.status(404).json({ error: 'Lead não encontrado' });
  }
  res.json(data);
});

router.post('/public', async (req, res) => {
  const { nome, telefone, email, cidade, interesse, observacoes } = req.body;
  if (!nome || !telefone) {
    return res.status(400).json({ error: 'Nome e telefone sao obrigatorios' });
  }

  const supabase = req.supabase;
  const payload = {
    nome,
    telefone,
    email,
    cidade,
    interesse: interesse || 'site',
    observacoes,
    etapa: 'novo',
    historico: [
      {
        descricao: 'Lead captado pelo site publico',
        criado_em: new Date().toISOString(),
        autor: 'site',
      },
    ],
  };

  const { data, error } = await supabase.from('leads').insert([payload]).select().single();
  if (error) {
    return res.status(500).json({ error: 'Erro ao criar lead', details: error.message });
  }

  res.status(201).json(data);
});

router.post('/', authMiddleware, requireRole('admin', 'corretor', 'crm'), async (req, res) => {
  const { nome, telefone, email, cidade, interesse, observacoes, etapa } = req.body;
  if (!nome) {
    return res.status(400).json({ error: 'Nome é obrigatório' });
  }

  const supabase = req.supabase;
  const payload = {
    nome,
    telefone,
    email,
    cidade,
    interesse,
    observacoes,
    etapa: etapa || 'novo',
    historico: [],
  };

  const { data, error } = await supabase.from('leads').insert([payload]).select().single();
  if (error) {
    return res.status(500).json({ error: 'Erro ao criar lead', details: error.message });
  }

  res.status(201).json(data);
});

router.put('/:id', authMiddleware, requireRole('admin', 'corretor', 'crm'), async (req, res) => {
  const { id } = req.params;
  const updates = { ...req.body, atualizado_em: new Date().toISOString() };
  const supabase = req.supabase;

  const { data, error } = await supabase.from('leads').update(updates).eq('id', id).select().single();
  if (error) {
    return res.status(500).json({ error: 'Erro ao atualizar lead', details: error.message });
  }

  if (!data) {
    return res.status(404).json({ error: 'Lead não encontrado' });
  }

  res.json(data);
});

router.delete('/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  const supabase = req.supabase;
  const { error } = await supabase.from('leads').delete().eq('id', id);
  if (error) {
    return res.status(500).json({ error: 'Erro ao excluir lead', details: error.message });
  }

  res.json({ message: 'Lead excluído com sucesso' });
});

router.post('/:id/historico', authMiddleware, requireRole('admin', 'corretor', 'crm'), async (req, res) => {
  const { id } = req.params;
  const { descricao } = req.body;
  if (!descricao) {
    return res.status(400).json({ error: 'Descrição de histórico é obrigatória' });
  }

  const supabase = req.supabase;
  const { data: lead, error: fetchError } = await supabase.from('leads').select('*').eq('id', id).single();
  if (fetchError || !lead) {
    return res.status(404).json({ error: 'Lead não encontrado' });
  }

  const historico = Array.isArray(lead.historico) ? lead.historico : [];
  historico.push({ descricao, criado_em: new Date().toISOString(), autor: req.user.email });

  const { data, error } = await supabase
    .from('leads')
    .update({ historico, atualizado_em: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) {
    return res.status(500).json({ error: 'Erro ao adicionar histórico', details: error.message });
  }

  res.json(data);
});

module.exports = router;
