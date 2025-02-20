const { ipcRenderer } = require("electron");

let selectedAHSId = null;
let selectedAHSData = null;
let editingItemId = null;
let selectedSubprojectId = null;

// Get user ID from localStorage
const userId = localStorage.getItem("userId");

// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
  loadSubprojects();
});

// Load Subprojects
async function loadSubprojects() {
  const subprojects = await ipcRenderer.invoke("get-subprojects", { userId });

  // If no subprojects exist yet, create a container for the "Add Subproject" button only
  const container = document.querySelector(".container");
  container.innerHTML = `
    <div class="button-container">
      <button class="btn btn-primary" onclick="openSubprojectModal()">
        <span>+</span> Tambah Subproyek
      </button>
    </div>
    <div id="subprojectsContainer"></div>
  `;

  const subprojectsContainer = document.getElementById("subprojectsContainer");
  subprojectsContainer.innerHTML = "";

  // Load BQ items grouped by subproject
  const bqItems = await ipcRenderer.invoke("get-bq-by-subproject", { userId });

  // Group BQ items by subproject
  const groupedItems = {};
  bqItems.forEach((item) => {
    if (item.subproject_id) {
      if (!groupedItems[item.subproject_id]) {
        groupedItems[item.subproject_id] = {
          name: item.subproject_name,
          items: [],
        };
      }
      if (item.id) {
        // Only add if it's an actual BQ item
        groupedItems[item.subproject_id].items.push(item);
      }
    }
  });

  // Create HTML for each subproject
  subprojects.forEach((subproject) => {
    const subprojectItems = groupedItems[subproject.id] || { items: [] };

    const subprojectSection = document.createElement("div");
    subprojectSection.className = "subproject-section";
    subprojectSection.innerHTML = `
      <div class="subproject-header">
        <h2>${subproject.name}</h2>
        <div class="subproject-actions">
          <button class="btn btn-primary" onclick="openAHSModal(${
            subproject.id
          })">
            <span>+</span> Tambah AHS
          </button>
          <button class="btn btn-warning" onclick="editSubproject(${
            subproject.id
          }, '${subproject.name}')">
            Edit
          </button>
          <button class="btn btn-danger" onclick="deleteSubproject(${
            subproject.id
          })">
            Hapus
          </button>
        </div>
      </div>
      <table class="results-table">
        <thead>
          <tr>
            <th>Kode AHS</th>
            <th>AHS</th>
            <th>Volume</th>
            <th>Satuan</th>
            <th>Total Harga</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          ${subprojectItems.items
            .map(
              (item) => `
            <tr>
              <td>${item.kode_ahs || "-"}</td>
              <td>${item.ahs}</td>
              <td>${item.volume.toFixed(2)}</td>
              <td>${item.satuan || "m³"}</td>
              <td>Rp ${
                item.total_price ? item.total_price.toLocaleString() : "-"
              }</td>
              <td>
                <div class="action-buttons">
                  <button class="btn btn-primary btn-small" onclick="editBQItem(${JSON.stringify(
                    item
                  ).replace(/"/g, "&quot;")})">Edit</button>
                  <button class="btn btn-danger btn-small" onclick="deleteBQItem(${
                    item.id
                  })">Hapus</button>
                </div>
              </td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    `;

    subprojectsContainer.appendChild(subprojectSection);
  });
}

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
      loadSubprojects();
    });
  }
}

// Subproject Functions
function openSubprojectModal() {
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.id = "subprojectModal";
  modal.innerHTML = `
    <div class="modal-content">
      <button class="close-btn" onclick="closeSubprojectModal()">&times;</button>
      <h2>Tambah Subproyek</h2>
      <div class="form-group">
        <label for="subprojectName">Nama Subproyek:</label>
        <input type="text" id="subprojectName" placeholder="Masukkan nama subproyek">
      </div>
      <div class="modal-actions">
        <button class="btn" onclick="closeSubprojectModal()">Batal</button>
        <button class="btn btn-primary" onclick="saveSubproject()">Simpan</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  modal.style.display = "block";
  setTimeout(() => {
    modal.classList.add("active");
  }, 10);
}

