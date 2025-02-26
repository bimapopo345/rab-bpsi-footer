const ExcelJS = require("exceljs");

async function addCoverSheet(workbook, db, userId, project) {
  const sheet = workbook.addWorksheet("Cover", {
    pageSetup: { fitToPage: true, orientation: "portrait" },
    properties: { tabColor: { argb: "FFB050" } },
    views: [{ showGridLines: false }], // Hide grid lines
  });

  // Add outer border
  for (let i = 1; i <= 30; i++) {
    sheet.getCell(i, 2).border = { left: { style: "medium" } };
    sheet.getCell(i, 11).border = { right: { style: "medium" } };
  }
  for (let i = 2; i <= 11; i++) {
    sheet.getCell(1, i).border = { top: { style: "medium" } };
    sheet.getCell(30, i).border = { bottom: { style: "medium" } };
  }

  // Title
  const titleCell = sheet.getCell("C3");
  titleCell.value = "RENCANA ANGGARAN BIAYA";
  titleCell.font = {
    name: "Times New Roman",
    bold: true,
    size: 28,
    color: { argb: "FF87C060" },
  };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  sheet.mergeCells("C3:J3");
  // Add border to merged title cell
  sheet.getRow(3).getCell(3).border = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };

  // Project Name
  const projectNameCell = sheet.getCell("C5");
  projectNameCell.value = project.name;
  projectNameCell.font = {
    name: "Arial Black",
    bold: true,
    size: 18,
  };
  projectNameCell.alignment = {
    horizontal: "center",
    vertical: "middle",
    wrapText: true,
  };
  sheet.mergeCells("C5:J6");
  // Add border to merged project name cell
  sheet.getRow(5).getCell(3).border = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };

  // Location details
  const locationLabels = ["Provinsi", "Kabupaten / Kota", "Kecamatan", "Desa"];
  let currentRow = 8;

  locationLabels.forEach((label) => {
    // Label cell
    const labelCell = sheet.getCell(currentRow, 3);
    labelCell.value = label;
    labelCell.font = {
      name: "Times New Roman",
      bold: true,
      size: 14,
    };
    labelCell.alignment = { horizontal: "left", vertical: "middle" };

    // Colon cell
    const colonCell = sheet.getCell(currentRow, 4);
    colonCell.value = ":";
    colonCell.font = {
      name: "Times New Roman",
      bold: true,
      size: 14,
    };
    colonCell.alignment = { horizontal: "center", vertical: "middle" };

    // Value cells
    for (let col = 5; col <= 10; col++) {
      const cell = sheet.getCell(currentRow, col);
      cell.font = {
        name: "Times New Roman",
        bold: true,
        size: 14,
      };
      cell.alignment = { horizontal: "left", vertical: "middle" };
      if (col === 5) {
        cell.value = project.location || "";
      }
    }

    // Add border to merged location cells
    const mergedCell = sheet.getCell(currentRow, 3);
    mergedCell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };

    sheet.mergeCells(`E${currentRow}:J${currentRow}`);
    currentRow += 2;
  });

  // Set column widths
  sheet.getColumn(3).width = 20; // Label
  sheet.getColumn(4).width = 5; // Colon
  sheet.getColumn(5).width = 40; // Value start
  [6, 7, 8, 9, 10].forEach((col) => (sheet.getColumn(col).width = 15)); // Value continuation

  return sheet;
}

module.exports = { addCoverSheet };
