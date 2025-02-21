const ExcelJS = require("exceljs");

async function addDaftarHargaSheet(workbook, db, userId, project) {
  const sheet = workbook.addWorksheet("Daftar Harga", {
    pageSetup: { fitToPage: true, orientation: "portrait" },
  });

  // Headers
  sheet.getCell("B1").value = "DAFTAR HARGA BAHAN DAN UPAH TENAGA";

  // Table headers
  const headers = ["KODE", "JENIS BAHAN", "SATUAN", "HARGA"];

  // Insert column headers
  headers.forEach((header, i) => {
    const cell = sheet.getCell(3, i + 2);
    cell.value = header;
    cell.font = { bold: true };
    cell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
  });

  // Duplicate headers for visual consistency
  headers.forEach((header, i) => {
    sheet.getCell(2, i + 2).value = header;
    sheet.getCell(4, i + 2).value = header === "HARGA" ? "(Rp)" : "";
  });

  // Get data from database
  const materials = await new Promise((resolve, reject) => {
    db.all(
      `SELECT * FROM materials 
       WHERE user_id = ? 
       ORDER BY category, name`,
      [userId],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });

  // Group materials by category
  const groupedMaterials = materials.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  let currentRow = 6;

  // Write materials by category
  for (const [category, items] of Object.entries(groupedMaterials)) {
    // Write category header
    sheet.getCell(currentRow, 2).value = category.toUpperCase();
    sheet.getCell(currentRow, 2).font = { bold: true };
    currentRow++;

    // Write materials in this category
    items.forEach((item) => {
      sheet.getCell(currentRow, 2).value = item.kode || "-";
      sheet.getCell(currentRow, 3).value = item.name;
      sheet.getCell(currentRow, 4).value = item.unit;
      sheet.getCell(currentRow, 5).value = item.price;
      sheet.getCell(currentRow, 5).numFmt = "#,##0.00";
      currentRow++;
    });

    currentRow++; // Add space between categories
  }

  // Set column widths
  sheet.getColumn(2).width = 15; // KODE
  sheet.getColumn(3).width = 40; // JENIS BAHAN
  sheet.getColumn(4).width = 10; // SATUAN
  sheet.getColumn(5).width = 15; // HARGA

  // Style the main header
  sheet.getCell("B1").font = { bold: true };
  sheet.getCell("B1").alignment = {
    horizontal: "center",
  };
  sheet.mergeCells("B1:E1");

  return sheet;
}

module.exports = { addDaftarHargaSheet };
