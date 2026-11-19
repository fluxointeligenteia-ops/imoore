const express = require('express');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const multer = require('multer');
const { authMiddleware, requireRole, getRequestToken } = require('../middleware/auth');

const router = express.Router();
const WATERMARK_PATH = path.resolve(__dirname, '../../frontend/assets/imoore-watermark-padrao-creci.png');
// Marca dagua discreta: protege a foto sem disputar atencao com o imovel.
const WATERMARK_WIDTH_RATIO = Number.parseFloat(process.env.WATERMARK_WIDTH_RATIO || '0.50');
const WATERMARK_MAX_WIDTH = Number.parseInt(process.env.WATERMARK_MAX_WIDTH || '1000', 10);
const WATERMARK_MIN_WIDTH = Number.parseInt(process.env.WATERMARK_MIN_WIDTH || '140', 10);
const WATERMARK_OPACITY = Number.parseFloat(process.env.WATERMARK_OPACITY || '0.48');
const WATERMARK_VERTICAL_CENTER = Number.parseFloat(process.env.WATERMARK_VERTICAL_CENTER || '0.68');
const WATERMARK_SAFE_MARGIN_RATIO = Number.parseFloat(process.env.WATERMARK_SAFE_MARGIN_RATIO || '0.055');

let sharpModule;
const getSharp = () => {
  if (sharpModule !== undefined) return sharpModule;
  try {
    sharpModule = require('sharp');
  } catch (error) {
    sharpModule = null;
  }
  return sharpModule;
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 8,
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      return cb(new Error('Apenas arquivos de imagem sao permitidos'));
    }
    cb(null, true);
  },
});

