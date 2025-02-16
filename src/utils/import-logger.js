// Kelas untuk mengelola log import
class ImportLogger {
  constructor() {
    this.errors = {
      materials: [],
      ahs: [],
    };
  }

  // Menambahkan error material
  addMaterialError(materialName) {
    if (!this.errors.materials.includes(materialName)) {
      this.errors.materials.push(materialName);
    }
  }

  // Menambahkan error AHS
  addAHSError(ahsCode) {
    if (!this.errors.ahs.includes(ahsCode)) {
      this.errors.ahs.push(ahsCode);
    }
  }

  // Membuat HTML untuk tabel error
  generateErrorTable() {
    const style = `
      <style>
        .import-error-table {
          width: 100%;
          border-collapse: collapse;
          margin: 10px 0;
          font-family: Arial, sans-serif;
        }
        .import-error-table th, .import-error-table td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        .import-error-table th {
          background-color: #f2f2f2;
          font-weight: bold;
        }
        .import-error-table tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        .import-error-table tr:hover {
          background-color: #f5f5f5;
        }
        .error-summary {
          margin-bottom: 20px;
        }
      </style>
    `;

    let html = style;

    // Tabel ringkasan
    html += `
      <div class="error-summary">
        <h3>Ringkasan Import</h3>
        <table class="import-error-table">
          <tr>
            <th>Kategori</th>
            <th>Jumlah Error</th>
          </tr>
          <tr>
            <td>Material</td>
            <td>${this.errors.materials.length}</td>
          </tr>
          <tr>
            <td>AHS</td>
            <td>${this.errors.ahs.length}</td>
          </tr>
        </table>
      </div>
    `;

    // Tabel detail error
    html += `
      <h3>Detail Item Tidak Ditemukan</h3>
      <table class="import-error-table">
        <tr>
          <th>No</th>
          <th>Tipe</th>
          <th>Nama Item</th>
        </tr>
    `;

    // Menambahkan material errors
    this.errors.materials.forEach((material, index) => {
      html += `
        <tr>
          <td>${index + 1}</td>
          <td>Material</td>
          <td>${material}</td>
        </tr>
      `;
    });

    // Menambahkan AHS errors
    this.errors.ahs.forEach((ahs, index) => {
      html += `
        <tr>
          <td>${this.errors.materials.length + index + 1}</td>
          <td>AHS</td>
          <td>${ahs}</td>
        </tr>
      `;
    });

    html += `
      </table>
    `;

    return html;
  }

  // Reset errors
  reset() {
    this.errors.materials = [];
    this.errors.ahs = [];
  }

  // Mendapatkan jumlah total error
  getTotalErrors() {
    return this.errors.materials.length + this.errors.ahs.length;
  }
}

module.exports = new ImportLogger();
