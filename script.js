import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { fieldNoteCategories, fieldNotes } from "./src/data/fieldNotes.js";

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16 }
);

document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

function createSpacefield() {
  const canvas = document.querySelector("#spacefield");
  const context = canvas.getContext("2d");
  const particles = [];
  let width = 0;
  let height = 0;
  let pixelRatio = 1;

  function resize() {
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * pixelRatio);
    canvas.height = Math.floor(height * pixelRatio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    particles.length = 0;
    const count = Math.floor(Math.min(160, Math.max(70, width / 10)));
    for (let index = 0; index < count; index += 1) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.3 + 0.25,
        speed: Math.random() * 0.12 + 0.03,
        alpha: Math.random() * 0.46 + 0.12,
      });
    }
  }

  function draw() {
    context.clearRect(0, 0, width, height);
    context.save();
    context.strokeStyle = "rgba(244, 182, 194, 0.08)";
    context.lineWidth = 1;
    context.beginPath();
    context.ellipse(width * 0.52, height * 0.82, width * 0.56, height * 0.23, -0.12, 0, Math.PI * 2);
    context.stroke();
    context.beginPath();
    context.ellipse(width * 0.58, height * 0.64, width * 0.48, height * 0.18, 0.22, 0, Math.PI * 2);
    context.stroke();
    context.restore();

    particles.forEach((particle) => {
      particle.x += particle.speed;
      particle.y += particle.speed * 0.18;
      if (particle.x > width + 8) particle.x = -8;
      if (particle.y > height + 8) particle.y = -8;

      context.beginPath();
      context.fillStyle = `rgba(249, 250, 251, ${particle.alpha})`;
      context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      context.fill();
    });

    if (!prefersReducedMotion) requestAnimationFrame(draw);
  }

  resize();
  draw();
  window.addEventListener("resize", resize);
}

function createSpacecraftScene() {
  const canvas = document.querySelector("#craftScene");
  if (!canvas) return;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0.9, 8);

  const group = new THREE.Group();
  scene.add(group);

  const rose = new THREE.Color("#f4b6c2");
  const graphite = new THREE.Color("#1a2233");
  const white = new THREE.Color("#f9fafb");

  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: graphite,
    metalness: 0.82,
    roughness: 0.28,
    emissive: new THREE.Color("#080c16"),
  });

  const accentMaterial = new THREE.MeshStandardMaterial({
    color: rose,
    metalness: 0.7,
    roughness: 0.22,
    emissive: new THREE.Color("#2c111a"),
    emissiveIntensity: 0.22,
  });

  const lineMaterial = new THREE.LineBasicMaterial({
    color: rose,
    transparent: true,
    opacity: 0.36,
  });

  const bus = new THREE.Mesh(new THREE.BoxGeometry(1.35, 1.05, 1.05), bodyMaterial);
  group.add(bus);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.52, 0.95, 6), bodyMaterial);
  nose.rotation.z = -Math.PI / 2;
  nose.position.x = 1.12;
  group.add(nose);

  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.8, 12), accentMaterial);
  antenna.rotation.z = Math.PI / 2;
  antenna.position.x = -1.25;
  antenna.position.y = 0.28;
  group.add(antenna);

  const dish = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.28, 32, 1, true), accentMaterial);
  dish.rotation.z = Math.PI / 2;
  dish.position.x = -2.12;
  dish.position.y = 0.28;
  group.add(dish);

  const panelMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#101827"),
    metalness: 0.52,
    roughness: 0.34,
    emissive: new THREE.Color("#190d16"),
    emissiveIntensity: 0.18,
  });

  [-1, 1].forEach((side) => {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.2, 10), accentMaterial);
    arm.position.y = side * 0.93;
    group.add(arm);

    const panel = new THREE.Mesh(new THREE.BoxGeometry(2.25, 0.08, 0.82), panelMaterial);
    panel.position.y = side * 1.55;
    panel.rotation.z = side * 0.03;
    group.add(panel);

    const panelLines = new THREE.Group();
    for (let index = -2; index <= 2; index += 1) {
      const points = [
        new THREE.Vector3(index * 0.36, side * 1.502, -0.42),
        new THREE.Vector3(index * 0.36, side * 1.502, 0.42),
      ];
      panelLines.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), lineMaterial));
    }
    group.add(panelLines);
  });

  const orbitGroup = new THREE.Group();
  const orbitMaterial = new THREE.LineBasicMaterial({ color: white, transparent: true, opacity: 0.12 });
  for (let index = 0; index < 3; index += 1) {
    const curve = new THREE.EllipseCurve(0, 0, 2.6 + index * 0.5, 0.95 + index * 0.22, 0, Math.PI * 2);
    const points = curve.getPoints(160).map((point) => new THREE.Vector3(point.x, point.y, 0));
    const orbit = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), orbitMaterial);
    orbit.rotation.x = Math.PI * 0.55;
    orbit.rotation.z = index * 0.62;
    orbitGroup.add(orbit);
  }
  scene.add(orbitGroup);

  const keyLight = new THREE.PointLight("#f8cad4", 3.2, 20);
  keyLight.position.set(4, 4, 6);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight("#94a3b8", 1.3);
  fillLight.position.set(-3, 2, 4);
  scene.add(fillLight);
  scene.add(new THREE.AmbientLight("#ffffff", 0.48));

  function resize() {
    const { width, height } = canvas.getBoundingClientRect();
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function animate(time = 0) {
    const seconds = time * 0.001;
    group.rotation.y = seconds * 0.2;
    group.rotation.x = Math.sin(seconds * 0.55) * 0.08;
    orbitGroup.rotation.z = seconds * 0.08;
    orbitGroup.rotation.y = Math.sin(seconds * 0.3) * 0.12;
    renderer.render(scene, camera);
    if (!prefersReducedMotion) requestAnimationFrame(animate);
  }

  resize();
  animate();
  window.addEventListener("resize", resize);
}

function bindHoldToOpen(element, getMediaData) {
  let holdTimeout = null;
  let isHoldActive = false;
  let startX = 0;
  let startY = 0;

  const onDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;

    startX = e.clientX;
    startY = e.clientY;
    isHoldActive = false;
    element.dataset.wasHold = "false";

    if (holdTimeout) clearTimeout(holdTimeout);
    holdTimeout = setTimeout(() => {
      isHoldActive = true;
      element.dataset.wasHold = "true";
      if (mediaViewerOverlay) {
        mediaViewerOverlay.classList.add("peeking");
      }
      const data = getMediaData();
      if (Array.isArray(data.items)) {
        openMediaItems(data.items, data.index);
      } else {
        openRawMediaViewer(data.item);
      }
    }, 1000);

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  };

  const onMove = (e) => {
    const dist = Math.hypot(e.clientX - startX, e.clientY - startY);
    if (dist > 6) {
      if (holdTimeout) {
        clearTimeout(holdTimeout);
        holdTimeout = null;
      }
      if (isHoldActive) {
        isHoldActive = false;
        closeMediaViewer();
      }
      cleanup();
    }
  };

  const onUp = (e) => {
    if (holdTimeout) {
      clearTimeout(holdTimeout);
      holdTimeout = null;
    }
    if (isHoldActive) {
      isHoldActive = false;
      closeMediaViewer();
    }
    cleanup();
  };

  const cleanup = () => {
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", onUp);
  };

  element.addEventListener("pointerdown", onDown);
  element.addEventListener("contextmenu", (e) => e.preventDefault());
}

function initPhotoRoll() {
  const roll = document.querySelector(".photo-roll");
  const track = document.querySelector(".roll-track");
  if (!roll || !track) return;

  let isDragging = false;
  let startX = 0;
  let currentOffset = 0;
  let startOffset = 0;
  let dragDistance = 0;

  const baseSpeed = 0.22;

  function getLoopSize() {
    const half = Math.floor(track.children.length / 2);
    if (half <= 0) return 0;
    return track.children[half].offsetLeft - track.children[0].offsetLeft;
  }

  function handleStart(e) {
    isDragging = true;
    roll.classList.add("grabbing");

    const clientX = e.type.startsWith("touch") ? e.touches[0].clientX : e.clientX;
    startX = clientX;
    startOffset = currentOffset;
    dragDistance = 0;
  }

  function handleMove(e) {
    if (!isDragging) return;

    if (e.cancelable) {
      e.preventDefault();
    }

    const clientX = e.type.startsWith("touch") ? e.touches[0].clientX : e.clientX;
    const deltaX = clientX - startX;
    dragDistance = Math.abs(deltaX);

    const loopSize = getLoopSize();
    if (loopSize <= 0) return;

    currentOffset = startOffset + deltaX;

    if (currentOffset > 0) {
      currentOffset -= loopSize;
    } else if (Math.abs(currentOffset) >= loopSize) {
      currentOffset += loopSize;
    }

    updateTransform();
  }

  function handleEnd() {
    if (!isDragging) return;
    isDragging = false;
    roll.classList.remove("grabbing");
  }

  function updateTransform() {
    track.style.transform = `translateX(${currentOffset}px)`;
  }

  function tick() {
    if (!isDragging) {
      const loopSize = getLoopSize();
      if (loopSize > 0) {
        currentOffset -= baseSpeed;
        if (Math.abs(currentOffset) >= loopSize) {
          currentOffset += loopSize;
        }
        updateTransform();
      }
    }
    requestAnimationFrame(tick);
  }

  roll.addEventListener("mousedown", handleStart);
  window.addEventListener("mousemove", handleMove, { passive: false });
  window.addEventListener("mouseup", handleEnd);

  roll.addEventListener("touchstart", handleStart, { passive: true });
  window.addEventListener("touchmove", handleMove, { passive: false });
  window.addEventListener("touchend", handleEnd);
  window.addEventListener("touchcancel", handleEnd);

  track.querySelectorAll("img, a, span").forEach((el) => {
    el.addEventListener("dragstart", (e) => e.preventDefault());
  });

  const uniqueImages = [];
  const rollImgs = track.querySelectorAll(".roll-frame img");
  rollImgs.forEach((img) => {
    const src = img.getAttribute("src");
    if (!uniqueImages.some((item) => item.src === src)) {
      uniqueImages.push({
        type: "image",
        src: img.src,
        alt: img.alt || "About photo",
        description: img.alt || "Build and testing phase documentation photo.",
        noSidebar: true
      });
    }
  });

  rollImgs.forEach((img) => {
    img.style.cursor = "zoom-in";
    img.addEventListener("click", () => {
      if (dragDistance > 5) return;
      if (img.dataset.wasHold === "true") {
        img.dataset.wasHold = "false";
        return;
      }
      const index = uniqueImages.findIndex((item) => item.src === img.src);
      if (index !== -1) {
        openMediaItems(uniqueImages, index);
      }
    });

    bindHoldToOpen(img, () => {
      const index = uniqueImages.findIndex((item) => item.src === img.src);
      return {
        items: uniqueImages,
        index: index !== -1 ? index : 0
      };
    });
  });

  const profileImg = document.querySelector(".profile-static img");
  if (profileImg) {
    profileImg.style.cursor = "zoom-in";
    profileImg.addEventListener("click", () => {
      if (profileImg.dataset.wasHold === "true") {
        profileImg.dataset.wasHold = "false";
        return;
      }
      openRawMediaViewer({
        type: "image",
        src: profileImg.src,
        alt: profileImg.alt || "Carl Louis Profile",
        description: "Carl Louis - BEng Aerospace Engineering graduate, Singapore Institute of Technology.",
        noSidebar: true
      });
    });

    bindHoldToOpen(profileImg, () => ({
      item: {
        type: "image",
        src: profileImg.src,
        alt: profileImg.alt || "Carl Louis Profile",
        description: "Carl Louis - BEng Aerospace Engineering graduate, Singapore Institute of Technology.",
        noSidebar: true
      }
    }));
  }

  tick();
}

