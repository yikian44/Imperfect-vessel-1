/**
 * Draw Your Face - Interactive Cubist Grid & Drawing Engine
 */

// 1. Cubist / Origami SVG Face Templates (Featureless colorful bases inspired by reference photo)
const FACE_TEMPLATES = [
  // Template 0: Green & Terracotta Folded Cubist Base
  `<svg viewBox="0 0 200 300" class="base-svg" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(10, 10)">
      <!-- Hat / Top section -->
      <polygon points="50,15 90,0 120,40 40,55" fill="#588157" />
      <polygon points="120,40 170,30 150,80 90,65" fill="#3a5a40" />
      <!-- Forehead & Upper Face -->
      <polygon points="40,55 90,65 75,130 25,100" fill="#e0a96d" />
      <polygon points="90,65 150,80 140,145 75,130" fill="#ddb892" />
      <!-- Cheeks & Nose Ridge Fold -->
      <polygon points="25,100 75,130 60,210 15,170" fill="#b08968" />
      <polygon points="75,130 140,145 125,225 60,210" fill="#cd9777" />
      <!-- Chin / Neck origami tip -->
      <polygon points="60,210 125,225 90,270" fill="#7f5539" />
      <!-- Fold highlight lines -->
      <polyline points="50,15 120,40 90,65 75,130 60,210 90,270" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="2" />
      <polyline points="40,55 75,130 15,170" fill="none" stroke="rgba(0,0,0,0.15)" stroke-width="1.5" />
    </g>
  </svg>`,

  // Template 1: Blue & Yellow Angular Cubist Head
  `<svg viewBox="0 0 200 300" class="base-svg" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(10, 10)">
      <!-- Top Crown -->
      <polygon points="30,20 100,5 160,35 90,60" fill="#1d3557" />
      <!-- Left Blue Patch -->
      <polygon points="30,20 90,60 70,150 15,110" fill="#457b9d" />
      <!-- Center Yellow Patch -->
      <polygon points="90,60 160,35 150,120 70,150" fill="#e9c46a" />
      <!-- Lower Jaw & Red Accent -->
      <polygon points="15,110 70,150 60,240 25,190" fill="#f4a261" />
      <polygon points="70,150 150,120 125,220 60,240" fill="#e76f51" />
      <!-- Sharp Chin -->
      <polygon points="60,240 125,220 85,275" fill="#264653" />
      <!-- Shadow & Lines -->
      <polyline points="100,5 90,60 70,150 60,240" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="2" />
    </g>
  </svg>`,

  // Template 2: Lavender & Slate Violet Crystal Face
  `<svg viewBox="0 0 200 300" class="base-svg" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(10, 10)">
      <!-- Origami Diamond Top -->
      <polygon points="80,10 145,40 110,90 35,60" fill="#9d4edd" />
      <polygon points="35,60 110,90 85,170 20,135" fill="#c77dff" />
      <polygon points="110,90 175,70 150,160 85,170" fill="#7b2cbf" />
      <!-- Lower Facets -->
      <polygon points="20,135 85,170 65,245 25,200" fill="#e0aaff" />
      <polygon points="85,170 150,160 120,240 65,245" fill="#5a189a" />
      <polygon points="65,245 120,240 85,275" fill="#3c096c" />
      <polyline points="80,10 110,90 85,170 65,245" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="2" />
    </g>
  </svg>`,

  // Template 3: Emerald & Khaki Folded Paper Base
  `<svg viewBox="0 0 200 300" class="base-svg" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(10, 10)">
      <!-- Hat/Headband -->
      <polygon points="20,40 90,15 170,45 100,65" fill="#2a9d8f" />
      <!-- Forehead -->
      <polygon points="20,40 100,65 80,140 15,105" fill="#e76f51" />
      <polygon points="100,65 170,45 155,135 80,140" fill="#f4a261" />
      <!-- Mid face fold -->
      <polygon points="15,105 80,140 65,220 20,175" fill="#264653" />
      <polygon points="80,140 155,135 130,225 65,220" fill="#e9c46a" />
      <!-- Chin -->
      <polygon points="65,220 130,225 90,265" fill="#219ebc" />
      <polyline points="90,15 100,65 80,140 65,220" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="2" />
    </g>
  </svg>`,

  // Template 4: White, Gold & Charcoal Monochromatic Origami
  `<svg viewBox="0 0 200 300" class="base-svg" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(10, 10)">
      <polygon points="40,25 110,10 160,50 95,70" fill="#f8f9fa" />
      <polygon points="40,25 95,70 75,155 20,115" fill="#e9ecef" />
      <polygon points="95,70 160,50 145,145 75,155" fill="#dee2e6" />
      <polygon points="20,115 75,155 55,235 15,185" fill="#ced4da" />
      <polygon points="75,155 145,145 120,230 55,235" fill="#adb5bd" />
      <!-- Gold foil stripe -->
      <polygon points="95,70 120,62 105,115 85,110" fill="#d4af37" />
      <polygon points="55,235 120,230 85,270" fill="#495057" />
      <polyline points="110,10 95,70 75,155 55,235" fill="none" stroke="rgba(0,0,0,0.15)" stroke-width="2" />
    </g>
  </svg>`,

  // Template 5: Terracotta & Olive Double Face Base
  `<svg viewBox="0 0 200 300" class="base-svg" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(10, 10)">
      <polygon points="25,30 85,15 150,40 90,75" fill="#6b705c" />
      <polygon points="25,30 90,75 70,160 15,120" fill="#cb997e" />
      <polygon points="90,75 150,40 135,150 70,160" fill="#ddbea9" />
      <polygon points="15,120 70,160 55,240 10,185" fill="#ffe8d6" />
      <polygon points="70,160 135,150 115,235 55,240" fill="#b7b7a4" />
      <polygon points="55,240 115,235 75,275" fill="#a5a58d" />
      <polyline points="85,15 90,75 70,160 55,240" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="2" />
    </g>
  </svg>`,

  // Template 6: Vibrant Primary Color Origami Head
  `<svg viewBox="0 0 200 300" class="base-svg" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(10, 10)">
      <polygon points="35,15 105,5 165,35 95,60" fill="#003049" />
      <polygon points="35,15 95,60 75,145 15,100" fill="#d62828" />
      <polygon points="95,60 165,35 150,135 75,145" fill="#f77f00" />
      <polygon points="15,100 75,145 60,230 20,180" fill="#fcbf49" />
      <polygon points="75,145 150,135 125,225 60,230" fill="#eae2b7" />
      <polygon points="60,230 125,225 85,270" fill="#003049" />
      <polyline points="105,5 95,60 75,145 60,230" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="2" />
    </g>
  </svg>`
];

