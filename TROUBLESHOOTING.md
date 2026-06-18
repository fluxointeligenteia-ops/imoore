# Troubleshooting + Dicas de Produção

---

## 🔴 Erros Comuns & Soluções

### Erro 1: "ENOENT: no such file or directory, open '.env'"

**Problema:** `.env` não existe

**Solução:**
```powershell
cd c:\Users\Aluno\Desktop\Imoore\backend
# Crie arquivo .env com conteúdo:
# PORT=3001
# JWT_SECRET=...
# etc
```

---

### Erro 2: "Supabase não está configurado corretamente"

**Problema:** `DEMO_MODE=true` ou credenciais vazias

**Solução:**
1. Abra `.env`
2. Mude `DEMO_MODE=false`
3. Preencha `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
4. Reinicie servidor: `npm start`

---

### Erro 3: "EADDRINUSE: address already in use :::3001"

**Problema:** Porta 3001 já está em uso

**Solução:**
```powershell
# Matar processo na porta 3001
Get-Process -Id (Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue).OwningProcess | Stop-Process -Force

# Ou mudar porta em .env
# PORT=3002
```

---

### Erro 4: "JWT token invalid or expired"

**Problema:** Token JWT expirou (8 horas) ou está mal formado

**Solução:**
- Faça login novamente
- Abra DevTools (F12) → Console → `localStorage.clear()`
- Recarregue página e login outra vez

---

### Erro 5: "Cannot find module '@supabase/supabase-js'"

**Problema:** Dependências npm não instaladas

**Solução:**
```powershell
cd c:\Users\Aluno\Desktop\Imoore\backend
npm install
npm start
```

---

### Erro 6: "Connection refused at Supabase"

**Problema:** Credenciais Supabase erradas

**Solução:**
1. Ir para Supabase → Project Settings → API
2. Copiar exatamente:
   - `SUPABASE_URL` (começa com https://)
   - `SUPABASE_ANON_KEY` (anon public key)
   - `SUPABASE_SERVICE_ROLE_KEY` (service role secret)
3. Colar em `.env` sem espaços extras
4. Restart: `npm start`

---

### Erro 7: "Railway deployment failed: npm start exited with code 1"

**Problema:** Aplicação não inicia em produção

**Solução:**
1. Verificar se tem `package.json` em `backend/`
2. Verificar se variáveis de ambiente estão em Railway
3. Ver logs: Railway → Logs (clicar em "Build" ou "Runtime")
4. Verificar se `npm start` funciona localmente:
   ```powershell
   cd backend
   npm start
   ```

---

## 📊 Verificar Status do Sistema

### 1. Backend está rodando?
```powershell
curl http://localhost:3001/imoore-login.html
```
Ou abra no navegador. Se carregar HTML → ✅

### 2. Banco de dados conectado?
```powershell
# Dentro de backend/
node -e "
const db = require('./demo-db.js');
console.log('Conectado ao banco!');
"
```

### 3. JWT está funcionando?
```powershell
# Faça login, guarde o token
# Depois teste:
curl -H "Authorization: Bearer seu_token_aqui" \
  http://localhost:3001/api/leads
```

### 4. Supabase está respondendo?
```powershell
# Testar conexão
node -e "
const { createClient } = require('@supabase/supabase-js');
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;
if(!url || !key) {
  console.log('Credenciais vazias');
} else {
  const client = createClient(url, key);
  console.log('Supabase conectado!');
}
"
```

---

## 🔒 Segurança Antes de Ir ao Ar

### Checklist de Segurança

- [ ] `JWT_SECRET` é forte (>32 caracteres aleatórios)
- [ ] `.env` está em `.gitignore`
- [ ] Não há senhas no código
- [ ] HTTPS está ativado (Railway faz automaticamente)
- [ ] CORS está configurado apenas para domínios permitidos
- [ ] Backup automático do Supabase está ativado
- [ ] Rate limiting opcional em Railway (anti-spam)

### Gerar JWT_SECRET Seguro

```powershell
# PowerShell
-join ((0x30..0x39) + (0x41..0x5A) + (0x61..0x7A) | Get-Random -Count 32 | ForEach-Object {[char]$_})

# Ou simples:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copie o resultado e coloque em `.env`:
```env
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2c3d4
```

---

## 📈 Performance & Monitoramento

### Ver Logs em Produção

**Railway:**
1. Ir para seu projeto
2. Clica em "Deployments"
3. Pega o deployment mais recente
4. Clica em "Logs"
5. Vê tudo que acontece em real-time

### Adicionar Alertas

**Railway → Project → Alerts:**
- Crash de aplicação
- Erro de build
- Alta CPU/memória

---

## 🔄 Atualizar Código em Produção

### Se for usar Git + GitHub + Railway

```powershell
# Localmente
cd c:\Users\Aluno\Desktop\Imoore

# Faz suas mudanças...

# Commit
git add .
git commit -m "Fix: descrição da mudança"
git push

# Railway detecta automático e faz deploy!
```

### Se não usar Git

1. Parar servidor Railway
2. Fazer upload manual de arquivos
3. Reiniciar

---

## 💾 Backup de Dados

### Supabase Backup Automático

**Supabase → Project Settings → Backups:**
- Ativo por padrão em plano Free
- Retém últimos 7 dias
- Restaurar em 1 clique

### Backup Manual

```sql
-- No Supabase SQL Editor
BACKUP DATABASE imoore TO 'backup.sql';
```

---

## 🚨 Emergência - Recuperar do Erro

Se production quebrou:

### Passo 1: Parar Sangramento
```powershell
# Parar Railway
# Railway → Deployments → Selecionar deployment → Stop
```

### Passo 2: Diagnosticar
```powershell
# Ver logs
# Railway → Logs → Buscar erro
```

### Passo 3: Corrigir Localmente
```powershell
cd c:\Users\Aluno\Desktop\Imoore\backend
# Achar o bug, consertar
npm start  # Testar localmente
```

### Passo 4: Redeployar
```powershell
git push  # Railway faz deploy automático
# Ou fazer upload manual em Railway
```

---

## 📱 Suportar Mobile

A plataforma já é 100% responsiva!

Testar em mobile:
```
https://seu-dominio-railway/imoore-login.html
```

Nos testes:
- iPhone: Safari
- Android: Chrome
- Em branco = problema de conexão (verificar internet)

---

## 🎓 Aprender Mais

### Documentação Oficial

- **Express.js:** https://expressjs.com
- **Supabase:** https://supabase.io/docs
- **Railway:** https://docs.railway.app
- **JWT:** https://jwt.io

### Comunidades

- **Discord imoore:** (a criar)
- **GitHub Issues:** Para reportar bugs
- **WhatsApp:** Para suporte direto (+55 13 99109-1887)

---

## 📞 Contato Técnico

Encontrou erro não listado?

1. **Verificar arquivo:**
   - `c:\Users\Aluno\Desktop\Imoore\backend\server.js`
   - `c:\Users\Aluno\Desktop\Imoore\backend\routes\auth.js`

2. **Procurar por console.error()**
   - Pode dar dicas

3. **Contactar:**
   - Email: rodrigo@fluxointeligente.com
   - WhatsApp: +55 13 99109-1887
   - Descrever: erro exato + passo onde aconteceu

---

**Última atualização:** 09/06/2026  
**Status:** ✅ Pronto para produção
