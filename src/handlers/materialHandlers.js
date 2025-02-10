function setupMaterialHandlers(ipcMain, db) {
  // Get all materials for a specific user
  ipcMain.on("get-materials", (event, { userId }) => {
    if (!userId) {
      event.reply("materials-data", []);
      return;
    }

    db.all(
      "SELECT * FROM materials WHERE user_id = ?",
      [userId],
      (err, materials) => {
        if (err) {
          console.error("Error fetching materials:", err);
          event.reply("materials-data", []);
          return;
        }
        event.reply("materials-data", materials);
      }
    );
  });

  // Search materials for a specific user
  ipcMain.on("search-materials", (event, { searchTerm, userId }) => {
    if (!userId) {
      event.reply("materials-data", []);
      return;
    }

    const query = `%${searchTerm}%`;
    db.all(
      "SELECT * FROM materials WHERE user_id = ? AND (kode LIKE ? OR name LIKE ? OR category LIKE ? OR lokasi LIKE ? OR sumber_data LIKE ?)",
      [userId, query, query, query, query, query],
      (err, materials) => {
        if (err) {
          console.error("Error searching materials:", err);
          event.reply("materials-data", []);
          return;
        }
        event.reply("materials-data", materials);
      }
    );
  });

  // Add new material
  ipcMain.on("add-material", (event, { material, userId }) => {
    if (!userId) {
      event.reply("material-added", { error: "User ID is required" });
      return;
    }

    db.run(
      "INSERT INTO materials (kode, name, unit, price, category, lokasi, sumber_data, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        material.kode || null,
        material.name,
        material.unit,
        material.price,
        material.category,
        material.lokasi || null,
        material.sumber_data || null,
        userId,
      ],
      (err) => {
        if (err) {
          console.error("Error adding material:", err);
          event.reply("material-added", { error: err.message });
          return;
        }
        event.reply("material-added", { success: true });
      }
    );
  });

  // Delete material
  ipcMain.on("delete-material", (event, { id, userId }) => {
    if (!userId) {
      event.reply("material-deleted", { error: "User ID is required" });
      return;
    }

    db.run(
      "DELETE FROM materials WHERE id = ? AND user_id = ?",
      [id, userId],
      (err) => {
        if (err) {
          console.error("Error deleting material:", err);
          event.reply("material-deleted", { error: err.message });
          return;
        }
        event.reply("material-deleted", { success: true });
        event.reply("focus-search");
      }
    );
  });

  // Get material by ID
  ipcMain.on("get-material-by-id", (event, { id, userId }) => {
    if (!userId) {
      event.reply("material-data", {});
      return;
    }

    db.get(
      "SELECT * FROM materials WHERE id = ? AND user_id = ?",
      [id, userId],
      (err, material) => {
        if (err) {
          console.error("Error fetching material:", err);
          event.reply("material-data", {});
          return;
        }
        event.reply("material-data", material);
      }
    );
  });

  // Update material
  ipcMain.on(
    "update-material",
    (
      event,
      { id, kode, name, unit, price, category, lokasi, sumber_data, userId }
    ) => {
      if (!userId) {
        event.reply("material-updated", { error: "User ID is required" });
        return;
      }

      db.run(
        "UPDATE materials SET kode = ?, name = ?, unit = ?, price = ?, category = ?, lokasi = ?, sumber_data = ?, created_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?",
        [
          kode || null,
          name,
          unit,
          price,
          category,
          lokasi || null,
          sumber_data || null,
          id,
          userId,
        ],
        (err) => {
          if (err) {
            console.error("Error updating material:", err);
            event.reply("material-updated", { error: err.message });
            return;
          }
          event.reply("material-updated", { success: true });
        }
      );
    }
  );

  // Sort materials
  ipcMain.on("sort-materials", (event, { column, direction, userId }) => {
    if (!userId) {
      event.reply("sorted-materials", []);
      return;
    }

    // Ensure column is a valid column name to prevent SQL injection
    const validColumns = [
      "kode",
      "name",
      "unit",
      "price",
      "category",
      "lokasi",
      "sumber_data",
      "created_at",
    ];
    if (!validColumns.includes(column)) {
      event.reply("sorted-materials", []);
      return;
    }

    const query = `SELECT * FROM materials WHERE user_id = ? ORDER BY ${column} ${
      direction === "asc" ? "ASC" : "DESC"
    }`;

    db.all(query, [userId], (err, materials) => {
      if (err) {
        console.error("Error sorting materials:", err);
        event.reply("sorted-materials", []);
        return;
      }
      event.reply("sorted-materials", materials);
    });
  });

  // Get unique material names and units for autocomplete
  ipcMain.on("get-material-suggestions", (event, { userId }) => {
    if (!userId) {
      event.reply("material-suggestions", { names: [], units: [] });
      return;
    }

    // Get unique names
    db.all(
      "SELECT DISTINCT name FROM materials WHERE user_id = ? ORDER BY name",
      [userId],
      (err, names) => {
        if (err) {
          console.error("Error fetching material names:", err);
          event.reply("material-suggestions", { names: [], units: [] });
          return;
        }

        // Get unique units
        db.all(
          "SELECT DISTINCT unit FROM materials WHERE user_id = ? ORDER BY unit",
          [userId],
          (err, units) => {
            if (err) {
              console.error("Error fetching material units:", err);
              event.reply("material-suggestions", { names: [], units: [] });
              return;
            }

            event.reply("material-suggestions", {
              names: names.map((n) => n.name),
              units: units.map((u) => u.unit),
            });
          }
        );
      }
    );
  });
}

module.exports = { setupMaterialHandlers };
