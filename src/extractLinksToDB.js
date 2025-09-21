const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { readFile } = require('./util/fileUtils');

// === CONFIGURATION ===
// const parentDir = 'T:/book/bak'; // Change if needed
// const parentDir = 'T:/book/20250622'; // Change if needed
// const parentDir = 'T:/book/20250824'; // Change if needed
const parentDir = 'T:/book/test'; // Change if needed


// const parentDir = 'T:/book/test';
const dbPath = path.join(parentDir, '../gonow.db');
const sqliteTableName = 'meta8k';
// const inputFilePath = path.join(parentDir, 'SNH_Meta.log');
const inputDir = parentDir; // Change if you want a different directory
// const inputDir = 'T:/book/test'; // Change if you want a different directory

// Check if a string contains Chinese characters
function containsChinese(str) {
  const reg = /[\u4e00-\u9fa5]/;
  return reg.test(str);
}

/**
 * Extract contentName from a log line.
 * Example line containing contentName:
 * --fetch start filmId: 123518, columnId: 2480, name: undefined, undefined, contentName: 250104 X队 杨冰怡《SuperTATA》生日公演 三机位 i: 13
 * @param {string} line
 * @returns {string}
 */
const exractContentName = (line = "") => {
  const matchResult = line.match(/(?<=contentName: )[^\n]+(?=i: )/);
  if (matchResult && matchResult.length > 0) {
    const contentName = matchResult[0].trim();
    console.log("extracted contentName:", contentName);
    return contentName;
  }
  return "";
};

/**
 * Extract the link from a log line.
 * Example line containing the link:
 * ------fetched videosURL in - columnId: 2481, filmId: 123518, columnTag: 20241227222657, contentNumber: 29974930, name: GNZ48 - http://ucdn.letinvr.com/gnzlive/2025-1yue/8k/250111Zscam.MP4
 * @param {string} line
 * @returns {string}
 */
const extractLink = (line = "") => {
  // Example: ... http://ucdn.letinvr.com/...
  const matchResult = line.match(/(?<= )http:\/\/[\w]+\.letinvr\.com\/[^\n]+/);
  if (matchResult && matchResult.length > 0) {
    const link = matchResult[0].trim();
    console.log("extracted link:", link);
    return link;
  }
  return "";
};

/**
 * Check if a link is an 8K video link.
 * @param {string} link
 * @returns {boolean}
 */
const isLink8K = (link) => {
  if(/\/8k\//i.test(link)
    || /8k/i.test(link)
    // if it does NOT contain 2k or 4k, we also consider it as 8k
    || !/(2|4)k/i.test(link)
  ) {
    return true;
  }
  return false;
  
};

/**
 * Ensure the duplicates table exists.
 */
