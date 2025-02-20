function calculateProfit(total, profitPercentage) {
  return (total * profitPercentage) / 100;
}

function calculatePPN(total, ppnPercentage = 11) {
  return (total * ppnPercentage) / 100;
}

function formatRupiah(amount) {
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

module.exports = {
  calculateProfit,
  calculatePPN,
  formatRupiah,
};
