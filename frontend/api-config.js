(() => {
  const broker = {
    step: 1,
    photos: [],
    cover: 0,
    drag: null,
  };

  const money = value => {
    const parsed = Number(String(value || '').replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.'));
    return Number.isFinite(parsed) && parsed > 0
      ? parsed.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      : 'Valor sob consulta';
  };

  const valueOf = id => document.getElementById(id)?.value?.trim() || '';

  function fieldWrap(id){
    const input = document.getElementById(id);
    if(!input) return null;
    const wrap = input.closest('.sf') || input.parentElement;
    if(wrap?.parentElement) wrap.parentElement.removeChild(wrap);
    if(wrap) wrap.classList.add('broker-field');
    return wrap;
  }

  function detach(selector, root){
    const el = root.querySelector(selector);
    if(el?.parentElement) el.parentElement.removeChild(el);
    return el;
  }

  function injectBrokerCss(){
    if(document.getElementById('broker-experience-css')) return;
    const style = document.createElement('style');
    style.id = 'broker-experience-css';
    style.textContent = `
      .broker-shell{max-width:1080px!important}
      .broker-panel{background:#fff;border:1px solid var(--bdr);border-radius:24px;box-shadow:var(--shl);overflow:hidden}
      .broker-top{padding:22px 26px;border-bottom:1px solid var(--bdr);background:linear-gradient(180deg,#fff 0%,var(--bg) 100%)}
      .broker-stepper{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin-top:18px}
      .broker-stepper span{height:6px;border-radius:50px;background:var(--bg3)}
      .broker-stepper span.on{background:var(--or)}
      .broker-step-labels{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin-top:8px}
      .broker-step-labels small{font-size:10px;color:var(--ink4);font-weight:800;text-transform:uppercase;letter-spacing:.5px;text-align:center}
      .broker-body{padding:28px}
      .broker-stage{display:none;animation:fiu .28s ease both}
      .broker-stage.on{display:block}
      .broker-welcome{text-align:center;max-width:680px;margin:14px auto}
      .broker-welcome h2{font-size:36px;line-height:1.08;color:var(--ink);letter-spacing:-1px;margin-bottom:8px}
      .broker-welcome p{font-size:17px;color:var(--ink3);margin-bottom:22px}
      .broker-checklist{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin:0 0 26px}
      .broker-checklist div{background:var(--orl);border:1px solid var(--orm);border-radius:16px;padding:14px;font-weight:800;color:var(--ink);display:flex;align-items:center;justify-content:center;gap:8px}
      .broker-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
      .broker-card{background:#fff;border:1px solid var(--bdr);border-radius:18px;padding:18px;box-shadow:var(--sh);margin-bottom:16px;transition:transform .2s,box-shadow .2s}
      .broker-card:hover{transform:translateY(-1px);box-shadow:var(--shl)}
      .broker-card h3{font-size:14px;font-weight:800;color:var(--ink);text-transform:uppercase;letter-spacing:.7px;margin-bottom:14px;display:flex;align-items:center;gap:8px}
      .broker-field{display:flex;flex-direction:column;gap:6px}
      .broker-field label{font-size:10px;font-weight:800;color:var(--ink4);text-transform:uppercase;letter-spacing:.7px}
      .broker-field input,.broker-field select,.broker-field textarea{background:var(--bg);border:1.5px solid var(--bdr);border-radius:12px;padding:12px 13px;font-size:14px;color:var(--ink);font-family:var(--f);outline:none;width:100%}
      .broker-field textarea{min-height:140px;line-height:1.6;resize:vertical}
      .broker-actions{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:22px}
      .broker-primary,.broker-secondary{border:none;border-radius:50px;font-family:var(--f);font-weight:800;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:50px;padding:14px 24px}
      .broker-primary{background:var(--or);color:#fff;box-shadow:0 8px 20px rgba(242,101,34,.24)}
      .broker-primary:disabled{opacity:.45;cursor:not-allowed;box-shadow:none}
      .broker-secondary{background:var(--bg3);color:var(--ink3)}
      .broker-feature-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
      .broker-feature{display:flex;gap:12px;align-items:center;background:var(--bg);border:1px solid var(--bdr);border-radius:16px;padding:14px}
      .broker-feature i{width:36px;height:36px;border-radius:12px;background:var(--orl);color:var(--or);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0}
      .broker-summary{position:sticky;top:96px;background:var(--ink);color:#fff;border-radius:18px;padding:18px;box-shadow:var(--shl)}
      .broker-summary h3{font-size:14px;text-transform:uppercase;letter-spacing:.7px;margin-bottom:14px;color:#fff}
      .broker-summary div{font-size:13px;color:rgba(255,255,255,.78);display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.12)}
      .broker-choice-group{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}
      .broker-choice{display:flex;align-items:center;gap:10px;border:1.5px solid var(--bdr);border-radius:14px;background:var(--bg);padding:13px;font-weight:800;color:var(--ink);cursor:pointer}
      .broker-choice input{accent-color:var(--or);width:18px;height:18px}
      .broker-upload{border:2px dashed var(--orm);background:linear-gradient(180deg,#fff 0%,var(--orl) 100%);border-radius:22px;min-height:230px;display:flex;align-items:center;justify-content:center;text-align:center;padding:24px;cursor:pointer;transition:border-color .2s,transform .2s}
      .broker-upload:hover,.broker-upload.drag{border-color:var(--or);transform:translateY(-1px)}
      .broker-upload i{font-size:38px;color:var(--or);display:block;margin-bottom:8px}
      .broker-photo-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(126px,1fr));gap:12px;margin-top:18px}
      .broker-photo{position:relative;aspect-ratio:1;border-radius:14px;background:center/cover;border:1px solid var(--bdr);overflow:hidden;box-shadow:var(--sh);cursor:grab}
      .broker-photo.dragging{opacity:.55}
      .broker-photo-num,.broker-photo-cover{position:absolute;left:8px;border-radius:50px;font-size:10px;font-weight:800;padding:4px 8px}
      .broker-photo-num{top:8px;background:rgba(255,255,255,.92);color:var(--ink)}
      .broker-photo-cover{bottom:8px;background:var(--or);color:#fff}
      .broker-photo-actions{position:absolute;right:8px;top:8px;display:flex;gap:5px}
      .broker-photo-actions button{width:28px;height:28px;border:none;border-radius:50%;background:rgba(255,255,255,.92);color:var(--ink);cursor:pointer;display:flex;align-items:center;justify-content:center}
      .broker-review{display:grid;grid-template-columns:320px 1fr;gap:22px;background:#fff;border:1px solid var(--bdr);border-radius:22px;box-shadow:var(--shl);overflow:hidden}
      .broker-review-cover{min-height:300px;background:var(--bg3) center/cover;display:flex;align-items:center;justify-content:center;color:var(--ink4);font-weight:800}
      .broker-review-body{padding:24px}
      .broker-review-body h3{font-size:22px;color:var(--ink);margin-bottom:6px}
      .broker-review-price{font-size:30px;font-weight:800;color:var(--or);margin:12px 0}
      .broker-review-meta,.broker-review-flags{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px}
      .broker-review-meta span,.broker-review-flags span{background:var(--bg3);border-radius:50px;padding:7px 11px;font-size:12px;font-weight:700;color:var(--ink2)}
      .broker-status{display:inline-flex;align-items:center;gap:8px;background:#E8F9EF;color:#178347;border-radius:50px;padding:9px 14px;font-weight:800;margin-top:16px}
      .broker-success{text-align:center;max-width:560px;margin:28px auto}
      .broker-success-icon{width:84px;height:84px;margin:0 auto 18px;border-radius:50%;background:var(--or);color:#fff;display:flex;align-items:center;justify-content:center;font-size:42px;animation:fiu .35s ease both}
      @media(max-width:640px){.broker-top,.broker-body{padding:18px}.broker-step-labels small{font-size:9px}.broker-grid,.broker-feature-grid,.broker-review{grid-template-columns:1fr!important}.broker-actions{flex-direction:column-reverse;align-items:stretch}.broker-primary,.broker-secondary{width:100%}.broker-welcome h2{font-size:28px}.broker-review-cover{min-height:220px}.broker-summary{position:static}}
    `;
    document.head.appendChild(style);
  }

  function makeField(label, id, type = 'text', placeholder = ''){
    const wrap = document.createElement('div');
    wrap.className = 'broker-field';
    wrap.innerHTML = `<label>${label}</label><input type="${type}" id="${id}" placeholder="${placeholder}"/>`;
    return wrap;
  }

  function makeSelect(label, id, options){
    const wrap = document.createElement('div');
    wrap.className = 'broker-field';
    wrap.innerHTML = `<label>${label}</label><select id="${id}">${options.map(option => `<option>${option}</option>`).join('')}</select>`;
    return wrap;
  }

  function append(parent, items){
    items.filter(Boolean).forEach(item => parent.appendChild(item));
  }

  function syncPhotosInput(){
    const input = document.getElementById('imovel-fotos');
    if(!input || typeof DataTransfer === 'undefined') return;
    const data = new DataTransfer();
    broker.photos.forEach(file => data.items.add(file));
    input.files = data.files;
  }

  function renderPhotos(){
    const preview = document.getElementById('imovel-fotos-preview');
    if(!preview) return;
    preview.innerHTML = '';
    broker.photos.forEach((file, index) => {
      const url = URL.createObjectURL(file);
      const item = document.createElement('div');
      item.className = 'broker-photo';
      item.draggable = true;
      item.style.backgroundImage = `url('${url}')`;
      item.innerHTML = `
        <span class="broker-photo-num">${index + 1}</span>
        ${index === broker.cover ? '<span class="broker-photo-cover">Principal</span>' : ''}
        <div class="broker-photo-actions">
          <button type="button" title="Definir como principal" onclick="window.setBrokerCover(${index})">⭐</button>
          <button type="button" title="Excluir" onclick="window.removeBrokerPhoto(${index})">×</button>
        </div>`;
      item.addEventListener('dragstart', () => { broker.drag = index; item.classList.add('dragging'); });
      item.addEventListener('dragend', () => item.classList.remove('dragging'));
      item.addEventListener('dragover', event => event.preventDefault());
      item.addEventListener('drop', event => {
        event.preventDefault();
        window.reorderBrokerPhoto(broker.drag, index);
      });
      preview.appendChild(item);
    });
  }

  function addPhotos(files){
    const selected = Array.from(files || []).filter(file => /^image\//.test(file.type));
    const available = Math.max(0, 30 - broker.photos.length);
    if(selected.length > available) alert('Selecione no máximo 30 fotos.');
    broker.photos = broker.photos.concat(selected.slice(0, available));
    if(broker.cover >= broker.photos.length) broker.cover = 0;
    syncPhotosInput();
    renderPhotos();
  }

  function updateSummary(){
    const map = {
      'broker-sum-quartos': valueOf('imovel-quartos') || '0',
      'broker-sum-banheiros': valueOf('imovel-banheiros') || '0',
      'broker-sum-suites': valueOf('imovel-suites') || '0',
      'broker-sum-vagas': valueOf('imovel-vagas') || '0',
      'broker-sum-area': `${valueOf('imovel-area') || '0'} m²`,
    };
    Object.entries(map).forEach(([id, value]) => {
      const el = document.getElementById(id);
      if(el) el.textContent = value;
    });
  }

  function handleKeyChoice(){
    const selected = document.querySelector('input[name="imovel-chave-opcao"]:checked')?.value || '';
    const otherWrap = document.getElementById('imovel-chave-outro-wrap');
    const other = valueOf('imovel-chave-outro');
    const target = document.getElementById('imovel-chave');
    if(otherWrap) otherWrap.style.display = selected === 'Outro' ? 'flex' : 'none';
    if(target) target.value = selected === 'Outro' ? other : selected;
  }

  function renderReview(){
    const target = document.getElementById('broker-review-card');
    if(!target) return;
    const coverFile = broker.photos[broker.cover] || broker.photos[0];
    const cover = coverFile ? URL.createObjectURL(coverFile) : '';
    target.innerHTML = `
      <div class="broker-review">
        <div class="broker-review-cover" style="${cover ? `background-image:url('${cover}')` : ''}">${cover ? '' : 'Foto principal'}</div>
        <div class="broker-review-body">
          <h3>${valueOf('imovel-titulo') || valueOf('imovel-tipo') || 'Imóvel'}</h3>
          <p>${[valueOf('imovel-bairro'), valueOf('imovel-cidade')].filter(Boolean).join(', ') || 'Cidade não informada'}</p>
          <div class="broker-review-price">${money(valueOf('imovel-preco'))}</div>
          <div class="broker-review-meta">
            <span>${valueOf('imovel-quartos') || 0} quartos</span>
            <span>${valueOf('imovel-banheiros') || 0} banheiros</span>
            <span>${valueOf('imovel-suites') || 0} suítes</span>
            <span>${valueOf('imovel-vagas') || 0} vagas</span>
            <span>${valueOf('imovel-area') || 0} m²</span>
          </div>
          <div class="broker-review-flags">
            <span>IPTU: ${valueOf('imovel-iptu') || 'não informado'}</span>
            <span>Condomínio: ${valueOf('imovel-condominio') || 'não informado'}</span>
            <span>Comissão: ${valueOf('imovel-comissao') || 'não informada'}</span>
            <span>Chaves: ${valueOf('imovel-chave') || 'não informado'}</span>
            <span>${broker.photos.length} foto${broker.photos.length === 1 ? '' : 's'}</span>
          </div>
          <div class="broker-status">Pronto para aprovação.</div>
        </div>
      </div>`;
  }

  function brokerGo(step){
    if(step === 6) renderReview();
    broker.step = step;
    document.querySelectorAll('.broker-stage').forEach(stage => {
      stage.classList.toggle('on', Number(stage.dataset.brokerStep) === step);
    });
    const progressStep = Math.max(1, Math.min(6, step - 1));
    document.querySelectorAll('#broker-progress span').forEach((item, index) => {
      item.classList.toggle('on', index + 1 <= progressStep);
    });
    const titles = {
      1: ['Boas-vindas', 'Vamos cadastrar um novo imóvel.', 'O processo leva menos de 3 minutos.'],
      2: ['Etapa 1 de 6', 'Dados do imóvel', 'Organize as informações principais do anúncio.'],
      3: ['Etapa 2 de 6', 'Características', 'Complete os atributos usados na busca e na comparação.'],
      4: ['Etapa 3 de 6', 'Informações comerciais', 'Preencha valores, comissão, situação e chaves.'],
      5: ['Etapa 4 de 6', 'Fotos', 'Quanto mais fotos, maiores as chances de venda.'],
      6: ['Etapa 5 de 6', 'Revisão', 'Confira o anúncio antes de enviar.'],
      7: ['Etapa 6 de 6', 'Envio', 'Cadastro enviado para análise.'],
    };
    const data = titles[step] || titles[1];
    const label = document.getElementById('broker-step-label');
    const title = document.getElementById('broker-step-title');
    const subtitle = document.getElementById('broker-step-subtitle');
    if(label) label.textContent = data[0];
    if(title) title.textContent = data[1];
    if(subtitle) subtitle.textContent = data[2];
    document.getElementById('page-corretor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function setupDrop(){
    const drop = document.getElementById('broker-photo-drop');
    if(!drop || drop.dataset.bound) return;
    drop.addEventListener('dragover', event => {
      event.preventDefault();
      drop.classList.add('drag');
    });
    drop.addEventListener('dragleave', () => drop.classList.remove('drag'));
    drop.addEventListener('drop', event => {
      event.preventDefault();
      drop.classList.remove('drag');
      addPhotos(event.dataTransfer.files);
    });
    drop.dataset.bound = '1';
  }

  function buildExperience(){
    const page = document.getElementById('page-corretor');
    if(!page || page.dataset.brokerExperience) return;
    const container = page.querySelector('.container');
    const root = page.querySelector('div[style*="padding:28px"][style*="box-shadow"]');
    if(!container || !root || !document.getElementById('imovel-titulo')) return;

    page.dataset.brokerExperience = '1';
    container.classList.add('broker-shell');

    const fields = {
      titulo: fieldWrap('imovel-titulo'),
      tipo: fieldWrap('imovel-tipo'),
      preco: fieldWrap('imovel-preco'),
      iptu: fieldWrap('imovel-iptu'),
      condominio: fieldWrap('imovel-condominio'),
      chave: fieldWrap('imovel-chave'),
      finalidade: fieldWrap('imovel-finalidade'),
      cidade: fieldWrap('imovel-cidade'),
      bairro: fieldWrap('imovel-bairro'),
      quartos: fieldWrap('imovel-quartos'),
      banheiros: fieldWrap('imovel-banheiros'),
      vagas: fieldWrap('imovel-vagas'),
      area: fieldWrap('imovel-area'),
      descricao: fieldWrap('imovel-descricao'),
    };
    const photoInput = document.getElementById('imovel-fotos');
    if(photoInput?.parentElement) photoInput.parentElement.removeChild(photoInput);
    const preview = document.getElementById('imovel-fotos-preview');
    if(preview?.parentElement) preview.parentElement.removeChild(preview);
    const term = detach('.term-copy', root);
    const auth = detach('.auth-choice-group', root);
    const publish = document.getElementById('btn-imovel-publicar');
    if(publish?.parentElement) publish.parentElement.removeChild(publish);

    const address = makeField('Endereço', 'imovel-endereco', 'text', 'Rua, número e complemento');
    const suites = makeField('Suítes', 'imovel-suites', 'number', '1');
    const builtArea = makeField('Área construída', 'imovel-area-construida', 'number', '80');
    const comissao = makeField('Comissão', 'imovel-comissao', 'text', 'Ex: 6%');
    const situacao = makeSelect('Situação', 'imovel-situacao', ['Disponível', 'Em negociação', 'Ocupado', 'Desocupado', 'Exclusivo']);

    const oldKeyInput = fields.chave?.querySelector('#imovel-chave');
    if(oldKeyInput){
      oldKeyInput.type = 'hidden';
      oldKeyInput.value = '';
    }

    root.removeAttribute('style');
    root.className = 'broker-panel';
    root.innerHTML = `
      <div class="broker-top">
        <div style="display:flex;justify-content:space-between;gap:16px;align-items:flex-start;flex-wrap:wrap">
          <div>
            <div class="owner-step-label" id="broker-step-label">Boas-vindas</div>
            <h3 id="broker-step-title" style="font-size:24px;color:var(--ink);letter-spacing:-.7px">Vamos cadastrar um novo imóvel.</h3>
            <p id="broker-step-subtitle" style="font-size:13px;color:var(--ink3);margin-top:4px">O processo leva menos de 3 minutos.</p>
          </div>
          <button class="broker-secondary" type="button" onclick="window.resetBrokerWizard()" style="min-height:42px;padding:10px 16px"><i class="ti ti-refresh" aria-hidden="true"></i> Reiniciar</button>
        </div>
        <div class="broker-stepper" id="broker-progress" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span><span></span></div>
        <div class="broker-step-labels" aria-hidden="true"><small>Dados</small><small>Características</small><small>Comercial</small><small>Fotos</small><small>Revisão</small><small>Envio</small></div>
      </div>
      <div class="broker-body">
        <section class="broker-stage on" data-broker-step="1"><div class="broker-welcome"><h2>Vamos cadastrar um novo imóvel.</h2><p>O processo leva menos de 3 minutos.</p><div class="broker-checklist"><div>✓ Dados básicos</div><div>✓ Características</div><div>✓ Informações comerciais</div><div>✓ Fotos</div><div>✓ Revisão</div></div><button class="broker-primary" type="button" onclick="window.brokerGo(2)">COMEÇAR</button></div></section>
        <section class="broker-stage" data-broker-step="2"><div class="broker-card" id="broker-basic-card"><h3><i class="ti ti-home-edit" aria-hidden="true"></i> Dados do imóvel</h3><div class="broker-grid" id="broker-basic-grid"></div></div><div class="broker-card" id="broker-description-card"><h3><i class="ti ti-notes" aria-hidden="true"></i> Descrição</h3></div><div class="broker-actions"><button class="broker-secondary" type="button" onclick="window.brokerGo(1)">Voltar</button><button class="broker-primary" type="button" onclick="window.brokerGo(3)">CONTINUAR</button></div></section>
        <section class="broker-stage" data-broker-step="3"><div class="broker-grid" style="grid-template-columns:minmax(0,1fr) 280px"><div class="broker-card"><h3><i class="ti ti-ruler-measure" aria-hidden="true"></i> Características</h3><div class="broker-feature-grid" id="broker-features-grid"></div></div><aside class="broker-summary"><h3>Resumo</h3><div><span>Quartos</span><strong id="broker-sum-quartos">0</strong></div><div><span>Banheiros</span><strong id="broker-sum-banheiros">0</strong></div><div><span>Suítes</span><strong id="broker-sum-suites">0</strong></div><div><span>Vagas</span><strong id="broker-sum-vagas">0</strong></div><div><span>Área total</span><strong id="broker-sum-area">0 m²</strong></div></aside></div><div class="broker-actions"><button class="broker-secondary" type="button" onclick="window.brokerGo(2)">Voltar</button><button class="broker-primary" type="button" onclick="window.brokerGo(4)">CONTINUAR</button></div></section>
        <section class="broker-stage" data-broker-step="4"><div class="broker-card"><h3><i class="ti ti-cash" aria-hidden="true"></i> Informações comerciais</h3><div class="broker-grid" id="broker-commercial-grid"></div></div><div class="broker-card" id="broker-key-card"><h3><i class="ti ti-key" aria-hidden="true"></i> Onde estão as chaves</h3><div class="broker-choice-group"><label class="broker-choice"><input type="radio" name="imovel-chave-opcao" value="Proprietário" onchange="window.handleBrokerKeyChoice()"/> Proprietário</label><label class="broker-choice"><input type="radio" name="imovel-chave-opcao" value="Portaria" onchange="window.handleBrokerKeyChoice()"/> Portaria</label><label class="broker-choice"><input type="radio" name="imovel-chave-opcao" value="Imobiliária" onchange="window.handleBrokerKeyChoice()"/> Imobiliária</label><label class="broker-choice"><input type="radio" name="imovel-chave-opcao" value="Corretor" onchange="window.handleBrokerKeyChoice()"/> Corretor</label><label class="broker-choice"><input type="radio" name="imovel-chave-opcao" value="Outro" onchange="window.handleBrokerKeyChoice()"/> Outro</label></div><div class="broker-field" id="imovel-chave-outro-wrap" style="display:none;margin-top:12px"><label>Informe onde estão as chaves</label><input type="text" id="imovel-chave-outro" placeholder="Ex: Cofre na recepção" oninput="window.handleBrokerKeyChoice()"/></div></div><div class="broker-card"><h3><i class="ti ti-building-store" aria-hidden="true"></i> Publicar nos portais</h3><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:7px"><div style="background:var(--orl);border:1.5px solid var(--orm);border-radius:var(--r);padding:11px;text-align:center;font-size:11px;color:var(--or);font-weight:700">ZAP</div><div style="background:var(--orl);border:1.5px solid var(--orm);border-radius:var(--r);padding:11px;text-align:center;font-size:11px;color:var(--or);font-weight:700">VivaReal</div><div style="background:var(--orl);border:1.5px solid var(--orm);border-radius:var(--r);padding:11px;text-align:center;font-size:11px;color:var(--or);font-weight:700">OLX</div><div style="background:var(--bg3);border:1.5px solid var(--bdr);border-radius:var(--r);padding:11px;text-align:center;font-size:11px;color:var(--ink4);font-weight:600">Mercado Livre</div></div></div><div class="broker-card" id="broker-auth-card"><h3><i class="ti ti-file-check" aria-hidden="true"></i> Autorização</h3></div><div class="broker-actions"><button class="broker-secondary" type="button" onclick="window.brokerGo(3)">Voltar</button><button class="broker-primary" type="button" onclick="window.brokerGo(5)">CONTINUAR</button></div></section>
        <section class="broker-stage" data-broker-step="5"><div class="broker-upload" id="broker-photo-drop" onclick="document.getElementById('imovel-fotos').click()"><div><i class="ti ti-photo-plus" aria-hidden="true"></i><h3>Adicione as fotos do imóvel.</h3><p>Arraste as imagens aqui ou clique para selecionar.</p><small>Quanto mais fotos, maiores as chances de venda. Máximo de 30 fotos.</small></div></div><div id="broker-photo-slot"></div><div class="broker-actions"><button class="broker-secondary" type="button" onclick="window.brokerGo(4)">Voltar</button><button class="broker-primary" type="button" onclick="window.brokerGo(6)">REVISAR</button></div></section>
        <section class="broker-stage" data-broker-step="6"><div id="broker-review-card"></div><div class="broker-actions"><button class="broker-secondary" type="button" onclick="window.brokerGo(2)">EDITAR</button><button class="broker-primary" type="button" id="broker-submit-slot">ENVIAR PARA APROVAÇÃO</button></div></section>
        <section class="broker-stage" data-broker-step="7"><div class="broker-success"><div class="broker-success-icon">✓</div><h2>Imóvel enviado com sucesso.</h2><p>O imóvel será analisado pela administração.</p><div class="broker-status">Pronto para aprovação.</div><div class="broker-actions" style="justify-content:center"><button class="broker-primary" type="button" onclick="window.brokerGo(1)">VOLTAR AO PAINEL</button></div></div></section>
      </div>`;

    append(document.getElementById('broker-basic-grid'), [fields.titulo, fields.tipo, fields.finalidade, fields.cidade, fields.bairro, address]);
    append(document.getElementById('broker-description-card'), [fields.descricao]);
    [fields.quartos, fields.banheiros, suites, fields.vagas, builtArea, fields.area].forEach((item, index) => {
      if(!item) return;
      const icons = ['ti-bed', 'ti-bath', 'ti-door', 'ti-car', 'ti-ruler', 'ti-crop'];
      const feature = document.createElement('div');
      feature.className = 'broker-feature';
      feature.innerHTML = `<i class="ti ${icons[index]}" aria-hidden="true"></i>`;
      feature.appendChild(item);
      document.getElementById('broker-features-grid')?.appendChild(feature);
      item.querySelector('input,select,textarea')?.addEventListener('input', updateSummary);
    });
    append(document.getElementById('broker-commercial-grid'), [fields.preco, fields.iptu, fields.condominio, comissao, situacao]);
    if(oldKeyInput) document.getElementById('broker-key-card')?.appendChild(oldKeyInput);
    append(document.getElementById('broker-auth-card'), [term, auth]);
    if(photoInput){
      photoInput.hidden = true;
      photoInput.accept = 'image/*';
      document.getElementById('broker-photo-slot')?.appendChild(photoInput);
    }
    if(preview){
      preview.className = 'broker-photo-grid';
      preview.removeAttribute('style');
      document.getElementById('broker-photo-slot')?.appendChild(preview);
    }
    if(publish){
      publish.className = 'broker-primary';
      publish.removeAttribute('style');
      publish.textContent = 'ENVIAR PARA APROVAÇÃO';
      publish.disabled = true;
      document.getElementById('broker-submit-slot')?.replaceWith(publish);
    }
    setupDrop();
    updateSummary();
  }

  function enrichDescription(){
    const desc = document.getElementById('imovel-descricao');
    if(!desc || desc.dataset.brokerEnriched) return;
    const extra = [
      `Endereco: ${valueOf('imovel-endereco') || 'Nao informado'}`,
      `Suites: ${valueOf('imovel-suites') || 'Nao informado'}`,
      `Area construida: ${valueOf('imovel-area-construida') || 'Nao informado'} m2`,
      `Comissao: ${valueOf('imovel-comissao') || 'Nao informada'}`,
      `Situacao: ${valueOf('imovel-situacao') || 'Nao informada'}`,
    ].join('\n');
    desc.dataset.originalValue = desc.value;
    desc.value = `${desc.value || ''}\n\n${extra}`.trim();
    desc.dataset.brokerEnriched = '1';
  }

  function restoreDescription(){
    const desc = document.getElementById('imovel-descricao');
    if(desc?.dataset.brokerEnriched){
      desc.value = desc.dataset.originalValue || '';
      delete desc.dataset.originalValue;
      delete desc.dataset.brokerEnriched;
    }
  }

  function overrideSubmit(){
    window.previewImovelFotos = input => addPhotos(input.files);
    window.enviarImovelBackend = async function(){
      syncPhotosInput();
      handleKeyChoice();
      const autorizacaoVenda = document.querySelector('input[name="imovel-autorizacao-venda"]:checked')?.value || '';
      if(!autorizacaoVenda){
        alert('Selecione uma opção no termo de autorização antes de publicar o imóvel.');
        return;
      }
      if(autorizacaoVenda === 'nao_autorizo'){
        alert('Não é possível enviar o imóvel para aprovação sem autorização de venda.');
        return;
      }
      const token = typeof window.requirePropertyAuth === 'function'
        ? window.requirePropertyAuth()
        : localStorage.getItem('imoore_token');
      if(!token) return;

      const fotos = Array.from(document.getElementById('imovel-fotos')?.files || []);
      if(fotos.length > 30){
        alert('Selecione no máximo 30 fotos.');
        return;
      }

      const titulo = valueOf('imovel-titulo');
      const tipo = valueOf('imovel-tipo');
      const finalidade = valueOf('imovel-finalidade');
      const preco = typeof window.parseMoney === 'function'
        ? window.parseMoney(valueOf('imovel-preco'))
        : Number(String(valueOf('imovel-preco')).replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.'));
      const cidade = valueOf('imovel-cidade');
      if(!titulo || !tipo || !finalidade || !preco || !cidade){
        alert('Preencha título, tipo, finalidade, preço e cidade.');
        return;
      }

      enrichDescription();
      const formData = new FormData();
      formData.append('titulo', titulo);
      formData.append('tipo', tipo);
      formData.append('finalidade', finalidade);
      formData.append('preco', preco);
      formData.append('cidade', cidade);
      formData.append('bairro', valueOf('imovel-bairro'));
      formData.append('iptu', valueOf('imovel-iptu'));
      formData.append('condominio', valueOf('imovel-condominio'));
      formData.append('chave', valueOf('imovel-chave'));
      formData.append('quartos', Number.parseInt(valueOf('imovel-quartos') || '0', 10));
      formData.append('banheiros', Number.parseInt(valueOf('imovel-banheiros') || '0', 10));
      formData.append('vagas', Number.parseInt(valueOf('imovel-vagas') || '0', 10));
      formData.append('area', Number(valueOf('imovel-area') || 0));
      const dadosComplementares = [
        `IPTU: ${valueOf('imovel-iptu') || 'Nao informado'}`,
        `Condominio: ${valueOf('imovel-condominio') || 'Nao informado'}`,
        `Chave do imovel: ${valueOf('imovel-chave') || 'Nao informado'}`,
        'Autorizacao de venda: Autorizo a venda do imóvel em referência',
        'Autorizacao comercial: nao exclusiva, validade de 180 dias',
        'Aceite LGPD: sim',
      ].join('\n');
      formData.append('descricao', `${valueOf('imovel-descricao')}\n\n${dadosComplementares}`);
      fotos.forEach(file => formData.append('fotos', file));

      try{
        const apiBase = window.IMOORE_API_BASE || window.API_BASE || '/api';
        const response = await fetch(`${apiBase}/imoveis`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const data = await response.json().catch(() => ({}));
        if(!response.ok) throw new Error(data.error || 'Erro ao cadastrar imóvel');
        brokerGo(7);
        broker.photos = [];
        broker.cover = 0;
        syncPhotosInput();
        renderPhotos();
        document.querySelectorAll('input[name="imovel-autorizacao-venda"]').forEach(input => { input.checked = false; });
        if(typeof window.toggleBtnImovel === 'function') window.toggleBtnImovel();
      }catch(error){
        alert(error.message || 'Não foi possível cadastrar o imóvel.');
      }finally{
        restoreDescription();
      }
    };
  }

  window.brokerGo = brokerGo;
  window.resetBrokerWizard = () => brokerGo(1);
  window.updateBrokerSummary = updateSummary;
  window.handleBrokerKeyChoice = handleKeyChoice;
  window.setBrokerCover = index => {
    broker.cover = index;
    syncPhotosInput();
    renderPhotos();
  };
  window.removeBrokerPhoto = index => {
    broker.photos.splice(index, 1);
    if(broker.cover >= broker.photos.length) broker.cover = 0;
    syncPhotosInput();
    renderPhotos();
  };
  window.reorderBrokerPhoto = (from, to) => {
    if(from === null || from === to || from < 0 || to < 0) return;
    const [file] = broker.photos.splice(from, 1);
    broker.photos.splice(to, 0, file);
    if(broker.cover === from) broker.cover = to;
    syncPhotosInput();
    renderPhotos();
  };

  setTimeout(() => {
    injectBrokerCss();
    buildExperience();
    overrideSubmit();
  }, 0);
})();

(() => {
  const state = { step: 1 };
  const v = id => document.getElementById(id)?.value?.trim() || '';
  const apiBase = () => window.IMOORE_API_BASE || window.API_BASE || '/api';

  function takeBrokerField(id){
    const input = document.getElementById(id);
    if(!input) return null;
    const wrap = input.parentElement;
    if(wrap?.parentElement) wrap.parentElement.removeChild(wrap);
    wrap.classList.add('broker-field');
    wrap.removeAttribute('style');
    return wrap;
  }

  function brokerPublicGo(step){
    if(step === 5) renderBrokerPublicReview();
    state.step = step;
    document.querySelectorAll('#modal-corretor-cadastro .broker-stage').forEach(stage => {
      stage.classList.toggle('on', Number(stage.dataset.brokerStep) === step);
    });
    document.querySelectorAll('#public-broker-progress span').forEach((item, index) => {
      item.classList.toggle('on', index + 1 <= Math.max(1, Math.min(6, step)));
    });
    const titles = {
      1: ['Boas-vindas', 'Vamos cadastrar seu perfil de corretor.', 'O processo leva menos de 3 minutos.'],
      2: ['Etapa 1 de 6', 'Dados básicos', 'Informe seus dados de contato.'],
      3: ['Etapa 2 de 6', 'Registro e atuação', 'Confirme seu Creci/SP e sua cidade principal.'],
      4: ['Etapa 3 de 6', 'Termo de parceria', 'Leia e aceite as condições para continuar.'],
      5: ['Etapa 4 de 6', 'Revisão', 'Confira seu cadastro antes de enviar.'],
      6: ['Etapa 5 de 6', 'Envio', 'Cadastro enviado para análise.'],
    };
    const data = titles[step] || titles[1];
    const label = document.getElementById('public-broker-label');
    const title = document.getElementById('public-broker-title');
    const subtitle = document.getElementById('public-broker-subtitle');
    if(label) label.textContent = data[0];
    if(title) title.textContent = data[1];
    if(subtitle) subtitle.textContent = data[2];
    document.querySelector('#modal-corretor-cadastro .broker-panel')?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderBrokerPublicReview(){
    const target = document.getElementById('public-broker-review');
    if(!target) return;
    target.innerHTML = `
      <div class="broker-review" style="grid-template-columns:1fr">
        <div class="broker-review-body">
          <h3>${v('cor-nome') || 'Corretor Imoore'}</h3>
          <p>${v('cor-cidade') || 'Cidade de atuação'} · ${v('cor-creci') || 'Creci/SP não informado'}</p>
          <div class="broker-review-meta">
            <span>${v('cor-tel') || 'WhatsApp não informado'}</span>
            <span>${v('cor-email') || 'E-mail não informado'}</span>
            <span>${v('cor-exp') || 'Experiência não informada'}</span>
          </div>
          <div class="broker-status">Pronto para análise.</div>
        </div>
      </div>`;
  }

  function buildPublicBrokerExperience(){
    const modal = document.getElementById('modal-corretor-cadastro');
    if(!modal || modal.dataset.publicBrokerExperience || !document.getElementById('cor-nome')) return;
    modal.dataset.publicBrokerExperience = '1';

    const box = modal.firstElementChild;
    if(!box) return;

    const fields = {
      nome: takeBrokerField('cor-nome'),
      tel: takeBrokerField('cor-tel'),
      email: takeBrokerField('cor-email'),
      creci: takeBrokerField('cor-creci'),
      cidade: takeBrokerField('cor-cidade'),
      exp: takeBrokerField('cor-exp'),
    };
    const aceite = document.getElementById('cor-aceite')?.closest('label');
    if(aceite?.parentElement) aceite.parentElement.removeChild(aceite);
    const termoStrong = Array.from(modal.querySelectorAll('strong')).find(el => el.textContent.includes('Termo de Parceria'));
    const termo = termoStrong?.closest('div');
    if(termo?.parentElement) termo.parentElement.removeChild(termo);
    const sendButton = document.getElementById('btn-cor-enviar');
    if(sendButton?.parentElement) sendButton.parentElement.removeChild(sendButton.parentElement);

    modal.onclick = event => {
      if(event.target === modal) window.fecharModalCorretorPublico();
    };
    box.removeAttribute('style');
    box.className = 'broker-panel';
    box.style.width = '100%';
    box.style.maxWidth = '760px';
    box.style.maxHeight = '94vh';
    box.style.overflowY = 'auto';
    box.style.margin = '16px';

    box.innerHTML = `
      <div class="broker-top">
        <div style="display:flex;justify-content:space-between;gap:16px;align-items:flex-start">
          <div>
            <div class="owner-step-label" id="public-broker-label">Boas-vindas</div>
            <h3 id="public-broker-title" style="font-size:24px;color:var(--ink);letter-spacing:-.7px">Vamos cadastrar seu perfil de corretor.</h3>
            <p id="public-broker-subtitle" style="font-size:13px;color:var(--ink3);margin-top:4px">O processo leva menos de 3 minutos.</p>
          </div>
          <button class="wizard-close" type="button" onclick="window.fecharModalCorretorPublico()" aria-label="Fechar">×</button>
        </div>
        <div class="broker-stepper" id="public-broker-progress" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span><span></span></div>
        <div class="broker-step-labels" aria-hidden="true"><small>Início</small><small>Dados</small><small>Creci</small><small>Termo</small><small>Revisão</small><small>Envio</small></div>
      </div>
      <div class="broker-body">
        <section class="broker-stage on" data-broker-step="1">
          <div class="broker-welcome">
            <h2>Vamos cadastrar seu perfil de corretor.</h2>
            <p>O processo leva menos de 3 minutos.</p>
            <div class="broker-checklist">
              <div>✓ Dados básicos</div>
              <div>✓ Creci/SP</div>
              <div>✓ Região de atuação</div>
              <div>✓ Experiência</div>
              <div>✓ Revisão</div>
            </div>
            <button class="broker-primary" type="button" onclick="window.brokerPublicGo(2)">COMEÇAR</button>
          </div>
        </section>
        <section class="broker-stage" data-broker-step="2">
          <div class="broker-card"><h3><i class="ti ti-user"></i> Dados básicos</h3><div class="broker-grid" id="public-broker-basic"></div></div>
          <div class="broker-actions"><button class="broker-secondary" type="button" onclick="window.brokerPublicGo(1)">Voltar</button><button class="broker-primary" type="button" onclick="window.brokerPublicGo(3)">CONTINUAR</button></div>
        </section>
        <section class="broker-stage" data-broker-step="3">
          <div class="broker-card"><h3><i class="ti ti-id-badge"></i> Registro e atuação</h3><div class="broker-grid" id="public-broker-credentials"></div></div>
          <div class="broker-actions"><button class="broker-secondary" type="button" onclick="window.brokerPublicGo(2)">Voltar</button><button class="broker-primary" type="button" onclick="window.brokerPublicGo(4)">CONTINUAR</button></div>
        </section>
        <section class="broker-stage" data-broker-step="4">
          <div class="broker-card" id="public-broker-term"><h3><i class="ti ti-file-check"></i> Termo de parceria</h3></div>
          <div class="broker-actions"><button class="broker-secondary" type="button" onclick="window.brokerPublicGo(3)">Voltar</button><button class="broker-primary" type="button" onclick="window.brokerPublicGo(5)">REVISAR</button></div>
        </section>
        <section class="broker-stage" data-broker-step="5">
          <div id="public-broker-review"></div>
          <div class="broker-actions"><button class="broker-secondary" type="button" onclick="window.brokerPublicGo(2)">EDITAR</button><button class="broker-primary" type="button" onclick="window.enviarCorretor()">ENVIAR CADASTRO</button></div>
        </section>
        <section class="broker-stage" data-broker-step="6">
          <div class="broker-success">
            <div class="broker-success-icon">✓</div>
            <h2>Cadastro enviado com sucesso.</h2>
            <p>Nossa equipe fará a análise e entrará em contato.</p>
            <div class="broker-status">Em análise.</div>
            <div class="broker-actions" style="justify-content:center"><button class="broker-primary" type="button" onclick="window.fecharModalCorretorPublico()">FINALIZAR</button></div>
          </div>
        </section>
      </div>`;

    addPublicItems('public-broker-basic', [fields.nome, fields.tel, fields.email]);
    addPublicItems('public-broker-credentials', [fields.creci, fields.cidade, fields.exp]);
    addPublicItems('public-broker-term', [termo, aceite]);
    if(aceite){
      aceite.classList.add('auth-choice');
      aceite.removeAttribute('style');
    }
    brokerPublicGo(1);
  }

  function addPublicItems(id, items){
    const target = document.getElementById(id);
    items.filter(Boolean).forEach(item => target?.appendChild(item));
  }

  async function enviarCorretorPublico(){
    if(!document.getElementById('cor-aceite')?.checked){
      alert('Aceite o termo de parceria para enviar o cadastro.');
      return;
    }
    const nome = v('cor-nome');
    const tel = v('cor-tel');
    const email = v('cor-email');
    const creci = v('cor-creci');
    if(!nome || !tel || !email || !creci){
      alert('Preencha nome, WhatsApp, e-mail e Creci/SP.');
      return;
    }
    try{
      const response = await fetch(`${apiBase()}/leads/public`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          nome,
          telefone: tel,
          email,
          cidade: v('cor-cidade'),
          interesse: 'corretor_trabalhe_conosco',
          observacoes: `Creci/SP: ${creci}\nExperiência: ${v('cor-exp')}\nTermo aceito: sim`,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if(!response.ok) throw new Error(data.error || 'Erro ao enviar cadastro');
      brokerPublicGo(6);
    }catch(error){
      alert(error.message || 'Não foi possível enviar o cadastro.');
    }
  }

  window.brokerPublicGo = brokerPublicGo;
  window.fecharModalCorretorPublico = () => {
    const modal = document.getElementById('modal-corretor-cadastro');
    if(modal) modal.classList.remove('on');
    document.body.style.overflow = '';
    brokerPublicGo(1);
  };

  setTimeout(() => {
    if(document.getElementById('modal-corretor-cadastro')) return;
    buildPublicBrokerExperience();
    window.enviarCorretor = enviarCorretorPublico;
    window.abrirModalCorretor = () => {
      buildPublicBrokerExperience();
      const modal = document.getElementById('modal-corretor-cadastro');
      if(modal) modal.classList.add('on');
      document.body.style.overflow = 'hidden';
      brokerPublicGo(1);
    };
  }, 120);
})();

(() => {
  const state = { step: 1, photos: [], cover: 0, drag: null };
  const v = id => document.getElementById(id)?.value?.trim() || '';
  const apiBase = () => window.IMOORE_API_BASE || window.API_BASE || '/api';

  function field(label, id, type = 'text', placeholder = ''){
    return `<div class="broker-field"><label>${label}</label><input type="${type}" id="${id}" placeholder="${placeholder}"/></div>`;
  }

  function select(label, id, options){
    return `<div class="broker-field"><label>${label}</label><select id="${id}">${options.map(item => `<option>${item}</option>`).join('')}</select></div>`;
  }

  function publicCorretorGo(step){
    if(step === 7) renderPublicCorretorReview();
    state.step = step;
    document.querySelectorAll('#modal-corretor-cadastro .broker-stage').forEach(stage => {
      stage.classList.toggle('on', Number(stage.dataset.brokerStep) === step);
    });
    document.querySelectorAll('#public-corretor-progress span').forEach((item, index) => {
      item.classList.toggle('on', index + 1 <= step);
    });
    const titles = {
      1: ['Boas-vindas', 'Vamos cadastrar um novo imóvel.', 'O processo leva menos de 3 minutos.'],
      2: ['Etapa 1 de 8', 'Dados do imóvel', 'Preencha os dados básicos do anúncio.'],
      3: ['Etapa 2 de 8', 'Características', 'Informe os atributos principais.'],
      4: ['Etapa 3 de 8', 'Informações comerciais', 'Preencha valores e situação comercial.'],
      5: ['Etapa 4 de 8', 'Chaves do imóvel', 'Informe onde estão as chaves.'],
      6: ['Etapa 5 de 8', 'Fotos', 'Adicione imagens para qualificar o cadastro.'],
      7: ['Etapa 6 de 8', 'Revisão', 'Confira tudo antes de enviar.'],
      8: ['Etapa 7 de 8', 'Sucesso', 'Cadastro enviado para análise.'],
    };
    const data = titles[step] || titles[1];
    const labelEl = document.getElementById('public-corretor-label');
    const titleEl = document.getElementById('public-corretor-title');
    const subtitleEl = document.getElementById('public-corretor-subtitle');
    if(labelEl) labelEl.textContent = data[0];
    if(titleEl) titleEl.textContent = data[1];
    if(subtitleEl) subtitleEl.textContent = data[2];
    document.querySelector('#modal-corretor-cadastro .broker-panel')?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function syncPublicCorretorPhotos(){
    const input = document.getElementById('cor-imovel-fotos');
    if(!input || typeof DataTransfer === 'undefined') return;
    const data = new DataTransfer();
    state.photos.forEach(file => data.items.add(file));
    input.files = data.files;
  }

  function addPublicCorretorPhotos(files){
    const selected = Array.from(files || []).filter(file => /^image\//.test(file.type));
    const available = Math.max(0, 30 - state.photos.length);
    if(selected.length > available) alert('Selecione no máximo 30 fotos.');
    state.photos = state.photos.concat(selected.slice(0, available));
    if(state.cover >= state.photos.length) state.cover = 0;
    syncPublicCorretorPhotos();
    renderPublicCorretorPhotos();
  }

  function renderPublicCorretorPhotos(){
    const target = document.getElementById('cor-imovel-fotos-preview');
    if(!target) return;
    target.innerHTML = '';
    state.photos.forEach((file, index) => {
      const url = URL.createObjectURL(file);
      const item = document.createElement('div');
      item.className = 'broker-photo';
      item.draggable = true;
      item.style.backgroundImage = `url('${url}')`;
      item.innerHTML = `
        <span class="broker-photo-num">${index + 1}</span>
        ${index === state.cover ? '<span class="broker-photo-cover">Principal</span>' : ''}
        <div class="broker-photo-actions">
          <button type="button" title="Principal" onclick="window.setPublicCorretorCover(${index})">⭐</button>
          <button type="button" title="Excluir" onclick="window.removePublicCorretorPhoto(${index})">×</button>
        </div>`;
      item.addEventListener('dragstart', () => { state.drag = index; item.classList.add('dragging'); });
      item.addEventListener('dragend', () => item.classList.remove('dragging'));
      item.addEventListener('dragover', event => event.preventDefault());
      item.addEventListener('drop', event => {
        event.preventDefault();
        window.reorderPublicCorretorPhoto(state.drag, index);
      });
      target.appendChild(item);
    });
  }

  function handlePublicCorretorKey(){
    const selected = document.querySelector('input[name="cor-chave-opcao"]:checked')?.value || '';
    const otherWrap = document.getElementById('cor-chave-outro-wrap');
    const hidden = document.getElementById('cor-chave');
    if(otherWrap) otherWrap.style.display = selected === 'Outro' ? 'flex' : 'none';
    if(hidden) hidden.value = selected === 'Outro' ? v('cor-chave-outro') : selected;
  }

  function renderPublicCorretorReview(){
    const target = document.getElementById('public-corretor-review');
    if(!target) return;
    const coverFile = state.photos[state.cover] || state.photos[0];
    const cover = coverFile ? URL.createObjectURL(coverFile) : '';
    target.innerHTML = `
      <div class="broker-review">
        <div class="broker-review-cover" style="${cover ? `background-image:url('${cover}')` : ''}">${cover ? '' : 'Foto principal'}</div>
        <div class="broker-review-body">
          <h3>${v('cor-imovel-titulo') || v('cor-imovel-tipo') || 'Imóvel'}</h3>
          <p>${[v('cor-imovel-bairro'), v('cor-imovel-cidade')].filter(Boolean).join(', ') || 'Localização não informada'}</p>
          <div class="broker-review-price">${v('cor-imovel-valor') || 'Valor sob consulta'}</div>
          <div class="broker-review-meta">
            <span>${v('cor-quartos') || 0} quartos</span>
            <span>${v('cor-banheiros') || 0} banheiros</span>
            <span>${v('cor-suites') || 0} suítes</span>
            <span>${v('cor-vagas') || 0} vagas</span>
            <span>${v('cor-area-total') || 0} m²</span>
          </div>
          <div class="broker-review-flags">
            <span>Corretor: ${v('cor-nome') || 'não informado'}</span>
            <span>Creci/SP: ${v('cor-creci') || 'não informado'}</span>
            <span>Chaves: ${v('cor-chave') || 'não informado'}</span>
            <span>${state.photos.length} foto${state.photos.length === 1 ? '' : 's'}</span>
          </div>
          <div class="broker-status">Pronto para análise.</div>
        </div>
      </div>`;
  }

  function setupPublicCorretorDrop(){
    const drop = document.getElementById('public-corretor-drop');
    if(!drop || drop.dataset.bound) return;
    drop.addEventListener('dragover', event => {
      event.preventDefault();
      drop.classList.add('drag');
    });
    drop.addEventListener('dragleave', () => drop.classList.remove('drag'));
    drop.addEventListener('drop', event => {
      event.preventDefault();
      drop.classList.remove('drag');
      addPublicCorretorPhotos(event.dataTransfer.files);
    });
    drop.dataset.bound = '1';
  }

  function buildPublicCorretorImovelExperience(){
    const modal = document.getElementById('modal-corretor-cadastro');
    if(!modal) return;
    const box = modal.firstElementChild;
    if(!box) return;
    if(modal.dataset.publicCorretorImovel === '1') return;
    modal.dataset.publicCorretorImovel = '1';

    modal.onclick = event => {
      if(event.target === modal) window.fecharPublicCorretorImovel();
    };

    box.removeAttribute('style');
    box.className = 'broker-panel';
    box.style.width = '100%';
    box.style.maxWidth = '880px';
    box.style.maxHeight = '94vh';
    box.style.overflowY = 'auto';
    box.style.margin = '16px';
    box.innerHTML = `
      <div class="broker-top">
        <div style="display:flex;justify-content:space-between;gap:16px;align-items:flex-start">
          <div>
            <div class="owner-step-label" id="public-corretor-label">Boas-vindas</div>
            <h3 id="public-corretor-title" style="font-size:24px;color:var(--ink);letter-spacing:-.7px">Vamos cadastrar um novo imóvel.</h3>
            <p id="public-corretor-subtitle" style="font-size:13px;color:var(--ink3);margin-top:4px">O processo leva menos de 3 minutos.</p>
          </div>
          <button class="wizard-close" type="button" onclick="window.fecharPublicCorretorImovel()" aria-label="Fechar">×</button>
        </div>
        <div class="broker-stepper" id="public-corretor-progress" aria-hidden="true" style="grid-template-columns:repeat(8,1fr)"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>
        <div class="broker-step-labels" aria-hidden="true" style="grid-template-columns:repeat(8,1fr)"><small>Início</small><small>Dados</small><small>Carac.</small><small>Comercial</small><small>Chaves</small><small>Fotos</small><small>Revisão</small><small>Envio</small></div>
      </div>
      <div class="broker-body">
        <section class="broker-stage on" data-broker-step="1"><div class="broker-welcome"><h2>Vamos cadastrar um novo imóvel.</h2><p>O processo leva menos de 3 minutos.</p><div class="broker-checklist"><div>✓ Dados do imóvel</div><div>✓ Características</div><div>✓ Informações comerciais</div><div>✓ Fotos</div><div>✓ Revisão</div></div><button class="broker-primary" type="button" onclick="window.publicCorretorGo(2)">COMEÇAR</button></div></section>
        <section class="broker-stage" data-broker-step="2"><div class="broker-card"><h3><i class="ti ti-user"></i> Dados do corretor</h3><div class="broker-grid">${field('Nome completo','cor-nome','text','Seu nome')}${field('WhatsApp','cor-tel','text','(13) 99999-9999')}${field('E-mail','cor-email','email','seu@email.com')}${field('Creci/SP','cor-creci','text','Ex: SP-123456')}</div></div><div class="broker-card"><h3><i class="ti ti-home-edit"></i> Dados do imóvel</h3><div class="broker-grid">${field('Título','cor-imovel-titulo','text','Ex: Apartamento 2 quartos em Santos')}${select('Tipo','cor-imovel-tipo',['Apartamento','Casa','Terreno','Cobertura','Comercial','Studio'])}${select('Finalidade','cor-imovel-finalidade',['Venda','Aluguel','Lançamento'])}${select('Cidade','cor-imovel-cidade',['Santos','São Vicente','Guarujá','Praia Grande','Cubatão','Bertioga','Itanhaém','Mongaguá','Peruíbe','Itariri','Pedro de Toledo','Ana Dias'])}${field('Bairro','cor-imovel-bairro','text','Ex: Gonzaga')}${field('Endereço','cor-imovel-endereco','text','Rua, número e complemento')}</div></div><div class="broker-actions"><button class="broker-secondary" type="button" onclick="window.publicCorretorGo(1)">Voltar</button><button class="broker-primary" type="button" onclick="window.publicCorretorGo(3)">CONTINUAR</button></div></section>
        <section class="broker-stage" data-broker-step="3"><div class="broker-card"><h3><i class="ti ti-ruler-measure"></i> Características</h3><div class="broker-feature-grid"><div class="broker-feature"><i class="ti ti-bed"></i>${field('Quartos','cor-quartos','number','2')}</div><div class="broker-feature"><i class="ti ti-bath"></i>${field('Banheiros','cor-banheiros','number','1')}</div><div class="broker-feature"><i class="ti ti-door"></i>${field('Suítes','cor-suites','number','1')}</div><div class="broker-feature"><i class="ti ti-car"></i>${field('Vagas','cor-vagas','number','1')}</div><div class="broker-feature"><i class="ti ti-ruler"></i>${field('Área construída','cor-area-construida','number','80')}</div><div class="broker-feature"><i class="ti ti-crop"></i>${field('Área total','cor-area-total','number','120')}</div></div></div><div class="broker-actions"><button class="broker-secondary" type="button" onclick="window.publicCorretorGo(2)">Voltar</button><button class="broker-primary" type="button" onclick="window.publicCorretorGo(4)">CONTINUAR</button></div></section>
        <section class="broker-stage" data-broker-step="4"><div class="broker-card"><h3><i class="ti ti-cash"></i> Informações comerciais</h3><div class="broker-grid">${field('Valor do imóvel','cor-imovel-valor','text','R$ 550.000')}${field('IPTU','cor-iptu','text','Ex: 180,00')}${field('Condomínio','cor-condominio','text','Ex: 650,00')}${field('Comissão','cor-comissao','text','Ex: 6%')}${select('Situação','cor-situacao',['Disponível','Em negociação','Ocupado','Desocupado','Exclusivo'])}${select('Experiência do corretor','cor-exp',['Menos de 1 ano','1 a 3 anos','3 a 5 anos','Mais de 5 anos'])}</div></div><div class="broker-actions"><button class="broker-secondary" type="button" onclick="window.publicCorretorGo(3)">Voltar</button><button class="broker-primary" type="button" onclick="window.publicCorretorGo(5)">CONTINUAR</button></div></section>
        <section class="broker-stage" data-broker-step="5"><div class="broker-card"><h3><i class="ti ti-key"></i> Chaves do imóvel</h3><input type="hidden" id="cor-chave"/><div class="broker-choice-group"><label class="broker-choice"><input type="radio" name="cor-chave-opcao" value="Proprietário" onchange="window.handlePublicCorretorKey()"> Proprietário</label><label class="broker-choice"><input type="radio" name="cor-chave-opcao" value="Portaria" onchange="window.handlePublicCorretorKey()"> Portaria</label><label class="broker-choice"><input type="radio" name="cor-chave-opcao" value="Imobiliária" onchange="window.handlePublicCorretorKey()"> Imobiliária</label><label class="broker-choice"><input type="radio" name="cor-chave-opcao" value="Corretor" onchange="window.handlePublicCorretorKey()"> Corretor</label><label class="broker-choice"><input type="radio" name="cor-chave-opcao" value="Outro" onchange="window.handlePublicCorretorKey()"> Outro</label></div><div class="broker-field" id="cor-chave-outro-wrap" style="display:none;margin-top:12px"><label>Informe onde estão as chaves</label><input type="text" id="cor-chave-outro" placeholder="Ex: Cofre na recepção" oninput="window.handlePublicCorretorKey()"/></div></div><div class="broker-card"><h3><i class="ti ti-notes"></i> Observações</h3><div class="broker-field"><label>Descrição do imóvel</label><textarea id="cor-imovel-descricao" placeholder="Descreva diferenciais, localização e condições de negociação."></textarea></div></div><div class="broker-actions"><button class="broker-secondary" type="button" onclick="window.publicCorretorGo(4)">Voltar</button><button class="broker-primary" type="button" onclick="window.publicCorretorGo(6)">CONTINUAR</button></div></section>
        <section class="broker-stage" data-broker-step="6"><div class="broker-upload" id="public-corretor-drop" onclick="document.getElementById('cor-imovel-fotos').click()"><div><i class="ti ti-photo-plus"></i><h3>Adicione as fotos do imóvel.</h3><p>Arraste as imagens aqui ou clique para selecionar.</p><small>Quanto mais fotos, maiores as chances de venda. Máximo de 30 fotos.</small></div></div><input type="file" id="cor-imovel-fotos" multiple accept="image/*" hidden onchange="window.addPublicCorretorPhotos(this.files)"/><div id="cor-imovel-fotos-preview" class="broker-photo-grid"></div><div class="broker-actions"><button class="broker-secondary" type="button" onclick="window.publicCorretorGo(5)">Voltar</button><button class="broker-primary" type="button" onclick="window.publicCorretorGo(7)">REVISAR</button></div></section>
        <section class="broker-stage" data-broker-step="7"><div id="public-corretor-review"></div><div class="broker-actions"><button class="broker-secondary" type="button" onclick="window.publicCorretorGo(2)">EDITAR</button><button class="broker-primary" type="button" onclick="window.enviarCorretor()">ENVIAR PARA ANÁLISE</button></div></section>
        <section class="broker-stage" data-broker-step="8"><div class="broker-success"><div class="broker-success-icon">✓</div><h2>Cadastro enviado com sucesso.</h2><p>Nossa equipe fará a análise e entrará em contato.</p><div class="broker-status">Em análise.</div><div class="broker-actions" style="justify-content:center"><button class="broker-primary" type="button" onclick="window.fecharPublicCorretorImovel()">FINALIZAR</button></div></div></section>
      </div>`;
    setupPublicCorretorDrop();
    publicCorretorGo(1);
  }

  async function enviarCorretorImovelPublico(){
    const nome = v('cor-nome');
    const tel = v('cor-tel');
    const email = v('cor-email');
    const creci = v('cor-creci');
    if(!nome || !tel || !email || !creci){
      alert('Preencha nome, WhatsApp, e-mail e Creci/SP.');
      return;
    }
    try{
      const observacoes = [
        `Creci/SP: ${creci}`,
        `Experiência: ${v('cor-exp') || 'Nao informada'}`,
        `Imovel: ${v('cor-imovel-titulo') || 'Nao informado'}`,
        `Tipo: ${v('cor-imovel-tipo') || 'Nao informado'}`,
        `Finalidade: ${v('cor-imovel-finalidade') || 'Nao informada'}`,
        `Cidade: ${v('cor-imovel-cidade') || 'Nao informada'}`,
        `Bairro: ${v('cor-imovel-bairro') || 'Nao informado'}`,
        `Endereco: ${v('cor-imovel-endereco') || 'Nao informado'}`,
        `Valor: ${v('cor-imovel-valor') || 'Nao informado'}`,
        `IPTU: ${v('cor-iptu') || 'Nao informado'}`,
        `Condominio: ${v('cor-condominio') || 'Nao informado'}`,
        `Comissao: ${v('cor-comissao') || 'Nao informada'}`,
        `Situacao: ${v('cor-situacao') || 'Nao informada'}`,
        `Quartos: ${v('cor-quartos') || 'Nao informado'}`,
        `Banheiros: ${v('cor-banheiros') || 'Nao informado'}`,
        `Suites: ${v('cor-suites') || 'Nao informado'}`,
        `Vagas: ${v('cor-vagas') || 'Nao informado'}`,
        `Area construida: ${v('cor-area-construida') || 'Nao informada'} m2`,
        `Area total: ${v('cor-area-total') || 'Nao informada'} m2`,
        `Chaves: ${v('cor-chave') || 'Nao informado'}`,
        `Descricao: ${v('cor-imovel-descricao') || 'Nao informada'}`,
        `Fotos selecionadas: ${state.photos.length}`,
      ].join('\n');
      const response = await fetch(`${apiBase()}/leads/public`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          nome,
          telefone: tel,
          email,
          cidade: v('cor-imovel-cidade') || v('cor-cidade'),
          interesse: 'corretor_cadastro_imovel',
          observacoes,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if(!response.ok) throw new Error(data.error || 'Erro ao enviar cadastro');
      publicCorretorGo(8);
    }catch(error){
      alert(error.message || 'Não foi possível enviar o cadastro.');
    }
  }

  window.publicCorretorGo = publicCorretorGo;
  window.handlePublicCorretorKey = handlePublicCorretorKey;
  window.addPublicCorretorPhotos = addPublicCorretorPhotos;
  window.setPublicCorretorCover = index => { state.cover = index; syncPublicCorretorPhotos(); renderPublicCorretorPhotos(); };
  window.removePublicCorretorPhoto = index => {
    state.photos.splice(index, 1);
    if(state.cover >= state.photos.length) state.cover = 0;
    syncPublicCorretorPhotos();
    renderPublicCorretorPhotos();
  };
  window.reorderPublicCorretorPhoto = (from, to) => {
    if(from === null || from === to || from < 0 || to < 0) return;
    const [file] = state.photos.splice(from, 1);
    state.photos.splice(to, 0, file);
    if(state.cover === from) state.cover = to;
    syncPublicCorretorPhotos();
    renderPublicCorretorPhotos();
  };
  window.fecharPublicCorretorImovel = () => {
    const modal = document.getElementById('modal-corretor-cadastro');
    if(modal) modal.classList.remove('on');
    document.body.style.overflow = '';
  };

  setTimeout(() => {
    window.abrirModalCorretor = () => {
      buildPublicCorretorImovelExperience();
      const modal = document.getElementById('modal-corretor-cadastro');
      if(modal) modal.classList.add('on');
      document.body.style.overflow = 'hidden';
      publicCorretorGo(1);
    };
    window.enviarCorretor = enviarCorretorImovelPublico;
  }, 180);
})();

(() => {
  const state = { step: 1, photos: [], cover: 0, drag: null };
  const v = id => document.getElementById(id)?.value?.trim() || '';
  const apiBase = () => window.IMOORE_API_BASE || window.API_BASE || '/api';

  function money(value){
    const parsed = Number(String(value || '').replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.'));
    return Number.isFinite(parsed) && parsed > 0 ? parsed.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'Valor sob consulta';
  }

  function takeField(id){
    const input = document.getElementById(id);
    if(!input) return null;
    const wrap = input.closest('.ff') || input.parentElement;
    if(wrap?.parentElement) wrap.parentElement.removeChild(wrap);
    wrap.classList.add('broker-field');
    return wrap;
  }

  function makeField(label, id, type, placeholder){
    const wrap = document.createElement('div');
    wrap.className = 'broker-field';
    wrap.innerHTML = `<label>${label}</label><input type="${type || 'text'}" id="${id}" placeholder="${placeholder || ''}"/>`;
    return wrap;
  }

  function makeSelect(label, id, options){
    const wrap = document.createElement('div');
    wrap.className = 'broker-field';
    wrap.innerHTML = `<label>${label}</label><select id="${id}">${options.map(item => `<option>${item}</option>`).join('')}</select>`;
    return wrap;
  }

  function addItems(parent, items){
    items.filter(Boolean).forEach(item => parent.appendChild(item));
  }

  function syncInput(){
    const input = document.getElementById('inp-fotos');
    if(!input || typeof DataTransfer === 'undefined') return;
    const data = new DataTransfer();
    state.photos.forEach(file => data.items.add(file));
    input.files = data.files;
  }

  function renderPanelPhotos(){
    const preview = document.getElementById('fotos-preview');
    if(!preview) return;
    preview.innerHTML = '';
    state.photos.forEach((file, index) => {
      const url = URL.createObjectURL(file);
      const item = document.createElement('div');
      item.className = 'broker-photo';
      item.draggable = true;
      item.style.backgroundImage = `url('${url}')`;
      item.innerHTML = `
        <span class="broker-photo-num">${index + 1}</span>
        ${index === state.cover ? '<span class="broker-photo-cover">Principal</span>' : ''}
        <div class="broker-photo-actions">
          <button type="button" title="Principal" onclick="window.panelSetCover(${index})">⭐</button>
          <button type="button" title="Excluir" onclick="window.panelRemovePhoto(${index})">×</button>
        </div>`;
      item.addEventListener('dragstart', () => { state.drag = index; item.classList.add('dragging'); });
      item.addEventListener('dragend', () => item.classList.remove('dragging'));
      item.addEventListener('dragover', event => event.preventDefault());
      item.addEventListener('drop', event => {
        event.preventDefault();
        window.panelReorderPhoto(state.drag, index);
      });
      preview.appendChild(item);
    });
  }

  function addPanelPhotos(files){
    const selected = Array.from(files || []).filter(file => /^image\//.test(file.type));
    const available = Math.max(0, 30 - state.photos.length);
    if(selected.length > available) alert('Selecione no máximo 30 fotos.');
    state.photos = state.photos.concat(selected.slice(0, available));
    if(state.cover >= state.photos.length) state.cover = 0;
    syncInput();
    renderPanelPhotos();
  }

  function updatePanelSummary(){
    const pairs = {
      'panel-sum-quartos': v('im-quartos') || '0',
      'panel-sum-banheiros': v('im-banheiros') || '0',
      'panel-sum-suites': v('im-suites') || '0',
      'panel-sum-vagas': v('im-vagas') || '0',
      'panel-sum-area': `${v('im-area') || '0'} m²`,
    };
    Object.entries(pairs).forEach(([id, value]) => {
      const el = document.getElementById(id);
      if(el) el.textContent = value;
    });
  }

  function handlePanelKey(){
    const selected = document.querySelector('input[name="im-chave-opcao"]:checked')?.value || '';
    const otherWrap = document.getElementById('im-chave-outro-wrap');
    const target = document.getElementById('im-chave');
    if(otherWrap) otherWrap.style.display = selected === 'Outro' ? 'flex' : 'none';
    if(target) target.value = selected === 'Outro' ? v('im-chave-outro') : selected;
  }

  function renderPanelReview(){
    const target = document.getElementById('panel-review-card');
    if(!target) return;
    const coverFile = state.photos[state.cover] || state.photos[0];
    const cover = coverFile ? URL.createObjectURL(coverFile) : '';
    target.innerHTML = `
      <div class="broker-review">
        <div class="broker-review-cover" style="${cover ? `background-image:url('${cover}')` : ''}">${cover ? '' : 'Foto principal'}</div>
        <div class="broker-review-body">
          <h3>${v('im-titulo') || v('im-tipo') || 'Imóvel'}</h3>
          <p>${[v('im-bairro'), v('im-cidade')].filter(Boolean).join(', ') || 'Cidade não informada'}</p>
          <div class="broker-review-price">${money(v('im-preco'))}</div>
          <div class="broker-review-meta">
            <span>${v('im-quartos') || 0} quartos</span>
            <span>${v('im-banheiros') || 0} banheiros</span>
            <span>${v('im-suites') || 0} suítes</span>
            <span>${v('im-vagas') || 0} vagas</span>
            <span>${v('im-area') || 0} m²</span>
          </div>
          <div class="broker-review-flags">
            <span>IPTU: ${v('im-iptu') || 'não informado'}</span>
            <span>Condomínio: ${v('im-condominio') || 'não informado'}</span>
            <span>Comissão: ${v('im-comissao') || 'não informada'}</span>
            <span>Situação: ${v('im-situacao') || 'não informada'}</span>
            <span>Chaves: ${v('im-chave') || 'não informado'}</span>
            <span>${state.photos.length} foto${state.photos.length === 1 ? '' : 's'}</span>
          </div>
          <div class="broker-status">Pronto para aprovação.</div>
        </div>
      </div>`;
  }

  function panelGo(step){
    if(step === 7) renderPanelReview();
    state.step = step;
    document.querySelectorAll('#page-novo-imovel .broker-stage').forEach(stage => {
      stage.classList.toggle('on', Number(stage.dataset.brokerStep) === step);
    });
    const progress = Math.max(1, Math.min(8, step));
    document.querySelectorAll('#panel-broker-progress span').forEach((item, index) => {
      item.classList.toggle('on', index + 1 <= progress);
    });
    const titles = {
      1: ['Boas-vindas', 'Vamos cadastrar um novo imóvel.', 'O processo leva menos de 3 minutos.'],
      2: ['Etapa 1 de 6', 'Dados do imóvel', 'Organize os dados básicos do anúncio.'],
      3: ['Etapa 2 de 6', 'Características', 'Complete os atributos do imóvel.'],
      4: ['Etapa 3 de 7', 'Informações comerciais', 'Preencha valores, comissão e situação.'],
      5: ['Etapa 4 de 7', 'Chaves e autorização', 'Confirme onde estão as chaves e a autorização de venda.'],
      6: ['Etapa 5 de 7', 'Fotos', 'Quanto mais fotos, maiores as chances de venda.'],
      7: ['Etapa 6 de 7', 'Revisão', 'Confira tudo antes de enviar.'],
      8: ['Etapa 7 de 7', 'Envio', 'Imóvel enviado para aprovação.'],
    };
    const data = titles[step] || titles[1];
    const label = document.getElementById('panel-broker-label');
    const title = document.getElementById('panel-broker-title');
    const subtitle = document.getElementById('panel-broker-subtitle');
    if(label) label.textContent = data[0];
    if(title) title.textContent = data[1];
    if(subtitle) subtitle.textContent = data[2];
    document.getElementById('page-novo-imovel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function setupPanelDrop(){
    const drop = document.getElementById('panel-photo-drop');
    if(!drop || drop.dataset.bound) return;
    drop.addEventListener('dragover', event => {
      event.preventDefault();
      drop.classList.add('drag');
    });
    drop.addEventListener('dragleave', () => drop.classList.remove('drag'));
    drop.addEventListener('drop', event => {
      event.preventDefault();
      drop.classList.remove('drag');
      addPanelPhotos(event.dataTransfer.files);
    });
    drop.dataset.bound = '1';
  }

  function buildPanelExperience(){
    const page = document.getElementById('page-novo-imovel');
    if(!page || page.dataset.panelBrokerExperience || !document.getElementById('im-titulo')) return;
    page.dataset.panelBrokerExperience = '1';

    const shell = page.querySelector('div[style*="max-width:700px"]') || page;
    shell.classList.add('broker-shell');
    shell.removeAttribute('style');

    const fields = {
      titulo: takeField('im-titulo'),
      tipo: takeField('im-tipo'),
      finalidade: takeField('im-finalidade'),
      preco: takeField('im-preco'),
      iptu: takeField('im-iptu'),
      condominio: takeField('im-condominio'),
      chave: takeField('im-chave'),
      cidade: takeField('im-cidade'),
      bairro: takeField('im-bairro'),
      quartos: takeField('im-quartos'),
      banheiros: takeField('im-banheiros'),
      vagas: takeField('im-vagas'),
      area: takeField('im-area'),
      desc: takeField('im-desc'),
    };

    const endereco = makeField('Endereço', 'im-endereco', 'text', 'Rua, número e complemento');
    const suites = makeField('Suítes', 'im-suites', 'number', '1');
    const areaConstruida = makeField('Área construída', 'im-area-construida', 'number', '80');
    const comissao = makeField('Comissão', 'im-comissao', 'text', 'Ex: 6%');
    const situacao = makeSelect('Situação', 'im-situacao', ['Disponível', 'Em negociação', 'Ocupado', 'Desocupado', 'Exclusivo']);

    const photoInput = document.getElementById('inp-fotos');
    if(photoInput?.parentElement) photoInput.parentElement.removeChild(photoInput);
    const preview = document.getElementById('fotos-preview');
    if(preview?.parentElement) preview.parentElement.removeChild(preview);
    const termCard = Array.from(page.querySelectorAll('.card')).find(card => card.textContent.includes('TERMO DE AUTORIZ'));
    if(termCard?.parentElement) termCard.parentElement.removeChild(termCard);
    const submitRow = Array.from(page.querySelectorAll('button')).find(button => button.textContent.includes('Enviar para'));
    if(submitRow?.parentElement) submitRow.parentElement.removeChild(submitRow);
    page.querySelectorAll('.card').forEach(card => {
      if(card.parentElement) card.parentElement.removeChild(card);
    });

    shell.innerHTML = `
      <div class="broker-panel">
        <div class="broker-top">
          <div>
            <div class="owner-step-label" id="panel-broker-label">Boas-vindas</div>
            <h3 id="panel-broker-title" style="font-size:24px;color:var(--ink);letter-spacing:-.7px">Vamos cadastrar um novo imóvel.</h3>
            <p id="panel-broker-subtitle" style="font-size:13px;color:var(--ink3);margin-top:4px">O processo leva menos de 3 minutos.</p>
          </div>
          <div class="broker-stepper" id="panel-broker-progress" aria-hidden="true" style="grid-template-columns:repeat(8,1fr)"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>
          <div class="broker-step-labels" aria-hidden="true" style="grid-template-columns:repeat(8,1fr)"><small>Início</small><small>Dados</small><small>Carac.</small><small>Comercial</small><small>Chaves</small><small>Fotos</small><small>Revisão</small><small>Envio</small></div>
        </div>
        <div class="broker-body">
          <section class="broker-stage on" data-broker-step="1"><div class="broker-welcome"><h2>Vamos cadastrar um novo imóvel.</h2><p>O processo leva menos de 3 minutos.</p><div class="broker-checklist"><div>✓ Dados básicos</div><div>✓ Características</div><div>✓ Informações comerciais</div><div>✓ Fotos</div><div>✓ Revisão</div></div><button class="broker-primary" type="button" onclick="window.panelBrokerGo(2)">COMEÇAR</button></div></section>
          <section class="broker-stage" data-broker-step="2"><div class="broker-card"><h3><i class="ti ti-home-edit"></i> Dados do imóvel</h3><div class="broker-grid" id="panel-basic-grid"></div></div><div class="broker-card" id="panel-desc-card"><h3><i class="ti ti-notes"></i> Descrição</h3></div><div class="broker-actions"><button class="broker-secondary" type="button" onclick="window.panelBrokerGo(1)">Voltar</button><button class="broker-primary" type="button" onclick="window.panelBrokerGo(3)">CONTINUAR</button></div></section>
          <section class="broker-stage" data-broker-step="3"><div class="broker-grid" style="grid-template-columns:minmax(0,1fr) 280px"><div class="broker-card"><h3><i class="ti ti-ruler-measure"></i> Características</h3><div class="broker-feature-grid" id="panel-feature-grid"></div></div><aside class="broker-summary"><h3>Resumo</h3><div><span>Quartos</span><strong id="panel-sum-quartos">0</strong></div><div><span>Banheiros</span><strong id="panel-sum-banheiros">0</strong></div><div><span>Suítes</span><strong id="panel-sum-suites">0</strong></div><div><span>Vagas</span><strong id="panel-sum-vagas">0</strong></div><div><span>Área total</span><strong id="panel-sum-area">0 m²</strong></div></aside></div><div class="broker-actions"><button class="broker-secondary" type="button" onclick="window.panelBrokerGo(2)">Voltar</button><button class="broker-primary" type="button" onclick="window.panelBrokerGo(4)">CONTINUAR</button></div></section>
          <section class="broker-stage" data-broker-step="4"><div class="broker-card"><h3><i class="ti ti-cash"></i> Informações comerciais</h3><div class="broker-grid" id="panel-commercial-grid"></div></div><div class="broker-actions"><button class="broker-secondary" type="button" onclick="window.panelBrokerGo(3)">Voltar</button><button class="broker-primary" type="button" onclick="window.panelBrokerGo(5)">CONTINUAR</button></div></section>
          <section class="broker-stage" data-broker-step="5"><div class="broker-card" id="panel-key-card"><h3><i class="ti ti-key"></i> Onde estão as chaves</h3><div class="broker-choice-group"><label class="broker-choice"><input type="radio" name="im-chave-opcao" value="Proprietário" onchange="window.handlePanelKey()"> Proprietário</label><label class="broker-choice"><input type="radio" name="im-chave-opcao" value="Portaria" onchange="window.handlePanelKey()"> Portaria</label><label class="broker-choice"><input type="radio" name="im-chave-opcao" value="Imobiliária" onchange="window.handlePanelKey()"> Imobiliária</label><label class="broker-choice"><input type="radio" name="im-chave-opcao" value="Corretor" onchange="window.handlePanelKey()"> Corretor</label><label class="broker-choice"><input type="radio" name="im-chave-opcao" value="Outro" onchange="window.handlePanelKey()"> Outro</label></div><div class="broker-field" id="im-chave-outro-wrap" style="display:none;margin-top:12px"><label>Informe onde estão as chaves</label><input type="text" id="im-chave-outro" placeholder="Ex: Cofre na recepção" oninput="window.handlePanelKey()"></div></div><div class="broker-card" id="panel-auth-card"></div><div class="broker-actions"><button class="broker-secondary" type="button" onclick="window.panelBrokerGo(4)">Voltar</button><button class="broker-primary" type="button" onclick="window.panelBrokerGo(6)">CONTINUAR</button></div></section>
          <section class="broker-stage" data-broker-step="6"><div class="broker-upload" id="panel-photo-drop" onclick="document.getElementById('inp-fotos').click()"><div><i class="ti ti-photo-plus"></i><h3>Adicione as fotos do imóvel.</h3><p>Arraste as imagens aqui ou clique para selecionar.</p><small>Quanto mais fotos, maiores as chances de venda. Máximo de 30 fotos.</small></div></div><div id="panel-photo-slot"></div><div class="broker-actions"><button class="broker-secondary" type="button" onclick="window.panelBrokerGo(5)">Voltar</button><button class="broker-primary" type="button" onclick="window.panelBrokerGo(7)">REVISAR</button></div></section>
          <section class="broker-stage" data-broker-step="7"><div id="panel-review-card"></div><div class="broker-actions"><button class="broker-secondary" type="button" onclick="window.panelBrokerGo(2)">EDITAR</button><button class="broker-primary" type="button" onclick="window.panelEnviarImovel()">ENVIAR PARA APROVAÇÃO</button></div></section>
          <section class="broker-stage" data-broker-step="8"><div class="broker-success"><div class="broker-success-icon">✓</div><h2>Imóvel enviado com sucesso.</h2><p>O imóvel será analisado pela administração.</p><div class="broker-status">Pronto para aprovação.</div><div class="broker-actions" style="justify-content:center"><button class="broker-primary" type="button" onclick="window.goPage ? window.goPage('dashboard') : window.panelBrokerGo(1)">VOLTAR AO PAINEL</button></div></div></section>
        </div>
      </div>`;

    addItems(document.getElementById('panel-basic-grid'), [fields.titulo, fields.tipo, fields.finalidade, fields.cidade, fields.bairro, endereco]);
    addItems(document.getElementById('panel-desc-card'), [fields.desc]);
    [fields.quartos, fields.banheiros, suites, fields.vagas, areaConstruida, fields.area].forEach((field, index) => {
      if(!field) return;
      const icons = ['ti-bed', 'ti-bath', 'ti-door', 'ti-car', 'ti-ruler', 'ti-crop'];
      const box = document.createElement('div');
      box.className = 'broker-feature';
      box.innerHTML = `<i class="ti ${icons[index]}"></i>`;
      box.appendChild(field);
      document.getElementById('panel-feature-grid')?.appendChild(box);
      field.querySelector('input,select,textarea')?.addEventListener('input', updatePanelSummary);
    });
    addItems(document.getElementById('panel-commercial-grid'), [fields.preco, fields.iptu, fields.condominio, comissao, situacao]);
    if(fields.chave){
      const input = fields.chave.querySelector('#im-chave');
      if(input){
        input.type = 'hidden';
        document.getElementById('panel-key-card')?.appendChild(input);
      }
    }
    if(termCard) document.getElementById('panel-auth-card')?.appendChild(termCard);
    if(photoInput){
      photoInput.style.display = 'none';
      photoInput.onchange = () => addPanelPhotos(photoInput.files);
      document.getElementById('panel-photo-slot')?.appendChild(photoInput);
    }
    if(preview){
      preview.className = 'broker-photo-grid';
      preview.removeAttribute('style');
      document.getElementById('panel-photo-slot')?.appendChild(preview);
    }
    setupPanelDrop();
    updatePanelSummary();
    panelGo(1);
  }

  async function panelSubmit(){
    syncInput();
    handlePanelKey();
    const autorizacaoVenda = document.querySelector('input[name="im-autorizacao-venda"]:checked')?.value || '';
    if(!autorizacaoVenda){ alert('Selecione uma opção no termo de autorização antes de enviar.'); return; }
    if(!document.getElementById('im-lgpd')?.checked){ alert('Confirme o aceite de tratamento de dados pessoais antes de enviar.'); return; }
    if(autorizacaoVenda === 'nao_autorizo'){ alert('Não é possível enviar o imóvel para aprovação sem autorização de venda.'); return; }
    if(!v('im-titulo') || !v('im-preco')){ alert('Preencha pelo menos o título e o preço.'); return; }
    const fotos = Array.from(document.getElementById('inp-fotos')?.files || []);
    if(fotos.length > 30){ alert('Selecione no máximo 30 fotos.'); return; }

    const originalDesc = v('im-desc');
    const formData = new FormData();
    formData.append('titulo', v('im-titulo'));
    formData.append('tipo', v('im-tipo'));
    formData.append('finalidade', v('im-finalidade'));
    formData.append('preco', v('im-preco'));
    formData.append('cidade', v('im-cidade'));
    formData.append('bairro', v('im-bairro'));
    formData.append('iptu', v('im-iptu'));
    formData.append('condominio', v('im-condominio'));
    formData.append('chave', v('im-chave'));
    formData.append('quartos', Number.parseInt(v('im-quartos') || '0', 10));
    formData.append('banheiros', Number.parseInt(v('im-banheiros') || '0', 10));
    formData.append('vagas', Number.parseInt(v('im-vagas') || '0', 10));
    formData.append('area', Number.parseInt(v('im-area') || '0', 10));
    const extras = [
      `Endereco: ${v('im-endereco') || 'Nao informado'}`,
      `Suites: ${v('im-suites') || 'Nao informado'}`,
      `Area construida: ${v('im-area-construida') || 'Nao informado'} m2`,
      `Comissao: ${v('im-comissao') || 'Nao informada'}`,
      `Situacao: ${v('im-situacao') || 'Nao informada'}`,
      `IPTU: ${v('im-iptu') || 'Nao informado'}`,
      `Condominio: ${v('im-condominio') || 'Nao informado'}`,
      `Chave do imovel: ${v('im-chave') || 'Nao informado'}`,
      'Autorizacao de venda: Autorizo a venda do imóvel em referência',
      'Autorizacao comercial: nao exclusiva, validade de 180 dias',
      'Aceite LGPD: sim',
    ].join('\n');
    formData.append('descricao', `${originalDesc}\n\n${extras}`);
    fotos.forEach(file => formData.append('fotos', file));

    try{
      const token = localStorage.getItem('imoore_token');
      const response = await fetch(`${apiBase()}/imoveis`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json().catch(() => ({}));
      if(!response.ok) throw new Error(data.error || 'Erro ao enviar imovel para aprovacao');
      if(window.carregarMeusImoveis) await window.carregarMeusImoveis();
      if(window.mostrarToast) window.mostrarToast('Imóvel enviado para aprovação!');
      panelGo(8);
    }catch(error){
      alert(error.message || 'Erro ao enviar imovel para aprovacao');
    }
  }

  window.panelBrokerGo = panelGo;
  window.panelEnviarImovel = panelSubmit;
  window.handlePanelKey = handlePanelKey;
  window.panelSetCover = index => { state.cover = index; syncInput(); renderPanelPhotos(); };
  window.panelRemovePhoto = index => {
    state.photos.splice(index, 1);
    if(state.cover >= state.photos.length) state.cover = 0;
    syncInput();
    renderPanelPhotos();
  };
  window.panelReorderPhoto = (from, to) => {
    if(from === null || from === to || from < 0 || to < 0) return;
    const [file] = state.photos.splice(from, 1);
    state.photos.splice(to, 0, file);
    if(state.cover === from) state.cover = to;
    syncInput();
    renderPanelPhotos();
  };

  setTimeout(() => {
    if(!document.getElementById('page-novo-imovel')) return;
    buildPanelExperience();
    window.brokerGo = panelGo;
    window.resetBrokerWizard = () => panelGo(1);
    window.updateBrokerSummary = updatePanelSummary;
    window.handleBrokerKeyChoice = handlePanelKey;
    window.previewImovelFotos = input => addPanelPhotos(input.files);
    window.mostrarFotos = input => addPanelPhotos(input.files);
    window.enviarImovel = panelSubmit;
    if(typeof window.goPage === 'function' && !window.goPage.__brokerWizardWrapped){
      const originalGoPage = window.goPage;
      window.goPage = function(pageName){
        originalGoPage(pageName);
        if(pageName === 'novo-imovel'){
          buildPanelExperience();
          setupPanelDrop();
          panelGo(1);
        }
      };
      window.goPage.__brokerWizardWrapped = true;
    }
  }, 80);
})();
