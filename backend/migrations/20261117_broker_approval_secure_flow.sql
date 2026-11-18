-- Fluxo seguro de candidatura, análise e aprovação de corretores.
-- Execute uma vez no Supabase SQL Editor após backup. Não contém credenciais.

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'aprovado',
  ADD COLUMN IF NOT EXISTS aceite_lgpd BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS aceite_contato BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS aceite_lgpd_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS senha_troca_obrigatoria BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMPTZ;

ALTER TABLE usuarios
  DROP CONSTRAINT IF EXISTS usuarios_status_check;

ALTER TABLE usuarios
  ADD CONSTRAINT usuarios_status_check
  CHECK (status IN ('pendente', 'aprovado', 'rejeitado', 'revogado'));

CREATE TABLE IF NOT EXISTS corretor_candidaturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  email TEXT NOT NULL,
  creci TEXT NOT NULL,
  cidade TEXT NOT NULL,
  experiencia TEXT,
  imobiliaria TEXT,
  cnpj TEXT,
  endereco TEXT,
  aceite_lgpd BOOLEAN NOT NULL DEFAULT false,
  aceite_contato BOOLEAN NOT NULL DEFAULT false,
  consentimento_versao TEXT NOT NULL,
  consentimento_em TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  revisado_por UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  revisado_em TIMESTAMPTZ,
  motivo_rejeicao TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT corretor_candidaturas_status_check CHECK (status IN ('pendente', 'aprovado', 'rejeitado', 'revogado')),
  CONSTRAINT corretor_candidaturas_lgpd_check CHECK (aceite_lgpd = true)
);

CREATE INDEX IF NOT EXISTS idx_corretor_candidaturas_status
  ON corretor_candidaturas (status, criado_em DESC);

CREATE INDEX IF NOT EXISTS idx_corretor_candidaturas_email
  ON corretor_candidaturas (lower(email));
