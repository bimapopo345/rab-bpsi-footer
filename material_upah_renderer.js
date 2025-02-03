const { ipcRenderer } = require("electron");

let currentMaterialId = null;
let sortOrder = {
  name: "asc",
  unit: "asc",
  price: "asc",
  category: "asc",
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
      <td>${material.name}</td>
      <td>${material.unit}</td>
      <td>Rp ${material.price.toLocaleString()}</td>
      <td>${material.category}</td>
      <td>${new Date(material.created_at).toLocaleDateString()}</td>
      <td>
        <button onclick="editMaterial(${material.id})">Edit</button>
        <button onclick="deleteMaterial(${material.id})">Hapus</button>
      </td>
    `;
    tableBody.appendChild(row);
  });

  document.getElementById("materialCount").textContent = materials.length;
});

// Initialize the page
document.addEventListener("DOMContentLoaded", () => {
  checkAuth();
  loadMaterials();
  initializeSearchInput();
});

// Initialize search input
function initializeSearchInput() {
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    // Add input event listener once
    if (!searchInput.hasAttribute("data-has-handler")) {
      searchInput.addEventListener("input", (event) => {
        const userId = checkAuth();
        if (!userId) return;

        const searchTerm = event.target.value.trim();
        if (searchTerm === "") {
          loadMaterials(); // Load all materials if the search is cleared
        } else {
          ipcRenderer.send("search-materials", { searchTerm, userId }); // Send search term to backend
        }
      });
      searchInput.setAttribute("data-has-handler", "true");
    }
  }
}

// Load materials from the database
function loadMaterials() {
  const userId = checkAuth();
  if (!userId) return;

  ipcRenderer.send("get-materials", { userId });
}

// Focus handler from main process
ipcRenderer.on("focus-search", () => {
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.disabled = false;
    searchInput.focus();
    // Place cursor at end of text
    const len = searchInput.value.length;
    searchInput.setSelectionRange(len, len);
  }
});

// Handle materials data received from main process
ipcRenderer.on("material-data", (event, material) => {
  document.getElementById("editName").value = material.name;
  document.getElementById("editUnit").value = material.unit;
  document.getElementById("editPrice").value = material.price;
  document.getElementById("editCategory").value = material.category;

  // Tampilkan modal
  const modal = document.getElementById("editMaterialModal");
  modal.style.display = "block";
});

// Menampilkan semua material dalam tabel
ipcRenderer.on("materials-data", (event, materials) => {
  const tableBody = document.getElementById("materialTableBody");
  tableBody.innerHTML = "";

  materials.forEach((material) => {
    const row = document.createElement("tr");
    row.innerHTML = `
          <td>${material.name}</td>
          <td>${material.unit}</td>
          <td>Rp ${material.price.toLocaleString()}</td>
          <td>${material.category}</td>
          <td>${new Date(material.created_at).toLocaleDateString()}</td>
          <td>
              <button onclick="editMaterial(${material.id})">Edit</button>
              <button onclick="deleteMaterial(${material.id})">Hapus</button>
          </td>
      `;
    tableBody.appendChild(row);
  });

  // Update total count
  document.getElementById("materialCount").textContent = materials.length;
});

ipcRenderer.on("material-updated", (event, response) => {
  if (response && response.error) {
    alert("Error: " + response.error);
  } else {
    loadMaterials(); // Reload data material setelah update
    alert("Material updated successfully");
  }
});

// Modal handling
function addNewMaterial() {
  const modal = document.getElementById("addMaterialModal");

  // Clear form fields
  document.getElementById("newName").value = "";
  document.getElementById("newUnit").value = "";
  document.getElementById("newPrice").value = "";
  document.getElementById("newCategory").value = "Material";

  modal.style.display = "block";

  // Focus first input
  const nameInput = document.getElementById("newName");
  if (nameInput) {
    nameInput.focus();
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

  const name = document.getElementById("editName").value.trim();
  const unit = document.getElementById("editUnit").value.trim();
  const price = document.getElementById("editPrice").value;
  const category = document.getElementById("editCategory").value;

  if (!name || !unit || !price) {
    alert("Semua field harus diisi!");
    return;
  }

  // Kirim data yang diperbarui ke backend untuk disimpan di database
  ipcRenderer.send("update-material", {
    id: currentMaterialId,
    name,
    unit,
    price,
    category,
    userId,
  });

  closeEditModal(); // Menutup modal setelah update
}

function saveMaterial() {
  const userId = checkAuth();
  if (!userId) return;

  const name = document.getElementById("newName").value.trim();
  const unit = document.getElementById("newUnit").value.trim();
  const price = document.getElementById("newPrice").value;
  const category = document.getElementById("newCategory").value;

  if (!name || !unit || !price) {
    alert("Semua field harus diisi!");
    return;
  }

  ipcRenderer.send("add-material", {
    material: {
      name,
      unit,
      price: parseFloat(price),
      category,
    },
    userId,
  });

  closeAddModal();
}

// Handle material added successfully
ipcRenderer.on("material-added", (event, response) => {
  if (response && response.error) {
    alert("Error: " + response.error);
  } else {
    loadMaterials(); // Reload data material setelah update
  }
});

// Edit material
function editMaterial(id) {
  const userId = checkAuth();
  if (!userId) return;

  currentMaterialId = id;
  ipcRenderer.send("get-material-by-id", { id, userId });
}

// Delete material
function deleteMaterial(id) {
  const userId = checkAuth();
  if (!userId) return;

  if (confirm("Apakah Anda yakin ingin menghapus item ini?")) {
    ipcRenderer.send("delete-material", { id, userId });

    // Only reset search if input is not focused and modal is closed
    const searchInput = document.getElementById("searchInput");
    const modal = document.getElementById("addMaterialModal");

    if (
      searchInput &&
      document.activeElement !== searchInput &&
      modal.style.display === "none"
    ) {
      const searchValue = searchInput.value;
      searchInput.value = searchValue;
    }
  }
}

// Handle successful deletion
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

// Logout function
function logout() {
  localStorage.removeItem("userId"); // Clear user data
  window.location.href = "login.html";
}
