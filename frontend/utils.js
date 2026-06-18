const API_BASE = window.IMOORE_API_BASE || window.API_BASE || '/api';

function getAuthHeaders() {
  const token = localStorage.getItem('imoore_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function handleError(error) {
  console.error(error);
  return error?.message || 'Erro inesperado';
}

function requireLogin(redirect = 'imoore-entrar.html') {
  const token = localStorage.getItem('imoore_token');
  if (!token) {
    window.location.href = redirect;
  }
}

function requireRole(...roles) {
  const user = getUser();
  if (!user || !roles.includes(user.perfil)) {
    window.location.href = 'imoore-entrar.html';
  }
}

function logout() {
  localStorage.removeItem('imoore_token');
  localStorage.removeItem('imoore_user');
  window.location.href = 'imoore-entrar.html';
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
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (response.status === 401) {
    localStorage.removeItem('imoore_token');
    localStorage.removeItem('imoore_user');
    window.location.href = 'imoore-entrar.html';
    throw new Error('Sessao expirada. Faça login novamente.');
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || body.message || `HTTP ${response.status}`);
  }
  return response.json().catch(() => ({}));
}