const uploadFotos = (req, res, next) => {
  upload.array('fotos', 8)(req, res, (error) => {
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
        ? 'Envie no máximo 8 fotos'
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
  'captacao',
  'referencia_interna',
  'vitrine_status',
  'vitrine_prioridade',
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

const CAPTACAO_PREFIX = 'Captação:';
const VITRINE_PREFIX = 'ImooreVitrine:';
const VITRINE_STATUSES = new Set(['destaque', 'normal', 'segundo_plano', 'oculto_home']);

const normalizeVitrineStatus = (value) => {
  const normalized = String(value || 'normal').trim().toLowerCase();
  return VITRINE_STATUSES.has(normalized) ? normalized : 'normal';
};

const normalizeVitrinePrioridade = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.max(-999, Math.min(999, parsed)) : 0;
};

const getVitrineFromDescription = (description) => {
  const line = String(description || '').split(/\r?\n/).find((item) => item.trim().startsWith(VITRINE_PREFIX));
  if (!line) return { status: 'normal', prioridade: 0 };
  try {
    const parsed = JSON.parse(line.trim().slice(VITRINE_PREFIX.length).trim());
    return {
      status: normalizeVitrineStatus(parsed.status),
      prioridade: normalizeVitrinePrioridade(parsed.prioridade),
    };
  } catch (error) {
    return { status: 'normal', prioridade: 0 };
  }
};

const stripVitrineFromDescription = (description) => String(description || '')
  .split(/\r?\n/)
  .filter((line) => !line.trim().startsWith(VITRINE_PREFIX))
  .join('\n')
  .trim();

const setVitrineInDescription = (description, vitrine = {}) => {
  const status = normalizeVitrineStatus(vitrine.status);
  const prioridade = normalizeVitrinePrioridade(vitrine.prioridade);
  const base = stripVitrineFromDescription(description);
  const lines = base ? base.split(/\r?\n/) : [];
  if (status !== 'normal' || prioridade !== 0) {
    lines.push(`${VITRINE_PREFIX} ${JSON.stringify({ status, prioridade })}`);
  }
  return lines.join('\n').trim();
};

const getCaptacaoFromDescription = (description) => {
  const line = String(description || '').split(/\r?\n/).find((item) => item.trim().startsWith(CAPTACAO_PREFIX));
  return line ? line.trim().slice(CAPTACAO_PREFIX.length).trim() : '';
};

const setCaptacaoInDescription = (description, captacao) => {
  const lines = String(description || '')
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith(CAPTACAO_PREFIX));
  const value = String(captacao || '').trim();
  if (value) lines.push(`${CAPTACAO_PREFIX} ${value}`);
  return lines.join('\n').trim();
};

const INTERNAL_REFERENCE_PREFIX = '[[IMOORE_REF_INTERNA]]';

const getInternalReferenceFromDescription = (description) => {
  const line = String(description || '').split(/\r?\n/)
    .find((item) => item.trim().startsWith(INTERNAL_REFERENCE_PREFIX));
  return line ? line.trim().slice(INTERNAL_REFERENCE_PREFIX.length).trim() : '';
};

const stripInternalReferenceFromDescription = (description) => String(description || '')
  .split(/\r?\n/)
  .filter((line) => !line.trim().startsWith(INTERNAL_REFERENCE_PREFIX))
  .join('\n')
  .trim();

const setInternalReferenceInDescription = (description, reference) => {
  const clean = stripInternalReferenceFromDescription(description);
  const lines = clean ? clean.split(/\r?\n/) : [];
  const value = String(reference || '').trim().slice(0, 80);
  if (value) lines.push(`${INTERNAL_REFERENCE_PREFIX} ${value}`);
  return lines.join('\n').trim();
};

const getStorageBucket = () => process.env.SUPABASE_BUCKET || 'imoveis';

const isAllowedStoragePhotoUrl = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return false;
  if (/^\/?uploads\//i.test(raw)) return true;
  if (!/^https?:\/\//i.test(raw) && !/^data:/i.test(raw) && !raw.startsWith('//')) {
    return !raw.includes('..') && !raw.startsWith('/');
  }
  try {
    const url = new URL(raw);
    const configured = process.env.SUPABASE_URL ? new URL(process.env.SUPABASE_URL) : null;
    const marker = `/storage/v1/object/public/${getStorageBucket()}/`;
    return Boolean(
      configured
      && url.protocol === 'https:'
      && url.hostname === configured.hostname
      && url.pathname.includes(marker),
    );
  } catch (error) {
    return false;
  }
};

const filterAllowedStoragePhotos = (photos) => photos.filter((photo) => {
  if (typeof photo === 'object' && photo) return isAllowedStoragePhotoUrl(photo.url || photo.publicUrl || photo.public_url || photo.src || photo.path || photo.location);
  return isAllowedStoragePhotoUrl(photo);
});

const toPublicPhotoUrl = (supabase, value) => {
  if (!value) return '';
  if (typeof value === 'object') {
    return toPublicPhotoUrl(supabase, value.url || value.publicUrl || value.public_url || value.src || value.path || value.location);
  }

  const photo = String(value).trim();
  if (!photo) return '';
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/uploads\//i.test(photo)) {
    return new URL(photo).pathname;
  }
  if (/^https?:\/\//i.test(photo) || photo.startsWith('/uploads/') || photo.startsWith('data:')) return photo;
  if (photo.startsWith('uploads/')) return `/${photo}`;

  const normalizedPath = photo.replace(/^\/+/, '');
  const { data } = supabase.storage.from(getStorageBucket()).getPublicUrl(normalizedPath);
  return data?.publicUrl || photo;
};

const normalizePropertyPhotos = (supabase, row, includeInternal = false) => {
  if (!row) return row;
  const { referencia, ...property } = row;
  const vitrine = getVitrineFromDescription(row.descricao);
  const referenciaInterna = getInternalReferenceFromDescription(row.descricao);
  return {
    ...property,
    ...(referencia ? { referencia } : {}),
    ...(includeInternal ? { referencia_interna: referenciaInterna } : {}),
    captacao: row.captacao || getCaptacaoFromDescription(row.descricao),
    vitrine_status: vitrine.status,
    vitrine_prioridade: vitrine.prioridade,
    descricao: stripInternalReferenceFromDescription(stripVitrineFromDescription(setCaptacaoInDescription(row.descricao, ''))),
    fotos: parseFotosField(row.fotos).map((photo) => toPublicPhotoUrl(supabase, photo)).filter(Boolean).slice(0, 8),
  };
};

const sortByVitrine = (items = []) => {
  const weight = { destaque: 0, normal: 1, segundo_plano: 2, oculto_home: 3 };
  return [...items].sort((a, b) => {
    const statusA = normalizeVitrineStatus(a.vitrine_status);
    const statusB = normalizeVitrineStatus(b.vitrine_status);
    if (weight[statusA] !== weight[statusB]) return weight[statusA] - weight[statusB];
    const priorityA = normalizeVitrinePrioridade(a.vitrine_prioridade);
    const priorityB = normalizeVitrinePrioridade(b.vitrine_prioridade);
    if (priorityA !== priorityB) return priorityB - priorityA;
    return new Date(b.criado_em || 0) - new Date(a.criado_em || 0);
  });
};

const storagePathFromPhotoUrl = (photo) => {
  if (!photo) return '';
  const bucket = getStorageBucket();
  const raw = String(photo).trim();
  if (!raw) return '';
  if (!/^https?:\/\//i.test(raw)) {
    const pathValue = raw.replace(/^\/+/, '');
    return pathValue.startsWith(`${bucket}/`) ? pathValue.slice(bucket.length + 1) : pathValue;
  }

  try {
    const url = new URL(raw);
    const marker = `/storage/v1/object/public/${bucket}/`;
    const index = url.pathname.indexOf(marker);
    if (index === -1) return '';
    return decodeURIComponent(url.pathname.slice(index + marker.length));
  } catch (error) {
    return '';
  }
};

const removePropertyPhotoFromStorage = async (supabase, photo) => {
  const storagePath = storagePathFromPhotoUrl(photo);
  if (!storagePath || storagePath.startsWith('uploads/')) return;
  const bucket = getStorageBucket();
  const storage = supabase.storage?.from?.(bucket);
  if (!storage?.remove) return;
  await storage.remove([storagePath]);
};

const createWatermarkedBuffer = async (input) => {
  const sharp = getSharp();
  if (!sharp) {
    throw new Error('Processador de marca dagua nao instalado. Instale a dependencia sharp no backend.');
  }

  const normalizedInput = await sharp(input, { failOn: 'none' }).rotate().toBuffer();
  const image = sharp(normalizedInput, { failOn: 'none' });
  const metadata = await image.metadata();
  const width = metadata.width || 1200;
  const height = metadata.height || Math.round(width * 1.33);
  const watermarkWidth = Math.min(
    Math.max(Math.round(width * WATERMARK_WIDTH_RATIO), WATERMARK_MIN_WIDTH),
    Math.round(width * 0.42),
    WATERMARK_MAX_WIDTH,
  );
  const opacityMask = Buffer.from([255, 255, 255, Math.round(255 * WATERMARK_OPACITY)]);
  const resizedWatermark = await sharp(WATERMARK_PATH)
    .resize({ width: watermarkWidth, withoutEnlargement: true })
    .ensureAlpha()
    .png()
    .toBuffer();
  const watermarkMetadata = await sharp(resizedWatermark).metadata();
  const renderedWatermarkWidth = watermarkMetadata.width || watermarkWidth;
  const renderedWatermarkHeight = watermarkMetadata.height || Math.round(watermarkWidth * 0.3);
  const safeMargin = Math.round(Math.min(width, height) * WATERMARK_SAFE_MARGIN_RATIO);
  const desiredTop = Math.round(height * WATERMARK_VERTICAL_CENTER - renderedWatermarkHeight / 2);
  const maxTop = Math.max(safeMargin, height - renderedWatermarkHeight - safeMargin);
  const left = Math.max(0, Math.round((width - renderedWatermarkWidth) / 2));
  const top = Math.max(safeMargin, Math.min(desiredTop, maxTop));
  const watermark = await sharp(resizedWatermark)
    .ensureAlpha()
    .composite([{
      input: opacityMask,
      raw: { width: 1, height: 1, channels: 4 },
      tile: true,
      blend: 'dest-in',
    }])
    .png()
    .toBuffer();

  return image
    .composite([{ input: watermark, left, top }])
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer();
};

const uploadPropertyPhotos = async (supabase, files = []) => {
  if (!files.length) return [];

  const bucket = getStorageBucket();
  const uploadedUrls = [];

  for (const file of files) {
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const originalPath = `imoveis/originals/${safeName}`;
    const watermarkedPath = `imoveis/watermarked/${safeName}.jpg`;

    const { error: originalError } = await supabase.storage
      .from(bucket)
      .upload(originalPath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (originalError) {
      throw new Error(`Falha ao salvar foto original no bucket "${bucket}": ${originalError.message}`);
    }

    try {
      const watermarkedBuffer = await createWatermarkedBuffer(file.buffer);
      const { error: watermarkedError } = await supabase.storage
        .from(bucket)
        .upload(watermarkedPath, watermarkedBuffer, {
          contentType: 'image/jpeg',
          upsert: false,
        });
      if (watermarkedError) throw watermarkedError;

      const { data } = supabase.storage.from(bucket).getPublicUrl(watermarkedPath);
      if (data?.publicUrl) uploadedUrls.push(data.publicUrl);
      else throw new Error('Nao foi possivel gerar a URL publica da foto com marca dagua');
    } catch (error) {
      await supabase.storage.from(bucket).remove([originalPath]).catch(() => null);
      throw new Error(`Falha ao salvar foto com marca dagua: ${error.message}`);
    }
  }

  return uploadedUrls;
};

const fetchPhotoBuffer = async (photoUrl) => {
  if (!isAllowedStoragePhotoUrl(photoUrl) || !/^https:\/\//i.test(photoUrl)) {
    throw new Error('A foto precisa estar armazenada no storage autorizado');
  }
  const client = photoUrl.startsWith('https://') ? https : http;

  return new Promise((resolve, reject) => {
    const request = client.get(photoUrl, (response) => {
      if ([301, 302, 303, 307, 308].includes(response.statusCode) && response.headers.location) {
        response.resume();
        const redirectedUrl = new URL(response.headers.location, photoUrl).toString();
        if (!isAllowedStoragePhotoUrl(redirectedUrl)) {
          reject(new Error('Redirecionamento de foto nao autorizado'));
          return;
        }
        fetchPhotoBuffer(redirectedUrl).then(resolve).catch(reject);
        return;
      }

      if (response.statusCode < 200 || response.statusCode >= 300) {
        response.resume();
        reject(new Error(`Falha ao baixar foto do storage (${response.statusCode})`));
        return;
      }

      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
    });

    request.setTimeout(20000, () => {
      request.destroy(new Error('Tempo esgotado ao baixar foto do storage'));
    });

    request.on('error', reject);
  });
};

const getOriginalPhotoReference = (supabase, photo) => {
  const publicUrl = toPublicPhotoUrl(supabase, photo);
  if (/^\/uploads\/imoveis\/watermarked\//i.test(publicUrl)) {
    const filename = path.basename(publicUrl, path.extname(publicUrl));
    return `/uploads/imoveis/originals/${filename}`;
  }
  const storagePath = storagePathFromPhotoUrl(publicUrl);
  if (!storagePath || !storagePath.startsWith('imoveis/watermarked/')) return publicUrl;
  const filename = path.basename(storagePath, path.extname(storagePath));
  return `imoveis/originals/${filename}`;
};

const getPhotoInput = async (supabase, photo) => {
  const originalReference = getOriginalPhotoReference(supabase, photo);
  if (originalReference.startsWith('/uploads/')) {
    const originalPath = path.resolve(__dirname, '..', originalReference.slice('/uploads/'.length));
    if (fs.existsSync(originalPath)) return fs.promises.readFile(originalPath);

    const markedName = path.basename(originalReference);
    const demoFallback = path.resolve(__dirname, '..', 'uploads', markedName.replace(/\.jpg$/i, ''));
    if (fs.existsSync(demoFallback)) return fs.promises.readFile(demoFallback);
  }

  const originalUrl = toPublicPhotoUrl(supabase, originalReference);
  if (!isAllowedStoragePhotoUrl(originalUrl) || !/^https:\/\//i.test(originalUrl)) {
    throw new Error('Apenas fotos publicas do storage podem receber marca dagua automaticamente');
  }
  return fetchPhotoBuffer(originalUrl);
};

const uploadWatermarkedPhoto = async (supabase, imovelId, photo, index) => {
  const input = await getPhotoInput(supabase, photo);
  const output = await createWatermarkedBuffer(input);

  const bucket = getStorageBucket();
  const safeId = String(imovelId || 'imovel').replace(/[^a-z0-9-]/gi, '');
  const storageBase = `${safeId}-${Date.now()}-${index + 1}`;
  const originalPath = `imoveis/originals/${storageBase}`;
  const storagePath = `imoveis/watermarked/${storageBase}.jpg`;

  const { error: originalError } = await supabase.storage
    .from(bucket)
    .upload(originalPath, input, {
      contentType: 'image/jpeg',
      upsert: false,
    });
  if (originalError) {
    throw new Error(`Falha ao salvar original da foto: ${originalError.message}`);
  }

  const { error } = await supabase.storage
    .from(bucket)
    .upload(storagePath, output, {
      contentType: 'image/jpeg',
      upsert: false,
    });

  if (error) {
    throw new Error(`Falha ao salvar foto com marca dagua: ${error.message}`);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
  if (!data?.publicUrl) {
    throw new Error('Nao foi possivel gerar a URL publica da foto com marca dagua');
  }

  return data.publicUrl;
};

const getOriginalStoragePath = (supabase, photo) => {
  const publicUrl = toPublicPhotoUrl(supabase, photo);
  const storagePath = storagePathFromPhotoUrl(publicUrl);
  if (!storagePath || !storagePath.startsWith('imoveis/watermarked/')) return '';
  const filename = path.basename(storagePath, path.extname(storagePath));
  return `imoveis/originals/${filename}`;
};

const restoreOriginalPhotos = async (supabase, photos = []) => {
  const restored = [];
  for (const photo of photos) {
    const originalPath = getOriginalStoragePath(supabase, photo);
    if (!originalPath) {
      restored.push({ photo, original: null });
      continue;
    }
    const { data, error } = await supabase.storage.from(getStorageBucket()).download(originalPath);
    if (error || !data) {
      throw new Error('A foto original nao esta disponivel para restauracao segura');
    }
    const { data: publicData } = supabase.storage.from(getStorageBucket()).getPublicUrl(originalPath);
    if (!publicData?.publicUrl) throw new Error('Nao foi possivel localizar a foto original');
    restored.push({ photo, original: publicData.publicUrl });
  }
  return restored;
};

const applyVisibilityFilter = (query, user, scope) => {
  if (scope === 'admin') return query;
  if (scope === 'broker') return query.eq('corretor_id', user.id);
  return query.in ? query.in('status', PUBLIC_STATUSES) : query.eq('status', 'publicado');
};

const getOptionalUser = async (req) => {
  if (!getRequestToken(req)) return null;

  await new Promise((resolve) => {
    authMiddleware(req, { status: () => ({ json: () => resolve() }) }, resolve);
  });

  return req.user || null;
};

router.get('/', async (req, res) => {
  const supabase = req.supabase;
  const user = await getOptionalUser(req);
  const scope = req.query.scope || 'public';

  if (!['public', 'admin', 'broker'].includes(scope)) {
    return res.status(400).json({ error: 'Escopo de consulta invalido' });
  }
  if (scope === 'admin' && (!user || user.perfil !== 'admin')) {
    return res.status(401).json({ error: 'Sessao administrativa ausente ou expirada' });
  }
  if (scope === 'broker' && (!user || user.perfil !== 'corretor')) {
    return res.status(401).json({ error: 'Sessao do corretor ausente ou expirada' });
  }

  let query = supabase.from('imoveis').select('*').order('criado_em', { ascending: false });
  query = applyVisibilityFilter(query, user, scope);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  res.json(sortByVitrine((data || []).map((row) => normalizePropertyPhotos(supabase, row, scope !== 'public'))));
});

router.get('/:id', async (req, res) => {
  const supabase = req.supabase;
  const user = await getOptionalUser(req);
  const scope = req.query.scope || 'public';
  if (!['public', 'admin', 'broker'].includes(scope)) {
    return res.status(400).json({ error: 'Escopo de consulta invalido' });
  }
  if (scope === 'admin' && (!user || user.perfil !== 'admin')) {
    return res.status(401).json({ error: 'Sessao administrativa ausente ou expirada' });
  }
  if (scope === 'broker' && (!user || user.perfil !== 'corretor')) {
    return res.status(401).json({ error: 'Sessao do corretor ausente ou expirada' });
  }

  let query = supabase.from('imoveis').select('*').eq('id', req.params.id);
  query = applyVisibilityFilter(query, user, scope);

  const { data, error } = await query.single();
  if (error || !data) {
    return res.status(404).json({ error: 'Imovel nao encontrado' });
  }

  res.json(normalizePropertyPhotos(supabase, data, scope !== 'public'));
});

router.post('/', uploadFotos, async (req, res) => {
  const supabase = req.supabase;
  const user = await getOptionalUser(req);
  if (user && !['admin', 'corretor'].includes(user.perfil)) {
    return res.status(403).json({ error: 'Permissao negada' });
  }

  const payload = sanitizePropertyPayload(req.body);
  if (!user || user.perfil !== 'admin') {
    delete payload.vitrine_status;
    delete payload.vitrine_prioridade;
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'captacao')) {
    payload.descricao = setCaptacaoInDescription(payload.descricao, payload.captacao);
    delete payload.captacao;
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'referencia_interna')) {
    payload.descricao = setInternalReferenceInDescription(payload.descricao, payload.referencia_interna);
    delete payload.referencia_interna;
  }
  if (
    Object.prototype.hasOwnProperty.call(payload, 'vitrine_status')
    || Object.prototype.hasOwnProperty.call(payload, 'vitrine_prioridade')
  ) {
    payload.descricao = setVitrineInDescription(payload.descricao, {
      status: payload.vitrine_status,
      prioridade: payload.vitrine_prioridade,
    });
    delete payload.vitrine_status;
    delete payload.vitrine_prioridade;
  }
  const validationError = validateRequiredFields(payload);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const fotosExistentes = user
    ? filterAllowedStoragePhotos(parseFotosField(payload.fotos))
    : [];
  const fotosRecebidas = req.files || [];
  if (fotosExistentes.length + fotosRecebidas.length > 8) {
    return res.status(400).json({ error: 'Envie no maximo 8 fotos' });
  }

  payload.status = 'pendente';
  if (user) {
    payload.corretor_id = user.perfil === 'corretor' ? user.id : req.body.corretor_id || user.id;
  } else if (req.body.corretor_email) {
    // Requisições públicas não podem escolher um corretor arbitrário por ID.
    // Quando necessário, a associação pública ocorre somente por e-mail e
    // apenas para um usuário cujo perfil seja explicitamente "corretor".
    const email = String(req.body.corretor_email || '').trim().toLowerCase();
    const { data: broker } = await supabase
      .from('usuarios')
      .select('id')
      .eq('email', email)
      .eq('perfil', 'corretor')
      .single();
    if (broker?.id) payload.corretor_id = broker.id;
  }

  let uploadedPhotos = [];
  try {
    uploadedPhotos = await uploadPropertyPhotos(supabase, fotosRecebidas);
    payload.fotos = [...fotosExistentes, ...uploadedPhotos];
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }

  const { data, error } = await supabase
    .from('imoveis')
    .insert([payload])
    .select()
    .single();

  if (error) {
    await Promise.all(uploadedPhotos.map(photo => removePropertyPhotoFromStorage(supabase, photo).catch(() => null)));
    return res.status(500).json({ error: error.message });
  }

  if (!user && req.body.proprietario_nome && req.body.proprietario_telefone) {
    const privateReference = `imovel:${data.id}`;
    const privateNotes = [
      `Referencia: ${privateReference}`,
      `E-mail: ${req.body.proprietario_email || 'Nao informado'}`,
      `Endereco: ${req.body.proprietario_endereco || 'Nao informado'}`,
      `Bairro: ${req.body.bairro || 'Nao informado'}`,
      'Aceite LGPD: sim',
    ].join('\n');
    const { error: leadError } = await supabase.from('leads').insert([{
      nome: req.body.proprietario_nome,
      telefone: req.body.proprietario_telefone,
      email: req.body.proprietario_email || null,
      cidade: req.body.cidade,
      interesse: 'proprietario_cadastro_imovel',
      observacoes: privateNotes,
      etapa: 'novo',
      historico: [{ descricao: 'Imovel enviado pelo proprietario', criado_em: new Date().toISOString(), autor: 'site' }],
    }]);
    if (leadError) console.error('Falha ao registrar dados privados do proprietario:', leadError.message);
  }

  res.status(201).json(normalizePropertyPhotos(supabase, data, Boolean(user)));
});

router.put('/:id', authMiddleware, requireRole('admin', 'corretor'), async (req, res) => {
  const supabase = req.supabase;
  const updates = sanitizePropertyPayload(req.body);
  const hasVitrineFields = Object.prototype.hasOwnProperty.call(updates, 'vitrine_status')
    || Object.prototype.hasOwnProperty.call(updates, 'vitrine_prioridade');
  if (req.user.perfil === 'corretor') {
    Object.keys(updates).forEach((field) => {
      if (!['banheiros', 'descricao', 'captacao', 'fotos'].includes(field)) delete updates[field];
    });
  }
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'Nenhum campo permitido para atualizar' });
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'captacao')) {
    let description = updates.descricao;
    if (description == null) {
      let currentQuery = supabase.from('imoveis').select('descricao').eq('id', req.params.id);
      if (req.user.perfil === 'corretor') currentQuery = currentQuery.eq('corretor_id', req.user.id);
      const { data: current } = await currentQuery.single();
      if (!current) return res.status(404).json({ error: 'Imovel nao encontrado ou bloqueado para edicao' });
      description = current.descricao;
    }
    updates.descricao = setCaptacaoInDescription(description, updates.captacao);
    delete updates.captacao;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'referencia_interna')) {
    let description = updates.descricao;
    if (description == null) {
      let currentQuery = supabase.from('imoveis').select('descricao').eq('id', req.params.id);
      if (req.user.perfil === 'corretor') currentQuery = currentQuery.eq('corretor_id', req.user.id);
      const { data: current } = await currentQuery.single();
      if (!current) return res.status(404).json({ error: 'Imovel nao encontrado ou bloqueado para edicao' });
      description = current.descricao;
    }
    updates.descricao = setInternalReferenceInDescription(description, updates.referencia_interna);
    delete updates.referencia_interna;
  }
  if (hasVitrineFields) {
    let description = updates.descricao;
    if (description == null) {
      let currentQuery = supabase.from('imoveis').select('descricao').eq('id', req.params.id);
      if (req.user.perfil === 'corretor') currentQuery = currentQuery.eq('corretor_id', req.user.id);
      const { data: current } = await currentQuery.single();
      if (!current) return res.status(404).json({ error: 'Imovel nao encontrado ou bloqueado para edicao' });
      description = current.descricao;
    }
    const currentVitrine = getVitrineFromDescription(description);
    updates.descricao = setVitrineInDescription(description, {
      status: Object.prototype.hasOwnProperty.call(updates, 'vitrine_status') ? updates.vitrine_status : currentVitrine.status,
      prioridade: Object.prototype.hasOwnProperty.call(updates, 'vitrine_prioridade') ? updates.vitrine_prioridade : currentVitrine.prioridade,
    });
    delete updates.vitrine_status;
    delete updates.vitrine_prioridade;
  } else if (req.user.perfil === 'admin' && Object.prototype.hasOwnProperty.call(updates, 'descricao')) {
    const { data: current } = await supabase.from('imoveis').select('descricao').eq('id', req.params.id).single();
    if (current?.descricao) {
      updates.descricao = setVitrineInDescription(updates.descricao, getVitrineFromDescription(current.descricao));
    }
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'fotos')) {
    updates.fotos = parseFotosField(updates.fotos).slice(0, 8);
  }

  let query = supabase.from('imoveis').update(updates).eq('id', req.params.id);
  if (req.user.perfil === 'corretor') {
    query = query.eq('corretor_id', req.user.id);
  }

  const { data, error } = await query.select().single();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Imovel nao encontrado ou bloqueado para edicao' });

  res.json(normalizePropertyPhotos(supabase, data, true));
});

