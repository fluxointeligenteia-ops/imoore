const express = require('express');
const path = require('path');
const multer = require('multer');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 5,
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      return cb(new Error('Apenas arquivos de imagem sao permitidos'));
    }
    cb(null, true);
  },
});

const uploadFotos = (req, res, next) => {
  upload.array('fotos', 5)(req, res, (error) => {
    if (!error) return next();
    if (error instanceof multer.MulterError) {
      const message = error.code === 'LIMIT_UNEXPECTED_FILE' || error.code === 'LIMIT_FILE_COUNT'
        ? 'Envie no máximo 5 fotos'
        : error.message;
      return res.status(400).json({ error: message });
    }
    return res.status(400).json({ error: error.message || 'Erro ao processar fotos' });
  });
};

const PUBLIC_STATUSES = ['publicado'];
const ALLOWED_MUTATION_FIELDS = [
  'titulo',
  'tipo',
  'finalidade',
  'preco',
  'cidade',
  'bairro',
  'quartos',
  'banheiros',
  'vagas',
  'area',
  'descricao',
  'fotos',
];

const normalizeNumber = (value) => {
  if (value === '' || value == null) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const normalized = String(value).replace(/\./g, '').replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const sanitizePropertyPayload = (body) => {
  const payload = {};
  ALLOWED_MUTATION_FIELDS.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      payload[field] = body[field];
    }
  });

  ['preco', 'area'].forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      payload[field] = normalizeNumber(payload[field]);
    }
  });

  ['quartos', 'banheiros', 'vagas'].forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      const parsed = Number.parseInt(payload[field], 10);
      payload[field] = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    }
  });

  return payload;
};

const validateRequiredFields = (payload) => {
  const requiredFields = ['titulo', 'tipo', 'finalidade', 'preco', 'cidade'];
  const missing = requiredFields.filter((field) => payload[field] == null || payload[field] === '');
  if (missing.length > 0) {
    return `Campos obrigatorios ausentes: ${missing.join(', ')}`;
  }
  if (payload.preco == null || payload.preco <= 0) {
    return 'Preco deve ser um numero maior que zero';
  }
  return null;
};

const parseFotosField = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [value].filter(Boolean);
    } catch (error) {
      return [value].filter(Boolean);
    }
  }
  return [];
};

const getStorageBucket = () => process.env.SUPABASE_BUCKET || 'imoveis';

const uploadPropertyPhotos = async (supabase, files = []) => {
  if (!files.length) return [];

  const bucket = getStorageBucket();
  const uploadedUrls = [];

  for (const file of files) {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    const storagePath = `imoveis/${safeName}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      throw new Error(`Falha ao enviar foto para o bucket "${bucket}": ${error.message}`);
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
    if (data?.publicUrl) uploadedUrls.push(data.publicUrl);
  }

  return uploadedUrls;
};

const applyVisibilityFilter = (query, user) => {
  if (!user) {
    return query.in ? query.in('status', PUBLIC_STATUSES) : query.eq('status', 'publicado');
  }

  if (user.perfil === 'admin') return query;
  if (user.perfil === 'corretor') return query.eq('corretor_id', user.id);
  return query.eq('status', 'publicado');
};

const getOptionalUser = async (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  await new Promise((resolve) => {
    authMiddleware(req, { status: () => ({ json: () => resolve() }) }, resolve);
  });

  return req.user || null;
};

router.get('/', async (req, res) => {
  const supabase = req.supabase;
  const user = await getOptionalUser(req);
  let query = supabase.from('imoveis').select('*').order('criado_em', { ascending: false });
  query = applyVisibilityFilter(query, user);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  res.json(data);
});

router.get('/:id', async (req, res) => {
  const supabase = req.supabase;
  const user = await getOptionalUser(req);
  let query = supabase.from('imoveis').select('*').eq('id', req.params.id);
  query = applyVisibilityFilter(query, user);

  const { data, error } = await query.single();
  if (error || !data) {
    return res.status(404).json({ error: 'Imovel nao encontrado' });
  }

  res.json(data);
});

router.post('/', uploadFotos, async (req, res) => {
  const supabase = req.supabase;
  const user = await getOptionalUser(req);
  if (user && !['admin', 'corretor'].includes(user.perfil)) {
    return res.status(403).json({ error: 'Permissao negada' });
  }

  const payload = sanitizePropertyPayload(req.body);
  const validationError = validateRequiredFields(payload);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const fotosExistentes = parseFotosField(payload.fotos);
  const fotosRecebidas = req.files || [];
  if (fotosExistentes.length + fotosRecebidas.length > 5) {
    return res.status(400).json({ error: 'Envie no maximo 5 fotos' });
  }

  payload.status = 'pendente';
  if (user) {
    payload.corretor_id = user.perfil === 'corretor' ? user.id : req.body.corretor_id || user.id;
  } else if (req.body.corretor_id) {
    payload.corretor_id = req.body.corretor_id;
  }

  try {
    payload.fotos = [
      ...fotosExistentes,
      ...await uploadPropertyPhotos(supabase, fotosRecebidas),
    ];
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }

  const { data, error } = await supabase
    .from('imoveis')
    .insert([payload])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  res.status(201).json(data);
});

router.put('/:id', authMiddleware, requireRole('admin', 'corretor'), async (req, res) => {
  const supabase = req.supabase;
  const updates = sanitizePropertyPayload(req.body);
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'Nenhum campo permitido para atualizar' });
  }

  let query = supabase.from('imoveis').update(updates).eq('id', req.params.id);
  if (req.user.perfil === 'corretor') {
    query = query.eq('corretor_id', req.user.id).eq('status', 'pendente');
  }

  const { data, error } = await query.select().single();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Imovel nao encontrado ou bloqueado para edicao' });

  res.json(data);
});

router.delete('/:id', authMiddleware, requireRole('admin', 'corretor'), async (req, res) => {
  const supabase = req.supabase;
  let query = supabase.from('imoveis').delete().eq('id', req.params.id);
  if (req.user.perfil === 'corretor') {
    query = query.eq('corretor_id', req.user.id).eq('status', 'pendente');
  }

  const { error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  res.json({ message: 'Imovel deletado' });
});

router.post('/:id/aprovar', authMiddleware, requireRole('admin'), async (req, res) => {
  const supabase = req.supabase;
  const { data, error } = await supabase
    .from('imoveis')
    .update({
      status: 'publicado',
      atualizado_em: new Date().toISOString(),
    })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Imovel nao encontrado' });

  res.json(data);
});

router.post('/:id/rejeitar', authMiddleware, requireRole('admin'), async (req, res) => {
  const supabase = req.supabase;
  const { data, error } = await supabase
    .from('imoveis')
    .update({
      status: 'rejeitado',
      atualizado_em: new Date().toISOString(),
    })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Imovel nao encontrado' });

  res.json(data);
});

module.exports = router;
