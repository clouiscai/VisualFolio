// Page-build entrance: each section assembles from its real elements, the way someone
// works in a design tool. Panels get dragged out, media gets resized into place, text
// gets typed, and buttons and tags get dropped in. Nothing is faked: every step acts on
// the live DOM. Skipped entirely under reduced motion. The `cursors` here are unseen
// workers: they are never drawn, but their travel paces and paths each element.

const STAGGER = 60;
const MARQUEE_MS = 190;
const RESIZE_MS = 230;
const TYPE_WPM = 180;
// A long paragraph at 180wpm would take ~10s, so any one run of text speeds up to fit this.
const MAX_TYPE_MS = 2000;

const MEDIA = ".portrait-button, .project-media, .note-media";
const CONTROL = ".status-pill, .button, .domain-tags li, .roll-toggle, .footer-links a";

const STYLE = `
  #swarm-canvas { position: fixed; inset: 0; z-index: 55; width: 100%; height: 100%; pointer-events: none; }
  ::highlight(swarm-untyped) { color: transparent; text-shadow: none; }
  .swarm-target { opacity: 0 !important; translate: none !important; transition: none !important; }
  .swarm-shell {
    opacity: 1 !important; translate: none !important;
    transition: background-color 140ms ease, box-shadow 140ms ease !important;
  }
  .swarm-bare { background: transparent !important; box-shadow: none !important; }
  .swarm-bare .fact { border-color: transparent !important; }
  .swarm-bare .building-list li::before, .swarm-bare .section-index::after { opacity: 0; }
  .swarm-hidden { opacity: 0 !important; }
  .swarm-held { opacity: 1 !important; transition: none !important; }`;


const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const random = (a, b) => a + Math.random() * (b - a);

// When each character lands, in ms: uneven keystrokes at TYPE_WPM (5 chars to a word),
// a beat between words and after punctuation. Whitespace the page collapses costs nothing.
function typingSchedule(text) {
  const base = 60000 / (TYPE_WPM * 5);
  let at = 0;
  const times = [...text].map((char, i) => {
    const prev = text[i - 1] || "";
    if (/\s/.test(char) && /\s/.test(prev)) return at;
    let gap = base * random(0.6, 1.4);
    if (/\s/.test(prev)) gap *= 1.3;
    if (/[.,:;|]/.test(prev)) gap *= 1.8;
    at += gap;
    return at;
  });
  const fit = Math.min(1, MAX_TYPE_MS / at);
  return times.map((time) => time * fit);
}

// Screen box of one character, walking back over collapsed whitespace.
function charBox(node, index, min) {
  const range = document.createRange();
  for (let i = index; i >= min; i--) {
    range.setStart(node, i);
    range.setEnd(node, i + 1);
    const rects = range.getClientRects();
    if (rects.length && rects[rects.length - 1].width > 0) return rects[rects.length - 1];
  }
  return null;
}

