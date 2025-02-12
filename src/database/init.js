const sqlite3 = require("sqlite3").verbose();
const path = require("path");

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
        // Create users table first
        db.run(
          `
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            hint TEXT,
            role TEXT NOT NULL DEFAULT 'user'
          )
        `,
          (err) => {
            if (err) {
              console.error("Error creating users table:", err);
              return;
            }
            console.log("Users table created");

            // Create default admin user with TEXT id
            db.run(
              "INSERT OR IGNORE INTO users (id, username, password, hint, role) VALUES (?, ?, ?, ?, ?)",
              ["admin-1", "admin", "admin", "Default admin account", "admin"],
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

        // Create materials table
        db.run(
          `
          CREATE TABLE IF NOT EXISTS materials (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            kode TEXT,
            name TEXT NOT NULL,
            unit TEXT NOT NULL,
            price REAL DEFAULT 0,
            category TEXT,
            lokasi TEXT,
            sumber_data TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            user_id TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
          )
        `,
          (err) => {
            if (err) {
              console.error("Error creating materials table:", err);
              return;
            }
            console.log("Materials table created");
          }
        );

        // Create AHS table
        db.run(
          `
          CREATE TABLE IF NOT EXISTS ahs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            kode_ahs TEXT,
            kelompok TEXT,
            ahs TEXT NOT NULL,
            satuan TEXT,
            user_id TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
          )
        `,
          (err) => {
            if (err) {
              console.error("Error creating AHS table:", err);
              return;
            }
            console.log("AHS table created");
          }
        );

        // Create pricing table
        db.run(
          `
          CREATE TABLE IF NOT EXISTS pricing (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ahs_id INTEGER NOT NULL,
            material_id INTEGER NOT NULL,
            quantity REAL DEFAULT 0,
            koefisien REAL DEFAULT 0,
            user_id TEXT NOT NULL,
            FOREIGN KEY (ahs_id) REFERENCES ahs(id),
            FOREIGN KEY (material_id) REFERENCES materials(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
          )
        `,
          (err) => {
            if (err) {
              console.error("Error creating pricing table:", err);
              return;
            }
            console.log("Pricing table created");
          }
        );

        // Create projects table
        db.run(
          `
          CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            location TEXT,
            funding TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            user_id TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
          )
        `,
          (err) => {
            if (err) {
              console.error("Error creating projects table:", err);
              return;
            }
            console.log("Projects table created");
          }
        );

        // Create BQ table
        db.run(
          `
          CREATE TABLE IF NOT EXISTS bq (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ahs_id INTEGER NOT NULL,
            shape TEXT NOT NULL,
            dimensions TEXT NOT NULL,
            volume REAL NOT NULL,
            total_price REAL NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            user_id TEXT NOT NULL,
            FOREIGN KEY (ahs_id) REFERENCES ahs(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
          )
        `,
          (err) => {
            if (err) {
              console.error("Error creating BQ table:", err);
              return;
            }
            console.log("BQ table created");
          }
        );

        console.log("Database initialized successfully!");
        resolve(db);
      });
    });
  });
}

module.exports = { initDatabase };
