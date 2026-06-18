# Imoore

Aplicacao imobiliaria com site publico, paineis operacionais e API Node.js. O frontend e feito em HTML, CSS e JavaScript puro; o backend usa Express, JWT e Supabase para banco de dados e storage.

## Status

- Frontend estatico em `frontend/`
- Backend Express em `backend/`
- Banco de dados previsto em Supabase
- Deploy documentado originalmente para Railway/Vercel
- Preparacao desejada: Docker + VPS HostGator

## Estrutura do Projeto

```text
Imoore/
+-- backend/
|   +-- routes/
|   |   +-- auth.js
|   |   +-- imoveis.js
|   |   +-- leads.js
|   +-- middleware/
|   |   +-- auth.js
|   +-- server.js
|   +-- demo-db.js
|   +-- seed.js
|   +-- schema.sql
|   +-- init-db.sql
|   +-- check-deployment.js
|   +-- ENV_VARS.md
|   +-- DEPLOY.md
|   +-- package.json
|   +-- .env.example
+-- frontend/
|   +-- teste-claude.html
|   +-- imoore-entrar.html
|   +-- imoore-crm.html
|   +-- painel-corretor.html
|   +-- utils.js
|   +-- api-config.js
|   +-- style.css
|   +-- .htaccess
|   +-- assets/
+-- README.md
+-- QUICK_START.md
+-- TROUBLESHOOTING.md
+-- LAUNCH_CHECKLIST.md
+-- package.json
```

## Componentes

### Frontend

O frontend esta em `frontend/` e e servido pelo backend Express a partir de `backend/server.js`.

Arquivos principais:

- `teste-claude.html`: pagina publica principal servida em `/` e `/index.html`
- `imoore-entrar.html`: tela de login
- `imoore-crm.html`: painel CRM
- `painel-corretor.html`: painel de corretor
- `utils.js`: funcoes comuns e chamadas para API
- `api-config.js`: configuracao de base da API
- `.htaccess`: fallback Apache para hospedagem estatica

Por padrao, o frontend chama a API em caminho relativo:

```js
const API_BASE = window.IMOORE_API_BASE || window.API_BASE || '/api';
```

Isso facilita servir frontend e backend no mesmo dominio.

### Backend

O backend esta em `backend/` e usa:

- Node.js
- Express
- CORS
- JWT
- Supabase
- Multer
- bcryptjs

Rotas principais:

- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/imoveis`
- `GET /api/imoveis/:id`
- `POST /api/imoveis`
- `PUT /api/imoveis/:id`
- `DELETE /api/imoveis/:id`
- `POST /api/imoveis/:id/fotos`
- `POST /api/imoveis/:id/aprovar`
- `GET /api/leads`
- `GET /api/leads/:id`
- `POST /api/leads`
- `PUT /api/leads/:id`
- `POST /api/leads/:id/historico`

## Variaveis de Ambiente

Crie `backend/.env` com base em `backend/.env.example`.

```env
PORT=3001
JWT_SECRET=troque_por_um_valor_seguro_com_32_chars_ou_mais
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua_chave_anon
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
SUPABASE_BUCKET=imoveis
ALLOW_REGISTRATION=true
DEMO_MODE=false
NODE_ENV=production
```

Regras importantes:

- Nunca commitar `backend/.env`
- Nunca expor `SUPABASE_SERVICE_ROLE_KEY` no frontend
- Usar `JWT_SECRET` forte em producao
- Manter `DEMO_MODE=false` em producao

## Como Rodar Localmente

```powershell
cd backend
npm install
npm start
```

Acesse:

```text
http://localhost:3001/
```

Para desenvolvimento com reload:

```powershell
cd backend
npm run dev
```

## Banco de Dados

O projeto usa Supabase.

Passos:

1. Criar projeto no Supabase.
2. Executar `backend/init-db.sql` ou `backend/schema.sql` no SQL Editor.
3. Criar bucket `imoveis` no Storage.
4. Configurar politicas de acesso do bucket.
5. Preencher variaveis `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY`.

## Usuarios de Teste

O seed pode criar usuarios padrao:

- Admin: `admin@imoore.com` / `imoore@2026`
- Corretor: `corretor@imoore.com` / `imoore123`
- CRM: `crm@imoore.com` / `crm@2026`

Execute apenas quando necessario:

```powershell
cd backend
npm run seed
```

## Deploy Atual Documentado

A documentacao existente aponta como opcoes:

- Backend em Railway ou Render
- Frontend em Vercel ou servido pelo backend
- SSL automatico em Railway/Vercel
- Supabase para banco e storage

Arquivos relacionados:

- `backend/DEPLOY.md`
- `backend/ENV_VARS.md`
- `QUICK_START.md`
- `TROUBLESHOOTING.md`
- `LAUNCH_CHECKLIST.md`

## Plano Para Dockerizar

Objetivo: empacotar backend e frontend em um container unico, servindo tudo via Express.

### Etapa 1: Preparar `.dockerignore`

Ignorar:

```text
node_modules
backend/node_modules
backend/.env
tmp-chrome-profile
.codex-audit-temp
.codex-backups
*.log
```

### Etapa 2: Criar `backend/Dockerfile`

Plano sugerido:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev

COPY backend ./backend
COPY frontend ./frontend

WORKDIR /app/backend

ENV NODE_ENV=production
EXPOSE 3001

CMD ["npm", "start"]
```

