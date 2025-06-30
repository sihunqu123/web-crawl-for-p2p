const fs = require('fs');

// 读取文件的函数
function readFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

// 写入文件的函数
function writeFile(filePath, content) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, content, 'utf8', (err) => {
      if (err) {
        reject(err);
      } else {
        console.log(`File written successfully: ${filePath}`);
        resolve();
      }
    });
  });
}

module.exports = {
  readFile,
  writeFile
};
