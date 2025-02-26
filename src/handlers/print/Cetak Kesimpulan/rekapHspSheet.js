const ExcelJS = require("exceljs");

async function addRekapHspSheet(workbook, db, userId, project) {
  const sheet = workbook.addWorksheet("Rekap HSP", {
    pageSetup: { fitToPage: true, orientation: "portrait" },
  });

  // Title
  const titleCell = sheet.getCell("D1");
  titleCell.value = "DAFTAR HARGA SATUAN PEKERJAAN";
  titleCell.font = { name: "Arial", size: 14, bold: true };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  sheet.mergeCells("D1:E1");

  // Subtitle
  const subtitleCell = sheet.getCell("D2");
  subtitleCell.value = project.name;
  subtitleCell.font = { name: "Arial", size: 10, bold: true };
  subtitleCell.alignment = {
    horizontal: "center",
    vertical: "middle",
    wrapText: true,
  };
  sheet.mergeCells("D2:E2");

  // Skip some rows
  const tableStartRow = 4;

  // Headers untuk tabel
  const headers = [
    "NO",
    "KODE",
    "JENIS PEKERJAAN",
    "DAFTAR HARGA SATUAN PEKERJAAN",
  ];

  // Insert headers
  headers.forEach((header, i) => {
    const cell = sheet.getCell(tableStartRow, i + 2);
    cell.value = header;
    cell.font = { name: "Arial Narrow", size: 10, bold: true };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };
    cell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  // Get data from database
  const ahsData = await new Promise((resolve, reject) => {
    db.all(
      `
      SELECT ahs.*, 
             (SELECT SUM(m.price * p.koefisien) 
              FROM pricing p 
              JOIN materials m ON p.material_id = m.id 
              WHERE p.ahs_id = ahs.id AND p.user_id = ahs.user_id) as harga_satuan
      FROM ahs
      WHERE ahs.user_id = ?
      ORDER BY ahs.kode_ahs
      `,
      [userId],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });

  // Insert data
  let currentRow = tableStartRow + 1;

  ahsData.forEach((item, index) => {
    // NO
    const noCell = sheet.getCell(currentRow, 2);
    noCell.value = index + 1;
    noCell.font = { name: "Arial Narrow", size: 10 };
    noCell.alignment = { horizontal: "center", vertical: "middle" };
    noCell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };

    // KODE
    const kodeCell = sheet.getCell(currentRow, 3);
    kodeCell.value = item.kode_ahs;
    kodeCell.font = { name: "Arial Narrow", size: 10 };
    kodeCell.alignment = { horizontal: "left", vertical: "middle" };
    kodeCell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };

    // JENIS PEKERJAAN
    const jenisCell = sheet.getCell(currentRow, 4);
    jenisCell.value = item.ahs;
    jenisCell.font = { name: "Arial Narrow", size: 10 };
    jenisCell.alignment = {
      horizontal: "left",
      vertical: "middle",
      wrapText: true,
    };
    jenisCell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };

    // HARGA SATUAN
    const hargaCell = sheet.getCell(currentRow, 5);
    hargaCell.value = item.harga_satuan || 0;
    hargaCell.font = { name: "Arial Narrow", size: 10 };
    hargaCell.alignment = { horizontal: "right", vertical: "middle" };
    hargaCell.numFmt = '_-"Rp"* #,##0_-;-"Rp"* #,##0_-;_-"Rp"* "-"_-;_-@_-';
    hargaCell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };

    currentRow++;
  });

  // Set column widths
  sheet.getColumn(2).width = 5; // NO
  sheet.getColumn(3).width = 15; // KODE
  sheet.getColumn(4).width = 40; // JENIS PEKERJAAN
  sheet.getColumn(5).width = 20; // HARGA SATUAN

  // Auto-fit rows
  sheet.eachRow((row) => {
    row.height = row.height * 1.2; // Add some padding
  });

  return sheet;
}

module.exports = { addRekapHspSheet };