function closeSubprojectModal() {
  const modal = document.getElementById("subprojectModal");
  if (modal) {
    modal.classList.remove("active");
    setTimeout(() => {
      modal.remove();
    }, 300);
  }
}

async function saveSubproject() {
  const name = document.getElementById("subprojectName").value.trim();
  if (!name) {
    alert("Nama subproyek tidak boleh kosong");
    return;
  }

  try {
    const result = await ipcRenderer.invoke("add-subproject", { name, userId });
    if (result.success) {
      closeSubprojectModal();
      loadSubprojects();
    } else {
      alert(result.error || "Gagal menambahkan subproyek");
    }
  } catch (error) {
    console.error("Error saving subproject:", error);
    alert("Gagal menyimpan subproyek");
  }
}

function editSubproject(id, name) {
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.id = "editSubprojectModal";
  modal.innerHTML = `
    <div class="modal-content">
      <button class="close-btn" onclick="closeEditSubprojectModal()">&times;</button>
      <h2>Edit Subproyek</h2>
      <div class="form-group">
        <label for="editSubprojectName">Nama Subproyek:</label>
        <input type="text" id="editSubprojectName" value="${name}">
      </div>
      <div class="modal-actions">
        <button class="btn" onclick="closeEditSubprojectModal()">Batal</button>
        <button class="btn btn-primary" onclick="saveEditedSubproject(${id})">Simpan</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  modal.style.display = "block";
  setTimeout(() => {
    modal.classList.add("active");
  }, 10);
}

function closeEditSubprojectModal() {
  const modal = document.getElementById("editSubprojectModal");
  if (modal) {
    modal.classList.remove("active");
    setTimeout(() => {
      modal.remove();
    }, 300);
  }
}

async function saveEditedSubproject(id) {
  const name = document.getElementById("editSubprojectName").value.trim();
  if (!name) {
    alert("Nama subproyek tidak boleh kosong");
    return;
  }

  try {
    const result = await ipcRenderer.invoke("update-subproject", {
      id,
      name,
      userId,
    });
    if (result.success) {
      closeEditSubprojectModal();
      loadSubprojects();
    } else {
      alert(result.error || "Gagal mengupdate subproyek");
    }
  } catch (error) {
    console.error("Error updating subproject:", error);
    alert("Gagal menyimpan perubahan");
  }
}

function deleteSubproject(id) {
  if (
    confirm(
      "Yakin ingin menghapus subproyek ini? Semua AHS yang terkait akan dihapus dari subproyek."
    )
  ) {
    ipcRenderer
      .invoke("delete-subproject", { id, userId })
      .then((result) => {
        if (result.success) {
          loadSubprojects();
        } else {
          alert(result.error || "Gagal menghapus subproyek");
        }
      })
      .catch((error) => {
        console.error("Error deleting subproject:", error);
        alert("Gagal menghapus subproyek");
      });
  }
}

// Override original openAHSModal to handle subproject
function openAHSModal(subprojectId) {
  selectedSubprojectId = subprojectId;
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

// Update saveVolumeAndSatuan to include subproject_id
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

  const ahsPrice = parseFloat(selectedAHSData.total_price);
  if (isNaN(ahsPrice) || ahsPrice <= 0) {
    alert("AHS terpilih tidak memiliki data harga yang valid");
    return;
  }

  const totalPrice = parseFloat((volume * ahsPrice).toFixed(2));

  const bqItem = {
    userId,
    ahsId: selectedAHSId,
    subproject_id: selectedSubprojectId,
    volume,
    satuan,
    total_price: totalPrice,
  };

  ipcRenderer.invoke("save-bq-item", bqItem).then(() => {
    closeVolumeModal();
    loadSubprojects();
  });
}
