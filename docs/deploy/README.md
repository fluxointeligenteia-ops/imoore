# Deploy de Produção Imoore

Este guia prepara a aplicação Imoore para rodar em uma VPS HostGator com Docker, Node LTS e Nginx como proxy reverso HTTPS.

## Arquitetura

- Aplicação Node/Express dentro do container `imoore-app`.
- Porta interna da aplicação: `3001`.
- Porta publicada pelo Docker Compose: `127.0.0.1:3001:3001`.
- Nginx público recebe `imoore.com.br` e `www.imoore.com.br` em `80/443`.
- Nginx encaminha as requisições para `http://127.0.0.1:3001`.

## Pré-requisitos na VPS

- Git.
- Docker e Docker Compose plugin.
- Nginx.
- Certbot para HTTPS.
- Acesso SSH com chave.

## Primeiro deploy

1. Aponte DNS de `imoore.com.br` e `www.imoore.com.br` para a VPS.
2. Clone o projeto na VPS, por exemplo em `/var/www/imoore`.
3. Crie o arquivo `.env`:

```bash
cd /var/www/imoore
cp .env.example .env
nano .env
```

4. Preencha `JWT_SECRET`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` e `SUPABASE_BUCKET`.
5. Suba a aplicação:

```bash
chmod +x scripts/*.sh
./scripts/update.sh
```

6. Instale o Nginx:

```bash
sudo cp nginx.conf /etc/nginx/sites-available/imoore.conf
sudo ln -s /etc/nginx/sites-available/imoore.conf /etc/nginx/sites-enabled/imoore.conf
sudo nginx -t
sudo systemctl reload nginx
```

7. Emita o certificado HTTPS:

```bash
sudo certbot --nginx -d imoore.com.br -d www.imoore.com.br
```

## Deploy via GitHub Actions

Configure estes secrets no repositório:

- `VPS_HOST`: IP ou host da VPS.
- `VPS_USER`: usuário SSH.
- `VPS_PORT`: porta SSH, use `22` se não houver customização.
- `VPS_SSH_KEY`: chave privada SSH.
- `DEPLOY_PATH`: caminho do projeto na VPS, exemplo `/var/www/imoore`.
- `HEALTHCHECK_URL`: URL pública, exemplo `https://imoore.com.br/`.

O workflow faz:

1. Conexão via SSH.
2. `git fetch`.
3. `git reset --hard origin/main`.
4. `docker compose build --pull`.
5. `docker compose up -d`.
6. Healthcheck local no container.
7. Healthcheck público via `curl`.

## Atualização manual

```bash
cd /var/www/imoore
git fetch --prune origin
git reset --hard origin/main
./scripts/update.sh
```

## Rollback

Para voltar para o último commit registrado:

```bash
cd /var/www/imoore
./scripts/rollback.sh
```

Para voltar para um commit específico:

```bash
./scripts/rollback.sh <commit>
```

## Comandos úteis

```bash
docker compose ps
docker compose logs -f imoore-app
docker compose restart imoore-app
curl -I http://127.0.0.1:3001/
curl -I https://imoore.com.br/
```

## Observações importantes

- Não execute seed em produção.
- Não versionar `.env`.
- O container não expõe a porta `3001` publicamente, apenas em `127.0.0.1`.
- O Nginx está configurado com `client_max_body_size 50M` para suportar upload de imagens.
