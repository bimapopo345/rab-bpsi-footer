// Helper function to format currency in Indonesian Rupiah
function formatRupiah(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Function to add standardized project header
function addProjectHeader(worksheet, project, columnCount) {
  // Merge cells for the header
  const mergeRange = `A1:${String.fromCharCode(64 + columnCount)}3`;
  worksheet.mergeCells(mergeRange);

  // Set header cell value and styling
  const headerCell = worksheet.getCell("A1");
  headerCell.value = `${project.name}\n${project.location}\n${project.funding}`;

  headerCell.alignment = {
    horizontal: "center",
    vertical: "middle",
    wrapText: true,
  };

  // Create rich text to apply different font sizes
  headerCell.value = {
    richText: [
      {
        text: `${project.name}\n`,
        font: { bold: true, size: 28, color: { argb: "1A4F7C" } },
      },
      {
        text: `${project.location}\n`,
        font: { bold: true, size: 20, color: { argb: "1A4F7C" } },
      },
      {
        text: project.funding,
        font: { bold: true, size: 16, color: { argb: "1A4F7C" } },
      },
    ],
  };

  // Set row heights
  worksheet.getRow(1).height = 30;
  worksheet.getRow(2).height = 30;
  worksheet.getRow(3).height = 30;

  // Add spacing row
  worksheet.getRow(4).height = 15;
}

const STYLES = {
  projectHeader: {
    font: {
      size: 12,
      bold: true,
      color: { argb: "FFFFFF" },
    },
    alignment: {
      horizontal: "center",
      vertical: "middle",
      wrapText: false,
    },
    fill: {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "1A4F7C" },
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

module.exports = {
  STYLES,
  BORDERS,
  CURRENCY_FORMAT,
  addProjectHeader,
  formatRupiah,
};