createSpacefield();
createSpacecraftScene();
initPhotoRoll();

/* ── Project Detail Modal ── */

const projectData = {
  "drone-scratch": {
    label: "UAV DESIGN",
    type: "UAV-01 / Flight Controller",
    title: "Ground-up UAV Flight Control Stack",
    description:
      "Built from scratch to understand how flight actually works. Combining embedded control, sensor fusion, actuator logic, and flight dynamics into a working UAV platform.",
    pins: {
      top: { label: "CTRL LOOP RATE", value: "400 Hz" },
      bottom: { label: "STATE ESTIMATION", value: "IMU / Gyro" },
    },
    telemetry: [
      { label: "STATUS", value: "COMPLETED & CRASHED" },
    ],
    media: [
      {
        type: "image",
        src: "./assets/projects/diy-uav-flight-control-stack/DC_ESC_PDB.jpg",
        alt: "DC Motor ESC & Power Distribution Board",
        description: "A self-made, self-soldered electronic speed controller (ESC) and power distribution board (PDB) designed and fabricated to distribute current and handle drive signals on the custom quadcopter platform."
      },
      {
        type: "image",
        src: "./assets/projects/diy-uav-flight-control-stack/PID_tuning_simulink.jpg",
        alt: "PID Tuning Simulink Simulation",
        description: "Simulink workflow model used to calculate and simulate the optimized PID coefficients for roll, pitch, and yaw control loops according to the drone's physical parameters."
      },
      {
        type: "video",
        src: "./assets/projects/diy-uav-flight-control-stack/response_and_threshold_test.mp4",
        alt: "Sensor Response & Actuator Threshold Testing",
        description: "Dynamic checking IMU sensor response rates and actuator input thresholds, validating that control outputs do not go rogue or overvolt the motors."
      },
      {
        type: "video",
        src: "./assets/projects/diy-uav-flight-control-stack/sensor_fusion.mp4",
        alt: "Sensor Fusion",
        description: "Testing the sensor fusion of IMU and Barometer to fix the altitude drift."
      }
    ],
    tags: ["ESP32", "Kalman Filter", "Cascade PID", "Simulink", "MIT Inventor App", "C++"],
    flightTimeline: {
      badges: [
        { label: "CTRL LOOP RATE", value: "400 Hz" },
        { label: "PROPULSION", value: "Brushed DC Motors" },
        { label: "MICROCONTROLLER", value: "ESP32" },
        { label: "TELEMETRY", value: "Bluetooth" },
      ],
      steps: [
        {
          badge: "DESIGN",
          title: "SYSTEM ARCHITECTURE & AIRFRAME DESIGN",
          description: "Architecture definition, including airframe geometry, propulsion layout, control strategy, and embedded system requirements.",
        },
        {
          badge: "BUILD",
          title: "HARDWARE & CONTROL STACK INTEGRATION",
          description: "Airframe fabrication, electronics integration, embedded firmware implementation, and actuator interfacing.",
        },
        {
          badge: "VALIDATE",
          title: "BENCH VALIDATION",
          description: "Sensor readings, control loop timing, actuator response, and motor mixing verified before flight testing.",
        },
        {
          badge: "FLIGHT",
          title: "FLIGHT TEST",
          description: "Controlled flight testing conducted to evaluate stabilisation behaviour, estimator performance, and controller response.",
        },
        {
          badge: "FAILURE",
          title: "LOSS OF VEHICLE",
          description: "Communication instability resulted in loss of command authority, leading to a crashed on to a wall",
          critical: true,
        },
        {
          badge: "LEARN",
          title: "POST-CRASH LESSON",
          description: "Communication bandwidth and reliability limitations identified, highlighting the need for more robust telemetry architecture.",
          conclusion: true,
        },
      ],
    },
  },
  "fwish-gev": {
    label: "WORK IN PROGRESS",
    type: "GEV-01 / Aerodynamics",
    title: "FWISH | Personal Wing-In-Ground Effect Craft",
    description:
      "A personal wing-in-ground-effect (WIG) craft research and prototyping platform designed to exploit aerodynamic lift enhancements when operating close to flat boundaries. The project involves CFD simulation of high-pressure ground cushioning, aerodynamic wing-profile design, and construction of scaled prototypes to evaluate pitch stability, height-sensing control loops, and thrust line optimizations.",
    pins: null,
    telemetry: [
      { label: "STATUS", value: "Prototyping" },
    ],
    media: [
      {
        type: "pdf",
        src: "./assets/projects/fwish-personal-ground-effect-craft/Carl_Louis_Capstone_Report_LES_Based_Investigation_of_Unsteady_Wake.pdf",
        label: "Capstone Report",
        description: "Undergraduate capstone research investigating unsteady wake interactions between tandem wings in FWISH. The project used LES CFD simulations to analyse aerodynamic coupling, wake behaviour, and stability implications for FWISH personal ground-effect craft development."
      },
      {
        type: "video",
        src: "./assets/projects/fwish-personal-ground-effect-craft/8.12x_top te gurney in_developed.mp4",
        alt: "Simulation Animation For Inward Gurney Modification",
        description: "LES-based wake simulation showing transient flow structures and unsteady vortex patterns behind tandem wings in ground effect. Viewing from top plane cutting through wings leading edge horizontally"
      },
      {
        type: "image",
        src: "./assets/about/FWISH_V0_display_build.jpg",
        alt: "Display Model Build",
        description: "The physical construction and structural assembly phase of the FWISH V0 display model."
      },
      {
        type: "image",
        src: "./assets/projects/fwish-personal-ground-effect-craft/v0-display-wings.jpg",
        alt: "Display Wings",
        description: "Fabricated wings for the FWISH v0 display model craft."
      },
      {
        type: "video",
        src: "./assets/projects/fwish-personal-ground-effect-craft/manufacturing.mp4",
        alt: "Manufacturing Evidence",
        description: "Manufacturing of foam core for the FWISH v0 display model craft."
      },
      {
        type: "album",
        label: "Early Design Analysis",
        images: [
          {
            type: "image",
            src: "./assets/projects/fwish-personal-ground-effect-craft/v0-early-geom-design-analysis.jpg",
            alt: "Early Geometric Design Analysis",
            description: "Initial geometric configurations and lifting line optimization analysis for early design phases. Done in Microsoft Excel"
          },
          {
            type: "image",
            src: "./assets/projects/fwish-personal-ground-effect-craft/v0-early-forcecoef-analysis.jpg",
            alt: "Early Static Flight Forces Analysis",
            description: "Aerodynamic forces analysis evaluating lift and drag behavior. Done in Microsoft Excel"
          },
          {
            type: "image",
            src: "./assets/projects/fwish-personal-ground-effect-craft/v0-moment-analysis-plot.jpg",
            alt: "Early Moment Analysis Plot",
            description: "Static pitching moments plots for early design layouts. Done in MATLAB"
          }
        ]
      }
    ],
    tags: ["WIG Craft", "CFD", "Aerodynamics", "Simulink", "Dynamics", "MATLAB"],
  },
  "wing-opt": {
    label: "WORK IN PROGRESS",
    type: "OPT-01 / Computational Design",
    title: "Genetic Aerodynamic Design Optimisation",
    description:
      "Developing a parametric aerodynamic optimisation engine that generates wing populations, evaluates each design through CFD analysis, and applies genetic evolution strategies to converge toward higher-performing aerodynamic geometries.",
    pins: null,
    telemetry: [
      { label: "STATUS", value: "Building" },
    ],
    media: [
      {
        type: "image",
        src: "./assets/projects/genetic-aerodynamic-optimisation/genesis-batch-generated-models-population.jpg",
        alt: "Genesis Batch Population Modelling in ForgeCAD",
        description: "Initial seed population generation of parameterized wing structures modeled inside ForgeCAD, presenting randomized variations of chord lengths, sweeps, and spanwise curvatures."
      },
      {
        type: "image",
        src: "./assets/projects/genetic-aerodynamic-optimisation/genesis-batch-population.jpg",
        alt: "10-Population Wing Variants Rendering",
        description: "Visualisation of the 10-population wing designs generated concurrently inside the parametric CAD pipeline, demonstrating diverse geometric configurations before export to OpenFOAM for aerodynamic evaluation."
      }
    ],
    tags: ["Evolutionary Models", "Aerodynamics", "Optimization"],
    flowchart: {
      steps: [
        {
          active: false,
          title: "Genesis Batch Generation",
          description: "Define wing spline parameters, constraint bounds, and generate the baseline population using a randomized seed.",
          tag: "ForgeCAD",
          status: "COMPLETED"
        },
        {
          active: true,
          title: "Aerodynamic Simulation (CFD)",
          description: "Execute automated mesh generation and parallelized RANS CFD simulations in ground effect in OpenFOAM.",
          tag: "OpenFOAM",
          subtext: "CURRENTLY BUILDING: Establishing consistent simulation boundaries and meshing parameters for the first batch CFD runs."
        },
        {
          active: false,
          title: "Survivor Selection & Breeding",
          description: "Take the top 20% survivors and breed them with crossover/mutation operators to obtain the next generation.",
          tag: "Genetic Core",
          status: "UPCOMING"
        },
        {
          active: false,
          title: "Iterative Convergence Loop",
          description: "Repeat the cycle recursively until aerodynamic efficiency converges to the optimal curved profile.",
          tag: "Convergence",
          status: "UPCOMING"
        }
      ]
    }
  },
  "airframe-opt": {
    label: "STRUCTURE",
    type: "STR-01 / Composite Airframe",
    title: "Lightweight Structural Optimised UAV Airframe",
    description:
      "Redesigned a UAV airframe using structural optimisation workflows in ANSYS to reduce mass while maintaining stiffness under simulated loading conditions. The project combined FEA-driven iteration, topology optimisation, and prototype validation through physical testing.",
    telemetry: [
      { label: "KEY RESULT", value: "20% Structural Mass Reduction" },
    ],
    media: [
      {
        type: "video",
        src: "./assets/projects/lightweight-uav-airframe-structural-optimisation/structural-optimisation.mp4",
        alt: "Topology Structural Optimisation",
        description: "ANSYS topology optimisation workflow identifying low-stress regions for material reduction under simulated thrust loading conditions."
      },
      {
        type: "image",
        src: "./assets/projects/lightweight-uav-airframe-structural-optimisation/stress_sim.jpg",
        alt: "FEA Stress Validation",
        description: "Structural stress analysis validating load distribution and stiffness of the optimised airframe geometry under simulated operational loading."
      },
      {
        type: "image",
        src: "./assets/projects/lightweight-uav-airframe-structural-optimisation/parts.jpg",
        alt: "Optimised Centre Body and Arm Geometry",
        description: "Prototype parts produced from the topology optimisation workflow to evaluate structural layout and manufacturability."
      },
      {
        type: "video",
        src: "./assets/projects/lightweight-uav-airframe-structural-optimisation/thrust-loading-test.mp4",
        alt: "Dynamic Thrust Loading Test",
        description: "Prototype thrust-loading test performed to evaluate structural behaviour and frame stability under active propulsion conditions."
      }
    ],
    tags: ["FEA", "ANSYS", "Topology Optimization", "Resin Printing"],
  },
  "thrust-platform": {
    label: "PROPULSION",
    type: "DAQ-01 / Propulsion Testbed",
    title: "Propulsion Characterisation Platform",
    description:
      "Designed an experimental propulsion test platform to characterise thrust response and motor-arm time constants for 8520 coreless DC motors with 75 mm propellers. The platform integrated force sensing, DAQ streaming, and a custom analysis interface for automated throttle sweep testing.",
    pins: {
      top: { label: "DAQ SAMPLING", value: "13 Hz" },
      bottom: { label: "MAX THRUST CAP", value: "5.0 kgf" },
    },
    telemetry: [
      { label: "OBJECTIVE", value: "Automated Propulsion Sweep Testing" },
    ],
    media: [
      {
        type: "video",
        src: "./assets/projects/diy-thrust-characterisation-platform/thrust_test.mp4",
        alt: "Dynamic Propulsion Sweep Test",
        description: "Automated throttle sweep experiment used to characterise transient thrust response and propulsion behaviour across stepped operating conditions."
      },
      {
        type: "image",
        src: "./assets/projects/diy-thrust-characterisation-platform/ESC.jpg",
        alt: "Self-Built Electronic Speed Controller",
        description: "A self-built electronic speed controller (ESC) built to regulate and control the voltage input to the motor according to controller command signals."
      },
      {
        type: "image",
        src: "./assets/projects/diy-thrust-characterisation-platform/test_result.jpg",
        alt: "Propulsion Response Characterisation",
        description: "Experimental thrust response captured under incremental throttle commands, enabling transient response analysis and propulsion performance evaluation."
      },
      {
        type: "image",
        src: "./assets/projects/diy-thrust-characterisation-platform/hardwares.jpg",
        alt: "Integrated Propulsion Test Platform",
        description: "Fully assembled propulsion characterisation rig integrating force sensing, DAQ acquisition, and mounted motor-propulsion hardware."
      }
    ],
    tags: ["Arduino", "Python", "Data Aquisition", "Load Calibration"],
    propulsionDashboard: {
      metrics: [
        { label: "DAQ SAMPLING", value: "13 Hz" },
        { label: "FORCE SENSOR", value: "Load Cell" },
        { label: "MOTOR", value: "8520 Coreless DC" },
        { label: "PROPELLER", value: "75 mm" },
      ],
      readouts: [
        { label: "MAX THRUST", value: "33.547" },
        { label: "THRUST CURVE", value: "9.05 g/V" },
      ],
      data: [
        { throttle: 10, thrust: 0, tau: 0.71 },
        { throttle: 20, thrust: 3.803, tau: 0.612 },
        { throttle: 30, thrust: 8.076, tau: 0.489 },
        { throttle: 40, thrust: 11.929, tau: 0.464 },
        { throttle: 50, thrust: 15.673, tau: 0.488 },
        { throttle: 60, thrust: 18.949, tau: 0.342 },
        { throttle: 70, thrust: 22.052, tau: 0.312 },
        { throttle: 80, thrust: 25.168, tau: 0.381 },
        { throttle: 90, thrust: 27.825, tau: 0.298 },
        { throttle: 100, thrust: 33.547, tau: 0.315 },
      ],
    },
  },
};

