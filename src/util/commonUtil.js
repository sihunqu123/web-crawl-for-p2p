const rfr = require('rfr');

const fetch = require('node-fetch');
const crypto = require('crypto');

const { cookie, maxRetrytimes } = rfr('/src/config/config.js');

const sleepMS = (timeInMS) => new Promise((resolve) => {
  setTimeout(() => {
    resolve();
  }, timeInMS);
});

const fetchBT4G = async (url) => {
  console.info(`fetch url: ${url}`);
  const response = await fetch(url, {
    headers: {
      authority: 'bt4g.org',
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
      'accept-language': 'en-US,en;q=0.9,zh;q=0.8,zh-CN;q=0.7,zh-TW;q=0.6',
      cookie,
      'sec-ch-ua': '"Chromium";v="106", "Google Chrome";v="106", "Not;A=Brand";v="99"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'document',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-site': 'none',
      'sec-fetch-user': '?1',
      'upgrade-insecure-requests': '1',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36',
    },
  });
  if (response.status !== 200) { console.error(response.text()); throw Error(`fetch failed: url: ${url}, statusCode: ${response.status}`); }
  const body = await response.text();
  return body;
};

const fetchBT4GRetry = async (url) => {
  let currentRetryTime = 0;
  let error = null;
  while (currentRetryTime++ < maxRetrytimes) {
    try {
      const retVal = await fetchBT4G(url);
      return retVal;
    } catch (e) {
      error = e;
    }
  }
  throw error;
};

const generateNaoid = () => crypto.randomUUID().replaceAll('-', '');
// const CHARSET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_';
// return customAlphabet(CHARSET, length)();

module.exports = {
  sleepMS,
  fetchBT4G,
  fetchBT4GRetry,
  generateNaoid,
};
