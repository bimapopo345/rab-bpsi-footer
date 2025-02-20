function setupSubprojectHandlers(ipcMain, db) {
  // Get all subprojects for a specific user
  ipcMain.handle("get-subprojects", async (event, { userId }) => {
    try {
      return await new Promise((resolve, reject) => {
        db.all(
          "SELECT * FROM subprojects WHERE user_id = ? ORDER BY created_at DESC",
          [userId],
          (err, subprojects) => {
            if (err) {
              console.error("Error fetching subprojects:", err);
              reject(err);
            } else {
              resolve(subprojects);
            }
          }
        );
      });
    } catch (error) {
      console.error("Error in get-subprojects:", error);
      return [];
    }
  });

  // Add new subproject
  ipcMain.handle("add-subproject", async (event, { name, userId }) => {
    try {
      return await new Promise((resolve, reject) => {
        db.run(
          "INSERT INTO subprojects (name, user_id) VALUES (?, ?)",
          [name, userId],
          function (err) {
            if (err) {
              console.error("Error adding subproject:", err);
              reject(err);
            } else {
              resolve({
                id: this.lastID,
                success: true,
                message: "Subproyek berhasil ditambahkan",
              });
            }
          }
        );
      });
    } catch (error) {
      console.error("Error in add-subproject:", error);
      return { success: false, error: error.message };
    }
  });

  // Update subproject
  ipcMain.handle("update-subproject", async (event, { id, name, userId }) => {
    try {
      return await new Promise((resolve, reject) => {
        db.run(
          "UPDATE subprojects SET name = ? WHERE id = ? AND user_id = ?",
          [name, id, userId],
          (err) => {
            if (err) {
              console.error("Error updating subproject:", err);
              reject(err);
            } else {
              resolve({
                success: true,
                message: "Subproyek berhasil diperbarui",
              });
            }
          }
        );
      });
    } catch (error) {
      console.error("Error in update-subproject:", error);
      return { success: false, error: error.message };
    }
  });

  // Delete subproject
  ipcMain.handle("delete-subproject", async (event, { id, userId }) => {
    try {
      return await new Promise((resolve, reject) => {
        // Start a transaction
        db.run("BEGIN TRANSACTION", (err) => {
          if (err) {
            reject(err);
            return;
          }

          // First update BQ items to remove reference to this subproject
          db.run(
            "UPDATE bq SET subproject_id = NULL WHERE subproject_id = ? AND user_id = ?",
            [id, userId],
            (err) => {
              if (err) {
                db.run("ROLLBACK");
                reject(err);
                return;
              }

              // Then delete the subproject
              db.run(
                "DELETE FROM subprojects WHERE id = ? AND user_id = ?",
                [id, userId],
                (err) => {
                  if (err) {
                    db.run("ROLLBACK");
                    reject(err);
                    return;
                  }

                  db.run("COMMIT", (err) => {
                    if (err) {
                      db.run("ROLLBACK");
                      reject(err);
                    } else {
                      resolve({
                        success: true,
                        message: "Subproyek berhasil dihapus",
                      });
                    }
                  });
                }
              );
            }
          );
        });
      });
    } catch (error) {
      console.error("Error in delete-subproject:", error);
      return { success: false, error: error.message };
    }
  });

  // Get BQ items by subproject
  ipcMain.handle("get-bq-by-subproject", async (event, { userId }) => {
    try {
      return await new Promise((resolve, reject) => {
        db.all(
          `SELECT 
            s.id as subproject_id,
            s.name as subproject_name,
            b.id,
            b.volume,
            b.satuan,
            b.total_price,
            a.kode_ahs,
            a.ahs
          FROM subprojects s
          LEFT JOIN bq b ON b.subproject_id = s.id AND b.user_id = s.user_id
          LEFT JOIN ahs a ON b.ahs_id = a.id
          WHERE s.user_id = ?
          ORDER BY s.created_at DESC, b.created_at ASC`,
          [userId],
          (err, rows) => {
            if (err) {
              console.error("Error fetching BQ by subproject:", err);
              reject(err);
            } else {
              resolve(rows);
            }
          }
        );
      });
    } catch (error) {
      console.error("Error in get-bq-by-subproject:", error);
      return [];
    }
  });
}

module.exports = { setupSubprojectHandlers };
