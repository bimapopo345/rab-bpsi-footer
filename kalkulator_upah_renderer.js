const { ipcRenderer } = require("electron");

// Check authentication
function checkAuth() {
  const userId = localStorage.getItem("userId");
  if (!userId) {
    window.location.href = "login.html";
    return null;
  }
  return userId;
}

// Show summary report
function showSummaryReport() {
  document.getElementById("summaryReport").style.display = "block";
  document.getElementById("detailReport").style.display = "none";
  loadSummaryData();
}

// Show detail report
function showDetailReport() {
  document.getElementById("summaryReport").style.display = "none";
  document.getElementById("detailReport").style.display = "block";
  loadDetailData();
}

// Handle back button
function goBack() {
  window.location.href = "index.html";
}

// Format currency
function formatCurrency(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format number with 2 decimal places
function formatNumber(number) {
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number);
}

// Load summary data
function loadSummaryData() {
  const userId = checkAuth();
  if (userId) {
    ipcRenderer.send("get-wage-summary-data", { userId });
  }
}

// Load detail data
function loadDetailData() {
  const userId = checkAuth();
  if (userId) {
    ipcRenderer.send("get-wage-detail-data", { userId });
  }
}

// Handle summary data response
ipcRenderer.on("wage-summary-data", (event, data) => {
  const tbody = document.getElementById("summaryTableBody");
  tbody.innerHTML = "";
  let totalBiaya = 0;

  data.forEach((item) => {
    const row = document.createElement("tr");
    const biaya = (item.hrg_satuan || 0) * (item.volume || 0);
    totalBiaya += biaya;

    row.innerHTML = `
            <td>${item.deskripsi}</td>
            <td>${item.satuan}</td>
            <td>${formatCurrency(item.hrg_satuan || 0)}</td>
            <td>${formatNumber(item.volume || 0)}</td>
            <td>${formatCurrency(biaya)}</td>
        `;
    tbody.appendChild(row);
  });

  document.getElementById("summaryTotal").textContent =
    formatCurrency(totalBiaya);
});

// Handle detail data response
ipcRenderer.on("wage-detail-data", (event, data) => {
  const container = document.getElementById("ahsGroups");
  container.innerHTML = "";

  Object.entries(data).forEach(([kelompok, items]) => {
    const groupDiv = document.createElement("div");
    groupDiv.className = "ahs-group";
    let groupTotal = 0;

    const table = document.createElement("table");
    const thead = document.createElement("thead");
    thead.innerHTML = `
            <tr>
                <th colspan="5" class="ahs-title">${kelompok}</th>
            </tr>
            <tr>
                <th>Deskripsi</th>
                <th>Satuan</th>
                <th>HRG Satuan</th>
                <th>Volume</th>
                <th>Biaya</th>
            </tr>
        `;

    const tbody = document.createElement("tbody");
    items.forEach((item) => {
      const biaya = (item.hrg_satuan || 0) * (item.volume || 0);
      groupTotal += biaya;

      const row = document.createElement("tr");
      row.innerHTML = `
                <td>${item.deskripsi}</td>
                <td>${item.satuan}</td>
                <td>${formatCurrency(item.hrg_satuan || 0)}</td>
                <td>${formatNumber(item.volume || 0)}</td>
                <td>${formatCurrency(biaya)}</td>
            `;
      tbody.appendChild(row);
    });

    const tfoot = document.createElement("tfoot");
    tfoot.innerHTML = `
            <tr class="total-row">
                <td colspan="4">Total ${kelompok}</td>
                <td>${formatCurrency(groupTotal)}</td>
            </tr>
        `;

    table.appendChild(thead);
    table.appendChild(tbody);
    table.appendChild(tfoot);
    groupDiv.appendChild(table);
    container.appendChild(groupDiv);
  });
});

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
  if (checkAuth()) {
    // Show summary report by default
    showSummaryReport();
  }

  // Back button
  const backBtn = document.querySelector(".back-btn");
  if (backBtn) {
    backBtn.addEventListener("click", goBack);
  }
});
