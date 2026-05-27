import * as THREE from "three";
import { GLTFLoader } from "https://unpkg.com/three@0.165.0/examples/jsm/loaders/GLTFLoader.js";

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

function initPhotoRoll() {
  const roll = document.querySelector(".photo-roll");
  const track = document.querySelector(".roll-track");
  if (!roll || !track) return;

  let isDragging = false;
  let startX = 0;
  let currentOffset = 0;
  let startOffset = 0;

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
  }

  function handleMove(e) {
    if (!isDragging) return;

    if (e.cancelable) {
      e.preventDefault();
    }

    const clientX = e.type.startsWith("touch") ? e.touches[0].clientX : e.clientX;
    const deltaX = clientX - startX;

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
    label: "GEV FLIGHT",
    type: "GEV-01 / Aerodynamics",
    title: "FWISH Ground-Effect Craft",
    description:
      "A personal wing-in-ground-effect (WIG) craft research and prototyping platform designed to exploit aerodynamic lift enhancements when operating close to flat boundaries. The project involves CFD simulation of high-pressure ground cushioning, aerodynamic wing-profile design, and construction of scaled prototypes to evaluate pitch stability, height-sensing control loops, and thrust line optimizations.",
    pins: {
      top: { label: "GROUND HEIGHT", value: "h < 0.25c" },
      bottom: { label: "LIFT INCREASE", value: "+38% WIG" },
    },
    telemetry: [
      { label: "ANALYSIS", value: "CFD / Fluent" },
      { label: "MODEL", value: "6-DOF Simulink" },
      { label: "CRUISE SPEED", value: "45 knots (est)" },
      { label: "STATUS", value: "PROTOTYPING" },
    ],
    media: [
      {
        type: "image",
        src: "./assets/about/FWISH_sim_wallshearstress.png",
        alt: "CFD Wall Shear Stress Contour",
        description: "ANSYS CFD simulation plotting wall shear stress distribution across the fuselage and lifting surfaces of the FWISH ground-effect craft, identifying boundary layer separation points."
      },
      {
        type: "image",
        src: "./assets/about/FWISH_Simulink.jpg",
        alt: "Simulink Flight Dynamics Control Loop",
        description: "Simulink system model incorporating 6-degrees-of-freedom aerodynamics and equations of motion to simulate and refine ground-effect altitude control and pitch damping."
      },
      {
        type: "image",
        src: "./assets/about/FWISH_V0_display_build.jpg",
        alt: "Prototype Structural Assembly",
        description: "The physical construction and structural assembly phase of the FWISH V0 display model, checking alignment of structural spars and control surface hinge lines."
      },
      {
        type: "placeholder",
        label: "Radio Test Flight Video",
        description: "Telemetry logs and video recording from the initial radio-controlled scaled prototype flight test."
      }
    ],
    tags: ["CFD", "Aerodynamics", "Simulink", "WIG Craft", "Dynamics"],
  },
  "wing-opt": {
    label: "AERO OPT",
    type: "OPT-01 / Computational Design",
    title: "Wing Optimisation with Evolutionary Model",
    description:
      "A numerical design engine that employs genetic algorithms and evolutionary strategies to optimize 3D wing profiles for maximum lift-to-drag ratio. The pipeline integrates a panel method aerodynamic solver, parameterizes airfoil thickness and camber distributions, and runs iterative generation loops with selection, crossover, and mutation operators to converge on optimal wing shapes across specific Mach and Reynolds regimes.",
    pins: {
      top: { label: "GENERATIONS", value: "1,500 runs" },
      bottom: { label: "DRAG REDUCTION", value: "-14.2% L/D" },
    },
    telemetry: [
      { label: "OPTIMIZER", value: "Genetic Algorithm" },
      { label: "SOLVER", value: "XFOIL / Panel Method" },
      { label: "POPULATION", value: "200 per gen" },
      { label: "STATUS", value: "COMPLETE" },
    ],
    media: [
      {
        type: "placeholder",
        label: "Fitness Evolution",
        description: "Graph tracking the convergence of the genetic algorithm fitness function over 1,500 design optimization runs."
      },
      {
        type: "placeholder",
        label: "Optimized Foil Profile",
        description: "The resulting optimized 2D airfoil geometry showing coordinate outputs designed for maximum lift-to-drag ratio performance."
      },
      {
        type: "placeholder",
        label: "Pressure Coefficient",
        description: "Pressure coefficient distribution (Cp) along the upper and lower surfaces of the optimized airfoil layout."
      },
      {
        type: "placeholder",
        label: "Aerodynamic Convergence",
        description: "Iterative aerodynamic solver simulation screen showing lift and drag coefficient convergence rates."
      }
    ],
    tags: ["MATLAB", "Evolutionary Models", "Aerodynamics", "Optimization"],
  },
  "airframe-opt": {
    label: "STRUCTURE",
    type: "STR-01 / Composite Airframe",
    title: "Lightweight Structural Optimised UAV Airframe",
    description:
      "Redesigned a UAV airframe using structural optimisation workflows in ANSYS to reduce mass while maintaining stiffness under operational loading conditions. The project combined FEA-driven design iteration, and prototype manufacturing validation.",
    telemetry: [
      { label: "KEY RESULT", value: "20% Mass Reduction" },
    ],
    media: [
      {
        type: "video",
        src: "./assets/projects/lightweight-uav-airframe-structural-optimisation/structural-optimisation.mp4",
        alt: "Topology Structural Optimisation",
        description: "ANSYS structural optimization simulation showing the iterative material removal to optimize the topology of the chassis center body according to active thrust load stress."
      },
      {
        type: "image",
        src: "./assets/projects/lightweight-uav-airframe-structural-optimisation/stress_sim.jpg",
        alt: "FEA Stress Validation",
        description: "Finite element analysis (FEA) using ANSYS to validate the post-processed topology-optimized model, confirming that stress levels remain within safety constraints while reducing the center body mass by ~50%."
      },
      {
        type: "image",
        src: "./assets/projects/lightweight-uav-airframe-structural-optimisation/parts.jpg",
        alt: "Optimized Carbon Fiber Arm Plate",
        description: "Quadcopter components demonstrating the organic topology design applied to the arms. The arm length was increased by 2.5 cm from the baseline model, giving an organic shape while retaining high structural strength."
      },
      {
        type: "video",
        src: "./assets/projects/lightweight-uav-airframe-structural-optimisation/thrust-loading-test.mp4",
        alt: "Dynamic Thrust Loading Test",
        description: "Dynamic structural test verifying the integrity of the carbon-fiber frame under active propulsion and thrust load forces."
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

let modalSceneInstance = null;
let modalCamera = null;
let modalRenderer = null;
let modalAnimFrameId = null;
let modalGroup = null;
let modalExtraAnimation = null;
let modalAutoRotate = true;
let modalInteractionCleanup = null;

function initModalScene(projectId) {
  cleanupModalScene();

  if (projectData[projectId]?.flightTimeline || projectData[projectId]?.propulsionDashboard) return;

  const canvas = document.querySelector("#modalScene");
  if (!canvas) return;

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

  if (projectId === "drone-scratch") {
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

  } else if (projectId === "fwish-gev") {
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

  } else if (projectId === "wing-opt") {
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

  } else if (projectId === "airframe-opt") {
    modalAutoRotate = false;
    const frameGroup = new THREE.Group();
    frameGroup.position.set(0, -0.05, 0);
    group.add(frameGroup);

    const loader = new GLTFLoader();
    const pinkModelMaterial = new THREE.MeshStandardMaterial({
      color: rose,
      metalness: 0.42,
      roughness: 0.36,
      emissive: new THREE.Color("#35131e"),
      emissiveIntensity: 0.22,
    });

    loader.load(
      "./assets/projects/lightweight-uav-airframe-structural-optimisation/diy-drone-airframe-v2.glb",
      (gltf) => {
        const model = gltf.scene;
        model.traverse((object) => {
          if (object.isMesh) {
            object.material = pinkModelMaterial;
            object.castShadow = true;
            object.receiveShadow = true;
          }
        });

        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        model.position.sub(center);
        const maxDimension = Math.max(size.x, size.y, size.z) || 1;
        model.scale.setScalar(2.35 / maxDimension);
        frameGroup.add(model);
      },
      undefined,
      (error) => console.warn("Unable to load airframe GLB model:", error)
    );
    const q0 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, Math.PI, 'ZXY'));
    frameGroup.quaternion.copy(q0);
    camera.position.set(0, 0.15, 6.875);

    let isDragging = false;
    let previousX = 0;
    let previousY = 0;
    const minZoom = 5.5 / 2;
    const maxZoom = 5.5 / 0.7;

    const qTarget = q0.clone();

    const snapTo45 = (angle) => {
      const step = Math.PI / 4; // 45 degrees in radians
      return Math.round(angle / step) * step;
    };

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

      // Dragging vertically rotates around the screen X axis (Pitch in screen frame)
      // Dragging horizontally rotates around the screen Y axis (Yaw in screen frame)
      const deltaPitch = deltaY * 0.008;
      const deltaYaw = deltaX * 0.008;

      // Create an incremental rotation quaternion for the screen axes (YXZ order)
      const qDiff = new THREE.Quaternion().setFromEuler(new THREE.Euler(deltaPitch, deltaYaw, 0, 'YXZ'));
      
      // Apply the rotation relative to the screen (premultiply)
      frameGroup.quaternion.premultiply(qDiff);
      
      // Track target quaternion to match free drag
      qTarget.copy(frameGroup.quaternion);
    };

    const stopDragging = (event) => {
      if (isDragging) {
        isDragging = false;
        
        // Decompose the current orientation relative to the default orientation q0
        const q0Inv = q0.clone().invert();
        const qRel = q0Inv.clone().multiply(frameGroup.quaternion);
        const eulerRel = new THREE.Euler().setFromQuaternion(qRel, 'ZXY');
        
        // Snap relative Euler angles to 45 degree steps (Pitch is X, Yaw is Y, Roll is Z)
        const snappedPitch = snapTo45(eulerRel.x);
        const snappedYaw = snapTo45(eulerRel.y);
        const snappedRoll = snapTo45(eulerRel.z);
        
        // Rebuild target orientation (Pitch is X, Yaw is Y, Roll is Z)
        const targetEuler = new THREE.Euler(snappedPitch, snappedYaw, snappedRoll, 'ZXY');
        const qTargetRel = new THREE.Quaternion().setFromEuler(targetEuler);
        qTarget.copy(q0.clone().multiply(qTargetRel));
        
        if (event?.pointerId !== undefined) canvas.releasePointerCapture?.(event.pointerId);
      }
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

    const pinTop = document.getElementById("modal-pin-top");
    if (pinTop) pinTop.style.display = "";

    modalExtraAnimation = (seconds) => {
      if (!isDragging) {
        // Smoothly interpolate towards locked 45 degree multiples on release via slerp
        frameGroup.quaternion.slerp(qTarget, 0.12);
      }

      // Calculate relative orientation in the model's reference frame
      const q0Inv = q0.clone().invert();
      const qRel = q0Inv.clone().multiply(frameGroup.quaternion);
      const eulerRel = new THREE.Euler().setFromQuaternion(qRel, 'ZXY');

      const toDegrees = (rad) => {
        let deg = Math.round((rad * 180) / Math.PI) % 360;
        if (deg < -180) deg += 360;
        if (deg > 180) deg -= 360;
        return deg;
      };

      const pitchVal = toDegrees(eulerRel.x);
      const rollVal = toDegrees(eulerRel.z);
      const yawVal = toDegrees(eulerRel.y);

      if (pinTop) {
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

    if (modalGroup && modalAutoRotate) {
      modalGroup.rotation.y = seconds * 0.1;
    }

    if (modalExtraAnimation) {
      modalExtraAnimation(seconds);
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
  visualFrame.classList.toggle("timeline-mode", Boolean(data.flightTimeline));
  visualFrame.classList.toggle("propulsion-mode", Boolean(data.propulsionDashboard));
  visualFrame.classList.toggle("uav-airframe-mode", projectId === "airframe-opt");

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
  gallery.innerHTML = data.media
    .map((item, index) => {
      if (item.type === "image") {
        return `<div class="modal-media-slot has-media" data-index="${index}"><img src="${item.src}" alt="${item.alt || ""}" loading="lazy"></div>`;
      } else if (item.type === "video") {
        return `<div class="modal-media-slot has-media" data-index="${index}"><video src="${item.src}" preload="metadata"></video></div>`;
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
function openMediaViewer(projectId, index) {
  const project = projectData[projectId];
  if (!project) return;
  const item = project.media[index];
  if (!item) return;

  // Clear previous content
  mediaViewerDisplay.innerHTML = "";

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
  } else if (item.type === "video") {
    const video = document.createElement("video");
    video.src = item.src;
    video.autoplay = true;
    video.loop = true;
    video.controls = true;
    video.muted = true;
    video.setAttribute("playsinline", "true");
    mediaViewerDisplay.appendChild(video);
    video.play().catch((err) => {
      console.warn("Autoplay was prevented by browser security policy.", err);
    });
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

  // Activate lightbox overlay
  mediaViewerOverlay.classList.add("active");
  mediaViewerOverlay.setAttribute("aria-hidden", "false");
}

function closeMediaViewer() {
  const video = mediaViewerDisplay.querySelector("video");
  if (video) {
    video.pause();
  }
  mediaViewerOverlay.classList.remove("active");
  mediaViewerOverlay.setAttribute("aria-hidden", "true");
  mediaViewerDisplay.innerHTML = "";
}

// Media Viewer Action Listeners
mediaViewerClose.addEventListener("click", closeMediaViewer);
mediaViewerOverlay.addEventListener("click", (e) => {
  if (e.target === mediaViewerOverlay) closeMediaViewer();
});

// Escape key listener for both modal and media viewer overlays
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (mediaViewerOverlay.classList.contains("active")) {
      closeMediaViewer();
    } else if (overlay.classList.contains("active")) {
      closeModal();
    }
  }
});
