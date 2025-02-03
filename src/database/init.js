const sqlite3 = require("sqlite3").verbose();

function initDatabase() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database("database.sqlite", (err) => {
      if (err) {
        console.error("Database opening error:", err);
        reject(err);
        return;
      }

      db.serialize(() => {
        // Create users table first
        db.run(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            hint TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Check if admin table exists and migrate data
        db.get(
          "SELECT name FROM sqlite_master WHERE type='table' AND name='admin'",
          (err, table) => {
            if (err) {
              console.error("Error checking admin table:", err);
              return;
            }

            if (table) {
              // Migrate data from admin to users
              db.run(
                `
              INSERT OR IGNORE INTO users (username, password, hint)
              SELECT username, password, hint FROM admin
            `,
                (err) => {
                  if (err) {
                    console.error("Error migrating admin data:", err);
                    return;
                  }

                  // Drop admin table after migration
                  db.run("DROP TABLE admin", (err) => {
                    if (err) {
                      console.error("Error dropping admin table:", err);
                    }
                  });
                }
              );
            }
          }
        );

        // Create materials table with user_id
        db.run(`
          CREATE TABLE IF NOT EXISTS materials (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            unit TEXT NOT NULL,
            price REAL NOT NULL,
            category TEXT NOT NULL,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
          )
        `);

        // Create AHS table with user_id
        db.run(`
          CREATE TABLE IF NOT EXISTS ahs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            kelompok TEXT NOT NULL,
            kode_ahs TEXT NOT NULL,
            ahs TEXT NOT NULL,
            satuan TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
          )
        `);

        // Create pricing table with user_id
        db.run(`
          CREATE TABLE IF NOT EXISTS pricing (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            ahs_id INTEGER NOT NULL,
            material_id INTEGER NOT NULL,
            quantity REAL NOT NULL,
            koefisien REAL NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (ahs_id) REFERENCES ahs(id),
            FOREIGN KEY (material_id) REFERENCES materials(id)
          )
        `);

        // Create projects table with user_id
        db.run(`
          CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            location TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
          )
        `);

        // Check if default user exists and create if not
        db.get(
          "SELECT * FROM users WHERE username = ?",
          ["admin"],
          (err, row) => {
            if (err) {
              console.error("Error checking default user:", err);
              return;
            }
            if (!row) {
              db.run(
                "INSERT INTO users (username, password, hint) VALUES (?, ?, ?)",
                ["admin", "admin", "Default admin account"],
                (err) => {
                  if (err) {
                    console.error("Error creating default user:", err);
                    return;
                  }
                  console.log("Default admin user created successfully!");
                }
              );
            }
          }
        );

        console.log("Database initialized successfully!");
        resolve(db);
      });
    });
  });
}

module.exports = { initDatabase };
