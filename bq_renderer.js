const { ipcRenderer } = require("electron");

let selectedAHSId = null;
let selectedAHSData = null;
let editingItemId = null;

// Get user ID from localStorage
const userId = localStorage.getItem("userId");

// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
  loadBQData();
  registerEditDimensionListeners();
});

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

// Register event listeners for edit modal dimension inputs.
function registerEditDimensionListeners() {
  const editDimensionIDs = [
    "editSisiPersegi",
    "editPanjangPersegiPanjang",
    "editLebarPersegiPanjang",
    "editSisiAtasTrapesium",
    "editSisiBawahTrapesium",
    "editTinggiTrapesium",
    "editJariLingkaran",
    "editSisiKubus",
    "editPanjangBalok",
    "editLebarBalok",
    "editTinggiBalok",
  ];
  editDimensionIDs.forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("input", calculateEditVolume);
    }
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

function closeAHSModal() {
  const modal = document.getElementById("ahsModal");
  modal.classList.remove("active");
  setTimeout(() => {
    modal.style.display = "none";
  }, 300);
}

// Select AHS and Show Shape Modal
function selectAHS(ahs) {
  selectedAHSId = ahs.id;
  selectedAHSData = ahs;
  closeAHSModal();

  const shapeModal = document.getElementById("shapeModal");
  shapeModal.style.display = "block";
  setTimeout(() => {
    shapeModal.classList.add("active");
  }, 10);
  document.getElementById("shapeSelect").value = ""; // Reset shape selection
  hideAllShapeForms();
}

// Show Form Based on Selected Shape (for add)
function showShapeForm() {
  hideAllShapeForms();
  const shape = document.getElementById("shapeSelect").value;
  if (shape) {
    document.getElementById(`${shape}Form`).classList.add("active");
  }
}

function hideAllShapeForms() {
  document.querySelectorAll(".shape-form").forEach((form) => {
    form.classList.remove("active");
  });
}

// Calculate Volume Based on Shape (for add modal)
function calculateVolume() {
  const shape = document.getElementById("shapeSelect").value;
  let volume = 0;

  switch (shape) {
    case "persegi":
      const sisi = Number(document.getElementById("sisiPersegi").value);
      volume = sisi * sisi;
      break;
    case "persegiPanjang":
      const panjang = Number(
        document.getElementById("panjangPersegiPanjang").value
      );
      const lebar = Number(
        document.getElementById("lebarPersegiPanjang").value
      );
      volume = panjang * lebar;
      break;
    case "trapesium":
      const a = Number(document.getElementById("sisiAtasTrapesium").value);
      const b = Number(document.getElementById("sisiBawahTrapesium").value);
      const h = Number(document.getElementById("tinggiTrapesium").value);
      volume = ((a + b) * h) / 2;
      break;
    case "lingkaran":
      const r = Number(document.getElementById("jariLingkaran").value);
      volume = Math.PI * r * r;
      break;
    case "kubus":
      const sisiKubus = Number(document.getElementById("sisiKubus").value);
      volume = sisiKubus * sisiKubus * sisiKubus;
      break;
    case "balok":
      const p = Number(document.getElementById("panjangBalok").value);
      const l = Number(document.getElementById("lebarBalok").value);
      const t = Number(document.getElementById("tinggiBalok").value);
      volume = p * l * t;
      break;
  }
  return volume;
}

// Calculate Volume based on Edit Modal Inputs
function calculateEditVolume() {
  const shape = document.getElementById("editShapeSelect").value;
  let volume = 0;

  switch (shape) {
    case "persegi":
      {
        const sisi = Number(document.getElementById("editSisiPersegi").value);
        volume = sisi * sisi;
      }
      break;
    case "persegiPanjang":
      {
        const panjang = Number(
          document.getElementById("editPanjangPersegiPanjang").value
        );
        const lebar = Number(
          document.getElementById("editLebarPersegiPanjang").value
        );
        volume = panjang * lebar;
      }
      break;
    case "trapesium":
      {
        const a = Number(
          document.getElementById("editSisiAtasTrapesium").value
        );
        const b = Number(
          document.getElementById("editSisiBawahTrapesium").value
        );
        const h = Number(document.getElementById("editTinggiTrapesium").value);
        volume = ((a + b) * h) / 2;
      }
      break;
    case "lingkaran":
      {
        const r = Number(document.getElementById("editJariLingkaran").value);
        volume = Math.PI * r * r;
      }
      break;
    case "kubus":
      {
        const sisiKubus = Number(
          document.getElementById("editSisiKubus").value
        );
        volume = sisiKubus * sisiKubus * sisiKubus;
      }
      break;
    case "balok":
      {
        const p = Number(document.getElementById("editPanjangBalok").value);
        const l = Number(document.getElementById("editLebarBalok").value);
        const t = Number(document.getElementById("editTinggiBalok").value);
        volume = p * l * t;
      }
      break;
  }
  document.getElementById("editVolume").value = volume;
  return volume;
}

