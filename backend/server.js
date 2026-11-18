require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { createDemoClient } = require('./demo-db');

const authRoutes = require('./routes/auth');
const corretoresRoutes = require('./routes/corretores');
const imoveisRoutes = require('./routes/imoveis');
const leadsRoutes = require('./routes/leads');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const invalidSupabaseConfig = !SUPABASE_URL
  || !SUPABASE_SERVICE_ROLE_KEY
  || SUPABASE_URL.includes('your-project')
  || SUPABASE_SERVICE_ROLE_KEY.includes('placeholder')
  || SUPABASE_SERVICE_ROLE_KEY.includes('YOUR_SUPABASE');
const DEMO_MODE = process.env.DEMO_MODE === 'true';

if (!DEMO_MODE && invalidSupabaseConfig) {
  throw new Error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY sao obrigatorios quando DEMO_MODE=false');
}

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

// Add cache control headers to prevent stale API responses in approval flow
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('Vary', 'Cookie, Authorization');
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/corretores', corretoresRoutes);
app.use('/api/imoveis', imoveisRoutes);
app.use('/api/leads', leadsRoutes);

const frontendPath = path.resolve(__dirname, '../frontend');

app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'teste-claude.html'));
});

app.get('/index.html', (req, res) => {
  res.sendFile(path.join(frontendPath, 'teste-claude.html'));
});

app.get('/regioes', (req, res) => {
  res.sendFile(path.join(frontendPath, 'regioes.html'));
});

app.get(['/regiao/guaruja', '/regiao/cubatao', '/regiao/bertioga'], (req, res) => {
  res.redirect(301, '/regioes');
});

app.get(['/regiao-guaruja.html', '/regiao-cubatao.html', '/regiao-bertioga.html'], (req, res) => {
  res.redirect(301, '/regioes');
});

app.use(express.static(frontendPath, { index: false }));

const PORT = process.env.PORT || 3001;
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`imoore-backend running on port ${PORT}`);
  });
}

module.exports = app;