const overlay = document.getElementById("project-modal-overlay");
const modal = document.getElementById("project-modal");
const closeBtn = document.getElementById("modal-close");

// Media Viewer Elements
const mediaViewerOverlay = document.getElementById("media-viewer-overlay");
const mediaViewerClose = document.getElementById("media-viewer-close");
const mediaViewerDisplay = document.getElementById("media-viewer-display");
const mediaViewerTitle = document.getElementById("media-viewer-title");
const mediaViewerDescription = document.getElementById("media-viewer-description");
const mediaViewerPrev = document.getElementById("media-viewer-prev");
const mediaViewerNext = document.getElementById("media-viewer-next");

let mediaViewerItems = [];
let mediaViewerIndex = 0;

let modalSceneInstance = null;
let modalCamera = null;
let modalRenderer = null;
let modalAnimFrameId = null;
let modalGroup = null;
let modalExtraAnimation = null;
let modalAutoRotate = true;
let modalInteractionCleanup = null;

function sortNewestFirst(items) {
  return [...items].sort((a, b) => new Date(b.date) - new Date(a.date));
}

function mediaElementMarkup(item, className = "") {
  const classAttr = className ? ` class="${className}"` : "";
  if (item?.type === "video") {
    const posterAttr = item.poster ? ` poster="${item.poster}"` : "";
    return `<video${classAttr} src="${item.src}"${posterAttr} muted loop playsinline preload="metadata"></video>`;
  }
  if (item?.type === "image") {
    return `<img${classAttr} src="${item.src}" alt="${item.title || ""}" loading="lazy">`;
  }
  return "";
}

function buildRingPlaceholder(label = "ARCHIVE EMPTY") {
  return `
    <div class="field-placeholder" aria-hidden="true">
      <span class="field-placeholder-ring ring-one"></span>
      <span class="field-placeholder-ring ring-two"></span>
      <strong>${label}</strong>
    </div>`;
}

function renderFieldNotes() {
  const grid = document.getElementById("field-notes-grid");
  if (!grid) return;

  grid.innerHTML = fieldNoteCategories
    .map((category) => {
      const items = sortNewestFirst(fieldNotes.filter((item) => item.category === category.id));
      const preview = items[0];
      const previewMarkup = preview ? mediaElementMarkup(preview, "note-preview-media") : buildRingPlaceholder("AWAITING MEDIA");
      const countLabel = `${items.length} ${items.length === 1 ? "ENTRY" : "ENTRIES"}`;
      return `
        <article class="note-card reveal" data-field-category="${category.id}" tabindex="0" role="button" aria-label="Open ${category.label} field notes">
          <div class="note-media">
            ${previewMarkup}
            <div class="note-orbit" aria-hidden="true"></div>
          </div>
          <div class="note-copy">
            <span>${category.label}</span>
            <h3>${category.description}</h3>
            <p>${countLabel}</p>
          </div>
        </article>`;
    })
    .join("");

  grid.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));
  grid.querySelectorAll(".note-card").forEach((card) => {
    const open = () => openFieldAlbum(card.dataset.fieldCategory);
    card.addEventListener("click", open);
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        open();
      }
    });

    const video = card.querySelector("video");
    if (video) {
      card.addEventListener("mouseenter", () => video.play().catch(() => { }));
      card.addEventListener("mouseleave", () => {
        video.pause();
        video.currentTime = 0;
      });
    }
  });
}