// App State
let cardsData = [];
let activeCardIndex = null;
let drawStartTime = null;
let isDrawing = false;
let currentTool = 'pen'; // 'pen', 'marker', 'eraser'
let currentColor = '#1a1a1a';
let currentLineWidth = 4;
let undoStack = [];
let redoStack = [];

// DOM Elements
const faceGrid = document.getElementById('faceGrid');
const drawingModal = document.getElementById('drawingModal');
const finishModal = document.getElementById('finishModal');
const drawingCanvas = document.getElementById('drawingCanvas');
const modalFaceBaseContainer = document.getElementById('modalFaceBaseContainer');
const ctx = drawingCanvas.getContext('2d');
const authorNameInput = document.getElementById('authorNameInput');
const timeBadgeVal = document.getElementById('timeBadgeVal');

// Initialize Gallery Grid
function initGrid() {
  // Load saved state or populate 21 grid items matching reference layout
  const saved = localStorage.getItem('draw_your_face_cards');
  if (saved) {
    cardsData = JSON.parse(saved);
  } else {
    cardsData = [];
    // Generate 21 face cards
    for (let i = 0; i < 21; i++) {
      cardsData.push({
        id: i,
        templateIndex: i % FACE_TEMPLATES.length,
        drawnOverlay: null, // Canvas dataURL when saved
        authorName: '',
        durationSeconds: 0,
        completed: false
      });
    }
    saveToLocalStorage();
  }

  renderGrid();
}

function saveToLocalStorage() {
  localStorage.setItem('draw_your_face_cards', JSON.stringify(cardsData));
}

