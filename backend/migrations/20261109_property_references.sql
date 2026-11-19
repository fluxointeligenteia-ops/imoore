-- Adiciona referências sequenciais globais, preservando as já preenchidas.
-- Execute no Supabase antes de publicar a versão que exibe as referências.

BEGIN;

LOCK TABLE public.imoveis IN SHARE ROW EXCLUSIVE MODE;
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

COMMIT;
