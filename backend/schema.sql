-- Schema para Supabase do projeto Imoore

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Usuários
CREATE TABLE usuarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  senha TEXT NOT NULL,
  perfil TEXT CHECK (perfil IN ('admin','corretor','crm')) NOT NULL,
  creci TEXT,
  telefone TEXT,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP DEFAULT NOW()
);

-- Imóveis
CREATE TABLE imoveis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  tipo TEXT NOT NULL,
  finalidade TEXT NOT NULL,
  preco NUMERIC NOT NULL,
  cidade TEXT NOT NULL,
  bairro TEXT,
  quartos INT DEFAULT 0,
  banheiros INT DEFAULT 0,
  vagas INT DEFAULT 0,
  area FLOAT,
  descricao TEXT,
  fotos JSONB DEFAULT '[]',
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente','publicado','rejeitado')),
  corretor_id UUID REFERENCES usuarios(id),
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

-- Leads / CRM
CREATE TABLE leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  cidade TEXT,
  interesse TEXT,
  observacoes TEXT,
  etapa TEXT DEFAULT 'novo' CHECK (etapa IN ('novo','contato','visita','proposta','fechado')),
  historico JSONB DEFAULT '[]',
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

-- Portais de publicação (opcional)
CREATE TABLE portais (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  imovel_id UUID REFERENCES imoveis(id),
  portal TEXT NOT NULL,
  ativo BOOLEAN DEFAULT true
);
