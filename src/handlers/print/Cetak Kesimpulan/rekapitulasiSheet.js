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
  sheet.getCell("B2").font = { name: "Arial", bold: true, size: 16 };
  sheet.getCell("B2").alignment = { horizontal: "center" };
  sheet.mergeCells("B2:G2");

  sheet.getCell("B3").value = "RENCANA ANGGARAN BIAYA (RAB)";
  sheet.getCell("B3").font = { name: "Arial", bold: true, size: 16 };
  sheet.getCell("B3").alignment = { horizontal: "center" };
  sheet.mergeCells("B3:G3");

  // Project Info
  const projectInfo = [
    { label: "NAMA PEKERJAAN", value: project.name, wrap: true },
    {
      label: "PROVINSI",
      value: project.location
        ? project.location.split(",")[0].trim()
        : "KALIMANTAN UTARA",
    },
    {
      label: "LOKASI KEGIATAN",
      value: project.location
        ? project.location.split(",")[0].trim()
        : "KALIMANTAN UTARA",
    },
    { label: "TAHUN ANGGARAN", value: new Date().getFullYear() },
  ];

  projectInfo.forEach((info, idx) => {
    const row = idx + 5;
    // Label
    sheet.getCell(`B${row}`).value = info.label;
    sheet.getCell(`B${row}`).font = { name: "Arial", size: 10 };
    // Colon
    sheet.getCell(`D${row}`).value = ":";
    sheet.getCell(`D${row}`).font = { name: "Arial", size: 10 };
    // Value
    sheet.getCell(`E${row}`).value = info.value;
    sheet.getCell(`E${row}`).font = { name: "Arial", size: 10 };
    if (info.wrap) {
      sheet.getCell(`E${row}`).alignment = { wrapText: true };
    }
  });

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

  // Table headers
  const headers = ["NO", "URAIAN PEKERJAAN", "JUMLAH"];
  headers.forEach((header, i) => {
    const cell = sheet.getCell(10, i + 2);
    cell.value = header;
    cell.font = { name: "Arial", bold: true, size: 10 };
    cell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
    // Add borders
    cell.border = {
      top: { style: "medium" },
      bottom: { style: "double" },
      left: i === 0 ? { style: "medium" } : { style: "thin" },
      right: i === headers.length - 1 ? { style: "medium" } : { style: "thin" },
    };
  });

  let currentRow = 11;
  let totalSum = 0;
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  // Write subprojects
  subprojectsData.forEach((item, index) => {
    const rowNum = currentRow;

    const cells = [
      {
        col: 2,
        value: alphabet[index] + ".",
        font: { name: "Arial", bold: true, size: 11 },
      },
      {
        col: 3,
        value: item.name.toUpperCase(),
        font: { name: "Arial", bold: true, size: 10 },
      },
      {
        col: 4,
        value: item.total_price || 0,
        font: { name: "Arial", bold: true, size: 10 },
      },
    ];

    cells.forEach((cellInfo, idx) => {
      const cell = sheet.getCell(rowNum, cellInfo.col);
      cell.value = cellInfo.value;
      cell.font = cellInfo.font;
      if (idx === 2) {
        cell.numFmt = '"Rp"#,##0';
      }
      // Add borders
      cell.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: idx === 0 ? { style: "medium" } : { style: "thin" },
        right:
          idx === cells.length - 1 ? { style: "medium" } : { style: "thin" },
      };
    });

    totalSum += item.total_price || 0;
    currentRow++;
  });

  // Add total with medium borders
  currentRow += 1;
  sheet.getCell(currentRow, 2).border = {
    top: { style: "medium" },
    bottom: { style: "medium" },
    left: { style: "medium" },
  };

  const totalCell = sheet.getCell(currentRow, 3);
  totalCell.value = "TOTAL PEKERJAAN";
  totalCell.font = { name: "Arial", bold: true, size: 10 };
  totalCell.border = {
    top: { style: "medium" },
    bottom: { style: "medium" },
  };

  const sumCell = sheet.getCell(currentRow, 4);
  sumCell.value = totalSum;
  sumCell.numFmt = '"Rp"#,##0';
  sumCell.font = { name: "Arial", bold: true, size: 10 };
  sumCell.border = {
    top: { style: "medium" },
    bottom: { style: "medium" },
    right: { style: "medium" },
  };

  // Add terbilang in italics
  currentRow += 2;
  const terbilang = await formatTerbilang(Math.floor(totalSum));
  const terbilangLabelCell = sheet.getCell(currentRow, 2);
  terbilangLabelCell.value = "TERBILANG :";
  terbilangLabelCell.font = {
    name: "Arial",
    bold: true,
    italic: true,
    size: 10,
  };

  const terbilangValueCell = sheet.getCell(currentRow, 3);
  terbilangValueCell.value = terbilang + " RUPIAH";
  terbilangValueCell.font = {
    name: "Arial",
    bold: true,
    italic: true,
    size: 10,
  };
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
