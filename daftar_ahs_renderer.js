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

// Toggle manual input based on dropdown selection
function toggleManualInput(mode) {
  const select = document.getElementById(`${mode}Kelompok`);
  const manualInput = document.getElementById(`${mode}ManualInput`);
  const manualField = document.getElementById(`${mode}KelompokManual`);

  if (select.value === "manual") {
    manualInput.classList.add("show");
    manualField.required = true;
  } else {
    manualInput.classList.remove("show");
    manualField.required = false;
    manualField.value = "";
  }
}

// Get kelompok value from either dropdown or manual input
function getKelompokValue(mode) {
  const select = document.getElementById(`${mode}Kelompok`);
  const manualField = document.getElementById(`${mode}KelompokManual`);

  return select.value === "manual" ? manualField.value.trim() : select.value;
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
        <button class="action-btn edit" onclick="editAhs(${item.id})">Edit</button>
        <button class="action-btn delete" onclick="deleteAhs(${item.id})">Hapus</button>
      </td>
    `;
    tableBody.appendChild(row);
  });

  document.getElementById("ahsCount").textContent = ahs.length;
});

// Load suggestion data for autocomplete
function loadSuggestions() {
  const userId = checkAuth();
  if (!userId) return;
  ipcRenderer.send("get-ahs-suggestions", { userId });
}

// Initialize the page
document.addEventListener("DOMContentLoaded", () => {
  checkAuth();
  loadAhs();
  loadSuggestions();
  initializeSearchInput();
});

// Handle suggestions data
ipcRenderer.on("ahs-suggestions", (event, { names, units }) => {
  const namesList = document.getElementById("ahsNamesList");
  const unitsList = document.getElementById("ahsUnitsList");

  // Clear existing options
  namesList.innerHTML = "";
  unitsList.innerHTML = "";

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
        <button class="action-btn edit" onclick="editAhs(${item.id})">Edit</button>
        <button class="action-btn delete" onclick="deleteAhs(${item.id})">Hapus</button>
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
  document.getElementById("newKelompokManual").value = "";
  document.getElementById("newManualInput").classList.remove("show");

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

  const kelompok = getKelompokValue("new");
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

  // Reload suggestions after adding new AHS
  loadSuggestions();
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

// Set kelompok dropdown and manual input based on value
function setKelompokField(mode, value) {
  const select = document.getElementById(`${mode}Kelompok`);
  const manualInput = document.getElementById(`${mode}ManualInput`);
  const manualField = document.getElementById(`${mode}KelompokManual`);

  // Check if value matches any option
  const option = Array.from(select.options).find((opt) => opt.value === value);

  if (option) {
    select.value = value;
    manualInput.classList.remove("show");
    manualField.required = false;
    manualField.value = "";
  } else {
    select.value = "manual";
    manualInput.classList.add("show");
    manualField.required = true;
    manualField.value = value;
  }
}

// Handle the AHS data for editing modal
ipcRenderer.on("ahs-data-for-edit", (event, ahs) => {
  if (ahs && ahs.id === currentAhsId) {
    setKelompokField("edit", ahs.kelompok);
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

  const kelompok = getKelompokValue("edit");
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
    loadSuggestions(); // Reload suggestions after updating AHS
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
async function exportData() {
  const userId = checkAuth();
  if (!userId) return;

  try {
    const result = await ipcRenderer.invoke("export-ahs", { userId });
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
      const result = await ipcRenderer.invoke("import-ahs", { userId });
      if (result.success) {
        alert("Data berhasil di-import!");
        loadAhs(); // Reload the table
      } else {
        alert("Error: " + result.error);
      }
    } catch (error) {
      alert("Error mengimpor data: " + error.message);
    }
  }
}

function goBack() {
  window.location.href = "index.html";
}
