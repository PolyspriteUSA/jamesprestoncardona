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
  const LOCAL_URL = "./TheAtlas.mp3";
  const STORAGE_KEY = "jpc_audio_state_v3";
  const TARGET_VOLUME = 0.34;

  const audio = new Audio();
  audio.preload = "auto";
  audio.loop = true;
  audio.volume = TARGET_VOLUME;
  audio.src = RELEASE_URL;

  let fallbackTried = false;
  const activeVideos = new Set();

  const state = {
    enabled: true,
    currentTime: 0
  };

  function readState() {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null");
      if (!saved) return;
      if (typeof saved.enabled === "boolean") state.enabled = saved.enabled;
      if (Number.isFinite(saved.currentTime) && saved.currentTime >= 0) {
        state.currentTime = saved.currentTime;
      }
    } catch (_) {}
  }

  function writeState() {
    try {
      if (Number.isFinite(audio.currentTime)) {
        state.currentTime = audio.currentTime;
      }
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) {}
  }

  function canPlay() {
    return (
      state.enabled &&
      activeVideos.size === 0 &&
      !document.body.hasAttribute("data-jpc-game-page")
    );
  }

  function seekSavedTime() {
    if (!(state.currentTime > 0)) return;
    try {
      audio.currentTime =
        Number.isFinite(audio.duration) && audio.duration > 0
          ? state.currentTime % audio.duration
          : state.currentTime;
    } catch (_) {}
  }

  function updateButtons() {
    document
      .querySelectorAll("[data-jpc-music-toggle], #music-toggle")
      .forEach(function (button) {
        button.textContent = state.enabled ? "Music On" : "Music Off";
        button.setAttribute("aria-pressed", state.enabled ? "true" : "false");
      });
  }

  function play() {
    if (!canPlay()) return;
    seekSavedTime();

    const promise = audio.play();
    if (promise && typeof promise.catch === "function") {
      promise.catch(function () {});
    }
  }

  function pause() {
    if (Number.isFinite(audio.currentTime)) {
      state.currentTime = audio.currentTime;
    }
    audio.pause();
    writeState();
  }

  function setEnabled(enabled) {
    state.enabled = enabled;
    if (enabled) play();
    else pause();
    updateButtons();
    writeState();
  }

  document
    .querySelectorAll("[data-jpc-music-toggle], #music-toggle")
    .forEach(function (button) {
      button.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        setEnabled(!state.enabled);
      });
    });

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
        writeState();
        pause();
      },
      { capture: true }
    );
  });

  audio.addEventListener("loadedmetadata", seekSavedTime);

  audio.addEventListener("timeupdate", function () {
    if (Number.isFinite(audio.currentTime)) {
      state.currentTime = audio.currentTime;
    }
  });

  audio.addEventListener("error", function () {
    if (fallbackTried) return;
    fallbackTried = true;
    audio.src = LOCAL_URL;
    audio.load();
    if (canPlay()) play();
  });

  function recoverPlayback() {
    if (canPlay() && audio.paused) {
      play();
    }
  }

  document.addEventListener("pointerdown", recoverPlayback, { passive: true });
  document.addEventListener("keydown", recoverPlayback);

  window.addEventListener("pagehide", writeState);
  window.addEventListener("beforeunload", writeState);
  window.setInterval(writeState, 750);

  readState();
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
