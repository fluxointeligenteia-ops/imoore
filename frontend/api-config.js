(function () {
  const fallbackApiBase = '/api';
  const configuredApiBase = window.API_BASE || window.IMOORE_API_BASE || fallbackApiBase;

  window.IMOORE_API_BASE = configuredApiBase;
  window.API_BASE = configuredApiBase;
})();
