const { STYLES, BORDERS } = require("./styles");

async function addProjectSheet(workbook, project) {
  const sheet = workbook.addWorksheet("Informasi Proyek");

  sheet.columns = [
    { header: "Informasi", key: "info", width: 25 },
    { header: "Detail", key: "detail", width: 50 },
  ];

  // Add title
  sheet.mergeCells("A1:B2");
  const titleCell = sheet.getCell("A1");
  titleCell.value = "RENCANA ANGGARAN BIAYA (RAB)";
  titleCell.font = { bold: true, size: 16, color: { argb: "1A4F7C" } };
  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "F0F5FA" },
  };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  titleCell.border = BORDERS;

  // Add divider
  sheet.mergeCells("A3:B3");
  const dividerRow = sheet.getRow(3);
  dividerRow.height = 10;

  // Add project details with styling
  const detailsStartRow = 4;
  const details = [
    ["Nama Proyek", project.name],
    ["Lokasi", project.location],
    ["Sumber Dana", project.funding || "-"],
    [
      "Tanggal Dibuat",
      new Date().toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    ],
    ["Dibuat Oleh", "RAB System"],
    ["Status", "AKTIF"],
  ];

  details.forEach((detail, idx) => {
    const row = sheet.getRow(detailsStartRow + idx);
    row.values = detail;
    row.height = 25;
    row.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: idx % 2 === 0 ? "F0F5FA" : "FFFFFF" },
      };
      cell.border = BORDERS;
      cell.alignment = { vertical: "middle" };
      if (cell.col === 1) {
        cell.font = { bold: true, color: { argb: "1A4F7C" } };
      }
    });
  });

  // Add company info
  const companyStartRow = detailsStartRow + details.length + 2;
  sheet.mergeCells(`A${companyStartRow}:B${companyStartRow}`);
  const companyHeader = sheet.getCell(`A${companyStartRow}`);
  companyHeader.value = "INFORMASI PERUSAHAAN";
  Object.assign(companyHeader, STYLES.subHeader);
  companyHeader.border = BORDERS;

  const companyDetails = [
    ["Nama Perusahaan", "RAB System"],
    ["Alamat", "Jl. Example No. 123"],
    ["Telepon", "(021) 123-4567"],
    ["Email", "contact@rabsystem.com"],
  ];

  companyDetails.forEach((detail, idx) => {
    const row = sheet.getRow(companyStartRow + idx + 1);
    row.values = detail;
    row.height = 25;
    row.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: idx % 2 === 0 ? "F0F5FA" : "FFFFFF" },
      };
      cell.border = BORDERS;
      cell.alignment = { vertical: "middle" };
      if (cell.col === 1) {
        cell.font = { bold: true, color: { argb: "1A4F7C" } };
      }
    });
  });

  // Add footer
  const footerRow = companyStartRow + companyDetails.length + 3;
  sheet.mergeCells(`A${footerRow}:B${footerRow}`);
  const footerCell = sheet.getCell(`A${footerRow}`);
  footerCell.value = `© ${new Date().getFullYear()} RAB System - All rights reserved`;
  footerCell.alignment = { horizontal: "center" };
  footerCell.font = { italic: true, color: { argb: "666666" } };

  // Protect the sheet
  await sheet.protect("", {
    selectLockedCells: true,
    selectUnlockedCells: true,
    formatCells: false,
    formatColumns: false,
    formatRows: false,
    insertColumns: false,
    insertRows: false,
    insertHyperlinks: false,
    deleteColumns: false,
    deleteRows: false,
    sort: false,
    autoFilter: false,
    pivotTables: false,
  });
}

module.exports = { addProjectSheet };