router.post('/:id/fotos', authMiddleware, requireRole('admin', 'corretor'), uploadFotos, async (req, res) => {
  const supabase = req.supabase;
  const novasFotos = req.files || [];

  if (!novasFotos.length) {
    return res.status(400).json({ error: 'Selecione ao menos uma foto' });
  }

  let fetchQuery = supabase.from('imoveis').select('id, fotos, corretor_id, status').eq('id', req.params.id);
  if (req.user.perfil === 'corretor') {
    fetchQuery = fetchQuery.eq('corretor_id', req.user.id);
  }

  const { data: imovel, error: fetchError } = await fetchQuery.single();
  if (fetchError || !imovel) {
    return res.status(404).json({ error: 'Imovel nao encontrado ou bloqueado para edicao' });
  }

  const fotosAtuais = parseFotosField(imovel.fotos);
  const vagasRestantes = Math.max(0, 8 - fotosAtuais.length);
  if (novasFotos.length > vagasRestantes) {
    return res.status(400).json({
      error: `Este imovel aceita no maximo 8 fotos. Voce ainda pode enviar ${vagasRestantes}.`,
    });
  }

  let fotosEnviadas;
  try {
    fotosEnviadas = await uploadPropertyPhotos(supabase, novasFotos);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }

  let updateQuery = supabase.from('imoveis').update({
    fotos: [...fotosAtuais, ...fotosEnviadas],
    atualizado_em: new Date().toISOString(),
  }).eq('id', req.params.id);

  if (req.user.perfil === 'corretor') {
    updateQuery = updateQuery.eq('corretor_id', req.user.id);
  }

  const { data, error } = await updateQuery.select().single();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Imovel nao encontrado ou bloqueado para edicao' });

  res.json(normalizePropertyPhotos(supabase, data, true));
});

