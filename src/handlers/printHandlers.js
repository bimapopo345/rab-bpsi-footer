const ExcelJS = require("exceljs");
const path = require("path");
const { app } = require("electron");
const { addProjectSheet } = require("./print/projectSheet");
const { addDetailedAHSSheet } = require("./print/ahsSheet");
const { addDetailedMaterialSheet } = require("./print/materialSheet");
const { addDetailedWageSheet } = require("./print/wageSheet");
const { addSummarySheet } = require("./print/summarySheet");

function setupPrintHandlers(ipcMain, db) {
  ipcMain.on("print-rab", async (event, { type, userId }) => {
    if (!userId) {
      event.reply("print-error", "User ID is required");
      return;
    }

    const workbook = new ExcelJS.Workbook();

    try {
      const project = await getProject(db, userId);
      if (!project) {
        throw new Error("Proyek tidak ditemukan");
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `RAB_${project.name.replace(
        /\s+/g,
        "_"
      )}_${type}_${timestamp}.xlsx`;
      const filePath = path.join(app.getPath("downloads"), filename);

      workbook.creator = "RAB System";
      workbook.created = new Date();
      workbook.modified = new Date();

      switch (type) {
        case "all":
          // Project info sheet
          await addProjectSheet(workbook, project);
          // Summary sheet first for overview
          await addSummarySheet(workbook, db, userId);
          // Detailed sheets
          await addDetailedAHSSheet(workbook, db, userId);
          await addDetailedMaterialSheet(workbook, db, userId);
          await addDetailedWageSheet(workbook, db, userId);
          break;

        case "wages":
          await addProjectSheet(workbook, project);
          await addDetailedWageSheet(workbook, db, userId);
          break;

        case "materials":
          await addProjectSheet(workbook, project);
          await addDetailedMaterialSheet(workbook, db, userId);
          break;

        case "ahs":
          await addProjectSheet(workbook, project);
          await addDetailedAHSSheet(workbook, db, userId);
          break;
      }

      // Add metadata and protection
      workbook.views = [
        {
          x: 0,
          y: 0,
          width: 10000,
          height: 20000,
          firstSheet: 0,
          activeTab: 0,
          visibility: "visible",
        },
      ];

      // Set document properties
      workbook.properties.date1904 = true;
      workbook.properties.title = `RAB ${project.name}`;
      workbook.properties.subject = "Rencana Anggaran Biaya";
      workbook.properties.keywords = "RAB, konstruksi, anggaran";
      workbook.properties.category = "Laporan Keuangan";
      workbook.properties.company = "RAB System";
      workbook.properties.manager = project.name;

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

module.exports = { setupPrintHandlers };
