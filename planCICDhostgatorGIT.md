# Plano CI/CD e Deploy Seguro na VPS HostGator

Projeto: **Imoore**  
Repositorio GitHub: `https://github.com/fluxointeligenteia-ops/imoore.git`  
Ambiente alvo: **HostGator VPS / AlmaLinux 9 / Node.js / 8 GB RAM / 200 GB**

## Objetivo

Preparar a aplicacao Imoore para deploy completo em VPS HostGator com:

- GitHub como fonte oficial do codigo
- Docker e Docker Compose para empacotamento
- Nginx como proxy reverso
- SSL HTTPS com Certbot
- DNS configurado corretamente
- Firewall ativo e restritivo
- Variaveis sensiveis fora do repositorio
- Processo de atualizacao previsivel e auditavel

## Arquitetura Recomendada

```text
Usuario
  |
  v
https://imoore.com.br
  |
  v
DNS autoritativo
  |
  v
IP publico da VPS HostGator
  |
  v
Firewall da VPS
  |
  v
Nginx :80/:443
  |
  v
Docker container imoore :3001
  |
  v
Supabase
```

## Estado Atual Relevante

O projeto ja possui:

- Backend Express em `backend/`
- Frontend estatico em `frontend/`
- Backend servindo o frontend via Express
- API em `/api`
- Supabase como banco/storage
- `.gitignore` evitando commit de `.env`, `node_modules`, backups e temporarios
- Repositorio GitHub sincronizado

O dominio, conforme auditoria anterior, estava com:

- Registrador: Newfold
- DNS autoritativo: AWS Route 53
- Nameservers: `awsdns-*`
- Registro A atual: `67.202.31.25`
- IP atual associado a AWS EC2

Antes da migracao, confirmar se o IP final da VPS HostGator e diferente de `67.202.31.25`.

## Premissas

- A VPS roda AlmaLinux 9.
- O acesso SSH esta ativo.
- O projeto sera instalado em `/opt/imoore`.
- A aplicacao Node escutara internamente na porta `3001`.
- O acesso publico sera feito apenas por Nginx nas portas `80` e `443`.
- O Supabase continuara hospedando banco e storage.

## 1. Checklist Inicial da VPS

No painel HostGator:

- Confirmar IP publico da VPS
- Confirmar usuario SSH disponivel
- Criar ou cadastrar chave SSH
- Desabilitar login por senha se o painel permitir
- Confirmar sistema operacional: AlmaLinux 9
- Confirmar que nao ha aplicacoes antigas usando portas `80`, `443` ou `3001`

Na maquina local:

- Ter acesso ao repositorio GitHub
- Ter credenciais Supabase de producao
- Ter acesso ao painel DNS atual

## 2. Primeiro Acesso SSH

Conectar na VPS:

```bash
ssh root@IP_DA_VPS
```

Atualizar sistema:

```bash
dnf update -y
dnf install -y epel-release
dnf install -y git curl wget nano vim unzip tar policycoreutils-python-utils
```

Verificar versao:

```bash
cat /etc/almalinux-release
uname -a
```

## 3. Criar Usuario de Deploy

Evitar operacao diaria como `root`.

```bash
adduser deploy
usermod -aG wheel deploy
```

Copiar chave SSH do root para o usuario `deploy`, se a chave ja estiver funcionando:

```bash
mkdir -p /home/deploy/.ssh
cp /root/.ssh/authorized_keys /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

Testar novo acesso:

```bash
ssh deploy@IP_DA_VPS
```

## 4. Hardening SSH

Editar:

```bash
sudo nano /etc/ssh/sshd_config
```

Configurar:

```text
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
```

Validar e reiniciar SSH:

```bash
sudo sshd -t
sudo systemctl restart sshd
```

Importante: manter uma sessao aberta enquanto testa outra conexao para evitar bloqueio acidental.

## 5. Firewall com firewalld

Instalar e ativar:

```bash
sudo dnf install -y firewalld
sudo systemctl enable --now firewalld
```

Liberar apenas SSH, HTTP e HTTPS:

```bash
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

Conferir:

```bash
sudo firewall-cmd --list-all
```

Nao expor a porta `3001` publicamente. Ela deve ficar acessivel apenas localmente para o Nginx.

## 6. Instalar Docker no AlmaLinux 9

Adicionar repositorio Docker:

```bash
sudo dnf install -y dnf-plugins-core
sudo dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
```

Instalar Docker:

