const express = require('express');
const path = require('path');
const multer = require('multer');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();
const ALLOWED_LEAD_UPDATE_FIELDS = ['nome', 'telefone', 'email', 'cidade', 'interesse', 'observacoes', 'etapa'];
const getLeadsBucket = () => process.env.SUPABASE_LEADS_BUCKET || 'leads-private';
let leadsBucketReady;

const ensureLeadsBucket = async (supabase) => {
  if (leadsBucketReady) return leadsBucketReady;
  leadsBucketReady = (async () => {
    if (supabase.storage?.createBucket) {
      const { error } = await supabase.storage.createBucket(getLeadsBucket(), { public: false });
      if (error && !/already exists|duplicate/i.test(error.message || '')) throw error;
    }
  })();
  try {
    await leadsBucketReady;
  } catch (error) {
    leadsBucketReady = null;
    throw error;
  }
};

const signLeadAttachmentUrls = async (supabase, lead) => {
  if (!lead || !lead.observacoes || !supabase.storage?.from) return lead;
  const bucketStore = supabase.storage.from(getLeadsBucket());
  if (!bucketStore?.createSignedUrl) return lead;
  const lines = String(lead.observacoes).split(/\r?\n/);
  const updated = await Promise.all(lines.map(async (line) => {
    const match = line.match(/\bpath:([^\s|]+)/i);
    if (!match) return line;
    const { data, error } = await bucketStore.createSignedUrl(match[1], 3600);
    return error || !data?.signedUrl ? line : line.replace(match[0], data.signedUrl);
  }));
  return { ...lead, observacoes: updated.join('\n') };
};
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 8,
  },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) return cb(new Error('Apenas fotos JPG, PNG ou WEBP sao permitidas'));
    cb(null, true);
  },
});

const uploadLeadFiles = (req, res, next) => {
  upload.array('arquivos', 8)(req, res, (error) => {
    if (!error) {
      const valid = (req.files || []).every(file => {
        const buffer = file.buffer || Buffer.alloc(0);
        const jpeg = buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
        const png = buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]));
        const webp = buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
        return jpeg || png || webp;
      });
      if (!valid) return res.status(400).json({ error: 'Uma ou mais fotos possuem conteudo invalido' });
      return next();
    }
    if (error instanceof multer.MulterError) {
      const message = error.code === 'LIMIT_UNEXPECTED_FILE' || error.code === 'LIMIT_FILE_COUNT'
        ? 'Envie no maximo 8 arquivos'
        : error.message;
      return res.status(400).json({ error: message });
    }
    return res.status(400).json({ error: error.message || 'Erro ao processar arquivos' });
  });
};

const getStorageBucket = () => process.env.SUPABASE_BUCKET || 'imoveis';

const uploadLeadAttachments = async (supabase, files = []) => {
  if (!files.length) return [];
  const bucket = getLeadsBucket();
  await ensureLeadsBucket(supabase);
  const attachments = [];

  try {
  for (const file of files) {
    const ext = path.extname(file.originalname || '').toLowerCase() || (file.mimetype === 'application/pdf' ? '.pdf' : '.jpg');
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    const storagePath = `leads/${safeName}`;
    const { error } = await supabase.storage
      .from(bucket)
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      throw new Error(`Falha ao enviar anexo para o bucket "${bucket}": ${error.message}`);
    }

    attachments.push({
      nome: file.originalname || safeName,
      tipo: file.mimetype,
      path: storagePath,
    });
  }
  } catch (error) {
    const paths = attachments.map(item => item.path).filter(Boolean);
    if (paths.length) await supabase.storage.from(bucket).remove(paths);
    throw error;
  }

  return attachments;
};

router.get('/', authMiddleware, async (req, res) => {
  if (req.user.perfil === 'corretor') return res.json([]);
  if (!['admin', 'crm'].includes(req.user.perfil)) return res.status(403).json({ error: 'Permissao negada' });
  const supabase = req.supabase;
  const { data, error } = await supabase.from('leads').select('*').order('criado_em', { ascending: false });
  if (error) {
    return res.status(500).json({ error: 'Erro ao buscar leads' });
  }
  res.json(data);
});

