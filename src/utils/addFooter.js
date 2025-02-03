const fs = require("fs");
const path = require("path");

function addFooterToHtml(htmlFilePath) {
  try {
    // Read the HTML file
    let content = fs.readFileSync(htmlFilePath, "utf8");

    // Read the footer template
    const footerContent = fs.readFileSync(
      path.join(__dirname, "../components/footer.html"),
      "utf8"
    );

    // Check if the file already has a flex container body style
    if (
      !content.includes("display: flex") ||
      !content.includes("flex-direction: column")
    ) {
      content = content.replace(/body\s*{[^}]*}/, (match) =>
        match.replace(
          /}/,
          "display: flex; flex-direction: column; min-height: 100vh; }"
        )
      );
    }

    // Add footer before closing body tag
    content = content.replace("</body>", `${footerContent}</body>`);

    // Write the updated content back to file
    fs.writeFileSync(htmlFilePath, content, "utf8");
    console.log(`Footer added to ${htmlFilePath}`);

    return true;
  } catch (error) {
    console.error(`Error adding footer to ${htmlFilePath}:`, error);
    return false;
  }
}

// Get all HTML files in the root directory
const htmlFiles = fs
  .readdirSync(".")
  .filter(
    (file) =>
      file.endsWith(".html") && file !== "login.html" && file !== "index.html"
  );

// Add footer to each HTML file
htmlFiles.forEach((file) => {
  addFooterToHtml(file);
});

console.log("Footer addition complete!");
