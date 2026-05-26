document.addEventListener('DOMContentLoaded', () => {
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
    // PQ: Split D into subvectors of size 8. Each subvector gets 1 byte index.
    // Plus the codebook size (256 centroids * 8 dimensions * 4 bytes/float * D/8 channels). This is small so we ignore or add as constant.
    const pqBytes = V * (D / 8) * 1; 
    
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
          return `<div class="vector-dimension" style="background: ${colors[group]}; width: 68px; font-weight: bold; border: 1px solid rgba(255,255,255,0.25);">${codebookIndex}</div>`;
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
    if (slideIndex === 1) {
      updateMemoryCalculator();
    } else if (slideIndex === 2) {
      updateScalarQuantSim();
    } else if (slideIndex === 7) {
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
