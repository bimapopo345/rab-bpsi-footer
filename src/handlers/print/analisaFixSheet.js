const ExcelJS = require("exceljs");

async function addAnalisaFixSheet(workbook, db, userId, project) {
  const sheet = workbook.addWorksheet("Analisa_FIX", {
    pageSetup: { fitToPage: true, orientation: "portrait" },
  });

  // Get all AHS data
  const ahsData = await new Promise((resolve, reject) => {
    db.all(
      `SELECT * FROM ahs WHERE user_id = ? ORDER BY kode_ahs`,
      [userId],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });

  let currentRow = 1;

  // Process each AHS
  for (const ahs of ahsData) {
    // Write AHS header
    sheet.getCell(currentRow, 2).value = ahs.kode_ahs;
    sheet.getCell(currentRow, 3).value = ahs.ahs;
    sheet.mergeCells(`C${currentRow}:F${currentRow}`);

    currentRow++;

    // Column headers
    const headers = [
      "No",
      "Uraian",
      "Kode",
      "Satuan",
      "Koefisien",
      "Harga Satuan",
      "Jumlah",
    ];
    headers.forEach((header, i) => {
      const cell = sheet.getCell(currentRow, i + 2);
      cell.value = header;
      cell.font = { bold: true };
      cell.alignment = {
        vertical: "middle",
        horizontal: "center",
        wrapText: true,
      };
    });

    currentRow++;

    // Get pricing data for this AHS
    const pricingData = await new Promise((resolve, reject) => {
      db.all(
        `
        SELECT p.*, m.name, m.unit, m.price, m.category
        FROM pricing p
        JOIN materials m ON p.material_id = m.id
        WHERE p.ahs_id = ? AND p.user_id = ?
        ORDER BY m.category
        `,
        [ahs.id, userId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    // Group materials by category
    const groupedMaterials = pricingData.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {});

    // Write grouped materials
    let itemNo = 1;
    for (const [category, materials] of Object.entries(groupedMaterials)) {
      // Write category header
      sheet.getCell(currentRow, 2).value = String.fromCharCode(64 + itemNo); // A, B, C, etc.
      sheet.getCell(currentRow, 3).value = category.toUpperCase();
      sheet.getCell(currentRow, 3).font = { bold: true };
      currentRow++;

      // Write materials in this category
      materials.forEach((item, index) => {
        sheet.getCell(currentRow, 2).value = index + 1;
        sheet.getCell(currentRow, 3).value = item.name;
        sheet.getCell(currentRow, 4).value = item.kode || "-";
        sheet.getCell(currentRow, 5).value = item.unit;
        sheet.getCell(currentRow, 6).value = item.koefisien;
        sheet.getCell(currentRow, 7).value = item.price;
        sheet.getCell(currentRow, 8).value = item.koefisien * item.price;
        sheet.getCell(currentRow, 8).numFmt = "#,##0.00";
        currentRow++;
      });

      // Calculate subtotal for category
      const subtotal = materials.reduce(
        (sum, item) => sum + item.koefisien * item.price,
        0
      );
      sheet.getCell(currentRow, 7).value = "Jumlah " + category.toUpperCase();
      sheet.getCell(currentRow, 8).value = subtotal;
      sheet.getCell(currentRow, 8).numFmt = "#,##0.00";
      sheet.getCell(currentRow, 7).font = { bold: true };
      sheet.getCell(currentRow, 8).font = { bold: true };

      currentRow++;
      itemNo++;
    }

    // Add total
    const total = pricingData.reduce(
      (sum, item) => sum + item.koefisien * item.price,
      0
    );
    sheet.getCell(currentRow, 7).value = "TOTAL";
    sheet.getCell(currentRow, 8).value = total;
    sheet.getCell(currentRow, 8).numFmt = "#,##0.00";
    sheet.getCell(currentRow, 7).font = { bold: true };
    sheet.getCell(currentRow, 8).font = { bold: true };

    currentRow += 2; // Add space before next AHS
  }

  // Set column widths
  sheet.getColumn(2).width = 5; // No
  sheet.getColumn(3).width = 40; // Uraian
  sheet.getColumn(4).width = 15; // Kode
  sheet.getColumn(5).width = 10; // Satuan
  sheet.getColumn(6).width = 12; // Koefisien
  sheet.getColumn(7).width = 15; // Harga Satuan
  sheet.getColumn(8).width = 15; // Jumlah

  return sheet;
}

module.exports = { addAnalisaFixSheet };
