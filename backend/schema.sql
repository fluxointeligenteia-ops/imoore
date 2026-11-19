-- Schema estrutural da Imoore.
-- Seguro para instalação inicial e execução repetida.
-- Usuários iniciais ficam separados em init-db.sql/seed.js.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS usuarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  senha TEXT NOT NULL,
  perfil TEXT CHECK (perfil IN ('admin','corretor','crm')) NOT NULL,
  creci TEXT,
  telefone TEXT,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS imoveis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  tipo TEXT NOT NULL,
  finalidade TEXT NOT NULL,
  preco NUMERIC NOT NULL,
  cidade TEXT NOT NULL,
  referencia TEXT,
  bairro TEXT,
  quartos INT DEFAULT 0,
  banheiros INT DEFAULT 0,
  vagas INT DEFAULT 0,
  area FLOAT,
  descricao TEXT,
  captacao TEXT,
  fotos JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente','publicado','rejeitado')),
  corretor_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS portais (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  imovel_id UUID REFERENCES imoveis(id) ON DELETE CASCADE,
  portal TEXT NOT NULL,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_imoveis_corretor_id ON imoveis(corretor_id);
CREATE INDEX IF NOT EXISTS idx_imoveis_status ON imoveis(status);
CREATE INDEX IF NOT EXISTS idx_imoveis_cidade ON imoveis(cidade);
CREATE INDEX IF NOT EXISTS idx_leads_etapa ON leads(etapa);
CREATE INDEX IF NOT EXISTS idx_leads_cidade ON leads(cidade);
CREATE INDEX IF NOT EXISTS idx_portais_imovel_id ON portais(imovel_id);

ALTER TABLE public.imoveis ADD COLUMN IF NOT EXISTS referencia TEXT;

CREATE SEQUENCE IF NOT EXISTS public.imovel_referencia_seq;

CREATE OR REPLACE FUNCTION public.imoore_prefixo_referencia(p_cidade TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  cidade_normalizada TEXT;
BEGIN
  cidade_normalizada := upper(regexp_replace(
    translate(
      btrim(coalesce(p_cidade, '')),
      'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ',
      'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC'
    ),
    '[^A-Z0-9]+',
    '',
    'g'
  ));

  RETURN CASE cidade_normalizada
    WHEN 'PERUIBE' THEN 'P'
    WHEN 'PRAIAGRANDE' THEN 'PG'
    WHEN 'SANTOS' THEN 'S'
    WHEN 'SAOVICENTE' THEN 'SV'
    WHEN 'GUARUJA' THEN 'G'
    WHEN 'CUBATAO' THEN 'C'
    WHEN 'BERTIOGA' THEN 'B'
    WHEN 'ITANHAEM' THEN 'I'
    WHEN 'MONGAGUA' THEN 'M'
    WHEN 'ITARIRI' THEN 'IT'
    WHEN 'PEDRODETOLEDO' THEN 'PT'
    WHEN 'ANADIAS' THEN 'AD'
    ELSE coalesce(nullif(left(cidade_normalizada, 2), ''), 'IM')
  END;
END;
$$;

WITH maior_referencia AS (
  SELECT coalesce(max(substring(referencia FROM '[0-9]+$')::BIGINT), 0) AS numero
  FROM public.imoveis
  WHERE referencia ~ '^[A-Z]+[0-9]+$'
),
imoveis_sem_referencia AS (
  SELECT
    id,
    cidade,
    row_number() OVER (ORDER BY criado_em NULLS FIRST, id) AS numero
  FROM public.imoveis
  WHERE referencia IS NULL OR btrim(referencia) = ''
)
UPDATE public.imoveis AS im
SET referencia = public.imoore_prefixo_referencia(sem.cidade) || lpad(
  (maior.numero + sem.numero)::TEXT,
  greatest(3, length((maior.numero + sem.numero)::TEXT)),
  '0'
)
FROM imoveis_sem_referencia AS sem
CROSS JOIN maior_referencia AS maior
WHERE im.id = sem.id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_imoveis_referencia_unique
  ON public.imoveis (referencia);

ALTER TABLE public.imoveis ALTER COLUMN referencia SET NOT NULL;

SELECT setval(
  'public.imovel_referencia_seq',
  coalesce(max(substring(referencia FROM '[0-9]+$')::BIGINT), 1),
  coalesce(max(substring(referencia FROM '[0-9]+$')::BIGINT), 0) > 0
)
FROM public.imoveis
WHERE referencia ~ '^[A-Z]+[0-9]+$';

CREATE OR REPLACE FUNCTION public.imoore_gerar_referencia_imovel()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.referencia := public.imoore_prefixo_referencia(NEW.cidade)
    || lpad(nextval('public.imovel_referencia_seq')::TEXT, 3, '0');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_imoveis_gerar_referencia ON public.imoveis;
CREATE TRIGGER trg_imoveis_gerar_referencia
BEFORE INSERT ON public.imoveis
FOR EACH ROW
EXECUTE FUNCTION public.imoore_gerar_referencia_imovel();
