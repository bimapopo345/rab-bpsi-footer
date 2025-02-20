const { ipcRenderer } = require("electron");
const ExcelJS = require("exceljs");
const path = require("path");
const {
  calculateProfit,
  calculatePPN,
  formatRupiah,
} = require("./src/utils/tax-profit-calculator");

// Fungsi untuk export ke Excel
async function exportToExcel() {
  const userId = checkAuth();
  if (!userId) return;

  try {
    const result = await ipcRenderer.invoke("export-all-ahs", { userId });

    if (result.success) {
      alert(`Export berhasil!\n${result.message}`);
    } else {
      alert(`Export gagal: ${result.message}`);
    }
  } catch (error) {
    console.error("Error exporting to Excel:", error);
    alert(`Error saat export: ${error.message}`);
  }
}

let selectedMaterialId = null;
let selectedAhsId = null;
let importInProgress = false;

// Check if user is logged in
function checkAuth() {
  const userId = localStorage.getItem("userId");
  if (!userId) {
    window.location.href = "login.html";
    return null;
  }
  return userId;
}

document.addEventListener("DOMContentLoaded", () => {
  checkAuth();
  initializeMaterialTable();
});

function openAhsModal() {
  const userId = checkAuth();
  if (!userId) return;

  const modal = document.getElementById("searchAhsModal");
  modal.style.display = "block";
  loadAhs();
}

function closeSearchAhsModal() {
  const modal = document.getElementById("searchAhsModal");
  if (!modal) {
    console.warn("Modal element not found");
    return;
  }

  console.log("Closing AHS modal...");
  modal.style.display = "none";
  console.log("Modal display style:", modal.style.display);
}

function loadAhs() {
  const userId = checkAuth();
  if (!userId) return;

  ipcRenderer.send("get-ahs", { userId });
}

function searchAhs() {
  const userId = checkAuth();
  if (!userId) return;

  const searchInput = document
    .getElementById("searchAhsInput")
    .value.trim()
    .toLowerCase();
  ipcRenderer.send("search-ahs", { searchTerm: searchInput, userId });
}

