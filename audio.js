(function () {
  "use strict";

  const RELEASE_URL = "https://github.com/PolyspriteUSA/JamesPrestonCardona/releases/download/portfolio-assets-v1/TheAtlas.mp3";
  const LOCAL_URL = "./TheAtlas.mp3";
  const STORAGE_KEY = "jpc_audio_state_v1";
  const TARGET_VOLUME = 0.34;

  const audio = new Audio();
  audio.preload = "auto";
  audio.loop = true;
  audio.volume = TARGET_VOLUME;
  audio.src = RELEASE_URL;

  let fallbackTried = false;
  let state = { enabled: true, currentTime: 0 };

  function readState() {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null");
      if (!saved) return;
      if (typeof saved.enabled === "boolean") state.enabled = saved.enabled;
      if (Number.isFinite(saved.currentTime) && saved.currentTime >= 0) state.currentTime = saved.currentTime;
    } catch (_) {}
  }

  function writeState() {
    try {
      if (Number.isFinite(audio.currentTime)) state.currentTime = audio.currentTime;
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) {}
  }

  function updateButtons() {
    document.querySelectorAll("[data-jpc-music-toggle], #music-toggle").forEach((button) => {
      button.textContent = state.enabled ? "Music On" : "Music Off";
      button.setAttribute("aria-pressed", state.enabled ? "true" : "false");
      button.setAttribute("aria-label", state.enabled ? "Turn background music off" : "Turn background music on");
    });
  }

  function seekSavedTime() {
    if (!(state.currentTime > 0)) return;
    try {
      audio.currentTime = Number.isFinite(audio.duration) && audio.duration > 0
        ? state.currentTime % audio.duration
        : state.currentTime;
    } catch (_) {}
  }

  function attemptPlay() {
    if (!state.enabled) return;
    seekSavedTime();
    const result = audio.play();
    if (result && result.catch) result.catch(() => {});
  }

  function setEnabled(enabled) {
    state.enabled = enabled;
    if (enabled) attemptPlay();
    else audio.pause();
    updateButtons();
    writeState();
  }

  function bindButtons() {
    document.querySelectorAll("[data-jpc-music-toggle], #music-toggle").forEach((button) => {
      if (button.dataset.jpcAudioBound) return;
      button.dataset.jpcAudioBound = "1";
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        setEnabled(!state.enabled);
      });
    });
  }

  audio.addEventListener("loadedmetadata", seekSavedTime);
  audio.addEventListener("timeupdate", () => { state.currentTime = audio.currentTime || state.currentTime; });
  audio.addEventListener("error", () => {
    if (fallbackTried) return;
    fallbackTried = true;
    audio.src = LOCAL_URL;
    audio.load();
    if (state.enabled) attemptPlay();
  });

  document.addEventListener("pointerdown", () => {
    if (state.enabled && audio.paused) attemptPlay();
  }, { passive: true });

  document.addEventListener("keydown", () => {
    if (state.enabled && audio.paused) attemptPlay();
  });

  window.addEventListener("pagehide", writeState);
  window.addEventListener("beforeunload", writeState);
  setInterval(writeState, 1000);

  readState();
  bindButtons();
  updateButtons();
  if (state.enabled) attemptPlay();

  window.JPCAudio = {
    play: () => setEnabled(true),
    pause: () => setEnabled(false),
    toggle: () => setEnabled(!state.enabled),
    audio
  };
})();
