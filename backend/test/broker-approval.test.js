const assert = require('node:assert/strict');

process.env.DEMO_MODE = 'true';
process.env.JWT_SECRET = 'broker-approval-test-secret-32-characters';
process.env.PORT = '0';

const app = require('../server');
const server = app.listen(0, '127.0.0.1');
const baseUrl = () => `http://127.0.0.1:${server.address().port}`;

const request = async (path, options = {}) => {
  const response = await fetch(`${baseUrl()}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const body = await response.json().catch(() => ({}));
  return { response, body };
};

const waitForServer = () => new Promise(resolve => server.once('listening', resolve));

(async () => {
  await waitForServer();
  const invalid = await request('/api/corretores/public', {
    method: 'POST',
    body: JSON.stringify({ nome: 'Sem consentimento' }),
  });
  assert.equal(invalid.response.status, 400);

  const candidate = await request('/api/corretores/public', {
    method: 'POST',
    body: JSON.stringify({
      nome: 'Corretor Teste', telefone: '13999990000', email: `corretor-${Date.now()}@example.com`,
      creci: 'SP-123456', cidade: 'Santos', aceite_lgpd: true,
      experiencia: '1 a 3 anos', consentimento_versao: 'lgpd-corretor-v1',
    }),
  });
  assert.equal(candidate.response.status, 201);
  assert.equal(candidate.body.candidatura.status, 'pendente');

  const pendingLogin = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: candidate.body.candidatura.email, senha: 'qualquer-senha' }),
  });
  assert.equal(pendingLogin.response.status, 403);
  assert.match(pendingLogin.body.error, /aguardando/i);

  const adminLogin = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@imoore.com', senha: 'imoore@2026' }),
  });
  assert.equal(adminLogin.response.status, 200);
  const adminHeaders = { Authorization: `Bearer ${adminLogin.body.token}` };
  const approved = await request(`/api/corretores/${candidate.body.candidatura.id}/aprovar`, {
    method: 'POST', headers: adminHeaders,
    body: JSON.stringify({ senha_temporaria: 'senha-temporaria-segura-2026' }),
  });
  assert.equal(approved.response.status, 200);
  assert.equal(approved.body.candidatura.status, 'aprovado');

  const brokerLogin = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: candidate.body.candidatura.email, senha: 'senha-temporaria-segura-2026' }),
  });
  assert.equal(brokerLogin.response.status, 200);
  assert.equal(brokerLogin.body.user.status, 'aprovado');
  assert.equal(brokerLogin.body.user.senha_troca_obrigatoria, true);
  const blockedBeforePasswordChange = await request('/api/imoveis', {
    method: 'POST', headers: { Authorization: `Bearer ${brokerLogin.body.token}` },
    body: JSON.stringify({ titulo: 'Teste bloqueado', tipo: 'casa', finalidade: 'venda', preco: 1, cidade: 'Santos' }),
  });
  assert.equal(blockedBeforePasswordChange.response.status, 403);
  assert.match(blockedBeforePasswordChange.body.error, /Altere a senha/i);
  const changedPassword = await request('/api/auth/change-password', {
    method: 'POST', headers: { Authorization: `Bearer ${brokerLogin.body.token}` },
    body: JSON.stringify({ senha_atual: 'senha-temporaria-segura-2026', nova_senha: 'senha-definitiva-segura-2026' }),
  });
  assert.equal(changedPassword.response.status, 200);
  const finalLogin = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: candidate.body.candidatura.email, senha: 'senha-definitiva-segura-2026' }),
  });
  assert.equal(finalLogin.response.status, 200);
  assert.equal(finalLogin.body.user.senha_troca_obrigatoria, false);

  const rejectedCandidate = await request('/api/corretores/public', {
    method: 'POST',
    body: JSON.stringify({
      nome: 'Corretor Rejeitado', telefone: '13999990001', email: `rejeitado-${Date.now()}@example.com`,
      creci: 'SP-654321', cidade: 'Santos', aceite_lgpd: true,
    }),
  });
  const rejected = await request(`/api/corretores/${rejectedCandidate.body.candidatura.id}/rejeitar`, {
    method: 'POST', headers: adminHeaders, body: JSON.stringify({ motivo: 'Dados insuficientes' }),
  });
  assert.equal(rejected.response.status, 200);
  const rejectedLogin = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: rejectedCandidate.body.candidatura.email, senha: 'qualquer-senha' }),
  });
  assert.equal(rejectedLogin.response.status, 403);
  assert.match(rejectedLogin.body.error, /nao aprovado/i);
  console.log('broker approval smoke test: ok');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => server.close());
