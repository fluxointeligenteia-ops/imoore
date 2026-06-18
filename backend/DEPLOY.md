# Guia de Deploy — imoore

## Pré-requisitos

- Node.js v18+
- npm ou yarn
- Conta Supabase (gratuita)
- Conta em serviço de hosting (Railway, Render, ou outro)

---

## Passo 1: Preparar Supabase

### 1.1 Criar projeto

1. Acesse [supabase.com](https://supabase.com)
2. Clique em "New Project"
3. Preencha os dados (organization, project name, password do DB)
4. Aguarde criação (~2 minutos)

### 1.2 Executar script SQL

1. Na dashboard, vá para **SQL Editor**
2. Clique em "New Query"
3. Cole todo o conteúdo de `backend/init-db.sql`
4. Clique em "Run"
5. Confirme que as 4 tabelas foram criadas

### 1.3 Obter credenciais

1. Vá para **Project Settings → API**
2. Copie:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY`
   - **Service role secret** key → `SUPABASE_SERVICE_ROLE_KEY`

---

## Passo 2: Configurar `.env`

```bash
cd backend
cp .env.example .env
```

Edite `backend/.env`:

```env
PORT=3001
JWT_SECRET=gerado_aleatoriamente_min_32_chars
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOi... (sua chave anon)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi... (sua service role key)
DEMO_MODE=false
NODE_ENV=production
WPP_NUM=5513991091887
```

**Gerar JWT_SECRET seguro:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Passo 3: Deploy em Railway (Recomendado)

### 3.1 Instalar Railway CLI

```bash
npm install -g @railway/cli
railway login
```

### 3.2 Inicializar projeto

```bash
cd backend
railway init
```

Selecione:
- `Create a new project`
- `Node.js`

### 3.3 Adicionar variáveis de ambiente

```bash
railway variables
```

Cole todas as variáveis do seu `.env`:

```
PORT=3001
JWT_SECRET=sua_senha_aleatoria
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
DEMO_MODE=false
NODE_ENV=production
WPP_NUM=5513991091887
```

### 3.4 Deploy

```bash
railway up
```

Railway automaticamente:
- Detecta `package.json`
- Instala dependências
- Roda `npm start`
- Gera URL pública

**URL do backend:** `https://seu-projeto-railway.up.railway.app`

---

## Passo 4: Atualizar Frontend para Produção

No arquivo `frontend/utils.js`, altere:

```javascript
const API_BASE = window.API_BASE || 'https://seu-projeto-railway.up.railway.app/api';
```

Ou adicione na tag `<script>` do HTML antes de `utils.js`:

```html
<script>
  window.API_BASE = 'https://seu-projeto-railway.up.railway.app/api';
</script>
```

---

## Passo 5: Deploy do Frontend

### Opção A: Vercel (Recomendado para frontend estático)

```bash
npm install -g vercel
vercel login
cd frontend
vercel
```

Vercel gera URL como `https://imoore.vercel.app`

### Opção B: Servir pelo mesmo backend (Railway)

Já está configurado! Acesse:
- `https://seu-projeto-railway.up.railway.app/imoore-login.html`
- `https://seu-projeto-railway.up.railway.app/imoore-crm.html`

---

## Checklist Final

- [ ] Supabase criado e tabelas inseridas
- [ ] `.env` preenchido com credenciais reais
- [ ] Backend deployado em Railway (ou outro)
- [ ] Frontend atualiza `API_BASE` para URL do backend
- [ ] Testou login em produção
- [ ] Testou criação de lead
- [ ] Testou upload de foto (se habilitado)

---

## Testes em Produção

```bash
cd backend
node verify.js
```

Se tudo passou (todos os testes com status 200/201), está pronto!

---

## Monitoramento

### Logs em Railway

```bash
railway logs
```

### Status do Supabase

Vá para **Dashboard → Realtime** para monitorar atividade do banco.

---

## Troubleshooting de Deploy

| Erro | Solução |
|------|---------|
| "Database connection failed" | Verifique `SUPABASE_URL` e `SUPABASE_ANON_KEY` |
| "JWT invalid" | `JWT_SECRET` diferente entre dev e prod |
| "404 not found" | Frontend ou backend URL incorreta |
| "Port already in use" | Mude `PORT` no `.env` |
| "CORS error" | Backend não está com CORS habilitado (já está) |

---

## Rollback

Se precisar voltar para demo mode rapidamente:

```bash
railway variables set DEMO_MODE=true
```

O backend voltará a usar dados em memória.

---

## Próximos Passos

1. **Domínio personalizado:** Configure DNS para apontar para o backend/frontend
2. **SSL:** Railway/Vercel já incluem SSL automático
3. **Backups:** Configure backup automático no Supabase
4. **Monitoramento:** Integre Sentry ou similar para erros em produção
5. **Analytics:** Adicione rastreamento de usuários

---

**Última atualização:** 09/06/2026
