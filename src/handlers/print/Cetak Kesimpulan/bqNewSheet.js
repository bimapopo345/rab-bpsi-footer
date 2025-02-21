const ExcelJS = require("exceljs");

async function addBqNewSheet(workbook, db, userId, project) {
  const sheet = workbook.addWorksheet("BQ", {
    pageSetup: { fitToPage: true, orientation: "portrait" },
  });

  // Headers
  const headers = [
    "NO",
    "URAIAN PEKERJAAN",
    "VOLUME",
    "SAT",
    "HARGA\nSATUAN (Rp)",
    "JUMLAH\nHARGA (Rp)",
  ];

  // Add formula explanation
  sheet.mergeCells("A2:F2");
  sheet.getCell("A2").value = "1 2 3 4 5 6 = 3 x 5";
  sheet.getCell("A2").alignment = { horizontal: "center" };

  // Insert headers
  headers.forEach((header, i) => {
    const cell = sheet.getCell(1, i + 1);
    cell.value = header;
    cell.font = { bold: true, size: 11 };
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

  // Get subprojects data with their BQs
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

  let currentRow = 3;
  let totalSum = 0;
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  // Process each subproject
  for (let subIdx = 0; subIdx < subprojectsData.length; subIdx++) {
    const subproject = subprojectsData[subIdx];

    // Write subproject header
    sheet.getCell(currentRow, 1).value = alphabet[subIdx];
    sheet.getCell(currentRow, 2).value = subproject.name.toUpperCase();
    sheet.getCell(currentRow, 2).font = { bold: true };
    sheet.getCell(currentRow, 2).alignment = { horizontal: "left" };
    // Merge cells for category header
    sheet.mergeCells(`B${currentRow}:F${currentRow}`);
    currentRow++;

    // Get BQs for this subproject
    const bqData = await new Promise((resolve, reject) => {
      db.all(
        `SELECT bq.*, ahs.ahs as uraian, 
                (SELECT SUM(m.price * p.koefisien * (1 + p.profit_percentage/100) * (1 + p.ppn_percentage/100)) 
                 FROM pricing p 
                 JOIN materials m ON p.material_id = m.id 
                 WHERE p.ahs_id = bq.ahs_id AND p.user_id = bq.user_id) as harga_satuan
         FROM bq 
         JOIN ahs ON bq.ahs_id = ahs.id
         WHERE bq.subproject_id = ? AND bq.user_id = ?
         ORDER BY bq.id`,
        [subproject.id, userId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    let subTotal = 0;

    // Write BQ items
    bqData.forEach((item, index) => {
      sheet.getCell(currentRow, 1).value = index + 1 + ".";
      sheet.getCell(currentRow, 2).value = item.uraian;
      sheet.getCell(currentRow, 2).alignment = {
        horizontal: "left",
        wrapText: true,
      };
      sheet.getCell(currentRow, 3).alignment = { horizontal: "center" };
      sheet.getCell(currentRow, 4).alignment = { horizontal: "center" };
      sheet.getCell(currentRow, 5).alignment = { horizontal: "right" };
      sheet.getCell(currentRow, 6).alignment = { horizontal: "right" };
      sheet.getCell(currentRow, 3).value = item.volume;
      sheet.getCell(currentRow, 4).value = item.satuan;
      sheet.getCell(currentRow, 5).value = item.harga_satuan || 0;
      sheet.getCell(currentRow, 6).value =
        (item.harga_satuan || 0) * item.volume;

      sheet.getCell(currentRow, 5).numFmt =
        '_-* #,##0_-;-* #,##0_-;_-* "-"_-;_-@_-';
      sheet.getCell(currentRow, 6).numFmt =
        '_-* #,##0_-;-* #,##0_-;_-* "-"_-;_-@_-';

      subTotal += (item.harga_satuan || 0) * item.volume;
      currentRow++;
    });

    // Write subtotal for subproject
    sheet.getCell(currentRow, 6).value = subTotal;
    sheet.getCell(currentRow, 6).numFmt =
      '_-* #,##0_-;-* #,##0_-;_-* "-"_-;_-@_-';
    sheet.getCell(currentRow, 6).alignment = { horizontal: "right" };
    sheet.getCell(currentRow, 6).font = { bold: true };
    currentRow++;

    if (subproject.name.toLowerCase().includes("optimalisasi")) {
      sheet.getCell(currentRow, 2).value =
        "Sub Total Pekerjaan " + alphabet[subIdx];
      sheet.getCell(currentRow, 6).value = subTotal;
      sheet.getCell(currentRow, 6).numFmt =
        '_-* #,##0_-;-* #,##0_-;_-* "-"_-;_-@_-';
      sheet.getCell(currentRow, 6).alignment = { horizontal: "right" };
      sheet.getCell(currentRow, 6).font = { bold: true };
      currentRow++;
    }

    totalSum += subTotal;
    currentRow++;
  }

  // Write total
  sheet.getCell(currentRow, 2).value = "TOTAL HARGA PEKERJAAN";
  sheet.getCell(currentRow, 2).font = { bold: true };
  sheet.getCell(currentRow, 6).value = totalSum;
  sheet.getCell(currentRow, 6).numFmt =
    '_-* #,##0_-;-* #,##0_-;_-* "-"_-;_-@_-';
  sheet.getCell(currentRow, 6).alignment = { horizontal: "right" };

  // Add borders for all data cells
  for (let row = 1; row <= currentRow; row++) {
    for (let col = 1; col <= 6; col++) {
      const cell = sheet.getCell(row, col);
      if (!cell.border) {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      }
    }
  }
  sheet.getCell(currentRow, 6).font = { bold: true };

  // Set column widths
  sheet.getColumn(1).width = 5; // NO
  sheet.getColumn(2).width = 50; // URAIAN PEKERJAAN
  sheet.getColumn(3).width = 12; // VOLUME
  sheet.getColumn(4).width = 8; // SAT
  sheet.getColumn(5).width = 15; // HARGA SATUAN
  sheet.getColumn(6).width = 18; // JUMLAH HARGA

  return sheet;
}

module.exports = { addBqNewSheet };
