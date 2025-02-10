const { STYLES, BORDERS, CURRENCY_FORMAT } = require("./styles");

async function addSummarySheet(workbook, db, userId, project) {
  return new Promise((resolve, reject) => {
    if (!userId) {
      reject(new Error("User ID is required"));
      return;
    }

    const sheet = workbook.addWorksheet("Rekapitulasi");

    // Add project header (3 rows)
    sheet.mergeCells("A1:C1");
    sheet.mergeCells("A2:C2");
    sheet.mergeCells("A3:C3");

    const headerFont = { bold: true, size: 14, color: { argb: "1A4F7C" } };

    const projNameCell = sheet.getCell("A1");
    projNameCell.value = project.name;
    projNameCell.font = headerFont;
    projNameCell.alignment = { horizontal: "center", vertical: "middle" };

    const projLocCell = sheet.getCell("A2");
    projLocCell.value = project.location;
    projLocCell.font = headerFont;
    projLocCell.alignment = { horizontal: "center", vertical: "middle" };

    const projFundCell = sheet.getCell("A3");
    projFundCell.value = project.funding;
    projFundCell.font = headerFont;
    projFundCell.alignment = { horizontal: "center", vertical: "middle" };

    sheet.getRow(1).height = 30;
    sheet.getRow(2).height = 30;
    sheet.getRow(3).height = 30;

    // Add a blank row for spacing
    sheet.getRow(4).height = 15;

    // Set columns
    sheet.columns = [
      { header: "No.", key: "no", width: 8 },
      { header: "Uraian", key: "uraian", width: 50 },
      { header: "Jumlah (Rp)", key: "jumlah", width: 25 },
    ];

    // Add title at row 5
    sheet.mergeCells("A5:C5");
    const titleCell = sheet.getCell("A5");
    titleCell.value = "REKAPITULASI RENCANA ANGGARAN BIAYA";
    titleCell.font = { bold: true, size: 14, color: { argb: "FFFFFF" } };
    titleCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "1A4F7C" },
    };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    sheet.getRow(5).height = 30;

    // Style header row at row 6
    const headerRow = sheet.getRow(6);
    headerRow.height = 25;
    headerRow.eachCell((cell) => {
      Object.assign(cell, STYLES.header);
      cell.border = BORDERS;
    });

    // Get material total
    const materialQuery = `
            SELECT SUM(m.price * p.koefisien) as total
            FROM pricing p
            JOIN materials m ON p.material_id = m.id
            WHERE LOWER(m.category) != 'upah'
            AND p.user_id = ?
            AND m.user_id = ?
        `;

    // Get wage total
    const wageQuery = `
            SELECT SUM(m.price * p.koefisien) as total
            FROM pricing p
            JOIN materials m ON p.material_id = m.id
            WHERE LOWER(m.category) = 'upah'
            AND p.user_id = ?
            AND m.user_id = ?
        `;

    let currentRow = 7; // Start after header rows

    // Get both totals
    Promise.all([
      new Promise((resolve, reject) => {
        db.get(materialQuery, [userId, userId], (err, result) => {
          if (err) reject(err);
          else resolve(result?.total || 0);
        });
      }),
      new Promise((resolve, reject) => {
        db.get(wageQuery, [userId, userId], (err, result) => {
          if (err) reject(err);
          else resolve(result?.total || 0);
        });
      }),
    ])
      .then(([materialTotal, wageTotal]) => {
        // Add material row
        const materialRow = sheet.getRow(currentRow++);
        materialRow.values = ["1", "Biaya Material", materialTotal];
        materialRow.height = 25;
        materialRow.eachCell((cell) => {
          cell.border = BORDERS;
          cell.alignment = { vertical: "middle" };
          if (cell.col === 3) {
            cell.numFmt = CURRENCY_FORMAT;
          }
        });

        // Add wage row
        const wageRow = sheet.getRow(currentRow++);
        wageRow.values = ["2", "Biaya Upah", wageTotal];
        wageRow.height = 25;
        wageRow.eachCell((cell) => {
          cell.border = BORDERS;
          cell.alignment = { vertical: "middle" };
          if (cell.col === 3) {
            cell.numFmt = CURRENCY_FORMAT;
          }
        });

        // Add subtotal
        const subtotal = materialTotal + wageTotal;
        currentRow++;
        const subtotalRow = sheet.getRow(currentRow++);
        sheet.mergeCells(`A${currentRow - 1}:B${currentRow - 1}`);
        subtotalRow.getCell(1).value = "Jumlah";
        subtotalRow.getCell(3).value = subtotal;
        subtotalRow.getCell(3).numFmt = CURRENCY_FORMAT;
        subtotalRow.eachCell((cell) => {
          Object.assign(cell, STYLES.totalRow);
          cell.border = BORDERS;
        });

        // Add overhead cost (10%)
        const overhead = subtotal * 0.1;
        const overheadRow = sheet.getRow(currentRow++);
        sheet.mergeCells(`A${currentRow - 1}:B${currentRow - 1}`);
        overheadRow.getCell(1).value = "Profit (10%)";
        overheadRow.getCell(3).value = overhead;
        overheadRow.getCell(3).numFmt = CURRENCY_FORMAT;
        overheadRow.eachCell((cell) => {
          cell.border = BORDERS;
          cell.alignment = { vertical: "middle" };
        });

        // Add PPN 14%
        const ppn = (subtotal + overhead) * 0.14;
        const ppnRow = sheet.getRow(currentRow++);
        sheet.mergeCells(`A${currentRow - 1}:B${currentRow - 1}`);
        ppnRow.getCell(1).value = "PPN (14%)";
        ppnRow.getCell(3).value = ppn;
        ppnRow.getCell(3).numFmt = CURRENCY_FORMAT;
        ppnRow.eachCell((cell) => {
          cell.border = BORDERS;
          cell.alignment = { vertical: "middle" };
        });

        // Add grand total
        currentRow++;
        const grandTotal = subtotal + overhead + ppn;
        const grandTotalRow = sheet.getRow(currentRow);
        sheet.mergeCells(`A${currentRow}:B${currentRow}`);
        grandTotalRow.getCell(1).value = "TOTAL";
        grandTotalRow.getCell(3).value = grandTotal;
        grandTotalRow.getCell(3).numFmt = CURRENCY_FORMAT;
        grandTotalRow.height = 30;
        grandTotalRow.eachCell((cell) => {
          Object.assign(cell, {
            ...STYLES.header,
            fill: {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "1A4F7C" },
            },
          });
          cell.border = BORDERS;
        });

        // Add note
        currentRow += 2;
        const noteRow = sheet.getRow(currentRow);
        sheet.mergeCells(`A${currentRow}:C${currentRow}`);
        noteRow.getCell(1).value =
          "Terbilang: " + numberToWords(grandTotal) + " Rupiah";
        noteRow.getCell(1).font = { italic: true };
        noteRow.height = 25;

        resolve();
      })
      .catch(reject);
  });
}