// Calculate and Save BQ Item (for adding new item)
function calculateAndSave() {
  if (!selectedAHSId || !selectedAHSData) {
    alert("Silakan pilih AHS terlebih dahulu");
    return;
  }

  // Convert and validate total_price from the selected AHS data
  const ahsPrice = parseFloat(selectedAHSData.total_price);
  if (isNaN(ahsPrice) || ahsPrice <= 0) {
    alert(
      "AHS terpilih tidak memiliki data harga yang valid. Silakan pilih AHS yang valid."
    );
    return;
  }

  const shape = document.getElementById("shapeSelect").value;
  if (!shape) {
    alert("Silakan pilih bentuk terlebih dahulu");
    return;
  }

  const volume = calculateVolume();
  if (!volume) {
    alert("Silakan isi dimensi dengan benar");
    return;
  }

  // Get dimensions as JSON string
  const dimensions = getDimensions();

  // Calculate total price with rounding to 2 decimal places
  let totalPrice = parseFloat((volume * ahsPrice).toFixed(2));
  console.log("BQ Save Debug:", { volume, ahsPrice, totalPrice });
  if (isNaN(totalPrice) || totalPrice <= 0) {
    alert("Calculated total_price is invalid: " + totalPrice);
    return;
  }

  // Save to database - use total_price property to match backend handler and database schema.
  const bqItem = {
    userId,
    ahsId: selectedAHSId,
    shape,
    dimensions: JSON.stringify(dimensions),
    volume,
    total_price: totalPrice,
  };

  ipcRenderer.invoke("save-bq-item", bqItem).then(() => {
    closeShapeModal();
    loadBQData(); // Refresh the table
  });
}

// Get Dimensions Based on Shape (for adding new item)
function getDimensions() {
  const shape = document.getElementById("shapeSelect").value;
  switch (shape) {
    case "persegi":
      return {
        sisi: document.getElementById("sisiPersegi").value,
      };
    case "persegiPanjang":
      return {
        panjang: document.getElementById("panjangPersegiPanjang").value,
        lebar: document.getElementById("lebarPersegiPanjang").value,
      };
    case "trapesium":
      return {
        sisiAtas: document.getElementById("sisiAtasTrapesium").value,
        sisiBawah: document.getElementById("sisiBawahTrapesium").value,
        tinggi: document.getElementById("tinggiTrapesium").value,
      };
    case "lingkaran":
      return {
        jariJari: document.getElementById("jariLingkaran").value,
      };
    case "kubus":
      return {
        sisi: document.getElementById("sisiKubus").value,
      };
    case "balok":
      return {
        panjang: document.getElementById("panjangBalok").value,
        lebar: document.getElementById("lebarBalok").value,
        tinggi: document.getElementById("tinggiBalok").value,
      };
  }
}