function initModalScene(projectId) {
  cleanupModalScene();

  if (projectData[projectId]?.flightTimeline || projectData[projectId]?.propulsionDashboard) return;

  const canvas = document.querySelector("#modalScene");
  if (!canvas) return;

  let lastTime = performance.now();

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  modalRenderer = renderer;

  const scene = new THREE.Scene();
  modalSceneInstance = scene;

  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0, 1.2, 5.5);
  modalCamera = camera;

  const group = new THREE.Group();
  scene.add(group);
  modalGroup = group;

  const rose = new THREE.Color("#f4b6c2");
  const graphite = new THREE.Color("#1a2233");
  const orange = new THREE.Color("#f97316");

  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: graphite,
    metalness: 0.8,
    roughness: 0.3,
  });

  const accentMaterial = new THREE.MeshStandardMaterial({
    color: rose,
    metalness: 0.7,
    roughness: 0.2,
    emissive: new THREE.Color("#2c111a"),
    emissiveIntensity: 0.2,
  });

  const keyLight = new THREE.PointLight("#f8cad4", 3, 15);
  keyLight.position.set(3, 3, 4);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight("#94a3b8", 1.2);
  fillLight.position.set(-3, 1, 3);
  scene.add(fillLight);
  scene.add(new THREE.AmbientLight("#ffffff", 0.45));

  const modelConfig = projectData[projectId]?.model;
  if (modelConfig) {
    modalAutoRotate = false;
    const modelGroup = new THREE.Group();
    modelGroup.position.set(...modelConfig.position);
    modelGroup.rotation.set(...modelConfig.rotation);
    group.add(modelGroup);

    const loader = new GLTFLoader();
    const pinkModelMaterial = new THREE.MeshStandardMaterial({
      color: rose,
      metalness: 0.42,
      roughness: 0.36,
      emissive: new THREE.Color("#35131e"),
      emissiveIntensity: 0.22,
    });

    loader.load(
      modelConfig.src,
      (gltf) => {
        const model = gltf.scene;
        let meshCount = 0;
        model.traverse((object) => {
          if (object.isMesh) {
            meshCount += 1;
            object.material = pinkModelMaterial;
            object.castShadow = true;
            object.receiveShadow = true;
          }
        });

        if (!meshCount) {
          console.warn(`GLB model for ${projectId} loaded with no mesh content.`);
        }

        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDimension = Math.max(size.x, size.y, size.z) || 1;
        const scaleFactor = (modelConfig.scale || 2.25) / maxDimension;
        model.scale.setScalar(scaleFactor);
        model.position.copy(center).multiplyScalar(-scaleFactor);
        modelGroup.add(model);
      },
      undefined,
      (error) => {
        console.warn(`Unable to load GLB model for ${projectId}:`, error);
        if (projectId === "fwish-gev") {
          const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.18, 1.8, 20), pinkModelMaterial);
          fuselage.rotation.z = Math.PI / 2;
          const wing = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.035, 2.4), pinkModelMaterial);
          wing.position.x = 0.08;
          const tail = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.28, 0.04), pinkModelMaterial);
          tail.position.set(-0.72, 0.16, 0);
          modelGroup.add(fuselage, wing, tail);
        }
      }
    );

    camera.position.set(...modelConfig.camera);

    let isDragging = false;
    let previousX = 0;
    let previousY = 0;
    const baseZoom = modelConfig.camera[2];
    const minZoom = baseZoom / 2;
    const maxZoom = baseZoom / 0.7;

    const onPointerDown = (event) => {
      isDragging = true;
      previousX = event.clientX;
      previousY = event.clientY;
      canvas.setPointerCapture?.(event.pointerId);
    };

    const onPointerMove = (event) => {
      if (!isDragging) return;
      const deltaX = event.clientX - previousX;
      const deltaY = event.clientY - previousY;
      previousX = event.clientX;
      previousY = event.clientY;
      modelGroup.rotation.y += deltaX * 0.008;
      modelGroup.rotation.x += deltaY * 0.008;
    };

    const stopDragging = (event) => {
      isDragging = false;
      if (event?.pointerId !== undefined) canvas.releasePointerCapture?.(event.pointerId);
    };

    const onWheel = (event) => {
      event.preventDefault();
      const nextZ = camera.position.z + Math.sign(event.deltaY) * 0.32;
      camera.position.z = Math.max(minZoom, Math.min(maxZoom, nextZ));
      camera.updateProjectionMatrix();
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", stopDragging);
    canvas.addEventListener("pointerleave", stopDragging);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    modalInteractionCleanup = () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", stopDragging);
      canvas.removeEventListener("pointerleave", stopDragging);
      canvas.removeEventListener("wheel", onWheel);
    };

  } else if (projectId === "drone-scratch") {
    // 3D Quadcopter Drone
    const droneGroup = new THREE.Group();
    group.add(droneGroup);

    // Center body
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.15, 0.6), bodyMaterial);
    droneGroup.add(body);

    // Diagonal arms (X shape)
    const arm1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.4, 8), bodyMaterial);
    arm1.rotation.x = Math.PI / 2;
    arm1.rotation.y = Math.PI / 4;
    droneGroup.add(arm1);

    const arm2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.4, 8), bodyMaterial);
    arm2.rotation.x = Math.PI / 2;
    arm2.rotation.y = -Math.PI / 4;
    droneGroup.add(arm2);

    // Motors & Propellers
    const propGroupArray = [];
    const motorPositions = [
      { x: 0.49, z: 0.49 },
      { x: -0.49, z: 0.49 },
      { x: 0.49, z: -0.49 },
      { x: -0.49, z: -0.49 },
    ];

    motorPositions.forEach((pos) => {
      // Motor mount
      const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.18, 8), accentMaterial);
      motor.position.set(pos.x, 0.1, pos.z);
      droneGroup.add(motor);

      // Propeller pivot group
      const propGroup = new THREE.Group();
      propGroup.position.set(pos.x, 0.2, pos.z);

      // Propeller blades
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.015, 0.04), accentMaterial);
      propGroup.add(blade);

      droneGroup.add(propGroup);
      propGroupArray.push(propGroup);
    });

    droneGroup.rotation.x = 0.15;
    droneGroup.rotation.z = -0.08;

    modalExtraAnimation = (seconds) => {
      // Hovering motion
      droneGroup.position.y = Math.sin(seconds * 3.5) * 0.12;
      droneGroup.rotation.y = seconds * 0.15;

      // Spin propellers
      propGroupArray.forEach((prop, idx) => {
        const dir = idx % 2 === 0 ? 1 : -1;
        prop.rotation.y += dir * 0.85;
      });
    };

  } else if (false && projectId === "fwish-gev") {
    // 3D Ground Effect Vehicle (Ekranoplan)
    const gevGroup = new THREE.Group();
    group.add(gevGroup);

    // Fuselage
    const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.15, 1.4, 12), bodyMaterial);
    fuselage.rotation.z = Math.PI / 2;
    gevGroup.add(fuselage);

    // Wings
    const wings = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.04, 1.6), bodyMaterial);
    wings.position.set(0.1, 0, 0);
    gevGroup.add(wings);

    // Tail fin (vertical)
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.36, 0.03), bodyMaterial);
    fin.position.set(-0.55, 0.2, 0);
    gevGroup.add(fin);

    // Tailplane (horizontal)
    const tailplane = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.03, 0.5), bodyMaterial);
    tailplane.position.set(-0.55, 0.38, 0);
    gevGroup.add(tailplane);

    // Wingtip floats
    [-0.8, 0.8].forEach((zSide) => {
      const float = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 0.3, 8), accentMaterial);
      float.rotation.z = Math.PI / 2;
      float.position.set(0.1, -0.08, zSide);
      gevGroup.add(float);
    });

    // Nose prop
    const nosePropGroup = new THREE.Group();
    nosePropGroup.position.set(0.72, 0, 0);
    const blades = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.36, 0.04), accentMaterial);
    nosePropGroup.add(blades);
    gevGroup.add(nosePropGroup);

    // Infinite moving ground grid
    const lineMat = new THREE.LineBasicMaterial({
      color: rose,
      transparent: true,
      opacity: 0.18,
    });
    const grid = new THREE.GridHelper(10, 10, lineMat.color, lineMat.color);
    grid.position.y = -0.75;
    group.add(grid);

    gevGroup.rotation.y = -Math.PI / 5;
    gevGroup.rotation.x = 0.08;

    modalExtraAnimation = (seconds) => {
      // Gentle floating in ground effect
      gevGroup.position.y = 0.05 + Math.sin(seconds * 2.8) * 0.04;
      gevGroup.rotation.z = Math.sin(seconds * 1.5) * 0.03;
      gevGroup.rotation.x = 0.08 + Math.cos(seconds * 2.2) * 0.02;

      // Spin propeller
      nosePropGroup.rotation.x += 0.95;

      // Infinite backward ground movement (seamless texture translation)
      grid.position.x = -(seconds * 2.2) % 1.0;
    };

  } else if (false && projectId === "wing-opt") {
    // 3D Airfoil & Wind Tunnel Flow Simulation
    const wingGroup = new THREE.Group();
    group.add(wingGroup);

    const wingMat = new THREE.MeshStandardMaterial({
      color: graphite,
      metalness: 0.6,
      roughness: 0.4,
      transparent: true,
      opacity: 0.85
    });

    // Main wing segment
    const wingSkin = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.08, 1.2), wingMat);
    wingSkin.rotation.y = Math.PI / 12;
    wingSkin.rotation.z = 0.15; // Angle of attack
    wingGroup.add(wingSkin);

    // Outline ribs
    const ribGeom = new THREE.BoxGeometry(1.32, 0.09, 0.02);
    [-0.5, -0.25, 0, 0.25, 0.5].forEach((zPos) => {
      const rib = new THREE.Mesh(ribGeom, accentMaterial);
      rib.position.set(0, 0, zPos);
      rib.rotation.y = Math.PI / 12;
      rib.rotation.z = 0.15;
      wingGroup.add(rib);
    });

    // Particle flow
    const particleCount = 45;
    const positions = new Float32Array(particleCount * 3);
    const particleData = [];

    for (let i = 0; i < particleCount; i++) {
      const x = -2.5 + Math.random() * 5;
      const z = (Math.random() - 0.5) * 1.4;
      const isTop = Math.random() > 0.45;
      const yOffset = isTop ? 0.06 + Math.random() * 0.15 : -0.06 - Math.random() * 0.12;

      positions[i * 3] = x;
      positions[i * 3 + 1] = yOffset;
      positions[i * 3 + 2] = z;

      particleData.push({
        x: x,
        z: z,
        yOffset: yOffset,
        isTop: isTop,
        speed: 0.04 + Math.random() * 0.03
      });
    }

    const particlesGeom = new THREE.BufferGeometry();
    particlesGeom.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: rose,
      size: 0.065,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending
    });

    const flowParticles = new THREE.Points(particlesGeom, particleMat);
    group.add(flowParticles);

    modalExtraAnimation = (seconds) => {
      wingGroup.rotation.y = Math.sin(seconds * 0.6) * 0.18;

      const posArr = flowParticles.geometry.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        const pd = particleData[i];
        pd.x += pd.speed;

        if (pd.x > 2.5) {
          pd.x = -2.5;
          pd.z = (Math.random() - 0.5) * 1.4;
        }

        posArr[i * 3] = pd.x;

        const bendIntensity = pd.isTop ? 0.28 : -0.15;
        const widthFactor = 2.8;
        const curve = bendIntensity * Math.exp(-widthFactor * pd.x * pd.x);

        posArr[i * 3 + 1] = pd.yOffset + curve;
        posArr[i * 3 + 2] = pd.z;
      }
      flowParticles.geometry.attributes.position.needsUpdate = true;
    };

  } else if (projectId === "airframe-opt" || projectId === "fwish-gev") {
    const isFwishModel = projectId === "fwish-gev";
    modalAutoRotate = false;
    const frameGroup = new THREE.Group();
    frameGroup.position.set(0, -0.05, 0);
    group.add(frameGroup);

    let springPosition = 0.0;
    let springVelocity = 0.0;
    let dragSpeedAccum = 0.0;

    const airframeUniforms = {
      uBendFactor: { value: 0.0 }
    };

    const loader = new GLTFLoader();
    const pinkModelMaterial = new THREE.MeshStandardMaterial({
      color: rose,
      metalness: 0.42,
      roughness: 0.36,
      emissive: new THREE.Color("#35131e"),
      emissiveIntensity: 0.22,
    });

    const airframeMaterial = new THREE.MeshStandardMaterial({
      color: rose,
      metalness: 0.42,
      roughness: 0.36,
      emissive: new THREE.Color("#35131e"),
      emissiveIntensity: 0.22,
    });

    airframeMaterial.onBeforeCompile = (shader) => {
      shader.uniforms.uBendFactor = airframeUniforms.uBendFactor;

      shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        `#include <common>
        uniform float uBendFactor;
        varying vec3 vLocalPosition;`
      );

      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        vLocalPosition = position;
        float distSq = position.x * position.x + position.z * position.z;
        transformed.y += uBendFactor * distSq * 0.15;`
      );
    };

    loader.load(
      isFwishModel
        ? "./assets/projects/fwish-personal-ground-effect-craft/Model_V0.2a.glb"
        : "./assets/projects/lightweight-uav-airframe-structural-optimisation/diy-drone-airframe-v2.glb",
      (gltf) => {
        const model = gltf.scene;
        model.traverse((object) => {
          if (object.isMesh) {
            object.material = isFwishModel ? pinkModelMaterial : airframeMaterial;
            object.castShadow = true;
            object.receiveShadow = true;
          }
        });

        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDimension = Math.max(size.x, size.y, size.z) || 1;
        const isMobile = window.innerWidth <= 980;
        const scaleFactor = (2.35 * (isMobile ? 1.5 : 1.0)) / maxDimension;
        model.scale.setScalar(scaleFactor);
        model.position.copy(center).multiplyScalar(-scaleFactor);
        frameGroup.add(model);
      },
      undefined,
      (error) => console.warn(`Unable to load ${isFwishModel ? "FWISH" : "airframe"} GLB model:`, error)
    );

    const order = isFwishModel ? "YXZ" : "ZXY";

    const q0 = isFwishModel
      ? new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -Math.PI / 2, order))
      : new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 4, 0, Math.PI, order));

    const qDefault = isFwishModel
      ? q0.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -Math.PI / 4, (135 * Math.PI) / 180, order)))
      : q0.clone();

    frameGroup.quaternion.copy(qDefault);
    camera.position.set(0, 0.15, 6.875);

    let isDragging = false;
    let previousX = 0;
    let previousY = 0;
    let startPointerX = 0;
    let startPointerY = 0;
    const minZoom = 5.5 / 2;
    const maxZoom = 5.5 / 0.7;

    const qTarget = qDefault.clone();

    const snapTo45 = (angle) => {
      const step = Math.PI / 4; // 45 degrees in radians
      return Math.round(angle / step) * step;
    };

    const activePointers = new Map();
    let initialDist = 0;
    let initialZoomZ = 0;
    let lastTap = 0;
    let zoomTargetZ = camera.position.z;

    const onPointerDown = (event) => {
      activePointers.set(event.pointerId, event);
      canvas.setPointerCapture?.(event.pointerId);

      startPointerX = event.clientX;
      startPointerY = event.clientY;

      const now = Date.now();
      if (activePointers.size === 1) {
        if (now - lastTap < 300) {
          // Double-tap zoom toggle
          const defaultZ = 6.875;
          const zoomedZ = defaultZ / 2;
          const currentZ = camera.position.z;
          zoomTargetZ = Math.abs(currentZ - zoomedZ) < Math.abs(currentZ - defaultZ) ? defaultZ : zoomedZ;
        } else {
          isDragging = true;
          previousX = event.clientX;
          previousY = event.clientY;
        }
        lastTap = now;
      } else if (activePointers.size === 2) {
        isDragging = false;
        const pointers = Array.from(activePointers.values());
        initialDist = Math.hypot(pointers[0].clientX - pointers[1].clientX, pointers[0].clientY - pointers[1].clientY);
        initialZoomZ = camera.position.z;
      }
    };

    const onPointerMove = (event) => {
      if (activePointers.has(event.pointerId)) {
        activePointers.set(event.pointerId, event);
      }

      if (activePointers.size === 1 && isDragging) {
        const deltaX = event.clientX - previousX;
        const deltaY = event.clientY - previousY;
        previousX = event.clientX;
        previousY = event.clientY;

        if (!isFwishModel) {
          const currentDragSpeed = Math.hypot(deltaX, deltaY);
          dragSpeedAccum += (currentDragSpeed - dragSpeedAccum) * 0.25;
        }

        const deltaPitch = deltaY * 0.008;
        const deltaYaw = deltaX * 0.008;

        const qDiff = new THREE.Quaternion().setFromEuler(new THREE.Euler(deltaPitch, deltaYaw, 0, 'YXZ'));
        frameGroup.quaternion.premultiply(qDiff);
        qTarget.copy(frameGroup.quaternion);
      } else if (activePointers.size === 2) {
        const pointers = Array.from(activePointers.values());
        const dist = Math.hypot(pointers[0].clientX - pointers[1].clientX, pointers[0].clientY - pointers[1].clientY);
        if (initialDist > 0 && dist > 0) {
          const ratio = initialDist / dist;
          const nextZ = initialZoomZ * ratio;
          camera.position.z = Math.max(minZoom, Math.min(maxZoom, nextZ));
          zoomTargetZ = camera.position.z;
          camera.updateProjectionMatrix();
        }
      }
    };

    const stopDragging = (event) => {
      const wasDragging = isDragging;
      activePointers.delete(event.pointerId);
      if (event?.pointerId !== undefined) {
        canvas.releasePointerCapture?.(event.pointerId);
      }

      if (activePointers.size < 2) {
        initialDist = 0;
      }

      if (activePointers.size === 0) {
        if (wasDragging) {
          isDragging = false;

          const q0Inv = q0.clone().invert();
          const qRel = q0Inv.clone().multiply(frameGroup.quaternion);
          const eulerRel = new THREE.Euler().setFromQuaternion(qRel, order);

          const snappedX = snapTo45(eulerRel.x);
          const snappedY = snapTo45(eulerRel.y);
          const snappedZ = snapTo45(eulerRel.z);

          const targetEuler = new THREE.Euler(snappedX, snappedY, snappedZ, order);
          const qTargetRel = new THREE.Quaternion().setFromEuler(targetEuler);
          qTarget.copy(q0.clone().multiply(qTargetRel));
        } else {
          // Check for tap event to trigger elasticity physics
          const dist = Math.hypot(event.clientX - startPointerX, event.clientY - startPointerY);
          if (dist < 5) {
            const rect = canvas.getBoundingClientRect();
            const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
            const intersects = raycaster.intersectObjects(frameGroup.children, true);

            if (intersects.length > 0 && !isFwishModel) {
              springVelocity = -12.0; // Apply tap impulse to the spring
            }
          }
        }
      } else if (activePointers.size === 1) {
        isDragging = true;
        const remaining = activePointers.values().next().value;
        previousX = remaining.clientX;
        previousY = remaining.clientY;
      }
    };

    const onWheel = (event) => {
      event.preventDefault();
      const nextZ = camera.position.z + Math.sign(event.deltaY) * 0.32;
      camera.position.z = Math.max(minZoom, Math.min(maxZoom, nextZ));
      zoomTargetZ = camera.position.z;
      camera.updateProjectionMatrix();
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", stopDragging);
    canvas.addEventListener("pointerleave", stopDragging);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    const pinTop = document.getElementById("modal-pin-top");
    if (pinTop) pinTop.style.display = isFwishModel ? "" : "none";

    modalExtraAnimation = (seconds, dt) => {
      if (!isDragging && activePointers.size === 0) {
        frameGroup.quaternion.slerp(qTarget, 0.12);
      }

      if (Math.abs(camera.position.z - zoomTargetZ) > 0.001) {
        camera.position.z += (zoomTargetZ - camera.position.z) * 0.15;
        camera.updateProjectionMatrix();
      }

      // Update spring physics for elasticity animation
      if (!isFwishModel) {
        if (!isDragging) {
          dragSpeedAccum += (0.0 - dragSpeedAccum) * 0.15;
        }

        const dragForce = -dragSpeedAccum * 2.0;

        const stiffness = 160.0;
        const damping = 9.0;
        const acceleration = -stiffness * springPosition - damping * springVelocity + dragForce;
        springVelocity += acceleration * dt;
        springPosition += springVelocity * dt;

        airframeUniforms.uBendFactor.value = springPosition;
      }

      const q0Inv = q0.clone().invert();
      const qRel = q0Inv.clone().multiply(frameGroup.quaternion);
      const eulerRel = new THREE.Euler().setFromQuaternion(qRel, order);

      const toDegrees = (rad) => {
        let deg = Math.round((rad * 180) / Math.PI) % 360;
        if (deg < -180) deg += 360;
        if (deg > 180) deg -= 360;
        return deg;
      };

      let pitchVal, rollVal, yawVal;
      if (isFwishModel) {
        pitchVal = -toDegrees(eulerRel.x);
        rollVal = toDegrees(eulerRel.y);
        yawVal = toDegrees(eulerRel.z);
      } else {
        pitchVal = toDegrees(eulerRel.x);
        rollVal = toDegrees(eulerRel.z);
        yawVal = toDegrees(eulerRel.y);
      }

      if (pinTop && isFwishModel) {
        pinTop.innerHTML = `
          <div class="orientation-telemetry">
            <div class="telemetry-header">
              <span>TELEMETRY</span>
            </div>
            <div class="telemetry-row">
              <span>PITCH</span>
              <strong>${pitchVal}°</strong>
            </div>
            <div class="telemetry-row">
              <span>ROLL</span>
              <strong>${rollVal}°</strong>
            </div>
            <div class="telemetry-row">
              <span>YAW</span>
              <strong>${yawVal}°</strong>
            </div>
          </div>
        `;
      }
    };

    modalInteractionCleanup = () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", stopDragging);
      canvas.removeEventListener("pointerleave", stopDragging);
      canvas.removeEventListener("wheel", onWheel);
      if (pinTop) {
        pinTop.style.display = "none";
        pinTop.innerHTML = `
          <span id="modal-pin-top-label"></span>
          <strong id="modal-pin-top-value"></strong>
        `;
      }
    };

  } else if (projectId === "thrust-platform") {
    // 3D Propulsion Thrust Stand
    const standGroup = new THREE.Group();
    group.add(standGroup);

    // Base rails (dual horizontal rods representing calibration stand structure)
    const baseRail1 = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.08, 0.08), bodyMaterial);
    baseRail1.position.set(0, -0.4, 0.15);
    standGroup.add(baseRail1);

    const baseRail2 = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.08, 0.08), bodyMaterial);
    baseRail2.position.set(0, -0.4, -0.15);
    standGroup.add(baseRail2);

    // Vertical mounting bracket / load cell adapter
    const bracket = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.7, 12), bodyMaterial);
    bracket.position.set(0.3, -0.05, 0);
    standGroup.add(bracket);

    // Brushless Motor cylinder mount
    const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.22, 16), accentMaterial);
    motor.position.set(0.3, 0.35, 0);
    standGroup.add(motor);

    // Calibration weights / sensors (small boxes at the other side of base to represent DAQ/Load Cell)
    const daqBox = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.28, 0.28), bodyMaterial);
    daqBox.position.set(-0.6, -0.22, 0);
    standGroup.add(daqBox);

    // Propeller pivot and blades
    const propGroup = new THREE.Group();
    propGroup.position.set(0.3, 0.48, 0);
    standGroup.add(propGroup);

    const propHub = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.08, 12), accentMaterial);
    propHub.position.set(0, 0, 0);
    propGroup.add(propHub);

    const blade = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.02, 0.08), accentMaterial);
    blade.position.set(0, 0.04, 0);
    propGroup.add(blade);

    // Force/Thrust vector line (high-tech arrow showing dynamic calibration thrust)
    const arrowGeom = new THREE.CylinderGeometry(0, 0.06, 0.18, 8);
    const arrow = new THREE.Mesh(arrowGeom, accentMaterial);
    arrow.position.set(0.3, 0.95, 0);
    standGroup.add(arrow);

    const lineMat = new THREE.LineDashedMaterial({
      color: rose,
      dashSize: 0.1,
      gapSize: 0.08
    });
    const lineGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0.3, 0.48, 0),
      new THREE.Vector3(0.3, 0.9, 0)
    ]);
    const forceLine = new THREE.Line(lineGeom, lineMat);
    forceLine.computeLineDistances();
    standGroup.add(forceLine);

    standGroup.rotation.y = -Math.PI / 6;
    standGroup.rotation.x = 0.1;

    modalExtraAnimation = (seconds) => {
      // Spinning propeller (representing test throttle sweeps)
      const throttleCycle = 0.5 + 0.5 * Math.sin(seconds * 1.5);
      propGroup.rotation.y += throttleCycle * 0.9;

      // Scale thrust vector line and pulse arrow height to show dynamic force sweeps
      arrow.position.y = 0.6 + throttleCycle * 0.4;
      arrow.scale.setScalar(0.4 + throttleCycle * 0.6);

      const newPoints = [
        new THREE.Vector3(0.3, 0.48, 0),
        new THREE.Vector3(0.3, 0.55 + throttleCycle * 0.4, 0)
      ];
      forceLine.geometry.setFromPoints(newPoints);
      forceLine.computeLineDistances();
    };
  }

  function resize() {
    if (!modalRenderer || !modalCamera || !canvas) return;
    const { width, height } = canvas.getBoundingClientRect();
    modalRenderer.setSize(width, height, false);
    modalCamera.aspect = width / height;
    modalCamera.updateProjectionMatrix();
  }

  function animate(time = 0) {
    if (!modalSceneInstance || !modalRenderer || !modalCamera) return;
    const seconds = time * 0.001;

    const now = performance.now();
    const dt = Math.min((now - lastTime) * 0.001, 0.1);
    lastTime = now;

    if (modalGroup && modalAutoRotate) {
      modalGroup.rotation.y = seconds * 0.1;
    }

    if (modalExtraAnimation) {
      modalExtraAnimation(seconds, dt);
    }

    modalRenderer.render(modalSceneInstance, modalCamera);

    if (!prefersReducedMotion) {
      modalAnimFrameId = requestAnimationFrame(animate);
    }
  }

  resize();
  animate();

  canvas._resizeHandler = resize;
  window.addEventListener("resize", resize);
}

function cleanupModalScene() {
  if (modalInteractionCleanup) {
    modalInteractionCleanup();
    modalInteractionCleanup = null;
  }

  if (modalAnimFrameId) {
    cancelAnimationFrame(modalAnimFrameId);
    modalAnimFrameId = null;
  }

  const canvas = document.querySelector("#modalScene");
  if (canvas && canvas._resizeHandler) {
    window.removeEventListener("resize", canvas._resizeHandler);
    canvas._resizeHandler = null;
  }

  if (modalSceneInstance) {
    modalSceneInstance.traverse((object) => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach((mat) => mat.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
    modalSceneInstance = null;
  }

  if (modalRenderer) {
    modalRenderer.dispose();
    modalRenderer = null;
  }

  modalCamera = null;
  modalGroup = null;
  modalExtraAnimation = null;
  modalAutoRotate = true;
}

function buildPropulsionChart(data) {
  const width = 440;
  const height = 220;
  const pad = { top: 16, right: 18, bottom: 32, left: 42 };
  const plotWidth = width - pad.left - pad.right;
  const plotHeight = height - pad.top - pad.bottom;
  const minThrottle = Math.min(...data.map((point) => point.throttle));
  const maxThrottle = Math.max(...data.map((point) => point.throttle));
  const charts = [
    { key: "thrust", label: "Thrust", unit: "g", min: 0, max: 35, color: "#F4B6C2", ticks: [0, 10, 20, 30] },
    { key: "tau", label: "Time constant", unit: "s", min: 0.25, max: 0.75, color: "#94A3B8", ticks: [0.25, 0.4, 0.55, 0.7] },
  ];

  const pathFor = (chart) =>
    data
      .map((point, index) => {
        const x = pad.left + ((point.throttle - minThrottle) / (maxThrottle - minThrottle)) * plotWidth;
        const y = pad.top + plotHeight - ((point[chart.key] - chart.min) / (chart.max - chart.min)) * plotHeight;
        return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");

  const gridLines = Array.from({ length: 5 }, (_, index) => {
    const y = pad.top + (plotHeight / 4) * index;
    return `<line x1="${pad.left}" y1="${y}" x2="${width - pad.right}" y2="${y}" />`;
  }).join("");

  const verticalLines = Array.from({ length: 7 }, (_, index) => {
    const x = pad.left + (plotWidth / 6) * index;
    return `<line x1="${x}" y1="${pad.top}" x2="${x}" y2="${height - pad.bottom}" />`;
  }).join("");
  const xTicks = [10, 25, 50, 75, 100]
    .map((tick) => {
      const x = pad.left + ((tick - minThrottle) / (maxThrottle - minThrottle)) * plotWidth;
      return `
        <line class="axis-tick" x1="${x}" y1="${height - pad.bottom}" x2="${x}" y2="${height - pad.bottom + 4}" />
        <text x="${x}" y="${height - pad.bottom + 15}" text-anchor="middle">${tick}</text>`;
    })
    .join("");

  return charts
    .map((chart, index) => {
      const yTicks = chart.ticks
        .map((tick) => {
          const y = pad.top + plotHeight - ((tick - chart.min) / (chart.max - chart.min)) * plotHeight;
          const label = Number.isInteger(tick) ? tick : tick.toFixed(2).replace(/0$/, "");
          return `
            <line class="axis-tick" x1="${pad.left - 4}" y1="${y}" x2="${pad.left}" y2="${y}" />
            <text x="${pad.left - 8}" y="${y + 3}" text-anchor="end">${label}</text>`;
        })
        .join("");

      return `
        <div class="propulsion-mini-chart">
          <div class="mini-chart-label"><i style="background:${chart.color}"></i>${chart.label} <span>${chart.unit}</span></div>
          <svg class="propulsion-chart-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${chart.label} throttle sweep chart">
            <g class="chart-grid">${gridLines}${verticalLines}</g>
            <g class="chart-axis">
              <line x1="${pad.left}" y1="${height - pad.bottom}" x2="${width - pad.right}" y2="${height - pad.bottom}" />
              <line x1="${pad.left}" y1="${pad.top}" x2="${pad.left}" y2="${height - pad.bottom}" />
              ${xTicks}
              ${yTicks}
              <text class="axis-title" x="${width / 2}" y="${height - 7}" text-anchor="middle">Throttle command</text>
              <text class="axis-title" x="12" y="${height / 2}" text-anchor="middle" transform="rotate(-90 12 ${height / 2})">${chart.label} (${chart.unit})</text>
            </g>
            <path class="chart-trace trace-${chart.key}" style="--trace-index: ${index}" d="${pathFor(chart)}" />
          </svg>
        </div>`;
    })
    .join("");
}

function openModal(projectId) {
  // Pause all card videos when opening modal
  document.querySelectorAll("video.card-video").forEach((vid) => vid.pause());

  const data = projectData[projectId];
  if (!data) {
    console.warn(`Project data not found for ID: "${projectId}". If you are seeing old project IDs, please perform a hard refresh (Ctrl+F5 or Cmd+Shift+R) to clear your browser's cache.`);
    return;
  }

  // Populate hero label
  document.getElementById("modal-hero-label").textContent = data.label;
  const visualFrame = document.getElementById("modal-visual-frame");
  const flightPanel = document.getElementById("flight-test-panel");
  const propulsionPanel = document.getElementById("propulsion-telemetry-panel");
  const flowchartPanel = document.getElementById("flowchart-panel");
  visualFrame.classList.toggle("timeline-mode", Boolean(data.flightTimeline));
  visualFrame.classList.toggle("propulsion-mode", Boolean(data.propulsionDashboard));
  visualFrame.classList.toggle("flowchart-mode", Boolean(data.flowchart));
  visualFrame.classList.toggle("uav-airframe-mode", projectId === "airframe-opt");
  visualFrame.classList.toggle("fwish-model-mode", projectId === "fwish-gev");
  visualFrame.classList.toggle("wip-rings-mode", projectId === "wing-opt" && !data.flowchart);

  // Populate mission pins
  const pinTop = document.getElementById("modal-pin-top");
  const pinBottom = document.getElementById("modal-pin-bottom");
  if (data.pins && data.pins.top && data.pins.bottom) {
    pinTop.style.display = "";
    pinBottom.style.display = "";
    document.getElementById("modal-pin-top-label").textContent = data.pins.top.label;
    document.getElementById("modal-pin-top-value").textContent = data.pins.top.value;
    document.getElementById("modal-pin-bottom-label").textContent = data.pins.bottom.label;
    document.getElementById("modal-pin-bottom-value").textContent = data.pins.bottom.value;
  } else {
    pinTop.style.display = "none";
    pinBottom.style.display = "none";
  }

  // Populate content
  document.getElementById("modal-title").textContent = data.title;
  document.getElementById("modal-description").textContent = data.description;

  // Populate telemetry strip
  const telemetry = document.getElementById("modal-telemetry");
  telemetry.classList.toggle("single-item", data.telemetry.length === 1);
  telemetry.innerHTML = data.telemetry
    .map(
      (item) =>
        `<div><span>${item.label}</span><strong>${item.value}</strong></div>`
    )
    .join("");

  // Populate media gallery
  const gallery = document.getElementById("modal-media-gallery");
  gallery.classList.toggle("is-scrollable", data.media.length > 4);
  gallery.innerHTML = data.media
    .map((item, index) => {
      if (item.type === "image") {
        return `<div class="modal-media-slot has-media" data-index="${index}"><img src="${item.src}" alt="${item.alt || ""}" loading="lazy"></div>`;
      } else if (item.type === "video") {
        return `<div class="modal-media-slot has-media" data-index="${index}"><video src="${item.src}" preload="metadata"></video></div>`;
      } else if (item.type === "pdf") {
        return `<div class="modal-media-slot has-media pdf-slot" data-index="${index}">
          <div class="pdf-card-preview" aria-hidden="true">
            <div class="pdf-card-topline"></div>
            <div class="pdf-card-logos">
              <span>SIT</span>
              <span>UoG</span>
            </div>
            <h4>${item.label || "LES-Based Investigation Report"}</h4>
            <p>LES-Based Investigation of Unsteady Wake Effects on the Rear Wing in Tandem WIG Configuration</p>
            <span class="pdf-card-author">Carl Louis</span>
          </div>
        </div>`;
      } else if (item.type === "album") {
        const img1 = item.images[0] ? `<img src="${item.images[0].src}" alt="${item.label}" class="album-cover" loading="lazy">` : '';
        const img2 = item.images[1] ? `<img src="${item.images[1].src}" alt="" class="album-sheet sheet-2" aria-hidden="true" loading="lazy">` : '<div class="album-sheet sheet-2"></div>';
        const img3 = item.images[2] ? `<img src="${item.images[2].src}" alt="" class="album-sheet sheet-3" aria-hidden="true" loading="lazy">` : '<div class="album-sheet sheet-3"></div>';
        return `<div class="modal-media-slot has-media album-slot" data-index="${index}">
          <div class="album-stack" aria-hidden="true">
            ${img3}
            ${img2}
            ${img1}
          </div>
          <div class="album-meta">
            <span class="album-badge">ALBUM &bull; ${item.images.length} ENTRIES</span>
            <h4 class="album-title">${item.label}</h4>
          </div>
        </div>`;
      } else {
        return `<div class="modal-media-slot" data-index="${index}"><div class="media-slot-placeholder">${item.label}</div></div>`;
      }
    })
    .join("");

  // Bind click handler to each slot for opening the detailed media lightbox
  gallery.querySelectorAll(".modal-media-slot").forEach((slot) => {
    slot.addEventListener("click", () => {
      const index = parseInt(slot.getAttribute("data-index"), 10);
      openMediaViewer(projectId, index);
    });
  });

  // Populate tags
  const tagsContainer = document.getElementById("modal-tags");
  tagsContainer.innerHTML = data.tags.map((tag) => `<span>${tag}</span>`).join("");

  if (flightPanel) {
    if (data.flightTimeline) {
      flightPanel.setAttribute("aria-hidden", "false");
      flightPanel.innerHTML = `
        <div class="flight-tech-badges">
          ${data.flightTimeline.badges
          .map((badge) => `<div><span>${badge.label}</span><strong>${badge.value}</strong></div>`)
          .join("")}
        </div>
        <ol class="flight-timeline">
          ${data.flightTimeline.steps
          .map(
            (step, index) => `
              <li class="${step.critical ? "is-critical" : ""} ${step.conclusion ? "is-conclusion" : ""}" style="--step-index: ${index}">
                <div class="timeline-node" aria-hidden="true"></div>
                <div class="timeline-step-card">
                  <span class="timeline-status">${step.badge}</span>
                  <h3>${step.title}</h3>
                  <p>${step.description}</p>
                </div>
              </li>`
          )
          .join("")}
        </ol>
      `;
    } else {
      flightPanel.setAttribute("aria-hidden", "true");
      flightPanel.innerHTML = "";
    }
  }

  if (propulsionPanel) {
    if (data.propulsionDashboard) {
      const dashboard = data.propulsionDashboard;
      propulsionPanel.setAttribute("aria-hidden", "false");
      propulsionPanel.innerHTML = `
        <div class="propulsion-metrics">
          ${dashboard.metrics
          .map((metric) => `<div><span>${metric.label}</span><strong>${metric.value}</strong></div>`)
          .join("")}
        </div>
        <section class="propulsion-chart-card">
          <div class="propulsion-chart-header">
            <span>MEASURED SWEEP DATA</span>
          </div>
          ${buildPropulsionChart(dashboard.data)}
          <div class="propulsion-readouts">
            <h3>8520 Coreless DC Motor with 75mm Propeller</h3>
            ${dashboard.readouts
          .map((readout) => `<div><span>${readout.label}</span><strong>${readout.value}</strong></div>`)
          .join("")}
          </div>
        </section>
      `;
    } else {
      propulsionPanel.setAttribute("aria-hidden", "true");
      propulsionPanel.innerHTML = "";
    }
  }

  if (flowchartPanel) {
    if (data.flowchart) {
      flowchartPanel.setAttribute("aria-hidden", "false");
      flowchartPanel.innerHTML = `
        <div class="flowchart-header">
          <span>PROJECT WORKFLOW</span>
          <h3>Genetic Aerodynamic Optimisation</h3>
        </div>
        <div class="flowchart-nodes">
          ${data.flowchart.steps
            .map((step, index) => {
              const isActive = step.active ? "is-active" : "";
              const statusLabel = step.active ? "CURRENT STAGE" : step.status || "UPCOMING";
              return `
                <div class="flowchart-node-card ${isActive}" style="--node-index: ${index}">
                  <div class="node-indicator">
                    <span class="node-dot"></span>
                    ${step.active ? '<span class="node-pulse"></span>' : ""}
                  </div>
                  <div class="node-content">
                    <div class="node-badge-row">
                      <span class="node-status">${statusLabel}</span>
                      ${step.tag ? `<span class="node-tag">${step.tag}</span>` : ""}
                    </div>
                    <h4>${step.title}</h4>
                    <p>${step.description}</p>
                    ${step.subtext ? `<div class="node-subtext">${step.subtext}</div>` : ""}
                  </div>
                </div>
              `;
            })
            .join("")}
        </div>
      `;
    } else {
      flowchartPanel.setAttribute("aria-hidden", "true");
      flowchartPanel.innerHTML = "";
    }
  }

  // Show modal
  document.body.classList.add("modal-open");
  overlay.classList.add("active");

  // Initialize Three.js scene
  initModalScene(projectId);

  // Recalculate sizing after modal transition has completed
  setTimeout(() => {
    const canvas = document.querySelector("#modalScene");
    if (canvas && canvas._resizeHandler) {
      canvas._resizeHandler();
    }
  }, 150);
}

