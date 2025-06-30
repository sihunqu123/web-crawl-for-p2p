const fs = require('fs');
const path = require('path');

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
                resolve();
            }
        });
    });
}

// 检查字符串是否包含中文字符
function containsChinese(str) {
    const reg = /[\u4e00-\u9fa5]/;
    return reg.test(str);
}



async function main() {
    const inputFilePath = 'T:\\p\\left_old.txt'; // 输入文件的路径
    const doneFilePath = 'T:\\p\\fileList2.txt'; // 输入文件的路径
    const outputFilePath = 'T:\\p\\left.txt'; // 输出文件的路径
//  const inputFilePath = '/t/p/all_8k_uniq_encoded.txt'; // 输入文件的路径
//  const doneFilePath = '/t/book/fileList.txt'; // 输入文件的路径
//  const outputFilePath = '/t/p/left.txt'; // 输出文件的路径
    
    try {
        const inputContent = await readFile(inputFilePath);
        let inputLines = inputContent.split('\n');
        const content = await readFile(doneFilePath);
        let lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          const lineRaw = lines[i];
          const line = (lineRaw + '').trim();
          let encodedLine = line;
          if(encodedLine) {
            if (containsChinese(lines[i])) {
                encodedLine = encodeURI(line);
            }
            const matchStr = `/${encodedLine}`;
            // only keep not downlaoded items
            inputLines = inputLines.filter((lineStr) => {
              const isMissing = lineStr.indexOf(matchStr) === -1;
              return isMissing;
            });
          }
        }


        const newContent = inputLines.join('\n');
        await writeFile(outputFilePath, newContent);
        console.log('文件处理完成，结果保存在 ' + outputFilePath);
    } catch (err) {
        console.error('出现错误: ', err);
    }
}

main();
