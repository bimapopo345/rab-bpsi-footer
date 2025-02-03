function setupAuthHandlers(ipcMain, db) {
  // Login handler
  ipcMain.on("login", (event, { username, password }) => {
    db.get(
      "SELECT * FROM users WHERE username = ? AND password = ?",
      [username, password],
      (err, user) => {
        if (err) {
          console.error("Login error:", err);
          event.reply("login-result", {
            success: false,
            message: "Error during login",
          });
          return;
        }
        if (user) {
          event.reply("login-result", {
            success: true,
            message: "Login successful",
            userId: user.id,
          });
        } else {
          event.reply("login-result", {
            success: false,
            message: "Invalid username or password",
          });
        }
      }
    );
  });

  // Registration handler
  ipcMain.on("register", (event, { username, password, hint }) => {
    // First check if username exists
    db.get(
      "SELECT id FROM users WHERE username = ?",
      [username],
      (err, user) => {
        if (err) {
          console.error("Registration check error:", err);
          event.reply("register-result", {
            success: false,
            message: "Error during registration",
          });
          return;
        }

        if (user) {
          event.reply("register-result", {
            success: false,
            message: "Username already exists",
          });
          return;
        }

        // Username is available, proceed with registration
        db.run(
          "INSERT INTO users (username, password, hint) VALUES (?, ?, ?)",
          [username, password, hint],
          function (err) {
            if (err) {
              console.error("Registration insert error:", err);
              event.reply("register-result", {
                success: false,
                message: "Error creating account",
              });
              return;
            }

            event.reply("register-result", {
              success: true,
              message: "Registration successful",
              userId: this.lastID,
            });
          }
        );
      }
    );
  });

  // Password reset request handler
  ipcMain.on("reset-password", (event, { username, hint, newPassword }) => {
    if (!newPassword) {
      event.reply("reset-result", {
        success: false,
        message: "Password baru diperlukan",
      });
      return;
    }

    db.get(
      "SELECT * FROM users WHERE username = ? AND hint = ?",
      [username, hint],
      (err, user) => {
        if (err) {
          console.error("Reset check error:", err);
          event.reply("reset-result", {
            success: false,
            message: "Error during password reset",
          });
          return;
        }

        if (!user) {
          event.reply("reset-result", {
            success: false,
            message: "Username atau hint tidak valid",
          });
          return;
        }

        // Update the user's password with their new password
        db.run(
          "UPDATE users SET password = ? WHERE id = ?",
          [newPassword, user.id],
          (err) => {
            if (err) {
              console.error("Reset update error:", err);
              event.reply("reset-result", {
                success: false,
                message: "Error updating password",
              });
              return;
            }

            event.reply("reset-result", {
              success: true,
              message: "Password berhasil direset",
            });
          }
        );
      }
    );
  });

  // Check if user is admin
  ipcMain.on("check-admin", (event, { userId }) => {
    db.get("SELECT username FROM users WHERE id = ?", [userId], (err, user) => {
      if (err) {
        console.error("Admin check error:", err);
        event.reply("admin-check-result", false);
        return;
      }
      // Check if user exists and is admin
      event.reply("admin-check-result", user && user.username === "admin");
    });
  });

  // Get all users
  ipcMain.on("get-users", (event) => {
    db.all(
      "SELECT id, username, password, hint FROM users ORDER BY username",
      [],
      (err, users) => {
        if (err) {
          console.error("Error fetching users:", err);
          event.reply("users-data", []);
          return;
        }
        event.reply("users-data", users);
      }
    );
  });

  // Get user ID by username
  ipcMain.on("get-user-id", (event, username) => {
    db.get(
      "SELECT id FROM users WHERE username = ?",
      [username],
      (err, user) => {
        if (err) {
          console.error("Error fetching user ID:", err);
          event.reply("user-id-result", { error: "Error fetching user ID" });
          return;
        }
        if (!user) {
          event.reply("user-id-result", { error: "User not found" });
          return;
        }
        event.reply("user-id-result", { id: user.id });
      }
    );
  });
}

module.exports = { setupAuthHandlers };