const applyWatermarkToProperty = async (supabase, imovel, indicesRecebidos = null) => {
  const fotosAtuais = parseFotosField(imovel.fotos).filter(Boolean).slice(0, 8);
  if (!fotosAtuais.length) {
    const error = new Error('Este imovel nao possui fotos para aplicar marca dagua');
    error.status = 400;
    throw error;
  }

  const indicesSelecionados = indicesRecebidos
    ? Array.from(new Set(indicesRecebidos)).filter((index) => index < fotosAtuais.length)
    : fotosAtuais.map((_, index) => index);
  if (!indicesSelecionados.length) {
    const error = new Error('Nenhuma foto valida foi selecionada para aplicar marca dagua');
    error.status = 400;
    throw error;
  }

  const fotosComMarca = [...fotosAtuais];
  const fotosCriadas = [];
  try {
    for (const index of indicesSelecionados) {
      fotosComMarca[index] = await uploadWatermarkedPhoto(supabase, imovel.id, fotosAtuais[index], index);
      fotosCriadas.push(fotosComMarca[index]);
    }

    const { data, error } = await supabase
      .from('imoveis')
      .update({ fotos: fotosComMarca, atualizado_em: new Date().toISOString() })
      .eq('id', imovel.id)
      .select()
      .single();
    if (error) throw error;
    return { data, total: indicesSelecionados.length };
  } catch (error) {
    await Promise.all(fotosCriadas.map(photo => removePropertyPhotoFromStorage(supabase, photo).catch(() => null)));
    throw error;
  }
};