async function ensureDuplicatesTable(db, tableName) {
  // First, create the table
  await new Promise((resolve, reject) => {
    db.run(`CREATE TABLE IF NOT EXISTS ${tableName} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fileName TEXT,
      contentName TEXT,
      link TEXT,
      category TEXT,
      createdDate TIMESTAMP,
      lastModified TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) reject(err); else resolve();
    });
  });
  // Then, create the trigger
  await new Promise((resolve, reject) => {
    db.run(`CREATE TRIGGER IF NOT EXISTS trg_update_lastModified_${tableName}
      AFTER UPDATE ON ${tableName}
      FOR EACH ROW
      BEGIN
        UPDATE ${tableName} SET lastModified = CURRENT_TIMESTAMP WHERE id = OLD.id;
      END;`, (err) => {
      if (err) reject(err); else resolve();
    });
  });
}

/**
 * Insert a row into the duplicates table.
 */
function insertDuplicateAsync(db, tableName, fileName, contentName, link, category, createdDate) {
  return new Promise((resolve) => {
    db.run(
      `INSERT INTO ${tableName} (fileName, contentName, link, category, createdDate) VALUES (?, ?, ?, ?, ?)`,
      [fileName, contentName, link, category, createdDate],
      function(err) {
        if (err) {
          console.error('Failed to insert into duplicates table:', err);
        }
        resolve();
      }
    );
  });
}

/**
 * Promisified version of stmt.run for sequential inserts.
 * Now accepts a failureLogs array to collect errors.
 */
function runInsertAsync(stmt, fileName, contentName, link, category, failureLogs, db, duplicatesTable) {
  return new Promise((resolve) => {
    const createdDate = new Date().toISOString();
    stmt.run(fileName, contentName, link, category, createdDate, async function(err) {
      if (err) {
        if (err.code === 'SQLITE_CONSTRAINT') {
          const failMsg = {
            fileName,
            contentName,
            link,
            category,
            createdDate,
            error: err.message
          };
          failureLogs.push(failMsg);
          // Also insert into duplicates table
          // await insertDuplicateAsync(db, duplicatesTable, fileName, contentName, link, category, createdDate);
        } else {
          failureLogs.push({ fileName, contentName, link, category, createdDate, error: err.message });
        }
      }
      resolve();
    });
  });
}

/**
 * Process a single log file and insert 8K meta info into the database.
 * Now accepts a failureLogs array to collect errors.
 */
async function processLogFile(filePath, db, tableName, failureLogs, duplicatesTable, fileIdx, totalFiles, reportProgress) {
  let currentContentName = "";
  let inputContent;
  try {
    inputContent = await readFile(filePath);
  } catch (err) {
    console.error('Failed to read input file:', filePath, err);
    return;
  }
  const inputLines = inputContent.split("\n");
  const stmt = db.prepare(`INSERT INTO ${tableName} (fileName, contentName, link, category, createdDate) VALUES (?, ?, ?, ?, ?)`);
  // Use file name without extension for category
  const category = path.basename(filePath, path.extname(filePath));
  let linesHandled = 0;
  let lastReportTime = Date.now();
  for (let i = 0; i < inputLines.length; i++) {
    const lineRaw = inputLines[i];
    const line = (lineRaw + "").trim();
    // Update the current contentName if it is not empty
    const contentName = exractContentName(line);
    if (contentName) {
      currentContentName = contentName;
      console.log("Updated currentContentName:", currentContentName);
    }
    // Then try to extract the link
    const link = extractLink(line);
    if (link) {
      // If the link is not empty, check if it is 8K and insert
      if (isLink8K(link)) {
        let fileName = link.split("/").pop();
        if(fileName.indexOf('%') >= 0) {
          const encodedFileName = fileName;
          fileName = decodeURIComponent(encodedFileName);
          console.warn(`=====Encoded Chinese filename with % char: ${encodedFileName}, decoded to: ${fileName}`);
        }
        // the fileName's extension may be uppercased, so we normalize it to lowercase
        fileName = fileName.replace(/\.[^/.]+$/, (ext) => ext.toLowerCase());
        await runInsertAsync(stmt, fileName, currentContentName, link, category, failureLogs, db, duplicatesTable);
      } else {
        console.info(`=====Ignore 2k-4k link: ${link}`);
      }
    }
    linesHandled++;
    // Report every 10s
    if (Date.now() - lastReportTime >= 10000) {
      lastReportTime = Date.now();
      const percent = Math.floor((linesHandled / inputLines.length) * 100);
      reportProgress(fileIdx, totalFiles, linesHandled, inputLines.length, percent);
    }
  }
  // Final report for this file
  reportProgress(fileIdx, totalFiles, linesHandled, inputLines.length, 100);
  stmt.finalize();
}

async function closeDbAsync(db) {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

async function main() {
  // Use path.resolve to ensure absolute path on Windows
  // All config is now at the top
  const db = new sqlite3.Database(dbPath);
  await new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`CREATE TABLE IF NOT EXISTS ${sqliteTableName} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fileName TEXT,
        contentName TEXT,
        link TEXT UNIQUE,
        category TEXT,
        createdDate TIMESTAMP,
        lastModified TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (err) reject(err); else resolve();
      });
      // Create trigger for auto-updating lastModified
      db.run(`CREATE TRIGGER IF NOT EXISTS trg_update_lastModified_${sqliteTableName}
        AFTER UPDATE ON ${sqliteTableName}
        FOR EACH ROW
        BEGIN
          UPDATE ${sqliteTableName} SET lastModified = CURRENT_TIMESTAMP WHERE id = OLD.id;
        END;`);
    });
  });

  const failureLogs = [];
  const duplicatesTable = 'meta8k_duplicates';
  await ensureDuplicatesTable(db, duplicatesTable);

  // If you want to process a single file:
  // await processLogFile(inputFilePath, db, sqliteTableName);

  // If you want to process all .log files in a directory:
  const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.log'));
  const totalFiles = files.length;
  function reportProgress(fileIdx, totalFiles, linesHandled, totalLines, percent) {
    console.log(`===========================Overall process: ${fileIdx + 1}/${totalFiles} files, ${percent}% lines handled in the number ${fileIdx + 1} file.`);
  }
  for (let fileIdx = 0; fileIdx < files.length; fileIdx++) {
    const file = files[fileIdx];
    const absPath = path.join(inputDir, file);
    console.log(`Processing file: ${absPath}`);
    await processLogFile(absPath, db, sqliteTableName, failureLogs, duplicatesTable, fileIdx, totalFiles, reportProgress);
  }
  await closeDbAsync(db);
  console.log('Inserted all 8K meta data from all .log files into meta8k table.');
  if (failureLogs.length > 0) {
    console.log('\n=== Summary of Insert Failures ===');
    failureLogs.forEach((fail, idx) => {
      console.log(`Failure #${idx + 1}:`, fail);
    });
    console.log('=== End of Insert Failures ===\n');
  } else {
    console.log('No insert failures encountered.');
  }
}

main();
