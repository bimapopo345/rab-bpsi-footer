const fs = require("fs");
const path = require("path");
const JavaScriptObfuscator = require("javascript-obfuscator");

// Configuration for obfuscator with simpler settings
const obfuscatorConfig = {
  compact: true,
  controlFlowFlattening: false,
  deadCodeInjection: false,
  debugProtection: false,
  disableConsoleOutput: true,
  identifierNamesGenerator: "hexadecimal",
  log: false,
  numbersToExpressions: true,
  renameGlobals: false,
  selfDefending: true,
  simplify: true,
  splitStrings: true,
  stringArray: true,
  stringArrayEncoding: ["base64"],
  stringArrayThreshold: 0.75,
  unicodeEscapeSequence: false,
};

// Create temp directory if it doesn't exist
const tempDir = path.join(__dirname, "temp");
if (fs.existsSync(tempDir)) {
  fs.rmSync(tempDir, { recursive: true });
}
fs.mkdirSync(tempDir);

// Copy essential non-JS files first
const filesToCopy = [
  "package.json",
  ".gitignore",
  "bg-PINTU-AIR.png",
  "Logo Kementerian Pertanian Republik Indonesia.png",
  "database.sqlite",
  "styles.css",
  "*.html",
];

// Copy HTML files
const htmlFiles = fs
  .readdirSync(__dirname)
  .filter((file) => file.endsWith(".html"));
htmlFiles.forEach((file) => {
  fs.copyFileSync(file, path.join(tempDir, file));
});

// Copy other listed files
filesToCopy.forEach((file) => {
  if (fs.existsSync(file) && !file.includes("*")) {
    fs.copyFileSync(file, path.join(tempDir, file));
  }
});

// Function to obfuscate a single JS file
function obfuscateFile(srcPath, destPath) {
  try {
    const code = fs.readFileSync(srcPath, "utf8");
    // Try to obfuscate
    try {
      const obfuscatedCode = JavaScriptObfuscator.obfuscate(
        code,
        obfuscatorConfig
      ).getObfuscatedCode();
      fs.writeFileSync(destPath, obfuscatedCode);
      console.log(`Obfuscated: ${path.relative(__dirname, srcPath)}`);
    } catch (obfError) {
      console.log(
        `Using original file for: ${path.relative(__dirname, srcPath)}`
      );
      fs.writeFileSync(destPath, code);
    }
  } catch (error) {
    console.error(`Error processing ${srcPath}:`, error);
    // If error, ensure the original file is copied
    fs.copyFileSync(srcPath, destPath);
  }
}

// Function to copy directory with selective obfuscation
function processDirectory(srcDir, destDir) {
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  const entries = fs.readdirSync(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    // Skip certain directories and files
    if (
      entry.name === "node_modules" ||
      entry.name === "dist" ||
      entry.name === "dist2" ||
      entry.name === ".git" ||
      entry.name === "temp" ||
      entry.name === "obfuscate.js"
    ) {
      continue;
    }

    if (entry.isDirectory()) {
      processDirectory(srcPath, destPath);
    } else {
      if (entry.name.endsWith(".js")) {
        obfuscateFile(srcPath, destPath);
      } else {
        // Copy non-JS files directly
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
}

// Process main.js separately and copy it without obfuscation
console.log("Copying main.js without obfuscation");
fs.copyFileSync("main.js", path.join(tempDir, "main.js"));

// Process src directory
if (fs.existsSync("src")) {
  processDirectory("src", path.join(tempDir, "src"));
}

// Process root JS files except main.js
console.log("Processing root JS files");
fs.readdirSync(__dirname)
  .filter(
    (file) =>
      file.endsWith(".js") && file !== "main.js" && file !== "obfuscate.js"
  )
  .forEach((file) => {
    obfuscateFile(file, path.join(tempDir, file));
  });

console.log("Build files prepared in temp directory");
