function setupProjectHandlers(ipcMain, db) {
  // Get latest project for specific user
  ipcMain.on("get-project", (event, { userId }) => {
    if (!userId) {
      event.reply("project-data", null);
      return;
    }

    db.get(
      "SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
      [userId],
      (err, project) => {
        if (err) {
          console.error("Error loading project:", err);
          event.reply("project-data", null);
          return;
        }
        event.reply("project-data", project);
      }
    );
  });

  // Save/Update project
  ipcMain.on("save-project", (event, { name, location, userId }) => {
    if (!userId) {
      event.reply("project-saved", {
        success: false,
        error: "User ID is required",
      });
      return;
    }

    // First check if project exists for this user
    db.get(
      "SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
      [userId],
      (err, existingProject) => {
        if (err) {
          console.error("Error checking project:", err);
          event.reply("project-saved", { success: false, error: err.message });
          return;
        }

        if (existingProject) {
          // Update existing project
          db.run(
            "UPDATE projects SET name = ?, location = ? WHERE id = ? AND user_id = ?",
            [name, location, existingProject.id, userId],
            (err) => {
              if (err) {
                console.error("Error updating project:", err);
                event.reply("project-saved", {
                  success: false,
                  error: err.message,
                });
                return;
              }
              event.reply("project-saved", {
                success: true,
                message: "Data proyek berhasil diperbarui",
              });
              // Send updated project data
              db.get(
                "SELECT * FROM projects WHERE id = ? AND user_id = ?",
                [existingProject.id, userId],
                (err, updatedProject) => {
                  if (!err && updatedProject) {
                    event.reply("project-data", updatedProject);
                  }
                }
              );
            }
          );
        } else {
          // Create new project
          db.run(
            "INSERT INTO projects (name, location, user_id) VALUES (?, ?, ?)",
            [name, location, userId],
            function (err) {
              if (err) {
                console.error("Error saving project:", err);
                event.reply("project-saved", {
                  success: false,
                  error: err.message,
                });
                return;
              }
              event.reply("project-saved", {
                success: true,
                message: "Data proyek berhasil disimpan",
              });
              // Send new project data
              db.get(
                "SELECT * FROM projects WHERE id = ? AND user_id = ?",
                [this.lastID, userId],
                (err, newProject) => {
                  if (!err && newProject) {
                    event.reply("project-data", newProject);
                  }
                }
              );
            }
          );
        }
      }
    );
  });
}

module.exports = { setupProjectHandlers };
