function generatePieces() {
  const jawW = 50 + Math.random() * 30;      // Jaw width
  const cheekW = 110 + Math.random() * 25;   // Cheekbone width
  const templeW = 90 + Math.random() * 15;   // Temple width
  const headW = 100 + Math.random() * 20;    // Top width
  
  const chinY = 140 + Math.random() * 20;    // Chin Y
  const jawY = 80 + Math.random() * 20;      // Jaw angle Y
  const cheekY = 10 + Math.random() * 20;    // Cheekbone Y
  const templeY = -40 + Math.random() * 15;  // Temple Y
  const headY = -120 - Math.random() * 20;   // Top head Y
  
  const keyPoints = [
    { x: 0, y: headY },
    { x: headW, y: headY + 25 },
    { x: templeW, y: templeY },
    { x: cheekW, y: cheekY },
    { x: jawW, y: jawY },
    { x: 20 + Math.random()*15, y: chinY - 5 },
    { x: 0, y: chinY }
  ];

  const numSegments = 20;
  const rightPoints = [];
  let totalLength = 0;
  const dists = [];
  for(let i=0; i<keyPoints.length-1; i++) {
    const d = Math.hypot(keyPoints[i+1].x - keyPoints[i].x, keyPoints[i+1].y - keyPoints[i].y);
    dists.push(d);
    totalLength += d;
  }
  
  for(let i=0; i<=numSegments; i++) {
    const targetDist = (i / numSegments) * totalLength;
    let currentDist = 0;
    for(let j=0; j<keyPoints.length-1; j++) {
      if (currentDist + dists[j] >= targetDist || j === keyPoints.length - 2) {
        const t = (targetDist - currentDist) / dists[j];
        const x = keyPoints[j].x + (keyPoints[j+1].x - keyPoints[j].x) * t;
        const y = keyPoints[j].y + (keyPoints[j+1].y - keyPoints[j].y) * t;
        rightPoints.push({x, y});
        break;
      }
      currentDist += dists[j];
    }
  }

  const leftSide = [];
  for(let i = rightPoints.length - 2; i > 0; i--) {
    leftSide.push({ x: -rightPoints[i].x, y: rightPoints[i].y });
  }
  
  const basePolygon = [...rightPoints, ...leftSide];
  
  for(let i = 0; i < basePolygon.length; i++) {
    if (i !== 0 && i !== rightPoints.length - 1) {
      basePolygon[i].x += (Math.random() - 0.5) * 8;
      basePolygon[i].y += (Math.random() - 0.5) * 8;
    }
  }

  const jitter = (amount = 10) => (Math.random() - 0.5) * amount;
  const sites = [
    { x: -25 + jitter(8), y: -15 + jitter(8) },
    { x: 25 + jitter(8), y: -15 + jitter(8) },
    { x: 0 + jitter(5), y: 15 + jitter(10) },
    { x: 0 + jitter(10), y: 55 + jitter(10) },
    { x: 0 + jitter(20), y: -80 + jitter() },
    { x: -70 + jitter(), y: -60 + jitter() },
    { x: 70 + jitter(), y: -60 + jitter() },
    { x: -60 + jitter(), y: 50 + jitter() },
    { x: 60 + jitter(), y: 50 + jitter() }
  ];

  const extraPiecesCount = 5;
  for (let i = 0; i < extraPiecesCount; i++) {
    let ex, ey;
    do {
       ex = (Math.random() - 0.5) * 180;
       ey = (Math.random() - 0.5) * 200;
    } while (Math.abs(ex) < 45 && Math.abs(ey - 10) < 60);
    
    sites.push({ x: ex, y: ey });
  }

  const numPieces = sites.length;
  console.log("Num pieces:", numPieces);

  function clipPolygon(subjectPolygon, clipLineP1, clipLineP2) {
    const isInside = (p) => (p.x - clipLineP1.x) * (clipLineP2.y - clipLineP1.y) - (p.y - clipLineP1.y) * (clipLineP2.x - clipLineP1.x) >= 0;
    const getIntersection = (p1, p2) => {
      const d1 = (p1.x - clipLineP1.x) * (clipLineP2.y - clipLineP1.y) - (p1.y - clipLineP1.y) * (clipLineP2.x - clipLineP1.x);
      const d2 = (p2.x - clipLineP1.x) * (clipLineP2.y - clipLineP1.y) - (p2.y - clipLineP1.y) * (clipLineP2.x - clipLineP1.x);
      const t = d1 / (d1 - d2);
      return { x: p1.x + t * (p2.x - p1.x), y: p1.y + t * (p2.y - p1.y) };
    };

    const outputList = [];
    for (let i = 0; i < subjectPolygon.length; i++) {
      const curPoint = subjectPolygon[i];
      const prevPoint = subjectPolygon[(i === 0 ? subjectPolygon.length : i) - 1];

      const curInside = isInside(curPoint);
      const prevInside = isInside(prevPoint);

      if (curInside) {
        if (!prevInside) {
          outputList.push(getIntersection(prevPoint, curPoint));
        }
        outputList.push(curPoint);
      } else if (prevInside) {
        outputList.push(getIntersection(prevPoint, curPoint));
      }
    }
    return outputList;
  }

  const generated = [];
  for (let i = 0; i < numPieces; i++) {
    let poly = [...basePolygon];
    for (let j = 0; j < numPieces; j++) {
      if (i === j) continue;
      
      const dx = sites[j].x - sites[i].x;
      const dy = sites[j].y - sites[i].y;
      const mx = (sites[i].x + sites[j].x) / 2;
      const my = (sites[i].y + sites[j].y) / 2;
      
      const nx = -dy;
      const ny = dx;
      
      const p1 = { x: mx, y: my };
      const p2 = { x: mx + nx, y: my + ny };
      
      poly = clipPolygon(poly, p1, p2);
    }
    
    if (poly.length > 0) {
      generated.push(poly);
    } else {
      console.log("CLIPPED OUT!", i);
    }
  }
  console.log("Generated array length:", generated.length);
}
generatePieces();
