/* eslint-disable no-unused-vars  */
const rfr = require('rfr');
const { JSDOM } = require('jsdom');
const axios = require('axios');

const dbUtil = require('./src/util/dbUtil');
const dbAction = require('./src/db/dbAction');

const gedo = require('./src/gedo');
const jup = require('./src/jup');
const shima = require('./src/shima');
const scrawlToFile = require('./src/scrawlToFile');

const {
  keyword,
  startPage,
  endPage,
  sort,
} = rfr('/src/config/config.js');

/* eslint-enable no-unused-vars  */

/* the JSDOM useage demo
const { document } = new JSDOM(
  '<h2 class="title">Hello world</h2>',
).window;
const heading = document.querySelector('.title');
heading.textContent = 'Hello there!';
heading.classList.add('welcome');
*/

// console.info(heading.innerHTML);

// shima.scrawlGEDO();

const init = async () => dbUtil.init();

const main = async () => {
  await init();

  try {
    const resultJSONFile = await scrawlToFile.doScrawl();
    await dbAction.insertTorrentFrmFile(`${resultJSONFile}`);
    // await dbAction.insertTorrentFrmFile(`result/Uncensored-Leaked_byseeders/result.json`);
  } catch (e) {
    console.error('Error: in main try catch');
    console.error(e);
  }
};

main();
// magnet:?xt=urn:btih:
