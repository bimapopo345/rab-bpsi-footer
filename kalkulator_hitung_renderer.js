// Fungsi untuk menggambar trapesium
function drawTrapesium(canvas) {
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);

  ctx.strokeStyle = "#1a4f7c";
  ctx.fillStyle = "#f5f5f5";
  ctx.lineWidth = 2;

  const centerX = width / 2;
  const centerY = height / 2;
  const topWidth = 80;
  const bottomWidth = 120;
  const h = 80;

  ctx.beginPath();
  ctx.moveTo(centerX - topWidth / 2, centerY - h / 2);
  ctx.lineTo(centerX + topWidth / 2, centerY - h / 2);
  ctx.lineTo(centerX + bottomWidth / 2, centerY + h / 2);
  ctx.lineTo(centerX - bottomWidth / 2, centerY + h / 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

// Fungsi untuk menggambar persegi
function drawPersegi(canvas) {
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);

  ctx.strokeStyle = "#1a4f7c";
  ctx.fillStyle = "#f5f5f5";
  ctx.lineWidth = 2;

  const size = 100;
  const x = (width - size) / 2;
  const y = (height - size) / 2;

  ctx.beginPath();
  ctx.rect(x, y, size, size);
  ctx.fill();
  ctx.stroke();
}

// Fungsi untuk menggambar kerucut
function drawKerucut(canvas) {
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);

  ctx.strokeStyle = "#1a4f7c";
  ctx.fillStyle = "#f5f5f5";
  ctx.lineWidth = 2;

  const centerX = width / 2;
  const bottomY = height * 0.7;
  const radius = 50;
  const coneHeight = 100;

  // Gambar alas elips
  ctx.beginPath();
  ctx.ellipse(centerX, bottomY, radius, radius / 3, 0, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();

  // Gambar sisi kerucut
  ctx.beginPath();
  ctx.moveTo(centerX - radius, bottomY);
  ctx.lineTo(centerX, bottomY - coneHeight);
  ctx.lineTo(centerX + radius, bottomY);
  ctx.stroke();
}

// Fungsi untuk menggambar lingkaran
function drawLingkaran(canvas) {
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);

  ctx.strokeStyle = "#1a4f7c";
  ctx.fillStyle = "#f5f5f5";
  ctx.lineWidth = 2;

  const centerX = width / 2;
  const centerY = height / 2;
  const radius = 60;

  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();
}

// Fungsi untuk menggambar persegi ruang
function drawPersegiRuang(canvas) {
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);

  ctx.strokeStyle = "#1a4f7c";
  ctx.fillStyle = "#f5f5f5";
  ctx.lineWidth = 2;

  const centerX = width / 2;
  const centerY = height / 2;
  const size = 80;
  const depth = 40;

  // Gambar sisi depan
  ctx.beginPath();
  ctx.rect(centerX - size / 2, centerY - size / 2, size, size);
  ctx.fill();
  ctx.stroke();

  // Gambar garis kedalaman
  ctx.beginPath();
  ctx.moveTo(centerX - size / 2, centerY - size / 2);
  ctx.lineTo(centerX - size / 2 + depth, centerY - size / 2 - depth / 2);
  ctx.moveTo(centerX + size / 2, centerY - size / 2);
  ctx.lineTo(centerX + size / 2 + depth, centerY - size / 2 - depth / 2);
  ctx.moveTo(centerX + size / 2, centerY + size / 2);
  ctx.lineTo(centerX + size / 2 + depth, centerY + size / 2 - depth / 2);
  ctx.stroke();

  // Gambar sisi atas
  ctx.beginPath();
  ctx.moveTo(centerX - size / 2 + depth, centerY - size / 2 - depth / 2);
  ctx.lineTo(centerX + size / 2 + depth, centerY - size / 2 - depth / 2);
  ctx.lineTo(centerX + size / 2, centerY - size / 2);
  ctx.stroke();
}

