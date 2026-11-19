require('dotenv').config();
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Erro: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurado no .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const users = [
  {
    nome: 'Admin Imoore',
    email: 'admin@imoore.com',
    senha: process.env.SEED_ADMIN_PASSWORD,
    perfil: 'admin',
    creci: '52050-J',
    telefone: '+5513991091887',
    ativo: true,
  },
  {
    nome: 'Corretor Imoore',
    email: 'corretor@imoore.com',
    senha: process.env.SEED_CORRETOR_PASSWORD,
    perfil: 'corretor',
    creci: '52050-J',
    telefone: '+5513991091887',
    ativo: true,
  },
  {
    nome: 'CRM Imoore',
    email: 'crm@imoore.com',
    senha: process.env.SEED_CRM_PASSWORD,
    perfil: 'crm',
    creci: '',
    telefone: '+5513991091887',
    ativo: true,
  },
];
if (users.some(user => !user.senha)) {
  console.error('Defina SEED_ADMIN_PASSWORD, SEED_CORRETOR_PASSWORD e SEED_CRM_PASSWORD antes de executar o seed.');
  process.exit(1);
}

async function seed() {
  console.log('Iniciando seed de usuários...');

  for (const user of users) {
    const passwordHash = await bcrypt.hash(user.senha, 10);
    const payload = {
      nome: user.nome,
      email: user.email,
      senha: passwordHash,
      perfil: user.perfil,
      creci: user.creci,
      telefone: user.telefone,
      ativo: user.ativo,
    };

    const { data, error } = await supabase
      .from('usuarios')
      .upsert(payload, { onConflict: 'email' })
      .select('id, nome, email, perfil')
      .single();

    if (error) {
      console.error(`Falha ao criar ou atualizar usuário ${user.email}:`, error.message || error);
      process.exit(1);
    }

    console.log(`Usuário seed gravado: ${data.email} (${data.perfil})`);
  }

  console.log('Seed de usuários finalizado.');
  process.exit(0);
}

seed();
