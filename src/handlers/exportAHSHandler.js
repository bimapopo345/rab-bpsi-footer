const ExcelJS = require("exceljs");
const { dialog } = require("electron");

async function setupExportAHSHandler(ipcMain, db) {
  ipcMain.handle("export-all-ahs", async (event, { userId }) => {
    try {
      // Get save file path
      const { filePath } = await dialog.showSaveDialog({
        title: "Export Excel",
        defaultPath: "rincian-ahs-export.xlsx",
        filters: [{ name: "Excel Files", extensions: ["xlsx"] }],
      });

      if (!filePath) {
        return { success: false, message: "Export dibatalkan" };
      }

      // Get all AHS data
      const ahsItems = await new Promise((resolve, reject) => {
        db.all(
          `
          SELECT ahs.*, 
                 GROUP_CONCAT(DISTINCT m.category) as categories
          FROM ahs
          LEFT JOIN pricing p ON p.ahs_id = ahs.id
          LEFT JOIN materials m ON m.id = p.material_id
          WHERE ahs.user_id = ?
          GROUP BY ahs.id
          ORDER BY ahs.kode_ahs
        `,
          [userId],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
          }
        );
      });

      // Create new workbook
      const workbook = new ExcelJS.Workbook();

      const worksheet = workbook.addWorksheet("Sheet1");

      // Set default styles
      worksheet.properties.defaultRowHeight = 20;

      // Set default number format
      worksheet.columns = [
        { width: 8 }, // No
        { width: 40 }, // Uraian
        { width: 12 }, // Kode
        { width: 10 }, // Satuan
        { width: 12, numFmt: "0.000" }, // Koefisien
        { width: 15, numFmt: "#,##0" }, // Harga Satuan
        { width: 15, numFmt: "#,##0" }, // Jumlah
      ];

      // For each AHS
      for (let i = 0; i < ahsItems.length; i++) {
        const ahs = ahsItems[i];
        const startRow = i * 25 + 1; // Space for each AHS section

        // Get pricing details
        const pricingDetails = await new Promise((resolve, reject) => {
          db.all(
            `
            SELECT 
              m.category,
              m.kode as material_kode,
              m.name as material_name,
              m.unit,
              p.koefisien,
              m.price,
              m.lokasi,
              m.sumber_data,
              p.koefisien * m.price as total
            FROM pricing p
            INNER JOIN materials m ON m.id = p.material_id
            WHERE p.ahs_id = ? AND p.user_id = ?
            ORDER BY m.category, m.name
          `,
            [ahs.id, userId],
            (err, rows) => {
              if (err) reject(err);
              else resolve(rows || []);
            }
          );
        });

        // Group by category
        const groupedPricing = {
          tenaga: pricingDetails.filter((p) =>
            p.category.toLowerCase().includes("tenaga")
          ),
          bahan: pricingDetails.filter((p) =>
            p.category.toLowerCase().includes("bahan")
          ),
          peralatan: pricingDetails.filter((p) =>
            p.category.toLowerCase().includes("alat")
          ),
        };

        // Add AHS header
        worksheet.mergeCells(startRow, 1, startRow, 8);
        const headerCell = worksheet.getCell(startRow, 1);
        headerCell.value = `${ahs.kode_ahs} - ${ahs.ahs}`;
        headerCell.font = { bold: true };
        headerCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFE2EFDA" },
        };

        // Add column headers
        const headerRow = worksheet.getRow(startRow + 1);
        headerRow.values = [
          "No",
          "Uraian",
          "Kode",
          "Satuan",
          "Koefisien",
          "Harga Satuan",
          "Jumlah",
        ];
        headerRow.font = { bold: true };
        headerRow.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFE8E8E8" },
        };
        headerRow.alignment = { vertical: "middle", horizontal: "center" };

        // Add borders to header
        headerRow.eachCell((cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });

        let currentRow = startRow + 2;

        // Add sections
        currentRow = addSection(
          worksheet,
          "TENAGA",
          groupedPricing.tenaga,
          currentRow
        );
        currentRow = addSection(
          worksheet,
          "BAHAN",
          groupedPricing.bahan,
          currentRow
        );
        currentRow = addSection(
          worksheet,
          "PERALATAN",
          groupedPricing.peralatan,
          currentRow
        );

        // Add totals with styling
        const totalRow = currentRow;
        const totalRowStyle = {
          font: { bold: true },
          fill: {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFAFAFA" },
          },
        };

        // Set total row values and style
        const totalRowCells = worksheet.getRow(totalRow);
        totalRowCells.getCell(1).value = "D";
        totalRowCells.getCell(2).value = "Jumlah (A+B+C)";
        const totalCell = totalRowCells.getCell(7);
        totalCell.value = {
          formula: `SUM(G${startRow + 3}:G${currentRow - 1})`,
        };
        totalCell.numFmt = "#,##0";

        // Apply style to total row
        totalRowCells.eachCell((cell) => {
          Object.assign(cell, totalRowStyle);
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });

        // Add overhead with styling
        const overheadRow = totalRow + 1;
        const overheadRowCells = worksheet.getRow(overheadRow);
        overheadRowCells.getCell(1).value = "E";
        overheadRowCells.getCell(2).value = "Overhead & Profit (Maksimal 15 %)";
        overheadRowCells.getCell(4).value = "Overhead & Profit (Maksimal 15 %)";
        const overheadPercentCell = overheadRowCells.getCell(5);
        overheadPercentCell.value = 0.1; // 10%
        overheadPercentCell.numFmt = "0%";
        overheadRowCells.getCell(6).value = "x D";
        const overheadCell = overheadRowCells.getCell(7);
        overheadCell.value = {
          formula: `G${totalRow}*0.1`,
        };
        overheadCell.numFmt = "#,##0";

        // Apply style to overhead row
        overheadRowCells.eachCell((cell) => {
          cell.alignment = { horizontal: "left" };
          cell.font = { size: 11 };
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });

        // Add total + overhead with styling
        const subtotalRow = overheadRow + 1;
        const subtotalRowCells = worksheet.getRow(subtotalRow);
        subtotalRowCells.getCell(1).value = "F";
        subtotalRowCells.getCell(2).value = "Harga Satuan Pekerjaan (D+E)";
        const subtotalCell = subtotalRowCells.getCell(7);
        subtotalCell.value = {
          formula: `G${totalRow}+G${overheadRow}`,
        };
        subtotalCell.numFmt = "#,##0";

        // Apply style to subtotal row
        const subtotalStyle = {
          font: { bold: true },
          fill: {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF2F2F2" },
          },
        };

        subtotalRowCells.eachCell((cell) => {
          Object.assign(cell, subtotalStyle);
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });

        // Add PPN with styling
        const ppnRow = subtotalRow + 1;
        const ppnRowCells = worksheet.getRow(ppnRow);
        ppnRowCells.getCell(1).value = "G";
        ppnRowCells.getCell(2).value = "Pajak Pertambahan Nilai (PPN)";
        ppnRowCells.getCell(3).value = 0.12; // 12%
        ppnRowCells.getCell(4).value = "x F";
        const ppnCell = ppnRowCells.getCell(7);
        ppnCell.value = {
          formula: `G${subtotalRow}*0.12`,
        };
        ppnCell.numFmt = "#,##0";

        // Apply style to PPN row
        ppnRowCells.eachCell((cell) => {
          cell.font = { size: 11 };
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
          if (cell.col === 3) {
            cell.numFmt = "0%";
          }
        });

        // Add grand total
        const grandTotalRow = ppnRow + 1;
        // Set grand total row values and style
        const grandTotalRowCells = worksheet.getRow(grandTotalRow);
        grandTotalRowCells.getCell(1).value = "H";
        grandTotalRowCells.getCell(2).value = "TOTAL";
        const grandTotalCell = grandTotalRowCells.getCell(7);
        grandTotalCell.value = {
          formula: `G${subtotalRow}+G${ppnRow}`,
        };
        grandTotalCell.numFmt = "#,##0";

        // Apply special style to grand total row
        const grandTotalStyle = {
          font: { bold: true, color: { argb: "FF000000" } },
          fill: {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFE2EFDA" },
          },
        };

        grandTotalRowCells.eachCell((cell) => {
          Object.assign(cell, grandTotalStyle);
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "double" },
            right: { style: "thin" },
          };
        });
      }

      // Auto-fit columns
      worksheet.columns.forEach((column) => {
        column.width = 15;
      });
      worksheet.getColumn(2).width = 40; // Uraian column wider

      // Save workbook
      await workbook.xlsx.writeFile(filePath);

      return {
        success: true,
        message: `File berhasil disimpan di: ${filePath}`,
        filePath,
      };
    } catch (error) {
      console.error("Error exporting AHS:", error);
      return {
        success: false,
        message: `Error saat export: ${error.message}`,
      };
    }
  });
}

function addSection(worksheet, title, items, startRow) {
  // Add section title with styling
  const titleRow = worksheet.getRow(startRow);
  titleRow.getCell(1).value = title.charAt(0);
  titleRow.getCell(2).value = title;
  titleRow.font = { bold: true };
  titleRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF2F2F2" },
  };

  let currentRow = startRow + 1;
  let totalSectionPrice = 0;

  // Add items
  items.forEach((item, index) => {
    const row = worksheet.getRow(currentRow);
    row.values = [
      index + 1,
      item.material_name,
      item.material_kode || "-",
      item.unit,
      item.koefisien,
      item.price,
      item.total,
    ];
    totalSectionPrice += item.total;

    // Add borders to data row
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    currentRow++;
  });

  return currentRow + 1;
}

module.exports = { setupExportAHSHandler };