ipcRenderer.on("ahs-data", (event, ahs) => {
  const searchInput = document
    .getElementById("searchAhsInput")
    .value.trim()
    .toLowerCase();
  const filteredAhs = ahs.filter(
    (item) =>
      item.kelompok.toLowerCase().includes(searchInput) ||
      item.ahs.toLowerCase().includes(searchInput)
  );

  const tableBody = document.getElementById("ahsSearchResults");
  tableBody.innerHTML = "";

  filteredAhs.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.kelompok}</td>
      <td>${item.kode_ahs}</td>
      <td>${item.ahs}</td>
      <td>${item.satuan}</td>
      <td><button class="action-btn" onclick="selectAhs(${item.id})" style="background-color: var(--success)">Pilih</button></td>
    `;
    tableBody.appendChild(row);
  });
});

function selectAhs(id) {
  const userId = checkAuth();
  if (!userId) return;

  selectedAhsId = id;

  // Get data and close modal
  closeSearchAhsModal();
  ipcRenderer.send("get-ahs-by-id", { id, userId });
  ipcRenderer.send("get-pricing", { ahsId: id, userId });
}

// Handle AHS data response
ipcRenderer.on("ahs-data-for-edit", (event, ahs) => {
  if (!ahs) return;

  // Update form fields
  document.getElementById("kelompok-pekerjaan").value = ahs.kelompok;
  document.getElementById("satuan").value = ahs.satuan;
  document.getElementById("analisa-nama").value = ahs.ahs;
});

// Function to update cost chart
function updateTotals() {
  const allRows = document.querySelectorAll("#materialDetails tr");
  let dataTotals = {
    bahan: 0,
    upah: 0,
    alat: 0,
  };

  // Calculate totals from each row
  allRows.forEach((row) => {
    const category = row.cells[0].textContent.toLowerCase();
    const totalText = row.cells[8].textContent.replace(/[Rp,.\s]/g, "");
    const total = parseInt(totalText) || 0;

    if (category.includes("bahan")) dataTotals.bahan += total;
    else if (category.includes("upah")) dataTotals.upah += total;
    else if (category.includes("alat")) dataTotals.alat += total;
  });

  const grandTotal = dataTotals.bahan + dataTotals.upah + dataTotals.alat;

  // Show chart if there's data
  if (grandTotal > 0) {
    document.getElementById("cost-chart").style.display = "block";
  }

  // Format function
  const formatRupiah = (num) =>
    num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  // Update values and bars
  ["bahan", "upah", "alat"].forEach((type) => {
    const value = dataTotals[type];
    const percentage =
      value > 0 ? ((value / grandTotal) * 100).toFixed(1) : "0.0";

    // Update value
    document.getElementById(`${type}-value`).textContent = formatRupiah(value);

    // Update bar
    const bar = document.getElementById(`${type}-bar`);
    bar.style.width = percentage + "%";
    bar.querySelector(".percentage").textContent = percentage + "%";
  });

  // Update total
  document.getElementById("total-value").textContent = formatRupiah(grandTotal);
}

// Handle AHS data response
ipcRenderer.on("ahs-data-for-edit", (event, ahs) => {
  if (ahs) {
    document.getElementById("kelompok-pekerjaan").value = ahs.kelompok;
    document.getElementById("satuan").value = ahs.satuan;
    document.getElementById("analisa-nama").value = ahs.ahs;
    closeSearchAhsModal();
  }
});

// Handle pricing data updates
ipcRenderer.on("pricing-data", (event, pricingData) => {
  // Display data and show chart
  displayPricingData(pricingData);
  document.getElementById("cost-chart").style.display =
    pricingData.length > 0 ? "block" : "none";

  // Update chart values
  if (pricingData.length > 0) {
    updateTotals();
  }
});

// Display pricing data in table
function displayPricingData(pricingData) {
  const tableBody = document.getElementById("materialDetails");
  tableBody.innerHTML = "";

  // Debug: Log the pricing data
  console.log("Pricing Data:", pricingData);

  pricingData.forEach((item) => {
    // Hitung total dengan memperhatikan format angka
    const price = parseFloat(item.price.toString().replace(/,/g, ""));
    const koefisien = parseFloat(item.koefisien.toString().replace(/,/g, "."));
    const total = price * koefisien;

    const row = document.createElement("tr");
    row.dataset.pricingId = item.id;
    row.dataset.materialId = item.material_id;
    row.dataset.materialPrice = price;

    // Debug: Log each item's category
    console.log("Item Category:", item.category);

    row.innerHTML = `
      <td>${item.category || "Bahan"}</td>
      <td>${item.kode || "-"}</td>
      <td>${item.name}</td>
      <td>${item.unit}</td>
      <td><input type="number" value="${
        item.koefisien
      }" onchange="updateKoefisien(this)"></td>
      <td>Rp ${item.price.toLocaleString()}</td>
      <td>${item.lokasi || "-"}</td>
      <td>${item.sumber_data || "-"}</td>
      <td>Rp ${total.toLocaleString()}</td>
    `;
    tableBody.appendChild(row);
  });
}

// Handle pricing data updates
ipcRenderer.on("pricing-data", (event, pricingData) => {
  // Display data in table
  displayPricingData(pricingData);
  // Update chart
  updateTotals();
});

function addBahanUpah() {
  const userId = checkAuth();
  if (!userId) return;

  const modal = document.getElementById("searchMaterialModal");
  modal.style.display = "block";
  loadMaterials();
}

function closeSearchMaterialModal() {
  const modal = document.getElementById("searchMaterialModal");
  modal.style.display = "none";
}

function loadMaterials() {
  const userId = checkAuth();
  if (!userId) return;

  ipcRenderer.send("get-materials", { userId });
}

function searchMaterial() {
  const userId = checkAuth();
  if (!userId) return;

  const searchInput = document
    .getElementById("searchMaterialInput")
    .value.trim()
    .toLowerCase();
  ipcRenderer.send("search-materials", { searchTerm: searchInput, userId });
}

ipcRenderer.on("materials-data", (event, materials) => {
  const searchInput = document
    .getElementById("searchMaterialInput")
    .value.trim()
    .toLowerCase();
  const filteredMaterials = materials.filter(
    (item) =>
      item.name.toLowerCase().includes(searchInput) ||
      item.category.toLowerCase().includes(searchInput)
  );

  const tableBody = document.getElementById("materialSearchResults");
  tableBody.innerHTML = "";

  filteredMaterials.forEach((material) => {
    const row = document.createElement("tr");
    row.innerHTML = `
        <td>${material.kode || "-"}</td>
        <td>${material.name}</td>
        <td>${material.unit}</td>
        <td>Rp ${material.price.toLocaleString()}</td>
        <td>${material.category}</td>
        <td>${material.lokasi || "-"}</td>
        <td>${material.sumber_data || "-"}</td>
        <td><button class="action-btn" onclick="selectMaterial(${
          material.id
        }, '${material.kode || ""}', '${material.name.replace("'", "\\'")}', ${
      material.price
    }, '${material.unit}', '${material.lokasi || ""}', '${
      material.sumber_data || ""
    }', '${
      material.category
    }')" style="background-color: var(--success)">Pilih</button></td>
      `;
    tableBody.appendChild(row);
  });
});

function selectMaterial(
  id,
  kode,
  name,
  price,
  unit,
  lokasi,
  sumber_data,
  category
) {
  const userId = checkAuth();
  if (!userId) return;

  selectedMaterialId = id;
  const koefisien = 1;
  // Normalisasi format angka
  const normalizedPrice = parseFloat(price.toString().replace(/,/g, ""));
  const total = normalizedPrice * koefisien;

  const tableBody = document.getElementById("materialDetails");
  const row = document.createElement("tr");
  row.dataset.materialId = id;
  row.dataset.materialPrice = normalizedPrice;
  row.innerHTML = `
    <td>${category}</td>
    <td>${kode || "-"}</td>
    <td>${name}</td>
    <td>${unit}</td>
    <td><input type="number" value="${koefisien}" onchange="updateKoefisien(this)"></td>
    <td>Rp ${price.toLocaleString()}</td>
    <td>${lokasi || "-"}</td>
    <td>${sumber_data || "-"}</td>
    <td>Rp ${total.toLocaleString()}</td>
  `;
  tableBody.appendChild(row);

  ipcRenderer.send("add-pricing", {
    ahs_id: selectedAhsId,
    material_id: selectedMaterialId,
    quantity: koefisien,
    koefisien: koefisien,
    userId,
  });

  closeSearchMaterialModal();
  updateTotals(); // Update chart after adding new material
}

// Handle successful pricing addition
ipcRenderer.on("pricing-added", (event, response) => {
  if (response && response.error) {
    alert("Error: " + response.error);
    console.error("Error adding pricing:", response.error);
  } else {
    console.log("Material added successfully");
    // Refresh pricing data
    const userId = checkAuth();
    if (userId) {
      console.log("Requesting fresh pricing data...");
      ipcRenderer.send("get-pricing", { ahsId: selectedAhsId, userId });
    }
  }
});

function updateKoefisien(input) {
  const userId = checkAuth();
  if (!userId) return;

  const row = input.closest("tr");
  if (!row) return;

  // Normalisasi format angka
  const materialPrice = parseFloat(
    row.dataset.materialPrice.toString().replace(/,/g, "")
  );
  const newKoefisien = parseFloat(input.value.toString().replace(/,/g, "."));
  const newTotal = materialPrice * newKoefisien;

  // Update total cell immediately dengan format yang benar
  const totalCell = row.cells[8]; // Index 8 for total column
  totalCell.textContent = `Rp ${Number(newTotal.toFixed(2)).toLocaleString()}`;

  // Update chart after total change
  updateTotals();

  // Get pricing ID from dataset
  const pricingId = row.dataset.pricingId;
  if (!pricingId) return;

  ipcRenderer.send("update-pricing", {
    pricing_id: parseInt(pricingId, 10),
    ahs_id: parseInt(selectedAhsId, 10),
    koefisien: newKoefisien,
    userId,
  });
}

// Handle pricing update response
ipcRenderer.on("pricing-updated", (event, response) => {
  if (response && response.error) {
    alert("Error: " + response.error);
    // Refresh pricing data on error to ensure UI is in sync
    const userId = checkAuth();
    if (userId) {
      ipcRenderer.send("get-pricing", { ahsId: selectedAhsId, userId });
    }
  } else {
    // Update chart after successful update
    updateTotals();
  }
});

function initializeMaterialTable() {
  const materialTable = document.getElementById("materialDetails");
  materialTable.addEventListener("click", (e) => {
    const row = e.target.closest("tr");
    if (!row) return;

    document.querySelectorAll("#materialDetails tr").forEach((r) => {
      r.classList.remove("selected");
    });

    row.classList.add("selected");
  });
}

function deleteMaterial() {
  const userId = checkAuth();
  if (!userId) return;

  const selectedRow = document.querySelector("#materialDetails tr.selected");
  if (!selectedRow) {
    alert("Silakan pilih bahan/upah yang akan dihapus");
    return;
  }

  const pricingId = selectedRow.dataset.pricingId;
  if (pricingId) {
    // Remove row immediately for better UX
    selectedRow.remove();

    // Update chart before server response
    updateTotals();
    console.log("Chart updated after row removal");

    // Send delete request to server
    ipcRenderer.send("delete-pricing", { id: parseInt(pricingId, 10), userId });
  }
}

ipcRenderer.on("pricing-deleted", (event, response) => {
  if (response && response.error) {
    alert("Gagal menghapus: " + response.error);
  } else {
    // Update chart and totals first
    updateTotals();
    updateTaxProfitTotals();
    // Then get fresh pricing data
    const userId = checkAuth();
    if (userId) {
      ipcRenderer.send("get-pricing", { ahsId: selectedAhsId, userId });
    }
  }
});

function editKoefisien() {
  const selectedRow = document.querySelector("#materialDetails tr.selected");
  if (!selectedRow) {
    alert("Silakan pilih bahan/upah yang akan diedit");
    return;
  }

  const koefisienInput = selectedRow.querySelector('input[type="number"]');
  koefisienInput.focus();
}

function logout() {
  localStorage.removeItem("userId");
  window.location.href = "login.html";
}

function goBack() {
  window.location.href = "index.html";
}

// Import Modal Functions
function openImportModal() {
  const modal = document.getElementById("importExcelModal");
  modal.style.display = "block";
  document.getElementById("importProgress").style.display = "none";
  document.getElementById("importResults").style.display = "none";
}

function closeImportModal() {
  const modal = document.getElementById("importExcelModal");
  if (importInProgress) {
    if (!confirm("Import sedang berlangsung. Anda yakin ingin membatalkan?")) {
      return;
    }
  }
  modal.style.display = "none";
  importInProgress = false;
}

async function startImport() {
  if (importInProgress) return;

  const userId = checkAuth();
  if (!userId) return;

  try {
    // Request file path from main process
    const result = await ipcRenderer.invoke("show-excel-dialog");
    if (!result.filePath) {
      return; // User cancelled file selection
    }

    importInProgress = true;
    const progressBar = document.getElementById("importProgressBar");
    const importProgress = document.getElementById("importProgress");
    const importResults = document.getElementById("importResults");
    const importSummary = document.getElementById("importSummary");

    importProgress.style.display = "block";
    importResults.style.display = "none";
    progressBar.style.width = "0%";

    // Start Excel analysis
    const workbook = new ExcelJS.Workbook();
    progressBar.style.width = "20%";

    // Use selected file path
    await workbook.xlsx.readFile(result.filePath);
    const worksheet = workbook.getWorksheet("Sheet1");

    if (!worksheet) {
      throw new Error("Could not find Sheet1");
    }

    progressBar.style.width = "40%";

    let currentAHS = null;
    let currentSection = null;
    let ahsList = [];

    // Process Excel data
    worksheet.eachRow((row, rowNumber) => {
      const values = row.values;
      if (!values || values.length === 0) return;

      const id = values[1] ? values[1].toString().trim() : "";
      const sectionOrCode = values[2] ? values[2].toString().trim() : "";
      const uraian = values[3] ? values[3].toString().trim() : "";
      const kode = values[4] ? values[4].toString().trim() : "";

      // Check for AHS header
      if (sectionOrCode && sectionOrCode.match(/^A\.\d+/)) {
        if (currentAHS) {
          ahsList.push(currentAHS);
        }
        currentAHS = {
          kode_ahs: sectionOrCode.trim(),
          description: uraian,
          tenaga: [],
          bahan: [],
          peralatan: [],
        };
        currentSection = null;
        return;
      }

      if (!currentAHS) return;
      if (uraian === "No" || uraian === "No." || kode === "Kode") return;

      // Check for section headers
      if (sectionOrCode === "A" && uraian === "TENAGA") {
        currentSection = "tenaga";
        return;
      } else if (sectionOrCode === "B" && uraian === "BAHAN") {
        currentSection = "bahan";
        return;
      } else if (sectionOrCode === "C" && uraian === "PERALATAN") {
        currentSection = "peralatan";
        return;
      }

      if (!currentSection || !uraian) return;

      const item = {
        id: id,
        uraian: uraian,
        kode: kode,
        satuan: values[5]?.toString() || "",
        koefisien: values[6] ? parseFloat(values[6].toString()) : 0,
      };

      if (item.uraian) {
        switch (currentSection) {
          case "tenaga":
            currentAHS.tenaga.push(item);
            break;
          case "bahan":
            currentAHS.bahan.push(item);
            break;
          case "peralatan":
            currentAHS.peralatan.push(item);
            break;
        }
      }
    });

    if (currentAHS) {
      ahsList.push(currentAHS);
    }

    progressBar.style.width = "60%";

    // Process the imported data
    let stats = {
      total: 0,
      matched: 0,
      notFound: 0,
    };

    // Send data to main process for database operations
    ipcRenderer.send("import-ahs-data", {
      ahsList,
      userId,
    });

    // Handle import result
    const importResult = await new Promise((resolve) => {
      ipcRenderer.once("import-ahs-complete", (event, result) => {
        resolve(result);
      });
    });

    progressBar.style.width = "100%";

    // Display results
    importResults.style.display = "block";
    importSummary.innerHTML = `
      <p>Import selesai:</p>
      <ul>
        <li>Total AHS: ${importResult.totalAhs}</li>
        <li>Berhasil diimpor: ${importResult.imported}</li>
        <li>Gagal: ${importResult.failed}</li>
      </ul>
    `;

    // Display error report if available
    if (importResult.errorReport) {
      document.getElementById("errorReport").innerHTML =
        importResult.errorReport;
    }

    importInProgress = false;
  } catch (error) {
    console.error("Import error:", error);
    const importSummary = document.getElementById("importSummary");
    importSummary.innerHTML = `
      <p style="color: var(--error);">Error saat import:</p>
      <p>${error.message}</p>
    `;
    importInProgress = false;
  }
}

// Function to calculate and update cost breakdown
// Fungsi untuk update total dengan PPN dan Profit
function updateTaxProfitTotals() {
  const baseTotal =
    parseFloat(
      document.getElementById("total-value").textContent.replace(/\./g, "")
    ) || 0;
  const profitPercentage =
    parseFloat(document.getElementById("profit-select").value) || 0;

  const profitAmount = calculateProfit(baseTotal, profitPercentage);
  const totalAfterProfit = baseTotal + profitAmount;
  const ppnAmount = calculatePPN(totalAfterProfit);
  const grandTotal = totalAfterProfit + ppnAmount;

  document.getElementById("profit-value").textContent = formatRupiah(
    Math.round(profitAmount)
  );
  document.getElementById("ppn-value").textContent = formatRupiah(
    Math.round(ppnAmount)
  );
  document.getElementById("grand-total-value").textContent = formatRupiah(
    Math.round(grandTotal)
  );
}

// Fungsi untuk menyimpan total setelah PPN dan profit
function saveTotalAfterTaxProfit() {
  const userId = checkAuth();
  if (!userId || !selectedAhsId) {
    alert("Pilih AHS terlebih dahulu");
    return;
  }

  const grandTotal =
    parseFloat(
      document
        .getElementById("grand-total-value")
        .textContent.replace(/\./g, "")
    ) || 0;
  const profitPercentage =
    parseFloat(document.getElementById("profit-select").value) || 0;

  // Kirim ke main process untuk update database
  ipcRenderer.send("update-tax-profit", {
    ahs_id: selectedAhsId,
    ppn_percentage: 11,
    profit_percentage: profitPercentage,
    total_after_tax_profit: grandTotal,
    userId,
  });

  alert("Total berhasil disimpan!");
}

function updateTotals() {
  console.log("Starting updateTotals...");

  const chartElement = document.getElementById("cost-chart");
  chartElement.style.display = "block";

  // Get all rows and verify
  const allRows = document.querySelectorAll("#materialDetails tr");
  console.log(`Found ${allRows.length} rows to process`);

  // Add event listener untuk profit select jika belum ada
  const profitSelect = document.getElementById("profit-select");
  if (!profitSelect.hasAttribute("data-listener-attached")) {
    profitSelect.addEventListener("change", updateTaxProfitTotals);
    profitSelect.setAttribute("data-listener-attached", "true");
  }
  let dataTotals = {
    bahan: 0,
    upah: 0,
    alat: 0,
  };

  // Debug start of calculation
  console.log("Starting row calculations");

  // Calculate totals from the last cell (total) of each row
  allRows.forEach((row, index) => {
    const category = row.cells[0].textContent.toLowerCase();
    // Get and parse total value with detailed logging
    const rawValue = row.cells[8].textContent;
    console.log("Processing row:", {
      rowCategory: category,
      rawValue: rawValue,
    });

    // Normalisasi format angka:
    // 1. Hapus "Rp" dan spasi
    // 2. Ganti koma ribuan dengan temporer placeholder
    // 3. Ganti titik desimal dengan koma
    // 4. Kembalikan koma ribuan menjadi kosong
    const totalText = rawValue
      .replace(/Rp\s?/g, "")
      .replace(/,/g, "COMMA")
      .replace(/\./g, ",")
      .replace(/COMMA/g, "")
      .replace(/\s/g, "");

    const total = parseFloat(totalText.replace(/,/g, ".")) || 0;

    console.log("Parsed value:", {
      category,
      cleaned: totalText,
      parsed: total,
      originalHtml: row.cells[8].innerHTML,
    });

    // Debug total calculation
    console.log(
      `Category: ${category}, Raw Text: ${row.cells[8].textContent}, Parsed: ${total}`
    );

    // Add to appropriate category
    if (category.includes("bahan")) dataTotals.bahan += total;
    else if (category.includes("upah")) dataTotals.upah += total;
    else if (category.includes("alat")) dataTotals.alat += total;
  });

  // Log subtotals before final calculation
  console.log("Category totals:", {
    bahan: dataTotals.bahan,
    upah: dataTotals.upah,
    alat: dataTotals.alat,
  });

  const grandTotal = dataTotals.bahan + dataTotals.upah + dataTotals.alat;
  console.log("Grand total calculated:", grandTotal);

  // Update values and bars
  if (grandTotal > 0) {
    const formatRupiah = (num) => {
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    // Update values with proper formatting
    document.getElementById("bahan-value").textContent = formatRupiah(
      dataTotals.bahan
    );
    document.getElementById("upah-value").textContent = formatRupiah(
      dataTotals.upah
    );
    document.getElementById("alat-value").textContent = formatRupiah(
      dataTotals.alat
    );
    document.getElementById("total-value").textContent =
      formatRupiah(grandTotal);

    // Update PPN dan Profit setelah total diupdate
    updateTaxProfitTotals();

    // Debug total values before updating bars
    console.log("Totals:", {
      bahan: dataTotals.bahan,
      upah: dataTotals.upah,
      alat: dataTotals.alat,
      grand: grandTotal,
    });

    // Update bars with animation
    ["bahan", "upah", "alat"].forEach((type) => {
      const value = dataTotals[type];
      const percentage =
        value > 0 ? ((value / grandTotal) * 100).toFixed(1) : "0.0";
      const bar = document.getElementById(`${type}-bar`);

      // Debug calculation
      console.log(`Processing ${type}:`, {
        currentValue: value,
        totalValue: grandTotal,
        calculatedPercentage: (value / grandTotal) * 100,
        formattedPercentage: percentage,
      });

      // Set color and transition
      const colors = {
        bahan: "#8b5cf6",
        upah: "#a78bfa",
        alat: "#c4b5fd",
      };

      // Apply styles
      bar.style.transition = "width 0.3s ease-out";
      bar.style.backgroundColor = colors[type];
      bar.style.width = percentage + "%";

      // Update percentage text
      bar.querySelector(".percentage").textContent = percentage + "%";

      // Verify bar update
      console.log(`${type} bar updated:`, {
        width: bar.style.width,
        color: bar.style.backgroundColor,
        text: bar.querySelector(".percentage").textContent,
      });
    });

    // Always show total as 100%
    document.getElementById("total-bar").style.width = "100%";
    document
      .getElementById("total-bar")
      .querySelector(".percentage").textContent = "100%";
  }
}

// Add CSS for selected row
const style = document.createElement("style");
style.textContent = `
    #materialDetails tr.selected {
      background-color: #e0e7ff !important;
    }
  `;
document.head.appendChild(style);

// Function to delete all pricing data
async function deleteAllPricing() {
  const userId = checkAuth();
  if (!userId) return;

  if (!selectedAhsId) {
    alert("Silakan pilih AHS terlebih dahulu");
    return;
  }

  if (
    !confirm("Anda yakin ingin menghapus semua data pricing untuk AHS ini?")
  ) {
    return;
  }

  try {
    // Send delete request to server
    ipcRenderer.send("delete-all-pricing", {
      ahs_id: selectedAhsId,
      userId,
    });

    // Clear table
    const tableBody = document.getElementById("materialDetails");
    tableBody.innerHTML = "";

    // Update chart
    updateTotals();
  } catch (error) {
    console.error("Error deleting all pricing:", error);
    alert("Gagal menghapus data: " + error.message);
  }
}

// Handle delete all pricing response
ipcRenderer.on("all-pricing-deleted", (event, response) => {
  if (response && response.error) {
    alert("Gagal menghapus semua data: " + response.error);
  } else {
    console.log("All pricing data deleted successfully");
    // Refresh pricing data
    const userId = checkAuth();
    if (userId) {
      ipcRenderer.send("get-pricing", { ahsId: selectedAhsId, userId });
    }
  }
});