// Fungsi untuk menggambar tabung
function drawTabung(canvas) {
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);

  ctx.strokeStyle = "#1a4f7c";
  ctx.fillStyle = "#f5f5f5";
  ctx.lineWidth = 2;

  const centerX = width / 2;
  const centerY = height / 2;
  const radiusX = 40;
  const radiusY = 15;
  const h = 80;

  // Gambar selimut
  ctx.beginPath();
  ctx.moveTo(centerX - radiusX, centerY - h / 2);
  ctx.lineTo(centerX - radiusX, centerY + h / 2);
  ctx.moveTo(centerX + radiusX, centerY - h / 2);
  ctx.lineTo(centerX + radiusX, centerY + h / 2);
  ctx.stroke();

  // Gambar alas dan tutup
  ctx.beginPath();
  ctx.ellipse(centerX, centerY + h / 2, radiusX, radiusY, 0, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(centerX, centerY - h / 2, radiusX, radiusY, 0, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();
}

// Fungsi untuk menggambar prisma
function drawPrisma(canvas) {
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);

  ctx.strokeStyle = "#1a4f7c";
  ctx.fillStyle = "#f5f5f5";
  ctx.lineWidth = 2;

  const centerX = width / 2;
  const centerY = height / 2;
  const baseWidth = 80;
  const baseHeight = 60;
  const depth = 40;

  // Gambar segitiga depan
  ctx.beginPath();
  ctx.moveTo(centerX - baseWidth / 2, centerY + baseHeight / 2);
  ctx.lineTo(centerX + baseWidth / 2, centerY + baseHeight / 2);
  ctx.lineTo(centerX, centerY - baseHeight / 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Gambar garis kedalaman
  ctx.beginPath();
  ctx.moveTo(centerX - baseWidth / 2, centerY + baseHeight / 2);
  ctx.lineTo(
    centerX - baseWidth / 2 + depth,
    centerY + baseHeight / 2 - depth / 2
  );
  ctx.moveTo(centerX + baseWidth / 2, centerY + baseHeight / 2);
  ctx.lineTo(
    centerX + baseWidth / 2 + depth,
    centerY + baseHeight / 2 - depth / 2
  );
  ctx.moveTo(centerX, centerY - baseHeight / 2);
  ctx.lineTo(centerX + depth, centerY - baseHeight / 2 - depth / 2);
  ctx.stroke();
}

// Fungsi untuk menggambar piramid
function drawPiramid(canvas) {
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);

  ctx.strokeStyle = "#1a4f7c";
  ctx.fillStyle = "#f5f5f5";
  ctx.lineWidth = 2;

  const centerX = width / 2;
  const centerY = height * 0.6;
  const baseSize = 80;
  const pyramidHeight = 100;

  // Gambar alas
  ctx.beginPath();
  ctx.rect(centerX - baseSize / 2, centerY - baseSize / 2, baseSize, baseSize);
  ctx.fill();
  ctx.stroke();

  // Gambar garis ke puncak
  ctx.beginPath();
  ctx.moveTo(centerX - baseSize / 2, centerY - baseSize / 2);
  ctx.lineTo(centerX, centerY - pyramidHeight);
  ctx.moveTo(centerX + baseSize / 2, centerY - baseSize / 2);
  ctx.lineTo(centerX, centerY - pyramidHeight);
  ctx.moveTo(centerX - baseSize / 2, centerY + baseSize / 2);
  ctx.lineTo(centerX, centerY - pyramidHeight);
  ctx.moveTo(centerX + baseSize / 2, centerY + baseSize / 2);
  ctx.lineTo(centerX, centerY - pyramidHeight);
  ctx.stroke();
}

// Fungsi untuk menggambar segitiga
function drawSegitiga(canvas) {
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);

  ctx.strokeStyle = "#1a4f7c";
  ctx.fillStyle = "#f5f5f5";
  ctx.lineWidth = 2;

  const centerX = width / 2 - 30;
  const centerY = height / 2 + 30;
  const baseWidth = 100;
  const triangleHeight = 80;

  // Gambar segitiga
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.lineTo(centerX + baseWidth, centerY);
  ctx.lineTo(centerX, centerY - triangleHeight);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Gambar tanda siku-siku
  ctx.beginPath();
  ctx.moveTo(centerX + 15, centerY);
  ctx.lineTo(centerX + 15, centerY - 15);
  ctx.lineTo(centerX, centerY - 15);
  ctx.stroke();
}

