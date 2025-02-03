const { ipcRenderer } = require("electron");

// Check if user is admin
function checkAuth() {
  const userId = localStorage.getItem("userId");
  if (!userId) {
    window.location.href = "login.html";
    return null;
  }
  // Get username to check if admin
  ipcRenderer.send("check-admin", { userId });
  return userId;
}

document.addEventListener("DOMContentLoaded", () => {
  const userId = checkAuth();
  if (userId) {
    loadUsers();
  }
});

function loadUsers() {
  showLoading();
  ipcRenderer.send("get-users");
}

// Handle admin check response
ipcRenderer.on("admin-check-result", (event, isAdmin) => {
  if (!isAdmin) {
    window.location.href = "index.html";
  } else {
    // If user is admin, show database actions
    document.getElementById("adminActions").style.display = "flex";
    setupDatabaseHandlers();
  }
});

// Handle users data
ipcRenderer.on("users-data", (event, users) => {
  hideLoading();
  displayUsers(users);
});

function setupDatabaseHandlers() {
  // Database-wide export/import
  document
    .getElementById("exportDatabaseBtn")
    .addEventListener("click", async () => {
      showLoading();
      try {
        const result = await ipcRenderer.invoke("export-database");
        alert(result.message);
      } catch (error) {
        alert("Error mengekspor database: " + error.message);
      } finally {
        hideLoading();
      }
    });

  document
    .getElementById("importDatabaseBtn")
    .addEventListener("click", async () => {
      if (
        confirm(
          "Import database akan mengganti semua data yang ada. Tindakan ini tidak dapat dibatalkan. Apakah Anda yakin ingin melanjutkan?"
        )
      ) {
        showLoading();
        try {
          const result = await ipcRenderer.invoke("import-database");
          alert(result.message);
          if (result.success) {
            window.location.reload();
          }
        } catch (error) {
          alert("Error mengimpor database: " + error.message);
        } finally {
          hideLoading();
        }
      }
    });
}

function displayUsers(users) {
  const tableBody = document.getElementById("userTableBody");
  tableBody.innerHTML = "";

  users.forEach((user, index) => {
    // Skip admin in the list
    if (user.username === "admin") return;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${index}</td>
      <td>${user.username}</td>
      <td>${user.password}</td>
      <td>${user.hint}</td>
      <td>
        <div class="user-actions">
          <button class="user-action-btn" onclick="exportUserData('${user.username}')">Export</button>
        </div>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

async function exportUserData(username) {
  showLoading();
  try {
    // First get the user ID
    const user = await new Promise((resolve, reject) => {
      ipcRenderer.send("get-user-id", username);
      ipcRenderer.once("user-id-result", (event, result) => {
        if (result.error) reject(new Error(result.error));
        else resolve(result);
      });
    });

    const result = await ipcRenderer.invoke("export-my-data", user.id);
    alert(result.message);
  } catch (error) {
    alert("Error mengekspor data user: " + error.message);
  } finally {
    hideLoading();
  }
}

function showLoading() {
  const loading = document.getElementById("loadingIndicator");
  if (loading) loading.classList.add("active");
}

function hideLoading() {
  const loading = document.getElementById("loadingIndicator");
  if (loading) loading.classList.remove("active");
}

function goBack() {
  window.location.href = "index.html";
}