// Helper function to convert number to words in Indonesian
function numberToWords(num) {
  const digits = [
    "",
    "Satu",
    "Dua",
    "Tiga",
    "Empat",
    "Lima",
    "Enam",
    "Tujuh",
    "Delapan",
    "Sembilan",
  ];
  const multipliers = ["", "Ribu", "Juta", "Milyar", "Trilyun"];

  if (num === 0) return "Nol";

  let str = Math.floor(num).toString();
  let result = "";
  let groupIndex = 0;

  while (str.length > 0) {
    const group = str.slice(-3);
    str = str.slice(0, -3);

    if (parseInt(group) !== 0) {
      let groupResult = "";

      // Handle hundreds
      if (group.length === 3) {
        if (group[0] === "1") {
          groupResult += "Seratus ";
        } else if (group[0] !== "0") {
          groupResult += digits[parseInt(group[0])] + " Ratus ";
        }
      }

      // Handle tens and ones
      if (group.length >= 2) {
        const tens = parseInt(group.slice(-2));
        if (tens >= 10 && tens < 20) {
          if (tens === 10) {
            groupResult += "Sepuluh ";
          } else if (tens === 11) {
            groupResult += "Sebelas ";
          } else {
            groupResult += digits[tens - 10] + " Belas ";
          }
        } else {
          if (group.slice(-2, -1) !== "0") {
            groupResult += digits[parseInt(group.slice(-2, -1))] + " Puluh ";
          }
          if (group.slice(-1) !== "0") {
            groupResult += digits[parseInt(group.slice(-1))] + " ";
          }
        }
      } else if (group.length === 1 && group !== "0") {
        groupResult += digits[parseInt(group)] + " ";
      }

      if (groupIndex > 0) {
        groupResult += multipliers[groupIndex] + " ";
      }

      result = groupResult + result;
    }

    groupIndex++;
  }

  return result.trim();
}

module.exports = { addSummarySheet };
