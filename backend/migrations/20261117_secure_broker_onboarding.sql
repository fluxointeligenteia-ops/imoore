-- Corretor onboarding and approval migration. Safe to run on existing Supabase projects.
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'aprovado';
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS aceite_lgpd BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS aceite_contato BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS aceite_lgpd_em TIMESTAMPTZ;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS aprovado_em TIMESTAMPTZ;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS rejeitado_em TIMESTAMPTZ;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS revogado_em TIMESTAMPTZ;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS motivo_rejeicao TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_status_check;
ALTER TABLE usuarios ADD CONSTRAINT usuarios_status_check CHECK (status IN ('pendente','aprovado','rejeitado','revogado'));
CREATE INDEX IF NOT EXISTS idx_usuarios_status ON usuarios(status);

CREATE TABLE IF NOT EXISTS corretor_candidaturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  email TEXT NOT NULL,
  creci TEXT NOT NULL,
  cidade TEXT NOT NULL,
  experiencia TEXT,
  imobiliaria TEXT,
  aceite_aviso BOOLEAN NOT NULL DEFAULT false,
  aceite_contato BOOLEAN NOT NULL DEFAULT false,
  consentimento_versao TEXT NOT NULL,
  consentimento_em TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','aprovado','rejeitado','revogado')),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  revisado_por UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  revisado_em TIMESTAMPTZ,
  motivo_rejeicao TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_corretor_candidaturas_status ON corretor_candidaturas(status, criado_em DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_corretor_candidaturas_pendente_email
  ON corretor_candidaturas(email) WHERE status = 'pendente';

-- Do not block existing active brokers during migration; new broker accounts are pending by default in application logic.
