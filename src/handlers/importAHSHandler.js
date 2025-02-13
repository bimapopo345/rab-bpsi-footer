const ExcelJS = require("exceljs");
const path = require("path");

async function importAHSFromExcel(db, filePath, userId) {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.getWorksheet("Sheet1");

    if (!worksheet) {
      throw new Error("Could not find Sheet1");
    }

    // Start a transaction
    await new Promise((resolve, reject) => {
      db.run("BEGIN TRANSACTION", (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    try {
      let currentAHS = null;
      let currentSection = null;
      let ahsPromises = [];

      // Process each row
      worksheet.eachRow((row, rowNumber) => {
        const values = row.values;
        if (!values || values.length === 0) return;

        const id = values[1] ? values[1].toString().trim() : "";
        const sectionOrCode = values[2] ? values[2].toString().trim() : "";
        const uraian = values[3] ? values[3].toString().trim() : "";
        const kode = values[4] ? values[4].toString().trim() : "";

        // Check for AHS header
        if (sectionOrCode && sectionOrCode.match(/^A\.\d+/)) {
          if (currentAHS) {
            // Save previous AHS
            ahsPromises.push(saveAHS(db, currentAHS, userId));
          }

          // Start new AHS
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

        // Skip if no current AHS or irrelevant rows
        if (!currentAHS) return;
        if (uraian === "No" || uraian === "No." || kode === "Kode") return;
        if (
          uraian.includes("JUMLAH") ||
          uraian.includes("Overhead") ||
          uraian.includes("PPN")
        )
          return;

        // Handle section changes
        if (sectionOrCode === "A" && uraian === "TENAGA") {
          currentSection = "tenaga";
          return;
        } else if (sectionOrCode === "B" && uraian === "BAHAN") {
          currentSection = "bahan";
          return;
        } else if (sectionOrCode === "C" && uraian === "PERALATAN") {
          currentSection = "peralatan";
          return;
        }

        // Skip empty and summary rows
        if (!currentSection || uraian.includes("JUMLAH") || !uraian) {
          return;
        }

        // Process items with meaningful data
        if (currentSection && uraian && (id || kode)) {
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

          if (item.uraian && (item.id || item.kode)) {
            currentAHS[currentSection].push(item);
          }
        }
      });

      // Save the last AHS
      if (currentAHS) {
        ahsPromises.push(saveAHS(db, currentAHS, userId));
      }

      // Wait for all AHS saves to complete
      await Promise.all(ahsPromises);

      // Commit transaction
      await new Promise((resolve, reject) => {
        db.run("COMMIT", (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      return { success: true, message: "Import completed successfully" };
    } catch (error) {
      // Rollback on error
      await new Promise((resolve) => {
        db.run("ROLLBACK", () => resolve());
      });
      throw error;
    }
  } catch (error) {
    return { success: false, message: "Error importing AHS: " + error.message };
  }
}

async function saveAHS(db, ahsData, userId) {
  return new Promise((resolve, reject) => {
    // Insert AHS header
    db.run(
      "INSERT INTO ahs (user_id, kelompok, kode_ahs, ahs, satuan) VALUES (?, ?, ?, ?, ?)",
      [userId, "DEFAULT", ahsData.kode_ahs, ahsData.description, ""],
      function (err) {
        if (err) {
          reject(err);
          return;
        }

        const ahsId = this.lastID;
        const promises = [];

        // Helper function to find or create material/upah
        const findOrCreateItem = (item, category) => {
          return new Promise((resolve, reject) => {
            db.get(
              "SELECT id FROM materials WHERE user_id = ? AND name = ?",
              [userId, item.uraian],
              (err, material) => {
                if (err) {
                  reject(err);
                  return;
                }

                if (material) {
                  resolve(material.id);
                } else {
                  db.run(
                    "INSERT INTO materials (user_id, kode, name, unit, category) VALUES (?, ?, ?, ?, ?)",
                    [userId, item.kode, item.uraian, item.satuan, category],
                    function (err) {
                      if (err) {
                        reject(err);
                        return;
                      }
                      resolve(this.lastID);
                    }
                  );
                }
              }
            );
          });
        };

        // Process all items
        const processItems = async (items, category) => {
          for (const item of items) {
            try {
              const materialId = await findOrCreateItem(item, category);
              promises.push(
                new Promise((resolve, reject) => {
                  db.run(
                    "INSERT INTO pricing (user_id, ahs_id, material_id, koefisien) VALUES (?, ?, ?, ?)",
                    [userId, ahsId, materialId, item.koefisien],
                    (err) => {
                      if (err) reject(err);
                      else resolve();
                    }
                  );
                })
              );
            } catch (err) {
              reject(err);
            }
          }
        };

        // Process each category
        Promise.all([
          processItems(ahsData.tenaga, "TENAGA"),
          processItems(ahsData.bahan, "BAHAN"),
          processItems(ahsData.peralatan, "PERALATAN"),
        ])
          .then(() => Promise.all(promises))
          .then(() => resolve())
          .catch(reject);
      }
    );
  });
}

module.exports = { importAHSFromExcel };
