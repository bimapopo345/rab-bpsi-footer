const ExcelJS = require("exceljs");

async function addDaftarHargaSheet(workbook, db, userId, project) {
  const sheet = workbook.addWorksheet("Daftar Harga", {
    pageSetup: { fitToPage: true, orientation: "portrait" },
  });

  // Title
  const titleCell = sheet.getCell("B1");
  titleCell.value = "DAFTAR HARGA BAHAN DAN UPAH TENAGA";
  titleCell.font = { name: "Arial Narrow", size: 10, bold: true, italic: true };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  sheet.mergeCells("B1:E1");

  // Table headers setup
  const headers = ["KODE", "JENIS BAHAN", "SATUAN", "HARGA"];

  // Main headers row
  headers.forEach((header, i) => {
    const cell = sheet.getCell(3, i + 2);
    cell.value = header;
    cell.font = { name: "Arial Narrow", size: 11, bold: true };
    cell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
    cell.border = {
      top: { style: "double" },
      left: i === 0 ? { style: "double" } : { style: "thin" },
      bottom: { style: "thin" },
      right: i === headers.length - 1 ? { style: "double" } : { style: "thin" },
    };
  });

  // Additional header rows for visual layout
  headers.forEach((header, i) => {
    // Upper header row
    const upperCell = sheet.getCell(2, i + 2);
    upperCell.border = {
      top: { style: "double" },
      left: i === 0 ? { style: "double" } : { style: "thin" },
      bottom: { style: "thin" },
      right: i === headers.length - 1 ? { style: "double" } : { style: "thin" },
    };

    // Lower header row (Rp)
    const lowerCell = sheet.getCell(4, i + 2);
    lowerCell.value = header === "HARGA" ? "(Rp)" : "";
    lowerCell.font = { name: "Arial Narrow", size: 11, bold: true };
    lowerCell.alignment = { horizontal: "center", vertical: "middle" };
    lowerCell.border = {
      top: { style: "thin" },
      left: i === 0 ? { style: "double" } : { style: "thin" },
      bottom: { style: "double" },
      right: i === headers.length - 1 ? { style: "double" } : { style: "thin" },
    };
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
    const categoryCell = sheet.getCell(currentRow, 2);
    categoryCell.value = category.toUpperCase();
    categoryCell.font = { name: "Arial Narrow", size: 11, bold: true };
    categoryCell.alignment = { horizontal: "left", vertical: "middle" };

    // Category row borders
    [2, 3, 4, 5].forEach((col) => {
      const cell = sheet.getCell(currentRow, col);
      cell.border = {
        top: { style: "thin" },
        left: col === 2 ? { style: "double" } : { style: "thin" },
        bottom: { style: "thin" },
        right: col === 5 ? { style: "double" } : { style: "thin" },
      };
    });

    // Merge category cells
    sheet.mergeCells(`B${currentRow}:E${currentRow}`);
    currentRow++;

    // Write materials in this category
    items.forEach((item) => {
      const cells = [
        { col: 2, value: item.kode || "-", align: "left" },
        { col: 3, value: item.name, align: "left" },
        { col: 4, value: item.unit, align: "center" },
        { col: 5, value: item.price, align: "right", numFmt: '"Rp"#,##0.00' },
      ];

      cells.forEach(({ col, value, align, numFmt }) => {
        const cell = sheet.getCell(currentRow, col);
        cell.value = value;
        cell.font = { name: "Arial Narrow", size: 11 };
        cell.alignment = { horizontal: align, vertical: "middle" };
        if (numFmt) cell.numFmt = numFmt;
        cell.border = {
          top: { style: "thin" },
          left: col === 2 ? { style: "double" } : { style: "thin" },
          bottom: { style: "thin" },
          right: col === 5 ? { style: "double" } : { style: "thin" },
        };
      });
      currentRow++;
    });

    // Add space between categories with borders
    const spacerRow = currentRow;
    [2, 3, 4, 5].forEach((col) => {
      const cell = sheet.getCell(spacerRow, col);
      cell.border = {
        top: { style: "thin" },
        left: col === 2 ? { style: "double" } : { style: "thin" },
        bottom: { style: "thin" },
        right: col === 5 ? { style: "double" } : { style: "thin" },
      };
    });
    currentRow++;
  }

  // Set column widths
  sheet.getColumn(2).width = 15; // KODE
  sheet.getColumn(3).width = 40; // JENIS BAHAN
  sheet.getColumn(4).width = 10; // SATUAN
  sheet.getColumn(5).width = 15; // HARGA

  // Auto-fit row heights
  sheet.eachRow((row) => {
    row.height = row.height * 1.2;
  });

  return sheet;
}

module.exports = { addDaftarHargaSheet };
