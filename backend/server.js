const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { createDemoClient } = require('./demo-db');

const authRoutes = require('./routes/auth');
const imoveisRoutes = require('./routes/imoveis');
const leadsRoutes = require('./routes/leads');

const app = express();
app.set('trust proxy', 1);
app.use((req, res, next) => {
  if (req.hostname === 'www.imoore.com.br') {
    return res.redirect(301, `https://imoore.com.br${req.originalUrl}`);
  }
  next();
});
app.use((req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Content-Security-Policy', "default-src 'self' https: data: blob:; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net data:; img-src 'self' https: data: blob:; connect-src 'self' https://*.supabase.co; frame-ancestors 'self'; base-uri 'self'; form-action 'self'");
  next();
});
const allowedOrigins = new Set(['https://imoore.com.br', 'https://www.imoore.com.br']);
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return callback(null, true);
    const error = new Error('Origem nao permitida');
    error.status = 403;
    return callback(error);
  },
  credentials: true,
}));
app.use((error, req, res, next) => {
  if (error?.status === 403) return res.status(403).json({ error: error.message });
  next(error);
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const publicSubmissions = new Map();
const loginAttempts = new Map();
const loginAttemptLimit = (req, res, next) => {
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const recent = (loginAttempts.get(key) || []).filter(time => now - time < 15 * 60 * 1000);
  if (recent.length === 0) loginAttempts.delete(key);
  if (recent.length >= 10) return res.status(429).json({ error: 'Muitas tentativas de login. Aguarde 15 minutos.' });
  recent.push(now);
  loginAttempts.set(key, recent);
  next();
};
const publicSubmissionLimit = (req, res, next) => {
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const recent = (publicSubmissions.get(key) || []).filter(time => now - time < 60 * 60 * 1000);
  if (recent.length === 0) publicSubmissions.delete(key);
  if (recent.length >= 20) return res.status(429).json({ error: 'Muitas tentativas. Aguarde antes de enviar novamente.' });
  recent.push(now);
  publicSubmissions.set(key, recent);
  next();
};

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const DEMO_MODE = process.env.DEMO_MODE === 'true'
  || !SUPABASE_URL
  || !SUPABASE_SERVICE_ROLE_KEY
  || SUPABASE_URL.includes('your-project')
  || SUPABASE_SERVICE_ROLE_KEY.includes('placeholder')
  || SUPABASE_SERVICE_ROLE_KEY.includes('YOUR_SUPABASE');

let supabase;
if (DEMO_MODE) {
  console.warn('Supabase não está configurado corretamente. Rodando em modo demo local.');
  supabase = createDemoClient();
  const uploadsPath = path.resolve(__dirname, 'uploads');
  fs.mkdirSync(uploadsPath, { recursive: true });
  app.use('/uploads', express.static(uploadsPath));
} else {
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

app.use((req, res, next) => {
  req.supabase = supabase;
  next();
});

app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('Vary', 'Cookie, Authorization');
  next();
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'imoore-api',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth/login', loginAttemptLimit);
app.use('/api/auth', authRoutes);
app.use('/api/imoveis', (req, res, next) => req.method === 'POST' && !req.headers.authorization ? publicSubmissionLimit(req, res, next) : next(), imoveisRoutes);
app.use('/api/leads', (req, res, next) => req.method === 'POST' && req.path === '/public' ? publicSubmissionLimit(req, res, next) : next(), leadsRoutes);

const frontendPath = path.resolve(__dirname, '../frontend');

app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'teste-claude.html'));
});

app.get('/index.html', (req, res) => {
  res.redirect(301, '/');
});
app.get('/favicon.ico', (req, res) => res.sendFile(path.join(frontendPath, 'assets', 'imoore-favicon.svg')));

app.get('/regioes', (req, res) => res.sendFile(path.join(frontendPath, 'regioes.html')));
app.get('/regiao/:slug', (req, res, next) => {
  const allowed = new Set(['baixada-santista-litoral-sul','santos','sao-vicente','praia-grande','itanhaem','mongagua','peruibe','itariri','pedro-de-toledo','ana-dias']);
  if (!allowed.has(req.params.slug)) return next();
  res.sendFile(path.join(frontendPath, `regiao-${req.params.slug}.html`));
});
app.get('/entrar', (req, res) => res.sendFile(path.join(frontendPath, 'imoore-entrar.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(frontendPath, 'teste-crm.html')));
app.get('/painel/corretor', (req, res) => res.sendFile(path.join(frontendPath, 'painel-corretor.html')));
app.get('/crm', (req, res) => res.sendFile(path.join(frontendPath, 'imoore-crm.html')));
app.get('/captar-imovel', (req, res) => res.sendFile(path.join(frontendPath, 'captar-imovel.html')));

app.get('/regioes.html', (req, res) => res.redirect(301, '/regioes'));
app.get('/regiao-:slug.html', (req, res, next) => {
  if (['guaruja', 'cubatao', 'bertioga'].includes(req.params.slug)) return res.redirect(301, '/regioes');
  const allowed = new Set(['baixada-santista-litoral-sul','santos','sao-vicente','praia-grande','itanhaem','mongagua','peruibe','itariri','pedro-de-toledo','ana-dias']);
  if (!allowed.has(req.params.slug)) return next();
  res.redirect(301, `/regiao/${req.params.slug}`);
});
app.get('/imoore-entrar.html', (req, res) => res.redirect(301, '/entrar'));
app.get('/teste-crm.html', (req, res) => res.redirect(301, '/admin'));
app.get('/painel-corretor.html', (req, res) => res.redirect(301, '/painel/corretor'));
app.get('/imoore-crm.html', (req, res) => res.redirect(301, '/crm'));
app.get('/captar-imovel.html', (req, res) => res.redirect(301, '/captar-imovel'));

app.get('/imoore-login.html', (req, res) => {
  res.redirect(301, '/entrar');
});

app.use(express.static(frontendPath, { index: false }));

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  console.error('Erro interno da API:', error?.message || error);
  res.status(error?.status && error.status >= 400 && error.status < 500 ? error.status : 500)
    .json({ error: 'Erro interno do servidor' });
});

const PORT = process.env.PORT || 3001;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`imoore-backend running on port ${PORT}`);
  });
}

module.exports = app;
