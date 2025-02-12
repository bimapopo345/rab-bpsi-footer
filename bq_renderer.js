const { ipcRenderer } = require("electron");

let selectedAHSId = null;
let selectedAHSData = null;

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

  // Load only AHS items that have pricing data
  ipcRenderer.invoke("get-ahs-with-pricing", { userId }).then((ahsItems) => {
    const ahsList = document.getElementById("ahsList");
    ahsList.innerHTML = "";

    ahsItems.forEach((ahs) => {
      const div = document.createElement("div");
      div.className = "ahs-item";
      div.innerHTML = `
                <strong>${ahs.kode_ahs}</strong>
                <div>${ahs.ahs}</div>
                <div>Total: Rp ${ahs.total_price.toLocaleString()}</div>
            `;
      div.onclick = () => selectAHS(ahs);
      ahsList.appendChild(div);
    });
  });
}

// Select AHS and Show Shape Modal
function selectAHS(ahs) {
  selectedAHSId = ahs.id;
  selectedAHSData = ahs;
  document.getElementById("ahsModal").style.display = "none";
  document.getElementById("shapeModal").style.display = "block";
}

// Show Form Based on Selected Shape
function showShapeForm() {
  const shape = document.getElementById("shapeSelect").value;
  document.querySelectorAll(".shape-form").forEach((form) => {
    form.classList.remove("active");
  });

  if (shape) {
    document.getElementById(`${shape}Form`).classList.add("active");
  }
}

// Calculate Volume Based on Shape
function calculateVolume() {
  const shape = document.getElementById("shapeSelect").value;
  let volume = 0;

  switch (shape) {
    case "persegi":
      const sisi = Number(document.getElementById("sisiPersegi").value);
      volume = sisi * sisi;
      break;

    case "persegiPanjang":
      const panjang = Number(
        document.getElementById("panjangPersegiPanjang").value
      );
      const lebar = Number(
        document.getElementById("lebarPersegiPanjang").value
      );
      volume = panjang * lebar;
      break;

    case "trapesium":
      const a = Number(document.getElementById("sisiAtasTrapesium").value);
      const b = Number(document.getElementById("sisiBawahTrapesium").value);
      const h = Number(document.getElementById("tinggiTrapesium").value);
      volume = ((a + b) * h) / 2;
      break;

    case "lingkaran":
      const r = Number(document.getElementById("jariLingkaran").value);
      volume = Math.PI * r * r;
      break;

    case "kubus":
      const sisiKubus = Number(document.getElementById("sisiKubus").value);
      volume = sisiKubus * sisiKubus * sisiKubus;
      break;

    case "balok":
      const p = Number(document.getElementById("panjangBalok").value);
      const l = Number(document.getElementById("lebarBalok").value);
      const t = Number(document.getElementById("tinggiBalok").value);
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
  const dimensions = getDimensions(shape);

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
function getDimensions(shape) {
  switch (shape) {
    case "persegi":
      return {
        sisi: document.getElementById("sisiPersegi").value,
      };

    case "persegiPanjang":
      return {
        panjang: document.getElementById("panjangPersegiPanjang").value,
        lebar: document.getElementById("lebarPersegiPanjang").value,
      };

    case "trapesium":
      return {
        sisiAtas: document.getElementById("sisiAtasTrapesium").value,
        sisiBawah: document.getElementById("sisiBawahTrapesium").value,
        tinggi: document.getElementById("tinggiTrapesium").value,
      };

    case "lingkaran":
      return {
        jariJari: document.getElementById("jariLingkaran").value,
      };

    case "kubus":
      return {
        sisi: document.getElementById("sisiKubus").value,
      };

    case "balok":
      return {
        panjang: document.getElementById("panjangBalok").value,
        lebar: document.getElementById("lebarBalok").value,
        tinggi: document.getElementById("tinggiBalok").value,
      };
  }
}

// Create BQ Table Row
function createBQRow(item) {
  const row = document.createElement("tr");
  row.innerHTML = `
        <td>${item.kode_ahs}</td>
        <td>${item.ahs}</td>
        <td>${item.shape}</td>
        <td>${item.volume.toFixed(2)}</td>
        <td>Rp ${item.total_price.toLocaleString()}</td>
        <td>
            <button class="btn btn-danger" onclick="deleteBQItem(${
              item.id
            })">Hapus</button>
        </td>
    `;
  return row;
}

// Close Shape Modal
function closeShapeModal() {
  document.getElementById("shapeModal").style.display = "none";
  document.getElementById("shapeSelect").value = "";
  document.querySelectorAll(".shape-form").forEach((form) => {
    form.classList.remove("active");
  });
  selectedAHSId = null;
  selectedAHSData = null;
}

// Delete BQ Item
function deleteBQItem(id) {
  if (confirm("Yakin ingin menghapus item ini?")) {
    ipcRenderer.invoke("delete-bq-item", { id }).then(() => {
      loadBQData();
    });
  }
}
