(() => {
  'use strict';
  const endpoint = 'https://aqtsrewqwrfahwrvkpry.supabase.co/functions/v1/account-deletion';
  const parameters = new URLSearchParams(location.hash.slice(1));
  const candidate = parameters.get('token');
  let token = parameters.size === 1 && typeof candidate === 'string' && /^[A-Za-z0-9_-]{43}$/.test(candidate) ? candidate : null;
  // Keep the bearer capability out of history, referrers and copied page URLs.
  history.replaceState(null, '', location.pathname);
  const message = document.getElementById('message');
  const details = document.getElementById('details');
  const confirm = document.getElementById('confirm');
  const retry = document.getElementById('retry');
  let busy = false;
  let retryAction = 'inspect';

  function unavailable() {
    details.hidden = true;
    retry.hidden = true;
    confirm.disabled = true;
    token = null;
    message.textContent = 'Esta ligação já não está disponível. O pedido pode ter sido cancelado, substituído ou o prazo pode ter terminado. Consulta o estado da conta na app.';
  }

  async function run(action) {
    if (busy || !token) return;
    busy = true;
    confirm.disabled = true;
    retry.hidden = true;
    message.textContent = action === 'cancel' ? 'A cancelar o pedido de eliminação…' : 'Estamos a verificar o teu pedido…';
    try {
      const response = await fetch(endpoint, {
        method: 'POST', credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, token }), signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error('request');
      const data = await response.json();
      if (data.status === 'cancelled') {
        details.hidden = true;
        token = null;
        message.textContent = action === 'cancel'
          ? 'O pedido de eliminação foi cancelado. Obrigado por continuares connosco! Abre a app para consultar a tua conta.'
          : 'Este pedido de eliminação já foi cancelado. Abre a app para consultar o estado atual da tua conta.';
      } else if (action === 'inspect' && data.status === 'pending' && typeof data.scheduled_at === 'string' && Number.isFinite(Date.parse(data.scheduled_at))) {
        document.getElementById('deadline').textContent = new Intl.DateTimeFormat('pt-PT', {
          day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
        }).format(new Date(data.scheduled_at));
        message.textContent = 'Queres cancelar o pedido de eliminação?';
        details.hidden = false;
        confirm.disabled = false;
      } else unavailable();
    } catch {
      details.hidden = true;
      retryAction = action;
      message.textContent = 'Não foi possível confirmar o resultado. Volta a tentar ou gere o pedido na app em Conta → Eliminar conta.';
      retry.hidden = false;
    } finally { busy = false; }
  }

  confirm.addEventListener('click', () => { void run('cancel'); });
  retry.addEventListener('click', () => { void run(retryAction); });
  if (token) void run('inspect'); else unavailable();
})();
