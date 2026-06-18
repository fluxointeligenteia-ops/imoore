require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { createDemoClient } = require('./demo-db');

const authRoutes = require('./routes/auth');
const imoveisRoutes = require('./routes/imoveis');
const leadsRoutes = require('./routes/leads');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

app.use('/api/auth', authRoutes);
app.use('/api/imoveis', imoveisRoutes);
app.use('/api/leads', leadsRoutes);

const frontendPath = path.resolve(__dirname, '../frontend');

app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'teste-claude.html'));
});

app.get('/index.html', (req, res) => {
  res.sendFile(path.join(frontendPath, 'teste-claude.html'));
});

app.use(express.static(frontendPath, { index: false }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`imoore-backend running on port ${PORT}`);
});
