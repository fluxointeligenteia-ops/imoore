const http = require('http');

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function login(email, senha) {
  const body = JSON.stringify({ email, senha });
  const opts = {
    host: '127.0.0.1',
    port: 3001,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
    },
  };
  return request(opts, body);
}

async function apiFetch(path, token, method = 'GET', bodyData = null) {
  const body = bodyData ? JSON.stringify(bodyData) : null;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
  if (body) headers['Content-Length'] = Buffer.byteLength(body);
  const opts = {
    host: '127.0.0.1',
    port: 3001,
    path,
    method,
    headers,
  };
  return request(opts, body);
}

(async () => {
  try {
    const admin = await login('admin@imoore.com', 'imoore@2026');
    const adminToken = JSON.parse(admin.body).token;
    console.log('ADMIN LOGIN', admin.status);

    const corretor = await login('corretor@imoore.com', 'imoore123');
    const corretorToken = JSON.parse(corretor.body).token;
    console.log('CORRETOR LOGIN', corretor.status);

    const crm = await login('crm@imoore.com', 'crm@2026');
    const crmToken = JSON.parse(crm.body).token;
    console.log('CRM LOGIN', crm.status);

    const createProperty = await apiFetch('/api/imoveis', corretorToken, 'POST', {
      titulo: 'Casa Teste',
      tipo: 'Casa',
      finalidade: 'Venda',
      preco: 250000,
      cidade: 'Santos',
      bairro: 'Boqueirão',
      quartos: 3,
      banheiros: 2,
      vagas: 1,
      area: 120,
      descricao: 'Imóvel de teste',
    });
    console.log('CREATE PROPERTY', createProperty.status, createProperty.body);

    const propertyId = JSON.parse(createProperty.body).id;

    const listProperties = await apiFetch('/api/imoveis', adminToken, 'GET');
    console.log('LIST PROPERTIES', listProperties.status, listProperties.body.slice(0, 200));

    const approve = await apiFetch(`/api/imoveis/${propertyId}/aprovar`, adminToken, 'POST', { status: 'publicado' });
    console.log('APPROVE PROPERTY', approve.status, approve.body);

    const createLead = await apiFetch('/api/leads', crmToken, 'POST', {
      nome: 'Cliente Teste',
      telefone: '13999999999',
      email: 'cliente@teste.com',
      cidade: 'Santos',
      interesse: 'Apartamento',
      observacoes: 'Interessado em visita',
      etapa: 'novo',
    });
    console.log('CREATE LEAD', createLead.status, createLead.body);

    const listLeads = await apiFetch('/api/leads', crmToken, 'GET');
    console.log('LIST LEADS', listLeads.status, listLeads.body.slice(0, 200));
  } catch (err) {
    console.error('ERROR', err.message);
    process.exit(1);
  }
})();