function renderGrid() {
  faceGrid.innerHTML = '';
  cardsData.forEach((card, index) => {
    const cardEl = document.createElement('div');
    cardEl.className = 'face-card-wrapper';
    
    const isCompleted = card.completed;
    const durationText = formatTime(card.durationSeconds);
    
    cardEl.innerHTML = `
      <div class="face-card ${isCompleted ? '' : ''}" data-index="${index}">
        <!-- FRONT: Face base + user drawing -->
        <div class="face-card-front">
          <div class="face-svg-container">
            ${FACE_TEMPLATES[card.templateIndex]}
            ${card.drawnOverlay ? `<img src="${card.drawnOverlay}" class="drawn-overlay" alt="Features">` : ''}
          </div>
          ${isCompleted ? `
            <div class="status-badge">
              <span>✓</span>
              <span>已完成</span>
            </div>
          ` : ''}
        </div>

        <!-- BACK: Secret Meta info (Name & Time) revealed on flip -->
        <div class="face-card-back">
          <div class="card-back-header">🎨 创作者卡片</div>
          <div class="card-back-info">
            <div class="info-item">
              <div class="info-label">Author / 创作者</div>
              <div class="info-val-name">${escapeHtml(card.authorName || '匿名艺术家')}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Drawing Time / 耗时</div>
              <div class="info-val-time">⏱ ${durationText}</div>
            </div>
          </div>
          <div class="card-back-actions">
            <button class="btn-icon btn-edit" title="重画 / 修改" data-action="edit" data-index="${index}">✏️</button>
            <button class="btn-icon btn-flip-back" title="翻转回正面" data-action="flip" data-index="${index}">🔄</button>
          </div>
        </div>
      </div>
    `;

    // Click behavior:
    // If not drawn, click opens drawing modal.
    // If already drawn, click toggles card flip to reveal secret Name & Time!
    const faceCardNode = cardEl.querySelector('.face-card');
    faceCardNode.addEventListener('click', (e) => {
      // Prevent trigger if action button inside back card was clicked
      if (e.target.closest('.btn-icon')) return;

      if (!card.completed) {
        openDrawingModal(index);
      } else {
        faceCardNode.classList.toggle('flipped');
      }
    });

    // Action button handlers
    const editBtn = cardEl.querySelector('.btn-edit');
    if (editBtn) {
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openDrawingModal(index);
      });
    }

    const flipBtn = cardEl.querySelector('.btn-flip-back');
    if (flipBtn) {
      flipBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        faceCardNode.classList.remove('flipped');
      });
    }

    faceGrid.appendChild(cardEl);
  });
}

// Format seconds into "1分25秒" or "45秒"
function formatTime(totalSec) {
  if (!totalSec || totalSec <= 0) return '0秒';
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  if (mins > 0) {
    return `${mins}分${secs}秒`;
  }
  return `${secs}秒`;
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, function(m) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
  });
}

// -------------------------------------------------------------
// Interactive Drawing Modal Engine
// -------------------------------------------------------------
function openDrawingModal(index) {
  activeCardIndex = index;
  const card = cardsData[index];

  // Set background SVG template
  modalFaceBaseContainer.innerHTML = FACE_TEMPLATES[card.templateIndex];

  // Resize Canvas to fit container
  resizeCanvas();

  // Clear or load existing drawing
  ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
  if (card.drawnOverlay) {
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, drawingCanvas.width, drawingCanvas.height);
      saveState();
    };
    img.src = card.drawnOverlay;
  } else {
    undoStack = [];
    redoStack = [];
    saveState();
  }

  // SILENT TIMER: Start recording elapsed time secretly
  drawStartTime = Date.now();

  // Show modal
  drawingModal.classList.add('active');
}

function closeDrawingModal() {
  drawingModal.classList.remove('active');
}

function resizeCanvas() {
  const rect = drawingCanvas.getBoundingClientRect();
  drawingCanvas.width = rect.width * 2; // HiDPI resolution
  drawingCanvas.height = rect.height * 2;
  ctx.scale(2, 2);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
}

// Canvas Touch & Mouse Event Handlers
let lastX = 0;
let lastY = 0;

function getCanvasCoords(e) {
  const rect = drawingCanvas.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  };
}

function startStroke(e) {
  isDrawing = true;
  const coords = getCanvasCoords(e);
  lastX = coords.x;
  lastY = coords.y;

  ctx.beginPath();
  ctx.moveTo(lastX, lastY);

  if (currentTool === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = currentLineWidth * 3;
  } else if (currentTool === 'marker') {
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = currentColor + 'aa'; // Semi-transparent
    ctx.lineWidth = currentLineWidth * 2;
  } else {
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = currentLineWidth;
  }
}

function drawStroke(e) {
  if (!isDrawing) return;
  e.preventDefault();
  const coords = getCanvasCoords(e);

  // Smooth quadratic curve stroke
  const midX = (lastX + coords.x) / 2;
  const midY = (lastY + coords.y) / 2;

  ctx.quadraticCurveTo(lastX, lastY, midX, midY);
  ctx.stroke();

  lastX = coords.x;
  lastY = coords.y;
}

function stopStroke() {
  if (!isDrawing) return;
  isDrawing = false;
  ctx.closePath();
  saveState();
}

// Undo / Redo System
function saveState() {
  if (undoStack.length > 20) undoStack.shift();
  undoStack.push(drawingCanvas.toDataURL());
  redoStack = [];
}

function undo() {
  if (undoStack.length > 1) {
    redoStack.push(undoStack.pop());
    const prevState = undoStack[undoStack.length - 1];
    restoreState(prevState);
  }
}

