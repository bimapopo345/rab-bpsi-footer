const ExcelJS = require("exceljs");

async function addRekapitulasiSheet(workbook, db, userId, project) {
  const sheet = workbook.addWorksheet("Rekapitulasi", {
    pageSetup: { fitToPage: true, orientation: "portrait" },
  });

  // Style dari contoh Excel
  sheet.getCell("B2").value = "REKAPITULASI";
  sheet.getCell("B3").value = "RENCANA ANGGARAN BIAYA (RAB)";

  sheet.getCell("B4").value = "NAMA PEKERJAAN";
  sheet.getCell("D4").value = ":";
  sheet.getCell("E4").value = project.name;

  sheet.getCell("B5").value = "PROVINSI";
  sheet.getCell("D5").value = ":";
  sheet.getCell("E5").value = project.location
    ? project.location.split(",")[0]
    : "";

  sheet.getCell("B6").value = "LOKASI KEGIATAN";
  sheet.getCell("D6").value = ":";
  sheet.getCell("E6").value = project.location || "";

  sheet.getCell("B7").value = "TAHUN ANGGARAN";
  sheet.getCell("D7").value = ":";
  sheet.getCell("E7").value = new Date().getFullYear();

  // Set kolom headers
  const headers = [
    "NO",
    "KODE",
    "JENIS PEKERJAAN",
    "VOL",
    "SAT",
    "HARGA SATUAN",
    "SUB JUMLAH",
  ];

  // Insert headers at row 9
  headers.forEach((header, i) => {
    const cell = sheet.getCell(9, i + 2);
    cell.value = header;
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
      SELECT bq.*, ahs.kode_ahs, ahs.ahs, bq.satuan
      FROM bq 
      INNER JOIN ahs ON bq.ahs_id = ahs.id
      WHERE bq.user_id = ?
    `,
      [userId],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });

  // Insert data
  let currentRow = 10;
  let totalSum = 0;

  bqData.forEach((item, index) => {
    sheet.getCell(currentRow, 2).value = index + 1;
    sheet.getCell(currentRow, 3).value = item.kode_ahs;
    sheet.getCell(currentRow, 4).value = item.ahs;
    sheet.getCell(currentRow, 5).value = item.volume;
    sheet.getCell(currentRow, 6).value = item.satuan;
    sheet.getCell(currentRow, 7).value = item.total_price / item.volume;
    sheet.getCell(currentRow, 8).value = item.total_price;

    totalSum += item.total_price;
    currentRow++;
  });

  // Add total
  sheet.getCell(currentRow + 1, 4).value = "JUMLAH";
  sheet.getCell(currentRow + 1, 8).value = totalSum;
  sheet.getCell(currentRow + 1, 8).numFmt = "#,##0.00";

  // Add PPN 11%
  sheet.getCell(currentRow + 2, 4).value = "PPN 11%";
  sheet.getCell(currentRow + 2, 8).value = totalSum * 0.11;
  sheet.getCell(currentRow + 2, 8).numFmt = "#,##0.00";

  // Add total after PPN
  sheet.getCell(currentRow + 3, 4).value = "JUMLAH TOTAL";
  sheet.getCell(currentRow + 3, 8).value = totalSum * 1.11;
  sheet.getCell(currentRow + 3, 8).numFmt = "#,##0.00";

  // Set column widths
  sheet.getColumn(2).width = 5; // NO
  sheet.getColumn(3).width = 15; // KODE
  sheet.getColumn(4).width = 40; // JENIS PEKERJAAN
  sheet.getColumn(5).width = 10; // VOL
  sheet.getColumn(6).width = 10; // SAT
  sheet.getColumn(7).width = 15; // HARGA SATUAN
  sheet.getColumn(8).width = 15; // SUB JUMLAH

  return sheet;
}

module.exports = { addRekapitulasiSheet };