function closeModal() {
  overlay.classList.remove("active");
  document.body.classList.remove("modal-open");
  const visualFrame = document.getElementById("modal-visual-frame");
  if (visualFrame) {
    visualFrame.classList.remove("timeline-mode");
    visualFrame.classList.remove("propulsion-mode");
    visualFrame.classList.remove("uav-airframe-mode");
    visualFrame.classList.remove("fwish-model-mode");
    visualFrame.classList.remove("wip-rings-mode");
    visualFrame.classList.remove("flowchart-mode");
  }
  const flightPanel = document.getElementById("flight-test-panel");
  if (flightPanel) {
    flightPanel.setAttribute("aria-hidden", "true");
    flightPanel.innerHTML = "";
  }
  const propulsionPanel = document.getElementById("propulsion-telemetry-panel");
  if (propulsionPanel) {
    propulsionPanel.setAttribute("aria-hidden", "true");
    propulsionPanel.innerHTML = "";
  }
  const flowchartPanel = document.getElementById("flowchart-panel");
  if (flowchartPanel) {
    flowchartPanel.setAttribute("aria-hidden", "true");
    flowchartPanel.innerHTML = "";
  }
  cleanupModalScene();
}

// Click handlers on project cards
document.querySelectorAll(".project-card[data-project]").forEach((card) => {
  card.addEventListener("click", () => {
    openModal(card.dataset.project);
  });
});

