const ExcelJS = require("exceljs");

async function addBqNewSheet(workbook, db, userId, project) {
  const sheet = workbook.addWorksheet("BQ", {
    pageSetup: { fitToPage: true, orientation: "portrait" },
  });

  // Title
  sheet.mergeCells("B1:H1");
  const titleCell = sheet.getCell("B1");
  titleCell.value = "RENCANA ANGGARAN BIAYA (RAB)";
  titleCell.font = { name: "Arial", size: 14, bold: true };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };

  // Project Info
  const projectInfo = [
    { row: 3, label: "NAMA PEKERJAAN", value: project.name },
    {
      row: 4,
      label: "PROVINSI",
      value: project.location?.split(",")[0].trim() || "",
    },
    { row: 5, label: "LOKASI KEGIATAN", value: project.location || "" },
    { row: 6, label: "TAHUN ANGGARAN", value: new Date().getFullYear() },
  ];

  projectInfo.forEach((info) => {
    const labelCell = sheet.getCell(`B${info.row}`);
    const colonCell = sheet.getCell(`D${info.row}`);
    const valueCell = sheet.getCell(`E${info.row}`);

    labelCell.value = info.label;
    labelCell.font = { name: "Arial", size: 10 };
    colonCell.value = ":";
    colonCell.font = { name: "Arial", size: 10 };
    valueCell.value = info.value;
    valueCell.font = { name: "Arial", size: 10 };
  });

  // Skip rows for spacing
  const tableStartRow = 8;

  // Headers
  const headers = [
    "NO",
    "URAIAN PEKERJAAN",
    "VOLUME",
    "SAT",
    "HARGA\nSATUAN (Rp)",
    "JUMLAH\nHARGA (Rp)",
  ];

  // Set column numbers and widths
  const columnNumbers = [
    { col: 1, text: "1", width: 5 },
    { col: 2, text: "2", width: 50 },
    { col: 3, text: "3", width: 12 },
    { col: 4, text: "4", width: 8 },
    { col: 5, text: "5", width: 15 },
    { col: 6, text: "6 = 3 x 5", width: 18 },
  ];

  columnNumbers.forEach(({ col, text, width }) => {
    const cell = sheet.getCell(tableStartRow + 1, col);
    cell.value = text;
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.font = { name: "Arial", size: 10, bold: true };
    cell.border = {
      top: { style: "medium" },
      bottom: { style: "double" },
      left: col === 1 ? { style: "medium" } : { style: "thin" },
      right: col === 6 ? { style: "medium" } : { style: "thin" },
    };

    sheet.getColumn(col).width = width;
  });

  // Insert headers with styling
  headers.forEach((header, i) => {
    const cell = sheet.getCell(tableStartRow, i + 1);
    cell.value = header;
    cell.font = { name: "Arial", bold: true, size: 10 };
    cell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
    cell.border = {
      top: { style: "medium" },
      left: i === 0 ? { style: "medium" } : { style: "thin" },
      bottom: { style: "double" },
      right: i === headers.length - 1 ? { style: "medium" } : { style: "thin" },
    };
  });

  let currentRow = tableStartRow + 2;

  // Get subprojects data with their BQs
  const subprojectsData = await new Promise((resolve, reject) => {
    db.all(
      `SELECT s.*,
              (SELECT SUM(bq.total_price)
               FROM bq 
               WHERE bq.subproject_id = s.id 
               AND bq.user_id = s.user_id) as total_price
       FROM subprojects s
       WHERE s.user_id = ?
       ORDER BY s.name`,
      [userId],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });

  let totalSum = 0;
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  // Process each subproject
  for (let subIdx = 0; subIdx < subprojectsData.length; subIdx++) {
    const subproject = subprojectsData[subIdx];

    // Write subproject header
    const headerFont = { name: "Arial", size: 10, bold: true };

    const letterCell = sheet.getCell(currentRow, 1);
    letterCell.value = alphabet[subIdx];
    letterCell.font = headerFont;
    letterCell.alignment = { horizontal: "center", vertical: "middle" };
    letterCell.border = {
      top: { style: "thin" },
      left: { style: "medium" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };

    const nameCell = sheet.getCell(currentRow, 2);
    nameCell.value = subproject.name.toUpperCase();
    nameCell.font = headerFont;
    nameCell.alignment = { horizontal: "left", vertical: "middle" };
    nameCell.border = {
      top: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "medium" },
    };

    // Merge cells for category header
    sheet.mergeCells(`B${currentRow}:F${currentRow}`);
    currentRow++;

    // Get BQs for this subproject
    const bqData = await new Promise((resolve, reject) => {
      db.all(
        `SELECT bq.*, ahs.ahs as uraian, 
                (SELECT SUM(m.price * p.koefisien * (1 + p.profit_percentage/100) * (1 + p.ppn_percentage/100)) 
                 FROM pricing p 
                 JOIN materials m ON p.material_id = m.id 
                 WHERE p.ahs_id = bq.ahs_id AND p.user_id = bq.user_id) as harga_satuan
         FROM bq 
         JOIN ahs ON bq.ahs_id = ahs.id
         WHERE bq.subproject_id = ? AND bq.user_id = ?
         ORDER BY bq.id`,
        [subproject.id, userId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    let subTotal = 0;

    // Write BQ items
    bqData.forEach((item, index) => {
      const baseFont = { name: "Arial", size: 10 };

      // Item number
      const numCell = sheet.getCell(currentRow, 1);
      numCell.value = index + 1 + ".";
      numCell.font = baseFont;
      numCell.alignment = { horizontal: "center", vertical: "middle" };

      // Description
      const descCell = sheet.getCell(currentRow, 2);
      descCell.value = item.uraian;
      descCell.font = baseFont;
      descCell.alignment = {
        horizontal: "left",
        vertical: "middle",
        wrapText: true,
      };

      // Volume
      const volCell = sheet.getCell(currentRow, 3);
      volCell.value = item.volume;
      volCell.font = baseFont;
      volCell.alignment = { horizontal: "center", vertical: "middle" };

      // Unit
      const unitCell = sheet.getCell(currentRow, 4);
      unitCell.value = item.satuan;
      unitCell.font = baseFont;
      unitCell.alignment = { horizontal: "center", vertical: "middle" };

      // Unit price
      const priceCell = sheet.getCell(currentRow, 5);
      priceCell.value = item.harga_satuan || 0;
      priceCell.font = baseFont;
      priceCell.alignment = { horizontal: "right", vertical: "middle" };
      priceCell.numFmt = '_-* #,##0_-;-* #,##0_-;_-* "-"_-;_-@_-';

      // Total price
      const totalCell = sheet.getCell(currentRow, 6);
      totalCell.value = (item.harga_satuan || 0) * item.volume;
      totalCell.font = baseFont;
      totalCell.alignment = { horizontal: "right", vertical: "middle" };
      totalCell.numFmt = '_-* #,##0_-;-* #,##0_-;_-* "-"_-;_-@_-';

      subTotal += (item.harga_satuan || 0) * item.volume;
      currentRow++;
    });

    // Write subtotal for subproject with medium border top and bottom
    const subtotalCell = sheet.getCell(currentRow, 6);
    subtotalCell.value = subTotal;
    subtotalCell.numFmt = '_-* #,##0_-;-* #,##0_-;_-* "-"_-;_-@_-';
    subtotalCell.alignment = { horizontal: "right", vertical: "middle" };
    subtotalCell.font = { name: "Arial", size: 10, bold: true };
    subtotalCell.border = {
      top: { style: "medium" },
      bottom: { style: "medium" },
      left: { style: "thin" },
      right: { style: "medium" },
    };
    currentRow++;

    if (subproject.name.toLowerCase().includes("optimalisasi")) {
      // Optimalisasi subtotal label
      const subtotalLabelCell = sheet.getCell(currentRow, 2);
      subtotalLabelCell.value = "Sub Total Pekerjaan " + alphabet[subIdx];
      subtotalLabelCell.font = { name: "Arial", size: 10, bold: true };
      subtotalLabelCell.alignment = { horizontal: "left", vertical: "middle" };
      subtotalLabelCell.border = {
        top: { style: "medium" },
        bottom: { style: "medium" },
      };

      // Optimalisasi subtotal value
      const subtotalValueCell = sheet.getCell(currentRow, 6);
      subtotalValueCell.value = subTotal;
      subtotalValueCell.numFmt = '_-* #,##0_-;-* #,##0_-;_-* "-"_-;_-@_-';
      subtotalValueCell.alignment = { horizontal: "right", vertical: "middle" };
      subtotalValueCell.font = { name: "Arial", size: 10, bold: true };
      subtotalValueCell.border = {
        top: { style: "medium" },
        bottom: { style: "medium" },
        left: { style: "thin" },
        right: { style: "medium" },
      };
      currentRow++;
    }

    totalSum += subTotal;
    currentRow++;
  }

  // Write total
  // TOTAL HARGA PEKERJAAN row
  const totalLabelCell = sheet.getCell(currentRow, 2);
  totalLabelCell.value = "TOTAL HARGA PEKERJAAN";
  totalLabelCell.font = { name: "Arial", size: 10, bold: true };
  totalLabelCell.alignment = { horizontal: "left", vertical: "middle" };

  const totalValueCell = sheet.getCell(currentRow, 6);
  totalValueCell.value = totalSum;
  totalValueCell.font = { name: "Arial", size: 10, bold: true };
  totalValueCell.alignment = { horizontal: "right", vertical: "middle" };
  totalValueCell.numFmt = '_-* #,##0_-;-* #,##0_-;_-* "-"_-;_-@_-';
  totalValueCell.border = {
    top: { style: "medium" },
    bottom: { style: "medium" },
    left: { style: "thin" },
    right: { style: "medium" },
  };

  // Add borders for all data cells
  for (let row = 1; row <= currentRow; row++) {
    for (let col = 1; col <= 6; col++) {
      const cell = sheet.getCell(row, col);
      if (!cell.border) {
        cell.border = {
          top: { style: "thin" },
          left: col === 1 ? { style: "medium" } : { style: "thin" },
          bottom: { style: "thin" },
          right: col === 6 ? { style: "medium" } : { style: "thin" },
        };
      }
    }
  }
  sheet.getCell(currentRow, 6).font = { bold: true };

  return sheet;
}

module.exports = { addBqNewSheet };
