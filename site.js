(() => {
  const surfacesNode = document.getElementById("surface-data");
  const surfaceButtons = Array.from(document.querySelectorAll("[data-surface-button]"));
  const surfaceKicker = document.getElementById("surface-kicker");
  const surfaceTitle = document.getElementById("surface-title");
  const surfaceBody = document.getElementById("surface-body");
  const surfaceMetrics = document.getElementById("surface-metrics");
  const surfacePoints = document.getElementById("surface-points");
  const surfaceImage = document.getElementById("surface-image");

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.18 });

  document.querySelectorAll("[data-reveal]").forEach((node) => revealObserver.observe(node));

  const countObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      animateCount(entry.target);
      countObserver.unobserve(entry.target);
    });
  }, { threshold: 0.45 });

  document.querySelectorAll("[data-count]").forEach((node) => countObserver.observe(node));

  function animateCount(node) {
    const target = Number(node.getAttribute("data-count") || "0");
    const decimals = Number(node.getAttribute("data-decimals") || "0");
    const suffix = node.getAttribute("data-suffix") || "";
    const duration = 1400;
    const started = performance.now();

    function tick(now) {
      const progress = Math.min((now - started) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = target * eased;
      node.textContent = `${value.toFixed(decimals)}${suffix}`;
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  if (surfacesNode && surfaceButtons.length && surfaceKicker && surfaceTitle && surfaceBody && surfaceMetrics && surfacePoints && surfaceImage) {
    const surfaces = JSON.parse(surfacesNode.textContent || "[]");
    let currentSurfaceIndex = 0;
    let autoRotateEnabled = true;

    function renderSurface(index) {
      const surface = surfaces[index];
      if (!surface) return;
      currentSurfaceIndex = index;

      surfaceButtons.forEach((button, buttonIndex) => {
        const active = buttonIndex === index;
        button.classList.toggle("surface-tab-active", active);
        button.setAttribute("aria-selected", active ? "true" : "false");
      });

      surfaceKicker.textContent = surface.kicker;
      surfaceTitle.textContent = surface.title;
      surfaceBody.textContent = surface.body;
      surfaceImage.src = surface.image;
      surfaceImage.alt = surface.alt;

      surfaceMetrics.innerHTML = "";
      surface.metrics.forEach((metric) => {
        const pill = document.createElement("span");
        pill.textContent = metric;
        surfaceMetrics.appendChild(pill);
      });

      surfacePoints.innerHTML = "";
      surface.points.forEach((point) => {
        const item = document.createElement("li");
        item.textContent = point;
        surfacePoints.appendChild(item);
      });
    }

    surfaceButtons.forEach((button, index) => {
      button.addEventListener("click", () => {
        autoRotateEnabled = false;
        renderSurface(index);
      });
    });

    renderSurface(0);

    setInterval(() => {
      if (!autoRotateEnabled) return;
      const nextIndex = (currentSurfaceIndex + 1) % surfaces.length;
      renderSurface(nextIndex);
    }, 5200);
  }

  const specBudgetInput = document.getElementById("spec-budget");
  const specBudgetLabel = document.getElementById("spec-budget-label");
  const specSpeed = document.getElementById("spec-speed");
  const specAcceptance = document.getElementById("spec-acceptance");
  const specRuntime = document.getElementById("spec-runtime");
  const specNote = document.getElementById("spec-note");
  const specButtons = Array.from(document.querySelectorAll("[data-spec-mode]"));

  if (specBudgetInput && specBudgetLabel && specSpeed && specAcceptance && specRuntime && specNote && specButtons.length) {
    let specMode = "standard";

    function renderSpec() {
      const budget = Number(specBudgetInput.value);
      specBudgetLabel.textContent = `${budget} nodes`;

      if (specMode === "standard") {
        specBudgetInput.disabled = true;
        specSpeed.textContent = "1.0x";
        specAcceptance.textContent = "Baseline";
        specRuntime.textContent = "Native generation";
        specNote.textContent = "Standard decoding keeps the simplest path: no draft model, no tree mask, no speculative verification.";
        return;
      }

      if (specMode === "mtplx") {
        specBudgetInput.disabled = true;
        specSpeed.textContent = "2.0x";
        specAcceptance.textContent = "Lossless";
        specRuntime.textContent = "Native MTP heads";
        specNote.textContent = "MTPLX uses baked-in Multi-Token Prediction heads on the model itself. No draft model, zero quality drift, Apple Silicon only.";
        return;
      }

      if (specMode === "dflash") {
        specBudgetInput.disabled = true;
        specSpeed.textContent = "3.2x";
        specAcceptance.textContent = "Around 70%";
        specRuntime.textContent = "Draft and verify";
        specNote.textContent = "DFlash uses a smaller draft model to propose tokens, then verifies them in one pass with the target model.";
        return;
      }

      specBudgetInput.disabled = false;
      const speed = 3.1 + (budget / 64) * 1.6;
      const acceptance = 61 + (budget / 64) * 27;
      specSpeed.textContent = `${speed.toFixed(1)}x`;
      specAcceptance.textContent = `${Math.round(acceptance)}% accepted`;
      specRuntime.textContent = `Tree budget ${budget}`;
      specNote.textContent = budget === 0
        ? "Budget 0 falls back to linear DFlash. Increase the tree budget to explore more candidates in parallel."
        : "DDTree expands multiple draft paths, verifies the tree in one pass, and accepts the longest validated branch.";
    }

    specButtons.forEach((button) => {
      button.addEventListener("click", () => {
        specMode = button.getAttribute("data-spec-mode") || "standard";
        specButtons.forEach((node) => node.classList.toggle("mode-chip-active", node === button));
        renderSpec();
      });
    });

    specBudgetInput.addEventListener("input", renderSpec);
    renderSpec();
  }

  const strategyButtons = Array.from(document.querySelectorAll("[data-strategy]"));
  const contextWindowInput = document.getElementById("context-window");
  const contextWindowLabel = document.getElementById("context-window-label");
  const cacheFootprint = document.getElementById("cache-footprint");
  const cacheRatio = document.getElementById("cache-ratio");
  const cachePlatform = document.getElementById("cache-platform");
  const cacheNote = document.getElementById("cache-note");
  const memoryMeterFill = document.getElementById("memory-meter-fill");

  if (strategyButtons.length && contextWindowInput && contextWindowLabel && cacheFootprint && cacheRatio && cachePlatform && cacheNote && memoryMeterFill) {
    const strategies = {
      native: {
        ratio: 1,
        label: "Native f16",
        platform: "All runtimes",
        note: "Maximum fidelity. The simplest path; great for baseline measurement."
      },
      turboquant: {
        ratio: 4.8,
        label: "TurboQuant",
        platform: "Apple Silicon + llama.cpp turbo",
        note: "Fused kernels and aggressive KV compression for long contexts on text models."
      },
      triattention: {
        ratio: 4.3,
        label: "TriAttention",
        platform: "Apple Silicon (MLX)",
        note: "Norm-scored token eviction inside the MLX worker for hard cache budgets."
      },
      fbcache: {
        ratio: 1.8,
        label: "FBCache",
        platform: "Diffusion DiTs (image + video)",
        note: "First Block Cache via diffusers 0.36. Roughly 1.8x speedup with imperceptible drift."
      },
      teacache: {
        ratio: 2.1,
        label: "TeaCache",
        platform: "Diffusion DiTs (FLUX family)",
        note: "Timestep embedding cache for FLUX, HunyuanVideo, LTX, CogVideoX, Mochi."
      },
      taylorseer: {
        ratio: 2.4,
        label: "TaylorSeer",
        platform: "Diffusion DiTs",
        note: "Polynomial extrapolation across denoise steps. Ships natively in diffusers 0.38."
      },
      magcache: {
        ratio: 2.6,
        label: "MagCache",
        platform: "Diffusion DiTs (FLUX, calibrated)",
        note: "Magnitude-aware step skipping calibrated for FLUX-family flow-match models."
      },
      pab: {
        ratio: 2.0,
        label: "PAB",
        platform: "Diffusion DiTs",
        note: "Pyramid Attention Broadcast — reuses attention maps across nearby denoise steps."
      },
      fastercache: {
        ratio: 1.9,
        label: "FasterCache",
        platform: "Diffusion DiTs",
        note: "Attention + feature caching with adaptive granularity per denoise band."
      }
    };

    let activeStrategy = "native";

    function renderCache() {
      const contextK = Number(contextWindowInput.value);
      const strategy = strategies[activeStrategy];
      const baselineGb = contextK * 0.28;
      const estimatedGb = baselineGb / strategy.ratio;
      const meterWidth = Math.min((estimatedGb / 24) * 100, 100);

      contextWindowLabel.textContent = `${contextK}K`;
      cacheFootprint.textContent = `${estimatedGb.toFixed(1)} GB`;
      cacheRatio.textContent = `${strategy.ratio.toFixed(1)}x`;
      cachePlatform.textContent = strategy.platform;
      cacheNote.textContent = `${strategy.label}: ${strategy.note}`;
      memoryMeterFill.style.width = `${meterWidth}%`;
    }

    strategyButtons.forEach((button) => {
      button.addEventListener("click", () => {
        activeStrategy = button.getAttribute("data-strategy") || "native";
        strategyButtons.forEach((node) => node.classList.toggle("strategy-chip-active", node === button));
        renderCache();
      });
    });

    contextWindowInput.addEventListener("input", renderCache);
    renderCache();
  }
})();
