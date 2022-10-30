// import { mkdtemp } from 'fs';
const fs = require('fs');
const _ = require('lodash');
const { JSDOM } = require('jsdom');
const axios = require('axios');

const { document } = new JSDOM(
  '<h2 class="title">Hello world</h2>',
).window;
const heading = document.querySelector('.title');
heading.textContent = 'Hello there!';
heading.classList.add('welcome');

// console.info(heading.innerHTML);

const MAX_LINK_PER_ID = 10;
const SUCCEED = 'succeed';

const doSleep = async (timeInMS) => new Promise((resolve) => {
  setTimeout(() => { resolve(); }, timeInMS);
});

const keyword = 'gedo';
const dir = `./result/${keyword}`;
const RESULT_FILE = `${dir}/result.json`;
const LINK_FILE = `${dir}/result.txt`;
const FAILED_FILE = `${dir}/failed.txt`;

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const readResult = async () => {
  let resultTxt = '{}';
  try {
    resultTxt = await fs.readFileSync(RESULT_FILE, {
      encoding: 'utf8',
      // http://nodejs.cn/api/fs.html#fs_file_system_flags
      flag: 'r+',
    });
  } catch (e) {
    console.info('no previous result exists, start a clean crawl');
  }

  const result = JSON.parse(resultTxt);
  return result;
};

const writeResult = async (result) => {
  // all
  await fs.writeFileSync(RESULT_FILE, JSON.stringify(result, null, 2), {
    encoding: 'utf8',
    mode: 0o666,
    // http://nodejs.cn/api/fs.html#fs_file_system_flags
    flag: 'w+',
  });

  // links only
  const allLinks = _.values(result).reduce((accumulate, item) => accumulate.concat(item.links), []);
  const resultStr = allLinks.join('\n');
  await fs.writeFileSync(LINK_FILE, resultStr, {
    encoding: 'utf8',
    mode: 0o666,
    // http://nodejs.cn/api/fs.html#fs_file_system_flags
    flag: 'w+',
  });

  // failed olny
  const failed = [];
  for (const key in result) {
    const value = result[key];
    if (value.status !== SUCCEED) {
      failed.push(key);
    }
  }

  await fs.writeFileSync(FAILED_FILE, failed.join('\n'), {
    encoding: 'utf8',
    mode: 0o666,
    // http://nodejs.cn/api/fs.html#fs_file_system_flags
    flag: 'w+',
  });
};
const doDOMURL = async (url, res) =>

// async function getForum() {
//  try {
//    const response = await axios.get(
//      'https://www.reddit.com/r/programming.json'
//    )
//    console.log(response)
//  } catch (error) {
//    console.error(error)
//  }
// }

  JSDOM.fromURL(url).then((dom) => {
    const retVal = [];
    const { document } = dom.window;
    const nodeList = document.querySelectorAll('div.col > div a');
    for (let i = 0; i < nodeList.length && i < MAX_LINK_PER_ID; i++) {
      const a = nodeList[i];
      const link = `magnet:?xt=urn:btih:${a.href.match(/(?<=\/magnet\/)[^\/]+$/g)[0]}`;
      retVal.push(link);
    }
    return retVal;
    // console.log(dom.serialize());
  }).catch((e) => {
    if (e.message.includes(404)) {
      // not found case
    } else {
      // other error, need to throw
      throw e;
    }
  });

const getSuffix = (i) => {
  const retVal = [];
  if (i < 10) {
    retVal.push(`0${i}`, `00${i}`, i);
  } else if (i < 100) {
    retVal.push(`0${i}`, i, `00${i}`);
  } else if (i < 1000) {
    retVal.push(`0${i}`, i, `00${i}`);
  } else {
    retVal.push(i);
  }
  return retVal;
};

const do1Index = async (i, result) => {
  const suffixes = getSuffix(i);
  for (j = 0; j < suffixes.length; j++) {
    const suffix = suffixes[j];
    const url = `https://bt4g.org/search/${keyword}${suffix}/bysize/1`;
    try {
      const links = await doDOMURL(url, result);
      if (links && links.length > 0) {
        result.links = links;
        result.status = SUCCEED;
        result.fetchedSuffix = suffix;
        console.info(`passed: ${url}`);
        return true;
      }
    } catch (e) {
      // console.debug(`${url} not passed`);
    }
    await doSleep(1000);
  }
  console.warn(`failed to find link for index: ${i}`);
  result.status = 'failed';
  result.fetchedSuffix = -1;
  return false;
};

const scrawlGEDO = async () => {
  const start = 19;
  const end = 200;
  // const result = {};
  const result = await readResult();
  for (i = start; i < end; i++) {
    if (result[i] && result[i].status === SUCCEED) {
      console.info(`skip ${i}, for it's already done.`);
      continue;
    }
    const indexResult = {};
    result[i] = indexResult;
    await do1Index(i, indexResult);
    await doSleep(1000);
  }
  console.info('done');
  await writeResult(result);
};

module.exports = {
  scrawlGEDO,
};
