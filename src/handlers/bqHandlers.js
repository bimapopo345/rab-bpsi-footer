function setupBQHandlers(ipcMain, db) {
  // Get AHS items with pricing data
  ipcMain.handle("get-ahs-with-pricing", async (event, { userId }) => {
    if (!userId) return [];

    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          a.id,
          a.kode_ahs,
          a.ahs,
          SUM(m.price * p.koefisien) as total_price
        FROM ahs a
        INNER JOIN pricing p ON p.ahs_id = a.id
        INNER JOIN materials m ON m.id = p.material_id
        WHERE a.user_id = ?
        GROUP BY a.id
        ORDER BY a.kode_ahs
      `;

      db.all(query, [userId], (err, rows) => {
        if (err) {
          console.error("Error fetching AHS with pricing:", err);
          reject(err);
          return;
        }
        resolve(rows || []);
      });
    });
  });

  // Get all BQ items
  ipcMain.handle("get-bq-items", async (event, { userId }) => {
    if (!userId) return [];

    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          b.*,
          a.kode_ahs,
          a.ahs,
          (SELECT SUM(m.price * p.koefisien) * b.volume
           FROM pricing p
           INNER JOIN materials m ON m.id = p.material_id
           WHERE p.ahs_id = b.ahs_id) as total_price
        FROM bq b
        INNER JOIN ahs a ON a.id = b.ahs_id
        WHERE b.user_id = ?
        ORDER BY b.created_at DESC
      `;

      db.all(query, [userId], (err, rows) => {
        if (err) {
          console.error("Error fetching BQ items:", err);
          reject(err);
          return;
        }
        resolve(rows || []);
      });
    });
  });

  // Save BQ item
  ipcMain.handle("save-bq-item", async (event, bqItem) => {
    if (!bqItem.userId) throw new Error("User ID is required");

    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO bq (
          user_id,
          ahs_id,
          shape,
          dimensions,
          volume,
          total_price,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          bqItem.userId,
          bqItem.ahsId,
          bqItem.shape,
          bqItem.dimensions,
          bqItem.volume,
          0,
        ],
        function (err) {
          if (err) {
            console.error("Error saving BQ item:", err);
            reject(err);
            return;
          }
          resolve(this.lastID);
        }
      );
    });
  });

  // Update BQ item - update shape, dimensions, volume, recalc total_price
  ipcMain.handle(
    "update-bq-item",
    async (event, { id, shape, dimensions, volume }) => {
      if (!id) throw new Error("Item ID is required");
      if (!volume) throw new Error("Volume is required");

      return new Promise((resolve, reject) => {
        db.run(
          `UPDATE bq
         SET shape = ?,
             dimensions = ?,
             volume = ?,
             total_price = (SELECT SUM(m.price * p.koefisien) * ?
                            FROM pricing p
                            INNER JOIN materials m ON m.id = p.material_id
                            WHERE p.ahs_id = bq.ahs_id)
         WHERE id = ?`,
          [shape, dimensions, volume, volume, id],
          (err) => {
            if (err) {
              console.error("Error updating BQ item:", err);
              reject(err);
              return;
            }
            resolve(true);
          }
        );
      });
    }
  );

  // Delete BQ item
  ipcMain.handle("delete-bq-item", async (event, { id }) => {
    if (!id) throw new Error("Item ID is required");

    return new Promise((resolve, reject) => {
      db.run("DELETE FROM bq WHERE id = ?", [id], (err) => {
        if (err) {
          console.error("Error deleting BQ item:", err);
          reject(err);
          return;
        }
        resolve(true);
      });
    });
  });
}

module.exports = { setupBQHandlers };