function redo() {
  if (redoStack.length > 0) {
    const nextState = redoStack.pop();
    undoStack.push(nextState);
    restoreState(nextState);
  }
}

function restoreState(dataUrl) {
  const img = new Image();
  img.onload = () => {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0); // reset scale
    ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    ctx.restore();
    ctx.drawImage(img, 0, 0, drawingCanvas.width / 2, drawingCanvas.height / 2);
  };
  img.src = dataUrl;
}

function clearCanvas() {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
  ctx.restore();
  saveState();
}

// -------------------------------------------------------------
// Finish & Stealth Time Reveal Flow
// -------------------------------------------------------------
function handleFinishDrawing() {
  // Calculate elapsed time secretly recorded
  const now = Date.now();
  const elapsedSec = Math.max(1, Math.round((now - drawStartTime) / 1000));
  
  // Store temp duration
  window.pendingDurationSec = elapsedSec;

  // Display time badge in finish modal
  timeBadgeVal.textContent = formatTime(elapsedSec);
  authorNameInput.value = cardsData[activeCardIndex].authorName || '';

  // Show Finish Modal
  finishModal.classList.add('active');
}

function saveCompletedCard() {
  const name = authorNameInput.value.trim() || '匿名艺术家';
  const durationSec = window.pendingDurationSec || 0;
  const drawnDataUrl = drawingCanvas.toDataURL('image/png');

  // Update card data
  cardsData[activeCardIndex].drawnOverlay = drawnDataUrl;
  cardsData[activeCardIndex].authorName = name;
  cardsData[activeCardIndex].durationSeconds = (cardsData[activeCardIndex].durationSeconds || 0) + durationSec;
  cardsData[activeCardIndex].completed = true;

  saveToLocalStorage();

  // Close modals & update UI grid
  finishModal.classList.remove('active');
  closeDrawingModal();
  renderGrid();
}

// Attach Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  initGrid();

  // Canvas Drawing Events
  drawingCanvas.addEventListener('mousedown', startStroke);
  drawingCanvas.addEventListener('mousemove', drawStroke);
  document.addEventListener('mouseup', stopStroke);

  drawingCanvas.addEventListener('touchstart', startStroke, { passive: false });
  drawingCanvas.addEventListener('touchmove', drawStroke, { passive: false });
  document.addEventListener('touchend', stopStroke);

  // Tool buttons
  document.querySelectorAll('[data-tool]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('[data-tool]').forEach(b => b.classList.remove('active'));
      const tool = btn.getAttribute('data-tool');
      currentTool = tool;
      btn.classList.add('active');
    });
  });

  // Color Swatches
  document.querySelectorAll('.color-swatch').forEach(swatch => {
    swatch.addEventListener('click', () => {
      document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
      currentColor = swatch.getAttribute('data-color');
      if (currentTool === 'eraser') {
        currentTool = 'pen';
        document.querySelector('[data-tool="pen"]').classList.add('active');
      }
    });
  });

  // Line Width
  const brushSizeInput = document.getElementById('brushSizeInput');
  if (brushSizeInput) {
    brushSizeInput.addEventListener('input', (e) => {
      currentLineWidth = parseInt(e.target.value, 10);
    });
  }

  // Toolbar Actions
  document.getElementById('undoBtn')?.addEventListener('click', undo);
  document.getElementById('redoBtn')?.addEventListener('click', redo);
  document.getElementById('clearBtn')?.addEventListener('click', clearCanvas);
  document.getElementById('cancelDrawBtn')?.addEventListener('click', closeDrawingModal);
  document.getElementById('finishDrawBtn')?.addEventListener('click', handleFinishDrawing);

  // Finish Modal Actions
  document.getElementById('saveCardBtn')?.addEventListener('click', saveCompletedCard);
  document.getElementById('backToCanvasBtn')?.addEventListener('click', () => {
    finishModal.classList.remove('active');
  });

  // Add Card & Reset Grid actions
  document.getElementById('addCardBtn')?.addEventListener('click', () => {
    const newId = cardsData.length;
    cardsData.push({
      id: newId,
      templateIndex: newId % FACE_TEMPLATES.length,
      drawnOverlay: null,
      authorName: '',
      durationSeconds: 0,
      completed: false
    });
    saveToLocalStorage();
    renderGrid();
  });

  document.getElementById('resetGridBtn')?.addEventListener('click', () => {
    if (confirm('确定要重置所有脸部卡片和画作吗？')) {
      localStorage.removeItem('draw_your_face_cards');
      initGrid();
    }
  });
});