export function initSwarmRebuild() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    console.info("[swarm] Skipped: this device asks for reduced motion.");
    return;
  }

  const style = document.createElement("style");
  style.textContent = STYLE;
  document.head.append(style);

  const canvas = document.createElement("canvas");
  canvas.id = "swarm-canvas";
  canvas.setAttribute("aria-hidden", "true");
  document.body.append(canvas);
  const ctx = canvas.getContext("2d");

  const lowPower = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 760;
  const maxCursors = lowPower ? 30 : 64;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  // Text stays in the DOM untouched; a highlight paints the untyped part transparent.
  const canType = "highlights" in CSS && typeof Highlight === "function";
  const untyped = canType ? new Highlight() : null;
  if (canType) CSS.highlights.set("swarm-untyped", untyped);

  let blocks = [];
  let cursors = [];
  let frame = 0;
  let lastTime = 0;
  let roundRobin = 0;
  let generation = 0;

  function resize() {
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
  }
  resize();

  function spawnCursor(state, block) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // Mostly in from the right, where the Earth sits; the rest from any edge.
    const edge = Math.random() < 0.5 ? 1 : Math.floor(Math.random() * 4);
    const x = edge === 0 ? -30 : edge === 1 ? vw + 30 : random(0, vw);
    const y = edge === 2 ? -30 : edge === 3 ? vh + 30 : random(0, vh);
    const pace = clamp(vw / 1440, 0.6, 1.2);
    cursors.push({
      x,
      y,
      vx: 0,
      vy: 0,
      state,
      block,
      job: null,
      t: 0,
      idleFor: 0,
      wanderAt: 0,
      wx: x,
      wy: y,
      sel: null,
      caret: null,
      speed: random(2400, 3400) * pace,
      agility: random(14, 20),
      wobble: random(40, 120),
      wobbleRate: random(3, 7),
      seed: Math.random() * 6.28,
    });
  }

  function steer(c, tx, ty, dt, now, speed = c.speed) {
    const dx = tx - c.x;
    const dy = ty - c.y;
    const dist = Math.hypot(dx, dy) || 1;
    const want = Math.max(220, speed * Math.min(1, dist / 120));
    // Sideways wobble fades out on arrival, so paths weave without missing the target.
    const wob = Math.sin(now * 0.001 * c.wobbleRate + c.seed) * c.wobble * Math.min(1, dist / 200);
    const gx = (dx / dist) * want - (dy / dist) * wob;
    const gy = (dy / dist) * want + (dx / dist) * wob;
    const k = Math.min(1, dt * c.agility);
    c.vx += (gx - c.vx) * k;
    c.vy += (gy - c.vy) * k;
    c.x += c.vx * dt;
    c.y += c.vy * dt;
    return dist;
  }

  function takeJob() {
    const open = blocks.filter((b) => b.ready && b.jobs.length);
    if (!open.length) return null;
    const block = open[roundRobin++ % open.length];
    block.active++;
    return block.jobs.shift();
  }

  function restoreJob(job) {
    if (job.type === "text") {
      if (canType) untyped.delete(job.range);
      else job.node.parentElement.classList.remove("swarm-hidden");
      return;
    }
    job.el.classList.remove("swarm-hidden", "swarm-held");
    job.el.style.transform = "";
    job.el.style.transformOrigin = "";
    job.el.style.position = "";
    job.el.style.zIndex = "";
  }

  function finishJob(c) {
    restoreJob(c.job);
    c.job.block.active--;
    c.job = null;
    c.sel = null;
    c.caret = null;
    c.state = "idle";
  }

  function startJob(c, job) {
    c.job = job;
    c.idleFor = 0;
    if (job.type === "text") {
      c.state = "toText";
    } else if (job.type === "resize") {
      c.state = "toResize";
    } else {
      // Pick the element up a short drag away from where it belongs.
      const rect = job.el.getBoundingClientRect();
      const angle = Math.random() * Math.PI * 2;
      const reach = random(70, 170);
      job.cx = rect.left + rect.width / 2;
      job.cy = rect.top + rect.height / 2 + window.scrollY;
      c.sx = job.cx + Math.cos(angle) * reach;
      c.sy = job.cy - window.scrollY + Math.sin(angle) * reach;
      c.state = "toDrop";
    }
  }

  function updateCursor(c, dt, now) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    switch (c.state) {
      case "toMarquee": {
        const b = c.block;
        if (steer(c, b.left, b.top - window.scrollY, dt, now) < 14) {
          c.state = "marquee";
          b.marqueeAt = now;
        }
        break;
      }
      case "marquee": {
        const b = c.block;
        const p = Math.min(1, (now - b.marqueeAt) / MARQUEE_MS);
        b.marquee = easeInOut(p);
        c.x = b.left + b.w * b.marquee;
        c.y = b.top - window.scrollY + b.h * b.marquee;
        if (p >= 1) {
          b.ready = true;
          b.readyAt = now;
          b.el.classList.remove("swarm-bare");
          c.state = "idle";
        }
        break;
      }
      case "idle": {
        const job = takeJob();
        if (job) {
          startJob(c, job);
          break;
        }
        // Mill around only while work is still waiting; once everything is claimed the
        // spare cursors clear off, leaving just the ones still typing.
        const focus = blocks.find((b) => !b.ready || b.jobs.length);
        if (focus) {
          c.idleFor = 0;
          if (now > c.wanderAt) {
            c.wanderAt = now + random(160, 380);
            c.wx = focus.left + random(-50, focus.w + 50);
            c.wy = focus.top - window.scrollY + random(-50, focus.h + 50);
          }
          steer(c, c.wx, c.wy, dt, now, c.speed * 0.5);
        } else {
          c.idleFor += dt;
          steer(c, c.x + c.vx * 0.1, c.y + c.vy * 0.1, dt, now, 200);
          if (c.idleFor > 0.06 + (c.seed / 6.28) * 0.18) {
            // Leave by the nearest edge so the finished page is clear.
            const exits = [
              [-40, c.y, c.x],
              [vw + 40, c.y, vw - c.x],
              [c.x, -40, c.y],
              [c.x, vh + 40, vh - c.y],
            ].sort((a, b) => a[2] - b[2]);
            c.wx = exits[0][0];
            c.wy = exits[0][1];
            c.state = "leave";
          }
        }
        break;
      }
      case "toText": {
        const { job } = c;
        const box = charBox(job.node, job.start, job.start);
        if (!box) {
          finishJob(c);
          break;
        }
        if (steer(c, box.left, box.bottom, dt, now) < 18) {
          c.state = "typing";
          c.t = 0;
          c.shown = 0;
          if (!canType) job.node.parentElement.classList.remove("swarm-hidden");
        }
        break;
      }
      case "typing": {
        const { job } = c;
        c.t += dt * 1000;
        while (c.shown < job.len && job.times[c.shown] <= c.t) c.shown++;
        const { shown } = c;
        if (canType) job.range.setStart(job.node, job.start + shown);
        const box = charBox(job.node, Math.max(job.start, job.start + shown - 1), job.start);
        if (box) {
          const x = shown ? box.right : box.left;
          c.caret = { x, y: box.top, h: box.height };
          const follow = Math.min(1, dt * 45);
          c.x += (x + 1 - c.x) * follow;
          c.y += (box.bottom - 2 - c.y) * follow;
        }
        if (shown >= job.len) finishJob(c);
        break;
      }
      case "toResize": {
        const { job } = c;
        const rect = job.el.getBoundingClientRect();
        if (steer(c, rect.left, rect.top, dt, now) < 16) {
          job.w = rect.width;
          job.h = rect.height;
          job.el.style.transformOrigin = "0 0";
          job.el.style.transform = "scale(0.08)";
          job.el.classList.remove("swarm-hidden");
          job.el.classList.add("swarm-held");
          c.t = 0;
          c.state = "resizing";
        }
        break;
      }
      case "resizing": {
        const { job } = c;
        c.t += dt * 1000;
        const p = Math.min(1, c.t / RESIZE_MS);
        const scale = 0.08 + 0.92 * easeOut(p);
        job.el.style.transform = `scale(${scale})`;
        // The transform origin is the top-left corner, so this rect's corner stays put.
        const rect = job.el.getBoundingClientRect();
        c.x = rect.left + job.w * scale;
        c.y = rect.top + job.h * scale;
        c.sel = { x: rect.left, y: rect.top, w: job.w * scale, h: job.h * scale };
        if (p >= 1) finishJob(c);
        break;
      }
      case "toDrop":
        if (steer(c, c.sx, c.sy, dt, now) < 18) {
          const { job } = c;
          job.el.classList.remove("swarm-hidden");
          job.el.classList.add("swarm-held");
          if (getComputedStyle(job.el).position === "static") job.el.style.position = "relative";
          job.el.style.zIndex = "45";
          c.state = "dragging";
        }
        break;
      case "dragging": {
        const { job } = c;
        const cy = job.cy - window.scrollY;
        const dist = steer(c, job.cx, cy, dt, now, c.speed * 0.45);
        const dx = c.x - job.cx;
        const dy = c.y - cy;
        job.el.style.transform = `translate(${dx}px, ${dy}px) scale(1.04)`;
        if (dist < 8) {
          // A tiny settle as it lands in the layout.
          job.el.animate([{ transform: "scale(1.05)" }, { transform: "none" }], { duration: 120, easing: "ease-out" });
          finishJob(c);
        }
        break;
      }
      case "leave":
        steer(c, c.wx, c.wy, dt, now);
        if (c.x < -30 || c.x > vw + 30 || c.y < -30 || c.y > vh + 30) c.gone = true;
        break;
    }
  }

  function endBlock(block) {
    block.done = true;
    block.allJobs.forEach(restoreJob);
    block.el.classList.remove("swarm-shell", "swarm-bare", "swarm-hidden");
  }

  function drawSelection(x, y, w, h, alpha = 1, handles = true) {
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = "#f4b6c2";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w, h);
    if (handles) {
      ctx.fillStyle = "#f9fafb";
      for (const [hx, hy] of [[0, 0], [w, 0], [0, h], [w, h]]) {
        ctx.fillRect(x + hx - 2.5, y + hy - 2.5, 5, 5);
        ctx.strokeRect(x + hx - 2.5, y + hy - 2.5, 5, 5);
      }
    }
    ctx.globalAlpha = 1;
  }

  function draw(now) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    for (const block of blocks) {
      if (!block.marqueeAt) continue;
      const age = block.readyAt ? (now - block.readyAt) / 220 : 0;
      if (age < 1) drawSelection(block.left, block.top - window.scrollY, block.w * block.marquee, block.h * block.marquee, 1 - age);
    }

    for (const c of cursors) {
      if (c.sel) drawSelection(c.sel.x, c.sel.y, c.sel.w, c.sel.h);
      if (c.caret) {
        ctx.fillStyle = "#f8cad4";
        ctx.fillRect(c.caret.x, c.caret.y, 1.5, c.caret.h);
      }
    }
  }

  function tick(now) {
    const dt = Math.min(0.05, (now - (lastTime || now)) / 1000);
    lastTime = now;
    cursors.forEach((c) => updateCursor(c, dt, now));
    cursors = cursors.filter((c) => !c.gone);
    for (const block of blocks) {
      if (block.ready && !block.jobs.length && !block.active) endBlock(block);
    }
    blocks = blocks.filter((block) => !block.done);
    draw(now);

    if (blocks.length || cursors.length) {
      frame = requestAnimationFrame(tick);
    } else {
      frame = 0;
      lastTime = 0;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  // Splits a block into the real things to build: media, controls and runs of text.
  function atomize(block) {
    const jobs = [];
    const walk = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent;
        const trimmed = text.trim();
        if (!trimmed) return;
        jobs.push({
          type: "text",
          block,
          node,
          start: text.indexOf(trimmed),
          len: trimmed.length,
          times: typingSchedule(trimmed),
        });
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      if (node.matches(".visually-hidden, svg, script, style")) return;
      if (getComputedStyle(node).display === "none") return;
      if (node.matches(MEDIA)) {
        jobs.push({ type: "resize", block, el: node });
        return;
      }
      if (node.matches(".photo-roll")) {
        const bounds = node.getBoundingClientRect();
        node.querySelectorAll(".roll-frame").forEach((frameEl) => {
          const rect = frameEl.getBoundingClientRect();
          if (rect.right > bounds.left && rect.left < bounds.right) jobs.push({ type: "resize", block, el: frameEl });
        });
        return;
      }
      if (node.matches(CONTROL)) {
        jobs.push({ type: "drop", block, el: node });
        return;
      }
      node.childNodes.forEach(walk);
    };
    walk(block.el);
    // Big pictures land first, then text and controls fill in around them.
    return jobs.sort((a, b) => (b.type === "resize") - (a.type === "resize"));
  }

  function launch(el) {
    const cs = getComputedStyle(el);
    const isControl = el.matches(CONTROL);
    const hasSurface = !isControl && (cs.backgroundColor !== "rgba(0, 0, 0, 0)" || cs.boxShadow !== "none");
    const rect = el.getBoundingClientRect();

    const block = {
      el,
      left: rect.left,
      top: rect.top + window.scrollY,
      w: rect.width,
      h: rect.height,
      jobs: [],
      allJobs: [],
      active: 0,
      marquee: 0,
      marqueeAt: 0,
      readyAt: 0,
      ready: !hasSurface,
      done: false,
    };

    el.classList.remove("swarm-target");
    el.classList.add("in-view", "swarm-shell", "swarm-bare");
    block.jobs = atomize(block);
    block.allJobs = [...block.jobs];
    block.jobs.forEach((job) => {
      if (job.type !== "text") {
        job.el.classList.add("swarm-hidden");
      } else if (canType) {
        job.range = document.createRange();
        job.range.setStart(job.node, job.start);
        job.range.setEnd(job.node, job.start + job.len);
        untyped.add(job.range);
      } else {
        job.node.parentElement.classList.add("swarm-hidden");
      }
    });
    blocks.push(block);

    // One cursor per unclaimed element across the page. Panel cursors move on to an
    // element afterwards, and departing cursors get called back before any new ones spawn.
    if (hasSurface) spawnCursor("toMarquee", block);
    const free = (c) => c.state === "idle" || c.state === "toMarquee" || c.state === "marquee";
    let needed = blocks.reduce((sum, b) => sum + b.jobs.length, 0) - cursors.filter(free).length;
    for (const c of cursors) {
      if (needed <= 0) break;
      if (c.state === "leave") {
        c.state = "idle";
        needed--;
      }
    }
    for (let i = 0; i < needed && cursors.length < maxCursors; i++) spawnCursor("idle", null);

    if (!frame) frame = requestAnimationFrame(tick);
  }

  function launchBatch(elements) {
    const startedIn = generation;
    elements.forEach((el, index) => {
      setTimeout(() => {
        if (startedIn === generation && el.classList.contains("swarm-target")) launch(el);
      }, index * STAGGER);
    });
  }

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).map((entry) => entry.target);
      if (!visible.length) return;
      visible.forEach((el) => observer.unobserve(el));
      launchBatch(visible);
    },
    { threshold: 0.12 }
  );

  function arm(el) {
    el.classList.add("swarm-target");
    observer.observe(el);
  }

  function clearSwarm() {
    generation++;
    blocks.forEach(endBlock);
    blocks = [];
    cursors = [];
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  document.querySelectorAll(".reveal").forEach(arm);

  // Field Notes cards are rendered lazily, after this runs.
  const notes = document.getElementById("field-notes-grid");
  if (notes) {
    new MutationObserver(() => notes.querySelectorAll(".reveal:not(.swarm-target)").forEach(arm)).observe(notes, { childList: true });
  }

  // Positions go stale on resize, so finish the build instantly instead.
  window.addEventListener("resize", () => {
    clearSwarm();
    resize();
  });

  // The logo doubles as the replay control: back to the top, rebuilt from nothing.
  document.querySelector(".brand")?.addEventListener("click", (event) => {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: "instant" });
    clearSwarm();
    document.querySelectorAll(".reveal").forEach(arm);
  });
}
