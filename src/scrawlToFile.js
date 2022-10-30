/* eslint-disable no-unused-vars  */
const rfr = require('rfr');
// import { mkdtemp } from 'fs';
const fs = require('fs');

const {
  keyword,
  startPage,
  endPage,
  sort,
} = rfr('/src/config/config.js');

/* eslint-enable no-unused-vars  */

const {
  extractTorrentList, extractFiles, fetchBT4GRetry, sleepMS,
} = rfr('/src/util/index.js');

const SUCCEED = 'succeed';
// const keyword = 'bestie';
const dir = `./result/${keyword}`;
const RESULT_FILE = `${dir}/result.json`;
// const RESULT_FILE = `${dir}/result.html`;

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
// const allLinks = _.values(result).reduce((accumulate, item) => {
//  return accumulate.concat(item.links);
// }, []);
// const resultStr = allLinks.join('\n');
// await fs.writeFileSync(LINK_FILE, resultStr, {
//  encoding: 'utf8',
//  mode: 0o666,
//  // http://nodejs.cn/api/fs.html#fs_file_system_flags
//  flag: 'w+',
// });
//
/// / failed olny
// const failed = [];
// for (let key in result) {
//  const value = result[key];
//  if(value.status !== SUCCEED) {
//    failed.push(key);
//  }
// }
//
// await fs.writeFileSync(FAILED_FILE, failed.join('\n'), {
//  encoding: 'utf8',
//  mode: 0o666,
//  // http://nodejs.cn/api/fs.html#fs_file_system_flags
//  flag: 'w+',
// });
//
};

/**
 *
 * @param sortColumn: bysize; (empty) -> bytime; byseeders; byrelevance;
 */
const do1Index = async (searchTxt, sortColumn, pageIndex, result) => {
  let url = `https://bt4g.org/search/${searchTxt}`;
  if (sortColumn) {
    url += `/${sortColumn}`;
  }
  url += `/${pageIndex}`;

  // console.info(`url: ${url}`);
  result.pageIndex = pageIndex;
  result.status = 'failed';

  if (!result.torrents) { // fetch torrent basic info if not exist yet
    try {
      const htmlStr = await fetchBT4GRetry(url);
      const torrents = extractTorrentList(htmlStr);

      result.torrents = torrents;
    } catch (e) {
      // console.debug(`${url} not passed`);
      console.warn(`failed to fetch html for pageIndex: ${pageIndex}`);
      console.error(e);
      return result;
    }
  }

  try {
    const promises = result.torrents.filter(({ files }) => !files).map(async (torrent) => {
      const htmlStr = await fetchBT4GRetry(torrent.torrentDetailLink);
      const files = extractFiles(htmlStr);
      torrent.files = files;
      return torrent;
    });
    await Promise.all(promises);
  } catch (e) {
    console.warn(`failed to fetch files for pageIndex: ${pageIndex}`);
    console.error(e);
    return result;
  }

  result.status = SUCCEED;
  return result;
};

const doScrawl = async () => {
// const start = 1;
// const end = 50;
  // const result = {};
  const result = await readResult();
  for (let i = startPage; i < endPage; i++) {
    if (result[i] && result[i].status === SUCCEED) {
      console.info(`skip ${i}, for it's already done.`);
      continue;
    }
    const indexResult = result[i] || {};
    await do1Index(keyword, sort, i, indexResult);
    result[i] = indexResult;
    if (indexResult.status !== SUCCEED) {
      console.error('Run into error, will exit...');
      break;
    } else {
      await sleepMS(200);
    }
  }
  // console.info(`result: ${JSON.stringify(result)}`);
  console.info('done');
  await writeResult(result);
};

const importToDB = () => {

};

module.exports = {
  doScrawl,
};
