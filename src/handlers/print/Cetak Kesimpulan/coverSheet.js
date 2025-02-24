const ExcelJS = require("exceljs");

async function addCoverSheet(workbook, db, userId, project) {
  const sheet = workbook.addWorksheet("Cover", {
    pageSetup: { fitToPage: true, orientation: "portrait" },
    properties: { tabColor: { argb: "FFB050" } },
  });

  // Title
  sheet.getCell("B3").value = "RENCANA ANGGARAN BIAYA";
  sheet.getCell("B3").font = { bold: true, size: 16 };
  sheet.getCell("B3").alignment = { horizontal: "center", vertical: "middle" };
  sheet.mergeCells("B3:F3");

  // Project Name
  sheet.getCell("B5").value = `"${project.name}"`;
  sheet.getCell("B5").font = { size: 14 };
  sheet.getCell("B5").alignment = {
    horizontal: "center",
    vertical: "middle",
    wrapText: true,
  };
  sheet.mergeCells("B5:F6");

  // Location details with same value from project.location
  const locationLabels = ["Provinsi", "Kabupaten / Kota", "Kecamatan", "Desa"];
  let currentRow = 8;

  locationLabels.forEach((label) => {
    sheet.getCell(currentRow, 2).value = label;
    sheet.getCell(currentRow, 3).value = ":";
    sheet.getCell(currentRow, 4).value = project.location || "";

    sheet.getCell(currentRow, 2).font = { bold: true, size: 11 };
    sheet.getCell(currentRow, 3).font = { bold: true, size: 11 };
    sheet.getCell(currentRow, 4).font = { size: 11 };

    sheet.getCell(currentRow, 2).alignment = {
      horizontal: "left",
      vertical: "middle",
    };
    sheet.getCell(currentRow, 3).alignment = {
      horizontal: "center",
      vertical: "middle",
    };
    sheet.getCell(currentRow, 4).alignment = {
      horizontal: "left",
      vertical: "middle",
    };

    currentRow++;
  });

  // Set column widths
  sheet.getColumn(2).width = 20; // Label
  sheet.getColumn(3).width = 5; // Colon
  sheet.getColumn(4).width = 40; // Value

  return sheet;
}

module.exports = { addCoverSheet };
