# Supabase + Deploy — Guia Rápido (5 Passos)

**Tempo total:** ~15 minutos  
**Dificuldade:** Fácil (copy/paste)

---

## 1️⃣ Criar Conta Supabase

### 1.1 Ir para Supabase
```
https://supabase.com
```

### 1.2 Clicar em "Sign Up"
- Email: seu email
- Senha: cria uma senha
- Clica "Sign up"

### 1.3 Confirmar email
- Supabase manda email de confirmação
- Clica no link

### 1.4 Criar Organização
- Nome: "imoore" (ou seu nome)
- Avança

---

## 2️⃣ Criar Projeto PostgreSQL

### 2.1 Clica "New Project"

### 2.2 Preenche os dados
- **Name:** `imoore-producao` (ou qualquer nome)
- **Database Password:** Cria uma senha FORTE (use: `Imoore@2026Strong!`)
- **Region:** `Brazil (São Paulo)` ← escolhe isso!
- **Pricing Plan:** `Free` ← gratuito!

### 2.3 Clica "Create new project"
Aguarda ~2 minutos o banco ser criado...

---

## 3️⃣ Executar Script SQL

### 3.1 Ir para "SQL Editor"
Na barra esquerda → SQL Editor

### 3.2 Criar nova query
- Clica "New Query"
- Abre um editor branco

### 3.3 Copiar/colar SQL
Abra este arquivo no VS Code:
```
c:\Users\Aluno\Desktop\Imoore\backend\init-db.sql
```

Seleciona tudo (Ctrl+A) → Copia (Ctrl+C)

Volta no Supabase e cola (Ctrl+V) na query em branco

### 3.4 Executar
- Clica no botão ▶️ "Run" (canto superior direito)
- Aguarda executar

Se tudo OK, vai mostrar:
```
✓ 1 completed in 1.2s
```

---

## 4️⃣ Copiar Credenciais

### 4.1 Ir para Project Settings
Clica em ⚙️ (engrenagem) no canto inferior esquerdo → "Project Settings"

### 4.2 Ir para "API"
Na barra esquerda, clica em "API"

### 4.3 Copiar os valores

**Procura por:**

| Campo | Valor | Ação |
|-------|-------|------|
| **Project URL** | começa com `https://` | Copia (vai em `SUPABASE_URL`) |
| **anon public** | chave longa | Copia (vai em `SUPABASE_ANON_KEY`) |
| **service_role secret** | chave ainda maior | Copia (vai em `SUPABASE_SERVICE_ROLE_KEY`) |

### 4.4 Guardar em um bloco de notas
Cole em um arquivo temporário para não perder!

---

## 5️⃣ Atualizar `.env` Local

### 5.1 Abrir arquivo `.env`
```
c:\Users\Aluno\Desktop\Imoore\backend\.env
```

### 5.2 Preencher com credenciais do Supabase

Altere de:
```env
PORT=3001
JWT_SECRET=imoore_secret_2026_dev_change_in_production
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DEMO_MODE=true
```

Para:
```env
PORT=3001
JWT_SECRET=imoore_secret_2026_dev_change_in_production
SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_ANON_KEY=sua_chave_anon_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
DEMO_MODE=false
```

