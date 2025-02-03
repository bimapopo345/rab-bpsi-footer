const { STYLES, BORDERS } = require("./styles");

async function addFooterSheet(workbook) {
  const sheet = workbook.addWorksheet("About");

  sheet.columns = [
    { header: "", key: "col1", width: 30 },
    { header: "", key: "col2", width: 50 },
  ];

  // Add title
  sheet.mergeCells("A1:B1");
  const titleCell = sheet.getCell("A1");
  titleCell.value = "RAB System";
  titleCell.font = { bold: true, size: 16, color: { argb: "FFFFFF" } };
  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "1A4F7C" },
  };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(1).height = 30;

  // Add attribution
  sheet.mergeCells("A3:B3");
  const attributionCell = sheet.getCell("A3");
  attributionCell.value = "Thanks to Bima Prawang Saputra";
  attributionCell.font = { bold: true, size: 14, color: { argb: "1A4F7C" } };
  attributionCell.alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(3).height = 25;

  // Add social links
  const socialLinks = [
    ["LinkedIn", "https://www.linkedin.com/in/bimaprawangsaputra/"],
    ["Instagram", "https://www.instagram.com/bimatech/"],
    ["WhatsApp", "https://api.whatsapp.com/send/?phone=6282275637656"],
  ];

  let currentRow = 5;
  socialLinks.forEach(([platform, url]) => {
    const row = sheet.getRow(currentRow);
    row.values = [platform, url];
    row.height = 25;
    row.eachCell((cell) => {
      cell.font = { color: { argb: "1A4F7C" }, underline: true };
      cell.alignment = { vertical: "middle" };
      if (cell.col === 1) {
        cell.font.bold = true;
      }
    });
    currentRow++;
  });

  // Add copyright notice
  sheet.mergeCells(`A${currentRow + 2}:B${currentRow + 2}`);
  const copyrightCell = sheet.getCell(`A${currentRow + 2}`);
  copyrightCell.value = `© ${new Date().getFullYear()} RAB System - All rights reserved`;
  copyrightCell.font = { italic: true, color: { argb: "666666" } };
  copyrightCell.alignment = { horizontal: "center", vertical: "middle" };

  // Add timestamp
  sheet.mergeCells(`A${currentRow + 3}:B${currentRow + 3}`);
  const timestampCell = sheet.getCell(`A${currentRow + 3}`);
  timestampCell.value = `Generated on ${new Date().toLocaleString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })}`;
  timestampCell.font = { italic: true, color: { argb: "666666" } };
  timestampCell.alignment = { horizontal: "center", vertical: "middle" };

  // Add footer to all sheets
  workbook.eachSheet((sheet) => {
    const lastRow = sheet.lastRow?.number || 1;
    const footerRow = lastRow + 2;

    sheet.mergeCells(`A${footerRow}:G${footerRow}`);
    const footerCell = sheet.getCell(`A${footerRow}`);
    footerCell.value = "Thanks to Bima Prawang Saputra";
    footerCell.font = { italic: true, color: { argb: "1A4F7C" } };
    footerCell.alignment = { horizontal: "center", vertical: "middle" };
  });
}

module.exports = { addFooterSheet };
