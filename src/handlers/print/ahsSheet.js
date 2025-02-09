const { STYLES, BORDERS, CURRENCY_FORMAT } = require("./styles");

async function addDetailedAHSSheet(workbook, db, userId) {
  return new Promise((resolve, reject) => {
    if (!userId) {
      reject(new Error("User ID is required"));
      return;
    }

    const sheet = workbook.addWorksheet("Analisa Harga Satuan");

    // Set column headers
    const columns = [
      { header: "Kelompok", key: "kelompok", width: 20 },
      { header: "Kode AHS", key: "kode_ahs", width: 15 },
      { header: "Uraian", key: "uraian", width: 50 },
      { header: "Satuan", key: "satuan", width: 12 },
      { header: "Koefisien", key: "koefisien", width: 12 },
      { header: "Harga Satuan", key: "harga", width: 20 },
      { header: "Lokasi", key: "lokasi", width: 20 },
      { header: "Sumber Data", key: "sumber_data", width: 20 },
      { header: "Jumlah", key: "jumlah", width: 20 },
    ];

    sheet.columns = columns;

    // Style header row
    const headerRow = sheet.getRow(1);
    headerRow.height = 30;
    headerRow.eachCell((cell) => {
      Object.assign(cell, STYLES.header);
      cell.border = BORDERS;
    });

    db.all(
      `
            SELECT 
                a.*,
                m.name as material_name,
                m.price as material_price,
                m.lokasi as material_lokasi,
                m.sumber_data as material_sumber_data,
                p.koefisien,
                m.category as material_category
            FROM ahs a
            LEFT JOIN pricing p ON a.id = p.ahs_id
            LEFT JOIN materials m ON p.material_id = m.id
            WHERE a.user_id = ? 
              AND (m.user_id IS NULL OR m.user_id = ?)
              AND (p.user_id IS NULL OR p.user_id = ?)
            ORDER BY a.kelompok, a.kode_ahs, m.category DESC, m.name
        `,
      [userId, userId, userId],
      (err, rows) => {
        if (err) {
          reject(err);
          return;
        }

        let currentRow = 2;
        let currentKelompok = "";
        let currentAHS = "";
        let ahsTotal = 0;

        rows.forEach((row, index) => {
          // Add kelompok header if new kelompok
          if (currentKelompok !== row.kelompok) {
            if (currentKelompok !== "") {
              // Add previous AHS total
              if (ahsTotal > 0) {
                addAHSTotal(sheet, currentRow++, ahsTotal);
              }
              currentRow++; // Add space between kelompok
            }

            currentKelompok = row.kelompok;
            const kelompokRow = sheet.getRow(currentRow);
            sheet.mergeCells(`A${currentRow}:I${currentRow}`);
            kelompokRow.getCell(1).value = `KELOMPOK: ${currentKelompok}`;
            kelompokRow.height = 25;
            kelompokRow.eachCell((cell) => {
              Object.assign(cell, STYLES.subHeader);
              cell.border = BORDERS;
            });
            currentRow++;
            currentAHS = "";
            ahsTotal = 0;
          }

          // Add AHS header if new AHS
          if (currentAHS !== row.kode_ahs) {
            if (currentAHS !== "") {
              // Add previous AHS total
              addAHSTotal(sheet, currentRow++, ahsTotal);
              ahsTotal = 0;
            }

            currentAHS = row.kode_ahs;
            const ahsRow = sheet.getRow(currentRow);
            ahsRow.values = [
              row.kelompok,
              row.kode_ahs,
              row.ahs,
              row.satuan,
              "",
              "",
              "",
              "",
              "",
            ];
            ahsRow.height = 25;
            ahsRow.eachCell((cell) => {
              Object.assign(cell, STYLES.ahsHeader);
              cell.border = BORDERS;
            });
            currentRow++;
          }

          // Add material/wage row
          if (row.material_name) {
            const amount = row.koefisien * row.material_price;
            ahsTotal += amount;

            const itemRow = sheet.getRow(currentRow);
            itemRow.values = [
              "",
              "",
              `- ${row.material_name} (${row.material_category})`,
              "",
              row.koefisien,
              row.material_price,
              row.material_lokasi || "-",
              row.material_sumber_data || "-",
              amount,
            ];
            itemRow.height = 22;
            itemRow.eachCell((cell, colNumber) => {
              cell.border = BORDERS;
              cell.alignment = { vertical: "middle" };
              // Format currency columns
              if (colNumber === 6 || colNumber === 9) {
                cell.numFmt = CURRENCY_FORMAT;
              }
            });
            currentRow++;
          }

          // Add final AHS total if last row
          if (index === rows.length - 1 && ahsTotal > 0) {
            addAHSTotal(sheet, currentRow++, ahsTotal);
          }
        });

        resolve();
      }
    );
  });
}

function addAHSTotal(sheet, row, total) {
  const totalRow = sheet.getRow(row);
  sheet.mergeCells(`A${row}:H${row}`);
  totalRow.getCell(1).value = "HARGA SATUAN PEKERJAAN";
  totalRow.getCell(9).value = total;
  totalRow.getCell(9).numFmt = CURRENCY_FORMAT;
  totalRow.height = 25;
  totalRow.eachCell((cell) => {
    Object.assign(cell, STYLES.totalRow);
    cell.border = BORDERS;
  });
}

module.exports = { addDetailedAHSSheet };
