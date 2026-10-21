/* ==========================================================================
   JPC SHARED AUDIO CONTROLLER
   One background-music instance per page.
   Persists state/time between normal pages and pauses for media/games.
   ========================================================================== */

(function () {
  "use strict";

  /* Prevent accidental double-loading on the same document. */
  if (window.__JPC_AUDIO_SINGLETON__) {
    return;
  }
  window.__JPC_AUDIO_SINGLETON__ = true;

  const RELEASE_URL =
    "https://github.com/PolyspriteUSA/JamesPrestonCardona/releases/download/portfolio-assets-v1/TheAtlas.mp3";
  const STORAGE_KEY = "jpc_audio_state_v3";
  const TARGET_VOLUME = 0.34;

  const audio = new Audio();
  audio.preload = "auto";
  audio.loop = true;
  audio.volume = TARGET_VOLUME;
  // Serve the intact original directly, with audio/mpeg and byte-range support.
  audio.src = "/TheAtlas-original.mp3";
  audio.id = "jpc-background-audio";
  audio.hidden = true;
  document.body.appendChild(audio);
  audio.setAttribute("playsinline", "");

  const activeVideos = new Set();
  let restoreTimePending = true;
  let playbackStarted = false;
  let playPending = false;
  let playAttempt = 0;
  let leavingPage = false;

  const state = {
    enabled: true,
    currentTime: 0,
    volume: TARGET_VOLUME
  };

  let audioContext;
  let gain;
  function applyVolume(fromGesture) {
    // iOS uses Web Audio gain because media element volume is fixed.
    const Context = window.AudioContext || window.webkitAudioContext;
    if (fromGesture && Context && !audioContext) {
      try {
        audioContext = new Context();
        const source = audioContext.createMediaElementSource(audio);
        gain = audioContext.createGain();
        source.connect(gain);
        gain.connect(audioContext.destination);
      } catch (error) {
        console.warn("JPC volume control could not initialize.", error);
      }
    }
    if (gain) {
      audio.volume = 1;
      gain.gain.value = state.volume;
      if (fromGesture && audioContext.state === "suspended") {
        audioContext.resume().catch(function (error) {
          console.warn("JPC volume control could not resume.", error);
        });
      }
    } else audio.volume = state.volume;
  }

  function readState() {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null");
      if (!saved) return;
      if (typeof saved.enabled === "boolean") state.enabled = saved.enabled;
      if (Number.isFinite(saved.volume)) state.volume = Math.max(0, Math.min(1, saved.volume));
      if (Number.isFinite(saved.currentTime) && saved.currentTime >= 0) {
        state.currentTime = saved.currentTime;
      }
    } catch (_) {}
  }

  function writeState() {
    try {
      if (!restoreTimePending && Number.isFinite(audio.currentTime)) {
        state.currentTime = audio.currentTime;
      }
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) {}
  }

  function canPlay() {
    return (
      state.enabled &&
      !leavingPage &&
      activeVideos.size === 0 &&
      !document.body.hasAttribute("data-jpc-game-page")
    );
  }

  function seekSavedTime() {
    // Restore once after metadata loads, rather than seeking on every resume.
    if (!restoreTimePending || audio.readyState === 0) return;
    try {
      audio.currentTime =
        Number.isFinite(audio.duration) && audio.duration > 0
          ? state.currentTime % audio.duration
          : state.currentTime;
      restoreTimePending = false;
    } catch (_) {}
  }

  document.querySelectorAll("[data-jpc-music-toggle], #music-toggle").forEach(function (button) {
    const control = document.createElement("label");
    control.className = "jpc-volume-control";
    const caption = document.createElement("span");
    caption.textContent = "Music";
    const slider = document.createElement("input");
    slider.type = "range";
    slider.className = "jpc-volume-slider";
    slider.min = "0";
    slider.max = "100";
    slider.step = "1";
    slider.setAttribute("aria-label", "Music volume");
    control.append(caption, slider);
    button.replaceWith(control);
    function changeVolume() {
      state.volume = Number(slider.value) / 100;
      applyVolume(true);
      setEnabled(state.volume > 0, true);
    }
    slider.addEventListener("input", changeVolume);
    slider.addEventListener("change", changeVolume);
    slider.addEventListener("click", changeVolume);
    slider.addEventListener("touchend", changeVolume, { passive: true });
  });

  function updateButtons() {
    document.querySelectorAll(".jpc-volume-slider").forEach(function (slider) {
      const value = state.enabled ? Math.round(state.volume * 100) : 0;
      slider.value = value;
      slider.setAttribute("aria-valuetext", value === 0 ? "Muted" : value + " percent");
      slider.title = value === 0 ? "Music muted" : "Music volume: " + value + "%";
    });
  }

  function play(fromGesture) {
    // A trusted tap must reach play() synchronously, even if autoplay is pending.
    if (!canPlay() || (playPending && !fromGesture)) return;
    applyVolume(fromGesture);
    const attempt = ++playAttempt;
    seekSavedTime();

    playPending = true;
    const promise = audio.play();
    if (promise && typeof promise.then === "function") {
      promise.then(function () {
        if (attempt !== playAttempt) return;
        playPending = false;
        playbackStarted = true;
        updateButtons();
      }, function (error) {
        if (attempt !== playAttempt) return;
        playPending = false;
        updateButtons();
        // NotAllowedError is normal when a browser requires a user gesture.
        // Other failures are surfaced so a missing/bad audio URL is visible.
        if (!error || (error.name !== "NotAllowedError" && error.name !== "AbortError")) {
          console.warn("JPC background audio could not play.", error);
        }
      });
    } else {
      playPending = false;
    }
  }

  function restartLoop() {
    if (!canPlay()) return;
    state.currentTime = 0;
    restoreTimePending = false;
    audio.currentTime = 0;
    play();
  }

  function pause() {
    if (!restoreTimePending && Number.isFinite(audio.currentTime)) {
      state.currentTime = audio.currentTime;
    }
    audio.pause();
    writeState();
  }

  function setEnabled(enabled, fromGesture) {
    state.enabled = enabled;
    if (enabled) play(fromGesture);
    else pause();
    updateButtons();
    writeState();
  }

  document.querySelectorAll("video").forEach(function (video) {
    video.addEventListener("play", function () {
      activeVideos.add(video);
      pause();
    });

    function videoStopped() {
      activeVideos.delete(video);
      if (canPlay()) play();
    }

    video.addEventListener("pause", videoStopped);
    video.addEventListener("ended", videoStopped);
  });

  document.querySelectorAll("[data-jpc-game-link]").forEach(function (link) {
    link.addEventListener(
      "click",
      function () {
        leavingPage = true;
        writeState();
        pause();
      },
      { capture: true }
    );
  });

  audio.addEventListener("loadedmetadata", seekSavedTime);
  audio.addEventListener("playing", function () {
    playbackStarted = true;
    updateButtons();
  });
  audio.addEventListener("pause", updateButtons);
  // Native looping is primary; explicitly restart if a browser reports an end.
  audio.addEventListener("ended", restartLoop);

  audio.addEventListener("timeupdate", function () {
    if (!restoreTimePending && Number.isFinite(audio.currentTime)) {
      state.currentTime = audio.currentTime;
    }
  });

  audio.addEventListener("error", function () {
    updateButtons();
    console.warn("JPC original background audio failed to load.", audio.currentSrc, audio.error);
  });

  function recoverPlayback(event) {
    if (!canPlay() || !audio.paused) return;
    if (event && event.type === "pointerdown" && event.pointerType === "touch") return;

    // Let the Music button click handler own Music-button gestures.
    // Otherwise pointerdown can start the track and the following click
    // immediately toggles it back off.
    if (
      event &&
      event.target &&
      event.target.closest &&
      event.target.closest(".jpc-volume-control")
    ) {
      return;
    }

    play(true);
  }

  document.addEventListener("pointerdown", recoverPlayback, {
    passive: true,
    capture: true
  });
  document.addEventListener("touchend", recoverPlayback, {
    passive: true,
    capture: true
  });
  document.addEventListener("keydown", recoverPlayback);

  document.addEventListener("visibilitychange", function () {
    if (!document.hidden && playbackStarted && canPlay() && audio.paused) play();
  });
  window.addEventListener("pagehide", function () {
    leavingPage = true;
    pause();
  });
  window.addEventListener("pageshow", function () {
    leavingPage = false;
    if (playbackStarted && canPlay() && audio.paused) play();
  });
  window.addEventListener("beforeunload", writeState);
  window.setInterval(writeState, 750);
  // Recover an unexpected pause only after playback was allowed. Music Off,
  // videos, and game navigation continue to own intentional pauses.
  window.setInterval(function () {
    if (!playbackStarted || !canPlay() || document.hidden || audio.error) return;
    if (audio.ended) restartLoop();
    else if (audio.paused) play();
  }, 1000);

  readState();
  applyVolume(false);
  updateButtons();

  if (canPlay()) {
    play();
  }

  window.JPCAudio = {
    audio: audio,
    play: function () { setEnabled(true); },
    pause: function () { setEnabled(false); },
    toggle: function () { setEnabled(!state.enabled); }
  };
})();
