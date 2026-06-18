# Variáveis de Ambiente — Documentação

## Visão Geral

O arquivo `.env` controla o comportamento da aplicação em desenvolvimento e produção.

---

## Variáveis Disponíveis

### `PORT`

**Tipo:** `number`  
**Padrão:** `3001`  
**Descrição:** Porta em que o servidor Express rodará.

```env
PORT=3001
```

---

### `JWT_SECRET`

**Tipo:** `string`  
**Padrão:** `imoore_secret_2026`  
**Descrição:** Chave secreta para assinar tokens JWT.

⚠️ **IMPORTANTE:** Em produção, use um valor aleatório com mínimo 32 caracteres.

```bash
# Gerar seguro:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

```env
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

---

### `SUPABASE_URL`

**Tipo:** `string` (URL)  
**Padrão:** (vazio)  
**Descrição:** URL do projeto Supabase.

Formato: `https://seu-projeto.supabase.co`

Encontrar em Supabase: **Project Settings → API**

```env
SUPABASE_URL=https://seu-projeto.supabase.co
```

---

### `SUPABASE_ANON_KEY`

**Tipo:** `string` (JWT)  
**Padrão:** (vazio)  
**Descrição:** API Key pública (anon) do Supabase.

⚠️ Usar a chave **anon**, não a **service role**.

Encontrar em Supabase: **Project Settings → API → anon public**

```env
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### `SUPABASE_SERVICE_ROLE_KEY`

**Tipo:** `string` (JWT)  
**Padrão:** (vazio)  
**Descrição:** API Key secreta (service role) do Supabase.

⚠️ **NUNCA compartilhar publicamente!**

Encontrar em Supabase: **Project Settings → API → service_role secret**

```env
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### `DEMO_MODE`

**Tipo:** `boolean` (`true` | `false`)  
**Padrão:** `true`  
**Descrição:** Se `true`, usa dados em memória. Se `false`, usa Supabase.

```env
DEMO_MODE=true   # Desenvolvimento local, sem Supabase
DEMO_MODE=false  # Produção, com Supabase
```

---

### `NODE_ENV`

**Tipo:** `string`  
**Padrão:** `development`  
**Descrição:** Ambiente de execução.

Valores:
- `development` — Logs verbosos, sem otimizações
- `production` — Otimizado, logs mínimos

```env
NODE_ENV=development
NODE_ENV=production
```

---

### `WPP_NUM`

**Tipo:** `string` (phone)  
**Padrão:** `5513991091887`  
**Descrição:** Número WhatsApp para contato.

Formato internacional sem `+`:

```env
WPP_NUM=5513991091887
```

---

## Exemplos de Configuração

### Desenvolvimento Local (Demo)

```env
PORT=3001
JWT_SECRET=dev_secret_for_testing_only
DEMO_MODE=true
NODE_ENV=development
WPP_NUM=5513991091887
```

**Resultado:** Funciona sem Supabase. Dados perdidos ao reiniciar.

---

### Desenvolvimento com Supabase Real

```env
PORT=3001
JWT_SECRET=seu_secret_aleatorio_de_32_chars_minimo
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DEMO_MODE=false
NODE_ENV=development
WPP_NUM=5513991091887
```

**Resultado:** Usa Supabase real. Dados persistem.

---

### Produção (Railway/Render)

```env
PORT=3001
JWT_SECRET=sua_chave_super_segura_aleatoria_aqui
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DEMO_MODE=false
NODE_ENV=production
WPP_NUM=5513991091887
```

**Resultado:** Otimizado para produção. Supabase real. Seguro.

---

## Segurança

### ⚠️ NÃO FAZER

- ❌ Nunca commitar `.env` no Git
- ❌ Nunca compartilhar `SUPABASE_SERVICE_KEY` publicamente
- ❌ Nunca usar `JWT_SECRET` fraco (<32 chars)
- ❌ Nunca deixar `DEMO_MODE=true` em produção

### ✅ FAZER

- ✅ Usar `.gitignore` para excluir `.env`
- ✅ Usar arquivo `.env.example` com placeholders
- ✅ Usar variáveis de ambiente no CI/CD (GitHub Actions, Railway, etc.)
- ✅ Rotacionar `JWT_SECRET` periodicamente
- ✅ Ativar 2FA no Supabase

---

## Troubleshooting

| Erro | Causa | Solução |
|------|-------|---------|
| "Supabase not configured" | `DEMO_MODE=false` mas URL/KEY vazios | Preencha as variáveis ou use `DEMO_MODE=true` |
| "JWT invalid" | `JWT_SECRET` diferente entre requests | Certifique que não há espaços extras |
| "Connection refused" | Porta em uso | Mude `PORT` ou mate processo na porta |
| "Unauthorized" | Token expirado | Refaça login |

---

**Última atualização:** 09/06/2026