```bash
sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

Ativar:

```bash
sudo systemctl enable --now docker
```

Permitir uso pelo usuario `deploy`:

```bash
sudo usermod -aG docker deploy
```

Sair e entrar novamente no SSH para aplicar o grupo.

Validar:

```bash
docker --version
docker compose version
docker run hello-world
```

## 7. Instalar Nginx

```bash
sudo dnf install -y nginx
sudo systemctl enable --now nginx
```

Liberar no SELinux conexoes proxy do Nginx para backend local:

```bash
sudo setsebool -P httpd_can_network_connect 1
```

Validar:

```bash
systemctl status nginx
```

## 8. Preparar Diretorios

```bash
sudo mkdir -p /opt/imoore
sudo chown -R deploy:deploy /opt/imoore
```

Entrar como deploy:

```bash
cd /opt
```

Clonar projeto:

```bash
git clone https://github.com/fluxointeligenteia-ops/imoore.git
cd /opt/imoore
```

Se o repositorio for privado, usar uma destas opcoes:

- GitHub deploy key SSH
- GitHub fine-grained token
- GitHub Actions com SSH

## 9. Arquivos Docker Necessarios

Criar `backend/Dockerfile`:

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

Criar `.dockerignore` na raiz:

```text
.git
.env
.env.*
!.env.example
node_modules
backend/node_modules
tmp-chrome-profile
.codex-audit-temp
.codex-backups
Imoore-backup-*
*.log
```

Criar `docker-compose.yml` na raiz:

```yaml
services:
  imoore:
    build:
      context: .
      dockerfile: backend/Dockerfile
    container_name: imoore-app
    restart: unless-stopped
    env_file:
      - ./backend/.env
    ports:
      - "127.0.0.1:3001:3001"
```

Observacao: o bind `127.0.0.1:3001:3001` impede acesso publico direto ao backend.

## 10. Variaveis de Ambiente de Producao

Criar `/opt/imoore/backend/.env`:

```bash
nano /opt/imoore/backend/.env
```

Modelo:

```env
PORT=3001
NODE_ENV=production
DEMO_MODE=false

JWT_SECRET=GERAR_VALOR_FORTE_COM_32_CHARS_OU_MAIS

SUPABASE_URL=https://SEU_PROJETO.supabase.co
SUPABASE_ANON_KEY=SUA_CHAVE_ANON
SUPABASE_SERVICE_ROLE_KEY=SUA_SERVICE_ROLE_KEY
SUPABASE_BUCKET=imoveis

