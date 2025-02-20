const { ipcRenderer } = require("electron");

let selectedAHSId = null;
let selectedAHSData = null;
let editingItemId = null;

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
  setTimeout(() => {
    modal.classList.add("active");
  }, 10);

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

// Note: closeAHSModal function moved to inline script in bq.html

// Select AHS and Show Volume Modal
function selectAHS(ahs) {
  selectedAHSId = ahs.id;
  selectedAHSData = ahs;
  closeAHSModal();

  const volumeModal = document.getElementById("volumeModal");
  volumeModal.style.display = "block";
  setTimeout(() => {
    volumeModal.classList.add("active");
  }, 10);

  // Reset form
  document.getElementById("volumeInput").value = "";
  document.getElementById("satuanSelect").value = "m3";
  document.getElementById("manualSatuanGroup").style.display = "none";
  document.getElementById("manualSatuan").value = "";
}

function closeVolumeModal() {
  const modal = document.getElementById("volumeModal");
  modal.classList.remove("active");
  setTimeout(() => {
    modal.style.display = "none";
    selectedAHSId = null;
    selectedAHSData = null;
  }, 300);
}

// Handle satuan select change
function handleSatuanChange() {
  const satuanSelect = document.getElementById("satuanSelect");
  const manualSatuanGroup = document.getElementById("manualSatuanGroup");

  if (satuanSelect.value === "manual") {
    manualSatuanGroup.style.display = "block";
  } else {
    manualSatuanGroup.style.display = "none";
  }
}

// Handle edit satuan select change
function handleEditSatuanChange() {
  const editSatuanSelect = document.getElementById("editSatuanSelect");
  const editManualSatuanGroup = document.getElementById(
    "editManualSatuanGroup"
  );

  if (editSatuanSelect.value === "manual") {
    editManualSatuanGroup.style.display = "block";
  } else {
    editManualSatuanGroup.style.display = "none";
  }
}

// Save Volume and Satuan
function saveVolumeAndSatuan() {
  if (!selectedAHSId || !selectedAHSData) {
    alert("Silakan pilih AHS terlebih dahulu");
    return;
  }

  const volume = parseFloat(document.getElementById("volumeInput").value);
  if (!volume || isNaN(volume) || volume <= 0) {
    alert("Volume harus berupa angka lebih dari 0");
    return;
  }

  const satuanSelect = document.getElementById("satuanSelect");
  let satuan = satuanSelect.value;
  if (satuan === "manual") {
    satuan = document.getElementById("manualSatuan").value.trim();
    if (!satuan) {
      alert("Silakan masukkan satuan manual");
      return;
    }
  }

  // Convert and validate total_price from the selected AHS data
  const ahsPrice = parseFloat(selectedAHSData.total_price);
  if (isNaN(ahsPrice) || ahsPrice <= 0) {
    alert("AHS terpilih tidak memiliki data harga yang valid");
    return;
  }

  // Calculate total price with rounding to 2 decimal places
  const totalPrice = parseFloat((volume * ahsPrice).toFixed(2));

  // Save to database
  const bqItem = {
    userId,
    ahsId: selectedAHSId,
    volume,
    satuan,
    total_price: totalPrice,
  };

  ipcRenderer.invoke("save-bq-item", bqItem).then(() => {
    closeVolumeModal();
    loadBQData();
  });
}

// Create BQ Table Row
function createBQRow(item) {
  const row = document.createElement("tr");
  row.innerHTML = `
    <td>${item.kode_ahs || "-"}</td>
    <td>${item.ahs}</td>
    <td>${item.volume.toFixed(2)}</td>
    <td>${item.satuan || "m³"}</td>
    <td>Rp ${item.total_price ? item.total_price.toLocaleString() : "-"}</td>
    <td>
      <div class="action-buttons"></div>
    </td>
  `;

  const actionDiv = row.querySelector(".action-buttons");

  const btnEdit = document.createElement("button");
  btnEdit.className = "btn btn-primary btn-small";
  btnEdit.textContent = "Edit";
  btnEdit.addEventListener("click", () => {
    editBQItem(item);
  });
  actionDiv.appendChild(btnEdit);

  const btnDelete = document.createElement("button");
  btnDelete.className = "btn btn-danger btn-small";
  btnDelete.textContent = "Hapus";
  btnDelete.addEventListener("click", () => {
    deleteBQItem(item.id);
  });
  actionDiv.appendChild(btnDelete);

  return row;
}

// Edit Functions
function editBQItem(item) {
  editingItemId = item.id;

  // Populate edit form
  document.getElementById("editVolume").value = item.volume;

  const editSatuanSelect = document.getElementById("editSatuanSelect");
  const editManualSatuan = document.getElementById("editManualSatuan");
  const editManualSatuanGroup = document.getElementById(
    "editManualSatuanGroup"
  );

  // Set satuan
  if (["m", "m2", "m3"].includes(item.satuan)) {
    editSatuanSelect.value = item.satuan;
    editManualSatuanGroup.style.display = "none";
  } else {
    editSatuanSelect.value = "manual";
    editManualSatuan.value = item.satuan;
    editManualSatuanGroup.style.display = "block";
  }

  // Show modal
  const editModal = document.getElementById("editModal");
  editModal.style.display = "block";
  setTimeout(() => {
    editModal.classList.add("active");
  }, 10);
}

function closeEditModal() {
  const modal = document.getElementById("editModal");
  modal.classList.remove("active");
  setTimeout(() => {
    modal.style.display = "none";
    editingItemId = null;
  }, 300);
}

// Save Edited Data
function saveEditedData() {
  const volume = parseFloat(document.getElementById("editVolume").value);
  if (!volume || isNaN(volume) || volume <= 0) {
    alert("Volume harus berupa angka lebih dari 0");
    return;
  }

  const satuanSelect = document.getElementById("editSatuanSelect");
  let satuan = satuanSelect.value;
  if (satuan === "manual") {
    satuan = document.getElementById("editManualSatuan").value.trim();
    if (!satuan) {
      alert("Silakan masukkan satuan manual");
      return;
    }
  }

  // Prepare update object
  const updatedData = {
    id: editingItemId,
    volume,
    satuan,
  };

  ipcRenderer
    .invoke("update-bq-item", updatedData)
    .then(() => {
      closeEditModal();
      loadBQData();
    })
    .catch((err) => {
      console.error("Error updating BQ item:", err);
      alert("Gagal menyimpan perubahan");
    });
}

// Delete BQ Item
function deleteBQItem(id) {
  if (confirm("Yakin ingin menghapus item ini?")) {
    ipcRenderer.invoke("delete-bq-item", { id }).then(() => {
      loadBQData();
    });
  }
}
