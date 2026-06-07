document.addEventListener('DOMContentLoaded', () => {
  // === KATEX AUTO-RENDER ===
  if (typeof renderMathInElement === 'function') {
    renderMathInElement(document.body, {
      delimiters: [
        {left: '$$', right: '$$', display: true},
        {left: '$', right: '$', display: false}
      ]
    });
  }

  // === SLIDE NAVIGATION SYSTEM ===
  const slides = Array.from(document.querySelectorAll('.slide'));
  const prevBtn = document.getElementById('btn-prev');
  const nextBtn = document.getElementById('btn-next');
  const progressFill = document.querySelector('.progress-bar-fill');
  const progressText = document.querySelector('.progress-text');
  
  let currentSlideIndex = 0;
  
  function updateSlides() {
    slides.forEach((slide, index) => {
      slide.classList.remove('active', 'prev');
      if (index === currentSlideIndex) {
        slide.classList.add('active');
      } else if (index < currentSlideIndex) {
        slide.classList.add('prev');
      }
    });
    
    // Update progress
    const progressPercent = (currentSlideIndex / (slides.length - 1)) * 100;
    progressFill.style.width = `${progressPercent}%`;
    progressText.textContent = `${currentSlideIndex + 1} / ${slides.length}`;
    
    // Enable/disable buttons
    prevBtn.disabled = currentSlideIndex === 0;
    nextBtn.disabled = currentSlideIndex === slides.length - 1;

    // Trigger canvas animations or custom animations on slide entry
    handleSlideTransitions(currentSlideIndex);
  }
  
  function nextSlide() {
    if (currentSlideIndex < slides.length - 1) {
      currentSlideIndex++;
      updateSlides();
    }
  }
  
  function prevSlide() {
    if (currentSlideIndex > 0) {
      currentSlideIndex--;
      updateSlides();
    }
  }
  
  // Event Listeners
  prevBtn.addEventListener('click', prevSlide);
  nextBtn.addEventListener('click', nextSlide);
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
      // Don't trigger if focus is on input field
      if (document.activeElement.tagName !== 'INPUT') {
        e.preventDefault();
        nextSlide();
      }
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      if (document.activeElement.tagName !== 'INPUT') {
        e.preventDefault();
        prevSlide();
      }
    } else if (e.key === 'Home') {
      currentSlideIndex = 0;
      updateSlides();
    } else if (e.key === 'End') {
      currentSlideIndex = slides.length - 1;
      updateSlides();
    }
  });

  // Touch navigation (swipe)
  let touchStartX = 0;
  let touchEndX = 0;
  
  document.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  });
  
  document.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  });
  
  function handleSwipe() {
    const threshold = 50;
    if (touchEndX < touchStartX - threshold) {
      nextSlide();
    } else if (touchEndX > touchStartX + threshold) {
      prevSlide();
    }
  }

  // === INTERACTIVE WIDGET 0: RECOMMENDER SYSTEM FUNNEL ===
  const funnelStages = document.querySelectorAll('.funnel-stage');
  const funnelDetails = document.getElementById('funnel-details');
  const funnelCompute = document.getElementById('funnel-compute');
  const funnelSupervision = document.getElementById('funnel-supervision');
  const funnelDesc = document.querySelector('.funnel-details-desc');
  
  const funnelData = {
    retrieval: {
      title: "Retrieval Stage",
      compute: "Fast Embed Search (Approx. Nearest Neighbors, O(1) ops per item)",
      supervision: "10 : Billions (Extremely Biased)",
      loss: "Softmax Loss / Sampled Negatives",
      latency: "< 5-10 ms",
      desc: "Narrows down the entire candidate space from billions of items to a few thousand candidates. Operates under extreme latency bounds, relying on lightweight mathematical representations (MIPS/ANN).",
      borderColor: "rgba(45, 212, 191, 0.2)",
      titleColor: "var(--accent-teal)"
    },
    esr: {
      title: "Early-Stage Ranking (ESR)",
      compute: "Lightweight Model (Shallow MLP or Dot Product + OverArch)",
      supervision: "10 : 3,000 (Highly Biased)",
      loss: "Hybrid (BCE + Softmax + Rank-Order Alignment)",
      latency: "< 5-10 ms",
      desc: "Prunes candidate pool under tight latency limits. Trains on a hybrid objective: BCE on impressions, Softmax on sampled negatives, and rank-order alignment from downstream LSR scores.",
      borderColor: "rgba(56, 189, 248, 0.2)",
      titleColor: "var(--accent-blue)"
    },
    lsr: {
      title: "Late-Stage Ranking (LSR)",
      compute: "Heavy Model (Deep Cross Networks, Multi-task OverArch)",
      supervision: "10 : 300 (Noisy but manageable bias)",
      loss: "Discriminative BCE (Binary Cross Entropy)",
      latency: "20 - 50 ms",
      desc: "Computes rich feature cross interactions (user history, contextual tags, real-time feedback) on the top candidates to predict exact interaction probabilities.",
      borderColor: "rgba(167, 139, 250, 0.2)",
      titleColor: "var(--accent-purple)"
    },
    impressions: {
      title: "Impressions Stage",
      compute: "Client-side / Layout optimization & business rules",
      supervision: "N/A (Impressed subset)",
      loss: "User Interaction Feedback",
      latency: "N/A",
      desc: "The final few items displayed to the user. Typically under 10 items (often just 1). The actual items the user can interact with, generating the sparse labels used to train the entire system.",
      borderColor: "rgba(251, 146, 60, 0.2)",
      titleColor: "var(--accent-orange)"
    }
  };

  function selectFunnelStage(stageKey) {
    const data = funnelData[stageKey];
    if (!data) return;

    // Toggle active classes
    funnelStages.forEach(stage => {
      stage.classList.toggle('active', stage.dataset.stage === stageKey);
    });

    // Update details card content
    const titleEl = funnelDetails.querySelector('.funnel-details-title');
    titleEl.textContent = data.title;
    titleEl.style.color = data.titleColor;
    funnelDetails.style.borderColor = data.borderColor;

    funnelCompute.textContent = data.compute;
    funnelSupervision.textContent = data.supervision;
    funnelDesc.textContent = data.desc;
  }

  funnelStages.forEach(stage => {
    stage.addEventListener('click', () => {
      selectFunnelStage(stage.dataset.stage);
    });
  });

  // === INTERACTIVE WIDGET 1: GPU MEMORY CALCULATOR ===
  const vocabInput = document.getElementById('calc-vocab');
  const dimInput = document.getElementById('calc-dim');
  
  function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  function updateMemoryCalculator() {
    const V = parseInt(vocabInput.value) || 0;
    const D = parseInt(dimInput.value) || 0;
    
    const fp32Bytes = V * D * 4;
    const fp16Bytes = V * D * 2;
    const int8Bytes = V * D * 1;
    // PQ: Assume we are using 80x256 which means 80 bytes for D=256. Scale with D.
    const pqBytes = V * Math.round(D * (80 / 256)); 
    
    document.getElementById('val-fp32').textContent = formatBytes(fp32Bytes);
    document.getElementById('val-fp16').textContent = formatBytes(fp16Bytes);
    document.getElementById('val-int8').textContent = formatBytes(int8Bytes);
    document.getElementById('val-pq').textContent = formatBytes(pqBytes);
    
    // Scale widths
    const maxBytes = fp32Bytes || 1;
    document.getElementById('bar-fp32').style.width = '100%';
    document.getElementById('bar-fp16').style.width = `${(fp16Bytes / maxBytes) * 100}%`;
    document.getElementById('bar-int8').style.width = `${(int8Bytes / maxBytes) * 100}%`;
    document.getElementById('bar-pq').style.width = `${(pqBytes / maxBytes) * 100}%`;
  }
  
  if (vocabInput && dimInput) {
    vocabInput.addEventListener('input', updateMemoryCalculator);
    dimInput.addEventListener('input', updateMemoryCalculator);
  }

  // === INTERACTIVE WIDGET: ARCHITECTURE PHASE VISUALIZER ===
  const archCanvas = document.getElementById('arch-canvas');
  const archTabBtns = document.querySelectorAll('.arch-tab-btn');
  const nodeUserTower = document.getElementById('node-user-tower');
  const nodeObjectTower = document.getElementById('node-object-tower');
  const nodeGpuMem = document.getElementById('node-gpu-mem');
  const nodeOverarch = document.getElementById('node-overarch');
  const nodeOutputs = document.getElementById('node-outputs');
  const outputsLabel = document.getElementById('outputs-label');

  let archCtx = null;
  let archAnimationId = null;
  let archPhase = 'training'; // training, offline-prep, online-scoring
  let archDashOffset = 0;

  function initArchVisualizer() {
    if (!archCanvas) return;
    archCtx = archCanvas.getContext('2d');
    
    // Set initial size
    resizeArchCanvas();
    
    // Add click listeners to tab buttons
    archTabBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        setArchPhase(e.currentTarget.dataset.phase);
      });
    });

    window.addEventListener('resize', () => {
      resizeArchCanvas();
      if (currentSlideIndex === 3) {
        drawArchFlow();
      }
    });
  }

  function resizeArchCanvas() {
    if (archCanvas) {
      archCanvas.width = archCanvas.offsetWidth;
      archCanvas.height = archCanvas.offsetHeight;
    }
  }

  function setArchPhase(phase) {
    archPhase = phase;
    
    // Update active tab button style
    archTabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.phase === phase);
    });

    // Update node states (active vs greyed out)
    resetNodeStyles();

    if (phase === 'training') {
      nodeUserTower.style.opacity = '1';
      nodeObjectTower.style.opacity = '1';
      nodeGpuMem.style.opacity = '0.15';
      nodeGpuMem.style.borderColor = 'var(--glass-border)';
      nodeOverarch.style.opacity = '1';
      nodeOutputs.style.opacity = '1';
      outputsLabel.textContent = 'Losses';
      outputsLabel.style.color = 'var(--accent-orange)';
      nodeOutputs.style.borderColor = 'rgba(251, 146, 60, 0.3)';
    } else if (phase === 'offline-prep') {
      nodeUserTower.style.opacity = '0.15';
      nodeObjectTower.style.opacity = '1';
      nodeGpuMem.style.opacity = '1';
      nodeGpuMem.style.borderColor = 'var(--accent-blue)';
      nodeOverarch.style.opacity = '0.15';
      nodeOutputs.style.opacity = '0.15';
      nodeOutputs.style.borderColor = 'var(--glass-border)';
    } else if (phase === 'online-scoring') {
      nodeUserTower.style.opacity = '1';
      nodeObjectTower.style.opacity = '0.15';
      nodeGpuMem.style.opacity = '1';
      nodeGpuMem.style.borderColor = 'var(--accent-blue)';
      nodeOverarch.style.opacity = '1';
      nodeOutputs.style.opacity = '1';
      outputsLabel.textContent = 'Predictions';
      outputsLabel.style.color = 'var(--accent-orange)';
      nodeOutputs.style.borderColor = 'rgba(251, 146, 60, 0.3)';
    }
  }

  function resetNodeStyles() {
    [nodeUserTower, nodeObjectTower, nodeGpuMem, nodeOverarch, nodeOutputs].forEach(node => {
      if (node) {
        node.style.transition = 'opacity 0.4s ease, border-color 0.4s ease';
      }
    });
  }

  function getElementCenter(el) {
    if (!el || !archCanvas) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    const canvasRect = archCanvas.getBoundingClientRect();
    return {
      x: (rect.left + rect.right) / 2 - canvasRect.left,
      y: (rect.top + rect.bottom) / 2 - canvasRect.top,
      width: rect.width,
      height: rect.height
    };
  }

  function drawConnection(startCenter, endCenter, color, glowColor, showFlow = true) {
    if (!archCtx) return;
    
    // Draw background shadow glow line
    archCtx.shadowBlur = 8;
    archCtx.shadowColor = glowColor;
    archCtx.strokeStyle = color;
    archCtx.lineWidth = 2.5;
    
    archCtx.beginPath();
    const dx = endCenter.x - startCenter.x;
    const dy = endCenter.y - startCenter.y;
    
    archCtx.moveTo(startCenter.x, startCenter.y);
    if (Math.abs(dy) > 5) {
      archCtx.bezierCurveTo(
        startCenter.x + dx * 0.5, startCenter.y,
        startCenter.x + dx * 0.5, endCenter.y,
        endCenter.x, endCenter.y
      );
    } else {
      archCtx.lineTo(endCenter.x, endCenter.y);
    }
    archCtx.stroke();
    
    // Draw flowing data packets
    if (showFlow) {
      archCtx.shadowBlur = 10;
      archCtx.shadowColor = glowColor;
      archCtx.strokeStyle = '#ffffff';
      archCtx.lineWidth = 3;
      archCtx.setLineDash([8, 15]);
      archCtx.lineDashOffset = -archDashOffset;
      
      archCtx.beginPath();
      if (Math.abs(dy) > 5) {
        archCtx.moveTo(startCenter.x, startCenter.y);
        archCtx.bezierCurveTo(
          startCenter.x + dx * 0.5, startCenter.y,
          startCenter.x + dx * 0.5, endCenter.y,
          endCenter.x, endCenter.y
        );
      } else {
        archCtx.moveTo(startCenter.x, startCenter.y);
        archCtx.lineTo(endCenter.x, endCenter.y);
      }
      archCtx.stroke();
      
      // Reset line dash
      archCtx.setLineDash([]);
      archCtx.lineDashOffset = 0;
    }
    
    // Reset shadow
    archCtx.shadowBlur = 0;
  }

  function drawArchFlow() {
    if (!archCtx || !archCanvas) return;
    
    // Clear canvas
    archCtx.clearRect(0, 0, archCanvas.width, archCanvas.height);
    
    // Update animation offsets
    archDashOffset = (archDashOffset + 0.6) % 23;
    
    // Get element center positions
    const posUser = getElementCenter(nodeUserTower);
    const posObject = getElementCenter(nodeObjectTower);
    const posGpu = getElementCenter(nodeGpuMem);
    const posOver = getElementCenter(nodeOverarch);
    const posOut = getElementCenter(nodeOutputs);
    
    if (archPhase === 'training') {
      // Draw User Tower -> OverArch
      drawConnection(
        { x: posUser.x + posUser.width / 2, y: posUser.y },
        { x: posOver.x - posOver.width / 2, y: posOver.y - 15 },
        'rgba(167, 139, 250, 0.4)',
        'var(--accent-purple)',
        true
      );
      // Draw Object Tower -> OverArch
      drawConnection(
        { x: posObject.x + posObject.width / 2, y: posObject.y },
        { x: posOver.x - posOver.width / 2, y: posOver.y + 15 },
        'rgba(45, 212, 191, 0.4)',
        'var(--accent-teal)',
        true
      );
      // Draw OverArch -> Losses
      drawConnection(
        { x: posOver.x + posOver.width / 2, y: posOver.y },
        { x: posOut.x - posOut.width / 2, y: posOut.y },
        'rgba(251, 146, 60, 0.4)',
        'var(--accent-orange)',
        true
      );
    } else if (archPhase === 'offline-prep') {
      // Draw Object Tower -> GPU Memory
      drawConnection(
        { x: posObject.x + posObject.width / 2, y: posObject.y },
        { x: posGpu.x - posGpu.width / 2, y: posGpu.y },
        'rgba(45, 212, 191, 0.4)',
        'var(--accent-teal)',
        true
      );
    } else if (archPhase === 'online-scoring') {
      // Draw User Tower -> OverArch
      drawConnection(
        { x: posUser.x + posUser.width / 2, y: posUser.y },
        { x: posOver.x - posOver.width / 2, y: posOver.y - 15 },
        'rgba(167, 139, 250, 0.4)',
        'var(--accent-purple)',
        true
      );
      // Draw GPU Memory -> OverArch
      drawConnection(
        { x: posGpu.x + posGpu.width / 2, y: posGpu.y },
        { x: posOver.x - posOver.width / 2, y: posOver.y + 15 },
        'rgba(56, 189, 248, 0.4)',
        'var(--accent-blue)',
        true
      );
      // Draw OverArch -> Predictions
      drawConnection(
        { x: posOver.x + posOver.width / 2, y: posOver.y },
        { x: posOut.x - posOut.width / 2, y: posOut.y },
        'rgba(251, 146, 60, 0.4)',
        'var(--accent-orange)',
        true
      );
    }
  }

  function startArchLoop() {
    if (archAnimationId) return;
    
    // Set initial active phase and styles
    setArchPhase(archPhase);
    
    // Make sure dimensions are calculated
    resizeArchCanvas();
    
    function loop() {
      drawArchFlow();
      archAnimationId = requestAnimationFrame(loop);
    }
    loop();
  }

  function stopArchLoop() {
    if (archAnimationId) {
      cancelAnimationFrame(archAnimationId);
      archAnimationId = null;
    }
  }

  if (archCanvas) {
    initArchVisualizer();
  }

  // === INTERACTIVE WIDGET: LATENCY TIMELINE SIMULATOR ===
  const playTimelineBtn = document.getElementById('play-timeline-btn');
  const playbackLine = document.getElementById('playback-line');
  const savingsBanner = document.getElementById('timeline-savings');
  
  const segments = [
    { selector: '.seq-retrieval', start: 0, end: 8 },
    { selector: '.seq-user-tower', start: 8, end: 13 },
    { selector: '.seq-overarch', start: 13, end: 15 },
    { selector: '.par-retrieval', start: 0, end: 8 },
    { selector: '.par-user-tower', start: 0, end: 5 },
    { selector: '.par-overarch', start: 8, end: 10 },
    { selector: '.par-saved', start: 10, end: 15 }
  ];

  let timelineAnimationId = null;

  function resetTimeline() {
    if (timelineAnimationId) {
      cancelAnimationFrame(timelineAnimationId);
      timelineAnimationId = null;
    }
    if (playbackLine) {
      playbackLine.style.opacity = '0';
      playbackLine.style.left = '0%';
    }
    if (savingsBanner) {
      savingsBanner.style.opacity = '0';
    }
    if (playTimelineBtn) {
      playTimelineBtn.disabled = false;
      playTimelineBtn.textContent = 'Play Animation';
    }
    
    // Reset all segment highlights
    segments.forEach(seg => {
      const el = document.querySelector(seg.selector);
      if (el) {
        el.classList.remove('dimmed', 'highlighted');
      }
    });
  }

  function startTimelineAnimation() {
    resetTimeline();
    
    if (!playbackLine || !playTimelineBtn) return;
    
    playTimelineBtn.disabled = true;
    playTimelineBtn.textContent = 'Running...';
    playbackLine.style.opacity = '1';
    
    // Dim all segments initially
    segments.forEach(seg => {
      const el = document.querySelector(seg.selector);
      if (el) {
        el.classList.add('dimmed');
      }
    });

    const duration = 2500; // 2.5 seconds
    const startTime = performance.now();

    function updateFrame(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const t = progress * 15; // 0 to 15 ms

      playbackLine.style.left = `${progress * 100}%`;

      // Update highlight state for each segment
      segments.forEach(seg => {
        const el = document.querySelector(seg.selector);
        if (!el) return;

        if (t >= seg.start) {
          el.classList.remove('dimmed');
          el.classList.add('highlighted');
        } else {
          el.classList.remove('highlighted');
          el.classList.add('dimmed');
        }
      });

      if (progress < 1) {
        timelineAnimationId = requestAnimationFrame(updateFrame);
      } else {
        // Animation complete
        if (savingsBanner) {
          savingsBanner.style.opacity = '1';
        }
        playTimelineBtn.disabled = false;
        playTimelineBtn.textContent = 'Replay Animation';
        timelineAnimationId = null;
        
        // Hide play line after a short fade
        setTimeout(() => {
          if (!timelineAnimationId && playbackLine) {
            playbackLine.style.opacity = '0';
          }
        }, 800);
      }
    }

    timelineAnimationId = requestAnimationFrame(updateFrame);
  }

  if (playTimelineBtn) {
    playTimelineBtn.addEventListener('click', startTimelineAnimation);
  }

  // === INTERACTIVE WIDGET 2: SCALAR QUANTIZATION SIMULATOR ===
  const floatSlider = document.getElementById('float-slider');
  const valFloat = document.getElementById('val-float');
  const valInt8 = document.getElementById('val-int8-quant');
  const valDequant = document.getElementById('val-dequant');
  const valError = document.getElementById('val-error');
  const binaryFp = document.getElementById('binary-fp');
  const binaryInt8 = document.getElementById('binary-int8');
  
  function float32ToBinary(num) {
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    view.setFloat32(0, num, false);
    let binary = '';
    for (let i = 0; i < 4; i++) {
      let byteStr = view.getUint8(i).toString(2);
      binary += byteStr.padStart(8, '0') + ' ';
    }
    return binary.trim();
  }
  
  function int8ToBinary(val) {
    // Standard two's complement for positive/negative numbers
    const byteVal = val < 0 ? (256 + val) : val;
    return byteVal.toString(2).padStart(8, '0');
  }
  
  function updateScalarQuantSim() {
    if (!floatSlider) return;
    const x = parseFloat(floatSlider.value);
    
    // Compute max/scale factor (let's assume dynamic range based on absolute max of 1.0)
    // Scale S maps [-1.0, 1.0] to [-127, 127]
    const S = 1.0 / 127.0;
    const q = Math.round(x / S);
    const xHat = q * S;
    const err = Math.abs(x - xHat);
    
    valFloat.textContent = x.toFixed(4);
    const valFloatShow = document.getElementById('val-float-show');
    if (valFloatShow) {
      valFloatShow.textContent = x.toFixed(4);
    }
    valInt8.textContent = q;
    valDequant.textContent = xHat.toFixed(4);
    valError.textContent = err.toFixed(6);
    
    binaryFp.textContent = float32ToBinary(x);
    binaryInt8.textContent = int8ToBinary(q);
  }
  
  if (floatSlider) {
    floatSlider.addEventListener('input', updateScalarQuantSim);
  }

  // === INTERACTIVE WIDGET 3: PRODUCT QUANTIZATION VISUALIZER ===
  const pqStepBtn = document.getElementById('pq-step-btn');
  const pqExplanation = document.getElementById('pq-explanation');
  const vectorContainer = document.getElementById('vector-container');
  
  // Set of 8 dimension values for demonstrating PQ
  const initialVector = [0.85, -0.42, 0.12, 0.94, -0.63, 0.78, 0.05, -0.19];
  let pqStep = 0;
  
  function generateVectorHTML(vals, highlightMode = null) {
    return vals.map((v, i) => {
      let colorClass = '';
      let displayText = typeof v === 'number' ? v.toFixed(2) : v;
      
      if (highlightMode === 'subspaces') {
        // Group into 4 groups of 2
        const group = Math.floor(i / 2);
        const colors = ['#38bdf8', '#2dd4bf', '#a78bfa', '#fb923c'];
        return `<div class="vector-dimension" style="background: ${colors[group]}; border: 1px solid rgba(255,255,255,0.2); transform: translateY(-5px);">${displayText}</div>`;
      } else if (highlightMode === 'indices') {
        const group = Math.floor(i / 2);
        const colors = ['#0284c7', '#0f766e', '#6d28d9', '#c2410c'];
        if (i % 2 === 0) {
          // Output index instead of float
          const codebookIndex = ['Idx #42', 'Idx #103', 'Idx #21', 'Idx #88'][group];
          return `<div class="vector-dimension pq-index-dimension" style="background: ${colors[group]}; font-weight: bold; border: 1px solid rgba(255,255,255,0.25);">${codebookIndex}</div>`;
        } else {
          return ''; // Hide every second element since 2 floats collapse to 1 index
        }
      } else if (highlightMode === 'reconstructed') {
        const group = Math.floor(i / 2);
        const colors = ['#0369a1', '#0f766e', '#6d28d9', '#c2410c'];
        // Centroid values for comparison
        const centroids = [
          [0.80, -0.40],
          [0.10, 0.90],
          [-0.60, 0.80],
          [0.00, -0.20]
        ];
        const val = centroids[group][i % 2];
        return `<div class="vector-dimension" style="background: ${colors[group]}; border: 1px dashed rgba(255,255,255,0.6); opacity: 0.95;">${val.toFixed(2)}</div>`;
      }
      
      // Default initial layout
      return `<div class="vector-dimension" style="background: rgba(255, 255, 255, 0.08); border: 1px solid var(--glass-border);">${displayText}</div>`;
    }).join('');
  }
  
  function advancePQVisualizer() {
    pqStep = (pqStep + 1) % 4;
    
    if (pqStep === 0) {
      vectorContainer.innerHTML = generateVectorHTML(initialVector);
      pqExplanation.innerHTML = "<strong>Step 1: Original High-Dimensional Vector</strong><br>A single $D=8$ dimensional floating point embedding ($8 \\times 2 = 16$ bytes in FP16).";
      pqStepBtn.textContent = "Split into Subspaces";
    } else if (pqStep === 1) {
      vectorContainer.innerHTML = generateVectorHTML(initialVector, 'subspaces');
      pqExplanation.innerHTML = "<strong>Step 2: Subspace Decomposition</strong><br>Split into $M=4$ subvectors, each of dimension $d=2$. Each subvector will be quantized independently.";
      pqStepBtn.textContent = "Perform Codebook Lookup";
    } else if (pqStep === 2) {
      vectorContainer.innerHTML = generateVectorHTML(initialVector, 'indices');
      pqExplanation.innerHTML = "<strong>Step 3: Quantization</strong><br>Find the closest centroid in each subvector's codebook. Replace the floats with the 1-byte codebook index ($4 \\times 1 = 4$ bytes). <span style='color: var(--accent-teal); font-weight: bold;'>75% compression!</span>";
      pqStepBtn.textContent = "Reconstruct Vector";
    } else if (pqStep === 3) {
      vectorContainer.innerHTML = generateVectorHTML(initialVector, 'reconstructed');
      pqExplanation.innerHTML = "<strong>Step 4: Reconstruction (De-quantization)</strong><br>For inference dot product calculation, reconstruct using centroid values. Notice the small quantization error compared to original values.";
      pqStepBtn.textContent = "Reset Visualizer";
    }
  }
  
  if (pqStepBtn) {
    pqStepBtn.addEventListener('click', advancePQVisualizer);
    // Init state
    advancePQVisualizer();
  }

  // === INTERACTIVE WIDGET 4: ROTATION CANVAS VISUALIZER (TURBO vs SPECTRAL) ===
  const canvas = document.getElementById('rotation-canvas');
  const rotModeBtns = document.querySelectorAll('.btn-rot');
  
  let ctx = null;
  let points = [];
  let currentRotationAngle = 0;
  let targetRotationAngle = 0;
  let activeMode = 'original'; // original, turbo, spectral
  let rotationAnimationId = null;
  
  // Seedable pseudo-random number generator for consistent points
  function seedRandom(seed) {
    let x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }
  
  function generateScatterPoints() {
    points = [];
    const n = 80;
    // Generate an elongated cluster (correlated variables)
    for (let i = 0; i < n; i++) {
      const u1 = seedRandom(i * 3);
      const u2 = seedRandom(i * 7 + 1);
      
      // Box-Muller transform for normal distribution
      const z0 = Math.sqrt(-2.0 * Math.log(u1 || 0.0001)) * Math.cos(2.0 * Math.PI * u2);
      const z1 = Math.sqrt(-2.0 * Math.log(u1 || 0.0001)) * Math.sin(2.0 * Math.PI * u2);
      
      // Make them highly correlated along an axis rotated by 30 degrees (0.52 rad)
      const x = z0 * 60;
      const y = z1 * 15;
      
      // Rotate by 30 degrees to create correlation
      const angle = 0.52;
      const rx = x * Math.cos(angle) - y * Math.sin(angle);
      const ry = x * Math.sin(angle) + y * Math.cos(angle);
      
      points.push({ x: rx, y: ry, origX: rx, origY: ry });
    }
  }
  
  function drawScatterPlot() {
    if (!ctx || !canvas) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    
    // Draw axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(canvas.width, cy);
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, canvas.height);
    ctx.stroke();
    
    // Apply temporary animation rotation to points for drawing
    // In TurboQuant, we rotate randomly (e.g. 45 degrees relative to correlation axis) to spread variance.
    // In SpectralQuant, we align the principal axis to coordinate axes (rotation of -30 degrees).
    let drawAngle = currentRotationAngle;
    
    // Draw grid lines corresponding to quantization bins if active
    if (activeMode !== 'original') {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.06)';
      ctx.lineWidth = 1;
      const step = 25;
      
      // TurboQuant: equal bins on both axes
      // SpectralQuant: fine bins on X-axis (more bits), coarse bins on Y-axis (fewer bits)
      const xStep = activeMode === 'spectral' ? 15 : step;
      const yStep = activeMode === 'spectral' ? 45 : step;
      
      for (let x = xStep; x < cx; x += xStep) {
        ctx.strokeRect(cx - x, 0, 1, canvas.height);
        ctx.strokeRect(cx + x, 0, 1, canvas.height);
      }
      for (let y = yStep; y < cy; y += yStep) {
        ctx.strokeRect(0, cy - y, canvas.width, 1);
        ctx.strokeRect(0, cy + y, canvas.width, 1);
      }
    }
    
    // Draw points
    points.forEach((p, idx) => {
      // Rotate point mathematically
      const rx = p.origX * Math.cos(drawAngle) - p.origY * Math.sin(drawAngle);
      const ry = p.origX * Math.sin(drawAngle) + p.origY * Math.cos(drawAngle);
      
      // Determine point color
      let color = 'rgba(148, 163, 184, 0.7)'; // standard slate
      if (activeMode === 'turbo') {
        color = 'rgba(167, 139, 250, 0.8)'; // purple
      } else if (activeMode === 'spectral') {
        color = 'rgba(45, 212, 191, 0.8)'; // teal
      }
      
      ctx.fillStyle = color;
      ctx.beginPath();
      // Draw standard points
      ctx.arc(cx + rx, cy + ry, 3.5, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // Draw Variance Ellipse/Bounding lines
    ctx.strokeStyle = activeMode === 'spectral' ? 'var(--accent-teal)' : (activeMode === 'turbo' ? 'var(--accent-purple)' : 'rgba(255, 255, 255, 0.3)');
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    // Approximate boundary ellipse
    ctx.ellipse(cx, cy, activeMode === 'spectral' ? 70 : (activeMode === 'turbo' ? 55 : 70), activeMode === 'spectral' ? 22 : (activeMode === 'turbo' ? 55 : 22), drawAngle, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Label display inside canvas
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '11px var(--font-mono)';
    if (activeMode === 'original') {
      ctx.fillText("Unbalanced Variance (Diagonal)", 15, 25);
    } else if (activeMode === 'turbo') {
      ctx.fillText("Rotated: Balanced Variance on Axes", 15, 25);
      ctx.fillText("Bits per dim: Equal (4 bits / 4 bits)", 15, 40);
    } else if (activeMode === 'spectral') {
      ctx.fillText("SVD Aligned: PCA Axis-Aligned", 15, 25);
      ctx.fillText("Bits per dim: Adaptive (6 bits / 2 bits)", 15, 40);
    }
  }
  
  function animateRotation() {
    const diff = targetRotationAngle - currentRotationAngle;
    if (Math.abs(diff) > 0.001) {
      currentRotationAngle += diff * 0.1;
      drawScatterPlot();
      rotationAnimationId = requestAnimationFrame(animateRotation);
    } else {
      currentRotationAngle = targetRotationAngle;
      drawScatterPlot();
      cancelAnimationFrame(rotationAnimationId);
      rotationAnimationId = null;
    }
  }
  
  function setRotationMode(mode) {
    activeMode = mode;
    
    rotModeBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    
    if (mode === 'original') {
      targetRotationAngle = 0;
    } else if (mode === 'turbo') {
      // Rotate by random orthogonal angle (e.g. 75 degrees/1.31 rad) to balance variance across dimensions
      targetRotationAngle = 1.31;
    } else if (mode === 'spectral') {
      // Rotate by -30 degrees (-0.52 rad) to align principal components exactly to standard axes
      targetRotationAngle = -0.52;
    }
    
    if (!rotationAnimationId) {
      animateRotation();
    }
  }
  
  // Set up click handlers for rotation buttons
  rotModeBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      setRotationMode(e.currentTarget.dataset.mode);
    });
  });
  
  // Initialization of Canvas
  if (canvas) {
    ctx = canvas.getContext('2d');
    // Set display size based on container layout width
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    generateScatterPoints();
    drawScatterPlot();
    
    // Redraw on window resize
    window.addEventListener('resize', () => {
      if (canvas.offsetWidth > 0) {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        drawScatterPlot();
      }
    });
  }

  // Handle slide transition actions (e.g. restarting simulations)
  function handleSlideTransitions(slideIndex) {
    // Stop arch loop by default, start it if slideIndex === 3
    stopArchLoop();
    
    if (slideIndex === 1) {
      // Initialize funnel selection
      selectFunnelStage('esr');
    } else if (slideIndex === 3) {
      startArchLoop();
    } else if (slideIndex === 4) {
      // Reset latency timeline when entering Slide 5 (index 4)
      resetTimeline();
    } else if (slideIndex === 5) {
      updateMemoryCalculator();
    } else if (slideIndex === 6) {
      updateScalarQuantSim();
    } else if (slideIndex === 11) {
      // Re-trigger/resize rotation canvas
      setTimeout(() => {
        if (canvas) {
          canvas.width = canvas.offsetWidth;
          canvas.height = canvas.offsetHeight;
          setRotationMode(activeMode);
        }
      }, 100);
    }
  }

  // Initial update
  updateSlides();
});
