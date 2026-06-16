const canvas = document.getElementById("decisionCanvas");
const ctx = canvas.getContext("2d");
const nodes = [];
let width = 0;
let height = 0;
let pointer = { x: 0, y: 0, active: false };

function resize() {
  const ratio = window.devicePixelRatio || 1;
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(height * ratio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  seedNodes();
}

function seedNodes() {
  nodes.length = 0;
  const count = Math.max(18, Math.floor(width / 64));
  for (let index = 0; index < count; index += 1) {
    nodes.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      size: 3 + Math.random() * 6,
      hue: Math.random() > 0.72 ? "red" : Math.random() > 0.42 ? "amber" : "teal"
    });
  }
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#fbfaf6");
  gradient.addColorStop(0.5, "#f3efe5");
  gradient.addColorStop(1, "#e9f4f1");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.globalAlpha = 0.16;
  ctx.strokeStyle = "#0f766e";
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 72) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + width * 0.18, height);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function colorFor(node) {
  if (node.hue === "red") return "#b42318";
  if (node.hue === "amber") return "#b45309";
  return "#0f766e";
}

function animate() {
  drawBackground();

  nodes.forEach((node) => {
    if (pointer.active) {
      const dx = pointer.x - node.x;
      const dy = pointer.y - node.y;
      const distance = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
      if (distance < 220) {
        node.vx -= (dx / distance) * 0.008;
        node.vy -= (dy / distance) * 0.008;
      }
    }

    node.x += node.vx;
    node.y += node.vy;
    node.vx *= 0.995;
    node.vy *= 0.995;

    if (node.x < -20) node.x = width + 20;
    if (node.x > width + 20) node.x = -20;
    if (node.y < -20) node.y = height + 20;
    if (node.y > height + 20) node.y = -20;
  });

  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const a = nodes[i];
      const b = nodes[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < 170) {
        ctx.globalAlpha = (170 - distance) / 520;
        ctx.strokeStyle = "#17201d";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }

  ctx.globalAlpha = 1;
  nodes.forEach((node) => {
    ctx.fillStyle = colorFor(node);
    ctx.beginPath();
    ctx.roundRect(node.x - node.size * 2.8, node.y - node.size, node.size * 5.6, node.size * 2, 6);
    ctx.fill();
  });

  requestAnimationFrame(animate);
}

window.addEventListener("resize", resize);
window.addEventListener("pointermove", (event) => {
  pointer = { x: event.clientX, y: event.clientY, active: true };
});
window.addEventListener("pointerleave", () => {
  pointer.active = false;
});

resize();
animate();
