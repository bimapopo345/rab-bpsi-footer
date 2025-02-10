const STYLES = {
  projectHeader: {
    font: {
      size: 14,
      bold: true,
      color: { argb: "1A4F7C" },
    },
    alignment: {
      horizontal: "left",
      vertical: "middle",
    },
    fill: {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "F5F9FF" },
    },
  },
  header: {
    fill: {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "1A4F7C" },
    },
    font: {
      color: { argb: "FFFFFF" },
      bold: true,
      size: 12,
    },
    alignment: {
      horizontal: "center",
      vertical: "middle",
    },
  },
  subHeader: {
    fill: {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "4A77A9" },
    },
    font: {
      color: { argb: "FFFFFF" },
      bold: true,
    },
  },
  ahsHeader: {
    fill: {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "E6EEF7" },
    },
    font: {
      bold: true,
      color: { argb: "1A4F7C" },
    },
  },
  totalRow: {
    fill: {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "F0F5FA" },
    },
    font: {
      bold: true,
    },
  },
  groupHeader: {
    fill: {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "DCE6F1" },
    },
    font: {
      bold: true,
      color: { argb: "1A4F7C" },
    },
    alignment: {
      horizontal: "center",
      vertical: "middle",
    },
  },
  normal: {
    font: {
      size: 11,
    },
    alignment: {
      vertical: "middle",
    },
  },
};

// Common cell border style
const BORDERS = {
  top: { style: "thin" },
  left: { style: "thin" },
  bottom: { style: "thin" },
  right: { style: "thin" },
};

// Currency format
const CURRENCY_FORMAT = '"Rp"#,##0.00';

// Function to add project header to a worksheet
function addProjectHeader(worksheet, projectData, columnCount) {
  worksheet.addRow(["INFORMASI PROYEK"]).eachCell((cell) => {
    cell.style = STYLES.projectHeader;
  });
  worksheet.mergeCells(`A1:${String.fromCharCode(64 + columnCount)}1`);

  worksheet
    .addRow([
      "Nama Proyek:",
      projectData.name || "-",
      "", // Empty cells for proper merging
      "",
    ])
    .eachCell((cell) => {
      cell.style = STYLES.normal;
    });

  worksheet
    .addRow([
      "Lokasi:",
      projectData.location || "-",
      "", // Empty cells for proper merging
      "",
    ])
    .eachCell((cell) => {
      cell.style = STYLES.normal;
    });

  worksheet
    .addRow([
      "Sumber Dana:",
      projectData.funding || "-",
      "", // Empty cells for proper merging
      "",
    ])
    .eachCell((cell) => {
      cell.style = STYLES.normal;
    });

  // Merge cells for project info
  worksheet.mergeCells(`B2:${String.fromCharCode(64 + columnCount)}2`);
  worksheet.mergeCells(`B3:${String.fromCharCode(64 + columnCount)}3`);
  worksheet.mergeCells(`B4:${String.fromCharCode(64 + columnCount)}4`);
}

module.exports = {
  STYLES,
  BORDERS,
  CURRENCY_FORMAT,
  addProjectHeader,
};
