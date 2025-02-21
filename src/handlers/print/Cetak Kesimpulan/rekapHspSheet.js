const ExcelJS = require("exceljs");

async function addRekapHspSheet(workbook, db, userId, project) {
  const sheet = workbook.addWorksheet("Rekap HSP", {
    pageSetup: { fitToPage: true, orientation: "portrait" },
  });

  // Headers
  sheet.getCell("D1").value = "DAFTAR HARGA SATUAN PEKERJAAN";

  sheet.getCell("D2").value = project.name;

  // Headers untuk tabel
  const headers = [
    "NO",
    "KODE",
    "JENIS PEKERJAAN",
    "DAFTAR HARGA SATUAN PEKERJAAN",
  ];

  // Insert headers
  headers.forEach((header, i) => {
    const cell = sheet.getCell(4, i + 2);
    cell.value = header;
    cell.font = { bold: true };
    cell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
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
  let currentRow = 5;

  ahsData.forEach((item, index) => {
    sheet.getCell(currentRow, 2).value = index + 1;
    sheet.getCell(currentRow, 3).value = item.kode_ahs;
    sheet.getCell(currentRow, 4).value = item.ahs;
    sheet.getCell(currentRow, 5).value = item.harga_satuan || 0;
    sheet.getCell(currentRow, 5).numFmt = "#,##0.00";

    currentRow++;
  });

  // Set column widths
  sheet.getColumn(2).width = 5; // NO
  sheet.getColumn(3).width = 15; // KODE
  sheet.getColumn(4).width = 40; // JENIS PEKERJAAN
  sheet.getColumn(5).width = 20; // HARGA SATUAN

  // Style headers
  ["D1", "D2"].forEach((cell) => {
    sheet.getCell(cell).font = { bold: true };
    sheet.getCell(cell).alignment = {
      horizontal: "center",
    };
  });

  // Merge cells untuk header
  sheet.mergeCells("D1:E1");
  sheet.mergeCells("D2:E2");

  return sheet;
}

module.exports = { addRekapHspSheet };