ALLOW_REGISTRATION=false
```

Gerar `JWT_SECRET`:

```bash
openssl rand -hex 32
```

Permissao do `.env`:

```bash
chmod 600 /opt/imoore/backend/.env
```

## 11. Build e Primeiro Deploy Manual

```bash
cd /opt/imoore
docker compose build
docker compose up -d
docker compose logs -f
```

Testar localmente na VPS:

```bash
curl -I http://127.0.0.1:3001/
curl -I http://127.0.0.1:3001/api/leads
```

O endpoint `/api/leads` pode retornar `401` sem token; isso e esperado se a API estiver protegida.

## 12. Configurar Nginx

Criar arquivo:

```bash
sudo nano /etc/nginx/conf.d/imoore.conf
```

Conteudo:

```nginx
server {
    listen 80;
    server_name imoore.com.br www.imoore.com.br;

    client_max_body_size 25M;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Validar:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

Testar por IP antes de alterar DNS:

```bash
curl -I http://IP_DA_VPS
```

## 13. DNS

### Cenario A: DNS continua no AWS Route 53

No Route 53, hosted zone `imoore.com.br`:

```text
imoore.com.br      A      IP_DA_VPS_HOSTGATOR
www.imoore.com.br  CNAME  imoore.com.br
```

TTL recomendado antes da troca:

```text
300 segundos
```

Depois de estabilizar:

```text
600 ou 3600 segundos
```

### Cenario B: DNS vai para HostGator/Newfold

No painel do registrador/Newfold/HostGator:

1. Alterar nameservers para os fornecidos pela HostGator.
2. Recriar registros DNS no painel HostGator:

```text
@     A      IP_DA_VPS_HOSTGATOR
www   CNAME  imoore.com.br
```

3. Recriar tambem registros de e-mail, SPF, DKIM, DMARC e MX, se existirem.

### Conferencia DNS

```bash
dig imoore.com.br A
dig www.imoore.com.br A
dig www.imoore.com.br CNAME
dig imoore.com.br NS
```

No Windows:

```powershell
Resolve-DnsName imoore.com.br -Type A
Resolve-DnsName www.imoore.com.br -Type A
Resolve-DnsName imoore.com.br -Type NS
```

## 14. SSL HTTPS com Certbot

Instalar Certbot:

```bash
sudo dnf install -y certbot python3-certbot-nginx
```

Emitir certificado depois que DNS apontar para a VPS:

```bash
sudo certbot --nginx -d imoore.com.br -d www.imoore.com.br
```

Selecionar redirecionamento HTTP para HTTPS quando solicitado.

Testar renovacao:

```bash
sudo certbot renew --dry-run
```

Verificar timers:

```bash
systemctl list-timers | grep certbot
```

## 15. Headers de Seguranca no Nginx

Depois do SSL, adicionar dentro do bloco `server` HTTPS gerado pelo Certbot:

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
```

HSTS somente depois de confirmar que HTTPS esta estavel:

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

Validar:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 16. CI/CD Simples via GitHub Actions

Fluxo recomendado:

```text
push na branch main
  |
  v
GitHub Actions conecta via SSH
  |
  v
git pull na VPS
  |
  v
docker compose up -d --build
  |
  v
health check
```

### Secrets Necessarios no GitHub

Em GitHub > Repository > Settings > Secrets and variables > Actions:

```text
VPS_HOST=IP_DA_VPS
VPS_USER=deploy
VPS_SSH_KEY=chave_privada_ssh
VPS_PORT=22
```

### Workflow Sugerido

Criar `.github/workflows/deploy-hostgator.yml`:

```yaml
name: Deploy HostGator VPS

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          port: ${{ secrets.VPS_PORT }}
          script: |
            set -e
            cd /opt/imoore
            git fetch origin main
            git reset --hard origin/main
            docker compose up -d --build
            docker image prune -f
            curl -f http://127.0.0.1:3001/ >/dev/null
```

Observacao: `git reset --hard origin/main` e aceitavel na VPS se ela for apenas ambiente de deploy, sem edicoes manuais locais.

## 17. CI/CD Alternativo com Deploy Manual Seguro

Se nao quiser GitHub Actions inicialmente:

```bash
cd /opt/imoore
git pull origin main
docker compose up -d --build
docker compose logs -f --tail=100
```

## 18. Backup e Rollback

### Backup antes de atualizar

```bash
cd /opt/imoore
git rev-parse HEAD
docker compose ps
```

Guardar o hash atual.

### Rollback por Git

```bash
cd /opt/imoore
git checkout HASH_ANTERIOR
docker compose up -d --build
```

Voltar para main depois:

```bash
git checkout main
git pull origin main
docker compose up -d --build
```

## 19. Monitoramento Basico

Logs da aplicacao:

```bash
docker compose logs -f
```

Status:

```bash
docker compose ps
docker stats
```

Logs Nginx:

```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

Espaco em disco:

```bash
df -h
docker system df
```

Memoria:

```bash
free -h
```

## 20. Politicas de Seguranca

- Nunca editar codigo direto na VPS.
- Nunca commitar `.env`.
- Nunca expor `SUPABASE_SERVICE_ROLE_KEY`.
- Manter acesso SSH apenas por chave.
- Manter firewall liberando apenas `22`, `80`, `443`.
- Nao publicar porta `3001`.
- Rotacionar `JWT_SECRET` se houver suspeita de vazamento.
- Ativar 2FA no GitHub e Supabase.
- Usar GitHub deploy key ou token com permissao minima.
- Configurar backup no Supabase.
- Registrar toda mudanca via commit.

## 21. Ordem Recomendada de Execucao

1. Confirmar IP publico da VPS HostGator.
2. Acessar VPS via SSH.
3. Criar usuario `deploy`.
4. Endurecer SSH.
5. Ativar firewall.
6. Instalar Docker.
7. Instalar Nginx.
8. Clonar repositorio em `/opt/imoore`.
9. Criar `backend/.env` de producao.
10. Adicionar Dockerfile, `.dockerignore` e `docker-compose.yml` ao repositorio.
11. Fazer build local na VPS.
12. Testar via `127.0.0.1:3001`.
13. Configurar Nginx.
14. Testar via IP da VPS.
15. Alterar DNS.
16. Emitir SSL.
17. Testar site completo.
18. Configurar GitHub Actions.
19. Fazer primeiro deploy automatizado.
20. Monitorar logs e corrigir qualquer erro.

## 22. Comandos de Verificacao Final

DNS:

```bash
dig imoore.com.br A
dig www.imoore.com.br A
dig imoore.com.br NS
```

HTTP/HTTPS:

```bash
curl -I http://imoore.com.br
curl -I https://imoore.com.br
curl -I https://www.imoore.com.br
```

Container:

```bash
docker compose ps
docker compose logs --tail=100
```

Firewall:

```bash
sudo firewall-cmd --list-all
```

Nginx:

```bash
sudo nginx -t
systemctl status nginx
```

SSL:

```bash
sudo certbot certificates
sudo certbot renew --dry-run
```

## 23. Criterios de Pronto Para Producao

- `https://imoore.com.br` abre corretamente.
- `https://www.imoore.com.br` abre corretamente.
- HTTP redireciona para HTTPS.
- Login funciona.
- CRM carrega.
- Leads salvam no Supabase.
- Upload de fotos funciona.
- Porta `3001` nao responde externamente.
- Firewall lista apenas SSH, HTTP e HTTPS.
- Certbot renovacao passa no `dry-run`.
- GitHub Actions executa deploy sem senha manual.

## 24. Observacoes Importantes

- Se o DNS continuar no Route 53, a troca principal sera apenas o registro `A`.
- Se migrar DNS para HostGator/Newfold, recriar todos os registros antes de trocar nameservers.
- A troca de DNS deve ser feita em horario de baixo trafego.
- Reduzir TTL para `300` algumas horas antes da migracao ajuda rollback rapido.
- A VPS nao deve armazenar banco local; o Supabase permanece como camada persistente.
