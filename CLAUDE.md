# imoore — Projeto Completo para Claude Code

## Contexto do Projeto
Plataforma imobiliária completa da Baixada Santista.
Contratante: imoore Gestão de Negócios Imobiliários Ltda
CNPJ: 61.788.646/0001-70 · Creci/SP Nº 52050-J
Desenvolvido por: Fluxo Inteligente (Rodrigo Cruz de Queiroz)

## Stack atual (HTML puro — precisa evoluir)
- Frontend: HTML + CSS + JavaScript puro
- Sem backend ainda
- Sem banco de dados ainda

## Arquivos do projeto
- index.html → Site público (imoore.com.br)
- imoore-login.html → Tela de login
- imoore-admin.html → Painel admin (aprovação de imóveis)
- imoore-corretor.html → Painel do corretor (cadastro de imóveis)
- imoore-crm.html → CRM com funil Kanban de leads

## Credenciais atuais (simuladas — sem backend real)
Admin: admin / imoore@2026
Tamara: tamara / tamara@2026
Corretor: corretor / imoore123
CRM: crm / crm@2026

## Identidade Visual
- Laranja principal: #F26522
- Fonte: Plus Jakarta Sans
- Logo: arquivo PNG circular laranja (ChatGPT_Image_20_05_2026__00_43_32.png)
- Creci/SP Nº 52050-J deve aparecer em todos os painéis

## Cidades de atuação
Santos, São Vicente, Guarujá, Praia Grande, Cubatão, Bertioga,
Itanhaém, Mongaguá, Peruíbe, Itariri, Pedro de Toledo, Ana Dias

## WhatsApp de contato
+55 13 99109-1887

## O que PRECISA ser feito (próxima fase — 3 dias)
1. Backend Node.js + Express
2. Banco de dados (recomendado: Supabase — gratuito)
3. Login real com JWT
4. CRUD de imóveis com upload de fotos (Cloudflare R2 ou Supabase Storage)
5. Aprovação de imóveis pelo admin
6. Leads salvos em banco de dados
7. CRM com dados persistentes
8. API REST para conectar frontend ao backend

## Comandos sugeridos para o Claude Code

### Iniciar projeto Node.js + Express + Supabase
```bash
mkdir imoore-backend
cd imoore-backend
npm init -y
npm install express cors dotenv @supabase/supabase-js bcryptjs jsonwebtoken multer
```

### Estrutura de pastas recomendada
```
imoore/
├── frontend/          # Arquivos HTML atuais
│   ├── index.html
│   ├── imoore-login.html
│   ├── imoore-admin.html
│   ├── imoore-corretor.html
│   └── imoore-crm.html
├── backend/
│   ├── server.js      # Express principal
│   ├── routes/
│   │   ├── auth.js    # Login/logout
│   │   ├── imoveis.js # CRUD imóveis
│   │   └── leads.js   # CRM leads
│   ├── middleware/
│   │   └── auth.js    # JWT verificação
│   └── .env           # Variáveis de ambiente
└── README.md
```

### Variáveis de ambiente (.env)
```
PORT=3001
SUPABASE_URL=sua_url_supabase
SUPABASE_KEY=sua_chave_supabase
JWT_SECRET=imoore_secret_2026
WPP_NUM=5513991091887
```

### Schema do banco Supabase (SQL)
```sql
-- Usuários
CREATE TABLE usuarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  senha TEXT NOT NULL,
  perfil TEXT CHECK (perfil IN ('admin','corretor','crm')),
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
  preco DECIMAL NOT NULL,
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

-- Portais de publicação
CREATE TABLE portais (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  imovel_id UUID REFERENCES imoveis(id),
  portal TEXT NOT NULL,
  ativo BOOLEAN DEFAULT true
);
```

## Prompt para usar no Claude Code (terminal)

Cole isso no Claude Code para iniciar:

"Você é um desenvolvedor full-stack sênior.
Temos uma plataforma imobiliária chamada imoore para a Baixada Santista.
O frontend já está pronto em HTML/CSS/JS puro (5 arquivos).
Preciso que você crie o backend Node.js + Express com:
1. Autenticação JWT real
2. Conexão com Supabase (banco de dados)
3. CRUD completo de imóveis com upload de fotos
4. API de leads para o CRM
5. Middleware de aprovação (admin aprova imóvel antes de publicar)
6. Conectar o frontend existente via fetch() às rotas da API
Use o schema SQL do arquivo CLAUDE.md como base.
Comece pelo server.js e routes/auth.js"

## Informações do contrato
- Prazo:  dias para entrega
- Valor total: R$ 
- Contratante: Tamara Priscilla Alves
- Contratado: Rodrigo Cruz de Queiroz (Fluxo Inteligente)
- Foro: Comarca de Peruíbe/SP