router.post('/marca-dagua/lote', authMiddleware, requireRole('admin'), async (req, res) => {
  const supabase = req.supabase;
  const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(String).filter(Boolean) : null;
  let query = supabase.from('imoveis').select('id, fotos').order('criado_em', { ascending: false });
  if (ids?.length) query = query.in('id', ids);

  const { data: imoveis, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  const resultado = { processados: 0, fotos: 0, semFotos: 0, erros: [] };
  for (const imovel of imoveis || []) {
    try {
      const aplicado = await applyWatermarkToProperty(supabase, imovel);
      resultado.processados += 1;
      resultado.fotos += aplicado.total;
    } catch (applyError) {
      if (applyError.status === 400) resultado.semFotos += 1;
      else resultado.erros.push({ id: imovel.id, error: applyError.message || 'Erro ao aplicar marca dagua' });
    }
  }

  res.json(resultado);
});

router.post('/:id/marca-dagua', authMiddleware, requireRole('admin'), async (req, res) => {
  const supabase = req.supabase;
  const indicesRecebidos = Array.isArray(req.body?.indices)
    ? req.body.indices
        .map((value) => Number.parseInt(value, 10))
        .filter((value) => Number.isInteger(value) && value >= 0)
    : null;

  const { data: imovel, error: fetchError } = await supabase
    .from('imoveis')
    .select('id, fotos')
    .eq('id', req.params.id)
    .single();

  if (fetchError || !imovel) {
    return res.status(404).json({ error: 'Imovel nao encontrado' });
  }

  const fotosAtuais = parseFotosField(imovel.fotos).filter(Boolean).slice(0, 8);
  if (!fotosAtuais.length) {
    return res.status(400).json({ error: 'Este imovel nao possui fotos para aplicar marca dagua' });
  }
  const indicesSelecionados = Array.isArray(indicesRecebidos)
    ? Array.from(new Set(indicesRecebidos)).filter((index) => index < fotosAtuais.length)
    : null;
  try {
    const result = await applyWatermarkToProperty(supabase, imovel, indicesSelecionados);
    return res.json({
      imovel: normalizePropertyPhotos(supabase, result.data, true),
      total: result.total,
    });
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message || 'Erro ao aplicar marca dagua' });
  }
});

