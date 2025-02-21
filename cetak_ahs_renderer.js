const { ipcRenderer } = require("electron");

// Check if user is logged in
function checkAuth() {
  const userId = localStorage.getItem("userId");
  if (!userId) {
    window.location.href = "login.html";
    return null;
  }
  return userId;
}

// Load project info when page loads
document.addEventListener("DOMContentLoaded", () => {
  checkAuth();
  loadProjectInfo();
  setupBackButton();
});

// Setup back button
function setupBackButton() {
  const backBtn = document.querySelector(".back-btn");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      window.location.href = "index.html";
    });
  }
}

// Load project information
function loadProjectInfo() {
  const userId = checkAuth();
  if (!userId) return;

  ipcRenderer.send("get-project", { userId });
}

// Handle project data
ipcRenderer.on("project-data", (event, project) => {
  document.getElementById("projectName").textContent = project
    ? project.name
    : "Belum ada proyek";
  document.getElementById("projectLocation").textContent = project
    ? project.location
    : "Belum ada lokasi";
  document.getElementById("projectFunding").textContent = project
    ? project.funding
    : "Belum ada sumber dana";
});

// Show loading indicator
function showLoading() {
  const loading = document.getElementById("loadingIndicator");
  loading.classList.add("active");
}

// Hide loading indicator
function hideLoading() {
  const loading = document.getElementById("loadingIndicator");
  loading.classList.remove("active");
}

// Print functions
function print(type) {
  const userId = checkAuth();
  if (!userId) return;

  showLoading();
  ipcRenderer.send("print-rab", { type, userId });
}

// Print all RAB data
function printAll() {
  print("all");
}

// Print wages only
function printWages() {
  print("wages");
}

// Print materials only
function printMaterials() {
  print("materials");
}

// Print AHS only
function printAhsOnly() {
  print("ahs");
}

// Print BQ only
function printBQ() {
  print("bq");
}

// Print Rekap BQ only
function printRekapBQ() {
  print("rekapBQ");
}

// Print Kesimpulan
function printKesimpulan() {
  const userId = checkAuth();
  if (!userId) return;

  showLoading();
  ipcRenderer.send("print-kesimpulan", { userId });
}

// Handle print completion
ipcRenderer.on("print-complete", (event, result) => {
  hideLoading();
  if (result.success) {
    alert("File Excel berhasil dibuat!\nLokasi: " + result.path);
  } else {
    alert("Error membuat file Excel: " + result.error);
  }
});

// Handle print error
ipcRenderer.on("print-error", (event, error) => {
  hideLoading();
  alert("Terjadi kesalahan: " + error);
});

// Logout function
function logout() {
  localStorage.removeItem("userId");
  window.location.href = "login.html";
}
