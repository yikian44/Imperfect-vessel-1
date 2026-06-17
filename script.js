    let editCount = 0;
    let isSettling = false;
    let isFreeArrange = false;
    let isCustomArranged = false;
    let moveHistory = [];
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
      const counterElem = document.getElementById('ll-counter');
      const progressBar = document.getElementById('ll-progress-bar');
      
      let progress = 0;
      let startTime = performance.now();
      
      function animateLoader(time) {
        const elapsed = time - startTime;
        const duration = 1800; // 1.8 seconds
        let t = Math.min(elapsed / duration, 1.0);
        
        // Ease out quadratic: t * (2 - t)
        progress = Math.floor(t * (2 - t) * 100);
        
        counterElem.innerText = progress + '%';
        progressBar.style.transform = `scaleX(${progress / 100})`;
        
        if (elapsed < duration) {
          requestAnimationFrame(animateLoader);
        } else {
          counterElem.innerText = '100%';
          progressBar.style.transform = 'scaleX(1)';
          
          setTimeout(() => {
            loader.classList.add('slide-up');
            
            setTimeout(() => {
              loader.style.display = 'none';
              
              const text1 = document.getElementById('prologue-text-1');
              const text2 = document.getElementById('prologue-text-2');
              const prologue = document.getElementById('prologue');
              
              if (text1 && text2 && prologue) {
                setTimeout(() => { text1.classList.add('visible'); }, 100);
                
                setTimeout(() => {
                  text2.style.display = 'block';
                  setTimeout(() => { text2.classList.add('visible'); }, 50);
                }, 1500);

                setTimeout(() => {
                  prologue.style.opacity = '0';
                  isPrologue = false;
                  setTimeout(() => { prologue.style.display = 'none'; }, 1000);
                }, 3500);
              } else {
                isPrologue = false;
              }
            }, 1000); 
          }, 300); // dramatic pause at 100%
        }
      }
      
      requestAnimationFrame(animateLoader);
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
      "Cubist Vibrant": [
        '#2a75d3', '#4ca93c', '#eac124', '#d13535', '#e462a3'
      ],
      "Monochrome": [
        '#ffffff', '#888888', '#222222'
      ]
    };

    colorOptions.style.display = 'flex';
    colorOptions.style.flexDirection = 'column';
    colorOptions.style.flexWrap = 'nowrap'; // Prevent wrapping into multiple columns
    colorOptions.style.alignItems = 'flex-start';
    colorOptions.style.gap = '12px';

    // Populate buttons by category
    Object.entries(colorCategories).forEach(([category, colors]) => {
      const group = document.createElement('div');
      group.style.display = 'flex';
      group.style.flexDirection = 'column';
      group.style.gap = '6px';
      group.style.width = '100%';
      
      const label = document.createElement('div');
      label.innerText = category;
      label.style.fontSize = '9px';
      label.style.color = 'var(--text-color)';
      label.style.opacity = '0.6';
      label.style.letterSpacing = '1px';
      label.style.textTransform = 'uppercase';
      
      const row = document.createElement('div');
      row.className = 'options-row';
      row.style.gap = '10px';
      row.style.maxWidth = '100%';
      
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
      const styleType = Math.floor(Math.random() * 4);
      let scaleX = 1.0;
      let scaleY = 1.0;
      
      if (styleType === 1) { 
        // Type 1: Wide & Blocky
        scaleX = 1.6; scaleY = 0.8;
      } else if (styleType === 2) { 
        // Type 2: Elongated & Narrow
        scaleX = 0.7; scaleY = 1.15;
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

        return { path: pathStr, type: poly.type, cx, cy };
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
    
    // Initial Semantic Colors - Vibrant Picasso Cubist Palette
    const skinPalette = ['#1d70b8', '#3e9c35', '#e8b923', '#c92a2a', '#7c2ac9', '#e05c9f', '#1e9e92', '#d95b27'];
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
      
      const texturesList = ['none', 'texture-matte', 'texture-glaze', 'texture-grainy', 'texture-speckled'];
      const initialTexture = texturesList[Math.floor(Math.random() * texturesList.length)];

      return {
        id: index,
        path: piece.path,
        cx: piece.cx,
        cy: piece.cy,
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
        const eyeStyle = Math.floor(Math.random() * 4);
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
        } else {
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
        }
      } else if (frag.type === 'nose') {
        const noseStyle = Math.floor(Math.random() * 3);
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
        } else {
          // Style 2: Sharp triangle outline
          const tri = document.createElementNS(svgNS, "polygon");
          tri.setAttribute("points", `${frag.cx},${frag.cy - 25} ${frag.cx - 20},${frag.cy + 25} ${frag.cx + 20},${frag.cy + 25}`);
          tri.setAttribute("stroke", "#111111");
          tri.setAttribute("stroke-width", "5");
          tri.setAttribute("fill", "none");
          tri.setAttribute("stroke-linejoin", "round");
          
          featureGroup.appendChild(tri);
          frag.featureSvgString = `<polygon points="${frag.cx},${frag.cy - 25} ${frag.cx - 20},${frag.cy + 25} ${frag.cx + 20},${frag.cy + 25}" stroke="#111111" stroke-width="5" fill="none" stroke-linejoin="round" />`;
        }
      } else if (frag.type === 'mouth') {
        const mouthStyle = Math.floor(Math.random() * 4);
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
        } else {
          // Style 3: Squiggly line
          const squiggle = document.createElementNS(svgNS, "path");
          squiggle.setAttribute("d", `M ${frag.cx - 30} ${frag.cy} Q ${frag.cx - 15} ${frag.cy - 15} ${frag.cx} ${frag.cy} T ${frag.cx + 30} ${frag.cy}`);
          squiggle.setAttribute("stroke", "#111111");
          squiggle.setAttribute("stroke-width", "6");
          squiggle.setAttribute("fill", "none");
          squiggle.setAttribute("stroke-linecap", "round");
          featureGroup.appendChild(squiggle);
          frag.featureSvgString = `<path d="M ${frag.cx - 30} ${frag.cy} Q ${frag.cx - 15} ${frag.cy - 15} ${frag.cx} ${frag.cy} T ${frag.cx + 30} ${frag.cy}" stroke="#111111" stroke-width="6" fill="none" stroke-linecap="round" />`;
        }
      }

      parentGroup.appendChild(featureGroup);
    }

    // Create DOM Elements
    fragments.forEach(frag => {
      const div = document.createElement('div');
      div.className = 'fragment';
      div.style.transformOrigin = `${frag.cx}px ${frag.cy}px`;

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
      hitArea.setAttribute("stroke-width", "50");
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
        e.stopPropagation();
        if (isPrologue) return;
        if (isSettling && !isFreeArrange) return;

        playClink();
        selectFragment(frag);

        // Bring to front safely without detaching DOM node
        topZIndex++;
        div.style.zIndex = topZIndex;

        frag.isDragging = true;
        document.body.classList.add('is-dragging');
        frag.dragStartX = frag.x;
        frag.dragStartY = frag.y;
        frag.dragStartRot = frag.rot;
        returningFragment = null;
        customCursor.classList.remove('hover'); // hide hover ring while dragging

        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        frag.dragOffsetX = e.clientX - (centerX + frag.x);
        frag.dragOffsetY = e.clientY - (centerY + frag.y);

        div.setPointerCapture(e.pointerId);
      });

      div.addEventListener('pointermove', (e) => {
        if (!frag.isDragging) return;
        e.stopPropagation();
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        frag.x = e.clientX - centerX - frag.dragOffsetX;
        frag.y = e.clientY - centerY - frag.dragOffsetY;
      });

      div.addEventListener('pointerup', (e) => {
        if (frag.isDragging) {
          frag.isDragging = false;
          document.body.classList.remove('is-dragging');
          returningFragment = frag;
          
          if (frag.x !== frag.dragStartX || frag.y !== frag.dragStartY || frag.rot !== frag.dragStartRot) {
            moveHistory.push({
              frag: frag,
              oldX: frag.dragStartX,
              oldY: frag.dragStartY,
              oldRot: frag.dragStartRot
            });
            
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

      container.appendChild(div);

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
        document.getElementById('arrange-tools').style.display = 'none';
        document.getElementById('style-menu-container').style.display = '';
        document.getElementById('style-menu-content').style.display = 'flex';
        document.getElementById('style-arrow-icon').classList.add('expanded');
      } else {
        document.getElementById('arrange-tools').style.display = 'block';
        document.getElementById('style-menu-container').style.display = '';
        document.getElementById('style-menu-content').style.display = 'none';
        document.getElementById('style-arrow-icon').classList.remove('expanded');
      }

      document.body.classList.add('has-selected');
      editCount += 0.5;
    }

    function deselectFragment() {
      if (selectedFragment) {
        selectedFragment.element.classList.remove('selected');
        selectedFragment = null;
      }
      if (!isFreeArrange) {
        uiPanel.classList.remove('visible');
      }
      document.body.classList.remove('has-selected');
    }

    function applyColor(color) {
      if (!selectedFragment) return;
      moveHistory.push({
        frag: selectedFragment,
        oldColor: selectedFragment.color,
        type: 'color'
      });
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
      selectedFragment.texture = textureId;
      if (textureId === 'none') {
        selectedFragment.textureOverlay.setAttribute("fill", "none");
      } else {
        selectedFragment.textureOverlay.setAttribute("fill", `url(#${textureId})`);
      }
      editCount++;
    }

    // Keyboard Rotation and Undo (Ctrl+Z)
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.code === 'KeyZ' || e.key.toLowerCase() === 'z')) {
        e.preventDefault();
        document.getElementById('return-btn').click();
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

        selectedFragment.targetRot += 15;
      }
    });

    // Mobile Two-Finger Rotation
    let initialTouchAngle = null;
    let initialFragRot = null;

    document.addEventListener('touchstart', (e) => {
      if (!isFreeArrange || !selectedFragment) return;
      if (e.touches.length === 2) {
        const dx = e.touches[1].clientX - e.touches[0].clientX;
        const dy = e.touches[1].clientY - e.touches[0].clientY;
        initialTouchAngle = Math.atan2(dy, dx) * 180 / Math.PI;
        initialFragRot = selectedFragment.rot;
      }
    }, {passive: false});

    document.addEventListener('touchmove', (e) => {
      if (!isFreeArrange || !selectedFragment) return;
      if (e.touches.length === 2 && initialTouchAngle !== null) {
        e.preventDefault(); // prevent zoom/scroll
        const dx = e.touches[1].clientX - e.touches[0].clientX;
        const dy = e.touches[1].clientY - e.touches[0].clientY;
        const currentAngle = Math.atan2(dy, dx) * 180 / Math.PI;
        let delta = currentAngle - initialTouchAngle;
        
        if (delta > 180) delta -= 360;
        if (delta < -180) delta += 360;

        selectedFragment.rot = initialFragRot + delta;
        selectedFragment.targetRot = selectedFragment.rot;
      }
    }, {passive: false});

    document.addEventListener('touchend', (e) => {
      if (e.touches.length < 2) {
        initialTouchAngle = null;
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

      // Smooth lerp to target rotation
      fragments.forEach(f => {
        if (f.targetRot !== undefined) {
          f.rot += (f.targetRot - f.rot) * 0.15;
        }
      });

      let targetCenterYOffset = window.innerWidth < 768 ? -120 : -80;
      if (uiPanel.classList.contains('visible') && window.innerWidth < 768) {
        targetCenterYOffset = -140;
      }
      
      centerYOffset += (targetCenterYOffset - centerYOffset) * 0.1;

      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2 + centerYOffset;
      const tensionFactor = Math.min(editCount * 0.8, 25);

      let allSettled = true;

      fragments.forEach(f => {
        if (!isSettling) {
          if (isPrologue) return; // Wait off-screen during prologue

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

          if (!f.isDragging) {
            f.x += (targetX - f.x) * 0.05;
            f.y += (targetY - f.y) * 0.05;
            f.rot += (targetRot - f.rot) * 0.05;
          }

          if (tensionFactor > 0 || Math.abs(f.x - f.startX) > 1) {
            allSettled = false;
          }

        } else {
          // Assembling State ("Let Go")
          if (isFreeArrange || isCustomArranged) {
            f.element.style.transform = `translate(${centerX + f.x}px, ${centerY + f.y}px) rotate(${f.rot}deg) scale(${f.scale})`;
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

          if (!f.isDragging) {
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

        f.element.style.transform = `translate(${centerX + f.x}px, ${centerY + f.y}px) rotate(${f.rot}deg) scale(${f.scale})`;
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
        const targetTransform = `translate(${centerX}px, ${centerY}px)`;
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

      // "Sigh" effect: outward push before settling
      fragments.forEach(f => {
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
          "\"There is a crack in everything, that's how the light gets in.\" — Leonard Cohen",
          "\"Have no fear of perfection - you'll never reach it.\" — Salvador Dali",
          "\"To improve is to change; to be perfect is to change often.\" — Winston Churchill"
        ]);
      } else if (editCount > 15) {
        text = "You tried to hold everything together.";
        quote = pickRandom([
          "\"Life is a balance of holding on and letting go.\" — Rumi",
          "\"Let go of the battle. Breathe quietly and let it be.\" — Jack Kornfield",
          "\"Sometimes letting things go is an act of far greater power than defending or hanging on.\" — Eckhart Tolle"
        ]);
      } else if (editCount >= 5) {
        text = "You tried, and that is enough.";
        quote = pickRandom([
          "\"Success is not final, failure is not fatal: it is the courage to continue that counts.\" — Winston Churchill",
          "\"Do what you can, with what you have, where you are.\" — Theodore Roosevelt",
          "\"Ever tried. Ever failed. No matter. Try again. Fail again. Fail better.\" — Samuel Beckett"
        ]);
      } else if (editCount > 0) {
        text = "You knew when to stop.";
        quote = pickRandom([
          "\"He who knows when to stop does not meet with danger.\" — Lao Tzu",
          "\"Half of knowing what you want is knowing what you must give up before you get it.\" — Sidney Howard",
          "\"Leave well enough alone.\" — Aesop"
        ]);
      } else {
        text = "Sometimes, it's best to just watch.";
        quote = pickRandom([
          "\"You can see a lot by just observing.\" — Yogi Berra",
          "\"The real voyage of discovery consists not in seeking new landscapes, but in having new eyes.\" — Marcel Proust",
          "\"To look at a thing is very different from seeing a thing.\" — Oscar Wilde"
        ]);
      }

      finalMessage.innerHTML = `${text}<br><span style="font-size: 0.6em; opacity: 0.7; display: block; margin-top: 10px; font-weight: normal; font-style: italic;">${quote}</span>`;
      finalMessage.classList.add('visible');
      const pac = document.getElementById('post-action-container');
      pac.style.display = 'flex';
      pac.classList.add('visible');
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

      if (droneGain && audioCtx) {
        droneGain.gain.setTargetAtTime(0, audioCtx.currentTime, 1);
      }


      
      const skinPalette = ['#1d70b8', '#3e9c35', '#e8b923', '#c92a2a', '#7c2ac9', '#e05c9f', '#1e9e92', '#d95b27'];
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

        const texturesList = ['none', 'texture-matte', 'texture-glaze', 'texture-grainy', 'texture-speckled'];
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
      document.getElementById('free-arrange-btn').style.display = '';
      document.getElementById('arrange-tools').style.display = 'none';
      const goldSvg = document.getElementById('gold-underlay-svg');
      if (goldSvg) {
        goldSvg.style.display = '';
        goldSvg.style.transition = 'none';
        goldSvg.style.opacity = '0';
      }
      // Regenerate the paths and face pattern
      pieces = generatePieces();
      updateGoldUnderlay(pieces);
      
      const skinPalette = ['#1d70b8', '#3e9c35', '#e8b923', '#c92a2a', '#7c2ac9', '#e05c9f', '#1e9e92', '#d95b27'];
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
        
        // Imperfections disabled to prevent overlapping
        f.impX = 0;
        f.impY = 0;
        f.impRot = 0;
        f.targetRot = undefined;
        f.isDragging = false;
        
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
      document.getElementById('post-action-container').style.display = 'none';
      document.getElementById('arrange-tools').style.display = 'block';
      document.getElementById('style-menu-container').style.display = '';
      document.getElementById('style-menu-content').style.display = 'none';
      document.getElementById('style-arrow-icon').classList.remove('expanded');
      uiPanel.classList.add('visible');
      finalMessage.innerText = "Drag fragments to move. Shape it as you wish.";
      
      const goldSvg = document.getElementById('gold-underlay-svg');
      if (goldSvg) {
        goldSvg.style.display = 'none';
      }
    });

    document.getElementById('return-btn').addEventListener('click', () => {
      if (moveHistory.length > 0) {
        const lastMove = moveHistory.pop();
        if (lastMove.type === 'color') {
          lastMove.frag.color = lastMove.oldColor;
          lastMove.frag.pathElement.setAttribute("fill", lastMove.oldColor);
        } else if (lastMove.type === 'texture') {
          lastMove.frag.texture = lastMove.oldTexture;
          if (lastMove.oldTexture === 'none') {
            lastMove.frag.textureOverlay.setAttribute("fill", "none");
          } else {
            lastMove.frag.textureOverlay.setAttribute("fill", `url(#${lastMove.oldTexture})`);
          }
        } else {
          // Restore previous position and rotation smoothly
          lastMove.frag.x = lastMove.oldX;
          lastMove.frag.y = lastMove.oldY;
          if (lastMove.oldRot !== undefined) {
            lastMove.frag.targetRot = lastMove.oldRot;
          }
        }
      }
    });

    document.getElementById('done-arrange-btn').addEventListener('click', () => {
      isFreeArrange = false;
      uiPanel.classList.remove('visible');
      setTimeout(() => {
        if (!isFreeArrange) {
          document.getElementById('arrange-tools').style.display = 'none';
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
      if (content.style.display === 'none') {
        content.style.display = 'flex';
        icon.classList.add('expanded');
      } else {
        content.style.display = 'none';
        icon.classList.remove('expanded');
      }
    });

    document.getElementById('rotate-left-btn').addEventListener('click', () => {
      if (!isFreeArrange || !selectedFragment) return;
      if (selectedFragment.targetRot === undefined) selectedFragment.targetRot = selectedFragment.rot;
      moveHistory.push({
        frag: selectedFragment,
        oldX: selectedFragment.x,
        oldY: selectedFragment.y,
        oldRot: selectedFragment.targetRot,
        type: 'spatial'
      });
      selectedFragment.targetRot -= 15;
    });

    document.getElementById('rotate-right-btn').addEventListener('click', () => {
      if (!isFreeArrange || !selectedFragment) return;
      if (selectedFragment.targetRot === undefined) selectedFragment.targetRot = selectedFragment.rot;
      moveHistory.push({
        frag: selectedFragment,
        oldX: selectedFragment.x,
        oldY: selectedFragment.y,
        oldRot: selectedFragment.targetRot,
        type: 'spatial'
      });
      selectedFragment.targetRot += 15;
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

    document.getElementById('save-btn').addEventListener('click', () => {
      const suggestedTitle = generateTitle();
      const userTitle = prompt("Name your artwork:", suggestedTitle);
      
      if (userTitle === null) return; // User cancelled save

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
        svgContent += `<text x="${w / 2}" y="${h - 60}" font-family="'Space Grotesk', Helvetica, sans-serif" font-size="14" font-weight="300" letter-spacing="6" fill="#5a5854" text-anchor="middle">${userTitle.trim().toUpperCase()}</text>`;
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

        const pngUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = pngUrl;
        a.download = 'imperfect_vessel.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        URL.revokeObjectURL(url);
      };
      img.src = url;
    });

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if (!isFreeArrange) return;
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        document.getElementById('return-btn').click();
      } else if (!e.ctrlKey && !e.metaKey && (e.key === 'z' || e.key === 'Z')) {
        document.getElementById('rotate-left-btn').click();
      } else if (!e.ctrlKey && !e.metaKey && (e.key === 'x' || e.key === 'X')) {
        document.getElementById('rotate-right-btn').click();
      }
    });

    // Start loop
    animate();
