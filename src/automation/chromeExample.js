const rfr = require('rfr');
const fs = require('fs');
const path = require('path');
const webdriver = require('selenium-webdriver');
const {
  Builder, Browser, By, Key, until, Capabilities,
} = require('selenium-webdriver');
const proxy = require('selenium-webdriver/proxy');

const { sleepMS } = rfr('/src/util/commonUtil.js');

const proxyAddress = '192.168.10.251:10889';
const socketProxyAddress = '192.168.10.251:10888';

const chrome = require('selenium-webdriver/chrome');

// Setting the proxy-server option is needed to info chrome to use proxy
const option = new chrome.Options().addArguments(`--proxy-server=http://${proxyAddress}`);

(async function example() {
  const driver = await new Builder().forBrowser(Browser.CHROME)
    .setChromeOptions(option)
    .build();

  try {
    await driver.get('https://www.google.com/ncr');
    // await driver.get('https://bt4g.org/search/uncen/1');
    await sleepMS(200000000);
    //  await driver.get('https://www.baidu.com');
  } catch (error) {
    console.error('failed with error');
    console.error(error);
  } finally {
    await driver.quit();
  }
}());
