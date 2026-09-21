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
  // Use the intact original. The old local copy contains damaged audio data.
  audio.src = RELEASE_URL;
  audio.setAttribute("playsinline", "");

  const activeVideos = new Set();
  let restoreTimePending = true;
  let playbackStarted = false;
  let playPending = false;
  let leavingPage = false;

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

  function updateButtons() {
    document
      .querySelectorAll("[data-jpc-music-toggle], #music-toggle")
      .forEach(function (button) {
        button.textContent = state.enabled ? "Music On" : "Music Off";
        button.setAttribute("aria-pressed", state.enabled ? "true" : "false");
      });
  }

  function play() {
    if (!canPlay() || playPending) return;
    seekSavedTime();

    playPending = true;
    const promise = audio.play();
    if (promise && typeof promise.then === "function") {
      promise.then(function () {
        playPending = false;
        playbackStarted = true;
      }, function (error) {
        playPending = false;
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
      let suppressNextClick = false;

      function activateButton(event) {
        event.preventDefault();
        event.stopPropagation();

        // If autoplay was blocked, "Music On" can be enabled while the
        // audio is still paused. In that case, the first click should
        // START playback instead of immediately toggling the music off.
        if (state.enabled && audio.paused && canPlay()) {
          play();
          return;
        }

        setEnabled(!state.enabled);
      }

      button.addEventListener(
        "touchend",
        function (event) {
          suppressNextClick = true;
          activateButton(event);

          window.setTimeout(function () {
            suppressNextClick = false;
          }, 450);
        },
        { passive: false }
      );

      button.addEventListener("click", function (event) {
        if (suppressNextClick) {
          event.preventDefault();
          return;
        }

        activateButton(event);
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
  });
  // Native looping is primary; explicitly restart if a browser reports an end.
  audio.addEventListener("ended", restartLoop);

  audio.addEventListener("timeupdate", function () {
    if (!restoreTimePending && Number.isFinite(audio.currentTime)) {
      state.currentTime = audio.currentTime;
    }
  });

  audio.addEventListener("error", function () {
    console.warn("JPC original background audio failed to load.", audio.currentSrc, audio.error);
  });

  function recoverPlayback(event) {
    if (!canPlay() || !audio.paused) return;

    // Let the Music button click handler own Music-button gestures.
    // Otherwise pointerdown can start the track and the following click
    // immediately toggles it back off.
    if (
      event &&
      event.target &&
      event.target.closest &&
      event.target.closest("[data-jpc-music-toggle], #music-toggle")
    ) {
      return;
    }

    play();
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
