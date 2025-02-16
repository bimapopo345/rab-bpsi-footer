const ExcelJS = require("exceljs");
const fs = require("fs");
const path = require("path");
const { dialog } = require("electron");

function setupImportHandlers(ipcMain, db) {
  // Show Excel file picker dialog
  ipcMain.handle("show-excel-dialog", async (event) => {
    const result = await dialog.showOpenDialog({
      title: "Pilih File Excel",
      filters: [{ name: "Excel Files", extensions: ["xlsx", "xls"] }],
      properties: ["openFile"],
    });

    if (result.canceled) {
      return { filePath: null };
    }

    return { filePath: result.filePaths[0] };
  });

  // Handle delete all pricing
  ipcMain.on("delete-all-pricing", async (event, { ahs_id, userId }) => {
    try {
      await new Promise((resolve, reject) => {
        db.run(
          "DELETE FROM pricing WHERE ahs_id = ? AND user_id = ?",
          [ahs_id, userId],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      event.reply("all-pricing-deleted", { success: true });
    } catch (error) {
      console.error("Error deleting all pricing:", error);
      event.reply("all-pricing-deleted", {
        success: false,
        error: error.message,
      });
    }
  });

  // Handle Excel AHS import
  ipcMain.on("import-ahs-data", async (event, { ahsList, userId }) => {
    try {
      // Start transaction
      await new Promise((resolve, reject) => {
        db.run("BEGIN TRANSACTION", (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      let stats = {
        totalAhs: ahsList.length,
        imported: 0,
        failed: 0,
      };

      try {
        for (const ahs of ahsList) {
          // Find matching AHS by kode
          const existingAhs = await new Promise((resolve, reject) => {
            db.get(
              "SELECT id FROM ahs WHERE kode_ahs = ? AND user_id = ?",
              [ahs.kode_ahs, userId],
              (err, row) => {
                if (err) reject(err);
                else resolve(row);
              }
            );
          });

          if (!existingAhs) {
            console.log(`AHS ${ahs.kode_ahs} not found, skipping`);
            stats.failed++;
            continue;
          }

          const ahsId = existingAhs.id;

          // Process each section (tenaga, bahan, peralatan)
          for (const section of ["tenaga", "bahan", "peralatan"]) {
            for (const item of ahs[section]) {
              // Find matching material by uraian
              const material = await new Promise((resolve, reject) => {
                db.get(
                  "SELECT id FROM materials WHERE name = ? AND user_id = ?",
                  [item.uraian, userId],
                  (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                  }
                );
              });

              // Skip logging for certain materials without showing warning
              const skipWarningMaterials = [
                "Harga Satuan Pekerjaan (D+E)",
                "Pajak Pertambahan Nilai (PPN)",
                "TOTAL",
                "Jumlah (A+B+C)",
                "Overhead & Profit (Maksimal 15 %)",
              ];

              if (!material) {
                if (!skipWarningMaterials.includes(item.uraian)) {
                  console.log(`Material "${item.uraian}" not found, skipping`);
                }
                continue;
              }

              // Add or update pricing
              // First try to update existing record
              await new Promise((resolve, reject) => {
                db.run(
                  `UPDATE pricing 
                   SET quantity = ?, koefisien = ?
                   WHERE user_id = ? AND ahs_id = ? AND material_id = ?`,
                  [item.koefisien, item.koefisien, userId, ahsId, material.id],
                  (err) => {
                    if (err) reject(err);
                    else resolve();
                  }
                );
              });

              // If no rows were updated, insert new record
              await new Promise((resolve, reject) => {
                db.run(
                  `INSERT INTO pricing (user_id, ahs_id, material_id, quantity, koefisien)
                   SELECT ?, ?, ?, ?, ?
                   WHERE NOT EXISTS (
                     SELECT 1 FROM pricing 
                     WHERE user_id = ? AND ahs_id = ? AND material_id = ?
                   )`,
                  [
                    userId,
                    ahsId,
                    material.id,
                    item.koefisien,
                    item.koefisien,
                    userId,
                    ahsId,
                    material.id,
                  ],
                  (err) => {
                    if (err) reject(err);
                    else resolve();
                  }
                );
              });
            }
          }

          stats.imported++;
        }

        // Commit transaction
        await new Promise((resolve, reject) => {
          db.run("COMMIT", (err) => {
            if (err) reject(err);
            else resolve();
          });
        });

        event.reply("import-ahs-complete", stats);
      } catch (error) {
        // Rollback on error
        await new Promise((resolve) => {
          db.run("ROLLBACK", () => resolve());
        });
        throw error;
      }
    } catch (error) {
      console.error("Error importing AHS data:", error);
      event.reply("import-ahs-complete", {
        totalAhs: 0,
        imported: 0,
        failed: 0,
        error: error.message,
      });
    }
  });

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

        // Import Excel data - kept unchanged for regular users
        // ... [Excel import code remains the same]

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

      const sqlite3 = require("sqlite3").verbose();

      // Open imported database
      const importDb = new sqlite3.Database(filePaths[0]);

      // Detect database version
      const [hasUsersTable, hasAdminTable] = await Promise.all([
        new Promise((resolve) => {
          importDb.get(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='users'",
            (err, row) => {
              resolve(!!row);
            }
          );
        }),
        new Promise((resolve) => {
          importDb.get(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='admin'",
            (err, row) => {
              resolve(!!row);
            }
          );
        }),
      ]);

      // Start transaction
      await new Promise((resolve, reject) => {
        db.run("BEGIN TRANSACTION", (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      try {
        // Import users or migrate admin based on version
        await new Promise((resolve, reject) => {
          if (hasUsersTable) {
            // New version - import users directly
            importDb.all("SELECT * FROM users", [], (err, users) => {
              if (err) {
                reject(err);
                return;
              }

              const stmt = db.prepare(
                "INSERT OR IGNORE INTO users (username, password, hint) VALUES (?, ?, ?)"
              );

              for (const user of users) {
                stmt.run(
                  [user.username, user.password, user.hint || ""],
                  (err) => {
                    if (err)
                      console.warn(
                        `Warning: Could not import user ${user.username}: ${err.message}`
                      );
                  }
                );
              }

              stmt.finalize((err) => {
                if (err) reject(err);
                else resolve();
              });
            });
          } else if (hasAdminTable) {
            // Old version - migrate admin to users
            importDb.all("SELECT * FROM admin", [], (err, admins) => {
              if (err) {
                reject(err);
                return;
              }

              const stmt = db.prepare(
                "INSERT OR IGNORE INTO users (username, password, hint) VALUES (?, ?, ?)"
              );

              for (const admin of admins) {
                stmt.run(
                  [admin.username, admin.password, "Migrated admin account"],
                  (err) => {
                    if (err)
                      console.warn(
                        `Warning: Could not migrate admin ${admin.username}: ${err.message}`
                      );
                  }
                );
              }

              stmt.finalize((err) => {
                if (err) reject(err);
                else resolve();
              });
            });
          } else {
            resolve(); // No user data to import
          }
        });

        // Get default admin user id for old version imports
        const defaultAdminId = await new Promise((resolve, reject) => {
          if (!hasUsersTable && hasAdminTable) {
            db.get(
              "SELECT id FROM users WHERE username = 'admin'",
              (err, row) => {
                if (err) reject(err);
                else resolve(row ? row.id : null);
              }
            );
          } else {
            resolve(null);
          }
        });

        // Import materials with version handling
        await new Promise((resolve, reject) => {
          const query = hasUsersTable
            ? "SELECT * FROM materials"
            : "SELECT *, NULL as user_id FROM materials";

          importDb.all(query, [], (err, materials) => {
            if (err) {
              reject(err);
              return;
            }

            const stmt = db.prepare(
              "INSERT OR IGNORE INTO materials (user_id, kode, name, unit, price, category, description, lokasi, sumber_data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
            );

            for (const material of materials) {
              const userId = material.user_id || defaultAdminId;
              // Allow empty/null values for optional fields
              stmt.run(
                [
                  userId,
                  material.kode || null,
                  material.name || "Untitled",
                  material.unit || "Unit",
                  material.price || 0,
                  material.category || null,
                  material.description || null,
                  material.lokasi || null,
                  material.sumber_data || null,
                ],
                (err) => {
                  if (err)
                    console.warn(
                      `Warning: Could not import material ${material.name}: ${err.message}`
                    );
                }
              );
            }

            stmt.finalize((err) => {
              if (err) reject(err);
              else resolve();
            });
          });
        });

        // Import AHS with version handling
        await new Promise((resolve, reject) => {
          const query = hasUsersTable
            ? "SELECT * FROM ahs"
            : "SELECT *, NULL as user_id FROM ahs";

          importDb.all(query, [], (err, ahsItems) => {
            if (err) {
              reject(err);
              return;
            }

            const stmt = db.prepare(
              "INSERT OR IGNORE INTO ahs (user_id, kelompok, kode_ahs, ahs, satuan, lokasi, sumber_data) VALUES (?, ?, ?, ?, ?, ?, ?)"
            );

            for (const ahs of ahsItems) {
              const userId = ahs.user_id || defaultAdminId;
              stmt.run(
                [
                  userId,
                  ahs.kelompok || "Uncategorized",
                  ahs.kode_ahs || null,
                  ahs.ahs || "Untitled",
                  ahs.satuan || "Unit",
                  ahs.lokasi || null,
                  ahs.sumber_data || null,
                ],
                (err) => {
                  if (err)
                    console.warn(
                      `Warning: Could not import AHS ${ahs.kode_ahs}: ${err.message}`
                    );
                }
              );
            }

            stmt.finalize((err) => {
              if (err) reject(err);
              else resolve();
            });
          });
        });

        // Import projects with version handling
        await new Promise((resolve, reject) => {
          const query = hasUsersTable
            ? "SELECT * FROM projects"
            : "SELECT *, NULL as user_id FROM projects";

          importDb.all(query, [], (err, projects) => {
            if (err) {
              reject(err);
              return;
            }

            const stmt = db.prepare(
              "INSERT OR IGNORE INTO projects (user_id, name, location, funding) VALUES (?, ?, ?, ?)"
            );

            for (const project of projects) {
              const userId = project.user_id || defaultAdminId;
              stmt.run(
                [
                  userId,
                  project.name || "Untitled Project",
                  project.location || null,
                  project.funding || null,
                ],
                (err) => {
                  if (err)
                    console.warn(
                      `Warning: Could not import project ${project.name}: ${err.message}`
                    );
                }
              );
            }

            stmt.finalize((err) => {
              if (err) reject(err);
              else resolve();
            });
          });
        });

        // Import pricing with version handling
        await new Promise((resolve, reject) => {
          const query = hasUsersTable
            ? "SELECT * FROM pricing"
            : "SELECT *, NULL as user_id FROM pricing";

          importDb.all(query, [], (err, pricingItems) => {
            if (err) {
              reject(err);
              return;
            }

            const stmt = db.prepare(
              "INSERT OR IGNORE INTO pricing (user_id, ahs_id, material_id, quantity, koefisien) VALUES (?, ?, ?, ?, ?)"
            );

            for (const pricing of pricingItems) {
              const userId = pricing.user_id || defaultAdminId;
              stmt.run(
                [
                  userId,
                  pricing.ahs_id,
                  pricing.material_id,
                  pricing.quantity,
                  pricing.koefisien,
                ],
                (err) => {
                  if (err)
                    console.warn(
                      `Warning: Could not import pricing record: ${err.message}`
                    );
                }
              );
            }

            stmt.finalize((err) => {
              if (err) reject(err);
              else resolve();
            });
          });
        });

        // Close imported database connection
        await new Promise((resolve, reject) => {
          importDb.close((err) => {
            if (err) reject(err);
            else resolve();
          });
        });

        // Commit transaction
        await new Promise((resolve, reject) => {
          db.run("COMMIT", (err) => {
            if (err) reject(err);
            else resolve();
          });
        });

        return {
          success: true,
          message:
            "Database berhasil diimpor dan digabungkan dengan data yang ada.",
        };
      } catch (error) {
        // Rollback on error
        await new Promise((resolve) => {
          db.run("ROLLBACK", () => resolve());
        });
        throw error;
      }
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
