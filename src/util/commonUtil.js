const rfr = require('rfr');

const fetch = require('node-fetch');
const HttpsProxyAgent = require('https-proxy-agent');

const proxyAgent = new HttpsProxyAgent('http://192.168.10.251:10889');
const crypto = require('crypto');

const { cookie, maxRetrytimes } = rfr('/src/config/config.js');

const sleepMS = (timeInMS) => new Promise((resolve) => {
  setTimeout(() => {
    resolve();
  }, timeInMS);
});

function randomIntFromInterval(min, max) { // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}

// randomIntFromInterval(1, 6)

const fetchBT4GRetry = async (url, timesToRetry = 3) => {
  let res = null;
  let body = null;
  try {
    console.info(`fetch url: ${url}`);
    res = await fetch(url, {
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
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36',
      },
      agent: proxyAgent,
    });
    const statusCode = res.status;
    if (statusCode === 200) {
      body = await res.text();
    } else if (statusCode === 404) {
      body = `fetch url failed - statusCode: 404, url: ${url}`;
      console.debug(body);
    } else {
      --timesToRetry;
      if (timesToRetry >= 0) {
        if (statusCode === 401 || statusCode === 403) { // refresh page
          console.warn('session expired, try to refresh token with iframe');
          await sleepMS(randomIntFromInterval(1000, 5000));
          // TODO: how to refresh in nodejs?
          // await refershToken(url);
          return fetchBT4GRetry(url, timesToRetry);
        }
        console.warn(`unexpected statusCode: ${res.status} when accessing: ${url}`);
        await sleepMS(randomIntFromInterval(1000, 5000));
        return fetchBT4GRetry(url, timesToRetry);
      }

      body = `Retry exceed for url: ${url} with statusCode: ${statusCode}`;
      console.error(body);
    }

    return {
      statusCode,
      body,
    };
  } catch (e) {
    console.info(e);
    throw e;
  }
};

const generateNaoid = () => crypto.randomUUID().replaceAll('-', '');
// const CHARSET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_';
// return customAlphabet(CHARSET, length)();

module.exports = {
  sleepMS,
  fetchBT4GRetry,
  generateNaoid,
};
