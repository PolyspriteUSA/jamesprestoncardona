(function () {
      function initExperienceModal() {
        const experienceModal =
          document.getElementById(
            "experience-modal"
          );

        const experienceTrigger =
          document.getElementById(
            "experience-trigger"
          );

        const experienceClose =
          document.getElementById(
            "experience-close"
          );

        if (
          !experienceModal ||
          !experienceTrigger ||
          !experienceClose
        ) {
          return;
        }

        experienceModal
          .querySelectorAll(
            "iframe, video, object, embed, canvas, [class*='preview'], [class*='browser-frame'], [class*='live-frame']"
          )
          .forEach(
            function (element) {
              element.remove();
            }
          );

        let experiencePreviousFocus =
          null;

        let suppressNextClick =
          false;

        function openExperiencePanel(event) {
          if (event) {
            event.preventDefault();
            event.stopPropagation();
          }

          if (
            experienceModal.classList.contains(
              "open"
            )
          ) {
            return;
          }

          experiencePreviousFocus =
            document.activeElement;

          experienceModal.classList.add(
            "open"
          );

          experienceModal.setAttribute(
            "aria-hidden",
            "false"
          );

          experienceTrigger.setAttribute(
            "aria-expanded",
            "true"
          );

          document.body.classList.add(
            "experience-open"
          );

          window.setTimeout(
            function () {
              try {
                experienceClose.focus({
                  preventScroll: true
                });
              } catch (error) {
                experienceClose.focus();
              }
            },
            50
          );
        }

        function closeExperiencePanel(event) {
          if (event) {
            event.preventDefault();
            event.stopPropagation();
          }

          experienceModal.classList.remove(
            "open"
          );

          experienceModal.setAttribute(
            "aria-hidden",
            "true"
          );

          experienceTrigger.setAttribute(
            "aria-expanded",
            "false"
          );

          document.body.classList.remove(
            "experience-open"
          );

          if (
            experiencePreviousFocus &&
            typeof experiencePreviousFocus.focus ===
              "function"
          ) {
            window.setTimeout(
              function () {
                try {
                  experiencePreviousFocus.focus({
                    preventScroll: true
                  });
                } catch (error) {
                  experiencePreviousFocus.focus();
                }
              },
              20
            );
          }
        }

        function handlePointerOpen(event) {
          if (
            event.pointerType === "touch" ||
            event.pointerType === "pen"
          ) {
            suppressNextClick =
              true;

            openExperiencePanel(
              event
            );

            window.setTimeout(
              function () {
                suppressNextClick =
                  false;
              },
              450
            );
          }
        }

        experienceTrigger.addEventListener(
          "pointerup",
          handlePointerOpen,
          {
            passive: false
          }
        );

        experienceTrigger.addEventListener(
          "touchend",
          function (event) {
            suppressNextClick =
              true;

            openExperiencePanel(
              event
            );

            window.setTimeout(
              function () {
                suppressNextClick =
                  false;
              },
              450
            );
          },
          {
            passive: false
          }
        );

        experienceTrigger.addEventListener(
          "click",
          function (event) {
            if (
              suppressNextClick
            ) {
              event.preventDefault();
              return;
            }

            openExperiencePanel(
              event
            );
          }
        );

        experienceTrigger.addEventListener(
          "keydown",
          function (event) {
            if (
              event.key === "Enter" ||
              event.key === " "
            ) {
              openExperiencePanel(
                event
              );
            }
          }
        );

        experienceClose.addEventListener(
          "click",
          closeExperiencePanel
        );

        experienceClose.addEventListener(
          "pointerup",
          function (event) {
            if (
              event.pointerType === "touch" ||
              event.pointerType === "pen"
            ) {
              closeExperiencePanel(
                event
              );
            }
          },
          {
            passive: false
          }
        );

        experienceModal
          .querySelectorAll(
            "[data-experience-close]"
          )
          .forEach(
            function (element) {
              element.addEventListener(
                "click",
                closeExperiencePanel
              );

              element.addEventListener(
                "pointerup",
                function (event) {
                  if (
                    event.pointerType ===
                      "touch" ||
                    event.pointerType ===
                      "pen"
                  ) {
                    closeExperiencePanel(
                      event
                    );
                  }
                },
                {
                  passive: false
                }
              );
            }
          );

        document.addEventListener(
          "keydown",
          function (event) {
            if (
              event.key === "Escape" &&
              experienceModal.classList.contains(
                "open"
              )
            ) {
              closeExperiencePanel(
                event
              );
            }
          }
        );

        experienceModal.addEventListener(
          "click",
          function (event) {
            const experienceLink =
              event.target.closest(
                ".experience-option"
              );

            if (
              experienceLink
            ) {
              document.body.classList.remove(
                "experience-open"
              );
            }
          }
        );

        window.__openExperiencePanel =
          openExperiencePanel;

        window.__closeExperiencePanel =
          closeExperiencePanel;
      }

      if (
        document.readyState ===
        "loading"
      ) {
        document.addEventListener(
          "DOMContentLoaded",
          initExperienceModal,
          {
            once: true
          }
        );
      } else {
        initExperienceModal();
      }
    })();

