const ExcelJS = require("exceljs");
const path = require("path");

async function readExcelFile(filePath) {
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.readFile(filePath);
    const result = {};

    workbook.worksheets.forEach((worksheet) => {
      const sheetData = [];
      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        sheetData.push(row.values);
      });
      result[worksheet.name] = sheetData;
    });

    return result;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return null;
  }
}

async function analyzeExcelFiles() {
  const baseDir = "./EXCEL/BQ";
  const files = [
    "1. Rekap.xlsx",
    "2. BQ.xlsx",
    "3. Rekap HSP.xlsx",
    "4. Analisa_FIX.xlsx",
    "5. Daftar Harga.xlsx",
  ];

  for (const file of files) {
    const filePath = path.join(baseDir, file);
    console.log(`\nAnalyzing ${file}...`);
    const data = await readExcelFile(filePath);

    if (data) {
      Object.keys(data).forEach((sheetName) => {
        console.log(`\nSheet: ${sheetName}`);
        console.log("First few rows:");
        console.log(data[sheetName].slice(0, 5));
      });
    }
  }
}

analyzeExcelFiles().catch(console.error);