router.get('/:id', authMiddleware, async (req, res) => {
  if (!['admin', 'crm'].includes(req.user.perfil)) return res.status(403).json({ error: 'Permissao negada' });
  const { id } = req.params;
  const supabase = req.supabase;
  const { data, error } = await supabase.from('leads').select('*').eq('id', id).single();
  if (error || !data) {
    return res.status(404).json({ error: 'Lead não encontrado' });
  }
  res.json(await signLeadAttachmentUrls(supabase, data));
});

router.post('/public', uploadLeadFiles, async (req, res) => {
  const { nome, telefone, email, cidade, interesse, observacoes } = req.body;
  if (!nome || !telefone) {
    return res.status(400).json({ error: 'Nome e telefone sao obrigatorios' });
  }
  const phoneDigits = String(telefone).replace(/\D/g, '');
  if (phoneDigits.length < 10 || phoneDigits.length > 13) {
    return res.status(400).json({ error: 'Telefone invalido' });
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
    return res.status(400).json({ error: 'E-mail invalido' });
  }

  const supabase = req.supabase;
  let anexos = [];
  try {
    anexos = await uploadLeadAttachments(supabase, req.files || []);
  } catch (error) {
    console.error('Falha ao processar anexos do lead:', error.message);
    return res.status(500).json({ error: 'Erro ao processar anexos' });
  }

  const observacoesComAnexos = [
    observacoes || '',
    anexos.length
      ? [
        'Anexos enviados:',
        ...anexos.map((anexo, index) => `${index + 1}. ${anexo.nome} | ${anexo.tipo} | path:${anexo.path}`),
      ].join('\n')
      : '',
  ].filter(Boolean).join('\n\n');

  const payload = {
    nome,
    telefone,
    email,
    cidade,
    interesse: interesse || 'site',
    observacoes: observacoesComAnexos,
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
    const paths = anexos.map(item => item.path).filter(Boolean);
    if (paths.length) await supabase.storage.from(getLeadsBucket()).remove(paths);
    console.error('Falha ao criar lead publico:', error.message);
    return res.status(500).json({ error: 'Erro ao criar lead' });
  }

  res.status(201).json(await signLeadAttachmentUrls(supabase, data));
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
    console.error('Falha ao criar lead autenticado:', error.message);
    return res.status(500).json({ error: 'Erro ao criar lead' });
  }

  res.status(201).json(data);
});

router.put('/:id', authMiddleware, requireRole('admin', 'crm'), async (req, res) => {
  const { id } = req.params;
  const updates = {};
  ALLOWED_LEAD_UPDATE_FIELDS.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(req.body || {}, field)) updates[field] = req.body[field];
  });
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'Nenhum campo permitido para atualizar' });
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'etapa')
      && !['novo', 'contato', 'visita', 'proposta', 'fechado'].includes(String(updates.etapa))) {
    return res.status(400).json({ error: 'Etapa invalida' });
  }
  updates.atualizado_em = new Date().toISOString();
  const supabase = req.supabase;

  const { data, error } = await supabase.from('leads').update(updates).eq('id', id).select().single();
  if (error) {
    console.error('Falha ao atualizar lead:', error.message);
    return res.status(500).json({ error: 'Erro ao atualizar lead' });
  }

  if (!data) {
    return res.status(404).json({ error: 'Lead não encontrado' });
  }

  res.json(await signLeadAttachmentUrls(supabase, data));
});

router.delete('/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  const supabase = req.supabase;
  const { error } = await supabase.from('leads').delete().eq('id', id);
  if (error) {
    console.error('Falha ao excluir lead:', error.message);
    return res.status(500).json({ error: 'Erro ao excluir lead' });
  }

  res.json({ message: 'Lead excluído com sucesso' });
});

router.post('/:id/historico', authMiddleware, requireRole('admin', 'crm'), async (req, res) => {
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
    console.error('Falha ao adicionar historico do lead:', error.message);
    return res.status(500).json({ error: 'Erro ao adicionar historico' });
  }

  res.json(data);
});

module.exports = router;
