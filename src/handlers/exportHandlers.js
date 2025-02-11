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

      // Add project header first
      addProjectHeader(materialsSheet, projectData, 5); // 5 columns for materials

      // Add column headers directly after project header
      materialsSheet.addRow([]); // Empty row for spacing
      const headerRow = materialsSheet.addRow([
        "Nama Material",
        "Satuan",
        "Harga",
        "Kategori",
        "Keterangan",
      ]);

      // Style header row
      headerRow.eachCell((cell) => {
        cell.style = { ...STYLES.header, border: BORDERS };
      });
      headerRow.height = 25;

      // Set column widths
      const columns = [
        { width: 30 }, // Nama Material
        { width: 15 }, // Satuan
        { width: 20 }, // Harga
        { width: 20 }, // Kategori
        { width: 35 }, // Keterangan
      ];
      materialsSheet.columns = columns;

      // Add the data
      await new Promise((resolve, reject) => {
        db.all(
          "SELECT name, unit, price, category, description FROM materials WHERE user_id = ?",
          [userId],
          (err, materials) => {
            if (err) reject(err);
            else {
              materials.forEach((material) => {
                const row = materialsSheet.addRow([
                  material.name,
                  material.unit,
                  material.price,
                  material.category,
                  material.description || "",
                ]);
                row.eachCell((cell) => {
                  cell.style = { ...STYLES.normal, border: BORDERS };
                  if (cell.col === 3) {
                    cell.numFmt = CURRENCY_FORMAT;
                  }
                });
              });
              resolve();
            }
          }
        );
      });

      // Export AHS
      const ahsSheet = workbook.addWorksheet("AHS");

      // Add project header
      addProjectHeader(ahsSheet, projectData, 4); // 4 columns for AHS

      // Add column headers
      ahsSheet.addRow([]); // Empty row for spacing
      const ahsHeaderRow = ahsSheet.addRow([
        "Kelompok",
        "Kode AHS",
        "Uraian AHS",
        "Satuan",
      ]);

      // Style AHS header row
      ahsHeaderRow.eachCell((cell) => {
        cell.style = { ...STYLES.header, border: BORDERS };
      });
      ahsHeaderRow.height = 25;

      // Set AHS column widths
      ahsSheet.columns = [
        { width: 25 }, // Kelompok
        { width: 20 }, // Kode AHS
        { width: 40 }, // Uraian AHS
        { width: 15 }, // Satuan
      ];

      // Add AHS data
      await new Promise((resolve, reject) => {
        db.all(
          "SELECT kelompok, kode_ahs, ahs, satuan FROM ahs WHERE user_id = ?",
          [userId],
          (err, ahsData) => {
            if (err) reject(err);
            else {
              ahsData.forEach((ahs) => {
                const row = ahsSheet.addRow([
                  ahs.kelompok,
                  ahs.kode_ahs,
                  ahs.ahs,
                  ahs.satuan,
                ]);
                row.eachCell((cell) => {
                  cell.style = { ...STYLES.normal, border: BORDERS };
                });
              });
              resolve();
            }
          }
        );
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

  // Export materials to Excel
  ipcMain.handle("export-materials", async (event, { userId }) => {
    try {
      const materials = await new Promise((resolve, reject) => {
        db.all(
          "SELECT kode, name, unit, price, category, lokasi, sumber_data FROM materials WHERE user_id = ? ORDER BY category, name",
          [userId],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          }
        );
      });

      // Create workbook and worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Materials");

      // Add column headers with styling
      const headerRow = worksheet.addRow([
        "KODE",
        "NAMA",
        "SATUAN",
        "HARGA",
        "KATEGORI",
        "LOKASI",
        "SUMBER DATA",
      ]);
      headerRow.eachCell((cell) => {
        cell.font = { bold: true };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFE0E0E0" },
        };
        cell.alignment = { horizontal: "center" };
      });

      // Add data rows
      for (const material of materials) {
        worksheet.addRow([
          material.kode || "",
          material.name,
          material.unit,
          material.price,
          material.category,
          material.lokasi || "",
          material.sumber_data || "",
        ]);
      }

      // Auto-width columns
      worksheet.columns.forEach((column) => {
        column.width = 15;
      });

      const { filePath } = await dialog.showSaveDialog({
        title: "Export Materials",
        defaultPath: `materials_export_${
          new Date().toISOString().split("T")[0]
        }.xlsx`,
        filters: [{ name: "Excel Files", extensions: ["xlsx"] }],
      });

      if (filePath) {
        await workbook.xlsx.writeFile(filePath);
        return { success: true };
      }
      return { success: false, error: "Export dibatalkan" };
    } catch (error) {
      console.error("Material export error:", error);
      return { success: false, error: error.message };
    }
  });

  // Import materials from Excel
  ipcMain.handle("import-materials", async (event, { userId }) => {
    try {
      const { filePaths } = await dialog.showOpenDialog({
        title: "Import Materials",
        filters: [{ name: "Excel Files", extensions: ["xlsx", "xls"] }],
        properties: ["openFile"],
      });

      if (filePaths.length === 0) {
        return { success: false, error: "Tidak ada file yang dipilih" };
      }

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePaths[0]);
      const worksheet = workbook.worksheets[0];

      try {
        // Prepare statement outside transaction
        const stmt = db.prepare(
          "INSERT INTO materials (kode, name, unit, price, category, lokasi, sumber_data, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
        );

        // Process rows (skip header row)
        for (let i = 2; i <= worksheet.rowCount; i++) {
          const row = worksheet.getRow(i);
          if (!row.getCell(2).value) continue; // Skip if no name (second column)

          await new Promise((resolve, reject) => {
            stmt.run(
              [
                row.getCell(1).value || "", // kode
                row.getCell(2).value, // name
                row.getCell(3).value, // unit
                parseFloat(row.getCell(4).value) || 0, // price
                row.getCell(5).value || "Bahan", // category
                row.getCell(6).value || "", // lokasi
                row.getCell(7).value || "", // sumber_data
                userId,
              ],
              (err) => {
                if (err) reject(err);
                else resolve();
              }
            );
          });
        }

        // Finalize statement
        await new Promise((resolve, reject) => {
          stmt.finalize((err) => {
            if (err) reject(err);
            else resolve();
          });
        });

        return { success: true };
      } catch (error) {
        // Make sure statement is finalized on error
        try {
          if (stmt) stmt.finalize();
        } catch (e) {
          console.error("Error finalizing statement:", e);
        }
        throw error;
      }
    } catch (error) {
      console.error("Material import error:", error);
      return { success: false, error: error.message };
    }
  });

  // Export AHS to Excel
  ipcMain.handle("export-ahs", async (event, { userId }) => {
    try {
      const ahs = await new Promise((resolve, reject) => {
        db.all(
          "SELECT kelompok, kode_ahs, ahs, satuan FROM ahs WHERE user_id = ? ORDER BY kelompok, kode_ahs",
          [userId],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          }
        );
      });

      // Create workbook and worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("AHS");

      // Add column headers with styling
      const headerRow = worksheet.addRow([
        "KELOMPOK",
        "KODE AHS",
        "AHS",
        "SATUAN",
      ]);
      headerRow.eachCell((cell) => {
        cell.font = { bold: true };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFE0E0E0" },
        };
        cell.alignment = { horizontal: "center" };
      });

      // Add data rows
      for (const item of ahs) {
        worksheet.addRow([item.kelompok, item.kode_ahs, item.ahs, item.satuan]);
      }

      // Auto-width columns
      worksheet.columns.forEach((column, index) => {
        column.width = index === 2 ? 50 : 20; // Make AHS description column wider
      });

      const { filePath } = await dialog.showSaveDialog({
        title: "Export AHS",
        defaultPath: `ahs_export_${
          new Date().toISOString().split("T")[0]
        }.xlsx`,
        filters: [{ name: "Excel Files", extensions: ["xlsx"] }],
      });

      if (filePath) {
        await workbook.xlsx.writeFile(filePath);
        return { success: true };
      }
      return { success: false, error: "Export dibatalkan" };
    } catch (error) {
      console.error("AHS export error:", error);
      return { success: false, error: error.message };
    }
  });

  // Import AHS from Excel
  ipcMain.handle("import-ahs", async (event, { userId }) => {
    try {
      const { filePaths } = await dialog.showOpenDialog({
        title: "Import AHS",
        filters: [{ name: "Excel Files", extensions: ["xlsx", "xls"] }],
        properties: ["openFile"],
      });

      if (filePaths.length === 0) {
        return { success: false, error: "Tidak ada file yang dipilih" };
      }

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePaths[0]);
      const worksheet = workbook.worksheets[0];

      try {
        // Prepare statement outside transaction
        const stmt = db.prepare(
          "INSERT INTO ahs (kelompok, kode_ahs, ahs, satuan, user_id) VALUES (?, ?, ?, ?, ?)"
        );

        // Process rows (skip header row)
        for (let i = 2; i <= worksheet.rowCount; i++) {
          const row = worksheet.getRow(i);
          if (!row.getCell(3).value) continue; // Skip if no AHS description (third column)

          await new Promise((resolve, reject) => {
            stmt.run(
              [
                row.getCell(1).value || "", // kelompok
                row.getCell(2).value || "", // kode_ahs
                row.getCell(3).value, // ahs
                row.getCell(4).value || "", // satuan
                userId,
              ],
              (err) => {
                if (err) reject(err);
                else resolve();
              }
            );
          });
        }

        // Finalize statement
        await new Promise((resolve, reject) => {
          stmt.finalize((err) => {
            if (err) reject(err);
            else resolve();
          });
        });

        return { success: true };
      } catch (error) {
        // Make sure statement is finalized on error
        try {
          if (stmt) stmt.finalize();
        } catch (e) {
          console.error("Error finalizing statement:", e);
        }
        throw error;
      }
    } catch (error) {
      console.error("AHS import error:", error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = { setupExportHandlers };
