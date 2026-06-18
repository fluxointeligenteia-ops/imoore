#!/usr/bin/env node

/**
 * Script de verificação rápida do deployment
 * Uso: node check-deployment.js
 */

const http = require('http');
const https = require('https');

const BASE_URL = process.env.API_URL || 'http://localhost:3001';
const isHttps = BASE_URL.startsWith('https');
const client = isHttps ? https : http;

async function check(name, method, path, body = null) {
  return new Promise((resolve) => {
    const url = new URL(BASE_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000,
    };

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const success = res.statusCode >= 200 && res.statusCode < 300;
        console.log(`${success ? '✅' : '❌'} ${name} (${res.statusCode})`);
        resolve(success);
      });
    });

    req.on('error', (err) => {
      console.log(`❌ ${name} (${err.message})`);
      resolve(false);
    });

    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  console.log(`\n🧪 Verificando deployment em ${BASE_URL}\n`);

  const results = {
    frontendIndex: await check('Frontend Index', 'GET', '/index.html'),
    frontendLogin: await check('Frontend Login', 'GET', '/imoore-login.html'),
    frontendCRM: await check('Frontend CRM', 'GET', '/imoore-crm.html'),
    loginApi: await check('API Login', 'POST', '/api/auth/login', {
      email: 'crm@imoore.com',
      senha: 'crm@2026',
    }),
    leadsApi: await check('API Leads (sem token)', 'GET', '/api/leads'),
  };

  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.values(results).length;

  console.log(`\n📊 Resultado: ${passed}/${total} testes passou\n`);

  if (passed === total) {
    console.log('✅ Deployment OK! Pronto para usar.\n');
    process.exit(0);
  } else {
    console.log('⚠️ Alguns testes falharam. Verifique o backend e frontend.\n');
    process.exit(1);
  }
}

main();
