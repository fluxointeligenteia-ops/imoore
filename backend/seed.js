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
    senha: 'imoore@2026',
    perfil: 'admin',
    creci: '52050-J',
    telefone: '+5513991091887',
    ativo: true,
  },
  {
    nome: 'Corretor Imoore',
    email: 'corretor@imoore.com',
    senha: 'imoore123',
    perfil: 'corretor',
    creci: '52050-J',
    telefone: '+5513991091887',
    ativo: true,
  },
  {
    nome: 'CRM Imoore',
    email: 'crm@imoore.com',
    senha: 'crm@2026',
    perfil: 'crm',
    creci: '',
    telefone: '+5513991091887',
    ativo: true,
  },
];

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
