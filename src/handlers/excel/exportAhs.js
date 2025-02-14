async function exportAhsToExcel(workbook, ahsData) {
  const worksheet = workbook.addWorksheet("Sheet1");

  // Set column widths
  worksheet.columns = [
    { width: 12 }, // No
    { width: 30 }, // Uraian
    { width: 15 }, // Kode
    { width: 10 }, // Satuan
    { width: 10 }, // Koefisien
    { width: 15 }, // Harga Satuan
    { width: 15 }, // Jumlah
    { width: 15 }, // Harga Satuan (KAT III)
    { width: 15 }, // Jumlah (KAT III)
  ];

  // Define styles
  const styles = {
    header: {
      font: { bold: true, size: 11 },
      alignment: { horizontal: "center", vertical: "middle" },
      border: {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      },
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" },
      },
    },
    sectionHeader: {
      font: { bold: true, size: 11 },
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF0F0F0" },
      },
    },
    cell: {
      border: {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      },
    },
  };

  // Process each AHS
  for (const ahs of ahsData) {
    // Add AHS header
    const headerRow = worksheet.addRow([
      ahs.kode_ahs,
      ahs.ahs,
      ahs.ahs,
      ahs.ahs,
      ahs.ahs,
      "KATEGORI II (SEDANG)",
      "KATEGORI II (SEDANG)",
      "KATEGORI III (SULIT)",
      "KATEGORI III (SULIT)",
    ]);
    headerRow.eachCell((cell) => {
      Object.assign(cell.style, styles.header);
    });
    headerRow.height = 30;

    // Add column headers
    const columnHeaderRow1 = worksheet.addRow([
      "No",
      "Uraian",
      "Kode",
      "Satuan",
      "Koefisien",
      "Harga Satuan",
      "Jumlah",
      "Harga Satuan",
      "Jumlah",
    ]);
    columnHeaderRow1.eachCell((cell) => {
      Object.assign(cell.style, styles.header);
    });

    const columnHeaderRow2 = worksheet.addRow([
      "No",
      "Uraian",
      "Kode",
      "Satuan",
      "Koefisien",
      "(Rp)",
      "Harga",
      "(Rp)",
      "Harga",
    ]);
    columnHeaderRow2.eachCell((cell) => {
      Object.assign(cell.style, styles.header);
    });

    // Add sections
    // TENAGA section
    const tenagaHeader = worksheet.addRow(["A", "TENAGA"]);
    tenagaHeader.eachCell((cell) => {
      Object.assign(cell.style, styles.sectionHeader);
    });

    let totalTenaga = 0;
    ahs.items.tenaga.forEach((item, idx) => {
      const jumlah = item.price * item.koefisien;
      totalTenaga += jumlah;
      const row = worksheet.addRow([
        idx + 1,
        item.name,
        item.kode,
        item.unit,
        item.koefisien,
        item.price,
        jumlah,
        item.price,
        jumlah,
      ]);
      row.eachCell((cell) => {
        Object.assign(cell.style, styles.cell);
        if ([5, 6, 7, 8, 9].includes(cell.col)) {
          cell.numFmt = "#,##0.00";
        }
      });
    });

    const tenagaTotalRow = worksheet.addRow([
      "JUMLAH TENAGA KERJA",
      "",
      "",
      "",
      "",
      "",
      totalTenaga,
      "",
      totalTenaga,
    ]);
    tenagaTotalRow.eachCell((cell) => {
      Object.assign(cell.style, styles.sectionHeader);
      if ([7, 9].includes(cell.col)) {
        cell.numFmt = "#,##0.00";
      }
    });

    // BAHAN section
    const bahanHeader = worksheet.addRow(["B", "BAHAN"]);
    bahanHeader.eachCell((cell) => {
      Object.assign(cell.style, styles.sectionHeader);
    });

    let totalBahan = 0;
    ahs.items.bahan.forEach((item, idx) => {
      const jumlah = item.price * item.koefisien;
      totalBahan += jumlah;
      const row = worksheet.addRow([
        idx + 1,
        item.name,
        item.kode,
        item.unit,
        item.koefisien,
        item.price,
        jumlah,
        item.price,
        jumlah,
      ]);
      row.eachCell((cell) => {
        Object.assign(cell.style, styles.cell);
        if ([5, 6, 7, 8, 9].includes(cell.col)) {
          cell.numFmt = "#,##0.00";
        }
      });
    });

    const bahanTotalRow = worksheet.addRow([
      "JUMLAH HARGA BAHAN",
      "",
      "",
      "",
      "",
      "",
      totalBahan,
      "",
      totalBahan,
    ]);
    bahanTotalRow.eachCell((cell) => {
      Object.assign(cell.style, styles.sectionHeader);
      if ([7, 9].includes(cell.col)) {
        cell.numFmt = "#,##0.00";
      }
    });

    // ALAT section
    const alatHeader = worksheet.addRow(["C", "PERALATAN"]);
    alatHeader.eachCell((cell) => {
      Object.assign(cell.style, styles.sectionHeader);
    });

    let totalAlat = 0;
    ahs.items.alat.forEach((item, idx) => {
      const jumlah = item.price * item.koefisien;
      totalAlat += jumlah;
      const row = worksheet.addRow([
        idx + 1,
        item.name,
        item.kode,
        item.unit,
        item.koefisien,
        item.price,
        jumlah,
        item.price,
        jumlah,
      ]);
      row.eachCell((cell) => {
        Object.assign(cell.style, styles.cell);
        if ([5, 6, 7, 8, 9].includes(cell.col)) {
          cell.numFmt = "#,##0.00";
        }
      });
    });

    const alatTotalRow = worksheet.addRow([
      "JUMLAH HARGA ALAT",
      "",
      "",
      "",
      "",
      "",
      totalAlat,
      "",
      totalAlat,
    ]);
    alatTotalRow.eachCell((cell) => {
      Object.assign(cell.style, styles.sectionHeader);
      if ([7, 9].includes(cell.col)) {
        cell.numFmt = "#,##0.00";
      }
    });

    // Total calculations
    const subtotal = totalTenaga + totalBahan + totalAlat;
    const overhead = subtotal * 0.1; // 10% overhead
    const total = subtotal + overhead;
    const ppn = total * 0.12; // 12% PPN
    const grandTotal = total + ppn;

    // Add total rows with styling
    worksheet
      .addRow(["D", "Jumlah (A+B+C)", "", "", "", "", subtotal, "", subtotal])
      .eachCell((cell) => {
        Object.assign(cell.style, styles.sectionHeader);
        if ([7, 9].includes(cell.col)) cell.numFmt = "#,##0.00";
      });

    worksheet
      .addRow([
        "E",
        "Overhead & Profit (Maksimal 15%)",
        "Overhead & Profit (Maksimal 15%)",
        "Overhead & Profit (Maksimal 15%)",
        0.1,
        "x D",
        overhead,
        "",
        overhead,
      ])
      .eachCell((cell) => {
        Object.assign(cell.style, styles.sectionHeader);
        if ([7, 9].includes(cell.col)) cell.numFmt = "#,##0.00";
      });

    worksheet
      .addRow([
        "F",
        "Harga Satuan Pekerjaan (D+E)",
        "",
        "",
        "",
        "",
        total,
        "",
        total,
      ])
      .eachCell((cell) => {
        Object.assign(cell.style, styles.sectionHeader);
        if ([7, 9].includes(cell.col)) cell.numFmt = "#,##0.00";
      });

    worksheet
      .addRow([
        "G",
        "Pajak Pertambahan Nilai (PPN)",
        0.12,
        "x F",
        "",
        "",
        ppn,
        "",
        ppn,
      ])
      .eachCell((cell) => {
        Object.assign(cell.style, styles.sectionHeader);
        if ([7, 9].includes(cell.col)) cell.numFmt = "#,##0.00";
      });

    worksheet
      .addRow(["H", "TOTAL", "", "", "", "", grandTotal, "", grandTotal])
      .eachCell((cell) => {
        Object.assign(cell.style, styles.sectionHeader);
        if ([7, 9].includes(cell.col)) cell.numFmt = "#,##0.00";
      });

    // Add empty rows between AHS
    worksheet.addRow([]);
    worksheet.addRow([]);
  }

  return worksheet;
}

module.exports = { exportAhsToExcel };
