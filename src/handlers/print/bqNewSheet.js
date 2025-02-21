const ExcelJS = require("exceljs");

async function addBqNewSheet(workbook, db, userId, project) {
  const sheet = workbook.addWorksheet("BQ", {
    pageSetup: { fitToPage: true, orientation: "portrait" },
  });

  // Headers
  sheet.getCell("B2").value = "RENCANA ANGGARAN BIAYA (RAB)";

  sheet.getCell("B3").value = "NAMA PEKERJAAN";
  sheet.getCell("D3").value = ":";
  sheet.getCell("E3").value = project.name;

  sheet.getCell("B4").value = "PROVINSI";
  sheet.getCell("D4").value = ":";
  sheet.getCell("E4").value = project.location
    ? project.location.split(",")[0]
    : "";

  sheet.getCell("B5").value = "LOKASI KEGIATAN";
  sheet.getCell("D5").value = ":";
  sheet.getCell("E5").value = project.location || "";

  sheet.getCell("B6").value = "TAHUN ANGGARAN";
  sheet.getCell("D6").value = ":";
  sheet.getCell("E6").value = new Date().getFullYear();

  // Headers untuk BQ
  const headers = [
    "NO",
    "KODE",
    "JENIS PEKERJAAN",
    "DIMENSI",
    { key: "P", name: "P" },
    { key: "L", name: "L" },
    { key: "T", name: "T" },
    "VOLUME",
    "SATUAN",
    "HARGA SATUAN",
    "SUB JUMLAH",
  ];

  // Insert headers
  headers.forEach((header, i) => {
    const cell = sheet.getCell(8, i + 2);
    cell.value = typeof header === "object" ? header.name : header;
    cell.font = { bold: true };
    cell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
  });

  // Get data from database
  const bqData = await new Promise((resolve, reject) => {
    db.all(
      `
      SELECT bq.*, ahs.kode_ahs, ahs.ahs, 
             (SELECT SUM(m.price * p.koefisien) 
              FROM pricing p 
              JOIN materials m ON p.material_id = m.id 
              WHERE p.ahs_id = bq.ahs_id AND p.user_id = bq.user_id) as harga_satuan
      FROM bq 
      INNER JOIN ahs ON bq.ahs_id = ahs.id
      WHERE bq.user_id = ?
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
  let currentRow = 9;
  let totalSum = 0;

  bqData.forEach((item, index) => {
    let dimensions;
    try {
      dimensions = JSON.parse(item.dimensions || "{}");
    } catch (e) {
      dimensions = {};
    }

    sheet.getCell(currentRow, 2).value = index + 1;
    sheet.getCell(currentRow, 3).value = item.kode_ahs;
    sheet.getCell(currentRow, 4).value = item.ahs;
    sheet.getCell(currentRow, 5).value = item.shape;
    sheet.getCell(currentRow, 6).value = dimensions.p || "";
    sheet.getCell(currentRow, 7).value = dimensions.l || "";
    sheet.getCell(currentRow, 8).value = dimensions.t || "";
    sheet.getCell(currentRow, 9).value = item.volume;
    sheet.getCell(currentRow, 10).value = item.satuan;
    sheet.getCell(currentRow, 11).value = item.harga_satuan || 0;
    sheet.getCell(currentRow, 12).value =
      item.volume * (item.harga_satuan || 0);

    totalSum += item.volume * (item.harga_satuan || 0);
    currentRow++;
  });

  // Add total
  sheet.getCell(currentRow + 1, 4).value = "JUMLAH";
  sheet.getCell(currentRow + 1, 12).value = totalSum;
  sheet.getCell(currentRow + 1, 12).numFmt = "#,##0.00";

  // Set column widths
  sheet.getColumn(2).width = 5; // NO
  sheet.getColumn(3).width = 15; // KODE
  sheet.getColumn(4).width = 40; // JENIS PEKERJAAN
  sheet.getColumn(5).width = 15; // DIMENSI
  sheet.getColumn(6).width = 8; // P
  sheet.getColumn(7).width = 8; // L
  sheet.getColumn(8).width = 8; // T
  sheet.getColumn(9).width = 10; // VOLUME
  sheet.getColumn(10).width = 10; // SATUAN
  sheet.getColumn(11).width = 15; // HARGA SATUAN
  sheet.getColumn(12).width = 15; // SUB JUMLAH

  return sheet;
}

module.exports = { addBqNewSheet };
