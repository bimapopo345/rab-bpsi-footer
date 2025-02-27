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

    // Style AHS header
    [2, 3].forEach((col) => {
      const cell = sheet.getCell(currentRow, col);
      cell.font = { name: "Arial Narrow", size: 10, bold: true };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      cell.alignment = { horizontal: "left", vertical: "middle" };
    });

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
      cell.font = { name: "Arial Narrow", size: 10, bold: true };
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
      const categoryCell = sheet.getCell(currentRow, 2);
      categoryCell.value = String.fromCharCode(64 + itemNo); // A, B, C, etc.
      categoryCell.font = { name: "Arial Narrow", size: 10 };

      const categoryNameCell = sheet.getCell(currentRow, 3);
      categoryNameCell.value = category.toUpperCase();
      categoryNameCell.font = { name: "Arial Narrow", size: 10, bold: true };
      categoryNameCell.alignment = { horizontal: "left", vertical: "middle" };

      // Apply border style and merge cells for category header
      for (let col = 2; col <= 8; col++) {
        const cell = sheet.getCell(currentRow, col);
        const topStyle = itemNo === 1 ? "thin" : "none"; // Only first category has top border
        cell.border = {
          top: { style: topStyle },
          left: { style: "thin" },
          bottom: { style: "none" },
          right: { style: "thin" },
        };
      }
      sheet.mergeCells(`C${currentRow}:H${currentRow}`);

      currentRow++;

      // Write materials in this category
      materials.forEach((item, index) => {
        // Set values
        sheet.getCell(currentRow, 2).value = index + 1;
        sheet.getCell(currentRow, 3).value = item.name;
        sheet.getCell(currentRow, 4).value = item.sumber_data || "-";
        sheet.getCell(currentRow, 5).value = item.unit;
        sheet.getCell(currentRow, 6).value = item.koefisien;
        sheet.getCell(currentRow, 7).value = item.price;
        sheet.getCell(currentRow, 8).value = item.koefisien * item.price;
        sheet.getCell(currentRow, 8).numFmt = "#,##0.00";

        // Apply styling to each cell in the row
        for (let col = 2; col <= 8; col++) {
          const cell = sheet.getCell(currentRow, col);
          cell.font = { name: "Arial Narrow", size: 10 };
          cell.border = {
            top: { style: "none" },
            left: { style: "thin" },
            bottom: { style: "none" },
            right: { style: "thin" },
          };
          if (col === 3) {
            cell.alignment = { horizontal: "left", vertical: "middle" };
          } else {
            cell.alignment = { horizontal: "center", vertical: "middle" };
          }
        }
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

      // Style for Jumlah row
      [7, 8].forEach((col) => {
        const cell = sheet.getCell(currentRow, col);
        cell.font = { name: "Arial Narrow", size: 10, bold: true };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
        cell.alignment = { horizontal: "center", vertical: "middle" };
      });

      currentRow++;
      itemNo++;
    }

    // Add total
    const total = pricingData.reduce(
      (sum, item) => sum + item.koefisien * item.price,
      0
    );
    sheet.getCell(currentRow, 2).value = "TOTAL";
    sheet.getCell(currentRow, 8).value = total;
    sheet.getCell(currentRow, 8).numFmt = "#,##0.00";

    // Style for TOTAL row
    for (let col = 2; col <= 8; col++) {
      const cell = sheet.getCell(currentRow, col);
      cell.font = { name: "Arial Narrow", size: 10, bold: true };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      if (col === 2) {
        cell.alignment = { horizontal: "left", vertical: "middle" };
      } else {
        cell.alignment = { horizontal: "center", vertical: "middle" };
      }
    }
    currentRow++;

    const profitPercent =
      pricingData.length > 0 ? pricingData[0].profit_percentage : 0;
    const ppnPercent =
      pricingData.length > 0 ? pricingData[0].ppn_percentage : 0;

    // Calculate Overhead & Profit
    const profitValue = total * (profitPercent / 100);
    sheet.getCell(
      currentRow,
      2
    ).value = `Overhead & Profit (${profitPercent}%)`;
    sheet.getCell(currentRow, 8).value = profitValue;
    sheet.getCell(currentRow, 8).numFmt = "#,##0.00";

    // Style Overhead & Profit row
    for (let col = 2; col <= 8; col++) {
      const cell = sheet.getCell(currentRow, col);
      cell.font = { name: "Arial Narrow", size: 10, bold: true };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      if (col === 2) {
        cell.alignment = { horizontal: "left", vertical: "middle" };
      } else {
        cell.alignment = { horizontal: "center", vertical: "middle" };
      }
    }
    currentRow++;

    // Calculate PPN
    const ppnValue = (total + profitValue) * (ppnPercent / 100);
    sheet.getCell(currentRow, 2).value = `PPN (${ppnPercent}%)`;
    sheet.getCell(currentRow, 8).value = ppnValue;
    sheet.getCell(currentRow, 8).numFmt = "#,##0.00";

    // Style PPN row
    for (let col = 2; col <= 8; col++) {
      const cell = sheet.getCell(currentRow, col);
      cell.font = { name: "Arial Narrow", size: 10, bold: true };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      if (col === 2) {
        cell.alignment = { horizontal: "left", vertical: "middle" };
      } else {
        cell.alignment = { horizontal: "center", vertical: "middle" };
      }
    }
    currentRow++;

    // Final Harga Satuan Pekerjaan
    const finalPrice = total + profitValue + ppnValue;
    sheet.getCell(currentRow, 2).value = "Harga Satuan Pekerjaan";
    sheet.getCell(currentRow, 8).value = finalPrice;
    sheet.getCell(currentRow, 8).numFmt = "#,##0.00";

    // Style Harga Satuan Pekerjaan row
    for (let col = 2; col <= 8; col++) {
      const cell = sheet.getCell(currentRow, col);
      cell.font = { name: "Arial Narrow", size: 10, bold: true };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      if (col === 2) {
        cell.alignment = { horizontal: "left", vertical: "middle" };
      } else {
        cell.alignment = { horizontal: "center", vertical: "middle" };
      }
    }

    // Merge cells for total, profit, ppn, and harga satuan rows - make them wider
    for (let row = currentRow - 3; row <= currentRow; row++) {
      sheet.mergeCells(`B${row}:G${row}`);

      // Get the merged cell for the description
      const descCell = sheet.getCell(row, 2);
      descCell.alignment = { horizontal: "left", vertical: "middle" };

      // Style the value cell
      const valueCell = sheet.getCell(row, 8);
      valueCell.alignment = { horizontal: "right", vertical: "middle" };
    }

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
