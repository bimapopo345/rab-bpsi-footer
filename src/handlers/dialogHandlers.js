const { dialog } = require("electron");

function setupDialogHandlers(ipcMain) {
  // Handler untuk menampilkan dialog save file
  ipcMain.handle("show-save-dialog", async (event, options) => {
    return await dialog.showSaveDialog(options);
  });

  // Handler untuk menampilkan dialog open file
  ipcMain.handle("show-open-dialog", async (event, options) => {
    return await dialog.showOpenDialog(options);
  });
}

module.exports = { setupDialogHandlers };
