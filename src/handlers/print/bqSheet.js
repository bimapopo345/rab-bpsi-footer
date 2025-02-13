const { STYLES, BORDERS, formatRupiah, addProjectHeader } = require("./styles");

const addBQSheet = async (workbook, db, userId, project) => {
  const worksheet = workbook.addWorksheet("BQ");

  // Set columns
  worksheet.columns = [
    { header: "NO.", key: "no", width: 5 },
    { header: "KODE AHS", key: "kode_ahs", width: 15 },
    { header: "URAIAN PEKERJAAN", key: "ahs", width: 40 },
    { header: "BENTUK", key: "shape", width: 15 },
    { header: "DIMENSI", key: "dimensions", width: 20 },
    { header: "VOLUME", key: "volume", width: 12 },
    { header: "SATUAN", key: "unit", width: 10 },
    { header: "HARGA SATUAN (Rp)", key: "unit_price", width: 20 },
    { header: "JUMLAH HARGA (Rp)", key: "total", width: 25 },
  ];

  // Add standardized project header
  addProjectHeader(worksheet, project, 9);

  // Add column headers (now row 5 after spacing)
  const headerRow = worksheet.getRow(5);
  headerRow.values = [
    "NO.",
    "KODE",
    "URAIAN",
    "BENTUK",
    "DIMENSI",
    "VOLUME",
    "SATUAN",
    "HARGA",
    "JUMLAH",
  ];

  // Style headers
  headerRow.height = 30;
  headerRow.eachCell((cell) => {
    cell.font = { ...STYLES.header.font, size: 11 };
    cell.fill = STYLES.header.fill;
    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };
    cell.border = BORDERS;
  });

  // Fetch and add data
  try {
    let startingRow = 6; // Data starts one row earlier now

    // Get BQ items with AHS details and calculated total price
    const items = await new Promise((resolve, reject) => {
      db.all(
        `
        SELECT 
          b.*,
          a.kode_ahs,
          a.ahs,
          (SELECT SUM(m.price * p.koefisien)
           FROM pricing p
           INNER JOIN materials m ON m.id = p.material_id
           WHERE p.ahs_id = b.ahs_id) as unit_price
        FROM bq b
        INNER JOIN ahs a ON a.id = b.ahs_id
        WHERE b.user_id = ?
        ORDER BY b.created_at DESC
        `,
        [userId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });

    let currentRow = startingRow;
    let subtotal = 0;

    items.forEach((item, index) => {
      const total = item.volume * item.unit_price;
      let dimensions = "";
      try {
        const dims = JSON.parse(item.dimensions);
        switch (item.shape) {
          case "persegi":
            dimensions = `${dims.sisi} x ${dims.sisi}`;
            break;
          case "persegiPanjang":
            dimensions = `${dims.panjang} x ${dims.lebar}`;
            break;
          case "trapesium":
            dimensions = `a=${dims.sisiAtas}, b=${dims.sisiBawah}, t=${dims.tinggi}`;
            break;
          case "lingkaran":
            dimensions = `r=${dims.jariJari}`;
            break;
          case "kubus":
            dimensions = `${dims.sisi} x ${dims.sisi} x ${dims.sisi}`;
            break;
          case "balok":
            dimensions = `${dims.panjang} x ${dims.lebar} x ${dims.tinggi}`;
            break;
        }
      } catch (e) {
        dimensions = "-";
      }

      const row = worksheet.addRow({
        no: index + 1,
        kode_ahs: item.kode_ahs || "-",
        ahs: item.ahs,
        shape: formatShapeName(item.shape),
        dimensions: dimensions,
        volume: Number(item.volume).toFixed(2),
        unit: "m²",
        unit_price: formatRupiah(item.unit_price),
        total: formatRupiah(total),
      });

      subtotal += total;

      // Style data rows
      row.eachCell((cell) => {
        cell.border = BORDERS;
        cell.alignment = { ...STYLES.normal.alignment, wrapText: true };
        cell.font = STYLES.normal.font;
      });

      // Right align numbers
      row.getCell("volume").alignment = { horizontal: "right" };
      row.getCell("unit_price").alignment = { horizontal: "right" };
      row.getCell("total").alignment = { horizontal: "right" };

      currentRow++;
    });

    // Add subtotal with total row styling
    const subtotalRow = worksheet.addRow({
      ahs: "JUMLAH",
      total: formatRupiah(subtotal),
    });
    subtotalRow.font = STYLES.totalRow.font;
    subtotalRow.fill = STYLES.totalRow.fill;
    subtotalRow.getCell("total").alignment = { horizontal: "right" };

    // Add PPN 11%
    const ppn = subtotal * 0.11;
    const ppnRow = worksheet.addRow({
      ahs: "PPN 11%",
      total: formatRupiah(ppn),
    });
    ppnRow.font = STYLES.totalRow.font;
    ppnRow.fill = STYLES.totalRow.fill;
    ppnRow.getCell("total").alignment = { horizontal: "right" };

    // Add grand total
    const totalRow = worksheet.addRow({
      ahs: "TOTAL",
      total: formatRupiah(subtotal + ppn),
    });
    totalRow.font = { ...STYLES.totalRow.font, bold: true };
    totalRow.fill = STYLES.totalRow.fill;
    totalRow.getCell("total").alignment = { horizontal: "right" };
  } catch (error) {
    console.error("Error generating BQ sheet:", error);
    throw error;
  }
};

// Helper function to format shape names
function formatShapeName(shape) {
  const shapeNames = {
    persegi: "Persegi",
    persegiPanjang: "Persegi Panjang",
    trapesium: "Trapesium",
    lingkaran: "Lingkaran",
    kubus: "Kubus",
    balok: "Balok",
  };
  return shapeNames[shape] || shape;
}

module.exports = { addBQSheet };