### Etapa 3: Criar `docker-compose.yml`

Plano sugerido:

```yaml
services:
  imoore:
    build:
      context: .
      dockerfile: backend/Dockerfile
    container_name: imoore-app
    restart: unless-stopped
    env_file:
      - backend/.env
    ports:
      - "3001:3001"
```

### Etapa 4: Testar Localmente

```powershell
docker compose build
docker compose up -d
docker compose logs -f
```

Acessar:

```text
http://localhost:3001/
```

### Etapa 5: Validar

Checklist:

- Login funciona
- API responde em `/api`
- Frontend carrega em `/`
- Upload de fotos funciona
- Supabase esta recebendo dados
- Logs nao exibem segredos

## Plano Para VPS HostGator

Objetivo: rodar a aplicacao em uma VPS Linux com Docker, Nginx como proxy reverso e SSL.

### Arquitetura Recomendada

```text
Internet
  ↓
DNS do dominio
  ↓
VPS HostGator
  ↓
Nginx :80/:443
  ↓
Container Docker imoore :3001
  ↓
Supabase
```

### Requisitos da VPS

- Ubuntu 22.04 ou 24.04 LTS
- Acesso SSH
- Docker Engine
- Docker Compose plugin
- Nginx
- Certbot
- Firewall liberando portas 22, 80 e 443

### Passo 1: Preparar VPS

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y ca-certificates curl gnupg nginx certbot python3-certbot-nginx
```

Instalar Docker conforme documentacao oficial da Docker.

### Passo 2: Enviar Projeto

Opcoes:

- Git pull a partir do repositorio GitHub
- Upload via SFTP
- Pipeline CI/CD futuro

Diretorio sugerido:

```text
/opt/imoore
```

### Passo 3: Configurar `.env`

Criar:

```text
/opt/imoore/backend/.env
```

Usar variaveis reais de producao.

### Passo 4: Subir Container

```bash
cd /opt/imoore
docker compose up -d --build
docker compose logs -f
```

### Passo 5: Configurar Nginx

Arquivo sugerido:

```text
/etc/nginx/sites-available/imoore
```

Configuracao planejada:

```nginx
server {
    listen 80;
    server_name imoore.com.br www.imoore.com.br;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Ativar site:

```bash
sudo ln -s /etc/nginx/sites-available/imoore /etc/nginx/sites-enabled/imoore
sudo nginx -t
sudo systemctl reload nginx
```

### Passo 6: SSL

Depois que o DNS apontar para a VPS:

```bash
sudo certbot --nginx -d imoore.com.br -d www.imoore.com.br
```

Validar renovacao:

```bash
sudo certbot renew --dry-run
```

## DNS Para HostGator VPS

Para usar VPS HostGator, o dominio deve apontar para o IP publico da VPS.

Registros esperados:

```text
imoore.com.br      A      IP_DA_VPS
www.imoore.com.br  CNAME  imoore.com.br
```

Se o DNS continuar no Route 53, ajustar esses registros na hosted zone da AWS.

Se o DNS for movido para Newfold/HostGator, alterar os nameservers no Registro.br/Newfold e recriar os registros no painel DNS correspondente.

## Checklist de Migracao Para VPS

- Confirmar IP publico da VPS HostGator
- Confirmar onde o DNS esta sendo controlado
- Criar backup do estado atual dos registros DNS
- Configurar Docker na VPS
- Configurar `.env` de producao
- Subir container
- Testar por IP antes de trocar DNS
- Configurar Nginx
- Apontar DNS para VPS
- Aguardar propagacao
- Emitir SSL com Certbot
- Testar `https://imoore.com.br`
- Testar `https://www.imoore.com.br`
- Validar login, CRM, leads, imoveis e upload
- Monitorar logs nas primeiras horas

## Comandos Uteis

Logs do container:

```bash
docker compose logs -f
```

Rebuild:

```bash
docker compose up -d --build
```

Status:

```bash
docker compose ps
```

Reiniciar:

```bash
docker compose restart
```

Logs do Nginx:

```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## Seguranca

- Nao versionar `.env`
- Rotacionar credenciais expostas
- Usar HTTPS em producao
- Restringir CORS em producao se frontend e backend forem separados
- Manter VPS atualizada
- Ativar firewall
- Usar usuario sem root para operacao diaria
- Configurar backup do Supabase
- Monitorar logs de erro

## Proximos Passos Tecnicos

1. Criar `.dockerignore`.
2. Criar `backend/Dockerfile`.
3. Criar `docker-compose.yml`.
4. Ajustar `.env.example` para conter apenas placeholders.
5. Testar container localmente.
6. Preparar VPS HostGator.
7. Configurar Nginx e SSL.
8. Planejar troca de DNS com janela de baixa movimentacao.

## Licenca

Projeto privado da Imoore. Definir licenca antes de publicar como repositorio aberto.
