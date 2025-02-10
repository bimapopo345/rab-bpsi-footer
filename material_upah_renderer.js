const { ipcRenderer } = require("electron");

let currentMaterialId = null;
let sortOrder = {
  kode: "asc",
  name: "asc",
  unit: "asc",
  price: "asc",
  category: "asc",
  lokasi: "asc",
  sumber_data: "asc",
  created_at: "asc",
};

// Check if user is logged in
function checkAuth() {
  const userId = localStorage.getItem("userId");
  if (!userId) {
    window.location.href = "login.html";
    return null;
  }
  return userId;
}

function sortTable(column) {
  const userId = checkAuth();
  if (!userId) return;

  const direction = sortOrder[column] === "asc" ? "desc" : "asc";
  sortOrder[column] = direction;
  ipcRenderer.send("sort-materials", { column, direction, userId });
}

ipcRenderer.on("sorted-materials", (event, materials) => {
  const tableBody = document.getElementById("materialTableBody");
  tableBody.innerHTML = "";

  materials.forEach((material) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${material.kode || "-"}</td>
      <td>${material.name}</td>
      <td>${material.unit}</td>
      <td>Rp ${material.price.toLocaleString()}</td>
      <td>${material.category}</td>
      <td>${material.lokasi || "-"}</td>
      <td>${material.sumber_data || "-"}</td>
      <td>${new Date(material.created_at).toLocaleDateString()}</td>
      <td>
        <button class="action-btn edit" onclick="editMaterial(${
          material.id
        })">Edit</button>
        <button class="action-btn delete" onclick="deleteMaterial(${
          material.id
        })">Hapus</button>
      </td>
    `;
    tableBody.appendChild(row);
  });

  document.getElementById("materialCount").textContent = materials.length;
});

// Load suggestion data for autocomplete
function loadSuggestions() {
  const userId = checkAuth();
  if (!userId) return;
  ipcRenderer.send("get-material-suggestions", { userId });
}

// Initialize the page
document.addEventListener("DOMContentLoaded", () => {
  checkAuth();
  loadMaterials();
  loadSuggestions();
  initializeSearchInput();
});

// Handle suggestions data
ipcRenderer.on(
  "material-suggestions",
  (event, { names, units, lokasi, sumber_data }) => {
    const namesList = document.getElementById("materialNamesList");
    const unitsList = document.getElementById("materialUnitsList");
    const lokasiList = document.getElementById("materialLokasiList");
    const sumberDataList = document.getElementById("materialSumberDataList");

    // Clear existing options
    namesList.innerHTML = "";
    unitsList.innerHTML = "";
    lokasiList.innerHTML = "";
    sumberDataList.innerHTML = "";

    // Add name suggestions
    names.forEach((name) => {
      const option = document.createElement("option");
      option.value = name;
      namesList.appendChild(option);
    });

    // Add unit suggestions
    units.forEach((unit) => {
      const option = document.createElement("option");
      option.value = unit;
      unitsList.appendChild(option);
    });

    // Add lokasi suggestions
    lokasi.forEach((loc) => {
      const option = document.createElement("option");
      option.value = loc;
      lokasiList.appendChild(option);
    });

    // Add sumber data suggestions
    sumber_data.forEach((src) => {
      const option = document.createElement("option");
      option.value = src;
      sumberDataList.appendChild(option);
    });
  }
);

// Initialize search input
function initializeSearchInput() {
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    if (!searchInput.hasAttribute("data-has-handler")) {
      searchInput.addEventListener("input", (event) => {
        const userId = checkAuth();
        if (!userId) return;

        const searchTerm = event.target.value.trim();
        if (searchTerm === "") {
          loadMaterials();
        } else {
          ipcRenderer.send("search-materials", { searchTerm, userId });
        }
      });
      searchInput.setAttribute("data-has-handler", "true");
    }
  }
}

function loadMaterials() {
  const userId = checkAuth();
  if (!userId) return;
  ipcRenderer.send("get-materials", { userId });
}

ipcRenderer.on("focus-search", () => {
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.disabled = false;
    searchInput.focus();
    const len = searchInput.value.length;
    searchInput.setSelectionRange(len, len);
  }
});

ipcRenderer.on("material-data", (event, material) => {
  document.getElementById("editKode").value = material.kode || "";
  document.getElementById("editName").value = material.name;
  document.getElementById("editUnit").value = material.unit;
  document.getElementById("editPrice").value = material.price;
  document.getElementById("editCategory").value = material.category;
  document.getElementById("editLokasi").value = material.lokasi || "";
  document.getElementById("editSumberData").value = material.sumber_data || "";

  const modal = document.getElementById("editMaterialModal");
  modal.style.display = "block";
});

ipcRenderer.on("materials-data", (event, materials) => {
  const tableBody = document.getElementById("materialTableBody");
  tableBody.innerHTML = "";

  materials.forEach((material) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${material.kode || "-"}</td>
      <td>${material.name}</td>
      <td>${material.unit}</td>
      <td>Rp ${material.price.toLocaleString()}</td>
      <td>${material.category}</td>
      <td>${material.lokasi || "-"}</td>
      <td>${material.sumber_data || "-"}</td>
      <td>${new Date(material.created_at).toLocaleDateString()}</td>
      <td>
        <button class="action-btn edit" onclick="editMaterial(${
          material.id
        })">Edit</button>
        <button class="action-btn delete" onclick="deleteMaterial(${
          material.id
        })">Hapus</button>
      </td>
    `;
    tableBody.appendChild(row);
  });

  document.getElementById("materialCount").textContent = materials.length;
});