// Fungsi-fungsi perhitungan
function hitungTrapesium() {
  const a = parseFloat(document.getElementById("trap-a").value) || 0;
  const b = parseFloat(document.getElementById("trap-b").value) || 0;
  const h = parseFloat(document.getElementById("trap-h").value) || 0;
  const luas = ((a + b) * h) / 2;
  document.getElementById("trap-result").innerHTML = `Luas = ${luas.toFixed(
    2
  )}`;
}

function hitungPersegi() {
  const s = parseFloat(document.getElementById("square-s").value) || 0;
  const luas = s * s;
  document.getElementById("square-result").innerHTML = `Luas = ${luas.toFixed(
    2
  )}`;
}

function hitungKerucut() {
  const r = parseFloat(document.getElementById("cone-r").value) || 0;
  const h = parseFloat(document.getElementById("cone-h").value) || 0;
  const volume = (1 / 3) * Math.PI * r * r * h;
  document.getElementById("cone-result").innerHTML = `Volume = ${volume.toFixed(
    2
  )}`;
}

function hitungLingkaran() {
  const r = parseFloat(document.getElementById("circle-r").value) || 0;
  const luas = Math.PI * r * r;
  document.getElementById("circle-result").innerHTML = `Luas = ${luas.toFixed(
    2
  )}`;
}

function hitungPersegiRuang() {
  const p = parseFloat(document.getElementById("cube-p").value) || 0;
  const l = parseFloat(document.getElementById("cube-l").value) || 0;
  const t = parseFloat(document.getElementById("cube-t").value) || 0;
  const volume = p * l * t;
  document.getElementById("cube-result").innerHTML = `Volume = ${volume.toFixed(
    2
  )}`;
}

function hitungTabung() {
  const r = parseFloat(document.getElementById("cylinder-r").value) || 0;
  const h = parseFloat(document.getElementById("cylinder-h").value) || 0;
  const volume = Math.PI * r * r * h;
  document.getElementById(
    "cylinder-result"
  ).innerHTML = `Volume = ${volume.toFixed(2)}`;
}

function hitungPrisma() {
  const a = parseFloat(document.getElementById("prism-a").value) || 0;
  const ta = parseFloat(document.getElementById("prism-ta").value) || 0;
  const t = parseFloat(document.getElementById("prism-t").value) || 0;
  const volume = (1 / 2) * a * ta * t;
  document.getElementById(
    "prism-result"
  ).innerHTML = `Volume = ${volume.toFixed(2)}`;
}

function hitungPiramid() {
  const s = parseFloat(document.getElementById("pyramid-s").value) || 0;
  const h = parseFloat(document.getElementById("pyramid-h").value) || 0;
  const volume = (1 / 3) * s * s * h;
  document.getElementById(
    "pyramid-result"
  ).innerHTML = `Volume = ${volume.toFixed(2)}`;
}

function hitungSegitiga() {
  const a = parseFloat(document.getElementById("triangle-a").value) || 0;
  const t = parseFloat(document.getElementById("triangle-t").value) || 0;
  const luas = (a * t) / 2;
  document.getElementById("triangle-result").innerHTML = `Luas = ${luas.toFixed(
    2
  )}`;
}

// Menggambar semua bentuk saat halaman dimuat
window.addEventListener("load", () => {
  const canvases = {
    "trapesium-canvas": drawTrapesium,
    "persegi-canvas": drawPersegi,
    "kerucut-canvas": drawKerucut,
    "lingkaran-canvas": drawLingkaran,
    "persegiruang-canvas": drawPersegiRuang,
    "tabung-canvas": drawTabung,
    "prisma-canvas": drawPrisma,
    "piramid-canvas": drawPiramid,
    "segitiga-canvas": drawSegitiga,
  };

  for (const [id, drawFunc] of Object.entries(canvases)) {
    const canvas = document.getElementById(id);
    if (canvas) {
      drawFunc(canvas);
    }
  }
});
