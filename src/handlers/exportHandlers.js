const ExcelJS = require("exceljs");
const fs = require("fs");
const path = require("path");
const { dialog } = require("electron");

function setupExportHandlers(ipcMain, db) {
  const { STYLES, BORDERS, CURRENCY_FORMAT } = require("./print/styles.js");

  // Export user data to Excel - for regular users
  ipcMain.handle("export-my-data", async (event, userId) => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "RAB System";
    workbook.created = new Date();

    try {
      // Get user data
      const userData = await new Promise((resolve, reject) => {
        db.get(
          "SELECT username FROM users WHERE id = ?",
          [userId],
          (err, user) => {
            if (err) reject(err);
            else resolve(user);
          }
        );
      });

      // Export materials with improved formatting
      const materialsSheet = workbook.addWorksheet("Materials");
      materialsSheet.columns = [
        { header: "Nama Material", key: "name", width: 30 },
        { header: "Satuan", key: "unit", width: 15 },
        { header: "Harga", key: "price", width: 20 },
        { header: "Kategori", key: "category", width: 20 },
        { header: "Keterangan", key: "description", width: 35 },
      ];

      // Style header row
      materialsSheet.getRow(1).eachCell((cell) => {
        cell.style = { ...STYLES.header, border: BORDERS };
      });
      materialsSheet.getRow(1).height = 30;

      // Add data validation for categories
      materialsSheet.dataValidations.add("D2:D1000", {
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
      materialsSheet.insertRow(1, ["Petunjuk Penggunaan:"]);
      materialsSheet.insertRow(2, [
        "1. Mohon tidak mengubah format header (baris berwarna biru)",
      ]);
      materialsSheet.insertRow(3, [
        "2. Kategori harus dipilih dari: Material, Upah, atau Alat",
      ]);
      materialsSheet.insertRow(4, [
        "3. Harga diisi dalam format angka tanpa tanda pemisah ribuan",
      ]);
      materialsSheet.insertRow(5, [""]);

      materialsSheet.mergeCells("A1:E1");
      materialsSheet.mergeCells("A2:E2");
      materialsSheet.mergeCells("A3:E3");
      materialsSheet.mergeCells("A4:E4");
      materialsSheet.getCell("A1").style = STYLES.groupHeader;
      [2, 3, 4].forEach((row) => {
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

      // Style header row
      ahsSheet.getRow(6).eachCell((cell) => {
        cell.style = { ...STYLES.header, border: BORDERS };
      });
      ahsSheet.getRow(6).height = 30;

      // Add instructions for AHS
      ahsSheet.insertRow(1, ["Petunjuk Penggunaan:"]);
      ahsSheet.insertRow(2, [
        "1. Mohon tidak mengubah format header (baris berwarna biru)",
      ]);
      ahsSheet.insertRow(3, [
        "2. Kelompok diisi sesuai kategori pekerjaan (contoh: Pekerjaan Persiapan, Pekerjaan Tanah, dll)",
      ]);
      ahsSheet.insertRow(4, [
        "3. Kode AHS diisi dengan kode yang unik untuk setiap analisa harga satuan",
      ]);
      ahsSheet.insertRow(5, [""]);

      ahsSheet.mergeCells("A1:D1");
      ahsSheet.mergeCells("A2:D2");
      ahsSheet.mergeCells("A3:D3");
      ahsSheet.mergeCells("A4:D4");
      ahsSheet.getCell("A1").style = STYLES.groupHeader;
      [2, 3, 4].forEach((row) => {
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
      projectsSheet.columns = [
        { header: "Nama Proyek", key: "name", width: 40 },
        { header: "Lokasi", key: "location", width: 50 },
      ];

      // Instructions for projects
      projectsSheet.insertRow(1, ["Petunjuk Penggunaan:"]);
      projectsSheet.insertRow(2, [
        "1. Mohon tidak mengubah format header (baris berwarna biru)",
      ]);
      projectsSheet.insertRow(3, [
        "2. Masukkan informasi proyek dengan lengkap",
      ]);
      projectsSheet.insertRow(4, [""]);

      projectsSheet.mergeCells("A1:B1");
      projectsSheet.mergeCells("A2:B2");
      projectsSheet.mergeCells("A3:B3");
      projectsSheet.getCell("A1").style = STYLES.groupHeader;
      [2, 3].forEach((row) => {
        projectsSheet.getRow(row).getCell(1).style = {
          ...STYLES.normal,
          alignment: { wrapText: true },
        };
      });

      // Style header
      projectsSheet.getRow(5).eachCell((cell) => {
        cell.style = { ...STYLES.header, border: BORDERS };
      });
      projectsSheet.getRow(5).height = 30;

      await new Promise((resolve, reject) => {
        db.all(
          "SELECT name, location FROM projects WHERE user_id = ?",
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
      pricingSheet.columns = [
        { header: "Kode AHS", key: "ahs_kode", width: 20 },
        { header: "Nama Material", key: "material_name", width: 30 },
        { header: "Jumlah", key: "quantity", width: 15 },
        { header: "Koefisien", key: "koefisien", width: 15 },
      ];

      // Instructions for pricing
      pricingSheet.insertRow(1, ["Petunjuk Penggunaan:"]);
      pricingSheet.insertRow(2, [
        "1. Mohon tidak mengubah format header (baris berwarna biru)",
      ]);
      pricingSheet.insertRow(3, [
        "2. Kode AHS harus sesuai dengan yang ada di sheet AHS",
      ]);
      pricingSheet.insertRow(4, [
        "3. Nama Material harus sesuai dengan yang ada di sheet Materials",
      ]);
      pricingSheet.insertRow(5, [""]);

      pricingSheet.mergeCells("A1:D1");
      pricingSheet.mergeCells("A2:D2");
      pricingSheet.mergeCells("A3:D3");
      pricingSheet.mergeCells("A4:D4");
      pricingSheet.getCell("A1").style = STYLES.groupHeader;
      [2, 3, 4].forEach((row) => {
        pricingSheet.getRow(row).getCell(1).style = {
          ...STYLES.normal,
          alignment: { wrapText: true },
        };
      });

      // Style header
      pricingSheet.getRow(6).eachCell((cell) => {
        cell.style = { ...STYLES.header, border: BORDERS };
      });
      pricingSheet.getRow(6).height = 30;

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
