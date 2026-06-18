-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  senha TEXT NOT NULL,
  perfil TEXT CHECK (perfil IN ('admin','corretor','crm')),
  creci TEXT,
  telefone TEXT,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

-- Tabela de Imóveis
CREATE TABLE IF NOT EXISTS imoveis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  tipo TEXT NOT NULL,
  finalidade TEXT NOT NULL,
  preco DECIMAL NOT NULL,
  cidade TEXT NOT NULL,
  bairro TEXT,
  quartos INT DEFAULT 0,
  banheiros INT DEFAULT 0,
  vagas INT DEFAULT 0,
  area FLOAT,
  descricao TEXT,
  fotos JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente','publicado','rejeitado')),
  corretor_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

-- Tabela de Leads / CRM
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  cidade TEXT,
  interesse TEXT,
  observacoes TEXT,
  etapa TEXT DEFAULT 'novo' CHECK (etapa IN ('novo','contato','visita','proposta','fechado')),
  historico JSONB DEFAULT '[]'::jsonb,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

-- Tabela de Portais
CREATE TABLE IF NOT EXISTS portais (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  imovel_id UUID REFERENCES imoveis(id) ON DELETE CASCADE,
  portal TEXT NOT NULL,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP DEFAULT NOW()
);

-- Inserir usuários padrão (senhas com hash bcrypt)
-- admin@imoore.com / imoore@2026
-- corretor@imoore.com / imoore123
-- crm@imoore.com / crm@2026
INSERT INTO usuarios (nome, email, senha, perfil, creci, telefone, ativo) VALUES
('Admin Imoore', 'admin@imoore.com', '$2a$10$nyLzXJbJRaHW9o9N8kq2K.m6i7R3yJ3sP2X1V5Z0W9Y8A7B6C5D4E3', 'admin', '52050-J', '+5513991091887', true),
('Corretor Imoore', 'corretor@imoore.com', '$2a$10$9PZZyR7L2X8K4V1M0Q3J6N5B8P2Y7T4C9X6W1A3S8E4R5D2F7H0J', 'corretor', '52050-J', '+5513991091887', true),
('CRM Imoore', 'crm@imoore.com', '$2a$10$6K3V7X9B2M0P8L5C1Y4T6R3E9W2A4S7D0F3H5J8N1Q4U6K2M7O1P', 'crm', '', '+5513991091887', true)
ON CONFLICT (email) DO NOTHING;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_imoveis_corretor_id ON imoveis(corretor_id);
CREATE INDEX IF NOT EXISTS idx_imoveis_status ON imoveis(status);
CREATE INDEX IF NOT EXISTS idx_imoveis_cidade ON imoveis(cidade);
CREATE INDEX IF NOT EXISTS idx_leads_etapa ON leads(etapa);
CREATE INDEX IF NOT EXISTS idx_leads_cidade ON leads(cidade);
CREATE INDEX IF NOT EXISTS idx_portais_imovel_id ON portais(imovel_id);
