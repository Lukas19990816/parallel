    const btnRefreshDevices = document.getElementById('btnRefreshDevices');
    const btnCaptureTab = document.getElementById('btnCaptureTab');
    const btnSyncReset = document.getElementById('btnSyncReset');
    const btnStop = document.getElementById('btnStop');
    const statusBadge = document.getElementById('statusBadge');
    const statusText = document.getElementById('statusText');
    const dspLatency = document.getElementById('dspLatency');

    const selectA = document.getElementById('selectA');
    const selectB = document.getElementById('selectB');
    const volA = document.getElementById('volA');
    const volB = document.getElementById('volB');
    const masterVol = document.getElementById('masterVol');
    const xfader = document.getElementById('xfader');
    const xfaderReset = document.getElementById('xfaderReset');
    const delayA = document.getElementById('delayA');
    const delayB = document.getElementById('delayB');

    const muteA = document.getElementById('muteA');
    const muteB = document.getElementById('muteB');
    const muteIconA = document.getElementById('muteIconA');
    const muteIconB = document.getElementById('muteIconB');
    const muteTextA = document.getElementById('muteTextA');
    const muteTextB = document.getElementById('muteTextB');
    const soloA = document.getElementById('soloA');
    const soloB = document.getElementById('soloB');

    const wheelA = document.getElementById('wheelA');
    const wheelB = document.getElementById('wheelB');

    const volLabelA = document.getElementById('volLabelA');
    const volLabelB = document.getElementById('volLabelB');
    const masterVolLabel = document.getElementById('masterVolLabel');
    const xfaderLabel = document.getElementById('xfaderLabel');
    const delayLabelA = document.getElementById('delayLabelA');
    const delayLabelB = document.getElementById('delayLabelB');

    const audioElA = document.getElementById('audioElA');
    const audioElB = document.getElementById('audioElB');
    const canvas = document.getElementById('visualizer');
    const canvasCtx = canvas.getContext('2d');

    // Guide Drawer & FAQ References
    const btnToggleGuide = document.getElementById('btnToggleGuide');
    const guideDrawer = document.getElementById('guideDrawer');

    // Pre-Share Guidance & Browser Matrix Modal References
    const preShareModal = document.getElementById('preShareModal');
    const modalPreShareClose = document.getElementById('modalPreShareClose');
    const modalPreShareCancel = document.getElementById('modalPreShareCancel');
    const modalPreShareProceed = document.getElementById('modalPreShareProceed');

    const browserMatrixModal = document.getElementById('browserMatrixModal');
    const btnOpenBrowserMatrix = document.getElementById('btnOpenBrowserMatrix');
    const modalMatrixClose = document.getElementById('modalMatrixClose');
    const modalMatrixDismiss = document.getElementById('modalMatrixDismiss');

    // Build 16-segment VU meters safely using DOM APIs
    const vuContainerA = document.getElementById('vuA');
    const vuContainerB = document.getElementById('vuB');
    const vuSegsA = [];
    const vuSegsB = [];

    for (let i = 0; i < 16; i++) {
      const segA = document.createElement('div');
      segA.className = 'vu-seg';
      vuContainerA.appendChild(segA);
      vuSegsA.push(segA);

      const segB = document.createElement('div');
      segB.className = 'vu-seg';
      vuContainerB.appendChild(segB);
      vuSegsB.push(segB);
    }

    // --- Google Analytics 4 (GA4) Telemetry & Engagement Tracking ---
    function trackEvent(eventName, params = {}) {
      if (typeof window.gtag === 'function') {
        try {
          window.gtag('event', eventName, params);
        } catch (_) {}
      }
    }

    const sessionStartTime = Date.now();
    let totalListeningSeconds = 0;
    const dwellMilestonesReported = new Set();
    const listeningMilestonesReported = new Set();
    let delayTrackTimeout = null;

    function trackDelayChange(deck, val) {
      clearTimeout(delayTrackTimeout);
      delayTrackTimeout = setTimeout(() => {
        trackEvent('delay_adjusted', { deck, delay_ms: Number(val) });
      }, 500);
    }

    // 1-second engagement & active listening heartbeat
    setInterval(() => {
      const now = Date.now();
      const dwellSec = Math.floor((now - sessionStartTime) / 1000);
      const isListening = !!(audioCtx && audioCtx.state === 'running' && (capturedStream || isLocalFileMode));

      if (isListening) {
        totalListeningSeconds += 1;
      }

      // Dwell milestones: 30s, 60s (1m), 180s (3m), 300s (5m), 600s (10m), 900s (15m), 1800s (30m), 3600s (60m)
      const dwellMilestones = [30, 60, 180, 300, 600, 900, 1800, 3600];
      for (const m of dwellMilestones) {
        if (dwellSec >= m && !dwellMilestonesReported.has(m)) {
          dwellMilestonesReported.add(m);
          trackEvent('dwell_milestone', {
            milestone_seconds: m,
            total_dwell_seconds: dwellSec,
            total_listening_seconds: totalListeningSeconds,
            is_listening: isListening
          });
        }
      }

      // Listening milestones: 60s (1m), 300s (5m), 600s (10m), 900s (15m), 1800s (30m), 3600s (60m)
      const listenMilestones = [60, 300, 600, 900, 1800, 3600];
      for (const m of listenMilestones) {
        if (totalListeningSeconds >= m && !listeningMilestonesReported.has(m)) {
          listeningMilestonesReported.add(m);
          trackEvent('listening_milestone', {
            listening_seconds: m,
            total_dwell_seconds: dwellSec
          });
        }
      }
    }, 1000);

    // Pagehide / unload session summary beacon
    window.addEventListener('pagehide', () => {
      const dwellSec = Math.floor((Date.now() - sessionStartTime) / 1000);
      trackEvent('session_summary', {
        total_dwell_seconds: dwellSec,
        total_listening_seconds: totalListeningSeconds,
        has_audio_played: totalListeningSeconds > 0
      });
    });

    let capturedStream = null;
    let isLocalFileMode = false;
    let localFileObjectUrl = null;
    let audioCtx = null;
    // Resilient Central Reservoir: 250ms buffer absorbs Bluetooth 2.4GHz TDM packet bursts
    const RESERVOIR_BUFFER_SEC = 0.25;
    let reservoirNode = null;
    let gainNodeA = null;
    let gainNodeB = null;
    let delayNodeA = null;
    let delayNodeB = null;
    let analyserNode = null;
    let isMutedA = false;
    let isMutedB = false;
    let isSoloA = false;
    let isSoloB = false;
    let animId = null;

    // Acoustic Matrix Enhancer State & DOM Nodes
    const btnFxTube = document.getElementById('btnFxTube');
    const btnFxSurround = document.getElementById('btnFxSurround');
    const btnFxCrossfeed = btnFxSurround; // Alias for backward compatibility
    const btnFxSpatial = document.getElementById('btnFxSpatial');

    const btnSurroundMode = document.getElementById('btnSurroundMode');
    const btnSpatialMode = document.getElementById('btnSpatialMode');
    const fxSurroundLabel = document.getElementById('fxSurroundLabel');

    const fxTubeLevel = document.getElementById('fxTubeLevel');
    const fxSurroundLevel = document.getElementById('fxSurroundLevel');
    const fxCrossfeedLevel = fxSurroundLevel; // Alias
    const fxSpatialLevel = document.getElementById('fxSpatialLevel');

    const fxTubeVal = document.getElementById('fxTubeVal');
    const fxSurroundVal = document.getElementById('fxSurroundVal');
    const fxCrossfeedVal = fxSurroundVal; // Alias
    const fxSpatialVal = document.getElementById('fxSpatialVal');

    const fxRowTube = document.getElementById('fxRowTube');
    const fxRowSurround = document.getElementById('fxRowSurround');
    const fxRowCrossfeed = fxRowSurround; // Alias
    const fxRowSpatial = document.getElementById('fxRowSpatial');

    let isTubeActive = false;
    let isSurroundActive = false;
    let isCrossfeedActive = false;
    let isSpatialActive = false;

    let tubeIntensity = 40;
    let surroundIntensity = 70;
    let crossfeedIntensity = 70;
    let spatialIntensity = 55;

    let surroundMode = '3D';       // '3D' (Surround Expansion) or 'XF' (Bauer Crossfeed)
    let spatialMode = 'CINEMA';    // 'CINEMA' (480ms 3D Theater) or 'STUDIO' (240ms Studio)

    try {
      isTubeActive = localStorage.getItem('parallel_fx_tube') === 'true';
      isSurroundActive = (localStorage.getItem('parallel_fx_surround') || localStorage.getItem('parallel_fx_crossfeed')) === 'true';
      isCrossfeedActive = isSurroundActive;
      isSpatialActive = localStorage.getItem('parallel_fx_spatial') === 'true';

      const savedTube = localStorage.getItem('parallel_fx_tube_level');
      if (savedTube !== null) tubeIntensity = parseInt(savedTube, 10);

      const savedSurround = localStorage.getItem('parallel_fx_surround_level') || localStorage.getItem('parallel_fx_crossfeed_level');
      if (savedSurround !== null) {
        surroundIntensity = parseInt(savedSurround, 10);
        crossfeedIntensity = surroundIntensity;
      }

      const savedSpatial = localStorage.getItem('parallel_fx_spatial_level');
      if (savedSpatial !== null) spatialIntensity = parseInt(savedSpatial, 10);

      const savedSurroundMode = localStorage.getItem('parallel_fx_surround_mode');
      if (savedSurroundMode === '3D' || savedSurroundMode === 'XF') surroundMode = savedSurroundMode;

      const savedSpatialMode = localStorage.getItem('parallel_fx_spatial_mode');
      if (savedSpatialMode === 'CINEMA' || savedSpatialMode === 'STUDIO') spatialMode = savedSpatialMode;
    } catch (_) {}

    let tubeNode = null;
    let convolverNode = null;
    let spatialDryNode = null;
    let spatialWetNode = null;
    let surroundWidthNode = null;
    let surroundShelfNode = null;

    // Headphone Acoustic Profiles & Hardware Calibration System
    const profileA = document.getElementById('profileA');
    const profileB = document.getElementById('profileB');
    const profileBadgeA = document.getElementById('profileBadgeA');
    const profileBadgeB = document.getElementById('profileBadgeB');
    const btnAutoTuneMatrix = document.getElementById('btnAutoTuneMatrix');

    let profileKeyA = 'AUTO';
    let profileKeyB = 'AUTO';
    try {
      profileKeyA = localStorage.getItem('parallel_profile_a') || 'AUTO';
      profileKeyB = localStorage.getItem('parallel_profile_b') || 'AUTO';
    } catch (_) {}

    if (profileA) profileA.value = profileKeyA;
    if (profileB) profileB.value = profileKeyB;

    let profileLowA = null, profileMidA = null, profileHighA = null;
    let profileLowB = null, profileMidB = null, profileHighB = null;


    function applyDeckProfile(deck, selectedProfileKey) {
      const isA = deck === 'A';
      const selectEl = isA ? selectA : selectB;
      const badgeEl = isA ? profileBadgeA : profileBadgeB;
      const lowNode = isA ? profileLowA : profileLowB;
      const midNode = isA ? profileMidA : profileMidB;
      const highNode = isA ? profileHighA : profileHighB;

      let activeKey = selectedProfileKey;
      let isAuto = false;
      const devId = selectEl ? selectEl.value : '';

      if (selectedProfileKey === 'AUTO') {
        isAuto = true;
        const savedDevProfile = devId ? localStorage.getItem('parallel_dev_profile_' + devId) : null;
        if (savedDevProfile && HEADPHONE_PROFILES[savedDevProfile]) {
          activeKey = savedDevProfile;
        } else {
          const currentDev = selectEl && selectEl.selectedOptions && selectEl.selectedOptions[0] ? selectEl.selectedOptions[0].text : '';
          activeKey = detectHeadphoneProfile(currentDev);
        }
      } else {
        if (devId) {
          try { localStorage.setItem('parallel_dev_profile_' + devId, activeKey); } catch (_) {}
        }
      }

      const cfg = HEADPHONE_PROFILES[activeKey] || HEADPHONE_PROFILES.FLAT;

      if (badgeEl) {
        badgeEl.textContent = isAuto ? `◆ ${cfg.badge}` : cfg.badge;
        badgeEl.classList.toggle('active-pro', activeKey !== 'FLAT');
        badgeEl.title = `${cfg.name} // ${cfg.desc}`;
      }

      if (audioCtx && lowNode && midNode && highNode) {
        const now = audioCtx.currentTime;
        lowNode.frequency.setTargetAtTime(cfg.low.freq, now, 0.02);
        lowNode.gain.setTargetAtTime(cfg.low.gain, now, 0.02);

        midNode.frequency.setTargetAtTime(cfg.mid.freq, now, 0.02);
        midNode.Q.setTargetAtTime(cfg.mid.Q, now, 0.02);
        midNode.gain.setTargetAtTime(cfg.mid.gain, now, 0.02);

        highNode.frequency.setTargetAtTime(cfg.high.freq, now, 0.02);
        highNode.gain.setTargetAtTime(cfg.high.gain, now, 0.02);
      }
    }

    // Auto-Optimize Master Acoustic Matrix based on both connected headphones
    function autoOptimizeMatrix() {
      const devA = selectA && selectA.selectedOptions && selectA.selectedOptions[0] ? selectA.selectedOptions[0].text : '';
      const devB = selectB && selectB.selectedOptions && selectB.selectedOptions[0] ? selectB.selectedOptions[0].text : '';
      const devIdA = selectA ? selectA.value : '';
      const devIdB = selectB ? selectB.value : '';

      const getActiveProfileKey = (key, devId, devText) => {
        if (key !== 'AUTO') return key;
        const saved = devId ? localStorage.getItem('parallel_dev_profile_' + devId) : null;
        if (saved && HEADPHONE_PROFILES[saved]) return saved;
        return detectHeadphoneProfile(devText);
      };

      const profA = getActiveProfileKey(profileKeyA, devIdA, devA);
      const profB = getActiveProfileKey(profileKeyB, devIdB, devB);

      let targetTube = 35;
      let targetSurround = 65;
      let targetSpatial = 45;
      let targetSurroundMode = '3D';
      let targetSpatialMode = 'CINEMA';
      let statusLabel = '✓ OPTIMIZED!';

      const isSonyA = profA === 'SONY_1000X';
      const isSonyB = profB === 'SONY_1000X';

      if (isSonyA && isSonyB) {
        // Dual Flagship Purist Tuning: minimal coloration to avoid double-processing conflict with Sony V1/QN1
        targetTube = 12;
        targetSurround = 32;
        targetSpatial = 18;
        targetSurroundMode = 'XF';   // Bauer crossfeed avoids comb filtering on sealed ANC earcups
        targetSpatialMode = 'STUDIO'; // Short studio room avoids echo chamber
        statusLabel = '✓ PURIST SONY MODE';
      } else if (isSonyA || isSonyB) {
        // Mixed pairing (Sony XM5 + Space One or AirPods)
        targetTube = 22;
        targetSurround = 48;
        targetSpatial = 30;
        targetSurroundMode = '3D';
        targetSpatialMode = 'STUDIO';
        statusLabel = '✓ BALANCED CALIBRATED';
      } else if (profA === 'SOUNDCORE' || profB === 'SOUNDCORE') {
        targetTube = 45;
        targetSurround = 85;
        targetSpatial = 65;
        targetSurroundMode = '3D';
        targetSpatialMode = 'CINEMA';
        statusLabel = '✓ CINEMA 3D MODE';
      } else if (profA === 'AIRPODS_PRO' || profB === 'AIRPODS_PRO') {
        targetTube = 38;
        targetSurround = 80;
        targetSpatial = 60;
        targetSurroundMode = '3D';
        targetSpatialMode = 'CINEMA';
        statusLabel = '✓ AIRPODS PRO 3D';
      } else if (profA === 'AIRPODS_OPEN' || profB === 'AIRPODS_OPEN') {
        targetTube = 45;
        targetSurround = 65;
        targetSpatial = 50;
        targetSurroundMode = '3D';
        targetSpatialMode = 'STUDIO';
        statusLabel = '✓ AIRPODS OPEN AIR';
      }

      isTubeActive = targetTube > 0;
      isSurroundActive = true;
      isCrossfeedActive = true;
      surroundMode = targetSurroundMode;
      isSpatialActive = true;
      spatialMode = targetSpatialMode;

      tubeIntensity = targetTube;
      surroundIntensity = targetSurround;
      crossfeedIntensity = targetSurround;
      spatialIntensity = targetSpatial;

      try {
        localStorage.setItem('parallel_fx_tube', isTubeActive ? 'true' : 'false');
        localStorage.setItem('parallel_fx_surround', 'true');
        localStorage.setItem('parallel_fx_crossfeed', 'true');
        localStorage.setItem('parallel_fx_surround_mode', surroundMode);
        localStorage.setItem('parallel_fx_spatial', 'true');
        localStorage.setItem('parallel_fx_spatial_mode', spatialMode);
        localStorage.setItem('parallel_fx_tube_level', tubeIntensity);
        localStorage.setItem('parallel_fx_surround_level', surroundIntensity);
        localStorage.setItem('parallel_fx_crossfeed_level', surroundIntensity);
        localStorage.setItem('parallel_fx_spatial_level', spatialIntensity);
      } catch (_) {}

      updateFxVisuals();
      applyTubeCurve();
      applySurroundParams();
      applySpatialParams();
      trackEvent('matrix_auto_tune', { prof_a: profA, prof_b: profB, mode: statusLabel });

      if (btnAutoTuneMatrix) {
        const orig = btnAutoTuneMatrix.textContent;
        btnAutoTuneMatrix.textContent = statusLabel;
        setTimeout(() => { btnAutoTuneMatrix.textContent = orig; }, 2200);
      }
    }

    // Smooth Asymmetric Soft Saturation Curve Generator:
    // Produces pure 2nd-harmonic tube warmth without harsh zero-crossing glitch or digital clipping.
    function makeTubeCurve(intensity = 0.4, samples = 2048) {
      const curve = new Float32Array(samples);
      if (intensity <= 0.01) {
        for (let i = 0; i < samples; i++) {
          curve[i] = (i * 2) / (samples - 1) - 1;
        }
        return curve;
      }
      const drive = 1.0 + intensity * 1.5;   // 1.0 ~ 2.5 drive
      const asym = 0.22 * intensity;          // 0.0 ~ 0.22 even-harmonic asymmetry
      let maxVal = 0;
      const raw = new Float32Array(samples);
      for (let i = 0; i < samples; i++) {
        const x = (i * 2) / (samples - 1) - 1;
        const u = x + asym * x * x;
        const y = Math.tanh(drive * u);
        raw[i] = y;
        const absY = Math.abs(y);
        if (absY > maxVal) maxVal = absY;
      }
      // Bounded normalization keeps maximum peak strictly <= 0.95 (0dBFS protection)
      const norm = maxVal > 0 ? (0.95 / maxVal) : 1;
      for (let i = 0; i < samples; i++) {
        curve[i] = raw[i] * norm;
      }
      return curve;
    }

    function makeLinearCurve(samples = 2) {
      const curve = new Float32Array(samples);
      curve[0] = -1;
      curve[1] = 1;
      return curve;
    }

    // High-Fidelity 3D Spatial Theater / Studio Room Impulse Response Generator
    function createStudioRoomIR(ctx, isCinema = true) {
      const sampleRate = ctx.sampleRate;
      const duration = isCinema ? 0.52 : 0.24;
      const decay = isCinema ? 2.5 : 3.6;
      const length = Math.max(1, Math.floor(sampleRate * duration));
      const irBuffer = ctx.createBuffer(2, length, sampleRate);
      const left = irBuffer.getChannelData(0);
      const right = irBuffer.getChannelData(1);

      const cinemaReflections = [
        { t: 0.012, gL: 0.70, gR: 0.22 },
        { t: 0.019, gL: 0.20, gR: 0.68 },
        { t: 0.031, gL: 0.55, gR: 0.35 },
        { t: 0.046, gL: 0.32, gR: 0.58 },
        { t: 0.068, gL: 0.45, gR: 0.42 },
        { t: 0.098, gL: 0.38, gR: 0.26 },
        { t: 0.138, gL: 0.25, gR: 0.36 },
        { t: 0.185, gL: 0.20, gR: 0.22 },
        { t: 0.240, gL: 0.16, gR: 0.18 },
        { t: 0.310, gL: 0.12, gR: 0.12 }
      ];

      const studioReflections = [
        { t: 0.012, gL: 0.65, gR: 0.20 },
        { t: 0.022, gL: 0.22, gR: 0.60 },
        { t: 0.035, gL: 0.50, gR: 0.35 },
        { t: 0.052, gL: 0.30, gR: 0.45 },
        { t: 0.075, gL: 0.38, gR: 0.25 },
        { t: 0.105, gL: 0.22, gR: 0.32 }
      ];

      const early = isCinema ? cinemaReflections : studioReflections;
      early.forEach(r => {
        const idx = Math.floor(r.t * sampleRate);
        if (idx < length) {
          left[idx] += r.gL * 0.85;
          right[idx] += r.gR * 0.85;
        }
      });

      let prevL = 0;
      let prevR = 0;
      const dampFactor = isCinema ? 0.55 : 0.70;
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const env = Math.exp(-decay * (t / duration));
        const damping = Math.max(0.10, 1.0 - (t / duration) * dampFactor);
        const rawL = (Math.random() * 2 - 1) * env * 0.42;
        const rawR = (Math.random() * 2 - 1) * env * 0.42;
        prevL = prevL * (1 - damping) + rawL * damping;
        prevR = prevR * (1 - damping) + rawR * damping;
        left[i] += prevL;
        right[i] += prevR;
      }

      let max = 0;
      for (let i = 0; i < length; i++) {
        if (Math.abs(left[i]) > max) max = Math.abs(left[i]);
        if (Math.abs(right[i]) > max) max = Math.abs(right[i]);
      }
      if (max > 0) {
        for (let i = 0; i < length; i++) {
          left[i] /= max;
          right[i] /= max;
        }
      }
      return irBuffer;
    }

    function updateFxVisuals() {
      if (btnFxTube) btnFxTube.classList.toggle('active', isTubeActive);
      if (fxRowTube) fxRowTube.classList.toggle('active', isTubeActive);
      if (fxTubeLevel) fxTubeLevel.value = tubeIntensity;
      if (fxTubeVal) fxTubeVal.textContent = tubeIntensity + '%';

      if (btnFxSurround) btnFxSurround.classList.toggle('active', isSurroundActive);
      if (fxRowSurround) fxRowSurround.classList.toggle('active', isSurroundActive);
      if (fxSurroundLevel) fxSurroundLevel.value = surroundIntensity;
      if (fxSurroundVal) fxSurroundVal.textContent = surroundIntensity + '%';

      if (btnSurroundMode) {
        btnSurroundMode.textContent = surroundMode;
        btnSurroundMode.classList.toggle('surround-mode-3d', surroundMode === '3D');
        btnSurroundMode.title = surroundMode === '3D'
          ? '目前：3D WIDE (立體劇院環繞聲場外擴) - 點擊切換為 XF (Bauer 互饋監聽)'
          : '目前：XF (Bauer 雙耳互饋監聽) - 點擊切換為 3D (劇院環繞外擴)';
      }
      if (fxSurroundLabel) {
        fxSurroundLabel.textContent = surroundMode === '3D' ? 'SURROUND' : 'CROSS';
      }

      if (btnFxSpatial) btnFxSpatial.classList.toggle('active', isSpatialActive);
      if (fxRowSpatial) fxRowSpatial.classList.toggle('active', isSpatialActive);
      if (fxSpatialLevel) fxSpatialLevel.value = spatialIntensity;
      if (fxSpatialVal) fxSpatialVal.textContent = spatialIntensity + '%';

      if (btnSpatialMode) {
        btnSpatialMode.textContent = spatialMode;
        btnSpatialMode.classList.toggle('spatial-mode-cinema', spatialMode === 'CINEMA');
        btnSpatialMode.title = spatialMode === 'CINEMA'
          ? '目前：CINEMA (480ms 劇院巨幕環繞反射) - 點擊切換為 STUDIO'
          : '目前：STUDIO (240ms 錄音室近場監聽) - 點擊切換為 CINEMA';
      }
    }

    function applyTubeCurve() {
      if (!tubeNode) return;
      tubeNode.curve = isTubeActive ? makeTubeCurve(tubeIntensity / 100) : makeLinearCurve();
    }

    function applySurroundParams() {
      if (!audioCtx || !surroundWidthNode) return;
      const now = audioCtx.currentTime;
      if (!isSurroundActive) {
        surroundWidthNode.gain.setTargetAtTime(1.0, now, 0.02);
        if (surroundShelfNode) surroundShelfNode.gain.setTargetAtTime(0, now, 0.02);
        return;
      }
      const norm = surroundIntensity / 100;
      if (surroundMode === '3D') {
        const targetWidth = 1.0 + norm * 1.8; // 1.0 to 2.8x M/S expansion
        const targetShelf = norm * 4.0;       // up to +4dB diffuse air
        surroundWidthNode.gain.setTargetAtTime(targetWidth, now, 0.02);
        if (surroundShelfNode) surroundShelfNode.gain.setTargetAtTime(targetShelf, now, 0.02);
      } else {
        const targetWidth = 1.0 - norm * 0.65; // Bauer side attenuation
        const targetShelf = -norm * 3.0;
        surroundWidthNode.gain.setTargetAtTime(targetWidth, now, 0.02);
        if (surroundShelfNode) surroundShelfNode.gain.setTargetAtTime(targetShelf, now, 0.02);
      }
    }

    function getSpatialWetGain() {
      if (!isSpatialActive) return 0.0;
      const maxWet = spatialMode === 'CINEMA' ? 0.65 : 0.45;
      return (spatialIntensity / 100) * maxWet;
    }

    function applySpatialParams() {
      if (!audioCtx || !spatialWetNode) return;
      const now = audioCtx.currentTime;
      const targetWet = getSpatialWetGain();
      spatialWetNode.gain.setTargetAtTime(targetWet, now, 0.02);
      if (spatialDryNode) {
        const targetDry = 1.0 - (targetWet * 0.3);
        spatialDryNode.gain.setTargetAtTime(targetDry, now, 0.02);
      }
    }

    function toggleTube() {
      isTubeActive = !isTubeActive;
      try { localStorage.setItem('parallel_fx_tube', isTubeActive); } catch (_) {}
      updateFxVisuals();
      applyTubeCurve();
    }

    function toggleSurround() {
      isSurroundActive = !isSurroundActive;
      isCrossfeedActive = isSurroundActive;
      try {
        localStorage.setItem('parallel_fx_surround', isSurroundActive);
        localStorage.setItem('parallel_fx_crossfeed', isSurroundActive);
      } catch (_) {}
      updateFxVisuals();
      applySurroundParams();
    }

    function toggleSurroundMode() {
      surroundMode = surroundMode === '3D' ? 'XF' : '3D';
      try { localStorage.setItem('parallel_fx_surround_mode', surroundMode); } catch (_) {}
      updateFxVisuals();
      applySurroundParams();
    }

    function toggleSpatial() {
      isSpatialActive = !isSpatialActive;
      try { localStorage.setItem('parallel_fx_spatial', isSpatialActive); } catch (_) {}
      updateFxVisuals();
      applySpatialParams();
    }

    function toggleSpatialMode() {
      spatialMode = spatialMode === 'CINEMA' ? 'STUDIO' : 'CINEMA';
      try { localStorage.setItem('parallel_fx_spatial_mode', spatialMode); } catch (_) {}
      if (convolverNode && audioCtx) {
        convolverNode.buffer = createStudioRoomIR(audioCtx, spatialMode === 'CINEMA');
      }
      updateFxVisuals();
      applySpatialParams();
    }

    updateFxVisuals();

    function applyLanguage(lang) {
      currentLang = lang;
      try { localStorage.setItem('parallel_lang', lang); } catch (_) {}
      document.documentElement.lang = lang === 'zh' ? 'zh-Hant' : lang;
      trackEvent('language_changed', { lang });

      document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
      });

      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = t(key);
      });

      document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        el.setAttribute('placeholder', t(key));
      });

      document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        el.setAttribute('title', t(key));
      });

      if (!audioCtx) {
        statusText.textContent = t('statusStandby');
      } else if (isLocalFileMode) {
        statusText.textContent = t('statusFileActive');
      } else {
        statusText.textContent = t('statusTabActive');
      }
    }

    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', () => applyLanguage(btn.dataset.lang));
    });

    // 1. Enumerate audio output devices safely (no innerHTML with untrusted device labels)
    async function loadAudioDevices(requestPermissionFirst = false) {
      try {
        if (requestPermissionFirst) {
          const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          tempStream.getTracks().forEach(t => t.stop());
        }

        let devices = await navigator.mediaDevices.enumerateDevices();
        let outputs = devices.filter(d => d.kind === 'audiooutput');

        // Auto-unlock audio device labels if user started Tab Link or Local File before clicking [1]
        if (!requestPermissionFirst && outputs.every(d => !d.label)) {
          try {
            const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            tempStream.getTracks().forEach(t => t.stop());
            devices = await navigator.mediaDevices.enumerateDevices();
            outputs = devices.filter(d => d.kind === 'audiooutput');
          } catch (_) {
            // Continue with default sink if mic permission was declined
          }
        }

        if (outputs.length === 0) {
          alert(t('errNoOutputs'));
          return;
        }

        const prevA = selectA.value;
        const prevB = selectB.value;

        selectA.replaceChildren();
        selectB.replaceChildren();

        outputs.forEach((dev, idx) => {
          const label = dev.label || `AUDIO SINK #${idx + 1}`;
          selectA.add(new Option(label, dev.deviceId));
          selectB.add(new Option(label, dev.deviceId));
        });

        // Generic auto-selection: prioritize external / Bluetooth headphones over built-in speakers or virtual devices
        const externalSinks = outputs.filter(
          d => d.deviceId !== 'default' &&
               d.deviceId !== 'communications' &&
               !/built-in|internal|內建|揚聲器|speakers|teams|zoom|blackhole|soundflower|virtual/i.test(d.label)
        );

        if (prevA && outputs.some(d => d.deviceId === prevA)) {
          selectA.value = prevA;
        } else if (externalSinks.length >= 1) {
          selectA.value = externalSinks[0].deviceId;
        }

        if (prevB && outputs.some(d => d.deviceId === prevB)) {
          selectB.value = prevB;
        } else if (externalSinks.length >= 2) {
          selectB.value = externalSinks[1].deviceId;
        } else if (outputs.length > 1) {
          selectB.selectedIndex = 1;
        }

        await routeDeckSink('A', selectA.value);
        await routeDeckSink('B', selectB.value);

        applyDeckProfile('A', profileKeyA);
        applyDeckProfile('B', profileKeyB);

        if (requestPermissionFirst) {
          trackEvent('scan_devices', { output_count: outputs.length });
        }
      } catch (err) {
        console.error(err);
        alert(t('errLoadFailed') + err.message);
      }
    }

    async function routeDeckSink(deck, deviceId) {
      if (!deviceId) return;
      const el = deck === 'A' ? audioElA : audioElB;

      if (typeof el.setSinkId === 'function') {
        try {
          await el.setSinkId(deviceId);
        } catch (err) {
          console.warn('setSinkId failed:', err);
        }
      } else {
        alert(t('errNoSinkId'));
      }
    }

    // Build / Flush dual audio graph using resilient 'playback' clock
    async function buildLowLatencyGraph() {
      if (!isLocalFileMode && !capturedStream) return;

      if (animId) cancelAnimationFrame(animId);
      if (audioCtx) { await audioCtx.close().catch(() => {}); audioCtx = null; }
      audioElA.pause();
      audioElB.pause();
      audioElA.srcObject = null;
      audioElB.srcObject = null;

      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      // AudioContext configuration: 'playback' hint ensures OS allocates optimal ring buffer & thread scheduling
      try {
        audioCtx = new AudioCtxClass({ latencyHint: 'playback' });
      } catch (_) {
        audioCtx = new AudioCtxClass();
      }

      let source = null;
      if (isLocalFileMode && localFileObjectUrl) {
        // Clone audio element so a fresh MediaElementAudioSourceNode can bind cleanly without speaker bleed
        const resumeTime = localFilePlayer.currentTime || 0;
        const freshPlayer = localFilePlayer.cloneNode(false);
        freshPlayer.src = localFileObjectUrl;
        freshPlayer.style.display = 'block';
        freshPlayer.currentTime = resumeTime;
        localFilePlayer.replaceWith(freshPlayer);
        localFilePlayer = freshPlayer;
        source = audioCtx.createMediaElementSource(localFilePlayer);
        await localFilePlayer.play();
      } else {
        const audioTracks = capturedStream.getAudioTracks();
        if (audioTracks.length === 0) return;
        const audioOnlyStream = new MediaStream([audioTracks[0]]);
        source = audioCtx.createMediaStreamSource(audioOnlyStream);
      }

      // Central Deep Reservoir Node: absorbs 2.4GHz Bluetooth TDM packet jitter
      reservoirNode = audioCtx.createDelay(1.0);
      reservoirNode.delayTime.setValueAtTime(RESERVOIR_BUFFER_SEC, audioCtx.currentTime);
      source.connect(reservoirNode);

      // --- 1. TUBE WARMTH STAGE (WaveShaper with 2nd-order harmonics) ---
      tubeNode = audioCtx.createWaveShaper();
      tubeNode.oversample = '4x';
      tubeNode.curve = isTubeActive ? makeTubeCurve(tubeIntensity / 100) : makeLinearCurve();
      reservoirNode.connect(tubeNode);

      // --- 2. SPATIAL AIR STAGE (Convolver room ambience dry/wet blend) ---
      convolverNode = audioCtx.createConvolver();
      convolverNode.buffer = createStudioRoomIR(audioCtx, spatialMode === 'CINEMA');

      const initWet = getSpatialWetGain();
      spatialDryNode = audioCtx.createGain();
      spatialDryNode.gain.value = 1.0 - (initWet * 0.3);

      spatialWetNode = audioCtx.createGain();
      spatialWetNode.gain.value = initWet;

      const spatialSumNode = audioCtx.createGain();
      spatialSumNode.channelCount = 2;
      spatialSumNode.channelCountMode = 'explicit';

      tubeNode.connect(spatialDryNode);
      spatialDryNode.connect(spatialSumNode);

      tubeNode.connect(convolverNode);
      convolverNode.connect(spatialWetNode);
      spatialWetNode.connect(spatialSumNode);

      // --- 3. 3D SPATIAL SURROUND & BINAURAL MATRIX STAGE ---
      const spatialSplitter = audioCtx.createChannelSplitter(2);
      const spatialMerger = audioCtx.createChannelMerger(2);

      // Mid Channel (L + R) * 0.5
      const midGainL = audioCtx.createGain(); midGainL.gain.value = 0.5;
      const midGainR = audioCtx.createGain(); midGainR.gain.value = 0.5;
      const midNode = audioCtx.createGain();
      spatialSplitter.connect(midGainL, 0);
      spatialSplitter.connect(midGainR, 1);
      midGainL.connect(midNode);
      midGainR.connect(midNode);
      midNode.connect(spatialMerger, 0, 0);
      midNode.connect(spatialMerger, 0, 1);

      // Side Channel (L - R) * 0.5
      const sideGainL = audioCtx.createGain(); sideGainL.gain.value = 0.5;
      const sideGainR = audioCtx.createGain(); sideGainR.gain.value = -0.5;
      const sideNode = audioCtx.createGain();
      spatialSplitter.connect(sideGainL, 0);
      spatialSplitter.connect(sideGainR, 1);
      sideGainL.connect(sideNode);
      sideGainR.connect(sideNode);

      // Side High-Shelf Filter for diffuse 3D spatial air (>6.5kHz)
      surroundShelfNode = audioCtx.createBiquadFilter();
      surroundShelfNode.type = 'highshelf';
      surroundShelfNode.frequency.value = 6500;
      sideNode.connect(surroundShelfNode);

      // Side Width Multiplier Node
      surroundWidthNode = audioCtx.createGain();
      surroundShelfNode.connect(surroundWidthNode);

      // Inverted Side for Right Channel
      const sideInvertNode = audioCtx.createGain();
      sideInvertNode.gain.value = -1.0;
      surroundWidthNode.connect(sideInvertNode);

      // Connect to Merger: Left = Mid + Side, Right = Mid - Side
      surroundWidthNode.connect(spatialMerger, 0, 0);
      sideInvertNode.connect(spatialMerger, 0, 1);

      spatialSumNode.connect(spatialSplitter);

      // Apply initial dynamic parameters
      applySurroundParams();
      applySpatialParams();

      const masterEnhancerNode = spatialMerger;

      // Connect to Analyser for live visualizer
      analyserNode = audioCtx.createAnalyser();
      analyserNode.fftSize = 64;
      analyserNode.smoothingTimeConstant = 0.78;
      masterEnhancerNode.connect(analyserNode);

      // Deck A DSP chain (with dedicated Headphone Hardware Profile Filter)
      profileLowA = audioCtx.createBiquadFilter(); profileLowA.type = 'lowshelf';
      profileMidA = audioCtx.createBiquadFilter(); profileMidA.type = 'peaking';
      profileHighA = audioCtx.createBiquadFilter(); profileHighA.type = 'highshelf';

      delayNodeA = audioCtx.createDelay(1.0);
      gainNodeA = audioCtx.createGain();
      const destA = audioCtx.createMediaStreamDestination();

      masterEnhancerNode.connect(profileLowA);
      profileLowA.connect(profileMidA);
      profileMidA.connect(profileHighA);
      profileHighA.connect(delayNodeA);
      delayNodeA.connect(gainNodeA);
      gainNodeA.connect(destA);
      audioElA.srcObject = destA.stream;
      await routeDeckSink('A', selectA.value);
      applyDeckProfile('A', profileKeyA);
      await audioElA.play();

      // Deck B DSP chain (with dedicated Headphone Hardware Profile Filter)
      profileLowB = audioCtx.createBiquadFilter(); profileLowB.type = 'lowshelf';
      profileMidB = audioCtx.createBiquadFilter(); profileMidB.type = 'peaking';
      profileHighB = audioCtx.createBiquadFilter(); profileHighB.type = 'highshelf';

      delayNodeB = audioCtx.createDelay(1.0);
      gainNodeB = audioCtx.createGain();
      const destB = audioCtx.createMediaStreamDestination();

      masterEnhancerNode.connect(profileLowB);
      profileLowB.connect(profileMidB);
      profileMidB.connect(profileHighB);
      profileHighB.connect(delayNodeB);
      delayNodeB.connect(gainNodeB);
      gainNodeB.connect(destB);
      audioElB.srcObject = destB.stream;
      await routeDeckSink('B', selectB.value);
      applyDeckProfile('B', profileKeyB);
      await audioElB.play();

      updateGains();
      updateDelays();
      drawMonitors();
    }

    // 2. Open Pre-Share Guidance Modal before triggering browser screen picker
    function promptTabAudioSharing() {
      if (preShareModal) {
        preShareModal.style.display = 'flex';
      } else {
        executeTabAudioSharing();
      }
    }

    // Capture tab audio with minimal 1x1@1fps video overhead
    async function executeTabAudioSharing() {
      if (preShareModal) preShareModal.style.display = 'none';

      try {
        stopSharing();

        capturedStream = await navigator.mediaDevices.getDisplayMedia({
          video: { width: 1, height: 1, frameRate: 1 },
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
            suppressLocalAudioPlayback: true
          },
          preferCurrentTab: false,
          selfBrowserSurface: 'exclude',
          surfaceSwitching: 'include'
        });

        const audioTracks = capturedStream.getAudioTracks();
        if (audioTracks.length === 0) {
          stopSharing();
          alert(t('errNoTabAudio'));
          return;
        }

        await loadAudioDevices(false);
        await buildLowLatencyGraph();

        statusText.textContent = t('statusTabActive');
        statusBadge.classList.add('active');
        wheelA.classList.add('spinning');
        wheelB.classList.add('spinning');
        btnSyncReset.style.display = 'inline-flex';
        btnStop.style.display = 'inline-flex';
        trackEvent('tab_audio_linked', { sample_rate: audioCtx ? audioCtx.sampleRate : 48000 });

        audioTracks[0].onended = () => stopSharing();
      } catch (err) {
        console.error(err);
        trackEvent('tab_audio_error', { error_name: err.name, error_message: err.message });
        if (err.name === 'NotAllowedError') {
          if (/system/i.test(err.message) || /permission/i.test(err.message)) {
            alert(t('errMacPermissionDenied'));
          } else {
            console.log('User dismissed sharing prompt.');
          }
        } else {
          alert(t('errCaptureFailed') + err.message);
        }
      }
    }

    function stopSharing() {
      trackEvent('audio_stopped', { total_listening_seconds: totalListeningSeconds });
      if (animId) {
        cancelAnimationFrame(animId);
        animId = null;
      }
      if (capturedStream) {
        capturedStream.getTracks().forEach(t => t.stop());
        capturedStream = null;
      }
      if (localFilePlayer) {
        localFilePlayer.pause();
        localFilePlayer.removeAttribute('src');
        localFilePlayer.load();
        localFilePlayer.style.display = 'none';
      }
      if (localFileObjectUrl) {
        URL.revokeObjectURL(localFileObjectUrl);
        localFileObjectUrl = null;
      }
      isLocalFileMode = false;
      localFileInput.value = '';
      localTrackStatus.textContent = '';

      if (audioCtx) {
        audioCtx.close().catch(() => {});
        audioCtx = null;
      }
      audioElA.pause();
      audioElB.pause();
      audioElA.srcObject = null;
      audioElB.srcObject = null;
      statusText.textContent = t('statusStandby');
      dspLatency.textContent = 'RESERVOIR: STANDBY';
      statusBadge.classList.remove('active');
      wheelA.classList.remove('spinning');
      wheelB.classList.remove('spinning');
      btnSyncReset.style.display = 'none';
      btnStop.style.display = 'none';
      updateVuBar(vuSegsA, 0);
      updateVuBar(vuSegsB, 0);
      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    }

    function getEffectiveMultipliers() {
      const m = Number(masterVol.value) / 100;
      const xf = Number(xfader.value); // -100 to +100
      const xfA = xf <= 0 ? 1 : (100 - xf) / 100;
      const xfB = xf >= 0 ? 1 : (100 + xf) / 100;

      const soloMuteA = isSoloB && !isSoloA;
      const soloMuteB = isSoloA && !isSoloB;

      const effA = (isMutedA || soloMuteA) ? 0 : (Number(volA.value) / 100) * m * xfA;
      const effB = (isMutedB || soloMuteB) ? 0 : (Number(volB.value) / 100) * m * xfB;
      return { effA, effB };
    }

    function updateGains() {
      const { effA, effB } = getEffectiveMultipliers();
      const xf = Number(xfader.value);

      masterVolLabel.textContent = `${masterVol.value}%`;
      volLabelA.textContent = isMutedA ? 'MUTED' : `${volA.value}%`;
      volLabelB.textContent = isMutedB ? 'MUTED' : `${volB.value}%`;
      xfaderLabel.textContent = xf === 0 ? 'CENTER' : (xf < 0 ? `A ${Math.abs(xf)}%` : `B ${xf}%`);

      if (gainNodeA && audioCtx) {
        gainNodeA.gain.setTargetAtTime(effA, audioCtx.currentTime, 0.015);
      }
      if (gainNodeB && audioCtx) {
        gainNodeB.gain.setTargetAtTime(effB, audioCtx.currentTime, 0.015);
      }
    }

    function updateDelays() {
      const dA = Number(delayA.value) / 1000;
      const dB = Number(delayB.value) / 1000;
      delayLabelA.textContent = `${delayA.value} ms`;
      delayLabelB.textContent = `${delayB.value} ms`;

      if (delayNodeA && audioCtx) {
        delayNodeA.delayTime.setTargetAtTime(dA, audioCtx.currentTime, 0.015);
      }
      if (delayNodeB && audioCtx) {
        delayNodeB.delayTime.setTargetAtTime(dB, audioCtx.currentTime, 0.015);
      }
    }

    function updateVuBar(segs, level0to1) {
      const activeCount = Math.min(16, Math.round(level0to1 * 16));
      for (let i = 0; i < 16; i++) {
        segs[i].className = 'vu-seg';
        if (i < activeCount) {
          if (i < 10) segs[i].classList.add('on-low');
          else if (i < 14) segs[i].classList.add('on-mid');
          else segs[i].classList.add('on-hi');
        }
      }
    }

    function drawMonitors() {
      if (!analyserNode) return;
      const bufferLength = analyserNode.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      let frameTick = 0;

      function render() {
        animId = requestAnimationFrame(render);
        analyserNode.getByteFrequencyData(dataArray);

        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

        let sum = 0;
        const barWidth = (canvas.width / bufferLength) * 1.15;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 255;
          sum += v;
          const barHeight = v * (canvas.height - 6);
          canvasCtx.fillStyle = i % 2 === 0 ? '#9c7344' : '#4a7870';
          canvasCtx.fillRect(x, canvas.height - barHeight, Math.max(2, barWidth - 2), barHeight);
          x += barWidth;
        }

        const avg = sum / bufferLength;
        const { effA, effB } = getEffectiveMultipliers();
        updateVuBar(vuSegsA, Math.min(1, avg * 1.45 * effA));
        updateVuBar(vuSegsB, Math.min(1, avg * 1.45 * effB));

        // Update live Web Audio hardware pipeline telemetry every 30 frames
        if (++frameTick % 30 === 0 && audioCtx) {
          const hwLatMs = ((audioCtx.baseLatency || 0) + (audioCtx.outputLatency || 0)) * 1000;
          const totalMs = (hwLatMs > 0 ? hwLatMs : 25) + (RESERVOIR_BUFFER_SEC * 1000);
          dspLatency.textContent = `RESERVOIR: ${totalMs.toFixed(0)}ms // STABLE`;
        }
      }
      render();
    }

    // Anti-Pop Atomic Buffer Flush: ramps down gain 15ms -> drains reservoir -> restores reservoir & gain
    function atomicBufferFlush() {
      if (!audioCtx || !reservoirNode || !gainNodeA || !gainNodeB) return;
      const now = audioCtx.currentTime;
      // 1. 15ms smooth micro fade-out to prevent DC clicks
      gainNodeA.gain.setTargetAtTime(0, now, 0.004);
      gainNodeB.gain.setTargetAtTime(0, now, 0.004);

      setTimeout(() => {
        if (!audioCtx || !reservoirNode) return;
        try {
          const t = audioCtx.currentTime;
          reservoirNode.delayTime.cancelScheduledValues(t);
          reservoirNode.delayTime.setValueAtTime(0, t);
          reservoirNode.delayTime.setTargetAtTime(RESERVOIR_BUFFER_SEC, t + 0.03, 0.02);
        } catch (_) {}
        // 2. Smoothly restore gain levels
        updateGains();
      }, 15);
    }

    // Event bindings
    btnRefreshDevices.addEventListener('click', () => loadAudioDevices(true));
    btnCaptureTab.addEventListener('click', promptTabAudioSharing);

    // Inline Collapsible Guide Drawer Event Bindings
    if (btnToggleGuide) {
      btnToggleGuide.addEventListener('click', (e) => {
        e.preventDefault();
        if (!guideDrawer) return;
        const isOpen = guideDrawer.style.display !== 'none';
        guideDrawer.style.display = isOpen ? 'none' : 'flex';
        btnToggleGuide.setAttribute('aria-expanded', !isOpen);
        trackEvent('guide_toggled', { action: isOpen ? 'close' : 'open' });
      });
    }

    // Pre-Share Guidance & Browser Matrix Modal Event Bindings
    if (modalPreShareProceed) {
      modalPreShareProceed.addEventListener('click', executeTabAudioSharing);
    }
    if (modalPreShareCancel) {
      modalPreShareCancel.addEventListener('click', () => {
        if (preShareModal) preShareModal.style.display = 'none';
      });
    }
    if (modalPreShareClose) {
      modalPreShareClose.addEventListener('click', () => {
        if (preShareModal) preShareModal.style.display = 'none';
      });
    }

    if (btnOpenBrowserMatrix) {
      btnOpenBrowserMatrix.addEventListener('click', () => {
        if (browserMatrixModal) browserMatrixModal.style.display = 'flex';
      });
    }
    if (modalMatrixClose) {
      modalMatrixClose.addEventListener('click', () => {
        if (browserMatrixModal) browserMatrixModal.style.display = 'none';
      });
    }
    if (modalMatrixDismiss) {
      modalMatrixDismiss.addEventListener('click', () => {
        if (browserMatrixModal) browserMatrixModal.style.display = 'none';
      });
    }

    // Dismiss modals when clicking directly on the background backdrop
    window.addEventListener('click', (e) => {
      if (preShareModal && e.target === preShareModal) {
        preShareModal.style.display = 'none';
      }
      if (browserMatrixModal && e.target === browserMatrixModal) {
        browserMatrixModal.style.display = 'none';
      }
    });

    btnSyncReset.addEventListener('click', () => {
      trackEvent('buffer_sync_reset', { delay_a: Number(delayA.value), delay_b: Number(delayB.value) });
      if (audioCtx && audioCtx.state === 'running') {
        atomicBufferFlush();
      } else {
        buildLowLatencyGraph();
      }
    });
    btnStop.addEventListener('click', stopSharing);

    if (btnFxTube) btnFxTube.addEventListener('click', toggleTube);
    if (btnFxSurround) btnFxSurround.addEventListener('click', toggleSurround);
    if (btnSurroundMode) btnSurroundMode.addEventListener('click', toggleSurroundMode);
    if (btnFxSpatial) btnFxSpatial.addEventListener('click', toggleSpatial);
    if (btnSpatialMode) btnSpatialMode.addEventListener('click', toggleSpatialMode);

    if (fxTubeLevel) {
      fxTubeLevel.addEventListener('input', (e) => {
        tubeIntensity = parseInt(e.target.value, 10);
        if (fxTubeVal) fxTubeVal.textContent = tubeIntensity + '%';
        try { localStorage.setItem('parallel_fx_tube_level', tubeIntensity); } catch (_) {}
        applyTubeCurve();
      });
    }

    if (fxSurroundLevel) {
      fxSurroundLevel.addEventListener('input', (e) => {
        surroundIntensity = parseInt(e.target.value, 10);
        crossfeedIntensity = surroundIntensity;
        if (fxSurroundVal) fxSurroundVal.textContent = surroundIntensity + '%';
        try {
          localStorage.setItem('parallel_fx_surround_level', surroundIntensity);
          localStorage.setItem('parallel_fx_crossfeed_level', surroundIntensity);
        } catch (_) {}
        applySurroundParams();
      });
    }

    if (fxSpatialLevel) {
      fxSpatialLevel.addEventListener('input', (e) => {
        spatialIntensity = parseInt(e.target.value, 10);
        if (fxSpatialVal) fxSpatialVal.textContent = spatialIntensity + '%';
        try { localStorage.setItem('parallel_fx_spatial_level', spatialIntensity); } catch (_) {}
        applySpatialParams();
      });
    }

    selectA.addEventListener('change', () => {
      routeDeckSink('A', selectA.value);
      applyDeckProfile('A', profileKeyA);
      trackEvent('sink_selected', { deck: 'A' });
    });
    selectB.addEventListener('change', () => {
      routeDeckSink('B', selectB.value);
      applyDeckProfile('B', profileKeyB);
      trackEvent('sink_selected', { deck: 'B' });
    });

    if (profileA) {
      profileA.addEventListener('change', (e) => {
        profileKeyA = e.target.value;
        try { localStorage.setItem('parallel_profile_a', profileKeyA); } catch (_) {}
        applyDeckProfile('A', profileKeyA);
        trackEvent('profile_selected', { deck: 'A', profile: profileKeyA });
      });
    }

    if (profileB) {
      profileB.addEventListener('change', (e) => {
        profileKeyB = e.target.value;
        try { localStorage.setItem('parallel_profile_b', profileKeyB); } catch (_) {}
        applyDeckProfile('B', profileKeyB);
        trackEvent('profile_selected', { deck: 'B', profile: profileKeyB });
      });
    }

    if (btnAutoTuneMatrix) {
      btnAutoTuneMatrix.addEventListener('click', autoOptimizeMatrix);
    }

    applyDeckProfile('A', profileKeyA);
    applyDeckProfile('B', profileKeyB);

    masterVol.addEventListener('input', updateGains);
    volA.addEventListener('input', updateGains);
    volB.addEventListener('input', updateGains);
    xfader.addEventListener('input', updateGains);
    xfader.addEventListener('dblclick', () => { xfader.value = 0; updateGains(); });
    xfaderReset.addEventListener('click', () => { xfader.value = 0; updateGains(); });

    delayA.addEventListener('input', () => {
      updateDelays();
      trackDelayChange('A', delayA.value);
    });
    delayB.addEventListener('input', () => {
      updateDelays();
      trackDelayChange('B', delayB.value);
    });

    document.querySelectorAll('.mini-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = document.getElementById(btn.dataset.target);
        const delta = Number(btn.dataset.delta);
        if (delta === 0) {
          target.value = 0;
        } else {
          target.value = Math.max(0, Math.min(300, Number(target.value) + delta));
        }
        updateDelays();
        trackDelayChange(target.id === 'delayA' ? 'A' : 'B', target.value);
      });
    });

    muteA.addEventListener('click', () => {
      isMutedA = !isMutedA;
      muteA.classList.toggle('muted', isMutedA);
      muteIconA.firstElementChild.setAttribute('href', isMutedA ? '#px-vol-mute' : '#px-vol-on');
      muteTextA.textContent = isMutedA ? 'MUTED' : 'MUTE';
      updateGains();
    });

    muteB.addEventListener('click', () => {
      isMutedB = !isMutedB;
      muteB.classList.toggle('muted', isMutedB);
      muteIconB.firstElementChild.setAttribute('href', isMutedB ? '#px-vol-mute' : '#px-vol-on');
      muteTextB.textContent = isMutedB ? 'MUTED' : 'MUTE';
      updateGains();
    });

    soloA.addEventListener('click', () => {
      isSoloA = !isSoloA;
      soloA.classList.toggle('soloed', isSoloA);
      updateGains();
    });

    soloB.addEventListener('click', () => {
      isSoloB = !isSoloB;
      soloB.classList.toggle('soloed', isSoloB);
      updateGains();
    });

    // Jukebox Side-by-Side Mini Popup Window Controller (reuses 'PARALLEL_JUKEBOX' so tab audio stays linked!)
    const jukeboxQuery = document.getElementById('jukeboxQuery');
    const btnJukeboxYTM = document.getElementById('btnJukeboxYTM');
    const btnJukeboxYT = document.getElementById('btnJukeboxYT');
    const btnJukeboxSpotify = document.getElementById('btnJukeboxSpotify');
    const localFileInput = document.getElementById('localFileInput');
    let localFilePlayer = document.getElementById('localFilePlayer');
    const localTrackStatus = document.getElementById('localTrackStatus');

    function openJukeboxPopup(platform) {
      // Atomic anti-pop flush: clean transition when switching tracks
      atomicBufferFlush();

      const q = jukeboxQuery.value.trim();
      let url = 'https://music.youtube.com';
      if (platform === 'ytm') {
        url = q ? `https://music.youtube.com/search?q=${encodeURIComponent(q)}` : 'https://music.youtube.com';
      } else if (platform === 'yt') {
        url = q ? `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}` : 'https://www.youtube.com';
      } else if (platform === 'spotify') {
        url = q ? `https://open.spotify.com/search/${encodeURIComponent(q)}` : 'https://open.spotify.com';
      }

      const w = 460;
      const h = Math.min(720, window.screen.availHeight - 80);
      const left = Math.max(0, window.screen.availWidth - w - 20);
      const top = 60;
      const win = window.open(
        url,
        'PARALLEL_JUKEBOX',
        `width=${w},height=${h},left=${left},top=${top},menubar=no,toolbar=no,location=yes,status=no`
      );
      if (win) {
        try { win.opener = null; } catch (_) {}
      }
      trackEvent('jukebox_launched', { platform, query: q ? 'custom_search' : 'default' });
    }

    btnJukeboxYTM.addEventListener('click', () => openJukeboxPopup('ytm'));
    btnJukeboxYT.addEventListener('click', () => openJukeboxPopup('yt'));
    btnJukeboxSpotify.addEventListener('click', () => openJukeboxPopup('spotify'));
    jukeboxQuery.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') openJukeboxPopup('ytm');
    });

    // Zero-Screen-Share Direct Local Audio File Routing
    localFileInput.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      stopSharing();
      await loadAudioDevices(false);

      isLocalFileMode = true;
      localFileObjectUrl = URL.createObjectURL(file);
      localTrackStatus.textContent = `FILE // ${file.name}`;
      trackEvent('local_audio_loaded', { file_name: file.name, file_size: file.size });

      await buildLowLatencyGraph();

      statusText.textContent = t('statusFileActive');
      statusBadge.classList.add('active');
      wheelA.classList.add('spinning');
      wheelB.classList.add('spinning');
      btnSyncReset.style.display = 'inline-flex';
      btnStop.style.display = 'inline-flex';
    });

    if (navigator.mediaDevices) {
      navigator.mediaDevices.addEventListener('devicechange', () => loadAudioDevices(false));
    }

    // Check browser compatibility: verify Chromium engine and required Web Audio / Media APIs
    function checkBrowserCompatibility() {
      const hasSetSinkId = 'setSinkId' in HTMLMediaElement.prototype;
      const hasDisplayMedia = !!(navigator.mediaDevices && typeof navigator.mediaDevices.getDisplayMedia === 'function');
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      // Chromium detection (Chrome, Edge, Brave, Opera, Arc, Vivaldi)
      const isChromium = !!window.chrome || /Chrome|Chromium|Edg|Brave|Arc/i.test(navigator.userAgent);

      const banner = document.getElementById('browserWarningBanner');
      if (!banner) return;

      // If non-Chromium (Safari, Firefox), mobile, or missing essential Web Audio routing APIs, show banner
      if (!isChromium || !hasSetSinkId || !hasDisplayMedia || isMobile) {
        banner.style.display = 'flex';
      } else {
        banner.style.display = 'none';
      }
    }

    // Clean up & migrate legacy localStorage keys
    try {
      const oldXF = localStorage.getItem('parallel_fx_crossfeed_level');
      if (oldXF && !localStorage.getItem('parallel_fx_surround_level')) {
        localStorage.setItem('parallel_fx_surround_level', oldXF);
      }
    } catch (_) {}

    checkBrowserCompatibility();

    // Initialize i18n on startup
    applyLanguage(currentLang);


