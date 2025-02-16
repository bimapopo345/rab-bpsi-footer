const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { initDatabase } = require("./src/database/init");
const { setupAuthHandlers } = require("./src/handlers/authHandlers");
const { setupMaterialHandlers } = require("./src/handlers/materialHandlers");
const { setupAHSHandlers } = require("./src/handlers/ahsHandlers");
const { setupPricingHandlers } = require("./src/handlers/pricingHandlers");
const { setupProjectHandlers } = require("./src/handlers/projectHandlers");
const {
  setupCalculatorHandlers,
} = require("./src/handlers/calculatorHandlers");
const { setupPrintHandlers } = require("./src/handlers/printHandlers");
const { setupExportHandlers } = require("./src/handlers/exportHandlers");
const { setupImportHandlers } = require("./src/handlers/importHandlers");
const { setupBQHandlers } = require("./src/handlers/bqHandlers");
const { setupExportAHSHandler } = require("./src/handlers/exportAHSHandler");

let mainWindow;
let db;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile("login.html");

  // Initialize database and set up handlers
  initDatabase()
    .then((database) => {
      db = database;
      setupAuthHandlers(ipcMain, db);
      setupMaterialHandlers(ipcMain, db);
      setupAHSHandlers(ipcMain, db);
      setupPricingHandlers(ipcMain, db);
      setupProjectHandlers(ipcMain, db);
      setupCalculatorHandlers(ipcMain, db);
      setupPrintHandlers(ipcMain, db);
      setupExportHandlers(ipcMain, db);
      setupImportHandlers(ipcMain, db);
      setupBQHandlers(ipcMain, db);
      setupExportAHSHandler(ipcMain, db);
    })
    .catch(console.error);

  // Workaround for focus issue on Windows
  const isWindows = process.platform === "win32";
  let needsFocusFix = false;
  let triggeringProgrammaticBlur = false;

  mainWindow.on("blur", (event) => {
    if (!triggeringProgrammaticBlur) {
      needsFocusFix = true;
    }
  });

  mainWindow.on("focus", (event) => {
    if (isWindows && needsFocusFix) {
      needsFocusFix = false;
      triggeringProgrammaticBlur = true;
      setTimeout(function () {
        mainWindow.blur();
        mainWindow.focus();
        setTimeout(function () {
          triggeringProgrammaticBlur = false;
        }, 100);
      }, 100);
    }
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    if (db) {
      db.close();
    }
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
