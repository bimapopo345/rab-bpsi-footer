const { ipcRenderer } = require("electron");

let currentAhsId = null;
let sortOrder = {
  kelompok: "asc",
  kode_ahs: "asc",
  ahs: "asc",
  satuan: "asc",
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
  ipcRenderer.send("sort-ahs", { column, direction, userId });
}

ipcRenderer.on("sorted-ahs", (event, ahs) => {
  const tableBody = document.getElementById("ahsTableBody");
  tableBody.innerHTML = "";

  ahs.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.kelompok}</td>
      <td>${item.kode_ahs}</td>
      <td>${item.ahs}</td>
      <td>${item.satuan}</td>
      <td>
        <button onclick="editAhs(${item.id})">Edit</button>
        <button onclick="deleteAhs(${item.id})">Hapus</button>
      </td>
    `;
    tableBody.appendChild(row);
  });

  document.getElementById("ahsCount").textContent = ahs.length;
});

// Initialize the page
document.addEventListener("DOMContentLoaded", () => {
  checkAuth();
  loadAhs();
  initializeSearchInput();
});

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
          loadAhs(); // Load all AHS if search is cleared
        } else {
          ipcRenderer.send("search-ahs", { searchTerm, userId }); // Send search term to the main process
        }
      });
      searchInput.setAttribute("data-has-handler", "true");
    }
  }
}

// Load AHS data from the database
function loadAhs() {
  const userId = checkAuth();
  if (!userId) return;

  ipcRenderer.send("get-ahs", { userId });
}

// Handle AHS data received from main process
ipcRenderer.on("ahs-data", (event, ahs) => {
  const searchTerm = document
    .getElementById("searchInput")
    .value.trim()
    .toLowerCase();
  const filteredAhs = ahs.filter(
    (item) =>
      item.kelompok.toLowerCase().includes(searchTerm) ||
      item.ahs.toLowerCase().includes(searchTerm)
  );

  const tableBody = document.getElementById("ahsTableBody");
  tableBody.innerHTML = "";

  filteredAhs.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.kelompok}</td>
      <td>${item.kode_ahs}</td>
      <td>${item.ahs}</td>
      <td>${item.satuan}</td>
      <td>
        <button onclick="editAhs(${item.id})">Edit</button>
        <button onclick="deleteAhs(${item.id})">Hapus</button>
      </td>
    `;
    tableBody.appendChild(row);
  });

  document.getElementById("ahsCount").textContent = filteredAhs.length;
});

// Add new AHS
function addNewAhs() {
  const modal = document.getElementById("addAhsModal");

  // Clear form fields
  document.getElementById("newKelompok").value = "";
  document.getElementById("newKodeAhs").value = "";
  document.getElementById("newAhs").value = "";
  document.getElementById("newSatuan").value = "";

  modal.style.display = "block";
}

// Close modal
function closeAhsModal() {
  const modal = document.getElementById("addAhsModal");
  if (modal) modal.style.display = "none";
}

// Save new AHS
function saveAhs() {
  const userId = checkAuth();
  if (!userId) return;

  const kelompok = document.getElementById("newKelompok").value.trim();
  const kodeAhs = document.getElementById("newKodeAhs").value.trim();
  const ahs = document.getElementById("newAhs").value.trim();
  const satuan = document.getElementById("newSatuan").value.trim();

  if (!kelompok || !kodeAhs || !ahs || !satuan) {
    alert("Semua field harus diisi!");
    return;
  }

  // Send AHS data to backend to save in the database
  ipcRenderer.send("add-ahs", {
    ahsData: {
      kelompok,
      kode_ahs: kodeAhs,
      ahs,
      satuan,
    },
    userId,
  });

  closeAhsModal(); // Close modal after saving
}

// Handle AHS added successfully
ipcRenderer.on("ahs-added", (event, response) => {
  if (response && response.error) {
    alert("Error: " + response.error);
  } else {
    loadAhs(); // Reload AHS data after adding
  }
});

// Edit AHS functionality
function editAhs(id) {
  const userId = checkAuth();
  if (!userId) return;

  currentAhsId = id;
  ipcRenderer.send("get-ahs-by-id", { id, userId }); // Send request for specific AHS by ID
}

// Handle the AHS data for editing modal
ipcRenderer.on("ahs-data-for-edit", (event, ahs) => {
  if (ahs && ahs.id === currentAhsId) {
    document.getElementById("editKelompok").value = ahs.kelompok;
    document.getElementById("editKodeAhs").value = ahs.kode_ahs;
    document.getElementById("editAhs").value = ahs.ahs;
    document.getElementById("editSatuan").value = ahs.satuan;

    // Show the edit modal
    const modal = document.getElementById("editAhsModal");
    modal.style.display = "block";
  }
});

// Close Edit modal
function closeEditAhsModal() {
  const modal = document.getElementById("editAhsModal");
  if (modal) modal.style.display = "none";
}

// Update AHS
function updateAhs() {
  const userId = checkAuth();
  if (!userId) return;

  const kelompok = document.getElementById("editKelompok").value.trim();
  const kodeAhs = document.getElementById("editKodeAhs").value.trim();
  const ahs = document.getElementById("editAhs").value.trim();
  const satuan = document.getElementById("editSatuan").value.trim();

  if (!kelompok || !kodeAhs || !ahs || !satuan) {
    alert("Semua field harus diisi!");
    return;
  }

  // Send updated data to backend
  ipcRenderer.send("update-ahs", {
    ahsData: {
      id: currentAhsId,
      kelompok,
      kode_ahs: kodeAhs,
      ahs,
      satuan,
    },
    userId,
  });

  closeEditAhsModal();
}

// Handle AHS updated successfully
ipcRenderer.on("ahs-updated", (event, response) => {
  if (response && response.error) {
    alert("Error: " + response.error);
  } else {
    loadAhs(); // Reload AHS data after update
  }
});

// Delete AHS
function deleteAhs(id) {
  const userId = checkAuth();
  if (!userId) return;

  if (confirm("Apakah Anda yakin ingin menghapus item ini?")) {
    ipcRenderer.send("delete-ahs", { id, userId });
  }
}

// Handle AHS deletion
ipcRenderer.on("ahs-deleted", (event, response) => {
  if (response && response.error) {
    alert("Error: " + response.error);
  } else {
    loadAhs(); // Reload AHS data after deletion
  }
});

// Logout function
function logout() {
  localStorage.removeItem("userId");
  window.location.href = "login.html";
}

// Back to main page
function goBack() {
  window.location.href = "index.html";
}
