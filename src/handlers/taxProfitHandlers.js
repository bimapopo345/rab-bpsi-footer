function setupTaxProfitHandlers(ipcMain, db) {
  // Update PPN dan Profit untuk pricing tertentu
  ipcMain.on("update-tax-profit", (event, data) => {
    const {
      ahs_id,
      ppn_percentage,
      profit_percentage,
      total_after_tax_profit,
      userId,
    } = data;

    const query = `
      UPDATE pricing 
      SET ppn_percentage = ?,
          profit_percentage = ?,
          total_after_tax_profit = ?
      WHERE ahs_id = ? AND user_id = ?
    `;

    db.run(
      query,
      [
        ppn_percentage,
        profit_percentage,
        total_after_tax_profit,
        ahs_id,
        userId,
      ],
      function (err) {
        if (err) {
          event.reply("tax-profit-updated", {
            success: false,
            error: err.message,
          });
          return;
        }

        event.reply("tax-profit-updated", {
          success: true,
          ahs_id,
        });
      }
    );
  });

  // Ambil data PPN dan Profit untuk AHS tertentu
  ipcMain.on("get-tax-profit", (event, data) => {
    const { ahs_id, userId } = data;

    const query = `
      SELECT id, ppn_percentage, profit_percentage, total_after_tax_profit
      FROM pricing 
      WHERE ahs_id = ? AND user_id = ?
    `;

    db.all(query, [ahs_id, userId], (err, rows) => {
      if (err) {
        event.reply("tax-profit-data", {
          success: false,
          error: err.message,
        });
        return;
      }

      event.reply("tax-profit-data", {
        success: true,
        data: rows,
      });
    });
  });
}

module.exports = { setupTaxProfitHandlers };
