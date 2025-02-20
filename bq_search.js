// Fungsi untuk menangani pencarian AHS
function initializeAHSSearch() {
  const searchInput = document.getElementById("ahsSearchInput");
  if (!searchInput) return;

  searchInput.addEventListener("input", function (e) {
    const searchTerm = e.target.value.toLowerCase().trim();
    filterAHSList(searchTerm);
  });
}

// Filter list AHS berdasarkan input pencarian
function filterAHSList(searchTerm) {
  const ahsItems = document.querySelectorAll(".ahs-item");

  ahsItems.forEach((item) => {
    const kodeAHS = item.querySelector("strong").textContent.toLowerCase();
    const namaAHS = item
      .querySelector("div:nth-child(2)")
      .textContent.toLowerCase();

    // Cek apakah kode atau nama AHS mengandung search term
    const matchFound =
      kodeAHS.includes(searchTerm) || namaAHS.includes(searchTerm);

    // Tampilkan atau sembunyikan item berdasarkan hasil pencarian
    item.style.display = matchFound ? "block" : "none";
  });
}

// Fungsi untuk clear search input
function clearAHSSearch() {
  const searchInput = document.getElementById("ahsSearchInput");
  if (searchInput) {
    searchInput.value = "";
    filterAHSList("");
  }
}

// Export fungsi yang dibutuhkan
module.exports = {
  initializeAHSSearch,
  filterAHSList,
  clearAHSSearch,
};
