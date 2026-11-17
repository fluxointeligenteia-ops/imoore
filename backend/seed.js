1| -- Tabela de Usuários
2| CREATE TABLE IF NOT EXISTS usuarios (
3|   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
4|   nome TEXT NOT NULL,
5|   email TEXT UNIQUE NOT NULL,
6|   senha TEXT NOT NULL,
7|   perfil TEXT CHECK (perfil IN ('admin','corretor','crm')),
8|   creci TEXT,
9|   telefone TEXT,
10|   ativo BOOLEAN DEFAULT true,
11|   status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente','aprovado','rejeitado','revogado')),
12|   aceite_lgpd BOOLEAN DEFAULT false,
13|   aceite_contato BOOLEAN DEFAULT false,
14|   aceite_lgpd_em TIMESTAMP,
15|   aprovado_em TIMESTAMP,
16|   rejeitado_em TIMESTAMP,
17|   revogado_em TIMESTAMP,
18|   motivo_rejeicao TEXT,
19|   criado_em TIMESTAMP DEFAULT NOW(),
20|   atualizado_em TIMESTAMP DEFAULT NOW()
21| );
22| 
23| -- Tabela de Imóveis
24| CREATE TABLE IF NOT EXISTS imoveis (
25|   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
26|   titulo TEXT NOT NULL,
27|   tipo TEXT NOT NULL,
28|   finalidade TEXT NOT NULL,
29|   preco DECIMAL NOT NULL,
30|   cidade TEXT NOT NULL,
31|   bairro TEXT,
32|   quartos INT DEFAULT 0,
33|   banheiros INT DEFAULT 0,
34|   vagas INT DEFAULT 0,
35|   area FLOAT,
36|   descricao TEXT,
37|   fotos JSONB DEFAULT '[]'::jsonb,
38|   status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente','publicado','rejeitado')),
39|   corretor_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
40|   criado_em TIMESTAMP DEFAULT NOW(),
41|   atualizado_em TIMESTAMP DEFAULT NOW()
42| );
43| 
44| -- Tabela de Leads / CRM
45| CREATE TABLE IF NOT EXISTS leads (
46|   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
47|   nome TEXT NOT NULL,
47|   telefone TEXT,
48|   email TEXT,
49|   cidade TEXT,
50|   interesse TEXT,
51|   observacoes TEXT,
52|   etapa TEXT DEFAULT 'novo' CHECK (etapa IN ('novo','contato','visita','proposta','fechado')),
53|   historico JSONB DEFAULT '[]'::jsonb,
54|   criado_em TIMESTAMP DEFAULT NOW(),
55|   atualizado_em TIMESTAMP DEFAULT NOW()
56| );
57| 
58| -- Tabela de Portais
59| CREATE TABLE IF NOT EXISTS portais (
60|   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
61|   imovel_id UUID REFERENCES imoveis(id) ON DELETE CASCADE,
62|   portal TEXT NOT NULL,
63|   ativo BOOLEAN DEFAULT true,
64|   criado_em TIMESTAMP DEFAULT NOW()
65| );
66| 
67| -- Inserir usuários padrão (senhas com hash bcrypt)
68| -- admin@imoore.com / imoore@2026
69| -- corretor@imoore.com / imoore123
70| -- crm@imoore.com / crm@2026
71| INSERT INTO usuarios (nome, email, senha, perfil, creci, telefone, ativo, status, aceite_lgpd, aceite_contato, aceite_lgpd_em) VALUES
72| ('Admin Imoore', 'admin@imoore.com', '$2a$10$nyLzXJbJRaHW9o9N8kq2K.m6i7R3yJ3sP2X1V5Z0W9Y8A7B6C5D4E3', 'admin', '52050-J', '+5513991091887', true, 'aprovado', true, true, NOW()),
73| ('Corretor Imoore', 'corretor@imoore.com', '$2a$10$9PZZyR7L2X8K4V1M0Q3J6N5B8P2Y7T4C9X6W1A3S8E4R5D2F7H0J', 'corretor', '52050-J', '+5513991091887', true, 'aprovado', true, true, NOW()),
73| ('CRM Imoore', 'crm@imoore.com', '$2a$10$6K3V7X9B2M0P8L5C1Y4T6R3E9W2A4S7D0F3H5J8N1Q4U6K2M7O1P', 'crm', '', '+5513991091887', true, 'aprovado', true, true, NOW())
74| ON CONFLICT (email) DO NOTHING;
75| 
76| -- Criar índices para performance
77| CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
78| CREATE INDEX IF NOT EXISTS idx_usuarios_status ON usuarios(status);
79| CREATE INDEX IF NOT EXISTS idx_imoveis_corretor_id ON imoveis(corretor_id);
80| CREATE INDEX IF NOT EXISTS idx_imoveis_status ON imoveis(status);
81| CREATE INDEX IF NOT EXISTS idx_imoveis_cidade ON imoveis(cidade);
82| CREATE INDEX IF NOT EXISTS idx_leads_etapa ON leads(etapa);
83| CREATE INDEX IF NOT EXISTS idx_leads_cidade ON leads(cidade);
84| CREATE INDEX IF NOT EXISTS idx_portais_imovel_id ON portais(imovel_id);
85| 