router.post('/:id/remover-marca-dagua', authMiddleware, requireRole('admin'), async (req, res) => {
  const supabase = req.supabase;
  const { data: imovel, error: fetchError } = await supabase
    .from('imoveis')
    .select('id, fotos')
    .eq('id', req.params.id)
    .single();
  if (fetchError || !imovel) return res.status(404).json({ error: 'Imovel nao encontrado' });

  const fotosAtuais = parseFotosField(imovel.fotos).filter(Boolean).slice(0, 8);
  if (!fotosAtuais.length) return res.status(400).json({ error: 'Este imovel nao possui fotos' });

  try {
    const restauradas = await restoreOriginalPhotos(supabase, fotosAtuais);
    const fotosSemMarca = restauradas.map(item => item.original || item.photo);
    const { data, error } = await supabase
      .from('imoveis')
      .update({ fotos: fotosSemMarca, atualizado_em: new Date().toISOString() })
      .eq('id', imovel.id)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ imovel: normalizePropertyPhotos(supabase, data, true), total: fotosSemMarca.length });
  } catch (error) {
    return res.status(409).json({ error: error.message || 'Nao foi possivel restaurar as fotos originais' });
  }
});

router.delete('/:id/fotos', authMiddleware, requireRole('admin', 'corretor'), async (req, res) => {
  const supabase = req.supabase;
  const { foto, index } = req.body || {};

  let fetchQuery = supabase.from('imoveis').select('id, fotos, corretor_id, status').eq('id', req.params.id);
  if (req.user.perfil === 'corretor') {
    fetchQuery = fetchQuery.eq('corretor_id', req.user.id).eq('status', 'pendente');
  }

  const { data: imovel, error: fetchError } = await fetchQuery.single();
  if (fetchError || !imovel) {
    return res.status(404).json({ error: 'Imovel nao encontrado ou bloqueado para edicao' });
  }

  const fotos = parseFotosField(imovel.fotos);
  const photoIndex = Number.isInteger(Number(index))
    ? Number(index)
    : fotos.findIndex((item) => String(item) === String(foto));

  if (photoIndex < 0 || photoIndex >= fotos.length) {
    return res.status(404).json({ error: 'Foto nao encontrada' });
  }

  const [removedPhoto] = fotos.splice(photoIndex, 1);

  let updateQuery = supabase.from('imoveis').update({
    fotos,
    atualizado_em: new Date().toISOString(),
  }).eq('id', req.params.id);
  if (req.user.perfil === 'corretor') {
    updateQuery = updateQuery.eq('corretor_id', req.user.id).eq('status', 'pendente');
  }

  const { data, error } = await updateQuery.select().single();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Imovel nao encontrado ou bloqueado para edicao' });

  try {
    await removePropertyPhotoFromStorage(supabase, removedPhoto);
  } catch (error) {
    console.warn('Falha ao remover foto do storage:', error.message);
  }

  res.json(normalizePropertyPhotos(supabase, data, true));
});

router.delete('/:id', authMiddleware, requireRole('admin', 'corretor'), async (req, res) => {
  const supabase = req.supabase;
  let fetchQuery = supabase.from('imoveis').select('id, fotos, corretor_id, status').eq('id', req.params.id);
  if (req.user.perfil === 'corretor') {
    fetchQuery = fetchQuery.eq('corretor_id', req.user.id);
  }

  const { data: imovel, error: fetchError } = await fetchQuery.single();
  if (fetchError || !imovel) {
    return res.status(404).json({ error: 'Imovel nao encontrado ou bloqueado para exclusao' });
  }

  let query = supabase.from('imoveis').delete().eq('id', req.params.id);
  if (req.user.perfil === 'corretor') {
    query = query.eq('corretor_id', req.user.id);
  }

  const { error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  const fotos = parseFotosField(imovel.fotos);
  await Promise.all(fotos.map(async (foto) => {
    try {
      await removePropertyPhotoFromStorage(supabase, foto);
    } catch (error) {
      console.warn('Falha ao remover foto do storage:', error.message);
    }
  }));

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