**Exemplo real:**
```env
SUPABASE_URL=https://xyz123abc.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 5.3 Salvar (Ctrl+S)

---

## 6️⃣ Testar Localmente

### 6.1 Terminal - parar servidor anterior
```powershell
cd c:\Users\Aluno\Desktop\Imoore\backend
npm start
```

Vai mostrar:
```
✓ Supabase conectado!
imoore-backend running on port 3001
```

### 6.2 Testar no navegador
Abre: **http://localhost:3001/imoore-login.html**

- Email: `crm@imoore.com`
- Senha: `crm@2026`
- Clica "Entrar"

Se entrou no CRM → ✅ Supabase está funcionando!

### 6.3 Criar um lead para testar
- Nome: "Teste Supabase"
- Telefone: 13999999999
- Clica "Salvar lead"

Se o lead apareceu → ✅ Banco de dados persistente!

---

## 7️⃣ Fazer Deploy no Railway

### 7.1 Criar conta Railway
```
https://railway.app
```
- Clica "Start Project"
- Autentica com GitHub (precisa de GitHub account)
- Autoriza Railway a acessar GitHub

### 7.2 Conectar Repositório

Se já tem Git:
```powershell
cd c:\Users\Aluno\Desktop\Imoore
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/seu-usuario/imoore.git
git push -u origin main
```

Se não tem Git, pode fazer upload manual no Railway.

### 7.3 Criar projeto no Railway
- Clica "Create New"
- Seleciona "Deploy from GitHub"
- Seleciona repositório `imoore`
- Railway detecta `package.json` automaticamente

### 7.4 Configurar Variáveis de Ambiente
Railway → Project → Variables

Adiciona todas as do `.env`:
```
PORT=3001
JWT_SECRET=imoore_secret_2026_dev_change_in_production
SUPABASE_URL=https://xyz123abc.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
DEMO_MODE=false
NODE_ENV=production
```

### 7.5 Deploy automático
Railway vai fazer deploy automaticamente. Aguarda ~3-5 minutos.

Quando terminar, você vê:
```
✓ Deployment successful
Your app is live at: https://imoore-railway.up.railway.app
```

---

## 8️⃣ Testar em Produção

### 8.1 Abrir no navegador
```
https://imoore-railway.up.railway.app/imoore-login.html
```

- Email: `crm@imoore.com`
- Senha: `crm@2026`
- Clica "Entrar"

Se funcionou → ✅ Deploy OK!

### 8.2 Criar lead em produção
Para garantir que dados persistem:
- Nome: "Teste Deploy Prod"
- Salva lead
- Recarrega página (F5)
- Lead ainda está lá? → ✅ Banco persistindo!

---

## 🎯 Resumo

| Passo | Tempo | Status |
|-------|-------|--------|
| 1. Supabase account | 2 min | ✅ |
| 2. Criar projeto PG | 2 min | ✅ |
| 3. Executar SQL | 1 min | ✅ |
| 4. Copiar credenciais | 2 min | ✅ |
| 5. Atualizar `.env` | 1 min | ✅ |
| 6. Testar localmente | 2 min | ✅ |
| 7. Deploy Railway | 5 min | ✅ |
| 8. Testar produção | 2 min | ✅ |
| **TOTAL** | **~19 min** | **✅** |

---

## ❓ Problemas Comuns

### "Supabase connection failed"
- Verificar se `DEMO_MODE=false` em `.env`
- Verificar se credenciais estão corretas (sem espaços extras)
- Verificar internet conectada

### "Railway deploy failed"
- Verificar se `package.json` está em `backend/`
- Verificar se `npm start` funciona localmente
- Verificar variáveis de ambiente preenchidas

### "Lead não salva"
- Verificar se SQL foi executado no Supabase
- Verificar se tabela `leads` existe (ir em Supabase → Editor → Table `leads`)

### "Erro 502 no Railway"
- Aplicação está processando, aguarda 1-2 min
- Se persistir, ver logs: Railway → Logs

---

## 🚀 Próximo Passo (Opcional)

Depois de tudo funcionando:

### Configurar Domínio Personalizado
- Railway → Project → Settings → Domain
- Pode apontar seu domínio `imoore.com.br` para Railway

### Adicionar Mais Funcionalidades
- Exportar leads em CSV
- Relatórios de vendas
- Integração WhatsApp Bot
- App mobile

---

**Pronto! Seu sistema está no ar! 🎉**

**URL de produção:**
```
https://imoore-railway.up.railway.app
```

**Credenciais:**
- Admin: `admin@imoore.com` / `imoore@2026`
- Corretor: `corretor@imoore.com` / `imoore123`
- CRM: `crm@imoore.com` / `crm@2026`

Compartilha a URL com seus clientes!
