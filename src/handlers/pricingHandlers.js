function setupPricingHandlers(ipcMain, db) {
  // Add pricing
  ipcMain.on(
    "add-pricing",
    (event, { ahs_id, material_id, quantity, koefisien, userId }) => {
      if (!userId) {
        event.reply("pricing-added", { error: "User ID is required" });
        return;
      }

      db.run(
        `INSERT INTO pricing (ahs_id, material_id, quantity, koefisien, ppn_percentage, profit_percentage, user_id) 
         VALUES (?, ?, ?, ?, 0, 0, ?)`,
        [ahs_id, material_id, quantity, koefisien, userId],
        function (err) {
          if (err) {
            console.error("Error adding pricing:", err);
            event.reply("pricing-added", { error: err.message });
            return;
          }
          event.reply("pricing-added", { success: true });
        }
      );
    }
  );

  // Get pricing
  ipcMain.on("get-pricing", (event, { ahsId, userId }) => {
    if (!userId) {
      event.reply("pricing-data", []);
      return;
    }

    db.all(
      `SELECT p.*, m.name, m.unit, m.price, m.category, m.lokasi, m.sumber_data, 
              p.ppn_percentage, p.profit_percentage
       FROM pricing p
       JOIN materials m ON p.material_id = m.id
       WHERE p.ahs_id = ? 
       AND p.user_id = ?
       AND m.user_id = ?`,
      [ahsId, userId, userId],
      (err, pricing) => {
        if (err) {
          console.error("Error fetching pricing:", err);
          event.reply("pricing-data", []);
          return;
        }
        event.reply("pricing-data", pricing);
      }
    );
  });

  // Delete pricing
  ipcMain.on("delete-pricing", (event, { id: pricingId, userId }) => {
    if (!userId) {
      event.reply("pricing-deleted", { error: "User ID is required" });
      return;
    }

    // First get the AHS ID and verify ownership
    db.get(
      "SELECT ahs_id FROM pricing WHERE id = ? AND user_id = ?",
      [pricingId, userId],
      (err, pricing) => {
        if (err || !pricing) {
          console.error("Error finding pricing:", err);
          event.reply("pricing-deleted", {
            error: err ? err.message : "Pricing not found",
          });
          return;
        }

        const ahs_id = parseInt(pricing.ahs_id, 10);

        // Delete the pricing entry
        db.run(
          "DELETE FROM pricing WHERE id = ? AND user_id = ?",
          [pricingId, userId],
          (err) => {
            if (err) {
              console.error("Error deleting pricing:", err);
              event.reply("pricing-deleted", { error: err.message });
              return;
            }

            // Get updated pricing data
            db.all(
              `SELECT p.*, m.name, m.unit, m.price, m.category, m.lokasi, m.sumber_data,
                      p.ppn_percentage, p.profit_percentage
               FROM pricing p
               JOIN materials m ON p.material_id = m.id
               WHERE p.ahs_id = ?
               AND p.user_id = ?
               AND m.user_id = ?`,
              [ahs_id, userId, userId],
              (err, updatedPricing) => {
                if (err) {
                  console.error("Error fetching updated pricing:", err);
                  event.reply("pricing-data", []);
                  return;
                }
                event.reply("pricing-data", updatedPricing);
                event.reply("pricing-deleted", { success: true });
              }
            );
          }
        );
      }
    );
  });

  // Update pricing
  ipcMain.on(
    "update-pricing",
    (event, { pricing_id, ahs_id, koefisien, userId }) => {
      if (!userId) {
        event.reply("pricing-updated", { error: "User ID is required" });
        return;
      }

      db.run(
        "UPDATE pricing SET koefisien = ? WHERE id = ? AND user_id = ?",
        [koefisien, pricing_id, userId],
        (err) => {
          if (err) {
            console.error("Error updating pricing:", err);
            event.reply("pricing-updated", { error: err.message });
            return;
          }

          // Get updated pricing data
          db.all(
            `SELECT p.*, m.name, m.unit, m.price, m.category, m.lokasi, m.sumber_data,
                    p.ppn_percentage, p.profit_percentage
             FROM pricing p
             JOIN materials m ON p.material_id = m.id
             WHERE p.ahs_id = ?
             AND p.user_id = ?
             AND m.user_id = ?`,
            [ahs_id, userId, userId],
            (err, updatedPricing) => {
              if (err) {
                console.error("Error fetching updated pricing:", err);
                event.reply("pricing-data", []);
                return;
              }
              event.reply("pricing-data", updatedPricing);
              event.reply("pricing-updated", { success: true });
            }
          );
        }
      );
    }
  );

  // Update Tax dan Profit
  ipcMain.on(
    "update-tax-profit",
    (event, { pricing_id, ppn_percentage, profit_percentage, userId }) => {
      if (!userId) {
        event.reply("tax-profit-updated", { error: "User ID is required" });
        return;
      }

      db.run(
        "UPDATE pricing SET ppn_percentage = ?, profit_percentage = ? WHERE id = ? AND user_id = ?",
        [ppn_percentage, profit_percentage, pricing_id, userId],
        (err) => {
          if (err) {
            console.error("Error updating tax & profit:", err);
            event.reply("tax-profit-updated", { error: err.message });
            return;
          }

          event.reply("tax-profit-updated", { success: true });
        }
      );
    }
  );
}

module.exports = { setupPricingHandlers };
