const ExcelJS = require("exceljs");
const path = require("path");
const { app } = require("electron");
const { addRekapitulasiSheet } = require("./print/rekapitulasiSheet");
const { addBqNewSheet } = require("./print/bqNewSheet");
const { addRekapHspSheet } = require("./print/rekapHspSheet");
const { addAnalisaFixSheet } = require("./print/analisaFixSheet");
const { addDaftarHargaSheet } = require("./print/daftarHargaSheet");

function setupPrintKesimpulanHandlers(ipcMain, db) {
  ipcMain.on("print-kesimpulan", async (event, { userId }) => {
    if (!userId) {
      event.reply("print-error", "User ID is required");
      return;
    }

    const workbook = new ExcelJS.Workbook();

    try {
      // Get project data
      const project = await getProject(db, userId);
      if (!project) {
        throw new Error("Proyek tidak ditemukan");
      }

      // Set workbook properties
      workbook.creator = "RAB System";
      workbook.lastModifiedBy = "RAB System";
      workbook.created = new Date();
      workbook.modified = new Date();
      workbook.properties.date1904 = true;

      // Add sheets
      await addRekapitulasiSheet(workbook, db, userId, project);
      await addBqNewSheet(workbook, db, userId, project);
      await addRekapHspSheet(workbook, db, userId, project);
      await addAnalisaFixSheet(workbook, db, userId, project);
      await addDaftarHargaSheet(workbook, db, userId, project);

      // Save file
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `RAB_${project.name.replace(
        /\s+/g,
        "_"
      )}_Kesimpulan_${timestamp}.xlsx`;
      const filePath = path.join(app.getPath("downloads"), filename);

      await workbook.xlsx.writeFile(filePath);
      event.reply("print-complete", {
        success: true,
        path: filePath,
        message: `File berhasil disimpan di: ${filePath}`,
      });
    } catch (error) {
      console.error("Error generating Excel:", error);
      event.reply("print-error", error.message);
    }
  });
}

function getProject(db, userId) {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
      [userId],
      (err, project) => {
        if (err) reject(err);
        else resolve(project);
      }
    );
  });
}

module.exports = { setupPrintKesimpulanHandlers };
