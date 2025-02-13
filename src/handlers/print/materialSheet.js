const {
  STYLES,
  BORDERS,
  CURRENCY_FORMAT,
  addProjectHeader,
} = require("./styles");

async function addDetailedMaterialSheet(workbook, db, userId, project) {
  return new Promise((resolve, reject) => {
    if (!userId) {
      reject(new Error("User ID is required"));
      return;
    }

    const sheet = workbook.addWorksheet("Material");

    const columns = [
      { header: "Kelompok", key: "kelompok", width: 20 },
      { header: "Kode AHS", key: "kode_ahs", width: 15 },
      { header: "Nama AHS", key: "uraian", width: 40 },
      { header: "Kode Material", key: "material_kode", width: 15 },
      { header: "Nama Material", key: "material_name", width: 30 },
      { header: "Satuan", key: "satuan", width: 12 },
      { header: "Kuantitas", key: "kuantitas", width: 12 },
      { header: "Harga Satuan", key: "harga", width: 20 },
      { header: "Lokasi", key: "lokasi", width: 20 },
      { header: "Sumber Data", key: "sumber_data", width: 20 },
      { header: "Jumlah", key: "jumlah", width: 20 },
    ];

    sheet.columns = columns;

    // Add standardized project header
    addProjectHeader(sheet, project, 11);

    // Add report title at row 5
    sheet.mergeCells("A5:K5");
    const titleCell = sheet.getCell("A5");
    titleCell.value = "DAFTAR HARGA BAHAN / MATERIAL";
    titleCell.font = { bold: true, size: 14, color: { argb: "FFFFFF" } };
    titleCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "1A4F7C" },
    };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    sheet.getRow(5).height = 30;

    // Add column headers at row 6
    const headerRow = sheet.getRow(6);
    columns.forEach((column, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.value = column.header;
      cell.style = {
        ...STYLES.header,
        border: BORDERS,
        alignment: { horizontal: "center", vertical: "middle" },
      };
    });
    headerRow.height = 25;

    const query = `
        SELECT
            a.kelompok,
            a.kode_ahs,
            a.ahs as uraian,
            m.kode as material_kode,
            m.name as material_name,
            a.satuan,
            m.price as harga_satuan,
            p.koefisien as kuantitas,
            m.lokasi,
            m.sumber_data
        FROM ahs a
            LEFT JOIN pricing p ON a.id = p.ahs_id
            LEFT JOIN materials m ON p.material_id = m.id
            WHERE p.koefisien IS NOT NULL
            AND LOWER(m.category) != 'upah'
            AND a.user_id = ?
            AND m.user_id = ?
            AND p.user_id = ?
            ORDER BY a.kelompok, a.kode_ahs
        `;

    db.all(query, [userId, userId, userId], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }

      let currentRow = 7; // Start after headers
      let currentKelompok = "";
      let kelompokTotal = 0;
      let grandTotal = 0;

      rows.forEach((row, index) => {
        if (currentKelompok !== row.kelompok) {
          // Add previous kelompok total
          if (currentKelompok !== "") {
            addKelompokTotal(
              sheet,
              currentRow++,
              currentKelompok,
              kelompokTotal
            );
            currentRow++; // Add space between kelompok
          }

          // Add new kelompok header
          currentKelompok = row.kelompok;
          kelompokTotal = 0;

          const kelompokRow = sheet.getRow(currentRow);
          sheet.mergeCells(`A${currentRow}:K${currentRow}`);
          kelompokRow.getCell(1).value = `KELOMPOK: ${currentKelompok}`;
          kelompokRow.height = 25;
          kelompokRow.eachCell((cell) => {
            Object.assign(cell, STYLES.subHeader);
            cell.border = BORDERS;
          });
          currentRow++;
        }

        const biaya = row.harga_satuan * row.kuantitas;
        kelompokTotal += biaya;
        grandTotal += biaya;

        // Add material row
        const dataRow = sheet.getRow(currentRow);
        dataRow.values = [
          row.kelompok,
          row.kode_ahs,
          row.uraian,
          row.material_kode || "-",
          row.material_name,
          row.satuan,
          row.kuantitas,
          row.harga_satuan,
          row.lokasi || "-",
          row.sumber_data || "-",
          biaya,
        ];
        dataRow.height = 35;
        dataRow.alignment = { wrapText: true };
        dataRow.eachCell((cell, colNumber) => {
          cell.border = BORDERS;
          cell.alignment = { vertical: "middle" };
          if (colNumber === 7 || colNumber === 10) {
            cell.numFmt = CURRENCY_FORMAT;
          }
        });

        currentRow++;

        // Add last kelompok total and grand total
        if (index === rows.length - 1) {
          addKelompokTotal(sheet, currentRow++, currentKelompok, kelompokTotal);
          currentRow += 2;
          addGrandTotal(sheet, currentRow, grandTotal);
        }
      });

      resolve();
    });
  });
}

function addKelompokTotal(sheet, row, kelompok, total) {
  const totalRow = sheet.getRow(row);
  sheet.mergeCells(`A${row}:J${row}`);
  totalRow.getCell(1).value = `Total ${kelompok}`;
  totalRow.getCell(11).value = total;
  totalRow.getCell(11).numFmt = CURRENCY_FORMAT;
  totalRow.height = 25;
  totalRow.eachCell((cell) => {
    Object.assign(cell, STYLES.totalRow);
    cell.border = BORDERS;
  });
}

function addGrandTotal(sheet, row, total) {
  const totalRow = sheet.getRow(row);
  sheet.mergeCells(`A${row}:J${row}`);
  totalRow.getCell(1).value = "TOTAL BIAYA MATERIAL";
  totalRow.getCell(11).value = total;
  totalRow.getCell(11).numFmt = CURRENCY_FORMAT;
  totalRow.height = 30;
  totalRow.eachCell((cell) => {
    Object.assign(cell, {
      ...STYLES.header,
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "1A4F7C" },
      },
    });
    cell.border = BORDERS;
  });
}

module.exports = { addDetailedMaterialSheet };
