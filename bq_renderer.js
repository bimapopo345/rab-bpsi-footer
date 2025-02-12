const { ipcRenderer } = require("electron");

let selectedAHSId = null;
let selectedAHSData = null;
let editingBQId = null;

// Get user ID from localStorage
const userId = localStorage.getItem("userId");

// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
  loadBQData();
});

// Load BQ Data
async function loadBQData() {
  ipcRenderer.invoke("get-bq-items", { userId }).then((items) => {
    const tbody = document.getElementById("bqTableBody");
    tbody.innerHTML = "";

    items.forEach((item) => {
      const row = createBQRow(item);
      tbody.appendChild(row);
    });
  });
}

// Open AHS Selection Modal
function openAHSModal() {
  const modal = document.getElementById("ahsModal");
  modal.style.display = "block";
  document.body.style.overflow = "hidden"; // Prevent background scrolling

  // Load only AHS items that have pricing data
  ipcRenderer.invoke("get-ahs-with-pricing", { userId }).then((ahsItems) => {
    const ahsList = document.getElementById("ahsList");
    ahsList.innerHTML = "";

    ahsItems.forEach((ahs) => {
      const div = document.createElement("div");
      div.className = "ahs-item";
      div.innerHTML = `
                <strong>${ahs.kode_ahs || "-"}</strong>
                <div>${ahs.ahs}</div>
                <div>Total: Rp ${ahs.total_price.toLocaleString()}</div>
            `;
      div.onclick = () => selectAHS(ahs);
      ahsList.appendChild(div);
    });
  });
}

function closeAHSModal() {
  document.getElementById("ahsModal").style.display = "none";
  document.body.style.overflow = "auto";
}

// Select AHS and Show Shape Modal
function selectAHS(ahs) {
  selectedAHSId = ahs.id;
  selectedAHSData = ahs;
  document.getElementById("ahsModal").style.display = "none";
  document.getElementById("shapeModal").style.display = "block";
  document.getElementById("shapeSelect").value = ""; // Reset shape selection
  hideAllShapeForms();
}

// Show Form Based on Selected Shape
function showShapeForm() {
  hideAllShapeForms();
  const shape = document.getElementById("shapeSelect").value;
  if (shape) {
    document.getElementById(`${shape}Form`).classList.add("active");
  }
}

function hideAllShapeForms() {
  document.querySelectorAll(".shape-form").forEach((form) => {
    form.classList.remove("active");
  });
}

// Calculate Volume Based on Shape
function calculateVolume(prefix = "") {
  const shape = document.getElementById(prefix + "shapeSelect").value;
  let volume = 0;

  switch (shape) {
    case "persegi":
      const sisi = Number(
        document.getElementById(prefix + "sisiPersegi").value
      );
      volume = sisi * sisi;
      break;

    case "persegiPanjang":
      const panjang = Number(
        document.getElementById(prefix + "panjangPersegiPanjang").value
      );
      const lebar = Number(
        document.getElementById(prefix + "lebarPersegiPanjang").value
      );
      volume = panjang * lebar;
      break;

    case "trapesium":
      const a = Number(
        document.getElementById(prefix + "sisiAtasTrapesium").value
      );
      const b = Number(
        document.getElementById(prefix + "sisiBawahTrapesium").value
      );
      const h = Number(
        document.getElementById(prefix + "tinggiTrapesium").value
      );
      volume = ((a + b) * h) / 2;
      break;

    case "lingkaran":
      const r = Number(document.getElementById(prefix + "jariLingkaran").value);
      volume = Math.PI * r * r;
      break;

    case "kubus":
      const sisiKubus = Number(
        document.getElementById(prefix + "sisiKubus").value
      );
      volume = sisiKubus * sisiKubus * sisiKubus;
      break;

    case "balok":
      const p = Number(document.getElementById(prefix + "panjangBalok").value);
      const l = Number(document.getElementById(prefix + "lebarBalok").value);
      const t = Number(document.getElementById(prefix + "tinggiBalok").value);
      volume = p * l * t;
      break;
  }

  return volume;
}

// Calculate and Save BQ Item
function calculateAndSave() {
  if (!selectedAHSId || !selectedAHSData) {
    alert("Silakan pilih AHS terlebih dahulu");
    return;
  }

  const shape = document.getElementById("shapeSelect").value;
  if (!shape) {
    alert("Silakan pilih bentuk terlebih dahulu");
    return;
  }

  const volume = calculateVolume();
  if (!volume) {
    alert("Silakan isi dimensi dengan benar");
    return;
  }

  // Get dimensions as JSON string
  const dimensions = getDimensions();

  // Calculate total price
  const totalPrice = volume * selectedAHSData.total_price;

  // Save to database
  const bqItem = {
    userId,
    ahsId: selectedAHSId,
    shape,
    dimensions: JSON.stringify(dimensions),
    volume,
    totalPrice,
  };

  ipcRenderer.invoke("save-bq-item", bqItem).then(() => {
    closeShapeModal();
    loadBQData(); // Refresh the table
  });
}