// Video hover play preview with 1-second countdown delay
document.querySelectorAll(".project-card").forEach((card) => {
  const video = card.querySelector("video.card-video");
  if (video) {
    video.muted = true;
    video.loop = true;
    video.load(); // Force immediate preload and first-frame rendering
    let hoverTimeout = null;

    card.addEventListener("mouseenter", () => {
      if (hoverTimeout) clearTimeout(hoverTimeout);
      hoverTimeout = setTimeout(() => {
        video.play().catch((err) => {
          console.warn("Video playback was interrupted or blocked by browser autoplay policy:", err);
        });
      }, 1000);
    });

    card.addEventListener("mouseleave", () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
        hoverTimeout = null;
      }
      video.pause();
      video.currentTime = 0;
    });
  }
});

// Close handlers
closeBtn.addEventListener("click", closeModal);
overlay.addEventListener("click", (e) => {
  if (e.target === overlay) closeModal();
});

/* â”€â”€ Media Lightbox Viewer Functions â”€â”€ */
function openFieldAlbum(categoryId) {
  const category = fieldNoteCategories.find((item) => item.id === categoryId);
  if (!category) return;

  const albumOverlay = document.getElementById("field-album-overlay");
  const title = document.getElementById("field-album-title");
  const kicker = document.getElementById("field-album-kicker");
  const description = document.getElementById("field-album-description");
  const groups = document.getElementById("field-album-groups");
  const items = sortNewestFirst(fieldNotes.filter((item) => item.category === categoryId));
  const albums = new Map();

  items.forEach((item) => {
    if (!albums.has(item.album)) albums.set(item.album, []);
    albums.get(item.album).push(item);
  });

  kicker.textContent = `FIELD NOTES / ${category.label}`;
  title.textContent = category.label;
  description.textContent = "";
  groups.innerHTML = items.length
    ? [...albums.entries()]
      .map(([album, albumItems]) => {
        return `
          <section class="field-album-group">
            <div class="field-album-group-header">
              <div>
                <span>${albumItems.length} ${albumItems.length === 1 ? "ENTRY" : "ENTRIES"}</span>
                <h3>${album}</h3>
              </div>
            </div>
            <div class="field-media-grid">
              ${albumItems.map((item) => `
                <article class="field-media-card" data-field-media-id="${item.id}" tabindex="0" role="button" aria-label="Open ${item.title}">
                  <div class="field-media-thumb">
                    ${mediaElementMarkup(item)}
                    ${item.type === "video" ? '<span class="field-video-badge">VIDEO</span>' : ""}
                  </div>
                  <div class="field-media-copy">
                    <h4>${item.title}</h4>
                  </div>
                </article>`).join("")}
            </div>
          </section>`;
      })
      .join("")
    : `<section class="field-album-empty">${buildRingPlaceholder("AWAITING MEDIA")}<p>Add media to the ${category.label.toLowerCase()} folder and register it in src/data/fieldNotes.js.</p></section>`;

  groups.querySelectorAll(".field-media-card").forEach((card) => {
    const open = () => {
      const selectedItem = items.find((item) => item.id === card.dataset.fieldMediaId);
      if (selectedItem) openRawMediaViewer(selectedItem);
    };
    card.addEventListener("click", open);
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        open();
      }
    });
  });

  document.body.classList.add("modal-open");
  albumOverlay.classList.add("active");
  albumOverlay.setAttribute("aria-hidden", "false");
}

