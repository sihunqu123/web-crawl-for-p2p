const webdriver = require('selenium-webdriver');
const {
  Builder, Browser, By, Key, until, Capabilities,
} = require('selenium-webdriver');
const firefox = require('selenium-webdriver/firefox');
const proxy = require('selenium-webdriver/proxy');

const proxyAddress = '192.168.10.251:10889';
const socketProxyAddress = '192.168.10.251:10888';

const mitmProxy = { proxyType: 'manual', httpProxy: proxyAddress, sslProxy: proxyAddress };
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
    await driver.get('https://www.google.com/ncr');
    await driver.findElement(By.name('q')).sendKeys('webdriver', Key.RETURN);
    await driver.wait(until.titleIs('webdriver - Google Search'), 1000);
    //  await driver.get('https://www.baidu.com');
  } finally {
    await driver.quit();
  }
}());
