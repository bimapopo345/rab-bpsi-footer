const ExcelJS = require("exceljs");
const path = require("path");

async function readExcel() {
  try {
    const workbook = new ExcelJS.Workbook();
    const filepath = path.join("EXCEL", "TEMPLATE-RAB-2025.xlsx");
    console.log("Reading:", filepath);

    await workbook.xlsx.readFile(filepath);

    workbook.worksheets.forEach((worksheet) => {
      console.log("\nSheet:", worksheet.name);

      let rowCount = 0;
      worksheet.eachRow({ includeEmpty: false }, function (row, rowNumber) {
        const values = row.values.filter((v) => v);
        if (values.length > 0) {
          console.log(`Row ${rowNumber}:`, JSON.stringify(values));
          rowCount++;
        }
        if (rowCount >= 5) return false;
      });
    });
  } catch (err) {
    console.error("Error:", err.message);
  }
}

readExcel();
