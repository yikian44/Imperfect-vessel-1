    let editCount = 0;
    let isSettling = false;
    let isFreeArrange = false;
    let isCustomArranged = false;
    let moveHistory = [];
    let redoHistory = [];
    let selectedFragment = null;
    let returningFragment = null;
    let time = 0;
    let isPrologue = true;
    let topZIndex = 100;

    // Prologue Sequence
    window.addEventListener('load', () => {
      // Pre-bake complex SVG filters into static image patterns to prevent lag on mobile while keeping the organic look
      const bake = (svgString, imgId) => {
        const encoded = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgString);
        const imgElem = document.getElementById(imgId);
        if (imgElem) imgElem.setAttribute("href", encoded);
      };

      bake(
        `<svg xmlns='http://www.w3.org/2000/svg' width='256' height='256'><filter id='f'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' result='noise'/><feColorMatrix type='matrix' values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.45 0' in='noise'/></filter><rect width='100%' height='100%' filter='url(#f)'/></svg>`,
        'img-matte'
      );

      bake(
        `<svg xmlns='http://www.w3.org/2000/svg' width='256' height='256'><filter id='f'><feTurbulence type='fractalNoise' baseFrequency='1.8' numOctaves='2' result='noise'/><feColorMatrix type='matrix' values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.7 0' in='noise'/></filter><rect width='100%' height='100%' filter='url(#f)'/></svg>`,
        'img-grainy'
      );

      bake(
        `<svg xmlns='http://www.w3.org/2000/svg' width='256' height='256'><filter id='f'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' result='n'/><feComponentTransfer in='n' result='s'><feFuncA type='discrete' tableValues='0 0 0 0 0 0 0.5 0.8 1 1'/></feComponentTransfer><feColorMatrix type='matrix' values='0 0 0 0 0.15  0 0 0 0 0.12  0 0 0 0 0.08  0 0 0 1.5 0' in='s'/></filter><rect width='100%' height='100%' filter='url(#f)'/></svg>`,
        'img-speckled'
      );

      const loader = document.getElementById('ll-loader');
      const video = document.getElementById('loader-video');
      const siteLogo = document.getElementById('site-logo');
      const prologue = document.getElementById('prologue');

      if (video) {
        // 9-second fallback timer so the user is never stuck if the video fails to load/play
        let fallbackTimer = setTimeout(triggerFallback, 9000);

        function triggerFallback() {
          clearTimeout(fallbackTimer);
          if (loader && loader.style.display !== 'none') {
            loader.classList.add('slide-up');
            isPrologue = false;
            if (prologue) prologue.style.display = 'none';
            if (siteLogo) siteLogo.classList.add('visible');
            setTimeout(() => { loader.style.display = 'none'; }, 1200);
          }
        }

        // Force play programmatically (handles some browsers' autoplay quirks)
        try {
          const playPromise = video.play();
          if (playPromise !== undefined && typeof playPromise.catch === 'function') {
            playPromise.catch(e => {
              console.log("Autoplay blocked, fallback to timer");
              triggerFallback();
            });
          }
        } catch(err) {
          console.log("Play failed, relying on fallback timer", err);
        }

        // Slide up when the video ends natively
        video.addEventListener('ended', () => {
          triggerFallback();
        });
        
        // Sync crystalline chime clink sound to play at exactly 5.0 seconds
        let chimePlayed = false;
        video.addEventListener('timeupdate', () => {
          if (video.currentTime >= 5.0 && !chimePlayed) {
            chimePlayed = true;
            try {
              if (typeof playClink === 'function') {
                playClink();
              }
            } catch(e) {}
          }
        });
      } else {
        // Instant fallback if video element isn't in DOM
        isPrologue = false;
        if (prologue) prologue.style.display = 'none';
        if (siteLogo) siteLogo.classList.add('visible');
        if (loader) loader.style.display = 'none';
      }
    });

    // Custom Cursor Logic
    const customCursor = document.getElementById('custom-cursor');
    let cursorX = window.innerWidth / 2;
    let cursorY = window.innerHeight / 2;
    let cursorTargetX = cursorX;
    let cursorTargetY = cursorY;
    let hardwareX = cursorX;
    let hardwareY = cursorY;

    const crackCanvas = document.getElementById('crack-canvas');
    let lastCrackX = null;
    let lastCrackY = null;
    const CRACK_THRESHOLD = 30; // pixels

    function generateCrackPath(x1, y1, x2, y2) {
      // Add jitter for fracture look
      const dx = x2 - x1;
      const dy = y2 - y1;
      const dist = Math.hypot(dx, dy);
      if (dist === 0) return "";
      
      const angle = Math.atan2(dy, dx);
      // Random midpoints
      const numMidpoints = Math.floor(Math.random() * 2) + 1; // 1 to 2 midpoints
      
      let d = `M ${x1} ${y1} `;
      for (let i = 1; i <= numMidpoints; i++) {
        const t = i / (numMidpoints + 1);
        const basePathX = x1 + dx * t;
        const basePathY = y1 + dy * t;
        
        // Perpendicular jitter
        const jitterAmt = (Math.random() - 0.5) * dist * 0.4;
        const jitterX = Math.cos(angle + Math.PI / 2) * jitterAmt;
        const jitterY = Math.sin(angle + Math.PI / 2) * jitterAmt;
        
        d += `L ${basePathX + jitterX} ${basePathY + jitterY} `;
      }
      d += `L ${x2} ${y2}`;
      return d;
    }

    window.addEventListener('pointermove', (e) => {
      if (returningFragment) {
        const dx = e.clientX - hardwareX;
        const dy = e.clientY - hardwareY;
        if (Math.hypot(dx, dy) > 3) {
          returningFragment = null;
        }
      }

      hardwareX = e.clientX;
      hardwareY = e.clientY;
      cursorTargetX = e.clientX;
      cursorTargetY = e.clientY;

      // Crack trail logic
      if (crackCanvas && isPrologue === false) { // Only draw trail after prologue
        if (lastCrackX === null) {
          lastCrackX = e.clientX;
          lastCrackY = e.clientY;
        } else {
          const dx = e.clientX - lastCrackX;
          const dy = e.clientY - lastCrackY;
          if (Math.hypot(dx, dy) > CRACK_THRESHOLD) {
            const pathData = generateCrackPath(lastCrackX, lastCrackY, e.clientX, e.clientY);
            const pathNode = document.createElementNS("http://www.w3.org/2000/svg", "path");
            pathNode.setAttribute("d", pathData);
            pathNode.setAttribute("class", "crack-line");
            crackCanvas.appendChild(pathNode);
            
            // Fade out and remove
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                pathNode.style.opacity = '0';
              });
            });
            setTimeout(() => {
              if (pathNode.parentNode === crackCanvas) {
                crackCanvas.removeChild(pathNode);
              }
            }, 3000);
            
            lastCrackX = e.clientX;
            lastCrackY = e.clientY;
          }
        }
      }

      // Immediate update during drag for tight responsiveness
      if (fragments && fragments.some(f => f.isDragging)) {
        cursorX = cursorTargetX;
        cursorY = cursorTargetY;
        // Transform update removed here to prevent layout thrashing.
        // updateCursor() in requestAnimationFrame handles it at 60fps.
      }
    });

    // DOM Elements
    const container = document.getElementById('canvas-container');
    const uiPanel = document.getElementById('ui-panel');
    uiPanel.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
    });
    const colorOptions = document.getElementById('color-options');
    const letGoBtn = document.getElementById('let-go-btn');
    const finalMessage = document.getElementById('final-message');

    // Prevent uiPanel clicks from deselecting the active fragment
    uiPanel.addEventListener('pointerdown', (e) => e.stopPropagation());

    // Palette Categorization
    const colorCategories = {
      "Wabi-Sabi": [
        '#8c7c61', '#5e604f', '#d1c7b7', '#4a4542', '#9e8c78'
      ],
      "Terracotta Sand": [
        '#b85d43', '#a36b54', '#d9a07b', '#b58e2a', '#703d2b'
      ],
      "Indigo & Moss": [
        '#2b3e50', '#1c3a27', '#5c6b55', '#d5cbb8', '#426375'
      ],
      "Picasso Pastel": [
        '#d9c8c0', '#b8c5b9', '#f2cc8f', '#c5bedb', '#3c3c3e'
      ],
      "Cubist Vibrant": [
        '#2a75d3', '#4ca93c', '#eac124', '#d13535', '#e462a3'
      ],
      "Monochrome": [
        '#ffffff', '#888888', '#222222'
      ]
    };

    colorOptions.className = 'options-row';
    colorOptions.style.gap = '24px';

    // Populate buttons by category
    Object.entries(colorCategories).forEach(([category, colors]) => {
      const group = document.createElement('div');
      group.className = 'color-group';
      
      const label = document.createElement('div');
      label.innerText = category;
      label.style.fontSize = '9px';
      label.style.color = 'var(--text-color)';
      label.style.opacity = '0.6';
      label.style.letterSpacing = '1px';
      label.style.textTransform = 'uppercase';
      label.style.whiteSpace = 'nowrap';
      
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.flexDirection = 'row';
      row.style.gap = '10px';
      row.style.flexWrap = 'wrap';
      
      colors.forEach(color => {
        const btn = document.createElement('button');
        btn.className = 'color-btn';
        btn.style.backgroundColor = color;
        btn.onclick = () => applyColor(color);
        row.appendChild(btn);
      });
      
      group.appendChild(label);
      group.appendChild(row);
      colorOptions.appendChild(group);
    });

    document.querySelectorAll('.texture-btn').forEach(btn => {
      btn.onclick = () => applyTexture(btn.dataset.texture);
    });

    // Swipe Hint Logic
    function setupSwipeHint(containerId, hintId) {
      const container = document.getElementById(containerId);
      const hint = document.getElementById(hintId);
      if (!container || !hint) return;

      const checkScroll = () => {
        if (container.scrollWidth <= container.clientWidth + 5) {
          hint.style.opacity = '0'; // Not scrollable
        } else if (container.scrollLeft + container.clientWidth >= container.scrollWidth - 5) {
          hint.style.opacity = '0'; // Scrolled to end
        } else {
          hint.style.opacity = '0.5'; // Scrollable
        }
      };

      container.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      
      // Delay initial check to ensure DOM is fully rendered
      setTimeout(checkScroll, 100);
      setTimeout(checkScroll, 1000); 
    }

    setupSwipeHint('color-options', 'color-swipe-hint');
    setupSwipeHint('texture-options', 'texture-swipe-hint');

    // Audio Context Setup
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    let audioCtx;
    let centerYOffset = 0;
    let droneOsc1, droneOsc2, droneGain;

    function initAudio() {
      if (!audioCtx) {
        audioCtx = new AudioContext();
      }
    }

    function initDrone() {
      if (droneOsc1) return;
      initAudio();

      const t = audioCtx.currentTime;

      droneOsc1 = audioCtx.createOscillator();
      droneOsc1.type = 'sine';
      droneOsc1.frequency.setValueAtTime(100, t);

      droneOsc2 = audioCtx.createOscillator();
      droneOsc2.type = 'triangle';
      droneOsc2.frequency.setValueAtTime(102, t);

      droneGain = audioCtx.createGain();
      droneGain.gain.setValueAtTime(0, t);
      droneGain.gain.linearRampToValueAtTime(0.01, t + 2);

      droneOsc1.connect(droneGain);
      droneOsc2.connect(droneGain);
      droneGain.connect(audioCtx.destination);

      droneOsc1.start();
      droneOsc2.start();
    }

    document.body.addEventListener('pointerdown', () => {
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      initDrone();
    }, { once: true });

    function playClink() {
      initAudio();
      if (!audioCtx) return;
      const t = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      osc.type = 'sine';
      const baseFreq = 600 + Math.random() * 200;
      osc.frequency.setValueAtTime(baseFreq, t);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.8, t + 0.1);

      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.3, t + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.2);
    }

    // Generative Artwork Generation (Procedural Picasso/Cubist Face Mesh)
    function generatePieces() {
      // 1. Define Base Vertices for a Cubist Anatomy (Profile + Front Face combined)
      const v = {
        TL: {x: -80, y: -120},  TM: {x: 0, y: -130},    TR: {x: 80, y: -120},
        FL: {x: -90, y: -50},   FM: {x: 0, y: -40},     FR: {x: 90, y: -50},
        EL: {x: -80, y: 10},    EM: {x: 0, y: 0},       ER: {x: 80, y: 10},
        NL: {x: -30, y: 40},    NR: {x: 30, y: 50},     
        ML: {x: -60, y: 80},    MM: {x: 0, y: 85},      MR: {x: 60, y: 80},
        BL: {x: -50, y: 130},   BM: {x: 0, y: 140},     BR: {x: 50, y: 130},
        // Outer Ear/Hair Points
        EarL: {x: -130, y: -20}, EarR: {x: 130, y: -20}
      };

      // 2. Generate randomized Picasso face archetypes
      const styleType = Math.floor(Math.random() * 7);
      let scaleX = 1.0;
      let scaleY = 1.0;
      
      if (styleType === 1) { 
        // Type 1: Wide & Blocky
        scaleX = 1.6; scaleY = 0.8;
      } else if (styleType === 2) { 
        // Type 2: Elongated & Narrow
        scaleX = 0.7; scaleY = 1.15;
      } else if (styleType === 4) {
        // Type 4: Heart / Wide top, narrow chin
        v.TL.x -= 30; v.TR.x += 30;
        v.BL.x += 20; v.BR.x -= 20;
      } else if (styleType === 5) {
        // Type 5: Diamond / Wide cheeks, narrow forehead and chin
        v.FL.x -= 40; v.FR.x += 40;
        v.EL.x -= 50; v.ER.x += 50;
        v.TL.x += 20; v.TR.x -= 20;
        v.BL.x += 15; v.BR.x -= 15;
      } else if (styleType === 6) {
        // Type 6: Heavy Jaw / Narrow forehead, wide bottom jaw
        v.TL.x += 30; v.TR.x -= 30;
        v.BL.x -= 40; v.BR.x += 40;
        v.ML.x -= 30; v.MR.x += 30;
      }

      // Apply modifiers and dramatic random jitter
      for (let key in v) {
        v[key].x *= scaleX;
        v[key].y *= scaleY;
        
        if (styleType === 3) {
          // Type 3: Extreme Vertical Asymmetry (Shift left side up, right side down)
          if (key.includes('L')) v[key].y -= 30;
          if (key.includes('R')) v[key].y += 30;
        }

        v[key].x += (Math.random() - 0.5) * 55;
        v[key].y += (Math.random() - 0.5) * 55;
      }

      // 3. Define the polygons that make up the face blocks
      const polys = [
        { type: 'skin', points: [v.TL, v.TM, v.FM, v.FL] }, // Forehead L
        { type: 'skin', points: [v.TM, v.TR, v.FR, v.FM] }, // Forehead R
        { type: 'eye',  points: [v.FL, v.FM, v.EM, v.EL] }, // Eye L
        { type: 'eye',  points: [v.FM, v.FR, v.ER, v.EM] }, // Eye R
        { type: 'nose', points: [v.EM, v.NR, v.NL] },       // Central Nose Block
        { type: 'skin', points: [v.EL, v.EM, v.NL, v.ML] }, // Cheek L
        { type: 'skin', points: [v.EM, v.ER, v.MR, v.NR] }, // Cheek R
        { type: 'mouth',points: [v.NL, v.NR, v.MR, v.MM, v.ML] }, // Mouth Block
        { type: 'skin', points: [v.ML, v.MM, v.BM, v.BL] }, // Chin L
        { type: 'skin', points: [v.MM, v.MR, v.BR, v.BM] }, // Chin R
        { type: 'skin', points: [v.FL, v.EL, v.EarL] },     // Ear/Hair L
        { type: 'skin', points: [v.FR, v.EarR, v.ER] }      // Ear/Hair R
      ];

      // 4. Generate SVG paths and calculate centroid
      const generated = polys.map(poly => {
        let pathStr = `M ${Math.round(poly.points[0].x * 10) / 10} ${Math.round(poly.points[0].y * 10) / 10}`;
        let twicearea = 0, cx = 0, cy = 0;
        let nPts = poly.points.length;
        
        for (let k = 1; k < nPts; k++) {
          pathStr += ` L ${Math.round(poly.points[k].x * 10) / 10} ${Math.round(poly.points[k].y * 10) / 10}`;
        }
        pathStr += " Z";

        // Calculate Polygon Centroid (used for gaps and drawing features)
        const pts = [...poly.points, poly.points[0]];
        for (let k = 0; k < nPts; k++) {
          const p1 = pts[k];
          const p2 = pts[k+1];
          const f = p1.x * p2.y - p2.x * p1.y;
          twicearea += f;
          cx += (p1.x + p2.x) * f;
          cy += (p1.y + p2.y) * f;
        }
        if (twicearea !== 0) {
          cx /= (twicearea * 3);
          cy /= (twicearea * 3);
        } else {
          cx = poly.points[0].x;
          cy = poly.points[0].y;
        }

        return { path: pathStr, type: poly.type, cx, cy, area: Math.abs(twicearea) / 2 };
      });

      return generated;
    }

    function updateGoldUnderlay(currentPieces) {
      let goldSvg = document.getElementById('gold-underlay-svg');
      if (!goldSvg) {
        goldSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        goldSvg.id = "gold-underlay-svg";
        goldSvg.setAttribute("width", "400");
        goldSvg.setAttribute("height", "400");
        goldSvg.setAttribute("viewBox", "-200 -200 400 400");
        goldSvg.style.position = "absolute";
        goldSvg.style.top = "-200px";
        goldSvg.style.left = "-200px";
        goldSvg.style.overflow = "visible";
        goldSvg.style.zIndex = "0"; // Behind fragments
        goldSvg.style.opacity = "0";
        goldSvg.style.transition = "opacity 3s ease";
        goldSvg.style.pointerEvents = "none";
        document.getElementById('canvas-container').insertBefore(goldSvg, document.getElementById('canvas-container').firstChild);
      }
      
      goldSvg.innerHTML = "";
      
      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.setAttribute("fill", "#eeb422"); 
      
      currentPieces.forEach(p => {
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", p.path);
        path.setAttribute("filter", "url(#gold-leaf)");
        g.appendChild(path);
      });
      goldSvg.appendChild(g);
    }

    let pieces = generatePieces();
    updateGoldUnderlay(pieces);
    
    // Initial Semantic Colors - Curated Multi-palette
    const skinPalette = [
      '#8c7c61', '#5e604f', '#d1c7b7', '#4a4542', '#9e8c78',
      '#b85d43', '#a36b54', '#d9a07b', '#b58e2a', '#703d2b',
      '#2b3e50', '#1c3a27', '#5c6b55', '#d5cbb8', '#426375',
      '#d9c8c0', '#b8c5b9', '#f2cc8f', '#c5bedb', '#3c3c3e',
      '#2a75d3', '#4ca93c', '#eac124', '#d13535', '#e462a3',
      '#ffffff', '#888888', '#222222'
    ];
    const initSkinColor = skinPalette[Math.floor(Math.random() * skinPalette.length)];
    let initSkinColor2 = skinPalette[Math.floor(Math.random() * skinPalette.length)];
    if (initSkinColor === initSkinColor2) initSkinColor2 = skinPalette[Math.floor(Math.random() * skinPalette.length)];
    
    // Eyes must be extremely distinct (light colored to show pupils)
    const eyeColors = ['#ffffff', '#f0f0f0', '#e8e8e8'];
    const initEyeColor = eyeColors[Math.floor(Math.random() * eyeColors.length)];
    
    // Mouth distinctly different (dark red/blue/black)
    const mouthColors = ['#c92a2a', '#1d70b8', '#111111', '#8c1616', '#4b1c73'];
    const initMouthColor = mouthColors[Math.floor(Math.random() * mouthColors.length)];

    // Initialize Fragment Data Objects (Anti-Gravity Spawn)
    const fragments = pieces.map((piece, index) => {
      // Spiral placement based on index for an elegant sweeping constellation
      const angle = index * ((Math.PI * 2) / pieces.length) * 1.8 + Math.random() * 0.5;
      
      const isMobile = window.innerWidth < 768;
      const baseDist = isMobile ? 40 : 120;
      const distStep = isMobile ? 8 : 20;
      const distRand = isMobile ? 20 : 50;
      const dist = baseDist + index * distStep + Math.random() * distRand;

      let startX = Math.cos(angle) * dist;
      let startY = Math.sin(angle) * dist;
      const startRot = (Math.random() - 0.5) * 360;

      // Simulated depth of field (scale & blur)
      const targetFloatingScale = 0.6 + Math.random() * 1.0;

      // Direction for tension pulling
      let tdX = startX;
      let tdY = startY;
      const tMag = Math.hypot(tdX, tdY) || 1;
      tdX /= tMag;
      tdY /= tMag;

      // Intro Animation: start closer on mobile so they are mostly visible, or fly in quickly
      const initialDist = isMobile ? 300 : 2500;
      const initialX = tdX * initialDist;
      const initialY = tdY * initialDist;
      const initialScale = 1.5;

      // Pick initial colors semantically based on type
      let initialColor;
      if (piece.type === 'eye') {
        initialColor = initEyeColor;
      } else if (piece.type === 'mouth') {
        initialColor = initMouthColor;
      } else if (piece.type === 'nose') {
        initialColor = initSkinColor2;
      } else {
        initialColor = Math.random() > 0.4 ? initSkinColor : initSkinColor2;
      }
      
      const texturesList = ['none', 'texture-matte', 'texture-glaze', 'texture-grainy', 'texture-speckled', 'texture-cracked', 'texture-gold-dust', 'texture-linen', 'texture-scales', 'texture-ripple'];
      const initialTexture = texturesList[Math.floor(Math.random() * texturesList.length)];

      return {
        id: index,
        path: piece.path,
        cx: piece.cx,
        cy: piece.cy,
        area: piece.area,
        type: piece.type,
        
        basex: 0,
        basey: 0,
        baseRot: 0,

        startX: startX,
        startY: startY,
        startRot: startRot,

        x: initialX,
        y: initialY,
        rot: startRot,
        scale: initialScale,
        targetScale: targetFloatingScale,

        noiseOffsetX: Math.random() * 1000,
        noiseOffsetY: Math.random() * 1000,
        noiseOffsetRot: Math.random() * 1000,

        isDragging: false,
        dragOffsetX: 0,
        dragOffsetY: 0,

        color: initialColor,
        texture: initialTexture,

        tensionDirX: tdX,
        tensionDirY: tdY,
        tensionDirRot: (Math.random() - 0.5) * 2,

        // No random final offsets. The final form will be perfectly structured by centroid gaps
        impX: 0,
        impY: 0,
        impRot: 0,

        element: null,
        pathElement: null
      };
    });

    // Helper to draw geometric facial features inside Voronoi polygons
    function drawFeatures(frag, parentGroup, svgNS) {
      if (frag.featureGroup) {
        parentGroup.removeChild(frag.featureGroup);
      }
      
      const featureGroup = document.createElementNS(svgNS, "g");
      frag.featureGroup = featureGroup;
      frag.featureSvgString = ""; 

      if (frag.type === 'eye') {
        const eyeStyle = Math.floor(Math.random() * 6);
        if (eyeStyle === 0) {
          // Style 0: Original slanted line with off-center pupil
          const pupil = document.createElementNS(svgNS, "circle");
          pupil.setAttribute("cx", frag.cx);
          pupil.setAttribute("cy", frag.cx > 0 ? frag.cy + 12 : frag.cy - 12);
          pupil.setAttribute("r", "12");
          pupil.setAttribute("fill", "#111111");

          const line = document.createElementNS(svgNS, "path");
          const lx = frag.cx - 25;
          const rx = frag.cx + 25;
          const ly = frag.cy - (Math.random() * 20);
          const ry = frag.cy + (Math.random() * 20);
          line.setAttribute("d", `M ${lx} ${ly} L ${rx} ${ry}`);
          line.setAttribute("stroke", "#111111");
          line.setAttribute("stroke-width", "6");
          line.setAttribute("stroke-linecap", "round");

          featureGroup.appendChild(line);
          featureGroup.appendChild(pupil);
          
          frag.featureSvgString = `<path d="M ${lx} ${ly} L ${rx} ${ry}" stroke="#111111" stroke-width="6" stroke-linecap="round" />
                                   <circle cx="${frag.cx}" cy="${frag.cx > 0 ? frag.cy + 12 : frag.cy - 12}" r="12" fill="#111111" />`;
        } else if (eyeStyle === 1) {
          // Style 1: Concentric circles (target eye)
          const outer = document.createElementNS(svgNS, "circle");
          outer.setAttribute("cx", frag.cx);
          outer.setAttribute("cy", frag.cy);
          outer.setAttribute("r", "20");
          outer.setAttribute("stroke", "#111111");
          outer.setAttribute("stroke-width", "5");
          outer.setAttribute("fill", "none");

          const inner = document.createElementNS(svgNS, "circle");
          inner.setAttribute("cx", frag.cx);
          inner.setAttribute("cy", frag.cy);
          inner.setAttribute("r", "8");
          inner.setAttribute("fill", "#111111");

          featureGroup.appendChild(outer);
          featureGroup.appendChild(inner);
          
          frag.featureSvgString = `<circle cx="${frag.cx}" cy="${frag.cy}" r="20" stroke="#111111" stroke-width="5" fill="none" />
                                   <circle cx="${frag.cx}" cy="${frag.cy}" r="8" fill="#111111" />`;
        } else if (eyeStyle === 2) {
          // Style 2: Almond shape
          const almond = document.createElementNS(svgNS, "path");
          almond.setAttribute("d", `M ${frag.cx - 30} ${frag.cy} Q ${frag.cx} ${frag.cy - 25} ${frag.cx + 30} ${frag.cy} Q ${frag.cx} ${frag.cy + 25} ${frag.cx - 30} ${frag.cy}`);
          almond.setAttribute("stroke", "#111111");
          almond.setAttribute("stroke-width", "5");
          almond.setAttribute("fill", "none");

          const pupil = document.createElementNS(svgNS, "circle");
          pupil.setAttribute("cx", frag.cx);
          pupil.setAttribute("cy", frag.cy);
          pupil.setAttribute("r", "10");
          pupil.setAttribute("fill", "#111111");

          featureGroup.appendChild(almond);
          featureGroup.appendChild(pupil);

          frag.featureSvgString = `<path d="M ${frag.cx - 30} ${frag.cy} Q ${frag.cx} ${frag.cy - 25} ${frag.cx + 30} ${frag.cy} Q ${frag.cx} ${frag.cy + 25} ${frag.cx - 30} ${frag.cy}" stroke="#111111" stroke-width="5" fill="none" />
                                   <circle cx="${frag.cx}" cy="${frag.cy}" r="10" fill="#111111" />`;
        } else if (eyeStyle === 3) {
          // Style 3: Closed eye arc with lashes
          const arc = document.createElementNS(svgNS, "path");
          arc.setAttribute("d", `M ${frag.cx - 25} ${frag.cy - 5} Q ${frag.cx} ${frag.cy + 15} ${frag.cx + 25} ${frag.cy - 5}`);
          arc.setAttribute("stroke", "#111111");
          arc.setAttribute("stroke-width", "6");
          arc.setAttribute("fill", "none");
          arc.setAttribute("stroke-linecap", "round");
          
          featureGroup.appendChild(arc);
          frag.featureSvgString = `<path d="M ${frag.cx - 25} ${frag.cy - 5} Q ${frag.cx} ${frag.cy + 15} ${frag.cx + 25} ${frag.cy - 5}" stroke="#111111" stroke-width="6" fill="none" stroke-linecap="round" />`;
          
          // Add 3 lashes
          for (let i = -1; i <= 1; i++) {
            const lash = document.createElementNS(svgNS, "line");
            const lx = frag.cx + i * 12;
            const ly = frag.cy + 5;
            lash.setAttribute("x1", lx);
            lash.setAttribute("y1", ly);
            lash.setAttribute("x2", lx + i * 5);
            lash.setAttribute("y2", ly + 12);
            lash.setAttribute("stroke", "#111111");
            lash.setAttribute("stroke-width", "4");
            lash.setAttribute("stroke-linecap", "round");
            featureGroup.appendChild(lash);
            frag.featureSvgString += `<line x1="${lx}" y1="${ly}" x2="${lx + i * 5}" y2="${ly + 12}" stroke="#111111" stroke-width="4" stroke-linecap="round" />`;
          }
        } else if (eyeStyle === 4) {
          // Style 4: Rectangular cubist block eye
          const outer = document.createElementNS(svgNS, "rect");
          outer.setAttribute("x", frag.cx - 20);
          outer.setAttribute("y", frag.cy - 12);
          outer.setAttribute("width", "40");
          outer.setAttribute("height", "24");
          outer.setAttribute("stroke", "#111111");
          outer.setAttribute("stroke-width", "5");
          outer.setAttribute("fill", "none");
          outer.setAttribute("transform", `rotate(15, ${frag.cx}, ${frag.cy})`);

          const inner = document.createElementNS(svgNS, "rect");
          inner.setAttribute("x", frag.cx - 8);
          inner.setAttribute("y", frag.cy - 8);
          inner.setAttribute("width", "16");
          inner.setAttribute("height", "16");
          inner.setAttribute("fill", "#111111");
          inner.setAttribute("transform", `rotate(15, ${frag.cx}, ${frag.cy})`);

          featureGroup.appendChild(outer);
          featureGroup.appendChild(inner);
          
          frag.featureSvgString = `<rect x="${frag.cx - 20}" y="${frag.cy - 12}" width="40" height="24" stroke="#111111" stroke-width="5" fill="none" transform="rotate(15, ${frag.cx}, ${frag.cy})" />
                                   <rect x="${frag.cx - 8}" y="${frag.cy - 8}" width="16" height="16" fill="#111111" transform="rotate(15, ${frag.cx}, ${frag.cy})" />`;
        } else {
          // Style 5: Hypnotic Zen spiral
          const spiral = document.createElementNS(svgNS, "path");
          spiral.setAttribute("d", `M ${frag.cx} ${frag.cy} A 6 6 0 0 1 ${frag.cx + 6} ${frag.cy} A 12 12 0 0 1 ${frag.cx - 6} ${frag.cy} A 18 18 0 0 1 ${frag.cx + 12} ${frag.cy} A 24 24 0 0 1 ${frag.cx - 18} ${frag.cy}`);
          spiral.setAttribute("stroke", "#111111");
          spiral.setAttribute("stroke-width", "5");
          spiral.setAttribute("fill", "none");
          spiral.setAttribute("stroke-linecap", "round");

          featureGroup.appendChild(spiral);
          
          frag.featureSvgString = `<path d="M ${frag.cx} ${frag.cy} A 6 6 0 0 1 ${frag.cx + 6} ${frag.cy} A 12 12 0 0 1 ${frag.cx - 6} ${frag.cy} A 18 18 0 0 1 ${frag.cx + 12} ${frag.cy} A 24 24 0 0 1 ${frag.cx - 18} ${frag.cy}" stroke="#111111" stroke-width="5" fill="none" stroke-linecap="round" />`;
        }
      } else if (frag.type === 'nose') {
        const noseStyle = Math.floor(Math.random() * 5);
        if (noseStyle === 0) {
          // Style 0: Original hooked line
          const line = document.createElementNS(svgNS, "path");
          const nx = frag.cx;
          const ny = frag.cy - 25;
          const mx = frag.cx + (Math.random() > 0.5 ? 20 : -20);
          const my = frag.cy + 20;
          const bx = frag.cx;
          const by = frag.cy + 30;
          line.setAttribute("d", `M ${nx} ${ny} L ${mx} ${my} L ${bx} ${by}`);
          line.setAttribute("stroke", "#111111");
          line.setAttribute("stroke-width", "6");
          line.setAttribute("fill", "none");
          line.setAttribute("stroke-linejoin", "round");
          line.setAttribute("stroke-linecap", "round");

          featureGroup.appendChild(line);
          frag.featureSvgString = `<path d="M ${nx} ${ny} L ${mx} ${my} L ${bx} ${by}" stroke="#111111" stroke-width="6" fill="none" stroke-linejoin="round" stroke-linecap="round" />`;
        } else if (noseStyle === 1) {
          // Style 1: Nostrils only
          const n1 = document.createElementNS(svgNS, "circle");
          n1.setAttribute("cx", frag.cx - 12);
          n1.setAttribute("cy", frag.cy + 15);
          n1.setAttribute("r", "6");
          n1.setAttribute("fill", "#111111");

          const n2 = document.createElementNS(svgNS, "circle");
          n2.setAttribute("cx", frag.cx + 12);
          n2.setAttribute("cy", frag.cy + 15);
          n2.setAttribute("r", "6");
          n2.setAttribute("fill", "#111111");
          
          featureGroup.appendChild(n1);
          featureGroup.appendChild(n2);
          frag.featureSvgString = `<circle cx="${frag.cx - 12}" cy="${frag.cy + 15}" r="6" fill="#111111" /><circle cx="${frag.cx + 12}" cy="${frag.cy + 15}" r="6" fill="#111111" />`;
        } else if (noseStyle === 2) {
          // Style 2: Sharp triangle outline
          const tri = document.createElementNS(svgNS, "polygon");
          tri.setAttribute("points", `${frag.cx},${frag.cy - 25} ${frag.cx - 20},${frag.cy + 25} ${frag.cx + 20},${frag.cy + 25}`);
          tri.setAttribute("stroke", "#111111");
          tri.setAttribute("stroke-width", "5");
          tri.setAttribute("fill", "none");
          tri.setAttribute("stroke-linejoin", "round");
          
          featureGroup.appendChild(tri);
          frag.featureSvgString = `<polygon points="${frag.cx},${frag.cy - 25} ${frag.cx - 20},${frag.cy + 25} ${frag.cx + 20},${frag.cy + 25}" stroke="#111111" stroke-width="5" fill="none" stroke-linejoin="round" />`;
        } else if (noseStyle === 3) {
          // Style 3: Abstract L-shape nose
          const line = document.createElementNS(svgNS, "path");
          line.setAttribute("d", `M ${frag.cx - 8} ${frag.cy - 25} L ${frag.cx - 8} ${frag.cy + 15} L ${frag.cx + 16} ${frag.cy + 15}`);
          line.setAttribute("stroke", "#111111");
          line.setAttribute("stroke-width", "6");
          line.setAttribute("fill", "none");
          line.setAttribute("stroke-linejoin", "round");
          line.setAttribute("stroke-linecap", "round");

          featureGroup.appendChild(line);
          frag.featureSvgString = `<path d="M ${frag.cx - 8} ${frag.cy - 25} L ${frag.cx - 8} ${frag.cy + 15} L ${frag.cx + 16} ${frag.cy + 15}" stroke="#111111" stroke-width="6" fill="none" stroke-linejoin="round" stroke-linecap="round" />`;
        } else {
          // Style 4: Minimal parallel lines
          const l1 = document.createElementNS(svgNS, "line");
          l1.setAttribute("x1", frag.cx - 7);
          l1.setAttribute("y1", frag.cy - 20);
          l1.setAttribute("x2", frag.cx - 7);
          l1.setAttribute("y2", frag.cy + 20);
          l1.setAttribute("stroke", "#111111");
          l1.setAttribute("stroke-width", "5");
          l1.setAttribute("stroke-linecap", "round");

          const l2 = document.createElementNS(svgNS, "line");
          l2.setAttribute("x1", frag.cx + 7);
          l2.setAttribute("y1", frag.cy - 20);
          l2.setAttribute("x2", frag.cx + 7);
          l2.setAttribute("y2", frag.cy + 20);
          l2.setAttribute("stroke", "#111111");
          l2.setAttribute("stroke-width", "5");
          l2.setAttribute("stroke-linecap", "round");

          featureGroup.appendChild(l1);
          featureGroup.appendChild(l2);
          frag.featureSvgString = `<line x1="${frag.cx - 7}" y1="${frag.cy - 20}" x2="${frag.cx - 7}" y2="${frag.cy + 20}" stroke="#111111" stroke-width="5" stroke-linecap="round" />
                                   <line x1="${frag.cx + 7}" y1="${frag.cy - 20}" x2="${frag.cx + 7}" y2="${frag.cy + 20}" stroke="#111111" stroke-width="5" stroke-linecap="round" />`;
        }
      } else if (frag.type === 'mouth') {
        const mouthStyle = Math.floor(Math.random() * 6);
        if (mouthStyle === 0) {
          // Style 0: Original wavy with lip
          const line = document.createElementNS(svgNS, "path");
          const lx = frag.cx - 35;
          const rx = frag.cx + 35;
          const yOffset = (Math.random() - 0.5) * 30;
          line.setAttribute("d", `M ${lx} ${frag.cy - yOffset} Q ${frag.cx} ${frag.cy + 20} ${rx} ${frag.cy + yOffset}`);
          line.setAttribute("stroke", "#111111");
          line.setAttribute("stroke-width", "6");
          line.setAttribute("fill", "none");
          line.setAttribute("stroke-linecap", "round");

          const lip = document.createElementNS(svgNS, "path");
          lip.setAttribute("d", `M ${lx + 15} ${frag.cy} L ${rx - 15} ${frag.cy}`);
          lip.setAttribute("stroke", "#111111");
          lip.setAttribute("stroke-width", "4");
          lip.setAttribute("stroke-linecap", "round");

          featureGroup.appendChild(line);
          featureGroup.appendChild(lip);
          
          frag.featureSvgString = `<path d="M ${lx} ${frag.cy - yOffset} Q ${frag.cx} ${frag.cy + 20} ${rx} ${frag.cy + yOffset}" stroke="#111111" stroke-width="6" fill="none" stroke-linecap="round" />
                                   <path d="M ${lx + 15} ${frag.cy} L ${rx - 15} ${frag.cy}" stroke="#111111" stroke-width="4" stroke-linecap="round" />`;
        } else if (mouthStyle === 1) {
          // Style 1: Stitched mouth
          const line = document.createElementNS(svgNS, "line");
          line.setAttribute("x1", frag.cx - 30);
          line.setAttribute("y1", frag.cy);
          line.setAttribute("x2", frag.cx + 30);
          line.setAttribute("y2", frag.cy);
          line.setAttribute("stroke", "#111111");
          line.setAttribute("stroke-width", "6");
          line.setAttribute("stroke-linecap", "round");
          featureGroup.appendChild(line);
          frag.featureSvgString = `<line x1="${frag.cx - 30}" y1="${frag.cy}" x2="${frag.cx + 30}" y2="${frag.cy}" stroke="#111111" stroke-width="6" stroke-linecap="round" />`;
          
          for (let i = -2; i <= 2; i++) {
            const stitch = document.createElementNS(svgNS, "line");
            const sx = frag.cx + i * 12;
            stitch.setAttribute("x1", sx);
            stitch.setAttribute("y1", frag.cy - 8);
            stitch.setAttribute("x2", sx);
            stitch.setAttribute("y2", frag.cy + 8);
            stitch.setAttribute("stroke", "#111111");
            stitch.setAttribute("stroke-width", "4");
            stitch.setAttribute("stroke-linecap", "round");
            featureGroup.appendChild(stitch);
            frag.featureSvgString += `<line x1="${sx}" y1="${frag.cy - 8}" x2="${sx}" y2="${frag.cy + 8}" stroke="#111111" stroke-width="4" stroke-linecap="round" />`;
          }
        } else if (mouthStyle === 2) {
          // Style 2: Open D-shape mouth
          const mouth = document.createElementNS(svgNS, "path");
          mouth.setAttribute("d", `M ${frag.cx - 25} ${frag.cy - 5} L ${frag.cx + 25} ${frag.cy - 5} Q ${frag.cx} ${frag.cy + 30} ${frag.cx - 25} ${frag.cy - 5}`);
          mouth.setAttribute("stroke", "#111111");
          mouth.setAttribute("stroke-width", "5");
          mouth.setAttribute("fill", "none");
          mouth.setAttribute("stroke-linejoin", "round");
          featureGroup.appendChild(mouth);
          frag.featureSvgString = `<path d="M ${frag.cx - 25} ${frag.cy - 5} L ${frag.cx + 25} ${frag.cy - 5} Q ${frag.cx} ${frag.cy + 30} ${frag.cx - 25} ${frag.cy - 5}" stroke="#111111" stroke-width="5" fill="none" stroke-linejoin="round" />`;
        } else if (mouthStyle === 3) {
          // Style 3: Squiggly line
          const squiggle = document.createElementNS(svgNS, "path");
          squiggle.setAttribute("d", `M ${frag.cx - 30} ${frag.cy} Q ${frag.cx - 15} ${frag.cy - 15} ${frag.cx} ${frag.cy} T ${frag.cx + 30} ${frag.cy}`);
          squiggle.setAttribute("stroke", "#111111");
          squiggle.setAttribute("stroke-width", "6");
          squiggle.setAttribute("fill", "none");
          squiggle.setAttribute("stroke-linecap", "round");
          featureGroup.appendChild(squiggle);
          frag.featureSvgString = `<path d="M ${frag.cx - 30} ${frag.cy} Q ${frag.cx - 15} ${frag.cy - 15} ${frag.cx} ${frag.cy} T ${frag.cx + 30} ${frag.cy}" stroke="#111111" stroke-width="6" fill="none" stroke-linecap="round" />`;
        } else if (mouthStyle === 4) {
          // Style 4: Puckered O-mouth
          const oMouth = document.createElementNS(svgNS, "circle");
          oMouth.setAttribute("cx", frag.cx);
          oMouth.setAttribute("cy", frag.cy);
          oMouth.setAttribute("r", "12");
          oMouth.setAttribute("stroke", "#111111");
          oMouth.setAttribute("stroke-width", "6");
          oMouth.setAttribute("fill", "none");
          featureGroup.appendChild(oMouth);
          frag.featureSvgString = `<circle cx="${frag.cx}" cy="${frag.cy}" r="12" stroke="#111111" stroke-width="6" fill="none" />`;
        } else {
          // Style 5: Drama Frown
          const frown = document.createElementNS(svgNS, "path");
          frown.setAttribute("d", `M ${frag.cx - 30} ${frag.cy + 15} Q ${frag.cx} ${frag.cy - 10} ${frag.cx + 30} ${frag.cy + 15}`);
          frown.setAttribute("stroke", "#111111");
          frown.setAttribute("stroke-width", "6");
          frown.setAttribute("fill", "none");
          frown.setAttribute("stroke-linecap", "round");
          featureGroup.appendChild(frown);
          frag.featureSvgString = `<path d="M ${frag.cx - 30} ${frag.cy + 15} Q ${frag.cx} ${frag.cy - 10} ${frag.cx + 30} ${frag.cy + 15}" stroke="#111111" stroke-width="6" fill="none" stroke-linecap="round" />`;
        }
      }

      parentGroup.appendChild(featureGroup);
    }

    // Create DOM Elements
    fragments.forEach(frag => {
      const div = document.createElement('div');
      div.className = 'fragment';
      div.style.transformOrigin = `${frag.cx}px ${frag.cy}px`;
      div.style.opacity = '0'; // Hidden before prologue ends

      const svgNS = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(svgNS, "svg");
      svg.setAttribute("width", "400");
      svg.setAttribute("height", "400");
      svg.setAttribute("viewBox", "-200 -200 400 400");
      svg.style.position = "absolute";
      svg.style.top = "-200px";
      svg.style.left = "-200px";
      svg.style.overflow = "visible";

      const clipId = `clip-frag-${frag.id}`;
      const clipPathDef = document.createElementNS(svgNS, "clipPath");
      clipPathDef.setAttribute("id", clipId);
      const clipPathElem = document.createElementNS(svgNS, "path");
      clipPathElem.setAttribute("d", frag.path);
      clipPathDef.appendChild(clipPathElem);
      
      const defs = document.createElementNS(svgNS, "defs");
      defs.appendChild(clipPathDef);
      svg.appendChild(defs);

      const g = document.createElementNS(svgNS, "g");
      // Removed brush-stroke filter

      const clippedGroup = document.createElementNS(svgNS, "g");
      clippedGroup.setAttribute("clip-path", `url(#${clipId})`);

      const pathBg = document.createElementNS(svgNS, "path");
      pathBg.setAttribute("d", frag.path);
      pathBg.setAttribute("fill", frag.color);
      
      const textureOverlay = document.createElementNS(svgNS, "path");
      textureOverlay.setAttribute("d", frag.path);
      textureOverlay.setAttribute("pointer-events", "none");
      if (frag.texture !== 'none') {
        textureOverlay.setAttribute("fill", `url(#${frag.texture})`);
      } else {
        textureOverlay.setAttribute("fill", "none");
      }

      clippedGroup.appendChild(pathBg);
      clippedGroup.appendChild(textureOverlay);
      
      drawFeatures(frag, clippedGroup, svgNS);
      
      const hitArea = document.createElementNS(svgNS, "path");
      hitArea.setAttribute("d", frag.path);
      hitArea.setAttribute("fill", "transparent");
      hitArea.setAttribute("stroke", "transparent");
      hitArea.setAttribute("stroke-width", "25");
      hitArea.setAttribute("stroke-linejoin", "round");
      hitArea.style.pointerEvents = "all";
      frag.hitArea = hitArea;

      g.appendChild(hitArea);
      g.appendChild(clippedGroup);
      svg.appendChild(g);
      div.appendChild(svg);
      
      const tracingSvg = document.createElementNS(svgNS, "svg");
      tracingSvg.setAttribute("viewBox", "-200 -200 400 400");
      tracingSvg.setAttribute("width", "400");
      tracingSvg.setAttribute("height", "400");
      tracingSvg.style.position = "absolute";
      tracingSvg.style.top = "-200px";
      tracingSvg.style.left = "-200px";
      tracingSvg.style.pointerEvents = "none";
      tracingSvg.style.overflow = "visible";

      const tracingG = document.createElementNS(svgNS, "g");

      const glowPath = document.createElementNS(svgNS, "path");
      glowPath.setAttribute("d", frag.path);
      glowPath.setAttribute("fill", "none");
      glowPath.setAttribute("stroke", "rgba(255, 250, 230, 0.4)"); // Soft sunlight
      glowPath.setAttribute("stroke-width", "16");
      glowPath.setAttribute("stroke-linecap", "round");
      glowPath.style.filter = "blur(8px)"; // Broad soft diffusion
      glowPath.style.opacity = "0"; // Hide initially

      const corePath = document.createElementNS(svgNS, "path");
      corePath.setAttribute("d", frag.path);
      corePath.setAttribute("fill", "none");
      corePath.setAttribute("stroke", "rgba(255, 255, 255, 0.8)"); // Glint core
      corePath.setAttribute("stroke-width", "3");
      corePath.setAttribute("stroke-linecap", "round");
      corePath.style.filter = "blur(2px)"; // Slight softening
      corePath.style.opacity = "0"; // Hide initially
      
      tracingG.appendChild(glowPath);
      tracingG.appendChild(corePath);
      tracingSvg.appendChild(tracingG);
      div.appendChild(tracingSvg);

      // Custom cursor hover logic
      div.addEventListener('pointerenter', () => {
        if ((!isSettling || isFreeArrange) && !isPrologue && !fragments.some(f => f.isDragging)) {
          customCursor.classList.add('hover');
        }
      });
      div.addEventListener('pointerleave', () => {
        customCursor.classList.remove('hover');
      });

      // Interaction
      div.addEventListener('pointerdown', (e) => {
        if (!e.isPrimary) return; // Prevent second finger from dragging another fragment
        e.stopPropagation();
        if (isPrologue) return;
        if (isSettling && !isFreeArrange) return;

        playClink();
        selectFragment(frag);

        // Bring to front safely without detaching DOM node
        topZIndex++;
        div.style.zIndex = topZIndex;

        frag.isDragging = true;
        frag.hasMoved = false;
        frag.dragStartX = frag.x;
        frag.dragStartY = frag.y;
        frag.dragStartRot = frag.rot;
        frag.dragStartScale = frag.scale;
        frag.targetDragX = frag.x;
        frag.targetDragY = frag.y;
        returningFragment = null;
        customCursor.classList.remove('hover'); // hide hover ring while dragging

        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2 + (centerYOffset || 0);
        frag.dragOffsetX = e.clientX - (centerX + frag.x * 1.15);
        frag.dragOffsetY = e.clientY - (centerY + frag.y * 1.15);

        div.setPointerCapture(e.pointerId);
      });

      div.addEventListener('pointermove', (e) => {
        if (!frag.isDragging) return;
        e.stopPropagation();
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2 + (centerYOffset || 0);
        const newX = (e.clientX - centerX - frag.dragOffsetX) / 1.15;
        const newY = (e.clientY - centerY - frag.dragOffsetY) / 1.15;
        
        if (!frag.hasMoved) {
          if (Math.abs(newX - frag.dragStartX) > 3 || Math.abs(newY - frag.dragStartY) > 3) {
            frag.hasMoved = true;
            document.body.classList.add('is-dragging');
          }
        }

        frag.targetDragX = newX;
        frag.targetDragY = newY;
      });

      div.addEventListener('pointerup', (e) => {
        if (frag.isDragging) {
          frag.isDragging = false;
          frag.hasMoved = false;
          document.body.classList.remove('is-dragging');
          returningFragment = frag;
          
          if (frag.x !== frag.dragStartX || frag.y !== frag.dragStartY || frag.rot !== frag.dragStartRot || frag.scale !== frag.dragStartScale) {
            moveHistory.push({
              frag: frag,
              oldX: frag.dragStartX,
              oldY: frag.dragStartY,
              oldRot: frag.dragStartRot,
              oldScale: frag.dragStartScale
            });
            redoHistory = [];
            updateHistoryButtons();
            
            // Allow fragments to be placed anywhere and stay there
            if (!isSettling && !isFreeArrange) {
              frag.startX = frag.x;
              frag.startY = frag.y;
              frag.startRot = frag.rot;
              frag.tensionDirX = 0;
              frag.tensionDirY = 0;
            }
          }

          div.releasePointerCapture(e.pointerId);
          e.stopPropagation();
        }
      });

      div.addEventListener('pointercancel', (e) => {
        if (frag.isDragging) {
          frag.isDragging = false;
          frag.hasMoved = false;
          document.body.classList.remove('is-dragging');
          returningFragment = frag;
          div.releasePointerCapture(e.pointerId);
          e.stopPropagation();
        }
      });

      container.appendChild(div);

      // Give smaller fragments a higher initial z-index so they aren't swallowed by larger neighbors' invisible hit areas
      div.style.zIndex = Math.floor(1000 - frag.area / 100);

      // Initialize Tracing Path length for natural sweep
      const length = corePath.getTotalLength();
      const sweepLength = length * 0.5; // Light covers 50% of the seam at a time
      
      // We set the dash to be [sweepLength] [length] so there's only one soft beam
      glowPath.style.strokeDasharray = `${sweepLength} ${length}`;
      glowPath.style.strokeDashoffset = length;
      corePath.style.strokeDasharray = `${sweepLength} ${length}`;
      corePath.style.strokeDashoffset = length;
      
      frag.element = div;
      frag.pathElement = pathBg;
      frag.textureOverlay = textureOverlay;
      frag.clipPathElem = clipPathElem;
      frag.clippedGroup = clippedGroup;
      frag.glowPath = glowPath;
      frag.corePath = corePath;
      frag.tracingG = tracingG;
    });

    // Deselect on background click
    document.body.addEventListener('pointerdown', (e) => {
      if (!e.isPrimary) return; // allow second finger touches for rotation
      if ((isSettling && !isFreeArrange) || isPrologue) return;
      deselectFragment();
    });

    function selectFragment(frag) {
      if (selectedFragment) {
        selectedFragment.element.classList.remove('selected');
      }
      selectedFragment = frag;
      frag.element.classList.add('selected');
      uiPanel.classList.add('visible');
      
      if (!isFreeArrange) {
        letGoBtn.classList.add('hidden');
      }
      
      document.getElementById('style-menu-container').style.display = '';
      if (isFreeArrange && window.innerWidth < 768) {
        document.getElementById('style-menu-content').style.display = 'none';
        document.getElementById('style-arrow-icon').classList.remove('expanded');
      } else {
        document.getElementById('style-menu-content').style.display = 'flex';
        document.getElementById('style-arrow-icon').classList.add('expanded');
      }
      
      if (!isFreeArrange) {
        document.getElementById('arrange-tools').style.display = 'none';
      } else {
        document.getElementById('arrange-tools').style.display = 'block';
      }

      document.body.classList.add('has-selected');
      editCount += 0.5;

      // Force swipe hints to recalculate after layout becomes visible
      setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
    }

    function deselectFragment() {
      if (selectedFragment) {
        selectedFragment.element.classList.remove('selected');
        selectedFragment = null;
      }
      uiPanel.classList.remove('visible');
      document.body.classList.remove('has-selected');

      if (!isFreeArrange && !isSettling) {
        letGoBtn.classList.remove('hidden');
      }
    }

    function applyColor(color) {
      if (!selectedFragment) return;
      moveHistory.push({
        frag: selectedFragment,
        oldColor: selectedFragment.color,
        type: 'color'
      });
      redoHistory = [];
      updateHistoryButtons();
      selectedFragment.color = color;
      selectedFragment.pathElement.setAttribute("fill", color);
      editCount++;
    }

    function applyTexture(textureId) {
      if (!selectedFragment) return;
      moveHistory.push({
        frag: selectedFragment,
        oldTexture: selectedFragment.texture,
        type: 'texture'
      });
      redoHistory = [];
      updateHistoryButtons();
      selectedFragment.texture = textureId;
      if (textureId === 'none') {
        selectedFragment.textureOverlay.setAttribute("fill", "none");
      } else {
        selectedFragment.textureOverlay.setAttribute("fill", `url(#${textureId})`);
      }
      editCount++;
    }

    // Keyboard Rotation and Undo/Redo
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.code === 'KeyZ' || e.key.toLowerCase() === 'z')) {
        if (e.shiftKey) {
          e.preventDefault();
          const redoBtn = document.getElementById('redo-btn');
          if (redoBtn) redoBtn.click();
        } else {
          e.preventDefault();
          document.getElementById('return-btn').click();
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && (e.code === 'KeyY' || e.key.toLowerCase() === 'y')) {
        e.preventDefault();
        const redoBtn = document.getElementById('redo-btn');
        if (redoBtn) redoBtn.click();
        return;
      }
      
      if (!isFreeArrange || !selectedFragment) return;

      if (e.code === 'KeyZ' || e.key.toLowerCase() === 'z') {
        if (selectedFragment.targetRot === undefined) selectedFragment.targetRot = selectedFragment.rot;
        
        moveHistory.push({
          frag: selectedFragment,
          oldX: selectedFragment.x,
          oldY: selectedFragment.y,
          oldRot: selectedFragment.targetRot,
          type: 'spatial'
        });
        redoHistory = [];
        updateHistoryButtons();

        selectedFragment.targetRot -= 15;
      } else if (e.code === 'KeyX' || e.key.toLowerCase() === 'x') {
        if (selectedFragment.targetRot === undefined) selectedFragment.targetRot = selectedFragment.rot;
        
        moveHistory.push({
          frag: selectedFragment,
          oldX: selectedFragment.x,
          oldY: selectedFragment.y,
          oldRot: selectedFragment.targetRot,
          type: 'spatial'
        });
        redoHistory = [];
        updateHistoryButtons();

        selectedFragment.targetRot += 15;
      } else if (e.code === 'KeyA' || e.key.toLowerCase() === 'a') {
        if (selectedFragment.targetScale === undefined) selectedFragment.targetScale = selectedFragment.scale;
        
        moveHistory.push({
          frag: selectedFragment,
          oldX: selectedFragment.x,
          oldY: selectedFragment.y,
          oldRot: selectedFragment.targetRot || selectedFragment.rot,
          oldScale: selectedFragment.targetScale,
          type: 'spatial'
        });
        redoHistory = [];
        updateHistoryButtons();

        selectedFragment.targetScale = Math.min(4.0, selectedFragment.targetScale + 0.1);
      } else if (e.code === 'KeyS' || e.key.toLowerCase() === 's') {
        if (selectedFragment.targetScale === undefined) selectedFragment.targetScale = selectedFragment.scale;
        
        moveHistory.push({
          frag: selectedFragment,
          oldX: selectedFragment.x,
          oldY: selectedFragment.y,
          oldRot: selectedFragment.targetRot || selectedFragment.rot,
          oldScale: selectedFragment.targetScale,
          type: 'spatial'
        });
        redoHistory = [];
        updateHistoryButtons();

        selectedFragment.targetScale = Math.max(0.3, selectedFragment.targetScale - 0.1);
      }
    });

    // Mobile Two-Finger Rotation & Zoom
    let initialTouchAngle = null;
    let initialFragRot = null;
    let initialTouchDist = null;
    let initialFragScale = null;

    document.addEventListener('touchstart', (e) => {
      if (!isFreeArrange || !selectedFragment) return;
      if (e.touches.length === 2) {
        const dx = e.touches[1].clientX - e.touches[0].clientX;
        const dy = e.touches[1].clientY - e.touches[0].clientY;
        initialTouchAngle = Math.atan2(dy, dx) * 180 / Math.PI;
        initialFragRot = selectedFragment.rot;
        initialTouchDist = Math.hypot(dx, dy);
        initialFragScale = selectedFragment.scale;
      }
    }, {passive: false});

    document.addEventListener('touchmove', (e) => {
      if (!isFreeArrange || !selectedFragment) return;
      if (e.touches.length === 2 && initialTouchAngle !== null && initialTouchDist !== null) {
        e.preventDefault(); // prevent zoom/scroll
        const dx = e.touches[1].clientX - e.touches[0].clientX;
        const dy = e.touches[1].clientY - e.touches[0].clientY;
        
        // Rotation
        const currentAngle = Math.atan2(dy, dx) * 180 / Math.PI;
        let deltaAngle = currentAngle - initialTouchAngle;
        if (deltaAngle > 180) deltaAngle -= 360;
        if (deltaAngle < -180) deltaAngle += 360;
        selectedFragment.rot = initialFragRot + deltaAngle;
        selectedFragment.targetRot = selectedFragment.rot;

        // Scaling
        const currentDist = Math.hypot(dx, dy);
        if (initialTouchDist > 0) {
          const scaleFactor = currentDist / initialTouchDist;
          let newScale = initialFragScale * scaleFactor;
          newScale = Math.max(0.3, Math.min(newScale, 4.0)); // Limit scale size
          selectedFragment.scale = newScale;
          selectedFragment.targetScale = newScale;
        }
      }
    }, {passive: false});

    document.addEventListener('touchend', (e) => {
      if (e.touches.length < 2) {
        initialTouchAngle = null;
        initialTouchDist = null;
      }
    });

    function pseudoNoise(t) {
      return Math.sin(t) * 0.5 + Math.sin(t * 0.8) * 0.3 + Math.sin(t * 1.2) * 0.2;
    }

    function updateCursor() {
      if (returningFragment) {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        cursorX = centerX + returningFragment.x + returningFragment.dragOffsetX;
        cursorY = centerY + returningFragment.y + returningFragment.dragOffsetY;
      } else if (!fragments.some(f => f.isDragging)) {
        cursorX += (cursorTargetX - cursorX) * 0.85;
        cursorY += (cursorTargetY - cursorY) * 0.85;
      }
      customCursor.style.transform = `translate(calc(${cursorX}px - 50%), calc(${cursorY}px - 50%))`;
    }

    function updateDrone(tensionFactor) {
      if (!droneOsc1 || !droneGain || isSettling) return;
      const targetFreq1 = 100 + (tensionFactor / 25) * 20;
      const targetFreq2 = 102 + (tensionFactor / 25) * 22;
      const targetVol = 0.01 + Math.min(tensionFactor / 25, 1) * 0.14;

      const t = audioCtx.currentTime;
      droneOsc1.frequency.setTargetAtTime(targetFreq1, t, 0.5);
      droneOsc2.frequency.setTargetAtTime(targetFreq2, t, 0.5);
      droneGain.gain.setTargetAtTime(targetVol, t, 0.5);
    }

    // Main Animation Loop
    function animate() {
      time += 0.01;

      // Smooth lerp to target rotation and scale
      fragments.forEach(f => {
        if (f.targetRot !== undefined) {
          f.rot += (f.targetRot - f.rot) * 0.15;
        }
        if (f.targetScale !== undefined) {
          f.scale += (f.targetScale - f.scale) * 0.15;
        }
      });

      let targetCenterYOffset = window.innerWidth < 768 ? 0 : -80;
      if (uiPanel.classList.contains('visible') && window.innerWidth < 768) {
        targetCenterYOffset = -140;
      }
      
      centerYOffset += (targetCenterYOffset - centerYOffset) * 0.1;

      window.parallaxX = 0;
      window.parallaxY = 0;

      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2 + centerYOffset;
      const tensionFactor = Math.min(editCount * 0.8, 25);

      let allSettled = true;

      fragments.forEach(f => {
        if (!isSettling) {
          if (isPrologue) {
            f.element.style.opacity = '0';
            return; // Wait off-screen during prologue
          } else {
            f.element.style.opacity = '1';
          }

          // Smooth shrink-in effect
          f.scale += (f.targetScale - f.scale) * 0.03;

          // Floating Anti-Gravity + Tension
          const floatX = pseudoNoise(time * 0.5 + f.noiseOffsetX) * 40;
          const floatY = pseudoNoise(time * 0.5 + f.noiseOffsetY) * 40;

          const jitterX = pseudoNoise(time * 15 + f.noiseOffsetX) * tensionFactor * 0.6;
          const jitterY = pseudoNoise(time * 15 + f.noiseOffsetY) * tensionFactor * 0.6;
          const jitterRot = pseudoNoise(time * 15 + f.noiseOffsetRot) * tensionFactor * 0.3;

          const pullX = f.tensionDirX * tensionFactor * 3;
          const pullY = f.tensionDirY * tensionFactor * 3;
          const pullRot = f.tensionDirRot * tensionFactor * 2;

          let targetX = f.startX + floatX + pullX + jitterX;
          let targetY = f.startY + floatY + pullY + jitterY;
          const targetRot = f.startRot + pullRot + jitterRot;

          // Constrain target within window bounds
          const marginW = window.innerWidth / 2 - 120;
          const marginH = window.innerHeight / 2 - 120;
          targetX = Math.max(-marginW, Math.min(marginW, targetX));
          targetY = Math.max(-marginH, Math.min(marginH, targetY));

          if (f.isDragging) {
            if (typeof f.targetDragX !== 'undefined') {
              f.x += (f.targetDragX - f.x) * 0.15;
              f.y += (f.targetDragY - f.y) * 0.15;
            }
          } else {
            f.x += (targetX - f.x) * 0.05;
            f.y += (targetY - f.y) * 0.05;
            f.rot += (targetRot - f.rot) * 0.05;
          }

          if (tensionFactor > 0 || Math.abs(f.x - f.startX) > 1) {
            allSettled = false;
          }

        } else {
          if (isFreeArrange || isCustomArranged) {
            if (f.isDragging && typeof f.targetDragX !== 'undefined') {
              f.x += (f.targetDragX - f.x) * 0.15;
              f.y += (f.targetDragY - f.y) * 0.15;
            }
            f.element.style.transform = `translate(${centerX + f.x + window.parallaxX}px, ${centerY + f.y + window.parallaxY}px) rotate(${f.rot}deg) scale(${f.scale})`;
            return;
          }

          // True anti-overlapping gap based on polygon centroid relative to face center
          // This ensures pieces are pulled apart proportionally, scaling the entire face uniformly outward
          const gapScale = 0.03; // 3% gap outward scaling
          const gapX = f.cx * gapScale;
          const gapY = f.cy * gapScale;
          
          const finalChaosX = gapX;
          const finalChaosY = gapY;
          const finalChaosRot = 0; // No random rotation to guarantee NO overlaps

          const targetX = f.basex + finalChaosX;
          const targetY = f.basey + finalChaosY;
          const targetRot = f.baseRot + finalChaosRot;

          if (f.isDragging) {
            if (typeof f.targetDragX !== 'undefined') {
              f.x += (f.targetDragX - f.x) * 0.15;
              f.y += (f.targetDragY - f.y) * 0.15;
            }
          } else {
            f.x += (targetX - f.x) * 0.025;
            f.y += (targetY - f.y) * 0.025;
            f.rot += (targetRot - f.rot) * 0.025;
          }

          // Animate depth/scale to uniform 1.0
          f.scale += (1 - f.scale) * 0.025;

          const dist = Math.abs(targetX - f.x) + Math.abs(targetY - f.y) + Math.abs(targetRot - f.rot) + Math.abs(1 - f.scale);
          if (dist > 0.5) {
            allSettled = false;
          } else {
            f.x = targetX;
            f.y = targetY;
            f.rot = targetRot;
            f.scale = 1;
          }
        }

        f.element.style.transform = `translate(${centerX + f.x + window.parallaxX}px, ${centerY + f.y + window.parallaxY}px) rotate(${f.rot}deg) scale(${f.scale})`;
      });

      if (isSettling && allSettled && !document.body.classList.contains('kintsugi')) {
        document.body.classList.add('kintsugi');
        showFinalMessage();
        
        // Trigger natural sunlight sweep via JS
        fragments.forEach(f => {
          const length = f.corePath.getTotalLength();
          const sweepLength = length * 0.5;
          
          const animProps = [
            { strokeDashoffset: length, opacity: 0, offset: 0 },
            { opacity: 1, offset: 0.2 },
            { opacity: 1, offset: 0.8 },
            { strokeDashoffset: -sweepLength, opacity: 0, offset: 1 }
          ];
          const animConfig = {
            duration: 3000,
            delay: 1000 + Math.random() * 2000,
            easing: 'ease-in-out',
            fill: 'forwards'
          };
          
          f.corePath.animate(animProps, animConfig);
          f.glowPath.animate(animProps, animConfig);
        });
      }

      if (document.getElementById('gold-underlay-svg')) {
        const goldSvg = document.getElementById('gold-underlay-svg');
        const targetTransform = `translate(${centerX + window.parallaxX}px, ${centerY + window.parallaxY}px)`;
        if (goldSvg.style.transform !== targetTransform) {
          goldSvg.style.transform = targetTransform;
        }
        if (isSettling && allSettled && document.body.classList.contains('kintsugi')) {
          goldSvg.style.transition = "opacity 3s ease";
          goldSvg.style.opacity = "1";
        } else if (!isSettling) {
          goldSvg.style.opacity = "0";
        }
      }

      updateDrone(tensionFactor);
      updateCursor();

      requestAnimationFrame(animate);
    }

    // Let Go Interaction
    letGoBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (isPrologue) return;

      deselectFragment();
      isSettling = true;
      returningFragment = null;
      letGoBtn.classList.add('hidden');

      // Hide gallery and about buttons
      const headerNavGroup = document.querySelector('.header-nav-group');
      if (headerNavGroup) {
        headerNavGroup.style.transitionDelay = '0s'; // immediate hide
        headerNavGroup.style.opacity = '0';
        headerNavGroup.style.pointerEvents = 'none';
      }

      // "Sigh" effect: outward push before settling
      fragments.forEach(f => {
        // Clear manual target tracking to allow smooth assembling
        f.targetRot = undefined;
        f.targetScale = undefined;

        // Force reset dragging state to prevent stuck pieces
        f.isDragging = false;
        f.hasMoved = false;

        // Imperfections disabled to prevent overlapping
        f.impX = 0;
        f.impY = 0;
        f.impRot = 0;

        f.x += f.tensionDirX * 30;
        f.y += f.tensionDirY * 30;
        f.rot += f.tensionDirRot * 20;
      });

      if (droneGain) {
        const t = audioCtx.currentTime;
        droneGain.gain.cancelScheduledValues(t);
        droneGain.gain.setValueAtTime(droneGain.gain.value, t);
        droneGain.gain.linearRampToValueAtTime(0, t + 4);
      }
    });

    function showFinalMessage() {
      let text = "";
      let quote = "";
      
      const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

      if (editCount > 25) {
        text = "Not everything needs to be fixed.";
        quote = pickRandom([
          "\"Have no fear of perfection — you'll never reach it.\" — Salvador Dalí",
          "\"The object isn't to make art, it's to be in that wonderful state which makes art inevitable.\" — Robert Henri",
          "\"Art is never finished, only abandoned.\" — Leonardo da Vinci"
        ]);
      } else if (editCount > 15) {
        text = "You tried to hold everything together.";
        quote = pickRandom([
          "\"Creativity is allowing yourself to make mistakes. Design is knowing which ones to keep.\" — Scott Adams",
          "\"Design is not just what it looks like and feels like. Design is how it works.\" — Steve Jobs",
          "\"Good design is as little design as possible.\" — Dieter Rams"
        ]);
      } else if (editCount >= 5) {
        text = "You tried, and that is enough.";
        quote = pickRandom([
          "\"An essential aspect of creativity is not being afraid to fail.\" — Edwin Land",
          "\"Ever tried. Ever failed. No matter. Try again. Fail again. Fail better.\" — Samuel Beckett",
          "\"The artist is nothing without the gift, but the gift is nothing without work.\" — Émile Zola"
        ]);
      } else if (editCount > 0) {
        text = "You knew when to stop.";
        quote = pickRandom([
          "\"Simplicity is the ultimate sophistication.\" — Leonardo da Vinci",
          "\"Less is more.\" — Ludwig Mies van der Rohe",
          "\"The details are not the details. They make the design.\" — Charles Eames"
        ]);
      } else {
        text = "Sometimes, it's best to just watch.";
        quote = pickRandom([
          "\"To see we must forget the name of the thing we are looking at.\" — Claude Monet",
          "\"The real voyage of discovery consists not in seeking new landscapes, but in having new eyes.\" — Marcel Proust",
          "\"Drawing is the honesty of the art. There is no possibility of cheating.\" — Salvador Dalí"
        ]);
      }

      finalMessage.innerHTML = `${text}<br><span style="font-size: 0.6em; opacity: 0.7; display: block; margin-top: 10px; font-weight: normal; font-style: italic;">${quote}</span>`;
      finalMessage.classList.add('visible');
      const pac = document.getElementById('post-action-container');
      if (pac) {
        pac.style.transitionDelay = '0s'; // immediate show
        pac.style.display = 'flex';
        pac.classList.add('visible');
      }

      // Re-show gallery and about buttons immediately with quotes (0s delay)
      const headerNavGroup = document.querySelector('.header-nav-group');
      if (headerNavGroup) {
        headerNavGroup.style.transitionDelay = '0s'; // immediate show
        headerNavGroup.style.opacity = '1';
        headerNavGroup.style.pointerEvents = 'auto';
      }
    }

    document.getElementById('try-again-btn').addEventListener('click', () => {
      // Soft reset
      document.getElementById('arrange-tools').style.display = 'none';
      document.getElementById('style-menu-container').style.display = '';
      document.getElementById('style-menu-content').style.display = 'flex';
      document.getElementById('style-arrow-icon').classList.add('expanded');
      editCount = 0;
      isSettling = false;
      isFreeArrange = false;
      isCustomArranged = false;
      moveHistory = [];
      redoHistory = [];
      updateHistoryButtons();
      returningFragment = null;
      time = 0;

      document.body.classList.remove('kintsugi');
      const goldSvg = document.getElementById('gold-underlay-svg');
      if (goldSvg) {
        goldSvg.style.display = '';
        goldSvg.style.transition = 'none';
        goldSvg.style.opacity = '0';
      }
      finalMessage.classList.remove('visible');
      document.getElementById('post-action-container').classList.remove('visible');
      const pac = document.getElementById('post-action-container');
      pac.style.display = '';
      pac.style.transitionDelay = '';
      pac.style.transitionDuration = '';
      document.getElementById('free-arrange-btn').style.display = '';
      letGoBtn.classList.remove('hidden');

      // Hide gallery and about buttons
      const headerNavGroup = document.querySelector('.header-nav-group');
      if (headerNavGroup) {
        headerNavGroup.style.transitionDelay = '0s';
        headerNavGroup.style.opacity = '0';
        headerNavGroup.style.pointerEvents = 'none';
      }

      if (droneGain && audioCtx) {
        droneGain.gain.setTargetAtTime(0, audioCtx.currentTime, 1);
      }


      
      const skinPalette = [
        '#8c7c61', '#5e604f', '#d1c7b7', '#4a4542', '#9e8c78',
        '#b85d43', '#a36b54', '#d9a07b', '#b58e2a', '#703d2b',
        '#2b3e50', '#1c3a27', '#5c6b55', '#d5cbb8', '#426375',
        '#d9c8c0', '#b8c5b9', '#f2cc8f', '#c5bedb', '#3c3c3e',
        '#2a75d3', '#4ca93c', '#eac124', '#d13535', '#e462a3',
        '#ffffff', '#888888', '#222222'
      ];
      const skinColor = skinPalette[Math.floor(Math.random() * skinPalette.length)];
      let skinColor2 = skinPalette[Math.floor(Math.random() * skinPalette.length)];
      if (skinColor === skinColor2) skinColor2 = skinPalette[Math.floor(Math.random() * skinPalette.length)];
      
      const eyeColors = ['#ffffff', '#f0f0f0', '#e8e8e8'];
      const eyeColor = eyeColors[Math.floor(Math.random() * eyeColors.length)];
      const mouthColors = ['#c92a2a', '#1d70b8', '#111111', '#8c1616', '#4b1c73'];
      const mouthColor = mouthColors[Math.floor(Math.random() * mouthColors.length)];

      fragments.forEach((f, index) => {
        const angle = index * ((Math.PI * 2) / pieces.length) * 1.8 + Math.random() * 0.5;
        
        const isMobile = window.innerWidth < 768;
        const baseDist = isMobile ? 60 : 120;
        const distStep = isMobile ? 12 : 20;
        const distRand = isMobile ? 30 : 50;
        const dist = baseDist + index * distStep + Math.random() * distRand;

        f.startX = Math.cos(angle) * dist;
        f.startY = Math.sin(angle) * dist;
        f.startRot = (Math.random() - 0.5) * 360;

        let tdX = f.startX;
        let tdY = f.startY;
        const tMag = Math.hypot(tdX, tdY) || 1;
        tdX /= tMag;
        tdY /= tMag;
        f.tensionDirX = tdX;
        f.tensionDirY = tdY;
        f.tensionDirRot = (Math.random() - 0.5) * 2;

        f.targetScale = 0.6 + Math.random() * 1.0;
        f.scale = 1.5; // reset scale on "Try Again", keep it moderate to prevent lag
        const initialDist = isMobile ? 300 : 2500;
        f.x = f.tensionDirX * initialDist; 
        f.y = f.tensionDirY * initialDist;

        // Generate new random presentation for this try
        const piece = pieces[index];
        f.path = piece.path;
        f.cx = piece.cx;
        f.cy = piece.cy;
        f.type = piece.type;
        f.element.style.transformOrigin = `${f.cx}px ${f.cy}px`;
        
        f.pathElement.setAttribute("d", f.path);
        f.textureOverlay.setAttribute("d", f.path);
        f.clipPathElem.setAttribute("d", f.path);
        f.glowPath.setAttribute("d", f.path);
        f.corePath.setAttribute("d", f.path);
        if (f.hitArea) {
          f.hitArea.setAttribute("d", f.path);
        }
        
        const length = f.corePath.getTotalLength();
        f.glowPath.style.strokeDasharray = `${length} ${length}`;
        f.glowPath.style.strokeDashoffset = length;
        f.corePath.style.strokeDasharray = `${length} ${length}`;
        f.corePath.style.strokeDashoffset = length;
        
        if (f.corePath.getAnimations) {
          f.glowPath.getAnimations().forEach(a => a.cancel());
          f.corePath.getAnimations().forEach(a => a.cancel());
        }
        
        f.impX = 0;
        f.impY = 0;
        f.impRot = 0;
        f.targetRot = undefined;
        f.isDragging = false;
        document.body.classList.remove('is-dragging');

        // Semantic Coloring based on type
        if (piece.type === 'eye') {
          f.color = eyeColor;
        } else if (piece.type === 'mouth') {
          f.color = mouthColor;
        } else if (piece.type === 'nose') {
          f.color = skinColor2;
        } else { // Temples, Jaw, Forehead
          f.color = Math.random() > 0.4 ? skinColor : skinColor2;
        }

        const texturesList = ['none', 'texture-matte', 'texture-glaze', 'texture-grainy', 'texture-speckled', 'texture-cracked', 'texture-gold-dust', 'texture-linen', 'texture-scales', 'texture-ripple'];
        f.texture = texturesList[Math.floor(Math.random() * texturesList.length)];

        f.pathElement.setAttribute("fill", f.color);
        if (f.texture === 'none') {
          f.textureOverlay.setAttribute("fill", "none");
        } else {
          f.textureOverlay.setAttribute("fill", `url(#${f.texture})`);
        }
        f.element.classList.remove('selected');
        drawFeatures(f, f.clippedGroup, "http://www.w3.org/2000/svg");
      });
      selectedFragment = null;
      uiPanel.classList.remove('visible');
    });

    document.getElementById('change-shape-btn').addEventListener('click', () => {
      isFreeArrange = false;
      isCustomArranged = false;
      document.body.classList.remove('kintsugi');
      document.getElementById('free-arrange-btn').style.display = '';
      document.getElementById('arrange-tools').style.display = 'none';
      const goldSvg = document.getElementById('gold-underlay-svg');
      if (goldSvg) {
        goldSvg.style.display = '';
        goldSvg.style.transition = 'none';
        goldSvg.style.opacity = '0';
      }

      // Regenerate the paths and face pattern safely (matching fragments count)
      let newPieces = [];
      do {
        newPieces = generatePieces();
      } while (newPieces.length !== fragments.length);
      pieces = newPieces;
      updateGoldUnderlay(pieces);
      
      const skinPalette = [
        '#8c7c61', '#5e604f', '#d1c7b7', '#4a4542', '#9e8c78',
        '#b85d43', '#a36b54', '#d9a07b', '#b58e2a', '#703d2b',
        '#2b3e50', '#1c3a27', '#5c6b55', '#d5cbb8', '#426375',
        '#d9c8c0', '#b8c5b9', '#f2cc8f', '#c5bedb', '#3c3c3e',
        '#2a75d3', '#4ca93c', '#eac124', '#d13535', '#e462a3',
        '#ffffff', '#888888', '#222222'
      ];
      const skinColor = skinPalette[Math.floor(Math.random() * skinPalette.length)];
      let skinColor2 = skinPalette[Math.floor(Math.random() * skinPalette.length)];
      if (skinColor === skinColor2) skinColor2 = skinPalette[Math.floor(Math.random() * skinPalette.length)];
      
      const eyeColors = ['#ffffff', '#f0f0f0', '#e8e8e8'];
      const eyeColor = eyeColors[Math.floor(Math.random() * eyeColors.length)];
      const mouthColors = ['#c92a2a', '#1d70b8', '#111111', '#8c1616', '#4b1c73'];
      const mouthColor = mouthColors[Math.floor(Math.random() * mouthColors.length)];
      
      fragments.forEach((f, index) => {
        // Update shape paths and face overlay
        const piece = pieces[index];
        f.path = piece.path;
        f.cx = piece.cx;
        f.cy = piece.cy;
        f.type = piece.type;
        f.element.style.transformOrigin = `${f.cx}px ${f.cy}px`;
        
        f.pathElement.setAttribute("d", f.path);
        f.textureOverlay.setAttribute("d", f.path);
        f.clipPathElem.setAttribute("d", f.path);
        f.glowPath.setAttribute("d", f.path);
        f.corePath.setAttribute("d", f.path);
        
        const length = f.corePath.getTotalLength();
        f.glowPath.style.strokeDasharray = `${length} ${length}`;
        f.glowPath.style.strokeDashoffset = length;
        f.corePath.style.strokeDasharray = `${length} ${length}`;
        f.corePath.style.strokeDashoffset = length;
        
        if (f.corePath.getAnimations) {
          f.glowPath.getAnimations().forEach(a => a.cancel());
          f.corePath.getAnimations().forEach(a => a.cancel());
        }
        
        // Instant update to new target coordinates (remain assembled)
        const gapScale = 0.03;
        f.x = f.basex + f.cx * gapScale;
        f.y = f.basey + f.cy * gapScale;
        f.rot = f.baseRot;
        f.scale = 1;

        // Imperfections disabled to prevent overlapping
        f.impX = 0;
        f.impY = 0;
        f.impRot = 0;
        f.targetRot = undefined;
        f.isDragging = false;
        f.hasMoved = false;
        
        // Semantic Coloring based on type
        if (piece.type === 'eye') {
          f.color = eyeColor;
        } else if (piece.type === 'mouth') {
          f.color = mouthColor;
        } else if (piece.type === 'nose') {
          f.color = skinColor2;
        } else { // Cheeks, Forehead, Chin
          f.color = Math.random() > 0.4 ? skinColor : skinColor2;
        }
        f.pathElement.setAttribute("fill", f.color);
        drawFeatures(f, f.clippedGroup, "http://www.w3.org/2000/svg");
      });
    });

    document.getElementById('save-btn').innerText = "SAVE (PNG)";

    document.getElementById('free-arrange-btn').addEventListener('click', () => {
      isFreeArrange = true;
      isCustomArranged = true;
      moveHistory = [];
      redoHistory = [];
      updateHistoryButtons();
      
      // Prevent fragments from jumping back to their initial floating scales/rotations
      fragments.forEach(f => {
        f.targetScale = f.scale;
        f.targetRot = f.rot;
      });

      const pac = document.getElementById('post-action-container');
      if (pac) {
        pac.style.transitionDelay = '0s'; // immediate hide
        pac.classList.remove('visible');
      }
      document.getElementById('arrange-tools').style.display = 'block';

      // Hide gallery and about buttons when entering rearrange
      const headerNavGroup = document.querySelector('.header-nav-group');
      if (headerNavGroup) {
        headerNavGroup.style.transitionDelay = '0s'; // immediate hide
        headerNavGroup.style.opacity = '0';
        headerNavGroup.style.pointerEvents = 'none';
      }

      document.getElementById('style-menu-container').style.display = '';
      if (window.innerWidth < 768) {
        document.getElementById('style-menu-content').style.display = 'none';
        document.getElementById('style-arrow-icon').classList.remove('expanded');
      } else {
        document.getElementById('style-menu-content').style.display = 'flex';
        document.getElementById('style-arrow-icon').classList.add('expanded');
      }
      const gestureHint = document.getElementById('gesture-hint');
      if (gestureHint) {
        gestureHint.style.display = 'block';
        const isMobile = window.innerWidth < 768;
        if (isMobile) {
          gestureHint.innerHTML = `
            <div class="controls-container">
              <div class="controls-title">CONTROLS</div>
              <div class="controls-grid">
                <div class="control-row">
                  <div class="control-icon-desc">👆 Drag</div>
                  <div class="control-info-sub">Move object</div>
                </div>
                <div class="control-row">
                  <div class="control-icon-desc">✌️ Pinch</div>
                  <div class="control-info-sub">Scale</div>
                </div>
                <div class="control-row">
                  <div class="control-icon-desc">🔄 Twist</div>
                  <div class="control-info-sub">Rotate</div>
                </div>
              </div>
            </div>
          `;
        } else {
          gestureHint.innerHTML = `
            <div class="controls-container">
              <div class="controls-title">CONTROLS</div>
              <div class="controls-grid">
                <div class="control-row">
                  <div class="control-icon-desc">🖱 Drag</div>
                  <div class="control-info-sub">Move object</div>
                </div>
                <div class="control-row">
                  <div class="control-icon-desc">⌨ Z / X</div>
                  <div class="control-info-sub">Rotate</div>
                </div>
                <div class="control-row">
                  <div class="control-icon-desc">⌨ A / S</div>
                  <div class="control-info-sub">Scale</div>
                </div>
              </div>
            </div>
          `;
        }
      }
      
      const goldSvg = document.getElementById('gold-underlay-svg');
      if (goldSvg) {
        goldSvg.style.display = 'none';
      }
      
      const finalMessage = document.getElementById('final-message');
      if (finalMessage) {
        finalMessage.classList.remove('visible');
      }
    });

    function updateHistoryButtons() {
      const undoBtn = document.getElementById('return-btn');
      const redoBtn = document.getElementById('redo-btn');
      if (undoBtn) {
        if (moveHistory.length > 0) {
          undoBtn.classList.remove('disabled');
        } else {
          undoBtn.classList.add('disabled');
        }
      }
      if (redoBtn) {
        if (redoHistory.length > 0) {
          redoBtn.classList.remove('disabled');
        } else {
          redoBtn.classList.add('disabled');
        }
      }
    }

    function undoAction() {
      if (moveHistory.length > 0) {
        const lastMove = moveHistory.pop();
        
        // Save current state for redo
        const redoMove = {
          frag: lastMove.frag,
          type: lastMove.type
        };

        if (lastMove.type === 'color') {
          redoMove.oldColor = lastMove.frag.color;
          lastMove.frag.color = lastMove.oldColor;
          lastMove.frag.pathElement.setAttribute("fill", lastMove.oldColor);
        } else if (lastMove.type === 'texture') {
          redoMove.oldTexture = lastMove.frag.texture;
          lastMove.frag.texture = lastMove.oldTexture;
          if (lastMove.oldTexture === 'none') {
            lastMove.frag.textureOverlay.setAttribute("fill", "none");
          } else {
            lastMove.frag.textureOverlay.setAttribute("fill", `url(#${lastMove.oldTexture})`);
          }
        } else {
          // spatial
          redoMove.oldX = lastMove.frag.x;
          redoMove.oldY = lastMove.frag.y;
          redoMove.oldRot = lastMove.frag.targetRot !== undefined ? lastMove.frag.targetRot : lastMove.frag.rot;
          redoMove.oldScale = lastMove.frag.targetScale !== undefined ? lastMove.frag.targetScale : lastMove.frag.scale;

          lastMove.frag.x = lastMove.oldX;
          lastMove.frag.y = lastMove.oldY;
          lastMove.frag.targetRot = lastMove.oldRot;
          lastMove.frag.targetScale = lastMove.oldScale;
        }

        redoHistory.push(redoMove);
        updateHistoryButtons();
      }
    }

    function redoAction() {
      if (redoHistory.length > 0) {
        const lastRedo = redoHistory.pop();

        // Save current state for undo
        const undoMove = {
          frag: lastRedo.frag,
          type: lastRedo.type
        };

        if (lastRedo.type === 'color') {
          undoMove.oldColor = lastRedo.frag.color;
          lastRedo.frag.color = lastRedo.oldColor;
          lastRedo.frag.pathElement.setAttribute("fill", lastRedo.oldColor);
        } else if (lastRedo.type === 'texture') {
          undoMove.oldTexture = lastRedo.frag.texture;
          lastRedo.frag.texture = lastRedo.oldTexture;
          if (lastRedo.oldTexture === 'none') {
            lastRedo.frag.textureOverlay.setAttribute("fill", "none");
          } else {
            lastRedo.frag.textureOverlay.setAttribute("fill", `url(#${lastRedo.oldTexture})`);
          }
        } else {
          // spatial
          undoMove.oldX = lastRedo.frag.x;
          undoMove.oldY = lastRedo.frag.y;
          undoMove.oldRot = lastRedo.frag.targetRot !== undefined ? lastRedo.frag.targetRot : lastRedo.frag.rot;
          undoMove.oldScale = lastRedo.frag.targetScale !== undefined ? lastRedo.frag.targetScale : lastRedo.frag.scale;

          lastRedo.frag.x = lastRedo.oldX;
          lastRedo.frag.y = lastRedo.oldY;
          lastRedo.frag.targetRot = lastRedo.oldRot;
          lastRedo.frag.targetScale = lastRedo.oldScale;
        }

        moveHistory.push(undoMove);
        updateHistoryButtons();
      }
    }

    document.getElementById('return-btn').addEventListener('click', undoAction);

    const redoBtn = document.getElementById('redo-btn');
    if (redoBtn) {
      redoBtn.addEventListener('click', redoAction);
    }

    document.getElementById('done-arrange-btn').addEventListener('click', () => {
      isFreeArrange = false;
      uiPanel.classList.remove('visible');
      setTimeout(() => {
        if (!isFreeArrange) {
          document.getElementById('arrange-tools').style.display = 'none';
          const gestureHint = document.getElementById('gesture-hint');
          if (gestureHint) gestureHint.style.display = 'none';
          document.getElementById('style-menu-container').style.display = '';
          document.getElementById('style-menu-content').style.display = 'flex';
          document.getElementById('style-arrow-icon').classList.add('expanded');
        }
      }, 700);
      deselectFragment();
      
      showFinalMessage();
    });

    document.getElementById('toggle-style-btn').addEventListener('click', () => {
      const content = document.getElementById('style-menu-content');
      const icon = document.getElementById('style-arrow-icon');
      const gestureHint = document.getElementById('gesture-hint');
      if (content.style.display === 'none') {
        content.style.display = 'flex';
        icon.classList.add('expanded');
        if (isFreeArrange && gestureHint) {
          gestureHint.style.opacity = '0';
        }
        setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
      } else {
        content.style.display = 'none';
        icon.classList.remove('expanded');
        if (isFreeArrange && gestureHint) {
          gestureHint.style.opacity = '1';
        }
      }
    });



    function generateTitle() {
      const adjs = ["Weeping", "Geometric", "Blue", "Shattered", "Silent", "Cubist", "Abstract", "Fragmented", "Angular"];
      const nouns = ["Woman", "Musician", "Face", "Portrait", "Figure", "Dreamer", "Vessel", "Soul"];
      const suffixes = ["No. 42", "in Red", "with Guitar", "I", "II", "III", "Opus 7"];
      
      const a = adjs[Math.floor(Math.random() * adjs.length)];
      const n = nouns[Math.floor(Math.random() * nouns.length)];
      const s = suffixes[Math.floor(Math.random() * suffixes.length)];
      
      return Math.random() > 0.3 ? `Portrait of a ${a} ${n}` : `The ${a} ${n}, ${s}`;
    }

    function generateVesselBlob(userTitle) {
      return new Promise((resolve, reject) => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const bg = getComputedStyle(document.body).backgroundColor;
        const svgFilters = document.getElementById('filter-defs').innerHTML;

        let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
          ${svgFilters}
          <defs>
            <filter id="bgNoise">
              <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/>
            </filter>
          </defs>
          <rect width="100%" height="100%" fill="${bg}"/>
          <rect width="100%" height="100%" filter="url(#bgNoise)" opacity="0.04"/>
          
          <!-- Gold Underlay Export -->
          <g transform="translate(${w / 2}, ${h / 2})">
            ${(!isCustomArranged && document.getElementById('gold-underlay-svg') && document.getElementById('gold-underlay-svg').style.display !== 'none') ? document.getElementById('gold-underlay-svg').innerHTML : ''}
          </g>`;

        fragments.forEach(f => {
          const clipId = `save-clip-${f.id}`;
          const textureOverlayString = f.texture !== 'none' ? `<path d="${f.path}" fill="url(#${f.texture})" pointer-events="none" />` : '';
          
          svgContent += `
            <g transform="translate(${w / 2 + f.x + f.cx}, ${h / 2 + f.y + f.cy}) rotate(${f.rot}) scale(${f.scale}) translate(${-f.cx}, ${-f.cy})">
              <!-- Fragment Content -->
              <clipPath id="${clipId}">
                <path d="${f.path}" />
              </clipPath>
              <g clip-path="url(#${clipId})">
                <path d="${f.path}" fill="${f.color}" />
                ${textureOverlayString}
                ${f.featureSvgString || ''}
              </g>
            </g>`;
        });

        if (userTitle && userTitle.trim().length > 0) {
          svgContent += `<text x="${w / 2}" y="${h - 60}" font-family="'Clash Grotesk', 'Space Grotesk', Helvetica, sans-serif" font-size="14" font-weight="400" letter-spacing="6" fill="#5a5854" text-anchor="middle">${userTitle.trim().toUpperCase()}</text>`;
        }

        svgContent += `</svg>`;

        const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);

          canvas.toBlob((pngBlob) => {
            URL.revokeObjectURL(url);
            if (pngBlob) {
              resolve(pngBlob);
            } else {
              reject(new Error("Canvas toBlob failed"));
            }
          }, 'image/png');
        };
        img.onerror = (e) => {
          URL.revokeObjectURL(url);
          reject(e);
        };
        img.src = url;
      });
    }

    document.getElementById('save-btn').addEventListener('click', () => {
      const suggestedTitle = generateTitle();
      const userTitle = prompt("Name your artwork:", suggestedTitle);
      
      if (userTitle === null) return; // User cancelled save

      generateVesselBlob(userTitle).then(pngBlob => {
        const pngUrl = URL.createObjectURL(pngBlob);
        const a = document.createElement('a');
        a.href = pngUrl;
        a.download = 'imperfect_vessel.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(pngUrl);
      }).catch(err => {
        console.error("Save error:", err);
        alert("Failed to save image.");
      });
    });

    // -------------------------------------------------------------
    // Firebase & Mock Service Layer for Gallery of Flaws
    // -------------------------------------------------------------
    const FIREBASE_CONFIG = {
      apiKey: "AIzaSyBz1sS-xPhk5w141qI9jk4_oiFqIDCUz88",
      authDomain: "imperfect-vessel.firebaseapp.com",
      projectId: "imperfect-vessel",
      storageBucket: "imperfect-vessel.firebasestorage.app",
      messagingSenderId: "663544579803",
      appId: "1:663544579803:web:be1503f41176b1cc372efe",
      measurementId: "G-RVMPLEP4VP"
    };

    class MockDBService {
      constructor() {
        console.log("Gallery of Flaws: Operating in Mock Mode (using localStorage).");
        this.storageKey = "imperfect_vessel_gallery";
        this.likesKey = "imperfect_vessel_likes";
        this._initMockData();
      }

      _initMockData() {
        let items = [];
        try {
          items = JSON.parse(localStorage.getItem(this.storageKey) || "[]");
        } catch (e) {
          items = [];
        }
        
        // Filter out legacy mock items immediately
        const filteredItems = items.filter(item => item.id !== "mock_vessel_1" && item.id !== "mock_vessel_2");
        if (items.length !== filteredItems.length || !localStorage.getItem(this.storageKey)) {
          localStorage.setItem(this.storageKey, JSON.stringify(filteredItems));
        }
      }

      async publishVessel(title, creatorName, blob, vesselData) {
        const items = JSON.parse(localStorage.getItem(this.storageKey) || "[]");
        const reader = new FileReader();
        const dataUrl = await new Promise(resolve => {
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
        const newItem = {
          id: "local_" + Math.random().toString(36).substr(2, 9),
          title: title || "UNTITLED VESSEL",
          creatorName: creatorName || "ANONYMOUS",
          creatorId: "local_user",
          likes: 0,
          createdAt: new Date().toISOString(),
          imageUrl: dataUrl,
          vesselData: vesselData
        };
        items.unshift(newItem);
        localStorage.setItem(this.storageKey, JSON.stringify(items));
        return newItem;
      }

      async fetchGallery(sortBy = "newest") {
        let items = JSON.parse(localStorage.getItem(this.storageKey) || "[]");
        if (sortBy === "popular") {
          items.sort((a, b) => b.likes - a.likes);
        } else {
          items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
        return items;
      }

      async likeVessel(vesselId) {
        const items = JSON.parse(localStorage.getItem(this.storageKey) || "[]");
        const item = items.find(i => i.id === vesselId);
        if (!item) return false;
        
        const likesList = JSON.parse(localStorage.getItem(this.likesKey) || "[]");
        if (likesList.includes(vesselId)) {
          return false;
        }
        
        item.likes += 1;
        likesList.push(vesselId);
        localStorage.setItem(this.likesKey, JSON.stringify(likesList));
        localStorage.setItem(this.storageKey, JSON.stringify(items));
        return true;
      }
    }

    class FirebaseDBService {
      constructor(config, auth, db, storage, authModule, dbModule, storageModule) {
        this.config = config;
        this.auth = auth;
        this.db = db;
        this.storage = storage;
        this.authModule = authModule;
        this.dbModule = dbModule;
        this.storageModule = storageModule;
        this.currentUser = null;
        this._initAuth();
      }

      async _initAuth() {
        try {
          const userCredential = await this.authModule.signInAnonymously(this.auth);
          this.currentUser = userCredential.user;
          console.log("Firebase: Authenticated anonymously as:", this.currentUser.uid);
        } catch (error) {
          console.error("Firebase auth initialization failed:", error);
        }
      }

      async publishVessel(title, creatorName, blob, vesselData) {
        if (!this.currentUser) {
          throw new Error("User not authenticated.");
        }
        
        const galleryRef = this.dbModule.collection(this.db, "gallery");
        const newDocRef = this.dbModule.doc(galleryRef);
        const vesselId = newDocRef.id;

        // Upload PNG Blob
        const storageRef = this.storageModule.ref(this.storage, `gallery/${vesselId}.png`);
        await this.storageModule.uploadBytes(storageRef, blob);
        const imageUrl = await this.storageModule.getDownloadURL(storageRef);

        // Save metadata and coordinates
        const itemData = {
          id: vesselId,
          title: title || "UNTITLED VESSEL",
          creatorName: creatorName || "ANONYMOUS",
          creatorId: this.currentUser.uid,
          likes: 0,
          likedBy: [],
          createdAt: new Date().toISOString(),
          imageUrl: imageUrl,
          vesselData: vesselData
        };

        await this.dbModule.setDoc(newDocRef, itemData);
        return itemData;
      }

      async fetchGallery(sortBy = "newest") {
        const galleryRef = this.dbModule.collection(this.db, "gallery");
        
        let q;
        if (sortBy === "popular") {
          q = this.dbModule.query(galleryRef, this.dbModule.orderBy("likes", "desc"));
        } else {
          q = this.dbModule.query(galleryRef, this.dbModule.orderBy("createdAt", "desc"));
        }
        
        const snap = await this.dbModule.getDocs(q);
        const items = [];
        snap.forEach(doc => {
          items.push(doc.data());
        });
        return items;
      }

      async likeVessel(vesselId) {
        if (!this.currentUser) return false;
        const docRef = this.dbModule.doc(this.db, "gallery", vesselId);
        const docSnap = await this.dbModule.getDoc(docRef);
        if (!docSnap.exists()) return false;

        const data = docSnap.data();
        if (data.likedBy && data.likedBy.includes(this.currentUser.uid)) {
          return false;
        }

        await this.dbModule.updateDoc(docRef, {
          likes: this.dbModule.increment(1),
          likedBy: this.dbModule.arrayUnion(this.currentUser.uid)
        });
        return true;
      }
    }

    let dbService;
    async function initDatabaseService() {
      const isFirebaseConfigured = FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.apiKey.trim().length > 0 && !FIREBASE_CONFIG.apiKey.includes("YOUR_");

      if (isFirebaseConfigured) {
        try {
          console.log("Firebase: Loading CDN modules...");
          const [appModule, authModule, dbModule, storageModule] = await Promise.all([
            import("https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js"),
            import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js"),
            import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js"),
            import("https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js")
          ]);

          const app = appModule.initializeApp(FIREBASE_CONFIG);
          const auth = authModule.getAuth(app);
          const db = dbModule.getFirestore(app);
          const storage = storageModule.getStorage(app);

          dbService = new FirebaseDBService(FIREBASE_CONFIG, auth, db, storage, authModule, dbModule, storageModule);
        } catch (err) {
          console.error("Failed to initialize Firebase, falling back to mock database:", err);
          dbService = new MockDBService();
        }
      } else {
        dbService = new MockDBService();
      }
    }

    // Trigger Service Init
    initDatabaseService();

    // -------------------------------------------------------------
    // Gallery & Publish Modal Handlers
    // -------------------------------------------------------------
    const publishModal = document.getElementById('publish-modal');
    const galleryOverlay = document.getElementById('gallery-overlay');
    const galleryGrid = document.getElementById('gallery-grid');
    const publishBtn = document.getElementById('publish-btn');
    const galleryBtn = document.getElementById('gallery-btn');

    // Open Publish Modal
    if (publishBtn) {
      publishBtn.addEventListener('click', () => {
        if (typeof playClink === 'function') playClink();
        document.getElementById('publish-art-title').value = generateTitle();
        document.getElementById('publish-creator-name').value = localStorage.getItem("im_creator_name") || "";
        publishModal.classList.add('visible');
      });
    }

    // Cancel Publish
    document.getElementById('publish-cancel-btn').addEventListener('click', () => {
      if (typeof playClink === 'function') playClink();
      publishModal.classList.remove('visible');
    });

    // Close Gallery
    document.getElementById('gallery-close-btn').addEventListener('click', () => {
      if (typeof playClink === 'function') playClink();
      galleryOverlay.classList.remove('visible');
    });

    // Toggle Filters
    let currentFilter = "newest";
    const filterNew = document.getElementById('gallery-filter-new');
    const filterPopular = document.getElementById('gallery-filter-popular');

    if (filterNew && filterPopular) {
      filterNew.addEventListener('click', () => {
        if (typeof playClink === 'function') playClink();
        filterNew.classList.add('active');
        filterPopular.classList.remove('active');
        currentFilter = "newest";
        loadGalleryItems();
      });

      filterPopular.addEventListener('click', () => {
        if (typeof playClink === 'function') playClink();
        filterPopular.classList.add('active');
        filterNew.classList.remove('active');
        currentFilter = "popular";
        loadGalleryItems();
      });
    }

    // Submit Publish
    document.getElementById('publish-submit-btn').addEventListener('click', async () => {
      if (typeof playClink === 'function') playClink();
      
      const title = document.getElementById('publish-art-title').value.trim();
      const creatorName = document.getElementById('publish-creator-name').value.trim();
      
      if (!title) {
        alert("Please enter a title for your artwork.");
        return;
      }

      // Save creator name preference
      if (creatorName) {
        localStorage.setItem("im_creator_name", creatorName);
      }

      const submitBtn = document.getElementById('publish-submit-btn');
      submitBtn.innerText = "PUBLISHING...";
      submitBtn.disabled = true;

      try {
        const pngBlob = await generateVesselBlob(title);
        
        // Structure coordinates
        const vesselData = {
          backgroundColor: getComputedStyle(document.body).backgroundColor,
          fragments: fragments.map(f => ({
            id: f.id,
            x: f.x,
            y: f.y,
            rot: f.rot,
            scale: f.scale,
            color: f.color,
            texture: f.texture,
            path: f.path,
            featureSvgString: f.featureSvgString || ""
          }))
        };

        await dbService.publishVessel(title, creatorName, pngBlob, vesselData);
        
        // Hide publish modal
        publishModal.classList.remove('visible');
        
        // Start Publish Ritual Sequence
        // 1. Fade out active page UI elements
        const postActionContainer = document.getElementById('post-action-container');
        const headerNavGroup = document.querySelector('.header-nav-group');
        const siteLogo = document.getElementById('site-logo');
        const finalMessage = document.getElementById('final-message');
        
        if (postActionContainer) {
          postActionContainer.style.opacity = '0';
          postActionContainer.style.pointerEvents = 'none';
        }
        if (headerNavGroup) {
          headerNavGroup.style.opacity = '0';
          headerNavGroup.style.pointerEvents = 'none';
        }
        if (siteLogo) {
          siteLogo.style.opacity = '0';
          siteLogo.style.pointerEvents = 'none';
        }
        if (finalMessage) {
          finalMessage.style.opacity = '0';
          finalMessage.style.pointerEvents = 'none';
        }

        // 2. Select and show emotional message
        const messages = [
          "Every crack deserves a place.",
          "Your vessel has found a home."
        ];
        const randomMsg = messages[Math.floor(Math.random() * messages.length)];
        const ritualOverlay = document.getElementById('ritual-overlay');
        if (ritualOverlay) {
          const msgEl = ritualOverlay.querySelector('.ritual-message');
          if (msgEl) msgEl.innerText = randomMsg;
          
          // Fade in message after modal hides
          setTimeout(() => {
            ritualOverlay.classList.add('visible');
          }, 300);
        }

        // 3. Pause, then transition to Gallery
        setTimeout(() => {
          if (ritualOverlay) {
            ritualOverlay.classList.remove('visible');
          }
          
          // Open Gallery overlay smoothly
          const galleryOverlay = document.getElementById('gallery-overlay');
          if (galleryOverlay) {
            loadGalleryItems();
            galleryOverlay.classList.add('visible');
          }
          
          // 4. Restore main UI styles behind the scenes
          setTimeout(() => {
            if (postActionContainer) {
              postActionContainer.style.opacity = '';
              postActionContainer.style.pointerEvents = '';
            }
            if (headerNavGroup) {
              headerNavGroup.style.opacity = '';
              headerNavGroup.style.pointerEvents = '';
            }
            if (siteLogo) {
              siteLogo.style.opacity = '';
              siteLogo.style.pointerEvents = '';
            }
            if (finalMessage) {
              finalMessage.style.opacity = '';
              finalMessage.style.pointerEvents = '';
            }
          }, 1000);
        }, 2600);
      } catch (err) {
        console.error("Publishing error:", err);
        alert("Failed to publish artwork. Please verify your connection.");
      } finally {
        submitBtn.innerText = "PUBLISH";
        submitBtn.disabled = false;
      }
    });

    // Fetch and Render Gallery items
    async function loadGalleryItems() {
      galleryGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; opacity: 0.5; font-size: 14px;">Loading gallery...</div>`;
      try {
        const items = await dbService.fetchGallery(currentFilter);
        galleryGrid.innerHTML = "";
        
        if (items.length === 0) {
          galleryGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; opacity: 0.5; font-size: 14px;">The gallery is currently empty. Be the first to publish!</div>`;
          return;
        }

        items.forEach((item, index) => {
          const card = document.createElement('div');
          card.className = 'gallery-card';
          card.style.animationDelay = `${index * 0.08}s`;
          
          const escapedTitle = (item.title || "Untitled").replace(/"/g, '&quot;');
          const escapedCreator = (item.creatorName || "Anonymous").replace(/"/g, '&quot;');
          
          // Format date
          let dateStr = "";
          if (item.createdAt) {
            const d = new Date(item.createdAt.seconds ? item.createdAt.seconds * 1000 : item.createdAt);
            dateStr = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
          }

          card.innerHTML = `
            ${dateStr ? `<p class="card-date">${dateStr}</p>` : ''}
            <div class="card-preview-container">
              <img class="card-preview" src="${item.imageUrl}" alt="${escapedTitle}" loading="lazy">
            </div>
            <div class="card-info">
              <h3 class="card-title">${escapedTitle}</h3>
              <p class="card-creator">${escapedCreator}</p>
            </div>
          `;

          galleryGrid.appendChild(card);
        });



      } catch (err) {
        console.error("Failed to load gallery items:", err);
        galleryGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; opacity: 0.5; font-size: 14px; color: red;">Failed to load gallery cards.</div>`;
      }
    }

    // Remix Loader Function
    function loadVesselState(vesselData) {
      if (!vesselData || !vesselData.fragments) return;
      
      // Close gallery
      if (galleryOverlay) {
        galleryOverlay.classList.remove('visible');
      }

      // Reset state variables
      isSettling = false;
      isFreeArrange = true;
      isCustomArranged = true;
      
      document.getElementById('free-arrange-btn').style.display = 'none';
      document.getElementById('arrange-tools').style.display = 'block';
      
      // Show action buttons container
      document.getElementById('post-action-container').classList.add('visible');
      document.getElementById('let-go-btn').classList.add('hidden');
      
      const goldSvg = document.getElementById('gold-underlay-svg');
      if (goldSvg) {
        goldSvg.style.display = 'none';
      }
      
      const finalMessage = document.getElementById('final-message');
      if (finalMessage) {
        finalMessage.classList.remove('visible');
        finalMessage.innerHTML = '';
      }

      editCount = 5; // Allow styling adjustments immediately

      vesselData.fragments.forEach((savedFrag) => {
        const f = fragments.find(frag => frag.id === savedFrag.id);
        if (f) {
          f.x = savedFrag.x;
          f.y = savedFrag.y;
          f.rot = savedFrag.rot;
          f.scale = savedFrag.scale;
          
          f.targetRot = savedFrag.rot;
          f.targetScale = savedFrag.scale;
          
          f.color = savedFrag.color;
          f.texture = savedFrag.texture;
          
          // Re-apply path if shape varies
          if (savedFrag.path) {
            f.path = savedFrag.path;
            f.pathElement.setAttribute("d", f.path);
            f.textureOverlay.setAttribute("d", f.path);
            f.clipPathElem.setAttribute("d", f.path);
            if (f.glowPath) f.glowPath.setAttribute("d", f.path);
            if (f.corePath) f.corePath.setAttribute("d", f.path);
          }

          f.pathElement.setAttribute("fill", f.color);
          
          if (f.texture === 'none') {
            f.textureOverlay.setAttribute("fill", "none");
          } else {
            f.textureOverlay.setAttribute("fill", `url(#${f.texture})`);
          }
          
          // Draw internal features
          drawFeatures(f, f.clippedGroup, "http://www.w3.org/2000/svg");
          
          f.startX = f.x;
          f.startY = f.y;
          f.startRot = f.rot;
          f.tensionDirX = 0;
          f.tensionDirY = 0;
        }
      });
      
      deselectFragment();
    }

    // Open Gallery Handler
    if (galleryBtn) {
      galleryBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof playClink === 'function') playClink();
        galleryOverlay.classList.add('visible');
        loadGalleryItems();
      });
    }

    // Escape Key Handler for Overlays
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (publishModal && publishModal.classList.contains('visible')) {
          if (typeof playClink === 'function') playClink();
          publishModal.classList.remove('visible');
        }
        if (galleryOverlay && galleryOverlay.classList.contains('visible')) {
          if (typeof playClink === 'function') playClink();
          galleryOverlay.classList.remove('visible');
        }
      }
    });



    // Start loop
    animate();

    // About Overlay Interaction
    const aboutBtn = document.getElementById('about-btn');
    const aboutOverlay = document.getElementById('about-overlay');
    const aboutCloseBtn = document.getElementById('about-close-btn');

    if (aboutBtn && aboutOverlay && aboutCloseBtn) {
      aboutBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof playClink === 'function') playClink();
        aboutOverlay.classList.add('visible');
      });

      aboutCloseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof playClink === 'function') playClink();
        aboutOverlay.classList.remove('visible');
      });
      
      // Close overlay on Escape key press
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && aboutOverlay.classList.contains('visible')) {
          if (typeof playClink === 'function') playClink();
          aboutOverlay.classList.remove('visible');
        }
      });
    }

