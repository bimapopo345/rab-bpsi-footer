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

        // Create materials table with user_id and new columns
        db.run(`
          CREATE TABLE IF NOT EXISTS materials (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            kode TEXT,
            name TEXT NOT NULL,
            unit TEXT NOT NULL,
            price REAL NOT NULL,
            category TEXT NOT NULL,
            description TEXT,
            lokasi TEXT,
            sumber_data TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
          )
        `);

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

        // Create AHS table with user_id and new columns
        db.run(`
          CREATE TABLE IF NOT EXISTS ahs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            kelompok TEXT NOT NULL,
            kode_ahs TEXT NOT NULL,
            ahs TEXT NOT NULL,
            satuan TEXT NOT NULL,
            lokasi TEXT,
            sumber_data TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
          )
        `);

        // Add new columns to existing AHS table if they don't exist
        db.get("PRAGMA table_info(ahs)", (err, rows) => {
          if (err) {
            console.error("Error checking AHS table columns:", err);
            return;
          }

          // Check if lokasi column exists
          db.get("SELECT lokasi FROM ahs LIMIT 1", (err) => {
            if (err) {
              // Add lokasi column if it doesn't exist
              db.run("ALTER TABLE ahs ADD COLUMN lokasi TEXT", (err) => {
                if (err) {
                  console.error("Error adding lokasi column to AHS:", err);
                }
              });
            }
          });

          // Check if sumber_data column exists
          db.get("SELECT sumber_data FROM ahs LIMIT 1", (err) => {
            if (err) {
              // Add sumber_data column if it doesn't exist
              db.run("ALTER TABLE ahs ADD COLUMN sumber_data TEXT", (err) => {
                if (err) {
                  console.error("Error adding sumber_data column to AHS:", err);
                }
              });
            }
          });
        });

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
            funding TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
          )
        `);

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
