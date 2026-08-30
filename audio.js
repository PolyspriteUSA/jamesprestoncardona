/* ==========================================================================
   JPC SHARED AUDIO CONTROLLER
   - Persists music position between normal HTML pages
   - Pauses automatically while a video is playing
   - Stops when launching a game
   - Resumes when returning to a normal portfolio page
   ========================================================================== */

(function () {
  "use strict";

  const RELEASE_URL =
    "https://github.com/PolyspriteUSA/JamesPrestonCardona/releases/download/portfolio-assets-v1/TheAtlas.mp3";

  const LOCAL_URL = "./TheAtlas.mp3";

  const STORAGE_KEY = "jpc_audio_state_v2";
  const TARGET_VOLUME = 0.34;
  const SAVE_INTERVAL_MS = 750;

  const audio = new Audio();
  audio.preload = "auto";
  audio.loop = true;
  audio.volume = TARGET_VOLUME;
  audio.src = RELEASE_URL;

  let fallbackTried = false;
  let mediaPauseCount = 0;

  const state = {
    enabled: true,
    currentTime: 0
  };

  /* -----------------------------------------------------------------------
     STATE
     ----------------------------------------------------------------------- */

  function readState() {
    try {
      const saved = JSON.parse(
        sessionStorage.getItem(STORAGE_KEY) || "null"
      );

      if (!saved) return;

      if (typeof saved.enabled === "boolean") {
        state.enabled = saved.enabled;
      }

      if (
        Number.isFinite(saved.currentTime) &&
        saved.currentTime >= 0
      ) {
        state.currentTime = saved.currentTime;
      }
    } catch (error) {
      console.warn("Unable to read JPC audio state.", error);
    }
  }

  function writeState() {
    try {
      if (
        Number.isFinite(audio.currentTime) &&
        audio.currentTime >= 0
      ) {
        state.currentTime = audio.currentTime;
      }

      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          enabled: state.enabled,
          currentTime: state.currentTime
        })
      );
    } catch (error) {
      console.warn("Unable to save JPC audio state.", error);
    }
  }

  /* -----------------------------------------------------------------------
     MUSIC BUTTONS
     ----------------------------------------------------------------------- */

  function updateButtons() {
    document
      .querySelectorAll(
        "[data-jpc-music-toggle], #music-toggle"
      )
      .forEach(function (button) {
        const isPlaying =
          state.enabled &&
          !audio.paused &&
          mediaPauseCount === 0;

        button.textContent =
          state.enabled ? "Music On" : "Music Off";

        button.setAttribute(
          "aria-pressed",
          state.enabled ? "true" : "false"
        );

        button.setAttribute(
          "aria-label",
          state.enabled
            ? "Turn background music off"
            : "Turn background music on"
        );

        button.dataset.playing =
          isPlaying ? "true" : "false";
      });
  }

  /* -----------------------------------------------------------------------
     PLAYBACK
     ----------------------------------------------------------------------- */

  function seekSavedTime() {
    if (!(state.currentTime > 0)) return;

    try {
      if (
        Number.isFinite(audio.duration) &&
        audio.duration > 0
      ) {
        audio.currentTime =
          state.currentTime % audio.duration;
      } else {
        audio.currentTime =
          state.currentTime;
      }
    } catch (error) {
      // Some browsers require metadata first.
    }
  }

  function mayPlayMusic() {
    return (
      state.enabled &&
      mediaPauseCount === 0 &&
      !document.body.hasAttribute(
        "data-jpc-game-page"
      )
    );
  }

  function attemptPlay() {
    if (!mayPlayMusic()) return;

    seekSavedTime();

    const result = audio.play();

    if (
      result &&
      typeof result.catch === "function"
    ) {
      result.catch(function () {
        // Browser autoplay policies may require the next user gesture.
      });
    }

    updateButtons();
  }

  function pauseBackgroundMusic() {
    if (!audio.paused) {
      state.currentTime =
        audio.currentTime || state.currentTime;
    }

    audio.pause();
    writeState();
    updateButtons();
  }

  function setEnabled(enabled) {
    state.enabled = enabled;

    if (enabled) {
      attemptPlay();
    } else {
      pauseBackgroundMusic();
    }

    writeState();
    updateButtons();
  }

  function toggleMusic(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    setEnabled(!state.enabled);
  }

  /* -----------------------------------------------------------------------
     VIDEO / MEDIA HANDLING
     Any normal <video> element automatically pauses the site music.
     When all playing videos stop, the background track resumes.
     ----------------------------------------------------------------------- */

  const activeVideos = new Set();

  function mediaStarted(video) {
    if (activeVideos.has(video)) return;

    activeVideos.add(video);
    mediaPauseCount = activeVideos.size;

    pauseBackgroundMusic();
  }

  function mediaStopped(video) {
    activeVideos.delete(video);
    mediaPauseCount = activeVideos.size;

    if (
      mediaPauseCount === 0 &&
      state.enabled
    ) {
      attemptPlay();
    }
  }

  function bindVideo(video) {
    if (video.dataset.jpcAudioBound === "true") {
      return;
    }

    video.dataset.jpcAudioBound = "true";

    video.addEventListener(
      "play",
      function () {
        mediaStarted(video);
      }
    );

    video.addEventListener(
      "pause",
      function () {
        mediaStopped(video);
      }
    );

    video.addEventListener(
      "ended",
      function () {
        mediaStopped(video);
      }
    );

    video.addEventListener(
      "emptied",
      function () {
        mediaStopped(video);
      }
    );
  }

  function bindAllVideos(root) {
    const target = root || document;

    if (
      target.matches &&
      target.matches("video")
    ) {
      bindVideo(target);
    }

    if (target.querySelectorAll) {
      target
        .querySelectorAll("video")
        .forEach(bindVideo);
    }
  }

  /* -----------------------------------------------------------------------
     GAME HANDLING

     Add this attribute to any link that launches a game:

       data-jpc-game-link

     Example:
       <a href="./pinball.html" data-jpc-game-link>Play Pinball</a>

     The music position is saved before navigation. The game page itself should
     NOT load audio.js, or can include:
       <body data-jpc-game-page>
     ----------------------------------------------------------------------- */

  function bindGameLinks() {
    document
      .querySelectorAll("[data-jpc-game-link]")
      .forEach(function (link) {
        if (
          link.dataset.jpcGameAudioBound ===
          "true"
        ) {
          return;
        }

        link.dataset.jpcGameAudioBound =
          "true";

        link.addEventListener(
          "click",
          function () {
            writeState();
            pauseBackgroundMusic();
          },
          { capture: true }
        );
      });
  }

  /* -----------------------------------------------------------------------
     DYNAMIC CONTENT
     Automatically discovers videos/game links added later.
     ----------------------------------------------------------------------- */

  const observer =
    new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        mutation.addedNodes.forEach(
          function (node) {
            if (
              node.nodeType !==
              Node.ELEMENT_NODE
            ) {
              return;
            }

            bindAllVideos(node);

            if (
              node.matches &&
              node.matches(
                "[data-jpc-game-link]"
              )
            ) {
              bindGameLinks();
            }

            if (
              node.querySelector &&
              node.querySelector(
                "[data-jpc-game-link]"
              )
            ) {
              bindGameLinks();
            }
          }
        );
      });
    });

  /* -----------------------------------------------------------------------
     FALLBACK AUDIO FILE
     ----------------------------------------------------------------------- */

  audio.addEventListener(
    "loadedmetadata",
    seekSavedTime
  );

  audio.addEventListener(
    "timeupdate",
    function () {
      if (
        Number.isFinite(audio.currentTime)
      ) {
        state.currentTime =
          audio.currentTime;
      }
    }
  );

  audio.addEventListener(
    "error",
    function () {
      if (fallbackTried) return;

      fallbackTried = true;

      audio.src = LOCAL_URL;
      audio.load();

      if (mayPlayMusic()) {
        attemptPlay();
      }
    }
  );

  /* -----------------------------------------------------------------------
     AUTOPLAY RECOVERY
     ----------------------------------------------------------------------- */

  function resumeFromGesture() {
    if (
      mayPlayMusic() &&
      audio.paused
    ) {
      attemptPlay();
    }
  }

  document.addEventListener(
    "pointerdown",
    resumeFromGesture,
    { passive: true }
  );

  document.addEventListener(
    "keydown",
    resumeFromGesture
  );

  /* -----------------------------------------------------------------------
     INITIALIZE
     ----------------------------------------------------------------------- */

  function bindMusicButtons() {
    document
      .querySelectorAll(
        "[data-jpc-music-toggle], #music-toggle"
      )
      .forEach(function (button) {
        if (
          button.dataset.jpcAudioBound ===
          "true"
        ) {
          return;
        }

        button.dataset.jpcAudioBound =
          "true";

        button.addEventListener(
          "click",
          toggleMusic
        );
      });
  }

  readState();
  bindMusicButtons();
  bindAllVideos(document);
  bindGameLinks();

  observer.observe(
    document.documentElement,
    {
      childList: true,
      subtree: true
    }
  );

  updateButtons();

  if (mayPlayMusic()) {
    attemptPlay();
  } else {
    pauseBackgroundMusic();
  }

  window.setInterval(
    writeState,
    SAVE_INTERVAL_MS
  );

  window.addEventListener(
    "pagehide",
    writeState
  );

  window.addEventListener(
    "beforeunload",
    writeState
  );

  document.addEventListener(
    "visibilitychange",
    function () {
      if (
        document.visibilityState ===
        "hidden"
      ) {
        writeState();
        return;
      }

      if (
        mayPlayMusic() &&
        audio.paused
      ) {
        attemptPlay();
      }
    }
  );

  /* -----------------------------------------------------------------------
     GLOBAL API
     ----------------------------------------------------------------------- */

  window.JPCAudio = {
    play: function () {
      setEnabled(true);
    },

    pause: function () {
      setEnabled(false);
    },

    toggle: function () {
      setEnabled(!state.enabled);
    },

    suspend: function () {
      mediaPauseCount += 1;
      pauseBackgroundMusic();
    },

    resume: function () {
      mediaPauseCount =
        Math.max(
          0,
          mediaPauseCount - 1
        );

      if (
        mediaPauseCount === 0 &&
        state.enabled
      ) {
        attemptPlay();
      }
    },

    audio: audio
  };
})();
