const API_BASE = window.IMOORE_API_BASE || window.API_BASE || '/api';
localStorage.removeItem('imoore_token');

function getAuthHeaders() {
  return {};
}

function handleError(error) {
  console.error(error);
  return error.message || 'Erro inesperado';
}

function requireLogin(redirect = '/entrar') {
  const user = getUser();
  if (!user) {
    window.location.href = redirect;
  }
}

function requireRole(...roles) {
  const user = getUser();
  if (!user || !roles.includes(user.perfil)) {
    window.location.href = '/entrar';
  }
}

function logout() {
  fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
  localStorage.removeItem('imoore_token');
  localStorage.removeItem('imoore_user');
  window.location.href = '/entrar';
}

function getUser() {
  const raw = localStorage.getItem('imoore_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem('imoore_token');
    localStorage.removeItem('imoore_user');
    return null;
  }
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function createButton(text, onClick, className = 'button') {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = text;
  btn.className = className;
  btn.addEventListener('click', onClick);
  return btn;
}

async function apiFetch(path, options = {}) {
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...getAuthHeaders(),
    ...(options.headers || {}),
  };
  const response = await fetch(`${API_BASE}${path}`, { ...options, credentials: 'include', headers });
  if (response.status === 401) {
    localStorage.removeItem('imoore_token');
    localStorage.removeItem('imoore_user');
    window.location.href = '/entrar';
    throw new Error('Sessao expirada. Faça login novamente.');
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || body.message || `HTTP ${response.status}`);
  }
  return response.json().catch(() => ({}));
}
