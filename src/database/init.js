const sqlite3 = require("sqlite3").verbose();

function initDatabase() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database("database.sqlite", (err) => {
      if (err) {
        console.error("Database opening error:", err);
        reject(err);
        return;
      }

      console.log("Database opened successfully, initializing tables...");

      db.serialize(() => {
        // Drop existing tables if they exist to ensure clean slate
        db.run("DROP TABLE IF EXISTS pricing");
        db.run("DROP TABLE IF EXISTS materials");
        db.run("DROP TABLE IF EXISTS ahs");
        db.run("DROP TABLE IF EXISTS projects");
        db.run("DROP TABLE IF EXISTS users");
        console.log("Dropped existing tables");

        // Create users table first
        db.run(
          `
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            hint TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `,
          (err) => {
            if (err) {
              console.error("Error creating users table:", err);
              return;
            }
            console.log("Users table created");

            // Create default admin user immediately after table creation
            db.run(
              "INSERT OR REPLACE INTO users (username, password, hint) VALUES (?, ?, ?)",
              ["admin", "admin", "Default admin account"],
              (err) => {
                if (err) {
                  console.error("Error creating default admin user:", err);
                  return;
                }
                console.log("Default admin user created/verified");
              }
            );
          }
        );

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

        // Create materials table with all columns properly defined
        db.run(
          `
          CREATE TABLE IF NOT EXISTS materials (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            kode TEXT DEFAULT NULL,
            name TEXT NOT NULL,
            unit TEXT NOT NULL,
            price REAL NOT NULL,
            category TEXT DEFAULT NULL,
            description TEXT DEFAULT NULL,
            lokasi TEXT DEFAULT NULL,
            sumber_data TEXT DEFAULT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
          )
        `,
          (err) => {
            if (err) {
              console.error("Error creating materials table:", err);
              return;
            }
            console.log("Materials table created with all columns");
          }
        );

        // Add new columns to existing materials table if they don't exist
        db.get("PRAGMA table_info(materials)", (err, rows) => {
          if (err) {
            console.error("Error checking materials table columns:", err);
            return;
          }

          // Check if kode column exists
          db.get("SELECT kode FROM materials LIMIT 1", (err) => {
            if (err) {
              // Add kode column if it doesn't exist
              db.run("ALTER TABLE materials ADD COLUMN kode TEXT", (err) => {
                if (err) {
                  console.error("Error adding kode column:", err);
                }
              });
            }
          });

          // Check if lokasi column exists
          db.get("SELECT lokasi FROM materials LIMIT 1", (err) => {
            if (err) {
              // Add lokasi column if it doesn't exist
              db.run("ALTER TABLE materials ADD COLUMN lokasi TEXT", (err) => {
                if (err) {
                  console.error("Error adding lokasi column:", err);
                }
              });
            }
          });

          // Check if sumber_data column exists
          db.get("SELECT sumber_data FROM materials LIMIT 1", (err) => {
            if (err) {
              // Add sumber_data column if it doesn't exist
              db.run(
                "ALTER TABLE materials ADD COLUMN sumber_data TEXT",
                (err) => {
                  if (err) {
                    console.error("Error adding sumber_data column:", err);
                  }
                }
              );
            }
          });
        });

        // Create AHS table with proper null handling
        db.run(
          `
          CREATE TABLE IF NOT EXISTS ahs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            kelompok TEXT NOT NULL,
            kode_ahs TEXT NOT NULL,
            ahs TEXT NOT NULL,
            satuan TEXT NOT NULL,
            lokasi TEXT DEFAULT NULL,
            sumber_data TEXT DEFAULT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
          )
        `,
          (err) => {
            if (err) {
              console.error("Error creating AHS table:", err);
              return;
            }
            console.log("AHS table created with all columns");
          }
        );

        // Create pricing table with proper constraints
        db.run(
          `
          CREATE TABLE IF NOT EXISTS pricing (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            ahs_id INTEGER NOT NULL,
            material_id INTEGER NOT NULL,
            quantity REAL NOT NULL DEFAULT 0,
            koefisien REAL NOT NULL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (ahs_id) REFERENCES ahs(id) ON DELETE CASCADE,
            FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE
          )
        `,
          (err) => {
            if (err) {
              console.error("Error creating pricing table:", err);
              return;
            }
            console.log("Pricing table created with all columns");
          }
        );

        // Create projects table with proper null handling
        db.run(
          `
          CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            location TEXT DEFAULT NULL,
            funding TEXT DEFAULT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          )
        `,
          (err) => {
            if (err) {
              console.error("Error creating projects table:", err);
              return;
            }
            console.log("Projects table created with all columns");
          }
        );

        // Check if funding column exists in projects table
        db.get("SELECT funding FROM projects LIMIT 1", (err) => {
          if (err) {
            // Add funding column if it doesn't exist
            db.run("ALTER TABLE projects ADD COLUMN funding TEXT", (err) => {
              if (err) {
                console.error("Error adding funding column to projects:", err);
              } else {
                console.log("Added funding column to projects table");
              }
            });
          }
        });

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
