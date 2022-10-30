// Common variable begin
const stringToMB = (str) => {
  const num = Number.parseFloat(`${str.match(/^\d+\.?\d+/g)}`, 10);
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
    default:
      console.warning('no unit matched - str: ${str}');
      break;
  }
  return retVal;
};

const extractFileInfo = (liDom) => {
  const fileName = liDom.childNodes[0].textContent.replaceAll('\n', '').trim();
  const fileSize = liDom.querySelector(':scope > span').innerText;
  const fileSizeInMB = stringToMB(fileSize);
  return {
    fileName,
    fileSize,
    fileSizeInMB,
  };
};

const MAGNET_PREFIX = 'magnet:?xt=urn:btih:';
// Common variable end

const fileLIs = document.querySelectorAll('main > .container > .row:nth-of-type(2) > .col.s12 > table:nth-of-type(5) li');
const files = fileLIs.map((fileItem) => extractFileInfo(fileItem));
console.info(JSON.stringify(files, null, 2));
