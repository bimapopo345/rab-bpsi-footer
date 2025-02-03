const Database = require("better-sqlite3");
const path = require("path");

// Initialize database
const db = new Database("database.sqlite", { verbose: console.log });

// Create tables
function initializeDatabase() {
  // Create pricing table
  db.exec(`
  CREATE TABLE IF NOT EXISTS pricing (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ahs_id INTEGER NOT NULL,
    material_id INTEGER NOT NULL,
    quantity REAL NOT NULL,
    koefisien REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ahs_id) REFERENCES ahs(id),
    FOREIGN KEY (material_id) REFERENCES materials(id)
  )
`);

  // Create AHS table
  db.exec(`
    CREATE TABLE IF NOT EXISTS ahs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kelompok TEXT NOT NULL,
      kode_ahs TEXT NOT NULL,
      ahs TEXT NOT NULL,
      satuan TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create projects table
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create admin table if it doesn't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Verify tables exist
  const ahsTableExists = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='ahs';"
    )
    .get();
  console.log("AHS Table Exists:", ahsTableExists);

  const projectsTableExists = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='projects';"
    )
    .get();
  console.log("Projects Table Exists:", projectsTableExists);

  // Add default admin if none exists
  const existingAdmin = db.prepare("SELECT COUNT(*) AS count FROM admin").get();
  if (existingAdmin.count === 0) {
    db.prepare("INSERT INTO admin (username, password) VALUES (?, ?)").run(
      "admin",
      "admin123"
    );
  }

  console.log("Database initialized successfully!");
}

// Run initialization
try {
  initializeDatabase();
} catch (err) {
  console.error("Error initializing database:", err);
}

// Close database connection
db.close();
