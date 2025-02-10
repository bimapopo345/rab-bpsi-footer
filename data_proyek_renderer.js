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

// Load current project if it exists
function loadProject() {
  const userId = checkAuth();
  if (!userId) return;

  ipcRenderer.send("get-project", { userId });
}

// Display project in the UI
function displayProject(project) {
  const projectList = document.getElementById("projectList");
  projectList.innerHTML = "";

  if (project) {
    const projectItem = document.createElement("div");
    projectItem.className = "project-item";
    projectItem.innerHTML = `
      <h3>${project.name}</h3>
      <p>Lokasi: ${project.location}</p>
      <p>Sumber Dana: ${project.funding || "-"}</p>
    `;
    projectList.appendChild(projectItem);

    // Fill form with existing project data
    document.getElementById("projectName").value = project.name;
    document.getElementById("projectLocation").value = project.location;
    document.getElementById("projectFunding").value = project.funding || "";
  }
}

// Handle project data response
ipcRenderer.on("project-data", (event, project) => {
  displayProject(project);
});

// Handle save/update response
ipcRenderer.on("project-saved", (event, result) => {
  if (result.success) {
    alert(result.message);
  } else {
    alert("Terjadi kesalahan: " + (result.error || "Unknown error"));
  }
});

// Form submission handler
document.getElementById("projectForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const userId = checkAuth();
  if (!userId) return;

  const projectName = document.getElementById("projectName").value.trim();
  const projectLocation = document
    .getElementById("projectLocation")
    .value.trim();
  const projectFunding = document.getElementById("projectFunding").value.trim();

  if (!projectName || !projectLocation || !projectFunding) {
    alert("Mohon isi semua field yang diperlukan");
    return;
  }

  // Send project data to main process
  ipcRenderer.send("save-project", {
    name: projectName,
    location: projectLocation,
    funding: projectFunding,
    userId,
  });
});

// Ensure user is authenticated when the page loads
document.addEventListener("DOMContentLoaded", () => {
  checkAuth();
  loadProject();
});
