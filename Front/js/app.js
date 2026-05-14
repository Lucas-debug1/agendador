const state = {
  usuario:      null,
  token:        localStorage.getItem('agendei_token'),
  negocioAtual: null,
  servicoSel:   null,
};
if (state.token) {
  try { state.usuario = JSON.parse(localStorage.getItem('agendei_usuario')); } catch {}
}
async function api(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (state.token) opts.headers['Authorization'] = `Bearer ${state.token}`;
  if (body) opts.body = JSON.stringify(body);

  const res  = await fetch('/api' + path, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.erro || 'Erro na requisição');
  return data;
}
function ir(pagina) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('pg-' + pagina)?.classList.add('active');
  window.scrollTo(0, 0);
}
function toast(msg, tipo = '') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className   = 'toast show ' + tipo;
  setTimeout(() => el.classList.remove('show'), 3000);
}
function atualizarNav() {
  const nav = document.getElementById('nav');
  if (state.usuario) {
    nav.innerHTML = `
      <span style="font-size:14px;color:var(--muted)">Olá, ${state.usuario.nome.split(' ')[0]}</span>
      <a href="#" onclick="ir('agendamentos')">Meus agendamentos</a>
      <button onclick="sair()">Sair</button>
    `;
  } else {
    nav.innerHTML = `
      <button onclick="abrirModal('login')">Entrar</button>
      <button class="btn-primary" onclick="abrirModal('registro')">Criar conta</button>
    `;
  }
}
function abrirModal(aba) {
  document.getElementById('overlay').classList.add('open');
  trocarAba(aba);
}
function fecharModal() {
  document.getElementById('overlay').classList.remove('open');
}
function trocarAba(aba) {
  document.querySelectorAll('.modal-tab').forEach(t => t.classList.toggle('active', t.dataset.aba === aba));
  document.getElementById('form-login').style.display    = aba === 'login'   ? 'block' : 'none';
  document.getElementById('form-registro').style.display = aba === 'registro' ? 'block' : 'none';
}
async function fazerLogin(e) {
  e.preventDefault();
  const email = document.getElementById('l-email').value;
  const senha  = document.getElementById('l-senha').value;
  try {
    const data = await api('POST', '/auth/login', { email, senha });
    salvarSessao(data);
    fecharModal();
    toast('Bem-vindo, ' + data.usuario.nome + '!', 'success');
  } catch (err) { toast(err.message, 'error'); }
}
async function fazerRegistro(e) {
  e.preventDefault();
  const nome   = document.getElementById('r-nome').value;
  const email  = document.getElementById('r-email').value;
  const senha  = document.getElementById('r-senha').value;
  const tipo   = document.getElementById('r-tipo').value;
  try {
    const data = await api('POST', '/auth/registrar', { nome, email, senha, tipo });
    salvarSessao(data);
    fecharModal();
    toast('Conta criada! Bem-vindo, ' + data.usuario.nome + '!', 'success');
  } catch (err) { toast(err.message, 'error'); }
}
function salvarSessao(data) {
  state.token   = data.token;
  state.usuario = data.usuario;
  localStorage.setItem('agendei_token',   data.token);
  localStorage.setItem('agendei_usuario', JSON.stringify(data.usuario));
  atualizarNav();
}
function sair() {
  state.token   = null;
  state.usuario = null;
  localStorage.removeItem('agendei_token');
  localStorage.removeItem('agendei_usuario');
  atualizarNav();
  ir('home');
  toast('Até logo!');
}
async function carregarNegocios(tipo) {
  const grid = document.getElementById('negocios-grid');
  grid.innerHTML = '<p style="color:var(--muted)">Carregando...</p>';
  const filtroAtivo = document.querySelector('.filter-btn.active');
  const tipoFiltro  = tipo || filtroAtivo?.dataset.tipo || '';
  try {
    const url  = tipoFiltro ? `/negocios?tipo=${tipoFiltro}` : '/negocios';
    const rows = await api('GET', url);
    if (!rows.length) {
      grid.innerHTML = `
        <div class="empty" style="grid-column:1/-1">
          <div class="big-icon">🔍</div>
          <h3>Nenhum negócio encontrado</h3>
          <p>Tente outro filtro</p>
        </div>`;
      return;
    }
    const emojis = { salao: '💇', barbearia: '💈', clinica: '🏥', consultorio: '🩺', outro: '🏠' };
    grid.innerHTML = rows.map(n => `
      <div class="negocio-card" onclick="abrirNegocio(${n.id})">
        <div class="negocio-thumb">${emojis[n.tipo] || '🏠'}</div>
        <div class="negocio-info">
          <span class="tipo-tag">${n.tipo}</span>
          <h3>${n.nome}</h3>
          <p class="cidade">${n.cidade || ''} ${n.estado ? '— ' + n.estado : ''}</p>
        </div>
      </div>
    `).join('');
  } catch (err) {
    grid.innerHTML = `<p style="color:var(--danger)">${err.message}</p>`;
  }
}
function filtrar(btn, tipo) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  carregarNegocios(tipo);
}
async function abrirNegocio(id) {
  ir('detalhe');
  const header = document.getElementById('detalhe-header');
  const body   = document.getElementById('detalhe-body');
  header.innerHTML = '<p style="color:var(--muted)">Carregando...</p>';
  body.innerHTML   = '';
  try {
    const n = await api('GET', `/negocios/${id}`);
    state.negocioAtual = n;
    state.servicoSel   = null;
    const emojis = { salao: '💇', barbearia: '💈', clinica: '🏥', consultorio: '🩺', outro: '🏠' };
    header.innerHTML = `
      <button class="back-btn" onclick="ir('explorar')">← Voltar</button>
      <div style="display:flex;align-items:center;gap:16px;margin-top:8px">
        <span style="font-size:40px">${emojis[n.tipo] || '🏠'}</span>
        <div>
          <h2>${n.nome}</h2>
          <p style="color:var(--muted);font-size:14px;margin-top:4px">${n.tipo} · ${n.cidade || ''} ${n.estado || ''}</p>
          ${n.descricao ? `<p style="color:var(--muted);font-size:13px;margin-top:4px">${n.descricao}</p>` : ''}
        </div>
      </div>
    `;
    const profOpts = (n.profissionais || []).map(p =>
      `<option value="${p.id}">${p.nome}${p.especialidade ? ' — ' + p.especialidade : ''}</option>`
    ).join('');
    body.innerHTML = `
      <div class="servicos-lista">
        <h3>Serviços disponíveis</h3>
        ${n.servicos.length ? n.servicos.map(s => `
          <div class="servico-item" id="srv-${s.id}" onclick="selecionarServico(${s.id})">
            <div>
              <p class="servico-nome">${s.nome}</p>
              <p class="servico-dur">${s.duracao_min} min</p>
            </div>
            <span class="servico-preco">R$ ${Number(s.preco).toFixed(2).replace('.', ',')}</span>
          </div>
        `).join('') : '<p style="color:var(--muted)">Nenhum serviço cadastrado ainda.</p>'}
      </div>
      <div class="agendar-box">
        <h3>Agendar horário</h3>
        <div class="form-group">
          <label>Serviço selecionado</label>
          <input id="ag-servico-label" type="text" readonly placeholder="Selecione um serviço ao lado" style="cursor:pointer">
        </div>
        ${profOpts ? `
        <div class="form-group">
          <label>Profissional</label>
          <select id="ag-prof"><option value="">Sem preferência</option>${profOpts}</select>
        </div>` : ''}
        <div class="form-group">
          <label>Data e hora</label>
          <input id="ag-data" type="datetime-local">
        </div>
        <div class="form-group">
          <label>Observação (opcional)</label>
          <textarea id="ag-obs" rows="3" placeholder="Ex: Quero corte degradê"></textarea>
        </div>
        <button class="btn-agendar" id="btn-agendar" onclick="confirmarAgendamento()" disabled>
          Confirmar agendamento
        </button>
      </div>
    `;
    const min = new Date(Date.now() + 30 * 60000);
    document.getElementById('ag-data').min = min.toISOString().slice(0, 16);
  } catch (err) { header.innerHTML = `<p style="color:var(--danger)">${err.message}</p>`; }
}
function selecionarServico(id) {
  state.servicoSel = id;
  document.querySelectorAll('.servico-item').forEach(el => el.classList.remove('selected'));
  document.getElementById('srv-' + id)?.classList.add('selected');
  const srv = state.negocioAtual.servicos.find(s => s.id === id);
  if (srv) {
    document.getElementById('ag-servico-label').value =
      `${srv.nome} — R$ ${Number(srv.preco).toFixed(2).replace('.', ',')}`;
    document.getElementById('btn-agendar').disabled = false;
  }
}
async function confirmarAgendamento() {
  if (!state.usuario) { abrirModal('login'); return; }
  const data = document.getElementById('ag-data').value;
  if (!data) { toast('Selecione uma data e hora', 'error'); return; }
  const profEl = document.getElementById('ag-prof');
  const obs    = document.getElementById('ag-obs')?.value;
  const btn = document.getElementById('btn-agendar');
  btn.disabled   = true;
  btn.textContent = 'Aguarde...';
  try {
    await api('POST', '/agendamentos', {
      negocio_id:      state.negocioAtual.id,
      servico_id:      state.servicoSel,
      profissional_id: profEl?.value || null,
      data_hora:       data,
      observacao:      obs || null,
    });
    toast('Agendamento realizado! ✓', 'success');
    ir('agendamentos');
    carregarAgendamentos();
  } catch (err) {
    toast(err.message, 'error');
    btn.disabled   = false;
    btn.textContent = 'Confirmar agendamento';
  }
}
async function carregarAgendamentos() {
  if (!state.usuario) { abrirModal('login'); return; }
  const lista = document.getElementById('lista-agendamentos');
  lista.innerHTML = '<p style="color:var(--muted)">Carregando...</p>';
  try {
    const rows = await api('GET', '/agendamentos');
    if (!rows.length) {
      lista.innerHTML = `
        <div class="empty">
          <div class="big-icon">📅</div>
          <h3>Nenhum agendamento ainda</h3>
          <p>Explore os negócios e agende seu primeiro horário</p>
          <br>
          <button class="btn btn-green" onclick="ir('explorar')">Explorar negócios</button>
        </div>`;
      return;
    }
    lista.innerHTML = rows.map(a => {
      const data = new Date(a.data_hora).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
      const campo = state.usuario.tipo === 'cliente' ? a.negocio : a.cliente;
      return `
        <div class="agend-card">
          <div class="agend-info">
            <h4>${a.servico}</h4>
            <p>${campo} · ${data}</p>
            ${a.profissional ? `<p>👤 ${a.profissional}</p>` : ''}
          </div>
          <div style="text-align:right">
            <span class="status-badge status-${a.status}">${a.status}</span>
            ${a.preco ? `<p style="font-weight:600;margin-top:8px;color:var(--brand)">R$ ${Number(a.preco).toFixed(2).replace('.', ',')}</p>` : ''}
            ${a.status === 'pendente' || a.status === 'confirmado'
              ? `<button onclick="cancelarAgendamento(${a.id})" style="margin-top:10px;border:none;background:none;color:var(--danger);font:14px 'DM Sans',sans-serif;cursor:pointer">Cancelar</button>`
              : ''}
          </div>
        </div>
      `;
    }).join('');
  } catch (err) { lista.innerHTML = `<p style="color:var(--danger)">${err.message}</p>`; }
}
async function cancelarAgendamento(id) {
  if (!confirm('Cancelar este agendamento?')) return;
  try {
    await api('PATCH', `/agendamentos/${id}/cancelar`);
    toast('Agendamento cancelado.', 'success');
    carregarAgendamentos();
  } catch (err) { toast(err.message, 'error'); }
}
atualizarNav();
