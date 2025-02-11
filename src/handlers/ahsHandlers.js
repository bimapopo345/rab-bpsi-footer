function setupAHSHandlers(ipcMain, db) {
  // Get all AHS for a specific user
  ipcMain.on("get-ahs", (event, { userId }) => {
    if (!userId) {
      event.reply("ahs-data", []);
      return;
    }

    db.all("SELECT * FROM ahs WHERE user_id = ?", [userId], (err, ahs) => {
      if (err) {
        console.error("Error fetching AHS:", err);
        event.reply("ahs-data", []);
        return;
      }
      event.reply("ahs-data", ahs);
    });
  });

  // Get AHS by ID for a specific user
  ipcMain.on("get-ahs-by-id", (event, { id, userId }) => {
    if (!userId) {
      event.reply("ahs-data-for-edit", null);
      return;
    }

    db.get(
      "SELECT * FROM ahs WHERE id = ? AND user_id = ?",
      [id, userId],
      (err, ahs) => {
        if (err) {
          console.error("Error fetching AHS by ID:", err);
          event.reply("ahs-data-for-edit", null);
          return;
        }
        event.reply("ahs-data-for-edit", ahs);
      }
    );
  });

  // Add AHS for a specific user
  ipcMain.on("add-ahs", (event, { ahsData, userId }) => {
    if (!userId) {
      event.reply("ahs-added", { error: "User ID is required" });
      return;
    }

    db.run(
      "INSERT INTO ahs (kelompok, kode_ahs, ahs, satuan, user_id) VALUES (?, ?, ?, ?, ?)",
      [ahsData.kelompok, ahsData.kode_ahs, ahsData.ahs, ahsData.satuan, userId],
      (err) => {
        if (err) {
          console.error("Error adding AHS:", err);
          event.reply("ahs-added", { error: err.message });
          return;
        }
        event.reply("ahs-added", { success: true });
      }
    );
  });

  // Update AHS for a specific user
  ipcMain.on("update-ahs", (event, { ahsData, userId }) => {
    if (!userId) {
      event.reply("ahs-updated", { error: "User ID is required" });
      return;
    }

    db.run(
      "UPDATE ahs SET kelompok = ?, kode_ahs = ?, ahs = ?, satuan = ? WHERE id = ? AND user_id = ?",
      [
        ahsData.kelompok,
        ahsData.kode_ahs,
        ahsData.ahs,
        ahsData.satuan,
        ahsData.id,
        userId,
      ],
      (err) => {
        if (err) {
          console.error("Error updating AHS:", err);
          event.reply("ahs-updated", { error: err.message });
          return;
        }
        event.reply("ahs-updated", { success: true });
      }
    );
  });

  // Delete AHS for a specific user
  ipcMain.on("delete-ahs", (event, { id, userId }) => {
    if (!userId) {
      event.reply("ahs-deleted", { error: "User ID is required" });
      return;
    }

    db.run(
      "DELETE FROM ahs WHERE id = ? AND user_id = ?",
      [id, userId],
      (err) => {
        if (err) {
          console.error("Error deleting AHS:", err);
          event.reply("ahs-deleted", { error: err.message });
          return;
        }
        event.reply("ahs-deleted", { success: true });
      }
    );
  });

  // Delete all AHS for a specific user
  ipcMain.on("delete-all-ahs", (event, { userId }) => {
    if (!userId) {
      event.reply("all-ahs-deleted", { error: "User ID is required" });
      return;
    }

    db.run("DELETE FROM ahs WHERE user_id = ?", [userId], (err) => {
      if (err) {
        console.error("Error deleting all AHS:", err);
        event.reply("all-ahs-deleted", { error: err.message });
        return;
      }
      event.reply("all-ahs-deleted", { success: true });
    });
  });

  // Search AHS for a specific user
  ipcMain.on("search-ahs", (event, { searchTerm, userId }) => {
    if (!userId) {
      event.reply("ahs-data", []);
      return;
    }

    const query = "%" + searchTerm + "%";
    db.all(
      "SELECT * FROM ahs WHERE user_id = ? AND (kelompok LIKE ? OR ahs LIKE ?)",
      [userId, query, query],
      (err, results) => {
        if (err) {
          console.error("Error searching AHS:", err);
          event.reply("ahs-data", []);
          return;
        }
        event.reply("ahs-data", results);
      }
    );
  });

  // Sort AHS for a specific user
  ipcMain.on("sort-ahs", (event, { column, direction, userId }) => {
    if (!userId) {
      event.reply("sorted-ahs", []);
      return;
    }

    // Validate column name to prevent SQL injection
    const validColumns = [
      "kelompok",
      "kode_ahs",
      "ahs",
      "satuan",
      "created_at",
    ];
    if (!validColumns.includes(column)) {
      event.reply("sorted-ahs", []);
      return;
    }

    const query = `SELECT * FROM ahs WHERE user_id = ? ORDER BY ${column} ${
      direction === "asc" ? "ASC" : "DESC"
    }`;

    db.all(query, [userId], (err, ahs) => {
      if (err) {
        console.error("Error sorting AHS:", err);
        event.reply("sorted-ahs", []);
        return;
      }
      event.reply("sorted-ahs", ahs);
    });
  });

  // Get unique AHS names and units for autocomplete
  ipcMain.on("get-ahs-suggestions", (event, { userId }) => {
    if (!userId) {
      event.reply("ahs-suggestions", { names: [], units: [] });
      return;
    }

    // Get unique AHS names
    db.all(
      "SELECT DISTINCT ahs FROM ahs WHERE user_id = ? ORDER BY ahs",
      [userId],
      (err, names) => {
        if (err) {
          console.error("Error fetching AHS names:", err);
          event.reply("ahs-suggestions", { names: [], units: [] });
          return;
        }

        // Get unique units
        db.all(
          "SELECT DISTINCT satuan FROM ahs WHERE user_id = ? ORDER BY satuan",
          [userId],
          (err, units) => {
            if (err) {
              console.error("Error fetching AHS units:", err);
              event.reply("ahs-suggestions", { names: [], units: [] });
              return;
            }

            event.reply("ahs-suggestions", {
              names: names.map((n) => n.ahs),
              units: units.map((u) => u.satuan),
            });
          }
        );
      }
    );
  });
}

module.exports = { setupAHSHandlers };
