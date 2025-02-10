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

module.exports = {
  STYLES,
  BORDERS,
  CURRENCY_FORMAT,
};
