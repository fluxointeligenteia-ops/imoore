# Guia de Uso — imoore CRM + Painel Imobiliário

Bem-vindo à plataforma imoore! Este guia ensina como usar cada painel.

---

## 🔐 Login

1. Acesse: **http://localhost:3001/imoore-login.html** (local) ou sua URL de produção
2. Selecione o tipo de usuário:
   - **Admin** → `admin@imoore.com` / `imoore@2026`
   - **Corretor** → `corretor@imoore.com` / `imoore123`
   - **CRM** → `crm@imoore.com` / `crm@2026`
3. Clique em "Entrar"
4. Você será redirecionado automaticamente para seu painel

---

## 👨‍💼 Painel Admin

**Acesso:** http://localhost:3001/imoore-admin.html (após login como Admin)

### Funcionalidades

#### 📊 Dashboard
- **Total de imóveis:** Conta todos os imóveis no sistema
- **Pendentes:** Imóveis aguardando aprovação
- **Publicados:** Imóveis já aprovados
- **Taxa de aprovação:** Percentual de imóveis publicados

#### ✅ Aprovar Imóveis
1. Veja a lista de imóveis com status **Pendente**
2. Leia os detalhes (tipo, preço, localização, fotos)
3. Clique em **"Publicar"** para aprovar ou **"Rejeitar"** se necessário
4. O imóvel muda de status imediatamente

#### 🔍 Filtrar e Buscar
- Digite o nome/título do imóvel na caixa de busca
- Selecione a cidade para filtrar
- Selecione o status para ver apenas pendentes ou publicados

#### 📸 Visualizar Fotos
- Clique em uma foto do imóvel para expandir
- Use as setas para navegar entre fotos

---

## 🏠 Painel Corretor

**Acesso:** http://localhost:3001/imoore-corretor.html (após login como Corretor)

### Funcionalidades

#### ➕ Cadastrar Imóvel
1. Preencha os campos obrigatórios:
   - **Título** (ex: "Casa na Praia - 3 quartos")
   - **Tipo** (Casa, Apartamento, Terreno, etc.)
   - **Finalidade** (Venda, Aluguel)
   - **Preço** (em reais)
   - **Cidade** (selecione da lista)
2. Preencha os campos opcionais:
   - Bairro
   - Quartos, banheiros, vagas
   - Área em m²
   - Descrição detalhada
3. Clique em **"Salvar imóvel"**
4. O imóvel será criado com status **Pendente** (aguardando aprovação do admin)

#### 📸 Fazer Upload de Fotos
1. Após criar um imóvel, ele aparece na lista abaixo
2. Clique em **"Adicionar fotos"**
3. Selecione até 12 imagens (JPG, PNG)
4. As fotos serão anexadas ao imóvel

#### 📋 Gerenciar Imóveis
- **Ver:** Clique no imóvel para expandir e ver todos os detalhes
- **Editar:** Altere qualquer informação (exceto status, que só admin muda)
- **Excluir:** Remova imóvel que não quer mais vender

#### 📊 Dashboard
- **Total de imóveis:** Seus imóveis criados
- **Pendentes:** Aguardando aprovação
- **Publicados:** Já aprovados (visíveis publicamente)
- **Taxa de aprovação:** % de seus imóveis publicados

---

## 💼 Painel CRM

**Acesso:** http://localhost:3001/imoore-crm.html (após login como CRM)

### O que é o CRM?
É um funil de vendas onde você acompanha cada lead (possível cliente) do primeiro contato até o fechamento.

### Funcionalidades

#### ➕ Registrar Lead
1. Preencha o formulário **"Registrar lead"**:
   - **Nome** (obrigatório)
   - **Telefone** (com DDD, ex: 13999999999)
   - **Email**
   - **Cidade** de interesse
   - **Interesse** (tipo de imóvel procurado)
   - **Observações** (notas sobre o cliente)
   - **Etapa** (comece como "Novo")
2. Clique em **"Salvar lead"**
3. O lead aparece no funil

#### 📊 Dashboard CRM
Veja as métricas em tempo real:
- **Total de leads:** Quantos clientes você está acompanhando
- **Novos:** Leads recém-cadastrados
- **Em contato:** Você já falou com o cliente
- **Visitas agendadas:** Agendou visita a imóvel
- **Propostas:** Enviou proposta comercial
- **Fechados:** Negócio concluído
- **Taxa de conversão:** % de leads que vira vendas
- **Leads das últimas 24h:** Quantos leads novos hoje