// =========================================================================
// 🎹 Global Mixing Console Keyboard Shortcuts
// =========================================================================
window.addEventListener('keydown', (e) => {
  // Dismiss modals with Escape key
  if (e.key === 'Escape') {
    if (preShareModal && preShareModal.style.display === 'flex') {
      preShareModal.style.display = 'none';
      return;
    }
    if (browserMatrixModal && browserMatrixModal.style.display === 'flex') {
      browserMatrixModal.style.display = 'none';
      return;
    }
  }

  // Ignore keystrokes when typing inside text inputs, textareas, or selects
  const tag = (e.target.tagName || '').toLowerCase();
  if (tag === 'input' && e.target.type !== 'range') return;
  if (tag === 'textarea' || tag === 'select') return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;

  switch (e.key) {
    case ' ': // Space: Toggle Capture or Stop
      e.preventDefault();
      if (capturedStream || isLocalFileMode) {
        if (btnStop) btnStop.click();
      } else {
        if (btnCaptureTab) btnCaptureTab.click();
      }
      break;

    case '1': // 1: Toggle Deck A Mute
      e.preventDefault();
      if (muteA) muteA.click();
      break;

    case '2': // 2: Toggle Deck B Mute
      e.preventDefault();
      if (muteB) muteB.click();
      break;

    case 's':
    case 'S': // S: Resync / Flush Buffer
      e.preventDefault();
      if (btnSyncReset) btnSyncReset.click();
      break;

    case 'm':
    case 'M': // M: Auto-Optimize Acoustic Matrix
      e.preventDefault();
      if (btnAutoTuneMatrix) btnAutoTuneMatrix.click();
      break;

    case '[': // [: Nudge crossfader to Deck A (-10%)
      e.preventDefault();
      if (xfader) {
        const cur = parseFloat(xfader.value) || 0;
        xfader.value = Math.max(-100, cur - 10);
        xfader.dispatchEvent(new Event('input'));
      }
      break;

    case ']': // ]: Nudge crossfader to Deck B (+10%)
      e.preventDefault();
      if (xfader) {
        const cur = parseFloat(xfader.value) || 0;
        xfader.value = Math.min(100, cur + 10);
        xfader.dispatchEvent(new Event('input'));
      }
      break;

    case '\\': // \: Reset crossfader to Center (0%)
      e.preventDefault();
      if (xfaderReset) xfaderReset.click();
      break;

    case 'ArrowUp': // ArrowUp: Master Volume +5%
      e.preventDefault();
      if (masterVol) {
        const cur = parseFloat(masterVol.value) || 100;
        masterVol.value = Math.min(150, cur + 5);
        masterVol.dispatchEvent(new Event('input'));
      }
      break;

    case 'ArrowDown': // ArrowDown: Master Volume -5%
      e.preventDefault();
      if (masterVol) {
        const cur = parseFloat(masterVol.value) || 100;
        masterVol.value = Math.max(0, cur - 5);
        masterVol.dispatchEvent(new Event('input'));
      }
      break;
  }
});