/* =========================================================
   Extracted from index.html
   ========================================================= */

const contactModal = document.getElementById("contact-modal");
    const contactClose = document.getElementById("contact-close");
    const contactTriggers = document.querySelectorAll(".contact-trigger");

    let previousFocus = null;

    function openContactPanel() {
      previousFocus = document.activeElement;
      contactModal.classList.add("open");
      contactModal.setAttribute("aria-hidden", "false");
      document.body.classList.add("contact-open");

      setTimeout(function () {
        contactClose.focus();
      }, 50);
    }

    function closeContactPanel() {
      contactModal.classList.remove("open");
      contactModal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("contact-open");

      if (
        previousFocus &&
        typeof previousFocus.focus === "function"
      ) {
        previousFocus.focus();
      }
    }

    contactTriggers.forEach(function (trigger) {
      trigger.addEventListener("click", openContactPanel);
    });

    contactClose.addEventListener("click", closeContactPanel);

    document.querySelectorAll("[data-contact-close]").forEach(function (element) {
      element.addEventListener("click", closeContactPanel);
    });

    document.addEventListener("keydown", function (event) {
      if (
        event.key === "Escape" &&
        contactModal.classList.contains("open")
      ) {
        closeContactPanel();
      }
    });

/* =========================================================
   Extracted from index.html
   ========================================================= */