#### 🎯 Funil de Leads
O funil mostra 5 colunas, cada uma representando uma etapa:

1. **Novo** → Lead recém-capturado, precisa qualificar
2. **Contato** → Você já fez contato inicial
3. **Visita** → Cliente agendou visita
4. **Proposta** → Enviou proposta de preço
5. **Fechado** → Negócio finalizado!

**Para cada lead, você pode:**

- **Mover de etapa:** Selecione a nova etapa no dropdown
  - Exemplo: Lead está em "Novo" → selecione "Contato" → atualiza automaticamente

- **Adicionar histórico:** Registre cada ação
  - Exemplo: "Contato feito por WhatsApp, cliente interessado"
  - Clique em **"Salvar histórico"**
  - O histórico fica visível no card do lead

- **Ver histórico:** Veja os últimos 2 registros de contato no card
  - Data + descrição da ação

#### 🔍 Filtrar Leads
- **Buscar:** Digite nome, cidade ou tipo de interesse para encontrar leads
- **Filtrar por etapa:** Selecione uma etapa para ver apenas leads naquela fase

#### Exemplo de Workflow
```
1. Cliente liga → Registra lead como "Novo"
2. Você retorna ligação → Move para "Contato" + anota "Ligação, cliente interessado em apto 3 qtos"
3. Cliente quer visitar → Move para "Visita" + anota "Agendado dia 10 de junho às 14h"
4. Cliente recebe proposta → Move para "Proposta" + anota "Proposta: R$ 450.000"
5. Cliente aceita → Move para "Fechado" + anota "Venda confirmada! Contrato em preparação"
```

---

## 🌍 Landing Page Pública

**Acesso:** http://localhost:3001/index.html

A landing page mostra:
- Informações sobre imoore
- Cidades onde atua
- Contato via WhatsApp
- Links para login

---

## 📞 Dicas Importantes

### Para Corretores
- Sempre adicione fotos em boa qualidade
- Preencha descrição completa (localização, diferenças, etc.)
- Aguarde aprovação do admin antes de vender

### Para CRM/Vendedor
- Registre o lead assim que receber contato
- Atualize o histórico após CADA contato
- Mude de etapa conforme progresso real (não pule etapas)
- Use observações para lembrar detalhes importantes

### Para Admin
- Revise fotos antes de aprovar
- Verifique se todos os dados estão preenchidos
- Rejeite imóveis incompletos ou duplicados

---

## ❓ Perguntas Frequentes

**P: Posso editar um lead após salvar?**  
R: Sim! Clique no lead no funil, altere a etapa e/ou adicione histórico.

**P: Como exportar leads?**  
R: Atualmente, você pode copiar os dados manualmente. Exportação em PDF será adicionada em breve.

**P: Posso deletar um lead?**  
R: Apenas admin pode deletar. Para corretor/CRM, o lead fica permanentemente, mas você pode "arquivar" movendo para uma etapa "Arquivado" (quando implementada).

**P: Meu token expirou, o que faço?**  
R: Faça login novamente. Tokens expiram a cada 8 horas.

**P: Quantas fotos posso adicionar?**  
R: Até 12 fotos por imóvel.

**P: Suporta vídeo?**  
R: Ainda não, apenas fotos. Vídeo será adicionado na próxima versão.

---

## 📱 Acessar via Mobile

A plataforma é totalmente responsiva! Acesse pelo celular:
- **iPhone/iPad:** Safari
- **Android:** Chrome

Funciona igual ao desktop, apenas otimizado para tela pequena.

---

## 🆘 Suporte

Encontrou um problema?

1. **Erro de login:** Verifique email/senha. Solicite reset de senha ao admin.
2. **Página em branco:** Recarregue (F5) ou limpe cache do navegador
3. **Não consigo salvar:** Verifique conexão com internet
4. **Foto não aparece:** Verifique se o arquivo é JPG/PNG

**Contato imoore:**  
📞 WhatsApp: +55 13 99109-1887  
📧 Email: suporte@imoore.com

---

**Versão:** 1.0.0  
**Data:** 09/06/2026  
**Última atualização:** 09/06/2026
