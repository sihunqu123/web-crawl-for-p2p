const { JSDOM } = require('jsdom');

const htmlStrToDocument = (str) => {
    const dom = new JSDOM(str);
    const { window: window_ } = dom;
    const { document: document_ } = window_;

    return document_;
};

// const dom = new JSDOM(`<!DOCTYPE html><p>Hello world</p>`);
// console.log(dom.window.document.querySelector("p").textContent); // "Hello world"

// Common variable begin
const stringToMB = (str) => {
  if(str === '0' || str === '0.0') {
    return 0;
  }
  const num = Number.parseFloat(`${str.match(/^\d+\.?\d*/g)}`, 10);
  const unit = (`${str.match(/[a-z]+$/gi)}`).toUpperCase();
  let retVal = 0;

  switch (unit) {
    case 'TB':
      retVal = num * 1024 * 1024;
      break;
    case 'GB':
      retVal = num * 1024;
      break;
    case 'MB':
      retVal = num;
      break;
    case 'KB':
      retVal = num / 1024;
      break;
    case 'NULL': // unit is omitted when it's byte
    case 'B':
      retVal = num / (1024 * 1024);
      break;
    default:
      console.warn(`no unit matched - str: ${str}`);
      break;
  }
  return retVal;
};

const innerText = (ele) => (ele.innerText || ele.textContent).trim();

const extractFileInfo = (liDom) => {
  const fileName = liDom.childNodes[0].textContent.replaceAll('\n', '').trim();
  const matchResult = fileName.match(/\.[^.]+$/);
  const extension = matchResult ? matchResult[0] : '';
  const fileSize = innerText(liDom.querySelector(':scope > span'));
  const fileSizeInMB = stringToMB(fileSize);
  return {
    fileName,
    extension,
    fileSize,
    fileSizeInMB,
  };
};

const MAGNET_PREFIX = 'magnet:?xt=urn:btih:'; // eslint-disable-line no-unused-vars
// Common variable end

const extractTorrentInfo = (ele) => {
  const torrentName = innerText(ele.querySelector('h5:nth-child(1)'));
  const torrentHref = ele.querySelector('h5:nth-child(1) > a').href.match(/(?<=\/magnet\/)[^/]+$/g)[0];
  const torrentDetailLink = `https://bt4g.org/magnet/${torrentHref}`;
  const torrentType = innerText(ele.querySelector(':scope > span:nth-of-type(1)'));

  const torrentCreateTime = innerText(ele.querySelector(':scope > span:nth-of-type(2) > b'));
  const torrentFileCnt = innerText(ele.querySelector(':scope > span:nth-of-type(3) > b'));
  const torrentSize = innerText(ele.querySelector(':scope > span:nth-of-type(4) > b'));
  const torrentSeeders = innerText(ele.querySelector(':scope > span:nth-of-type(5) > b'));
  const torrentLeechers = innerText(ele.querySelector(':scope > span:nth-of-type(6) > b'));

  const fileLIs = Array.from(ele.querySelectorAll(':scope > ul > li'));

  const filesPartial = fileLIs.map((fileItem) => extractFileInfo(fileItem));

  let torrentTypeInt = 0;

  switch (torrentType.toUpperCase()) {
    case 'VIDEO':
      torrentTypeInt = 0;
      break;
    case 'AUDIO':
      torrentTypeInt = 1;
      break;
    case 'ARCHIVE FILE':
      torrentTypeInt = 2;
      break;
    case 'APPLICATION':
      torrentTypeInt = 3;
      break;
    case 'OTHER':
      torrentTypeInt = 5;
      break;
    case 'DOC':
      torrentTypeInt = 6;
      break;
    default:
      torrentTypeInt = 5;
      console.warn(`no torrentType matched - torrentType: ${torrentType}`);
      break;
  }
  const torrentSizeInMB = stringToMB(torrentSize);

  return {
    torrentName,
    torrentHref,
    torrentDetailLink,
    torrentType,
    torrentTypeInt,
    torrentCreateTime,
    torrentFileCnt,
    torrentSize,
    torrentSizeInMB,
    torrentSeeders,
    torrentLeechers,
    filesPartial,
  };
};

const extractTorrentList = (htmlStr) => {
  const document_ = htmlStrToDocument(htmlStr);

  const allItems = Array.from(document_.querySelectorAll('main > .container > .row:nth-of-type(3) > .col.s12 > div:nth-of-type(n+2)'));

  const resultTorrents = allItems.map(extractTorrentInfo);
  // console.info(JSON.stringify(resultTorrents, null, 2));
  // console.info(resultTorrents.join('\n'));
  return resultTorrents;
};

const extractExtraTorrentInfo = (htmlStr) => {
  const document_ = htmlStrToDocument(htmlStr);

  const fileLIs = Array.from(document_.querySelectorAll('main > .container > .row:nth-of-type(2) > .col.s12 > table:nth-of-type(5) li'));
  const files = fileLIs.map((fileItem) => extractFileInfo(fileItem));
  // console.info(JSON.stringify(files, null, 2));
  return {
    files,
  };
};

module.exports = {
  extractTorrentList,
  extractExtraTorrentInfo,
};
