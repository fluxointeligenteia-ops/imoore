1| -- Schema para Supabase do projeto Imoore
2| 
3| CREATE EXTENSION IF NOT EXISTS "pgcrypto";
4| 
5| -- Usuários
6| CREATE TABLE usuarios (
7|   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
8|   nome TEXT NOT NULL,
9|   email TEXT UNIQUE NOT NULL,
10|   senha TEXT NOT NULL,
11|   perfil TEXT CHECK (perfil IN ('admin','corretor','crm')) NOT NULL,
12|   creci TEXT,
13|   telefone TEXT,
14|   ativo BOOLEAN DEFAULT true,
15|   status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente','aprovado','rejeitado','revogado')) NOT NULL,
16|   aceite_lgpd BOOLEAN DEFAULT false,
17|   aceite_contato BOOLEAN DEFAULT false,
18|   aceite_lgpd_em TIMESTAMP,
19|   aprovado_em TIMESTAMP,
20|   rejeitado_em TIMESTAMP,
21|   revogado_em TIMESTAMP,
22|   motivo_rejeicao TEXT,
23|   criado_em TIMESTAMP DEFAULT NOW(),
24|   atualizado_em TIMESTAMP DEFAULT NOW()
25| );
26| 
27| -- Imóveis
28| CREATE TABLE imoveis (
29|   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
30|   titulo TEXT NOT NULL,
31|   tipo TEXT NOT NULL,
32|   finalidade TEXT NOT NULL,
33|   preco NUMERIC NOT NULL,
34|   cidade TEXT NOT NULL,
35|   bairro TEXT,
36|   quartos INT DEFAULT 0,
37|   banheiros INT DEFAULT 0,
37|   vagas INT DEFAULT 0,
38|   area FLOAT,
39|   descricao TEXT,
40|   fotos JSONB DEFAULT '[]',
41|   status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente','publicado','rejeitado')),
42|   corretor_id UUID REFERENCES usuarios(id),
43|   criado_em TIMESTAMP DEFAULT NOW(),
44|   atualizado_em TIMESTAMP DEFAULT NOW()
45| );
46| 
47| -- Leads / CRM
48| CREATE TABLE leads (
49|   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
50|   nome TEXT NOT NULL,
51|   telefone TEXT,
52|   email TEXT,
53|   cidade TEXT,
54|   interesse TEXT,
55|   observacoes TEXT,
56|   etapa TEXT DEFAULT 'novo' CHECK (etapa IN ('novo','contato','visita','proposta','fechado')),
57|   historico JSONB DEFAULT '[]',
58|   criado_em TIMESTAMP DEFAULT NOW(),
59|   atualizado_em TIMESTAMP DEFAULT NOW()
60| );
61| 
62| -- Portais de publicação (opcional)
63| CREATE TABLE portais (
64|   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
65|   imovel_id UUID REFERENCES imoveis(id),
66|   portal TEXT NOT NULL,
67|   ativo BOOLEAN DEFAULT true
68| );
69| 
