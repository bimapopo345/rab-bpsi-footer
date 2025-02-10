const ExcelJS = require("exceljs");
const fs = require("fs");
const path = require("path");
const { dialog } = require("electron");

function setupExportHandlers(ipcMain, db) {
  const {
    STYLES,
    BORDERS,
    CURRENCY_FORMAT,
    addProjectHeader,
  } = require("./print/styles.js");

  // Export user data to Excel - for regular users
  ipcMain.handle("export-my-data", async (event, userId) => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "RAB System";
    workbook.created = new Date();

    try {
      // Get user and project data
      const [userData, projectData] = await Promise.all([
        new Promise((resolve, reject) => {
          db.get(
            "SELECT username FROM users WHERE id = ?",
            [userId],
            (err, user) => {
              if (err) reject(err);
              else resolve(user);
            }
          );
        }),
        new Promise((resolve, reject) => {
          db.get(
            "SELECT name, location, funding FROM projects WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
            [userId],
            (err, project) => {
              if (err) reject(err);
              else
                resolve(project || { name: "-", location: "-", funding: "-" });
            }
          );
        }),
      ]);

      // Export materials with improved formatting
      const materialsSheet = workbook.addWorksheet("Materials");

      materialsSheet.columns = [
        { header: "Nama Material", key: "name", width: 30 },
        { header: "Satuan", key: "unit", width: 15 },
        { header: "Harga", key: "price", width: 20 },
        { header: "Kategori", key: "category", width: 20 },
        { header: "Keterangan", key: "description", width: 35 },
      ];

      // Add project header at the beginning
      addProjectHeader(materialsSheet, projectData, 5); // 5 columns for materials

      // Add some spacing after the project header
      materialsSheet.addRow([]); // Empty row for spacing

      // Reset the columns to maintain header styling
      materialsSheet.columns = [
        { header: "Nama Material", key: "name", width: 30 },
        { header: "Satuan", key: "unit", width: 15 },
        { header: "Harga", key: "price", width: 20 },
        { header: "Kategori", key: "category", width: 20 },
        { header: "Keterangan", key: "description", width: 35 },
      ];

      // Move all content down by 4 rows to make space for project header
      for (let i = materialsSheet.rowCount; i > 0; i--) {
        const row = materialsSheet.getRow(i);
        const newRow = materialsSheet.getRow(i + 4);
        newRow.values = row.values;
        newRow.height = row.height;
        newRow.eachCell((cell, colNumber) => {
          const sourceCell = row.getCell(colNumber);
          cell.style = sourceCell.style;
        });
      }

      // Style header row
      materialsSheet.getRow(9).eachCell((cell) => {
        cell.style = { ...STYLES.header, border: BORDERS };
      });
      materialsSheet.getRow(9).height = 30;

      // Add data validation for categories (offset by 4 for project header)
      materialsSheet.dataValidations.add("D10:D1000", {
        type: "list",
        allowBlank: true,
        formulae: ['"Material,Upah,Alat"'],
      });

      await new Promise((resolve, reject) => {
        db.all(
          "SELECT name, unit, price, category, description FROM materials WHERE user_id = ?",
          [userId],
          (err, materials) => {
            if (err) reject(err);
            else {
              materials.forEach((material, idx) => {
                const row = materialsSheet.addRow(material);
                row.eachCell((cell) => {
                  cell.style = { ...STYLES.normal, border: BORDERS };
                  if (cell.col === 3) {
                    // Price column
                    cell.numFmt = CURRENCY_FORMAT;
                  }
                });
              });
              resolve();
            }
          }
        );
      });

      // Add helpful instructions
      materialsSheet.insertRow(5, ["Petunjuk Penggunaan:"]);
      materialsSheet.insertRow(6, [
        "1. Mohon tidak mengubah format header (baris berwarna biru)",
      ]);
      materialsSheet.insertRow(7, [
        "2. Kategori harus dipilih dari: Material, Upah, atau Alat",
      ]);
      materialsSheet.insertRow(8, [
        "3. Harga diisi dalam format angka tanpa tanda pemisah ribuan",
      ]);
      materialsSheet.insertRow(9, [""]);

      materialsSheet.mergeCells("A5:E5");
      materialsSheet.mergeCells("A6:E6");
      materialsSheet.mergeCells("A7:E7");
      materialsSheet.mergeCells("A8:E8");
      materialsSheet.getCell("A5").style = STYLES.groupHeader;
      [6, 7, 8].forEach((row) => {
        materialsSheet.getRow(row).getCell(1).style = {
          ...STYLES.normal,
          alignment: { wrapText: true },
        };
      });

      // Export AHS with improved formatting
      const ahsSheet = workbook.addWorksheet("AHS");

      ahsSheet.columns = [
        { header: "Kelompok", key: "kelompok", width: 25 },
        { header: "Kode AHS", key: "kode_ahs", width: 20 },
        { header: "Uraian AHS", key: "ahs", width: 40 },
        { header: "Satuan", key: "satuan", width: 15 },
      ];

      // Add project header at the beginning
      addProjectHeader(ahsSheet, projectData, 4); // 4 columns for AHS

      // Add some spacing after the project header
      ahsSheet.addRow([]); // Empty row for spacing

      // Reset the columns to maintain header styling
      ahsSheet.columns = [
        { header: "Kelompok", key: "kelompok", width: 25 },
        { header: "Kode AHS", key: "kode_ahs", width: 20 },
        { header: "Uraian AHS", key: "ahs", width: 40 },
        { header: "Satuan", key: "satuan", width: 15 },
      ];

      // Move all content down by 4 rows
      for (let i = ahsSheet.rowCount; i > 0; i--) {
        const row = ahsSheet.getRow(i);
        const newRow = ahsSheet.getRow(i + 4);
        newRow.values = row.values;
        newRow.height = row.height;
        newRow.eachCell((cell, colNumber) => {
          const sourceCell = row.getCell(colNumber);
          cell.style = sourceCell.style;
        });
      }

      // Style header row (offset by project header)
      ahsSheet.getRow(9).eachCell((cell) => {
        cell.style = { ...STYLES.header, border: BORDERS };
      });
      ahsSheet.getRow(9).height = 30;

      // Add instructions for AHS (after project header)
      ahsSheet.insertRow(5, ["Petunjuk Penggunaan:"]);
      ahsSheet.insertRow(6, [
        "1. Mohon tidak mengubah format header (baris berwarna biru)",
      ]);
      ahsSheet.insertRow(7, [
        "2. Kelompok diisi sesuai kategori pekerjaan (contoh: Pekerjaan Persiapan, Pekerjaan Tanah, dll)",
      ]);
      ahsSheet.insertRow(8, [
        "3. Kode AHS diisi dengan kode yang unik untuk setiap analisa harga satuan",
      ]);
      ahsSheet.insertRow(9, [""]);

      ahsSheet.mergeCells("A5:D5");
      ahsSheet.mergeCells("A6:D6");
      ahsSheet.mergeCells("A7:D7");
      ahsSheet.mergeCells("A8:D8");
      ahsSheet.getCell("A5").style = STYLES.groupHeader;
      [6, 7, 8].forEach((row) => {
        ahsSheet.getRow(row).getCell(1).style = {
          ...STYLES.normal,
          alignment: { wrapText: true },
        };
      });

      await new Promise((resolve, reject) => {
        db.all(
          "SELECT kelompok, kode_ahs, ahs, satuan FROM ahs WHERE user_id = ?",
          [userId],
          (err, ahsData) => {
            if (err) reject(err);
            else {
              ahsData.forEach((ahs) => {
                const row = ahsSheet.addRow(ahs);
                row.eachCell((cell) => {
                  cell.style = { ...STYLES.normal, border: BORDERS };
                });
              });
              resolve();
            }
          }
        );
      });

      // Export Projects with improved formatting
      const projectsSheet = workbook.addWorksheet("Projects");

      // Add project header first
      addProjectHeader(projectsSheet, projectData, 3); // 3 columns for Projects

      // Add columns after project header
      projectsSheet.columns = [
        { header: "Nama Proyek", key: "name", width: 40 },
        { header: "Lokasi", key: "location", width: 50 },
        { header: "Sumber Dana", key: "funding", width: 30 },
      ];

      // Instructions for projects (after project header)
      projectsSheet.insertRow(5, ["Petunjuk Penggunaan:"]);
      projectsSheet.insertRow(6, [
        "1. Mohon tidak mengubah format header (baris berwarna biru)",
      ]);
      projectsSheet.insertRow(7, [
        "2. Masukkan informasi proyek dengan lengkap",
      ]);
      projectsSheet.insertRow(8, [""]);

      projectsSheet.mergeCells("A5:C5");
      projectsSheet.mergeCells("A6:C6");
      projectsSheet.mergeCells("A7:C7");
      projectsSheet.getCell("A5").style = STYLES.groupHeader;
      [6, 7].forEach((row) => {
        projectsSheet.getRow(row).getCell(1).style = {
          ...STYLES.normal,
          alignment: { wrapText: true },
        };
      });

      // Style header (after project header and instructions)
      projectsSheet.getRow(9).eachCell((cell) => {
        cell.style = { ...STYLES.header, border: BORDERS };
      });
      projectsSheet.getRow(9).height = 30;

      await new Promise((resolve, reject) => {
        db.all(
          "SELECT name, location, funding FROM projects WHERE user_id = ?",
          [userId],
          (err, projects) => {
            if (err) reject(err);
            else {
              projects.forEach((project) => {
                const row = projectsSheet.addRow(project);
                row.eachCell((cell) => {
                  cell.style = { ...STYLES.normal, border: BORDERS };
                });
              });
              resolve();
            }
          }
        );
      });

      // Export Pricing with improved formatting and references
      const pricingSheet = workbook.addWorksheet("Pricing");

      // Add project header first
      addProjectHeader(pricingSheet, projectData, 4); // 4 columns for Pricing

      // Add columns after project header
      pricingSheet.columns = [
        { header: "Kode AHS", key: "ahs_kode", width: 20 },
        { header: "Nama Material", key: "material_name", width: 30 },
        { header: "Jumlah", key: "quantity", width: 15 },
        { header: "Koefisien", key: "koefisien", width: 15 },
      ];

      // Instructions for pricing (after project header)
      pricingSheet.insertRow(5, ["Petunjuk Penggunaan:"]);
      pricingSheet.insertRow(6, [
        "1. Mohon tidak mengubah format header (baris berwarna biru)",
      ]);
      pricingSheet.insertRow(7, [
        "2. Kode AHS harus sesuai dengan yang ada di sheet AHS",
      ]);
      pricingSheet.insertRow(8, [
        "3. Nama Material harus sesuai dengan yang ada di sheet Materials",
      ]);
      pricingSheet.insertRow(9, [""]);

      pricingSheet.mergeCells("A5:D5");
      pricingSheet.mergeCells("A6:D6");
      pricingSheet.mergeCells("A7:D7");
      pricingSheet.mergeCells("A8:D8");
      pricingSheet.getCell("A5").style = STYLES.groupHeader;
      [6, 7, 8].forEach((row) => {
        pricingSheet.getRow(row).getCell(1).style = {
          ...STYLES.normal,
          alignment: { wrapText: true },
        };
      });

      // Style header (after project header and instructions)
      pricingSheet.getRow(10).eachCell((cell) => {
        cell.style = { ...STYLES.header, border: BORDERS };
      });
      pricingSheet.getRow(10).height = 30;

      await new Promise((resolve, reject) => {
        db.all(
          `SELECT
            a.kode_ahs as ahs_kode,
            m.name as material_name,
            p.quantity,
            p.koefisien
          FROM pricing p
          JOIN ahs a ON p.ahs_id = a.id
          JOIN materials m ON p.material_id = m.id
          WHERE p.user_id = ?`,
          [userId],
          (err, pricing) => {
            if (err) reject(err);
            else {
              pricing.forEach((price) => {
                const row = pricingSheet.addRow(price);
                row.eachCell((cell) => {
                  cell.style = { ...STYLES.normal, border: BORDERS };
                  if (cell.col === 3 || cell.col === 4) {
                    cell.numFmt = "0.00";
                  }
                });
              });
              resolve();
            }
          }
        );
      });

      // Add Rekapitulasi sheet
      const rekapSheet = workbook.addWorksheet("Rekapitulasi");

      // Add columns first
      rekapSheet.columns = [
        { header: "Uraian", key: "uraian", width: 40 },
        { header: "Jumlah", key: "jumlah", width: 30 },
      ];

      // Add project header at the beginning
      addProjectHeader(rekapSheet, projectData, 2); // 2 columns

      // Add empty row for spacing
      rekapSheet.addRow([]);

      // Reset columns to maintain header styling
      rekapSheet.columns = [
        { header: "Uraian", key: "uraian", width: 40 },
        { header: "Jumlah", key: "jumlah", width: 30 },
      ];

      // Style header row (now at row 5 after project header)
      rekapSheet.getRow(5).height = 30;
      rekapSheet.getRow(5).eachCell((cell) => {
        cell.style = {
          ...STYLES.header,
          border: BORDERS,
          font: { ...STYLES.header.font, size: 14 }, // Larger font for headers
        };
      });

      // Calculate total from pricing data
      let subtotal = 0;
      await new Promise((resolve, reject) => {
        db.all(
          `SELECT SUM(p.koefisien * m.price) as total
           FROM pricing p
           JOIN materials m ON p.material_id = m.id
           WHERE p.user_id = ?`,
          [userId],
          (err, result) => {
            if (err) reject(err);
            else {
              subtotal = result[0]?.total || 0;
              resolve();
            }
          }
        );
      });

      // Add spacer row
      rekapSheet.addRow([]);

      // Calculate totals
      const profit = subtotal * 0.1; // 10% profit
      const subtotalPlusProfit = subtotal + profit;
      const ppn = subtotalPlusProfit * 0.14; // 14% PPN
      const total = subtotalPlusProfit + ppn;

      // Add calculated rows with proper spacing and formatting
      const subtotalRow = rekapSheet.addRow([
        "JUMLAH HARGA PEKERJAAN",
        subtotal,
      ]);
      rekapSheet.addRow([]); // Spacer
      const profitRow = rekapSheet.addRow(["KEUNTUNGAN/PROFIT 10%", profit]);
      const subTotalAfterProfitRow = rekapSheet.addRow([
        "SUB TOTAL SETELAH PROFIT",
        subtotalPlusProfit,
      ]);
      rekapSheet.addRow([]); // Spacer
      const ppnRow = rekapSheet.addRow(["PPN 14%", ppn]);
      rekapSheet.addRow([]); // Spacer
      const totalRow = rekapSheet.addRow(["TOTAL KESELURUHAN", total]);

      // Style all rows with improved formatting
      [
        subtotalRow,
        profitRow,
        subTotalAfterProfitRow,
        ppnRow,
        totalRow,
      ].forEach((row) => {
        if (!row) return; // Skip spacer rows

        row.height = 30; // Taller rows for better readability
        row.eachCell((cell, colNumber) => {
          const isValueCell = colNumber === 2;
          cell.style = {
            ...STYLES.normal,
            border: {
              ...BORDERS,
              top: { style: row === subtotalRow ? "medium" : "thin" },
              bottom: {
                style:
                  row === subtotalRow ||
                  row === subTotalAfterProfitRow ||
                  row === totalRow
                    ? "medium"
                    : "thin",
              },
            },
            font: {
              name: "Arial",
              size: row === totalRow ? 14 : 12,
              bold: true,
            },
            alignment: {
              vertical: "middle",
              horizontal: isValueCell ? "right" : "left",
            },
            fill:
              row === totalRow
                ? {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "E6EEF7" },
                  }
                : null,
          };

          if (isValueCell) {
            cell.numFmt = CURRENCY_FORMAT;
          }
        });
      });

      // Save the workbook
      const fileName = `${userData.username}_data_export_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      const { filePath } = await dialog.showSaveDialog({
        title: "Save Excel File",
        defaultPath: fileName,
        filters: [{ name: "Excel Files", extensions: ["xlsx"] }],
      });

      if (filePath) {
        await workbook.xlsx.writeFile(filePath);
        return { success: true, message: "Data berhasil diekspor" };
      } else {
        return { success: false, message: "Export dibatalkan" };
      }
    } catch (error) {
      console.error("Export error:", error);
      return {
        success: false,
        message: "Error mengekspor data: " + error.message,
      };
    }
  });

  // Export database - admin only
  ipcMain.handle("export-database", async (event) => {
    try {
      const sourceFile = "database.sqlite";

      const { filePath } = await dialog.showSaveDialog({
        title: "Save Database File",
        defaultPath: `database_export_${
          new Date().toISOString().split("T")[0]
        }.sqlite`,
        filters: [{ name: "SQLite Database", extensions: ["sqlite"] }],
      });

      if (filePath) {
        await new Promise((resolve, reject) => {
          const readStream = fs.createReadStream(sourceFile);
          const writeStream = fs.createWriteStream(filePath);

          readStream.on("error", reject);
          writeStream.on("error", reject);
          writeStream.on("finish", resolve);

          readStream.pipe(writeStream);
        });

        return { success: true, message: "Database berhasil diekspor" };
      } else {
        return { success: false, message: "Export dibatalkan" };
      }
    } catch (error) {
      console.error("Database export error:", error);
      return {
        success: false,
        message: "Error mengekspor database: " + error.message,
      };
    }
  });
}

module.exports = { setupExportHandlers };
