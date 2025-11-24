// File: generate_codebase.js
// Purpose: Consolidates the project structure into a single text file.
const fs = require("fs");
const path = require("path");

// --- Configuration ---
const ROOT_DIRS = 
[
  // "frontend",
  // "backend",
  "hotel-reservation"
];
const OUTPUT_FILE = "codebase.txt";
const IGNORE_PATTERNS = [
  "node_modules",
  ".angular",
  ".git",
  ".vscode",
  "dist",
  'venv',
  "coverage",
  "capacitor-android",
  "capacitor-ios",
  "README.md",
  ".env",
  "package-lock.json",
  OUTPUT_FILE, // Ignore the output file itself
  "reconstruct_from_codebase.js", // Ignore the other script
  "generate_codebase.js", // Ignore this script itself
  ".DS_Store", // macOS specific ignore
  "pglite-debug.log", // Specific log file
  "firebase_sa.b64", // Firebase service account file
  "service-account.json", // Firebase service account file
];
const INCLUDE_EXTENSIONS = [
  ".ts",
  '.js',
  '.jsx', // Added for React components
  '.html', '.css', '.scss', 
  '.json', 
  '.prisma',
   '.md' ,
  '.less',
  '.py', // Added for Python backend
  '.txt', // Added for text files like she3bo-notes.txt
];

// --- Main Logic ---
const outputStream = fs.createWriteStream(OUTPUT_FILE);
let fileCount = 0;

const headerSeparator =
  "// =================================================================================\n";

function shouldIgnore(filePath) {
  return IGNORE_PATTERNS.some((pattern) =>
    filePath.includes(path.normalize(pattern))
  );
}

function processFile(filePath) {
  if (
    shouldIgnore(filePath) ||
    !INCLUDE_EXTENSIONS.includes(path.extname(filePath))
  ) {
    return;
  }

  try {
    const relativePath = path
      .relative(process.cwd(), filePath)
      .replace(/\\/g, "/");
    const fileContent = fs.readFileSync(filePath, "utf-8");

    const fileHeader = `${headerSeparator}// File: ${relativePath}\n${headerSeparator}\n\n`;

    outputStream.write(fileHeader);
    outputStream.write(fileContent);
    outputStream.write("\n\n");

    console.log(`[OK] Appended: ${relativePath}`);
    fileCount++;
  } catch (error) {
    console.error(`[FAIL] Could not read file: ${filePath}`, error);
  }
}

function walkDir(dir) {
  if (shouldIgnore(dir)) {
    return;
  }

  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else {
      processFile(fullPath);
    }
  }
}

console.log("--- Codebase Consolidator ---");
console.log(`Ignoring patterns: ${IGNORE_PATTERNS.join(", ")}`);
console.log("Starting consolidation...");

// Clear output file if it exists
fs.writeFileSync(OUTPUT_FILE, "");

ROOT_DIRS.forEach((dir) => {
  if (fs.existsSync(dir)) {
    walkDir(dir);
  } else {
    console.warn(`[WARN] Directory not found, skipping: ${dir}`);
  }
});

outputStream.end();

console.log("--- Consolidation Complete ---");
console.log(
  `✅ Successfully processed ${fileCount} files into ${OUTPUT_FILE}.`
);
