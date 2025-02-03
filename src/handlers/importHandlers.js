const ExcelJS = require("exceljs");
const fs = require("fs");
const path = require("path");
const { dialog } = require("electron");

function setupImportHandlers(ipcMain, db) {
  // Import user data from Excel - for regular users
  ipcMain.handle("import-my-data", async (event, userId) => {
    try {
      const { filePaths } = await dialog.showOpenDialog({
        title: "Select Excel File",
        filters: [{ name: "Excel Files", extensions: ["xlsx"] }],
        properties: ["openFile"],
      });

      if (!filePaths || filePaths.length === 0) {
        return { success: false, message: "Tidak ada file yang dipilih" };
      }

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePaths[0]);

      // Start a transaction
      await new Promise((resolve, reject) => {
        db.run("BEGIN TRANSACTION", (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      try {
        // Delete existing user data first
        await Promise.all([
          new Promise((resolve, reject) => {
            db.run(
              "DELETE FROM materials WHERE user_id = ?",
              [userId],
              (err) => {
                if (err) reject(err);
                else resolve();
              }
            );
          }),
          new Promise((resolve, reject) => {
            db.run("DELETE FROM ahs WHERE user_id = ?", [userId], (err) => {
              if (err) reject(err);
              else resolve();
            });
          }),
          new Promise((resolve, reject) => {
            db.run(
              "DELETE FROM projects WHERE user_id = ?",
              [userId],
              (err) => {
                if (err) reject(err);
                else resolve();
              }
            );
          }),
          new Promise((resolve, reject) => {
            db.run("DELETE FROM pricing WHERE user_id = ?", [userId], (err) => {
              if (err) reject(err);
              else resolve();
            });
          }),
        ]);

        // Import materials
        if (workbook.getWorksheet("Materials")) {
          const materialsSheet = workbook.getWorksheet("Materials");
          await new Promise((resolve, reject) => {
            const stmt = db.prepare(
              "INSERT INTO materials (user_id, name, unit, price, category, description) VALUES (?, ?, ?, ?, ?, ?)"
            );

            materialsSheet.eachRow((row, rowNumber) => {
              // Skip instruction and header rows (first 6 rows)
              if (rowNumber > 6) {
                const price = row.getCell(3).value;
                // Handle formatted currency cells
                const priceValue =
                  typeof price === "object"
                    ? price.result || price.value
                    : price;

                stmt.run(
                  [
                    userId,
                    row.getCell(1).value, // name
                    row.getCell(2).value, // unit
                    priceValue, // price (cleaned)
                    row.getCell(4).value, // category
                    row.getCell(5).value, // description
                  ],
                  (err) => {
                    if (err) reject(err);
                  }
                );
              }
            });

            stmt.finalize((err) => {
              if (err) reject(err);
              else resolve();
            });
          });
        }

        // Import AHS
        if (workbook.getWorksheet("AHS")) {
          const ahsSheet = workbook.getWorksheet("AHS");
          await new Promise((resolve, reject) => {
            const stmt = db.prepare(
              "INSERT INTO ahs (user_id, kelompok, kode_ahs, ahs, satuan) VALUES (?, ?, ?, ?, ?)"
            );

            ahsSheet.eachRow((row, rowNumber) => {
              // Skip instruction and header rows (first 6 rows)
              if (rowNumber > 6) {
                stmt.run(
                  [
                    userId,
                    row.getCell(1).value, // kelompok
                    row.getCell(2).value, // kode_ahs
                    row.getCell(3).value, // ahs
                    row.getCell(4).value, // satuan
                  ],
                  (err) => {
                    if (err) reject(err);
                  }
                );
              }
            });

            stmt.finalize((err) => {
              if (err) reject(err);
              else resolve();
            });
          });
        }

        // Import Projects
        if (workbook.getWorksheet("Projects")) {
          const projectsSheet = workbook.getWorksheet("Projects");
          await new Promise((resolve, reject) => {
            const stmt = db.prepare(
              "INSERT INTO projects (user_id, name, location) VALUES (?, ?, ?)"
            );

            projectsSheet.eachRow((row, rowNumber) => {
              // Skip instruction and header rows (first 5 rows)
              if (rowNumber > 5) {
                stmt.run(
                  [
                    userId,
                    row.getCell(1).value, // name
                    row.getCell(2).value, // location
                  ],
                  (err) => {
                    if (err) reject(err);
                  }
                );
              }
            });

            stmt.finalize((err) => {
              if (err) reject(err);
              else resolve();
            });
          });
        }

        // Import Pricing
        if (workbook.getWorksheet("Pricing")) {
          const pricingSheet = workbook.getWorksheet("Pricing");

          // Get AHS and material mappings
          const [ahsRows, materialRows] = await Promise.all([
            new Promise((resolve, reject) => {
              db.all(
                "SELECT id, kode_ahs FROM ahs WHERE user_id = ?",
                [userId],
                (err, rows) => {
                  if (err) reject(err);
                  else resolve(rows);
                }
              );
            }),
            new Promise((resolve, reject) => {
              db.all(
                "SELECT id, name FROM materials WHERE user_id = ?",
                [userId],
                (err, rows) => {
                  if (err) reject(err);
                  else resolve(rows);
                }
              );
            }),
          ]);

          const ahsMap = new Map(ahsRows.map((row) => [row.kode_ahs, row.id]));
          const materialMap = new Map(
            materialRows.map((row) => [row.name, row.id])
          );

          await new Promise((resolve, reject) => {
            const stmt = db.prepare(
              "INSERT INTO pricing (user_id, ahs_id, material_id, quantity, koefisien) VALUES (?, ?, ?, ?, ?)"
            );

            const insertPromises = [];

            // Process each row
            for (
              let rowNumber = 7;
              rowNumber <= pricingSheet.rowCount;
              rowNumber++
            ) {
              const row = pricingSheet.getRow(rowNumber);
              const kodeAhs = row.getCell(1).value;
              const materialName = row.getCell(2).value;

              if (kodeAhs && materialName) {
                const ahsId = ahsMap.get(kodeAhs);
                const materialId = materialMap.get(materialName);

                if (!ahsId) {
                  console.warn(`Warning: AHS code "${kodeAhs}" not found`);
                  continue;
                }
                if (!materialId) {
                  console.warn(`Warning: Material "${materialName}" not found`);
                  continue;
                }

                let quantity = row.getCell(3).value;
                let koefisien = row.getCell(4).value;

                // Handle formatted number cells
                quantity =
                  typeof quantity === "object"
                    ? quantity.result || quantity.value
                    : quantity;
                koefisien =
                  typeof koefisien === "object"
                    ? koefisien.result || koefisien.value
                    : koefisien;

                insertPromises.push(
                  new Promise((resolve, reject) => {
                    stmt.run(
                      [userId, ahsId, materialId, quantity, koefisien],
                      (err) => {
                        if (err) {
                          console.warn(
                            `Warning: Error inserting pricing row: ${err.message}`
                          );
                          reject(err);
                        } else {
                          resolve();
                        }
                      }
                    );
                  })
                );
              }
            }

            Promise.all(insertPromises)
              .then(() => {
                stmt.finalize((err) => {
                  if (err) reject(err);
                  else resolve();
                });
              })
              .catch(reject);
          });
        }

        // Commit transaction
        await new Promise((resolve, reject) => {
          db.run("COMMIT", (err) => {
            if (err) reject(err);
            else resolve();
          });
        });

        return { success: true, message: "Data berhasil diimpor" };
      } catch (error) {
        // Rollback on error
        await new Promise((resolve) => {
          db.run("ROLLBACK", () => resolve());
        });
        throw error;
      }
    } catch (error) {
      console.error("Import error:", error);
      return {
        success: false,
        message: "Error mengimpor data: " + error.message,
      };
    }
  });

  // Import database - admin only
  ipcMain.handle("import-database", async (event) => {
    try {
      const { filePaths } = await dialog.showOpenDialog({
        title: "Select Database File",
        filters: [{ name: "SQLite Database", extensions: ["sqlite"] }],
        properties: ["openFile"],
      });

      if (!filePaths || filePaths.length === 0) {
        return { success: false, message: "Tidak ada file yang dipilih" };
      }

      // Close current database connection
      await new Promise((resolve, reject) => {
        db.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // Replace current database file
      await new Promise((resolve, reject) => {
        const readStream = fs.createReadStream(filePaths[0]);
        const writeStream = fs.createWriteStream("database.sqlite");

        readStream.on("error", reject);
        writeStream.on("error", reject);
        writeStream.on("finish", resolve);

        readStream.pipe(writeStream);
      });

      return {
        success: true,
        message:
          "Database berhasil diimpor. Silakan restart aplikasi untuk menggunakan database baru.",
      };
    } catch (error) {
      console.error("Database import error:", error);
      return {
        success: false,
        message: "Error mengimpor database: " + error.message,
      };
    }
  });
}

module.exports = { setupImportHandlers };
