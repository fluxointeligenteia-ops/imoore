#!/bin/bash

#
# 🚀 IMOORE QUICK DEPLOY SCRIPT
# Automatiza o deploy para produção em uma única execução
# Uso: ./deploy-imoore.sh
#

set -e  # Parar em erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
DEPLOY_PATH="${DEPLOY_PATH:-/var/www/imoore}"
CONTAINER_NAME="imoore-app"
HEALTHCHECK_URL="${HEALTHCHECK_URL:-http://127.0.0.1:3001}"
LOG_FILE="/tmp/imoore-deploy.log"

# Funções
print_header() {
    echo -e "\n${BLUE}═══════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

print_step() {
    echo -e "\n${BLUE}→ $1${NC}"
}

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then 
   print_error "Script deve ser executado como root (use: sudo ./deploy-imoore.sh)"
   exit 1
fi

print_header "IMOORE Deploy Automatizado"

# Step 1: Verificar diretório
print_step "Verificando diretório do projeto..."
if [ ! -d "$DEPLOY_PATH" ]; then
    print_error "Diretório $DEPLOY_PATH não encontrado!"
    exit 1
fi
print_success "Diretório encontrado: $DEPLOY_PATH"

# Step 2: Entrar no diretório
cd "$DEPLOY_PATH"
print_success "Navegado para $DEPLOY_PATH"

# Step 3: Git fetch e reset
print_step "Atualizando código do GitHub..."
git fetch origin 2>&1 | tee -a "$LOG_FILE"
git reset --hard origin/main 2>&1 | tee -a "$LOG_FILE"
print_success "Código atualizado da branch main"

# Step 4: Parar container antigo
print_step "Parando container anterior..."
docker compose down 2>&1 | tee -a "$LOG_FILE" || true
print_success "Container parado"

# Step 5: Build e start
print_step "Reconstruindo e iniciando container..."
docker compose up -d --build 2>&1 | tee -a "$LOG_FILE"
print_success "Container iniciado"

# Step 6: Aguardar inicialização
print_step "Aguardando aplicação inicializar (10 segundos)..."
sleep 10

# Step 7: Healthcheck local
print_step "Executando healthcheck local..."
max_attempts=5
attempt=1
while [ $attempt -le $max_attempts ]; do
    if curl -sf "$HEALTHCHECK_URL/" > /dev/null 2>&1; then
        print_success "Aplicação respondendo em $HEALTHCHECK_URL"
        break
    else
        if [ $attempt -eq $max_attempts ]; then
            print_error "Aplicação não respondeu após $max_attempts tentativas"
            print_info "Verifique os logs: docker compose logs -f $CONTAINER_NAME"
            exit 1
        fi
        print_info "Tentativa $attempt/$max_attempts... aguardando..."
        sleep 2
        attempt=$((attempt + 1))
    fi
done

# Step 8: Verificar logs
print_step "Últimas linhas do log..."
docker compose logs --tail 20 $CONTAINER_NAME | tee -a "$LOG_FILE"

# Step 9: Status
print_step "Status do container..."
docker compose ps

print_header "✅ DEPLOY CONCLUÍDO COM SUCESSO!"
echo -e "${GREEN}Aplicação imoore está rodando em:${NC}"
echo -e "  Local:   $HEALTHCHECK_URL"
echo -e "  Produção: https://imoore.com.br"
echo -e "\n${YELLOW}Próximos passos:${NC}"
echo "  1. Teste o login: https://imoore.com.br/imoore-entrar.html"
echo "  2. Teste a aprovação de imóvel"
echo "  3. Monitore logs: docker compose logs -f"
echo -e "\n${YELLOW}Deploy log salvo em:${NC} $LOG_FILE\n"
