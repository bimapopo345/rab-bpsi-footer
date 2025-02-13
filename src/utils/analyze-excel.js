const ExcelJS = require("exceljs");
const path = require("path");

async function analyzeExcel() {
  try {
    const workbook = new ExcelJS.Workbook();
    const filepath = path.join("EXCEL", "analisa-2.xlsx");
    console.log("Attempting to read:", filepath);

    await workbook.xlsx.readFile(filepath);
    const worksheet = workbook.getWorksheet("Sheet1");

    if (!worksheet) {
      throw new Error("Could not find Sheet1");
    }

    console.log("Successfully loaded worksheet. Processing rows...");

    let currentAHS = null;
    let currentSection = null;
    let ahsList = [];

    // Process each row
    worksheet.eachRow((row, rowNumber) => {
      const values = row.values;
      if (!values || values.length === 0) return;

      const id = values[1] ? values[1].toString().trim() : "";
      const sectionOrCode = values[2] ? values[2].toString().trim() : "";
      const uraian = values[3] ? values[3].toString().trim() : "";
      const kode = values[4] ? values[4].toString().trim() : "";

      // Debug log first 20 rows
      if (rowNumber < 20) {
        console.log(
          `Row ${rowNumber}: ID="${id}", Section/Code="${sectionOrCode}", Uraian="${uraian}", Kode="${kode}", Satuan=`,
          values[5],
          ", Koefisien=",
          values[6]
        );
      }

      // Check if this is an AHS header row (contains the AHS code in column 2)
      if (sectionOrCode && sectionOrCode.match(/^A\.\d+/)) {
        console.log(`\nFound AHS header: ${sectionOrCode} - ${uraian}`);
        if (currentAHS) {
          ahsList.push(currentAHS);
        }
        currentAHS = {
          kode_ahs: sectionOrCode.trim(),
          description: uraian,
          tenaga: [],
          bahan: [],
          peralatan: [],
        };
        currentSection = null;
        return;
      }

      // Skip header and summary rows
      if (!currentAHS) return;
      if (uraian === "No" || uraian === "No." || kode === "Kode") return;
      if (
        uraian.includes("JUMLAH") ||
        uraian.includes("Overhead") ||
        uraian.includes("PPN")
      )
        return;

      // Check for section headers
      if (sectionOrCode === "A" && uraian === "TENAGA") {
        console.log("Found TENAGA section");
        currentSection = "tenaga";
        return;
      } else if (sectionOrCode === "B" && uraian === "BAHAN") {
        console.log("Found BAHAN section");
        currentSection = "bahan";
        return;
      } else if (sectionOrCode === "C" && uraian === "PERALATAN") {
        console.log("Found PERALATAN section");
        currentSection = "peralatan";
        return;
      }

      // Skip empty and summary rows
      if (!currentSection || uraian.includes("JUMLAH") || !uraian) {
        return;
      }

      // Debug rows for understanding data structure
      if (rowNumber < 100) {
        console.log(`Processing ${currentSection} row:`, {
          rowNumber,
          id,
          uraian,
          kode,
          satuan: values[5],
          koefisien: values[6],
          fullRow: values,
        });
      }

      // Process items with meaningful data
      if (currentSection && uraian) {
        // Check for uraian in column 2
        const item = {
          id: id,
          uraian: uraian,
          kode: kode,
          satuan:
            values[5] && values[5].result
              ? values[5].result
              : values[5]?.toString() || "",
          koefisien: values[6]
            ? typeof values[6] === "number"
              ? values[6]
              : values[6].result
              ? parseFloat(values[6].result)
              : values[6].toString
              ? parseFloat(values[6].toString())
              : 0
            : 0,
        };

        // Only add if we have valid uraian
        if (item.uraian && (item.id || item.kode)) {
          console.log(`Adding ${currentSection} item:`, item);
          switch (currentSection) {
            case "tenaga":
              currentAHS.tenaga.push(item);
              break;
            case "bahan":
              currentAHS.bahan.push(item);
              break;
            case "peralatan":
              currentAHS.peralatan.push(item);
              break;
          }
        }
      }
    });

    // Add the last AHS
    if (currentAHS) {
      ahsList.push(currentAHS);
    }

    // Print structured data
    console.log("\nAnalyzed AHS Data:");
    console.log(`Found ${ahsList.length} AHS items`);
    ahsList.forEach((ahs, index) => {
      console.log(`\n${index + 1}. AHS: ${ahs.kode_ahs}`);
      console.log("Description:", ahs.description);

      console.log("\nTenaga:");
      ahs.tenaga.forEach((item) => {
        console.log(
          `- [${item.id}] ${item.uraian} (${item.kode}): ${item.koefisien} ${item.satuan}`
        );
      });

      console.log("\nBahan:");
      ahs.bahan.forEach((item) => {
        console.log(
          `- ${item.uraian} (${item.kode}): ${item.koefisien} ${item.satuan}`
        );
      });

      console.log("\nPeralatan:");
      ahs.peralatan.forEach((item) => {
        console.log(
          `- ${item.uraian} (${item.kode}): ${item.koefisien} ${item.satuan}`
        );
      });
    });
  } catch (err) {
    console.error("Error analyzing Excel:", err);
  }
}

analyzeExcel();
