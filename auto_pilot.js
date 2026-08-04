// Imperfect Vessel — Auto Pilot Script for Loop Showcase
(function() {
  console.log('[AutoPilot] Initialized');

  function startAutoLoop() {
    // 1. Dismiss prologue if open
    const prologue = document.getElementById('prologue');
    if (prologue && prologue.style.display !== 'none') {
      prologue.click();
    }

    let cycleCount = 0;

    function loopStep() {
      // Step A: Floating phase for 3.5 seconds
      console.log(`[AutoPilot] Cycle ${cycleCount + 1}: Floating fragments...`);

      setTimeout(() => {
        // Step B: Click RELEASE button
        const letGoBtn = document.getElementById('let-go-btn');
        if (letGoBtn && !letGoBtn.classList.contains('hidden')) {
          console.log('[AutoPilot] Clicking RELEASE button...');
          letGoBtn.click();
        }

        // Step C: Wait 8.5 seconds for slow assembly + Kintsugi gold sweep + quote display
        setTimeout(() => {
          // Step D: Click TRY AGAIN button
          const tryAgainBtn = document.getElementById('try-again-btn');
          if (tryAgainBtn) {
            console.log('[AutoPilot] Clicking TRY AGAIN button...');
            tryAgainBtn.click();
            cycleCount++;
          }

          // Step E: Repeat cycle after 1 second reset
          setTimeout(loopStep, 1000);

        }, 8500);

      }, 3500);
    }

    // Start first loop after 2 seconds
    setTimeout(loopStep, 2000);
  }

  if (document.readyState === 'complete') {
    startAutoLoop();
  } else {
    window.addEventListener('load', startAutoLoop);
  }
})();
