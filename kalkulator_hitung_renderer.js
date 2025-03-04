// Fungsi helper untuk mendapatkan nilai input
function getInputValue(id) {
  const value = document.getElementById(id).value;
  return value ? parseFloat(value) : 0;
}

// Fungsi helper untuk menampilkan hasil
function showResult(id, label, value) {
  document.getElementById(id).innerText = `${label} = ${value.toFixed(2)}`;
}

// Fungsi untuk menggambar bentuk
function drawShape(canvas, type) {
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#1a4f7c";
  ctx.lineWidth = 2;
  ctx.fillStyle = "#f5f5f5";

  switch (type) {
    case "trapesium":
      ctx.beginPath();
      ctx.moveTo(40, 100);
      ctx.lineTo(160, 100);
      ctx.lineTo(140, 50);
      ctx.lineTo(60, 50);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;

    case "persegi":
      ctx.strokeRect(50, 50, 100, 100);
      ctx.fillRect(50, 50, 100, 100);
      break;

    case "kerucut":
      ctx.beginPath();
      ctx.moveTo(100, 30);
      ctx.lineTo(150, 120);
      ctx.lineTo(50, 120);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(100, 120, 50, 15, 0, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      break;

    case "lingkaran":
      ctx.beginPath();
      ctx.arc(100, 75, 50, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      break;

    case "persegiruang":
      ctx.beginPath();
      ctx.moveTo(50, 50);
      ctx.lineTo(150, 50);
      ctx.lineTo(150, 100);
      ctx.lineTo(50, 100);
      ctx.closePath();
      ctx.moveTo(70, 70);
      ctx.lineTo(170, 70);
      ctx.lineTo(170, 120);
      ctx.lineTo(150, 100);
      ctx.moveTo(150, 50);
      ctx.lineTo(170, 70);
      ctx.fill();
      ctx.stroke();
      break;

    case "tabung":
      ctx.beginPath();
      ctx.ellipse(100, 40, 40, 15, 0, 0, 2 * Math.PI);
      ctx.moveTo(60, 40);
      ctx.lineTo(60, 110);
      ctx.moveTo(140, 40);
      ctx.lineTo(140, 110);
      ctx.ellipse(100, 110, 40, 15, 0, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      break;

    case "prisma":
      ctx.beginPath();
      ctx.moveTo(50, 100);
      ctx.lineTo(100, 50);
      ctx.lineTo(150, 100);
      ctx.closePath();
      ctx.moveTo(70, 120);
      ctx.lineTo(120, 70);
      ctx.lineTo(170, 120);
      ctx.lineTo(50, 100);
      ctx.lineTo(70, 120);
      ctx.moveTo(100, 50);
      ctx.lineTo(120, 70);
      ctx.moveTo(150, 100);
      ctx.lineTo(170, 120);
      ctx.fill();
      ctx.stroke();
      break;

    case "piramid":
      ctx.beginPath();
      ctx.moveTo(100, 30);
      ctx.lineTo(150, 120);
      ctx.lineTo(50, 120);
      ctx.closePath();
      ctx.moveTo(100, 30);
      ctx.lineTo(100, 120);
      ctx.fill();
      ctx.stroke();
      break;

    case "segitiga":
      ctx.beginPath();
      ctx.moveTo(50, 120);
      ctx.lineTo(150, 120);
      ctx.lineTo(50, 50);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
  }
}

// Fungsi inisialisasi untuk menggambar semua bentuk
function initializeShapes() {
  const shapes = [
    "trapesium",
    "persegi",
    "kerucut",
    "lingkaran",
    "persegiruang",
    "tabung",
    "prisma",
    "piramid",
    "segitiga",
  ];
  shapes.forEach((shape) => {
    const canvas = document.querySelector(`#${shape}-canvas`);
    if (canvas) drawShape(canvas, shape);
  });
}

// Fungsi untuk menghitung
function hitungTrapesium() {
  const a = getInputValue("trap-a");
  const b = getInputValue("trap-b");
  const h = getInputValue("trap-h");
  const luas = ((a + b) * h) / 2;
  showResult("trap-result", "Luas", luas);
}

function hitungPersegi() {
  const s = getInputValue("square-s");
  const luas = s * s;
  showResult("square-result", "Luas", luas);
}

function hitungKerucut() {
  const r = getInputValue("cone-r");
  const h = getInputValue("cone-h");
  const volume = (1 / 3) * Math.PI * r * r * h;
  showResult("cone-result", "Volume", volume);
}

function hitungLingkaran() {
  const r = getInputValue("circle-r");
  const luas = Math.PI * r * r;
  showResult("circle-result", "Luas", luas);
}

function hitungPersegiRuang() {
  const p = getInputValue("cube-p");
  const l = getInputValue("cube-l");
  const t = getInputValue("cube-t");
  const volume = p * l * t;
  showResult("cube-result", "Volume", volume);
}

function hitungTabung() {
  const r = getInputValue("cylinder-r");
  const h = getInputValue("cylinder-h");
  const volume = Math.PI * r * r * h;
  showResult("cylinder-result", "Volume", volume);
}

function hitungPrisma() {
  const a = getInputValue("prism-a");
  const ta = getInputValue("prism-ta");
  const t = getInputValue("prism-t");
  const luasAlas = (a * ta) / 2;
  const volume = luasAlas * t;
  showResult("prism-result", "Volume", volume);
}

function hitungPiramid() {
  const s = getInputValue("pyramid-s");
  const h = getInputValue("pyramid-h");
  const volume = (s * s * h) / 3;
  showResult("pyramid-result", "Volume", volume);
}

function hitungSegitiga() {
  const a = getInputValue("triangle-a");
  const t = getInputValue("triangle-t");
  const luas = (a * t) / 2;
  showResult("triangle-result", "Luas", luas);
}

// Initialize shapes when page loads
document.addEventListener("DOMContentLoaded", initializeShapes);