// Get Dimensions Based on Shape
function getDimensions(prefix = "") {
  const shape = document.getElementById(prefix + "shapeSelect").value;
  switch (shape) {
    case "persegi":
      return {
        sisi: document.getElementById(prefix + "sisiPersegi").value,
      };

    case "persegiPanjang":
      return {
        panjang: document.getElementById(prefix + "panjangPersegiPanjang")
          .value,
        lebar: document.getElementById(prefix + "lebarPersegiPanjang").value,
      };

    case "trapesium":
      return {
        sisiAtas: document.getElementById(prefix + "sisiAtasTrapesium").value,
        sisiBawah: document.getElementById(prefix + "sisiBawahTrapesium").value,
        tinggi: document.getElementById(prefix + "tinggiTrapesium").value,
      };

    case "lingkaran":
      return {
        jariJari: document.getElementById(prefix + "jariLingkaran").value,
      };

    case "kubus":
      return {
        sisi: document.getElementById(prefix + "sisiKubus").value,
      };

    case "balok":
      return {
        panjang: document.getElementById(prefix + "panjangBalok").value,
        lebar: document.getElementById(prefix + "lebarBalok").value,
        tinggi: document.getElementById(prefix + "tinggiBalok").value,
      };
  }
}

// Create BQ Table Row
function createBQRow(item) {
  const row = document.createElement("tr");
  row.innerHTML = `
        <td>${item.kode_ahs || "-"}</td>
        <td>${item.ahs}</td>
        <td>${formatShapeName(item.shape)}</td>
        <td>${item.volume.toFixed(2)} m<sup>2</sup></td>
        <td>Rp ${item.total_price.toLocaleString()}</td>
        <td>
            <div class="action-buttons">
                <button class="btn btn-warning btn-small" onclick="openEditModal(${
                  item.id
                }, ${JSON.stringify(item).replace(/"/g, "&quot;")})">
                    Edit
                </button>
                <button class="btn btn-danger btn-small" onclick="deleteBQItem(${
                  item.id
                })">
                    Hapus
                </button>
            </div>
        </td>
    `;
  return row;
}

// Format Shape Name
function formatShapeName(shape) {
  const shapeNames = {
    persegi: "Persegi",
    persegiPanjang: "Persegi Panjang",
    trapesium: "Trapesium",
    lingkaran: "Lingkaran",
    kubus: "Kubus",
    balok: "Balok",
  };
  return shapeNames[shape] || shape;
}

// Edit Functions
function openEditModal(id, item) {
  editingBQId = id;
  const modal = document.getElementById("editModal");
  const dimensionsData = JSON.parse(item.dimensions);

  // Set shape
  document.getElementById("editShapeSelect").value = item.shape;
  showEditShapeForm();

  // Set values based on shape
  switch (item.shape) {
    case "persegi":
      document.getElementById("editSisiPersegi").value = dimensionsData.sisi;
      break;
    case "persegiPanjang":
      document.getElementById("editPanjangPersegiPanjang").value =
        dimensionsData.panjang;
      document.getElementById("editLebarPersegiPanjang").value =
        dimensionsData.lebar;
      break;
    // Add other cases for different shapes
  }

  modal.style.display = "block";
  document.body.style.overflow = "hidden";
}

function showEditShapeForm() {
  const shape = document.getElementById("editShapeSelect").value;
  document.querySelectorAll("#editShapeForms .shape-form").forEach((form) => {
    form.classList.remove("active");
  });

  if (shape) {
    const formId = `edit${shape}Form`;
    document.getElementById(formId).classList.add("active");
  }
}

function updateBQItem() {
  const volume = calculateVolume("edit");
  if (!volume) {
    alert("Silakan isi dimensi dengan benar");
    return;
  }

  const dimensions = getDimensions("edit");
  const shape = document.getElementById("editShapeSelect").value;

  const updatedItem = {
    id: editingBQId,
    shape,
    dimensions: JSON.stringify(dimensions),
    volume,
  };

  ipcRenderer.invoke("update-bq-item", updatedItem).then(() => {
    closeEditModal();
    loadBQData();
  });
}

// Close Functions
function closeShapeModal() {
  document.getElementById("shapeModal").style.display = "none";
  document.getElementById("shapeSelect").value = "";
  document.body.style.overflow = "auto";
  hideAllShapeForms();
  selectedAHSId = null;
  selectedAHSData = null;
}

function closeEditModal() {
  document.getElementById("editModal").style.display = "none";
  document.body.style.overflow = "auto";
  editingBQId = null;
}

// Delete BQ Item
function deleteBQItem(id) {
  if (confirm("Yakin ingin menghapus item ini?")) {
    ipcRenderer.invoke("delete-bq-item", { id }).then(() => {
      loadBQData();
    });
  }
}
