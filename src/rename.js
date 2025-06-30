const fs = require('fs');
const path = require('path');

// === CONFIGURATION ===
// Path to the folder containing the files to rename
const targetFolder = 'T:/book/20252206/8kfiles'; // <-- Change this to your folder
// Path to the JSON mapping file
const mappingPath = path.join('T:/book/20252206', 'fileNameToContentName_8k.json');
// Dry run mode: if true, only print planned renames, do not actually rename files
const DRY_RUN = true; // Set to false to actually rename

// === MAIN LOGIC ===
function sanitizeFileName(name) {
  // Remove or replace characters not allowed in Windows filenames
  return name.replace(/[\\/:*?"<>|]/g, '_').trim();
}

function main() {
  if (!fs.existsSync(mappingPath)) {
    console.error('Mapping file not found:', mappingPath);
    process.exit(1);
  }
  const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
  const files = fs.readdirSync(targetFolder);

  files.forEach((file) => {
    if (mapping[file]) {
      const ext = path.extname(file);
      const newName = sanitizeFileName(mapping[file]) + ext;
      const oldPath = path.join(targetFolder, file);
      const newPath = path.join(targetFolder, newName);
      if (oldPath !== newPath) {
        if (fs.existsSync(newPath)) {
          console.warn(`[DRY RUN] Target file already exists, skipping: ${newName}`);
        } else {
          if (DRY_RUN) {
            console.log(`[DRY RUN] Would rename:`);
            console.log(`  Old: ${file}`);
            console.log(`  New: ${newName}`);
          } else {
            fs.renameSync(oldPath, newPath);
            console.log(`Renamed file:`);
            console.log(`  Old: ${file}`);
            console.log(`  New: ${newName}`);
          }
        }
      }
    }
  });
}

main();
