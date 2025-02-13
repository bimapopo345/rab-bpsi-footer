const { STYLES, BORDERS, formatRupiah, addProjectHeader } = require("./styles");

const addRekapSheet = async (workbook, db, userId, project) => {
  const worksheet = workbook.addWorksheet("Rekap BQ");

  // Set column structure with consistent styling
  worksheet.columns = [
    { header: "No", key: "no", width: 5 },
    { header: "Kelompok Pekerjaan", key: "kelompok", width: 50 },
    { header: "Jumlah Harga", key: "amount", width: 30 },
  ];

  // Add standardized project header
  addProjectHeader(worksheet, project, 3);

  // Style header row with group header styling
  const headerRow = worksheet.getRow(5);
  headerRow.font = STYLES.groupHeader.font;
  headerRow.height = 30;
  headerRow.alignment = STYLES.groupHeader.alignment;

  // Apply header styling
  headerRow.eachCell((cell) => {
    cell.fill = STYLES.groupHeader.fill;
    cell.border = BORDERS;
  });

  try {
    // Get AHS categories and their BQ totals
    const categories = await new Promise((resolve, reject) => {
      db.all(
        `
        SELECT 
          a.kelompok,
          SUM(b.volume * (
            SELECT SUM(m.price * p.koefisien)
            FROM pricing p
            INNER JOIN materials m ON m.id = p.material_id
            WHERE p.ahs_id = b.ahs_id
          )) as total
        FROM bq b
        INNER JOIN ahs a ON a.id = b.ahs_id
        WHERE b.user_id = ?
        GROUP BY a.kelompok
        ORDER BY a.kelompok
        `,
        [userId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });

    let currentRow = 6;
    let grandTotal = 0;

    // Add category rows with consistent styling
    categories.forEach((cat, index) => {
      const row = worksheet.addRow({
        no: index + 1,
        kelompok: cat.kelompok || "(Tidak ada kelompok)",
        amount: formatRupiah(cat.total),
      });

      grandTotal += cat.total;

      row.eachCell((cell) => {
        cell.border = BORDERS;
        cell.font = STYLES.normal.font;
        cell.alignment = { ...STYLES.normal.alignment, wrapText: true };
      });

      // Right align amount
      row.getCell("amount").alignment = { horizontal: "right" };
      currentRow++;
    });

    // Add subtotal with total row styling
    const subtotalRow = worksheet.addRow({
      kelompok: "JUMLAH",
      amount: formatRupiah(grandTotal),
    });
    subtotalRow.font = STYLES.totalRow.font;
    subtotalRow.fill = STYLES.totalRow.fill;
    subtotalRow.eachCell((cell) => {
      cell.border = BORDERS;
    });
    subtotalRow.getCell("amount").alignment = { horizontal: "right" };

    // Add PPN with total row styling
    const ppn = grandTotal * 0.11;
    const ppnRow = worksheet.addRow({
      kelompok: "PPN 11%",
      amount: formatRupiah(ppn),
    });
    ppnRow.font = STYLES.totalRow.font;
    ppnRow.fill = STYLES.totalRow.fill;
    ppnRow.eachCell((cell) => {
      cell.border = BORDERS;
    });
    ppnRow.getCell("amount").alignment = { horizontal: "right" };

    // Add total with total row styling and bold
    const totalRow = worksheet.addRow({
      kelompok: "TOTAL",
      amount: formatRupiah(grandTotal + ppn),
    });
    totalRow.font = { ...STYLES.totalRow.font, bold: true };
    totalRow.fill = STYLES.totalRow.fill;
    totalRow.eachCell((cell) => {
      cell.border = BORDERS;
    });
    totalRow.getCell("amount").alignment = { horizontal: "right" };

    // Add terbilang at the bottom
    worksheet.mergeCells(`A${currentRow + 4}:C${currentRow + 4}`);
    const terbilangCell = worksheet.getCell(`A${currentRow + 4}`);
    terbilangCell.value = `Terbilang: ${sayRupiah(grandTotal + ppn)}`;
    terbilangCell.font = { italic: true };
    terbilangCell.alignment = { horizontal: "left", vertical: "middle" };
  } catch (error) {
    console.error("Error generating rekap sheet:", error);
    throw error;
  }
};

// Helper function to convert number to words in Indonesian
function sayRupiah(number) {
  const digit = [
    "",
    "Satu",
    "Dua",
    "Tiga",
    "Empat",
    "Lima",
    "Enam",
    "Tujuh",
    "Delapan",
    "Sembilan",
  ];
  const level = ["", "Ribu", "Juta", "Milyar", "Triliun"];

  let str = Math.floor(number).toString();
  let result = "";
  let levelIndex = 0;

  while (str.length > 0) {
    const segment = str.slice(-3);
    str = str.slice(0, -3);

    let segmentResult = "";
    for (let i = 0; i < segment.length; i++) {
      const num = parseInt(segment[i]);
      if (num !== 0) {
        if (segment.length - i === 3) {
          segmentResult += digit[num] + " Ratus ";
        } else if (segment.length - i === 2) {
          if (num === 1) {
            const lastDigit = parseInt(segment[2]);
            if (lastDigit === 0) {
              segmentResult += "Sepuluh ";
            } else if (lastDigit === 1) {
              segmentResult += "Sebelas ";
            } else {
              segmentResult += digit[lastDigit] + " Belas ";
            }
            break;
          } else {
            segmentResult += digit[num] + " Puluh ";
          }
        } else {
          segmentResult += digit[num] + " ";
        }
      }
    }

    if (segmentResult) {
      result = segmentResult + level[levelIndex] + " " + result;
    }
    levelIndex++;
  }

  return result.trim() + " Rupiah";
}

module.exports = { addRekapSheet };