function addNewMaterial() {
  const modal = document.getElementById("addMaterialModal");

  // Clear form fields
  document.getElementById("newKode").value = "";
  document.getElementById("newName").value = "";
  document.getElementById("newUnit").value = "";
  document.getElementById("newPrice").value = "";
  document.getElementById("newCategory").value = "Material";
  document.getElementById("newLokasi").value = "";
  document.getElementById("newSumberData").value = "";

  modal.style.display = "block";

  // Focus first input
  const kodeInput = document.getElementById("newKode");
  if (kodeInput) {
    kodeInput.focus();
  }
}

function closeAddModal() {
  const modal = document.getElementById("addMaterialModal");
  if (modal) modal.style.display = "none";
}

function closeEditModal() {
  const modal = document.getElementById("editMaterialModal");
  if (modal) modal.style.display = "none";
}

function updateMaterial() {
  const userId = checkAuth();
  if (!userId) return;

  const kode = document.getElementById("editKode").value.trim();
  const name = document.getElementById("editName").value.trim();
  const unit = document.getElementById("editUnit").value.trim();
  const price = document.getElementById("editPrice").value;
  const category = document.getElementById("editCategory").value;
  const lokasi = document.getElementById("editLokasi").value.trim();
  const sumber_data = document.getElementById("editSumberData").value.trim();

  if (!name || !unit || !price) {
    alert("Nama, Satuan, dan Harga harus diisi!");
    return;
  }

  ipcRenderer.send("update-material", {
    id: currentMaterialId,
    kode,
    name,
    unit,
    price,
    category,
    lokasi,
    sumber_data,
    userId,
  });

  closeEditModal();
}

function saveMaterial() {
  const userId = checkAuth();
  if (!userId) return;

  const kode = document.getElementById("newKode").value.trim();
  const name = document.getElementById("newName").value.trim();
  const unit = document.getElementById("newUnit").value.trim();
  const price = document.getElementById("newPrice").value;
  const category = document.getElementById("newCategory").value;
  const lokasi = document.getElementById("newLokasi").value.trim();
  const sumber_data = document.getElementById("newSumberData").value.trim();

  if (!name || !unit || !price) {
    alert("Nama, Satuan, dan Harga harus diisi!");
    return;
  }

  ipcRenderer.send("add-material", {
    material: {
      kode,
      name,
      unit,
      price: parseFloat(price),
      category,
      lokasi,
      sumber_data,
    },
    userId,
  });

  closeAddModal();

  // Reload suggestions after adding new material
  loadSuggestions();
}

// Handle responses
ipcRenderer.on("material-added", (event, response) => {
  if (response && response.error) {
    alert("Error: " + response.error);
  } else {
    loadMaterials();
  }
});

ipcRenderer.on("material-updated", (event, response) => {
  if (response && response.error) {
    alert("Error: " + response.error);
  } else {
    loadMaterials();
    loadSuggestions(); // Reload suggestions after updating material
    alert("Material updated successfully");
  }
});

function editMaterial(id) {
  const userId = checkAuth();
  if (!userId) return;

  currentMaterialId = id;
  ipcRenderer.send("get-material-by-id", { id, userId });
}

function deleteMaterial(id) {
  const userId = checkAuth();
  if (!userId) return;

  if (confirm("Apakah Anda yakin ingin menghapus item ini?")) {
    ipcRenderer.send("delete-material", { id, userId });
  }
}

ipcRenderer.on("material-deleted", (event, response) => {
  if (response && response.error) {
    alert("Error: " + response.error);
  }
  loadMaterials();
});

// Close modal when clicking outside
window.onclick = function (event) {
  const addModal = document.getElementById("addMaterialModal");
  const editModal = document.getElementById("editMaterialModal");

  if (event.target === addModal) {
    closeAddModal();
  }
  if (event.target === editModal) {
    closeEditModal();
  }
};

// Prevent modal from closing when clicking inside
document.addEventListener("click", function (event) {
  const modalContent = document.querySelector(".modal-content");
  if (modalContent && modalContent.contains(event.target)) {
    event.stopPropagation();
  }
});

// Prevent form submission on enter
document.addEventListener("keydown", function (event) {
  if (
    event.key === "Enter" &&
    event.target.tagName.toLowerCase() !== "textarea"
  ) {
    event.preventDefault();
  }
});

// Keep search input enabled
document.addEventListener("click", function (event) {
  const searchInput = document.getElementById("searchInput");
  if (searchInput && searchInput.disabled) {
    searchInput.disabled = false;
  }
});

async function exportData() {
  const userId = checkAuth();
  if (!userId) return;

  try {
    const result = await ipcRenderer.invoke("export-materials", { userId });
    if (result.success) {
      alert("Data berhasil di-export!");
    } else {
      alert("Error: " + result.error);
    }
  } catch (error) {
    alert("Error mengekspor data: " + error.message);
  }
}

async function importData() {
  const userId = checkAuth();
  if (!userId) return;

  if (
    confirm(
      "Import akan menggabungkan data yang di-import dengan data yang sudah ada. Lanjutkan?"
    )
  ) {
    try {
      const result = await ipcRenderer.invoke("import-materials", { userId });
      if (result.success) {
        alert("Data berhasil di-import!");
        loadMaterials(); // Reload the table
      } else {
        alert("Error: " + result.error);
      }
    } catch (error) {
      alert("Error mengimpor data: " + error.message);
    }
  }
}

function logout() {
  localStorage.removeItem("userId");
  window.location.href = "login.html";
}
