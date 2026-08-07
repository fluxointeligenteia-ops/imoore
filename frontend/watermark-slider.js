/**
 * 🎨 MARCA D'ÁGUA COM SLIDER DE TRANSPARÊNCIA
 * Permite ajustar a opacidade da marca d'água antes de adicionar à foto
 */

let watermarkOpacity = 0.15; // Valor padrão (15%)
let watermarkColor = '#fff'; // Cor padrão (branco)
let currentWatermarkImageUrl = ''; // URL da foto atual

/**
 * Cria e mostra o modal com slider de transparência
 */
function abrirWatermarkEditor(fotoUrl) {
  currentWatermarkImageUrl = fotoUrl;
  
  const modal = document.createElement('div');
  modal.className = 'modal-bg';
  modal.id = 'watermark-modal';
  modal.style.display = 'flex';
  modal.onclick = function(e) {
    if(e.target === this) fecharWatermarkModal();
  };
  
  modal.innerHTML = `
    <div class="modal modal-wide">
      <div class="modal-hdr">
        <h3><i class="ti ti-droplet" style="color:var(--or);margin-right:8px"></i> Editor de Marca d'Água</h3>
        <button class="modal-close" onclick="fecharWatermarkModal()"><i class="ti ti-x"></i></button>
      </div>
      <div class="modal-body" style="max-height:70vh;overflow-y:auto">
        
        <!-- PREVIEW DA FOTO -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px">
          
          <!-- ORIGINAL -->
          <div>
            <p style="font-size:12px;font-weight:700;color:var(--ink4);text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px">Foto Original</p>
            <img id="preview-original" src="${fotoUrl}" style="width:100%;border-radius:12px;border:1px solid var(--bdr);box-shadow:var(--sh);max-height:300px;object-fit:cover"/>
          </div>
          
          <!-- COM MARCA D'ÁGUA -->
          <div>
            <p style="font-size:12px;font-weight:700;color:var(--ink4);text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px">Pré-visualização</p>
            <canvas id="preview-canvas" style="width:100%;border-radius:12px;border:1px solid var(--bdr);box-shadow:var(--sh);background:#f5f4f1;max-height:300px"></canvas>
          </div>
          
        </div>
        
        <!-- CONTROLES -->
        <div style="background:var(--bg3);border-radius:12px;padding:20px;margin-bottom:20px">
          
          <!-- SLIDER -->
          <div style="margin-bottom:20px">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
              <label style="font-size:12px;font-weight:700;color:var(--ink4);text-transform:uppercase;letter-spacing:.5px">Transparência da Marca</label>
              <div style="display:flex;align-items:center;gap:10px">
                <span id="opacity-percent" style="font-size:18px;font-weight:800;color:var(--or);min-width:50px">15%</span>
                <span style="color:var(--ink4);font-size:12px">de visibilidade</span>
              </div>
            </div>
            
            <input type="range" id="watermark-slider" min="5" max="100" value="15" step="1" 
              style="width:100%;height:8px;border-radius:50px;background:var(--bdr);outline:none;-webkit-appearance:none;appearance:none;cursor:pointer"
              onchange="atualizarPreviewMarca(this.value)"
              oninput="atualizarPreviewMarca(this.value)"/>
            
            <!-- Estilo do slider -->
            <style>
              input[type='range']::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                background: var(--or);
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(242, 101, 34, 0.3);
                border: 3px solid #fff;
              }
              
              input[type='range']::-moz-range-thumb {
                width: 24px;
                height: 24px;
                border-radius: 50%;
                background: var(--or);
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(242, 101, 34, 0.3);
                border: 3px solid #fff;
              }
            </style>
            
            <!-- Indicadores rápidos -->
            <div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap">
              <button class="btn btn-o btn-sm" onclick="setOpacidade(10)" style="flex:1;min-width:100px"><i class="ti ti-eye-off" style="font-size:14px;margin-right:4px"></i> Muito sutil</button>
              <button class="btn btn-o btn-sm" onclick="setOpacidade(25)" style="flex:1;min-width:100px"><i class="ti ti-eye" style="font-size:14px;margin-right:4px"></i> Leve</button>
              <button class="btn btn-o btn-sm" onclick="setOpacidade(40)" style="flex:1;min-width:100px"><i class="ti ti-focus" style="font-size:14px;margin-right:4px"></i> Média</button>
              <button class="btn btn-o btn-sm" onclick="setOpacidade(60)" style="flex:1;min-width:100px"><i class="ti ti-fill" style="font-size:14px;margin-right:4px"></i> Forte</button>
            </div>
          </div>
          
          <!-- TEXTO E COR DA MARCA -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="ff">
              <label>Texto da Marca</label>
              <input type="text" id="watermark-text" value="imoore" 
                onchange="atualizarPreviewMarca()" 
                oninput="atualizarPreviewMarca()"
                style="width:100%;background:var(--bg);border:1.5px solid var(--bdr);border-radius:var(--r);padding:9px 12px;font-size:13px;color:var(--ink);font-family:var(--f);outline:none;transition:all .2s"
                onfocus="this.style.borderColor='var(--or)';this.style.background='var(--bg2)'"
                onblur="this.style.borderColor='var(--bdr)';this.style.background='var(--bg)'"/>
            </div>
            <div class="ff">
              <label>Cor</label>
              <div style="display:flex;gap:8px">
                <button class="btn" style="flex:1;background:#fff;color:var(--ink);border:3px solid var(--bdr);font-size:16px" onclick="setCorMarca('#fff')" title="Branco"><i class="ti ti-circle-filled"></i></button>
                <button class="btn" style="flex:1;background:#000;color:#fff;border:3px solid var(--bdr);font-size:16px" onclick="setCorMarca('#000')" title="Preto"><i class="ti ti-circle-filled"></i></button>
                <button class="btn" style="flex:1;background:var(--or);color:#fff;border:3px solid var(--bdr);font-size:16px" onclick="setCorMarca('#F26522')" title="Laranja imoore"><i class="ti ti-circle-filled"></i></button>
              </div>
            </div>
          </div>
          
        </div>
        
        <!-- BOTÕES DE AÇÃO -->
        <div style="display:flex;gap:10px;justify-content:flex-end">
          <button class="btn btn-o" onclick="fecharWatermarkModal()">Cancelar</button>
          <button class="btn btn-p" onclick="salvarFotoComMarca()"><i class="ti ti-download" style="margin-right:6px"></i> Baixar com Marca</button>
        </div>
        
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Renderiza preview inicial
  setTimeout(() => atualizarPreviewMarca(), 300);
}

/**
 * Atualiza a visualização da marca d'água em tempo real
 */
function atualizarPreviewMarca(valor = null) {
  if (valor) {
    watermarkOpacity = valor / 100;
  }
  
  const percentualElement = document.getElementById('opacity-percent');
  const sliderElement = document.getElementById('watermark-slider');
  const textElement = document.getElementById('watermark-text');
  
  if (percentualElement && sliderElement) {
    percentualElement.textContent = `${sliderElement.value}%`;
  }
  
  renderizarPreviewCanvas(textElement?.value || 'imoore');
}

/**
 * Define rapidamente um valor de opacidade
 */
function setOpacidade(valor) {
  const slider = document.getElementById('watermark-slider');
  if (slider) {
    slider.value = valor;
    atualizarPreviewMarca(valor);
  }
}

/**
 * Altera a cor da marca d'água
 */
function setCorMarca(cor) {
  watermarkColor = cor;
  atualizarPreviewMarca();
}

/**
 * Renderiza o preview da marca na tela
 */
function renderizarPreviewCanvas(texto = 'imoore') {
  const canvas = document.getElementById('preview-canvas');
  const imageElement = document.getElementById('preview-original');
  
  if (!canvas || !imageElement) return;
  
  const ctx = canvas.getContext('2d');
  const img = new Image();
  img.crossOrigin = 'anonymous';
  
  img.onload = function() {
    // Ajusta canvas ao tamanho da imagem mantendo proporção
    const maxWidth = canvas.parentElement.offsetWidth - 20;
    let scale = 1;
    if (img.width > maxWidth) {
      scale = maxWidth / img.width;
    }
    
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    
    // Desenha a imagem original
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    // Configuração da marca d'água
    const tamanhoFonte = Math.max(24, canvas.width / 8);
    ctx.font = `bold ${tamanhoFonte}px Arial, sans-serif`;
    
    // Define cor com opacidade
    if (watermarkColor === '#fff') {
      ctx.fillStyle = `rgba(255, 255, 255, ${watermarkOpacity})`;
    } else if (watermarkColor === '#000') {
      ctx.fillStyle = `rgba(0, 0, 0, ${watermarkOpacity})`;
    } else {
      ctx.fillStyle = `rgba(242, 101, 34, ${watermarkOpacity})`; // Laranja
    }
    
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = `rgba(0, 0, 0, ${watermarkOpacity * 0.3})`;
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Posição diagonal
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(-Math.PI / 4); // 45 graus
    ctx.fillText(texto, 0, 0);
    ctx.restore();
  };
  
  img.onerror = () => {
    console.error('Erro ao carregar imagem para preview');
    ctx.fillStyle = '#ccc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };
  
  img.src = imageElement.src;
}

/**
 * Salva e faz download da foto com a marca
 */
function salvarFotoComMarca() {
  const canvas = document.getElementById('preview-canvas');
  const textElement = document.getElementById('watermark-text');
  const sliderElement = document.getElementById('watermark-slider');
  
  if (!canvas) return;
  
  try {
    // Cria canvas final em qualidade alta
    const canvasFinal = document.createElement('canvas');
    const imgOriginal = document.getElementById('preview-original');
    
    canvasFinal.width = imgOriginal.naturalWidth;
    canvasFinal.height = imgOriginal.naturalHeight;
    
    const ctxFinal = canvasFinal.getContext('2d');
    ctxFinal.drawImage(imgOriginal, 0, 0);
    
    // Desenha marca em alta qualidade
    const tamanhoFonte = Math.max(40, canvasFinal.width / 8);
    ctxFinal.font = `bold ${tamanhoFonte}px Arial, sans-serif`;
    
    if (watermarkColor === '#fff') {
      ctxFinal.fillStyle = `rgba(255, 255, 255, ${watermarkOpacity})`;
    } else if (watermarkColor === '#000') {
      ctxFinal.fillStyle = `rgba(0, 0, 0, ${watermarkOpacity})`;
    } else {
      ctxFinal.fillStyle = `rgba(242, 101, 34, ${watermarkOpacity})`;
    }
    
    ctxFinal.textAlign = 'center';
    ctxFinal.textBaseline = 'middle';
    ctxFinal.shadowColor = `rgba(0, 0, 0, ${watermarkOpacity * 0.3})`;
    ctxFinal.shadowBlur = 8;
    
    ctxFinal.save();
    ctxFinal.translate(canvasFinal.width / 2, canvasFinal.height / 2);
    ctxFinal.rotate(-Math.PI / 4);
    ctxFinal.fillText(textElement.value || 'imoore', 0, 0);
    ctxFinal.restore();
    
    // Download
    const link = document.createElement('a');
    link.href = canvasFinal.toDataURL('image/jpeg', 0.95);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    link.download = `imoore_marca-dagua_${timestamp}.jpg`;
    link.click();
    
    // Feedback
    fecharWatermarkModal();
    alert('✅ Foto com marca d\'água baixada com sucesso!');
    
  } catch (error) {
    console.error('Erro ao salvar foto:', error);
    alert('❌ Erro ao processar a foto. Tente novamente.');
  }
}

/**
 * Fecha o modal de edição
 */
function fecharWatermarkModal() {
  const modal = document.getElementById('watermark-modal');
  if (modal) {
    modal.remove();
  }
}

/**
 * Função auxiliar para abrir editor
 */
function btnAdicionarMarcaComSlider(fotoUrl) {
  abrirWatermarkEditor(fotoUrl);
}
