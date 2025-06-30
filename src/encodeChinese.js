const { readFile, writeFile } = require('./util/fileUtils');
const path = require('path');

// 检查字符串是否包含中文字符
function containsChinese(str) {
    const reg = /[\u4e00-\u9fa5]/;
    return reg.test(str);
}

async function main() {
    const inputFilePath = 'd:\\book\\all_8k_uniq.txt'; // 输入文件的路径
    const outputFilePath = 'd:\\book\\all_8k_uniq_encoded.txt'; // 输出文件的路径
    try {
        const content = await readFile(inputFilePath);
        let lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            if (containsChinese(lines[i])) {
                lines[i] = encodeURI(lines[i]);
            }
        }
        const newContent = lines.join('\n');
        await writeFile(outputFilePath, newContent);
        console.log('文件处理完成，结果保存在 ' + outputFilePath);
    } catch (err) {
        console.error('出现错误: ', err);
    }
}

main();