import * as THREE from "three";
    import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

    const CONFIG = {
      modelPath: "./logo.glb",
      targetSize: 3.0,
      cameraZ: 6,
      desktopX: 0,
      desktopY: -0.05,
      mobileX: 0,
      mobileY: 1.10,
      baseRotationX: -8,
      baseRotationY: -25
    };

    const container = document.getElementById("three-container");
    const loading = document.getElementById("loading");

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      34,
      window.innerWidth / window.innerHeight,
      0.01,
      1000
    );

    camera.position.set(0, 0, CONFIG.cameraZ);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });

    function pixelRatio() {
      if (window.innerWidth < 768) {
        return Math.min(window.devicePixelRatio, 1.5);
      }

      return Math.min(window.devicePixelRatio, 2);
    }

    renderer.setPixelRatio(pixelRatio());
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.92;
    renderer.setClearColor(0x000000, 0);

    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 1.15);
    scene.add(ambient);

    const hemisphere = new THREE.HemisphereLight(0xffffff, 0x251436, 1.1);
    scene.add(hemisphere);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(4, 5, 6);
    scene.add(keyLight);

    const magentaLight = new THREE.PointLight(0xff25d0, 3.6, 20);
    magentaLight.position.set(4, 2, 4);
    scene.add(magentaLight);

    const purpleLight = new THREE.PointLight(0x6437ff, 3.6, 20);
    purpleLight.position.set(-4, 2, 3);
    scene.add(purpleLight);

    const cursorLight = new THREE.PointLight(
      0xff72df,
      1.4,
      18
    );
    cursorLight.position.set(0, 0.7, 4.2);
    scene.add(cursorLight);

    const logoRoot = new THREE.Group();
    scene.add(logoRoot);

    const logoPivot = new THREE.Group();
    logoRoot.add(logoPivot);

    let logo = null;
    let logoBaseScale = 1;

    const loader = new GLTFLoader();

    const logoCandidates = [
      "./logo.glb",
      "/logo.glb",
      "https://jamesprestoncardona.com/logo.glb"
    ];

    function finishLogoSetup(gltf) {
      logo = gltf.scene;
      logoPivot.add(logo);
      logo.updateMatrixWorld(true);

      const box = new THREE.Box3().setFromObject(logo);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      const largestDimension = Math.max(
        size.x,
        size.y,
        size.z
      );

      if (
        !Number.isFinite(largestDimension) ||
        largestDimension <= 0
      ) {
        loading.textContent = "Invalid 3D model";
        return;
      }

      logo.position.sub(center);

      const scale =
          CONFIG.targetSize /
          largestDimension;

        logoBaseScale = scale;
        logoPivot.scale.setScalar(scale);

      logo.traverse(function (object) {
        if (!object.isMesh) {
          return;
        }

        object.visible = true;
        object.frustumCulled = false;

        const materials =
          Array.isArray(object.material)
            ? object.material
            : [object.material];

        materials.forEach(function (material) {
          if (!material) {
            return;
          }

          material.transparent = true;
          material.opacity = 0.48;
          material.alphaTest = 0;
          material.depthWrite = false;
          material.depthTest = true;
          material.side = THREE.DoubleSide;
          material.blending = THREE.NormalBlending;

          if ("transmission" in material) {
            material.transmission = 0;
          }

          if ("thickness" in material) {
            material.thickness = 0;
          }

          if ("roughness" in material) {
            material.roughness = 0.38;
          }

          if ("metalness" in material) {
            material.metalness = 0.04;
          }

          material.needsUpdate = true;
        });
      });


      logoRoot.rotation.x =
        THREE.MathUtils.degToRad(
          CONFIG.baseRotationX
        );

      logoRoot.rotation.y =
        THREE.MathUtils.degToRad(
          CONFIG.baseRotationY
        );

      positionLogo();

      loading.textContent = "3D Loaded";

      setTimeout(function () {
        loading.style.display = "none";
      }, 700);
    }

    function loadLogoCandidate(index) {
      if (
        index >=
        logoCandidates.length
      ) {
        console.error(
          "All logo.glb paths failed:",
          logoCandidates
        );

        loading.textContent =
          "3D load error";

        return;
      }

      const candidate =
        logoCandidates[index];

      console.log(
        "Trying logo:",
        candidate
      );

      loader.load(
        candidate,

        function (gltf) {
          console.log(
            "Loaded logo from:",
            candidate
          );

          finishLogoSetup(gltf);
        },

        function (event) {
          if (event.total > 0) {
            const progress =
              Math.round(
                event.loaded /
                event.total *
                100
              );

            loading.textContent =
              "Loading 3D " +
              progress +
              "%";
          }
        },

        function (error) {
          console.warn(
            "Logo path failed:",
            candidate,
            error
          );

          loadLogoCandidate(
            index + 1
          );
        }
      );
    }

    loadLogoCandidate(0);

    function positionLogo() {
      if (window.innerWidth < 768) {
        logoRoot.position.set(
          CONFIG.mobileX,
          CONFIG.mobileY,
          0
        );
      } else {
        logoRoot.position.set(
          CONFIG.desktopX,
          CONFIG.desktopY,
          0
        );
      }
    }

    positionLogo();

    const pointer = new THREE.Vector2();
    const pointerTarget = new THREE.Vector2();

    window.addEventListener(
      "pointermove",

      function (event) {
        if (window.innerWidth < 768) {
          return;
        }

        pointerTarget.x =
          (
            event.clientX /
            window.innerWidth
          )
          *
          2
          -
          1;

        pointerTarget.y =
          (
            event.clientY /
            window.innerHeight
          )
          *
          2
          -
          1;
      },

      {
        passive: true
      }
    );

    window.addEventListener(
      "pointerleave",
      function () {
        pointerTarget.set(0, 0);
      }
    );

    function createParticleField(options) {
      const count = options.count;
      const positions = new Float32Array(count * 3);

      for (
        let i = 0;
        i < count;
        i++
      ) {
        const p = i * 3;

        positions[p] =
          (
            Math.random() -
            0.5
          )
          *
          options.spreadX;

        positions[p + 1] =
          (
            Math.random() -
            0.5
          )
          *
          options.spreadY;

        positions[p + 2] =
          (
            Math.random() -
            0.5
          )
          *
          options.spreadZ;
      }

      const geometry =
        new THREE.BufferGeometry();

      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(
          positions,
          3
        )
      );

      const material =
        new THREE.PointsMaterial({
          size: options.size,
          color: options.color,
          transparent: true,
          opacity: options.opacity,
          depthWrite: false,
          blending: options.additive
            ? THREE.AdditiveBlending
            : THREE.NormalBlending,
          sizeAttenuation: true
        });

      const field =
        new THREE.Points(
          geometry,
          material
        );

      scene.add(field);

      return field;
    }

    const particles =
      createParticleField({
        count:
          window.innerWidth < 768
            ? 260
            : 1050,
        spreadX: 18,
        spreadY: 11,
        spreadZ: 14,
        size:
          window.innerWidth < 768
            ? 0.014
            : 0.013,
        color: 0xa66cff,
        opacity: 0.24,
        additive: false
      });

    const glowParticles =
      createParticleField({
        count:
          window.innerWidth < 768
            ? 55
            : 170,
        spreadX: 15,
        spreadY: 9,
        spreadZ: 11,
        size:
          window.innerWidth < 768
            ? 0.032
            : 0.038,
        color: 0xff4fd8,
        opacity: 0.18,
        additive: true
      });

    const deepParticles =
      createParticleField({
        count:
          window.innerWidth < 768
            ? 90
            : 280,
        spreadX: 21,
        spreadY: 13,
        spreadZ: 18,
        size:
          window.innerWidth < 768
            ? 0.010
            : 0.009,
        color: 0x6a47ff,
        opacity: 0.16,
        additive: true
      });



    const clock = new THREE.Clock();

    const reducedMotion =
      window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      );

    function animate() {
      requestAnimationFrame(
        animate
      );

      const elapsed =
        clock.getElapsedTime();

      pointer.x =
        THREE.MathUtils.lerp(
          pointer.x,
          pointerTarget.x,
          0.12
        );

      pointer.y =
        THREE.MathUtils.lerp(
          pointer.y,
          pointerTarget.y,
          0.12
        );


      if (
        !reducedMotion.matches
      ) {
        particles.rotation.y =
          elapsed *
          0.010;

        particles.rotation.x =
          Math.sin(
            elapsed *
            0.12
          )
          *
          0.022;

        glowParticles.rotation.y =
          -elapsed *
          0.014;

        glowParticles.rotation.z =
          Math.sin(
            elapsed *
            0.18
          )
          *
          0.028;

        glowParticles.position.x =
          pointer.x *
          0.10;

        glowParticles.position.y =
          -pointer.y *
          0.07;

        deepParticles.rotation.y =
          elapsed *
          0.004;

        deepParticles.rotation.x =
          -elapsed *
          0.0025;

      }

      if (logo) {
        const baseX =
          THREE.MathUtils.degToRad(
            CONFIG.baseRotationX
          );

        const baseY =
          THREE.MathUtils.degToRad(
            CONFIG.baseRotationY
          );

        if (
          !reducedMotion.matches
        ) {
          if (
            window.innerWidth <
            768
          ) {
            logoRoot.rotation.x =
              baseX
              +
              Math.sin(
                elapsed *
                0.55
              )
              *
              0.04;

            logoRoot.rotation.y =
              baseY
              +
              Math.sin(
                elapsed *
                0.38
              )
              *
              0.10;

            logoRoot.rotation.z =
              THREE.MathUtils.lerp(
                logoRoot.rotation.z,
                0,
                0.10
              );

            logoRoot.position.y =
              CONFIG.mobileY
              +
              Math.sin(
                elapsed *
                0.62
              )
              *
              0.055;


          } else {
            const targetY =
              baseY
              +
              pointer.x *
              0.58;

            logoRoot.rotation.y =
              THREE.MathUtils.lerp(
                logoRoot.rotation.y,
                targetY,
                0.12
              );
          }
        }
      }

      renderer.render(
        scene,
        camera
      );
    }

    animate();

    let resizeTimer;

    window.addEventListener(
      "resize",

      function () {
        clearTimeout(
          resizeTimer
        );

        resizeTimer =
          setTimeout(
            function () {
              camera.aspect =
                window.innerWidth /
                window.innerHeight;

              camera.updateProjectionMatrix();

              renderer.setSize(
                window.innerWidth,
                window.innerHeight
              );

              renderer.setPixelRatio(
                pixelRatio()
              );

              positionLogo();
            },
            70
          );
      },

      {
        passive: true
      }
    );

/* =========================================================
   Extracted from index.html
   ========================================================= */
