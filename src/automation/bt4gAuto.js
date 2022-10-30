const rfr = require('rfr');
const fs = require('fs');
const path = require('path');
const webdriver = require('selenium-webdriver');
const {
  Builder, Browser, By, Key, until, Capabilities,
} = require('selenium-webdriver');
const firefox = require('selenium-webdriver/firefox');
const proxy = require('selenium-webdriver/proxy');

const { sleepMS } = rfr('/src/util/commonUtil.js');
// const { extractTorrentList, } = rfr('/src/automation/script/extractTorrentList.js');

const extractTorrentList = fs.readFileSync(path.resolve(__dirname, './script/extractTorrentList.js'), {
  encoding: 'utf8',
  // http://nodejs.cn/api/fs.html#fs_file_system_flags
  flag: 'r+',
});

const proxyAddress = '192.168.10.251:10889';
const socketProxyAddress = '192.168.10.251:10888';

const mitmProxy = {
  proxyType: 'manual', httpProxy: proxyAddress, socks: socketProxyAddress, socksVersion: 5, sslProxy: proxyAddress,
};
const firefoxOptions = new firefox.Options();
firefoxOptions.setProxy(mitmProxy);

(async function example() {
  const driver = await new Builder().forBrowser(Browser.FIREFOX)
    // .setFirefoxOptions(option)
    .setFirefoxOptions(firefoxOptions)
    // .withCapabilities(webdriver.Capabilities.firefox())
  //  .withCapabilities(new Capabilities().setProxy(proxy.socks(socketProxyAddress)))
  // proxy.socks('localhost:1234')
  //  .usingServer('http://192.168.10.251:10889')
  //  .setProxy(proxy.manual({http: proxyAddress}))
    .build();

  try {
    await driver.get('https://bt4g.org/search/uncen/1');
    // await driver.get('https://www.google.com/ncr');
    let returnVal = await driver.executeScript(
      'var a = 1; return a;',
    );
    console.info(`returnVal: ${returnVal}`);

    returnVal = await driver.executeScript(
      `var a = 2;
        return new Promise((resolve) => {
          return setTimeout(() => {
            return  resolve(a);
          }, 500);
        });`,
    );
    console.info(`returnVal2: ${returnVal}`);

    await sleepMS(20000);
    try {
      returnVal = await driver.executeScript(
        extractTorrentList,
      );
      console.info(`returnVal3: ${returnVal}`);
    } catch (e) {
      console.error('execute failed');
      console.error(e);
    }
    // await driver.wait(until.titleIs('aaaaaaaaaa'), 5000);
    await sleepMS(5000);
  } catch (error) {
    console.error('failed with error');
    console.error(error);
  } finally {
    await driver.quit();
  }
}());
