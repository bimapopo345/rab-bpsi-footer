const { STYLES, BORDERS, formatRupiah } = require("./styles");

const addBQSheet = async (workbook, db, userId, project) => {
  const worksheet = workbook.addWorksheet("BQ");

  // Set column widths and properties
  worksheet.columns = [
    { header: "No", key: "no", width: 5 },
    { header: "Kode AHS", key: "kode_ahs", width: 15 },
    { header: "Uraian Pekerjaan", key: "ahs", width: 40 },
    { header: "Bentuk", key: "shape", width: 15 },
    { header: "Volume (m²)", key: "volume", width: 15 },
    { header: "Harga Satuan", key: "unit_price", width: 20 },
    { header: "Jumlah Harga", key: "total", width: 25 },
  ];

  // Add title with project styling
  worksheet.mergeCells("A1:G2");
  const titleCell = worksheet.getCell("A1");
  titleCell.value = `RENCANA ANGGARAN BIAYA (RAB)\n${project.name}`;
  titleCell.font = { bold: true, size: 14 };
  titleCell.alignment = {
    horizontal: "center",
    vertical: "middle",
    wrapText: true,
  };
  titleCell.fill = STYLES.header.fill;
  titleCell.font = { ...STYLES.header.font, size: 14 };

  // Add project info with sub-header styling
  worksheet.mergeCells("A3:G3");
  const locationCell = worksheet.getCell("A3");
  locationCell.value = `Lokasi: ${project.location}`;
  locationCell.font = STYLES.subHeader.font;
  locationCell.fill = STYLES.subHeader.fill;
  locationCell.alignment = { horizontal: "left", vertical: "middle" };

  // Style header row
  const headerRow = worksheet.getRow(5);
  headerRow.font = STYLES.groupHeader.font;
  headerRow.alignment = STYLES.groupHeader.alignment;
  headerRow.height = 30;

  // Apply header styling
  headerRow.eachCell((cell) => {
    cell.fill = STYLES.groupHeader.fill;
    cell.border = BORDERS;
  });

  // Fetch and add data
  try {
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

    let currentRow = 6;
    let subtotal = 0;

    items.forEach((item, index) => {
      const total = item.volume * item.unit_price;
      const row = worksheet.addRow({
        no: index + 1,
        kode_ahs: item.kode_ahs || "-",
        ahs: item.ahs,
        shape: formatShapeName(item.shape),
        volume: Number(item.volume).toFixed(2),
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

    // Add signature section
    worksheet.addRow([]); // Empty row
    const currentDate = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    worksheet.mergeCells(`E${currentRow + 4}:G${currentRow + 4}`);
    const dateCell = worksheet.getCell(`E${currentRow + 4}`);
    dateCell.value = `${project.location}, ${currentDate}`;
    dateCell.alignment = { horizontal: "center" };
    dateCell.font = STYLES.normal.font;

    worksheet.mergeCells(`E${currentRow + 5}:G${currentRow + 5}`);
    const titleCell2 = worksheet.getCell(`E${currentRow + 5}`);
    titleCell2.value = "Mengetahui,";
    titleCell2.alignment = { horizontal: "center" };
    titleCell2.font = STYLES.normal.font;

    worksheet.mergeCells(`E${currentRow + 9}:G${currentRow + 9}`);
    const signCell = worksheet.getCell(`E${currentRow + 9}`);
    signCell.value = "(________________________)";
    signCell.alignment = { horizontal: "center" };
    signCell.font = STYLES.normal.font;
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