// Create BQ Table Row with event listeners instead of inline onclick
function createBQRow(item) {
  const row = document.createElement("tr");
  row.innerHTML = `
        <td>${item.kode_ahs || "-"}</td>
        <td>${item.ahs}</td>
        <td>${formatShapeName(item.shape)}</td>
        <td>${item.volume.toFixed(2)} m<sup>2</sup></td>
        <td>Rp ${
          item.total_price ? item.total_price.toLocaleString() : "-"
        }</td>
        <td>
            <div class="action-buttons"></div>
        </td>
    `;

  const actionDiv = row.querySelector(".action-buttons");

  const btnEdit = document.createElement("button");
  btnEdit.className = "btn btn-primary btn-small";
  btnEdit.textContent = "Edit";
  btnEdit.addEventListener("click", () => {
    editBQItem(item.id, item.shape, item.dimensions, item.volume);
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

// Open Edit Modal and pre-populate edit form with item details
function editBQItem(id, shape, dimensionsStr, currentVolume) {
  editingItemId = id;
  document.getElementById("editVolume").value = currentVolume;

  // Set the shape selector
  document.getElementById("editShapeSelect").value = shape;
  showEditShapeForm();

  // Populate edit shape form with dimensions if available
  if (dimensionsStr) {
    let dims;
    try {
      dims = JSON.parse(dimensionsStr);
    } catch (e) {
      console.error("Error parsing dimensions:", e);
      dims = {};
    }
    switch (shape) {
      case "persegi":
        document.getElementById("editSisiPersegi").value = dims.sisi || "";
        break;
      case "persegiPanjang":
        document.getElementById("editPanjangPersegiPanjang").value =
          dims.panjang || "";
        document.getElementById("editLebarPersegiPanjang").value =
          dims.lebar || "";
        break;
      case "trapesium":
        document.getElementById("editSisiAtasTrapesium").value =
          dims.sisiAtas || "";
        document.getElementById("editSisiBawahTrapesium").value =
          dims.sisiBawah || "";
        document.getElementById("editTinggiTrapesium").value =
          dims.tinggi || "";
        break;
      case "lingkaran":
        document.getElementById("editJariLingkaran").value =
          dims.jariJari || "";
        break;
      case "kubus":
        document.getElementById("editSisiKubus").value = dims.sisi || "";
        break;
      case "balok":
        document.getElementById("editPanjangBalok").value = dims.panjang || "";
        document.getElementById("editLebarBalok").value = dims.lebar || "";
        document.getElementById("editTinggiBalok").value = dims.tinggi || "";
        break;
    }
  }

  // Immediately update volume based on populated values
  calculateEditVolume();

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

// Show dynamic edit shape form based on selection
function showEditShapeForm() {
  // Hide all edit shape forms
  document.querySelectorAll(".edit-shape-form").forEach((form) => {
    form.classList.remove("active");
  });
  const shape = document.getElementById("editShapeSelect").value;
  if (shape) {
    document
      .getElementById("edit" + capitalizeFirstLetter(shape) + "Form")
      .classList.add("active");
  }
}

function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Save Edited Data (shape, dimensions, and volume)
function saveEditedData() {
  const shape = document.getElementById("editShapeSelect").value;
  if (!shape) {
    alert("Silakan pilih bentuk terlebih dahulu");
    return;
  }

  // Get dimensions based on edit form
  let dimensions = {};
  switch (shape) {
    case "persegi":
      dimensions = {
        sisi: document.getElementById("editSisiPersegi").value,
      };
      break;
    case "persegiPanjang":
      dimensions = {
        panjang: document.getElementById("editPanjangPersegiPanjang").value,
        lebar: document.getElementById("editLebarPersegiPanjang").value,
      };
      break;
    case "trapesium":
      dimensions = {
        sisiAtas: document.getElementById("editSisiAtasTrapesium").value,
        sisiBawah: document.getElementById("editSisiBawahTrapesium").value,
        tinggi: document.getElementById("editTinggiTrapesium").value,
      };
      break;
    case "lingkaran":
      dimensions = {
        jariJari: document.getElementById("editJariLingkaran").value,
      };
      break;
    case "kubus":
      dimensions = {
        sisi: document.getElementById("editSisiKubus").value,
      };
      break;
    case "balok":
      dimensions = {
        panjang: document.getElementById("editPanjangBalok").value,
        lebar: document.getElementById("editLebarBalok").value,
        tinggi: document.getElementById("editTinggiBalok").value,
      };
      break;
  }

  // Compute volume using the new function based on current values.
  const volume = calculateEditVolume();
  if (!volume || volume <= 0) {
    alert("Volume harus berupa angka lebih dari 0");
    return;
  }

  // Prepare update object
  const updatedData = {
    id: editingItemId,
    shape,
    dimensions: JSON.stringify(dimensions),
    volume,
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

// Format Shape Name for display
function formatShapeName(shape) {
  const shapeNames = {
    persegi: "Persegi",
    persegiPanjang: "Persegi Panjang",
    trapesium: "Trapesium",
    lingkaran: "Lingkaran",
    kubus: "Kubus",
    balok: "Balok",
  };
  return shapeNames[shape] || shape;
}

// Close Shape Modal
function closeShapeModal() {
  const modal = document.getElementById("shapeModal");
  modal.classList.remove("active");
  setTimeout(() => {
    modal.style.display = "none";
    document.getElementById("shapeSelect").value = "";
    hideAllShapeForms();
    selectedAHSId = null;
    selectedAHSData = null;
  }, 300);
}

// Delete BQ Item
function deleteBQItem(id) {
  if (confirm("Yakin ingin menghapus item ini?")) {
    ipcRenderer.invoke("delete-bq-item", { id }).then(() => {
      loadBQData();
    });
  }
}
