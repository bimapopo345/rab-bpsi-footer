function calculateProfit(total, profitPercentage) {
  return (total * profitPercentage) / 100;
}

function calculatePPN(total, ppnPercentage = 11) {
  return (total * ppnPercentage) / 100;
}

function formatRupiah(amount) {
  // Convert to 2 decimal places and handle rounding
  const num = Number(amount).toFixed(2);

  // Split the number into whole and decimal parts
  const [whole, decimal] = num.split(".");

  // Add comma as thousand separator and combine with decimal
  return (
    whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") +
    (decimal !== "00" ? "." + decimal : "")
  );
}

module.exports = {
  calculateProfit,
  calculatePPN,
  formatRupiah,
};
