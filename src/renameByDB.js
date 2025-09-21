const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const readline = require("readline");

// === CONFIGURATION ===
const isDryRun = false; // Set to false to enable rename after confirmation
const dbPath = path.resolve("T:/book/gonow.db"); // Adjust as needed
const tableName = "meta8k";
const videoDir = path.resolve("d:/"); // Folder containing videos, adjust as needed

// Helper to prompt user in terminal
function promptUser(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// Helper to sanitize file names for Windows
function sanitizeFileName(name) {
  // Forbidden chars: \\ / : * ? " < > | and control chars (0-31)
  return name.replace(/[\\/:*?"<>|\x00-\x1F]/g, '_');
}

async function main() {
  // 1. Open DB
  const db = new sqlite3.Database(dbPath);
  // 2. Read all video files in videoDir (no subfolders)
  const files = fs
    .readdirSync(videoDir)
    .filter((f) => {
        try {
            const isFile = fs.statSync(path.join(videoDir, f)).isFile();
            return isFile;
        } catch (error) {
            console.error(`Error accessing file ${f}:`, error);
            return false;
        }
    }).map(f => f.trim().replace(/\.[^/.]+$/, (ext) => ext.toLowerCase())); // Normalize extension to lowercase);
  // 3. Query all meta8k records into a map by fieldName
  const dbRecords = await new Promise((resolve, reject) => {
    db.all(
      `SELECT fileName, contentName, category FROM ${tableName}`,
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
  const metaMap = new Map();
  dbRecords.forEach((row) => {
    metaMap.set(row.fileName, row);
  });

  // 4. Prepare rename actions
  const renameActions = [];
  files.forEach((file) => {
    const record = metaMap.get(file);
    if (record) {
      let newName = `${record.category}_${record.contentName}_${record.fileName}`;
      newName = sanitizeFileName(newName);
      console.log(`Match: ${file} => ${newName} -   DB Record: fileName=${record.fileName}, contentName=${record.contentName}, category=${record.category}`);
      console.log("");
      renameActions.push({
        oldPath: path.join(videoDir, file),
        newPath: path.join(videoDir, newName),
        oldName: file,
        newName,
      });
    } else {
      console.log(`No match for file: ${file}`);
    }
  });

  if (renameActions.length === 0) {
    console.log("No files to rename.");
    db.close();
    return;
  }

  if (isDryRun) {
    console.log("\nDry run enabled. No files will be renamed.");
    db.close();
    return;
  }

  // Prompt user for confirmation
  const answer = await promptUser("\nProceed with renaming? (y/N): ");
  if (answer.toLowerCase() !== "y") {
    console.log("Aborted by user.");
    db.close();
    return;
  }

  // 5. Commit rename actions
  for (const action of renameActions) {
    try {
      fs.renameSync(action.oldPath, action.newPath);
      console.log(`Renamed: ${action.oldName} => ${action.newName}`);
    } catch (err) {
      console.error(`Failed to rename ${action.oldName}:`, err);
    }
  }
  db.close();
  console.log("All renames complete.");
}

main().catch((err) => {
  console.error("Error:", err);
});
