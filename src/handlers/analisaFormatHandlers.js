const ExcelJS = require("exceljs");
const { dialog } = require("electron");

function setupAnalisaHandlers(ipcMain, db) {
  // Export in analisa format
  ipcMain.handle("export-analisa-format", async (event, { userId }) => {
    try {
      // Get all AHS data
      const ahsList = await new Promise((resolve, reject) => {
        db.all(
          "SELECT * FROM ahs WHERE user_id = ?",
          [userId],
          (err, ahsData) => {
            if (err) reject(err);
            else resolve(ahsData);
          }
        );
      });

      if (!ahsList || ahsList.length === 0) {
        throw new Error("Tidak ada data AHS untuk di-export");
      }

      // Create workbook
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "RAB System";
      workbook.created = new Date();

      // For each AHS, create a worksheet
      for (const ahs of ahsList) {
        // Get pricing data for this AHS
        const pricingData = await new Promise((resolve, reject) => {
          db.all(
            `SELECT 
              m.category,
              m.kode,
              m.name,
              m.unit,
              p.koefisien,
              m.price
            FROM pricing p
            JOIN materials m ON m.id = p.material_id
            WHERE p.ahs_id = ? AND p.user_id = ?
            ORDER BY m.category`,
            [ahs.id, userId],
            (err, rows) => {
              if (err) reject(err);
              else resolve(rows);
            }
          );
        });

        // Create worksheet for this AHS
        const worksheet = workbook.addWorksheet(
          ahs.kode_ahs.replace(/[*?:\\\/]/g, "_")
        );

        // Set columns
        worksheet.columns = [
          { width: 8 }, // No
          { width: 45 }, // Uraian
          { width: 12 }, // Kode
          { width: 10 }, // Satuan
          { width: 12 }, // Koefisien
          { width: 15 }, // Harga Satuan
          { width: 18 }, // Jumlah
        ];

        // Styles
        const styles = {
          header: {
            font: { bold: true, size: 11 },
            alignment: { horizontal: "center", vertical: "middle" },
            border: {
              top: { style: "thin" },
              left: { style: "thin" },
              bottom: { style: "thin" },
              right: { style: "thin" },
            },
            fill: {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFE0E0E0" },
            },
          },
          normal: {
            font: { size: 11 },
            alignment: { vertical: "middle" },
            border: {
              top: { style: "thin" },
              left: { style: "thin" },
              bottom: { style: "thin" },
              right: { style: "thin" },
            },
          },
          number: {
            font: { size: 11 },
            alignment: { horizontal: "right", vertical: "middle" },
            border: {
              top: { style: "thin" },
              left: { style: "thin" },
              bottom: { style: "thin" },
              right: { style: "thin" },
            },
          },
          title: {
            font: { bold: true, size: 12 },
            alignment: { horizontal: "center", vertical: "middle" },
          },
          subtotal: {
            font: { bold: true, size: 11 },
            alignment: { horizontal: "right", vertical: "middle" },
            border: {
              top: { style: "thin" },
              left: { style: "thin" },
              bottom: { style: "thin" },
              right: { style: "thin" },
            },
            fill: {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFF0F0F0" },
            },
          },
        };

        // Add AHS header rows
        const headerRow1 = worksheet.addRow([ahs.kode_ahs, ahs.ahs]);
        headerRow1.height = 30;
        worksheet.mergeCells(headerRow1.number, 1, headerRow1.number, 7);
        headerRow1.getCell(1).style = {
          ...styles.title,
          alignment: { horizontal: "center", vertical: "middle" },
        };

        const headerRow2 = worksheet.addRow([ahs.ahs]);
        headerRow2.height = 30;
        worksheet.mergeCells(headerRow2.number, 1, headerRow2.number, 7);
        headerRow2.getCell(1).style = {
          ...styles.title,
          alignment: { horizontal: "center", vertical: "middle" },
        };

        worksheet.addRow([]); // Empty row for spacing

        // Add column headers
        const columnHeaderRow1 = worksheet.addRow([
          "No",
          "Uraian",
          "Kode",
          "Satuan",
          "Koefisien",
          "Harga Satuan",
          "Jumlah",
        ]);
        columnHeaderRow1.height = 25;
        columnHeaderRow1.eachCell((cell) => {
          cell.style = styles.header;
        });

        const columnHeaderRow2 = worksheet.addRow([
          "No",
          "Uraian",
          "Kode",
          "Satuan",
          "Koefisien",
          "(Rp)",
          "Harga",
        ]);
        columnHeaderRow2.height = 25;
        columnHeaderRow2.eachCell((cell) => {
          cell.style = styles.header;
        });

        // Format settings
        const currencyFormat =
          '_-"Rp"* #,##0_-;-"Rp"* #,##0_-;_-"Rp"* "-"_-;_-@_-';
        const koefisienFormat = "0.0000";

        // Group and add data
        const categories = {
          TENAGA: pricingData.filter((p) =>
            p.category.toLowerCase().includes("upah")
          ),
          BAHAN: pricingData.filter((p) =>
            p.category.toLowerCase().includes("bahan")
          ),
          PERALATAN: pricingData.filter((p) =>
            p.category.toLowerCase().includes("alat")
          ),
        };

        // Add data for each category
        for (const [category, items] of Object.entries(categories)) {
          const categoryRow = worksheet.addRow([
            category === "TENAGA" ? "A" : category === "BAHAN" ? "B" : "C",
            category,
          ]);
          categoryRow.height = 25;
          categoryRow.eachCell((cell) => {
            cell.style = { ...styles.header, font: { bold: true, size: 11 } };
          });

          let subtotal = 0;
          items.forEach((item, index) => {
            const total = item.koefisien * item.price;
            subtotal += total;

            const dataRow = worksheet.addRow([
              index + 1,
              item.name,
              item.kode || "-",
              item.unit,
              item.koefisien,
              item.price,
              total,
            ]);

            dataRow.height = 25;
            dataRow.eachCell((cell, colNumber) => {
              cell.style = styles.normal;
              if (colNumber === 5) {
                cell.numFmt = koefisienFormat;
                cell.style = { ...styles.number };
              } else if (colNumber === 6 || colNumber === 7) {
                cell.numFmt = currencyFormat;
                cell.style = { ...styles.number };
              }
            });
          });

          const subtotalRow = worksheet.addRow([
            "JUMLAH " + category,
            "",
            "",
            "",
            "",
            "",
            subtotal,
          ]);
          subtotalRow.height = 25;
          subtotalRow.eachCell((cell, colNumber) => {
            cell.style = styles.subtotal;
            if (colNumber === 7) {
              cell.numFmt = currencyFormat;
            }
          });
        }

        worksheet.addRow([]); // Empty row before totals

        // Calculate and add totals
        const totalTenaga = categories.TENAGA.reduce(
          (sum, item) => sum + item.koefisien * item.price,
          0
        );
        const totalBahan = categories.BAHAN.reduce(
          (sum, item) => sum + item.koefisien * item.price,
          0
        );
        const totalAlat = categories.PERALATAN.reduce(
          (sum, item) => sum + item.koefisien * item.price,
          0
        );
        const total = totalTenaga + totalBahan + totalAlat;

        // Add totals section
        const addTotalRow = (label, value, style = styles.subtotal) => {
          const row = worksheet.addRow([
            label[0],
            label[1],
            "",
            "",
            label[4] || "",
            label[5] || "",
            value,
          ]);
          row.height = 25;
          row.eachCell((cell, colNumber) => {
            cell.style = style;
            if (colNumber === 7) {
              cell.numFmt = currencyFormat;
            }
          });
          return row;
        };

        // Add all total rows
        addTotalRow(["D", "Jumlah (A+B+C)", "", "", "", ""], total);

        const overhead = total * 0.1;
        addTotalRow(
          ["E", "Overhead & Profit (Maksimal 15 %)", "", "", "0.1", "x D"],
          overhead,
          styles.normal
        );

        const subtotal = total + overhead;
        addTotalRow(
          ["F", "Harga Satuan Pekerjaan (D+E)", "", "", "", ""],
          subtotal
        );

        const ppn = subtotal * 0.12;
        addTotalRow(
          ["G", "Pajak Pertambahan Nilai (PPN)", "", "", "0.12", "x F"],
          ppn,
          styles.normal
        );

        addTotalRow(["H", "TOTAL", "", "", "", ""], subtotal + ppn);
      }

      // Save workbook
      const { filePath } = await dialog.showSaveDialog({
        title: "Export Format Analisa",
        defaultPath: `analisa_format_${
          new Date().toISOString().split("T")[0]
        }.xlsx`,
        filters: [{ name: "Excel Files", extensions: ["xlsx"] }],
      });

      if (filePath) {
        await workbook.xlsx.writeFile(filePath);
        return { success: true, message: "Data berhasil diekspor" };
      } else {
        return { success: false, message: "Export dibatalkan" };
      }
    } catch (error) {
      console.error("Export analisa format error:", error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = { setupAnalisaHandlers };
