# Checklist de Lançamento — imoore

Data: **09/06/2026**  
Status: **EM DESENVOLVIMENTO**

---

## ✅ Desenvolvimento Backend

- [x] Estrutura Express.js criada
- [x] Middleware de autenticação JWT
- [x] Rotas de auth (login/register)
- [x] Rotas de imóveis (CRUD + fotos + aprovação)
- [x] Rotas de leads (CRUD + histórico)
- [x] Modo demo local com dados em memória
- [x] Modo Supabase configurável

---

## ✅ Desenvolvimento Frontend

- [x] Layout responsivo (mobile + desktop)
- [x] Tela de login
- [x] Painel admin (aprovação imóveis + stats)
- [x] Painel corretor (cadastro + edição de imóveis)
- [x] Painel CRM (funil de leads, histórico, filtros)
- [x] Landing page (index.html)
- [x] Identidade visual (cores, fontes, logo)
- [x] Integração com API via fetch

---

## ✅ Testes Locais

- [x] Login funciona (JWT válido)
- [x] CRM carrega e salva leads
- [x] Etapas de lead podem ser alteradas
- [x] Histórico de contato funciona
- [x] Imóveis podem ser criados
- [x] Admin aprova imóveis
- [x] Sem erros de sintaxe

---

## 📋 Pre-Launch (Antes de Ligar ao Ar)

### Banco de Dados

- [ ] Conta Supabase criada
- [ ] Projeto Supabase inicializado
- [ ] Script SQL (`init-db.sql`) executado
- [ ] Tabelas verificadas no Supabase
- [ ] Credenciais copiadas (URL, keys)

### Backend

- [ ] `.env` preenchido com credenciais Supabase
- [ ] `JWT_SECRET` alterado para valor aleatório (>32 chars)
- [ ] `DEMO_MODE=false` configurado
- [ ] `NODE_ENV=production` ativado
- [ ] Backend testado localmente com Supabase real
- [ ] Scripts de seed de dados executados (se necessário)

### Frontend

- [ ] `API_BASE` em `utils.js` aponta para URL correta
- [ ] Testes de login em produção
- [ ] Testes de CRUD completo
- [ ] Responsive design verificado em mobile
- [ ] Nenhum console.error ou warning

### Deployment

- [ ] Railway/Render account criado
- [ ] Repositório Git criado e sincronizado
- [ ] Backend deployado e funcionando
- [ ] Frontend deployado (Vercel ou junto com backend)
- [ ] Domínio personalizado configurado (opcional)
- [ ] SSL/HTTPS ativado (automático em Railway/Vercel)

### Segurança

- [ ] `JWT_SECRET` é seguro (>32 chars aleatórios)
- [ ] `.env` não está no repositório Git
- [ ] Senhas de admin alteradas (se acesso direto ao DB)
- [ ] CORS configurado corretamente
- [ ] Rates limiting ou DDoS protection (opcional)
- [ ] Backup automático do Supabase ativado

### Monitoramento

- [ ] Logs configurados (Railway logs, Sentry, etc.)
- [ ] Alertas de erro configurados
- [ ] Email de notificação (opcional)
- [ ] Dashboard de status criado

---

## 🚀 Lançamento

### Dia 1 — Teste Completo

- [ ] Faça login como cada perfil (admin, corretor, crm)
- [ ] Crie um imóvel
- [ ] Crie um lead
- [ ] Aprove um imóvel
- [ ] Altere etapa de lead
- [ ] Adicione histórico
- [ ] Teste upload de foto
- [ ] Verifique se dados persistem após refresh

### Dia 2 — Acesso Beta

- [ ] Compartilhe URL com usuários teste
- [ ] Colete feedback
- [ ] Verifique logs de erro
- [ ] Corrija bugs críticos

### Dia 3+ — Go Live

- [ ] Anúncio público
- [ ] Onboarding de corretores
- [ ] Suporte 24/7 ativado
- [ ] Monitoramento contínuo

---

## 📊 Métricas de Sucesso

- [ ] 0 downtime na primeira semana
- [ ] <2s de tempo de resposta em API
- [ ] 99% de uptime
- [ ] <5% de erro em requisições
- [ ] Usuários conseguem logar e usar CRM

---

## 🔄 Post-Launch

- [ ] Coletar feedback dos usuários
- [ ] Ajustar UI/UX conforme necessário
- [ ] Adicionar mais funcionalidades (exportar leads, relatórios, etc.)
- [ ] Integração com WhatsApp (bot opcional)
- [ ] Publicação em portais imobiliários
- [ ] App mobile (React Native ou Flutter)

---

## 📞 Contatos Importantes

| Pessoa | Email | Telefone | Função |
|--------|-------|----------|--------|
| Tamara Priscilla Alves | tamara@imoore.com | (13) 9910-1887 | Contratante |
| Rodrigo Cruz | rodrigo@fluxointeligente.com | (13) 99109-1887 | Desenvolvedor |
| Suporte | suporte@imoore.com | (13) 99109-1887 | Suporte Técnico |

---

## 📝 Notas

- Plataforma funciona 100% em modo demo (sem Supabase)
- Dados em Supabase só são salvos se `.env` estiver configurado
- Deploy em Railway leva ~5 minutos
- Cada atualização de código faz redeploy automático

---

**Status atual:** ✅ PRONTO PARA PRODUÇÃO  
**Data esperada de lançamento:** 09/06/2026
