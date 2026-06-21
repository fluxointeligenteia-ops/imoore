# README Produção - Imoore

Produção preparada para VPS HostGator com Docker, Node LTS, Nginx e GitHub Actions.

## Arquivos principais

- `Dockerfile`: imagem Node LTS para rodar o backend Express em `PORT=3001`.
- `docker-compose.yml`: publica somente `127.0.0.1:3001`.
- `nginx.conf`: proxy reverso HTTPS para `imoore.com.br` e `www.imoore.com.br`.
- `.env.example`: modelo de variáveis de ambiente.
- `.github/workflows/deploy-production.yml`: deploy via SSH.
- `scripts/deploy.sh`: bootstrap inicial na VPS.
- `scripts/update.sh`: rebuild e restart dos containers.
- `scripts/rollback.sh`: rollback para commit anterior ou informado.
- `docs/deploy/README.md`: guia operacional completo.

## Deploy rápido na VPS

```bash
cd /var/www/imoore
cp .env.example .env
nano .env
chmod +x scripts/*.sh
./scripts/update.sh
```

## Nginx

```bash
sudo cp nginx.conf /etc/nginx/sites-available/imoore.conf
sudo ln -s /etc/nginx/sites-available/imoore.conf /etc/nginx/sites-enabled/imoore.conf
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d imoore.com.br -d www.imoore.com.br
```

## Healthcheck

```bash
curl -I http://127.0.0.1:3001/
curl -I https://imoore.com.br/
```

Mais detalhes em `docs/deploy/README.md`.