function closeFieldAlbum() {
  const albumOverlay = document.getElementById("field-album-overlay");
  albumOverlay.classList.remove("active");
  albumOverlay.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

const fieldAlbumClose = document.getElementById("field-album-close");
const fieldAlbumOverlay = document.getElementById("field-album-overlay");
fieldAlbumClose?.addEventListener("click", closeFieldAlbum);
fieldAlbumOverlay?.addEventListener("click", (event) => {
  if (event.target === fieldAlbumOverlay) closeFieldAlbum();
});

function openRawMediaViewer(item) {
  mediaViewerItems = [item];
  mediaViewerIndex = 0;
  renderMediaViewerItem(item);
  mediaViewerOverlay.classList.add("raw-active");
}

function openMediaItems(items, index = 0) {
  mediaViewerItems = items;
  mediaViewerIndex = index;
  const item = mediaViewerItems[mediaViewerIndex];
  if (!item) return;

  renderMediaViewerItem(item);
}

function renderMediaViewerItem(item) {
  // Clear previous content
  mediaViewerDisplay.innerHTML = "";
  mediaViewerOverlay.classList.toggle("pdf-active", item.type === "pdf");
  mediaViewerOverlay.classList.toggle("has-sequence", mediaViewerItems.length > 1);
  mediaViewerOverlay.classList.toggle("image-mode", item.type === "image");
  mediaViewerOverlay.classList.toggle("no-sidebar", Boolean(item.noSidebar));

  // Title selection
  let displayTitle = item.alt || item.label || "Asset view";
  mediaViewerTitle.textContent = displayTitle;

  // Description selection
  const displayDesc = item.description || item.alt || item.label || "No dynamic log documentation available.";
  mediaViewerDescription.textContent = displayDesc;

  // Populate Display
  if (item.type === "image") {
    const img = document.createElement("img");
    img.src = item.src;
    img.alt = displayTitle;
    mediaViewerDisplay.appendChild(img);

    const tag = document.createElement("div");
    tag.className = "media-viewer-tag";
    tag.textContent = displayTitle;
    mediaViewerDisplay.appendChild(tag);
  } else if (item.type === "video") {
    const video = document.createElement("video");
    video.src = item.src;
    video.autoplay = false;
    video.loop = true;
    video.controls = true;
    video.muted = true;
    video.setAttribute("playsinline", "true");
    mediaViewerDisplay.appendChild(video);
  } else if (item.type === "pdf") {
    const iframe = document.createElement("iframe");
    iframe.src = `${item.src}#view=FitH&page=1`;
    iframe.title = displayTitle;
    iframe.className = "media-viewer-pdf";
    mediaViewerDisplay.appendChild(iframe);
  } else {
    // Conceptual placeholder presentation
    const placeholder = document.createElement("div");
    placeholder.className = "media-viewer-placeholder";
    placeholder.innerHTML = `
      <div class="placeholder-grid-bg"></div>
      <div class="placeholder-hud-circle"></div>
      <span class="placeholder-label">${item.label || "CONCEPT INTERFACE"}</span>
      <span class="placeholder-sub">CONCEPTUAL SCHEMATIC / ARCHIVE DATA ONLY</span>
    `;
    mediaViewerDisplay.appendChild(placeholder);
  }

  // Add Date metadata overlay on top right of the display
  if (item.date) {
    const metaContainer = document.createElement("div");
    metaContainer.className = "media-viewer-meta";

    const dateEl = document.createElement("span");
    dateEl.className = "media-viewer-meta-date";
    dateEl.textContent = item.date;
    metaContainer.appendChild(dateEl);

    mediaViewerDisplay.appendChild(metaContainer);
  }

  // Activate lightbox overlay
  mediaViewerOverlay.classList.add("active");
  mediaViewerOverlay.setAttribute("aria-hidden", "false");
}

function openMediaViewer(projectId, index) {
  const project = projectData[projectId];
  if (!project) return;
  const item = project.media[index];
  if (item && item.type === "album") {
    openMediaItems(item.images, 0);
  } else {
    openMediaItems(project.media, index);
  }
}

function showAdjacentMedia(direction) {
  if (mediaViewerItems.length <= 1) return;
  mediaViewerIndex = (mediaViewerIndex + direction + mediaViewerItems.length) % mediaViewerItems.length;
  renderMediaViewerItem(mediaViewerItems[mediaViewerIndex]);
}

function closeMediaViewer() {
  const video = mediaViewerDisplay.querySelector("video");
  if (video) {
    video.pause();
  }
  mediaViewerOverlay.classList.remove("active");
  mediaViewerOverlay.classList.remove("pdf-active");
  mediaViewerOverlay.classList.remove("raw-active");
  mediaViewerOverlay.classList.remove("has-sequence");
  mediaViewerOverlay.classList.remove("peeking");
  mediaViewerOverlay.classList.remove("image-mode");
  mediaViewerOverlay.classList.remove("no-sidebar");
  mediaViewerOverlay.setAttribute("aria-hidden", "true");
  mediaViewerDisplay.innerHTML = "";
  mediaViewerItems = [];
  mediaViewerIndex = 0;
}

// Media Viewer Action Listeners
mediaViewerClose.addEventListener("click", closeMediaViewer);
mediaViewerOverlay.addEventListener("click", (e) => {
  if (e.target === mediaViewerOverlay) closeMediaViewer();
});
mediaViewerPrev?.addEventListener("click", (e) => {
  e.stopPropagation();
  showAdjacentMedia(-1);
});
mediaViewerNext?.addEventListener("click", (e) => {
  e.stopPropagation();
  showAdjacentMedia(1);
});

// Mobile touch swipe gestures for lightbox navigation
let touchStartX = 0;
let touchStartY = 0;
mediaViewerOverlay.addEventListener("touchstart", (e) => {
  touchStartX = e.changedTouches[0].screenX;
  touchStartY = e.changedTouches[0].screenY;
}, { passive: true });

mediaViewerOverlay.addEventListener("touchend", (e) => {
  const touchEndX = e.changedTouches[0].screenX;
  const touchEndY = e.changedTouches[0].screenY;

  const diffX = touchEndX - touchStartX;
  const diffY = touchEndY - touchStartY;

  // Verify horizontal gesture and drag threshold
  if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 42) {
    if (diffX < 0) {
      showAdjacentMedia(1); // Swipe left -> Next
    } else {
      showAdjacentMedia(-1); // Swipe right -> Prev
    }
  }
}, { passive: true });

const fieldNotesSection = document.getElementById("field-notes");
let fieldNotesRendered = false;

function renderFieldNotesWhenVisible() {
  if (fieldNotesRendered) return;
  fieldNotesRendered = true;
  renderFieldNotes();
}

if (fieldNotesSection) {
  const fieldNotesObserver = new IntersectionObserver(
    (entries, observer) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        renderFieldNotesWhenVisible();
        observer.disconnect();
      }
    },
    { rootMargin: "180px 0px", threshold: 0.01 }
  );
  fieldNotesObserver.observe(fieldNotesSection);
} else {
  renderFieldNotesWhenVisible();
}

// Escape key listener for both modal and media viewer overlays
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (mediaViewerOverlay.classList.contains("active")) {
      closeMediaViewer();
    } else if (fieldAlbumOverlay?.classList.contains("active")) {
      closeFieldAlbum();
    } else if (overlay.classList.contains("active")) {
      closeModal();
    }
  } else if (mediaViewerOverlay.classList.contains("active") && e.key === "ArrowLeft") {
    showAdjacentMedia(-1);
  } else if (mediaViewerOverlay.classList.contains("active") && e.key === "ArrowRight") {
    showAdjacentMedia(1);
  }
});
