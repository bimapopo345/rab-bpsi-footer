const ExcelJS = require("exceljs");

async function formatTerbilang(number) {
  // Fungsi untuk mengkonversi angka ke terbilang dalam Bahasa Indonesia
  const bilangan = [
    "",
    "SATU",
    "DUA",
    "TIGA",
    "EMPAT",
    "LIMA",
    "ENAM",
    "TUJUH",
    "DELAPAN",
    "SEMBILAN",
    "SEPULUH",
    "SEBELAS",
  ];

  if (number < 12) {
    return bilangan[number];
  } else if (number < 20) {
    return bilangan[number - 10] + " BELAS";
  } else if (number < 100) {
    return (
      bilangan[Math.floor(number / 10)] + " PULUH " + bilangan[number % 10]
    );
  } else if (number < 200) {
    return "SERATUS " + (await formatTerbilang(number - 100));
  } else if (number < 1000) {
    return (
      bilangan[Math.floor(number / 100)] +
      " RATUS " +
      (await formatTerbilang(number % 100))
    );
  } else if (number < 2000) {
    return "SERIBU " + (await formatTerbilang(number - 1000));
  } else if (number < 1000000) {
    return (
      (await formatTerbilang(Math.floor(number / 1000))) +
      " RIBU " +
      (await formatTerbilang(number % 1000))
    );
  } else if (number < 1000000000) {
    return (
      (await formatTerbilang(Math.floor(number / 1000000))) +
      " JUTA " +
      (await formatTerbilang(number % 1000000))
    );
  } else if (number < 1000000000000) {
    return (
      (await formatTerbilang(Math.floor(number / 1000000000))) +
      " MILIAR " +
      (await formatTerbilang(number % 1000000000))
    );
  }
  return "";
}

async function addRekapitulasiSheet(workbook, db, userId, project) {
  const sheet = workbook.addWorksheet("Rekapitulasi", {
    pageSetup: { fitToPage: true, orientation: "portrait" },
  });

  // Headers
  sheet.getCell("B2").value = "REKAPITULASI";
  sheet.getCell("B2").font = { bold: true, size: 14 };
  sheet.getCell("B2").alignment = { horizontal: "center" };
  sheet.mergeCells("B2:G2");

  sheet.getCell("B3").value = "RENCANA ANGGARAN BIAYA (RAB)";
  sheet.getCell("B3").font = { bold: true, size: 14 };
  sheet.getCell("B3").alignment = { horizontal: "center" };
  sheet.mergeCells("B3:G3");

  // Project Info
  sheet.getCell("B5").value = "NAMA PEKERJAAN";
  sheet.getCell("D5").value = ":";
  sheet.getCell("E5").value =
    "SURVEI, INVESTIGASI DAN DESAIN (SID)\nOPTIMASI LAHAN RAWA UNTUK PENGEMBANGAN PERTANIAN";
  sheet.getCell("E5").alignment = { wrapText: true };

  sheet.getCell("B6").value = "PROVINSI";
  sheet.getCell("D6").value = ":";
  sheet.getCell("E6").value = project.location
    ? project.location.split(",")[0].trim()
    : "KALIMANTAN UTARA";

  sheet.getCell("B7").value = "LOKASI KEGIATAN";
  sheet.getCell("D7").value = ":";
  sheet.getCell("E7").value = "BULUNGAN";

  sheet.getCell("B8").value = "TAHUN ANGGARAN";
  sheet.getCell("D8").value = ":";
  sheet.getCell("E8").value = new Date().getFullYear();

  // Get subprojects data
  const subprojectsData = await new Promise((resolve, reject) => {
    db.all(
      `SELECT s.*, 
              (SELECT SUM(bq.total_price)
               FROM bq 
               WHERE bq.subproject_id = s.id 
               AND bq.user_id = s.user_id) as total_price
       FROM subprojects s
       WHERE s.user_id = ?
       ORDER BY s.name`,
      [userId],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });

  // Headers untuk tabel
  const headers = ["NO", "URAIAN PEKERJAAN", "JUMLAH"];
  headers.forEach((header, i) => {
    const cell = sheet.getCell(10, i + 2);
    cell.value = header;
    cell.font = { bold: true };
    cell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
  });

  let currentRow = 11;
  let totalSum = 0;
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  // Write subprojects
  subprojectsData.forEach((item, index) => {
    const rowNum = currentRow;

    sheet.getCell(rowNum, 2).value = alphabet[index] + ".";
    sheet.getCell(rowNum, 3).value = item.name.toUpperCase();
    sheet.getCell(rowNum, 4).value = item.total_price || 0;
    sheet.getCell(rowNum, 4).numFmt = '"Rp"#,##0';

    totalSum += item.total_price || 0;
    currentRow++;
  });

  // Add total
  currentRow += 1;
  sheet.getCell(currentRow, 3).value = "TOTAL PEKERJAAN";
  sheet.getCell(currentRow, 3).font = { bold: true };
  sheet.getCell(currentRow, 4).value = totalSum;
  sheet.getCell(currentRow, 4).numFmt = '"Rp"#,##0';
  sheet.getCell(currentRow, 4).font = { bold: true };

  // Add terbilang
  currentRow += 2;
  const terbilang = await formatTerbilang(Math.floor(totalSum));
  sheet.getCell(currentRow, 2).value = "TERBILANG :";
  sheet.getCell(currentRow, 3).value = terbilang + " RUPIAH";
  sheet.getCell(currentRow, 3).font = { bold: true };
  sheet.mergeCells(`C${currentRow}:G${currentRow}`);

  // Set column widths
  sheet.getColumn(2).width = 5; // NO
  sheet.getColumn(3).width = 40; // URAIAN PEKERJAAN
  sheet.getColumn(4).width = 20; // JUMLAH

  // Style cells
  ["B5", "B6", "B7", "B8"].forEach((cell) => {
    sheet.getCell(cell).font = { bold: true };
  });

  return sheet;
}

module.exports = { addRekapitulasiSheet };
