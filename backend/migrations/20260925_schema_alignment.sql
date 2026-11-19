-- Migração incremental e não destrutiva para bancos já existentes.
-- Executar no Supabase antes do deploy que depender destes campos.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP DEFAULT NOW();
ALTER TABLE imoveis ADD COLUMN IF NOT EXISTS captacao TEXT;
ALTER TABLE portais ADD COLUMN IF NOT EXISTS criado_em TIMESTAMP DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_imoveis_corretor_id ON imoveis(corretor_id);
CREATE INDEX IF NOT EXISTS idx_imoveis_status ON imoveis(status);
CREATE INDEX IF NOT EXISTS idx_imoveis_cidade ON imoveis(cidade);
CREATE INDEX IF NOT EXISTS idx_leads_etapa ON leads(etapa);
CREATE INDEX IF NOT EXISTS idx_leads_cidade ON leads(cidade);
CREATE INDEX IF NOT EXISTS idx_portais_imovel_id ON portais(imovel_id);

-- As foreign keys existentes não são recriadas automaticamente aqui,
-- pois os nomes podem variar entre instalações. Verifique no Supabase
-- antes de alterar regras de exclusão em produção.
